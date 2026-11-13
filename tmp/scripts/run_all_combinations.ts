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
import { SlideDirection, PanelOrientation } from '../../src/types/index.ts';

const scene = new THREE.Scene();
const solar = new SolarSystem(scene);

// Inohouse 100W preset
solar.setPanelSpecs({
  width: 0.590,
  length: 0.875,
  thickness: 0.003,
  cellCols: 4,
  cellRows: 8
});
solar.setStackLevels(2);

const panelsOptions = [1, 2, 3, 4];
const directions: SlideDirection[] = ['fixed', 'longitudinal', 'lateral', 'rear_only'];
const orientations: PanelOrientation[] = ['longitudinal', 'transverse'];

const expansions = [0.0, 1.0]; // 0 = retraído, 1 = expandido -> 1024 * 2 = 2048 combinações

interface FailureReport {
  id: number;
  expansion: number;
  l1: { panels: number; dir: string; orient: string };
  l2: { panels: number; dir: string; orient: string };
  collisions: Array<{ labelA: string; labelB: string; volCm3: number; axisA: string; axisB: string }>;
}

const failures: FailureReport[] = [];
let testCount = 0;
const startTime = Date.now();

console.log('Iniciando varredura das 2048 combinações...');

for (const expansion of expansions) {
  for (const p1 of panelsOptions) {
    for (const d1 of directions) {
      for (const o1 of orientations) {
        for (const p2 of panelsOptions) {
          for (const d2 of directions) {
            for (const o2 of orientations) {
              testCount++;

              solar.setLevel1Panels(p1);
              solar.setLevel1Direction(d1);
              solar.setLevel1Orientation(o1);

              solar.setLevel2Panels(p2);
              solar.setLevel2Direction(d2);
              solar.setLevel2Orientation(o2);

              solar.updateExpansion(expansion);

              const summary = CollisionChecker.checkAll(scene);

              if (summary.errorCount > 0) {
                failures.push({
                  id: testCount,
                  expansion,
                  l1: { panels: p1, dir: d1, orient: o1 },
                  l2: { panels: p2, dir: d2, orient: o2 },
                  collisions: summary.collisions.map(c => ({
                    labelA: c.labelA,
                    labelB: c.labelB,
                    volCm3: c.overlapVolumeM3 * 1e6,
                    axisA: c.axisA,
                    axisB: c.axisB
                  }))
                });
              }

              if (testCount % 256 === 0) {
                console.log(`Progresso: ${testCount} / 2048 testes (${failures.length} falhas até agora)`);
              }
            }
          }
        }
      }
    }
  }
}

const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\n==========================================`);
console.log(`Varredura concluída em ${durationSec}s`);
console.log(`Total de combinações testadas: ${testCount}`);
console.log(`Total de falhas (colisões): ${failures.length}`);

if (failures.length > 0) {
  console.log(`\nExemplos de falhas encontradas (${Math.min(10, failures.length)} primeiros):`);
  failures.slice(0, 10).forEach((f, idx) => {
    console.log(`\n[Falha #${idx + 1} - Teste #${f.id}] Expansão: ${f.expansion}`);
    console.log(`  L1: ${f.l1.panels}p, ${f.l1.dir}, ${f.l1.orient}`);
    console.log(`  L2: ${f.l2.panels}p, ${f.l2.dir}, ${f.l2.orient}`);
    f.collisions.forEach((c, cIdx) => {
      console.log(`    Colisão ${cIdx + 1}: ${c.labelA} × ${c.labelB} (${c.axisA} vs ${c.axisB}, vol ≈ ${c.volCm3.toFixed(2)} cm³)`);
    });
  });
} else {
  console.log('PERFEITO! Zero colisões em todas as 2048 combinações!');
}

