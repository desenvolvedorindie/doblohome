const fs = require('fs');

const content = fs.readFileSync('src/components/InternalBoxesPlanner.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('{/*') || line.includes('function ') || line.includes('const ') && line.includes('Modal') || line.includes('const ') && line.includes('Section') || line.includes('return (')) {
    if (line.trim().startsWith('{/*') || line.includes('return (') || line.includes('const ') && line.includes('Modal =')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
