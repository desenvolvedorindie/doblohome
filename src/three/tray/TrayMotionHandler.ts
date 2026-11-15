import * as THREE from 'three';
import { TelescopicRailsBuilder } from '../TelescopicRails';
import { StructureMaterial, AluminumColor, SteelProfileUnit, PanelOrientation } from '../../types';
import { TrayDimensions, MotionPlan } from './TrayTypes';
import { TrayLevelBuilder } from './TrayLevelBuilder';

export interface LevelConfigParam {
  panels: number;
  slideDirection: any;
  orientation: PanelOrientation;
}

export class TrayMotionHandler {
  static buildLongitudinal(
    calcDims: (count: number, orient: PanelOrientation, specs: any) => TrayDimensions,
    panels: number,
    orient: PanelOrientation,
    panelSpecs: any,
    zCenter: number,
    yLevelUnified: number,
    levelNumber: number,
    targetGroupA: THREE.Group,
    targetGroupB: THREE.Group,
    fixedFrameGroup: THREE.Group,
    interGroup1: THREE.Group,
    interGroup2: THREE.Group,
    baseTopY: number,
    structureMaterial: StructureMaterial,
    aluminumColor: AluminumColor,
    steelProfileUnit: SteelProfileUnit,
    metalonThickness: number
  ): MotionPlan {
    let frontCount = 0;
    let rearCount = 0;
    if (panels === 1) { frontCount = 0; rearCount = 1; }
    else if (panels === 2) { frontCount = 1; rearCount = 1; }
    else if (panels === 3) { frontCount = 2; rearCount = 1; }
    else if (panels === 4) { frontCount = 2; rearCount = 2; }

    const yFront = yLevelUnified;
    const yRear = yLevelUnified;
    let travelFront = 0;
    let travelRear = 0;

    if (frontCount > 0 && rearCount > 0) {
      const frontDims = calcDims(frontCount, orient, panelSpecs);
      const rearDims = calcDims(rearCount, orient, panelSpecs);
      const centerGap = 0.02; // 20mm entre gavetas no centro

      const zStartFront = zCenter + (centerGap / 2) + (frontDims.trayLength / 2);
      const zStartRear = zCenter - (centerGap / 2) - (rearDims.trayLength / 2);

      TrayLevelBuilder.buildTrayLevel(
        targetGroupA,
        frontDims,
        0,
        yFront,
        zStartFront,
        levelNumber,
        `Nível ${levelNumber} (Gaveta Dianteira)`,
        structureMaterial,
        aluminumColor,
        panelSpecs.thickness,
        panelSpecs,
        steelProfileUnit,
        metalonThickness
      );
      TelescopicRailsBuilder.addLongitudinalRails(
        fixedFrameGroup,
        interGroup1,
        targetGroupA,
        frontDims.trayWidth,
        frontDims.trayLength,
        0,
        yFront,
        zStartFront,
        +1,
        baseTopY
      );
      travelFront = Math.max(0.20, frontDims.trayLength + 0.10);

      TrayLevelBuilder.buildTrayLevel(
        targetGroupB,
        rearDims,
        0,
        yRear,
        zStartRear,
        levelNumber,
        `Nível ${levelNumber} (Gaveta Traseira)`,
        structureMaterial,
        aluminumColor,
        panelSpecs.thickness,
        panelSpecs,
        steelProfileUnit,
        metalonThickness
      );
      TelescopicRailsBuilder.addLongitudinalRails(
        fixedFrameGroup,
        interGroup2,
        targetGroupB,
        rearDims.trayWidth,
        rearDims.trayLength,
        0,
        yRear,
        zStartRear,
        -1,
        baseTopY
      );
      travelRear = Math.max(0.20, rearDims.trayLength + 0.10);

      return { dir: 'longitudinal', travelA: travelFront, travelB: travelRear };
    }

    if (frontCount > 0) {
      const frontDims = calcDims(frontCount, orient, panelSpecs);
      const zStartFront = zCenter;
      TrayLevelBuilder.buildTrayLevel(
        targetGroupA,
        frontDims,
        0,
        yFront,
        zStartFront,
        levelNumber,
        `Nível ${levelNumber} (Gaveta Dianteira)`,
        structureMaterial,
        aluminumColor,
        panelSpecs.thickness,
        panelSpecs,
        steelProfileUnit,
        metalonThickness
      );
      TelescopicRailsBuilder.addLongitudinalRails(
        fixedFrameGroup,
        interGroup1,
        targetGroupA,
        frontDims.trayWidth,
        frontDims.trayLength,
        0,
        yFront,
        zStartFront,
        +1,
        baseTopY
      );
      travelFront = Math.max(0.20, frontDims.trayLength + 0.14);
    }

    if (rearCount > 0) {
      const rearDims = calcDims(rearCount, orient, panelSpecs);
      const zStartRear = zCenter;
      TrayLevelBuilder.buildTrayLevel(
        targetGroupB,
        rearDims,
        0,
        yRear,
        zStartRear,
        levelNumber,
        `Nível ${levelNumber} (Gaveta Traseira)`,
        structureMaterial,
        aluminumColor,
        panelSpecs.thickness,
        panelSpecs,
        steelProfileUnit,
        metalonThickness
      );
      TelescopicRailsBuilder.addLongitudinalRails(
        fixedFrameGroup,
        interGroup2,
        targetGroupB,
        rearDims.trayWidth,
        rearDims.trayLength,
        0,
        yRear,
        zStartRear,
        -1,
        baseTopY
      );
      travelRear = Math.max(0.20, rearDims.trayLength + 0.14);
    }

    return { dir: 'longitudinal', travelA: travelFront, travelB: travelRear };
  }

  static buildLateral(
    calcDims: (count: number, orient: PanelOrientation, specs: any) => TrayDimensions,
    panels: number,
    orient: PanelOrientation,
    panelSpecs: any,
    zCenter: number,
    yLevelUnified: number,
    levelNumber: number,
    targetGroupA: THREE.Group,
    targetGroupB: THREE.Group,
    fixedFrameGroup: THREE.Group,
    interGroup1: THREE.Group,
    interGroup2: THREE.Group,
    baseTopY: number,
    structureMaterial: StructureMaterial,
    aluminumColor: AluminumColor,
    steelProfileUnit: SteelProfileUnit,
    metalonThickness: number
  ): MotionPlan {
    let leftCount = 0;
    let rightCount = 0;
    if (panels === 1) { leftCount = 0; rightCount = 1; }
    else if (panels === 2) { leftCount = 1; rightCount = 1; }
    else if (panels === 3) { leftCount = 2; rightCount = 1; }
    else if (panels === 4) { leftCount = 2; rightCount = 2; }

    const yLeft = yLevelUnified;
    const yRight = yLevelUnified;
    let travelLeft = 0;
    let travelRight = 0;

    if (leftCount > 0 && rightCount > 0) {
      const leftDims = calcDims(leftCount, orient, panelSpecs);
      const rightDims = calcDims(rightCount, orient, panelSpecs);
      const centerGapX = 0.02; // 20mm entre gavetas laterais
      const xStartLeft = - (centerGapX / 2) - (leftDims.trayWidth / 2);
      const xStartRight = + (centerGapX / 2) + (rightDims.trayWidth / 2);

      TrayLevelBuilder.buildTrayLevel(
        targetGroupA,
        leftDims,
        xStartLeft,
        yLeft,
        zCenter,
        levelNumber,
        `Nível ${levelNumber} (Gaveta Esquerda)`,
        structureMaterial,
        aluminumColor,
        panelSpecs.thickness,
        panelSpecs,
        steelProfileUnit,
        metalonThickness
      );
      TelescopicRailsBuilder.addLateralRails(
        fixedFrameGroup,
        interGroup1,
        targetGroupA,
        leftDims.trayWidth,
        leftDims.trayLength,
        xStartLeft,
        yLeft,
        zCenter,
        -1,
        baseTopY
      );
      travelLeft = Math.max(0.20, leftDims.trayWidth + 0.10);

      TrayLevelBuilder.buildTrayLevel(
        targetGroupB,
        rightDims,
        xStartRight,
        yRight,
        zCenter,
        levelNumber,
        `Nível ${levelNumber} (Gaveta Direita)`,
        structureMaterial,
        aluminumColor,
        panelSpecs.thickness,
        panelSpecs,
        steelProfileUnit,
        metalonThickness
      );
      TelescopicRailsBuilder.addLateralRails(
        fixedFrameGroup,
        interGroup2,
        targetGroupB,
        rightDims.trayWidth,
        rightDims.trayLength,
        xStartRight,
        yRight,
        zCenter,
        +1,
        baseTopY
      );
      travelRight = Math.max(0.20, rightDims.trayWidth + 0.10);

      return { dir: 'lateral', travelA: travelLeft, travelB: travelRight };
    }

    if (leftCount > 0) {
      const leftDims = calcDims(leftCount, orient, panelSpecs);
      const xStartLeft = 0;
      TrayLevelBuilder.buildTrayLevel(
        targetGroupA,
        leftDims,
        xStartLeft,
        yLeft,
        zCenter,
        levelNumber,
        `Nível ${levelNumber} (Gaveta Esquerda)`,
        structureMaterial,
        aluminumColor,
        panelSpecs.thickness,
        panelSpecs,
        steelProfileUnit,
        metalonThickness
      );
      TelescopicRailsBuilder.addLateralRails(
        fixedFrameGroup,
        interGroup1,
        targetGroupA,
        leftDims.trayWidth,
        leftDims.trayLength,
        xStartLeft,
        yLeft,
        zCenter,
        -1,
        baseTopY
      );
      travelLeft = Math.max(0.20, leftDims.trayWidth + 0.14);
    }

    if (rightCount > 0) {
      const rightDims = calcDims(rightCount, orient, panelSpecs);
      const xStartRight = 0;
      TrayLevelBuilder.buildTrayLevel(
        targetGroupB,
        rightDims,
        xStartRight,
        yRight,
        zCenter,
        levelNumber,
        `Nível ${levelNumber} (Gaveta Direita)`,
        structureMaterial,
        aluminumColor,
        panelSpecs.thickness,
        panelSpecs,
        steelProfileUnit,
        metalonThickness
      );
      TelescopicRailsBuilder.addLateralRails(
        fixedFrameGroup,
        interGroup2,
        targetGroupB,
        rightDims.trayWidth,
        rightDims.trayLength,
        xStartRight,
        yRight,
        zCenter,
        +1,
        baseTopY
      );
      travelRight = Math.max(0.20, rightDims.trayWidth + 0.14);
    }

    return { dir: 'lateral', travelA: travelLeft, travelB: travelRight };
  }

  static buildUniDirectional(
    dir: 'rear_only' | 'front_only',
    calcDims: (count: number, orient: PanelOrientation, specs: any) => TrayDimensions,
    panels: number,
    orient: PanelOrientation,
    panelSpecs: any,
    zCenter: number,
    yLevel: number,
    l2Length: number,
    levelNumber: number,
    targetGroup: THREE.Group,
    fixedFrameGroup: THREE.Group,
    interGroup: THREE.Group,
    baseTopY: number,
    structureMaterial: StructureMaterial,
    aluminumColor: AluminumColor,
    steelProfileUnit: SteelProfileUnit,
    metalonThickness: number
  ): MotionPlan {
    const dims = calcDims(panels, orient, panelSpecs);
    if (dir === 'rear_only') {
      const upperRearEdgeZ = zCenter - (l2Length / 2);
      const zStartRear = upperRearEdgeZ + (dims.trayLength / 2);
      TrayLevelBuilder.buildTrayLevel(
        targetGroup,
        dims,
        0,
        yLevel,
        zStartRear,
        levelNumber,
        `Nível ${levelNumber} (Extensão Traseira)`,
        structureMaterial,
        aluminumColor,
        panelSpecs.thickness,
        panelSpecs,
        steelProfileUnit,
        metalonThickness
      );
      TelescopicRailsBuilder.addLongitudinalRails(
        fixedFrameGroup,
        interGroup,
        targetGroup,
        dims.trayWidth,
        dims.trayLength,
        0,
        yLevel,
        zStartRear,
        -1,
        baseTopY
      );
      const travel = Math.max(0.20, dims.trayLength + 0.14);
      return { dir: 'rear_only', travelA: 0, travelB: travel };
    } else {
      const upperFrontEdgeZ = zCenter + (l2Length / 2);
      const zStartFront = upperFrontEdgeZ - (dims.trayLength / 2);
      TrayLevelBuilder.buildTrayLevel(
        targetGroup,
        dims,
        0,
        yLevel,
        zStartFront,
        levelNumber,
        `Nível ${levelNumber} (Extensão Dianteira)`,
        structureMaterial,
        aluminumColor,
        panelSpecs.thickness,
        panelSpecs,
        steelProfileUnit,
        metalonThickness
      );
      TelescopicRailsBuilder.addLongitudinalRails(
        fixedFrameGroup,
        interGroup,
        targetGroup,
        dims.trayWidth,
        dims.trayLength,
        0,
        yLevel,
        zStartFront,
        +1,
        baseTopY
      );
      const travel = Math.max(0.20, dims.trayLength + 0.14);
      return { dir: 'front_only', travelA: travel, travelB: 0 };
    }
  }
}
