import * as THREE from 'three';
import { InternalBoxItem } from '../../types';
import {
  PLYWOOD_THICKNESS,
  FLOOR_Y,
  getBoxThickness,
  getWoodMaterialName,
  getUpperCabinetExclusionZones,
  createPerforatedGeometry,
  addPerforatedPanel,
  addPanel,
  buildHollowBox
} from './BoxGeometryHelpers';

export class DrawerBuilder {
    buildDrawerModule(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    mat: THREE.Material,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean
  ) {
    const tConfig = getBoxThickness(box);
    const tTop = tConfig.top;
    const tBottom = tConfig.bottom;
    const tLeft = tConfig.left;
    const tRight = tConfig.right;
    const tFront = tConfig.front;
    const tRear = tConfig.rear;
    const tDef = tConfig.default;
    const woodMat = getWoodMaterialName(box.material);
    const tTopMm = Math.round(tTop * 1000);
    const tBottomMm = Math.round(tBottom * 1000);
    const tLeftMm = Math.round(tLeft * 1000);
    const tRightMm = Math.round(tRight * 1000);
    const tFrontMm = Math.round(tFront * 1000);
    const tDefMm = Math.round(tDef * 1000);

    const edgeMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0x38bdf8 : 0x475569,
      linewidth: 1,
      transparent: true,
      opacity: 0.65
    });

    const isSlideTray = box.type === 'slide_tray' || box.drawerMode === 'slide_tray';
    const isDrawer = box.type === 'drawer' || isSlideTray;

    const hasTop = box.panels?.top ?? true;
    const hasLeft = box.panels?.left ?? true;
    const hasRight = box.panels?.right ?? true;
    const hasFront = box.panels?.front ?? true;
    // O vão traseiro (-Z, virado para o porta-malas) de gavetões e bandejas corrediças
    // deve ser SEMPRE 100% vazado/aberto para permitir que a bandeja ou gaveta deslize para fora da Doblò.
    const hasRear = isDrawer ? false : (box.panels?.rear ?? false);
    const hasBottom = box.panels?.bottom ?? false;

    // 1. Gabinete / Carcaça externa fixa
    const cabinetMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2
    });

    const sideH = Math.max(0.01, h - (hasTop ? tTop : 0) - (hasBottom ? tBottom : 0));
    const sideY = hasBottom ? (-h / 2 + tBottom + sideH / 2) : (hasTop ? -tTop / 2 : 0);

    // Tampo superior
    if (hasTop) {
      const exclusionZones = box ? getUpperCabinetExclusionZones(box, w, l) : [];
      const hasCabExcl = exclusionZones.length > 0;
      const topLabel = hasCabExcl
        ? `${box.name} • Tampo Superior Vazado CNC c/ Apoio do Aéreo (${tTopMm}mm)`
        : `${box.name} • Tampo Superior Vazado (${tTopMm}mm)`;
      if (box.topPerforated) {
        addPerforatedPanel(container, w, tTop, l, 0, h / 2 - tTop / 2, 0, cabinetMat, edgeMat, box.id, container, topLabel, box, {
          thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
        });
      } else {
        addPanel(container, w, tTop, l, 0, h / 2 - tTop / 2, 0, cabinetMat, edgeMat, box.id, container, `${box.name} • Tampo Superior (${tTopMm}mm)`, {
          thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: `${woodMat} ${tTopMm}mm Impermeabilizado`
        });
      }
    }
    // Fundo inferior próprio
    if (hasBottom) {
      addPanel(container, w, tBottom, l, 0, -h / 2 + tBottom / 2, 0, cabinetMat, edgeMat, box.id, container, `${box.name} • Base Carcaça (${tBottomMm}mm)`, {
        thicknessMm: tBottomMm, woodMaterial: woodMat, moduleName: box.name, partType: 'bottom', material: `${woodMat} ${tBottomMm}mm Impermeabilizado`
      });
    }
    // Lateral Esquerda (+X / motorista)
    if (hasLeft) {
      addPanel(container, tLeft, sideH, l, w / 2 - tLeft / 2, sideY, 0, cabinetMat, edgeMat, box.id, container, `${box.name} • Lateral Esq. Carcaça (${tLeftMm}mm)`, {
        thicknessMm: tLeftMm, woodMaterial: woodMat, moduleName: box.name, partType: 'left', material: `${woodMat} ${tLeftMm}mm Impermeabilizado`
      });
    }
    // Lateral Direita (-X / passageiro)
    if (hasRight) {
      addPanel(container, tRight, sideH, l, -w / 2 + tRight / 2, sideY, 0, cabinetMat, edgeMat, box.id, container, `${box.name} • Lateral Dir. Carcaça (${tRightMm}mm)`, {
        thicknessMm: tRightMm, woodMaterial: woodMat, moduleName: box.name, partType: 'right', material: `${woodMat} ${tRightMm}mm Impermeabilizado`
      });
    }

    // Cálculo do vão interno da carcaça para acomodar a gaveta
    const cabXMin = hasRight ? (-w / 2 + tRight) : (-w / 2);
    const cabXMax = hasLeft ? (w / 2 - tLeft) : (w / 2);
    const cabInnerW = Math.max(0.01, cabXMax - cabXMin);
    const cabCenterX = (cabXMin + cabXMax) / 2;

    // Fundo frontal (+Z, virado para os bancos dianteiros)
    if (hasFront) {
      addPanel(container, cabInnerW, sideH, tFront, cabCenterX, sideY, l / 2 - tFront / 2, cabinetMat, edgeMat, box.id, container, `${box.name} • Fundo Frontal Carcaça (${tFrontMm}mm)`, {
        thicknessMm: tFrontMm, woodMaterial: woodMat, moduleName: box.name, partType: 'front', material: `${woodMat} ${tFrontMm}mm Impermeabilizado`
      });
    }
    // Fechamento traseiro (-Z, virado para o porta-malas) se explicitamente ativado (nunca para gavetão ou bandeja corrediça, que devem ser 100% vazados para deslizamento)
    if (hasRear && !isDrawer) {
      const tRearMm = Math.round(tRear * 1000);
      addPanel(container, cabInnerW, sideH, tRear, cabCenterX, sideY, -l / 2 + tRear / 2, cabinetMat, edgeMat, box.id, container, `${box.name} • Fechamento Traseiro (${tRearMm}mm)`, {
        thicknessMm: tRearMm, woodMaterial: woodMat, moduleName: box.name, partType: 'rear', material: `${woodMat} ${tRearMm}mm Impermeabilizado`
      });
    }

    // 2. Gaveta interna deslizante (oca, com chapas, topo aberto e fundo móvel para carregar objetos)
    const drawerGroup = new THREE.Group();
    drawerGroup.name = 'DrawerSlide';

    // Deslocamento para fora quando aberta (desliza para trás, em direção ao porta-malas, eixo -Z)
    const slideOffsetZ = isOpen ? -l * 0.75 : 0;
    drawerGroup.position.set(0, 0, slideOffsetZ);

    // Dimensões da gaveta com folga de 6mm de cada lado para as corrediças telescópicas
    const clearance = 0.012;
    const dW = Math.max(0.05, cabInnerW - clearance);
    const dH = Math.max(0.05, sideH - clearance);
    const dL = Math.max(0.05, l - (hasFront ? tFront : 0) - 0.01);
    const drawerCenterZ = tDef / 2;
    // Caixa / Bandeja móvel deslizante (com fundo pois desliza no ar para fora da Doblò)
    const drawerBodyGroup = new THREE.Group();
    drawerBodyGroup.position.set(cabCenterX, 0, drawerCenterZ);

    if (isSlideTray) {
      // Bandeja Corrediça Rasa (para Geladeira 12V / Fogão portátil):
      // Fundo plano + 4 abas baixas de contenção (45mm de altura)
      const lipH = 0.045;
      const trayY = -dH / 2 + tBottom / 2;

      // Base plana da bandeja
      addPanel(
        drawerBodyGroup,
        dW,
        tBottom,
        dL,
        0,
        trayY,
        0,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Base Bandeja Corrediça Rasa (${tBottomMm}mm)`,
        { thicknessMm: tBottomMm, woodMaterial: woodMat, moduleName: box.name, partType: 'bottom', material: `${woodMat} ${tBottomMm}mm Impermeabilizado` }
      );

      // Abas de contenção (Laterais, traseira e frontal de 45mm)
      addPanel(drawerBodyGroup, tLeft, lipH, dL, dW / 2 - tLeft / 2, trayY + tBottom / 2 + lipH / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Aba Baixa Lateral Esq. (${tLeftMm}mm)`, {
        thicknessMm: tLeftMm, woodMaterial: woodMat, moduleName: box.name, partType: 'left', material: `${woodMat} ${tLeftMm}mm`
      });
      addPanel(drawerBodyGroup, tRight, lipH, dL, -dW / 2 + tRight / 2, trayY + tBottom / 2 + lipH / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Aba Baixa Lateral Dir. (${tRightMm}mm)`, {
        thicknessMm: tRightMm, woodMaterial: woodMat, moduleName: box.name, partType: 'right', material: `${woodMat} ${tRightMm}mm`
      });
      addPanel(drawerBodyGroup, dW - tLeft - tRight, lipH, tRear, 0, trayY + tBottom / 2 + lipH / 2, dL / 2 - tRear / 2, mat, edgeMat, box.id, container, `${box.name} • Aba Baixa Traseira (${Math.round(tRear * 1000)}mm)`, {
        thicknessMm: Math.round(tRear * 1000), woodMaterial: woodMat, moduleName: box.name, partType: 'rear', material: `${woodMat} ${Math.round(tRear * 1000)}mm`
      });
      addPanel(drawerBodyGroup, dW - tLeft - tRight, lipH, tFront, 0, trayY + tBottom / 2 + lipH / 2, -dL / 2 + tFront / 2, mat, edgeMat, box.id, container, `${box.name} • Aba Baixa Frontal (${tFrontMm}mm)`, {
        thicknessMm: tFrontMm, woodMaterial: woodMat, moduleName: box.name, partType: 'front', material: `${woodMat} ${tFrontMm}mm`
      });

      // Puxador rebaixado na aba frontal
      const handleGeo = new THREE.BoxGeometry(Math.min(0.20, dW * 0.4), 0.020, 0.015);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.set(0, trayY + tBottom / 2 + lipH / 2, -dL / 2 - 0.01);
      handleMesh.userData = {
        isInternalBox: true,
        isHardware: true,
        boxId: box.id,
        boxRoot: container,
        moduleName: box.name,
        partLabel: `${box.name} • Puxador Metálico Embutido`,
        category: '🔩 Ferragens de Gaveteiros e Bandejas'
      };
      drawerBodyGroup.add(handleMesh);

      // Par de corrediças telescópicas pesadas com trava de fim de curso
      [-dW / 2 - 0.005, dW / 2 + 0.005].forEach((railX, idx) => {
        const railGeo = new THREE.BoxGeometry(0.008, 0.035, dL);
        const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });
        const railMesh = new THREE.Mesh(railGeo, railMat);
        railMesh.position.set(railX, trayY + 0.02, 0);
        railMesh.userData = {
          isHardware: true,
          partLabel: `Par de Corrediças Telescópicas Reforçadas 45kg c/ Trava (${idx === 0 ? 'Esq.' : 'Dir.'})`,
          category: '🔩 Ferragens de Gaveteiros e Bandejas'
        };
        drawerBodyGroup.add(railMesh);
      });
    } else {
      // Gaveteiro Alto Fechado Convencional
      buildHollowBox(drawerBodyGroup, dW, dH, dL, tDef, mat, edgeMat, true, box.id, container, undefined, box.name, box);

      // Renomeia as peças internas da gaveta mantendo moduleName limpo e identificando-as claramente no hover/corte
      drawerBodyGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.userData?.isWoodPart) {
          const pt = child.userData.partType;
          const pThickMm = child.userData.thicknessMm || tDefMm;
          child.userData.moduleName = box.name;
          if (pt === 'bottom') {
            child.userData.partLabel = `${box.name} • Fundo Base da Gaveta (${pThickMm}mm)`;
          } else if (pt === 'left') {
            child.userData.partLabel = `${box.name} • Lateral Esquerda da Gaveta (${pThickMm}mm)`;
          } else if (pt === 'right') {
            child.userData.partLabel = `${box.name} • Lateral Direita da Gaveta (${pThickMm}mm)`;
          } else if (pt === 'front') {
            child.userData.partLabel = `${box.name} • Contra-Frente Interna da Gaveta (${pThickMm}mm)`;
          } else if (pt === 'rear') {
            child.userData.partLabel = `${box.name} • Parede Traseira da Gaveta (${pThickMm}mm)`;
          }
        }
      });

      // Frente da gaveta
      const frontFaceW = w - 0.008;
      const frontFaceH = h - 0.008;
      addPanel(
        drawerGroup,
        frontFaceW,
        frontFaceH,
        tFront,
        0,
        0,
        -l / 2 - tFront / 2,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Frente Externa Gaveta (${tFrontMm}mm)`,
        { thicknessMm: tFrontMm, woodMaterial: woodMat, moduleName: box.name, partType: 'front', material: `${woodMat} ${tFrontMm}mm` }
      );

      // Puxador metálico embutido
      const handleGeo = new THREE.BoxGeometry(Math.min(0.24, dW * 0.5), 0.024, 0.02);
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.2
      });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.set(0, 0, -l / 2 - tFront - 0.01);
      handleMesh.userData = {
        isInternalBox: true,
        isHardware: true,
        boxId: box.id,
        boxRoot: container,
        moduleName: box.name,
        partLabel: `${box.name} • Puxador Metálico Embutido`,
        category: '🔩 Ferragens de Gaveteiros e Bandejas'
      };
      drawerGroup.add(handleMesh);
    }

    drawerGroup.add(drawerBodyGroup);

    // Hitbox da gaveta quando estendida para fora
    const drawerHitGeo = new THREE.BoxGeometry(dW, dH, dL);
    const drawerHitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const drawerHitMesh = new THREE.Mesh(drawerHitGeo, drawerHitMat);
    drawerHitMesh.name = '__box_hitbox';
    drawerHitMesh.position.set(cabCenterX, 0, drawerCenterZ);
    drawerHitMesh.userData = {
      isInternalBoxHitbox: true,
      isInternalBox: true,
      boxId: box.id,
      boxRoot: container
    };
    drawerGroup.add(drawerHitMesh);

    container.add(drawerGroup);
  }

}
