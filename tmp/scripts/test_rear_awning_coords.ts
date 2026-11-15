import * as THREE from 'three';

const caseWidth = 1.4;
const extensionM = 2.0;
const caseY = 2.1;
const caseZ = -0.72;

// The OLD way:
const canvasShape = new THREE.Shape();
const hw = caseWidth * 0.48;
canvasShape.moveTo(-hw, 0);
canvasShape.lineTo(hw, 0);
canvasShape.lineTo(hw, extensionM);
canvasShape.lineTo(-hw, extensionM);
canvasShape.closePath();

const canvasGeoOld = new THREE.ShapeGeometry(canvasShape);
canvasGeoOld.rotateX(Math.PI / 2);
const meshOld = new THREE.Mesh(canvasGeoOld);
meshOld.position.set(0, caseY, caseZ);
meshOld.updateMatrixWorld(true);

const bbOld = new THREE.Box3().setFromObject(meshOld);
console.log('OLD CANVAS Z RANGE:');
console.log('Z:', `[${bbOld.min.z.toFixed(4)}, ${bbOld.max.z.toFixed(4)}]`);
console.log('Case is at Z =', caseZ);
if (bbOld.max.z > caseZ) {
  console.log('❌ OLD CANVAS EXTENDS TO THE FRONT (+Z): from', caseZ, 'to', bbOld.max.z.toFixed(4));
}

// The NEW CORRECT way:
// Direct 3D BufferGeometry spanning from caseZ to outerZ (towards the rear -Z)
const dropY = 0.12;
const outerZ = caseZ - extensionM;
const outerY = caseY - dropY;

const newGeo = new THREE.BufferGeometry();
// 4 vertices of the rectangular fabric:
// 0: top-left (case)
// 1: top-right (case)
// 2: bottom-right (outer rear)
// 3: bottom-left (outer rear)
const vertices = new Float32Array([
  -hw, caseY, caseZ,   // 0
   hw, caseY, caseZ,   // 1
   hw, outerY, outerZ,  // 2

  -hw, caseY, caseZ,   // 0
   hw, outerY, outerZ,  // 2
  -hw, outerY, outerZ,  // 3

  // Backfaces for perfect double-side
  -hw, caseY, caseZ,   // 0
   hw, outerY, outerZ,  // 2
   hw, caseY, caseZ,   // 1

  -hw, caseY, caseZ,   // 0
  -hw, outerY, outerZ,  // 3
   hw, outerY, outerZ   // 2
]);

newGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
newGeo.computeVertexNormals();

const meshNew = new THREE.Mesh(newGeo);
meshNew.updateMatrixWorld(true);
const bbNew = new THREE.Box3().setFromObject(meshNew);

console.log('\nNEW CANVAS Z RANGE:');
console.log('Z:', `[${bbNew.min.z.toFixed(4)}, ${bbNew.max.z.toFixed(4)}]`);
console.log('Y:', `[${bbNew.min.y.toFixed(4)}, ${bbNew.max.y.toFixed(4)}]`);
if (bbNew.min.z < caseZ && bbNew.max.z <= caseZ + 0.0001) {
  console.log('✅ NEW CANVAS EXTENDS TO THE REAR (-Z): from', caseZ, 'to', bbNew.min.z.toFixed(4));
}

