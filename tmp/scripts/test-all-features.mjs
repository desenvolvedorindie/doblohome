import { FOLDING_BRACKET_SPECS, getFoldingBracketForHeight } from '../../src/types/index.ts';

console.log('Testing Bracket Inch Calculation:');
[300, 400, 500, 600].forEach((h) => {
  const spec = getFoldingBracketForHeight(h);
  console.log(`- Box Height ${h}mm -> Bracket ${spec.inches}" (${spec.lengthMm}mm, cap: ${spec.maxLoadKg}kg)`);
});

console.log('\nSupported Bracket Sizes in Inches:');
FOLDING_BRACKET_SPECS.forEach((s) => {
  console.log(`- ${s.inches}" -> ${s.lengthMm}mm (min height ${s.minBoxHeightMm}mm)`);
});

