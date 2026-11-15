const fs = require('fs');

const content = fs.readFileSync('src/three/InternalBoxesBuilder.ts', 'utf8');
const lines = content.split('\n');

for (let i = 460; i < 771; i++) {
  const line = lines[i];
  if (line.includes('(') && (line.includes('private ') || line.includes('static ') || line.includes('public '))) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
