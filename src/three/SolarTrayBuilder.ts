import * as THREE from 'three';
import { StructureMaterial, AluminumColor, SlideDirection, PanelOrientation, SteelProfileUnit } from '../types';
import { TrayDimensions, MotionPlan } from './tray/TrayTypes';
import { TrayLevelBuilder } from './tray/TrayLevelBuilder';
import { TrayMotionHandler } from './tray/TrayMotionHandler';

export type { TrayDimensions, MotionPlan };

/**
 * Construtor das Bandejas e Níveis de Painéis Solares
 * Calcula dimensões paramétricas, monta quadros perimetrais e despacha o planejamento de movimento.
 */
export class SolarTrayBuilder {
  /**
   * Determina largura e comprimento de cada bandeja de acordo com
   * a orientação física da placa e o número de placas por andar.
   */
  static calculateTrayDimensions(
    panelCount: number = 2,
    orientation: PanelOrientation = 'longitudinal',
    panelSpecs = { width: 0.60, length: 1.00 }
  ): TrayDimensions {
    const pW = (orientation === 'longitudinal') ? panelSpecs.width : panelSpecs.length;
    const pL = (orientation === 'longitudinal') ? panelSpecs.length : panelSpecs.width;

    let cols = 1;
    let rows = 1;

    if (panelCount === 1) {
      cols = 1;
      rows = 1;
    } else if (panelCount === 2) {
      if (orientation === 'longitudinal') {
        cols = 2; // 2 placas de 60cm lado a lado = 1.20m de largura útil
        rows = 1;
      } else {
        cols = 1; // 1 placa de 1.00m de largura cruzada
        rows = 2; // 2 placas em fila = 1.20m de comprimento
      }
    } else if (panelCount === 3) {
      if (orientation === 'longitudinal') {
        cols = 2;
        rows = 2;
      } else {
        cols = 1;
        rows = 3;
      }
    } else if (panelCount === 4) {
      cols = 2;
      rows = 2;
    }

    const gapCol = (cols > 1) ? 0.030 : 0.0;
    const gapRow = (rows > 1) ? 0.030 : 0.0;
    const marginFrame = 0.08;
    const trayWidth = (cols * pW) + ((cols - 1) * gapCol) + marginFrame;
    const trayLength = (rows * pL) + ((rows - 1) * gapRow) + marginFrame;

    return {
      panelW: pW,
      panelL: pL,
      cols,
      rows,
      panelCount,
      trayWidth: Math.max(0.68, trayWidth),
      trayLength: Math.max(0.68, trayLength)
    };
  }

  /**
   * Constrói uma bandeja individual com quadro e os painéis solares flexíveis instalados.
   */
  static buildTrayLevel(
    targetGroup: THREE.Group,
    trayDims: TrayDimensions,
    xCenter: number,
    yLevel: number,
    zCenter: number,
    levelIndex: number,
    labelText: string,
    structureMaterial: StructureMaterial = 'aluminum',
    aluminumColor: AluminumColor = 'silver',
    panelThickness: number = 0.003,
    panelSpecs?: any,
    steelProfileUnit: SteelProfileUnit = 'mm',
    metalonThickness: number = 1.5
  ) {
    return TrayLevelBuilder.buildTrayLevel(
      targetGroup,
      trayDims,
      xCenter,
      yLevel,
      zCenter,
      levelIndex,
      labelText,
      structureMaterial,
      aluminumColor,
      panelThickness,
      panelSpecs,
      steelProfileUnit,
      metalonThickness
    );
  }

  /**
   * Constrói um nível completo (Nível 1 ou 2) configurando bandejas e perfis guia c/ parafusos deslizantes
   */
  static buildLevel(
    levelNumber: number,
    levelConfig: { panels: number; slideDirection: SlideDirection; orientation: PanelOrientation },
    yLower: number,
    yUpper: number,
    targetGroupA: THREE.Group,
    targetGroupB: THREE.Group,
    fixedFrameGroup: THREE.Group,
    interGroup1: THREE.Group,
    interGroup2: THREE.Group,
    refL2Dims: any,
    zCenter: number,
    baseTopY: number,
    structureMaterial: StructureMaterial,
    aluminumColor: AluminumColor,
    panelSpecs: { width: number; length: number; thickness: number },
    steelProfileUnit: SteelProfileUnit = 'mm',
    metalonThickness: number = 1.5
  ): MotionPlan {
    const panels = (levelConfig && levelConfig.panels) ? levelConfig.panels : 2;
    const orient = (levelConfig && levelConfig.orientation) ? levelConfig.orientation : 'longitudinal';
    const dir = (levelConfig && levelConfig.slideDirection)
      ? levelConfig.slideDirection
      : (levelNumber === 1 ? 'longitudinal' : 'fixed');

    const l2Length = refL2Dims ? refL2Dims.trayLength : 1.08;

    if (dir === 'fixed') {
      const dims = this.calculateTrayDimensions(panels, orient, panelSpecs);
      const yFixed = (levelNumber === 2) ? yUpper : yLower;
      this.buildTrayLevel(
        targetGroupA,
        dims,
        0,
        yFixed,
        zCenter,
        levelNumber,
        `Nível ${levelNumber} (Fixo)`,
        structureMaterial,
        aluminumColor,
        panelSpecs.thickness,
        panelSpecs,
        steelProfileUnit,
        metalonThickness
      );
      return { dir: 'fixed', travelA: 0, travelB: 0 };
    }

    if (dir === 'longitudinal') {
      return TrayMotionHandler.buildLongitudinal(
        this.calculateTrayDimensions.bind(this),
        panels,
        orient,
        panelSpecs,
        zCenter,
        yLower,
        levelNumber,
        targetGroupA,
        targetGroupB,
        fixedFrameGroup,
        interGroup1,
        interGroup2,
        baseTopY,
        structureMaterial,
        aluminumColor,
        steelProfileUnit,
        metalonThickness
      );
    }

    if (dir === 'lateral') {
      return TrayMotionHandler.buildLateral(
        this.calculateTrayDimensions.bind(this),
        panels,
        orient,
        panelSpecs,
        zCenter,
        yLower,
        levelNumber,
        targetGroupA,
        targetGroupB,
        fixedFrameGroup,
        interGroup1,
        interGroup2,
        baseTopY,
        structureMaterial,
        aluminumColor,
        steelProfileUnit,
        metalonThickness
      );
    }

    if (dir === 'rear_only') {
      return TrayMotionHandler.buildUniDirectional(
        'rear_only',
        this.calculateTrayDimensions.bind(this),
        panels,
        orient,
        panelSpecs,
        zCenter,
        yLower,
        l2Length,
        levelNumber,
        targetGroupB,
        fixedFrameGroup,
        interGroup2,
        baseTopY,
        structureMaterial,
        aluminumColor,
        steelProfileUnit,
        metalonThickness
      );
    }

    if (dir === 'front_only') {
      return TrayMotionHandler.buildUniDirectional(
        'front_only',
        this.calculateTrayDimensions.bind(this),
        panels,
        orient,
        panelSpecs,
        zCenter,
        yUpper,
        l2Length,
        levelNumber,
        targetGroupA,
        fixedFrameGroup,
        interGroup1,
        baseTopY,
        structureMaterial,
        aluminumColor,
        steelProfileUnit,
        metalonThickness
      );
    }

    return { dir: 'fixed', travelA: 0, travelB: 0 };
  }
}
