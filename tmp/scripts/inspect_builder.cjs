const fs = require('fs');

const content = fs.readFileSync('src/three/InternalBoxesBuilder.ts', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('export class') || line.includes('class ') || line.includes('function ') || (line.includes('build') && line.includes('('))) {
    if (line.trim().startsWith('public ') || line.trim().startsWith('private ') || line.trim().startsWith('export ')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
console.log(`Total lines: ${lines.length}`);
