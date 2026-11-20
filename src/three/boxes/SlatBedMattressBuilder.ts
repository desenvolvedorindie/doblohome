import * as THREE from 'three';
import { InternalBoxItem, InternalGridConfig, SlatBedDirection, getMattressFoamName } from '../../types';
import { collectMattressCutoutZones } from './slat-bed/MattressCushionGeometry';
import { buildLateralFivePartMattress } from './slat-bed/LateralFivePartMattressBuilder';
import { buildLateralStandardMattress } from './slat-bed/LateralStandardMattressBuilder';
import { buildLongitudinalMattress } from './slat-bed/LongitudinalMattressBuilder';
import {
  collectEffectiveGlobalGroups,
  computeAllVehicleMattressSubparts
} from '../../utils/mattressGrouping';

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
    const isHinged = box.bedMode === 'hinged';
    const topOfSlatsY = (isHinged && !isExtended) ? (h / 2 + slatT) : (h / 2);

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

    // Resolve grupos conectados globais (grid.mattressMergedGroups) + legados (box.mattressMergedGroups):
    // - Grupos totalmente dentro deste módulo são fundidos aqui
    // - Subpartes pertencentes a grupos cross-módulo são puladas aqui e construídas unificadas pelo InternalBoxesBuilder
    let effectiveMergedGroups: number[][] | undefined = box.mattressMergedGroups;
    const skipSubpartIndices = new Set<number>();

    if (isExtended && grid?.mattressMergedGroups && grid.mattressMergedGroups.length > 0 && allBoxes && allBoxes.length > 0) {
      const allSubparts = computeAllVehicleMattressSubparts(grid, allBoxes, 0);
      const effectiveGlobal = collectEffectiveGlobalGroups(allSubparts, grid.mattressMergedGroups, allBoxes);
      const sameBoxGroups: number[][] = [];
      for (const grp of effectiveGlobal) {
        const parsed = grp.map((id) => {
          const sep = id.lastIndexOf('::');
          return { boxId: id.slice(0, sep), idx: parseInt(id.slice(sep + 2), 10) };
        });
        const involvesThisBox = parsed.some((p) => p.boxId === box.id);
        if (!involvesThisBox) continue;
        const allSameBox = parsed.every((p) => p.boxId === box.id);
        if (allSameBox) {
          sameBoxGroups.push(parsed.map((p) => p.idx).sort((a, b) => a - b));
        } else {
          parsed.filter((p) => p.boxId === box.id).forEach((p) => skipSubpartIndices.add(p.idx));
        }
      }
      effectiveMergedGroups = sameBoxGroups.length > 0 ? sameBoxGroups : undefined;
    }

    const effectiveBox = effectiveMergedGroups !== box.mattressMergedGroups
      ? { ...box, mattressMergedGroups: effectiveMergedGroups }
      : box;

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
          foamName,
          mergedGroups: effectiveBox.mattressMergedGroups,
          skipSubpartIndices
        });
      } else {
        buildLateralStandardMattress({
          container,
          w,
          l,
          box: effectiveBox,
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
          foamName,
          skipSubpartIndices
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
        box: effectiveBox,
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
      });
    }
  }
}
