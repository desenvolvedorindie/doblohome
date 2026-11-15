import * as THREE from 'three';

// Configuration
const W_b = 0.022; // 22mm
const D_b = 0.016; // 16mm
const t_s = 0.002; // 2mm sheet steel
const shelfT = 0.018; // 18mm wood

const h = 0.400;
const l = 0.600;
const w = 0.400;

const shelfW = Math.max(0.15, w - 0.03);
const shelfH = Math.max(0.15, Math.min(h - 0.04, 0.38));
const Hv = Math.min(shelfH * 0.65, 0.130);
const Lh = Math.min(shelfH * 0.85, 0.250);

const faceZ = -l / 2 - 0.015; // drawer front face outer surface
// We place the pivot axis at Y = h/2 - 0.025, Z = faceZ - D_b/2
const pivotY = h / 2 - 0.025;
const pivotZ = faceZ - D_b / 2;

// The wood bottom in open state is at Y = pivotY + D_b / 2 + 0.001
const woodBottomY = pivotY + D_b / 2 + 0.001;

console.log('pivotY:', pivotY.toFixed(4), 'pivotZ:', pivotZ.toFixed(4));
console.log('woodBottomY:', woodBottomY.toFixed(4));

// Test OPEN state
const groupOpen = new THREE.Group();

// 1. Fixed wall channel
const vertBack = new THREE.Mesh(new THREE.BoxGeometry(W_b, Hv, t_s));
vertBack.position.set(0, pivotY + D_b / 2 - Hv / 2, faceZ - t_s / 2);
groupOpen.add(vertBack);

const vertFlangeL = new THREE.Mesh(new THREE.BoxGeometry(t_s, Hv, D_b));
vertFlangeL.position.set(-W_b / 2 + t_s / 2, pivotY + D_b / 2 - Hv / 2, faceZ - D_b / 2);
groupOpen.add(vertFlangeL);

const vertFlangeR = new THREE.Mesh(new THREE.BoxGeometry(t_s, Hv, D_b));
vertFlangeR.position.set(W_b / 2 - t_s / 2, pivotY + D_b / 2 - Hv / 2, faceZ - D_b / 2);
groupOpen.add(vertFlangeR);

// Main pivot pin
const mainPivotPin = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, W_b + 0.004, 16));
mainPivotPin.geometry.rotateZ(Math.PI / 2);
mainPivotPin.position.set(0, pivotY, pivotZ);
groupOpen.add(mainPivotPin);

// Lower pivot pin on wall channel
const lowerY = pivotY - Hv * 0.70;
const lowerZ = faceZ - D_b / 2;
const lowerPin = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, W_b + 0.004, 16));
lowerPin.geometry.rotateZ(Math.PI / 2);
lowerPin.position.set(0, lowerY, lowerZ);
groupOpen.add(lowerPin);

// Upper lock pin under arm
const upperY = pivotY - D_b / 2;
const upperZ = faceZ - D_b / 2 - Lh * 0.65;
const upperPin = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, W_b + 0.004, 16));
upperPin.geometry.rotateZ(Math.PI / 2);
upperPin.position.set(0, upperY, upperZ);
groupOpen.add(upperPin);

// Diagonal strut
const dY = upperY - lowerY;
const dZ = upperZ - lowerZ;
const strutLen = Math.sqrt(dY * dY + dZ * dZ);
const strutAngle = Math.atan2(dZ, dY);
const strut = new THREE.Mesh(new THREE.BoxGeometry(0.012, strutLen, 0.004));
strut.position.set(0, (lowerY + upperY) / 2, (lowerZ + upperZ) / 2);
strut.rotation.x = strutAngle;
groupOpen.add(strut);

// Rotating arm + shelf
const pivotOpen = new THREE.Group();
pivotOpen.position.set(0, pivotY, pivotZ);
pivotOpen.rotation.x = Math.PI / 2;

// In local coords before PI/2 rotation:
// Arm is along -Y (from 0 to -Lh)
// Arm thickness along Z is D_b (from -D_b/2 to +D_b/2)
// Arm top in open state will be local -Z.
// When rotated by +PI/2 around X:
// Local -Z becomes +Y (world)!
// Local +Z becomes -Y (world)!
// Local -Y becomes -Z (world)!
// So:
// Arm center in local coords:
// X = 0
// Y = -Lh / 2
// Z = 0
// With size BoxGeometry(W_b - 0.003, Lh, D_b):
// When rotated by PI/2:
// World Y is from pivotY - D_b/2 to pivotY + D_b/2.
// World Z is from pivotZ to pivotZ - Lh.
const arm = new THREE.Mesh(new THREE.BoxGeometry(W_b - 0.003, Lh, D_b));
arm.position.set(0, -Lh / 2, 0);
pivotOpen.add(arm);

// Shelf sits on top of arm:
// Top of arm is at local Z = -D_b/2.
// Shelf has thickness shelfT.
// So shelf center along local Z is:
// -D_b/2 - 0.001 - shelfT/2!
// Shelf length is shelfH along local Y:
// center is -shelfH / 2.
const shelf = new THREE.Mesh(new THREE.BoxGeometry(shelfW, shelfH, shelfT));
shelf.position.set(0, -shelfH / 2, -D_b / 2 - 0.001 - shelfT / 2);
pivotOpen.add(shelf);

groupOpen.add(pivotOpen);
groupOpen.updateMatrixWorld(true);

const shelfBox = new THREE.Box3().setFromObject(shelf);
console.log('\n--- OPEN STATE VERIFICATION ---');
console.log('Shelf Wood Y range:', `[${shelfBox.min.y.toFixed(4)}, ${shelfBox.max.y.toFixed(4)}]`);
console.log('Shelf Wood Z range:', `[${shelfBox.min.z.toFixed(4)}, ${shelfBox.max.z.toFixed(4)}]`);

let openCollisions = 0;
groupOpen.traverse((obj) => {
  if (obj instanceof THREE.Mesh && obj !== shelf) {
    const b = new THREE.Box3().setFromObject(obj);
    const penetrates = b.max.y > shelfBox.min.y;
    console.log(
      (obj.geometry.type).padEnd(20),
      'Y:', `[${b.min.y.toFixed(4)}, ${b.max.y.toFixed(4)}]`,
      'Z:', `[${b.min.z.toFixed(4)}, ${b.max.z.toFixed(4)}]`,
      penetrates ? '❌ PENETRATES WOOD!' : `✅ OK (${((shelfBox.min.y - b.max.y)*1000).toFixed(2)} mm clearance)`
    );
    if (penetrates) openCollisions++;
  }
});

console.log('Open collisions:', openCollisions);

// Test CLOSED state
const groupClosed = new THREE.Group();
groupClosed.add(vertBack.clone());
groupClosed.add(vertFlangeL.clone());
groupClosed.add(vertFlangeR.clone());
groupClosed.add(mainPivotPin.clone());

// Folded strut inside channel
const foldStrut = new THREE.Mesh(new THREE.BoxGeometry(0.012, Hv * 0.70, 0.004));
foldStrut.position.set(0, pivotY - Hv * 0.40, faceZ - D_b / 2);
groupClosed.add(foldStrut);

// Rotating group closed: rotation.x = 0
const pivotClosed = new THREE.Group();
pivotClosed.position.set(0, pivotY, pivotZ);
pivotClosed.rotation.x = 0;

const armClosed = arm.clone();
pivotClosed.add(armClosed);

const shelfClosed = shelf.clone();
pivotClosed.add(shelfClosed);

groupClosed.add(pivotClosed);
groupClosed.updateMatrixWorld(true);

const closedShelfBox = new THREE.Box3().setFromObject(shelfClosed);
console.log('\n--- CLOSED STATE VERIFICATION ---');
console.log('Closed Shelf Wood Y range:', `[${closedShelfBox.min.y.toFixed(4)}, ${closedShelfBox.max.y.toFixed(4)}]`);
console.log('Closed Shelf Wood Z range:', `[${closedShelfBox.min.z.toFixed(4)}, ${closedShelfBox.max.z.toFixed(4)}]`);

let closedCollisions = 0;
groupClosed.traverse((obj) => {
  if (obj instanceof THREE.Mesh && obj !== shelfClosed) {
    const b = new THREE.Box3().setFromObject(obj);
    const intersects = closedShelfBox.intersectsBox(b);
    console.log(
      (obj.geometry.type).padEnd(20),
      'Y:', `[${b.min.y.toFixed(4)}, ${b.max.y.toFixed(4)}]`,
      'Z:', `[${b.min.z.toFixed(4)}, ${b.max.z.toFixed(4)}]`,
      intersects ? '❌ COLLIDES WITH CLOSED SHELF!' : '✅ Clear'
    );
    if (intersects) closedCollisions++;
  }
});

console.log('Closed collisions:', closedCollisions);

