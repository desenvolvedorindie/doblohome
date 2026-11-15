import * as THREE from 'three';

// Let's test centering the shape at (0, 0)
interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function testCenteredShape() {
  const c: Rect = { minX: -0.2, maxX: 0.2, minZ: -0.85, maxZ: 0.85 };
  const cut: Rect = { minX: -0.2, maxX: 0.0, minZ: -0.85, maxZ: -0.55 };
  const thickness = 0.08;

  const cCenterX = (c.minX + c.maxX) / 2;
  const cCenterZ = (c.minZ + c.maxZ) / 2;

  // Local coordinates relative to cushion center
  const lx0 = c.minX - cCenterX;
  const lx1 = c.maxX - cCenterX;
  const ly0 = -(c.maxZ - cCenterZ); // front: min y in shape
  const ly1 = -(c.minZ - cCenterZ); // rear: max y in shape

  const ox0 = cut.minX - cCenterX;
  const ox1 = cut.maxX - cCenterX;
  const oy0 = -(cut.maxZ - cCenterZ);
  const oy1 = -(cut.minZ - cCenterZ);

  const shape = new THREE.Shape();
  // Rear-Right cut:
  shape.moveTo(lx0, ly0);
  shape.lineTo(lx1, ly0);
  shape.lineTo(lx1, ly1);
  shape.lineTo(ox1, ly1);
  shape.lineTo(ox1, oy0);
  shape.lineTo(lx0, oy0);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -thickness / 2, 0);

  const mesh = new THREE.Mesh(geo);
  mesh.position.set(cCenterX, 0.45, cCenterZ);
  mesh.updateMatrixWorld();

  const worldBox = new THREE.Box3().setFromObject(mesh);
  console.log('Mesh World Box:', worldBox);
}

testCenteredShape();
