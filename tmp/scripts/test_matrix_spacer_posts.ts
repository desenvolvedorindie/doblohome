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
import { SlideDirection, PanelOrientation } from '../../src/types/index.ts';

const scene = new THREE.Scene();
const solar = new SolarSystem(scene);
solar.setStackLevels(2);

const testConfigs: Array<{
  name: string;
  l1Dir: SlideDirection;
  l1Orient: PanelOrientation;
  l1Panels: number;
  l2Dir: SlideDirection;
  l2Orient: PanelOrientation;
  l2Panels: number;
  expansion: number;
}> = [
  { name: 'Padrão Retraído', l1Dir: 'longitudinal', l1Orient: 'longitudinal', l1Panels: 2, l2Dir: 'fixed', l2Orient: 'longitudinal', l2Panels: 2, expansion: 0.0 },
  { name: 'Padrão Expandido', l1Dir: 'longitudinal', l1Orient: 'longitudinal', l1Panels: 2, l2Dir: 'fixed', l2Orient: 'longitudinal', l2Panels: 2, expansion: 1.0 },
  { name: 'Transversal Retraído', l1Dir: 'longitudinal', l1Orient: 'transverse', l1Panels: 2, l2Dir: 'fixed', l2Orient: 'transverse', l2Panels: 2, expansion: 0.0 },
  { name: 'Transversal Expandido', l1Dir: 'longitudinal', l1Orient: 'transverse', l1Panels: 2, l2Dir: 'fixed', l2Orient: 'transverse', l2Panels: 2, expansion: 1.0 },
  { name: 'Lateral Expandido', l1Dir: 'lateral', l1Orient: 'longitudinal', l1Panels: 2, l2Dir: 'fixed', l2Orient: 'longitudinal', l2Panels: 2, expansion: 1.0 },
  { name: 'Rear Only Expandido', l1Dir: 'rear_only', l1Orient: 'longitudinal', l1Panels: 2, l2Dir: 'fixed', l2Orient: 'longitudinal', l2Panels: 2, expansion: 1.0 },
  { name: '4 Placas L1 Expandido', l1Dir: 'longitudinal', l1Orient: 'longitudinal', l1Panels: 4, l2Dir: 'fixed', l2Orient: 'longitudinal', l2Panels: 2, expansion: 1.0 },
  { name: '4 Placas L2 Retraído', l1Dir: 'longitudinal', l1Orient: 'longitudinal', l1Panels: 2, l2Dir: 'fixed', l2Orient: 'longitudinal', l2Panels: 4, expansion: 0.0 }
];

let allPassed = true;

for (const cfg of testConfigs) {
  solar.setLevel1Panels(cfg.l1Panels);
  solar.setLevel1Direction(cfg.l1Dir);
  solar.setLevel1Orientation(cfg.l1Orient);

  solar.setLevel2Panels(cfg.l2Panels);
  solar.setLevel2Direction(cfg.l2Dir);
  solar.setLevel2Orientation(cfg.l2Orient);

  solar.updateExpansion(cfg.expansion);
  scene.updateMatrixWorld(true);

  const fRes = FloatingChecker.checkAll(scene);
  const cRes = CollisionChecker.checkAll(scene);

  const status = (fRes.floatingBars === 0 && cRes.collisions.length === 0) ? '✅ OK' : '❌ FALHA';
  console.log(`[${status}] ${cfg.name} -> Flutuando: ${fRes.floatingBars}, Colisões: ${cRes.collisions.length}`);
  if (fRes.floatingBars > 0 || cRes.collisions.length > 0) {
    allPassed = false;
    fRes.floatingList.forEach(f => console.log(`   - Flutuando: ${f.label}`));
    cRes.collisions.forEach(c => console.log(`   - Colisão: ${c.labelA} com ${c.labelB}`));
  }
}

if (allPassed) {
  console.log('\n🎉 Todos os cenários testados passaram perfeitamente sem barras flutuantes e sem colisões!');
}

