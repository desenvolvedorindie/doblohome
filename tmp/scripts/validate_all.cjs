const fs = require('fs');

const files = [
  'js/textures.js',
  'js/materials.js',
  'js/aluminumExtrusion.js',
  'js/doblo.js',
  'js/solarSystem.js',
  'js/solarSim.js',
  'js/audio.js',
  'js/app.js'
];

let allOk = true;
files.forEach(f => {
  try {
    const code = fs.readFileSync(f, 'utf8');
    // Checa sintaxe usando o compilador nativo do Node
    new Function(code);
    console.log(`[OK] ${f}`);
  } catch (err) {
    console.error(`[ERRO] ${f}:`, err.message);
    allOk = false;
  }
});

if (allOk) {
  console.log("\nTodos os arquivos JS foram validados com sucesso e sem erros de sintaxe!");
} else {
  process.exit(1);
}

