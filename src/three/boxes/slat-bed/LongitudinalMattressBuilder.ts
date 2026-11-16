import * as THREE from 'three';
import { SlatBedDirection } from '../../../types';
import {
  buildCushionMesh,
  CushionMeshResult,
  CushionRect
} from './MattressCushionGeometry';

export function buildLongitudinalMattress(params: {
  container: THREE.Group;
  w: number;
  l: number;
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

  const cushionW = w - 0.016;
  const cushionL = cellL - 0.012; // Cada almofada tem o comprimento de 1 subdivisão longitudinal

  if (isExtended) {
    const cushionResults: Array<CushionMeshResult | null> = [];
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
  } else {
    if (parts === 1) {
      const mRes = buildCushionMesh(
        { minX: -cushionW / 2, maxX: cushionW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
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
          partLabel: `Almofada Longitudinal Inteira Modo Sofá${mRes.labelSuffix}`,
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
          { minX: -cushionW / 2, maxX: cushionW / 2, minZ: -cushionL / 2, maxZ: cushionL / 2 },
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
