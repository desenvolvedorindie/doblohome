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
  id: 'box_test',
  name: 'Caixa Teste',
  type: 'drawer',
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

let perfMesh: THREE.Mesh | null = null;
builder.boxesGroup.traverse((obj: any) => {
  if (obj.isMesh && obj.userData?.isPerforated) {
    perfMesh = obj;
  }
});

if (!perfMesh) throw new Error('No perforated mesh found');

const sourceMesh: THREE.Mesh = perfMesh;
console.log('sourceMesh userData:', sourceMesh.userData);

// Let's compute bounding box of sourceMesh.geometry
sourceMesh.geometry.computeBoundingBox();
const bb = sourceMesh.geometry.boundingBox!;
console.log('Source geometry bounding box:', {
  min: { x: bb.min.x.toFixed(3), y: bb.min.y.toFixed(3), z: bb.min.z.toFixed(3) },
  max: { x: bb.max.x.toFixed(3), y: bb.max.y.toFixed(3), z: bb.max.z.toFixed(3) }
});

const sizeX = bb.max.x - bb.min.x;
const sizeY = bb.max.y - bb.min.y;
const sizeZ = bb.max.z - bb.min.z;
console.log(`Span X: ${(sizeX*1000).toFixed(0)}mm, Span Y: ${(sizeY*1000).toFixed(0)}mm, Span Z: ${(sizeZ*1000).toFixed(0)}mm`);
