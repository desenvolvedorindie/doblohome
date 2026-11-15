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

const boxWithCab: InternalBoxItem = {
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
builder.update(grid, [boxWithCab]);

let vanMesh: THREE.Mesh | null = null;
builder.boxesGroup.traverse((obj: any) => {
  if (obj.isMesh && obj.userData?.isPerforated) {
    vanMesh = obj;
  }
});

console.log('--- 1. IN THE VAN (MODO 1) ---');
console.log('Mesh found:', vanMesh?.userData?.partLabel);
const vanGeo = vanMesh!.geometry as any;
const vanHoles = vanGeo.parameters.shapes.holes.length;
console.log('Holes in van mesh:', vanHoles);

console.log('--- 2. LINEUP SIMULATION (MODO 3) ---');
const dims = [
  vanMesh!.userData.dimW,
  vanMesh!.userData.dimH,
  vanMesh!.userData.dimL
].sort((a: number, b: number) => b - a);

const itemLength = dims[0];
const itemWidth = Math.max(0.015, dims[1]);
const itemThickness = Math.max(0.005, dims[2]);

let geo = vanMesh!.geometry.clone();
geo.computeBoundingBox();
const bb = geo.boundingBox!;
const spanX = bb.max.x - bb.min.x;
const spanZ = bb.max.z - bb.min.z;

if (spanX > spanZ && itemLength > itemWidth) {
  geo.rotateY(Math.PI / 2);
  geo.computeBoundingBox();
} else if (spanZ > spanX && itemWidth > itemLength) {
  geo.rotateY(Math.PI / 2);
  geo.computeBoundingBox();
}

const finalHoles = (geo as any).parameters.shapes.holes.length;
console.log('Holes in lineup mesh:', finalHoles);
console.log('Does lineup match van exactly?', finalHoles === vanHoles);
console.log('Lineup geometry dimensions:');
const bbFinal = geo.boundingBox!;
console.log('X span:', (bbFinal.max.x - bbFinal.min.x).toFixed(3), '(expected itemWidth:', itemWidth.toFixed(3), ')');
console.log('Y span:', (bbFinal.max.y - bbFinal.min.y).toFixed(3), '(expected itemThickness:', itemThickness.toFixed(3), ')');
console.log('Z span:', (bbFinal.max.z - bbFinal.min.z).toFixed(3), '(expected itemLength:', itemLength.toFixed(3), ')');
