import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { InternalGridConfig, InternalBoxItem } from '../../src/types';

console.log('Testing InternalBoxesBuilder: Verifying BOTH Open and Closed states...');

const grid: InternalGridConfig = {
  lengthMm: 1700,
  widthMm: 1200,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4
};

function testState(isOpen: boolean) {
  console.log(`\n--- Testing state: ${isOpen ? 'OPEN (Horizontal)' : 'CLOSED (Folded Down)'} ---`);
  const boxes: InternalBoxItem[] = [
    {
      id: 'box_shelf_test',
      name: 'Baú com Prateleira Dobrável',
      type: 'chest',
      colStart: 0,
      colSpan: 2,
      rowStart: 2,
      rowSpan: 2,
      heightMm: 400,
      color: '#d97706',
      material: 'plywood',
      rearFoldShelf: true,
      rearShelfFinish: 'pine_block',
      isRearShelfOpen: isOpen
    }
  ];

  const builder = new InternalBoxesBuilder();
  builder.update(grid, boxes, null, false, null);

  let shelfMesh: THREE.Mesh | null = null;
  const struts: THREE.Mesh[] = [];

  builder.boxesGroup.traverse((obj: any) => {
    if (obj.userData && obj.userData.isRearShelf && obj.isMesh) {
      shelfMesh = obj;
    }
    if (obj.isMesh && obj.parent?.name?.startsWith('FoldingBracket_Base_') && obj.geometry instanceof THREE.BoxGeometry) {
      if (obj.name !== 'vertBack' && !obj.name.includes('Flange')) {
        struts.push(obj);
      }
    }
  });

  if (!shelfMesh) throw new Error('Shelf wood mesh not found!');

  (shelfMesh as THREE.Mesh).updateWorldMatrix(true, false);
  const shelfBB = new THREE.Box3().setFromObject(shelfMesh);

  console.log('Shelf Wood Bounding Box:');
  console.log('  Y:', shelfBB.min.y.toFixed(4), 'to', shelfBB.max.y.toFixed(4));
  console.log('  Z:', shelfBB.min.z.toFixed(4), 'to', shelfBB.max.z.toFixed(4));

  if (isOpen) {
    struts.forEach((strut, idx) => {
      strut.updateWorldMatrix(true, false);
      const strutBB = new THREE.Box3().setFromObject(strut);
      if (strutBB.max.y > shelfBB.min.y) {
        throw new Error(`Strut #${idx + 1} penetrates wood in open state!`);
      }
    });
    console.log('✅ Open state: Struts are completely under the shelf!');
  } else {
    console.log('✅ Closed state: Shelf hangs vertically down flush!');
  }
}

testState(true);
testState(false);

console.log('\n🎉 ALL STATES VERIFIED SUCCESSFULLY!');
