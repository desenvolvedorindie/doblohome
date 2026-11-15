const fs = require('fs');
const path = require('path');

const objPath = path.resolve(__dirname, '../../assets/doblo.obj');
const content = fs.readFileSync(objPath, 'utf8');

const lines = content.split('\n');

// Find objects or groups with names containing light, farol, stop, glass, etc.
let currentObj = '';
const objBounds = {};

let vertices = [];

for (const line of lines) {
  if (line.startsWith('v ')) {
    const parts = line.trim().split(/\s+/);
    vertices.push({
      x: parseFloat(parts[1]),
      y: parseFloat(parts[2]),
      z: parseFloat(parts[3])
    });
  } else if (line.startsWith('g ') || line.startsWith('o ') || line.startsWith('usemtl ')) {
    currentObj = line.trim();
    if (!objBounds[currentObj]) {
      objBounds[currentObj] = { minZ: Infinity, maxZ: -Infinity, count: 0 };
    }
  } else if (line.startsWith('f ')) {
    if (!objBounds[currentObj]) {
      objBounds[currentObj] = { minZ: Infinity, maxZ: -Infinity, count: 0 };
    }
    const parts = line.trim().split(/\s+/).slice(1);
    for (const p of parts) {
      const vIdx = parseInt(p.split('/')[0]) - 1;
      const v = vertices[vIdx];
      if (v) {
        // Transformed Z in three.js: (v.y - (-343.13)) * 0.001
        const threeZ = (v.y - (-343.13)) * 0.001;
        objBounds[currentObj].minZ = Math.min(objBounds[currentObj].minZ, threeZ);
        objBounds[currentObj].maxZ = Math.max(objBounds[currentObj].maxZ, threeZ);
        objBounds[currentObj].count++;
      }
    }
  }
}

for (const [name, b] of Object.entries(objBounds)) {
  if (name.toLowerCase().includes('light') || name.toLowerCase().includes('farol') || name.toLowerCase().includes('stop') || name.toLowerCase().includes('glass') || name.toLowerCase().includes('bumper') || name.toLowerCase().includes('capo') || name.toLowerCase().includes('hood')) {
    console.log(name, '-> Three.js Z range:', b.minZ.toFixed(2), 'to', b.maxZ.toFixed(2));
  }
}

