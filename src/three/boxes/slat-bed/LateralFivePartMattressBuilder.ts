import * as THREE from 'three';
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
  const upholsteryMat = `${foamLabel} Revestida em Tecido Impermeável`;
  const upholsteryWoodMat = `${foamLabel} (Colchão)`;

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
        partLabel: `Almofada Aba Caixa de Roda Base${baseArchRes.labelSuffix}`,
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
          partLabel: `Almofada Central ${i + 1}/3${cRes.labelSuffix}`,
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
        partLabel: `Almofada Aba Caixa de Roda Oposta${farArchRes.labelSuffix}`,
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
          partLabel: `Almofada Central ${p + 1}/3 (5 Partes Modo Sofá)${mRes.labelSuffix}`,
          material: `${foamLabel} Revestida em Tecido Impermeável 5 Partes`,
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
          partLabel: `Aba Caixa de Roda Dobrada ${p + 1}/2 (5 Partes Modo Sofá)${flapRes.labelSuffix}`,
          material: `${foamLabel} Revestida em Tecido Impermeável 5 Partes`,
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
