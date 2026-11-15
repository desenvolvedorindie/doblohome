import * as THREE from 'three';

const isPassenger = true;
const sideSign = isPassenger ? -1 : 1; // passenger side is -X
const mountX = sideSign * 0.72; // -0.72
const pivotZ = -0.70; // rear corner of the roof rack
const radiusM = 2.2;

const angles = [
  0,                  // 0°: along side of car forward (+Z)
  (Math.PI * 3) / 8,  // 67.5°: forward/side
  (Math.PI * 3) / 4,  // 135°: rear/side
  (Math.PI * 9) / 8,  // 202.5°: rear/across
  (Math.PI * 3) / 2   // 270°: across rear tailgate (-sideSign)
];

console.log('270° BATWING AWNING ARM TIPS:');
angles.forEach((angle, idx) => {
  const dirX = sideSign * Math.sin(angle);
  const dirZ = Math.cos(angle);
  const deg = (angle * 180 / Math.PI).toFixed(1);
  const tipX = mountX + dirX * radiusM;
  const tipZ = pivotZ + dirZ * radiusM;
  console.log(`Arm ${idx + 1} (${deg}°): dir=(${dirX.toFixed(2)}, ${dirZ.toFixed(2)}), Tip=(X: ${tipX.toFixed(2)}, Z: ${tipZ.toFixed(2)})`);
});

