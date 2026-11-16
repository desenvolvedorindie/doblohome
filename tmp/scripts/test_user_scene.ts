import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { InternalBoxItem, InternalGridConfig } from '../../src/types';

const builder = new InternalBoxesBuilder();

const grid: InternalGridConfig = {
  widthMm: 1200,
  lengthMm: 1700,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4,
  ceiling: {
    enabled: true,
    heightOffsetMm: 0,
    thicknessMm: 9,
    slatThicknessMm: 12,
    type: 'slatted',
    visibleIn3D: true,
  }
};

const boxes: InternalBoxItem[] = [
  {
    id: 'box_1_chest',
    name: 'Sistema... Baú c/ Tampo',
    type: 'chest',
    colStart: 0,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 1,
    heightMm: 400,
    upperCabinet: true,
    upperCabinetDepthMm: 250,
    upperCabinetAlign: 'rear', // or 'left'? let's test both
    upperCabinetClosure: 'sliding_doors',
  },
  {
    id: 'box_2_tray',
    name: 'Gaveteiro... Bandeja Corrediça',
    type: 'slide_tray',
    colStart: 2,
    colSpan: 1,
    rowStart: 2,
    rowSpan: 2,
    heightMm: 400,
  },
  {
    id: 'box_3_bed',
    name: 'Gavetão... Cama c/ Ripas',
    type: 'slat_bed',
    colStart: 1,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 4,
    heightMm: 400,
    upperCabinet: true,
    upperCabinetDepthMm: 250,
    upperCabinetAlign: 'front',
    upperCabinetClosure: 'sliding_doors',
  }
];

builder.update(grid, boxes, null, { openCabinets: true, openBed: false, showMattress: true }, null);

console.log('--- Inspecting all meshes in builder.boxesGroup ---');
builder.boxesGroup.traverse((obj) => {
  if (obj.name && (obj.name.includes('Sliding') || obj.name.includes('Door'))) {
    console.log(`Object: ${obj.name}, pos: (${obj.position.x.toFixed(3)}, ${obj.position.y.toFixed(3)}, ${obj.position.z.toFixed(3)})`);
    for (const child of obj.children) {
      if ((child as any).isMesh) {
        console.log(`   Mesh child: pos=(${child.position.x.toFixed(3)}, ${child.position.y.toFixed(3)}, ${child.position.z.toFixed(3)})`);
      }
    }
  }
});
