import * as THREE from 'three';
import { UpperCabinetBuilder } from '../../src/three/boxes/UpperCabinetBuilder';
import { InternalBoxItem, InternalGridConfig } from '../../src/types';

const builder = new UpperCabinetBuilder();

const boxLongitudinal: InternalBoxItem = {
  id: 'box_kitchen_tall_cabinet',
  name: '🍳 Armário Alto Lateral & Cozinha',
  type: 'chest',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 750,
  upperCabinet: true,
  upperCabinetDepthMm: 250,
  upperCabinetAlign: 'left',
  upperCabinetClosure: 'sliding_doors',
  isUpperCabinetOpen: false,
};

const grid: InternalGridConfig = {
  widthMm: 1200,
  lengthMm: 1700,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4,
};

// Test closed
const containerClosed = new THREE.Group();
builder.buildUpperCabinet(containerClosed, 0.4, 1.7, 0.75, boxLongitudinal, false, false, grid);

// Test open
const containerOpen = new THREE.Group();
builder.buildUpperCabinet(containerOpen, 0.4, 1.7, 0.75, boxLongitudinal, false, true, grid);

console.log('Built closed children:', containerClosed.children.length);
console.log('Built open children:', containerOpen.children.length);

function findSlidingDoors(group: THREE.Group) {
  const result: any[] = [];
  group.traverse((obj) => {
    if (obj.name.includes('UpperCabinetSlidingDoor')) {
      result.push({
        name: obj.name,
        children: obj.children.map(c => ({
          name: c.name,
          pos: c.position,
          userData: (c as any).userData?.partLabel || (c as any).userData?.name
        }))
      });
    }
  });
  return result;
}

console.log('Closed doors:', JSON.stringify(findSlidingDoors(containerClosed), null, 2));
console.log('Open doors:', JSON.stringify(findSlidingDoors(containerOpen), null, 2));
