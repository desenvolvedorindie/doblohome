const fs = require('fs');

const content = fs.readFileSync('public/assets/doblo.obj', 'utf-8');
const lines = content.split('\n');

let currentGroup = '';
let currentMat = '';
const matches = [];

for (const line of lines) {
  if (line.startsWith('g ') || line.startsWith('o ')) {
    currentGroup = line.trim();
    if (currentGroup.toLowerCase().includes('volante') || currentGroup.toLowerCase().includes('banco') || currentGroup.toLowerCase().includes('salon') || currentGroup.toLowerCase().includes('painel') || currentGroup.toLowerCase().includes('porta') || currentGroup.toLowerCase().includes('espelho') || currentGroup.toLowerCase().includes('retrovisor')) {
      matches.push(currentGroup);
    }
  }
}

console.log('Matching groups:', [...new Set(matches)].slice(0, 50));

