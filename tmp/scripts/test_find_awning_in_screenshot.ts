import * as THREE from 'three';

console.log('--- CAMERA PERSPECTIVE ANALYSIS ---');
const camFromPassenger = new THREE.PerspectiveCamera(42, 800 / 600, 0.1, 100);
// Camera on passenger side (-X):
camFromPassenger.position.set(-4.0, 2.5, 0.5);
camFromPassenger.lookAt(0, 1.5, 0.5);
camFromPassenger.updateMatrixWorld();
camFromPassenger.updateProjectionMatrix();

const pNegZ = new THREE.Vector3(0, 0.8, -1.82).project(camFromPassenger);
const pPosZ = new THREE.Vector3(0, 0.8, +1.81).project(camFromPassenger);
console.log('Z = -1.82m on screen:', pNegZ.x.toFixed(3), '(Positive X = RIGHT)');
console.log('Z = +1.81m on screen:', pPosZ.x.toFixed(3), '(Negative X = LEFT)');

// Awning if outerZ = -2.72m:
const pAwningNeg = new THREE.Vector3(0, 0.8, -2.72).project(camFromPassenger);
console.log('Awning if outerZ = -2.72m:', pAwningNeg.x.toFixed(3), '(RIGHT)');

// Awning if outerZ = +3.52m:
const pAwningPos = new THREE.Vector3(0, 0.8, +3.52).project(camFromPassenger);
console.log('Awning if outerZ = +3.52m:', pAwningPos.x.toFixed(3), '(LEFT)');
