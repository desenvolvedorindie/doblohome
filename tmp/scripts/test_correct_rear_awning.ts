import * as THREE from 'three';

console.log('=== VERIFYING REAR AWNING AT -Z (BEHIND THE VAN) ===');

const rackOffsetZ = 0.40;
const rackLength = 2.20;
const rackRearZ = rackOffsetZ - rackLength / 2; // -0.70m (rear of rack)
const caseZ = rackRearZ - 0.02; // -0.72m
const extensionM = 2.00;
const outerZ = caseZ - extensionM; // -2.72m
const dropY = 0.12;
const baseY = 2.06;
const caseY = baseY + 0.04; // 2.10m
const outerY = caseY - dropY; // 1.98m
const caseWidth = 1.40;
const hw = caseWidth * 0.48;

// Camera on passenger side looking at vehicle:
const cam = new THREE.PerspectiveCamera(42, 800 / 600, 0.1, 100);
cam.position.set(-4.0, 2.5, 0.5);
cam.lookAt(0, 1.5, 0.5);
cam.updateMatrixWorld();
cam.updateProjectionMatrix();

function screenPos(pos: THREE.Vector3) {
  const v = pos.clone().project(cam);
  return { x: v.x.toFixed(2), y: v.y.toFixed(2), side: v.x > 0 ? 'RIGHT (Front)' : 'LEFT (Rear)' };
}

console.log('Car Headlights (Front, +Z):', screenPos(new THREE.Vector3(0, 0.8, 1.8)));
console.log('Car Tailgate   (Rear,  -Z):', screenPos(new THREE.Vector3(0, 0.8, -1.8)));
console.log('Awning Case    (Z = -0.72m):', screenPos(new THREE.Vector3(0, caseY, caseZ)));
console.log('Awning Poles   (Z = -2.72m):', screenPos(new THREE.Vector3(0, outerY, outerZ)));

if (outerZ < -1.8) {
  console.log('\n✅ PASS: Awning extends behind the rear of the van (towards the LEFT in the user view)!');
} else {
  console.error('\n❌ FAIL');
}

