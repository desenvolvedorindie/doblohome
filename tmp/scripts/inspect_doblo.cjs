const fs = require('fs');

const content = fs.readFileSync('public/assets/doblo.obj', 'utf-8');
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
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
    count++;
  }
}

console.log('Vertex count:', count);
console.log('X range (Raw):', minX, 'to', maxX, 'diff:', maxX - minX, 'center:', (minX + maxX)/2);
console.log('Y range (Raw):', minY, 'to', maxY, 'diff:', maxY - minY, 'center:', (minY + maxY)/2);
console.log('Z range (Raw):', minZ, 'to', maxZ, 'diff:', maxZ - minZ, 'center:', (minZ + maxZ)/2);

