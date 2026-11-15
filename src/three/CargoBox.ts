import * as THREE from 'three';
import { TextureGenerator } from './Textures';
import { CargoBoxConfig, StructureMaterial, AluminumColor, SteelProfileUnit } from '../types';
import { GasStrutRuntime, CargoBoxHardware } from './cargobox/CargoBoxHardware';
import { CargoBoxSubchassis } from './cargobox/CargoBoxSubchassis';
import { CargoBoxBody } from './cargobox/CargoBoxBody';

export type { GasStrutRuntime };

/**
 * Módulo 3D do Baú de Teto Motobul Off Road e Mecanismo Basculante
 * Integra o baú aerodinâmico comercial, subchassi base 40x40, dobradiças industriais inox,
 * travas de pressão (toggle clamps) e amortecedores / pistões a gás dinâmicos.
 */
export class CargoBoxSystem {
  group: THREE.Group;
  subchassisGroup: THREE.Group;
  boxGroup: THREE.Group;
  boxLidGroup: THREE.Group;
  tiltingPivotGroup: THREE.Group;
  tiltingMountGroup: THREE.Group;
  gasStrutsGroup: THREE.Group;

  config: CargoBoxConfig;
  baseY: number;
  rackOffsetZ: number;
  structureMaterial: StructureMaterial;
  steelProfileUnit: SteelProfileUnit;
  aluminumColor: AluminumColor;
  metalonThickness40: number = 2.0;
  metalonThickness30: number = 1.5;
  waterTankEnabled: boolean;
  waterTankDiameterMm: number;
  waterTankConnectionPosition: 'front' | 'rear' = 'front';

  readonly SUBCHASSIS_WIDTH = 1.40;
  readonly SUBCHASSIS_LENGTH = 2.20;
  readonly PROFILE_SIZE = 0.04;

  private struts: GasStrutRuntime[] = [];
  private emblemTexture: THREE.CanvasTexture | null = null;

  constructor(
    config: CargoBoxConfig,
    baseY: number = 2.06,
    rackOffsetZ: number = 0.40,
    structureMaterial: StructureMaterial = 'aluminum',
    aluminumColor: AluminumColor = 'silver',
    steelProfileUnit: SteelProfileUnit = 'mm',
    waterTankEnabled: boolean = true,
    waterTankDiameterMm: number = 200,
    metalonThickness40: number = 2.0,
    metalonThickness30: number = 1.5,
    waterTankConnectionPosition: 'front' | 'rear' = 'front'
  ) {
    this.config = { ...config };
    this.baseY = baseY;
    this.rackOffsetZ = rackOffsetZ;
    this.structureMaterial = structureMaterial;
    this.aluminumColor = aluminumColor;
    this.steelProfileUnit = steelProfileUnit;
    this.metalonThickness40 = metalonThickness40;
    this.metalonThickness30 = metalonThickness30;
    this.waterTankEnabled = waterTankEnabled;
    this.waterTankDiameterMm = waterTankDiameterMm;
    this.waterTankConnectionPosition = waterTankConnectionPosition;

    this.group = new THREE.Group();
    this.group.name = "CargoBoxSystem";

    this.subchassisGroup = new THREE.Group();
    this.subchassisGroup.name = "SubchassisBase";

    this.boxGroup = new THREE.Group();
    this.boxGroup.name = "MotobulBox";

    this.boxLidGroup = new THREE.Group();
    this.boxLidGroup.name = "MotobulLid";

    this.tiltingPivotGroup = new THREE.Group();
    this.tiltingPivotGroup.name = "SolarTiltPivot";

    this.tiltingMountGroup = new THREE.Group();
    this.tiltingMountGroup.name = "SolarSuperstructureMount";

    this.gasStrutsGroup = new THREE.Group();
    this.gasStrutsGroup.name = "GasStruts";

    this.group.add(this.subchassisGroup);
    this.group.add(this.boxGroup);
    this.group.add(this.gasStrutsGroup);
    this.group.add(this.tiltingPivotGroup);
    this.tiltingPivotGroup.add(this.tiltingMountGroup);

    this.build();
  }

  getBoxCenterZ(boxL: number): number {
    const zFrontFrame = this.rackOffsetZ + this.SUBCHASSIS_LENGTH / 2;
    const zRearFrame = this.rackOffsetZ - this.SUBCHASSIS_LENGTH / 2;
    const zInnerFront = zFrontFrame - this.PROFILE_SIZE;
    const zInnerRear = zRearFrame + this.PROFILE_SIZE;

    const pipeRadiusM = ((this.waterTankDiameterMm || 200) / 2) / 1000;
    const halfL = (boxL * 1.025) / 2;

    if (this.waterTankEnabled ?? true) {
      if (this.waterTankConnectionPosition === 'rear') {
        const zRearPipeFront = zInnerRear + pipeRadiusM * 2.06;
        const minCenterZ = (zRearPipeFront + 0.025) + halfL;
        const maxCenterZ = (zInnerFront - 0.030) - halfL;
        return Math.min(Math.max(this.rackOffsetZ, minCenterZ), maxCenterZ);
      } else {
        const zFrontPipeRear = zInnerFront - pipeRadiusM * 2.06;
        const desiredCenterZ = (zFrontPipeRear - 0.025) - halfL;
        const minCenterZ = zInnerRear + halfL + 0.02;
        return Math.max(desiredCenterZ, minCenterZ);
      }
    } else {
      const desiredCenterZ = (zInnerFront - 0.030) - halfL;
      const minCenterZ = zInnerRear + halfL + 0.02;
      return Math.max(desiredCenterZ, minCenterZ);
    }
  }

  build() {
    this.clearGroup(this.subchassisGroup);
    this.clearGroup(this.boxGroup);
    this.clearGroup(this.boxLidGroup);
    this.clearGroup(this.gasStrutsGroup);
    this.struts = [];

    if (!this.config.enabled) {
      this.group.visible = false;
      this.tiltingPivotGroup.rotation.z = 0;
      this.tiltingPivotGroup.position.set(0, 0, 0);
      this.tiltingMountGroup.position.set(0, 0, 0);
      return;
    }

    this.group.visible = true;

    const boxL = (this.config.length || 1600) / 1000;
    const boxW = (this.config.width || 1000) / 1000;
    const boxH = (this.config.height || 330) / 1000;
    const isTelescopic = (this.config.isTelescopic !== false);
    const maxLiftM = isTelescopic ? Math.max(0.06, boxH - 0.10) : 0;
    const liftM = isTelescopic ? Math.min(maxLiftM, Math.max(0, (this.config.verticalLiftMm || 0) / 1000)) : 0;

    const topOfBoxY = this.baseY + this.PROFILE_SIZE / 2 + boxH + 0.015;
    const gapAboveBoxM = 0.008;
    const pivotElevationY = topOfBoxY + gapAboveBoxM + this.PROFILE_SIZE / 2 + liftM;
    const pivotX = (this.config.hingeSide === 'driver' ? -1 : 1) * (this.SUBCHASSIS_WIDTH / 2 - this.PROFILE_SIZE / 2);

    const boxCenterZ = this.getBoxCenterZ(boxL);

    // 1. Subchassi
    CargoBoxSubchassis.build({
      boxL,
      boxW,
      boxH,
      pivotElevationY,
      pivotX,
      boxCenterZ,
      isTelescopic,
      structureMaterial: this.structureMaterial,
      steelProfileUnit: this.steelProfileUnit,
      aluminumColor: this.aluminumColor,
      metalonThickness40: this.metalonThickness40,
      metalonThickness30: this.metalonThickness30,
      baseY: this.baseY,
      rackOffsetZ: this.rackOffsetZ,
      hingeSide: this.config.hingeSide,
      subchassisWidth: this.SUBCHASSIS_WIDTH,
      subchassisLength: this.SUBCHASSIS_LENGTH,
      profileSize: this.PROFILE_SIZE,
      targetGroup: this.subchassisGroup
    });

    // 2. Baú Motobul
    CargoBoxBody.build({
      L: boxL,
      W: boxW,
      H: boxH,
      boxCenterZ,
      baseY: this.baseY,
      profileSize: this.PROFILE_SIZE,
      waterTankDiameterMm: this.waterTankDiameterMm,
      waterTankEnabled: this.waterTankEnabled,
      hingeSide: this.config.hingeSide,
      subchassisWidth: this.SUBCHASSIS_WIDTH,
      boxGroup: this.boxGroup,
      boxLidGroup: this.boxLidGroup,
      getEmblemTexture: () => {
        if (!this.emblemTexture) {
          this.emblemTexture = TextureGenerator.createMotobulEmblemTexture();
        }
        return this.emblemTexture;
      }
    });

    // 3. Posiciona o Grupo de Pivô
    this.tiltingPivotGroup.position.set(pivotX, pivotElevationY, 0);
    this.tiltingMountGroup.position.set(-pivotX, -pivotElevationY, 0);

    // 4. Pistões a Gás
    this.struts = CargoBoxHardware.buildGasStruts(
      pivotElevationY,
      pivotX,
      boxCenterZ,
      boxL,
      this.baseY,
      this.PROFILE_SIZE,
      this.config.hingeSide,
      this.subchassisGroup,
      this.gasStrutsGroup
    );

    // 5. Aplica rotações
    this.setTiltAngle(this.config.tiltAngle || 0);
    this.setLidAngle(this.config.lidAngle || 0);
  }

  setTiltAngle(angleDeg: number) {
    this.config.tiltAngle = Math.max(0, Math.min(70, angleDeg));
    const rad = THREE.MathUtils.degToRad(this.config.tiltAngle);
    const isDriver = (this.config.hingeSide === 'driver');
    this.tiltingPivotGroup.rotation.z = isDriver ? rad : -rad;

    const boxH = (this.config.height || 330) / 1000;
    const isTelescopic = (this.config.isTelescopic !== false);
    const maxLiftM = isTelescopic ? Math.max(0.06, boxH - 0.10) : 0;
    const liftM = isTelescopic ? Math.min(maxLiftM, Math.max(0, (this.config.verticalLiftMm || 0) / 1000)) : 0;
    const topOfBoxY = this.baseY + this.PROFILE_SIZE / 2 + boxH + 0.015;
    const gapAboveBoxM = 0.008;
    const pivotElevationY = topOfBoxY + gapAboveBoxM + this.PROFILE_SIZE / 2 + liftM;
    const pivotX = (isDriver ? -1 : 1) * (this.SUBCHASSIS_WIDTH / 2 - this.PROFILE_SIZE / 2);

    CargoBoxHardware.updateGasStruts(this.struts, rad, this.config.hingeSide, pivotX, pivotElevationY);
  }

  setLidAngle(angleDeg: number) {
    this.config.lidAngle = Math.max(0, Math.min(45, angleDeg));
    const rad = THREE.MathUtils.degToRad(this.config.lidAngle);
    const isDriver = (this.config.hingeSide === 'driver');
    this.boxLidGroup.rotation.z = isDriver ? rad : -rad;
  }

  updateConfig(
    newConfig: Partial<CargoBoxConfig>,
    baseY?: number,
    rackOffsetZ?: number,
    waterTankEnabled?: boolean,
    waterTankDiameterMm?: number,
    waterTankConnectionPosition?: 'front' | 'rear'
  ) {
    if (baseY !== undefined) this.baseY = baseY;
    if (rackOffsetZ !== undefined) this.rackOffsetZ = rackOffsetZ;
    if (waterTankEnabled !== undefined) this.waterTankEnabled = waterTankEnabled;
    if (waterTankDiameterMm !== undefined) this.waterTankDiameterMm = waterTankDiameterMm;
    if (waterTankConnectionPosition !== undefined) this.waterTankConnectionPosition = waterTankConnectionPosition;
    this.config = { ...this.config, ...newConfig };
    this.build();
  }

  calculateEngineeringSpecs(solarRackWeightKg: number) {
    const W_rack = (this.SUBCHASSIS_WIDTH || 1.40);
    const boxH = (this.config.height || 330) / 1000;
    const boxL = (this.config.length || 1600) / 1000;
    const boxW = (this.config.width || 1000) / 1000;

    const d_cm = W_rack / 2;
    const totalMass = Math.max(25, solarRackWeightKg);
    const gravity = 9.81;
    const weightForceN = totalMass * gravity;
    const maxTorqueNm = weightForceN * d_cm;

    const d_strut = 0.38;
    const sinTheta = Math.sin(THREE.MathUtils.degToRad(25));
    const rawForce = maxTorqueNm / (2 * d_strut * sinTheta);
    const designForce = rawForce * 1.15;
    const commercialForceN = Math.round(designForce / 50) * 50;
    const commercialForceKgf = Math.round(commercialForceN / 9.81);

    const volumeLiters = Math.round(boxL * boxW * boxH * 1000 * 0.88);

    const isTelescopic = (this.config.isTelescopic !== false);
    const subchassisWeightKg = (this.structureMaterial === 'steel')
      ? (isTelescopic ? 22.0 : 18.5)
      : (this.structureMaterial === 'aluminum_tube' ? (isTelescopic ? 8.2 : 6.8) : (isTelescopic ? 14.5 : 12.0));

    return {
      rackWeightKg: totalMass,
      maxTorqueNm: Math.round(maxTorqueNm),
      strutForceN: Math.max(300, Math.min(800, commercialForceN)),
      strutForceKgf: Math.max(30, Math.min(82, commercialForceKgf)),
      strutStrokeMm: 300,
      strutTotalLengthMm: 620,
      volumeLiters,
      cargoBoxWeightKg: 18,
      subchassisWeightKg,
      totalAddedRoofWeightKg: Math.round(18 + subchassisWeightKg + totalMass)
    };
  }

  private clearGroup(grp: THREE.Group) {
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

  dispose() {
    this.clearGroup(this.subchassisGroup);
    this.clearGroup(this.boxGroup);
    this.clearGroup(this.boxLidGroup);
    this.clearGroup(this.gasStrutsGroup);
    this.clearGroup(this.tiltingPivotGroup);
    this.clearGroup(this.tiltingMountGroup);
    this.clearGroup(this.group);
  }
}
