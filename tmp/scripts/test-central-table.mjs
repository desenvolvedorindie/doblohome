import * as THREE from 'three';

console.log('Testing Central Table Geometry & Placement...');

const floorY = 0.48;
const tableTopH = 0.018; // 18mm
const tableWM = 0.45; // 450mm
const tableLM = 0.65; // 650mm
const tableYFromFloor = 0.72; // 720mm dining height
const absoluteY = floorY + tableYFromFloor;

console.log('Floor Y:', floorY);
console.log('Table absolute Y:', absoluteY);
console.log('Pedestal tube height:', tableYFromFloor);

// Shape for rounded rectangle table top
const radius = 0.04; // 40mm rounded corner
const hw = tableWM / 2;
const hl = tableLM / 2;

const shape = new THREE.Shape();
shape.moveTo(-hw + radius, -hl);
shape.lineTo(hw - radius, -hl);
shape.quadraticCurveTo(hw, -hl, hw, -hl + radius);
shape.lineTo(hw, hl - radius);
shape.quadraticCurveTo(hw, hl, hw - radius, hl);
shape.lineTo(-hw + radius, hl);
shape.quadraticCurveTo(-hw, hl, -hw, hl - radius);
shape.lineTo(-hw, -hl + radius);
shape.quadraticCurveTo(-hw, -hl, -hw + radius, -hl);

const geom = new THREE.ExtrudeGeometry(shape, {
  depth: tableTopH,
  bevelEnabled: true,
  bevelSegments: 3,
  steps: 1,
  bevelSize: 0.003,
  bevelThickness: 0.003
});
geom.rotateX(Math.PI / 2);

console.log('Rounded Table Top Geometry generated successfully! Vertices count:', geom.attributes.position.count);

