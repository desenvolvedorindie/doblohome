const fs = require('fs');
const path = require('path');

// 1. SlatBedMattressBuilder.ts
const mattressBuilderPath = path.resolve('src/three/boxes/SlatBedMattressBuilder.ts');
const newMattressBuilderContent = `import * as THREE from 'three';
import { InternalBoxItem, InternalGridConfig, SlatBedDirection, getMattressFoamName } from '../../types';
import { collectMattressCutoutZones, CushionRect } from './slat-bed/MattressCushionGeometry';
import { buildLateralFivePartMattress } from './slat-bed/LateralFivePartMattressBuilder';
import { buildLateralStandardMattress } from './slat-bed/LateralStandardMattressBuilder';
import { buildLongitudinalMattress } from './slat-bed/LongitudinalMattressBuilder';

export interface SlatMattressParams {
  showMattress?: boolean;
  isSelected?: boolean;
  container: THREE.Group;
  w: number;
  l: number;
  h: number;
  box: InternalBoxItem;
  slatT: number;
  direction: SlatBedDirection;
  isExtended: boolean;
  extRatio: number;
  cellWM?: number;
  cellLM?: number;
  allBoxes?: InternalBoxItem[];
  grid?: InternalGridConfig;
}

export interface BedSurfaceBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  totalW: number;
  totalL: number;
}

/**
 * Calcula os limites físicos exatos (100%) da superfície superior da cama onde o colchão assenta.
 * Suporta modo fechado (sofá), modo estendido em ripas retráteis (slat) e articulada com dobradiça (hinged),
 * em todas as 4 direções (left, right, front, rear).
 */
export function getBedSurfaceBounds(params: {
  w: number;
  l: number;
  box: InternalBoxItem;
  direction: SlatBedDirection;
  isExtended: boolean;
  extRatio: number;
}): BedSurfaceBounds {
  const { w, l, box, direction, isExtended, extRatio } = params;
  if (!isExtended) {
    return {
      minX: -w / 2,
      maxX: w / 2,
      minZ: -l / 2,
      maxZ: l / 2,
      totalW: w,
      totalL: l
    };
  }

  const isHinged = box.bedMode === 'hinged';
  const hingeGap = 0.003;
  const t = 0.015;

  if (direction === 'left') {
    if (isHinged) {
      const leafW = Math.min(w, Math.max(Math.min(0.10, w), (box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : w)));
      return {
        minX: -w / 2,
        maxX: w / 2 + hingeGap + leafW,
        minZ: -l / 2,
        maxZ: l / 2,
        totalW: w + hingeGap + leafW,
        totalL: l
      };
    } else {
      const strokeMax = Math.max(0, w - t);
      const targetExtM = box.hingedBedLeafSizeMm !== undefined
        ? Math.min(strokeMax, Math.max(Math.min(0.10, strokeMax), box.hingedBedLeafSizeMm / 1000))
        : strokeMax * extRatio;
      return {
        minX: -w / 2,
        maxX: w / 2 + targetExtM,
        minZ: -l / 2,
        maxZ: l / 2,
        totalW: w + targetExtM,
        totalL: l
      };
    }
  }

  if (direction === 'right') {
    if (isHinged) {
      const leafW = Math.min(w, Math.max(Math.min(0.10, w), (box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : w)));
      return {
        minX: -w / 2 - hingeGap - leafW,
        maxX: w / 2,
        minZ: -l / 2,
        maxZ: l / 2,
        totalW: w + hingeGap + leafW,
        totalL: l
      };
    } else {
      const strokeMax = Math.max(0, w - t);
      const targetExtM = box.hingedBedLeafSizeMm !== undefined
        ? Math.min(strokeMax, Math.max(Math.min(0.10, strokeMax), box.hingedBedLeafSizeMm / 1000))
        : strokeMax * extRatio;
      return {
        minX: -w / 2 - targetExtM,
        maxX: w / 2,
        minZ: -l / 2,
        maxZ: l / 2,
        totalW: w + targetExtM,
        totalL: l
      };
    }
  }

  if (direction === 'front') {
    if (isHinged) {
      const leafL = Math.min(l, Math.max(Math.min(0.10, l), (box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : l)));
      return {
        minX: -w / 2,
        maxX: w / 2,
        minZ: -l / 2,
        maxZ: l / 2 + hingeGap + leafL,
        totalW: w,
        totalL: l + hingeGap + leafL
      };
    } else {
      const strokeMaxZ = Math.max(0, l - t);
      const targetExtZ = box.hingedBedLeafSizeMm !== undefined
        ? Math.min(strokeMaxZ, Math.max(Math.min(0.10, strokeMaxZ), box.hingedBedLeafSizeMm / 1000))
        : strokeMaxZ * extRatio;
      return {
        minX: -w / 2,
        maxX: w / 2,
        minZ: -l / 2,
        maxZ: l / 2 + targetExtZ,
        totalW: w,
        totalL: l + targetExtZ
      };
    }
  }

  // direction === 'rear'
  if (isHinged) {
    const leafL = Math.min(l, Math.max(Math.min(0.10, l), (box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : l)));
    return {
      minX: -w / 2,
      maxX: w / 2,
      minZ: -l / 2 - hingeGap - leafL,
      maxZ: l / 2,
      totalW: w,
      totalL: l + hingeGap + leafL
    };
  } else {
    const strokeMaxZ = Math.max(0, l - t);
    const targetExtZ = box.hingedBedLeafSizeMm !== undefined
      ? Math.min(strokeMaxZ, Math.max(Math.min(0.10, strokeMaxZ), box.hingedBedLeafSizeMm / 1000))
      : strokeMaxZ * extRatio;
    return {
      minX: -w / 2,
      maxX: w / 2,
      minZ: -l / 2 - targetExtZ,
      maxZ: l / 2,
      totalW: w,
      totalL: l + targetExtZ
    };
  }
}

export class SlatBedMattressBuilder {
  buildMattress(params: SlatMattressParams) {
    const { container, w, l, h, box, slatT, direction, isExtended, extRatio, cellWM, cellLM, allBoxes, grid } = params;
    const isSelected = params.isSelected ?? false;
    const showMattress = params.showMattress ?? true;
    const parts = box.mattressParts ?? 2;
    const topOfSlatsY = h / 2;

    if (!showMattress) {
      return;
    }

    const cutoutZones = collectMattressCutoutZones({
      box,
      w,
      l,
      slatT,
      direction,
      parts,
      cellWM,
      cellLM,
      allBoxes,
      grid
    });

    const partsName = parts === 1
      ? '1 Parte'
      : parts === 3
        ? '3 Partes da Doblò'
        : parts === 5
          ? '5 Partes (Total c/ Caixas de Roda)'
          : parts === 4
            ? '4 Partes da Doblò'
            : '2 Partes';
    const mattressThickness = (box.mattressThicknessMm ?? 80) / 1000;
    const foamName = getMattressFoamName(box.mattressFoam);
    const mattressY = topOfSlatsY + mattressThickness / 2;

    const mattressMat = new THREE.MeshStandardMaterial({
      color: isSelected ? 0x38bdf8 : 0x334155, // Tecido náutico grafite escuro texturizado
      roughness: 0.90,
      metalness: 0.02
    });
    const seamMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

    const bounds = getBedSurfaceBounds({
      w,
      l,
      box,
      direction,
      isExtended,
      extRatio: extRatio ?? 1
    });

    if (direction === 'left' || direction === 'right') {
      if (parts === 5) {
        buildLateralFivePartMattress({
          container,
          w,
          l,
          direction,
          isExtended,
          bounds,
          topOfSlatsY,
          mattressThickness,
          mattressY,
          mattressMat,
          seamMat,
          cutoutZones,
          foamName
        });
      } else {
        buildLateralStandardMattress({
          container,
          w,
          l,
          box,
          direction,
          isExtended,
          parts,
          partsName,
          bounds,
          topOfSlatsY,
          mattressThickness,
          mattressY,
          mattressMat,
          seamMat,
          cutoutZones,
          foamName
        });
      }
    } else {
      buildLongitudinalMattress({
        container,
        w,
        l,
        box,
        direction,
        isExtended,
        parts,
        partsName,
        bounds,
        topOfSlatsY,
        mattressThickness,
        mattressY,
        mattressMat,
        seamMat,
        cutoutZones,
        foamName
      });
    }
  }
}
`;
fs.writeFileSync(mattressBuilderPath, newMattressBuilderContent, 'utf8');
console.log('Updated SlatBedMattressBuilder.ts');

// 2. LateralStandardMattressBuilder.ts
const lateralStdPath = path.resolve('src/three/boxes/slat-bed/LateralStandardMattressBuilder.ts');
const newLateralStdContent = `import * as THREE from 'three';
import { InternalBoxItem, SlatBedDirection } from '../../../types';
import {
  buildCushionMesh,
  CushionMeshResult,
  CushionRect
} from './MattressCushionGeometry';
import { BedSurfaceBounds } from '../SlatBedMattressBuilder';

function getUncutSeamIntervalsZ(
  seamX: number,
  minZ: number,
  maxZ: number,
  cutoutZones: CushionRect[]
): Array<{ minZ: number; maxZ: number }> {
  let intervals: Array<{ minZ: number; maxZ: number }> = [{ minZ, maxZ }];
  for (const z of cutoutZones) {
    if (seamX >= z.minX - 0.006 && seamX <= z.maxX + 0.006) {
      const next: Array<{ minZ: number; maxZ: number }> = [];
      for (const seg of intervals) {
        if (z.maxZ <= seg.minZ || z.minZ >= seg.maxZ) {
          next.push(seg);
        } else {
          if (z.minZ > seg.minZ + 0.015) {
            next.push({ minZ: seg.minZ, maxZ: z.minZ });
          }
          if (z.maxZ < seg.maxZ - 0.015) {
            next.push({ minZ: z.maxZ, maxZ: seg.maxZ });
          }
        }
      }
      intervals = next;
    }
  }
  return intervals.filter((s) => s.maxZ - s.minZ > 0.015);
}

export function buildLateralStandardMattress(params: {
  container: THREE.Group;
  w: number;
  l: number;
  box: InternalBoxItem;
  direction: SlatBedDirection;
  isExtended: boolean;
  parts: number;
  partsName: string;
  bounds: BedSurfaceBounds;
  topOfSlatsY: number;
  mattressThickness: number;
  mattressY: number;
  mattressMat: THREE.Material;
  seamMat: THREE.Material;
  cutoutZones: CushionRect[];
  foamName?: string;
}) {
  const {
    container,
    w,
    box,
    direction,
    isExtended,
    parts,
    partsName,
    bounds,
    topOfSlatsY,
    mattressThickness,
    mattressY,
    mattressMat,
    seamMat,
    cutoutZones,
    foamName
  } = params;

  const foamLabel = foamName || 'Espuma D33';
  const upholsteryWoodMat = \`\${foamLabel} (Colchão)\`;

  if (isExtended) {
    // Cama Aberta: cobre 100% dos limites da cama estendida (bounds)
    const cushionResults: Array<CushionMeshResult | null> = [];
    const seamPositionsX: number[] = [];

    if (parts === 1) {
      const cRes = buildCushionMesh(
        { minX: bounds.minX, maxX: bounds.maxX, minZ: bounds.minZ, maxZ: bounds.maxZ },
        cutoutZones,
        mattressThickness,
        mattressY,
        mattressMat
      );
      cushionResults.push(cRes);
      if (cRes) {
        cRes.mesh.castShadow = true;
        cRes.mesh.receiveShadow = true;
        const curW = cRes.actualMaxX - cRes.actualMinX;
        const curL = cRes.actualMaxZ - cRes.actualMinZ;
        cRes.mesh.userData = {
          isWoodPart: false,
          isUpholstery: true,
          dimW: curW,
          dimH: mattressThickness,
          dimL: curL,
          thicknessMm: Math.round(mattressThickness * 1000),
          partLabel: \`Colchão Inteiro (\${Math.round(curW * 1000)}×\${Math.round(curL * 1000)}mm)\${cRes.labelSuffix}\`,
          material: \`\${foamLabel} Revestida em Tecido Impermeável\`,
          woodMaterial: upholsteryWoodMat,
          category: '🛏️ Estofaria Campervan',
          hasCabinetCutout: cRes.isCutout,
          moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
          partType: 'upholstery'
        };
        container.add(cRes.mesh);
      }
    } else if (parts === 2 && box.bedMode === 'hinged') {
      // 2 partes na cama com dobradiça: almofada 1 no tampo fixo base (w), almofada 2 na folha dobrável
      const ranges = direction === 'left'
        ? [
            { minX: -w / 2, maxX: w / 2 },
            { minX: w / 2, maxX: bounds.maxX }
          ]
        : [
            { minX: -w / 2, maxX: w / 2 },
            { minX: bounds.minX, maxX: -w / 2 }
          ];

      seamPositionsX.push(direction === 'left' ? w / 2 : -w / 2);

      for (let i = 0; i < 2; i++) {
        const rng = ranges[i];
        const cRes = buildCushionMesh(
          { minX: rng.minX, maxX: rng.maxX, minZ: bounds.minZ, maxZ: bounds.maxZ },
          cutoutZones,
          mattressThickness,
          mattressY,
          mattressMat
        );
        cushionResults.push(cRes);
        if (cRes) {
          cRes.mesh.castShadow = true;
          cRes.mesh.receiveShadow = true;
          const curW = cRes.actualMaxX - cRes.actualMinX;
          const curL = cRes.actualMaxZ - cRes.actualMinZ;
          cRes.mesh.userData = {
            isWoodPart: false,
            isUpholstery: true,
            dimW: curW,
            dimH: mattressThickness,
            dimL: curL,
            thicknessMm: Math.round(mattressThickness * 1000),
            partLabel: \`Almofada \${i + 1}/2 (\${partsName})\${cRes.labelSuffix}\`,
            material: \`\${foamLabel} Revestida em Tecido Impermeável \${partsName}\`,
            woodMaterial: upholsteryWoodMat,
            category: '🛏️ Estofaria Campervan',
            hasCabinetCutout: cRes.isCutout,
            moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
            partType: 'upholstery'
          };
          container.add(cRes.mesh);
        }
      }
    } else {
      // N partes dividindo exatamente 100% da largura total da cama aberta
      const partW = bounds.totalW / parts;
      for (let i = 0; i < parts; i++) {
        const cMinX = direction === 'left'
          ? (bounds.minX + i * partW)
          : (bounds.maxX - (i + 1) * partW);
        const cMaxX = cMinX + partW;

        if (i < parts - 1) {
          seamPositionsX.push(direction === 'left' ? cMaxX : cMinX);
        }

        const cRes = buildCushionMesh(
          { minX: cMinX, maxX: cMaxX, minZ: bounds.minZ, maxZ: bounds.maxZ },
          cutoutZones,
          mattressThickness,
          mattressY,
          mattressMat
        );
        cushionResults.push(cRes);
        if (cRes) {
          cRes.mesh.castShadow = true;
          cRes.mesh.receiveShadow = true;
          const curW = cRes.actualMaxX - cRes.actualMinX;
          const curL = cRes.actualMaxZ - cRes.actualMinZ;
          cRes.mesh.userData = {
            isWoodPart: false,
            isUpholstery: true,
            dimW: curW,
            dimH: mattressThickness,
            dimL: curL,
            thicknessMm: Math.round(mattressThickness * 1000),
            partLabel: \`Almofada \${i + 1}/\${parts} (\${partsName})\${cRes.labelSuffix}\`,
            material: \`\${foamLabel} Revestida em Tecido Impermeável \${partsName}\`,
            woodMaterial: upholsteryWoodMat,
            category: '🛏️ Estofaria Campervan',
            hasCabinetCutout: cRes.isCutout,
            moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
            partType: 'upholstery'
          };
          container.add(cRes.mesh);
        }
      }
    }

    // Costuras entre almofadas adjacentes
    for (let s = 0; s < seamPositionsX.length; s++) {
      const seamX = seamPositionsX[s];
      const cA = cushionResults[s];
      const cB = cushionResults[s + 1];
      if (cA && cB) {
        const seamMinZ = Math.max(cA.actualMinZ, cB.actualMinZ);
        const seamMaxZ = Math.min(cA.actualMaxZ, cB.actualMaxZ);
        for (const seg of getUncutSeamIntervalsZ(seamX, seamMinZ, seamMaxZ, cutoutZones)) {
          const seamL = seg.maxZ - seg.minZ;
          if (seamL > 0.01) {
            const seamGeo = new THREE.BoxGeometry(0.004, mattressThickness + 0.002, seamL);
            const seamMesh = new THREE.Mesh(seamGeo, seamMat);
            seamMesh.position.set(seamX, mattressY, (seg.minZ + seg.maxZ) / 2);
            container.add(seamMesh);
          }
        }
      }
    }
  } else {
    // Cama Fechada: almofada(s) cobrem 100% da base no modo sofá (sem recuo)
    if (parts === 1) {
      const mRes = buildCushionMesh(
        { minX: bounds.minX, maxX: bounds.maxX, minZ: bounds.minZ, maxZ: bounds.maxZ },
        cutoutZones,
        mattressThickness,
        mattressY,
        mattressMat
      );
      if (mRes) {
        mRes.mesh.castShadow = true;
        mRes.mesh.receiveShadow = true;
        const curW = mRes.actualMaxX - mRes.actualMinX;
        const curL = mRes.actualMaxZ - mRes.actualMinZ;
        mRes.mesh.userData = {
          isWoodPart: false,
          isUpholstery: true,
          dimW: curW,
          dimH: mattressThickness,
          dimL: curL,
          thicknessMm: Math.round(mattressThickness * 1000),
          partLabel: \`Almofada Inteira Modo Sofá\${mRes.labelSuffix}\`,
          material: \`\${foamLabel} Revestida em Tecido Impermeável\`,
          woodMaterial: upholsteryWoodMat,
          category: '🛏️ Estofaria Campervan',
          hasCabinetCutout: mRes.isCutout,
          moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
          partType: 'upholstery'
        };
        container.add(mRes.mesh);
      }
    } else {
      const layerH = parts === 2 ? 0.06 : parts === 3 ? 0.055 : 0.045;
      const layerResults: Array<CushionMeshResult | null> = [];
      for (let p = 0; p < parts; p++) {
        const layerY = topOfSlatsY + layerH / 2 + p * (layerH + 0.001);
        const mRes = buildCushionMesh(
          { minX: bounds.minX, maxX: bounds.maxX, minZ: bounds.minZ, maxZ: bounds.maxZ },
          cutoutZones,
          layerH,
          layerY,
          mattressMat
        );
        layerResults.push(mRes);

        if (mRes) {
          mRes.mesh.castShadow = true;
          mRes.mesh.receiveShadow = true;
          const curW = mRes.actualMaxX - mRes.actualMinX;
          const curL = mRes.actualMaxZ - mRes.actualMinZ;
          mRes.mesh.userData = {
            isWoodPart: false,
            isUpholstery: true,
            dimW: curW,
            dimH: layerH,
            dimL: curL,
            thicknessMm: Math.round(layerH * 1000),
            partLabel: \`Almofada \${p + 1}/\${parts} (\${partsName} Modo Sofá)\${mRes.labelSuffix}\`,
            material: \`\${foamLabel} Revestida em Tecido Impermeável \${partsName}\`,
            woodMaterial: upholsteryWoodMat,
            category: '🛏️ Estofaria Campervan',
            hasCabinetCutout: mRes.isCutout,
            moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
            partType: 'upholstery'
          };
          container.add(mRes.mesh);
        }
      }

      for (let p = 0; p < parts - 1; p++) {
        const lA = layerResults[p];
        if (lA) {
          const curW = lA.actualMaxX - lA.actualMinX;
          const curL = lA.actualMaxZ - lA.actualMinZ;
          const seamGeo = new THREE.BoxGeometry(curW + 0.002, 0.002, curL + 0.002);
          const seamMesh = new THREE.Mesh(seamGeo, seamMat);
          const seamCenterZ = (lA.actualMinZ + lA.actualMaxZ) / 2;
          const seamCenterX = (lA.actualMinX + lA.actualMaxX) / 2;
          seamMesh.position.set(seamCenterX, topOfSlatsY + (p + 1) * (layerH + 0.001) - 0.0005, seamCenterZ);
          container.add(seamMesh);
        }
      }
    }
  }
}
`;
fs.writeFileSync(lateralStdPath, newLateralStdContent, 'utf8');
console.log('Updated LateralStandardMattressBuilder.ts');

// 3. LongitudinalMattressBuilder.ts
const longPath = path.resolve('src/three/boxes/slat-bed/LongitudinalMattressBuilder.ts');
const newLongContent = `import * as THREE from 'three';
import { InternalBoxItem, SlatBedDirection } from '../../../types';
import {
  buildCushionMesh,
  CushionMeshResult,
  CushionRect
} from './MattressCushionGeometry';
import { BedSurfaceBounds } from '../SlatBedMattressBuilder';

export function buildLongitudinalMattress(params: {
  container: THREE.Group;
  w: number;
  l: number;
  box: InternalBoxItem;
  direction: SlatBedDirection;
  isExtended: boolean;
  parts: number;
  partsName: string;
  bounds: BedSurfaceBounds;
  topOfSlatsY: number;
  mattressThickness: number;
  mattressY: number;
  mattressMat: THREE.Material;
  seamMat: THREE.Material;
  cutoutZones: CushionRect[];
  foamName?: string;
}) {
  const {
    container,
    l,
    box,
    direction,
    isExtended,
    parts,
    partsName,
    bounds,
    topOfSlatsY,
    mattressThickness,
    mattressY,
    mattressMat,
    seamMat,
    cutoutZones,
    foamName
  } = params;

  const foamLabel = foamName || 'Espuma D33';
  const upholsteryWoodMat = \`\${foamLabel} (Colchão)\`;

  if (isExtended) {
    const cushionResults: Array<CushionMeshResult | null> = [];
    const seamPositionsZ: number[] = [];

    if (parts === 1) {
      const cRes = buildCushionMesh(
        { minX: bounds.minX, maxX: bounds.maxX, minZ: bounds.minZ, maxZ: bounds.maxZ },
        cutoutZones,
        mattressThickness,
        mattressY,
        mattressMat
      );
      cushionResults.push(cRes);
      if (cRes) {
        cRes.mesh.castShadow = true;
        cRes.mesh.receiveShadow = true;
        const curW = cRes.actualMaxX - cRes.actualMinX;
        const curL = cRes.actualMaxZ - cRes.actualMinZ;
        cRes.mesh.userData = {
          isWoodPart: false,
          isUpholstery: true,
          dimW: curW,
          dimH: mattressThickness,
          dimL: curL,
          thicknessMm: Math.round(mattressThickness * 1000),
          partLabel: \`Colchão Longitudinal Inteiro (\${Math.round(curW * 1000)}×\${Math.round(curL * 1000)}mm)\${cRes.labelSuffix}\`,
          material: \`\${foamLabel} Revestida em Tecido Impermeável\`,
          woodMaterial: upholsteryWoodMat,
          category: '🛏️ Estofaria Campervan',
          hasCabinetCutout: cRes.isCutout,
          moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
          partType: 'upholstery'
        };
        container.add(cRes.mesh);
      }
    } else if (parts === 2 && box.bedMode === 'hinged') {
      const ranges = direction === 'front'
        ? [
            { minZ: -l / 2, maxZ: l / 2 },
            { minZ: l / 2, maxZ: bounds.maxZ }
          ]
        : [
            { minZ: -l / 2, maxZ: l / 2 },
            { minZ: bounds.minZ, maxZ: -l / 2 }
          ];

      seamPositionsZ.push(direction === 'front' ? l / 2 : -l / 2);

      for (let i = 0; i < 2; i++) {
        const rng = ranges[i];
        const cRes = buildCushionMesh(
          { minX: bounds.minX, maxX: bounds.maxX, minZ: rng.minZ, maxZ: rng.maxZ },
          cutoutZones,
          mattressThickness,
          mattressY,
          mattressMat
        );
        cushionResults.push(cRes);
        if (cRes) {
          cRes.mesh.castShadow = true;
          cRes.mesh.receiveShadow = true;
          const curW = cRes.actualMaxX - cRes.actualMinX;
          const curL = cRes.actualMaxZ - cRes.actualMinZ;
          cRes.mesh.userData = {
            isWoodPart: false,
            isUpholstery: true,
            dimW: curW,
            dimH: mattressThickness,
            dimL: curL,
            thicknessMm: Math.round(mattressThickness * 1000),
            partLabel: \`Almofada Longitudinal \${i + 1}/2 (\${partsName})\${cRes.labelSuffix}\`,
            material: \`\${foamLabel} Revestida em Tecido Impermeável \${partsName}\`,
            woodMaterial: upholsteryWoodMat,
            category: '🛏️ Estofaria Campervan',
            hasCabinetCutout: cRes.isCutout,
            moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
            partType: 'upholstery'
          };
          container.add(cRes.mesh);
        }
      }
    } else {
      const partL = bounds.totalL / parts;
      for (let i = 0; i < parts; i++) {
        const cMinZ = direction === 'front'
          ? (bounds.minZ + i * partL)
          : (bounds.maxZ - (i + 1) * partL);
        const cMaxZ = cMinZ + partL;

        if (i < parts - 1) {
          seamPositionsZ.push(direction === 'front' ? cMaxZ : cMinZ);
        }

        const cRes = buildCushionMesh(
          { minX: bounds.minX, maxX: bounds.maxX, minZ: cMinZ, maxZ: cMaxZ },
          cutoutZones,
          mattressThickness,
          mattressY,
          mattressMat
        );
        cushionResults.push(cRes);
        if (cRes) {
          cRes.mesh.castShadow = true;
          cRes.mesh.receiveShadow = true;
          const curW = cRes.actualMaxX - cRes.actualMinX;
          const curL = cRes.actualMaxZ - cRes.actualMinZ;
          cRes.mesh.userData = {
            isWoodPart: false,
            isUpholstery: true,
            dimW: curW,
            dimH: mattressThickness,
            dimL: curL,
            thicknessMm: Math.round(mattressThickness * 1000),
            partLabel: \`Almofada Longitudinal \${i + 1}/\${parts} (\${partsName})\${cRes.labelSuffix}\`,
            material: \`\${foamLabel} Revestida em Tecido Impermeável \${partsName}\`,
            woodMaterial: upholsteryWoodMat,
            category: '🛏️ Estofaria Campervan',
            hasCabinetCutout: cRes.isCutout,
            moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
            partType: 'upholstery'
          };
          container.add(cRes.mesh);
        }
      }
    }

    // Costuras entre almofadas adjacentes
    for (let s = 0; s < seamPositionsZ.length; s++) {
      const seamZ = seamPositionsZ[s];
      const cA = cushionResults[s];
      const cB = cushionResults[s + 1];
      if (cA && cB) {
        const seamMinX = Math.max(cA.actualMinX, cB.actualMinX);
        const seamMaxX = Math.min(cA.actualMaxX, cB.actualMaxX);
        if (seamMaxX > seamMinX + 0.01) {
          const seamW = seamMaxX - seamMinX;
          const seamGeo = new THREE.BoxGeometry(seamW, mattressThickness + 0.002, 0.004);
          const seamMesh = new THREE.Mesh(seamGeo, seamMat);
          seamMesh.position.set((seamMinX + seamMaxX) / 2, mattressY, seamZ);
          container.add(seamMesh);
        }
      }
    }
  } else {
    // Cama Fechada: almofada(s) cobrem 100% da base no modo sofá (sem recuo)
    if (parts === 1) {
      const mRes = buildCushionMesh(
        { minX: bounds.minX, maxX: bounds.maxX, minZ: bounds.minZ, maxZ: bounds.maxZ },
        cutoutZones,
        mattressThickness,
        mattressY,
        mattressMat
      );
      if (mRes) {
        mRes.mesh.castShadow = true;
        mRes.mesh.receiveShadow = true;
        const curW = mRes.actualMaxX - mRes.actualMinX;
        const curL = mRes.actualMaxZ - mRes.actualMinZ;
        mRes.mesh.userData = {
          isWoodPart: false,
          isUpholstery: true,
          dimW: curW,
          dimH: mattressThickness,
          dimL: curL,
          thicknessMm: Math.round(mattressThickness * 1000),
          partLabel: \`Almofada Inteira Modo Sofá\${mRes.labelSuffix}\`,
          material: \`\${foamLabel} Revestida em Tecido Impermeável\`,
          woodMaterial: upholsteryWoodMat,
          category: '🛏️ Estofaria Campervan',
          hasCabinetCutout: mRes.isCutout,
          moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
          partType: 'upholstery'
        };
        container.add(mRes.mesh);
      }
    } else {
      const layerH = parts === 2 ? 0.06 : parts === 3 ? 0.055 : 0.045;
      const layerResults: Array<CushionMeshResult | null> = [];
      for (let p = 0; p < parts; p++) {
        const layerY = topOfSlatsY + layerH / 2 + p * (layerH + 0.001);
        const mRes = buildCushionMesh(
          { minX: bounds.minX, maxX: bounds.maxX, minZ: bounds.minZ, maxZ: bounds.maxZ },
          cutoutZones,
          layerH,
          layerY,
          mattressMat
        );
        layerResults.push(mRes);

        if (mRes) {
          mRes.mesh.castShadow = true;
          mRes.mesh.receiveShadow = true;
          const curW = mRes.actualMaxX - mRes.actualMinX;
          const curL = mRes.actualMaxZ - mRes.actualMinZ;
          mRes.mesh.userData = {
            isWoodPart: false,
            isUpholstery: true,
            dimW: curW,
            dimH: layerH,
            dimL: curL,
            thicknessMm: Math.round(layerH * 1000),
            partLabel: \`Almofada Longitudinal \${p + 1}/\${parts} (\${partsName} Modo Sofá)\${mRes.labelSuffix}\`,
            material: \`\${foamLabel} Revestida em Tecido Impermeável \${partsName}\`,
            woodMaterial: upholsteryWoodMat,
            category: '🛏️ Estofaria Campervan',
            hasCabinetCutout: mRes.isCutout,
            moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
            partType: 'upholstery'
          };
          container.add(mRes.mesh);
        }
      }

      for (let p = 0; p < parts - 1; p++) {
        const lA = layerResults[p];
        if (lA) {
          const curW = lA.actualMaxX - lA.actualMinX;
          const curL = lA.actualMaxZ - lA.actualMinZ;
          const seamGeo = new THREE.BoxGeometry(curW + 0.002, 0.002, curL + 0.002);
          const seamMesh = new THREE.Mesh(seamGeo, seamMat);
          const seamCenterZ = (lA.actualMinZ + lA.actualMaxZ) / 2;
          const seamCenterX = (lA.actualMinX + lA.actualMaxX) / 2;
          seamMesh.position.set(seamCenterX, topOfSlatsY + (p + 1) * (layerH + 0.001) - 0.0005, seamCenterZ);
          container.add(seamMesh);
        }
      }
    }
  }
}
`;
fs.writeFileSync(longPath, newLongContent, 'utf8');
console.log('Updated LongitudinalMattressBuilder.ts');

// 4. LateralFivePartMattressBuilder.ts
const fivePartPath = path.resolve('src/three/boxes/slat-bed/LateralFivePartMattressBuilder.ts');
const newFivePartContent = `import * as THREE from 'three';
import { SlatBedDirection } from '../../../types';
import {
  buildCushionMesh,
  CushionMeshResult,
  CushionRect
} from './MattressCushionGeometry';
import { BedSurfaceBounds } from '../SlatBedMattressBuilder';

function getUncutSeamIntervalsZ(
  seamX: number,
  minZ: number,
  maxZ: number,
  cutoutZones: CushionRect[]
): Array<{ minZ: number; maxZ: number }> {
  let intervals: Array<{ minZ: number; maxZ: number }> = [{ minZ, maxZ }];
  for (const z of cutoutZones) {
    if (seamX >= z.minX - 0.006 && seamX <= z.maxX + 0.006) {
      const next: Array<{ minZ: number; maxZ: number }> = [];
      for (const seg of intervals) {
        if (z.maxZ <= seg.minZ || z.minZ >= seg.maxZ) {
          next.push(seg);
        } else {
          if (z.minZ > seg.minZ + 0.015) {
            next.push({ minZ: seg.minZ, maxZ: z.minZ });
          }
          if (z.maxZ < seg.maxZ - 0.015) {
            next.push({ minZ: z.maxZ, maxZ: seg.maxZ });
          }
        }
      }
      intervals = next;
    }
  }
  return intervals.filter((s) => s.maxZ - s.minZ > 0.015);
}

export function buildLateralFivePartMattress(params: {
  container: THREE.Group;
  w: number;
  l: number;
  direction: SlatBedDirection;
  isExtended: boolean;
  bounds: BedSurfaceBounds;
  topOfSlatsY: number;
  mattressThickness: number;
  mattressY: number;
  mattressMat: THREE.Material;
  seamMat: THREE.Material;
  cutoutZones: CushionRect[];
  foamName?: string;
}) {
  const {
    container,
    w,
    l,
    direction,
    isExtended,
    bounds,
    topOfSlatsY,
    mattressThickness,
    mattressY,
    mattressMat,
    seamMat,
    cutoutZones,
    foamName
  } = params;

  const foamLabel = foamName || 'Espuma D33';
  const upholsteryMat = \`\${foamLabel} Revestida em Tecido Impermeável\`;
  const upholsteryWoodMat = \`\${foamLabel} (Colchão)\`;

  // --- 5 PARTES: 3 COLUNAS CENTRAIS + 2 ABAS DE CAIXA DE RODA ESQ/DIR ---
  const archW = 0.142; // ~142mm para cada caixa de roda

  if (isExtended) {
    // 1. Aba Caixa de Roda do lado da base (comprimento 100% de l: de -l/2 a +l/2)
    const baseArchX = direction === 'left' ? (-w / 2 - archW / 2) : (w / 2 + archW / 2);
    const baseArchRes = buildCushionMesh(
      { minX: baseArchX - archW / 2, maxX: baseArchX + archW / 2, minZ: -l / 2, maxZ: l / 2 },
      cutoutZones,
      mattressThickness,
      mattressY,
      mattressMat
    );
    if (baseArchRes) {
      baseArchRes.mesh.castShadow = true;
      baseArchRes.mesh.receiveShadow = true;
      const curW = baseArchRes.actualMaxX - baseArchRes.actualMinX;
      const curL = baseArchRes.actualMaxZ - baseArchRes.actualMinZ;
      baseArchRes.mesh.userData = {
        isWoodPart: false,
        isUpholstery: true,
        dimW: curW,
        dimH: mattressThickness,
        dimL: curL,
        thicknessMm: Math.round(mattressThickness * 1000),
        partLabel: \`Almofada Aba Caixa de Roda Base\${baseArchRes.labelSuffix}\`,
        material: upholsteryMat,
        woodMaterial: upholsteryWoodMat,
        category: '🛏️ Estofaria Campervan',
        hasCabinetCutout: baseArchRes.isCutout,
        moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
        partType: 'upholstery'
      };
      container.add(baseArchRes.mesh);
    }

    // 2. Três almofadas centrais dividindo 100% da largura útil da cama
    const centralPartW = bounds.totalW / 3;
    const centralResults: Array<CushionMeshResult | null> = [];
    for (let i = 0; i < 3; i++) {
      const cMinX = direction === 'left'
        ? (bounds.minX + i * centralPartW)
        : (bounds.maxX - (i + 1) * centralPartW);
      const cMaxX = cMinX + centralPartW;

      const cRes = buildCushionMesh(
        { minX: cMinX, maxX: cMaxX, minZ: -l / 2, maxZ: l / 2 },
        cutoutZones,
        mattressThickness,
        mattressY,
        mattressMat
      );
      centralResults.push(cRes);

      if (cRes) {
        cRes.mesh.castShadow = true;
        cRes.mesh.receiveShadow = true;
        const curW = cRes.actualMaxX - cRes.actualMinX;
        const curL = cRes.actualMaxZ - cRes.actualMinZ;
        cRes.mesh.userData = {
          isWoodPart: false,
          isUpholstery: true,
          dimW: curW,
          dimH: mattressThickness,
          dimL: curL,
          thicknessMm: Math.round(mattressThickness * 1000),
          partLabel: \`Almofada Central \${i + 1}/3\${cRes.labelSuffix}\`,
          material: upholsteryMat,
          woodMaterial: upholsteryWoodMat,
          category: '🛏️ Estofaria Campervan',
          hasCabinetCutout: cRes.isCutout,
          moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
          partType: 'upholstery'
        };
        container.add(cRes.mesh);
      }
    }

    // Costura com a 1ª coluna
    if (baseArchRes && centralResults[0]) {
      const baseSeamX = direction === 'left' ? -w / 2 : w / 2;
      const seamMinZ = Math.max(baseArchRes.actualMinZ, centralResults[0].actualMinZ);
      const seamMaxZ = Math.min(baseArchRes.actualMaxZ, centralResults[0].actualMinZ);
      for (const seg of getUncutSeamIntervalsZ(baseSeamX, seamMinZ, seamMaxZ, cutoutZones)) {
        const seamL = seg.maxZ - seg.minZ;
        if (seamL > 0.01) {
          const baseSeamGeo = new THREE.BoxGeometry(0.004, mattressThickness + 0.002, seamL);
          const baseSeamMesh = new THREE.Mesh(baseSeamGeo, seamMat);
          baseSeamMesh.position.set(baseSeamX, mattressY, (seg.minZ + seg.maxZ) / 2);
          container.add(baseSeamMesh);
        }
      }
    }

    // Costuras entre almofadas centrais
    for (let i = 0; i < 2; i++) {
      const cA = centralResults[i];
      const cB = centralResults[i + 1];
      if (cA && cB) {
        const seamX = direction === 'left'
          ? (bounds.minX + (i + 1) * centralPartW)
          : (bounds.maxX - (i + 1) * centralPartW);
        const seamMinZ = Math.max(cA.actualMinZ, cB.actualMinZ);
        const seamMaxZ = Math.min(cA.actualMaxZ, cB.actualMaxZ);
        for (const seg of getUncutSeamIntervalsZ(seamX, seamMinZ, seamMaxZ, cutoutZones)) {
          const seamL = seg.maxZ - seg.minZ;
          if (seamL > 0.01) {
            const seamGeo = new THREE.BoxGeometry(0.004, mattressThickness + 0.002, seamL);
            const seamMesh = new THREE.Mesh(seamGeo, seamMat);
            seamMesh.position.set(seamX, mattressY, (seg.minZ + seg.maxZ) / 2);
            container.add(seamMesh);
          }
        }
      }
    }

    // 3. Aba Caixa de Roda do lado oposto
    const farArchX = direction === 'left' ? (bounds.maxX + archW / 2) : (bounds.minX - archW / 2);
    const farArchRes = buildCushionMesh(
      { minX: farArchX - archW / 2, maxX: farArchX + archW / 2, minZ: -l / 2, maxZ: l / 2 },
      cutoutZones,
      mattressThickness,
      mattressY,
      mattressMat
    );
    if (farArchRes) {
      farArchRes.mesh.castShadow = true;
      farArchRes.mesh.receiveShadow = true;
      const curW = farArchRes.actualMaxX - farArchRes.actualMinX;
      const curL = farArchRes.actualMaxZ - farArchRes.actualMinZ;
      farArchRes.mesh.userData = {
        isWoodPart: false,
        isUpholstery: true,
        dimW: curW,
        dimH: mattressThickness,
        dimL: curL,
        thicknessMm: Math.round(mattressThickness * 1000),
        partLabel: \`Almofada Aba Caixa de Roda Oposta\${farArchRes.labelSuffix}\`,
        material: upholsteryMat,
        woodMaterial: upholsteryWoodMat,
        category: '🛏️ Estofaria Campervan',
        hasCabinetCutout: farArchRes.isCutout,
        moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
        partType: 'upholstery'
      };
      container.add(farArchRes.mesh);
    }

    // Costura com a 3ª coluna
    if (farArchRes && centralResults[2]) {
      const farSeamX = direction === 'left' ? bounds.maxX : bounds.minX;
      const seamMinZ = Math.max(farArchRes.actualMinZ, centralResults[2].actualMinZ);
      const seamMaxZ = Math.min(farArchRes.actualMaxZ, centralResults[2].actualMaxZ);
      for (const seg of getUncutSeamIntervalsZ(farSeamX, seamMinZ, seamMaxZ, cutoutZones)) {
        const seamL = seg.maxZ - seg.minZ;
        if (seamL > 0.01) {
          const farSeamGeo = new THREE.BoxGeometry(0.004, mattressThickness + 0.002, seamL);
          const farSeamMesh = new THREE.Mesh(farSeamGeo, seamMat);
          farSeamMesh.position.set(farSeamX, mattressY, (seg.minZ + seg.maxZ) / 2);
          container.add(farSeamMesh);
        }
      }
    }
  } else {
    // 5 PARTES FECHADAS: 3 almofadas centrais empilhadas + 2 abas dobradas no topo (100% da base)
    const layerH = 0.045;
    const layerResults: Array<CushionMeshResult | null> = [];
    for (let p = 0; p < 3; p++) {
      const layerY = topOfSlatsY + layerH / 2 + p * (layerH + 0.001);
      const mRes = buildCushionMesh(
        { minX: -w / 2, maxX: w / 2, minZ: -l / 2, maxZ: l / 2 },
        cutoutZones,
        layerH,
        layerY,
        mattressMat
      );
      layerResults.push(mRes);

      if (mRes) {
        mRes.mesh.castShadow = true;
        mRes.mesh.receiveShadow = true;
        const curW = mRes.actualMaxX - mRes.actualMinX;
        const curL = mRes.actualMaxZ - mRes.actualMinZ;
        mRes.mesh.userData = {
          isWoodPart: false,
          isUpholstery: true,
          dimW: curW,
          dimH: layerH,
          dimL: curL,
          thicknessMm: Math.round(layerH * 1000),
          partLabel: \`Almofada Central \${p + 1}/3 (5 Partes Modo Sofá)\${mRes.labelSuffix}\`,
          material: \`\${foamLabel} Revestida em Tecido Impermeável 5 Partes\`,
          woodMaterial: upholsteryWoodMat,
          category: '🛏️ Estofaria Campervan',
          hasCabinetCutout: mRes.isCutout,
          moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
          partType: 'upholstery'
        };
        container.add(mRes.mesh);
      }
    }

    for (let p = 0; p < 2; p++) {
      const lA = layerResults[p];
      if (lA) {
        const curW = lA.actualMaxX - lA.actualMinX;
        const curL = lA.actualMaxZ - lA.actualMinZ;
        const seamGeo = new THREE.BoxGeometry(curW + 0.002, 0.002, curL + 0.002);
        const seamMesh = new THREE.Mesh(seamGeo, seamMat);
        const seamCenterZ = (lA.actualMinZ + lA.actualMaxZ) / 2;
        const seamCenterX = (lA.actualMinX + lA.actualMaxX) / 2;
        seamMesh.position.set(seamCenterX, topOfSlatsY + (p + 1) * (layerH + 0.001) - 0.0005, seamCenterZ);
        container.add(seamMesh);
      }
    }

    // 2 Abas de caixa de roda dobradas lado a lado sobre a 3ª almofada central
    const flapThickness = 0.040;
    const flapY = topOfSlatsY + 3 * (layerH + 0.001) + flapThickness / 2;
    for (let p = 0; p < 2; p++) {
      const fx = p === 0 ? -w * 0.25 : w * 0.25;
      const fw = w * 0.5;
      const fl = l;
      const flapRes = buildCushionMesh(
        { minX: fx - fw / 2, maxX: fx + fw / 2, minZ: -fl / 2, maxZ: fl / 2 },
        cutoutZones,
        flapThickness,
        flapY,
        mattressMat
      );
      if (flapRes) {
        flapRes.mesh.castShadow = true;
        flapRes.mesh.receiveShadow = true;
        const curW = flapRes.actualMaxX - flapRes.actualMinX;
        const curL = flapRes.actualMaxZ - flapRes.actualMinZ;
        flapRes.mesh.userData = {
          isWoodPart: false,
          isUpholstery: true,
          dimW: curW,
          dimH: flapThickness,
          dimL: curL,
          thicknessMm: Math.round(flapThickness * 1000),
          partLabel: \`Aba Caixa de Roda Dobrada \${p + 1}/2 (5 Partes Modo Sofá)\${flapRes.labelSuffix}\`,
          material: \`\${foamLabel} Revestida em Tecido Impermeável 5 Partes\`,
          woodMaterial: upholsteryWoodMat,
          category: '🛏️ Estofaria Campervan',
          hasCabinetCutout: flapRes.isCutout,
          moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
          partType: 'upholstery'
        };
        container.add(flapRes.mesh);
      }
    }
  }
}
`;
fs.writeFileSync(fivePartPath, newFivePartContent, 'utf8');
console.log('Updated LateralFivePartMattressBuilder.ts');

console.log('All mattress files successfully updated!');
