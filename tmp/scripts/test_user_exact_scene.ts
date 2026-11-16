import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { BarsLineupCollector } from '../../src/three/scene/BarsLineupCollector';
import { BarsLineupBuilder } from '../../src/three/scene/BarsLineupBuilder';
import { DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';

const grid = { ...DEFAULT_INTERNAL_GRID, colsX: 3, rowsZ: 4, widthMm: 1200, lengthMm: 1700, heightMm: 400 };

// Bed at col 2, direction 'left' (spans cols 2, 1, 0 when open)
const bed = {
  id: 'box_bed',
  name: 'Cama c/ Ripas',
  type: 'slat_bed' as const,
  colStart: 2,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  color: '#d97706',
  material: 'plywood' as const,
  slatBedDirection: 'left' as const,
  slatExtensionPercent: 100,
  mattressParts: 5 as const,
  mattressFoam: 'D33_SOFT' as const,
  mattressThicknessMm: 120,
};

// Tall cabinet in rear left corner (col 0, row 3, align 'left')
const cab = {
  id: 'box_cabinet',
  name: 'Armário Aéreo Alto',
  type: 'chest' as const,
  colStart: 0,
  colSpan: 1,
  rowStart: 3,
  rowSpan: 1,
  heightMm: 400,
  upperCabinet: true,
  upperCabinetAlign: 'left' as const,
  upperCabinetDepthMm: 250,
  upperCabinetBottomGapMm: 0,
};

const builder = new InternalBoxesBuilder();
builder.update(grid, [bed, cab], null, { openBed: false });

const dummySolar: any = { cargoBoxConfig: { enabled: false }, group: new THREE.Group() };
const collected = BarsLineupCollector.collect(dummySolar, builder);

console.log('=== COLLECTED UPHOLSTERY ITEMS ===');
collected.upholsteryItems.forEach(it => {
  console.log(`- ${it.name} | Spec: ${it.profileSpec} | Cutout: ${it.hasCabinetCutout}`);
});

const lineupGroup = new THREE.Group();
BarsLineupBuilder.build(lineupGroup, dummySolar, builder, 'upholstery');

console.log('\n=== LINEUP MESHES ===');
lineupGroup.traverse((obj: any) => {
  if (obj.isMesh && obj.userData?.isUpholstery) {
    console.log(`- ${obj.userData.name} | Cutout: ${obj.userData.hasCabinetCutout}`);
  }
});
