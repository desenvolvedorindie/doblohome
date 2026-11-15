import * as THREE from 'three';

const RACK_OFFSET_Z = 0.40;
const SUBCHASSIS_LENGTH = 2.20;
const PROFILE_SIZE = 0.04;

function calculateBoxCenterZ(boxL: number, waterTankEnabled: boolean, diameterMm: number) {
  const zFrontFrame = RACK_OFFSET_Z - SUBCHASSIS_LENGTH / 2; // -0.70m
  const zInnerFront = zFrontFrame + PROFILE_SIZE; // -0.66m
  const pipeRadiusM = (diameterMm / 2) / 1000;
  const zFrontPipeRear = zInnerFront + pipeRadiusM * 2.06; // rear edge of front pipe + socket ring (~ -0.454m)

  const halfL = (boxL * 1.025) / 2; // actual bounding half length including skirt and latch
  const clearance = 0.025; // 25mm safety gap

  if (waterTankEnabled) {
    const minFrontZ = zFrontPipeRear + clearance; // e.g. -0.429m
    return minFrontZ + halfL;
  } else {
    const minFrontZ = zInnerFront + 0.03; // e.g. -0.63m
    return minFrontZ + halfL;
  }
}

for (const d of [150, 200]) {
  for (const l of [1.45, 1.60, 1.90]) {
    const cz = calculateBoxCenterZ(l, true, d);
    const frontTip = cz - (l * 1.025) / 2;
    const rearTip = cz + (l * 1.025) / 2;
    console.log(`D=${d}mm, L=${l}m -> boxCenterZ: ${cz.toFixed(3)}m, Front Tip: ${frontTip.toFixed(3)}m, Rear Tip: ${rearTip.toFixed(3)}m, Rear Margin: ${(1.46 - rearTip).toFixed(3)}m`);
  }
}

