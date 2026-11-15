import * as THREE from 'three';
import { BatteryBuilder } from './power/BatteryBuilder';
import { MpptBuilder } from './power/MpptBuilder';
import { B2BChargerBuilder } from './power/B2BChargerBuilder';
import { UsinaChargerBuilder } from './power/UsinaChargerBuilder';
import { WaterTankPipesBuilder, QuarterArcCurve } from './power/WaterTankPipesBuilder';

/**
 * Construtor 3D dos Sistemas de Armazenamento e Gerenciamento Elétrico:
 * Fachada para os builders especializados (Bateria Kingbo, MPPT, B2B, Usina e Tubulação d'Água).
 */
export class PowerStorageBuilder {
  static QuarterArcCurve = QuarterArcCurve;

  static createBatteryMesh(): THREE.Group {
    return BatteryBuilder.createBatteryMesh();
  }

  static buildKingboBattery(targetGroup: THREE.Group, zCenter: number, labelsGroup?: THREE.Group) {
    return BatteryBuilder.buildKingboBattery(targetGroup, zCenter, labelsGroup);
  }

  static createMPPTMesh(options?: { includeCables?: boolean }): THREE.Group {
    return MpptBuilder.createMPPTMesh(options);
  }

  static buildKingboMPPT(targetGroup: THREE.Group, zCenter: number, labelsGroup?: THREE.Group) {
    return MpptBuilder.buildKingboMPPT(targetGroup, zCenter, labelsGroup);
  }

  static createB2BMesh(options?: { includeCables?: boolean }): THREE.Group {
    return B2BChargerBuilder.createB2BMesh(options);
  }

  static buildB2BCharger(targetGroup: THREE.Group, zCenter: number, labelsGroup?: THREE.Group) {
    return B2BChargerBuilder.buildB2BCharger(targetGroup, zCenter, labelsGroup);
  }

  static createUsinaMesh(options?: { includeCables?: boolean }): THREE.Group {
    return UsinaChargerBuilder.createUsinaMesh(options);
  }

  static buildUsinaCharger(targetGroup: THREE.Group, zCenter: number, labelsGroup?: THREE.Group) {
    return UsinaChargerBuilder.buildUsinaCharger(targetGroup, zCenter, labelsGroup);
  }

  static buildWaterTankPipes(
    targetGroup: THREE.Group,
    enabled: boolean,
    lengthMmInput: number,
    baseY: number,
    zCenter: number,
    labelsGroup?: THREE.Group,
    diameterMmInput: number = 200,
    cargoBoxEnabled: boolean = true,
    cargoBoxLengthM: number = 1.60,
    connectionPosition: 'front' | 'rear' = 'front'
  ) {
    return WaterTankPipesBuilder.buildWaterTankPipes(
      targetGroup,
      enabled,
      lengthMmInput,
      baseY,
      zCenter,
      labelsGroup,
      diameterMmInput,
      cargoBoxEnabled,
      cargoBoxLengthM,
      connectionPosition
    );
  }
}
