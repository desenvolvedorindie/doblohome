import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { InternalGridConfig, InternalBoxItem, FOLDING_BRACKET_SPECS } from '../../src/types';

console.log('Testing ALL combinations of height, bracket inches, and drawer/shelf states...');

const heights = [250, 300, 350, 400, 420, 450, 500];
const types: ('chest' | 'drawer')[] = ['chest', 'drawer'];
const openStates = [
  { previewOpen: false, shelfOpen: true },
  { previewOpen: true, shelfOpen: true },
  { previewOpen: true, shelfOpen: false }
];

let failedCount = 0;

for (const h of heights) {
  for (const t of types) {
    for (const st of openStates) {
      for (const spec of [undefined, ...FOLDING_BRACKET_SPECS.map(s => s.inches)]) {
        const grid: InternalGridConfig = {
          lengthMm: 1700,
          widthMm: 1200,
          heightMm: h,
          colsX: 3,
          rowsZ: 4
        };

        const box: InternalBoxItem = {
          id: 'test_box',
          name: 'Box Test',
          type: t,
          colStart: 0,
          colSpan: 1,
          rowStart: 2,
          rowSpan: 2,
          heightMm: h,
          color: '#d97706',
          material: 'plywood',
          rearFoldShelf: true,
          isRearShelfOpen: st.shelfOpen,
          rearShelfBracketInches: spec
        };

        const builder = new InternalBoxesBuilder();
        builder.update(grid, [box], null, st.previewOpen, null);

        let woodMesh: THREE.Mesh | null = null;
        const otherMeshes: THREE.Mesh[] = [];

        builder.boxesGroup.traverse((obj: any) => {
          if (!obj.isMesh) return;
          if (obj.userData?.isRearShelf) {
            woodMesh = obj;
          } else if (
            obj.parent?.name?.includes('Shelf') ||
            obj.parent?.name?.includes('FoldingBracket')
          ) {
            otherMeshes.push(obj);
          }
        });

        if (!woodMesh) continue;
        (woodMesh as THREE.Mesh).updateWorldMatrix(true, false);
        const wBB = new THREE.Box3().setFromObject(woodMesh);

        for (const m of otherMeshes) {
          m.updateWorldMatrix(true, false);
          const mBB = new THREE.Box3().setFromObject(m);

          // If shelf is open, wood is horizontal. Check if hardware exceeds wood top or bottom:
          if (st.shelfOpen) {
            if (mBB.max.y > wBB.min.y + 0.001) {
              console.log(`❌ FAILURE: h=${h}, type=${t}, preview=${st.previewOpen}, spec=${spec}`);
              console.log(`   Mesh: ${m.name || m.userData?.partLabel || 'unnamed'}`);
              console.log(`   Mesh Y max: ${mBB.max.y.toFixed(4)}, Wood Y min: ${wBB.min.y.toFixed(4)}, Wood Y max: ${wBB.max.y.toFixed(4)}`);
              failedCount++;
              break;
            }
          }
        }
      }
    }
  }
}

console.log(`\nTesting complete. Total failures: ${failedCount}`);

