import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { INTERNAL_BOXES_PRESETS } from '../../src/data/internalBoxesPresets';

const preset = INTERNAL_BOXES_PRESETS.find(p => p.id === 'slat_bed_camper');
if (!preset) throw new Error('Preset not found');

const grid = preset.grid;
const boxes = JSON.parse(JSON.stringify(preset.boxes));

boxes[0].topPerforated = true;

const builder = new InternalBoxesBuilder();
builder.update(grid, boxes);

builder.boxesGroup.traverse((obj: any) => {
  if (obj.isMesh && obj.userData?.isWoodPart && obj.userData.partLabel.includes('Tampa Basculante Vazada')) {
    const holes = obj.geometry.parameters.shapes.holes;
    console.log(`Total holes: ${holes.length}`);
    holes.slice(0, 10).forEach((h: any, i: number) => {
      console.log(`Hole ${i}: aX=${h.curves[0].aX.toFixed(3)}, aY=${h.curves[0].aY.toFixed(3)}`);
    });
  }
});
