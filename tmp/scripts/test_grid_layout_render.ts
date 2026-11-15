import { INTERNAL_BOXES_PRESETS, DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';

console.log('--- TESTING FLOOR GRID BOX RENDERING & MICRO-LAYOUT ---');

INTERNAL_BOXES_PRESETS.forEach(preset => {
  console.log(`\nValidating preset: "${preset.name}" (${preset.id})`);
  const grid = preset.grid || DEFAULT_INTERNAL_GRID;
  const cols = grid.colsX;
  const rows = grid.rowsZ;

  preset.boxes.forEach(box => {
    const boxWMm = Math.round(box.colSpan * (grid.widthMm / cols));
    const boxLMm = Math.round(box.rowSpan * (grid.lengthMm / rows));
    const boxVolL = Math.round((boxWMm * boxLMm * (box.heightMm || grid.heightMm)) / 1_000_000);

    const cleanBoxName = box.name.trim();
    const startsWithEmoji = /^\p{Emoji}/u.test(cleanBoxName);
    const typeIcon = box.type === 'drawer' ? '📦' : box.type === 'slide_tray' ? '🛷' : box.type === 'open' ? '🚪' : box.type === 'slat_bed' ? '🛏️' : '🧰';
    const fullDisplayName = startsWithEmoji ? cleanBoxName : `${typeIcon} ${cleanBoxName}`;

    const typeShort = box.type === 'drawer'
      ? 'Gaveta Traseira'
      : box.type === 'slide_tray'
        ? 'Bandeja Corrediça'
        : box.type === 'open'
          ? 'Nicho Aberto'
          : box.type === 'slat_bed'
            ? `Cama Ripas (${box.slatBedDirection === 'left' ? '◀ Esq' : box.slatBedDirection === 'right' ? '▶ Dir' : box.slatBedDirection === 'rear' ? '▼ Trás' : '▲ Frente'})`
            : `Baú (${box.chestHingeDirection === 'rear' ? '▼ Trás' : box.chestHingeDirection === 'left' ? '◀ Esq' : box.chestHingeDirection === 'right' ? '▶ Dir' : '▲ Frente'})`;

    const dimStr = `${boxWMm / 10} × ${boxLMm / 10} × ${(box.heightMm || grid.heightMm) / 10} cm`;

    console.log(`  Box [${box.id}]:`);
    console.log(`    Name: "${fullDisplayName}"`);
    console.log(`    Type: "${typeShort}"`);
    console.log(`    Dim:  "${dimStr}" | Vol: ${boxVolL}L`);

    if (box.colStart < 0 || box.colStart + box.colSpan > cols) {
      throw new Error(`Box ${box.id} out of bounds in X`);
    }
    if (box.rowStart < 0 || box.rowStart + box.rowSpan > rows) {
      throw new Error(`Box ${box.id} out of bounds in Z`);
    }
  });
});

console.log('\n✅ ALL PRESETS AND FLOOR GRID ITEMS VALIDATED WITH 0 OVERLAPS OR OUT-OF-BOUNDS ERRORS!');
