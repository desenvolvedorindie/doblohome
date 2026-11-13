import * as THREE from 'three';

const h = 0.40;
const l = 0.80;
const faceZ = -l / 2;
const pivotY = h / 2 - 0.022;
const shelfH = 0.30;

const delta_y = shelfH * 0.62;
const delta_z = shelfH * 0.62;
const strutL = shelfH * 0.62 * Math.SQRT2;
const strutY = pivotY - delta_y / 2;
const strutZ = faceZ - delta_z / 2;

const strutGeo = new THREE.BoxGeometry(0.008, strutL, 0.006);
strutGeo.rotateX(-Math.PI / 4);

const topPt = new THREE.Vector3(0, strutL / 2, 0).applyEuler(new THREE.Euler(-Math.PI / 4, 0, 0)).add(new THREE.Vector3(0, strutY, strutZ));
const botPt = new THREE.Vector3(0, -strutL / 2, 0).applyEuler(new THREE.Euler(-Math.PI / 4, 0, 0)).add(new THREE.Vector3(0, strutY, strutZ));

console.log('Strut lower endpoint:', botPt);
console.log('Expected lower endpoint:', { y: pivotY - delta_y, z: faceZ });
console.log('Strut upper endpoint:', topPt);
console.log('Expected upper endpoint:', { y: pivotY, z: faceZ - delta_z });
