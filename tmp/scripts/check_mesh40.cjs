const fs = require('fs');

const content = fs.readFileSync('public/assets/doblo.obj', 'utf-8');
const lines = content.split('\n');

let currentGroup = '';
const groups = {};
let vertices = [];

for (const line of lines) {
  if (line.startsWith('v ')) {
    const parts = line.trim().split(/\s+/);
    vertices.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
  } else if (line.startsWith('g ') || line.startsWith('o ')) {
    currentGroup = line.trim();
  } else if (line.startsWith('f ')) {
    if (!groups[currentGroup]) groups[currentGroup] = [];
    const parts = line.trim().split(/\s+/).slice(1);
    for (const p of parts) {
      const vIdx = parseInt(p.split('/')[0]) - 1;
      groups[currentGroup].push(vIdx);
    }
  }
}

for (const name of ['g Mesh40 salon1 Group1 Carro1 Model', 'g Mesh41 salon1 Group1 Carro1 Model']) {
  const vIndices = groups[name];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (const idx of vIndices) {
    const [x, y, z] = vertices[idx];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  console.log(name);
  console.log('X:', minX.toFixed(1), 'to', maxX.toFixed(1), 'diff:', (maxX - minX).toFixed(1));
  console.log('Y:', minY.toFixed(1), 'to', maxY.toFixed(1), 'diff:', (maxY - minY).toFixed(1));
  console.log('Z:', minZ.toFixed(1), 'to', maxZ.toFixed(1), 'diff:', (maxZ - minZ).toFixed(1));
}

