import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { INTERNAL_BOXES_PRESETS, DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';
import { FOLDING_BRACKET_SPECS } from '../../src/types';
import * as THREE from 'three';

const builder = new InternalBoxesBuilder();
let issueCount = 0;

for (const preset of INTERNAL_BOXES_PRESETS) {
  for (const box of preset.boxes) {
    for (const drawerOpen of [false, true]) {
      for (const shelfOpen of [false, true]) {
        for (const spec of [undefined, 8, 10, 12, 16, 18, 20]) {
          const testBox = {
            ...box,
            rearFoldShelf: true,
            isRearShelfOpen: shelfOpen,
            rearShelfBracketInches: spec
          };

          builder.update(preset.grid, [testBox], testBox.id, drawerOpen, null);

          const boxContainer = builder.boxesGroup.getObjectByName(`BoxContainer_${testBox.id}`);
          if (!boxContainer) continue;
          boxContainer.updateMatrixWorld(true);

          const pivotGroup = boxContainer.getObjectByName('RearFoldShelfPivot');
          const woodShelf = pivotGroup?.children.find((c: any) => c.userData?.isRearShelf) as THREE.Mesh;
          if (!woodShelf) continue;

          const woodBox = new THREE.Box3().setFromObject(woodShelf);

          boxContainer.traverse((obj: any) => {
            if (obj.isMesh && obj !== woodShelf && !(obj as any).isLineSegments) {
              const isHardware = obj.parent?.userData?.isHardware || obj.userData?.isHardware;
              if (!isHardware) return;

              const objBox = new THREE.Box3().setFromObject(obj);

              // If shelf is open (horizontal):
              if (shelfOpen) {
                // Any hardware exceeding the bottom of the wood
                if (objBox.max.y > woodBox.min.y + 0.0001) {
                  const penetrationMm = (objBox.max.y - woodBox.min.y) * 1000;
                  console.log(
                    `[OPEN FAIL] Preset: ${preset.id}, Box: ${box.id} (${box.type}), DrawerOpen: ${drawerOpen}, Spec: ${spec}`
                  );
                  console.log(
                    `  Mesh: ${obj.name || obj.parent?.name || 'unnamed'} -> penetrates bottom of wood by ${penetrationMm.toFixed(2)} mm (objMaxY=${objBox.max.y.toFixed(4)}, woodMinY=${woodBox.min.y.toFixed(4)})`
                  );
                  issueCount++;
                }
              }
            }
          });
        }
      }
    }
  }
}

console.log(`\nAll tests completed. Total issues: ${issueCount}`);

