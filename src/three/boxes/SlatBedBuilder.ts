import * as THREE from 'three';
import { InternalBoxItem, InternalGridConfig, SlatBedDirection } from '../../types';
import {
  PLYWOOD_THICKNESS,
  FLOOR_Y,
  getBoxThickness,
  getWoodMaterialName,
  createBoxMaterial,
  addPanel,
  buildHollowBox
} from './BoxGeometryHelpers';
import { SlatBedMattressBuilder } from './SlatBedMattressBuilder';

export class SlatBedBuilder {
  private mattressBuilder = new SlatBedMattressBuilder();

    buildSlatBedModule(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    mat: THREE.Material,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean,
    cellWM?: number,
    cellLM?: number,
    showMattress: boolean = true,
    allBoxes?: InternalBoxItem[],
    grid?: InternalGridConfig
  ) {
    const tConfig = getBoxThickness(box);
    const t = tConfig.default;
    const slatT = tConfig.slat; // espessura das ripas de compensado naval
    const slatTMm = Math.round(slatT * 1000);
    const woodMat = getWoodMaterialName(box.material);
    const edgeMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0x38bdf8 : 0x78350f,
      linewidth: 1,
      transparent: true,
      opacity: 0.65
    });
    const mobileEdgeMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0x38bdf8 : 0xd97706,
      linewidth: 1,
      transparent: true,
      opacity: 0.8
    });

    const direction: SlatBedDirection = box.slatBedDirection || 'left';
    const extPercent = Math.min(100, Math.max(40, box.slatExtensionPercent ?? 100));
    const extRatio = extPercent / 100;
    const isExtended = isOpen;

    // 1. Caixa base inferior de apoio / baú de arrumação sob a cama (sem o tampo superior
    // e SEM a parede do lado para o qual o quadro em L invertido desliza!)
    const baseH = Math.max(0.05, h - slatT);
    const baseGroup = new THREE.Group();
    baseGroup.position.set(0, -slatT / 2, 0);
    const bedPanels = {
      ...box.panels,
      left: direction === 'left' ? false : (box.panels?.left ?? true),
      right: direction === 'right' ? false : (box.panels?.right ?? true),
      front: direction === 'front' ? false : (box.panels?.front ?? true),
      rear: direction === 'rear' ? false : (box.panels?.rear ?? true)
    };
    buildHollowBox(
      baseGroup,
      w,
      baseH,
      l,
      t,
      mat,
      edgeMat,
      box.panels?.bottom ?? false,
      box.id,
      container,
      bedPanels,
      box.name,
      box
    );
    container.add(baseGroup);

    // 2. Sistema de Ripas Retráteis Intercaladas em L Invertido (Pente de Madeira)
    const ySlat = h / 2 - slatT / 2;
    const parts = (box.mattressParts ?? (box.colSpan === 1 ? 2 : 3)) as 1 | 2 | 3 | 4 | 5;

    if (direction === 'left' || direction === 'right') {
      // --- ABERTURA LATERAL (Eixo X) ---
      // O quadro móvel forma um "L de cabeça para baixo" (Г):
      // - Parte horizontal superior: ripas móveis de largura w intercaladas com as ripas fixas.
      // - Parte vertical (perna do L): painel frontal/lateral na extremidade que desce até o assoalho.
      // Ao puxar a cama (100%), o quadro móvel SEMPRE desliza por (w - t), dobrando a área da cama (2 * w)
      // e mantendo a extremidade interna das ripas móveis apoiada sobre o sarrafo da caixa base!
      const strokeMax = Math.max(0, w - t);
      const slideStroke = isExtended ? strokeMax * extRatio : 0;
      const slideOffsetX = direction === 'left' ? slideStroke : -slideStroke;

      // As ripas correm na largura (X, comprimento fixo = w) e intercalam-se ao longo do comprimento (Z, de -l/2 a +l/2).
      const targetSlatW = 0.07; // ~70mm de largura nominal por ripa
      let numSlats = Math.max(6, Math.floor(l / targetSlatW));
      if (numSlats % 2 !== 0) numSlats += 1; // número par para alternância perfeita
      const pitch = l / numSlats;
      const gap = 0.006; // folga funcional de 6mm entre ripas
      const slatDimZ = Math.max(0.025, pitch - gap);

      const fixedSlatW = w;
      const mobileSlatW = w;
      const fixedSlatX = 0;

      // (A) Estrado Fixo (Ripas nos índices pares: 0, 2, 4...)
      for (let i = 0; i < numSlats; i += 2) {
        const zPos = -l / 2 + (i + 0.5) * pitch;
        addPanel(
          container,
          fixedSlatW,
          slatT,
          slatDimZ,
          fixedSlatX,
          ySlat,
          zPos,
          mat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Ripa Fixa #${i / 2 + 1} (${Math.round(fixedSlatW * 1000)}×${Math.round(slatDimZ * 1000)}×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'slat', material: `${woodMat} ${slatTMm}mm` }
        );
      }

      // Sarrafo interno de apoio na borda da caixa base onde as pontas das ripas móveis apoiam quando abertas
      const cleatX = direction === 'left' ? (w / 2 - t / 2) : (-w / 2 + t / 2);
      addPanel(
        container,
        t,
        0.035,
        l - 2 * t,
        cleatX,
        h / 2 - slatT - 0.035 / 2,
        0,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Sarrafo Guia de Apoio do Pente (${Math.round((l - 2 * t) * 1000)}×35×${Math.round(t * 1000)}mm)`,
        { thicknessMm: Math.round(t * 1000), woodMaterial: woodMat, moduleName: box.name, partType: 'slat', material: `${woodMat} ${Math.round(t * 1000)}mm` }
      );

      // (B) Estrado Móvel Retrátil em L Invertido (Ripas nos índices ímpares: 1, 3, 5... + Painel Vertical Frontal)
      const mobileGroup = new THREE.Group();
      mobileGroup.name = 'SlatBedSlidingFrame';
      mobileGroup.position.set(slideOffsetX, 0, 0);

      const mobileSlatX = 0;

      // Ripas móveis deslizantes (braço horizontal superior do L invertido)
      for (let i = 1; i < numSlats; i += 2) {
        const zPos = -l / 2 + (i + 0.5) * pitch;
        addPanel(
          mobileGroup,
          mobileSlatW,
          slatT,
          slatDimZ,
          mobileSlatX,
          ySlat,
          zPos,
          mat,
          mobileEdgeMat,
          box.id,
          container,
          `${box.name} • Ripa Móvel #${Math.floor(i / 2) + 1} (${Math.round(mobileSlatW * 1000)}×${Math.round(slatDimZ * 1000)}×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'slat', material: `${woodMat} ${slatTMm}mm` }
        );
      }

      // Perna vertical do L de cabeça para baixo: fecha toda a frente do módulo quando recolhido
      // e sustenta a extremidade externa das ripas móveis no chão quando estendido
      const outerX = direction === 'left' ? (w / 2 - t / 2) : (-w / 2 + t / 2);
      const legH = Math.max(0.05, h - slatT);
      const legY = -slatT / 2;
      addPanel(
        mobileGroup,
        t,
        legH,
        l,
        outerX,
        legY,
        0,
        mat,
        mobileEdgeMat,
        box.id,
        container,
        `${box.name} • Painel Frontal Móvel (L Invertido) (${Math.round(l * 1000)}×${Math.round(legH * 1000)}×${Math.round(t * 1000)}mm)`,
        { thicknessMm: Math.round(t * 1000), woodMaterial: woodMat, moduleName: box.name, partType: direction === 'left' ? 'left' : 'right', material: `${woodMat} ${Math.round(t * 1000)}mm` }
      );

      // Pés de apoio articulados que alcançam o assoalho da van
      const legZ1 = -l / 2 + Math.min(0.08, l * 0.15);
      const legZ2 = l / 2 - Math.min(0.08, l * 0.15);
      addPanel(
        mobileGroup,
        0.035,
        legH,
        0.035,
        outerX,
        legY,
        legZ1,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Pé de Apoio Traseiro (${slatTMm}mm)`,
        { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'leg', material: `${woodMat} ${slatTMm}mm` }
      );
      addPanel(
        mobileGroup,
        0.035,
        legH,
        0.035,
        outerX,
        legY,
        legZ2,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Pé de Apoio Dianteiro (${slatTMm}mm)`,
        { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'leg', material: `${woodMat} ${slatTMm}mm` }
      );

      // Puxador metálico na longarina externa
      const handleGeo = new THREE.BoxGeometry(0.015, 0.024, Math.min(0.24, l * 0.4));
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.2
      });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.set(outerX + (direction === 'left' ? 0.012 : -0.012), 0, 0);
      handleMesh.userData = {
        isInternalBox: true,
        isHardware: true,
        boxId: box.id,
        boxRoot: container,
        moduleName: box.name,
        partLabel: `${box.name} • Puxador Metálico da Longarina Móvel`,
        category: '🔩 Ferragens de Sustentação & Articulação'
      };
      mobileGroup.add(handleMesh);

      // Hitbox do conjunto móvel
      const mobileHitGeo = new THREE.BoxGeometry(w, h, l);
      const mobileHitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const mobileHitMesh = new THREE.Mesh(mobileHitGeo, mobileHitMat);
      mobileHitMesh.name = '__box_hitbox';
      mobileHitMesh.userData = { isInternalBoxHitbox: true, isInternalBox: true, boxId: box.id, boxRoot: container };
      mobileGroup.add(mobileHitMesh);

      container.add(mobileGroup);

      if (parts === 5) {
        // Abas de apoio estrutural em compensado 15mm sobre as caixas de roda esquerda e direita
        const archW = 0.145; // ~145mm sobre o vão da caixa de roda
        const baseArchX = direction === 'left' ? (-w / 2 - archW / 2) : (w / 2 + archW / 2);
        addPanel(
          container,
          archW,
          slatT,
          l,
          baseArchX,
          ySlat,
          0,
          mat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Aba Fixa de Apoio Caixa de Roda (${Math.round(archW * 1000)}×${Math.round(l * 1000)}mm)`,
          { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'slat', material: `${woodMat} ${slatTMm}mm` }
        );

        if (isExtended) {
          const gridWidthM = grid ? grid.widthMm / 1000 : (cellWM ? cellWM * 3 : w + slideStroke);
          const openSpanX = Math.max(w + slideStroke, gridWidthM);
          const farArchX = direction === 'left' ? (-w / 2 + openSpanX + archW / 2) : (w / 2 - openSpanX - archW / 2);
          addPanel(
            container,
            archW,
            slatT,
            l,
            farArchX,
            ySlat,
            0,
            mat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Aba Oposta de Apoio Caixa de Roda (${Math.round(archW * 1000)}×${Math.round(l * 1000)}mm)`,
            { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'slat', material: `${woodMat} ${slatTMm}mm` }
          );
        }
      }
    } else {
      // --- ABERTURA LONGITUDINAL (Eixo Z: Frente ou Trás) ---
      // Curso máximo limitado ao dobro do próprio módulo (strokeMaxZ = l - t) formando um L invertido
      const strokeMaxZ = Math.max(0, l - t);
      const slideStrokeZ = isExtended ? strokeMaxZ * extRatio : 0;
      const slideOffsetZ = direction === 'front' ? slideStrokeZ : -slideStrokeZ;

      // As ripas correm no comprimento (Z, comprimento fixo = l) e intercalam-se na largura (X, de -w/2 a +w/2).
      const targetSlatW = 0.07;
      let numSlats = Math.max(6, Math.floor(w / targetSlatW));
      if (numSlats % 2 !== 0) numSlats += 1;
      const pitch = w / numSlats;
      const gap = 0.006;
      const slatDimX = Math.max(0.025, pitch - gap);

      const fixedSlatL = l;
      const mobileSlatL = l;
      const fixedSlatZ = 0;

      // (A) Estrado Fixo (Ripas nos índices pares: 0, 2, 4...)
      for (let i = 0; i < numSlats; i += 2) {
        const xPos = w / 2 - (i + 0.5) * pitch;
        addPanel(
          container,
          slatDimX,
          slatT,
          fixedSlatL,
          xPos,
          ySlat,
          fixedSlatZ,
          mat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Ripa Fixa #${i / 2 + 1} (${Math.round(slatDimX * 1000)}×${Math.round(fixedSlatL * 1000)}mm)`,
          { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'slat', material: `${woodMat} ${slatTMm}mm` }
        );
      }

      // (B) Estrado Móvel Retrátil em L Invertido (Ripas nos índices ímpares: 1, 3, 5... + Painel Vertical)
      const mobileGroup = new THREE.Group();
      mobileGroup.name = 'SlatBedSlidingFrame';
      mobileGroup.position.set(0, 0, slideOffsetZ);

      const mobileSlatZ = 0;

      // Ripas móveis deslizantes
      for (let i = 1; i < numSlats; i += 2) {
        const xPos = w / 2 - (i + 0.5) * pitch;
        addPanel(
          mobileGroup,
          slatDimX,
          slatT,
          mobileSlatL,
          xPos,
          ySlat,
          mobileSlatZ,
          mat,
          mobileEdgeMat,
          box.id,
          container,
          `${box.name} • Ripa Móvel #${Math.floor(i / 2) + 1} (${Math.round(slatDimX * 1000)}×${Math.round(mobileSlatL * 1000)}mm)`,
          { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'slat', material: `${woodMat} ${slatTMm}mm` }
        );
      }

      // Perna vertical frontal/traseira do L invertido
      const outerZ = direction === 'front' ? (l / 2 - t / 2) : (-l / 2 + t / 2);
      const legH = Math.max(0.05, h - slatT);
      const legY = -slatT / 2;
      addPanel(
        mobileGroup,
        w,
        legH,
        t,
        0,
        legY,
        outerZ,
        mat,
        mobileEdgeMat,
        box.id,
        container,
        `${box.name} • Painel Frontal Móvel (L Invertido) (${Math.round(w * 1000)}×${Math.round(legH * 1000)}mm)`,
        { thicknessMm: Math.round(t * 1000), woodMaterial: woodMat, moduleName: box.name, partType: direction === 'front' ? 'front' : 'rear', material: `${woodMat} ${Math.round(t * 1000)}mm` }
      );

      // Pés de apoio articulados
      const legX1 = -w / 2 + Math.min(0.08, w * 0.15);
      const legX2 = w / 2 - Math.min(0.08, w * 0.15);
      addPanel(
        mobileGroup,
        0.035,
        legH,
        0.035,
        legX1,
        legY,
        outerZ,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Pé de Apoio Esq. (${slatTMm}mm)`,
        { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'leg', material: `${woodMat} ${slatTMm}mm` }
      );
      addPanel(
        mobileGroup,
        0.035,
        legH,
        0.035,
        legX2,
        legY,
        outerZ,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Pé de Apoio Dir. (${slatTMm}mm)`,
        { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'leg', material: `${woodMat} ${slatTMm}mm` }
      );

      // Puxador metálico
      const handleGeo = new THREE.BoxGeometry(Math.min(0.24, w * 0.4), 0.024, 0.015);
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.2
      });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.set(0, 0, outerZ + (direction === 'front' ? 0.012 : -0.012));
      handleMesh.userData = {
        isInternalBox: true,
        isHardware: true,
        boxId: box.id,
        boxRoot: container,
        moduleName: box.name,
        partLabel: `${box.name} • Puxador Metálico da Longarina Móvel`,
        category: '🔩 Ferragens de Sustentação & Articulação'
      };
      mobileGroup.add(handleMesh);

      // Hitbox do conjunto móvel
      const mobileHitGeo = new THREE.BoxGeometry(w, h, l);
      const mobileHitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const mobileHitMesh = new THREE.Mesh(mobileHitGeo, mobileHitMat);
      mobileHitMesh.name = '__box_hitbox';
      mobileHitMesh.userData = { isInternalBoxHitbox: true, isInternalBox: true, boxId: box.id, boxRoot: container };
      mobileGroup.add(mobileHitMesh);

      container.add(mobileGroup);
    }


    if (showMattress) {
      if (!isExtended) {
        // Modo fechado (Sofá):
        // 1. Grupo visual do sofá dobrado/empilhado (visível na cena 3D do veículo)
        const visualGroup = new THREE.Group();
        visualGroup.name = 'mattress_visual_sofa';
        this.mattressBuilder.buildMattress({
          container: visualGroup,
          w,
          l,
          h,
          box,
          slatT,
          direction,
          isExtended: false,
          extRatio,
          cellWM,
          cellLM,
          isSelected,
          showMattress,
          allBoxes,
          grid
        });
        visualGroup.traverse((obj: any) => {
          if (obj.isMesh && obj.userData) {
            obj.userData.isFoldedSofaVisual = true;
          }
        });
        container.add(visualGroup);

        // 2. Grupo nominal aberto/fabricação (invisível na cena do veículo, usado para Ver Peças / Plano de Corte)
        const nominalGroup = new THREE.Group();
        nominalGroup.name = 'mattress_nominal_parts';
        nominalGroup.visible = false;
        this.mattressBuilder.buildMattress({
          container: nominalGroup,
          w,
          l,
          h,
          box,
          slatT,
          direction,
          isExtended: true,
          extRatio: 1,
          cellWM,
          cellLM,
          isSelected,
          showMattress,
          allBoxes,
          grid
        });
        nominalGroup.traverse((obj: any) => {
          if (obj.isMesh && obj.userData) {
            obj.userData.isNominalUpholstery = true;
          }
        });
        container.add(nominalGroup);
      } else {
        this.mattressBuilder.buildMattress({
          container,
          w,
          l,
          h,
          box,
          slatT,
          direction,
          isExtended: true,
          extRatio,
          cellWM,
          cellLM,
          isSelected,
          showMattress,
          allBoxes,
          grid
        });
      }
    }
  }
}
