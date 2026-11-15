const THREE = require('three');
const fs = require('fs');

// Simple OBJ parse check
const content = fs.readFileSync('public/assets/doblo.obj', 'utf-8');

// In OBJLoader from three/examples/jsm/loaders/OBJLoader.js:
// OBJLoader generates BufferGeometry without index (non-indexed) or with index?
console.log('Testing with Three.js BufferGeometry');
const geo = new THREE.BufferGeometry();
const positions = new Float32Array([
  0, 0, 0,
  1, 0, 0,
  0, 1, 0
]);
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geo.computeVertexNormals();
console.log('Normal before flip:', geo.attributes.normal.array.slice(0, 3));

// Flip Z
positions[2] = -positions[2]; // 0
// If we had non-zero Z, or if we negate an axis:
// Triangle in XY: (0,0,0), (1,0,0), (0,1,0). Normal is (0, 0, 1).
// If we mirror X: (-0,0,0), (-1,0,0), (-0,1,0).
const posFlippedX = new Float32Array([
  0, 0, 0,
  -1, 0, 0,
  0, 1, 0
]);
geo.setAttribute('position', new THREE.BufferAttribute(posFlippedX, 3));
geo.computeVertexNormals();
console.log('Normal after X flip (inward):', geo.attributes.normal.array.slice(0, 3)); // (0, 0, -1)

// Now reverse winding (swap v1 and v2):
const posFixed = new Float32Array([
  0, 0, 0,
  0, 1, 0,
  -1, 0, 0
]);
geo.setAttribute('position', new THREE.BufferAttribute(posFixed, 3));
geo.computeVertexNormals();
console.log('Normal after winding fix (outward):', geo.attributes.normal.array.slice(0, 3)); // (0, 0, 1)

