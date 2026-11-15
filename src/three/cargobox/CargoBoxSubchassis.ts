import * as THREE from 'three';
import { MaterialLibrary } from '../Materials';
import { AluminumExtrusionFactory } from '../AluminumExtrusion';
import { MetalonTubeFactory } from '../MetalonTube';
import { StructureMaterial, AluminumColor, SteelProfileUnit, getSteelProfileSpec, getMetalonGauge } from '../../types';
import { CargoBoxHardware } from './CargoBoxHardware';

export interface SubchassisBuildParams {
  boxL: number;
  boxW: number;
  boxH: number;
  pivotElevationY: number;
  pivotX: number;
  boxCenterZ: number;
  isTelescopic?: boolean;
  structureMaterial: StructureMaterial;
  steelProfileUnit: SteelProfileUnit;
  aluminumColor: AluminumColor;
  metalonThickness40: number;
  metalonThickness30: number;
  baseY: number;
  rackOffsetZ: number;
  hingeSide: 'driver' | 'passenger';
  subchassisWidth: number;
  subchassisLength: number;
  profileSize: number;
  targetGroup: THREE.Group;
}

export class CargoBoxSubchassis {
  static build(params: SubchassisBuildParams) {
    const {
      boxL,
      boxH,
      pivotElevationY,
      pivotX,
      boxCenterZ,
      isTelescopic = true,
      structureMaterial,
      steelProfileUnit,
      aluminumColor,
      metalonThickness40,
      metalonThickness30,
      baseY,
      rackOffsetZ,
      hingeSide,
      subchassisWidth: width,
      subchassisLength: length,
      profileSize: pSize,
      targetGroup
    } = params;

    const mats = MaterialLibrary.materials;
    const isTSlot = (structureMaterial === 'aluminum');
    const isAluTube = (structureMaterial === 'aluminum_tube');
    const thickness40M = Math.max(0.0005, (metalonThickness40 || 2.0) / 1000);
    const thickness30M = Math.max(0.0005, (metalonThickness30 || 1.5) / 1000);
    const steelSpec40 = getSteelProfileSpec(40, steelProfileUnit, metalonThickness40);
    const steelSpec30 = getSteelProfileSpec(30, steelProfileUnit, metalonThickness30);
    const frameMat = isTSlot
      ? (aluminumColor === 'black' ? mats.aluminumProfileBlack : mats.aluminumProfileSilver)
      : isAluTube
        ? (aluminumColor === 'black' ? mats.aluminumTubeBlack : mats.aluminumTubeSilver)
        : mats.weldedSteelMetalon;

    const profileSpec40 = isTSlot
      ? 'Perfil T-Slot 40x40'
      : isAluTube
        ? `Tubo Retangular Alumínio 40x40x${metalonThickness40.toFixed(1)}mm`
        : steelSpec40;

    const profileSpec30 = isTSlot
      ? 'Perfil Telescópico 30x30 (Regulagem Vertical)'
      : isAluTube
        ? `Tubo Telescópico Alumínio 30x30x${metalonThickness30.toFixed(1)}mm`
        : (steelProfileUnit === 'inch'
          ? `Tubo Telescópico 1 ¼" × 1 ¼" × ${metalonThickness30.toFixed(1)}mm (${getMetalonGauge(metalonThickness30)})`
          : `Tubo Telescópico 30×30 × ${metalonThickness30.toFixed(1)}mm`);

    const zCenter = rackOffsetZ;
    const yBase = baseY;

    // 1. Longarinas do Subchassi (2.20m em Z)
    const longLeft = isTSlot
      ? AluminumExtrusionFactory.createProfileMesh(length, frameMat, { axis: 'z', showCutFace: true })
      : MetalonTubeFactory.createTubeMesh(length, frameMat, { axis: 'z', size: pSize, thickness: thickness40M, showCutFace: true });
    longLeft.position.set(-width / 2 + pSize / 2, yBase, zCenter);
    longLeft.castShadow = true;
    longLeft.userData = { isBar: true, barLength: length, barLabel: 'Longarina do Subchassi Base (Esquerda)', profileSpec: profileSpec40 };
    targetGroup.add(longLeft);

    const longRight = isTSlot
      ? AluminumExtrusionFactory.createProfileMesh(length, frameMat, { axis: 'z', showCutFace: true })
      : MetalonTubeFactory.createTubeMesh(length, frameMat, { axis: 'z', size: pSize, thickness: thickness40M, showCutFace: true });
    longRight.position.set(width / 2 - pSize / 2, yBase, zCenter);
    longRight.castShadow = true;
    longRight.userData = { isBar: true, barLength: length, barLabel: 'Longarina do Subchassi Base (Direita)', profileSpec: profileSpec40 };
    targetGroup.add(longRight);

    // 2. Travessas Transversais de Apoio ao Baú (em X)
    const crossBarLength = width - pSize * 2;
    const zFrontCross = zCenter + length / 2 - pSize / 2;
    const zRearCross = zCenter - length / 2 + pSize / 2;
    const boxSupportHalf = Math.min(boxL / 2 - 0.10, 0.65);
    const zPositionsRaw = [
      zFrontCross,
      boxCenterZ + boxSupportHalf,
      boxCenterZ,
      boxCenterZ - boxSupportHalf,
      (boxCenterZ - boxSupportHalf + zRearCross) / 2,
      zRearCross
    ];

    const zPositions: number[] = [];
    zPositionsRaw.sort((a, b) => a - b).forEach(z => {
      if (zPositions.length === 0 || Math.abs(z - zPositions[zPositions.length - 1]) > 0.06) {
        zPositions.push(z);
      }
    });

    zPositions.forEach(z => {
      const cross = isTSlot
        ? AluminumExtrusionFactory.createProfileMesh(crossBarLength, frameMat, { axis: 'x' })
        : MetalonTubeFactory.createTubeMesh(crossBarLength, frameMat, { axis: 'x', size: pSize, thickness: thickness40M });
      cross.position.set(0, yBase, z);
      cross.castShadow = true;
      cross.userData = { isBar: true, barLength: crossBarLength, barLabel: 'Travessa do Subchassi de Apoio ao Baú', profileSpec: profileSpec40 };
      targetGroup.add(cross);
    });

    // 3. Sapatas de ancoragem
    const riserH = 0.06;
    const riserGeo = new THREE.BoxGeometry(0.05, riserH, 0.08);
    const riserY = yBase - pSize / 2 - riserH / 2;
    const risersPos = [
      [-width / 2 + pSize / 2, riserY, zCenter + 0.85],
      [width / 2 - pSize / 2, riserY, zCenter + 0.85],
      [-width / 2 + pSize / 2, riserY, zCenter - 0.85],
      [width / 2 - pSize / 2, riserY, zCenter - 0.85]
    ];
    risersPos.forEach((p, idx) => {
      const riser = new THREE.Mesh(riserGeo, frameMat);
      riser.position.set(p[0], p[1], p[2]);
      riser.userData = { isBar: true, barLength: 0.08, barLabel: `Sapata do Subchassi Base (#${idx + 1})`, profileSpec: 'Sapata de Ancoragem 50x60x80mm' };
      targetGroup.add(riser);
    });

    // 4. Torres Verticais de Sustentação
    const towerBottomY = yBase + pSize / 2;
    const towerTopY = pivotElevationY - pSize / 2;
    const isDriverHinge = (hingeSide === 'driver');
    const hingeX = pivotX;
    const latchX = isDriverHinge ? (width / 2 - pSize / 2) : (-width / 2 + pSize / 2);

    const baseSleeveH = Math.max(0.18, boxH);
    const innerBarLength = baseSleeveH + 0.02;
    const jointY = towerBottomY + baseSleeveH;
    const baseSleeveCenterY = towerBottomY + baseSleeveH / 2;
    const upperSlideCenterY = towerTopY - innerBarLength / 2;

    const telescopicMat = mats.telescopicMid || new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      metalness: 0.80,
      roughness: 0.20,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 0.22
    });
    const collarMat = mats.telescopicBracket || mats.weldedSteelMetalon;
    const pinHoleMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    const maxTowerHalf = (length / 2) - pSize;
    const towerHalfZ = Math.min(maxTowerHalf, boxL / 2 + 0.12);
    const towerZCoords = [boxCenterZ - towerHalfZ, boxCenterZ + towerHalfZ];

    const buildTower = (xPos: number, zPos: number, roleLabel: string, outwardSign: number) => {
      if (!isTelescopic) {
        const fixedTowerH = Math.max(0.05, towerTopY - towerBottomY);
        const fixedTowerCenterY = (towerBottomY + towerTopY) / 2;
        const fixedTower = isTSlot
          ? AluminumExtrusionFactory.createProfileMesh(fixedTowerH, frameMat, { axis: 'y', size: 0.040 })
          : MetalonTubeFactory.createTubeMesh(fixedTowerH, frameMat, { axis: 'y', size: pSize, thickness: thickness40M });
        fixedTower.position.set(xPos, fixedTowerCenterY, zPos);
        fixedTower.castShadow = true;
        fixedTower.userData = {
          isBar: true,
          barLength: fixedTowerH,
          barLabel: `Torre Fixa de Sustentação (${roleLabel})`,
          profileSpec: profileSpec40
        };
        targetGroup.add(fixedTower);
        return;
      }

      // Camisa Inferior
      const lowerTower = isTSlot
        ? AluminumExtrusionFactory.createProfileMesh(baseSleeveH, frameMat, { axis: 'y', size: 0.040 })
        : MetalonTubeFactory.createTubeMesh(baseSleeveH, frameMat, { axis: 'y', size: pSize, thickness: thickness40M });
      lowerTower.position.set(xPos, baseSleeveCenterY, zPos);
      lowerTower.castShadow = true;
      lowerTower.userData = {
        isBar: true,
        isTelescopicRail: true,
        barLength: baseSleeveH,
        barLabel: `Torre Base Fixa (${roleLabel})`,
        profileSpec: profileSpec40
      };
      targetGroup.add(lowerTower);

      // Coluna Telescópica Interna
      const upperSlide = isTSlot
        ? AluminumExtrusionFactory.createProfileMesh(innerBarLength, telescopicMat, { axis: 'y', size: 0.030 })
        : MetalonTubeFactory.createTubeMesh(innerBarLength, telescopicMat, { axis: 'y', size: 0.030, thickness: thickness30M });
      upperSlide.position.set(xPos, upperSlideCenterY, zPos);
      upperSlide.castShadow = true;
      upperSlide.userData = {
        isBar: true,
        isTelescopicRail: true,
        barLength: innerBarLength,
        barLabel: `Coluna Telescópica de Ajuste de Altura (${roleLabel})`,
        profileSpec: profileSpec30
      };
      targetGroup.add(upperSlide);

      // Colar e Pino
      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.022, 0.046), collarMat);
      collar.position.set(xPos, jointY, zPos);
      targetGroup.add(collar);

      const lockPin = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.056, 12), mats.toggleClampGrip || collarMat);
      lockPin.rotation.z = Math.PI / 2;
      lockPin.position.set(xPos + outwardSign * 0.006, jointY, zPos);
      targetGroup.add(lockPin);

      // Furos CNC
      const holeStep = 0.030;
      const totalHolesOnBar = Math.floor((innerBarLength - 0.06) / holeStep);
      for (let h = 1; h <= totalHolesOnBar; h++) {
        const hy = (towerTopY - innerBarLength) + 0.03 + h * holeStep;
        if (hy <= jointY + 0.014 || hy >= towerTopY - 0.015) continue;
        const holeDot = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.032, 10), pinHoleMat);
        holeDot.rotation.z = Math.PI / 2;
        holeDot.position.set(xPos, hy, zPos);
        targetGroup.add(holeDot);
      }
    };

    towerZCoords.forEach(tz => {
      buildTower(hingeX, tz, 'Dobradiça', isDriverHinge ? -1 : 1);
      CargoBoxHardware.buildStainlessHinge(hingeX, pivotElevationY, tz, targetGroup);

      buildTower(latchX, tz, 'Trava Rápida', isDriverHinge ? 1 : -1);

      const restPad = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.015, 16), mats.rubberRestPad);
      restPad.position.set(latchX, pivotElevationY - 0.0075, tz);
      targetGroup.add(restPad);

      CargoBoxHardware.buildToggleClamp(latchX, pivotElevationY, tz, isDriverHinge ? 1 : -1, targetGroup);
    });
  }
}
