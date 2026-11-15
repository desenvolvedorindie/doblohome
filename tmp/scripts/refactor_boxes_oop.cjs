const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = 'src/three/boxes';

// Read original InternalBoxesBuilder from git
const orig = execSync('git show HEAD:src/three/InternalBoxesBuilder.ts', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const lines = orig.split('\n');

function getGitSlice(startLine, endLine) {
  return lines.slice(startLine - 1, endLine).join('\n');
}

// 1. BoxElectronicsBuilder.ts
// lines 3549 to 3786
let electSlice = getGitSlice(3549, 3786);
electSlice = electSlice.replace(/InternalBoxesBuilder\./g, '');
const electCode = `import * as THREE from 'three';
import { InternalBoxItem } from '../../types';
import { FLOOR_Y, PLYWOOD_THICKNESS, getBoxThickness } from './BoxGeometryHelpers';
import { ELECTRONIC_COMPONENTS_CATALOG } from '../../types/electronics';
import { PowerStorageBuilder } from '../PowerStorage';

export class BoxElectronicsBuilder {
  ${electSlice.replace('private buildBoxElectronics', 'buildBoxElectronics')}
}
`;
fs.writeFileSync(path.join(outDir, 'BoxElectronicsBuilder.ts'), electCode);

// 2. FloorAndGridBuilder.ts
// lines 124 to 233 and 3153 to 3331
let floorSlice = getGitSlice(124, 233).replace(/InternalBoxesBuilder\./g, '');
let tableSlice = getGitSlice(3153, 3331).replace(/InternalBoxesBuilder\./g, '');

const floorCode = `import * as THREE from 'three';
import { InternalGridConfig, InternalBoxItem, CentralTableConfig } from '../../types';
import { FLOOR_Y, PLYWOOD_THICKNESS } from './BoxGeometryHelpers';

export class FloorAndGridBuilder {
  floorMesh?: THREE.Mesh;
  floorGroup: THREE.Group;
  gridLinesGroup: THREE.Group;

  constructor(floorGroup: THREE.Group, gridLinesGroup: THREE.Group) {
    this.floorGroup = floorGroup;
    this.gridLinesGroup = gridLinesGroup;
  }

  ${floorSlice.replace('private buildFloor', 'buildFloor')}

  ${floorSlice ? '' : ''}
  ${getGitSlice(196, 233).replace(/InternalBoxesBuilder\./g, '').replace('private buildGrid', 'buildGrid')}

  ${tableSlice.replace('private buildFloorCentralTable', 'buildFloorCentralTable')}
}
`;
fs.writeFileSync(path.join(outDir, 'FloorAndGridBuilder.ts'), floorCode);

// 3. CeilingLedBuilder.ts
// lines 4245 to 4425
let ledSlice = getGitSlice(4245, 4425).replace(/InternalBoxesBuilder\./g, '');

const ledCode = `import * as THREE from 'three';
import { CeilingConfig, CeilingLedConfig } from '../../types';
import { getCeilingArchOffset } from './CeilingBuilder';

export class CeilingLedBuilder {
  ceilingGroup: THREE.Group;

  constructor(ceilingGroup: THREE.Group) {
    this.ceilingGroup = ceilingGroup;
  }

  ${ledSlice.replace('private buildCeilingLed', 'buildCeilingLed')}
}
`;
fs.writeFileSync(path.join(outDir, 'CeilingLedBuilder.ts'), ledCode);

// 4. CeilingBuilder.ts
// lines 3787 to 4244
let ceilingSlice = getGitSlice(3787, 4244).replace(/InternalBoxesBuilder\./g, '');
ceilingSlice = ceilingSlice.replace(/this\.buildCeilingLed/g, 'this.ledBuilder.buildCeilingLed');

const ceilingCode = `import * as THREE from 'three';
import { CeilingConfig, CeilingType, CeilingSheetMaterial, CeilingSlattedWood, InternalGridConfig, InternalBoxesPreviewOptions } from '../../types';
import { DEFAULT_CEILING_CONFIG } from '../../data/internalBoxesPresets';
import { CEILING_Y } from './BoxGeometryHelpers';
import { CeilingLedBuilder } from './CeilingLedBuilder';

export function getCeilingArchOffset(x: number, w: number, archM: number): { yDrop: number; rotZ: number } {
  if (archM <= 0.001 || w <= 0.001) return { yDrop: 0, rotZ: 0 };
  const halfW = w / 2;
  const clampedX = Math.max(-halfW, Math.min(halfW, x));
  const normX = clampedX / halfW;
  const yDrop = (1 - normX * normX) * archM;
  const slope = -2 * normX * (archM / halfW);
  const rotZ = Math.atan(slope);
  return { yDrop, rotZ };
}

export class CeilingBuilder {
  ceilingGroup: THREE.Group;
  ledBuilder: CeilingLedBuilder;

  constructor(ceilingGroup: THREE.Group) {
    this.ceilingGroup = ceilingGroup;
    this.ledBuilder = new CeilingLedBuilder(ceilingGroup);
  }

  ${ceilingSlice.replace('private buildCeiling', 'buildCeiling')}
}
`;
fs.writeFileSync(path.join(outDir, 'CeilingBuilder.ts'), ceilingCode);

// 5. DrawerBuilder.ts & ChestBuilder.ts
let hollowSlice = getGitSlice(771, 860).replace(/InternalBoxesBuilder\./g, '').replace('private buildHollowBox', 'export function buildHollowBox');
let drawerSlice = getGitSlice(861, 1106).replace(/InternalBoxesBuilder\./g, '');
let chestSlice = getGitSlice(1107, 1276).replace(/InternalBoxesBuilder\./g, '');

const drawerCode = `import * as THREE from 'three';
import { InternalBoxItem } from '../../types';
import {
  PLYWOOD_THICKNESS,
  FLOOR_Y,
  getBoxThickness,
  getWoodMaterialName,
  getUpperCabinetExclusionZones,
  createPerforatedGeometry,
  addPerforatedPanel,
  addPanel,
  buildHollowBox
} from './BoxGeometryHelpers';

export class DrawerBuilder {
  ${drawerSlice.replace('private buildDrawerModule', 'buildDrawerModule').replace(/this\.buildHollowBox/g, 'buildHollowBox')}
}
`;
fs.writeFileSync(path.join(outDir, 'DrawerBuilder.ts'), drawerCode);

const chestCode = `import * as THREE from 'three';
import { InternalBoxItem, ChestHingeDirection } from '../../types';
import {
  PLYWOOD_THICKNESS,
  FLOOR_Y,
  getBoxThickness,
  getWoodMaterialName,
  getUpperCabinetExclusionZones,
  createPerforatedGeometry,
  addPerforatedPanel,
  addPanel,
  buildHollowBox
} from './BoxGeometryHelpers';

export class ChestBuilder {
  ${chestSlice.replace('private buildChestModule', 'buildChestModule').replace(/this\.buildHollowBox/g, 'buildHollowBox').replace(/this\.addPerforatedPanel/g, 'addPerforatedPanel').replace(/this\.addPanel/g, 'addPanel')}
}
`;
fs.writeFileSync(path.join(outDir, 'ChestBuilder.ts'), chestCode);

// 6. SlatBedBuilder.ts & SlatBedMattressBuilder.ts
// lines 1277 to 1668 (frame) and 1669 to 2004 (mattress)
let slatFrame = getGitSlice(1277, 1668).replace(/InternalBoxesBuilder\./g, '');
let slatMattress = getGitSlice(1669, 2004).replace(/InternalBoxesBuilder\./g, '');

const mattressCode = `import * as THREE from 'three';
import { InternalBoxItem, SlatBedDirection } from '../../types';

export interface SlatMattressParams {
  container: THREE.Group;
  w: number;
  l: number;
  h: number;
  box: InternalBoxItem;
  slatT: number;
  direction: SlatBedDirection;
  isExtended: boolean;
  extRatio: number;
  cellWM?: number;
  cellLM?: number;
}

export class SlatBedMattressBuilder {
  buildMattress(params: SlatMattressParams) {
    const { container, w, l, h, box, slatT, direction, isExtended, extRatio, cellWM, cellLM } = params;
    const parts = box.mattressParts ?? 2;
    const isLateral = direction === 'left' || direction === 'right';
    const ySlat = h / 2 + slatT / 2;

${slatMattress}
  }
}
`;
fs.writeFileSync(path.join(outDir, 'SlatBedMattressBuilder.ts'), mattressCode);

const slatCode = `import * as THREE from 'three';
import { InternalBoxItem, SlatBedDirection } from '../../types';
import {
  PLYWOOD_THICKNESS,
  FLOOR_Y,
  getBoxThickness,
  getWoodMaterialName,
  createBoxMaterial,
  addPanel,
  buildHollowBox
} from './BoxGeometryHelpers';
import { SlatBedMattressBuilder } from './SlatBedMattressBuilder';

export class SlatBedBuilder {
  private mattressBuilder = new SlatBedMattressBuilder();

  ${slatFrame.replace('private buildSlatBedModule', 'buildSlatBedModule').replace(/this\.buildHollowBox/g, 'buildHollowBox').replace(/this\.addPanel/g, 'addPanel')}

    if (showMattress) {
      this.mattressBuilder.buildMattress({
        container,
        w,
        l,
        h,
        box,
        slatT,
        direction,
        isExtended,
        extRatio,
        cellWM,
        cellLM
      });
    }
  }
}
`;
fs.writeFileSync(path.join(outDir, 'SlatBedBuilder.ts'), slatCode);

// 7. Update InternalBoxesBuilder.ts to pass groups to constructors
let ibb = fs.readFileSync('src/three/InternalBoxesBuilder.ts', 'utf8');
ibb = ibb.replace('private floorAndGridBuilder = new FloorAndGridBuilder();',
  'private floorAndGridBuilder!: FloorAndGridBuilder;');
ibb = ibb.replace('private ceilingBuilder = new CeilingBuilder();',
  'private ceilingBuilder!: CeilingBuilder;');

ibb = ibb.replace("this.boxesGroup = new THREE.Group();\n    this.boxesGroup.name = 'BoxesGroup';\n    this.group.add(this.boxesGroup);",
  `this.boxesGroup = new THREE.Group();
    this.boxesGroup.name = 'BoxesGroup';
    this.group.add(this.boxesGroup);

    this.floorAndGridBuilder = new FloorAndGridBuilder(this.floorGroup, this.gridLinesGroup);
    this.ceilingBuilder = new CeilingBuilder(this.ceilingGroup);`);

ibb = ibb.replace("this.floorAndGridBuilder.buildFloor(grid, widthM, lengthM, floorY, this.floorGroup);",
  "this.floorAndGridBuilder.buildFloor(grid, widthM, lengthM, floorY);");
ibb = ibb.replace("this.floorAndGridBuilder.buildGrid(grid, widthM, lengthM, floorY, this.gridLinesGroup);",
  "this.floorAndGridBuilder.buildGrid(grid, widthM, lengthM, floorY);");
ibb = ibb.replace("this.ceilingBuilder.buildCeiling(grid, widthM, lengthM, floorY, previewOpen, this.ceilingGroup);",
  "this.ceilingBuilder.buildCeiling(grid, widthM, lengthM, floorY, previewOpen);");

fs.writeFileSync('src/three/InternalBoxesBuilder.ts', ibb);

console.log('Refactor boxes OOP complete!');
