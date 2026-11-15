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

const builder = new InternalBoxesBuilder();

const box: InternalBoxItem = {
  id: 'box_kitchen',
  name: 'Bancada Cozinha',
  type: 'chest',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 2,
  heightMm: 400,
  color: '#2563eb',
  material: 'plywood',
  topPerforated: true,
  upperCabinet: true,
  upperCabinetBottomGapMm: 0,
  upperCabinetDepthMm: 350,
  upperCabinetAlign: 'rear',
  upperCabinetDoors: true,
  upperCabinetShelves: 1
};

builder.update(grid, [box]);

console.log('--- WOOD PARTS ---');
builder.boxesGroup.traverse((obj: any) => {
  if (obj.isMesh && obj.userData?.isWoodPart) {
    console.log(`Part: ${obj.userData.partLabel}, dimW: ${obj.userData.dimW}, dimH: ${obj.userData.dimH}, dimL: ${obj.userData.dimL}, isPerforated: ${obj.userData.isPerforated}`);
  }
});
