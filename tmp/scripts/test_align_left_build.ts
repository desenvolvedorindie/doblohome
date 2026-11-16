import * as THREE from 'three';
import { SlatBedMattressBuilder } from '../../src/three/boxes/SlatBedMattressBuilder';
import { DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';

const grid = { ...DEFAULT_INTERNAL_GRID, colsX: 3, rowsZ: 4, widthMm: 1200, lengthMm: 1700, heightMm: 400 };
const cellWM = 0.4;
const cellLM = 0.425;

const bedBox: any = {
  id: 'bed',
  type: 'slat_bed',
  colStart: 2,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  slatBedDirection: 'left',
  mattressParts: 5,
};

const cabBox: any = {
  id: 'cabinet_box',
  type: 'chest',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 1,
  heightMm: 400,
  upperCabinet: true,
  upperCabinetAlign: 'left',
  upperCabinetDepthMm: 250,
  upperCabinetBottomGapMm: 0
};

const builder = new SlatBedMattressBuilder();
const container = new THREE.Group();
builder.buildMattress({
  container,
  w: cellWM,
  l: 1.7,
  h: 0.4,
  box: bedBox,
  slatT: 0.015,
  direction: 'left',
  isExtended: true,
  extRatio: 1,
  cellWM,
  cellLM,
  allBoxes: [bedBox, cabBox],
  grid,
  isSelected: false
});

console.log('--- Mattress Children ---');
container.children.forEach(c => {
  const ud = c.userData;
  if (ud.isUpholstery) {
    console.log(`  ${ud.partLabel} | cut: ${ud.hasCabinetCutout} | dimW: ${ud.dimW?.toFixed(3)} | dimL: ${ud.dimL?.toFixed(3)} | minX: ${(c.position.x - ud.dimW/2).toFixed(3)} maxX: ${(c.position.x + ud.dimW/2).toFixed(3)}`);
  }
});
