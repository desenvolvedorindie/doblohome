import * as THREE from 'three';

console.log('Testing Upper Cabinet Dimensions & Alignment...');

const FLOOR_Y = 0.48;
const CEILING_Y = 1.72;
const boxHM = 0.40;
const boxLM = 0.80;
const boxWM = 0.40;

const boxTopY = FLOOR_Y + boxHM;
const upperH = CEILING_Y - boxTopY; // 0.84m (840mm)
const upperDepth = 0.25; // 250mm depth
const freeCounterDepth = boxLM - upperDepth; // 0.55m (550mm free counter)

console.log('Upper Cabinet Height:', upperH * 1000, 'mm');
console.log('Free Countertop in front:', freeCounterDepth * 1000, 'mm');
console.log('Top of cabinet Y:', boxTopY + upperH, 'vs CEILING_Y:', CEILING_Y);

