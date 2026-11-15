import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as fs from 'fs';

// Check Doblo roof Z bounds
const objText = fs.readFileSync('public/assets/doblo.obj', 'utf8');
const loader = new OBJLoader();
const obj = loader.parse(objText);

const scale = 0.001;
const offsetX = 11424.40;
const offsetY = -343.13;
const offsetZ = 2.75;

let roofMinZ = Infinity, roofMaxZ = -Infinity;
let windshieldMinZ = Infinity, windshieldMaxZ = -Infinity;

obj.traverse((child: any) => {
  if (child.isMesh && child.geometry) {
    const pos = child.geometry.attributes.position;
    const name = child.name.toLowerCase();
    for (let i = 0; i < pos.count; i++) {
      const x = (pos.getX(i) - offsetX) * scale;
      const y = (pos.getZ(i) - offsetZ) * scale;
      const z = (pos.getY(i) - offsetY) * scale;

      if (y > 1.80 && Math.abs(x) < 0.6) {
        if (z < roofMinZ) roofMinZ = z;
        if (z > roofMaxZ) roofMaxZ = z;
      }
      if (name.includes('vidro') || name.includes('glass')) {
        if (z < -0.8 && y > 1.4) {
          if (z < windshieldMinZ) windshieldMinZ = z;
          if (z > windshieldMaxZ) windshieldMaxZ = z;
        }
      }
    }
  }
});

console.log(`Doblo Roof (Y > 1.80m, |X| < 0.6m): Z in [${roofMinZ.toFixed(2)}, ${roofMaxZ.toFixed(2)}]`);
console.log(`Doblo Windshield area: Z in [${windshieldMinZ.toFixed(2)}, ${windshieldMaxZ.toFixed(2)}]`);

// Rack bounds
const RACK_OFFSET_Z = 0.40;
const SUBCHASSIS_LENGTH = 2.20;
const zRearEdge = RACK_OFFSET_Z - SUBCHASSIS_LENGTH / 2; // -0.70m
const zFrontEdge = RACK_OFFSET_Z + SUBCHASSIS_LENGTH / 2; // +1.50m
console.log(`Rack Subchassis: Z in [${zRearEdge.toFixed(2)}, ${zFrontEdge.toFixed(2)}]`);

