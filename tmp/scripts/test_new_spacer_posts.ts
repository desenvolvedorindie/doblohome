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
import { FloatingChecker } from '../../src/three/FloatingChecker.ts';
import { CollisionChecker } from '../../src/three/CollisionChecker.ts';

console.log('--- Testando geometria do SolarSystem com SpacerPosts ---');
const scene = new THREE.Scene();
const solar = new SolarSystem(scene);
solar.setStackLevels(2);
solar.setLevel1Panels(2);
solar.setLevel1Direction('longitudinal');
solar.setLevel1Orientation('longitudinal');
solar.setLevel2Panels(2);
solar.setLevel2Direction('fixed');
solar.setLevel2Orientation('longitudinal');

solar.updateExpansion(1.0);
scene.updateMatrixWorld(true);

const floatingRes = FloatingChecker.checkAll(scene);
console.log('Barras flutuando:', floatingRes.floatingBars);
if (floatingRes.floatingBars > 0) {
  floatingRes.floatingList.forEach(f => console.log(`  - [FLUTUANTE] ${f.label} (${f.reason})`));
}

const collisionRes = CollisionChecker.checkAll(scene);
console.log('Colisões:', collisionRes.collisions.length);
if (collisionRes.collisions.length > 0) {
  collisionRes.collisions.forEach(c => console.log(`  - [COLISÃO] ${c.labelA} com ${c.labelB} (vol: ${(c.overlapVolumeM3 * 1e6).toFixed(1)} cm³)`));
}

