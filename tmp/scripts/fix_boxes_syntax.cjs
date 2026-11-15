const fs = require('fs');
const path = require('path');

const outDir = 'src/three/boxes';

// 1. BoxGeometryHelpers.ts
let bgh = fs.readFileSync(path.join(outDir, 'BoxGeometryHelpers.ts'), 'utf8');
bgh = bgh.replace(/static getUpperCabinetExclusionZones/g, 'export function getUpperCabinetExclusionZones');
bgh = bgh.replace(/static createPerforatedGeometry/g, 'export function createPerforatedGeometry');
bgh = bgh.replace(/private addPerforatedPanel/g, 'export function addPerforatedPanel');
bgh = bgh.replace(/private addPanel/g, 'export function addPanel');
fs.writeFileSync(path.join(outDir, 'BoxGeometryHelpers.ts'), bgh);

console.log('Fixed BoxGeometryHelpers.ts keywords');
