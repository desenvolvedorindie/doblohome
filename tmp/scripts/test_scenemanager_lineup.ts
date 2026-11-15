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
  upperCabinetAlign: 'rear'
};

const builder = new InternalBoxesBuilder();
builder.update(grid, [box]);

// In the van (InternalBoxesBuilder):
let vanLidMesh: THREE.Mesh | null = null;
builder.boxesGroup.traverse((obj: any) => {
  if (obj.isMesh && obj.userData?.isPerforated) {
    vanLidMesh = obj;
  }
});

const vanHoles = (vanLidMesh!.geometry as any).parameters.shapes.holes.length;
console.log('Holes in the campervan lid (with cabinet exclusion):', vanHoles);

// Now in SceneManager.ts (Bancada de Peças / Modo 3: Peças):
// Lines 1014-1025 of SceneManager.ts:
const obj = vanLidMesh!;
if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
const bb = obj.geometry.boundingBox!;
const dx = Number(obj.userData.dimW) || Math.abs(bb.max.x - bb.min.x);
const dy = Number(obj.userData.dimH) || Math.abs(bb.max.y - bb.min.y);
const dz = Number(obj.userData.dimL) || Math.abs(bb.max.z - bb.min.z);
const dims = [dx, dy, dz].sort((a, b) => b - a);

const length = dims[0];
const width = Math.max(0.015, dims[1]);
const thickness = Math.max(0.005, dims[2]);

// Line 1087 of SceneManager.ts:
const lineupGeo = InternalBoxesBuilder.createPerforatedGeometry(width, thickness, length);
const lineupHoles = (lineupGeo as any).parameters.shapes.holes.length;
console.log('Holes in SceneManager lineup piece (Modo 3: Peças):', lineupHoles);
console.log('Difference in holes:', lineupHoles - vanHoles);
