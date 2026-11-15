import { optimizeCuttingPlan } from '../../src/utils/cuttingOptimizer';

console.log('--- TEST OPTIMIZING CUTTING PLAN FOR FOAM CUSHIONS ---');

const foamPieces = [
  {
    id: 'cushion_1',
    pieceId: 'cushion_1_group',
    label: 'Cama Casal • Almofada Central 1/2 • c/ Recuo Traseiro Aéreo',
    lengthMm: 1423,
    widthMm: 388,
    thicknessMm: 80,
    material: 'Espuma D33',
    woodMaterial: 'Espuma D33 (Colchão)',
    canRotate: true
  },
  {
    id: 'cushion_2',
    pieceId: 'cushion_2_group',
    label: 'Cama Casal • Almofada Central 2/2',
    lengthMm: 1684,
    widthMm: 388,
    thicknessMm: 80,
    material: 'Espuma D33',
    woodMaterial: 'Espuma D33 (Colchão)',
    canRotate: true
  }
];

const plan = optimizeCuttingPlan(
  foamPieces,
  'Espuma D33 (Colchão)__80',
  'Espuma D33 (Colchão)',
  80,
  {
    sheetWidthMm: 1900,
    sheetHeightMm: 1400,
    kerfMm: 2,
    marginMm: 10,
    allowRotation: true
  }
);

console.log(`Optimization result:`);
console.log(`  Total sheets: ${plan.totalSheets}`);
console.log(`  Overall efficiency: ${plan.overallEfficiencyPct}%`);
console.log(`  Total area used: ${plan.totalAreaUsedM2} m²`);
console.log(`  Total pieces placed: ${plan.totalPiecesCount} / ${foamPieces.length}`);

plan.sheets.forEach((sheet, idx) => {
  console.log(`  Sheet #${idx + 1}: ${sheet.placedPieces.length} pieces placed (efficiency: ${sheet.efficiencyPct}%)`);
  sheet.placedPieces.forEach(p => {
    console.log(`    - ${p.label}: (${p.x}, ${p.y}) ${p.w}x${p.h} mm (rotated: ${p.rotated})`);
  });
});
