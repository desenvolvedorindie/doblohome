const fs = require('fs');
const path = require('path');

const norm = (s) => s.replace(/\r\n/g, '\n');

// 1. Tipos
const typesPath = path.resolve(__dirname, '../../src/types/internalBoxes.ts');
let types = norm(fs.readFileSync(typesPath, 'utf8'));
if (!types.includes('slatMaterial?:')) {
  types = types.replace(
    `  hingedBedLeafSizeMm?: number;`,
    `  slatMaterial?: InternalBoxMaterial; // Madeira/material das ripas (ou tampo/folha da cama dobrável). Padrão: material do módulo\n  bedLegMaterial?: InternalBoxMaterial; // Madeira/material dos pés da cama. Padrão: material do módulo\n  hingedBedLeafSizeMm?: number;`
  );
  fs.writeFileSync(typesPath, types, 'utf8');
  console.log('types updated');
}

// 2. Builder
const bPath = path.resolve(__dirname, '../../src/three/boxes/SlatBedBuilder.ts');
let src = norm(fs.readFileSync(bPath, 'utf8'));

src = src.replace(
  `import {\n`,
  `import {\n  createBoxMaterial,\n`
);
// evita duplicar se já existir
const importMatch = src.match(/import \{[^}]*\} from '.\/BoxGeometryHelpers';/);
if (importMatch && (importMatch[0].match(/createBoxMaterial/g) || []).length > 1) {
  src = src.replace('  createBoxMaterial,\n', '');
}

const defs = (indent) =>
  `${indent}// Madeira independente para ripas (ou folha/tampo) e para os pés da cama\n` +
  `${indent}const slatMatKey = box.slatMaterial ?? box.material;\n` +
  `${indent}const legMatKey = box.bedLegMaterial ?? box.material;\n` +
  `${indent}const slatMat = createBoxMaterial({ ...box, material: slatMatKey }, false);\n` +
  `${indent}const legMat = createBoxMaterial({ ...box, material: legMatKey }, false);\n` +
  `${indent}const slatWoodMat = getWoodMaterialName(slatMatKey);\n` +
  `${indent}const legWoodMat = getWoodMaterialName(legMatKey);\n`;

// Método hinged
src = src.replace(
  `    const ySlat = h / 2 - slatT / 2;\n    const legH = skipBaseBox ? h : Math.max(0.05, h - slatT);\n`,
  `    const ySlat = h / 2 - slatT / 2;\n    const legH = skipBaseBox ? h : Math.max(0.05, h - slatT);\n` + defs('    ')
);
// Método principal
src = src.replace(
  `    const isExtended = isOpen;\n`,
  `    const isExtended = isOpen;\n` + defs('    ')
);

// Percorre chamadas addPanel e troca material / nome da madeira
let out = '';
let i = 0;
let replaced = 0;
while (true) {
  const idx = src.indexOf('addPanel(', i);
  if (idx === -1) { out += src.slice(i); break; }
  out += src.slice(i, idx);
  let depth = 0;
  let j = idx + 'addPanel'.length;
  for (; j < src.length; j++) {
    const c = src[j];
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) { j++; break; } }
  }
  let block = src.slice(idx, j);
  const m = block.match(/partType: '(slat|leg|top|door)'/);
  if (m) {
    const kind = m[1] === 'leg' ? 'leg' : 'slat';
    block = block.replace(/(\n\s+)mat,(\n)/, `$1${kind}Mat,$2`);
    block = block.replaceAll('woodMaterial: woodMat', `woodMaterial: ${kind}WoodMat`);
    block = block.replaceAll('${woodMat}', `\${${kind}WoodMat}`);
    replaced++;
  }
  out += block;
  i = j;
}
fs.writeFileSync(bPath, out, 'utf8');
console.log('addPanel blocks updated:', replaced);
