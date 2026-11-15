import * as THREE from 'three';

console.log('=== TEST REAR MOUNTING FOR AWNING ===');

const rackOffsetZ = 0.40;
const rackLength = 2.20;
const rackRearZ = rackOffsetZ + rackLength / 2; // +1.50
const rackFrontZ = rackOffsetZ - rackLength / 2; // -0.70

console.log(`Rack Front: ${rackFrontZ.toFixed(2)}m (over windshield/front seats)`);
console.log(`Rack Rear:  ${rackRearZ.toFixed(2)}m (over tailgate/porta-malas)`);

// 1. REAR AWNING (Toldo Traseiro Reto)
const caseWidth = 1.40;
const extensionM = 2.00;
const baseY = 2.06;
const caseY = baseY + 0.04;
const caseZ = rackRearZ + 0.02; // +1.52m (at the rear crossbar)
const dropY = 0.12;
const outerZ = caseZ + extensionM; // +3.52m (extending backwards behind the car!)
const outerY = caseY - dropY;

console.log('\nRear Awning:');
console.log(`  Case Z:  ${caseZ.toFixed(2)}m (at the rear of the rack)`);
console.log(`  Outer Z: ${outerZ.toFixed(2)}m (behind the car over the open tailgate)`);

// 2. BATWING AWNING 270° (Asa de Morcego)
const caseL = 2.00;
const radiusM = 2.20;
const pivotZ = rackRearZ; // +1.50m (rear corner)
const caseCenterZ = pivotZ - caseL / 2; // +0.50m (extends forward from rear pivot)
console.log('\nBatwing Awning:');
console.log(`  Pivot Z: ${pivotZ.toFixed(2)}m (at the rear corner)`);
console.log(`  Case Z:  from ${(pivotZ - caseL).toFixed(2)}m to ${pivotZ.toFixed(2)}m (along the side)`);

// Batwing Fan Angles:
// In this vehicle coordinate system:
// Forward is -Z (towards front bumper at -2.24)
// Rear is +Z (towards rear bumper at +2.24)
// Passenger side is -X (-0.72)
// Driver side is +X (+0.72)

// If mounted on Passenger side (mountX = -0.72):
// The awning opens from the side:
// Arm 1 (0°): points FORWARD along the side (-Z direction, towards the front passenger door)
// Arm 2 (67.5°): forward-lateral diagonal (-X, -Z)
// Arm 3 (135°): rear-lateral diagonal (-X, +Z)
// Arm 4 (202.5°): rear diagonal (+Z, heading across to driver side)
// Arm 5 (270°): straight across the rear (+X direction, across the tailgate)

const isPassenger = true;
const sideSign = isPassenger ? -1 : 1;
const mountX = sideSign * 0.72;

// Let's compute dirX and dirZ for each angle:
// At angle = 0: dirX = 0, dirZ = -1 (FORWARD along -Z!)
// At angle = 90°: dirX = sideSign * 1 (OUTWARDS to the side, -X for passenger)
// At angle = 180°: dirX = 0, dirZ = +1 (REARWARDS along +Z!)
// At angle = 270°: dirX = -sideSign * 1 (ACROSS the rear, +X for passenger!)

// Let's check trigonometry:
// If dirZ = -cos(angle) and dirX = sideSign * sin(angle):
// angle = 0:      dirZ = -1, dirX = 0 (pointing forward -Z)
// angle = 90°:    dirZ = 0,  dirX = sideSign * 1 (pointing outwards)
// angle = 180°:   dirZ = +1, dirX = 0 (pointing straight back +Z behind the car)
// angle = 270°:   dirZ = 0,  dirX = sideSign * (-1) = -sideSign (crossing rear to the opposite side!)

const angles = [
  0,
  (Math.PI * 3) / 8, // 67.5°
  (Math.PI * 3) / 4, // 135°
  (Math.PI * 9) / 8, // 202.5°
  (Math.PI * 3) / 2  // 270°
];

console.log('\nBatwing Arms (Passenger Side):');
angles.forEach((angle, idx) => {
  const dirX = sideSign * Math.sin(angle);
  const dirZ = -Math.cos(angle);
  const deg = ((angle * 180) / Math.PI).toFixed(1);
  const tipX = mountX + dirX * radiusM;
  const tipZ = pivotZ + dirZ * radiusM;
  console.log(`  Arm ${idx + 1} (${deg}°): dir=(${dirX.toFixed(2)}, ${dirZ.toFixed(2)}) -> Tip=(X: ${tipX.toFixed(2)}, Z: ${tipZ.toFixed(2)})`);
});

