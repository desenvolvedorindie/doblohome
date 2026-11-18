const fs = require('fs');
const path = require('path');

function normalize(str) {
  return str.replace(/\r\n/g, '\n');
}

const bldPath = path.resolve(__dirname, '../../src/three/boxes/SlatBedBuilder.ts');
let bldContent = normalize(fs.readFileSync(bldPath, 'utf8'));

// 1. Update bedPanels to check isHinged
const oldBedPanels = `    // 1. Caixa base inferior de apoio / baú de arrumação sob a cama (sem o tampo superior
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
    };`;

const newBedPanels = `    // 1. Caixa base inferior de apoio / baú de arrumação sob a cama
    const isHinged = box.bedMode === 'hinged';
    const baseH = Math.max(0.05, h - slatT);
    const baseGroup = new THREE.Group();
    baseGroup.position.set(0, -slatT / 2, 0);
    // Para cama de ripas (slat), o lado do deslizamento fica aberto para o L invertido passar.
    // Para cama dobradiça (hinged), a base é um baú completo (4 paredes) com tampo fixo superior.
    const bedPanels = isHinged
      ? { ...box.panels, top: false }
      : {
          ...box.panels,
          left: direction === 'left' ? false : (box.panels?.left ?? true),
          right: direction === 'right' ? false : (box.panels?.right ?? true),
          front: direction === 'front' ? false : (box.panels?.front ?? true),
          rear: direction === 'rear' ? false : (box.panels?.rear ?? true)
        };`;

if (bldContent.includes(oldBedPanels)) {
  bldContent = bldContent.replace(oldBedPanels, newBedPanels);
  console.log('Replaced bedPanels');
} else {
  console.log('WARNING: oldBedPanels not found');
}

// 2. Wrap slat mechanism with if (isHinged) { this.buildHingedBedPanels(...) } else { ... }
const oldMechStart = `    // 2. Sistema de Ripas Retráteis Intercaladas em L Invertido (Pente de Madeira)
    const ySlat = h / 2 - slatT / 2;
    const parts = (box.mattressParts ?? (box.colSpan === 1 ? 2 : 3)) as 1 | 2 | 3 | 4 | 5;

    if (direction === 'left' || direction === 'right') {`;

const newMechStart = `    // 2. Mecanismo da Cama: Dobradiça (Hinged) vs Ripas Retráteis (Slat)
    const ySlat = h / 2 - slatT / 2;
    const parts = (box.mattressParts ?? (box.colSpan === 1 ? 2 : 3)) as 1 | 2 | 3 | 4 | 5;

    if (isHinged) {
      // --- MODO 2: CAMA ARTICULADA COM DOBRADIÇA (TAMPO DOBRÁVEL 180°) ---
      this.buildHingedBedPanels(
        container,
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
        woodMat
      );
    } else if (direction === 'left' || direction === 'right') {`;

if (bldContent.includes(oldMechStart)) {
  bldContent = bldContent.replace(oldMechStart, newMechStart);
  console.log('Replaced mechStart');
} else {
  console.log('WARNING: oldMechStart not found');
}

// 3. Add buildHingedBedPanels helper method before closing class
const classClosing = `  private mattressBuilder = new SlatBedMattressBuilder();`;
const helperMethod = `  private buildHingedBedPanels(
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
    woodMat: string
  ) {
    const ySlat = h / 2 - slatT / 2;
    const legH = Math.max(0.05, h - slatT);

    // 1. Tampo Fixo Base
    addPanel(
      container,
      w,
      slatT,
      l,
      0,
      ySlat,
      0,
      mat,
      edgeMat,
      box.id,
      container,
      \`\${box.name} • Cama Dobradiça - Tampo Fixo Base (\${Math.round(w * 1000)}×\${Math.round(l * 1000)}×\${slatTMm}mm)\`,
      { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: \`\${woodMat} \${slatTMm}mm Impermeabilizado\` }
    );

    // Material metálico para as dobradiças
    const hingeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.25
    });

    const isLateral = direction === 'left' || direction === 'right';

    if (isLateral) {
      const hingeX = direction === 'left' ? -w / 2 : w / 2;
      const hingePivot = new THREE.Group();
      hingePivot.name = 'HingedBedPivot';
      hingePivot.position.set(hingeX, h / 2, 0);

      // Quando aberto, desdobra 180° (PI radianos) para fora no eixo Z
      hingePivot.rotation.z = isExtended ? (direction === 'left' ? Math.PI : -Math.PI) : 0;

      // Folha articulada dobrável: quando fechada, descansa em cima do tampo fixo
      const localLeafCenterX = direction === 'left' ? w / 2 : -w / 2;
      const localLeafCenterY = slatT / 2;

      addPanel(
        hingePivot,
        w,
        slatT,
        l,
        localLeafCenterX,
        localLeafCenterY,
        0,
        mat,
        mobileEdgeMat,
        box.id,
        container,
        \`\${box.name} • Cama Dobradiça - Folha Articulada (\${Math.round(w * 1000)}×\${Math.round(l * 1000)}×\${slatTMm}mm)\`,
        { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'door', material: \`\${woodMat} \${slatTMm}mm Impermeabilizado\` }
      );

      // Pés de apoio articulados na extremidade externa da folha dobrável
      const localLegX = direction === 'left' ? (w - 0.035 / 2) : (-w + 0.035 / 2);
      const legZ1 = -l / 2 + Math.min(0.08, l * 0.15);
      const legZ2 = l / 2 - Math.min(0.08, l * 0.15);
      const localLegY = slatT + legH / 2;

      addPanel(
        hingePivot,
        0.035,
        legH,
        0.035,
        localLegX,
        localLegY,
        legZ1,
        mat,
        edgeMat,
        box.id,
        container,
        \`\${box.name} • Cama Dobradiça - Pé de Apoio Traseiro (\${Math.round(legH * 1000)}×35×35mm)\`,
        { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'leg', material: \`\${woodMat} \${slatTMm}mm\` }
      );
      addPanel(
        hingePivot,
        0.035,
        legH,
        0.035,
        localLegX,
        localLegY,
        legZ2,
        mat,
        edgeMat,
        box.id,
        container,
        \`\${box.name} • Cama Dobradiça - Pé de Apoio Dianteiro (\${Math.round(legH * 1000)}×35×35mm)\`,
        { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'leg', material: \`\${woodMat} \${slatTMm}mm\` }
      );

      // 3 Dobradiças de metal visíveis ao longo da costura
      [-l * 0.35, 0, l * 0.35].forEach((zPos) => {
        const hCyl = new THREE.CylinderGeometry(0.007, 0.007, 0.05, 12);
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
      // Longitudinal (rear ou front)
      const hingeZ = direction === 'rear' ? -l / 2 : l / 2;
      const hingePivot = new THREE.Group();
      hingePivot.name = 'HingedBedPivot';
      hingePivot.position.set(0, h / 2, hingeZ);

      hingePivot.rotation.x = isExtended ? (direction === 'rear' ? -Math.PI : Math.PI) : 0;

      const localLeafCenterZ = direction === 'rear' ? l / 2 : -l / 2;
      const localLeafCenterY = slatT / 2;

      addPanel(
        hingePivot,
        w,
        slatT,
        l,
        0,
        localLeafCenterY,
        localLeafCenterZ,
        mat,
        mobileEdgeMat,
        box.id,
        container,
        \`\${box.name} • Cama Dobradiça - Folha Articulada (\${Math.round(w * 1000)}×\${Math.round(l * 1000)}×\${slatTMm}mm)\`,
        { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'door', material: \`\${woodMat} \${slatTMm}mm Impermeabilizado\` }
      );

      const localLegZ = direction === 'rear' ? (l - 0.035 / 2) : (-l + 0.035 / 2);
      const legX1 = -w / 2 + Math.min(0.08, w * 0.15);
      const legX2 = w / 2 - Math.min(0.08, w * 0.15);
      const localLegY = slatT + legH / 2;

      addPanel(
        hingePivot,
        0.035,
        legH,
        0.035,
        legX1,
        localLegY,
        localLegZ,
        mat,
        edgeMat,
        box.id,
        container,
        \`\${box.name} • Cama Dobradiça - Pé Articulado Esq. (\${Math.round(legH * 1000)}×35×35mm)\`,
        { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'leg', material: \`\${woodMat} \${slatTMm}mm\` }
      );
      addPanel(
        hingePivot,
        0.035,
        legH,
        0.035,
        legX2,
        localLegY,
        localLegZ,
        mat,
        edgeMat,
        box.id,
        container,
        \`\${box.name} • Cama Dobradiça - Pé Articulado Dir. (\${Math.round(legH * 1000)}×35×35mm)\`,
        { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'leg', material: \`\${woodMat} \${slatTMm}mm\` }
      );

      [-w * 0.35, 0, w * 0.35].forEach((xPos) => {
        const hCyl = new THREE.CylinderGeometry(0.007, 0.007, 0.05, 12);
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

  private mattressBuilder = new SlatBedMattressBuilder();`;

if (bldContent.includes(classClosing)) {
  bldContent = bldContent.replace(classClosing, helperMethod);
  console.log('Added buildHingedBedPanels method');
} else {
  console.log('WARNING: classClosing not found');
}

fs.writeFileSync(bldPath, bldContent, 'utf8');
