import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).HTMLCanvasElement = dom.window.HTMLCanvasElement;

const dummyCtx = new Proxy({}, {
  get: () => () => ({ data: new Array(4), width: 0 })
});
(dom.window.HTMLCanvasElement.prototype as any).getContext = () => dummyCtx;

import * as THREE from 'three';
import { ELECTRONIC_COMPONENTS_CATALOG, InternalBoxItem, InternalGridConfig } from '../../src/types/index';
import { PowerStorageBuilder } from '../../src/three/PowerStorage';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { SolarSystem } from '../../src/three/SolarSystem';

console.log('--- 1. Testing ELECTRONIC_COMPONENTS_CATALOG ---');
const catalogIds = Object.keys(ELECTRONIC_COMPONENTS_CATALOG) as (keyof typeof ELECTRONIC_COMPONENTS_CATALOG)[];
console.log('Catalog IDs:', catalogIds);
if (catalogIds.length !== 4) {
  throw new Error(`Expected 4 components, got ${catalogIds.length}`);
}

const batMeta = ELECTRONIC_COMPONENTS_CATALOG.battery;
if (!batMeta.allowedFaces.includes('bottom') || batMeta.allowedFaces.length !== 1) {
  throw new Error(`Battery must only allow 'bottom' face, got: ${JSON.stringify(batMeta.allowedFaces)}`);
}
console.log('✓ Battery strictly locked to base:', batMeta.allowedFaces);

const mpptMeta = ELECTRONIC_COMPONENTS_CATALOG.mppt;
const b2bMeta = ELECTRONIC_COMPONENTS_CATALOG.b2b;
const usinaMeta = ELECTRONIC_COMPONENTS_CATALOG.usina;

if (!mpptMeta.allowedFaces.includes('rear_wall') || !mpptMeta.allowedFaces.includes('left_wall')) {
  throw new Error('MPPT must allow wall mount');
}
if (!b2bMeta.allowedFaces.includes('rear_wall') || !b2bMeta.allowedFaces.includes('front_wall')) {
  throw new Error('B2B must allow wall mount');
}
if (!usinaMeta.allowedFaces.includes('right_wall') || !usinaMeta.allowedFaces.includes('bottom')) {
  throw new Error('Usina must allow wall and bottom mount');
}
console.log('✓ MPPT, B2B, Usina allow wall mounting & bottom');

console.log('\n--- 2. Testing PowerStorageBuilder Factory Methods ---');
const batMesh = PowerStorageBuilder.createBatteryMesh();
if (!batMesh || batMesh.children.length === 0) throw new Error('Failed to create battery mesh');
console.log(`✓ Battery mesh created: ${batMesh.children.length} sub-objects, name=${batMesh.name}`);

const mpptMesh = PowerStorageBuilder.createMPPTMesh({ includeCables: false });
if (!mpptMesh || mpptMesh.children.length === 0) throw new Error('Failed to create MPPT mesh');
console.log(`✓ MPPT mesh created: ${mpptMesh.children.length} sub-objects, name=${mpptMesh.name}`);

const b2bMesh = PowerStorageBuilder.createB2BMesh({ includeCables: false });
if (!b2bMesh || b2bMesh.children.length === 0) throw new Error('Failed to create B2B mesh');
console.log(`✓ B2B mesh created: ${b2bMesh.children.length} sub-objects, name=${b2bMesh.name}`);

const usinaMesh = PowerStorageBuilder.createUsinaMesh({ includeCables: false });
if (!usinaMesh || usinaMesh.children.length === 0) throw new Error('Failed to create Usina mesh');
console.log(`✓ Usina mesh created: ${usinaMesh.children.length} sub-objects, name=${usinaMesh.name}`);

console.log('\n--- 3. Testing InternalBoxesBuilder with Installed Electronics ---');
const builder = new InternalBoxesBuilder();

const testGrid: InternalGridConfig = {
  lengthMm: 1700,
  widthMm: 1200,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4
};

const testBoxes: InternalBoxItem[] = [
  {
    id: 'box_power_test',
    name: 'Módulo Elétrico',
    type: 'chest',
    colStart: 0,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 2,
    heightMm: 400,
    color: '#2563eb',
    material: 'plywood',
    electronics: [
      {
        id: 'battery',
        mountFace: 'bottom',
        position: 'rear_center',
        rotationDeg: 0
      },
      {
        id: 'mppt',
        mountFace: 'left_wall',
        position: 'top_left',
        rotationDeg: 0
      },
      {
        id: 'b2b',
        mountFace: 'rear_wall',
        position: 'top_right',
        rotationDeg: 0
      },
      {
        id: 'usina',
        mountFace: 'front_wall',
        position: 'top_center',
        rotationDeg: 0
      }
    ]
  }
];

builder.update(testGrid, testBoxes, 'box_power_test', false, null);

const boxContainer = builder.boxesGroup.getObjectByName('BoxContainer_box_power_test');
if (!boxContainer) throw new Error('BoxContainer_box_power_test not found');

const installedBat = boxContainer.getObjectByName('Installed_battery_box_power_test');
const installedMPPT = boxContainer.getObjectByName('Installed_mppt_box_power_test');
const installedB2B = boxContainer.getObjectByName('Installed_b2b_box_power_test');
const installedUsina = boxContainer.getObjectByName('Installed_usina_box_power_test');

if (!installedBat) throw new Error('Installed_battery not found in boxContainer');
if (!installedMPPT) throw new Error('Installed_mppt not found in boxContainer');
if (!installedB2B) throw new Error('Installed_b2b not found in boxContainer');
if (!installedUsina) throw new Error('Installed_usina not found in boxContainer');

console.log('✓ All 4 installed components found inside boxContainer:');
console.log('  - Battery position:', installedBat.position, 'rotation:', installedBat.rotation.y);
console.log('  - MPPT position:', installedMPPT.position, 'rotation:', installedMPPT.rotation.y);
console.log('  - B2B position:', installedB2B.position, 'rotation:', installedB2B.rotation.y);
console.log('  - Usina position:', installedUsina.position, 'rotation:', installedUsina.rotation.y);

// Check that screws exist on wall-mounted items
const mpptMeshes = installedMPPT.children.filter((c: any) => c.isMesh);
console.log(`✓ MPPT wrapper has ${mpptMeshes.length} meshes (including 4 wall mounting screws)`);
if (mpptMeshes.length < 4) throw new Error('Expected mounting screws on MPPT wrapper');

console.log('\n--- 4. Testing SolarSystem Duplicate Prevention ---');
const dummyScene = new THREE.Scene();
const solarSystem = new SolarSystem(dummyScene);

// Initially without assigned electronics
solarSystem.setAssignedElectronics(new Set());
const countWithNoneAssigned = 
  solarSystem.batteryGroup.children.length +
  solarSystem.mpptGroup.children.length +
  solarSystem.b2bGroup.children.length +
  solarSystem.usinaGroup.children.length;
console.log(`Initial floating components when none assigned: ${countWithNoneAssigned} objects`);
if (countWithNoneAssigned === 0) throw new Error('Expected initial floating items when none assigned');

// Now assign all 4 to internal boxes
solarSystem.setAssignedElectronics(new Set(['battery', 'mppt', 'b2b', 'usina']));
const countWithAllAssigned = 
  solarSystem.batteryGroup.children.length +
  solarSystem.mpptGroup.children.length +
  solarSystem.b2bGroup.children.length +
  solarSystem.usinaGroup.children.length;
console.log(`Floating components when all 4 are assigned to internal boxes: ${countWithAllAssigned}`);
if (countWithAllAssigned !== 0) throw new Error(`Expected 0 floating items when assigned, got ${countWithAllAssigned}`);
console.log('✓ Floating duplicate components successfully suppressed in SolarSystem!');

console.log('\nALL TESTS PASSED SUCCESSFULLY! 🎉');
