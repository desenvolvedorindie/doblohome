import * as THREE from 'three';
import { InternalBoxItem, ChestHingeDirection } from '../../types';
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

export class ChestBuilder {
    buildChestModule(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    mat: THREE.Material,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean,
    hingeDirection: ChestHingeDirection = 'front'
  ) {
    const tConfig = getBoxThickness(box);
    const tTop = tConfig.top;
    const tTopMm = Math.round(tTop * 1000);
    const woodMat = getWoodMaterialName(box.material);

    const edgeMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0x38bdf8 : 0x78350f,
      linewidth: 1,
      transparent: true,
      opacity: 0.6
    });

    const hasTop = box.panels?.top ?? (box.type === 'chest');

    if (box.type === 'open') {
      const jointStyle = box.boxJointStyle || 'top_bottom_cap';
      const isSidesOutside = jointStyle === 'sides_outside';
      const isBackOverlay = (box.panels?.rear ?? true) && (box.boxBackCoverMode === 'overlay_all' || jointStyle === 'back_over_all');
      const zBackDiscount = isBackOverlay ? tConfig.rear : 0;
      const usableL = Math.max(0.01, l - zBackDiscount);
      const zCenterOffset = zBackDiscount / 2;

      const hasLeft = box.panels?.left ?? true;
      const hasRight = box.panels?.right ?? true;
      const xMin = hasRight ? (-w / 2 + tConfig.right) : (-w / 2);
      const xMax = hasLeft ? (w / 2 - tConfig.left) : (w / 2);
      const innerW = Math.max(0.01, xMax - xMin);
      const centerInnerX = (xMin + xMax) / 2;

      // Nicho aberto: 100% oco com paredes conforme tamponamento selecionado (SEM FUNDO por padrão)
      const openPanels = {
        ...box.panels,
        top: hasTop
      };
      buildHollowBox(container, w, h, l, tConfig.default, mat, edgeMat, false, box.id, container, openPanels, box.name, box);

      // Prateleiras internas do nicho aberto com beradinha anti-queda
      if (box.openShelves && box.openShelves > 0) {
        const numShelves = Math.max(1, Math.min(3, box.openShelves));
        const hasBottom = box.panels?.bottom ?? false;
        const bottomT = hasBottom ? tConfig.bottom : 0;
        const topT = hasTop ? tTop : 0;
        const innerH = h - bottomT - topT;
        const interiorBottomY = -h / 2 + bottomT;
        const shelfSpacing = innerH / (numShelves + 1);
        const shelfT = tConfig.shelf;
        const shelfTMm = Math.round(tConfig.shelf * 1000);
        const lipH = 0.025; // 25mm de beradinha anti-queda

        const isOpenFront = box.panels?.front === false;
        const isOpenRear = box.panels?.rear === false;

        for (let s = 1; s <= numShelves; s++) {
          const shelfY = interiorBottomY + s * shelfSpacing;

          addPanel(
            container,
            innerW,
            shelfT,
            usableL,
            centerInnerX,
            shelfY,
            zCenterOffset,
            mat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Nicho Prateleira #${s} (${Math.round(innerW * 1000)}×${Math.round(usableL * 1000)}mm)`,
            {
              thicknessMm: shelfTMm,
              woodMaterial: woodMat,
              moduleName: box.name,
              partType: 'shelf',
              isNichoShelf: true,
              shelfIndex: s,
              material: `${woodMat} ${shelfTMm}mm Impermeabilizado`
            }
          );

          if (isOpenFront) {
            const frontLipZ = usableL / 2 - tConfig.default / 2 + zCenterOffset;
            const shelfLipY = shelfY + shelfT / 2 + lipH / 2;
            addPanel(
              container,
              innerW,
              lipH,
              tConfig.default,
              centerInnerX,
              shelfLipY,
              frontLipZ,
              mat,
              edgeMat,
              box.id,
              container,
              `${box.name} • Nicho Beradinha Anti-Queda Prateleira #${s} (Frente 25mm)`,
              {
                thicknessMm: Math.round(tConfig.default * 1000),
                woodMaterial: woodMat,
                moduleName: box.name,
                partType: 'lip',
                shelfIndex: s
              }
            );
          }

          if (isOpenRear) {
            const rearLipZ = -usableL / 2 + tConfig.default / 2 + zCenterOffset;
            const shelfLipY = shelfY + shelfT / 2 + lipH / 2;
            addPanel(
              container,
              innerW,
              lipH,
              tConfig.default,
              centerInnerX,
              shelfLipY,
              rearLipZ,
              mat,
              edgeMat,
              box.id,
              container,
              `${box.name} • Nicho Beradinha Anti-Queda Prateleira #${s} (Trás 25mm)`,
              {
                thicknessMm: Math.round(tConfig.default * 1000),
                woodMaterial: woodMat,
                moduleName: box.name,
                partType: 'lip',
                shelfIndex: s
              }
            );
          }
        }

        if (isOpenFront) {
          const frontLipZ = usableL / 2 - tConfig.default / 2 + zCenterOffset;
          const baseLipY = interiorBottomY + lipH / 2;
          addPanel(
            container,
            innerW,
            lipH,
            tConfig.default,
            centerInnerX,
            baseLipY,
            frontLipZ,
            mat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Nicho Beradinha Anti-Queda Base (Frente 25mm)`,
            {
              thicknessMm: Math.round(tConfig.default * 1000),
              woodMaterial: woodMat,
              moduleName: box.name,
              partType: 'lip'
            }
          );
        }

        if (isOpenRear) {
          const rearLipZ = -usableL / 2 + tConfig.default / 2 + zCenterOffset;
          const baseLipY = interiorBottomY + lipH / 2;
          addPanel(
            container,
            innerW,
            lipH,
            tConfig.default,
            centerInnerX,
            baseLipY,
            rearLipZ,
            mat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Nicho Beradinha Anti-Queda Base (Trás 25mm)`,
            {
              thicknessMm: Math.round(tConfig.default * 1000),
              woodMaterial: woodMat,
              moduleName: box.name,
              partType: 'lip'
            }
          );
        }
      }

      if (hasTop) {
        // Encaixe correto do tamponamento:
        // Se 'sides_outside', o tampo superior fica embutido entre as laterais (largura innerW).
        // Se 'top_bottom_cap' (padrão), o tampo cobre as laterais por cima (largura total w).
        const topW = isSidesOutside ? innerW : w;
        const topX = isSidesOutside ? centerInnerX : 0;
        const topL = usableL;
        const topZ = zCenterOffset;

        const exclusionZones = box ? getUpperCabinetExclusionZones(box, w, l) : [];
        const hasCabExcl = exclusionZones.length > 0;
        const openTopLabel = hasCabExcl
          ? `${box.name} • Tampo Superior Vazado CNC c/ Apoio do Aéreo (${tTopMm}mm)`
          : `${box.name} • Tampo Superior Vazado (${tTopMm}mm)`;
        if (box.topPerforated) {
          addPerforatedPanel(container, topW, tTop, topL, topX, h / 2 - tTop / 2, topZ, mat, edgeMat, box.id, container, openTopLabel, box, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
          });
        } else {
          addPanel(container, topW, tTop, topL, topX, h / 2 - tTop / 2, topZ, mat, edgeMat, box.id, container, `${box.name} • Tampo Superior (${tTopMm}mm)`, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: `${woodMat} ${tTopMm}mm Impermeabilizado`
          });
        }
      }
      return;
    }

    // Baú com tampa basculante:
    // Corpo inferior oco feito com paredes (SEM FUNDO por padrão)
    const bodyHeight = Math.max(0.05, h - (hasTop ? tTop : 0));
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, hasTop ? -tTop / 2 : 0, 0);
    buildHollowBox(bodyGroup, w, bodyHeight, l, tConfig.default, mat, edgeMat, false, box.id, container, { ...box.panels, top: false }, box.name, box);
    container.add(bodyGroup);

    // Tampa com folha de compensado e articulação conforme hingeDirection (apenas se hasTop for true)
    if (hasTop) {
      const lidPivot = new THREE.Group();
      lidPivot.name = 'ChestLidPivot';
      const openAngle = Math.PI / 3.4; // bascula ~53° para CIMA
      const hingeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.25 });

      const exclusionZones = box ? getUpperCabinetExclusionZones(box, w, l) : [];
      const hasCabExcl = exclusionZones.length > 0;
      const lidLabel = hasCabExcl
        ? `${box.name} • Tampa Basculante Vazada CNC c/ Apoio do Aéreo (${tTopMm}mm)`
        : `${box.name} • Tampa Basculante Vazada (${tTopMm}mm)`;

      if (hingeDirection === 'rear') {
        // 1. Dobradiça na Traseira (-Z / porta-malas): levanta a ponta dianteira
        lidPivot.position.set(0, h / 2 - tTop, -l / 2);
        if (isOpen) {
          lidPivot.rotation.x = -openAngle;
        }
        if (box.topPerforated) {
          addPerforatedPanel(lidPivot, w, tTop, l, 0, tTop / 2, l / 2, mat, edgeMat, box.id, container, lidLabel, box, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
          });
        } else {
          addPanel(lidPivot, w, tTop, l, 0, tTop / 2, l / 2, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante (${tTopMm}mm)`, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: `${woodMat} ${tTopMm}mm Impermeabilizado`
          });
        }
      } else if (hingeDirection === 'left') {
        // 2. Dobradiça no Lado Esquerdo / Motorista (+X olhando da traseira): levanta o lado direito
        lidPivot.position.set(w / 2, h / 2 - tTop, 0);
        if (isOpen) {
          lidPivot.rotation.z = -openAngle;
        }
        if (box.topPerforated) {
          addPerforatedPanel(lidPivot, w, tTop, l, -w / 2, tTop / 2, 0, mat, edgeMat, box.id, container, lidLabel, box, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
          });
        } else {
          addPanel(lidPivot, w, tTop, l, -w / 2, tTop / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante (${tTopMm}mm)`, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: `${woodMat} ${tTopMm}mm Impermeabilizado`
          });
        }
      } else if (hingeDirection === 'right') {
        // 3. Dobradiça no Lado Direito / Passageiro (-X olhando da traseira): levanta o lado esquerdo
        lidPivot.position.set(-w / 2, h / 2 - tTop, 0);
        if (isOpen) {
          lidPivot.rotation.z = openAngle;
        }
        if (box.topPerforated) {
          addPerforatedPanel(lidPivot, w, tTop, l, w / 2, tTop / 2, 0, mat, edgeMat, box.id, container, lidLabel, box, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
          });
        } else {
          addPanel(lidPivot, w, tTop, l, w / 2, tTop / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante (${tTopMm}mm)`, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: `${woodMat} ${tTopMm}mm Impermeabilizado`
          });
        }
      } else {
        // 4. Padrão: Dobradiça na Frente (+Z / bancos): levanta a ponta traseira
        lidPivot.position.set(0, h / 2 - tTop, l / 2);
        if (isOpen) {
          lidPivot.rotation.x = openAngle;
        }
        if (box.topPerforated) {
          addPerforatedPanel(lidPivot, w, tTop, l, 0, tTop / 2, -l / 2, mat, edgeMat, box.id, container, lidLabel, box, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
          });
        } else {
          addPanel(lidPivot, w, tTop, l, 0, tTop / 2, -l / 2, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante (${tTopMm}mm)`, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: `${woodMat} ${tTopMm}mm Impermeabilizado`
          });
        }
      }

      container.add(lidPivot);
    }
  }

  /**
   * Constrói o Módulo Sofá-Cama Retrátil com Ripas Intercaladas (Slatted Pull-Out Bed)
   * Possui caixa base inferior de apoio/armazenamento e dois conjuntos de ripas
   * entrelaçadas (pente de ripas): estrado fixo + estrado móvel deslizante com
   * longarina de puxar e pés de apoio no assoalho.
   */
}
