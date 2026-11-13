import * as THREE from 'three';

console.log('Testing Awning Geometry Generation...');

// Test 270 Batwing Fan Geometry
const pivot = new THREE.Vector3(-0.70, 2.06, -0.70);
const radius = 2.20;
const numArms = 4;
// Angle from forward (+Z) around to rear (-Z)
// Local angles: 0 (along lateral +Z), 45, 90, 135 deg to rear
const armAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];

const armTips = armAngles.map(angle => {
  // +Z is forward, -X is lateral out (or +X depending on side)
  const z = Math.cos(angle) * radius;
  const x = -Math.sin(angle) * radius;
  return new THREE.Vector3(x, 0, z);
});

console.log('Arm tips count:', armTips.length);
console.log('Arm 0 tip:', armTips[0]);
console.log('Arm 3 tip (rear):', armTips[3]);

