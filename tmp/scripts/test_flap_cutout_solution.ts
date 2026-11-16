import * as THREE from 'three';
import { SlatBedMattressBuilder } from '../../src/three/boxes/SlatBedMattressBuilder';
import { DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';

const grid = { ...DEFAULT_INTERNAL_GRID, colsX: 3, rowsZ: 4, widthMm: 1200, lengthMm: 1700, heightMm: 400 };
const cellWM = 1.2 / 3;
const cellLM = 1.7 / 4;

// Test 1: Slat bed at col 2, direction 'left' (extends to col 0).
// Cabinet on left wall at col 0, row 3 (rear).
// Expected: Flap on left wall (Almofada Aba Oposta Caixa de Roda) MUST BE CUT!
// Flap on right wall (Almofada Aba Caixa de Roda) MUST BE UNCUT!
console.log('=== TEST 1: Bed col 2, opening left. Cabinet on left wall (col 0) ===');
const bed1: any = {
  id: 'bed1',
  type: 'slat_bed',
  colStart: 2,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  slatBedDirection: 'left',
  mattressParts: 5,
};

const cab1: any = {
  id: 'cab1',
  type: 'chest',
  colStart: 0,
  colSpan: 1,
  rowStart: 3,
  rowSpan: 1,
  heightMm: 400,
  upperCabinet: true,
  upperCabinetAlign: 'left',
  upperCabinetDepthMm: 250,
  upperCabinetBottomGapMm: 0
};

// Test 2: Slat bed at col 0, direction 'right'. Cabinet on left wall at col 0 (on the bed itself).
// Expected: Flap on left wall (Almofada Aba Caixa de Roda) MUST BE CUT!
// Flap on right wall (Almofada Aba Oposta Caixa de Roda) MUST BE UNCUT!
console.log('=== TEST 2: Bed col 0, opening right. Cabinet on left wall (on bed) ===');
const bed2: any = {
  id: 'bed2',
  type: 'slat_bed',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  slatBedDirection: 'right',
  mattressParts: 5,
  upperCabinet: true,
  upperCabinetAlign: 'rear',
  upperCabinetDepthMm: 250,
  upperCabinetBottomGapMm: 0
};
