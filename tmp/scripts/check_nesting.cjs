const fs = require('fs');

const content = fs.readFileSync('src/components/rightpanel/RightPanelWeightSection.tsx', 'utf8');
const lines = content.split('\n');

let depth = 0;
lines.forEach((line, idx) => {
  const opens = (line.match(/<([a-zA-Z][a-zA-Z0-9]*)/g) || []).filter(t => !line.includes('/>') && !t.startsWith('<!--'));
  // rough check
  if (line.includes('cargo-box-panel') || line.includes('RightPanelWeightChips') || line.includes('</>')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
