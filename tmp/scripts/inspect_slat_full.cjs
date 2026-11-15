const fs = require('fs');

const sb = fs.readFileSync('src/components/planner/PlannerSlatBedSection.tsx', 'utf8');
const lines = sb.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('{/*') || l.includes('selectedBox.type') || l.includes('useSolar')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
