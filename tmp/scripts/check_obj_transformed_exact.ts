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

let minZ = Infinity, maxZ = -Infinity;
let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

obj.traverse((child: any) => {
  if (child.isMesh && child.geometry) {
    const pos = child.geometry.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const x_sk = pos.getX(i);
        const y_sk = pos.getY(i);
        const z_sk = pos.getZ(i);

        const x = (x_sk - offsetX) * scale;
        const y = (z_sk - offsetZ) * scale;
        const z = (y_sk - offsetY) * scale;

        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
});

console.log('TRANSFORMED DOBLO OBJ BOUNDS:');
console.log(`X: [${minX.toFixed(3)}, ${maxX.toFixed(3)}]`);
console.log(`Y: [${minY.toFixed(3)}, ${maxY.toFixed(3)}]`);
console.log(`Z: [${minZ.toFixed(3)}, ${maxZ.toFixed(3)}]`);

// Find the front grille / Fiat logo
obj.traverse((child: any) => {
  if (child.isMesh) {
    const name = child.name.toLowerCase();
    if (name.includes('logo') || name.includes('fiat') || name.includes('farol') || name.includes('grade')) {
      const pos = child.geometry.attributes.position;
      let avgZ = 0;
      for (let i = 0; i < pos.count; i++) {
        avgZ += (pos.getY(i) - offsetY) * scale;
      }
      avgZ /= pos.count;
      console.log(`Mesh ${child.name}: center Z = ${avgZ.toFixed(3)}`);
    }
  }
});

