// Teste de dimensões nominais vs exatas em polegadas
const size40_mm = 0.040;
const size40_inch = 0.0381; // 1.5"
const size30_mm = 0.030;
const size30_inch = 0.03175; // 1.25"

console.log('Diff 40mm vs 1.5":', ((size40_mm - size40_inch) * 1000).toFixed(2), 'mm');
console.log('Diff 30mm vs 1.25":', ((size30_inch - size30_mm) * 1000).toFixed(2), 'mm');

