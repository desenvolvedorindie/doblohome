import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';

const w = 0.40;
const l = 1.70;
const h = 0.015;

const zone = {
  minX: -0.20,
  maxX: 0.20,
  minZ: -0.85,
  maxZ: -0.55 // Rear 300mm excluded
};

const geo = InternalBoxesBuilder.createPerforatedGeometry(w, h, l, {
  exclusionZones: [zone]
});

// Let's find all hole vertices in 3D
const pos = geo.attributes.position;
let minZFound = Infinity;
let maxZFound = -Infinity;
let rearHolesCount = 0;
let frontHolesCount = 0;

// The holes are cylindrical surfaces extruded through depth
// Let's look at the shape.holes
const holes = (geo as any).parameters.shapes.holes;
console.log('Total holes in shape:', holes.length);

holes.forEach((hole: any, i: number) => {
  const curve = hole.curves[0];
  const x2d = curve.aX;
  const y2d = curve.aY;
  // In 3D after rotateX(-PI/2):
  // X3d = x2d
  // Z3d = -y2d
  const z3d = -y2d;
  if (z3d < 0) rearHolesCount++;
  else frontHolesCount++;
  if (z3d < minZFound) minZFound = z3d;
  if (z3d > maxZFound) maxZFound = z3d;
});

console.log(`Min Z of hole in 3D: ${minZFound.toFixed(3)} (rear is -0.85)`);
console.log(`Max Z of hole in 3D: ${maxZFound.toFixed(3)} (front is +0.85)`);
console.log(`Rear holes (Z < 0): ${rearHolesCount}, Front holes (Z > 0): ${frontHolesCount}`);
console.log(`Zone was minZ: ${zone.minZ}, maxZ: ${zone.maxZ}`);
const anyHoleInZone = holes.some((hole: any) => {
  const z3d = -hole.curves[0].aY;
  return z3d >= zone.minZ && z3d <= zone.maxZ;
});
console.log('Is any hole inside the exclusion zone in 3D?', anyHoleInZone);
