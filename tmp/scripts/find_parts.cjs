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
  } else if (line.startsWith('usemtl ')) {
    const mat = line.trim();
    if (!groups[currentGroup]) groups[currentGroup] = { mat, vIndices: [] };
  } else if (line.startsWith('f ')) {
    if (!groups[currentGroup]) groups[currentGroup] = { mat: '', vIndices: [] };
    const parts = line.trim().split(/\s+/).slice(1);
    for (const p of parts) {
      const vIdx = parseInt(p.split('/')[0]) - 1;
      groups[currentGroup].vIndices.push(vIdx);
    }
  }
}

console.log('Total groups:', Object.keys(groups).length);

// Let's analyze groups by material or position
for (const [name, data] of Object.entries(groups)) {
  if (data.vIndices.length === 0) continue;
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (const idx of data.vIndices) {
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
  // If mat has light or wheel or glass
  if (data.mat.toLowerCase().includes('light') || data.mat.toLowerCase().includes('farol') || data.mat.toLowerCase().includes('wheel') || data.mat.toLowerCase().includes('stop') || data.mat.toLowerCase().includes('salon')) {
    console.log(name, data.mat, 'center X:', cX.toFixed(1), 'Y (length):', cY.toFixed(1), 'Z (height):', cZ.toFixed(1));
  }
}

