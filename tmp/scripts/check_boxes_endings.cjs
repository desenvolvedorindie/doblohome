const fs = require('fs');
const path = require('path');

const files = [
  'UpperCabinetTransverseBuilder.ts',
  'UpperCabinetLongitudinalBuilder.ts',
  'UpperCabinetBuilder.ts',
  'SlatBedMattressBuilder.ts',
  'CeilingLedBuilder.ts'
];

files.forEach(f => {
  const p = path.join('src/three/boxes', f);
  const content = fs.readFileSync(p, 'utf8');
  const lines = content.split('\n');
  console.log(`=== ${f} (lines: ${lines.length}) ===`);
  console.log(lines.slice(-15).join('\n'));
});
