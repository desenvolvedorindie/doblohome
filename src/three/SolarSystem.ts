import * as THREE from 'three';
import { SlideDirection, PanelOrientation, StructureMaterial, AluminumColor, StackLevels, CargoBoxConfig } from '../types';
import { CargoBoxSystem } from './CargoBox';
import { BaseRackBuilder } from './BaseRackBuilder';
import { SolarTrayBuilder, MotionPlan, TrayDimensions } from './SolarTrayBuilder';
import { SpacerPostsBuilder } from './SpacerPosts';
import { PowerStorageBuilder } from './PowerStorage';
import { DimensionOverlayBuilder } from './DimensionOverlay';

/**
 * Sistema Mecânico do Rack Solar Retrátil para Fiat Doblò
 * 
 * Orquestrador principal da cena 3D:
 * - Painéis Solares Flexíveis de 100W monocristalinos
 * - Empilhamento em 1 ou 2 níveis (fixo ou telescópico)
 * - Subchassi base inferior e baú de teto Motobul Off Road
 * - Basculamento por dobradiças industriais inox e pistões a gás dinâmicos
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
  PANEL_SPECS: {
    width: number;
    length: number;
    thickness: number;
    weightKg: number;
    powerWatts: number;
    voc: number;
    vmp: number;
    isc: number;
    imp: number;
  };

  stackLevels: StackLevels;
  level1: { panels: number; slideDirection: SlideDirection; orientation: PanelOrientation };
  level2: { panels: number; slideDirection: SlideDirection; orientation: PanelOrientation };
  expansionProgress: number;
  explodedProgress: number;
  structureMaterial: StructureMaterial;
  aluminumColor: AluminumColor;
  showDimensions: boolean;
  showCableChain: boolean;
  upperTransparent: boolean;

  // Baú de Teto Motobul Off Road & Mecanismo Basculante
  cargoBoxConfig: CargoBoxConfig;
  cargoBoxSystem: CargoBoxSystem;
  solarSuperstructureGroup: THREE.Group;

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

    // Parâmetros de alinhamento na Fiat Doblò
    this.RACK_OFFSET_Z = +0.40; // Z positivo = dianteira do teto
    this.BASE_Y = 2.06;         // Eleva para assentar nas calhas acima do teto

    // Parâmetros de perfis e folgas (em metros)
    this.BASE_PROFILE_H = 0.040; // 40 mm (Rack base)
    this.TRAY_PROFILE_H = 0.030; // 30 mm (Bandejas)
    this.DRAWER_STAGE_H = 0.060; // Espaçamento vertical útil de gaveta
    this.GAP_THERMAL = 0.035;   // Folga térmica

    // Configuração do Baú de Teto (padrão 1600mm x 1000mm x 330mm)
    this.cargoBoxConfig = {
      enabled: true,
      length: 1600,
      width: 1000,
      height: 330,
      hingeSide: 'driver',
      tiltAngle: 0,
      lidAngle: 0
    };

    const curBaseY = this.currentBaseY;
    this.Y_LEVEL1_LOWER = curBaseY + 0.045;
    this.Y_LEVEL1_UPPER = curBaseY + 0.105;
    this.Y_LEVEL2 = curBaseY + 0.175;

    // Especificações do Painel Solar Flexível 100W
    this.PANEL_SPECS = {
      width: 0.60,
      length: 1.00,
      thickness: 0.003,
      weightKg: 1.6,
      powerWatts: 100,
      voc: 22.28,
      vmp: 18.2,
      isc: 5.8,
      imp: 5.5
    };

    this.stackLevels = 2;

    this.level1 = {
      panels: 2,
      slideDirection: 'longitudinal',
      orientation: 'longitudinal'
    };

    this.level2 = {
      panels: 2,
      slideDirection: 'fixed',
      orientation: 'longitudinal'
    };

    this.expansionProgress = 0.0;
    this.explodedProgress = 0.0;
    this.structureMaterial = 'aluminum';
    this.aluminumColor = 'silver';
    this.showDimensions = true;
    this.showCableChain = false;
    this.upperTransparent = false;

    // Grupos estruturais
    this.fixedFrameGroup = new THREE.Group();
    this.upperLayerGroup = new THREE.Group();
    this.slidingLayerGroup1 = new THREE.Group();
    this.slidingLayerGroup2 = new THREE.Group();
    this.slidingLayerGroup3 = new THREE.Group();
    this.intermediateRailsGroup1 = new THREE.Group();
    this.intermediateRailsGroup2 = new THREE.Group();
    this.intermediateRailsGroup3 = new THREE.Group();
    this.intermediateRailsGroup4 = new THREE.Group();
    this.dimensionsGroup = new THREE.Group();
    this.cableChainGroup = new THREE.Group();
    this.batteryGroup = new THREE.Group();
    this.weldGussetsGroup = new THREE.Group();
    this.aluminumBracketsGroup = new THREE.Group();
    this.mpptGroup = new THREE.Group();
    this.b2bGroup = new THREE.Group();
    this.usinaGroup = new THREE.Group();

    // Superestrutura basculante (elementos que giram nas dobradiças)
    this.solarSuperstructureGroup = new THREE.Group();
    this.solarSuperstructureGroup.name = "SolarSuperstructure";

    this.solarSuperstructureGroup.add(this.fixedFrameGroup);
    this.solarSuperstructureGroup.add(this.upperLayerGroup);
    this.solarSuperstructureGroup.add(this.slidingLayerGroup1);
    this.solarSuperstructureGroup.add(this.slidingLayerGroup2);
    this.solarSuperstructureGroup.add(this.slidingLayerGroup3);
    this.solarSuperstructureGroup.add(this.intermediateRailsGroup1);
    this.solarSuperstructureGroup.add(this.intermediateRailsGroup2);
    this.solarSuperstructureGroup.add(this.intermediateRailsGroup3);
    this.solarSuperstructureGroup.add(this.intermediateRailsGroup4);
    this.solarSuperstructureGroup.add(this.dimensionsGroup);
    this.solarSuperstructureGroup.add(this.cableChainGroup);
    this.solarSuperstructureGroup.add(this.weldGussetsGroup);
    this.solarSuperstructureGroup.add(this.aluminumBracketsGroup);

    // Bateria, MPPT, Carregador DC-DC B2B e Fonte Usina ancorados no interior do veículo
    this.group.add(this.batteryGroup);
    this.group.add(this.mpptGroup);
    this.group.add(this.b2bGroup);
    this.group.add(this.usinaGroup);

    // Subsistema 3D do Baú Motobul e Articulação
    this.cargoBoxSystem = new CargoBoxSystem(
      this.cargoBoxConfig,
      this.BASE_Y,
      this.RACK_OFFSET_Z,
      this.structureMaterial,
      this.aluminumColor
    );
    this.group.add(this.cargoBoxSystem.group);

    this.slidingLayers = [
      this.slidingLayerGroup1,
      this.slidingLayerGroup2,
      this.slidingLayerGroup3
    ];

    this.rackMeshes = [];

    this.buildSystem();
  }

  // --- SETTERS DE CONFIGURAÇÃO PARAMÉTRICA ---

  get panelsPerLevel() {
    return this.level1.panels;
  }
  set panelsPerLevel(val: any) {
    const v = parseInt(val);
    if (![1, 2, 3, 4].includes(v)) return;
    this.level1.panels = v;
    this.level2.panels = v;
  }

  get slideDirection() {
    return this.level2.slideDirection;
  }
  set slideDirection(val: SlideDirection) {
    this.level2.slideDirection = val;
  }

  get panelOrientation() {
    return this.level1.orientation;
  }
  set panelOrientation(val: PanelOrientation) {
    this.level1.orientation = val;
    this.level2.orientation = val;
  }

  get currentMode() {
    return `stack_${this.stackLevels}L_N1(${this.level1.panels}P_${this.level1.orientation})_N2(${this.level2.panels}P_${this.level2.slideDirection})`;
  }

  setStackLevels(levels: any) {
    const val = parseInt(levels) as StackLevels;
    if (this.stackLevels === val || ![1, 2].includes(val)) return;
    this.stackLevels = val;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  setLevel1Panels(count: any) {
    const val = parseInt(count);
    if (![1, 2, 3, 4].includes(val)) return;
    this.level1.panels = val;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  setLevel1Direction(direction: any) {
    if (!['longitudinal', 'lateral', 'fixed', 'rear_only', 'front_only'].includes(direction)) return;
    this.level1.slideDirection = direction;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  setLevel1Orientation(orientation: any) {
    if (!['longitudinal', 'transverse'].includes(orientation)) return;
    this.level1.orientation = orientation;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  setLevel2Panels(count: any) {
    const val = parseInt(count);
    if (![1, 2, 3, 4].includes(val)) return;
    this.level2.panels = val;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  setLevel2Direction(direction: any) {
    if (!['longitudinal', 'lateral', 'fixed', 'rear_only', 'front_only'].includes(direction)) return;
    this.level2.slideDirection = direction;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  setLevel2Orientation(orientation: any) {
    if (!['longitudinal', 'transverse'].includes(orientation)) return;
    this.level2.orientation = orientation;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  setStructureMaterial(type: any) {
    if (this.structureMaterial === type) return;
    this.structureMaterial = type;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  setAluminumColor(color: any) {
    if (this.aluminumColor === color) return;
    this.aluminumColor = color;
    if (this.structureMaterial === 'aluminum') {
      this.buildSystem();
      this.updateExpansion(this.expansionProgress);
      this.updateExploded(this.explodedProgress);
    }
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
          child.material = child.userData.origMaterial.clone();
          child.material.transparent = true;
          child.material.opacity = 0.35;
          child.material.needsUpdate = true;
        } else if (child.userData.origMaterial) {
          child.material = child.userData.origMaterial;
          child.material.needsUpdate = true;
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

  get currentBaseY(): number {
    if (this.cargoBoxConfig && this.cargoBoxConfig.enabled) {
      return this.BASE_Y + this.BASE_PROFILE_H + (this.cargoBoxConfig.height / 1000) + 0.02;
    }
    return this.BASE_Y;
  }

  // --- CONTROLES DO BAÚ DE TETO & BASCULAMENTO ---

  setCargoBox(config: Partial<CargoBoxConfig>) {
    this.cargoBoxConfig = { ...this.cargoBoxConfig, ...config };
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
  }

  setCargoBoxEnabled(enabled: boolean) {
    this.cargoBoxConfig.enabled = enabled;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
  }

  setCargoBoxDimensions(length: number, width: number, height: number) {
    this.cargoBoxConfig.length = length;
    this.cargoBoxConfig.width = width;
    this.cargoBoxConfig.height = height;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
  }

  setCargoBoxHingeSide(side: 'driver' | 'passenger') {
    this.cargoBoxConfig.hingeSide = side;
    this.buildSystem();
    this.updateExpansion(this.expansionProgress);
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

  // --- RECONSTRUÇÃO DO SISTEMA COMPLETO ---

  buildSystem() {
    this.clearGroup(this.fixedFrameGroup);
    this.clearGroup(this.upperLayerGroup);
    this.clearGroup(this.slidingLayerGroup1);
    this.clearGroup(this.slidingLayerGroup2);
    this.clearGroup(this.slidingLayerGroup3);
    this.clearGroup(this.intermediateRailsGroup1);
    this.clearGroup(this.intermediateRailsGroup2);
    this.clearGroup(this.intermediateRailsGroup3);
    this.clearGroup(this.intermediateRailsGroup4);
    this.clearGroup(this.dimensionsGroup);
    this.clearGroup(this.cableChainGroup);
    this.clearGroup(this.batteryGroup);
    this.clearGroup(this.weldGussetsGroup);
    this.clearGroup(this.aluminumBracketsGroup);
    this.clearGroup(this.mpptGroup);
    this.clearGroup(this.b2bGroup);
    this.clearGroup(this.usinaGroup);
    this.rackMeshes = [];

    // Reset de posições relativas dos grupos
    this.fixedFrameGroup.position.set(0, 0, 0);
    this.upperLayerGroup.position.set(0, 0, 0);
    this.slidingLayerGroup1.position.set(0, 0, 0);
    this.slidingLayerGroup2.position.set(0, 0, 0);
    this.slidingLayerGroup3.position.set(0, 0, 0);
    this.intermediateRailsGroup1.position.set(0, 0, 0);
    this.intermediateRailsGroup2.position.set(0, 0, 0);
    this.intermediateRailsGroup3.position.set(0, 0, 0);
    this.intermediateRailsGroup4.position.set(0, 0, 0);

    // Reorganiza a hierarquia conforme o baú está ativo ou inativo
    if (this.cargoBoxConfig && this.cargoBoxConfig.enabled) {
      if (this.cargoBoxSystem) {
        this.cargoBoxSystem.structureMaterial = this.structureMaterial;
        this.cargoBoxSystem.aluminumColor = this.aluminumColor;
        this.cargoBoxSystem.updateConfig(this.cargoBoxConfig, this.BASE_Y, this.RACK_OFFSET_Z);
        this.cargoBoxSystem.group.visible = true;
        if (this.solarSuperstructureGroup.parent !== this.cargoBoxSystem.tiltingMountGroup) {
          this.cargoBoxSystem.tiltingMountGroup.add(this.solarSuperstructureGroup);
        }
      }
    } else {
      if (this.cargoBoxSystem) {
        this.cargoBoxSystem.group.visible = false;
      }
      if (this.solarSuperstructureGroup.parent !== this.group) {
        this.group.add(this.solarSuperstructureGroup);
      }
    }

    const curBaseY = this.currentBaseY;
    this.Y_LEVEL1_LOWER = curBaseY + 0.045;
    this.Y_LEVEL1_UPPER = curBaseY + 0.105;
    this.Y_LEVEL2 = curBaseY + 0.175;

    // 1. Dimensões geométricas das bandejas
    const trayDimsL1 = SolarTrayBuilder.calculateTrayDimensions(this.level1.panels, this.level1.orientation, this.PANEL_SPECS);
    const trayDimsL2 = (this.stackLevels === 2)
      ? SolarTrayBuilder.calculateTrayDimensions(this.level2.panels, this.level2.orientation, this.PANEL_SPECS)
      : trayDimsL1;
    this.currentTrayDims = trayDimsL2;

    // 2. Constrói o Rack Base
    BaseRackBuilder.buildBaseRack(
      this.fixedFrameGroup,
      this.rackMeshes,
      this.aluminumBracketsGroup,
      this.weldGussetsGroup,
      trayDimsL2,
      this.RACK_OFFSET_Z,
      curBaseY,
      this.structureMaterial,
      this.aluminumColor,
      this.cargoBoxConfig.enabled,
      this.BASE_Y
    );

    // 3. Constrói os Níveis e Gavetas Telescópicas
    this.buildStackStructure(trayDimsL2);

    // 4. Bateria LiFePO4 Kingbo 560Ah, MPPT 60A, Carregador DC-DC B2B1230 30A e Usina Smart Connect
    PowerStorageBuilder.buildKingboBattery(this.batteryGroup, this.RACK_OFFSET_Z, this.dimensionsGroup);
    PowerStorageBuilder.buildKingboMPPT(this.mpptGroup, this.RACK_OFFSET_Z, this.dimensionsGroup);
    PowerStorageBuilder.buildB2BCharger(this.b2bGroup, this.RACK_OFFSET_Z, this.dimensionsGroup);
    PowerStorageBuilder.buildUsinaCharger(this.usinaGroup, this.RACK_OFFSET_Z, this.dimensionsGroup);

    // 5. Cotas Técnicas 3D
    DimensionOverlayBuilder.buildDimensionLines(
      this.dimensionsGroup,
      trayDimsL2,
      this.RACK_OFFSET_Z,
      curBaseY,
      this.BASE_PROFILE_H,
      this.UPPER_TRAY_Y,
      this.stackLevels,
      this.panelsPerLevel
    );

    this.dimensionsGroup.visible = this.showDimensions;
    this.cableChainGroup.visible = false;

    this.updateExpansion(this.expansionProgress);
    this.updateExploded(this.explodedProgress);
  }

  /**
   * Constrói o empilhamento em andares (Stack)
   */
  private buildStackStructure(dimsL2: TrayDimensions) {
    const zCenter = this.RACK_OFFSET_Z;
    const yLevel1_Lower = this.Y_LEVEL1_LOWER;
    const yLevel1_Upper = this.Y_LEVEL1_UPPER;
    const yLevel2 = this.Y_LEVEL2;
    this.UPPER_TRAY_Y = (this.stackLevels === 2) ? yLevel2 : yLevel1_Upper;

    const baseTopY = this.currentBaseY + this.BASE_PROFILE_H / 2;

    // Nível 1 (Inferior)
    this.level1Motion = SolarTrayBuilder.buildLevel(
      1,
      this.level1,
      yLevel1_Lower,
      yLevel1_Upper,
      this.slidingLayerGroup1,
      this.slidingLayerGroup2,
      this.fixedFrameGroup,
      this.intermediateRailsGroup1,
      this.intermediateRailsGroup2,
      dimsL2,
      zCenter,
      baseTopY,
      this.structureMaterial,
      this.aluminumColor,
      this.PANEL_SPECS
    );

    // Nível 2 (Superior)
    if (this.stackLevels === 2) {
      this.level2Motion = SolarTrayBuilder.buildLevel(
        2,
        this.level2,
        yLevel2,
        yLevel2,
        this.upperLayerGroup,
        this.slidingLayerGroup3,
        this.fixedFrameGroup,
        this.intermediateRailsGroup3,
        this.intermediateRailsGroup4,
        dimsL2,
        zCenter,
        baseTopY,
        this.structureMaterial,
        this.aluminumColor,
        this.PANEL_SPECS
      );

      // Pilares de elevação com braço de desvio para o Nível 2
      SpacerPostsBuilder.addSpacerPosts(
        this.fixedFrameGroup,
        dimsL2.trayWidth,
        dimsL2.trayLength,
        baseTopY,
        yLevel2,
        zCenter,
        this.structureMaterial,
        this.aluminumColor
      );
    } else {
      this.level2Motion = { dir: 'fixed', travelA: 0, travelB: 0 };
    }
  }

  /**
   * Cinemática suave de expansão telescópica das gavetas
   */
  updateExpansion(progress: number) {
    this.expansionProgress = Math.max(0.0, Math.min(1.0, progress));

    this.applyLevelMotion(
      this.level1,
      this.level1Motion,
      this.slidingLayerGroup1,
      this.slidingLayerGroup2,
      this.intermediateRailsGroup1,
      this.intermediateRailsGroup2,
      this.expansionProgress
    );

    if (this.stackLevels === 2) {
      this.applyLevelMotion(
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

  private applyLevelMotion(
    config: any,
    motionInfo: MotionPlan | undefined,
    groupA: THREE.Group,
    groupB: THREE.Group,
    interA: THREE.Group,
    interB: THREE.Group,
    progress: number
  ) {
    if (!config || !motionInfo) return;
    const dir = motionInfo.dir;
    const travelA = (motionInfo.travelA || 0) * progress;
    const travelB = (motionInfo.travelB || 0) * progress;

    if (dir === 'longitudinal') {
      if (groupA) { groupA.position.z = travelA; groupA.position.x = 0; }
      if (groupB) { groupB.position.z = -travelB; groupB.position.x = 0; }
      if (interA) { interA.position.z = travelA * 0.5; interA.position.x = 0; }
      if (interB) { interB.position.z = -travelB * 0.5; interB.position.x = 0; }
    } else if (dir === 'lateral') {
      if (groupA) { groupA.position.x = -travelA; groupA.position.z = 0; }
      if (groupB) { groupB.position.x = travelB; groupB.position.z = 0; }
      if (interA) { interA.position.x = -travelA * 0.5; interA.position.z = 0; }
      if (interB) { interB.position.x = travelB * 0.5; interB.position.z = 0; }
    } else if (dir === 'rear_only') {
      if (groupA) groupA.position.set(0, 0, 0);
      if (groupB) { groupB.position.z = -travelB; groupB.position.x = 0; }
      if (interA) interA.position.set(0, 0, 0);
      if (interB) { interB.position.z = -travelB * 0.5; interB.position.x = 0; }
    } else if (dir === 'front_only') {
      if (groupA) { groupA.position.z = travelA; groupA.position.x = 0; }
      if (groupB) groupB.position.set(0, 0, 0);
      if (interA) { interA.position.z = travelA * 0.5; interA.position.x = 0; }
      if (interB) { interB.position.set(0, 0, 0); }
    } else {
      if (groupA) groupA.position.set(0, 0, 0);
      if (groupB) groupB.position.set(0, 0, 0);
      if (interA) interA.position.set(0, 0, 0);
      if (interB) interB.position.set(0, 0, 0);
    }
  }

  updateExploded(progress: number) {
    this.explodedProgress = Math.max(0.0, Math.min(1.0, progress));
    const offset = this.explodedProgress * 0.35;

    if (this.upperLayerGroup) this.upperLayerGroup.position.y = offset * 2.0;
    if (this.slidingLayerGroup3) this.slidingLayerGroup3.position.y = offset * 2.0;
    if (this.intermediateRailsGroup3) this.intermediateRailsGroup3.position.y = offset * 2.0;
    if (this.intermediateRailsGroup4) this.intermediateRailsGroup4.position.y = offset * 2.0;

    if (this.slidingLayerGroup1) this.slidingLayerGroup1.position.y = offset * 1.0;
    if (this.intermediateRailsGroup1) this.intermediateRailsGroup1.position.y = offset * 1.0;

    if (this.slidingLayerGroup2) this.slidingLayerGroup2.position.y = offset * 0.35;
    if (this.intermediateRailsGroup2) this.intermediateRailsGroup2.position.y = offset * 0.35;
  }

  // --- CÁLCULO ELÉTRICO E PESOS EM TEMPO REAL ---

  getEnergyStats() {
    const l1Count = this.level1 ? this.level1.panels : 2;
    const l2Count = (this.stackLevels === 2 && this.level2) ? this.level2.panels : 0;
    const totalPanels = l1Count + l2Count;

    const powerClosed = ((this.stackLevels === 2) ? l2Count : l1Count) * this.PANEL_SPECS.powerWatts;
    const powerOpen = totalPanels * this.PANEL_SPECS.powerWatts;

    const currentWatts = Math.round(powerClosed + (powerOpen - powerClosed) * this.expansionProgress);
    const dailyKWh = ((currentWatts * 5.2) / 1000).toFixed(2);
    const currentAmps12V = (currentWatts / 13.6).toFixed(1);

    const isSeriesPair = (totalPanels >= 2);
    const vocTotal = (isSeriesPair ? this.PANEL_SPECS.voc * 2 : this.PANEL_SPECS.voc).toFixed(2);
    const vmpTotal = (isSeriesPair ? this.PANEL_SPECS.vmp * 2 : this.PANEL_SPECS.vmp).toFixed(1);
    const iscTotal = (isSeriesPair ? this.PANEL_SPECS.isc * Math.max(1, Math.round(totalPanels / 2)) : this.PANEL_SPECS.isc * totalPanels).toFixed(1);

    const weightPanels = (totalPanels * this.PANEL_SPECS.weightKg).toFixed(1);
    const baseRackWeight = (this.structureMaterial === 'steel') ? 26.0 : 11.5;
    const trayWeightPerLevel = (this.structureMaterial === 'steel') ? 5.2 : 2.3;
    const slidesWeight = ((this.stackLevels - 1) * 3.4);
    const weightStructure = (baseRackWeight + (trayWeightPerLevel * this.stackLevels)).toFixed(1);
    const weightTotal = (parseFloat(weightPanels) + parseFloat(weightStructure) + slidesWeight).toFixed(1);

    return {
      watts: currentWatts,
      powerClosed: powerClosed,
      powerOpen: powerOpen,
      dailyKWh: dailyKWh,
      currentAmps12V: currentAmps12V,
      voc: vocTotal,
      vmp: vmpTotal,
      isc: iscTotal,
      totalPanels: totalPanels,
      stackLevels: this.stackLevels,
      panelsPerLevel: l1Count,
      level1Panels: l1Count,
      level2Panels: l2Count,
      slideDirection: this.level1 ? this.level1.slideDirection : 'longitudinal',
      panelOrientation: this.level1 ? this.level1.orientation : 'longitudinal',
      structureMaterial: this.structureMaterial,
      weightPanels: weightPanels,
      weightStructure: weightStructure,
      weightTotal: weightTotal,
      percent: Math.round(this.expansionProgress * 100)
    };
  }

  getCargoBoxEngineeringSpecs() {
    if (!this.cargoBoxSystem) return null;
    const stats = this.getEnergyStats();
    return this.cargoBoxSystem.calculateEngineeringSpecs(parseFloat(stats.weightTotal));
  }

  clearGroup(grp: THREE.Group) {
    if (!grp) return;
    while (grp.children.length > 0) {
      const obj = grp.children[0];
      grp.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
      if ((obj as any).material) {
        if (Array.isArray((obj as any).material)) {
          (obj as any).material.forEach((m: any) => m.dispose());
        } else {
          (obj as any).material.dispose();
        }
      }
    }
  }
}
