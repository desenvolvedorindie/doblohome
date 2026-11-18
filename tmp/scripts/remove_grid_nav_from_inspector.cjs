const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/components/planner/PlannerBoxInspector.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Regex to match from {/* Ajuste no Grid: Dimensões (Colunas/Linhas) e Posição */} up to right before {/* Acréscimo / Ajuste Fino
const regex = /\r?\n\s*\{\/\* Ajuste no Grid: Dimensões \(Colunas\/Linhas\) e Posição \*\/\}[\s\S]*?<\/div>\r?\n\s*<\/div>\r?\n(?=\s*\{\/\* Acréscimo \/ Ajuste Fino)/;

if (!regex.test(content)) {
  console.error('Regex pattern did not match!');
  process.exit(1);
}

content = content.replace(regex, '\n');

// Renumber Section 3 to Section 2 and add dimensions readout
content = content.replace(
  /<span>3\. Acréscimo Fino & Deslocamento \(Fora da Divisão Igual\):<\/span>/,
  '<span>2. Acréscimo Fino & Deslocamento (Fora da Divisão Igual):</span>'
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully removed Section 2 from PlannerBoxInspector.tsx');
