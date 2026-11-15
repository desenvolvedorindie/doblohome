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

const parts: { name: string; minZ: number; maxZ: number; centerZ: number }[] = [];

obj.traverse((child: any) => {
  if (child.isMesh && child.geometry) {
    const pos = child.geometry.attributes.position;
    if (pos) {
      let minZ = Infinity, maxZ = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        const y_sk = pos.getY(i);
        const z_three = (y_sk - offsetY) * scale;
        if (z_three < minZ) minZ = z_three;
        if (z_three > maxZ) maxZ = z_three;
      }
      parts.push({
        name: child.name,
        minZ,
        maxZ,
        centerZ: (minZ + maxZ) / 2
      });
    }
  }
});

// Find headlights, taillights, windshield, etc.
console.log('Total meshes in OBJ:', parts.length);
const interesting = parts.filter(p => 
  /farol|light|stop|lanterna|bumper|glass|vidro|windshield|wheel|roda/i.test(p.name)
);
console.log('Interesting parts:');
interesting.slice(0, 25).forEach(p => {
  console.log(`- ${p.name}: Z = [${p.minZ.toFixed(2)}, ${p.maxZ.toFixed(2)}] (center: ${p.centerZ.toFixed(2)})`);
});

// Also find min and max Z overall
let overallMinZ = Infinity, overallMaxZ = -Infinity;
parts.forEach(p => {
  if (p.minZ < overallMinZ) overallMinZ = p.minZ;
  if (p.maxZ > overallMaxZ) overallMaxZ = p.maxZ;
});
console.log('\nOVERALL OBJ Z bounds:', overallMinZ.toFixed(2), 'to', overallMaxZ.toFixed(2));

