import * as THREE from 'three';
import { InternalBoxItem, BoxSlideDirection } from '../../types';
import {
  getBoxThickness,
  getWoodMaterialName,
  getUpperCabinetExclusionZones,
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
    const slideDir: BoxSlideDirection = box.slideDirection || 'rear';
    const isTransverse = slideDir === 'left' || slideDir === 'right';

    const hasTop = box.panels?.top ?? true;
    const hasBottom = box.panels?.bottom ?? false;

    // A face para a qual a gaveta/bandeja desliza fica sempre 100% vazada na carcaça externa
    const hasRear = slideDir === 'rear' ? false : (box.panels?.rear ?? true);
    const hasFront = slideDir === 'front' ? false : (box.panels?.front ?? true);
    const hasLeft = slideDir === 'left' ? false : (box.panels?.left ?? true);
    const hasRight = slideDir === 'right' ? false : (box.panels?.right ?? true);

    const jointStyle = box.boxJointStyle || 'top_bottom_cap';
    const backCoverMode = box.boxBackCoverMode || (jointStyle === 'back_over_all' ? 'overlay_all' : 'inset');
    const isSidesOutside = jointStyle === 'sides_outside';
    // Qual face funciona como o "fundo oposto" da gaveta
    const isBackOverlay = backCoverMode === 'overlay_all' || jointStyle === 'back_over_all';

    // 1. Gabinete / Carcaça externa fixa
    // Para bandeja corrediça rasa (slide_tray): a carcaça usa o mesmo material
    // selecionado pelo usuário (mat), pois não há distinção visual necessária entre
    // carcaça e bandeja. Para gaveta convencional (drawer): carcaça escura estrutural.
    const cabinetMat = isSlideTray
      ? mat
      : new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.8,
          metalness: 0.2
        });

    const sideH = isSidesOutside
      ? h
      : Math.max(0.01, h - (hasTop ? tTop : 0) - (hasBottom ? tBottom : 0));
    const sideY = isSidesOutside
      ? 0
      : (hasBottom ? (-h / 2 + tBottom + sideH / 2) : (hasTop ? -tTop / 2 : 0));

    // Cálculo do vão interno da carcaça para acomodar a gaveta
    const cabXMin = hasRight ? (-w / 2 + tRight) : (-w / 2);
    const cabXMax = hasLeft ? (w / 2 - tLeft) : (w / 2);
    const cabInnerW = Math.max(0.01, cabXMax - cabXMin);
    const cabCenterX = (cabXMin + cabXMax) / 2;

    const cabZMin = hasRear ? (-l / 2 + tRear) : (-l / 2);
    const cabZMax = hasFront ? (l / 2 - tFront) : (l / 2);
    const cabInnerL = Math.max(0.01, cabZMax - cabZMin);
    const cabCenterZ = (cabZMin + cabZMax) / 2;

    // Se o fundo oposto à abertura for sobreposto (overlay_all), desconta a espessura dele nas laterais/tampo/base:
    const backDiscountZ = (isBackOverlay && ((slideDir === 'rear' && hasFront) || (slideDir !== 'rear' && hasRear)))
      ? (slideDir === 'rear' ? tFront : tRear)
      : 0;
    const backOffsetZ = (isBackOverlay && ((slideDir === 'rear' && hasFront) || (slideDir !== 'rear' && hasRear)))
      ? (slideDir === 'rear' ? -tFront / 2 : tRear / 2)
      : 0;
    const panelLengthZ = Math.max(0.01, l - backDiscountZ);

    const topBottomW = isSidesOutside ? cabInnerW : w;
    const topBottomX = isSidesOutside ? cabCenterX : 0;

    // Tampo superior
    if (hasTop) {
      const exclusionZones = box ? getUpperCabinetExclusionZones(box, w, l) : [];
      const hasCabExcl = exclusionZones.length > 0;
      const topLabel = hasCabExcl
        ? `${box.name} • Tampo Superior Vazado CNC c/ Apoio do Aéreo (${tTopMm}mm)`
        : `${box.name} • Tampo Superior Vazado (${tTopMm}mm)`;
      if (box.topPerforated) {
        addPerforatedPanel(container, topBottomW, tTop, panelLengthZ, topBottomX, h / 2 - tTop / 2, backOffsetZ, cabinetMat, edgeMat, box.id, container, topLabel, box, {
          thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
        });
      } else {
        addPanel(container, topBottomW, tTop, panelLengthZ, topBottomX, h / 2 - tTop / 2, backOffsetZ, cabinetMat, edgeMat, box.id, container, `${box.name} • Tampo Superior (${Math.round(topBottomW * 1000)}×${Math.round(panelLengthZ * 1000)}×${tTopMm}mm)`, {
          thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: `${woodMat} ${tTopMm}mm Impermeabilizado`
        });
      }
    }
    // Fundo inferior próprio da carcaça
    if (hasBottom) {
      addPanel(container, topBottomW, tBottom, panelLengthZ, topBottomX, -h / 2 + tBottom / 2, backOffsetZ, cabinetMat, edgeMat, box.id, container, `${box.name} • Base Carcaça (${Math.round(topBottomW * 1000)}×${Math.round(panelLengthZ * 1000)}×${tBottomMm}mm)`, {
        thicknessMm: tBottomMm, woodMaterial: woodMat, moduleName: box.name, partType: 'bottom', material: `${woodMat} ${tBottomMm}mm Impermeabilizado`
      });
    }

    // Altura interna entre tampo e base para o fundo embutido
    const innerVertH = Math.max(0.01, h - (hasTop ? tTop : 0) - (hasBottom ? tBottom : 0));
    const innerVertY = hasBottom ? (-h / 2 + tBottom + innerVertH / 2) : (hasTop ? -tTop / 2 : 0);

    // Paredes verticais da carcaça
    if (hasLeft) {
      addPanel(container, tLeft, sideH, panelLengthZ, w / 2 - tLeft / 2, sideY, backOffsetZ, cabinetMat, edgeMat, box.id, container, `${box.name} • Lateral Esq. Carcaça (${Math.round(panelLengthZ * 1000)}×${Math.round(sideH * 1000)}×${tLeftMm}mm)`, {
        thicknessMm: tLeftMm, woodMaterial: woodMat, moduleName: box.name, partType: 'left', material: `${woodMat} ${tLeftMm}mm Impermeabilizado`
      });
    }
    if (hasRight) {
      addPanel(container, tRight, sideH, panelLengthZ, -w / 2 + tRight / 2, sideY, backOffsetZ, cabinetMat, edgeMat, box.id, container, `${box.name} • Lateral Dir. Carcaça (${Math.round(panelLengthZ * 1000)}×${Math.round(sideH * 1000)}×${tRightMm}mm)`, {
        thicknessMm: tRightMm, woodMaterial: woodMat, moduleName: box.name, partType: 'right', material: `${woodMat} ${tRightMm}mm Impermeabilizado`
      });
    }
    if (hasFront) {
      const isFrontServingAsBack = slideDir === 'rear';
      const fW = (isFrontServingAsBack && isBackOverlay) ? w : cabInnerW;
      const fH = (isFrontServingAsBack && isBackOverlay) ? h : innerVertH;
      const fX = (isFrontServingAsBack && isBackOverlay) ? 0 : cabCenterX;
      const fY = (isFrontServingAsBack && isBackOverlay) ? 0 : innerVertY;
      const fLabel = (isFrontServingAsBack && isBackOverlay)
        ? `${box.name} • Tampo de Fundo Carcaça (Fecha 5 Partes • ${Math.round(fW * 1000)}×${Math.round(fH * 1000)}×${tFrontMm}mm)`
        : `${box.name} • Fundo Frontal Carcaça (${Math.round(fW * 1000)}×${Math.round(fH * 1000)}×${tFrontMm}mm)`;
      addPanel(container, fW, fH, tFront, fX, fY, l / 2 - tFront / 2, cabinetMat, edgeMat, box.id, container, fLabel, {
        thicknessMm: tFrontMm, woodMaterial: woodMat, moduleName: box.name, partType: 'front', material: `${woodMat} ${tFrontMm}mm Impermeabilizado`
      });
    }
    if (hasRear) {
      const tRearMm = Math.round(tRear * 1000);
      const rW = isBackOverlay ? w : cabInnerW;
      const rH = isBackOverlay ? h : innerVertH;
      const rX = isBackOverlay ? 0 : cabCenterX;
      const rY = isBackOverlay ? 0 : innerVertY;
      const rLabel = isBackOverlay
        ? `${box.name} • Tampo Traseiro Carcaça (Fecha 5 Partes • ${Math.round(rW * 1000)}×${Math.round(rH * 1000)}×${tRearMm}mm)`
        : `${box.name} • Fechamento Traseiro Carcaça (4 Partes • ${Math.round(rW * 1000)}×${Math.round(rH * 1000)}×${tRearMm}mm)`;
      addPanel(container, rW, rH, tRear, rX, rY, -l / 2 + tRear / 2, cabinetMat, edgeMat, box.id, container, rLabel, {
        thicknessMm: tRearMm, woodMaterial: woodMat, moduleName: box.name, partType: 'rear', material: `${woodMat} ${tRearMm}mm Impermeabilizado`
      });
    }

    // 2. Gaveta interna deslizante / Bandeja corrediça
    const drawerGroup = new THREE.Group();
    drawerGroup.name = 'DrawerSlide';

    const clearance = 0.012;
    let slideOffsetX = 0;
    let slideOffsetZ = 0;
    let dW = 0;
    let dL = 0;
    const dH = Math.max(0.05, sideH - clearance);

    if (slideDir === 'rear') {
      slideOffsetZ = isOpen ? -l * 0.75 : 0;
      dW = Math.max(0.05, cabInnerW - clearance);
      dL = Math.max(0.05, cabInnerL - 0.01);
    } else if (slideDir === 'front') {
      slideOffsetZ = isOpen ? l * 0.75 : 0;
      dW = Math.max(0.05, cabInnerW - clearance);
      dL = Math.max(0.05, cabInnerL - 0.01);
    } else if (slideDir === 'left') {
      slideOffsetX = isOpen ? w * 0.75 : 0;
      dW = Math.max(0.05, cabInnerW - 0.01);
      dL = Math.max(0.05, cabInnerL - clearance);
    } else { // 'right'
      slideOffsetX = isOpen ? -w * 0.75 : 0;
      dW = Math.max(0.05, cabInnerW - 0.01);
      dL = Math.max(0.05, cabInnerL - clearance);
    }

    drawerGroup.position.set(slideOffsetX, 0, slideOffsetZ);

    const trayY = -dH / 2 + tBottom / 2;
    drawerGroup.userData = {
      isDrawerSlide: true,
      slideDirection: slideDir,
      cabCenterX,
      cabCenterZ,
      trayY,
      trayTopY: trayY + tBottom / 2,
      dW,
      dL,
      dH,
      tBottom,
      isOpen
    };

    const drawerBodyGroup = new THREE.Group();
    drawerBodyGroup.name = 'DrawerBody';
    drawerBodyGroup.position.set(cabCenterX, 0, cabCenterZ);

    if (isSlideTray) {
      // Bandeja Corrediça Rasa (para Geladeira 12V / Fogão portátil):
      // Fundo plano + 4 abas baixas de contenção (45mm de altura)
      const lipH = 0.045;

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
      addPanel(drawerBodyGroup, dW - tLeft - tRight, lipH, tRear, 0, trayY + tBottom / 2 + lipH / 2, -dL / 2 + tRear / 2, mat, edgeMat, box.id, container, `${box.name} • Aba Baixa Traseira (${Math.round(tRear * 1000)}mm)`, {
        thicknessMm: Math.round(tRear * 1000), woodMaterial: woodMat, moduleName: box.name, partType: 'rear', material: `${woodMat} ${Math.round(tRear * 1000)}mm`
      });
      addPanel(drawerBodyGroup, dW - tLeft - tRight, lipH, tFront, 0, trayY + tBottom / 2 + lipH / 2, dL / 2 - tFront / 2, mat, edgeMat, box.id, container, `${box.name} • Aba Baixa Frontal (${tFrontMm}mm)`, {
        thicknessMm: tFrontMm, woodMaterial: woodMat, moduleName: box.name, partType: 'front', material: `${woodMat} ${tFrontMm}mm`
      });

      // Puxador embutido na aba frontal de abertura
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      let handleMesh: THREE.Mesh;
      if (slideDir === 'rear') {
        const handleGeo = new THREE.BoxGeometry(Math.min(0.20, dW * 0.4), 0.020, 0.015);
        handleMesh = new THREE.Mesh(handleGeo, handleMat);
        handleMesh.position.set(0, trayY + tBottom / 2 + lipH / 2, -dL / 2 - 0.01);
      } else if (slideDir === 'front') {
        const handleGeo = new THREE.BoxGeometry(Math.min(0.20, dW * 0.4), 0.020, 0.015);
        handleMesh = new THREE.Mesh(handleGeo, handleMat);
        handleMesh.position.set(0, trayY + tBottom / 2 + lipH / 2, dL / 2 + 0.01);
      } else if (slideDir === 'left') {
        const handleGeo = new THREE.BoxGeometry(0.015, 0.020, Math.min(0.20, dL * 0.4));
        handleMesh = new THREE.Mesh(handleGeo, handleMat);
        handleMesh.position.set(dW / 2 + 0.01, trayY + tBottom / 2 + lipH / 2, 0);
      } else { // 'right'
        const handleGeo = new THREE.BoxGeometry(0.015, 0.020, Math.min(0.20, dL * 0.4));
        handleMesh = new THREE.Mesh(handleGeo, handleMat);
        handleMesh.position.set(-dW / 2 - 0.01, trayY + tBottom / 2 + lipH / 2, 0);
      }
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
      if (!isTransverse) {
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
        [-dL / 2 - 0.005, dL / 2 + 0.005].forEach((railZ, idx) => {
          const railGeo = new THREE.BoxGeometry(dW, 0.035, 0.008);
          const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });
          const railMesh = new THREE.Mesh(railGeo, railMat);
          railMesh.position.set(0, trayY + 0.02, railZ);
          railMesh.userData = {
            isHardware: true,
            partLabel: `Par de Corrediças Telescópicas Reforçadas 45kg c/ Trava (${idx === 0 ? 'Trás' : 'Frente'})`,
            category: '🔩 Ferragens de Gaveteiros e Bandejas'
          };
          drawerBodyGroup.add(railMesh);
        });
      }
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

      // Frente externa da gaveta e puxador na direção correspondente
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.2
      });

      if (slideDir === 'rear') {
        addPanel(
          drawerGroup,
          w - 0.008,
          h - 0.008,
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
        const handleGeo = new THREE.BoxGeometry(Math.min(0.24, dW * 0.5), 0.024, 0.02);
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
      } else if (slideDir === 'front') {
        addPanel(
          drawerGroup,
          w - 0.008,
          h - 0.008,
          tFront,
          0,
          0,
          l / 2 + tFront / 2,
          mat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Frente Externa Gaveta (${tFrontMm}mm)`,
          { thicknessMm: tFrontMm, woodMaterial: woodMat, moduleName: box.name, partType: 'front', material: `${woodMat} ${tFrontMm}mm` }
        );
        const handleGeo = new THREE.BoxGeometry(Math.min(0.24, dW * 0.5), 0.024, 0.02);
        const handleMesh = new THREE.Mesh(handleGeo, handleMat);
        handleMesh.position.set(0, 0, l / 2 + tFront + 0.01);
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
      } else if (slideDir === 'left') {
        addPanel(
          drawerGroup,
          tLeft,
          h - 0.008,
          l - 0.008,
          w / 2 + tLeft / 2,
          0,
          0,
          mat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Frente Externa Gaveta (${tLeftMm}mm)`,
          { thicknessMm: tLeftMm, woodMaterial: woodMat, moduleName: box.name, partType: 'left', material: `${woodMat} ${tLeftMm}mm` }
        );
        const handleGeo = new THREE.BoxGeometry(0.02, 0.024, Math.min(0.24, dL * 0.5));
        const handleMesh = new THREE.Mesh(handleGeo, handleMat);
        handleMesh.position.set(w / 2 + tLeft + 0.01, 0, 0);
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
      } else { // 'right'
        addPanel(
          drawerGroup,
          tRight,
          h - 0.008,
          l - 0.008,
          -w / 2 - tRight / 2,
          0,
          0,
          mat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Frente Externa Gaveta (${tRightMm}mm)`,
          { thicknessMm: tRightMm, woodMaterial: woodMat, moduleName: box.name, partType: 'right', material: `${woodMat} ${tRightMm}mm` }
        );
        const handleGeo = new THREE.BoxGeometry(0.02, 0.024, Math.min(0.24, dL * 0.5));
        const handleMesh = new THREE.Mesh(handleGeo, handleMat);
        handleMesh.position.set(-w / 2 - tRight - 0.01, 0, 0);
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
    drawerHitMesh.position.set(cabCenterX, 0, cabCenterZ);
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
