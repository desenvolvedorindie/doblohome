const fs = require('fs');

const content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('<h2') || line.includes('<h3') || line.includes('<details') || line.includes('id=') || line.includes('{/*')) {
    if (line.trim().startsWith('{/*') || line.includes('<h2') || line.includes('<h3')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
