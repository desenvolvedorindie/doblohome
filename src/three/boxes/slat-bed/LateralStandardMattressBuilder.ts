import * as THREE from 'three';
import { SlatBedDirection } from '../../../types';
import {
  buildCushionMesh,
  CushionMeshResult,
  CushionRect
} from './MattressCushionGeometry';

export function buildLateralStandardMattress(params: {
  container: THREE.Group;
  w: number;
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
}) {
  const {
    container,
    w,
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
    cutoutZones
  } = params;

  if (isExtended) {
    // Cama Aberta: cada uma das parts almofadas cobre exatamente uma subdivisão do grid
    const cushionResults: Array<CushionMeshResult | null> = [];
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
          material: `Espuma D33 Revestida em Tecido Impermeável ${partsName}`,
          woodMaterial: 'Espuma D33 (Colchão)',
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
        if (seamMaxZ > seamMinZ + 0.01) {
          const seamL = seamMaxZ - seamMinZ;
          const seamGeo = new THREE.BoxGeometry(0.004, mattressThickness + 0.002, seamL);
          const seamMesh = new THREE.Mesh(seamGeo, seamMat);
          seamMesh.position.set(seamX, mattressY, (seamMinZ + seamMaxZ) / 2);
          container.add(seamMesh);
        }
      }
    }
  } else {
    // Cama Fechada: almofada(s) empilhadas sobre o estrado fixo no modo sofá
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
          partLabel: `Almofada Inteira Modo Sofá${mRes.labelSuffix}`,
          material: 'Espuma D33 Revestida em Tecido Impermeável',
          woodMaterial: 'Espuma D33 (Colchão)',
          category: '🛏️ Estofaria Campervan',
          hasCabinetCutout: mRes.isCutout,
          moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
          partType: 'upholstery'
        };
        container.add(mRes.mesh);
      }
    } else {
      // As N almofadas empilhadas no modo sofá sobre a base
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
            partLabel: `Almofada ${p + 1}/${parts} (${partsName} Modo Sofá)${mRes.labelSuffix}`,
            material: `Espuma D33 Revestida em Tecido Impermeável ${partsName}`,
            woodMaterial: 'Espuma D33 (Colchão)',
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
