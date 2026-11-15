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
      // Nicho aberto: 100% oco com paredes conforme tamponamento selecionado (SEM FUNDO por padrão)
      buildHollowBox(container, w, h, l, tConfig.default, mat, edgeMat, false, box.id, container, box.panels, box.name, box);
      if (hasTop) {
        const exclusionZones = box ? getUpperCabinetExclusionZones(box, w, l) : [];
        const hasCabExcl = exclusionZones.length > 0;
        const openTopLabel = hasCabExcl
          ? `${box.name} • Tampo Superior Vazado CNC c/ Apoio do Aéreo (${tTopMm}mm)`
          : `${box.name} • Tampo Superior Vazado (${tTopMm}mm)`;
        if (box.topPerforated) {
          addPerforatedPanel(container, w, tTop, l, 0, h / 2 - tTop / 2, 0, mat, edgeMat, box.id, container, openTopLabel, box, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
          });
        } else {
          addPanel(container, w, tTop, l, 0, h / 2 - tTop / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Tampo Superior (${tTopMm}mm)`, {
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
    buildHollowBox(bodyGroup, w, bodyHeight, l, tConfig.default, mat, edgeMat, false, box.id, container, box.panels, box.name, box);
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

        const hingeGeo = new THREE.CylinderGeometry(0.007, 0.007, w * 0.94, 12);
        hingeGeo.rotateZ(Math.PI / 2);
        const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
        hingeMesh.position.set(0, tTop, 0);
        hingeMesh.userData = {
          isInternalBox: true,
          isHardware: true,
          boxId: box.id,
          boxRoot: container,
          moduleName: box.name,
          partLabel: `${box.name} • Dobradiça Contínua (Piano) Inox`,
          category: '🔩 Ferragens de Sustentação & Articulação'
        };
        lidPivot.add(hingeMesh);
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

        // Deita o cilindro ao longo do eixo Z (comprimento do baú)
        const hingeGeo = new THREE.CylinderGeometry(0.007, 0.007, l * 0.94, 12);
        hingeGeo.rotateX(Math.PI / 2);
        const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
        hingeMesh.position.set(0, tTop, 0);
        hingeMesh.userData = {
          isInternalBox: true,
          isHardware: true,
          boxId: box.id,
          boxRoot: container,
          moduleName: box.name,
          partLabel: `${box.name} • Dobradiça Contínua (Piano) Inox`,
          category: '🔩 Ferragens de Sustentação & Articulação'
        };
        lidPivot.add(hingeMesh);
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

        // Deita o cilindro ao longo do eixo Z (comprimento do baú)
        const hingeGeo = new THREE.CylinderGeometry(0.007, 0.007, l * 0.94, 12);
        hingeGeo.rotateX(Math.PI / 2);
        const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
        hingeMesh.position.set(0, tTop, 0);
        hingeMesh.userData = {
          isInternalBox: true,
          isHardware: true,
          boxId: box.id,
          boxRoot: container,
          moduleName: box.name,
          partLabel: `${box.name} • Dobradiça Contínua (Piano) Inox`,
          category: '🔩 Ferragens de Sustentação & Articulação'
        };
        lidPivot.add(hingeMesh);
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

        const hingeGeo = new THREE.CylinderGeometry(0.007, 0.007, w * 0.94, 12);
        hingeGeo.rotateZ(Math.PI / 2);
        const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
        hingeMesh.position.set(0, tTop, 0);
        hingeMesh.userData = {
          isInternalBox: true,
          isHardware: true,
          boxId: box.id,
          boxRoot: container,
          moduleName: box.name,
          partLabel: `${box.name} • Dobradiça Contínua (Piano) Inox`,
          category: '🔩 Ferragens de Sustentação & Articulação'
        };
        lidPivot.add(hingeMesh);
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
