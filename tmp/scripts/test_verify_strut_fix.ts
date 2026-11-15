import * as THREE from 'three';

const h = 0.40;
const l = 0.80;
const faceZ = -l / 2; // -0.40
const pivotY = h / 2 - 0.022; // 0.178
const D_b = 0.016;
const Hv = 0.135;
const Lh = 0.25;

const lowerPivotY = pivotY - Hv * 0.75;
const lowerPivotZ = faceZ - D_b * 0.65;

// Underside of horizontal arm is at pivotY - D_b
// In order for the diagonal strut to connect strictly underneath the horizontal arm:
// The top of the horizontal arm is at pivotY.
// The horizontal arm has height D_b (16mm).
// So the underside of the arm is at pivotY - D_b = pivotY - 0.016!
// The locking hole on the arm is at pivotY - D_b / 2 = pivotY - 0.008!
const upperLockY = pivotY - 0.010; // safely 10mm below the wood underside!
const upperLockZ = faceZ - D_b - Lh * 0.62;

const dY = upperLockY - lowerPivotY;
const dZ = upperLockZ - lowerPivotZ;
const strutLength = Math.hypot(dY, dZ);
const strutAngle = Math.atan2(dZ, dY);

console.log('lowerPivot:', { y: lowerPivotY, z: lowerPivotZ });
console.log('upperLock:', { y: upperLockY, z: upperLockZ });
console.log('strutLength:', strutLength);
console.log('strutAngle (deg):', strutAngle * 180 / Math.PI);

const strutGeo = new THREE.BoxGeometry(0.014, strutLength, 0.005);
const strutMesh = new THREE.Mesh(strutGeo, new THREE.MeshBasicMaterial());
strutMesh.position.set(0, (lowerPivotY + upperLockY) / 2, (lowerPivotZ + upperLockZ) / 2);
strutMesh.rotation.x = strutAngle;

// Compute world bounding box of strutMesh
const box = new THREE.Box3().setFromObject(strutMesh);
console.log('Strut Bounding Box:');
console.log('  Y min:', box.min.y, 'Y max:', box.max.y);
console.log('  Z min:', box.min.z, 'Z max:', box.max.z);

// Wooden board top and bottom:
const woodBottomY = pivotY + 0.003;
const woodTopY = woodBottomY + 0.018;
console.log('Wood Y range:', { bottom: woodBottomY, top: woodTopY });

if (box.max.y > woodBottomY) {
  console.error('FAIL: Strut is intersecting or above wood bottom!');
} else {
  console.log('SUCCESS: Strut max Y (', box.max.y, ') is STRICTLY BELOW wood bottom (', woodBottomY, ')!');
  console.log('Clearance to wood:', (woodBottomY - box.max.y) * 1000, 'mm');
}

