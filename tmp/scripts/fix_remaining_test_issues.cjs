const fs = require('fs');
const path = require('path');

const outDir = 'src/three/boxes';

// 1. BoxGeometryHelpers.ts: fix getWoodMaterialName
let bgh = fs.readFileSync(path.join(outDir, 'BoxGeometryHelpers.ts'), 'utf8');
const origGetWood = `export function getWoodMaterialName(material?: string): string {
  switch (material) {
    case 'dark_wood':
      return 'Madeira Nobre Maciça';
    case 'white_mdf':
      return 'MDF Branco Ultra';
    case 'aluminum_box':
      return 'Alumínio Estrutural';
    case 'plywood':
    default:
      return 'Compensado Naval';
  }
}`;
bgh = bgh.replace(/export function getWoodMaterialName[\s\S]*?default:\s*return '[^']+';\s*\}\s*\}/, origGetWood);
fs.writeFileSync(path.join(outDir, 'BoxGeometryHelpers.ts'), bgh);

// 2. DrawerBuilder.ts: replace this.addPanel and this.addPerforatedPanel
let db = fs.readFileSync(path.join(outDir, 'DrawerBuilder.ts'), 'utf8');
db = db.replace(/this\.addPanel\(/g, 'addPanel(');
db = db.replace(/this\.addPerforatedPanel\(/g, 'addPerforatedPanel(');
fs.writeFileSync(path.join(outDir, 'DrawerBuilder.ts'), db);

// 3. SlatBedMattressBuilder.ts: add isSelected and showMattress
let smb = fs.readFileSync(path.join(outDir, 'SlatBedMattressBuilder.ts'), 'utf8');
smb = smb.replace('export interface SlatMattressParams {',
`export interface SlatMattressParams {
  showMattress?: boolean;
  isSelected?: boolean;`);
smb = smb.replace('const { container, w, l, h, box, slatT, direction, isExtended, extRatio, cellWM, cellLM } = params;',
`const { container, w, l, h, box, slatT, direction, isExtended, extRatio, cellWM, cellLM } = params;
    const isSelected = params.isSelected ?? false;
    const showMattress = params.showMattress ?? true;`);
fs.writeFileSync(path.join(outDir, 'SlatBedMattressBuilder.ts'), smb);

// In SlatBedBuilder.ts pass isSelected and showMattress to mattressBuilder
let sbb = fs.readFileSync(path.join(outDir, 'SlatBedBuilder.ts'), 'utf8');
sbb = sbb.replace('cellLM\n      });', 'cellLM,\n        isSelected,\n        showMattress\n      });');
fs.writeFileSync(path.join(outDir, 'SlatBedBuilder.ts'), sbb);

// 4. FloorAndGridBuilder.ts: remove duplicate buildGrid and make buildGrid public
let fgb = fs.readFileSync(path.join(outDir, 'FloorAndGridBuilder.ts'), 'utf8');
// remove the first buildGrid (around line 87)
const firstBuildGrid = fgb.indexOf('private buildGrid');
if (firstBuildGrid !== -1) {
  const nextMethod = fgb.indexOf('buildFloorCentralTable', firstBuildGrid);
  fgb = fgb.slice(0, firstBuildGrid) + fgb.slice(nextMethod);
}
fgb = fgb.replace('private buildGrid(', 'buildGrid(');
fs.writeFileSync(path.join(outDir, 'FloorAndGridBuilder.ts'), fgb);

console.log('Fixed remaining test issues!');
