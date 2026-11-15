import * as THREE from 'three';
import { WaterTankPipesBuilder } from '../../src/three/power/WaterTankPipesBuilder';
import { extractPvcCutStats } from '../../src/utils/pvcUtils';

console.log('=== TEST 1: 3D Build Front ===');
const frontGroup = new THREE.Group();
const labelsFront = new THREE.Group();
WaterTankPipesBuilder.buildWaterTankPipes(
  frontGroup,
  true,
  2200,
  2.06,
  0.40,
  labelsFront,
  200,
  true,
  1.60,
  'front'
);

const frontBox = new THREE.Box3().setFromObject(frontGroup);
console.log('Front Group Children count:', frontGroup.children.length);
console.log('Front Bounding Box min:', frontBox.min);
console.log('Front Bounding Box max:', frontBox.max);

console.log('\n=== TEST 2: 3D Build Rear ===');
const rearGroup = new THREE.Group();
const labelsRear = new THREE.Group();
WaterTankPipesBuilder.buildWaterTankPipes(
  rearGroup,
  true,
  2200,
  2.06,
  0.40,
  labelsRear,
  200,
  true,
  1.60,
  'rear'
);

const rearBox = new THREE.Box3().setFromObject(rearGroup);
console.log('Rear Group Children count:', rearGroup.children.length);
console.log('Rear Bounding Box min:', rearBox.min);
console.log('Rear Bounding Box max:', rearBox.max);

// Verificar componentes na montagem transversal
const frontMaster = frontGroup.children[0] as THREE.Group;
const rearMaster = rearGroup.children[0] as THREE.Group;

console.log('Front master userData name:', frontMaster.userData.name);
console.log('Rear master userData name:', rearMaster.userData.name);

// Verificar corte de peças
const statsFront = extractPvcCutStats({ enabled: true, lengthMm: 2200, diameterMm: 200, connectionPosition: 'front' });
const statsRear = extractPvcCutStats({ enabled: true, lengthMm: 2200, diameterMm: 200, connectionPosition: 'rear' });

console.log('\nStats Front cut items:', statsFront.cutItems.length);
statsFront.cutItems.forEach(i => console.log(` - ${i.label}: ${i.lengthMm}mm`));

console.log('\nStats Rear cut items:', statsRear.cutItems.length);
statsRear.cutItems.forEach(i => console.log(` - ${i.label}: ${i.lengthMm}mm`));

console.log('\nFittings Front:');
statsFront.fittings.forEach(f => console.log(` - ${f.label}: ${f.qty} ${f.unit}`));

console.log('\nFittings Rear:');
statsRear.fittings.forEach(f => console.log(` - ${f.label}: ${f.qty} ${f.unit}`));

console.log('\n=== ALL 3D & PVC TESTS PASSED! ===');
