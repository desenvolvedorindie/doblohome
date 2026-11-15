import * as THREE from 'three';

const w = 0.4;
const l = 0.85;
const h = 0.015;
const hw = w / 2;
const hl = l / 2;

// If we want 3D coordinates (cx, cz) to be preserved:
// With rotateX(-Math.PI / 2), 3D Z is -shapeY.
// So shapeY must be -3dZ!
const shape = new THREE.Shape();
shape.moveTo(-hw, -hl);
shape.lineTo(hw, -hl);
shape.lineTo(hw, hl);
shape.lineTo(-hw, hl);
shape.closePath();

const target3dZ = -0.35; // rear
const shapeY = -target3dZ; // +0.35 in shape

const holePath = new THREE.Path();
holePath.absarc(0, shapeY, 0.02, 0, Math.PI * 2, true);
shape.holes.push(holePath);

const geo = new THREE.ExtrudeGeometry(shape, {
  depth: h,
  bevelEnabled: false,
  curveSegments: 8
});

geo.rotateX(-Math.PI / 2);
geo.translate(0, -h / 2, 0);

const pos = geo.attributes.position;
let rearCount = 0;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const z = pos.getZ(i);
  if (Math.hypot(x - 0, z - target3dZ) < 0.025) {
    rearCount++;
  }
}
console.log(`With shapeY = -target3dZ, vertices at rear target3dZ (-0.35): count=${rearCount}`);
