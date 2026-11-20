import * as THREE from 'three';
import { InternalBoxItem, SlatBedDirection } from '../../../types';
import { buildMattressPartitions, getPartitionLabel } from '../../../utils/mattressGrouping';
import {
  addGroupJunctionDetailsToCushion,
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
  skipSubpartIndices?: Set<number>;
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
    foamName,
    skipSubpartIndices
  } = params;

  const foamLabel = foamName || 'Espuma D33';
  const upholsteryWoodMat = `${foamLabel} (Colchão)`;

  // 100% da largura do módulo (sem subtrair 16mm)
  const cushionW = w;
  const cushionL = cellL;

  if (isExtended) {
    const baseIntervalsZ: Array<{ minZ: number; maxZ: number }> = [];

    if (parts === 2 && box.bedMode === 'hinged') {
      const leafL = Math.min(l, Math.max(Math.min(0.10, l), (box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : l)));
      const hingeGap = 0.003;
      if (direction === 'front') {
        baseIntervalsZ.push({ minZ: -l / 2, maxZ: l / 2 });
        baseIntervalsZ.push({ minZ: l / 2, maxZ: l / 2 + hingeGap + leafL });
      } else {
        baseIntervalsZ.push({ minZ: -l / 2, maxZ: l / 2 });
        baseIntervalsZ.push({ minZ: -l / 2 - hingeGap - leafL, maxZ: -l / 2 });
      }
    } else {
      for (let i = 0; i < parts; i++) {
        const pieceCenterZ = direction === 'front'
          ? (-l / 2 + (i + 0.5) * cellL)
          : (l / 2 - (i + 0.5) * cellL);
        baseIntervalsZ.push({ minZ: pieceCenterZ - cushionL / 2, maxZ: pieceCenterZ + cushionL / 2 });
      }
    }

    const partitions = buildMattressPartitions(parts, box.mattressMergedGroups);
    const partitionResults: Array<CushionMeshResult | null> = [];
    const partitionBounds: Array<{ minZ: number; maxZ: number }> = [];

    partitions.forEach((partition) => {
      if (skipSubpartIndices && partition.indices.every((idx) => skipSubpartIndices.has(idx))) {
        partitionBounds.push({ minZ: 0, maxZ: 0 });
        partitionResults.push(null);
        return;
      }
      const minZ = Math.min(...partition.indices.map((idx) => baseIntervalsZ[idx].minZ));
      const maxZ = Math.max(...partition.indices.map((idx) => baseIntervalsZ[idx].maxZ));
      partitionBounds.push({ minZ, maxZ });

      const cRes = buildCushionMesh(
        { minX: -cushionW / 2, maxX: cushionW / 2, minZ, maxZ },
        cutoutZones,
        mattressThickness,
        mattressY,
        mattressMat
      );
      partitionResults.push(cRes);

      if (cRes) {
        cRes.mesh.castShadow = true;
        cRes.mesh.receiveShadow = true;
        const curW = cRes.actualMaxX - cRes.actualMinX;
        const curL = cRes.actualMaxZ - cRes.actualMinZ;
        const baseLabel = getPartitionLabel(partition, parts, direction, partsName);
        cRes.mesh.userData = {
          isWoodPart: false,
          isUpholstery: true,
          dimW: curW,
          dimH: mattressThickness,
          dimL: curL,
          thicknessMm: Math.round(mattressThickness * 1000),
          partLabel: `${baseLabel}${cRes.labelSuffix}`,
          material: `${foamLabel} Revestida em Tecido Impermeável ${partsName}`,
          woodMaterial: upholsteryWoodMat,
          category: '🛏️ Estofaria Campervan',
          hasCabinetCutout: cRes.isCutout,
          moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
          partType: 'upholstery',
          mattressSubpartIndices: partition.indices,
          isMergedMattressGroup: partition.isMerged
        };
        if (partition.isMerged) {
          const memberRects = partition.indices.map((idx) => ({
            minX: -cushionW / 2,
            maxX: cushionW / 2,
            minZ: baseIntervalsZ[idx].minZ,
            maxZ: baseIntervalsZ[idx].maxZ
          }));
          addGroupJunctionDetailsToCushion(cRes, memberRects, cutoutZones, mattressThickness);
        }
        container.add(cRes.mesh);
      }
    });

    // Costuras apenas entre partições separadas
    for (let p = 0; p < partitions.length - 1; p++) {
      const cA = partitionResults[p];
      const cB = partitionResults[p + 1];
      if (cA && cB) {
        const seamZ = direction === 'front' ? partitionBounds[p].maxZ : partitionBounds[p].minZ;
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
