import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder.ts';
import { DEFAULT_INTERNAL_GRID, INTERNAL_BOXES_PRESETS } from '../../src/data/internalBoxesPresets.ts';

const builder = new InternalBoxesBuilder();
const preset = INTERNAL_BOXES_PRESETS[0];
const boxes = preset.boxes;
const targetBoxId = boxes[0].id;

console.log(`Testing InternalBoxesBuilder with ${boxes.length} boxes.`);
console.log(`Target box to isolate: "${boxes[0].name}" (ID: ${targetBoxId})`);

// 1. Build normal
builder.update(preset.grid, boxes, null, false, null);
console.log(`Normal update: ${builder.boxesGroup.children.length} boxes in group.`);

// 2. Build with isolatedBoxId
builder.update(preset.grid, boxes, targetBoxId, false, targetBoxId);
console.log(`Isolated update completed.`);

let targetOpaqueMeshes = 0;
let ghostedMeshes = 0;
let ghostedOpacityAvg = 0;

builder.boxesGroup.children.forEach((boxContainer) => {
  const isTarget = boxContainer.name === `BoxContainer_${targetBoxId}`;
  boxContainer.traverse((child) => {
    if (child.isMesh && child.name !== '__box_hitbox') {
      if (isTarget) {
        targetOpaqueMeshes++;
        if (child.material.transparent && child.material.opacity < 0.5) {
          console.error(`Error: Target box mesh should be opaque!`);
        }
      } else {
        ghostedMeshes++;
        ghostedOpacityAvg += child.material.opacity;
        if (!child.material.transparent || child.material.opacity > 0.2) {
          console.error(`Error: Other box mesh should be transparent! (got opacity ${child.material.opacity})`);
        }
      }
    }
  });
});

ghostedOpacityAvg = ghostedMeshes > 0 ? (ghostedOpacityAvg / ghostedMeshes) : 0;
console.log(`Results:`);
console.log(`- Target box opaque meshes: ${targetOpaqueMeshes}`);
console.log(`- Other boxes ghosted meshes: ${ghostedMeshes} with average opacity: ${ghostedOpacityAvg.toFixed(2)}`);

if (targetOpaqueMeshes > 0 && ghostedMeshes > 0 && Math.abs(ghostedOpacityAvg - 0.10) < 0.001) {
  console.log(`✅ TEST PASSED: Isolated mode correctly isolates target box and makes all other boxes 10% transparent!`);
} else {
  console.error(`❌ TEST FAILED`);
  process.exit(1);
}
