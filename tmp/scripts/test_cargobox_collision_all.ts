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
import { StructureMaterial } from '../../src/types/index.ts';

const scene = new THREE.Scene();
const solar = new SolarSystem(scene);

const materials: StructureMaterial[] = ['steel', 'aluminum', 'aluminum_tube'];
const telescopicOptions = [true, false];
const boxEnabledOptions = [true, false];
const lifts = [0, 50, 100];
const expansions = [0.0, 0.5, 1.0];

let total = 0;
let failed = 0;

console.log('Testando colisões com Baú, Torres e Materiais...');

for (const mat of materials) {
  solar.setStructureMaterial(mat);
  for (const boxOn of boxEnabledOptions) {
    solar.setCargoBoxEnabled(boxOn);
    for (const tele of telescopicOptions) {
      solar.setCargoBoxTelescopic(tele);
      for (const lift of (boxOn ? lifts : [0])) {
        solar.setCargoBoxVerticalLift(lift);
        for (const exp of expansions) {
          total++;
          solar.updateExpansion(exp);
          const summary = CollisionChecker.checkAll(scene);
          if (summary.errorCount > 0) {
            failed++;
            console.error(`FALHA no teste mat=${mat}, box=${boxOn}, tele=${tele}, lift=${lift}, exp=${exp}`);
            for (const c of summary.collisions) {
              console.error(`  ${c.labelA} × ${c.labelB} (vol=${(c.overlapVolumeM3 * 1e6).toFixed(2)} cm³)`);
            }
          }
        }
      }
    }
  }
}

console.log(`Finalizado: ${total} testes, ${failed} falhas.`);
if (failed === 0) {
  console.log('100% LIMPO DE COLISÕES EM TODOS OS CENÁRIOS DE BAÚ E ESTRUTURA!');
} else {
  process.exit(1);
}
