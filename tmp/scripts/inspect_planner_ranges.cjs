const fs = require('fs');

const lines = fs.readFileSync('src/components/InternalBoxesPlanner.tsx', 'utf8').split('\n');

const markers = [
  'Modal de Confirmação para Limpar e Aplicar Presets',
  '1. Barra de Ações Rápidas e Presets',
  '2. Grid Interativo do Assoalho',
  '3. Editor e Inspetor da Caixa Selecionada',
  'Configuração Exclusiva para Cama Retrátil com Ripas',
  'Opção de Mesa Central Dinette',
  'Opção de Decoração em Madeira na Face Traseira',
  'Opção de Armário Aéreo de Quina',
  '4. Configuração Paramétrica das Divisórias do Grid',
  '5. Teto & Forro do Campervan'
];

markers.forEach(m => {
  const idx = lines.findIndex(l => l.includes(m));
  console.log(`${idx + 1}: ${m}`);
});
console.log(`Total lines: ${lines.length}`);
