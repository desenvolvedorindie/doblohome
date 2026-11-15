const fs = require('fs');

const content = fs.readFileSync('src/components/RightPanel.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('activeTab') || line.includes('{/*') || line.includes('function ') || line.includes('const [tab') || line.includes('<div className="right-panel') || line.includes('<header') || line.includes('<nav')) {
    if (line.trim().startsWith('{/*') || line.includes('activeTab ===') || line.includes('tab ===')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
