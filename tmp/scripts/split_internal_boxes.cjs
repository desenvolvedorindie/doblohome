const fs = require('fs');
const path = require('path');

const src = fs.readFileSync('src/three/InternalBoxesBuilder.ts', 'utf8');
const lines = src.split('\n');

const outDir = 'src/three/boxes';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function getSlice(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

// 1. BoxGeometryHelpers.ts
// lines 408-770 contains createBoxMaterial, getBoxThickness, getWoodMaterialName,
// getUpperCabinetExclusionZones, createPerforatedGeometry, addPerforatedPanel, addPanel
const helpersBody = getSlice(408, 770);
const helpersCode = `import * as THREE from 'three';
import { InternalBoxItem, BoxPanelsConfig } from '../../types';

export const PLYWOOD_THICKNESS = 0.015; // 15mm
export const FLOOR_Y = 0.48;
export const CEILING_Y = 1.72;

export function getBoxThickness(box?: InternalBoxItem) {
  const dMm = box?.thicknessMm || 15;
  const p = box?.panelThickness;
  return {
    default: dMm / 1000,
    top: ((p?.top ?? dMm) || 15) / 1000,
    bottom: ((p?.bottom ?? dMm) || 15) / 1000,
    left: ((p?.left ?? dMm) || 15) / 1000,
    right: ((p?.right ?? dMm) || 15) / 1000,
    front: ((p?.front ?? dMm) || 15) / 1000,
    rear: ((p?.rear ?? dMm) || 15) / 1000,
    cabinet: ((p?.cabinet ?? dMm) || 15) / 1000,
    slat: ((p?.slat ?? dMm) || 15) / 1000,
    shelf: ((p?.shelf ?? dMm) || 15) / 1000
  };
}

export function getWoodMaterialName(material?: string): string {
  switch (material) {
    case 'plywood':
      return 'Compensado Naval 15mm';
    case 'dark_wood':
      return 'Madeira Nobre 15mm';
    case 'white_mdf':
      return 'MDF Branco 15mm';
    case 'aluminum_box':
      return 'Alumínio Estrutural';
    default:
      return 'Compensado Naval 15mm';
  }
}

export function createBoxMaterial(box: InternalBoxItem, isSelected: boolean): THREE.Material {
  const color = isSelected ? 0x38bdf8 : new THREE.Color(box.color).getHex();

  switch (box.material) {
    case 'plywood':
      return new THREE.MeshStandardMaterial({
        color: isSelected ? 0x38bdf8 : 0xd4a373,
        roughness: 0.75,
        metalness: 0.05
      });
    case 'dark_wood':
      return new THREE.MeshStandardMaterial({
        color: isSelected ? 0x38bdf8 : 0x78350f,
        roughness: 0.65,
        metalness: 0.05
      });
    case 'white_mdf':
      return new THREE.MeshStandardMaterial({
        color: isSelected ? 0x38bdf8 : 0xf8fafc,
        roughness: 0.35,
        metalness: 0.1
      });
    case 'aluminum_box':
      return new THREE.MeshStandardMaterial({
        color: isSelected ? 0x38bdf8 : 0x94a3b8,
        roughness: 0.25,
        metalness: 0.8
      });
    default:
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.2
      });
  }
}

${getSlice(484, 770).replace(/InternalBoxesBuilder\./g, '').replace(/this\.addPerforatedPanel/g, 'addPerforatedPanel').replace(/this\.addPanel/g, 'addPanel')}
`;
fs.writeFileSync(path.join(outDir, 'BoxGeometryHelpers.ts'), helpersCode);

// 2. FloorAndGridBuilder.ts (lines 124-233 and 3153-3331)
const floorGridCode = `import * as THREE from 'three';
import { InternalGridConfig, InternalBoxItem } from '../../types';
import { FLOOR_Y, PLYWOOD_THICKNESS } from './BoxGeometryHelpers';

export class FloorAndGridBuilder {
${getSlice(124, 233).replace(/InternalBoxesBuilder\./g, '')}

${getSlice(3153, 3331).replace(/InternalBoxesBuilder\./g, '')}
}
`;
fs.writeFileSync(path.join(outDir, 'FloorAndGridBuilder.ts'), floorGridCode);

// 3. DrawerAndChestBuilder.ts (lines 771-1276)
const drawerChestCode = `import * as THREE from 'three';
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

export class DrawerAndChestBuilder {
${getSlice(771, 1276).replace(/InternalBoxesBuilder\./g, '')}
}
`;
fs.writeFileSync(path.join(outDir, 'DrawerAndChestBuilder.ts'), drawerChestCode);

// 4. SlatBedFrameBuilder.ts (lines 1277 to 1668)
// 5. SlatBedMattressBuilder.ts (lines 1669 to 2004)
const slatFrameSlice = getSlice(1277, 1668);
const slatMattressSlice = getSlice(1669, 2004);

const mattressCode = `import * as THREE from 'three';
import { InternalBoxItem } from '../../types';

export class SlatBedMattressBuilder {
  buildMattress(
    bedGroup: THREE.Group,
    box: InternalBoxItem,
    boxWM: number,
    boxLM: number,
    boxHM: number,
    effExtM: number,
    combThickM: number,
    isSelected: boolean,
    isLateral: boolean,
    openDir: string,
    cellWM: number,
    cellLM: number
  ) {
${slatMattressSlice}
  }
}
`;
fs.writeFileSync(path.join(outDir, 'SlatBedMattressBuilder.ts'), mattressCode);

const slatBedCode = `import * as THREE from 'three';
import { InternalBoxItem } from '../../types';
import {
  PLYWOOD_THICKNESS,
  FLOOR_Y,
  getBoxThickness,
  getWoodMaterialName,
  createBoxMaterial,
  addPanel
} from './BoxGeometryHelpers';
import { SlatBedMattressBuilder } from './SlatBedMattressBuilder';

export class SlatBedBuilder {
  private mattressBuilder = new SlatBedMattressBuilder();

${slatFrameSlice}
    if (showMattress) {
      this.mattressBuilder.buildMattress(
        bedGroup,
        box,
        boxWM,
        boxLM,
        boxHM,
        effExtM,
        combThickM,
        isSelected,
        isLateral,
        openDir,
        cellWM,
        cellLM
      );
    }
  }
}
`;
fs.writeFileSync(path.join(outDir, 'SlatBedBuilder.ts'), slatBedCode);

// 6. UpperCabinetTransverseBuilder.ts (lines 2349-2734)
// 7. UpperCabinetLongitudinalBuilder.ts (lines 2735-3152)
// 8. UpperCabinetBuilder.ts (lines 2257-2348, calls transverse/longitudinal)
const transverseSlice = getSlice(2349, 2734);
const longitudinalSlice = getSlice(2735, 3152);

const ucTransCode = `import * as THREE from 'three';
import { InternalBoxItem, getUpperCabinetClosure } from '../../types';
import {
  PLYWOOD_THICKNESS,
  CEILING_Y,
  getBoxThickness,
  getWoodMaterialName
} from './BoxGeometryHelpers';

export class UpperCabinetTransverseBuilder {
  buildTransverseCabinet(
    cabGroup: THREE.Group,
    box: InternalBoxItem,
    boxWM: number,
    boxLM: number,
    cabDepthM: number,
    cabWM: number,
    cabHM: number,
    cabY: number,
    cabMat: THREE.Material,
    isSelected: boolean,
    isOpen: boolean,
    closureType: string,
    numShelves: number,
    cabinetThickM: number,
    shelfThickM: number,
    doorThickM: number,
    isRear: boolean
  ) {
${transverseSlice}
  }
}
`;
fs.writeFileSync(path.join(outDir, 'UpperCabinetTransverseBuilder.ts'), ucTransCode);

const ucLongCode = `import * as THREE from 'three';
import { InternalBoxItem, getUpperCabinetClosure } from '../../types';
import {
  PLYWOOD_THICKNESS,
  CEILING_Y,
  getBoxThickness,
  getWoodMaterialName
} from './BoxGeometryHelpers';

export class UpperCabinetLongitudinalBuilder {
  buildLongitudinalCabinet(
    cabGroup: THREE.Group,
    box: InternalBoxItem,
    boxWM: number,
    boxLM: number,
    cabDepthM: number,
    cabWM: number,
    cabHM: number,
    cabY: number,
    cabMat: THREE.Material,
    isSelected: boolean,
    isOpen: boolean,
    closureType: string,
    numShelves: number,
    cabinetThickM: number,
    shelfThickM: number,
    doorThickM: number,
    isLeft: boolean
  ) {
${longitudinalSlice}
  }
}
`;
fs.writeFileSync(path.join(outDir, 'UpperCabinetLongitudinalBuilder.ts'), ucLongCode);

const ucMainCode = `import * as THREE from 'three';
import { InternalBoxItem, getUpperCabinetClosure } from '../../types';
import {
  PLYWOOD_THICKNESS,
  CEILING_Y,
  getBoxThickness,
  createBoxMaterial
} from './BoxGeometryHelpers';
import { UpperCabinetTransverseBuilder } from './UpperCabinetTransverseBuilder';
import { UpperCabinetLongitudinalBuilder } from './UpperCabinetLongitudinalBuilder';

export class UpperCabinetBuilder {
  private transverseBuilder = new UpperCabinetTransverseBuilder();
  private longitudinalBuilder = new UpperCabinetLongitudinalBuilder();

${getSlice(2257, 2348).replace(/InternalBoxesBuilder\./g, '')}
      if (isTransverse) {
        this.transverseBuilder.buildTransverseCabinet(
          cabGroup,
          box,
          boxWM,
          boxLM,
          cabDepthM,
          cabWM,
          cabHM,
          cabY,
          cabMat,
          isSelected,
          isOpen,
          closureType,
          numShelves,
          cabinetThickM,
          shelfThickM,
          doorThickM,
          isRear
        );
      } else {
        this.longitudinalBuilder.buildLongitudinalCabinet(
          cabGroup,
          box,
          boxWM,
          boxLM,
          cabDepthM,
          cabWM,
          cabHM,
          cabY,
          cabMat,
          isSelected,
          isOpen,
          closureType,
          numShelves,
          cabinetThickM,
          shelfThickM,
          doorThickM,
          isLeft
        );
      }
    });
  }
}
`;
fs.writeFileSync(path.join(outDir, 'UpperCabinetBuilder.ts'), ucMainCode);

// 9. BoxAccessoriesBuilder.ts (lines 2005-2256 and 3332-3548)
const accCode = `import * as THREE from 'three';
import { InternalBoxItem, getFoldingBracketForHeight } from '../../types';
import {
  PLYWOOD_THICKNESS,
  FLOOR_Y,
  getBoxThickness,
  getWoodMaterialName
} from './BoxGeometryHelpers';

export class BoxAccessoriesBuilder {
${getSlice(2005, 2256).replace(/InternalBoxesBuilder\./g, '')}

${getSlice(3332, 3548).replace(/InternalBoxesBuilder\./g, '')}
}
`;
fs.writeFileSync(path.join(outDir, 'BoxAccessoriesBuilder.ts'), accCode);

// 10. BoxElectronicsBuilder.ts (lines 3549 to 3786)
const electCode = `import * as THREE from 'three';
import { InternalBoxItem } from '../../types';
import {
  FLOOR_Y,
  getBoxThickness
} from './BoxGeometryHelpers';

export class BoxElectronicsBuilder {
${getSlice(3549, 3786).replace(/InternalBoxesBuilder\./g, '')}
}
`;
fs.writeFileSync(path.join(outDir, 'BoxElectronicsBuilder.ts'), electCode);

// 11. CeilingLedBuilder.ts (lines 4245 to 4425)
const ceilingLedCode = `import * as THREE from 'three';
import { CeilingConfig, CeilingLedConfig } from '../../types';

export class CeilingLedBuilder {
${getSlice(4245, 4425).replace(/InternalBoxesBuilder\./g, '')}
}
`;
fs.writeFileSync(path.join(outDir, 'CeilingLedBuilder.ts'), ceilingLedCode);

// 12. CeilingBuilder.ts (lines 3787 to 4244)
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
  private ledBuilder = new CeilingLedBuilder();

${getSlice(3787, 3834).replace(/InternalBoxesBuilder\./g, '').replace(/this\.buildCeilingLed/g, 'this.ledBuilder.buildCeilingLed')}

${getSlice(3855, 4244).replace(/InternalBoxesBuilder\./g, '').replace(/InternalBoxesBuilder\.getCeilingArchOffset/g, 'getCeilingArchOffset')}
}
`;
fs.writeFileSync(path.join(outDir, 'CeilingBuilder.ts'), ceilingCode);

// 13. Rewrite InternalBoxesBuilder.ts
const newBuilder = `import * as THREE from 'three';
import {
  InternalGridConfig,
  InternalBoxItem,
  InternalBoxesPreviewOptions,
  InternalBoxType,
  DrawerMode
} from '../types';
import {
  PLYWOOD_THICKNESS,
  FLOOR_Y,
  CEILING_Y,
  getBoxThickness,
  getWoodMaterialName,
  getUpperCabinetExclusionZones,
  createBoxMaterial,
  createPerforatedGeometry,
  addPerforatedPanel,
  addPanel
} from './boxes/BoxGeometryHelpers';
import { FloorAndGridBuilder } from './boxes/FloorAndGridBuilder';
import { DrawerAndChestBuilder } from './boxes/DrawerAndChestBuilder';
import { SlatBedBuilder } from './boxes/SlatBedBuilder';
import { UpperCabinetBuilder } from './boxes/UpperCabinetBuilder';
import { BoxAccessoriesBuilder } from './boxes/BoxAccessoriesBuilder';
import { BoxElectronicsBuilder } from './boxes/BoxElectronicsBuilder';
import { CeilingBuilder, getCeilingArchOffset } from './boxes/CeilingBuilder';

export class InternalBoxesBuilder {
  group: THREE.Group;
  boxesGroup: THREE.Group;
  floorGroup: THREE.Group;
  ceilingGroup: THREE.Group;
  gridLinesGroup: THREE.Group;
  floorMesh?: THREE.Mesh;

  // Constantes de compatibilidade estática
  static readonly FLOOR_Y = FLOOR_Y;
  static readonly CEILING_Y = CEILING_Y;
  static readonly PLYWOOD_THICKNESS = PLYWOOD_THICKNESS;
  static readonly getBoxThickness = getBoxThickness;
  static readonly getWoodMaterialName = getWoodMaterialName;
  static readonly getUpperCabinetExclusionZones = getUpperCabinetExclusionZones;
  static readonly createPerforatedGeometry = createPerforatedGeometry;
  static readonly getCeilingArchOffset = getCeilingArchOffset;

  private floorAndGridBuilder = new FloorAndGridBuilder();
  private drawerAndChestBuilder = new DrawerAndChestBuilder();
  private slatBedBuilder = new SlatBedBuilder();
  private upperCabinetBuilder = new UpperCabinetBuilder();
  private accessoriesBuilder = new BoxAccessoriesBuilder();
  private electronicsBuilder = new BoxElectronicsBuilder();
  private ceilingBuilder = new CeilingBuilder();

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'InternalBoxesSystem';

    this.floorGroup = new THREE.Group();
    this.floorGroup.name = 'CamperFloor';
    this.group.add(this.floorGroup);

    this.ceilingGroup = new THREE.Group();
    this.ceilingGroup.name = 'CamperCeiling';
    this.group.add(this.ceilingGroup);

    this.gridLinesGroup = new THREE.Group();
    this.gridLinesGroup.name = 'GridLines';
    this.group.add(this.gridLinesGroup);

    this.boxesGroup = new THREE.Group();
    this.boxesGroup.name = 'BoxesGroup';
    this.group.add(this.boxesGroup);
  }

  update(
    grid: InternalGridConfig,
    boxes: InternalBoxItem[],
    selectedBoxId: string | null = null,
    previewOpen: boolean | InternalBoxesPreviewOptions = false,
    isolatedBoxId: string | null = null
  ) {
    this.clearGroup(this.floorGroup);
    this.clearGroup(this.ceilingGroup);
    this.clearGroup(this.gridLinesGroup);
    this.clearGroup(this.boxesGroup);

    this.group.position.set(
      grid.offsetX || 0,
      grid.offsetY || 0,
      grid.offsetZ || 0
    );

    const lengthM = grid.lengthMm / 1000;
    const widthM = grid.widthMm / 1000;
    const floorY = InternalBoxesBuilder.FLOOR_Y;

    // 1. Piso Campervan & Mesa Central
    this.floorAndGridBuilder.buildFloor(grid, widthM, lengthM, floorY, this.floorGroup);

    // 2. Grid subdividido no piso
    this.floorAndGridBuilder.buildGrid(grid, widthM, lengthM, floorY, this.gridLinesGroup);

    // 3. Caixas 3D
    this.buildBoxes(grid, boxes, floorY, selectedBoxId, previewOpen, isolatedBoxId);

    // 4. Teto / forro do campervan
    this.ceilingBuilder.buildCeiling(grid, widthM, lengthM, floorY, previewOpen, this.ceilingGroup);
  }

  private clearGroup(g: THREE.Group) {
    while (g.children.length > 0) {
      const child = g.children[0];
      g.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: any) => m.dispose());
        } else {
          (child as any).material.dispose();
        }
      }
    }
  }

${getSlice(234, 406).replace(/this\.buildDrawerModule/g, 'this.drawerAndChestBuilder.buildDrawerModule')
  .replace(/this\.buildSlatBedModule/g, 'this.slatBedBuilder.buildSlatBedModule')
  .replace(/this\.buildChestModule/g, 'this.drawerAndChestBuilder.buildChestModule')
  .replace(/this\.buildRearFoldShelf/g, 'this.accessoriesBuilder.buildRearFoldShelf')
  .replace(/this\.buildUpperCabinet/g, 'this.upperCabinetBuilder.buildUpperCabinet')
  .replace(/this\.buildBoxLedCorner/g, 'this.accessoriesBuilder.buildBoxLedCorner')
  .replace(/this\.buildBoxElectronics/g, 'this.electronicsBuilder.buildBoxElectronics')
  .replace(/this\.createBoxMaterial/g, 'createBoxMaterial')}
}
`;
fs.writeFileSync('src/three/InternalBoxesBuilder.ts', newBuilder);

console.log('InternalBoxesBuilder split complete!');
