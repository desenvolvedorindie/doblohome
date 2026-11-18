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
  private buildHingedBedPanels(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    slatT: number,
    slatTMm: number,
    t: number,
    direction: SlatBedDirection,
    isExtended: boolean,
    mat: THREE.Material,
    edgeMat: THREE.LineBasicMaterial,
    mobileEdgeMat: THREE.LineBasicMaterial,
    box: InternalBoxItem,
    woodMat: string,
    skipBaseBox: boolean = false
  ) {
    const ySlat = h / 2 - slatT / 2;
    const legH = skipBaseBox ? h : Math.max(0.05, h - slatT);
    // Madeira independente para ripas (ou folha/tampo) e para os pés da cama
    const slatMatKey = box.slatMaterial ?? box.material;
    const legMatKey = box.bedLegMaterial ?? box.material;
    const slatMat = createBoxMaterial({ ...box, material: slatMatKey }, false);
    const legMat = createBoxMaterial({ ...box, material: legMatKey }, false);
    const slatWoodMat = getWoodMaterialName(slatMatKey);
    const legWoodMat = getWoodMaterialName(legMatKey);
    const isLateral = direction === 'left' || direction === 'right';
    const isSlattedHinged = box.hingedBedSurface === 'slatted';

    // 1. Tampo Fixo Base (Tampo Inteiriço vs Estrado Ripado)
    if (!isSlattedHinged) {
      addPanel(
        container,
        w,
        slatT,
        l,
        0,
        ySlat,
        0,
        slatMat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Cama Dobradiça - Tampo Fixo Base (${Math.round(w * 1000)}×${Math.round(l * 1000)}×${slatTMm}mm)`,
        { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'top', material: `${slatWoodMat} ${slatTMm}mm Impermeabilizado` }
      );
    } else {
      const targetSlatW = 0.07;
      let numSlats = Math.max(6, Math.floor((isLateral ? l : w) / targetSlatW));
      if (numSlats % 2 !== 0) numSlats += 1;
      const totalSpan = isLateral ? l : w;
      const pitch = totalSpan / numSlats;
      const gap = 0.008;
      const slatDim = Math.max(0.025, pitch - gap);

      for (let i = 0; i < numSlats; i++) {
        const posAlong = -totalSpan / 2 + (i + 0.5) * pitch;
        if (isLateral) {
          addPanel(
            container,
            w,
            slatT,
            slatDim,
            0,
            ySlat,
            posAlong,
            slatMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Ripa Fixa da Cama (${Math.round(w * 1000)}×${Math.round(slatDim * 1000)}×${slatTMm}mm)`,
            { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: `${slatWoodMat} ${slatTMm}mm` }
          );
        } else {
          addPanel(
            container,
            slatDim,
            slatT,
            l,
            posAlong,
            ySlat,
            0,
            slatMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Ripa Fixa da Cama (${Math.round(slatDim * 1000)}×${Math.round(l * 1000)}×${slatTMm}mm)`,
            { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: `${slatWoodMat} ${slatTMm}mm` }
          );
        }
      }
    }

    // Material metálico para as dobradiças
    const hingeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.25
    });

    // Espaçamento funcional entre as madeiras para compensar e acomodar o corpo da dobradiça (3mm)
    const hingeGap = 0.003;

    if (isLateral) {
      // Folha dobrável limitada logicamente ao tamanho w do módulo
      const leafW = Math.min(w, Math.max(Math.min(0.10, w), (box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : w)));

      // No sistema da Doblò: +X = Esquerda (Motorista), -X = Direita (Passageiro)
      // O eixo da dobradiça fica centralizado na folga entre o tampo fixo e a folha móvel
      const hingeX = direction === 'left' ? (w / 2 + hingeGap / 2) : (-w / 2 - hingeGap / 2);
      const hingePivot = new THREE.Group();
      hingePivot.name = 'HingedBedPivot';
      hingePivot.position.set(hingeX, h / 2, 0);

      // Quando aberto, desdobra 180° (PI radianos) para o lado correto (+X para left, -X para right)
      hingePivot.rotation.z = isExtended ? (direction === 'left' ? -Math.PI : Math.PI) : 0;

      // Folha articulada dobrável: quando fechada, descansa em cima do tampo fixo com folga compensada
      const localLeafCenterX = direction === 'left' ? (-hingeGap / 2 - leafW / 2) : (hingeGap / 2 + leafW / 2);
      const localLeafCenterY = slatT / 2;

      if (!isSlattedHinged) {
        addPanel(
          hingePivot,
          leafW,
          slatT,
          l,
          localLeafCenterX,
          localLeafCenterY,
          0,
          slatMat,
          mobileEdgeMat,
          box.id,
          container,
          `${box.name} • Cama Dobradiça - Folha Articulada (${Math.round(leafW * 1000)}×${Math.round(l * 1000)}×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'door', material: `${slatWoodMat} ${slatTMm}mm Impermeabilizado` }
        );
      } else {
        const targetSlatW = 0.07;
        let numSlats = Math.max(6, Math.floor(l / targetSlatW));
        if (numSlats % 2 !== 0) numSlats += 1;
        const pitch = l / numSlats;
        const gap = 0.008;
        const slatDimZ = Math.max(0.025, pitch - gap);

        for (let i = 0; i < numSlats; i++) {
          const zPos = -l / 2 + (i + 0.5) * pitch;
          addPanel(
            hingePivot,
            leafW,
            slatT,
            slatDimZ,
            localLeafCenterX,
            localLeafCenterY,
            zPos,
            slatMat,
            mobileEdgeMat,
            box.id,
            container,
            `${box.name} • Ripa Móvel da Folha (${Math.round(leafW * 1000)}×${Math.round(slatDimZ * 1000)}×${slatTMm}mm)`,
            { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: `${slatWoodMat} ${slatTMm}mm` }
          );
        }
      }

      // Pés de apoio articulados nas quinas da folha dobrável
      const legSize = 0.035;
      const cornerGap = 0; // pés encostados na quina, sem espaçamento
      const centerOffset = cornerGap + legSize / 2;
      const localLegX = direction === 'left' ? (-hingeGap / 2 - leafW + centerOffset) : (hingeGap / 2 + leafW - centerOffset);
      const legZ1 = -l / 2 + centerOffset;
      const legZ2 = l / 2 - centerOffset;

      if (isExtended) {
        const localLegY = slatT + legH / 2;

        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          localLegX,
          localLegY,
          legZ1,
          legMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Cama Dobradiça - Pé de Apoio Traseiro (${Math.round(legH * 1000)}×35×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: `${legWoodMat} ${slatTMm}mm` }
        );
        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          localLegX,
          localLegY,
          legZ2,
          legMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Cama Dobradiça - Pé de Apoio Dianteiro (${Math.round(legH * 1000)}×35×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: `${legWoodMat} ${slatTMm}mm` }
        );
      } else {
        // Modo fechado: pés articulados rebatidos planos ao longo da quina da folha
        // Garante que SEMPRE existam na lista de marcenaria e plano de corte
        const foldedLegGroup = new THREE.Group();
        foldedLegGroup.name = 'HingedBedFoldedLegs';
        const foldedLegY = slatT + legSize / 2;

        addPanel(
          foldedLegGroup,
          0.035,
          0.035,
          legH,
          localLegX,
          foldedLegY,
          legZ1 + legH / 2,
          legMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Cama Dobradiça - Pé de Apoio Traseiro (${Math.round(legH * 1000)}×35×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: `${legWoodMat} ${slatTMm}mm` }
        );
        addPanel(
          foldedLegGroup,
          0.035,
          0.035,
          legH,
          localLegX,
          foldedLegY,
          legZ2 - legH / 2,
          legMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Cama Dobradiça - Pé de Apoio Dianteiro (${Math.round(legH * 1000)}×35×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: `${legWoodMat} ${slatTMm}mm` }
        );
        hingePivot.add(foldedLegGroup);
      }

      // 3 Dobradiças de metal visíveis ao longo da costura, alojadas no espaçamento entre as madeiras
      [-l * 0.35, 0, l * 0.35].forEach((zPos) => {
        const hCyl = new THREE.CylinderGeometry(0.004, 0.004, 0.045, 12);
        hCyl.rotateX(Math.PI / 2);
        const hMesh = new THREE.Mesh(hCyl, hingeMat);
        hMesh.position.set(hingeX, h / 2, zPos);
        container.add(hMesh);
      });

      // Hitbox para interação
      const hitGeo = new THREE.BoxGeometry(w, h, l);
      const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.name = '__box_hitbox';
      hitMesh.userData = { isInternalBoxHitbox: true, isInternalBox: true, boxId: box.id, boxRoot: container };
      hingePivot.add(hitMesh);

      container.add(hingePivot);
    } else {
      // Longitudinal (rear ou front): folha dobrável limitada logicamente ao tamanho l do módulo
      const leafL = Math.min(l, Math.max(Math.min(0.10, l), (box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : l)));

      const hingeZ = direction === 'rear' ? (-l / 2 - hingeGap / 2) : (l / 2 + hingeGap / 2);
      const hingePivot = new THREE.Group();
      hingePivot.name = 'HingedBedPivot';
      hingePivot.position.set(0, h / 2, hingeZ);

      hingePivot.rotation.x = isExtended ? (direction === 'rear' ? -Math.PI : Math.PI) : 0;

      const localLeafCenterZ = direction === 'rear' ? (hingeGap / 2 + leafL / 2) : (-hingeGap / 2 - leafL / 2);
      const localLeafCenterY = slatT / 2;

      if (!isSlattedHinged) {
        addPanel(
          hingePivot,
          w,
          slatT,
          leafL,
          0,
          localLeafCenterY,
          localLeafCenterZ,
          slatMat,
          mobileEdgeMat,
          box.id,
          container,
          `${box.name} • Cama Dobradiça - Folha Articulada (${Math.round(w * 1000)}×${Math.round(leafL * 1000)}×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'door', material: `${slatWoodMat} ${slatTMm}mm Impermeabilizado` }
        );
      } else {
        const targetSlatW = 0.07;
        let numSlats = Math.max(6, Math.floor(w / targetSlatW));
        if (numSlats % 2 !== 0) numSlats += 1;
        const pitch = w / numSlats;
        const gap = 0.008;
        const slatDimX = Math.max(0.025, pitch - gap);

        for (let i = 0; i < numSlats; i++) {
          const xPos = -w / 2 + (i + 0.5) * pitch;
          addPanel(
            hingePivot,
            slatDimX,
            slatT,
            leafL,
            xPos,
            localLeafCenterY,
            localLeafCenterZ,
            slatMat,
            mobileEdgeMat,
            box.id,
            container,
            `${box.name} • Ripa Móvel da Folha (${Math.round(slatDimX * 1000)}×${Math.round(leafL * 1000)}×${slatTMm}mm)`,
            { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: `${slatWoodMat} ${slatTMm}mm` }
          );
        }
      }

      const legSize = 0.035;
      const cornerGap = 0; // pés encostados na quina, sem espaçamento
      const centerOffset = cornerGap + legSize / 2;
      const localLegZ = direction === 'rear' ? (hingeGap / 2 + leafL - centerOffset) : (-hingeGap / 2 - leafL + centerOffset);
      const legX1 = -w / 2 + centerOffset;
      const legX2 = w / 2 - centerOffset;

      if (isExtended) {
        const localLegY = slatT + legH / 2;

        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          legX1,
          localLegY,
          localLegZ,
          legMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Cama Dobradiça - Pé Articulado Esq. (${Math.round(legH * 1000)}×35×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: `${legWoodMat} ${slatTMm}mm` }
        );
        addPanel(
          hingePivot,
          0.035,
          legH,
          0.035,
          legX2,
          localLegY,
          localLegZ,
          legMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Cama Dobradiça - Pé Articulado Dir. (${Math.round(legH * 1000)}×35×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: `${legWoodMat} ${slatTMm}mm` }
        );
      } else {
        const foldedLegGroup = new THREE.Group();
        foldedLegGroup.name = 'HingedBedFoldedLegs';
        const foldedLegY = slatT + legSize / 2;

        addPanel(
          foldedLegGroup,
          legH,
          0.035,
          0.035,
          legX1 + legH / 2,
          foldedLegY,
          localLegZ,
          legMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Cama Dobradiça - Pé Articulado Esq. (${Math.round(legH * 1000)}×35×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: `${legWoodMat} ${slatTMm}mm` }
        );
        addPanel(
          foldedLegGroup,
          legH,
          0.035,
          0.035,
          legX2 - legH / 2,
          foldedLegY,
          localLegZ,
          legMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Cama Dobradiça - Pé Articulado Dir. (${Math.round(legH * 1000)}×35×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: `${legWoodMat} ${slatTMm}mm` }
        );
        hingePivot.add(foldedLegGroup);
      }

      [-w * 0.35, 0, w * 0.35].forEach((xPos) => {
        const hCyl = new THREE.CylinderGeometry(0.004, 0.004, 0.045, 12);
        hCyl.rotateZ(Math.PI / 2);
        const hMesh = new THREE.Mesh(hCyl, hingeMat);
        hMesh.position.set(xPos, h / 2, hingeZ);
        container.add(hMesh);
      });

      const hitGeo = new THREE.BoxGeometry(w, h, l);
      const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.name = '__box_hitbox';
      hitMesh.userData = { isInternalBoxHitbox: true, isInternalBox: true, boxId: box.id, boxRoot: container };
      hingePivot.add(hitMesh);

      container.add(hingePivot);
    }
  }

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
    grid?: InternalGridConfig,
    skipBaseBox: boolean = false
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
    // Madeira independente para ripas (ou folha/tampo) e para os pés da cama
    const slatMatKey = box.slatMaterial ?? box.material;
    const legMatKey = box.bedLegMaterial ?? box.material;
    const slatMat = createBoxMaterial({ ...box, material: slatMatKey }, false);
    const legMat = createBoxMaterial({ ...box, material: legMatKey }, false);
    const slatWoodMat = getWoodMaterialName(slatMatKey);
    const legWoodMat = getWoodMaterialName(legMatKey);

    // 1. Caixa base inferior de apoio / baú de arrumação sob a cama
    const isHinged = box.bedMode === 'hinged';
    let bedTarget: THREE.Group = container;
    if (skipBaseBox) {
      // Cama adicionada como componente sobre outro módulo (ex: bandeja corrediça, gavetão, baú, nicho):
      // Monta o conjunto da cama assentado diretamente sobre o tampo superior do módulo (y = h / 2).
      bedTarget = new THREE.Group();
      bedTarget.name = 'BedComponentGroup';
      bedTarget.position.set(0, slatT, 0);
      container.add(bedTarget);
    } else {
      const baseH = Math.max(0.05, h - slatT);
      const baseGroup = new THREE.Group();
      baseGroup.position.set(0, -slatT / 2, 0);
      const bedPanels = isHinged
        ? { ...box.panels, top: false }
        : {
            ...box.panels,
            top: false,
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
    }

    // 2. Mecanismo da Cama: Dobradiça (Hinged) vs Ripas Retráteis (Slat)
    const ySlat = h / 2 - slatT / 2;
    const parts = (box.mattressParts ?? (box.colSpan === 1 ? 2 : 3)) as 1 | 2 | 3 | 4 | 5;

    if (isHinged) {
      // --- MODO 2: CAMA ARTICULADA COM DOBRADIÇA (TAMPO DOBRÁVEL 180°) ---
      this.buildHingedBedPanels(
        bedTarget,
        w,
        l,
        h,
        slatT,
        slatTMm,
        t,
        direction,
        isExtended,
        mat,
        edgeMat,
        mobileEdgeMat,
        box,
        woodMat,
        skipBaseBox
      );
    } else if (direction === 'left' || direction === 'right') {
      // --- ABERTURA LATERAL (Eixo X) ---
      // O quadro móvel forma um "L de cabeça para baixo" (Г):
      // - Parte horizontal superior: ripas móveis de largura w intercaladas com as ripas fixas.
      // - Parte vertical (perna do L): painel frontal/lateral na extremidade que desce até o assoalho.
      // Ao puxar a cama (100%), o quadro móvel SEMPRE desliza por (w - t), dobrando a área da cama (2 * w)
      // e mantendo a extremidade interna das ripas móveis apoiada sobre o sarrafo da caixa base!
      const strokeMax = Math.max(0, w - t);
      const targetExtM = box.hingedBedLeafSizeMm !== undefined
        ? Math.min(strokeMax, Math.max(Math.min(0.10, strokeMax), box.hingedBedLeafSizeMm / 1000))
        : strokeMax * extRatio;
      const slideStroke = isExtended ? targetExtM : 0;
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
          bedTarget,
          fixedSlatW,
          slatT,
          slatDimZ,
          fixedSlatX,
          ySlat,
          zPos,
          slatMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Ripa Fixa #${i / 2 + 1} (${Math.round(fixedSlatW * 1000)}×${Math.round(slatDimZ * 1000)}×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: `${slatWoodMat} ${slatTMm}mm` }
        );
      }

      // Sarrafo interno de apoio na borda da caixa base onde as pontas das ripas móveis apoiam quando abertas
      const cleatX = direction === 'left' ? (w / 2 - t / 2) : (-w / 2 + t / 2);
      addPanel(
        bedTarget,
        t,
        0.035,
        l - 2 * t,
        cleatX,
        h / 2 - slatT - 0.035 / 2,
        0,
        slatMat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Sarrafo Guia de Apoio do Pente (${Math.round((l - 2 * t) * 1000)}×35×${Math.round(t * 1000)}mm)`,
        { thicknessMm: Math.round(t * 1000), woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: `${slatWoodMat} ${Math.round(t * 1000)}mm` }
      );

      // (B) Estrado Móvel Retrátil em L Invertido (Ripas nos índices ímpares: 1, 3, 5... + Painel Vertical Frontal)
      const mobileGroup = new THREE.Group();
      mobileGroup.name = 'SlatBedSlidingFrame';
      mobileGroup.position.set(slideOffsetX, 0, 0);

      // Desloca o conjunto de ripas móveis e a tampa frontal para avançar para fora da viga (cleat)
      const mobileSlatX = direction === 'left' ? t : -t;

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
          slatMat,
          mobileEdgeMat,
          box.id,
          container,
          `${box.name} • Ripa Móvel #${Math.floor(i / 2) + 1} (${Math.round(mobileSlatW * 1000)}×${Math.round(slatDimZ * 1000)}×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: `${slatWoodMat} ${slatTMm}mm` }
        );
      }

      // Perna vertical do L de cabeça para baixo: fecha toda a frente do módulo quando recolhido
      // Avançada em 't' para fora da viga de apoio das ripas, ficando encostada perfeitamente na face externa
      const outerX = direction === 'left' ? (w / 2 + t / 2) : (-w / 2 - t / 2);
      const legH = skipBaseBox ? h : Math.max(0.05, h - slatT);
      const legY = skipBaseBox ? -slatT : -slatT / 2;
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
      const legZ1 = -l / 2 + 0.035 / 2; // encostado na quina
      const legZ2 = l / 2 - 0.035 / 2;
      const legCornerX = direction === 'left' ? (w / 2 + t - 0.035 / 2) : (-w / 2 - t + 0.035 / 2);
      addPanel(
        mobileGroup,
        0.035,
        legH,
        0.035,
        legCornerX,
        legY,
        legZ1,
        legMat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Pé de Apoio Traseiro (${slatTMm}mm)`,
        { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: `${legWoodMat} ${slatTMm}mm` }
      );
      addPanel(
        mobileGroup,
        0.035,
        legH,
        0.035,
        legCornerX,
        legY,
        legZ2,
        legMat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Pé de Apoio Dianteiro (${slatTMm}mm)`,
        { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: `${legWoodMat} ${slatTMm}mm` }
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

      bedTarget.add(mobileGroup);

      if (parts === 5) {
        // Abas de apoio estrutural em compensado 15mm sobre as caixas de roda esquerda e direita
        const archW = 0.145; // ~145mm sobre o vão da caixa de roda
        const baseArchX = direction === 'left' ? (-w / 2 - archW / 2) : (w / 2 + archW / 2);
        addPanel(
          bedTarget,
          archW,
          slatT,
          l,
          baseArchX,
          ySlat,
          0,
          slatMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Aba Fixa de Apoio Caixa de Roda (${Math.round(archW * 1000)}×${Math.round(l * 1000)}mm)`,
          { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: `${slatWoodMat} ${slatTMm}mm` }
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
            slatMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Aba Oposta de Apoio Caixa de Roda (${Math.round(archW * 1000)}×${Math.round(l * 1000)}mm)`,
            { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: `${slatWoodMat} ${slatTMm}mm` }
          );
        }
      }
    } else {
      // --- ABERTURA LONGITUDINAL (Eixo Z: Frente ou Trás) ---
      // Curso máximo limitado ao dobro do próprio módulo (strokeMaxZ = l - t) formando um L invertido
      const strokeMaxZ = Math.max(0, l - t);
      const targetExtZ = box.hingedBedLeafSizeMm !== undefined
        ? Math.min(strokeMaxZ, Math.max(Math.min(0.10, strokeMaxZ), box.hingedBedLeafSizeMm / 1000))
        : strokeMaxZ * extRatio;
      const slideStrokeZ = isExtended ? targetExtZ : 0;
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
          bedTarget,
          slatDimX,
          slatT,
          fixedSlatL,
          xPos,
          ySlat,
          fixedSlatZ,
          slatMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Ripa Fixa #${i / 2 + 1} (${Math.round(slatDimX * 1000)}×${Math.round(fixedSlatL * 1000)}mm)`,
          { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: `${slatWoodMat} ${slatTMm}mm` }
        );
      }

      // (B) Estrado Móvel Retrátil em L Invertido (Ripas nos índices ímpares: 1, 3, 5... + Painel Vertical)
      const mobileGroup = new THREE.Group();
      mobileGroup.name = 'SlatBedSlidingFrame';
      mobileGroup.position.set(0, 0, slideOffsetZ);

      // Desloca o conjunto de ripas móveis e a tampa frontal para avançar para fora da viga
      const mobileSlatZ = direction === 'front' ? t : -t;

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
          slatMat,
          mobileEdgeMat,
          box.id,
          container,
          `${box.name} • Ripa Móvel #${Math.floor(i / 2) + 1} (${Math.round(slatDimX * 1000)}×${Math.round(mobileSlatL * 1000)}mm)`,
          { thicknessMm: slatTMm, woodMaterial: slatWoodMat, moduleName: box.name, partType: 'slat', material: `${slatWoodMat} ${slatTMm}mm` }
        );
      }

      // Perna vertical frontal/traseira do L invertido
      // Avançada em 't' para fora da viga de apoio das ripas
      const outerZ = direction === 'front' ? (l / 2 + t / 2) : (-l / 2 - t / 2);
      const legH = skipBaseBox ? h : Math.max(0.05, h - slatT);
      const legY = skipBaseBox ? -slatT : -slatT / 2;
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
      const legX1 = -w / 2 + 0.035 / 2; // encostado na quina
      const legX2 = w / 2 - 0.035 / 2;
      const legCornerZ = direction === 'front' ? (l / 2 + t - 0.035 / 2) : (-l / 2 - t + 0.035 / 2);
      addPanel(
        mobileGroup,
        0.035,
        legH,
        0.035,
        legX1,
        legY,
        legCornerZ,
        legMat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Pé de Apoio Esq. (${slatTMm}mm)`,
        { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: `${legWoodMat} ${slatTMm}mm` }
      );
      addPanel(
        mobileGroup,
        0.035,
        legH,
        0.035,
        legX2,
        legY,
        legCornerZ,
        legMat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Pé de Apoio Dir. (${slatTMm}mm)`,
        { thicknessMm: slatTMm, woodMaterial: legWoodMat, moduleName: box.name, partType: 'leg', material: `${legWoodMat} ${slatTMm}mm` }
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

      bedTarget.add(mobileGroup);
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
        bedTarget.add(visualGroup);

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
        bedTarget.add(nominalGroup);
      } else {
        this.mattressBuilder.buildMattress({
          container: bedTarget,
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
