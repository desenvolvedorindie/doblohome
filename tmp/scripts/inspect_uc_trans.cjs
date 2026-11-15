const fs = require('fs');

const orig = fs.readFileSync('src/three/boxes/UpperCabinetTransverseBuilder.ts', 'utf8');
const lines = orig.split('\n');
console.log('Transverse lines:', lines.length);
lines.slice(390).forEach((l, idx) => console.log(`${idx + 391}: ${l}`));
