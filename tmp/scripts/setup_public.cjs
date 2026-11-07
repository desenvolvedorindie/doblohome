const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', '..', 'assets');
const destDir = path.join(__dirname, '..', '..', 'public', 'assets');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.cpSync(srcDir, destDir, { recursive: true });
console.log('✅ Assets copiados com sucesso para public/assets');

