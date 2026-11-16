import * as THREE from 'three';
import { SlatBedMattressBuilder } from '../../src/three/boxes/SlatBedMattressBuilder';
import { collectMattressCutoutZones } from '../../src/three/boxes/slat-bed/MattressCushionGeometry';
import { DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';

const grid = { ...DEFAULT_INTERNAL_GRID, colsX: 3, rowsZ: 4, widthMm: 1200, lengthMm: 1700, heightMm: 400 };
const cellWM = 1.2 / 3;
const cellLM = 1.7 / 4;

function testScenario(title: string, boxes: any[]) {
  const bedBox = boxes.find(b => b.type === 'slat_bed');
  const zones = collectMattressCutoutZones({
    box: bedBox,
    w: bedBox.colSpan * cellWM,
    l: bedBox.rowSpan * cellLM,
    slatT: 0.015,
    direction: bedBox.slatBedDirection || 'left',
    parts: 5,
    cellWM,
    cellLM,
    allBoxes: boxes,
    grid
  });

  const builder = new SlatBedMattressBuilder();
  const container = new THREE.Group();
  builder.buildMattress({
    container,
    w: bedBox.colSpan * cellWM,
    l: bedBox.rowSpan * cellLM,
    h: 0.4,
    box: bedBox,
    slatT: 0.015,
    direction: bedBox.slatBedDirection || 'left',
    isExtended: true,
    extRatio: 1,
    cellWM,
    cellLM,
    allBoxes: boxes,
    grid,
    isSelected: false
  });

  console.log(`\n--- ${title} ---`);
  console.log('Cutout zones:', JSON.stringify(zones));
  container.children.forEach(c => {
    const ud = c.userData;
    if (ud.isUpholstery) {
      console.log(`  ${ud.partLabel} | cut: ${ud.hasCabinetCutout} | dimW: ${ud.dimW?.toFixed(3)} | dimL: ${ud.dimL?.toFixed(3)} | pos: (${c.position.x.toFixed(3)}, ${c.position.z.toFixed(3)})`);
    }
  });
}

// Scenario 1: Bed at col 2, dir left. Upper cabinet on bed itself (col 2), align 'rear'.
testScenario('Bed col 2, dir left, cabinet on bed (rear)', [{
  id: 'bed',
  type: 'slat_bed',
  colStart: 2,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  slatBedDirection: 'left',
  mattressParts: 5,
  upperCabinet: true,
  upperCabinetAlign: 'rear',
  upperCabinetDepthMm: 425,
  upperCabinetBottomGapMm: 0
}]);

// Scenario 2: Bed at col 2, dir left. Upper cabinet on OTHER box at col 0 (left wall!), row 0 (or row 3).
testScenario('Bed col 2, dir left, cabinet on other box at col 0, row 0', [
  {
    id: 'bed',
    type: 'slat_bed',
    colStart: 2,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 4,
    slatBedDirection: 'left',
    mattressParts: 5,
  },
  {
    id: 'cabinet_box',
    type: 'chest',
    colStart: 0,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 1,
    heightMm: 400,
    upperCabinet: true,
    upperCabinetAlign: 'rear', // or front
    upperCabinetDepthMm: 425,
    upperCabinetBottomGapMm: 0
  }
]);

// Scenario 3: Bed at col 0, dir right. Upper cabinet on bed itself, align 'rear'.
testScenario('Bed col 0, dir right, cabinet on bed (rear)', [{
  id: 'bed',
  type: 'slat_bed',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  slatBedDirection: 'right',
  mattressParts: 5,
  upperCabinet: true,
  upperCabinetAlign: 'rear',
  upperCabinetDepthMm: 425,
  upperCabinetBottomGapMm: 0
}]);

// Scenario 4: Bed at col 0, dir right. Upper cabinet on OTHER box at col 2, row 0.
testScenario('Bed col 0, dir right, cabinet on other box at col 2, row 0', [
  {
    id: 'bed',
    type: 'slat_bed',
    colStart: 0,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 4,
    slatBedDirection: 'right',
    mattressParts: 5,
  },
  {
    id: 'cabinet_box',
    type: 'chest',
    colStart: 2,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 1,
    heightMm: 400,
    upperCabinet: true,
    upperCabinetAlign: 'rear',
    upperCabinetDepthMm: 425,
    upperCabinetBottomGapMm: 0
  }
]);
