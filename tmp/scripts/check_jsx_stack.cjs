const fs = require('fs');

const content = fs.readFileSync('src/components/rightpanel/RightPanelWeightSection.tsx', 'utf8');
const lines = content.split('\n');

const stack = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const tagMatches = line.matchAll(/<(\/?)([a-zA-Z0-9_.-]+)(\s|>|\/)/g);
  for (const m of tagMatches) {
    const isClose = m[1] === '/';
    const tag = m[2];
    const isSelfClose = line.includes(`/>`); // approximate
    if (isClose) {
      const top = stack.pop();
      // console.log(`Line ${i+1}: close </${tag}>, popped <${top?.tag}> (from line ${top?.line})`);
    } else if (!line.includes(`/>`)) {
      stack.push({ tag, line: i + 1 });
    }
  }
}
console.log('Remaining open tags:', stack);
