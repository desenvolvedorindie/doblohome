import * as THREE from 'three';

const caseWidth = 1.40;
const extensionM = 2.00;
const baseY = 2.06;
const caseY = baseY + 0.04; // 2.10
const caseZ = -0.72;
const dropY = 0.12;
const outerZ = caseZ - extensionM; // -2.72
const outerY = caseY - dropY; // 1.98
const hw = caseWidth * 0.48;

const canvasGeo = new THREE.BufferGeometry();
const vertices = new Float32Array([
  -hw, caseY, caseZ,   // 0
   hw, caseY, caseZ,   // 1
   hw, outerY, outerZ,  // 2

  -hw, caseY, caseZ,   // 0
   hw, outerY, outerZ,  // 2
  -hw, outerY, outerZ,  // 3

  // Backfaces
  -hw, caseY, caseZ,   // 0
   hw, outerY, outerZ,  // 2
   hw, caseY, caseZ,   // 1

  -hw, caseY, caseZ,   // 0
  -hw, outerY, outerZ,  // 3
   hw, outerY, outerZ   // 2
]);

canvasGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
canvasGeo.computeVertexNormals();

console.log('CanvasGeo bounds:');
canvasGeo.computeBoundingBox();
console.log('BB min:', canvasGeo.boundingBox?.min);
console.log('BB max:', canvasGeo.boundingBox?.max);
console.log('Vertex count:', vertices.length / 3);

