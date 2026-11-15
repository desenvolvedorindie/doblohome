import * as THREE from 'three';
import { InternalBoxItem, InternalGridConfig, SlatBedDirection } from '../../../types';
import { getUpperCabinetExclusionZones } from '../BoxGeometryHelpers';

export interface CushionRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface CushionMeshResult {
  mesh: THREE.Mesh;
  isCutout: boolean;
  labelSuffix: string;
  actualMinX: number;
  actualMaxX: number;
  actualMinZ: number;
  actualMaxZ: number;
}

export function collectMattressCutoutZones(params: {
  box: InternalBoxItem;
  w: number;
  l: number;
  slatT: number;
  direction: SlatBedDirection;
  parts: number;
  cellWM?: number;
  cellLM?: number;
  allBoxes?: InternalBoxItem[];
  grid?: InternalGridConfig;
}): CushionRect[] {
  const { box, w, l, slatT, direction, parts, cellWM, cellLM, allBoxes, grid } = params;
  const cutoutZones: CushionRect[] = [];

  // 1. Armário aéreo no próprio módulo da cama
  if (box.upperCabinet) {
    const ownZones = getUpperCabinetExclusionZones(box, w, l, { maxGapMm: 80, marginM: 0.003 });
    // Se for 5 partes, as abas de caixa de roda estendem a cama até a lataria lateral da Doblò.
    // Se houver armário frontal ou traseiro na cama, a zona de corte deve cobrir também a aba da caixa de roda no lado da base.
    if (parts === 5) {
      const archW = 0.142;
      for (const oz of ownZones) {
        if (direction === 'left') {
          // Base está no lado direito (-X). Aba da base estende para -X além de -w/2.
          cutoutZones.push({
            minX: oz.minX - archW,
            maxX: oz.maxX,
            minZ: oz.minZ,
            maxZ: oz.maxZ
          });
        } else {
          // Base está no lado esquerdo (+X). Aba da base estende para +X além de +w/2.
          cutoutZones.push({
            minX: oz.minX,
            maxX: oz.maxX + archW,
            minZ: oz.minZ,
            maxZ: oz.maxZ
          });
        }
      }
    } else {
      cutoutZones.push(...ownZones);
    }
  }

  // 2. Módulos vizinhos (armários aéreos ou módulos altos que tocam a altura da cama)
  if (allBoxes && grid && cellWM && cellLM) {
    const mattressTopY = box.heightMm + Math.round(slatT * 1000) + 80;
    for (const otherBox of allBoxes) {
      if (otherBox.id !== box.id) {
        const otherWM = otherBox.colSpan * cellWM;
        const otherLM = otherBox.rowSpan * cellLM;
        // Coordenadas relativas ao box da cama no espaço local:
        // Inversão de sinal necessária pois posX decresce com colStart e posZ decresce com rowStart
        const dx = -(otherBox.colStart + otherBox.colSpan / 2 - (box.colStart + box.colSpan / 2)) * cellWM;
        const dz = -(otherBox.rowStart + otherBox.rowSpan / 2 - (box.rowStart + box.rowSpan / 2)) * cellLM;

        // A. Armário aéreo do vizinho que desce até a altura do colchão
        if (otherBox.upperCabinet) {
          const otherBottomGap = otherBox.upperCabinetBottomGapMm ?? 0;
          const otherCabinetBottomY = otherBox.heightMm + otherBottomGap;
          if (otherCabinetBottomY <= mattressTopY) {
            const otherZones = getUpperCabinetExclusionZones(otherBox, otherWM, otherLM, { maxGapMm: 1000, marginM: 0.003 });
            for (const oz of otherZones) {
              cutoutZones.push({
                minX: oz.minX + dx,
                maxX: oz.maxX + dx,
                minZ: oz.minZ + dz,
                maxZ: oz.maxZ + dz
              });
            }
          }
        }

        // B. Módulo vizinho mais alto que a cama (ex: balcão de cozinha 750mm ou armário alto)
        if (otherBox.heightMm > box.heightMm) {
          cutoutZones.push({
            minX: -otherWM / 2 + dx,
            maxX: otherWM / 2 + dx,
            minZ: -otherLM / 2 + dz,
            maxZ: otherLM / 2 + dz
          });
        }
      }
    }
  }

  return cutoutZones;
}

export function buildCushionMesh(
  c: CushionRect,
  cutoutZones: CushionRect[],
  thickness: number,
  yPos: number,
  material: THREE.Material
): CushionMeshResult | null {
  let activeCut: CushionRect | null = null;
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

  // Se o armário cobre 100% da almofada:
  if (touchesMinX && touchesMaxX && touchesMinZ && touchesMaxZ) {
    return null;
  }

  // Caso 1: Corte na largura total (ex: armário traseiro ou dianteiro abrangendo toda a almofada)
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

  // Caso 2: Corte no comprimento total (ex: armário lateral cobrindo toda a extensão do colchão)
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

  // Caso 3: Recorte em L de Quina ou Notched (Geometria Extrudada THREE.Shape no plano horizontal)
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
    // Quina Traseira Direita
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(ox1, y1);
    shape.lineTo(ox1, oy0);
    shape.lineTo(x0, oy0);
    shape.closePath();
    suffix = 'c/ Recorte L Quina Traseira Dir. Aéreo';
  } else if (touchesMinZ && touchesMaxX) {
    // Quina Traseira Esquerda
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, oy0);
    shape.lineTo(ox0, oy0);
    shape.lineTo(ox0, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
    suffix = 'c/ Recorte L Quina Traseira Esq. Aéreo';
  } else if (touchesMaxZ && touchesMinX) {
    // Quina Dianteira Direita
    shape.moveTo(x0, oy1);
    shape.lineTo(ox1, oy1);
    shape.lineTo(ox1, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
    suffix = 'c/ Recorte L Quina Dianteira Dir. Aéreo';
  } else if (touchesMaxZ && touchesMaxX) {
    // Quina Dianteira Esquerda
    shape.moveTo(x0, y0);
    shape.lineTo(ox0, y0);
    shape.lineTo(ox0, oy1);
    shape.lineTo(x1, oy1);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
    suffix = 'c/ Recorte L Quina Dianteira Esq. Aéreo';
  } else if (touchesMinZ) {
    // Encaixe traseiro central
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
    // Encaixe dianteiro central
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
    // Encaixe lateral direito
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.lineTo(x0, oy1);
    shape.lineTo(ox1, oy1);
    shape.lineTo(ox1, oy0);
    shape.lineTo(x0, oy0);
    shape.closePath();
    suffix = 'c/ Encaixe Notched Lateral Dir. Aéreo';
  } else if (touchesMaxX) {
    // Encaixe lateral esquerdo
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, oy0);
    shape.lineTo(ox0, oy0);
    shape.lineTo(ox0, oy1);
    shape.lineTo(x1, oy1);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
    suffix = 'c/ Encaixe Notched Lateral Esq. Aéreo';
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
