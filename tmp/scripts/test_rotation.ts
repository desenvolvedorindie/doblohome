import * as THREE from 'three';

const theta = 0.5;
const m = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 1));
m.rotation.x = theta;
m.updateMatrixWorld();
const p1 = new THREE.Vector3(0, 5, 0).applyMatrix4(m.matrixWorld);
const p2 = new THREE.Vector3(0, -5, 0).applyMatrix4(m.matrixWorld);
console.log('p1:', p1);
console.log('p2:', p2);
console.log('dY:', p1.y - p2.y, 'dZ:', p1.z - p2.z);
console.log('cos(0.5)*10:', Math.cos(0.5)*10, 'sin(0.5)*10:', Math.sin(0.5)*10);

