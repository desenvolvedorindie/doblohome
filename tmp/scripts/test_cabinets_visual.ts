import * as THREE from 'three';
import { UpperCabinetBuilder } from '../../src/three/boxes/UpperCabinetBuilder';
import { InternalBoxItem, InternalGridConfig } from '../../src/types';

const builder = new UpperCabinetBuilder();

const grid: InternalGridConfig = {
  widthMm: 1200,
  lengthMm: 1700,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4,
};

function inspectPanels(name: string, box: Partial<InternalBoxItem>, isOpen: boolean) {
  const fullBox: InternalBoxItem = {
    id: 'test_box',
    name,
    type: 'chest',
    colStart: 0,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 1,
    heightMm: 400,
    upperCabinet: true,
    ...box,
  };
  const container = new THREE.Group();
  builder.buildUpperCabinet(container, 0.4, 0.425, 0.4, fullBox, false, isOpen, grid);

  console.log(`\n=== Inspect: ${name} (isOpen = ${isOpen}) ===`);
  container.traverse((obj) => {
    if (obj.name && (obj.name.includes('SlidingDoor1') || obj.name.includes('SlidingDoor2'))) {
      const mesh = obj.children.find(c => (c as any).isMesh);
      if (mesh) {
        console.log(`- ${obj.name} Mesh: pos=(${mesh.position.x.toFixed(3)}, ${mesh.position.y.toFixed(3)}, ${mesh.position.z.toFixed(3)})`);
      }
    }
  });
}

inspectPanels('Align Left, sliding_doors', { upperCabinetAlign: 'left', upperCabinetClosure: 'sliding_doors' }, false);
inspectPanels('Align Left, sliding_doors', { upperCabinetAlign: 'left', upperCabinetClosure: 'sliding_doors' }, true);

inspectPanels('Align Rear, sliding_doors', { upperCabinetAlign: 'rear', upperCabinetClosure: 'sliding_doors' }, false);
inspectPanels('Align Rear, sliding_doors', { upperCabinetAlign: 'rear', upperCabinetClosure: 'sliding_doors' }, true);
