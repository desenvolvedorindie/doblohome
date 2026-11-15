import { INTERNAL_BOXES_PRESETS, DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { BoxLedConfig, BoxLedEdge } from '../../src/types';

console.log('Testing Internal Boxes LED Corner Profile...');

// 1. Check presets
INTERNAL_BOXES_PRESETS.forEach(preset => {
  console.log(`Checking preset: ${preset.name} (${preset.boxes.length} boxes)`);
  const ledBoxes = preset.boxes.filter(b => b.hasLedCorner || b.ledCorner?.enabled);
  console.log(`  -> Boxes with LED: ${ledBoxes.length}`);
  ledBoxes.forEach(b => {
    console.log(`     * ${b.name}: edges=${JSON.stringify(b.ledCorner?.edges)}, color=${b.ledCorner?.color}`);
  });
});

// 2. Build 3D models with InternalBoxesBuilder
const builder = new InternalBoxesBuilder();
const preset = INTERNAL_BOXES_PRESETS[0];

builder.update(
  preset.grid,
  preset.boxes,
  null, // selectedBoxId
  false, // previewOpen
  null // isolatedBoxId
);

let cornerLedProfilesCount = 0;
let pointLightsCount = 0;

builder.boxesGroup.traverse((child: any) => {
  if (child.name?.startsWith('BoxLedCorners_')) {
    cornerLedProfilesCount++;
  }
  if (child.isPointLight) {
    pointLightsCount++;
  }
});

console.log(`Found ${cornerLedProfilesCount} BoxLedCorners groups and ${pointLightsCount} point lights.`);

if (cornerLedProfilesCount === 0) {
  console.error('ERROR: No BoxLedCorners groups created!');
  process.exit(1);
}

// 3. Test BOM calculation
const boxesWithLed = preset.boxes.filter(b => b.hasLedCorner || b.ledCorner?.enabled);
const totalBoxLedMeters = boxesWithLed.reduce((acc, box) => {
  const colSpan = box.colSpan || 1;
  const rowSpan = box.rowSpan || 1;
  const boxWM = (colSpan * preset.grid.widthMm) / (preset.grid.colsX || 1) / 1000;
  const boxLM = (rowSpan * preset.grid.lengthMm) / (preset.grid.rowsZ || 1) / 1000;
  const edges = (box.ledCorner?.edges && box.ledCorner.edges.length > 0)
    ? box.ledCorner.edges
    : ['rear'];
  let boxM = 0;
  edges.forEach((edge) => {
    if (edge === 'rear' || edge === 'front') boxM += boxWM;
    if (edge === 'left' || edge === 'right') boxM += boxLM;
  });
  return acc + boxM;
}, 0);

console.log(`Total LED corner profile meters calculated: ${totalBoxLedMeters.toFixed(2)} m`);
if (totalBoxLedMeters <= 0) {
  console.error('ERROR: totalBoxLedMeters should be > 0');
  process.exit(1);
}

console.log('ALL TESTS PASSED SUCCESSFULLY! ✅');
