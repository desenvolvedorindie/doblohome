const fs = require('fs');

const orig = fs.readFileSync('src/components/planner/PlannerSlatBedSection.tsx', 'utf8');
const lines = orig.split('\n');
console.log('Total lines:', lines.length);
lines.forEach((l, idx) => {
  if (l.includes('{/*') || l.includes('selectedBox.type') || l.includes('return') || l.includes('export')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
