const THREE = require('three');

// Create a simple box or triangle
const geom = new THREE.BufferGeometry();
// Triangle with vertices: (0,0,0), (1,0,0), (0,1,0)
// CCW winding: normal points towards +Z
const vertices = new Float32Array([
  0, 0, 0,
  1, 0, 0,
  0, 1, 0
]);
geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
geom.computeVertexNormals();

const norm = geom.attributes.normal;
console.log('Original normal:', norm.getX(0), norm.getY(0), norm.getZ(0));

// Now invert X and Z (180 deg rotation):
// (0,0,0) -> (0,0,0)
// (1,0,0) -> (-1,0,0)
// (0,1,0) -> (0,1,0)
// Cross product: (-1, 0, 0) x (0, 1, 0) = (0, 0, -1) -> Normal points towards -Z (opposite side!)
// Because winding order was NOT reversed!
const vRot = new Float32Array([
  -0, 0, -0,
  -1, 0, -0,
  -0, 1, -0
]);
const geomRot = new THREE.BufferGeometry();
geomRot.setAttribute('position', new THREE.BufferAttribute(vRot, 3));
geomRot.computeVertexNormals();
const normRot = geomRot.attributes.normal;
console.log('Rotated vertices normal:', normRot.getX(0), normRot.getY(0), normRot.getZ(0));

// With obj.rotation.y = Math.PI:
const mesh = new THREE.Mesh(geom);
mesh.rotation.y = Math.PI;
mesh.updateMatrixWorld();
console.log('Object3D rotation.y = Math.PI keeps winding order intact!');

