const fs = require('fs');

const cl = fs.readFileSync('src/components/planner/PlannerCeilingLighting.tsx', 'utf8');
const lines = cl.split('\n');

const stack = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('<div')) {
    stack.push(i + 1);
  }
  if (line.includes('</div>')) {
    const popped = stack.pop();
    if (!popped) {
      console.log(`Extra close at line ${i + 1}`);
    }
  }
}
console.log('Open tags left:', stack);
