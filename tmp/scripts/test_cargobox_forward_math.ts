import * as THREE from 'three';

const RACK_OFFSET_Z = 0.40;
const SUBCHASSIS_LENGTH = 2.20;
const SUBCHASSIS_WIDTH = 1.40;
const PROFILE_SIZE = 0.04;
const BASE_Y = 2.06;

function computeLayout(boxL = 1.60, boxW = 1.00, boxH = 0.33, waterTankEnabled = true, diameterMm = 200) {
  const zFrontFrame = RACK_OFFSET_Z - SUBCHASSIS_LENGTH / 2; // -0.70m
  const zRearFrame  = RACK_OFFSET_Z + SUBCHASSIS_LENGTH / 2; // +1.50m
  const zInnerFront = zFrontFrame + PROFILE_SIZE;            // -0.66m
  const zInnerRear  = zRearFrame - PROFILE_SIZE;             // +1.46m

  const radiusM = (diameterMm / 2) / 1000; // 0.10m
  const frameInnerX = SUBCHASSIS_WIDTH / 2 - PROFILE_SIZE; // 0.66m
  const pipeOffsetX = frameInnerX - radiusM; // 0.56m

  const zFrontPipe = zInnerFront + radiusM; // -0.56m
  const bendR = Math.max(0.06, radiusM * 1.35); // 0.135m
  const zPipeStart = zFrontPipe + bendR; // -0.425m
  const lateralPipeLengthM = Math.min(2.20 - bendR, zInnerRear - zPipeStart);
  const zRearEnd = zPipeStart + lateralPipeLengthM; // end of pipe

  // Baú front & center
  const frontClearance = waterTankEnabled ? (radiusM * 2 + 0.02) : 0.04;
  const boxFrontZ = zInnerFront + frontClearance; // -0.44m
  const boxCenterZ = boxFrontZ + boxL / 2; // +0.36m
  const boxRearZ = boxFrontZ + boxL; // +1.16m

  // Subchassis crossbars
  const zFrontCross = zCenterCalc(zFrontFrame, zFrontFrame + PROFILE_SIZE);
  const zRearCross = zCenterCalc(zRearFrame - PROFILE_SIZE, zRearFrame);
  const boxSupportHalf = Math.min(boxL / 2 - 0.10, 0.65);
  const crossZ = [
    zFrontCross,
    boxCenterZ - boxSupportHalf,
    boxCenterZ,
    boxCenterZ + boxSupportHalf,
    (boxCenterZ + boxSupportHalf + zRearCross) / 2,
    zRearCross
  ];

  // Towers
  const towerHalfZ = Math.min(boxL / 2 + 0.10, 0.72);
  const towerZ = [boxCenterZ - towerHalfZ, boxCenterZ + towerHalfZ];

  // Struts
  const strutHalfZ = Math.min(boxL * 0.32, 0.55);
  const strutZ = [boxCenterZ - strutHalfZ, boxCenterZ + strutHalfZ];

  return {
    zFrontFrame,
    zRearFrame,
    pipeOffsetX,
    zFrontPipe,
    zPipeStart,
    zRearEnd,
    boxFrontZ,
    boxCenterZ,
    boxRearZ,
    crossZ,
    towerZ,
    strutZ
  };
}

function zCenterCalc(a: number, b: number) {
  return (a + b) / 2;
}

const res = computeLayout();
console.log('Layout calculation results:');
console.log(JSON.stringify(res, null, 2));

