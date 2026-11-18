const fs = require('fs');
const path = require('path');

// 1. SlatBedMattressBuilder.ts
const mattressBuilderPath = path.resolve('src/three/boxes/SlatBedMattressBuilder.ts');
const newMattressBuilderContent = `import * as THREE from 'three';
import { InternalBoxItem, InternalGridConfig, SlatBedDirection, getMattressFoamName } from '../../types';
import { collectMattressCutoutZones } from './slat-bed/MattressCushionGeometry';
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

    if (direction === 'left' || direction === 'right') {
      const gridWidthM = grid ? grid.widthMm / 1000 : (cellWM ? cellWM * 3 : w * 2);
      const cellW =
        parts === 4
          ? gridWidthM / 4
          : parts === 3 || parts === 5
            ? gridWidthM / 3
            : (cellWM || w);

      // O colchão ocupa 100% da área da cama (sem subtrair folgas arbitrárias de 12mm ou 16mm)
      const cushionW = cellW;
      const cushionL = l;

      if (parts === 5) {
        buildLateralFivePartMattress({
          container,
          w,
          l,
          direction,
          isExtended,
          cellW,
          cushionW,
          cushionL,
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
          cellW,
          cushionW,
          cushionL,
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
      const gridLengthM = grid ? grid.lengthMm / 1000 : (cellLM ? cellLM * 4 : l * 2);
      const cellL =
        parts === 4
          ? gridLengthM / 4
          : parts === 3
            ? gridLengthM / 3
            : (cellLM || l);

      buildLongitudinalMattress({
        container,
        w,
        l,
        box,
        direction,
        isExtended,
        parts,
        partsName,
        cellL,
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
  cellW: number;
  cushionW: number;
  cushionL: number;
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
    box,
    direction,
    isExtended,
    parts,
    partsName,
    cellW,
    cushionW,
    cushionL,
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

    if (parts === 2 && box.bedMode === 'hinged') {
      // Cama com dobradiça de 2 partes:
      // Folha dobrável limitada logicamente ao tamanho configurado
      const leafW = Math.min(w, Math.max(Math.min(0.10, w), (box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : w)));
      const hingeGap = 0.003;

      // Parte 1: 100% sobre o tampo fixo base [-w/2, w/2]
      // Parte 2: 100% sobre a folha dobrável aberta
      const ranges = direction === 'left'
        ? [
            { minX: -w / 2, maxX: w / 2 },
            { minX: w / 2, maxX: w / 2 + hingeGap + leafW }
          ]
        : [
            { minX: -w / 2, maxX: w / 2 },
            { minX: -w / 2 - hingeGap - leafW, maxX: -w / 2 }
          ];

      for (let i = 0; i < 2; i++) {
        const rng = ranges[i];
        const cRes = buildCushionMesh(
          { minX: rng.minX, maxX: rng.maxX, minZ: -cushionL / 2, maxZ: cushionL / 2 },
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

      // Costura na divisão da dobradiça
      const seamX = direction === 'left' ? w / 2 : -w / 2;
      const cA = cushionResults[0];
      const cB = cushionResults[1];
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
    } else {
      // Modo padrão (Ripas ou N partes): cada almofada cobre exatamente uma subdivisão de cellW (100% de cobertura)
      for (let i = 0; i < parts; i++) {
        const pieceCenterX = direction === 'left'
          ? (-w / 2 + (i + 0.5) * cellW)
          : (w / 2 - (i + 0.5) * cellW);

        const cRes = buildCushionMesh(
          { minX: pieceCenterX - cushionW / 2, maxX: pieceCenterX + cushionW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
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

      for (let i = 0; i < parts - 1; i++) {
        const cA = cushionResults[i];
        const cB = cushionResults[i + 1];
        if (cA && cB) {
          const seamX = direction === 'left'
            ? (-w / 2 + (i + 1) * cellW)
            : (w / 2 - (i + 1) * cellW);
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
    }
  } else {
    // Cama Fechada: almofada(s) cobrem 100% da base no modo sofá [-w/2, w/2] x [-l/2, l/2]
    const closedW = w;
    const closedL = l;

    if (parts === 1) {
      const mRes = buildCushionMesh(
        { minX: -closedW / 2, maxX: closedW / 2, minZ: -closedL / 2, maxZ: closedL / 2 },
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
          { minX: -closedW / 2, maxX: closedW / 2, minZ: -closedL / 2, maxZ: closedL / 2 },
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

export function buildLongitudinalMattress(params: {
  container: THREE.Group;
  w: number;
  l: number;
  box: InternalBoxItem;
  direction: SlatBedDirection;
  isExtended: boolean;
  parts: number;
  partsName: string;
  cellL: number;
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
    box,
    direction,
    isExtended,
    parts,
    partsName,
    cellL,
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

  // 100% da largura do módulo (sem subtrair 16mm)
  const cushionW = w;
  const cushionL = cellL;

  if (isExtended) {
    const cushionResults: Array<CushionMeshResult | null> = [];

    if (parts === 2 && box.bedMode === 'hinged') {
      const leafL = Math.min(l, Math.max(Math.min(0.10, l), (box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : l)));
      const hingeGap = 0.003;

      const ranges = direction === 'front'
        ? [
            { minZ: -l / 2, maxZ: l / 2 },
            { minZ: l / 2, maxZ: l / 2 + hingeGap + leafL }
          ]
        : [
            { minZ: -l / 2, maxZ: l / 2 },
            { minZ: -l / 2 - hingeGap - leafL, maxZ: -l / 2 }
          ];

      for (let i = 0; i < 2; i++) {
        const rng = ranges[i];
        const cRes = buildCushionMesh(
          { minX: -cushionW / 2, maxX: cushionW / 2, minZ: rng.minZ, maxZ: rng.maxZ },
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

      const seamZ = direction === 'front' ? l / 2 : -l / 2;
      const cA = cushionResults[0];
      const cB = cushionResults[1];
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
    } else {
      for (let i = 0; i < parts; i++) {
        const pieceCenterZ = direction === 'front'
          ? (-l / 2 + (i + 0.5) * cellL)
          : (l / 2 - (i + 0.5) * cellL);

        const cRes = buildCushionMesh(
          { minX: -cushionW / 2, maxX: cushionW / 2, minZ: pieceCenterZ - cushionL / 2, maxZ: pieceCenterZ + cushionL / 2 },
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

      for (let i = 0; i < parts - 1; i++) {
        const cA = cushionResults[i];
        const cB = cushionResults[i + 1];
        if (cA && cB) {
          const pieceCenterZ = direction === 'front'
            ? (-l / 2 + (i + 1) * cellL)
            : (l / 2 - (i + 1) * cellL);
          const seamMinX = Math.max(cA.actualMinX, cB.actualMinX);
          const seamMaxX = Math.min(cA.actualMaxX, cB.actualMaxX);
          if (seamMaxX > seamMinX + 0.01) {
            const seamW = seamMaxX - seamMinX;
            const seamGeo = new THREE.BoxGeometry(seamW, mattressThickness + 0.002, 0.004);
            const seamMesh = new THREE.Mesh(seamGeo, seamMat);
            seamMesh.position.set((seamMinX + seamMaxX) / 2, mattressY, pieceCenterZ);
            container.add(seamMesh);
          }
        }
      }
    }
  } else {
    // Cama Fechada: 100% da base [-w/2, w/2] x [-l/2, l/2]
    const closedW = w;
    const closedL = l;

    if (parts === 1) {
      const mRes = buildCushionMesh(
        { minX: -closedW / 2, maxX: closedW / 2, minZ: -closedL / 2, maxZ: closedL / 2 },
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
          { minX: -closedW / 2, maxX: closedW / 2, minZ: -closedL / 2, maxZ: closedL / 2 },
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
  cellW: number;
  cushionW: number;
  cushionL: number;
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
    cellW,
    cushionW,
    cushionL,
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
      { minX: baseArchX - archW / 2, maxX: baseArchX + archW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
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

    // 2. Três almofadas centrais cobrindo 100% da largura útil sem gaps
    const centralResults: Array<CushionMeshResult | null> = [];
    for (let i = 0; i < 3; i++) {
      const pieceCenterX = direction === 'left'
        ? (-w / 2 + (i + 0.5) * cellW)
        : (w / 2 - (i + 0.5) * cellW);

      const cRes = buildCushionMesh(
        { minX: pieceCenterX - cushionW / 2, maxX: pieceCenterX + cushionW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
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
          ? (-w / 2 + (i + 1) * cellW)
          : (w / 2 - (i + 1) * cellW);
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
    const farArchX = direction === 'left' ? (-w / 2 + 3 * cellW + archW / 2) : (w / 2 - 3 * cellW - archW / 2);
    const farArchRes = buildCushionMesh(
      { minX: farArchX - archW / 2, maxX: farArchX + archW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
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
      const farSeamX = direction === 'left' ? (-w / 2 + 3 * cellW) : (w / 2 - 3 * cellW);
      const seamMinZ = Math.max(farArchRes.actualMinZ, centralResults[2].actualMinZ);
      const seamMaxZ = Math.min(farArchRes.actualMaxZ, centralResults[2].actualMinZ);
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
    // 5 PARTES FECHADAS: 100% da base [-w/2, w/2] x [-l/2, l/2]
    const closedW = w;
    const closedL = l;
    const layerH = 0.045;
    const layerResults: Array<CushionMeshResult | null> = [];
    for (let p = 0; p < 3; p++) {
      const layerY = topOfSlatsY + layerH / 2 + p * (layerH + 0.001);
      const mRes = buildCushionMesh(
        { minX: -closedW / 2, maxX: closedW / 2, minZ: -closedL / 2, maxZ: closedL / 2 },
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
      const fx = p === 0 ? -closedW * 0.25 : closedW * 0.25;
      const fw = closedW * 0.5;
      const fl = closedL;
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

// 5. Update tests/slatBedMattress.test.ts assertion for 100% full length
const testPath = path.resolve('tests/slatBedMattress.test.ts');
let testContent = fs.readFileSync(testPath, 'utf8');
testContent = testContent.replace(
  "expect((baseArch.userData as any).dimL).toBeCloseTo(1.423, 2);",
  "expect((baseArch.userData as any).dimL).toBeCloseTo(1.431, 2);"
);
fs.writeFileSync(testPath, testContent, 'utf8');
console.log('Updated tests/slatBedMattress.test.ts');
