import * as THREE from 'three';

// Constants from SolarSystem and CargoBox
const BASE_Y = 2.06;
const PROFILE_SIZE = 0.04;
const RACK_OFFSET_Z = 0.40;
const SUBCHASSIS_LENGTH = 2.20;
const SUBCHASSIS_WIDTH = 1.40;

const zFrontFrame = RACK_OFFSET_Z - SUBCHASSIS_LENGTH / 2; // -0.70m
const zRearFrame = RACK_OFFSET_Z + SUBCHASSIS_LENGTH / 2;  // +1.50m
const zInnerFront = zFrontFrame + PROFILE_SIZE;            // -0.66m
const zInnerRear = zRearFrame - PROFILE_SIZE;              // +1.46m

console.log('Frame boundaries:');
console.log(`  Z range: [${zFrontFrame.toFixed(2)}, ${zRearFrame.toFixed(2)}]`);
console.log(`  Inner Z range: [${zInnerFront.toFixed(2)}, ${zInnerRear.toFixed(2)}]`);
console.log(`  X range: [-${(SUBCHASSIS_WIDTH/2).toFixed(2)}, +${(SUBCHASSIS_WIDTH/2).toFixed(2)}]`);
console.log(`  Inner X range: [-${(SUBCHASSIS_WIDTH/2 - PROFILE_SIZE).toFixed(2)}, +${(SUBCHASSIS_WIDTH/2 - PROFILE_SIZE).toFixed(2)}]`);

// Water tank pipe diameter options
for (const diameterMm of [150, 200]) {
  const radiusM = diameterMm / 2000;
  const pipeOffsetX = (SUBCHASSIS_WIDTH / 2 - PROFILE_SIZE) - radiusM;
  const zFrontPipe = zInnerFront + radiusM;
  const bendR = Math.max(0.06, radiusM * 1.35);
  const zPipeStart = zFrontPipe + bendR;
  
  // Cargo box front
  const boxFrontZ = zFrontPipe + radiusM + 0.02; // 2cm clearance from front pipe
  const boxL = 1.60;
  const boxCenterZ = boxFrontZ + boxL / 2;
  const boxRearZ = boxFrontZ + boxL;
  
  console.log(`\nPipe D = ${diameterMm}mm (R = ${(radiusM*1000).toFixed(0)}mm):`);
  console.log(`  Pipe Offset X: +/- ${pipeOffsetX.toFixed(3)}m (outer at +/- ${(pipeOffsetX + radiusM).toFixed(3)}m, inner at +/- ${(pipeOffsetX - radiusM).toFixed(3)}m)`);
  console.log(`  Front Pipe Center Z: ${zFrontPipe.toFixed(3)}m (front tangent: ${(zFrontPipe - radiusM).toFixed(3)}m, rear tangent: ${(zFrontPipe + radiusM).toFixed(3)}m)`);
  console.log(`  Cargo Box Front Z: ${boxFrontZ.toFixed(3)}m`);
  console.log(`  Cargo Box Center Z: ${boxCenterZ.toFixed(3)}m`);
  console.log(`  Cargo Box Rear Z: ${boxRearZ.toFixed(3)}m`);
  console.log(`  Free space behind box: ${(zInnerRear - boxRearZ).toFixed(3)}m (${((zInnerRear - boxRearZ)*100).toFixed(1)} cm)`);
}

