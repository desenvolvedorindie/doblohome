import * as THREE from 'three';
import { MaterialLibrary } from '../../src/three/Materials';
import { TextureGenerator } from '../../src/three/Textures';
import { QuarterArcCurve } from '../../src/three/power/WaterTankPipesBuilder';

console.log('Testing QuarterArcCurve front and rear:');
const bendR = 0.135;
const pipeOffsetX = 0.56;
const zFrontPipe = 0.96;
const zRearPipe = -0.96;

const leftElbowFront = new QuarterArcCurve(-pipeOffsetX + bendR, zFrontPipe - bendR, bendR, Math.PI / 2, Math.PI);
console.log('Front Left start (t=0):', leftElbowFront.getPoint(0));
console.log('Front Left end (t=1):', leftElbowFront.getPoint(1));

const leftElbowRear = new QuarterArcCurve(-pipeOffsetX + bendR, zRearPipe + bendR, bendR, -Math.PI / 2, -Math.PI);
console.log('Rear Left start (t=0):', leftElbowRear.getPoint(0));
console.log('Rear Left end (t=1):', leftElbowRear.getPoint(1));

const rightElbowRear = new QuarterArcCurve(pipeOffsetX - bendR, zRearPipe + bendR, bendR, -Math.PI / 2, 0);
console.log('Rear Right start (t=0):', rightElbowRear.getPoint(0));
console.log('Rear Right end (t=1):', rightElbowRear.getPoint(1));
