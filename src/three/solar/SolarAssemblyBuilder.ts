import * as THREE from 'three';
import { BaseRackBuilder } from '../BaseRackBuilder';
import { SolarTrayBuilder, TrayDimensions } from '../SolarTrayBuilder';
import { SpacerPostsBuilder } from '../SpacerPosts';
import { PowerStorageBuilder } from '../PowerStorage';
import { DimensionOverlayBuilder } from '../DimensionOverlay';

export class SolarAssemblyBuilder {
  static build(sys: any) {
    sys.clearGroup(sys.fixedFrameGroup);
    sys.clearGroup(sys.upperLayerGroup);
    sys.clearGroup(sys.slidingLayerGroup1);
    sys.clearGroup(sys.slidingLayerGroup2);
    sys.clearGroup(sys.slidingLayerGroup3);
    sys.clearGroup(sys.intermediateRailsGroup1);
    sys.clearGroup(sys.intermediateRailsGroup2);
    sys.clearGroup(sys.intermediateRailsGroup3);
    sys.clearGroup(sys.intermediateRailsGroup4);
    sys.clearGroup(sys.dimensionsGroup);
    sys.clearGroup(sys.cableChainGroup);
    sys.clearGroup(sys.batteryGroup);
    sys.clearGroup(sys.weldGussetsGroup);
    sys.clearGroup(sys.aluminumBracketsGroup);
    sys.clearGroup(sys.mpptGroup);
    sys.clearGroup(sys.b2bGroup);
    sys.clearGroup(sys.usinaGroup);
    sys.clearGroup(sys.waterTankGroup);
    sys.rackMeshes = [];

    // Reset de posições relativas dos grupos
    sys.fixedFrameGroup.position.set(0, 0, 0);
    sys.upperLayerGroup.position.set(0, 0, 0);
    sys.slidingLayerGroup1.position.set(0, 0, 0);
    sys.slidingLayerGroup2.position.set(0, 0, 0);
    sys.slidingLayerGroup3.position.set(0, 0, 0);
    sys.intermediateRailsGroup1.position.set(0, 0, 0);
    sys.intermediateRailsGroup2.position.set(0, 0, 0);
    sys.intermediateRailsGroup3.position.set(0, 0, 0);
    sys.intermediateRailsGroup4.position.set(0, 0, 0);

    // Hierarquia com ou sem baú
    if (sys.cargoBoxConfig && sys.cargoBoxConfig.enabled) {
      if (sys.cargoBoxSystem) {
        sys.cargoBoxSystem.structureMaterial = sys.structureMaterial;
        sys.cargoBoxSystem.steelProfileUnit = sys.steelProfileUnit;
        sys.cargoBoxSystem.aluminumColor = sys.aluminumColor;
        sys.cargoBoxSystem.metalonThickness40 = sys.metalonThickness40;
        sys.cargoBoxSystem.metalonThickness30 = sys.metalonThickness30;
        sys.cargoBoxSystem.updateConfig(
          sys.cargoBoxConfig,
          sys.BASE_Y,
          sys.RACK_OFFSET_Z,
          sys.waterTankConfig.enabled,
          sys.waterTankConfig.diameterMm,
          sys.waterTankConfig.connectionPosition || 'front'
        );
        sys.cargoBoxSystem.group.visible = true;
        if (sys.solarSuperstructureGroup.parent !== sys.cargoBoxSystem.tiltingMountGroup) {
          sys.cargoBoxSystem.tiltingMountGroup.add(sys.solarSuperstructureGroup);
        }
      }
    } else {
      if (sys.cargoBoxSystem) {
        sys.cargoBoxSystem.group.visible = false;
      }
      if (sys.solarSuperstructureGroup.parent !== sys.group) {
        sys.group.add(sys.solarSuperstructureGroup);
      }
    }

    const curBaseY = sys.currentBaseY;
    const yLevel1 = curBaseY + 0.040;
    sys.Y_LEVEL1_LOWER = yLevel1;
    sys.Y_LEVEL1_UPPER = yLevel1;
    sys.Y_LEVEL2 = yLevel1 + 0.070;

    // 1. Dimensões geométricas das bandejas
    const trayDimsL1 = SolarTrayBuilder.calculateTrayDimensions(sys.level1.panels, sys.level1.orientation, sys.PANEL_SPECS);
    const trayDimsL2 = (sys.stackLevels === 2)
      ? SolarTrayBuilder.calculateTrayDimensions(sys.level2.panels, sys.level2.orientation, sys.PANEL_SPECS)
      : trayDimsL1;
    sys.currentTrayDims = trayDimsL2;

    // 2. Rack Base
    BaseRackBuilder.buildBaseRack(
      sys.fixedFrameGroup,
      sys.rackMeshes,
      sys.aluminumBracketsGroup,
      sys.weldGussetsGroup,
      trayDimsL2,
      sys.RACK_OFFSET_Z,
      curBaseY,
      sys.structureMaterial,
      sys.aluminumColor,
      sys.cargoBoxConfig.enabled,
      sys.BASE_Y,
      sys.steelProfileUnit,
      sys.metalonThickness40
    );

    // 3. Empilhamento em andares
    SolarAssemblyBuilder.buildStackStructure(sys, trayDimsL2);

    // 4. Componentes elétricos
    if (!sys.assignedElectronics.has('battery')) {
      PowerStorageBuilder.buildKingboBattery(sys.batteryGroup, sys.RACK_OFFSET_Z, sys.dimensionsGroup);
    }
    if (!sys.assignedElectronics.has('mppt')) {
      PowerStorageBuilder.buildKingboMPPT(sys.mpptGroup, sys.RACK_OFFSET_Z, sys.dimensionsGroup);
    }
    if (!sys.assignedElectronics.has('b2b')) {
      PowerStorageBuilder.buildB2BCharger(sys.b2bGroup, sys.RACK_OFFSET_Z, sys.dimensionsGroup);
    }
    if (!sys.assignedElectronics.has('usina')) {
      PowerStorageBuilder.buildUsinaCharger(sys.usinaGroup, sys.RACK_OFFSET_Z, sys.dimensionsGroup);
    }
    PowerStorageBuilder.buildWaterTankPipes(
      sys.waterTankGroup,
      sys.waterTankConfig.enabled,
      sys.waterTankConfig.lengthMm,
      sys.BASE_Y,
      sys.RACK_OFFSET_Z,
      sys.dimensionsGroup,
      sys.waterTankConfig.diameterMm,
      sys.cargoBoxConfig.enabled,
      sys.cargoBoxConfig.length / 1000,
      sys.waterTankConfig.connectionPosition || 'front'
    );

    // 5. Cotas Técnicas
    DimensionOverlayBuilder.buildDimensionLines(
      sys.dimensionsGroup,
      trayDimsL2,
      sys.RACK_OFFSET_Z,
      curBaseY,
      sys.BASE_PROFILE_H,
      sys.UPPER_TRAY_Y,
      sys.stackLevels,
      sys.panelsPerLevel
    );

    sys.dimensionsGroup.visible = sys.showDimensions;
    sys.cableChainGroup.visible = false;

    sys.updateExpansion(sys.expansionProgress);
    sys.updateExploded(sys.explodedProgress);
  }

  static buildStackStructure(sys: any, dimsL2: TrayDimensions) {
    const zCenter = sys.RACK_OFFSET_Z;
    const yLevel1_Lower = sys.Y_LEVEL1_LOWER;
    const yLevel1_Upper = sys.Y_LEVEL1_UPPER;
    const yLevel2 = sys.Y_LEVEL2;
    sys.UPPER_TRAY_Y = (sys.stackLevels === 2) ? yLevel2 : yLevel1_Upper;

    const baseTopY = sys.currentBaseY + sys.BASE_PROFILE_H / 2;

    // Nível 1
    sys.level1Motion = SolarTrayBuilder.buildLevel(
      1,
      sys.level1,
      yLevel1_Lower,
      yLevel1_Upper,
      sys.slidingLayerGroup1,
      sys.slidingLayerGroup2,
      sys.fixedFrameGroup,
      sys.intermediateRailsGroup1,
      sys.intermediateRailsGroup2,
      dimsL2,
      zCenter,
      baseTopY,
      sys.structureMaterial,
      sys.aluminumColor,
      sys.PANEL_SPECS,
      sys.steelProfileUnit,
      sys.metalonThickness30
    );

    // Nível 2
    if (sys.stackLevels === 2) {
      sys.level2Motion = SolarTrayBuilder.buildLevel(
        2,
        sys.level2,
        yLevel2,
        yLevel2,
        sys.upperLayerGroup,
        sys.slidingLayerGroup3,
        sys.fixedFrameGroup,
        sys.intermediateRailsGroup3,
        sys.intermediateRailsGroup4,
        dimsL2,
        zCenter,
        baseTopY,
        sys.structureMaterial,
        sys.aluminumColor,
        sys.PANEL_SPECS,
        sys.steelProfileUnit,
        sys.metalonThickness30
      );

      SpacerPostsBuilder.addSpacerPosts(
        sys.fixedFrameGroup,
        dimsL2.trayWidth,
        dimsL2.trayLength,
        baseTopY,
        yLevel2,
        zCenter,
        sys.structureMaterial,
        sys.aluminumColor,
        sys.steelProfileUnit,
        sys.metalonThickness30
      );
    } else {
      sys.level2Motion = { dir: 'fixed', travelA: 0, travelB: 0 };
    }
  }
}
