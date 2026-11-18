const fs = require('fs');
const path = require('path');

// 1. Update BoxGeometryHelpers.ts
const helpersPath = path.resolve('src/three/boxes/BoxGeometryHelpers.ts');
let helpersCode = fs.readFileSync(helpersPath, 'utf8');

// Replace wallH and frontRearH calculation in buildHollowBox
const oldWallTarget = `  const hasBottom = panelsConfig?.bottom ?? includeBottom;
  const hasLeft = panelsConfig?.left ?? true;
  const hasRight = panelsConfig?.right ?? true;
  const hasFront = panelsConfig?.front ?? true;
  const hasRear = panelsConfig?.rear ?? true;

  const tConfig = getBoxThickness(box);
  const tBottom = tConfig.bottom;
  const tLeft = tConfig.left;
  const tRight = tConfig.right;
  const tFront = tConfig.front;
  const tRear = tConfig.rear;
  const woodMat = getWoodMaterialName(box?.material);

  const jointStyle = box?.boxJointStyle || 'top_bottom_cap';
  const backCoverMode = box?.boxBackCoverMode || (jointStyle === 'back_over_all' ? 'overlay_all' : 'inset');
  const isBackOverlay = hasRear && (backCoverMode === 'overlay_all' || jointStyle === 'back_over_all');
  const isSidesOutside = jointStyle === 'sides_outside';

  // Se o fundo (rear) for sobreposto cobrindo tudo (5 partes), todas as paredes laterais, fundo base e tampo descontam tRear na traseira (-Z)
  const zBackDiscount = isBackOverlay ? tRear : 0;
  const usableL = Math.max(0.01, l - zBackDiscount);
  const zCenterOffset = zBackDiscount / 2; // Desloca o corpo +tRear/2 para frente para deixar o espaço da chapa traseira inteiriça

  // Se laterais forem externas passantes ('sides_outside'), as laterais vão até o piso (-h/2 a +h/2) e o fundo base fica embutido entre as laterais.
  // Se 'top_bottom_cap' (padrão), o fundo base tem largura total w e as paredes apoiam sobre ele.
  const wallH = (hasBottom && !isSidesOutside) ? Math.max(0.01, h - tBottom) : h;
  const wallY = (hasBottom && !isSidesOutside) ? (-h / 2 + tBottom + wallH / 2) : 0;`;

const newWallTarget = `  const hasBottom = panelsConfig?.bottom ?? includeBottom;
  const hasLeft = panelsConfig?.left ?? true;
  const hasRight = panelsConfig?.right ?? true;
  const hasFront = panelsConfig?.front ?? true;
  const hasRear = panelsConfig?.rear ?? true;
  const hasTop = panelsConfig?.top ?? false;

  const tConfig = getBoxThickness(box);
  const tBottom = tConfig.bottom;
  const tTop = tConfig.top;
  const tLeft = tConfig.left;
  const tRight = tConfig.right;
  const tFront = tConfig.front;
  const tRear = tConfig.rear;
  const woodMat = getWoodMaterialName(box?.material);

  const jointStyle = box?.boxJointStyle || 'top_bottom_cap';
  const backCoverMode = box?.boxBackCoverMode || (jointStyle === 'back_over_all' ? 'overlay_all' : 'inset');
  const isBackOverlay = hasRear && (backCoverMode === 'overlay_all' || jointStyle === 'back_over_all');
  const isSidesOutside = jointStyle === 'sides_outside';

  // Se o fundo (rear) for sobreposto cobrindo tudo (5 partes), todas as paredes laterais, fundo base e tampo descontam tRear na traseira (-Z)
  const zBackDiscount = isBackOverlay ? tRear : 0;
  const usableL = Math.max(0.01, l - zBackDiscount);
  const zCenterOffset = zBackDiscount / 2; // Desloca o corpo +tRear/2 para frente para deixar o espaço da chapa traseira inteiriça

  // Tamponamento correto:
  // Se 'sides_outside', as laterais vão até o teto/piso (-h/2 a +h/2, altura h).
  // Se 'top_bottom_cap' (padrão), o tampo e o fundo cobrem as laterais, portanto as laterais devem descontar tTop e tBottom.
  const wallH = !isSidesOutside
    ? Math.max(0.01, h - (hasBottom ? tBottom : 0) - (hasTop ? tTop : 0))
    : (hasBottom ? Math.max(0.01, h - tBottom) : h);
  const wallY = !isSidesOutside
    ? (-h / 2 + (hasBottom ? tBottom : 0) + wallH / 2)
    : (hasBottom ? (-h / 2 + tBottom + wallH / 2) : 0);`;

const oldFrontRearTarget = `  // Altura e Y da parede frontal e do fundo embutido (descontando a base mesmo quando isSidesOutside)
  const frontRearH = hasBottom ? Math.max(0.01, h - tBottom) : h;
  const frontRearY = hasBottom ? (-h / 2 + tBottom + frontRearH / 2) : 0;`;

const newFrontRearTarget = `  // Altura e Y da parede frontal e do fundo embutido (descontando a base e o tampo superior para encaixe perfeito)
  const frontRearH = Math.max(0.01, h - (hasBottom ? tBottom : 0) - (hasTop ? tTop : 0));
  const frontRearY = -h / 2 + (hasBottom ? tBottom : 0) + frontRearH / 2;`;

helpersCode = helpersCode.replace(oldWallTarget, newWallTarget);
helpersCode = helpersCode.replace(oldFrontRearTarget, newFrontRearTarget);
fs.writeFileSync(helpersPath, helpersCode, 'utf8');
console.log('Successfully updated BoxGeometryHelpers.ts');

// 2. Update ChestBuilder.ts
const chestBuilderPath = path.resolve('src/three/boxes/ChestBuilder.ts');
let chestCode = fs.readFileSync(chestBuilderPath, 'utf8');

const oldOpenTargetRegex = /if \(box\.type === 'open'\) \{[\s\S]*?return;\r?\n\s*\}/;

const newOpenCode = `if (box.type === 'open') {
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
          ? \`\${box.name} • Tampo Superior Vazado CNC c/ Apoio do Aéreo (\${tTopMm}mm)\`
          : \`\${box.name} • Tampo Superior Vazado (\${tTopMm}mm)\`;
        if (box.topPerforated) {
          addPerforatedPanel(container, topW, tTop, topL, topX, h / 2 - tTop / 2, topZ, mat, edgeMat, box.id, container, openTopLabel, box, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
          });
        } else {
          addPanel(container, topW, tTop, topL, topX, h / 2 - tTop / 2, topZ, mat, edgeMat, box.id, container, \`\${box.name} • Tampo Superior (\${tTopMm}mm)\`, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: \`\${woodMat} \${tTopMm}mm Impermeabilizado\`
          });
        }
      }
      return;
    }`;

chestCode = chestCode.replace(oldOpenTargetRegex, newOpenCode);

// In chest section, pass { ...box.panels, top: false } to buildHollowBox so bodyHeight (which already subtracted tTop) doesn't discount tTop twice
chestCode = chestCode.replace(
  'buildHollowBox(bodyGroup, w, bodyHeight, l, tConfig.default, mat, edgeMat, false, box.id, container, box.panels, box.name, box);',
  'buildHollowBox(bodyGroup, w, bodyHeight, l, tConfig.default, mat, edgeMat, false, box.id, container, { ...box.panels, top: false }, box.name, box);'
);

fs.writeFileSync(chestBuilderPath, chestCode, 'utf8');
console.log('Successfully updated ChestBuilder.ts');
