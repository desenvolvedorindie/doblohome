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

let hoodZ: number[] = [];
let trunkZ: number[] = [];

obj.traverse((child: any) => {
  if (child.isMesh && child.geometry) {
    const pos = child.geometry.attributes.position;
    const name = child.name.toLowerCase();
    if (name.includes('capo') || name.includes('farol')) {
      for (let i = 0; i < pos.count; i++) {
        hoodZ.push((pos.getY(i) - offsetY) * scale);
      }
    }
    if (name.includes('door_rear') || name.includes('traseir')) {
      for (let i = 0; i < pos.count; i++) {
        trunkZ.push((pos.getY(i) - offsetY) * scale);
      }
    }
  }
});

const avgHoodZ = hoodZ.reduce((a, b) => a + b, 0) / hoodZ.length;
const avgTrunkZ = trunkZ.reduce((a, b) => a + b, 0) / trunkZ.length;

console.log(`Car Front (Faróis / Capô): Z = ${avgHoodZ.toFixed(2)}m (NEGATIVE Z)`);
console.log(`Car Rear (Porta-malas): Z = ${avgTrunkZ.toFixed(2)}m (POSITIVE Z)`);

// Now check rack
const RACK_OFFSET_Z = 0.40;
const SUBCHASSIS_LENGTH = 2.20;
const rackEndNegative = RACK_OFFSET_Z - SUBCHASSIS_LENGTH / 2; // -0.70m
const rackEndPositive = RACK_OFFSET_Z + SUBCHASSIS_LENGTH / 2; // +1.50m

console.log(`Rack end at NEGATIVE Z: ${rackEndNegative.toFixed(2)}m (THIS IS TOWARDS THE FRONT OF THE CAR!)`);
console.log(`Rack end at POSITIVE Z: ${rackEndPositive.toFixed(2)}m (THIS IS TOWARDS THE REAR OF THE CAR!)`);

