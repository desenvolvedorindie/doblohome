const fs = require('fs');
const path = require('path');

const objPath = path.resolve(__dirname, '../../assets/doblo.obj');
const content = fs.readFileSync(objPath, 'utf8');

const lines = content.split('\n');
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
      objBounds[currentObj] = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
    }
  } else if (line.startsWith('f ')) {
    if (!objBounds[currentObj]) {
      objBounds[currentObj] = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
    }
    const parts = line.trim().split(/\s+/).slice(1);
    for (const p of parts) {
      const vIdx = parseInt(p.split('/')[0]) - 1;
      const v = vertices[vIdx];
      if (v) {
        // Transformed in three.js:
        const threeX = (v.x - 11424.40) * 0.001;
        const threeZ = (v.y - (-343.13)) * 0.001;
        objBounds[currentObj].minX = Math.min(objBounds[currentObj].minX, threeX);
        objBounds[currentObj].maxX = Math.max(objBounds[currentObj].maxX, threeX);
        objBounds[currentObj].minZ = Math.min(objBounds[currentObj].minZ, threeZ);
        objBounds[currentObj].maxZ = Math.max(objBounds[currentObj].maxZ, threeZ);
      }
    }
  }
}

for (const [name, b] of Object.entries(objBounds)) {
  const n = name.toLowerCase();
  if (n.includes('volante') || n.includes('wheel') || n.includes('steer') || n.includes('banco') || n.includes('seat') || n.includes('retrovisor') || n.includes('espelho') || n.includes('mirror') || n.includes('door') || n.includes('porta')) {
    console.log(name, '-> Three.js X:', b.minX.toFixed(2), 'to', b.maxX.toFixed(2), 'Z:', b.minZ.toFixed(2), 'to', b.maxZ.toFixed(2));
  }
}

