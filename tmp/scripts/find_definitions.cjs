const fs = require('fs');

const content = fs.readFileSync('src/three/InternalBoxesBuilder.ts', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.trim().startsWith('private ') || l.trim().startsWith('public ') || l.trim().startsWith('static ')) {
    if (l.includes('(')) {
      console.log(`${idx + 1}: ${l.trim()}`);
    }
  }
});
