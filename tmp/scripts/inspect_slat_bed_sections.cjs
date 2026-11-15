const fs = require('fs');

const content = fs.readFileSync('src/three/InternalBoxesBuilder.ts', 'utf8');
const lines = content.split('\n');

for (let i = 1276; i < 2004; i++) {
  const line = lines[i];
  if (line.includes('// ---') || line.includes('// 1.') || line.includes('// 2.') || line.includes('// 3.') || line.includes('// 4.') || line.includes('// 5.')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
