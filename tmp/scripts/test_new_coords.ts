import * as THREE from 'three';

console.log('=== TEST NEW COORDINATES: PIPES INSIDE FRAME & BAU AT FRONT OF CAR ===');

// Doblo coordinates:
// Front of car (Headlights): Z = -1.82m
// Rear of car (Tailgate):   Z = +1.29m

const RACK_OFFSET_Z = 0.40;
const SUBCHASSIS_LENGTH = 2.20;
const SUBCHASSIS_WIDTH = 1.40;
const PROFILE_SIZE = 0.04;

// Frame edges:
// Front of frame (towards headlights): Z = -0.70m
// Rear of frame (towards tailgate):    Z = +1.50m
const zFrontFrame = RACK_OFFSET_Z - SUBCHASSIS_LENGTH / 2; // -0.70m
const zRearFrame  = RACK_OFFSET_Z + SUBCHASSIS_LENGTH / 2; // +1.50m

console.log(`Frame Front (near windshield): ${zFrontFrame.toFixed(2)}m`);
console.log(`Frame Rear (near tailgate):     ${zRearFrame.toFixed(2)}m`);

// Inner dimensions of frame:
const xInnerMax = SUBCHASSIS_WIDTH / 2 - PROFILE_SIZE; // 0.70 - 0.04 = 0.66m
const zInnerFront = zFrontFrame + PROFILE_SIZE;         // -0.70 + 0.04 = -0.66m
const zInnerRear  = zRearFrame - PROFILE_SIZE;          // +1.50 - 0.04 = +1.46m

console.log(`Frame Inner X: [-${xInnerMax.toFixed(2)}m, +${xInnerMax.toFixed(2)}m] (width: ${(xInnerMax * 2).toFixed(2)}m)`);
console.log(`Frame Inner Z: [${zInnerFront.toFixed(2)}m, ${zInnerRear.toFixed(2)}m] (length: ${(zInnerRear - zInnerFront).toFixed(2)}m)`);

// Pipes inside the frame:
// Diameter e.g. 200mm -> radius = 0.10m, or 150mm -> radius = 0.075m
const diameterMm = 200;
const radiusM = (diameterMm / 2) / 1000; // 0.10m
const bendR = Math.max(0.06, radiusM * 1.35); // 0.135m

// Lateral pipes centered inside the longarinas:
// Outer edge of pipe at xInnerMax (0.66m):
const pipeOffsetX = xInnerMax - radiusM; // 0.66 - 0.10 = 0.56m
console.log(`Pipe Offset X: ±${pipeOffsetX.toFixed(3)}m (Outer edge: ±${(pipeOffsetX + radiusM).toFixed(3)}m <= ${xInnerMax.toFixed(3)}m)`);

// Front transverse pipe centered inside the front crossbar:
// Outer front edge of pipe at zInnerFront (-0.66m):
const zFrontPipe = zInnerFront + radiusM; // -0.66 + 0.10 = -0.56m
console.log(`Front Pipe Center Z: ${zFrontPipe.toFixed(3)}m (Outer front edge: ${(zFrontPipe - radiusM).toFixed(3)}m >= ${zInnerFront.toFixed(3)}m)`);

// Elbows at the front corners:
// Left elbow curves from (-pipeOffsetX, y, zFrontPipe + bendR) to (-pipeOffsetX + bendR, y, zFrontPipe)
// Right elbow curves from (+pipeOffsetX - bendR, y, zFrontPipe) to (+pipeOffsetX, y, zFrontPipe + bendR)
const frontPipeSpan = (pipeOffsetX - bendR) * 2;
console.log(`Front Transverse Pipe Length: ${frontPipeSpan.toFixed(3)}m`);

// Lateral pipes extend from (zFrontPipe + bendR) towards the rear (+Z):
const zLateralStart = zFrontPipe + bendR; // -0.56 + 0.135 = -0.425m
const maxLateralLength = zInnerRear - zLateralStart; // 1.46 - (-0.425) = 1.885m
console.log(`Lateral Pipe Start Z: ${zLateralStart.toFixed(3)}m`);
console.log(`Max Lateral Pipe Length: ${maxLateralLength.toFixed(3)}m`);

// Baú inside the U and inside the frame:
const boxL = 1.60;
const boxW = 1.00;
const boxFrontZ = zFrontPipe + radiusM + 0.02; // -0.56 + 0.10 + 0.02 = -0.44m
const boxCenterZ = boxFrontZ + boxL / 2; // -0.44 + 0.80 = +0.36m
const boxRearZ = boxFrontZ + boxL; // -0.44 + 1.60 = +1.16m

console.log('\nBaú Position:');
console.log(`  Front (Nose): ${boxFrontZ.toFixed(3)}m (Clearance to front pipe: ${(boxFrontZ - (zFrontPipe + radiusM)).toFixed(3)}m)`);
console.log(`  Center:       ${boxCenterZ.toFixed(3)}m`);
console.log(`  Rear:         ${boxRearZ.toFixed(3)}m (Remaining rear space: ${(zRearFrame - boxRearZ).toFixed(3)}m)`);
console.log(`  Width:        ${boxW.toFixed(2)}m (Clearance to lateral pipes: ${(pipeOffsetX - radiusM - boxW / 2).toFixed(3)}m)`);

// Assertions:
const allPipesInsideX = (pipeOffsetX + radiusM) <= xInnerMax + 0.001;
const frontPipeInsideZ = (zFrontPipe - radiusM) >= zInnerFront - 0.001;
const bauBehindFrontPipe = boxFrontZ >= (zFrontPipe + radiusM);
const bauInFrontOfRearFrame = boxRearZ <= zRearFrame;

console.log('\nChecks:');
console.log('1. Pipes inside frame in X?', allPipesInsideX ? '✅ YES' : '❌ NO');
console.log('2. Front pipe inside frame in Z?', frontPipeInsideZ ? '✅ YES' : '❌ NO');
console.log('3. Baú positioned forward behind front pipe?', bauBehindFrontPipe ? '✅ YES' : '❌ NO');
console.log('4. Baú fits within rack length?', bauInFrontOfRearFrame ? '✅ YES' : '❌ NO');

