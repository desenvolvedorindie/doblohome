import * as THREE from 'three';

console.log('Testing Awning Assemblies...');

const baseY = 2.06;
const rackOffsetZ = 0.40;
const rackLength = 2.20;
const rackRearZ = rackOffsetZ + rackLength / 2; // +1.50m (rear crossbar over tailgate)
const caseZ = rackRearZ + 0.05; // +1.55m
const caseY = baseY + 0.04;
const extensionM = 2.00;
const dropY = 0.12;
const outerZ = caseZ + extensionM; // +3.55m
const outerY = caseY - dropY;
const caseWidth = 1.40;
const hw = caseWidth * 0.48;

console.log('REAR AWNING OPEN SPECS:');
console.log(`- Case Position: (0, ${caseY.toFixed(2)}, ${caseZ.toFixed(2)})`);
console.log(`- Outer Bar Position: (0, ${outerY.toFixed(2)}, ${outerZ.toFixed(2)})`);
console.log(`- Poles Position: (±${hw.toFixed(2)}, ${outerY.toFixed(2)}/2, ${outerZ.toFixed(2)})`);
console.log(`- Extension: ${extensionM}m to the rear (+Z)`);

// Check Batwing specs
const pivotZ = rackRearZ; // +1.50m
const caseL = 2.00;
const radiusM = 2.20;
const isPassenger = true;
const sideSign = isPassenger ? -1 : 1;
const mountX = sideSign * 0.72;

console.log('\nBATWING AWNING 270° SPECS:');
console.log(`- Pivot: (${mountX.toFixed(2)}, ${caseY.toFixed(2)}, ${pivotZ.toFixed(2)})`);
console.log(`- Case Z Range: [${(pivotZ - caseL).toFixed(2)}, ${pivotZ.toFixed(2)}]`);

const angles = [
  0,
  (Math.PI * 3) / 8,
  (Math.PI * 3) / 4,
  (Math.PI * 9) / 8,
  (Math.PI * 3) / 2
];

angles.forEach((angle, idx) => {
  const dirX = sideSign * Math.sin(angle);
  const dirZ = -Math.cos(angle);
  const tipX = mountX + dirX * radiusM;
  const tipZ = pivotZ + dirZ * radiusM;
  console.log(`  Arm ${idx + 1} (${((angle * 180) / Math.PI).toFixed(1)}°): Tip=(${tipX.toFixed(2)}, ${tipZ.toFixed(2)})`);
});

