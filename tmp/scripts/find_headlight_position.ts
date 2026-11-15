import * as THREE from 'three';
import { DobloVehicle } from '../../src/three/DobloModel';

// Let's create DobloVehicle and see child positions
const vehicle = new DobloVehicle();

setTimeout(() => {
  console.log('Vehicle children count:', vehicle.group.children.length);
  vehicle.group.traverse((c: any) => {
    if (c.isMesh) {
      const name = c.name.toLowerCase();
      if (/hood|farol|light|windshield|rear|traseira|porta|door/i.test(name)) {
        c.geometry.computeBoundingBox();
        const bb = c.geometry.boundingBox;
        console.log(`Mesh: ${c.name} -> Z: [${bb.min.z.toFixed(2)}, ${bb.max.z.toFixed(2)}]`);
      }
    }
  });
}, 200);

