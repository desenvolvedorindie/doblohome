import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';

const builder = new InternalBoxesBuilder();
const grid = { ...DEFAULT_INTERNAL_GRID, colsX: 3, rowsZ: 4, widthMm: 1200, lengthMm: 1700, heightMm: 400 };

const boxes: any[] = [
  {
    id: 'box1',
    name: 'Cama',
    type: 'slat_bed',
    colStart: 2,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 4,
    upperCabinet: true,
    upperCabinetAlign: 'rear',
    upperCabinetClosure: 'sliding_doors'
  },
  {
    id: 'box2',
    name: 'Armário Alto Esq',
    type: 'chest',
    colStart: 0,
    colSpan: 1,
    rowStart: 3,
    rowSpan: 1,
    upperCabinet: true,
    upperCabinetAlign: 'left',
    upperCabinetClosure: 'sliding_doors'
  }
];

// Closed
builder.update(grid, boxes, null, { openCabinets: false, openBed: false });
console.log('--- CLOSED: Children of SlidingDoor2 ---');
builder.group.traverse((obj: any) => {
  if (obj.name?.includes('SlidingDoor2')) {
    obj.children.forEach((c: any) => {
      console.log(`[CLOSED] ${obj.name} child ${c.name || c.userData?.partLabel} | pos: (${c.position.x.toFixed(3)}, ${c.position.y.toFixed(3)}, ${c.position.z.toFixed(3)})`);
    });
  }
});

// Open
builder.update(grid, boxes, null, { openCabinets: true, openBed: false });
console.log('\n--- OPEN: Children of SlidingDoor2 ---');
builder.group.traverse((obj: any) => {
  if (obj.name?.includes('SlidingDoor2')) {
    obj.children.forEach((c: any) => {
      console.log(`[OPEN] ${obj.name} child ${c.name || c.userData?.partLabel} | pos: (${c.position.x.toFixed(3)}, ${c.position.y.toFixed(3)}, ${c.position.z.toFixed(3)})`);
    });
  }
});
