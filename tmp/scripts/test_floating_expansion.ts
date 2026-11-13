if (typeof globalThis.document === 'undefined') {
  const dummyCtx: any = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'measureText') return () => ({ width: 0 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop: () => { } });
      }
      return () => { };
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
console.log('Floating bars:', floatingRes.floatingBars);
if (floatingRes.floatingBars > 0) {
  floatingRes.floatingList.forEach(f => {
    console.log(`  - ${f.label} (${f.reason})`);
  });
} else {
  console.log('✅ Nenhuma barra flutuando! Verificação estrutural passou 100%');
}
