const fs = require('fs');

const insp = fs.readFileSync('src/components/planner/PlannerBoxInspector.tsx', 'utf8');
const lines = insp.split('\n');
console.log('Total lines:', lines.length);
lines.slice(340).forEach((l, idx) => {
  console.log(`${idx + 341}: ${l}`);
});
