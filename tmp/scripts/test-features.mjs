import * as THREE from 'three';

console.log('Testing Upper Cabinet & Mattress & Slide Tray geometry...');

const floorY = 0.48;
const CEILING_Y = 1.72;
const boxWM = 0.45;
const boxLM = 0.85;
const boxHM = 0.40;

const boxTopY = floorY + boxHM; // 0.88
const cabinetH = Math.max(0.20, CEILING_Y - boxTopY); // 0.84
const upperDepthM = 0.26; // 260mm

console.log('Base box top Y:', boxTopY);
console.log('Cabinet height:', cabinetH * 1000, 'mm');
console.log('Cabinet top Y:', boxTopY + cabinetH, 'Matches CEILING_Y?', boxTopY + cabinetH === CEILING_Y);
console.log('Free countertop length in front:', (boxLM - upperDepthM) * 1000, 'mm');

// Test Slide Tray
const isSlideTray = true;
const trayLipH = 0.05; // 50mm lip
console.log('Slide tray lip height:', trayLipH * 1000, 'mm');

// Test Mattress Unfolded
const slatBedW = 0.60;
const slatBedL = 1.70;
const extRatio = 0.85; // 85% extension
const fullExtendedW = slatBedW * (1 + extRatio);
console.log('Bed full open width:', fullExtendedW * 1000, 'mm', 'x', slatBedL * 1000, 'mm');

