import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { INTERNAL_BOXES_PRESETS } from '../../src/data/internalBoxesPresets';

const preset = INTERNAL_BOXES_PRESETS.find(p => p.id === 'slat_bed_camper');
if (!preset) throw new Error('Preset not found');

const grid = preset.grid;
const boxes = JSON.parse(JSON.stringify(preset.boxes));

// Set topPerforated on the tall cabinet
boxes[0].topPerforated = true;

const builder = new InternalBoxesBuilder();
builder.update(grid, boxes);

console.log('--- ALL PIECES IN SLAT BED PRESET (BOX 0 WITH topPerforated) ---');
builder.boxesGroup.traverse((obj: any) => {
  if (obj.isMesh && obj.userData?.isWoodPart) {
    if (obj.userData.partLabel.includes('🍳 Armário Alto')) {
      console.log(`- ${obj.userData.partLabel} | dims: [${(obj.userData.dimW*1000).toFixed(0)} x ${(obj.userData.dimH*1000).toFixed(0)} x ${(obj.userData.dimL*1000).toFixed(0)} mm] | isPerforated: ${obj.userData.isPerforated}`);
    }
  }
});
