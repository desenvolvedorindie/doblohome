const fs = require('fs');
const path = require('path');

function normalize(str) {
  return str.replace(/\r\n/g, '\n');
}

const bldPath = path.resolve(__dirname, '../../src/three/boxes/SlatBedBuilder.ts');
let content = normalize(fs.readFileSync(bldPath, 'utf8'));

// 1. Update buildSlatBedModule signature and base box skipping
const oldSig = `    buildSlatBedModule(
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
  ) {`;

const newSig = `    buildSlatBedModule(
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
  ) {`;

if (content.includes(oldSig)) {
  content = content.replace(oldSig, newSig);
  console.log('Updated buildSlatBedModule signature');
}

const oldBaseBox = `    // 1. Caixa base inferior de apoio / baú de arrumação sob a cama
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
    container.add(baseGroup);`;

const newBaseBox = `    // 1. Caixa base inferior de apoio / baú de arrumação sob a cama
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
    }`;

if (content.includes(oldBaseBox)) {
  content = content.replace(oldBaseBox, newBaseBox);
  console.log('Updated base box logic with skipBaseBox');
}

// Pass skipBaseBox and bedTarget to buildHingedBedPanels
content = content.replace(
  `      this.buildHingedBedPanels(\n        container,\n        w,\n        l,\n        h,\n        slatT,\n        slatTMm,\n        t,\n        direction,\n        isExtended,\n        mat,\n        edgeMat,\n        mobileEdgeMat,\n        box,\n        woodMat\n      );`,
  `      this.buildHingedBedPanels(\n        bedTarget,\n        w,\n        l,\n        h,\n        slatT,\n        slatTMm,\n        t,\n        direction,\n        isExtended,\n        mat,\n        edgeMat,\n        mobileEdgeMat,\n        box,\n        woodMat,\n        skipBaseBox\n      );`
);

// Replace container with bedTarget in the slats and mattress sections (after line 325)
const splitMarker = `} else if (direction === 'left' || direction === 'right') {`;
const parts = content.split(splitMarker);
if (parts.length === 2) {
  let secondHalf = parts[1];
  // Replace addPanel(container, ... with addPanel(bedTarget, ...
  secondHalf = secondHalf.replaceAll('addPanel(\n          container,', 'addPanel(\n          bedTarget,');
  secondHalf = secondHalf.replaceAll('addPanel(\n        container,', 'addPanel(\n        bedTarget,');
  // Replace container.add(mobileGroup) -> bedTarget.add(mobileGroup)
  secondHalf = secondHalf.replaceAll('container.add(mobileGroup);', 'bedTarget.add(mobileGroup);');
  // Replace container.add(visualGroup) -> bedTarget.add(visualGroup)
  secondHalf = secondHalf.replaceAll('container.add(visualGroup);', 'bedTarget.add(visualGroup);');
  // Replace container.add(nominalGroup) -> bedTarget.add(nominalGroup)
  secondHalf = secondHalf.replaceAll('container.add(nominalGroup);', 'bedTarget.add(nominalGroup);');
  // Replace mattress container -> bedTarget when not using visualGroup
  secondHalf = secondHalf.replace(
    `this.mattressBuilder.buildMattress({\n          container,\n          w,`,
    `this.mattressBuilder.buildMattress({\n          container: bedTarget,\n          w,`
  );
  // Adjust legH and legY in slat mode when skipBaseBox is true
  secondHalf = secondHalf.replaceAll(
    `const legH = Math.max(0.05, h - slatT);\n      const legY = -slatT / 2;`,
    `const legH = skipBaseBox ? h : Math.max(0.05, h - slatT);\n      const legY = skipBaseBox ? -slatT : -slatT / 2;`
  );
  content = parts[0] + splitMarker + secondHalf;
  console.log('Updated bedTarget and legH in slat & mattress sections');
}

fs.writeFileSync(bldPath, content, 'utf8');
