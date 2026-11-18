const path = require('path');
const fs = require('fs');

const woodUtilsPath = path.resolve('src/utils/woodUtils.ts');
let code = fs.readFileSync(woodUtilsPath, 'utf8');

const oldTarget = `      const rawLabel = String(obj.userData.partLabel || obj.userData.name || \`\${isUpholstery ? 'Almofada Colchão' : 'Chapa'} \${woodMaterial} \${thicknessMm}mm\`)
        .replace(/\\s*\\(#\\d+\\)/g, '')
        .trim();`;

const newTarget = `      let rawLabel = String(obj.userData.partLabel || obj.userData.name || \`\${isUpholstery ? 'Almofada Colchão' : 'Chapa'} \${woodMaterial} \${thicknessMm}mm\`)
        .replace(/\\s*\\(#\\d+\\)/g, '')
        .replace(/\\s+#\\d+/g, '')
        .trim();

      if (partType === 'slat' && (rawLabel.includes('Ripa Fixa') || rawLabel.includes('ripa fixa'))) {
        rawLabel = moduleName ? \`\${moduleName} • Ripa Fixa do Estrado (\${lengthMm}×\${widthMm}×\${thicknessMm}mm)\` : \`Ripa Fixa do Estrado (\${lengthMm}×\${widthMm}×\${thicknessMm}mm)\`;
      } else if (partType === 'slat' && (rawLabel.includes('Ripa Móvel') || rawLabel.includes('ripa móvel') || rawLabel.includes('Ripa Movel'))) {
        rawLabel = moduleName ? \`\${moduleName} • Ripa Móvel do Estrado (\${lengthMm}×\${widthMm}×\${thicknessMm}mm)\` : \`Ripa Móvel do Estrado (\${lengthMm}×\${widthMm}×\${thicknessMm}mm)\`;
      } else if (partType === 'leg') {
        rawLabel = moduleName ? \`\${moduleName} • Pé de Apoio Articulado (\${lengthMm}×\${widthMm}×\${thicknessMm}mm)\` : \`Pé de Apoio Articulado (\${lengthMm}×\${widthMm}×\${thicknessMm}mm)\`;
      }`;

if (!code.includes(oldTarget)) {
  console.error('Could not find oldTarget in woodUtils.ts');
  process.exit(1);
}
code = code.replace(oldTarget, newTarget);
fs.writeFileSync(woodUtilsPath, code, 'utf8');
console.log('woodUtils.ts updated successfully');
