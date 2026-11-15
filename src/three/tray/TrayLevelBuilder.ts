import * as THREE from 'three';
import { MaterialLibrary } from '../Materials';
import { AluminumExtrusionFactory } from '../AluminumExtrusion';
import { MetalonTubeFactory } from '../MetalonTube';
import { SolarPanelBuilder } from '../SolarPanelBuilder';
import { StructureMaterial, AluminumColor, SteelProfileUnit, getSteelProfileSpec } from '../../types';
import { TrayDimensions } from './TrayTypes';

export class TrayLevelBuilder {
  /**
   * Constrói uma bandeja individual com quadro de perfil 30x30,
   * travessas de reforço contra vento e os painéis solares flexíveis instalados.
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
    const mats = MaterialLibrary.materials;
    const tray = new THREE.Group();
    tray.name = labelText;

    const isTSlot = (structureMaterial === 'aluminum');
    const isAluTube = (structureMaterial === 'aluminum_tube');
    const thicknessM = Math.max(0.0005, (metalonThickness || 1.5) / 1000);
    const steelSpec30 = getSteelProfileSpec(30, steelProfileUnit, metalonThickness);
    const frameMat = isTSlot
      ? (aluminumColor === 'black' ? mats.aluminumProfileBlack : mats.aluminumProfileSilver)
      : isAluTube
        ? (aluminumColor === 'black' ? mats.aluminumTubeBlack : mats.aluminumTubeSilver)
        : mats.weldedSteelMetalon;

    const profileSpec30 = isTSlot
      ? 'Perfil T-Slot 30x30'
      : isAluTube
        ? `Tubo Retangular Alumínio 30x30x${metalonThickness.toFixed(1)}mm`
        : steelSpec30;

    const tW = trayDims.trayWidth;
    const tL = trayDims.trayLength;
    const profileH = 0.030; // Perfil 30x30
    const innerTrayW = Math.max(0.10, tW - (profileH * 2));

    // Quadro Perimetral da Bandeja
    let sideL, sideR, frontBar, rearBar;
    if (isTSlot) {
      sideL = AluminumExtrusionFactory.createProfileMesh(tL, frameMat, { axis: 'z', size: 0.030, showCutFace: true });
      sideR = AluminumExtrusionFactory.createProfileMesh(tL, frameMat, { axis: 'z', size: 0.030, showCutFace: true });
      frontBar = AluminumExtrusionFactory.createProfileMesh(innerTrayW, frameMat, { axis: 'x', size: 0.030 });
      rearBar = AluminumExtrusionFactory.createProfileMesh(innerTrayW, frameMat, { axis: 'x', size: 0.030 });
    } else {
      sideL = MetalonTubeFactory.createTubeMesh(tL, frameMat, { axis: 'z', size: 0.030, thickness: thicknessM, showCutFace: true });
      sideR = MetalonTubeFactory.createTubeMesh(tL, frameMat, { axis: 'z', size: 0.030, thickness: thicknessM, showCutFace: true });
      frontBar = MetalonTubeFactory.createTubeMesh(innerTrayW, frameMat, { axis: 'x', size: 0.030, thickness: thicknessM });
      rearBar = MetalonTubeFactory.createTubeMesh(innerTrayW, frameMat, { axis: 'x', size: 0.030, thickness: thicknessM });
    }

    sideL.position.set(xCenter - tW / 2 + profileH / 2, yLevel, zCenter);
    sideR.position.set(xCenter + tW / 2 - profileH / 2, yLevel, zCenter);
    frontBar.position.set(xCenter, yLevel, zCenter + tL / 2 - profileH / 2);
    rearBar.position.set(xCenter, yLevel, zCenter - tL / 2 + profileH / 2);

    sideL.userData = { isBar: true, barLength: tL, barLabel: `Longarina da Bandeja (${labelText})`, profileSpec: profileSpec30 };
    sideR.userData = { isBar: true, barLength: tL, barLabel: `Longarina da Bandeja (${labelText})`, profileSpec: profileSpec30 };
    frontBar.userData = { isBar: true, barLength: innerTrayW, barLabel: `Travessa Frontal da Bandeja (${labelText})`, profileSpec: profileSpec30 };
    rearBar.userData = { isBar: true, barLength: innerTrayW, barLabel: `Travessa Traseira da Bandeja (${labelText})`, profileSpec: profileSpec30 };

    tray.add(sideL);
    tray.add(sideR);
    tray.add(frontBar);
    tray.add(rearBar);

    // Barras estruturais centrais (divisórias entre os painéis)
    const pW = trayDims.panelW;
    const pL = trayDims.panelL;
    const cols = trayDims.cols;
    const rows = trayDims.rows;

    const gapCol = (cols > 1) ? 0.030 : 0.0;
    const gapRow = (rows > 1) ? 0.030 : 0.0;
    const stepX = pW + gapCol;
    const stepZ = pL + gapRow;

    const startX = xCenter - ((cols - 1) * stepX) / 2;
    const startZ = zCenter - ((rows - 1) * stepZ) / 2;

    const midLongBarPositions: number[] = [];
    if (cols > 1) {
      const divLength = tL - (profileH * 2);
      for (let c = 0; c < cols - 1; c++) {
        const xDiv = startX + c * stepX + (pW / 2) + (gapCol / 2);
        midLongBarPositions.push(xDiv);
        let midLongBar;
        if (isTSlot) {
          midLongBar = AluminumExtrusionFactory.createProfileMesh(divLength, frameMat, { axis: 'z', size: 0.030 });
        } else {
          midLongBar = MetalonTubeFactory.createTubeMesh(divLength, frameMat, { axis: 'z', size: 0.030, thickness: thicknessM });
        }
        midLongBar.position.set(xDiv, yLevel, zCenter);
        midLongBar.castShadow = true;
        midLongBar.userData = { isBar: true, barLength: divLength, barLabel: 'Longarina Central da Bandeja', profileSpec: profileSpec30 };
        tray.add(midLongBar);
      }
    }

    if (rows > 1) {
      for (let r = 0; r < rows - 1; r++) {
        const zDiv = startZ + r * stepZ + (pL / 2) + (gapRow / 2);

        if (cols === 1) {
          const divWidth = tW - (profileH * 2);
          let midCrossBar;
          if (isTSlot) {
            midCrossBar = AluminumExtrusionFactory.createProfileMesh(divWidth, frameMat, { axis: 'x', size: 0.030 });
          } else {
            midCrossBar = MetalonTubeFactory.createTubeMesh(divWidth, frameMat, { axis: 'x', size: 0.030, thickness: thicknessM });
          }
          midCrossBar.position.set(xCenter, yLevel, zDiv);
          midCrossBar.castShadow = true;
          midCrossBar.userData = { isBar: true, barLength: divWidth, barLabel: 'Travessa Divisória da Bandeja', profileSpec: profileSpec30 };
          tray.add(midCrossBar);
        } else {
          const xBounds = [
            xCenter - tW / 2 + profileH,
            ...midLongBarPositions,
            xCenter + tW / 2 - profileH
          ];

          for (let b = 0; b < xBounds.length - 1; b++) {
            const xLeft = (b === 0) ? xBounds[b] : (xBounds[b] + profileH / 2);
            const xRight = (b === xBounds.length - 2) ? xBounds[b + 1] : (xBounds[b + 1] - profileH / 2);
            const segW = xRight - xLeft;
            if (segW <= 0.01) continue;

            const segCenterX = (xLeft + xRight) / 2;
            let segMesh;
            if (isTSlot) {
              segMesh = AluminumExtrusionFactory.createProfileMesh(segW, frameMat, { axis: 'x', size: 0.030 });
            } else {
              segMesh = MetalonTubeFactory.createTubeMesh(segW, frameMat, { axis: 'x', size: 0.030, thickness: thicknessM });
            }
            segMesh.position.set(segCenterX, yLevel, zDiv);
            segMesh.castShadow = true;
            segMesh.userData = { isBar: true, barLength: segW, barLabel: 'Travessa Divisória da Bandeja', profileSpec: profileSpec30 };
            tray.add(segMesh);
          }
        }
      }
    }

    // Instalação dos painéis solares flexíveis
    const maxPanels = (trayDims.panelCount !== undefined) ? trayDims.panelCount : (cols * rows);
    let countPlaced = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (countPlaced >= maxPanels) break;

        const posX = startX + c * stepX;
        const posZ = startZ + r * stepZ;

        const panelMesh = SolarPanelBuilder.createFlexiblePanelMesh(
          pW,
          pL,
          panelThickness,
          `PainelFlexivel_${levelIndex}_${r}_${c}`,
          panelSpecs
        );

        panelMesh.position.set(posX, yLevel + 0.015 + (panelThickness / 2), posZ);
        tray.add(panelMesh);
        countPlaced++;
      }
    }

    targetGroup.add(tray);
  }
}
