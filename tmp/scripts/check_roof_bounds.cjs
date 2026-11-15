const fs = require('fs');

const content = fs.readFileSync('public/assets/doblo.obj', 'utf-8');
const lines = content.split('\n');

const scale = 0.001;
const offsetX = 11424.40;
const offsetY = -343.13;
const offsetZ = 2.75;

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
let minZ = Infinity, maxZ = -Infinity;

for (const line of lines) {
  if (line.startsWith('v ')) {
    const parts = line.trim().split(/\s+/);
    const x_sk = parseFloat(parts[1]);
    const y_sk = parseFloat(parts[2]);
    const z_sk = parseFloat(parts[3]);

    const x = (x_sk - offsetX) * scale;
    const y = (z_sk - offsetZ) * scale;
    const z = -(y_sk - offsetY) * scale;

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
}

console.log('Bounding box with -(y_sk - offsetY):');
console.log('X (width):', minX.toFixed(3), 'to', maxX.toFixed(3), 'center:', ((minX + maxX) / 2).toFixed(3));
console.log('Y (height):', minY.toFixed(3), 'to', maxY.toFixed(3), 'center:', ((minY + maxY) / 2).toFixed(3));
console.log('Z (length):', minZ.toFixed(3), 'to', maxZ.toFixed(3), 'center:', ((minZ + maxZ) / 2).toFixed(3));
