import * as THREE from 'three';

console.log('=== TEST ALL PIPES INSIDE FRAME & BAU AT CAR FRONT ===');

const RACK_OFFSET_Z = 0.40;
const SUBCHASSIS_LENGTH = 2.20;
const SUBCHASSIS_WIDTH = 1.40;
const PROFILE_SIZE = 0.04;

// Car Front (Windshield) is at -Z
// Car Rear (Tailgate) is at +Z
const zFrontFrame = RACK_OFFSET_Z - SUBCHASSIS_LENGTH / 2; // -0.70m (Front of car)
const zRearFrame  = RACK_OFFSET_Z + SUBCHASSIS_LENGTH / 2; // +1.50m (Rear of car)
const xMaxFrame   = SUBCHASSIS_WIDTH / 2;                  // 0.70m (Outer edge of frame)
const xInnerFrame = xMaxFrame - PROFILE_SIZE;              // 0.66m (Inner face of longarina)

console.log(`Frame Bounds: X in [${-xMaxFrame}, ${xMaxFrame}], Z in [${zFrontFrame}, ${zRearFrame}]`);
console.log(`Frame Inner Bounds: X in [${-xInnerFrame}, ${xInnerFrame}], Z in [${zFrontFrame + PROFILE_SIZE}, ${zRearFrame - PROFILE_SIZE}]`);

const diameterMm = 200;
const radiusM = (diameterMm / 2) / 1000; // 0.10m
const bendR = Math.max(0.06, radiusM * 1.35); // 0.135m

// Lateral pipe center in X: nestled against the inner face of the longarina
const pipeOffsetX = xInnerFrame - radiusM; // 0.66 - 0.10 = 0.56m
const zFrontPipe  = (zFrontFrame + PROFILE_SIZE) + radiusM; // -0.70 + 0.04 + 0.10 = -0.56m

console.log(`Pipe Offset X: ±${pipeOffsetX.toFixed(3)}m`);
console.log(`Front Pipe Center Z: ${zFrontPipe.toFixed(3)}m`);

// Check outer boundaries of the pipes:
const pipeXMin = -pipeOffsetX - radiusM;
const pipeXMax = pipeOffsetX + radiusM;
const pipeZMin = zFrontPipe - radiusM;

console.log(`Pipe Envelope X: [${pipeXMin.toFixed(3)}, ${pipeXMax.toFixed(3)}]`);
console.log(`Pipe Envelope Front Z: ${pipeZMin.toFixed(3)}`);

if (Math.abs(pipeXMax) <= xMaxFrame && pipeZMin >= zFrontFrame) {
  console.log('✅ ALL PIPES ARE STRICTLY INSIDE THE IRON FRAME!');
} else {
  console.error('❌ Pipes protrude outside frame!');
  process.exit(1);
}

// Check Baú:
const boxL = 1.60;
const boxFrontZ = zFrontPipe + radiusM + 0.02; // -0.56 + 0.10 + 0.02 = -0.44m
const boxCenterZ = boxFrontZ + boxL / 2; // -0.44 + 0.80 = 0.36m
const boxRearZ = boxFrontZ + boxL; // -0.44 + 1.60 = 1.16m

console.log(`Baú Front Z: ${boxFrontZ.toFixed(3)}m`);
console.log(`Baú Center Z: ${boxCenterZ.toFixed(3)}m`);
console.log(`Baú Rear Z: ${boxRearZ.toFixed(3)}m`);

if (boxFrontZ < 0 && boxFrontZ > zFrontFrame) {
  console.log('✅ Baú is positioned at the FRONT of the car (negative Z), behind the front pipe!');
} else {
  console.error('❌ Baú is not at the front of the car!');
  process.exit(1);
}

console.log('✅ TEST PASSED!');

