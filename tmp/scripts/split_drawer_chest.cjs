const fs = require('fs');
const path = require('path');

const outDir = 'src/three/boxes';
const dc = fs.readFileSync(path.join(outDir, 'DrawerAndChestBuilder.ts'), 'utf8');

const chestStart = dc.indexOf('private buildChestModule(');

const drawerCode = dc.slice(0, chestStart) + '\n}\n';
fs.writeFileSync(path.join(outDir, 'DrawerBuilder.ts'), drawerCode.replace('export class DrawerAndChestBuilder', 'export class DrawerBuilder'));

const chestCode = `import * as THREE from 'three';
import { InternalBoxItem, ChestHingeDirection } from '../../types';
import {
  PLYWOOD_THICKNESS,
  FLOOR_Y,
  getBoxThickness,
  getWoodMaterialName,
  createPerforatedGeometry,
  addPerforatedPanel,
  addPanel
} from './BoxGeometryHelpers';

export class ChestBuilder {
  ${dc.slice(chestStart)}
`;
fs.writeFileSync(path.join(outDir, 'ChestBuilder.ts'), chestCode);

// Delete DrawerAndChestBuilder.ts
fs.unlinkSync(path.join(outDir, 'DrawerAndChestBuilder.ts'));

// Update InternalBoxesBuilder.ts to use DrawerBuilder and ChestBuilder
let ibb = fs.readFileSync('src/three/InternalBoxesBuilder.ts', 'utf8');
ibb = ibb.replace("import { DrawerAndChestBuilder } from './boxes/DrawerAndChestBuilder';",
  "import { DrawerBuilder } from './boxes/DrawerBuilder';\nimport { ChestBuilder } from './boxes/ChestBuilder';");
ibb = ibb.replace("private drawerAndChestBuilder = new DrawerAndChestBuilder();",
  "private drawerBuilder = new DrawerBuilder();\n  private chestBuilder = new ChestBuilder();");
ibb = ibb.replace("this.drawerAndChestBuilder.buildDrawerModule", "this.drawerBuilder.buildDrawerModule");
ibb = ibb.replace("this.drawerAndChestBuilder.buildChestModule", "this.chestBuilder.buildChestModule");

fs.writeFileSync('src/three/InternalBoxesBuilder.ts', ibb);

console.log('Split DrawerBuilder and ChestBuilder!');
