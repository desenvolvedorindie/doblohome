import { INTERNAL_BOXES_PRESETS } from '../../src/data/internalBoxesPresets';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { extractWoodCutGroups } from '../../src/utils/woodUtils';

const preset = INTERNAL_BOXES_PRESETS.find(p => p.id === 'slat_bed_camper')!;
const builder = new InternalBoxesBuilder();
builder.update(preset.grid, preset.boxes, null, false, null);

const mockSceneManager = {
  internalBoxesBuilder: builder
};

const stats = extractWoodCutGroups(mockSceneManager);
console.log('Total wood pieces in slat_bed_camper (closed):', stats.totalPieces);
const slats = stats.cutGroups.filter(g => g.partType === 'slat' || g.label.toLowerCase().includes('ripa'));
console.log('Slats count:', slats.length, 'total qty:', slats.reduce((a, b) => a + b.qty, 0));
slats.forEach(s => console.log('  -', s.label, `(${s.lengthMm}x${s.widthMm}x${s.thicknessMm}mm) Qty: ${s.qty}`));

const legs = stats.cutGroups.filter(g => g.partType === 'leg' || g.label.toLowerCase().includes('p'));
console.log('Legs count:', legs.length, 'total qty:', legs.reduce((a, b) => a + b.qty, 0));
legs.forEach(l => console.log('  -', l.label, `(${l.lengthMm}x${l.widthMm}x${l.thicknessMm}mm) Qty: ${l.qty}`));
