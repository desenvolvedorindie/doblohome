const fs = require('fs');

const cs = fs.readFileSync('src/components/planner/PlannerCeilingSection.tsx', 'utf8');
const lines = cs.split('\n');
console.log('Total lines:', lines.length);
lines.forEach((l, idx) => {
  if (l.includes('{/*') || l.includes('PlannerCeiling') || l.includes('return') || l.includes('export')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
