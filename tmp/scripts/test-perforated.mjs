import * as THREE from 'three';

console.log('Testing ExtrudeGeometry with holes...');

const w = 0.6;
const l = 0.8;
const t = 0.015;

const shape = new THREE.Shape();
const hw = w / 2;
const hl = l / 2;
shape.moveTo(-hw, -hl);
shape.lineTo(hw, -hl);
shape.lineTo(hw, hl);
shape.lineTo(-hw, hl);
shape.closePath();

const margin = 0.05;
const usableW = w - 2 * margin;
const usableL = l - 2 * margin;
const cols = Math.max(1, Math.round(usableW / 0.09));
const rows = Math.max(1, Math.round(usableL / 0.09));
const stepX = usableW / cols;
const stepZ = usableL / rows;
const holeRadius = Math.min(0.03, Math.min(stepX, stepZ) * 0.35);

for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const cx = -hw + margin + (c + 0.5) * stepX;
    const cz = -hl + margin + (r + 0.5) * stepZ;
    const holePath = new THREE.Path();
    holePath.absarc(cx, cz, holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);
  }
}

const geo = new THREE.ExtrudeGeometry(shape, {
  depth: t,
  bevelEnabled: false,
  curveSegments: 12
});

geo.rotateX(-Math.PI / 2);
geo.translate(0, -t / 2, 0);
geo.computeBoundingBox();

const bb = geo.boundingBox;
console.log('Bounding box:', {
  min: bb.min,
  max: bb.max,
  size: {
    x: bb.max.x - bb.min.x,
    y: bb.max.y - bb.min.y,
    z: bb.max.z - bb.min.z
  },
  holesCount: shape.holes.length
});

