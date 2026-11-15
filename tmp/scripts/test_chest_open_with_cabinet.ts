import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { InternalBoxItem, InternalGridConfig } from '../../src/types';

const grid: InternalGridConfig = {
  lengthMm: 1700,
  widthMm: 1200,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4
};

const box: InternalBoxItem = {
  id: 'box_kitchen',
  name: 'Bancada Cozinha',
  type: 'chest',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  color: '#2563eb',
  material: 'plywood',
  topPerforated: true,
  upperCabinet: true,
  upperCabinetBottomGapMm: 0,
  upperCabinetDepthMm: 250,
  upperCabinetAlign: 'rear',
  isOpen: true
};

const builder = new InternalBoxesBuilder();
builder.update(grid, [box], null, true);

let lidPivot: THREE.Group | null = null;
let upperCabinet: THREE.Group | null = null;

builder.boxesGroup.traverse((obj: any) => {
  if (obj.name === 'ChestLidPivot') lidPivot = obj;
  if (obj.name && obj.name.includes('UpperCabinet')) upperCabinet = obj;
});

console.log('LidPivot rotation:', lidPivot?.rotation);
console.log('UpperCabinet position:', upperCabinet?.position);
