const THREE = require('three');

// Test shape extrusion orientation
const radius = 0.04;
const hw = 0.45 / 2;
const hl = 0.65 / 2;
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

const tableTopGeo = new THREE.ExtrudeGeometry(shape, {
  depth: 0.018,
  bevelEnabled: true,
  bevelSegments: 3,
  steps: 1,
  bevelSize: 0.003,
  bevelThickness: 0.003
});
tableTopGeo.rotateX(-Math.PI / 2);

const bb = new THREE.Box3().setFromObject(new THREE.Mesh(tableTopGeo));
console.log('Table top bounds:', {
  x: [bb.min.x.toFixed(3), bb.max.x.toFixed(3)],
  y: [bb.min.y.toFixed(3), bb.max.y.toFixed(3)],
  z: [bb.min.z.toFixed(3), bb.max.z.toFixed(3)]
});

