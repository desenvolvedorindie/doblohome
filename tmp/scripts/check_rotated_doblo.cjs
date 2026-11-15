const fs = require('fs');
const path = require('path');

const objPath = path.resolve(__dirname, '../../assets/doblo.obj');
const content = fs.readFileSync(objPath, 'utf8');

const lines = content.split('\n');

const scale = 0.001;
const offsetX = 11424.40;
const offsetY = -343.13;
const offsetZ = 2.75;

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
let minZ = Infinity, maxZ = -Infinity;

// With rotation by Math.PI around Y:
// x' = -x
// z' = -z
// y' = y

for (const line of lines) {
  if (line.startsWith('v ')) {
    const parts = line.trim().split(/\s+/);
    const x0 = (parseFloat(parts[1]) - offsetX) * scale;
    const y0 = (parseFloat(parts[3]) - offsetZ) * scale;
    const z0 = (parseFloat(parts[2]) - offsetY) * scale;

    const x = -x0;
    const y = y0;
    const z = -z0;

    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
}

console.log('Rotated 180 deg (Math.PI around Y):');
console.log('X (width):', minX.toFixed(3), 'to', maxX.toFixed(3));
console.log('Y (height):', minY.toFixed(3), 'to', maxY.toFixed(3));
console.log('Z (length):', minZ.toFixed(3), 'to', maxZ.toFixed(3));

// Check Farol (headlights) and Stop (taillights):
// Originally Farol was at z0 = -1.85 -> now z = -(-1.85) = +1.85 (FRONT!)
// Originally Stop was at z0 = +2.20 -> now z = -(+2.20) = -2.20 (REAR / TRUNK!)
console.log('Headlights (Farol): Z = +1.85 (Front, facing positive Z)');
console.log('Taillights (Stop): Z = -2.20 (Rear, facing negative Z)');

