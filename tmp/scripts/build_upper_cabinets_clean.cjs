const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const origFull = execSync('git show HEAD:src/three/InternalBoxesBuilder.ts', { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const origLines = origFull.split('\n');

const startIdx = origLines.findIndex(l => l.includes('private buildUpperCabinet('));
const endIdx = origLines.findIndex((l, i) => i > startIdx && l.includes('private buildFloorCentralTable('));
const cabLines = origLines.slice(startIdx, endIdx);

const transLines = cabLines.slice(92, 477);
const longLines = cabLines.slice(478, 884);
const preambleLines = cabLines.slice(0, 91);

const outDir = 'src/three/boxes';

// 1. UpperCabinetContext.ts
const ctxCode = `import * as THREE from 'three';
import { InternalBoxItem } from '../../types';

export interface UpperCabinetContext {
  container: THREE.Group;
  upperGroup: THREE.Group;
  box: InternalBoxItem;
  side: 'rear' | 'front' | 'left' | 'right';
  boxWM: number;
  boxLM: number;
  cabinetH: number;
  cabinetCenterY: number;
  t: number;
  tMm: number;
  woodMat: string;
  cabinetUserData: any;
  cabinetMat: THREE.Material;
  edgeMat: THREE.LineBasicMaterial;
  offsetM: number;
  depthOffsetM: number;
  positionMode: string;
  behindOffsetM: number;
  transverseMode: string;
  besideSide: string;
  besideOffsetM: number;
  hasDoors: boolean;
  isDrawer: boolean;
  numShelves: number;
  isOpen: boolean;
  isSelected: boolean;
  innerH: number;
  interiorBottomY: number;
  backY: number;
  hasBasePanel: boolean;
}
`;
fs.writeFileSync(path.join(outDir, 'UpperCabinetContext.ts'), ctxCode);

// 2. UpperCabinetTransverseBuilder.ts
let transBody = transLines.join('\n');
transBody = transBody.replace(/this\.addPanel/g, 'addPanel');
transBody = transBody.replace(/InternalBoxesBuilder\./g, '');

const transCode = `import * as THREE from 'three';
import { addPanel } from './BoxGeometryHelpers';
import { UpperCabinetContext } from './UpperCabinetContext';

export class UpperCabinetTransverseBuilder {
  buildTransverseCabinet(ctx: UpperCabinetContext) {
    const {
      container,
      upperGroup,
      box,
      side,
      boxWM,
      boxLM,
      cabinetH,
      cabinetCenterY,
      t,
      tMm,
      woodMat,
      cabinetUserData,
      cabinetMat,
      edgeMat,
      offsetM,
      depthOffsetM,
      positionMode,
      behindOffsetM,
      transverseMode,
      besideSide,
      besideOffsetM,
      hasDoors,
      isDrawer,
      numShelves,
      isOpen,
      isSelected,
      innerH,
      interiorBottomY,
      backY,
      hasBasePanel
    } = ctx;

${transBody}
  }
}
`;
fs.writeFileSync(path.join(outDir, 'UpperCabinetTransverseBuilder.ts'), transCode);

// 3. UpperCabinetLongitudinalBuilder.ts
let longBody = longLines.join('\n');
longBody = longBody.replace(/this\.addPanel/g, 'addPanel');
longBody = longBody.replace(/InternalBoxesBuilder\./g, '');

const longCode = `import * as THREE from 'three';
import { addPanel } from './BoxGeometryHelpers';
import { UpperCabinetContext } from './UpperCabinetContext';

export class UpperCabinetLongitudinalBuilder {
  buildLongitudinalCabinet(ctx: UpperCabinetContext) {
    const {
      container,
      upperGroup,
      box,
      side,
      boxWM,
      boxLM,
      cabinetH,
      cabinetCenterY,
      t,
      tMm,
      woodMat,
      cabinetUserData,
      cabinetMat,
      edgeMat,
      offsetM,
      depthOffsetM,
      positionMode,
      behindOffsetM,
      transverseMode,
      besideSide,
      besideOffsetM,
      hasDoors,
      isDrawer,
      numShelves,
      isOpen,
      isSelected,
      innerH,
      interiorBottomY,
      backY,
      hasBasePanel
    } = ctx;

${longBody}
  }
}
`;
fs.writeFileSync(path.join(outDir, 'UpperCabinetLongitudinalBuilder.ts'), longCode);

// 4. UpperCabinetBuilder.ts
let preBody = preambleLines.slice(8).join('\n'); // skip private buildUpperCabinet( ... )
preBody = preBody.replace(/InternalBoxesBuilder\./g, '');

const mainCode = `import * as THREE from 'three';
import { InternalBoxItem, UpperCabinetSide, getUpperCabinetClosure } from '../../types';
import { FLOOR_Y, CEILING_Y, getBoxThickness, getWoodMaterialName } from './BoxGeometryHelpers';
import { UpperCabinetContext } from './UpperCabinetContext';
import { UpperCabinetTransverseBuilder } from './UpperCabinetTransverseBuilder';
import { UpperCabinetLongitudinalBuilder } from './UpperCabinetLongitudinalBuilder';

export class UpperCabinetBuilder {
  private transverseBuilder = new UpperCabinetTransverseBuilder();
  private longitudinalBuilder = new UpperCabinetLongitudinalBuilder();

  buildUpperCabinet(
    container: THREE.Group,
    boxWM: number,
    boxLM: number,
    boxHM: number,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean
  ) {
${preBody}

    activeSides.forEach((side) => {
      const upperGroup = new THREE.Group();
      upperGroup.name = \`UpperCabinet_\${box.id}_\${side}\`;

      const ctx: UpperCabinetContext = {
        container,
        upperGroup,
        box,
        side,
        boxWM,
        boxLM,
        cabinetH,
        cabinetCenterY,
        t,
        tMm,
        woodMat,
        cabinetUserData,
        cabinetMat,
        edgeMat,
        offsetM,
        depthOffsetM,
        positionMode,
        behindOffsetM,
        transverseMode,
        besideSide,
        besideOffsetM,
        hasDoors,
        isDrawer,
        numShelves,
        isOpen,
        isSelected,
        innerH,
        interiorBottomY,
        backY,
        hasBasePanel
      };

      if (side === 'rear' || side === 'front') {
        this.transverseBuilder.buildTransverseCabinet(ctx);
      } else {
        this.longitudinalBuilder.buildLongitudinalCabinet(ctx);
      }

      container.add(upperGroup);
    });
  }
}
`;
fs.writeFileSync(path.join(outDir, 'UpperCabinetBuilder.ts'), mainCode);

console.log('Upper cabinets clean architecture complete!');
