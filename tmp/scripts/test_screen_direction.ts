import * as THREE from 'three';

const camera = new THREE.PerspectiveCamera(42, 800 / 600, 0.1, 100);
camera.position.set(3.4, 3.2, 4.2);
camera.lookAt(0, 1.85, 0);
camera.updateMatrixWorld();
camera.updateProjectionMatrix();

function toScreen(x: number, y: number, z: number) {
  const v = new THREE.Vector3(x, y, z);
  v.project(camera);
  return { screenX: v.x.toFixed(3), screenY: v.y.toFixed(3), z_in_camera: v.z.toFixed(3) };
}

console.log('CAMERA SCREEN PROJECTION TEST:');
console.log('Front Bumper (0, 0.5, +2.0):', toScreen(0, 0.5, 2.0));
console.log('Rear Bumper  (0, 0.5, -2.0):', toScreen(0, 0.5, -2.0));
console.log('Right Door Passenger (-0.8, 1.0, 0):', toScreen(-0.8, 1.0, 0));
console.log('Left Door Driver    (+0.8, 1.0, 0):', toScreen(0.8, 1.0, 0));

