import * as THREE from 'three';

console.log('Testing ExtrudeGeometry for mattress with cutout...');

// Suppose cushion is from minX = -0.4, maxX = 0.4, minZ = -0.85, maxZ = 0.85
// Cabinet is at rear: from minZ = -0.85 to -0.60 (depth 250mm),
// and width 300mm on the right side: from minX = -0.4 to -0.1.
// So cutout is [minX: -0.4, maxX: -0.1] x [minZ: -0.85, maxZ: -0.60].

const cMinX = -0.4;
const cMaxX = 0.4;
const cMinZ = -0.85;
const cMaxZ = 0.85;
const thickness = 0.08;

// L-shaped polygon on X-Z plane:
// In THREE.Shape, coordinates are (x, y). We map x -> 3D X, y -> -3D Z (or 3D Z).
// If we rotateX(-Math.PI / 2), then Shape's +Y becomes 3D -Z!
// Therefore, 3D Z = -Shape Y, so Shape Y = -3D Z.
const shape = new THREE.Shape();

// Clockwise or counter-clockwise in (x, -z):
// 1. (cMinX, -cMaxZ) -> front-right
// 2. (cMaxX, -cMaxZ) -> front-left
// 3. (cMaxX, -cMinZ) -> rear-left
// 4. (-0.1, -cMinZ)  -> edge of cutout
// 5. (-0.1, -(-0.6)) -> corner of cutout
// 6. (cMinX, -(-0.6))-> cutout meets side
shape.moveTo(cMinX, -cMaxZ);
shape.lineTo(cMaxX, -cMaxZ);
shape.lineTo(cMaxX, -cMinZ);
shape.lineTo(-0.1, -cMinZ);
shape.lineTo(-0.1, 0.6);
shape.lineTo(cMinX, 0.6);
shape.closePath();

const geo = new THREE.ExtrudeGeometry(shape, {
  depth: thickness,
  bevelEnabled: false
});

// Rotate so depth (which was in +Z) becomes +Y, and Shape Y becomes -Z:
geo.rotateX(-Math.PI / 2);
geo.translate(0, -thickness / 2, 0);

geo.computeBoundingBox();
console.log('Extruded Geo BoundingBox:', geo.boundingBox);
console.log('Success!');
