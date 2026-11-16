import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { BarsLineupBuilder } from '../../src/three/scene/BarsLineupBuilder';
import { DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';

const builder = new InternalBoxesBuilder();
const grid = { ...DEFAULT_INTERNAL_GRID, colsX: 3, rowsZ: 4, widthMm: 1200, lengthMm: 1700, heightMm: 400 };

// Create bed on cols 0..2 (direction right) and a lateral upper cabinet that intersects corner of flap
const boxBed = {
  id: 'box_slat_bed_main',
  name: 'Sofá-Cama Ripas',
  type: 'slat_bed' as const,
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  color: '#d97706',
  material: 'plywood' as const,
  slatBedDirection: 'right' as const,
  slatExtensionPercent: 100,
  mattressParts: 5 as const,
};

const boxCabinet = {
  id: 'box_cabinet_corner',
  name: 'Armário Aéreo Quina',
  type: 'shelf' as const,
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 1,
  heightMm: 400,
  color: '#10b981',
  material: 'plywood' as const,
  upperCabinet: true,
  upperCabinetAlign: 'front' as const,
  upperCabinetSides: ['right'] as any,
  upperCabinetBottomGapMm: 0,
  upperCabinetDepthMm: 300
};

builder.update(grid, [boxBed, boxCabinet], null, { openBed: false });

const dummySolar: any = { cargoBoxConfig: { enabled: false }, group: new THREE.Group() };
const lineupGroup = new THREE.Group();
const count = BarsLineupBuilder.build(lineupGroup, dummySolar, builder, 'upholstery');

console.log(`Lineup built successfully, piece count: ${count}`);

lineupGroup.traverse((obj: any) => {
  if (obj.isMesh && obj.userData?.isUpholstery) {
    const geo = obj.geometry;
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    console.log(`Mesh: ${obj.userData.name}`);
    console.log(`  Geo type: ${geo.type}, bb: min=${JSON.stringify(bb.min)}, max=${JSON.stringify(bb.max)}`);
  }
});
