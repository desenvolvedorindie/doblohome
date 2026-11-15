import * as THREE from 'three';

interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface CushionResult {
  mesh: THREE.Mesh;
  isCutout: boolean;
  labelSuffix: string;
  actualMinZ: number;
  actualMaxZ: number;
  actualMinX: number;
  actualMaxX: number;
}

export function buildCushionMesh(
  c: Rect,
  cutoutZones: Rect[],
  thickness: number,
  yPos: number,
  material: THREE.Material
): CushionResult | null {
  // Find first overlapping zone (or union if needed, typically 1 zone per cushion)
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

  // Completely covered
  if (touchesMinX && touchesMaxX && touchesMinZ && touchesMaxZ) {
    return null;
  }

  // Case 1: Full width cut (e.g. rear cabinet across entire cushion width)
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

  // Case 2: Full length cut (e.g. lateral cabinet across entire cushion length)
  if (touchesMinZ && touchesMaxZ) {
    let newMinX = c.minX;
    let newMaxX = c.maxX;
    let suffix = 'c/ Recuo Lateral Aéreo';
    if (touchesMinX) {
      newMinX = activeCut.maxX;
    } else if (touchesMaxX) {
      newMaxX = activeCut.minX;
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

  // Case 3: Corner cut or notch (ExtrudeGeometry Shape in (x, y) where y = -z)
  const x0 = c.minX - cCenterX;
  const x1 = c.maxX - cCenterX;
  const y0 = -(c.maxZ - cCenterZ); // front
  const y1 = -(c.minZ - cCenterZ); // rear

  const ox0 = activeCut.minX - cCenterX;
  const ox1 = activeCut.maxX - cCenterX;
  const oy0 = -(activeCut.maxZ - cCenterZ);
  const oy1 = -(activeCut.minZ - cCenterZ);

  const shape = new THREE.Shape();
  let suffix = 'c/ Recorte de Quina Armário Aéreo';

  if (touchesMinZ && touchesMinX) {
    // Rear-Right
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(ox1, y1);
    shape.lineTo(ox1, oy0);
    shape.lineTo(x0, oy0);
    shape.closePath();
    suffix = 'c/ Recorte L Quina Traseira Dir. Aéreo';
  } else if (touchesMinZ && touchesMaxX) {
    // Rear-Left
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, oy0);
    shape.lineTo(ox0, oy0);
    shape.lineTo(ox0, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
    suffix = 'c/ Recorte L Quina Traseira Esq. Aéreo';
  } else if (touchesMaxZ && touchesMinX) {
    // Front-Right
    shape.moveTo(x0, oy1);
    shape.lineTo(ox1, oy1);
    shape.lineTo(ox1, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
    suffix = 'c/ Recorte L Quina Dianteira Dir. Aéreo';
  } else if (touchesMaxZ && touchesMaxX) {
    // Front-Left
    shape.moveTo(x0, y0);
    shape.lineTo(ox0, y0);
    shape.lineTo(ox0, oy1);
    shape.lineTo(x1, oy1);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
    suffix = 'c/ Recorte L Quina Dianteira Esq. Aéreo';
  } else if (touchesMinZ) {
    // Rear notch
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
    // Front notch
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
  } else if (touchesMinX) {
    // Right notch
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.lineTo(x0, oy1);
    shape.lineTo(ox1, oy1);
    shape.lineTo(ox1, oy0);
    shape.lineTo(x0, oy0);
    shape.closePath();
    suffix = 'c/ Encaixe Notched Aéreo Lateral Dir.';
  } else if (touchesMaxX) {
    // Left notch
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, oy0);
    shape.lineTo(ox0, oy0);
    shape.lineTo(ox0, oy1);
    shape.lineTo(x1, oy1);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
    suffix = 'c/ Encaixe Notched Aéreo Lateral Esq.';
  } else {
    // Fallback simple box
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

// Run test on full width cut:
const c1: Rect = { minX: -0.2, maxX: 0.2, minZ: -0.85, maxZ: 0.85 };
const rearFullCut: Rect = { minX: -0.2, maxX: 0.2, minZ: -0.85, maxZ: -0.60 };
const mat = new THREE.MeshBasicMaterial();
const res1 = buildCushionMesh(c1, [rearFullCut], 0.08, 0.45, mat);
console.log('Test 1 (Full width cut):', res1?.labelSuffix, 'new minZ =', res1?.actualMinZ);

// Run test on corner cut:
const rearCornerCut: Rect = { minX: 0.0, maxX: 0.2, minZ: -0.85, maxZ: -0.60 };
const res2 = buildCushionMesh(c1, [rearCornerCut], 0.08, 0.45, mat);
console.log('Test 2 (Corner cut):', res2?.labelSuffix);
