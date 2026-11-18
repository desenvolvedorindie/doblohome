import { INTERNAL_BOXES_PRESETS } from '../../src/data/internalBoxesPresets';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { extractWoodCutGroups } from '../../src/utils/woodUtils';

const builder = new InternalBoxesBuilder();

INTERNAL_BOXES_PRESETS.forEach(preset => {
  console.log(`\n========================================`);
  console.log(`PRESET: ${preset.name} (${preset.id})`);
  console.log(`========================================`);

  builder.update(preset.grid, preset.boxes, null, false, null);
  const statsClosed = extractWoodCutGroups({ internalBoxesBuilder: builder });
  console.log(`[CLOSED] Total pieces: ${statsClosed.totalPieces}`);

  const slats = statsClosed.cutGroups.filter(g => g.partType === 'slat' || g.label.toLowerCase().includes('ripa'));
  const legs = statsClosed.cutGroups.filter(g => g.partType === 'leg' || g.label.toLowerCase().includes('p'));

  console.log(`  Slats found: ${slats.length} groups, ${slats.reduce((a, b) => a + b.qty, 0)} total`);
  slats.slice(0, 5).forEach(s => console.log(`    - ${s.label} (${s.lengthMm}x${s.widthMm}mm)`));
  if (slats.length > 5) console.log(`    ... and ${slats.length - 5} more`);

  console.log(`  Legs found: ${legs.length} groups, ${legs.reduce((a, b) => a + b.qty, 0)} total`);
  legs.forEach(l => console.log(`    - ${l.label} (${l.lengthMm}x${l.widthMm}mm) (partType: ${l.partType})`));

  builder.update(preset.grid, preset.boxes, null, true, null);
  const statsOpen = extractWoodCutGroups({ internalBoxesBuilder: builder });
  console.log(`[OPEN] Total pieces: ${statsOpen.totalPieces}`);
  const legsOpen = statsOpen.cutGroups.filter(g => g.partType === 'leg' || g.label.toLowerCase().includes('p'));
  console.log(`  Legs found when open: ${legsOpen.length} groups, ${legsOpen.reduce((a, b) => a + b.qty, 0)} total`);
});
