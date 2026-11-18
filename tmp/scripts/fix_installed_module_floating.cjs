const fs = require('fs');
const path = require('path');

function normalize(str) {
  return str.replace(/\r\n/g, '\n');
}

// 1. BoxElectronicsBuilder.ts
const elecPath = path.resolve(__dirname, '../../src/three/boxes/BoxElectronicsBuilder.ts');
let elecContent = normalize(fs.readFileSync(elecPath, 'utf8'));

const oldElecDecl = `    const tFront = tConfig.front;
    const tRear = tConfig.rear;

    // Dimensões internas úteis respeitando as espessuras reais das chapas
    const wIn = Math.max(0.10, w - tLeft - tRight);
    const lIn = Math.max(0.10, l - tFront - tRear);
    const hIn = Math.max(0.10, h - tBottom - tTop);`;

const newElecDecl = `    const tFront = tConfig.front;
    const tRear = tConfig.rear;

    const drawerSlide = container.getObjectByName('DrawerSlide') as THREE.Group | undefined;
    const hasBottom = Boolean(box.panels?.bottom);
    const hasTop = box.panels?.top ?? (box.type === 'chest');
    const bottomThickness = hasBottom ? tBottom : 0;
    const topThickness = hasTop ? tTop : 0;

    // Dimensões internas úteis respeitando as espessuras reais das chapas
    const wIn = Math.max(0.10, w - tLeft - tRight);
    const lIn = Math.max(0.10, l - tFront - tRear);
    const hIn = Math.max(0.10, h - bottomThickness - topThickness);`;

if (elecContent.includes(oldElecDecl)) {
  elecContent = elecContent.replace(oldElecDecl, newElecDecl);
  console.log('Replaced elecDecl');
} else {
  console.log('WARNING: elecDecl not found');
}

const oldFaceBottom = `        // Fundo do módulo: Y = -h/2 + tBottom (apoiado diretamente sobre a chapa de piso)
        const posY = -h / 2 + tBottom + compH / 2 + customOffY;`;

const newFaceBottom = `        // Fundo do módulo: apoiado diretamente sobre a chapa de piso ou sobre a tampa de baixo (se existir)
        const posY = (drawerSlide && drawerSlide.userData?.trayTopY !== undefined)
          ? (drawerSlide.userData.trayTopY + compH / 2 + customOffY)
          : (-h / 2 + bottomThickness + compH / 2 + customOffY);`;

if (elecContent.includes(oldFaceBottom)) {
  elecContent = elecContent.replace(oldFaceBottom, newFaceBottom);
  console.log('Replaced faceBottom');
} else {
  console.log('WARNING: faceBottom not found');
}

const oldWallY = `        const yMin = -h / 2 + tBottom + effH / 2;
        const yMax = h / 2 - tTop - effH / 2;`;

const newWallY = `        const yMin = (drawerSlide && drawerSlide.userData?.trayTopY !== undefined)
          ? (drawerSlide.userData.trayTopY + effH / 2)
          : (-h / 2 + bottomThickness + effH / 2);
        const yMax = h / 2 - topThickness - effH / 2;`;

if (elecContent.includes(oldWallY)) {
  elecContent = elecContent.replaceAll(oldWallY, newWallY);
  console.log('Replaced wallY');
} else {
  console.log('WARNING: wallY not found');
}

fs.writeFileSync(elecPath, elecContent, 'utf8');

// 2. FridgePortaPottiBuilder.ts
const fridgePath = path.resolve(__dirname, '../../src/three/boxes/accessories/FridgePortaPottiBuilder.ts');
let fridgeContent = normalize(fs.readFileSync(fridgePath, 'utf8'));

if (!fridgeContent.includes('getBoxThickness')) {
  fridgeContent = fridgeContent.replace(
    `import { InternalBoxItem } from '../../../types';`,
    `import { InternalBoxItem } from '../../../types';\nimport { getBoxThickness } from '../BoxGeometryHelpers';`
  );
}

const oldFridgeBottom = `    const posX = alignXOffset + fineOffsetX;
    const posZ = alignZOffset + fineOffsetZ;
    const bottomY = -h / 2 + fh / 2 + 0.018;
    fridgeGroup.position.set(posX, bottomY, posZ);`;

const newFridgeBottom = `    const posX = alignXOffset + fineOffsetX;
    const posZ = alignZOffset + fineOffsetZ;
    const tConfig = getBoxThickness(box);
    const hasBottom = Boolean(box.panels?.bottom);
    const bottomThickness = hasBottom ? tConfig.bottom : 0;
    const bottomY = -h / 2 + fh / 2 + bottomThickness;
    fridgeGroup.position.set(posX, bottomY, posZ);`;

if (fridgeContent.includes(oldFridgeBottom)) {
  fridgeContent = fridgeContent.replace(oldFridgeBottom, newFridgeBottom);
  console.log('Replaced fridgeBottom');
} else {
  console.log('WARNING: fridgeBottom not found');
}

const oldPortaBottom = `    const posX = alignXOffset + fineOffsetX;
    const posZ = alignZOffset + fineOffsetZ;
    const bottomY = -h / 2 + ph / 2 + 0.018;
    portaPottiGroup.position.set(posX, bottomY, posZ);`;

const newPortaBottom = `    const posX = alignXOffset + fineOffsetX;
    const posZ = alignZOffset + fineOffsetZ;
    const tConfig = getBoxThickness(box);
    const hasBottom = Boolean(box.panels?.bottom);
    const bottomThickness = hasBottom ? tConfig.bottom : 0;
    const bottomY = -h / 2 + ph / 2 + bottomThickness;
    portaPottiGroup.position.set(posX, bottomY, posZ);`;

if (fridgeContent.includes(oldPortaBottom)) {
  fridgeContent = fridgeContent.replace(oldPortaBottom, newPortaBottom);
  console.log('Replaced portaBottom');
} else {
  console.log('WARNING: portaBottom not found');
}

fs.writeFileSync(fridgePath, fridgeContent, 'utf8');

// 3. StoveApplianceBuilder.ts
const stovePath = path.resolve(__dirname, '../../src/three/boxes/accessories/StoveApplianceBuilder.ts');
let stoveContent = normalize(fs.readFileSync(stovePath, 'utf8'));

if (!stoveContent.includes('getBoxThickness')) {
  stoveContent = stoveContent.replace(
    `import { InternalBoxItem, StovePreset } from '../../../types';`,
    `import { InternalBoxItem, StovePreset } from '../../../types';\nimport { getBoxThickness } from '../BoxGeometryHelpers';`
  );
}

const oldStoveClosed = `      // Quando a prateleira traseira está fechada, guarda no interior do módulo
      const bottomY = -h / 2 + sh / 2 + 0.018;
      stoveGroup.position.set(alignXOffset + fineOffsetX, bottomY, alignZOffset + fineOffsetZ);
      targetParent.add(stoveGroup);
    }
  } else {
    if (drawerSlide && drawerSlide.userData?.trayTopY !== undefined) {
      const posX = (drawerSlide.userData.cabCenterX || 0) + alignXOffset + fineOffsetX;
      const posZ = (drawerSlide.userData.cabCenterZ || 0) + alignZOffset + fineOffsetZ;
      const posY = drawerSlide.userData.trayTopY + sh / 2;
      stoveGroup.position.set(posX, posY, posZ);
    } else {
      const bottomY = -h / 2 + sh / 2 + 0.018;
      stoveGroup.position.set(alignXOffset + fineOffsetX, bottomY, alignZOffset + fineOffsetZ);
    }
    targetParent.add(stoveGroup);
  }`;

const newStoveClosed = `      // Quando a prateleira traseira está fechada, guarda no interior do módulo
      const tConfig = getBoxThickness(box);
      const hasBottom = Boolean(box.panels?.bottom);
      const bottomThickness = hasBottom ? tConfig.bottom : 0;
      const bottomY = -h / 2 + sh / 2 + bottomThickness;
      stoveGroup.position.set(alignXOffset + fineOffsetX, bottomY, alignZOffset + fineOffsetZ);
      targetParent.add(stoveGroup);
    }
  } else {
    if (drawerSlide && drawerSlide.userData?.trayTopY !== undefined) {
      const posX = (drawerSlide.userData.cabCenterX || 0) + alignXOffset + fineOffsetX;
      const posZ = (drawerSlide.userData.cabCenterZ || 0) + alignZOffset + fineOffsetZ;
      const posY = drawerSlide.userData.trayTopY + sh / 2;
      stoveGroup.position.set(posX, posY, posZ);
    } else {
      const tConfig = getBoxThickness(box);
      const hasBottom = Boolean(box.panels?.bottom);
      const bottomThickness = hasBottom ? tConfig.bottom : 0;
      const bottomY = -h / 2 + sh / 2 + bottomThickness;
      stoveGroup.position.set(alignXOffset + fineOffsetX, bottomY, alignZOffset + fineOffsetZ);
    }
    targetParent.add(stoveGroup);
  }`;

if (stoveContent.includes(oldStoveClosed)) {
  stoveContent = stoveContent.replace(oldStoveClosed, newStoveClosed);
  console.log('Replaced stoveClosed');
} else {
  console.log('Already replaced or not found');
}

fs.writeFileSync(stovePath, stoveContent, 'utf8');

// 4. ModuleCollisionChecker.ts
const collPath = path.resolve(__dirname, '../../src/three/boxes/ModuleCollisionChecker.ts');
let collContent = normalize(fs.readFileSync(collPath, 'utf8'));
if (collContent.includes(`  const hasBottom = item?.panels?.bottom ?? true;`)) {
  collContent = collContent.replace(
    `  const hasBottom = item?.panels?.bottom ?? true;`,
    `  const hasBottom = Boolean(item?.panels?.bottom);`
  );
  fs.writeFileSync(collPath, collContent, 'utf8');
  console.log('Replaced moduleCollision hasBottom');
}
