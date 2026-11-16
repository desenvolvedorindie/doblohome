import * as THREE from 'three';
import { SlatBedMattressBuilder } from '../../src/three/boxes/SlatBedMattressBuilder';
import { collectMattressCutoutZones } from '../../src/three/boxes/slat-bed/MattressCushionGeometry';
import { DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';

const grid = { ...DEFAULT_INTERNAL_GRID, colsX: 3, rowsZ: 4, widthMm: 1200, lengthMm: 1700, heightMm: 400 };
const cellWM = 1.2 / 3; // 0.4
const cellLM = 1.7 / 4; // 0.425

// Test case 1: The bed itself has upperCabinet: true, upperCabinetAlign: 'rear'
// Col 0, 1, 2:
// If bed is colStart: 0, colSpan: 1 (or colStart: 2, colSpan: 1)
for (const colStart of [0, 2]) {
  for (const direction of ['left', 'right'] as const) {
    const boxBed: any = {
      id: 'box_bed',
      name: 'Sofá-Cama Ripas',
      type: 'slat_bed',
      colStart,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      slatBedDirection: direction,
      mattressParts: 5,
      upperCabinet: true,
      upperCabinetAlign: 'rear',
      upperCabinetDepthMm: 400,
      upperCabinetBottomGapMm: 0,
    };

    const zones = collectMattressCutoutZones({
      box: boxBed,
      w: cellWM,
      l: 1.7,
      slatT: 0.015,
      direction,
      parts: 5,
      cellWM,
      cellLM,
      allBoxes: [boxBed],
      grid
    });

    const builder = new SlatBedMattressBuilder();
    const container = new THREE.Group();
    builder.buildMattress({
      container,
      w: cellWM,
      l: 1.7,
      h: 0.4,
      box: boxBed,
      slatT: 0.015,
      direction,
      isExtended: true,
      extRatio: 1,
      cellWM,
      cellLM,
      allBoxes: [boxBed],
      grid,
      isSelected: false
    });

    console.log(`\n=== Bed colStart=${colStart}, dir=${direction} ===`);
    console.log('Zones:', JSON.stringify(zones));
    container.children.forEach(c => {
      const ud = c.userData;
      if (ud.isUpholstery) {
        console.log(`  ${ud.partLabel} | cut: ${ud.hasCabinetCutout} | dimW: ${ud.dimW?.toFixed(3)} | dimL: ${ud.dimL?.toFixed(3)}`);
      }
    });
  }
}
