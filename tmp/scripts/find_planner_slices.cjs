const fs = require('fs');

const lines = fs.readFileSync('src/components/InternalBoxesPlanner.tsx', 'utf8').split('\n');

function findLine(str, start = 0) {
  for (let i = start; i < lines.length; i++) {
    if (lines[i].includes(str)) return i + 1;
  }
  return -1;
}

console.log('Modal start:', findLine('{/* Modal de Confirmação'));
console.log('Modal end:', findLine('{/* 1. Barra de Ações'));
console.log('Grid start:', findLine('{/* 2. Grid Interativo'));
console.log('Inspector start:', findLine('{/* 3. Editor e Inspetor'));
console.log('Slat bed start:', findLine('{/* Configuração Exclusiva para Cama Retrátil com Ripas'));
console.log('Slat bed end:', findLine('{/* Tamponamento & Fechamento'));
console.log('Dinette start:', findLine('{/* Opção de Mesa Central Dinette'));
console.log('Dinette end:', findLine('{/* Opção de Decoração em Madeira'));
console.log('Rear table start:', findLine('{/* Opção de Decoração em Madeira'));
console.log('Rear table end:', findLine('{/* Opção de Armário Aéreo'));
console.log('Upper cabinet start:', findLine('{/* Opção de Armário Aéreo'));
console.log('Upper cabinet end:', findLine('{/* 4. Configuração Paramétrica das Divisórias'));
console.log('Grid config start:', findLine('{/* 4. Configuração Paramétrica das Divisórias'));
console.log('Ceiling start:', findLine('{/* 5. Teto & Forro do Campervan'));
console.log('Ceiling end:', lines.length);
