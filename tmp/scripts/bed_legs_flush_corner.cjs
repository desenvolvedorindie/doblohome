const fs = require('fs');
const path = require('path');
const p = path.resolve(__dirname, '../../src/three/boxes/SlatBedBuilder.ts');
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
let n = 0;
const rep = (re, to) => { const b = s; s = s.replace(re, to); if (s !== b) n++; };

// Cama dobrável: pés encostados na quina (sem folga)
rep(/const cornerGap = Math\.max\(0, Math\.min\(0\.025, \(leafW - legSize\) \/ 2, \(l - 2 \* legSize\) \/ 2\)\);/,
    'const cornerGap = 0; // pés encostados na quina, sem espaçamento');
rep(/const cornerGap = Math\.max\(0, Math\.min\(0\.025, \(leafL - legSize\) \/ 2, \(w - 2 \* legSize\) \/ 2\)\);/,
    'const cornerGap = 0; // pés encostados na quina, sem espaçamento');

// Cama de ripas - abertura lateral
rep(/const legZ1 = -l \/ 2 \+ Math\.min\(0\.08, l \* 0\.15\);\n(\s+)const legZ2 = l \/ 2 - Math\.min\(0\.08, l \* 0\.15\);/,
    `const legZ1 = -l / 2 + 0.035 / 2; // encostado na quina\n$1const legZ2 = l / 2 - 0.035 / 2;\n$1const legCornerX = direction === 'left' ? (w / 2 - 0.035 / 2) : (-w / 2 + 0.035 / 2);`);
rep(/outerX,\n(\s+)legY,\n(\s+)legZ1,/, 'legCornerX,\n$1legY,\n$2legZ1,');
rep(/outerX,\n(\s+)legY,\n(\s+)legZ2,/, 'legCornerX,\n$1legY,\n$2legZ2,');

// Cama de ripas - abertura longitudinal
s = s.replace(/const legX1 = -w \/ 2 \+ Math\.min\(0\.08, w \* 0\.15\);/, 'const legX1 = -w / 2 + 0.035 / 2; // encostado na quina');
s = s.replace(/const legX2 = w \/ 2 - Math\.min\(0\.08, w \* 0\.15\);\n(\s+)addPanel\(\n(\s+)mobileGroup,/,
  `const legX2 = w / 2 - 0.035 / 2;\n$1const legCornerZ = direction === 'front' ? (l / 2 - 0.035 / 2) : (-l / 2 + 0.035 / 2);\n$1addPanel(\n$2mobileGroup,`);
rep(/legX1,\n(\s+)legY,\n(\s+)outerZ,/, 'legX1,\n$1legY,\n$2legCornerZ,');
rep(/legX2,\n(\s+)legY,\n(\s+)outerZ,/, 'legX2,\n$1legY,\n$2legCornerZ,');

fs.writeFileSync(p, s, 'utf8');
console.log('replacements:', n);
