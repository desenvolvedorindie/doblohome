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

let maxRoofY = -Infinity;
let roofPoints: {x: number, y: number, z: number}[] = [];

obj.traverse((child: any) => {
  if (child.isMesh && child.geometry) {
    const pos = child.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = (pos.getX(i) - offsetX) * scale;
      const y = (pos.getZ(i) - offsetZ) * scale;
      const z = (pos.getY(i) - offsetY) * scale;

      if (y > 1.70 && Math.abs(x) < 0.70 && z >= -0.70 && z <= 1.50) {
        if (y > maxRoofY) maxRoofY = y;
        roofPoints.push({ x, y, z });
      }
    }
  }
});

console.log(`Max roof Y: ${maxRoofY.toFixed(3)}m`);
const baseY = 2.06;
console.log(`BaseY of subchassis: ${baseY}m`);
console.log(`Gap between roof and subchassis center: ${(baseY - maxRoofY).toFixed(3)}m (${((baseY - maxRoofY)*100).toFixed(1)} cm)`);

