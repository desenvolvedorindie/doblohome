import * as THREE from 'three';
import { CargoBoxSystem } from '../../src/three/CargoBox';
import { SolarSystem } from '../../src/three/SolarSystem';

const cargoBox = new CargoBoxSystem({
  enabled: true,
  length: 1600,
  width: 1000,
  height: 330,
  hingeSide: 'driver',
  tiltAngle: 0,
  lidAngle: 0
}, 2.06, 0.40);

let noseZ = 0;
let rearZ = 0;

cargoBox.group.traverse((c: any) => {
  if (c.isMesh) {
    const box = new THREE.Box3().setFromObject(c);
    const center = new THREE.Vector3();
    box.getCenter(center);
    if (c.geometry && c.geometry.parameters && c.geometry.parameters.depth === 1.6 * 0.20) {
      console.log('Found nose mesh at world Z:', center.z);
      noseZ = center.z;
    }
    if (c.geometry && c.geometry.parameters && c.geometry.parameters.width === 0.18 && c.geometry.parameters.height === 0.09) {
      console.log('Found rear emblem mesh at world Z:', center.z);
      rearZ = center.z;
    }
  }
});

console.log(`Nose Z: ${noseZ.toFixed(2)}, Rear Emblem Z: ${rearZ.toFixed(2)}`);

