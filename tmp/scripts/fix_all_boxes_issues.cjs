const fs = require('fs');
const path = require('path');

const outDir = 'src/three/boxes';

// 1. BoxGeometryHelpers.ts: Add UpperCabinetSide import
let bgh = fs.readFileSync(path.join(outDir, 'BoxGeometryHelpers.ts'), 'utf8');
bgh = bgh.replace("import { InternalBoxItem, BoxPanelsConfig } from '../../types';",
  "import { InternalBoxItem, BoxPanelsConfig, UpperCabinetSide } from '../../types';");
fs.writeFileSync(path.join(outDir, 'BoxGeometryHelpers.ts'), bgh);

// Move buildHollowBox to BoxGeometryHelpers.ts so both Drawer and Chest can use it
let db = fs.readFileSync(path.join(outDir, 'DrawerBuilder.ts'), 'utf8');
const hollowStart = db.indexOf('private buildHollowBox(');
const hollowEnd = db.indexOf('private buildDrawerModule(');
if (hollowStart !== -1 && hollowEnd !== -1) {
  let hollowFunc = db.slice(hollowStart, hollowEnd);
  hollowFunc = hollowFunc.replace('private buildHollowBox', 'export function buildHollowBox');
  hollowFunc = hollowFunc.replace(/this\.addPanel/g, 'addPanel');
  hollowFunc = hollowFunc.replace(/InternalBoxesBuilder\./g, '');
  bgh = fs.readFileSync(path.join(outDir, 'BoxGeometryHelpers.ts'), 'utf8');
  bgh += '\n' + hollowFunc + '\n';
  fs.writeFileSync(path.join(outDir, 'BoxGeometryHelpers.ts'), bgh);

  // Remove buildHollowBox from DrawerBuilder and import it
  db = `import { buildHollowBox } from './BoxGeometryHelpers';\n` + db.slice(0, hollowStart) + db.slice(hollowEnd);
  db = db.replace(/this\.buildHollowBox/g, 'buildHollowBox');
  db = db.replace(/this\.addPanel/g, 'addPanel');
  db = db.replace(/this\.addPerforatedPanel/g, 'addPerforatedPanel');
  fs.writeFileSync(path.join(outDir, 'DrawerBuilder.ts'), db);
}

// 2. ChestBuilder.ts: use imported buildHollowBox, addPanel, addPerforatedPanel, getUpperCabinetExclusionZones
let cb = fs.readFileSync(path.join(outDir, 'ChestBuilder.ts'), 'utf8');
cb = cb.replace("import {\n  PLYWOOD_THICKNESS,",
  "import {\n  PLYWOOD_THICKNESS,\n  buildHollowBox,\n  getUpperCabinetExclusionZones,");
cb = cb.replace(/this\.buildHollowBox/g, 'buildHollowBox');
cb = cb.replace(/this\.addPanel/g, 'addPanel');
cb = cb.replace(/this\.addPerforatedPanel/g, 'addPerforatedPanel');
fs.writeFileSync(path.join(outDir, 'ChestBuilder.ts'), cb);

// 3. BoxAccessoriesBuilder.ts: import BoxLedEdge
let bab = fs.readFileSync(path.join(outDir, 'BoxAccessoriesBuilder.ts'), 'utf8');
bab = bab.replace("import { InternalBoxItem, getFoldingBracketForHeight } from '../../types';",
  "import { InternalBoxItem, getFoldingBracketForHeight, BoxLedEdge } from '../../types';");
fs.writeFileSync(path.join(outDir, 'BoxAccessoriesBuilder.ts'), bab);

// 4. BoxElectronicsBuilder.ts: imports
let beb = fs.readFileSync(path.join(outDir, 'BoxElectronicsBuilder.ts'), 'utf8');
beb = beb.replace("import {\n  FLOOR_Y,\n  getBoxThickness\n} from './BoxGeometryHelpers';",
  "import {\n  FLOOR_Y,\n  PLYWOOD_THICKNESS,\n  getBoxThickness\n} from './BoxGeometryHelpers';\nimport { ELECTRONIC_COMPONENTS_CATALOG } from '../../data/electronicComponents';\nimport { PowerStorageBuilder } from '../PowerStorage';");
fs.writeFileSync(path.join(outDir, 'BoxElectronicsBuilder.ts'), beb);

// 5. FloorAndGridBuilder.ts: accept groups in methods
let fgb = fs.readFileSync(path.join(outDir, 'FloorAndGridBuilder.ts'), 'utf8');
fgb = fgb.replace("private buildFloor(grid: InternalGridConfig, widthM: number, lengthM: number, floorY: number) {",
  "buildFloor(grid: InternalGridConfig, widthM: number, lengthM: number, floorY: number, floorGroup: THREE.Group) {");
fgb = fgb.replace(/this\.floorGroup/g, 'floorGroup');
fgb = fgb.replace("private buildGrid(grid: InternalGridConfig, widthM: number, lengthM: number, floorY: number) {",
  "buildGrid(grid: InternalGridConfig, widthM: number, lengthM: number, floorY: number, gridLinesGroup: THREE.Group) {");
fgb = fgb.replace(/this\.gridLinesGroup/g, 'gridLinesGroup');
fgb = fgb.replace("private buildFloorCentralTable(\n    grid: InternalGridConfig,\n    widthM: number,\n    lengthM: number,\n    floorY: number\n  ) {",
  "buildFloorCentralTable(\n    grid: InternalGridConfig,\n    widthM: number,\n    lengthM: number,\n    floorY: number,\n    floorGroup: THREE.Group\n  ) {");
fgb = fgb.replace(/this\.buildFloorCentralTable\(grid, widthM, lengthM, floorY\)/g,
  "this.buildFloorCentralTable(grid, widthM, lengthM, floorY, floorGroup)");
fs.writeFileSync(path.join(outDir, 'FloorAndGridBuilder.ts'), fgb);

// 6. CeilingLedBuilder.ts: export public method and accept ceilingGroup
let clb = fs.readFileSync(path.join(outDir, 'CeilingLedBuilder.ts'), 'utf8');
clb = "import { getCeilingArchOffset } from './CeilingBuilder';\n" + clb;
clb = clb.replace("private buildCeilingLed(\n    ceilingGroup: THREE.Group,", "buildCeilingLed(\n    ceilingGroup: THREE.Group,");
clb = clb.replace("private buildCeilingLed(\n    ceilingCfg: CeilingConfig,", "buildCeilingLed(\n    ceilingGroup: THREE.Group,\n    ceilingCfg: CeilingConfig,");
clb = clb.replace(/this\.ceilingGroup/g, 'ceilingGroup');
fs.writeFileSync(path.join(outDir, 'CeilingLedBuilder.ts'), clb);

// 7. CeilingBuilder.ts: accept ceilingGroup
let cb_main = fs.readFileSync(path.join(outDir, 'CeilingBuilder.ts'), 'utf8');
cb_main = cb_main.replace("private buildCeiling(\n    grid: InternalGridConfig,\n    widthM: number,\n    lengthM: number,\n    floorY: number,\n    previewOpen: boolean | InternalBoxesPreviewOptions\n  ) {",
  "buildCeiling(\n    grid: InternalGridConfig,\n    widthM: number,\n    lengthM: number,\n    floorY: number,\n    previewOpen: boolean | InternalBoxesPreviewOptions,\n    ceilingGroup: THREE.Group\n  ) {");
cb_main = cb_main.replace(/this\.buildCeilingLed\(ceilingCfg, centerZ, l, w, ceilingY\)/g,
  "this.ledBuilder.buildCeilingLed(ceilingGroup, ceilingCfg, centerZ, l, w, ceilingY)");
cb_main = cb_main.replace(/this\.buildSlattedCeiling\(/g, "this.buildSlattedCeiling(ceilingGroup, ");
cb_main = cb_main.replace("private buildSlattedCeiling(\n    ceilingCfg: CeilingConfig,",
  "private buildSlattedCeiling(\n    ceilingGroup: THREE.Group,\n    ceilingCfg: CeilingConfig,");
cb_main = cb_main.replace(/this\.buildSheetCeiling\(/g, "this.buildSheetCeiling(ceilingGroup, ");
cb_main = cb_main.replace("private buildSheetCeiling(\n    ceilingCfg: CeilingConfig,",
  "private buildSheetCeiling(\n    ceilingGroup: THREE.Group,\n    ceilingCfg: CeilingConfig,");
cb_main = cb_main.replace(/this\.ceilingGroup/g, 'ceilingGroup');
fs.writeFileSync(path.join(outDir, 'CeilingBuilder.ts'), cb_main);

// 8. SlatBedBuilder.ts: make buildSlatBedModule public
let sbb = fs.readFileSync(path.join(outDir, 'SlatBedBuilder.ts'), 'utf8');
sbb = sbb.replace("private buildSlatBedModule(", "buildSlatBedModule(");
fs.writeFileSync(path.join(outDir, 'SlatBedBuilder.ts'), sbb);

// 9. DrawerBuilder.ts: make buildDrawerModule public
db = fs.readFileSync(path.join(outDir, 'DrawerBuilder.ts'), 'utf8');
db = db.replace("private buildDrawerModule(", "buildDrawerModule(");
fs.writeFileSync(path.join(outDir, 'DrawerBuilder.ts'), db);

// 10. ChestBuilder.ts: make buildChestModule public
cb = fs.readFileSync(path.join(outDir, 'ChestBuilder.ts'), 'utf8');
cb = cb.replace("private buildChestModule(", "buildChestModule(");
fs.writeFileSync(path.join(outDir, 'ChestBuilder.ts'), cb);

// 11. BoxAccessoriesBuilder.ts: make methods public
bab = fs.readFileSync(path.join(outDir, 'BoxAccessoriesBuilder.ts'), 'utf8');
bab = bab.replace("private buildRearFoldShelf(", "buildRearFoldShelf(");
bab = bab.replace("private buildBoxLedCorner(", "buildBoxLedCorner(");
fs.writeFileSync(path.join(outDir, 'BoxAccessoriesBuilder.ts'), bab);

// 12. BoxElectronicsBuilder.ts: make buildBoxElectronics public
beb = fs.readFileSync(path.join(outDir, 'BoxElectronicsBuilder.ts'), 'utf8');
beb = beb.replace("private buildBoxElectronics(", "buildBoxElectronics(");
fs.writeFileSync(path.join(outDir, 'BoxElectronicsBuilder.ts'), beb);

console.log('Fixed all boxes issues successfully!');
