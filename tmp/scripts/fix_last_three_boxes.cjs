const fs = require('fs');
const path = require('path');

const outDir = 'src/three/boxes';

// 1. CeilingLedBuilder.ts
let clb = fs.readFileSync(path.join(outDir, 'CeilingLedBuilder.ts'), 'utf8').trimEnd();
if (clb.endsWith('}\n}\n}')) {
  clb = clb.slice(0, -2);
}
fs.writeFileSync(path.join(outDir, 'CeilingLedBuilder.ts'), clb + '\n');

// 2. SlatBedMattressBuilder.ts
let smb = fs.readFileSync(path.join(outDir, 'SlatBedMattressBuilder.ts'), 'utf8');
const cutIdx = smb.indexOf('  /**\n   * Constr');
if (cutIdx !== -1) {
  smb = smb.slice(0, cutIdx).trimEnd() + '\n}\n';
}
fs.writeFileSync(path.join(outDir, 'SlatBedMattressBuilder.ts'), smb);

// 3. FloorAndGridBuilder.ts: remove duplicate buildGrid
let fgb = fs.readFileSync(path.join(outDir, 'FloorAndGridBuilder.ts'), 'utf8');
const firstGrid = fgb.indexOf('  buildGrid(grid: InternalGridConfig');
const secondGrid = fgb.indexOf('  buildGrid(grid: InternalGridConfig', firstGrid + 10);
if (secondGrid !== -1) {
  // find end of second buildGrid
  const nextMethod = fgb.indexOf('  buildFloorCentralTable', secondGrid);
  fgb = fgb.slice(0, secondGrid) + fgb.slice(nextMethod);
  fs.writeFileSync(path.join(outDir, 'FloorAndGridBuilder.ts'), fgb);
}

console.log('Fixed last 3 boxes files!');
