import * as THREE from 'three';
import {
  SlideDirection,
  PanelOrientation,
  StructureMaterial,
  AluminumColor,
  SteelProfileUnit,
  StackLevels,
  CargoBoxConfig,
  WaterTankConfig,
  AwningConfig
} from '../types';
import { CargoBoxSystem } from './CargoBox';
import { MotionPlan, TrayDimensions } from './SolarTrayBuilder';
import { AwningSystem } from './AwningSystem';
import { MaterialLibrary } from './Materials';
import {
  DEFAULT_PANEL_SPECS,
  DEFAULT_CARGO_BOX_CONFIG,
  DEFAULT_WATER_TANK_CONFIG,
  DEFAULT_AWNING_CONFIG,
  DEFAULT_LEVEL1_CONFIG,
  DEFAULT_LEVEL2_CONFIG
} from './solar/SolarDefaults';
import { SolarKinematics } from './solar/SolarKinematics';
import { SolarEnergyCalculator } from './solar/SolarEnergyCalculator';
import { SolarAssemblyBuilder } from './solar/SolarAssemblyBuilder';
import { SolarGroupManager } from './solar/SolarGroupManager';

/**
 * Sistema Mecânico do Rack Solar Retrátil para Fiat Doblò
 * Orquestrador principal da cena 3D dos painéis solares, subchassi, baú e cinemática.
 */
export class SolarSystem {
  scene: THREE.Scene;
  group: THREE.Group;
  RACK_OFFSET_Z: number;
  BASE_Y: number;
  BASE_PROFILE_H: number;
  TRAY_PROFILE_H: number;
  DRAWER_STAGE_H: number;
  GAP_THERMAL: number;
  Y_LEVEL1_LOWER: number;
  Y_LEVEL1_UPPER: number;
  Y_LEVEL2: number;
  UPPER_TRAY_Y: number = 0;
  PANEL_SPECS: typeof DEFAULT_PANEL_SPECS;

  stackLevels: StackLevels;
  level1: { panels: number; slideDirection: SlideDirection; orientation: PanelOrientation };
  level2: { panels: number; slideDirection: SlideDirection; orientation: PanelOrientation };
  expansionProgress: number;
  explodedProgress: number;
  structureMaterial: StructureMaterial;
  steelProfileUnit: SteelProfileUnit;
  aluminumColor: AluminumColor;
  metalonColor: string;
  metalonWallThickness: number;
  metalonThickness40: number;
  metalonThickness30: number;
  showDimensions: boolean;
  showCableChain: boolean;
  upperTransparent: boolean;

  cargoBoxConfig: CargoBoxConfig;
  cargoBoxSystem: CargoBoxSystem;
  solarSuperstructureGroup: THREE.Group;
  waterTankConfig: WaterTankConfig;
  waterTankGroup: THREE.Group;
  awningConfig: AwningConfig;
  awningSystem: AwningSystem;

  fixedFrameGroup: THREE.Group;
  upperLayerGroup: THREE.Group;
  slidingLayerGroup1: THREE.Group;
  slidingLayerGroup2: THREE.Group;
  slidingLayerGroup3: THREE.Group;
  intermediateRailsGroup1: THREE.Group;
  intermediateRailsGroup2: THREE.Group;
  intermediateRailsGroup3: THREE.Group;
  intermediateRailsGroup4: THREE.Group;
  dimensionsGroup: THREE.Group;
  cableChainGroup: THREE.Group;
  batteryGroup: THREE.Group;
  weldGussetsGroup: THREE.Group;
  aluminumBracketsGroup: THREE.Group;
  mpptGroup: THREE.Group;
  b2bGroup: THREE.Group;
  usinaGroup: THREE.Group;
  assignedElectronics: Set<string> = new Set();
  slidingLayers: THREE.Group[];
  rackMeshes: THREE.Mesh[];
  currentTrayDims?: TrayDimensions;
  groupOffsetZ?: number;
  groupOffsetY?: number;

  level1Motion?: MotionPlan;
  level2Motion?: MotionPlan;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = "SolarSystem";
    this.scene.add(this.group);

    this.RACK_OFFSET_Z = +0.40;
    this.BASE_Y = 2.06;
    this.BASE_PROFILE_H = 0.040;
    this.TRAY_PROFILE_H = 0.030;
    this.DRAWER_STAGE_H = 0.060;
    this.GAP_THERMAL = 0.035;

    this.cargoBoxConfig = { ...DEFAULT_CARGO_BOX_CONFIG };
    this.waterTankConfig = { ...DEFAULT_WATER_TANK_CONFIG };
    this.awningConfig = { ...DEFAULT_AWNING_CONFIG };
    this.PANEL_SPECS = { ...DEFAULT_PANEL_SPECS };

    const curBaseY = this.currentBaseY;
    const yLevel1 = curBaseY + 0.040;
    this.Y_LEVEL1_LOWER = yLevel1;
    this.Y_LEVEL1_UPPER = yLevel1;
    this.Y_LEVEL2 = yLevel1 + 0.070;

    this.stackLevels = 2;
    this.level1 = { ...DEFAULT_LEVEL1_CONFIG };
    this.level2 = { ...DEFAULT_LEVEL2_CONFIG };

    this.expansionProgress = 0.0;
    this.explodedProgress = 0.0;
    this.structureMaterial = 'aluminum';
    this.steelProfileUnit = 'mm';
    this.aluminumColor = 'silver';
    this.metalonColor = '#333b47';
    this.metalonWallThickness = 1.5;
    this.metalonThickness40 = 2.0;
    this.metalonThickness30 = 1.5;
    this.showDimensions = true;
    this.showCableChain = false;
    this.upperTransparent = false;

    SolarGroupManager.createGroups(this);

    this.cargoBoxSystem = new CargoBoxSystem(
      this.cargoBoxConfig,
      this.BASE_Y,
      this.RACK_OFFSET_Z,
      this.structureMaterial,
      this.aluminumColor,
      this.steelProfileUnit,
      this.waterTankConfig.enabled,
      this.waterTankConfig.diameterMm,
      this.metalonThickness40,
      this.metalonThickness30,
      this.waterTankConfig.connectionPosition || 'front'
    );
    this.group.add(this.cargoBoxSystem.group);

    this.awningSystem = new AwningSystem(
      this.awningConfig,
      this.BASE_Y,
      this.RACK_OFFSET_Z
    );
    this.group.add(this.awningSystem.group);

    this.buildSystem();
  }

  get currentBaseY(): number {
    if (this.cargoBoxConfig && this.cargoBoxConfig.enabled) {
      const boxH = (this.cargoBoxConfig.height || 330) / 1000;
      const isTelescopic = (this.cargoBoxConfig.isTelescopic !== false);
      const maxLiftM = isTelescopic ? Math.max(0.06, boxH - 0.10) : 0;
      const liftM = isTelescopic ? Math.min(maxLiftM, Math.max(0, (this.cargoBoxConfig.verticalLiftMm || 0) / 1000)) : 0;
      return this.BASE_Y + this.BASE_PROFILE_H / 2 + boxH + 0.015 + 0.008 + liftM;
    }
    return this.BASE_Y;
  }

  get panelsPerLevel(): number {
    return this.level1 ? this.level1.panels : 2;
  }

  setStackLevels(levels: any) {
    const l = parseInt(levels, 10);
    if (l === 1 || l === 2) {
      this.stackLevels = l as StackLevels;
      this.buildSystem();
    }
  }

  setLevel1Panels(count: any) {
    const c = parseInt(count, 10);
    if ([1, 2, 3, 4].includes(c)) {
      this.level1.panels = c;
      this.buildSystem();
    }
  }

  setLevel1Direction(direction: any) {
    if (['longitudinal', 'lateral', 'fixed', 'rear_only', 'front_only'].includes(direction)) {
      this.level1.slideDirection = direction;
      this.buildSystem();
    }
  }

  setLevel1Orientation(orientation: any) {
    if (['longitudinal', 'transverse'].includes(orientation)) {
      this.level1.orientation = orientation;
      this.buildSystem();
    }
  }

  setLevel2Panels(count: any) {
    const c = parseInt(count, 10);
    if ([1, 2, 3, 4].includes(c)) {
      this.level2.panels = c;
      this.buildSystem();
    }
  }

  setLevel2Direction(direction: any) {
    if (['longitudinal', 'lateral', 'fixed', 'rear_only', 'front_only'].includes(direction)) {
      this.level2.slideDirection = direction;
      this.buildSystem();
    }
  }

  setLevel2Orientation(orientation: any) {
    if (['longitudinal', 'transverse'].includes(orientation)) {
      this.level2.orientation = orientation;
      this.buildSystem();
    }
  }

  setStructureMaterial(type: any) {
    if (['aluminum', 'aluminum_tube', 'steel'].includes(type)) {
      this.structureMaterial = type;
      this.buildSystem();
    }
  }

  setSteelProfileUnit(unit: SteelProfileUnit) {
    if (['mm', 'inch'].includes(unit)) {
      this.steelProfileUnit = unit;
      if (this.structureMaterial === 'steel') {
        this.buildSystem();
      }
    }
  }

  setAluminumColor(color: any) {
    if (['silver', 'black'].includes(color)) {
      this.aluminumColor = color;
      if (this.structureMaterial === 'aluminum' || this.structureMaterial === 'aluminum_tube') {
        this.buildSystem();
      }
    }
  }

  setMetalonColor(color: string) {
    this.metalonColor = color;
    if (MaterialLibrary.materials.weldedSteelMetalon) {
      MaterialLibrary.materials.weldedSteelMetalon.color = new THREE.Color(color);
      MaterialLibrary.materials.weldedSteelMetalon.needsUpdate = true;
    }
  }

  setMetalonThickness(thickness40: number, thickness30?: number) {
    this.metalonThickness40 = thickness40;
    if (thickness30 !== undefined) {
      this.metalonThickness30 = thickness30;
    }
    if (this.cargoBoxSystem) {
      this.cargoBoxSystem.metalonThickness40 = this.metalonThickness40;
      this.cargoBoxSystem.metalonThickness30 = this.metalonThickness30;
    }
    this.buildSystem();
  }

  setPanelSpecs(specs: Partial<typeof this.PANEL_SPECS>) {
    this.PANEL_SPECS = { ...this.PANEL_SPECS, ...specs };
    this.buildSystem();
  }

  setCableChainVisible(visible: boolean) {
    this.showCableChain = visible;
    this.cableChainGroup.visible = visible;
  }

  setDimensionsVisible(visible: boolean) {
    this.showDimensions = visible;
    this.dimensionsGroup.visible = visible;
  }

  setUpperTransparency(transparent: boolean) {
    this.upperTransparent = transparent;
    this.upperLayerGroup.traverse((child: any) => {
      if (child.isMesh && child.material) {
        if (transparent) {
          if (!child.userData.origMaterial) {
            child.userData.origMaterial = child.material;
          }
          child.material = MaterialLibrary.materials.transparentGhost;
        } else if (child.userData.origMaterial) {
          child.material = child.userData.origMaterial;
        }
      }
    });
  }

  setGroupOffsetZ(z: number) {
    this.groupOffsetZ = z;
    this.group.position.z = z;
  }

  setGroupOffsetY(y: number) {
    this.groupOffsetY = y;
    this.group.position.y = y;
  }

  setCargoBox(config: Partial<CargoBoxConfig>) {
    this.cargoBoxConfig = { ...this.cargoBoxConfig, ...config };
    const isTelescopic = (this.cargoBoxConfig.isTelescopic !== false);
    if (!isTelescopic) {
      this.cargoBoxConfig.verticalLiftMm = 0;
    } else {
      const maxLiftMm = Math.max(60, Math.floor(((this.cargoBoxConfig.height || 330) - 100) / 10) * 10);
      if ((this.cargoBoxConfig.verticalLiftMm || 0) > maxLiftMm) {
        this.cargoBoxConfig.verticalLiftMm = maxLiftMm;
      }
    }
    this.buildSystem();
  }

  setCargoBoxTelescopic(isTelescopic: boolean) {
    this.cargoBoxConfig.isTelescopic = isTelescopic;
    if (!isTelescopic) {
      this.cargoBoxConfig.verticalLiftMm = 0;
    }
    this.buildSystem();
  }

  setCargoBoxVerticalLift(liftMm: number) {
    const isTelescopic = (this.cargoBoxConfig.isTelescopic !== false);
    if (!isTelescopic) {
      this.cargoBoxConfig.verticalLiftMm = 0;
    } else {
      const maxLiftMm = Math.max(60, Math.floor(((this.cargoBoxConfig.height || 330) - 100) / 10) * 10);
      this.cargoBoxConfig.verticalLiftMm = Math.max(0, Math.min(maxLiftMm, liftMm));
    }
    this.buildSystem();
  }

  setCargoBoxEnabled(enabled: boolean) {
    this.cargoBoxConfig.enabled = enabled;
    this.buildSystem();
  }

  setCargoBoxDimensions(length: number, width: number, height: number) {
    this.cargoBoxConfig.length = length;
    this.cargoBoxConfig.width = width;
    this.cargoBoxConfig.height = height;
    this.buildSystem();
  }

  setCargoBoxHingeSide(side: 'driver' | 'passenger') {
    this.cargoBoxConfig.hingeSide = side;
    this.buildSystem();
  }

  setTiltAngle(angleDeg: number) {
    this.cargoBoxConfig.tiltAngle = angleDeg;
    if (this.cargoBoxSystem) {
      this.cargoBoxSystem.setTiltAngle(angleDeg);
    }
  }

  setBoxLidAngle(angleDeg: number) {
    this.cargoBoxConfig.lidAngle = angleDeg;
    if (this.cargoBoxSystem) {
      this.cargoBoxSystem.setLidAngle(angleDeg);
    }
  }

  setWaterTank(config: Partial<WaterTankConfig>) {
    this.waterTankConfig = { ...this.waterTankConfig, ...config };
    this.buildSystem();
  }

  setAwningConfig(config: Partial<AwningConfig>) {
    this.awningConfig = { ...this.awningConfig, ...config };
    if (this.awningSystem) {
      this.awningSystem.baseY = this.BASE_Y;
      this.awningSystem.rackOffsetZ = this.RACK_OFFSET_Z;
      this.awningSystem.setConfig(this.awningConfig);
    }
  }

  setAssignedElectronics(assigned: Set<string>) {
    let changed = false;
    if (this.assignedElectronics.size !== assigned.size) {
      changed = true;
    } else {
      for (const id of assigned) {
        if (!this.assignedElectronics.has(id)) {
          changed = true;
          break;
        }
      }
    }
    if (changed) {
      this.assignedElectronics = new Set(assigned);
      this.buildSystem();
    }
  }

  buildSystem() {
    SolarAssemblyBuilder.build(this);
  }

  updateExpansion(progress: number) {
    this.expansionProgress = Math.max(0.0, Math.min(1.0, progress));

    SolarKinematics.applyLevelMotion(
      this.level1,
      this.level1Motion,
      this.slidingLayerGroup1,
      this.slidingLayerGroup2,
      this.intermediateRailsGroup1,
      this.intermediateRailsGroup2,
      this.expansionProgress
    );

    if (this.stackLevels === 2) {
      SolarKinematics.applyLevelMotion(
        this.level2,
        this.level2Motion,
        this.upperLayerGroup,
        this.slidingLayerGroup3,
        this.intermediateRailsGroup3,
        this.intermediateRailsGroup4,
        this.expansionProgress
      );
    } else {
      if (this.upperLayerGroup) this.upperLayerGroup.position.set(0, 0, 0);
      if (this.slidingLayerGroup3) this.slidingLayerGroup3.position.set(0, 0, 0);
      if (this.intermediateRailsGroup3) this.intermediateRailsGroup3.position.set(0, 0, 0);
      if (this.intermediateRailsGroup4) this.intermediateRailsGroup4.position.set(0, 0, 0);
    }
  }

  updateExploded(progress: number) {
    this.explodedProgress = Math.max(0.0, Math.min(1.0, progress));
    SolarKinematics.updateExploded(this.explodedProgress, {
      upperLayerGroup: this.upperLayerGroup,
      slidingLayerGroup3: this.slidingLayerGroup3,
      intermediateRailsGroup3: this.intermediateRailsGroup3,
      intermediateRailsGroup4: this.intermediateRailsGroup4,
      slidingLayerGroup1: this.slidingLayerGroup1,
      intermediateRailsGroup1: this.intermediateRailsGroup1,
      slidingLayerGroup2: this.slidingLayerGroup2,
      intermediateRailsGroup2: this.intermediateRailsGroup2
    });
  }

  getEnergyStats() {
    return SolarEnergyCalculator.calculate({
      level1: this.level1,
      level2: this.level2,
      stackLevels: this.stackLevels,
      expansionProgress: this.expansionProgress,
      structureMaterial: this.structureMaterial,
      steelProfileUnit: this.steelProfileUnit,
      panelSpecs: this.PANEL_SPECS
    });
  }

  getCargoBoxEngineeringSpecs() {
    if (!this.cargoBoxSystem) return null;
    const stats = this.getEnergyStats();
    return this.cargoBoxSystem.calculateEngineeringSpecs(parseFloat(stats.weightTotal));
  }

  clearGroup(grp: THREE.Group) {
    SolarGroupManager.clearGroup(grp);
  }
}
