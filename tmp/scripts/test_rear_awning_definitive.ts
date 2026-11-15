import * as THREE from 'three';

console.log('=== DEFINITIVE AWNING REAR ORIENTATION ===');

// Coordinates:
// Doblo Hood & Windshield: +Z (Right) -> Z in [+0.98, +2.05]
// Doblo Rear Tailgate: -Z (Left) -> Z in [-1.755, -0.40]
// Rack: length 2.20, offsetZ = +0.40
// Rack Front: +0.40 + 1.10 = +1.50 (Front)
// Rack Rear:  +0.40 - 1.10 = -0.70 (Rear)

const rackOffsetZ = 0.40;
const rackLength = 2.20;
const rackRearZ = rackOffsetZ - rackLength / 2; // -0.70m
const caseZ = rackRearZ - 0.02; // -0.72m
const extensionM = 2.00;
const outerZ = caseZ - extensionM; // -2.72m

console.log(`Rack Rear: ${rackRearZ.toFixed(2)}m (rear crossbar, above trunk)`);
console.log(`Awning Case: ${caseZ.toFixed(2)}m`);
console.log(`Awning Open Outer Edge: ${outerZ.toFixed(2)}m (behind the car over the ground)`);

if (outerZ < -1.755 && caseZ <= rackRearZ) {
  console.log('✅ REAR AWNING is mounted at the REAR (-0.72m) and extends behind the car to -2.72m!');
} else {
  console.error('❌ FAIL');
}

// Batwing
const pivotZ = rackRearZ; // -0.70m
const caseL = 2.00;
const caseCenterZ = pivotZ + caseL / 2; // +0.30m (case sits along side from -0.70 to +1.30)
console.log(`Batwing Pivot: ${pivotZ.toFixed(2)}m (rear corner of rack)`);
console.log(`Batwing Case: from ${pivotZ.toFixed(2)}m to ${(pivotZ + caseL).toFixed(2)}m (along side towards front)`);

const isPassenger = true;
const sideSign = isPassenger ? -1 : 1;
const mountX = sideSign * 0.72;
const radiusM = 2.20;

const angles = [
  0,
  (Math.PI * 3) / 8,
  (Math.PI * 3) / 4,
  (Math.PI * 9) / 8,
  (Math.PI * 3) / 2
];

console.log('\nBatwing Arms (Passenger Side):');
angles.forEach((angle, idx) => {
  const dirX = sideSign * Math.sin(angle);
  const dirZ = Math.cos(angle);
  const deg = ((angle * 180) / Math.PI).toFixed(1);
  const tipX = mountX + dirX * radiusM;
  const tipZ = pivotZ + dirZ * radiusM;
  console.log(`  Arm ${idx + 1} (${deg}°): dir=(${dirX.toFixed(2)}, ${dirZ.toFixed(2)}) -> Tip=(X: ${tipX.toFixed(2)}, Z: ${tipZ.toFixed(2)})`);
});

