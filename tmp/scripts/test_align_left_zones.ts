import { collectMattressCutoutZones } from '../../src/three/boxes/slat-bed/MattressCushionGeometry';
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

const zones = collectMattressCutoutZones({
  box: bedBox,
  w: cellWM,
  l: 1.7,
  slatT: 0.015,
  direction: 'left',
  parts: 5,
  cellWM,
  cellLM,
  allBoxes: [bedBox, cabBox],
  grid
});

console.log('Zones (align left):', JSON.stringify(zones));
