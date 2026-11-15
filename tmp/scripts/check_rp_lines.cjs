const fs = require('fs');

const lines = fs.readFileSync('src/components/RightPanel.tsx', 'utf8').split('\n');
[321, 395, 476, 740, 885, 1094, 1690, 1807, 2320].forEach(n => {
  console.log(`Line ${n}: ${lines[n-1]?.trim().slice(0, 80)}`);
});
