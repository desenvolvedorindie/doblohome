const fs = require('fs');
const path = require('path');

const objPath = path.resolve(__dirname, '../../assets/doblo.obj');
const content = fs.readFileSync(objPath, 'utf8');

const lines = content.split('\n');
let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
let minZ = Infinity, maxZ = -Infinity;

let count = 0;
for (const line of lines) {
  if (line.startsWith('v ')) {
    const parts = line.trim().split(/\s+/);
    const x = parseFloat(parts[1]);
    const y = parseFloat(parts[2]);
    const z = parseFloat(parts[3]);
    if (!isNaN(x)) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
      count++;
    }
  }
}

console.log('Total vertices:', count);
console.log('Original mm:');
console.log('X:', minX, 'to', maxX, 'span:', maxX - minX);
console.log('Y:', minY, 'to', maxY, 'span:', maxY - minY);
console.log('Z:', minZ, 'to', maxZ, 'span:', maxZ - minZ);

// Now apply the transform from DobloModel.ts:
// pos.setXYZ(i, (x_sk - offsetX) * scale, (z_sk - offsetZ) * scale, (y_sk - offsetY) * scale);
const scale = 0.001;
const offsetX = 11424.40;
const offsetY = -343.13;
const offsetZ = 2.75;

const tMinX = (minX - offsetX) * scale;
const tMaxX = (maxX - offsetX) * scale;
const tMinY = (minZ - offsetZ) * scale;
const tMaxY = (maxZ - offsetZ) * scale;
const tMinZ = (minY - offsetY) * scale;
const tMaxZ = (maxY - offsetY) * scale;

console.log('\nTransformed Three.js coords (meters):');
console.log('X (width):', tMinX.toFixed(2), 'to', tMaxX.toFixed(2));
console.log('Y (height):', tMinY.toFixed(2), 'to', tMaxY.toFixed(2));
console.log('Z (length):', tMinZ.toFixed(2), 'to', tMaxZ.toFixed(2));
