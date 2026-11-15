import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as fs from 'fs';

// Let's load the OBJ and check which side the hood is on:
const objText = fs.readFileSync('public/assets/doblo.obj', 'utf8');
const loader = new OBJLoader();
const obj = loader.parse(objText);

const scale = 0.001;
const offsetX = 11424.40;
const offsetY = -343.13;
const offsetZ = 2.75;

let hoodMesh: any = null;
let rearBumperMesh: any = null;

obj.traverse((child: any) => {
  if (child.isMesh && child.geometry) {
    const pos = child.geometry.attributes.position;
    if (pos) {
      let sumZ = 0;
      for (let i = 0; i < pos.count; i++) {
        const y_sk = pos.getY(i);
        const z = (y_sk - offsetY) * scale;
        sumZ += z;
      }
      const avgZ = sumZ / pos.count;
      const name = child.name.toLowerCase();
      if (name.includes('capo') || name.includes('hood') || name.includes('farol')) {
        console.log(`Front part: ${child.name}, Z = ${avgZ.toFixed(2)}`);
      }
      if (name.includes('traseir') || name.includes('rear') || name.includes('stop') || name.includes('mala')) {
        console.log(`Rear part: ${child.name}, Z = ${avgZ.toFixed(2)}`);
      }
    }
  }
});

