import * as THREE from 'three';
import { BarsLineupCollector } from '../../src/three/scene/BarsLineupCollector';
import { BarsLineupBuilder } from '../../src/three/scene/BarsLineupBuilder';

console.log('--- TESTE: UPHOLSTERY 3D LINEUP & FILTERING ---');

// Mock SolarSystem with 2 metal bars
const solarGroup = new THREE.Group();
const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.5), new THREE.MeshBasicMaterial());
bar1.userData = { isBar: true, barLabel: 'Barra Longitudinal', profileSpec: 'Metalon 40x40', barLength: 1.5 };
solarGroup.add(bar1);

const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.2), new THREE.MeshBasicMaterial());
bar2.userData = { isBar: true, barLabel: 'Barra Transversal', profileSpec: 'Metalon 40x40', barLength: 1.2 };
solarGroup.add(bar2);

const mockSolarSystem = {
  group: solarGroup,
  cargoBoxConfig: { enabled: false },
  cargoBoxSystem: null,
  waterTank: { enabled: false }
};

// Mock InternalBoxesBuilder with 1 wood piece and 2 mattress cushions
const boxesGroup = new THREE.Group();
const wood1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.015, 0.4), new THREE.MeshBasicMaterial());
wood1.userData = {
  isWoodPart: true,
  partLabel: 'Tampo Compensado',
  woodMaterial: 'Compensado Naval',
  thicknessMm: 15,
  dimW: 0.8,
  dimH: 0.015,
  dimL: 0.4
};
boxesGroup.add(wood1);

const cushion1 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.58), new THREE.MeshBasicMaterial());
cushion1.userData = {
  isWoodPart: false,
  isUpholstery: true,
  partLabel: 'Almofada Cama #1 - Traseira',
  woodMaterial: 'Espuma D33 (Colchão)',
  thicknessMm: 80,
  dimW: 1.22,
  dimH: 0.08,
  dimL: 0.58,
  hasCabinetCutout: false
};
boxesGroup.add(cushion1);

const cushion2 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.58), new THREE.MeshBasicMaterial());
cushion2.userData = {
  isWoodPart: false,
  isUpholstery: true,
  partLabel: 'Almofada Cama #2 - Central (Corte Especial)',
  woodMaterial: 'Espuma D33 (Colchão)',
  thicknessMm: 80,
  dimW: 1.22,
  dimH: 0.08,
  dimL: 0.58,
  hasCabinetCutout: true
};
boxesGroup.add(cushion2);

const mockInternalBoxesBuilder = { group: boxesGroup };

// 1. Test collection
const collected = BarsLineupCollector.collect(mockSolarSystem, mockInternalBoxesBuilder);
console.log(`Metal items: ${collected.metalItems.length}`);
console.log(`Wood items: ${collected.woodItems.length}`);
console.log(`Upholstery items: ${collected.upholsteryItems.length}`);
console.log(`Upholstery rows: ${collected.sortedUpholsteryRows.length}`);

if (collected.upholsteryItems.length !== 2) {
  throw new Error(`Expected 2 upholstery items, got ${collected.upholsteryItems.length}`);
}
if (collected.woodItems.length !== 1) {
  throw new Error(`Expected 1 wood item, got ${collected.woodItems.length}`);
}
if (collected.metalItems.length !== 2) {
  throw new Error(`Expected 2 metal items, got ${collected.metalItems.length}`);
}

// 2. Test BarsLineupBuilder with filter = 'upholstery'
const lineupGroup = new THREE.Group();
const countUpholstery = BarsLineupBuilder.build(lineupGroup, mockSolarSystem, mockInternalBoxesBuilder, 'upholstery');
console.log(`3D Lineup with filter 'upholstery': ${countUpholstery} pieces rendered`);

if (countUpholstery !== 2) {
  throw new Error(`Expected 2 cushions rendered in 3D lineup, got ${countUpholstery}`);
}

const renderedCushions = lineupGroup.children.filter((c: any) => c.userData?.isUpholstery);
console.log(`Lineup 3D meshes with isUpholstery: ${renderedCushions.length}`);
if (renderedCushions.length !== 2) {
  throw new Error(`Expected 2 meshes with isUpholstery in 3D lineup, got ${renderedCushions.length}`);
}

// Verify that NO wood or metal pieces are rendered when filter is 'upholstery'
const renderedWood = lineupGroup.children.filter((c: any) => c.userData?.isWoodPart);
const renderedMetal = lineupGroup.children.filter((c: any) => c.userData?.isBar);
if (renderedWood.length > 0 || renderedMetal.length > 0) {
  throw new Error(`Found unexpected wood/metal pieces in upholstery lineup! Wood: ${renderedWood.length}, Metal: ${renderedMetal.length}`);
}
console.log('Verified: ZERO wood and ZERO metal pieces in 3D upholstery lineup!');

// 3. Test BarsLineupBuilder with filter = 'wood'
const countWood = BarsLineupBuilder.build(lineupGroup, mockSolarSystem, mockInternalBoxesBuilder, 'wood');
console.log(`3D Lineup with filter 'wood': ${countWood} pieces rendered`);
if (countWood !== 1) {
  throw new Error(`Expected 1 wood piece rendered in 3D lineup, got ${countWood}`);
}
const renderedCushionsInWood = lineupGroup.children.filter((c: any) => c.userData?.isUpholstery);
if (renderedCushionsInWood.length > 0) {
  throw new Error('Found unexpected upholstery in wood lineup!');
}
console.log('Verified: ZERO cushions in 3D wood lineup!');

console.log('--- ALL 3D UPHOLSTERY LINEUP TESTS PASSED! ---');
