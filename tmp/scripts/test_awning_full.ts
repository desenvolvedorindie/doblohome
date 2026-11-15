import * as THREE from 'three';
import { AwningSystem } from '../../src/three/AwningSystem';
import { AwningConfig } from '../../src/types';

console.log('Testing AwningSystem in 3D (Rear Mounted on Fiat Doblò Rack)...');

// 1. Rear Awning Open Test
const rearConfig: AwningConfig = {
  enabled: true,
  type: 'rear',
  side: 'passenger',
  lengthMm: 1400,
  extensionMm: 2000,
  isOpen: true,
  fabricColor: '#c2b280'
};

const rearSystem = new AwningSystem(rearConfig, 2.06, 0.40);
rearSystem.group.updateMatrixWorld(true);

const rearBox = new THREE.Box3().setFromObject(rearSystem.group);
console.log('Rear Awning Open World Bounds:');
console.log('  X:', `[${rearBox.min.x.toFixed(4)}, ${rearBox.max.x.toFixed(4)}]`);
console.log('  Y:', `[${rearBox.min.y.toFixed(4)}, ${rearBox.max.y.toFixed(4)}]`);
console.log('  Z:', `[${rearBox.min.z.toFixed(4)}, ${rearBox.max.z.toFixed(4)}]`);

// Case is at Z = +1.545m (rear crossbar). Outer edge is at Z = +3.545m (behind the car over the tailgate).
if (rearBox.min.z >= 1.45 && rearBox.max.z >= 3.45) {
  console.log('✅ PASS: Rear Awning is mounted at the REAR (+1.55m) and extends backwards (+Z) behind the car!');
} else {
  console.error('❌ FAIL: Rear Awning bounds unexpected:', rearBox);
  process.exit(1);
}

// 2. Batwing 270° Open Test (Passenger Side)
const batwingConfig: AwningConfig = {
  enabled: true,
  type: 'batwing_270',
  side: 'passenger',
  lengthMm: 2000,
  extensionMm: 2200,
  isOpen: true,
  fabricColor: '#374151'
};

const batwingSystem = new AwningSystem(batwingConfig, 2.06, 0.40);
batwingSystem.group.updateMatrixWorld(true);

const batwingBox = new THREE.Box3().setFromObject(batwingSystem.group);
console.log('\nBatwing Awning 270° (Passenger) World Bounds:');
console.log('  X:', `[${batwingBox.min.x.toFixed(4)}, ${batwingBox.max.x.toFixed(4)}]`);
console.log('  Y:', `[${batwingBox.min.y.toFixed(4)}, ${batwingBox.max.y.toFixed(4)}]`);
console.log('  Z:', `[${batwingBox.min.z.toFixed(4)}, ${batwingBox.max.z.toFixed(4)}]`);

// Pivot is at rear corner (+1.50m). Fan covers from front (-Z, side door) around to rear (+Z, tailgate) across to driver side (+X):
if (batwingBox.min.x < -2.5 && batwingBox.max.x > 1.2 && batwingBox.max.z > 3.4) {
  console.log('✅ PASS: Batwing 270° pivot is at the REAR corner and fans out around side and tailgate!');
} else {
  console.error('❌ FAIL: Batwing bounds unexpected:', batwingBox);
  process.exit(1);
}

console.log('\nAll Awning 3D geometry tests PASSED successfully!');
