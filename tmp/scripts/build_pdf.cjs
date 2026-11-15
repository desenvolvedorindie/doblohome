const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('1. Exportando dados do modelo 3D (vite-node)...');
execSync('npx vite-node tmp/scripts/export_cutting_data.ts', { stdio: 'inherit' });

console.log('2. Gerando documento técnico vetorial em PDF (PyMuPDF)...');
execSync('python tmp/scripts/generate_cutting_pdf.py', { stdio: 'inherit' });

const srcPdf = path.resolve('plano_de_corte_doblo_solar.pdf');
const destPublic = path.resolve('public/plano_de_corte_doblo_solar.pdf');

if (fs.existsSync(srcPdf)) {
  fs.copyFileSync(srcPdf, destPublic);
  console.log(`3. PDF copiado com sucesso para: ${destPublic} (${(fs.statSync(srcPdf).size / 1024).toFixed(1)} KB)`);
}
