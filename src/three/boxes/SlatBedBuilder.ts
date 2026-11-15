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
    const extPercent = Math.min(100, Math.max(40, box.slatExtensionPercent ?? 85));
    const extRatio = extPercent / 100;
    const isExtended = isOpen;

    // 1. Caixa base inferior de apoio / baú de arrumação sob a cama (sem o tampo superior)
    const baseH = Math.max(0.05, h - slatT);
    const baseGroup = new THREE.Group();
    baseGroup.position.set(0, -slatT / 2, 0);
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
      box.panels,
      box.name,
      box
    );
    container.add(baseGroup);

    // 2. Sistema de Ripas Retráteis Intercaladas (Pente de Madeira)
    const ySlat = h / 2 - slatT / 2;
    // parts define a quantidade de colunas/subdivisões que a cama ocupa ao estender (2 colunas = padrão Doblò c/ armário alto lateral, 3 colunas = ocupar tudo, 5 = com abas das caixas de roda esq/dir)
    const parts = (box.mattressParts ?? (box.colSpan === 1 ? 2 : 3)) as 1 | 2 | 3 | 4 | 5;

    if (direction === 'left' || direction === 'right') {
      // --- ABERTURA LATERAL (Eixo X) ---
      // parts define quantas subdivisões do grid a cama aberta ocupa (5 partes cobre as 3 colunas + abas das caixas de roda)
      const cellW = cellWM || w;
      const targetSubdivisions = parts === 5 ? 3 : Math.max(1, parts);
      const totalOpenSpanX = targetSubdivisions * cellW;
      const strokeMax = Math.max(0, totalOpenSpanX - w);
      const slideStroke = isExtended ? strokeMax * extRatio : 0;
      const slideOffsetX = direction === 'left' ? slideStroke : -slideStroke;

      // As ripas correm na largura (X, comprimento = w) e intercalam-se ao longo do comprimento (Z, de -l/2 a +l/2).
      const targetSlatW = 0.07; // ~70mm de largura nominal por ripa
      let numSlats = Math.max(6, Math.floor(l / targetSlatW));
      if (numSlats % 2 !== 0) numSlats += 1; // número par para alternância perfeita
      const pitch = l / numSlats;
      const gap = 0.006; // folga funcional de 6mm entre ripas
      const slatDimZ = Math.max(0.025, pitch - gap);

      // Comprimento das ripas adaptado para o vão aberto quando estendido
      const fixedSlatW = isExtended ? Math.min(totalOpenSpanX, w + strokeMax * 0.55) : w;
      const mobileSlatW = isExtended ? Math.min(totalOpenSpanX, w + strokeMax * 0.55) : w;
      const fixedSlatX = direction === 'left' ? (fixedSlatW - w) / 2 : -(fixedSlatW - w) / 2;

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

      // (B) Estrado Móvel Retrátil (Ripas nos índices ímpares: 1, 3, 5... + Longarina Externa de Puxar + Pés)
      const mobileGroup = new THREE.Group();
      mobileGroup.name = 'SlatBedSlidingFrame';
      mobileGroup.position.set(slideOffsetX, 0, 0);

      const mobileSlatX = direction === 'left' ? -(mobileSlatW - w) / 2 : (mobileSlatW - w) / 2;

      // Ripas móveis deslizantes
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

      // Longarina lateral externa que une as ripas móveis e serve de fachada
      const outerX = direction === 'left' ? (w / 2 - t / 2) : (-w / 2 + t / 2);
      addPanel(
        mobileGroup,
        t,
        h,
        l,
        outerX,
        0,
        0,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Longarina Lateral Móvel (${Math.round(l * 1000)}×${Math.round(h * 1000)}×${Math.round(t * 1000)}mm)`,
        { thicknessMm: Math.round(t * 1000), woodMaterial: woodMat, moduleName: box.name, partType: 'left', material: `${woodMat} ${Math.round(t * 1000)}mm` }
      );

      // Pés de apoio articulados que alcançam o assoalho da van
      const legH = h - slatT;
      const legY = -slatT / 2;
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
      handleMesh.userData = { isInternalBox: true, boxId: box.id, boxRoot: container };
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
          const farArchX = direction === 'left' ? (-w / 2 + 3 * cellW + archW / 2) : (w / 2 - 3 * cellW - archW / 2);
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
      const cellL = cellLM || l;
      const targetSubdivisions = Math.max(1, parts);
      const totalOpenSpanZ = targetSubdivisions * cellL;
      const strokeMaxZ = Math.max(0, totalOpenSpanZ - l);
      const slideStrokeZ = isExtended ? strokeMaxZ * extRatio : 0;
      const slideOffsetZ = direction === 'front' ? slideStrokeZ : -slideStrokeZ;

      // As ripas correm no comprimento (Z, comprimento = l) e intercalam-se na largura (X, de -w/2 a +w/2).
      const targetSlatW = 0.07;
      let numSlats = Math.max(6, Math.floor(w / targetSlatW));
      if (numSlats % 2 !== 0) numSlats += 1;
      const pitch = w / numSlats;
      const gap = 0.006;
      const slatDimX = Math.max(0.025, pitch - gap);

      const fixedSlatL = isExtended ? Math.min(totalOpenSpanZ, l + strokeMaxZ * 0.55) : l;
      const mobileSlatL = isExtended ? Math.min(totalOpenSpanZ, l + strokeMaxZ * 0.55) : l;
      const fixedSlatZ = direction === 'front' ? (fixedSlatL - l) / 2 : -(fixedSlatL - l) / 2;

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

      // (B) Estrado Móvel Retrátil (Ripas nos índices ímpares: 1, 3, 5... + Longarina Externa + Pés)
      const mobileGroup = new THREE.Group();
      mobileGroup.name = 'SlatBedSlidingFrame';
      mobileGroup.position.set(0, 0, slideOffsetZ);

      const mobileSlatZ = direction === 'front' ? -(mobileSlatL - l) / 2 : (mobileSlatL - l) / 2;

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

      // Longarina frontal/traseira externa
      const outerZ = direction === 'front' ? (l / 2 - t / 2) : (-l / 2 + t / 2);
      addPanel(
        mobileGroup,
        w,
        h,
        t,
        0,
        0,
        outerZ,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Longarina Frontal Móvel (${Math.round(w * 1000)}×${Math.round(h * 1000)}mm)`,
        { thicknessMm: Math.round(t * 1000), woodMaterial: woodMat, moduleName: box.name, partType: 'front', material: `${woodMat} ${Math.round(t * 1000)}mm` }
      );

      // Pés de apoio articulados
      const legH = h - slatT;
      const legY = -slatT / 2;
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
      handleMesh.userData = { isInternalBox: true, boxId: box.id, boxRoot: container };
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
      this.mattressBuilder.buildMattress({
        container,
        w,
        l,
        h,
        box,
        slatT,
        direction,
        isExtended,
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
