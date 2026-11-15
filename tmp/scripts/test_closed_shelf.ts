import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { INTERNAL_BOXES_PRESETS, DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';
import * as THREE from 'three';

const preset = INTERNAL_BOXES_PRESETS[0];
const builder = new InternalBoxesBuilder();

const boxes = preset.boxes.map((b) => {
  if (b.id === 'box_storage_drawer_4') {
    return {
      ...b,
      rearFoldShelf: true,
      isRearShelfOpen: false // CLOSED!
    };
  }
  return b;
});

builder.update(DEFAULT_INTERNAL_GRID, boxes, 'box_storage_drawer_4', false);

const boxContainer = builder.boxesGroup.getObjectByName('BoxContainer_box_storage_drawer_4')!;
boxContainer.updateMatrixWorld(true);

const pivotGroup = boxContainer.getObjectByName('RearFoldShelfPivot')!;
const shelfMesh = pivotGroup.children.find(c => c.userData?.isRearShelf)!;
const shelfBox = new THREE.Box3().setFromObject(shelfMesh);

console.log('SHELF WOOD (CLOSED) BOUNDS:');
console.log('X:', `[${shelfBox.min.x.toFixed(4)}, ${shelfBox.max.x.toFixed(4)}]`);
console.log('Y:', `[${shelfBox.min.y.toFixed(4)}, ${shelfBox.max.y.toFixed(4)}]`);
console.log('Z:', `[${shelfBox.min.z.toFixed(4)}, ${shelfBox.max.z.toFixed(4)}]`);

console.log('\nCHECKING ALL HARDWARE VS WOOD WHEN CLOSED:');
boxContainer.traverse((obj) => {
  if (obj instanceof THREE.Mesh && obj !== shelfMesh && !(obj as any).isLineSegments) {
    const b3 = new THREE.Box3().setFromObject(obj);
    const intersects = shelfBox.intersectsBox(b3);
    const parentName = obj.parent?.name || '';
    if (intersects || b3.min.z < shelfBox.max.z && b3.max.z > shelfBox.min.z) {
      console.log(
        `[${parentName}]`.padEnd(30),
        (obj.name || obj.geometry.type).padEnd(20),
        'Y:', `[${b3.min.y.toFixed(4)}, ${b3.max.y.toFixed(4)}]`,
        'Z:', `[${b3.min.z.toFixed(4)}, ${b3.max.z.toFixed(4)}]`,
        intersects ? '💥 INTERSECTS CLOSED SHELF!' : 'Overlap Z'
      );
    }
  }
});

