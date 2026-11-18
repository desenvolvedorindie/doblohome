import * as THREE from 'three';
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
  const upholsteryWoodMat = `${foamLabel} (Colchão)`;

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
            partLabel: `Almofada Longitudinal ${i + 1}/2 (${partsName})${cRes.labelSuffix}`,
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
            partLabel: `Almofada Longitudinal ${i + 1}/${parts} (${partsName})${cRes.labelSuffix}`,
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
            partLabel: `Almofada Longitudinal ${p + 1}/${parts} (${partsName} Modo Sofá)${mRes.labelSuffix}`,
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
