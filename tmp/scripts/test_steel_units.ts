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

const scene = new THREE.Scene();
const solar = new SolarSystem(scene);
solar.setStackLevels(2);

console.log('=== TESTE 1: Ferro Soldado em MILÍMETROS (mm) ===');
solar.setStructureMaterial('steel');
solar.setSteelProfileUnit('mm');
scene.updateMatrixWorld(true);

const specsMm = new Set<string>();
scene.traverse((obj) => {
  if (obj.userData?.isBar && obj.userData.profileSpec) {
    specsMm.add(obj.userData.profileSpec);
  }
});
console.log('Especificações de perfil encontradas (mm):', Array.from(specsMm));

const fResMm = FloatingChecker.checkAll(scene);
const cResMm = CollisionChecker.checkAll(scene);
console.log(`Flutuando (mm): ${fResMm.floatingBars}, Colisões (mm): ${cResMm.collisions.length}`);

console.log('\n=== TESTE 2: Ferro Soldado em POLEGADAS (inch / ") ===');
solar.setSteelProfileUnit('inch');
scene.updateMatrixWorld(true);

const specsInch = new Set<string>();
scene.traverse((obj) => {
  if (obj.userData?.isBar && obj.userData.profileSpec) {
    specsInch.add(obj.userData.profileSpec);
  }
});
console.log('Especificações de perfil encontradas (inch):', Array.from(specsInch));

const fResInch = FloatingChecker.checkAll(scene);
const cResInch = CollisionChecker.checkAll(scene);
console.log(`Flutuando (inch): ${fResInch.floatingBars}, Colisões (inch): ${cResInch.collisions.length}`);

console.log('\n=== TESTE 3: Alternando de volta para Alumínio ===');
solar.setStructureMaterial('aluminum');
scene.updateMatrixWorld(true);

const specsAlu = new Set<string>();
scene.traverse((obj) => {
  if (obj.userData?.isBar && obj.userData.profileSpec) {
    specsAlu.add(obj.userData.profileSpec);
  }
});
console.log('Especificações de perfil encontradas (Alu):', Array.from(specsAlu));

const fResAlu = FloatingChecker.checkAll(scene);
const cResAlu = CollisionChecker.checkAll(scene);
console.log(`Flutuando (Alu): ${fResAlu.floatingBars}, Colisões (Alu): ${cResAlu.collisions.length}`);

if (
  fResMm.floatingBars === 0 && cResMm.collisions.length === 0 &&
  fResInch.floatingBars === 0 && cResInch.collisions.length === 0 &&
  fResAlu.floatingBars === 0 && cResAlu.collisions.length === 0 &&
  Array.from(specsInch).some(s => s.includes('1 ½"') || s.includes('1 ¼"'))
) {
  console.log('\n✅ TODOS OS TESTES DE UNIDADE DE PERFIL DE FERRO PASSARAM COM 100% DE SUCESSO!');
} else {
  console.error('\n❌ ERRO EM UM DOS TESTES DE UNIDADE!');
  process.exit(1);
}

