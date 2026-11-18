const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/three/boxes/SlatBedMattressBuilder.ts');
let content = fs.readFileSync(targetPath, 'utf8');

const targetStr = '    const parts = box.mattressParts ?? 2;\n    const topOfSlatsY = h / 2;';
const replacementStr = '    const parts = box.mattressParts ?? 2;\n    const isHinged = box.bedMode === \'hinged\';\n    const topOfSlatsY = (isHinged && !isExtended) ? (h / 2 + slatT) : (h / 2);';

if (!content.includes(targetStr)) {
  console.error('Target string not found in SlatBedMattressBuilder.ts');
  process.exit(1);
}

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated SlatBedMattressBuilder.ts!');
