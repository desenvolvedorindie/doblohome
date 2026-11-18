const fs = require('fs');
const path = require('path');

function normalize(str) {
  return str.replace(/\r\n/g, '\n');
}

// 1. FridgePortaPottiBuilder.ts
const fridgePath = path.resolve(__dirname, '../../src/three/boxes/accessories/FridgePortaPottiBuilder.ts');
let fridgeContent = normalize(fs.readFileSync(fridgePath, 'utf8'));

// Fridge fixed dimensions
const oldFridgeDims = `  const fw = Math.min(w - 0.03, preset.width / 1000);
  const fd = Math.min(l - 0.03, preset.depth / 1000);
  const fh = Math.min(h - 0.02, preset.height / 1000);`;

const newFridgeDims = `  const fw = preset.width / 1000;
  const fd = preset.depth / 1000;
  const fh = preset.height / 1000;`;

if (fridgeContent.includes(oldFridgeDims)) {
  fridgeContent = fridgeContent.replace(oldFridgeDims, newFridgeDims);
  console.log('Replaced fridge dims to fixed preset size');
} else {
  console.log('WARNING: oldFridgeDims not found');
}

// PortaPotti fixed dimensions
const oldPortaDims = `  const pw = Math.min(w - 0.03, preset.width / 1000);   // Largura (transversal)
  const pd = Math.min(l - 0.03, preset.depth / 1000);   // Profundidade (longitudinal)
  const ph = Math.min(h - 0.02, preset.height / 1000);  // Altura total`;

const newPortaDims = `  const pw = preset.width / 1000;   // Largura real do preset (transversal)
  const pd = preset.depth / 1000;   // Profundidade real do preset (longitudinal)
  const ph = preset.height / 1000;  // Altura total real do preset`;

if (fridgeContent.includes(oldPortaDims)) {
  fridgeContent = fridgeContent.replace(oldPortaDims, newPortaDims);
  console.log('Replaced porta potti dims to fixed preset size');
} else {
  console.log('WARNING: oldPortaDims not found');
}

fs.writeFileSync(fridgePath, fridgeContent, 'utf8');

// 2. StoveApplianceBuilder.ts
const stovePath = path.resolve(__dirname, '../../src/three/boxes/accessories/StoveApplianceBuilder.ts');
let stoveContent = normalize(fs.readFileSync(stovePath, 'utf8'));

const oldStoveScale = `  let scale = 1;
  if (placement === 'inside') {
    const availW = Math.max(0.12, w - 0.036);
    const availD = Math.max(0.12, l - 0.036);
    const availH = Math.max(0.05, h - 0.024);
    const effW = isRotated90 ? sdRaw : swRaw;
    const effD = isRotated90 ? swRaw : sdRaw;
    scale = Math.min(1, availW / effW, availD / effD, availH / shRaw);
  }

  const sw = swRaw * scale;
  const sd = sdRaw * scale;
  const sh = shRaw * scale;`;

const newStoveScale = `  // Dimensões físicas reais do fogareiro fixas conforme o preset (não devem encolher com o módulo)
  const sw = swRaw;
  const sd = sdRaw;
  const sh = shRaw;`;

if (stoveContent.includes(oldStoveScale)) {
  stoveContent = stoveContent.replace(oldStoveScale, newStoveScale);
  console.log('Replaced stove dims to fixed preset size (no auto-scale)');
} else {
  console.log('WARNING: oldStoveScale not found');
}

fs.writeFileSync(stovePath, stoveContent, 'utf8');
