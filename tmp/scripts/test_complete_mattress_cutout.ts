import * as THREE from 'three';
import { InternalBoxItem, InternalGridConfig } from '../../src/types';
import { getUpperCabinetExclusionZones } from '../../src/three/boxes/BoxGeometryHelpers';

interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface CushionMeshResult {
  mesh: THREE.Mesh;
  isCutout: boolean;
  labelSuffix: string;
  actualMinX: number;
  actualMaxX: number;
  actualMinZ: number;
  actualMaxZ: number;
}

function createCushionMesh(
  c: Rect,
  cutoutZones: Rect[],
  thickness: number,
  yPos: number,
  material: THREE.Material
): CushionMeshResult | null {
  let activeCut: Rect | null = null;
  for (const zone of cutoutZones) {
    const oMinX = Math.max(c.minX, zone.minX);
    const oMaxX = Math.min(c.maxX, zone.maxX);
    const oMinZ = Math.max(c.minZ, zone.minZ);
    const oMaxZ = Math.min(c.maxZ, zone.maxZ);
    if (oMaxX > oMinX + 0.005 && oMaxZ > oMinZ + 0.005) {
      activeCut = { minX: oMinX, maxX: oMaxX, minZ: oMinZ, maxZ: oMaxZ };
      break;
    }
  }

  const w = c.maxX - c.minX;
  const l = c.maxZ - c.minZ;
  const cCenterX = (c.minX + c.maxX) / 2;
  const cCenterZ = (c.minZ + c.maxZ) / 2;

  if (!activeCut) {
    const geo = new THREE.BoxGeometry(w, thickness, l);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(cCenterX, yPos, cCenterZ);
    return {
      mesh,
      isCutout: false,
      labelSuffix: '',
      actualMinX: c.minX,
      actualMaxX: c.maxX,
      actualMinZ: c.minZ,
      actualMaxZ: c.maxZ
    };
  }

  const touchesMinX = activeCut.minX <= c.minX + 0.01;
  const touchesMaxX = activeCut.maxX >= c.maxX - 0.01;
  const touchesMinZ = activeCut.minZ <= c.minZ + 0.01;
  const touchesMaxZ = activeCut.maxZ >= c.maxZ - 0.01;

  if (touchesMinX && touchesMaxX && touchesMinZ && touchesMaxZ) {
    return null;
  }

  // Case 1: Full width cut
  if (touchesMinX && touchesMaxX) {
    let newMinZ = c.minZ;
    let newMaxZ = c.maxZ;
    let suffix = 'c/ Recuo Traseiro Aéreo';
    if (touchesMinZ) {
      newMinZ = activeCut.maxZ;
    } else if (touchesMaxZ) {
      newMaxZ = activeCut.minZ;
      suffix = 'c/ Recuo Frontal Aéreo';
    }
    const newL = Math.max(0.02, newMaxZ - newMinZ);
    const geo = new THREE.BoxGeometry(w, thickness, newL);
    const mesh = new THREE.Mesh(geo, material);
    const newCenterZ = (newMinZ + newMaxZ) / 2;
    mesh.position.set(cCenterX, yPos, newCenterZ);
    return {
      mesh,
      isCutout: true,
      labelSuffix: ` • ${suffix}`,
      actualMinX: c.minX,
      actualMaxX: c.maxX,
      actualMinZ: newMinZ,
      actualMaxZ: newMaxZ
    };
  }

  // Case 2: Full length cut
  if (touchesMinZ && touchesMaxZ) {
    let newMinX = c.minX;
    let newMaxX = c.maxX;
    let suffix = 'c/ Recuo Lateral Dir. Aéreo';
    if (touchesMinX) {
      newMinX = activeCut.maxX;
    } else if (touchesMaxX) {
      newMaxX = activeCut.minX;
      suffix = 'c/ Recuo Lateral Esq. Aéreo';
    }
    const newW = Math.max(0.02, newMaxX - newMinX);
    const geo = new THREE.BoxGeometry(newW, thickness, l);
    const mesh = new THREE.Mesh(geo, material);
    const newCenterX = (newMinX + newMaxX) / 2;
    mesh.position.set(newCenterX, yPos, cCenterZ);
    return {
      mesh,
      isCutout: true,
      labelSuffix: ` • ${suffix}`,
      actualMinX: newMinX,
      actualMaxX: newMaxX,
      actualMinZ: c.minZ,
      actualMaxZ: c.maxZ
    };
  }

  // Case 3: Corner cut or notch
  const x0 = c.minX - cCenterX;
  const x1 = c.maxX - cCenterX;
  const y0 = -(c.maxZ - cCenterZ);
  const y1 = -(c.minZ - cCenterZ);

  const ox0 = activeCut.minX - cCenterX;
  const ox1 = activeCut.maxX - cCenterX;
  const oy0 = -(activeCut.maxZ - cCenterZ);
  const oy1 = -(activeCut.minZ - cCenterZ);

  const shape = new THREE.Shape();
  let suffix = 'c/ Recorte de Quina Armário Aéreo';

  if (touchesMinZ && touchesMinX) {
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(ox1, y1);
    shape.lineTo(ox1, oy0);
    shape.lineTo(x0, oy0);
    shape.closePath();
    suffix = 'c/ Recorte L Quina Traseira Dir. Aéreo';
  } else if (touchesMinZ && touchesMaxX) {
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, oy0);
    shape.lineTo(ox0, oy0);
    shape.lineTo(ox0, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
    suffix = 'c/ Recorte L Quina Traseira Esq. Aéreo';
  } else if (touchesMaxZ && touchesMinX) {
    shape.moveTo(x0, oy1);
    shape.lineTo(ox1, oy1);
    shape.lineTo(ox1, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
    suffix = 'c/ Recorte L Quina Dianteira Dir. Aéreo';
  } else if (touchesMaxZ && touchesMaxX) {
    shape.moveTo(x0, y0);
    shape.lineTo(ox0, y0);
    shape.lineTo(ox0, oy1);
    shape.lineTo(x1, oy1);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
    suffix = 'c/ Recorte L Quina Dianteira Esq. Aéreo';
  } else if (touchesMinZ) {
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(ox1, y1);
    shape.lineTo(ox1, oy0);
    shape.lineTo(ox0, oy0);
    shape.lineTo(ox0, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
    suffix = 'c/ Encaixe Notched Aéreo Traseiro';
  } else if (touchesMaxZ) {
    shape.moveTo(x0, y0);
    shape.lineTo(ox0, y0);
    shape.lineTo(ox0, oy1);
    shape.lineTo(ox1, oy1);
    shape.lineTo(ox1, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
    suffix = 'c/ Encaixe Notched Aéreo Dianteiro';
  } else {
    const geo = new THREE.BoxGeometry(w, thickness, l);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(cCenterX, yPos, cCenterZ);
    return {
      mesh,
      isCutout: false,
      labelSuffix: '',
      actualMinX: c.minX,
      actualMaxX: c.maxX,
      actualMinZ: c.minZ,
      actualMaxZ: c.maxZ
    };
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -thickness / 2, 0);

  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(cCenterX, yPos, cCenterZ);

  return {
    mesh,
    isCutout: true,
    labelSuffix: ` • ${suffix}`,
    actualMinX: c.minX,
    actualMaxX: c.maxX,
    actualMinZ: c.minZ,
    actualMaxZ: c.maxZ
  };
}

console.log('--- TEST: Bed with Rear Overhead Cabinet (gap = 0mm) ---');
const bedBox: InternalBoxItem = {
  id: 'bed',
  name: 'Cama',
  type: 'slat_bed',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  color: '#d97706',
  material: 'plywood',
  upperCabinet: true,
  upperCabinetBottomGapMm: 0, // touching bottom!
  upperCabinetDepthMm: 250,
  upperCabinetAlign: 'rear'
};

const bedWM = 0.400;
const bedLM = 1.700;
const zones = getUpperCabinetExclusionZones(bedBox, bedWM, bedLM, { maxGapMm: 80, marginM: 0.003 });
console.log('Cabinet Zones:', zones);

const mat = new THREE.MeshBasicMaterial();
const cushionW = bedWM - 0.012;
const cushionL = bedLM - 0.016;

const sofaCushionRect: Rect = {
  minX: -cushionW / 2,
  maxX: cushionW / 2,
  minZ: -cushionL / 2,
  maxZ: cushionL / 2
};

const sofaRes = createCushionMesh(sofaCushionRect, zones, 0.06, 0.25, mat);
console.log('Sofa Mode Cushion:');
console.log('  isCutout:', sofaRes?.isCutout);
console.log('  labelSuffix:', sofaRes?.labelSuffix);
console.log('  Z range: [', sofaRes?.actualMinZ.toFixed(3), ',', sofaRes?.actualMaxZ.toFixed(3), ']');
console.log('  Expected minZ =', zones[0].maxZ.toFixed(3));
if (Math.abs((sofaRes?.actualMinZ ?? 0) - zones[0].maxZ) < 0.001) {
  console.log('SUCCESS: Mattress was precisely cut around the overhead cabinet!');
} else {
  console.error('FAIL: minZ does not match zone maxZ');
}
