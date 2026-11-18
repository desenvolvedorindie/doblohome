const fs = require('fs');
const d = JSON.parse(fs.readFileSync('tmp/scripts/cutting_data.json'));
d.wood.categories.forEach(cat => {
  console.log(`\n=== Category: ${cat.key} (Total: ${cat.totalPieces}) ===`);
  cat.pieces.forEach(p => console.log('  -', p.label, `(${p.lengthMm}x${p.widthMm}mm) Qty: ${p.qty} (partType: ${p.partType})`));
});
