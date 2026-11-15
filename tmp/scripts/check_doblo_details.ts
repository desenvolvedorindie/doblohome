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
  if (child.isMesh && child.geometry) {
    const pos = child.geometry.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const x_sk = pos.getX(i);
        const y_sk = pos.getY(i);
        const z_sk = pos.getZ(i);
        pos.setXYZ(
          i,
          (x_sk - offsetX) * scale,
          (z_sk - offsetZ) * scale,
          (y_sk - offsetY) * scale
        );
      }
      pos.needsUpdate = true;
      child.geometry.computeBoundingBox();
    }
  }
});

// Let's find specific body parts in the OBJ:
// 1. Windshield / Para-brisa
// 2. Trunk door / Porta traseira
// 3. Seats / Bancos
// 4. Steering wheel / Volante
// 5. Roof / Teto

obj.traverse((child: any) => {
  if (child.isMesh) {
    const name = child.name.toLowerCase();
    const bb = child.geometry.boundingBox;
    if (/volante|steering|banco|seat|porta|door|teto|roof|hood|capo|mala|painel|dashboard/i.test(name)) {
      console.log(`Part: ${child.name}`);
      console.log(`  Z: [${bb.min.z.toFixed(2)}, ${bb.max.z.toFixed(2)}]`);
      console.log(`  Y: [${bb.min.y.toFixed(2)}, ${bb.max.y.toFixed(2)}]`);
      console.log(`  X: [${bb.min.x.toFixed(2)}, ${bb.max.x.toFixed(2)}]`);
    }
  }
});

