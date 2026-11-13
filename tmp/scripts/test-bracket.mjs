import * as THREE from 'three';

console.log('Testing 20-inch Folding Bracket Geometry...');

const pivotY = 0.18;
const faceZ = -0.40;
const shelfH = 0.35; // 350mm shelf depth

// 1. Vertical mount: 170mm high
const vertH = 0.170;
const vertY = pivotY - vertH / 2;
const vertZ = faceZ - 0.003;

// 2. Horizontal arm: 500mm max, or shelf depth
const armL = Math.min(0.50, shelfH * 0.95);
const armY = pivotY - 0.004;
const armZ = faceZ - armL / 2;

// 3. Diagonal strut: 250mm
// Joint on vertical mount: 140mm below pivot
const jointVertY = pivotY - 0.140;
const jointVertZ = faceZ - 0.005;

// Joint on horizontal arm: 207mm along arm
const jointArmY = pivotY - 0.008;
const jointArmZ = faceZ - 0.207;

const dy = jointArmY - jointVertY; // 0.132
const dz = jointVertZ - jointArmZ; // 0.202
const strutLen = Math.hypot(dy, dz); // ~0.241m = ~245mm - 250mm
const strutAngle = Math.atan2(dz, dy); // angle from vertical towards -Z

console.log('Strut length calculated:', strutLen * 1000, 'mm (spec is 250mm)');
console.log('Strut angle from vertical:', strutAngle * 180 / Math.PI, 'degrees');

