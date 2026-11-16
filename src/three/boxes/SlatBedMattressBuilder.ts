import * as THREE from 'three';
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
    const { container, w, l, h, box, slatT, direction, isExtended, cellWM, cellLM, allBoxes, grid } = params;
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
      ? 'Inteiro'
      : parts === 3
        ? 'Tripartido'
        : parts === 5
          ? '5 Partes (Total c/ Caixas de Roda)'
          : parts === 4
            ? 'Quadripartido'
            : 'Bipartido';
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
      const cellW = cellWM || w;
      const cushionW = cellW - 0.012;
      const cushionL = l - 0.016;

      if (parts === 5) {
        buildLateralFivePartMattress({
          container,
          w,
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
      const cellL = cellLM || l;
      buildLongitudinalMattress({
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
      });
    }
  }
}
