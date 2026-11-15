import { InternalBoxItem, InternalGridConfig } from '../../src/types';
import { getUpperCabinetExclusionZones } from '../../src/three/boxes/BoxGeometryHelpers';

const grid: InternalGridConfig = {
  lengthMm: 1700,
  widthMm: 1200,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4
};

const cellWM = (grid.widthMm / grid.colsX) / 1000; // 0.400
const cellLM = (grid.lengthMm / grid.rowsZ) / 1000; // 0.425

// Box 1: Kitchen at col 0, row 0..4 (height 400mm, with upper cabinet at rear)
const box1: InternalBoxItem = {
  id: 'box1',
  name: 'Cozinha',
  type: 'chest',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  color: '#2563eb',
  material: 'plywood',
  upperCabinet: true,
  upperCabinetBottomGapMm: 0,
  upperCabinetDepthMm: 250,
  upperCabinetAlign: 'rear'
};

// Box 2: Bed at col 2, row 0..4 (height 400mm)
const box2: InternalBoxItem = {
  id: 'box2',
  name: 'Cama',
  type: 'slat_bed',
  colStart: 2,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  color: '#d97706',
  material: 'plywood',
  slatBedDirection: 'left',
  slatExtensionPercent: 100,
  mattressParts: 3
};

const box1WM = box1.colSpan * cellWM; // 0.4
const box1LM = box1.rowSpan * cellLM; // 1.7
const zones1 = getUpperCabinetExclusionZones(box1, box1WM, box1LM);
console.log('Box1 local zones:', zones1);

const dx = (box1.colStart + box1.colSpan / 2 - (box2.colStart + box2.colSpan / 2)) * cellWM;
const dz = (box1.rowStart + box1.rowSpan / 2 - (box2.rowStart + box2.rowSpan / 2)) * cellLM;
console.log('Offset dx =', dx, 'dz =', dz);

const zones1InBox2Coords = zones1.map(z => ({
  minX: z.minX + dx,
  maxX: z.maxX + dx,
  minZ: z.minZ + dz,
  maxZ: z.maxZ + dz
}));
console.log('Box1 zones in Box2 local coords:', zones1InBox2Coords);

// In Box2, when bed opens to left (3 parts):
// cushion 3 covers col 0:
// Box2 width = 0.4. When closed, X is [-0.2, 0.2].
// When extended 3 parts to left:
// Part 0 (base): X is [-0.2, 0.2]
// Part 1: X is [-0.6, -0.2]
// Part 2: X is [-1.0, -0.6]
// Notice dx = (0.5 - 2.5) * 0.4 = -0.8.
// Box1 local X is [-0.2, 0.2].
// Transformed into Box2 coords: [-0.2 - 0.8, 0.2 - 0.8] = [-1.0, -0.6]!
// EXACT MATCH with Part 2!
console.log('Math check: Part 2 is at [-1.0, -0.6], transformed zone is at:', zones1InBox2Coords[0].minX.toFixed(2), zones1InBox2Coords[0].maxX.toFixed(2));
