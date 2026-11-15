const fs = require('fs');

const lines = fs.readFileSync('src/components/InternalBoxesPlanner.tsx', 'utf8').split('\n');

for (let i = 2323; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('{/* 1.') || line.includes('{/* 2.') || line.includes('{/* 3.') || line.includes('{/* 4.') || line.includes('{/* 5.')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
