import * as THREE from 'three';

const v = new THREE.Vector3(1, 2, 0); // X=1, Y=2
v.applyAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
console.log(`After rotateX(-90 deg): X=${v.x}, Y=${v.y}, Z=${v.z}`);
