const fs = require('fs');

const content = fs.readFileSync('public/assets/doblo.obj', 'utf-8');
const lines = content.split('\n');

const scale = 0.001;
const offsetX = 11424.40;
const offsetY = -343.13;
const offsetZ = 2.75;

let roofMinZ = Infinity, roofMaxZ = -Infinity;

for (const line of lines) {
  if (line.startsWith('v ')) {
    const parts = line.trim().split(/\s+/);
    const x_sk = parseFloat(parts[1]);
    const y_sk = parseFloat(parts[2]);
    const z_sk = parseFloat(parts[3]);

    const y = (z_sk - offsetZ) * scale;
    const z = -(y_sk - offsetY) * scale;

    if (y > 1.75) {
      if (z < roofMinZ) roofMinZ = z;
      if (z > roofMaxZ) roofMaxZ = z;
    }
  }
}

console.log('Roof Z range (Y > 1.75m):', roofMinZ.toFixed(3), 'to', roofMaxZ.toFixed(3), 'center:', ((roofMinZ + roofMaxZ)/2).toFixed(3), 'length:', (roofMaxZ - roofMinZ).toFixed(3));

