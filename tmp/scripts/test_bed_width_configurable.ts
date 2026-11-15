import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { INTERNAL_BOXES_PRESETS } from '../../src/data/internalBoxesPresets';

console.log('--- TEST BED CONFIGURATION (2 COLUMNS vs 3 COLUMNS) ---');

const camperPreset = INTERNAL_BOXES_PRESETS.find(p => p.id === 'slat_bed_camper');
const fullPreset = INTERNAL_BOXES_PRESETS.find(p => p.id === 'slat_bed_full_width');

if (!camperPreset) throw new Error('slat_bed_camper not found');
if (!fullPreset) throw new Error('slat_bed_full_width not found');

console.log('1. Checking Presets Data:');
const tallCab = camperPreset.boxes.find(b => b.id === 'box_kitchen_tall_cabinet');
console.log('   Tall cabinet height:', tallCab?.heightMm, 'colStart:', tallCab?.colStart, 'colSpan:', tallCab?.colSpan);
if (tallCab?.heightMm !== 750) throw new Error('Tall cabinet height is not 750mm');
if (tallCab?.colStart !== 0 || tallCab?.colSpan !== 1) throw new Error('Tall cabinet is not in col 0');

const camperBed = camperPreset.boxes.find(b => b.type === 'slat_bed');
console.log('   Camper bed parts:', camperBed?.mattressParts, 'colStart:', camperBed?.colStart, 'colSpan:', camperBed?.colSpan);
if (camperBed?.mattressParts !== 2) throw new Error('Camper bed does not default to 2 parts');

const fullBed = fullPreset.boxes.find(b => b.type === 'slat_bed');
console.log('   Full bed parts:', fullBed?.mattressParts, 'colStart:', fullBed?.colStart, 'colSpan:', fullBed?.colSpan);
if (fullBed?.mattressParts !== 3) throw new Error('Full bed does not have 3 parts');

console.log('\n2. Testing 3D Builder Geometry (Open Bed Preview):');
const scene = new THREE.Scene();
const builder = new InternalBoxesBuilder();
scene.add(builder.group);

// Test 2-column extension (openBed: true)
console.log('   Testing 2-column extension (with tall cabinet, openBed: true):');
builder.update(
  camperPreset.grid,
  camperPreset.boxes,
  null,
  {
    openCabinets: false,
    openBed: true,
    showMattress: true
  }
);

let camperBedGroup: THREE.Object3D | null = null;
let tallCabinetGroup: THREE.Object3D | null = null;
const open2Pads: THREE.Object3D[] = [];

scene.traverse((obj) => {
  if (obj.userData?.boxId === camperBed?.id) {
    camperBedGroup = obj;
  }
  if (obj.userData?.boxId === tallCab?.id) {
    tallCabinetGroup = obj;
  }
  if (obj.userData?.isUpholstery) {
    open2Pads.push(obj);
  }
});

if (!camperBedGroup) throw new Error('Camper bed group not created');
if (!tallCabinetGroup) throw new Error('Tall cabinet group not created');

console.log('   Camper open mattress pad count:', open2Pads.length);
if (open2Pads.length !== 2) throw new Error(`Expected 2 pads, got ${open2Pads.length}`);
open2Pads.forEach((pad, idx) => {
  console.log(`     Pad ${idx + 1}: label="${pad.userData.partLabel}" pos.x=${pad.position.x.toFixed(3)}`);
});

// Test 3-column extension (openBed: true)
console.log('\n   Testing 3-column extension (Full Width, openBed: true):');
const scene2 = new THREE.Scene();
const builder2 = new InternalBoxesBuilder();
scene2.add(builder2.group);

builder2.update(
  fullPreset.grid,
  fullPreset.boxes,
  null,
  {
    openCabinets: false,
    openBed: true,
    showMattress: true
  }
);

const open3Pads: THREE.Object3D[] = [];
scene2.traverse((obj) => {
  if (obj.userData?.isUpholstery) {
    open3Pads.push(obj);
  }
});

console.log('   Full width open mattress pad count:', open3Pads.length);
if (open3Pads.length !== 3) throw new Error(`Expected 3 pads, got ${open3Pads.length}`);
open3Pads.forEach((pad, idx) => {
  console.log(`     Pad ${idx + 1}: label="${pad.userData.partLabel}" pos.x=${pad.position.x.toFixed(3)}`);
});

// Test Closed Sofa Mode (openBed: false)
console.log('\n3. Testing Sofa Mode (openBed: false):');
const scene3 = new THREE.Scene();
const builder3 = new InternalBoxesBuilder();
scene3.add(builder3.group);

builder3.update(
  camperPreset.grid,
  camperPreset.boxes,
  null,
  {
    openCabinets: false,
    openBed: false,
    showMattress: true
  }
);

const sofaPads: THREE.Object3D[] = [];
scene3.traverse((obj) => {
  if (obj.userData?.isUpholstery) {
    sofaPads.push(obj);
  }
});
console.log('   Sofa stacked pads count:', sofaPads.length);
if (sofaPads.length !== 2) throw new Error(`Expected 2 stacked pads in sofa mode, got ${sofaPads.length}`);
sofaPads.forEach((pad, idx) => {
  console.log(`     Stacked pad ${idx + 1}: label="${pad.userData.partLabel}" pos.y=${pad.position.y.toFixed(3)}`);
});

console.log('\n✅ ALL BED CONFIGURATION AND GEOMETRY TESTS PASSED SUCCESSFULLY!');
