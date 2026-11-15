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

for (const [name, vIndices] of Object.entries(groups)) {
  if (name.includes('Fiat_By_El')) {
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
    const cX = (minX + maxX) / 2;
    const cY = (minY + maxY) / 2;
    const cZ = (minZ + maxZ) / 2;
    console.log(name, 'cX:', cX.toFixed(1), 'cY:', cY.toFixed(1), 'cZ:', cZ.toFixed(1));
  }
}

