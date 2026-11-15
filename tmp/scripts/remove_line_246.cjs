const fs = require('fs');

let cl = fs.readFileSync('src/components/planner/PlannerCeilingLighting.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = cl.split('\n');
// remove line 246 (index 245)
lines.splice(245, 1);
fs.writeFileSync('src/components/planner/PlannerCeilingLighting.tsx', lines.join('\n'));

console.log('Removed line 246!');
