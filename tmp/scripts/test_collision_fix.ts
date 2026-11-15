if (typeof globalThis.document === 'undefined') {
  const dummyCtx: any = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'measureText') return () => ({ width: 0 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop: () => {} });
      }
      return () => {};
    },
    set: () => true
  });
  (globalThis as any).document = {
    createElement: () => ({
      getContext: () => dummyCtx,
      width: 100,
      height: 100
    })
  };
}

import * as THREE from 'three';
import { SolarSystem } from '../../src/three/SolarSystem.ts';
import { CollisionChecker } from '../../src/three/CollisionChecker.ts';

// Test varying yLevel1 from 0.035 to 0.045, and dy from 0.065 to 0.080
for (const yL1Offset of [0.035, 0.040, 0.045]) {
  for (const dy of [0.065, 0.070, 0.075]) {
    const scene = new THREE.Scene();
    const solar = new SolarSystem(scene);
    
    // Override buildSystem Y values
    const curBaseY = solar.currentBaseY;
    const yL1 = curBaseY + yL1Offset;
    solar.Y_LEVEL1_LOWER = yL1;
    solar.Y_LEVEL1_UPPER = yL1;
    solar.Y_LEVEL2 = yL1 + dy;
    
    // We override SolarSystem.prototype.currentBaseY or rebuild
    // Actually, in SolarSystem lines 618-624: buildSystem re-sets them, so let's check SolarSystem code
    console.log(`yL1Offset=${yL1Offset}, dy=${dy}`);
  }
}
