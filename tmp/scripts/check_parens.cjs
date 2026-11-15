const fs = require('fs');

function checkParen(f) {
  const content = fs.readFileSync(f, 'utf8');
  const stack = [];
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    for (let c of l) {
      if (c === '(' || c === '{' || c === '[') stack.push({ c, line: i + 1 });
      if (c === ')' || c === '}' || c === ']') {
        const top = stack.pop();
        const expected = c === ')' ? '(' : c === '}' ? '{' : '[';
        if (!top || top.c !== expected) {
          console.log(`${f}:${i + 1} Mismatch: saw ${c}, expected close of ${top?.c} (from line ${top?.line})`);
        }
      }
    }
  });
  console.log(`${f} remaining open:`, stack);
}

checkParen('src/three/boxes/UpperCabinetBuilder.ts');
checkParen('src/three/boxes/UpperCabinetLongitudinalBuilder.ts');
