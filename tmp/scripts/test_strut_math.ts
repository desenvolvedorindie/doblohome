import * as THREE from 'three';

const h = 0.40;
const l = 0.80;
const faceZ = -l / 2; // -0.40
const pivotY = h / 2 - 0.022; // 0.178
const D_b = 0.016;
const Hv = 0.135;
const Lh = 0.25;

const lowerPivotY = pivotY - Hv * 0.75; // 0.07675
const lowerPivotZ = faceZ - D_b * 0.65; // -0.4104

const upperLockY = pivotY - 0.006; // 0.172
const upperLockZ = faceZ - D_b - Lh * 0.62; // -0.571

const dY = upperLockY - lowerPivotY; // 0.09525 > 0
const dZ = upperLockZ - lowerPivotZ; // -0.1606 < 0

console.log('lowerPivot:', { y: lowerPivotY, z: lowerPivotZ });
console.log('upperLock:', { y: upperLockY, z: upperLockZ });
console.log('dY:', dY, 'dZ:', dZ);

const strutLength = Math.hypot(dY, dZ); // 0.1868
console.log('strutLength:', strutLength);

// What was written before:
const wrongAngle = Math.atan2(dZ, dY); // atan2(-0.1606, 0.09525) = -1.0355 rad (-59.33 deg)
const wrongRotX = -wrongAngle + Math.PI / 2; // -(-1.0355) + 1.5708 = 2.6063 rad (149.33 deg) !!
console.log('wrongRotX:', wrongRotX * 180 / Math.PI, 'deg');

const center = new THREE.Vector3(0, (lowerPivotY + upperLockY) / 2, (lowerPivotZ + upperLockZ) / 2);
const halfVecWrong = new THREE.Vector3(0, strutLength / 2, 0).applyEuler(new THREE.Euler(wrongRotX, 0, 0));
console.log('Wrong endpoint 1:', center.clone().add(halfVecWrong));
console.log('Wrong endpoint 2:', center.clone().sub(halfVecWrong));

// Now what it SHOULD be:
// We want the box (which has height strutLength along Y, centered at origin)
// to have its end at -Y be at lowerPivot, and its end at +Y be at upperLock!
// In Three.js:
// A vector along +Y is (0, 1, 0).
// Rotating by rotX:
// Y' = cos(rotX)
// Z' = sin(rotX)
// We want (Y', Z') to be proportional to (dY, dZ):
// So cos(rotX) = dY / strutLength (positive)
// and sin(rotX) = dZ / strutLength (negative!)
// Therefore, rotX = Math.atan2(dZ, dY)!
// Let's check:
const correctRotX = Math.atan2(dZ, dY);
console.log('correctRotX:', correctRotX * 180 / Math.PI, 'deg');

const halfVecCorrect = new THREE.Vector3(0, strutLength / 2, 0).applyEuler(new THREE.Euler(correctRotX, 0, 0));
const pUpper = center.clone().add(halfVecCorrect);
const pLower = center.clone().sub(halfVecCorrect);

console.log('Correct upper point:', pUpper);
console.log('Target upperLock:', { y: upperLockY, z: upperLockZ });
console.log('Correct lower point:', pLower);
console.log('Target lowerPivot:', { y: lowerPivotY, z: lowerPivotZ });

