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

pivotGroup.children.forEach((c) => {
  if (c !== shelfMesh && !(c as any).isLineSegments) {
    const b3 = new THREE.Box3().setFromObject(c);
    const intersects = shelfBox.intersectsBox(b3);
    console.log(
      c.name.padEnd(20),
      'Y:', `[${b3.min.y.toFixed(4)}, ${b3.max.y.toFixed(4)}]`,
      'Z:', `[${b3.min.z.toFixed(4)}, ${b3.max.z.toFixed(4)}]`,
      intersects ? '💥 INTERSECTS CLOSED WOOD!' : 'Clear'
    );
  }
});

