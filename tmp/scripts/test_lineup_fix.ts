import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { BarsLineupCollector } from '../../src/three/scene/BarsLineupCollector';
import { DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';

const builder = new InternalBoxesBuilder();
const grid = { ...DEFAULT_INTERNAL_GRID, colsX: 3, rowsZ: 4, widthMm: 1200, lengthMm: 1700, heightMm: 400 };

const boxBed = {
  id: 'box_slat_bed_main',
  name: 'Sofá-Cama Ripas',
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
  upperCabinet: true,
  upperCabinetAlign: 'front' as const,
  upperCabinetDepthMm: 250,
  upperCabinetBottomGapMm: 0,
};

// Test open bed first to inspect sourceMesh.geometry
builder.update(grid, [boxBed], null, { openBed: true });

const dummySolar = { cargoBoxConfig: { enabled: false }, group: new THREE.Group() };
const collected = BarsLineupCollector.collect(dummySolar, builder);

console.log('--- UPHOLSTERY ITEMS (OPEN BED) ---');
collected.upholsteryItems.forEach(it => {
  const geo = it.sourceMesh?.geometry;
  geo?.computeBoundingBox();
  const bb = geo?.boundingBox;
  console.log(`${it.name} | thick: ${it.thicknessMm}mm | hasCutout: ${it.hasCabinetCutout}`);
  if (bb) {
    const size = new THREE.Vector3();
    bb.getSize(size);
    const center = new THREE.Vector3();
    bb.getCenter(center);
    console.log(`  Geo size: X=${size.x.toFixed(3)}, Y=${size.y.toFixed(3)}, Z=${size.z.toFixed(3)} | center: ${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)}`);
  }
});
