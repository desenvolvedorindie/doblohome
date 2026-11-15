import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as fs from 'fs';

const objText = fs.readFileSync('public/assets/doblo.obj', 'utf8');
const loader = new OBJLoader();
const obj = loader.parse(objText);

const scale = 0.001;
const offsetX = 11424.40;
const offsetY = -343.13;
const offsetZ = 2.75;

obj.traverse((child: any) => {
  if (child.isMesh) {
    const name = child.name.toLowerCase();
    if (name.includes('roda') || name.includes('wheel') || name.includes('tire') || name.includes('pneu')) {
      const pos = child.geometry.attributes.position;
      let avgZ = 0;
      for (let i = 0; i < pos.count; i++) {
        avgZ += (pos.getY(i) - offsetY) * scale;
      }
      avgZ /= pos.count;
      console.log(`Wheel: ${child.name}, Z = ${avgZ.toFixed(2)}`);
    }
  }
});

