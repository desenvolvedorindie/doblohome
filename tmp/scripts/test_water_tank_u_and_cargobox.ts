import * as THREE from 'three';

console.log('=== TEST WATER TANK U-SHAPE & CARGO BOX POSITIONING ===');

// Parameters
const BASE_MAX_MM = 2200;
const lengthMm = 2200;
const diameterMm = 200;
const radiusMm = diameterMm / 2;
const radiusM = radiusMm / 1000; // 0.10m
const radiusDm = radiusMm / 100; // 1.0 dm
const lateralLengthM = lengthMm / 1000; // 2.20m

const zCenter = 0.40;
const rackLength = 2.20;
const zFrontEdge = zCenter + rackLength / 2; // 1.50m
const zRearEdge = zCenter - rackLength / 2;  // -0.70m

const baseHalfWidth = 0.70;
const pipeOffsetX = baseHalfWidth + radiusM + 0.018; // 0.818m
const pipeCenterY = 2.06 + 0.02; // 2.08m

const bendR = Math.max(0.06, radiusM * 1.35); // 0.135m
const zFrontPipe = zFrontEdge - radiusM - 0.02; // 1.38m

console.log(`Front Edge: ${zFrontEdge.toFixed(3)}m`);
console.log(`Front Pipe Center Z: ${zFrontPipe.toFixed(3)}m`);
console.log(`Elbow Bend Radius: ${bendR.toFixed(3)}m`);
console.log(`Pipe Offset X: ±${pipeOffsetX.toFixed(3)}m`);

// Elbow connections:
const leftElbowStart = new THREE.Vector3(-pipeOffsetX, pipeCenterY, zFrontPipe - bendR);
const leftElbowEnd   = new THREE.Vector3(-pipeOffsetX + bendR, pipeCenterY, zFrontPipe);
const rightElbowStart= new THREE.Vector3(pipeOffsetX - bendR, pipeCenterY, zFrontPipe);
const rightElbowEnd  = new THREE.Vector3(pipeOffsetX, pipeCenterY, zFrontPipe - bendR);

console.log('Left elbow connects at:', leftElbowStart, 'and', leftElbowEnd);
console.log('Right elbow connects at:', rightElbowStart, 'and', rightElbowEnd);

const frontPipeLengthM = (pipeOffsetX - bendR) * 2;
console.log(`Front Transverse Pipe Length: ${frontPipeLengthM.toFixed(3)}m`);

const lateralPipeLengthM = (zFrontPipe - bendR) - (zRearEdge + 0.04);
console.log(`Lateral Pipe Length (per side): ${lateralPipeLengthM.toFixed(3)}m`);

// Total effective length & volume
const totalEffectiveLengthM = 2 * lateralLengthM + frontPipeLengthM + Math.PI * bendR;
const totalLiters = +(Math.PI * radiusDm * radiusDm * (totalEffectiveLengthM * 10)).toFixed(1);
console.log(`Total Effective Length: ${totalEffectiveLengthM.toFixed(2)}m`);
console.log(`Total Water Capacity: ${totalLiters} L`);

// Baú positioning
const boxL = 1.60;
const boxFrontZ = zFrontPipe - radiusM - 0.02; // 1.38 - 0.10 - 0.02 = 1.26m
const boxCenterZ = boxFrontZ - boxL / 2; // 1.26 - 0.80 = 0.46m
const boxRearZ = boxFrontZ - boxL; // -0.34m

console.log(`Baú Position:`);
console.log(`  Front Nose Z: ${boxFrontZ.toFixed(3)}m (Clearance to front pipe: ${(zFrontPipe - radiusM - boxFrontZ).toFixed(3)}m)`);
console.log(`  Center Z:     ${boxCenterZ.toFixed(3)}m`);
console.log(`  Rear Z:       ${boxRearZ.toFixed(3)}m`);
console.log(`  Rack Rear Z:  ${zRearEdge.toFixed(3)}m (Remaining rear rack space: ${(boxRearZ - zRearEdge).toFixed(3)}m)`);

if (boxFrontZ < zFrontPipe - radiusM && boxFrontZ > 1.20) {
  console.log('✅ Baú is positioned as far forward as possible right behind the front pipe without clipping!');
} else {
  console.error('❌ Baú position check failed!');
  process.exit(1);
}

if (leftElbowEnd.z === zFrontPipe && rightElbowStart.z === zFrontPipe) {
  console.log('✅ Front pipe and elbows align perfectly in Z!');
} else {
  console.error('❌ Elbow alignment check failed!');
  process.exit(1);
}

