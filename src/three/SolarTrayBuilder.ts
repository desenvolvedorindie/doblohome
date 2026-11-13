import * as THREE from 'three';
import { MaterialLibrary } from './Materials';
import { AluminumExtrusionFactory } from './AluminumExtrusion';
import { SolarPanelBuilder } from './SolarPanelBuilder';
import { TelescopicRailsBuilder } from './TelescopicRails';
import { StructureMaterial, AluminumColor, SlideDirection, PanelOrientation, SteelProfileUnit, getSteelProfileSpec } from '../types';

export interface TrayDimensions {
  panelW: number;
  panelL: number;
  cols: number;
  rows: number;
  panelCount: number;
  trayWidth: number;
  trayLength: number;
}

export interface MotionPlan {
  dir: SlideDirection;
  travelA: number;
  travelB: number;
}

/**
 * Construtor das Bandejas e Níveis de Painéis Solares
 * Calcula dimensões paramétricas, monta quadros perimetrais em T-slot 30x30,
 * travessas divisórias segmentadas e instala as placas fotovoltaicas flexíveis.
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
    steelProfileUnit: SteelProfileUnit = 'mm'
  ) {
    const mats = MaterialLibrary.materials;
    const tray = new THREE.Group();
    tray.name = labelText;

    const isAluminum = (structureMaterial === 'aluminum');
    const steelSpec30 = getSteelProfileSpec(30, steelProfileUnit);
    const frameMat = isAluminum
      ? (aluminumColor === 'black' ? mats.aluminumProfileBlack : mats.aluminumProfileSilver)
      : mats.weldedSteelMetalon;

    const tW = trayDims.trayWidth;
    const tL = trayDims.trayLength;
    const profileH = 0.030; // Perfil 30x30
    const innerTrayW = Math.max(0.10, tW - (profileH * 2));

    // Quadro Perimetral da Bandeja
    let sideL, sideR, frontBar, rearBar;
    if (isAluminum) {
      sideL = AluminumExtrusionFactory.createProfileMesh(tL, frameMat, { axis: 'z', size: 0.030 });
      sideR = AluminumExtrusionFactory.createProfileMesh(tL, frameMat, { axis: 'z', size: 0.030 });
      frontBar = AluminumExtrusionFactory.createProfileMesh(innerTrayW, frameMat, { axis: 'x', size: 0.030 });
      rearBar = AluminumExtrusionFactory.createProfileMesh(innerTrayW, frameMat, { axis: 'x', size: 0.030 });
    } else {
      const longGeo = new THREE.BoxGeometry(0.03, 0.03, tL);
      const crossGeo = new THREE.BoxGeometry(innerTrayW, 0.03, 0.03);
      sideL = new THREE.Mesh(longGeo, frameMat);
      sideR = new THREE.Mesh(longGeo, frameMat);
      frontBar = new THREE.Mesh(crossGeo, frameMat);
      rearBar = new THREE.Mesh(crossGeo, frameMat);
    }

    sideL.position.set(xCenter - tW / 2 + profileH / 2, yLevel, zCenter);
    sideR.position.set(xCenter + tW / 2 - profileH / 2, yLevel, zCenter);
    frontBar.position.set(xCenter, yLevel, zCenter + tL / 2 - profileH / 2);
    rearBar.position.set(xCenter, yLevel, zCenter - tL / 2 + profileH / 2);

    sideL.userData = { isBar: true, barLength: tL, barLabel: `Longarina da Bandeja (${labelText})`, profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : steelSpec30 };
    sideR.userData = { isBar: true, barLength: tL, barLabel: `Longarina da Bandeja (${labelText})`, profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : steelSpec30 };
    frontBar.userData = { isBar: true, barLength: innerTrayW, barLabel: `Travessa Frontal da Bandeja (${labelText})`, profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : steelSpec30 };
    rearBar.userData = { isBar: true, barLength: innerTrayW, barLabel: `Travessa Traseira da Bandeja (${labelText})`, profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : steelSpec30 };

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
        if (isAluminum) {
          midLongBar = AluminumExtrusionFactory.createProfileMesh(divLength, frameMat, { axis: 'z', size: 0.030 });
        } else {
          const midLongGeo = new THREE.BoxGeometry(0.03, 0.03, divLength);
          midLongBar = new THREE.Mesh(midLongGeo, frameMat);
        }
        midLongBar.position.set(xDiv, yLevel, zCenter);
        midLongBar.castShadow = true;
        midLongBar.userData = { isBar: true, barLength: divLength, barLabel: 'Longarina Central da Bandeja', profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : steelSpec30 };
        tray.add(midLongBar);
      }
    }

    if (rows > 1) {
      for (let r = 0; r < rows - 1; r++) {
        const zDiv = startZ + r * stepZ + (pL / 2) + (gapRow / 2);

        if (cols === 1) {
          const divWidth = tW - (profileH * 2);
          let midCrossBar;
          if (isAluminum) {
            midCrossBar = AluminumExtrusionFactory.createProfileMesh(divWidth, frameMat, { axis: 'x', size: 0.030 });
          } else {
            const midCrossGeo = new THREE.BoxGeometry(divWidth, 0.03, 0.03);
            midCrossBar = new THREE.Mesh(midCrossGeo, frameMat);
          }
          midCrossBar.position.set(xCenter, yLevel, zDiv);
          midCrossBar.castShadow = true;
          midCrossBar.userData = { isBar: true, barLength: divWidth, barLabel: 'Travessa Divisória da Bandeja', profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : steelSpec30 };
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
            if (isAluminum) {
              segMesh = AluminumExtrusionFactory.createProfileMesh(segW, frameMat, { axis: 'x', size: 0.030 });
            } else {
              const segGeo = new THREE.BoxGeometry(segW, 0.03, 0.03);
              segMesh = new THREE.Mesh(segGeo, frameMat);
            }
            segMesh.position.set(segCenterX, yLevel, zDiv);
            segMesh.castShadow = true;
            segMesh.userData = { isBar: true, barLength: segW, barLabel: 'Travessa Divisória da Bandeja', profileSpec: isAluminum ? 'Perfil T-Slot 30x30' : steelSpec30 };
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

  /**
   * Constrói um nível completo (Nível 1 ou 2) configurando bandejas e corrediças telescópicas
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
    steelProfileUnit: SteelProfileUnit = 'mm'
  ): MotionPlan {
    const panels = (levelConfig && levelConfig.panels) ? levelConfig.panels : 2;
    const orient = (levelConfig && levelConfig.orientation) ? levelConfig.orientation : 'longitudinal';
    const dir = (levelConfig && levelConfig.slideDirection)
      ? levelConfig.slideDirection
      : (levelNumber === 1 ? 'longitudinal' : 'fixed');

    const l2Length = refL2Dims ? refL2Dims.trayLength : 1.08;
    const l2Width = refL2Dims ? refL2Dims.trayWidth : 1.28;

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
        steelProfileUnit
      );
      return { dir: 'fixed', travelA: 0, travelB: 0 };
    }

    if (dir === 'longitudinal') {
      let frontCount = 0;
      let rearCount = 0;
      if (panels === 1) { frontCount = 0; rearCount = 1; }
      else if (panels === 2) { frontCount = 1; rearCount = 1; }
      else if (panels === 3) { frontCount = 2; rearCount = 1; }
      else if (panels === 4) { frontCount = 2; rearCount = 2; }

      const yFront = yUpper;
      const yRear = yLower;
      let travelFront = 0;
      let travelRear = 0;

      // Posiciona as gavetas retraídas alinhadas sob as bordas dianteira/traseira da placa superior (Nível 2),
      // saindo diretamente a partir da borda da placa superior para fora com o curso mínimo necessário
      const upperFrontEdgeZ = zCenter + (l2Length / 2);
      const upperRearEdgeZ = zCenter - (l2Length / 2);

      if (frontCount > 0) {
        const frontDims = this.calculateTrayDimensions(frontCount, orient, panelSpecs);
        const zStartFront = upperFrontEdgeZ - (frontDims.trayLength / 2);
        this.buildTrayLevel(
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
          steelProfileUnit
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
        // Curso total de expansão com sobreelevação/deslocamento para livrar completamente a travessa superior do Nível 2
        travelFront = Math.max(0.20, frontDims.trayLength + 0.14);
      }

      if (rearCount > 0) {
        const rearDims = this.calculateTrayDimensions(rearCount, orient, panelSpecs);
        const zStartRear = upperRearEdgeZ + (rearDims.trayLength / 2);
        this.buildTrayLevel(
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
          steelProfileUnit
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
        // Curso total de expansão com sobreelevação/deslocamento para livrar completamente a travessa superior do Nível 2
        travelRear = Math.max(0.20, rearDims.trayLength + 0.14);
      }

      return { dir: 'longitudinal', travelA: travelFront, travelB: travelRear };
    }

    if (dir === 'lateral') {
      let leftCount = 0;
      let rightCount = 0;
      if (panels === 1) { leftCount = 0; rightCount = 1; }
      else if (panels === 2) { leftCount = 1; rightCount = 1; }
      else if (panels === 3) { leftCount = 2; rightCount = 1; }
      else if (panels === 4) { leftCount = 2; rightCount = 2; }

      const yLeft = yUpper;
      const yRight = yLower;
      let travelLeft = 0;
      let travelRight = 0;

      const upperLeftEdgeX = -(l2Width / 2);
      const upperRightEdgeX = (l2Width / 2);

      if (leftCount > 0) {
        const leftDims = this.calculateTrayDimensions(leftCount, orient, panelSpecs);
        const xStartLeft = upperLeftEdgeX + (leftDims.trayWidth / 2);
        this.buildTrayLevel(
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
          steelProfileUnit
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
        // Curso total lateral para livrar completamente a longarina e borda superior
        travelLeft = Math.max(0.20, leftDims.trayWidth + 0.14);
      }

      if (rightCount > 0) {
        const rightDims = this.calculateTrayDimensions(rightCount, orient, panelSpecs);
        const xStartRight = upperRightEdgeX - (rightDims.trayWidth / 2);
        this.buildTrayLevel(
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
          steelProfileUnit
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
        // Curso total lateral para livrar completamente a longarina e borda superior
        travelRight = Math.max(0.20, rightDims.trayWidth + 0.14);
      }

      return { dir: 'lateral', travelA: travelLeft, travelB: travelRight };
    }

    if (dir === 'rear_only') {
      const rearDims = this.calculateTrayDimensions(panels, orient, panelSpecs);
      const upperRearEdgeZ = zCenter - (l2Length / 2);
      const zStartRear = upperRearEdgeZ + (rearDims.trayLength / 2);
      this.buildTrayLevel(
        targetGroupB,
        rearDims,
        0,
        yLower,
        zStartRear,
        levelNumber,
        `Nível ${levelNumber} (Extensão Traseira)`,
        structureMaterial,
        aluminumColor,
        panelSpecs.thickness,
        panelSpecs,
        steelProfileUnit
      );
      TelescopicRailsBuilder.addLongitudinalRails(
        fixedFrameGroup,
        interGroup2,
        targetGroupB,
        rearDims.trayWidth,
        rearDims.trayLength,
        0,
        yLower,
        zStartRear,
        -1,
        baseTopY
      );
      const travel = Math.max(0.20, rearDims.trayLength + 0.14);
      return { dir: 'rear_only', travelA: 0, travelB: travel };
    }

    if (dir === 'front_only') {
      const frontDims = this.calculateTrayDimensions(panels, orient, panelSpecs);
      const upperFrontEdgeZ = zCenter + (l2Length / 2);
      const zStartFront = upperFrontEdgeZ - (frontDims.trayLength / 2);
      this.buildTrayLevel(
        targetGroupA,
        frontDims,
        0,
        yUpper,
        zStartFront,
        levelNumber,
        `Nível ${levelNumber} (Extensão Dianteira)`,
        structureMaterial,
        aluminumColor,
        panelSpecs.thickness,
        panelSpecs,
        steelProfileUnit
      );
      TelescopicRailsBuilder.addLongitudinalRails(
        fixedFrameGroup,
        interGroup1,
        targetGroupA,
        frontDims.trayWidth,
        frontDims.trayLength,
        0,
        yUpper,
        zStartFront,
        +1,
        baseTopY
      );
      const travel = Math.max(0.20, frontDims.trayLength + 0.14);
      return { dir: 'front_only', travelA: travel, travelB: 0 };
    }

    return { dir: 'fixed', travelA: 0, travelB: 0 };
  }
}

