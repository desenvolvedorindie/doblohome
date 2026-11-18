import * as THREE from 'three';
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
  const upholsteryWoodMat = `${foamLabel} (Colchão)`;

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
            partLabel: `Almofada ${i + 1}/2 (${partsName})${cRes.labelSuffix}`,
            material: `${foamLabel} Revestida em Tecido Impermeável ${partsName}`,
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
            partLabel: `Almofada ${i + 1}/${parts} (${partsName})${cRes.labelSuffix}`,
            material: `${foamLabel} Revestida em Tecido Impermeável ${partsName}`,
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
          partLabel: `Almofada Inteira Modo Sofá${mRes.labelSuffix}`,
          material: `${foamLabel} Revestida em Tecido Impermeável`,
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
            partLabel: `Almofada ${p + 1}/${parts} (${partsName} Modo Sofá)${mRes.labelSuffix}`,
            material: `${foamLabel} Revestida em Tecido Impermeável ${partsName}`,
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
