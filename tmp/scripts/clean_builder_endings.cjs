const fs = require('fs');
const path = require('path');

const outDir = 'src/three/boxes';

// 1. CeilingLedBuilder.ts
let clb = fs.readFileSync(path.join(outDir, 'CeilingLedBuilder.ts'), 'utf8').replace(/\r\n/g, '\n');
clb = clb.trimEnd();
if (clb.endsWith('}\n}')) {
  clb = clb.slice(0, -2); // remove extra }
}
fs.writeFileSync(path.join(outDir, 'CeilingLedBuilder.ts'), clb + '\n');

// 2. SlatBedMattressBuilder.ts
let smb = fs.readFileSync(path.join(outDir, 'SlatBedMattressBuilder.ts'), 'utf8').replace(/\r\n/g, '\n');
const smbCut = smb.indexOf('  /**\n   * Constrói o painel decorativo');
if (smbCut !== -1) {
  smb = smb.slice(0, smbCut) + '}\n';
  fs.writeFileSync(path.join(outDir, 'SlatBedMattressBuilder.ts'), smb);
}

// 3. UpperCabinetLongitudinalBuilder.ts
let ucl = fs.readFileSync(path.join(outDir, 'UpperCabinetLongitudinalBuilder.ts'), 'utf8').replace(/\r\n/g, '\n');
const uclCut = ucl.indexOf('  /**\n   * Constrói a Mesa Dinette');
if (uclCut !== -1) {
  ucl = ucl.slice(0, uclCut) + '}\n';
  fs.writeFileSync(path.join(outDir, 'UpperCabinetLongitudinalBuilder.ts'), ucl);
}

// 4. UpperCabinetTransverseBuilder.ts
let uct = fs.readFileSync(path.join(outDir, 'UpperCabinetTransverseBuilder.ts'), 'utf8').replace(/\r\n/g, '\n');
const uctCut = uct.indexOf('        }\n      } else {\n  }\n}');
if (uctCut !== -1) {
  uct = uct.slice(0, uctCut) + '        }\n      }\n  }\n}\n';
  fs.writeFileSync(path.join(outDir, 'UpperCabinetTransverseBuilder.ts'), uct);
}

console.log('Cleaned endings for all 4 builders!');
