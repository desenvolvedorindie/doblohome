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

const scene = new THREE.Scene();
const solar = new SolarSystem(scene);

// Configuração padrão
solar.setStackLevels(2);
solar.setLevel1Panels(2);
solar.setLevel1Direction('longitudinal');
solar.setLevel1Orientation('longitudinal');

solar.setLevel2Panels(2);
solar.setLevel2Direction('fixed');
solar.setLevel2Orientation('longitudinal');

solar.updateExpansion(1.0); // 100% expandido
scene.updateMatrixWorld(true);

console.log('--- Verificando Posições das Travessas Superiores e Painéis Solares (Expansão 100% NATIVA) ---');

let travessaFrontBox: THREE.Box3 | null = null;
let travessaRearBox: THREE.Box3 | null = null;
scene.traverse((obj) => {
  if (obj.userData?.barLabel === 'Travessa Superior (Dianteira)') {
    travessaFrontBox = new THREE.Box3().setFromObject(obj);
  }
  if (obj.userData?.barLabel === 'Travessa Superior (Traseira)') {
    travessaRearBox = new THREE.Box3().setFromObject(obj);
  }
});

const paineis: { name: string; box: THREE.Box3 }[] = [];
scene.traverse((obj) => {
  if (obj.name?.startsWith('PainelFlexivel_1_')) {
    const box = new THREE.Box3().setFromObject(obj);
    paineis.push({ name: obj.name, box });
  }
});

paineis.forEach(p => {
  const isFront = p.box.min.z > 0;
  const travBox = isFront ? travessaFrontBox! : travessaRearBox!;
  const overlapZ = Math.min(travBox.max.z, p.box.max.z) - Math.max(travBox.min.z, p.box.min.z);
  if (overlapZ > 0) {
    console.log(`❌ ALERTA DE SOMBRA: ${isFront ? 'Travessa Dianteira' : 'Travessa Traseira'} sobrepõe ${p.name} em ${(overlapZ * 100).toFixed(1)} cm`);
  } else {
    const clearance = isFront ? (p.box.min.z - travBox.max.z) : (travBox.min.z - p.box.max.z);
    console.log(`✅ TOTALMENTE LIVRE DE SOMBRA em ${isFront ? 'Frente' : 'Trás'}!`);
    console.log(`   Distância livre entre a Travessa Superior e o Painel Solar: ${(clearance * 100).toFixed(1)} cm`);
    console.log(`   Painel Z: [${p.box.min.z.toFixed(3)}, ${p.box.max.z.toFixed(3)}]`);
    console.log(`   Travessa Z: [${travBox.min.z.toFixed(3)}, ${travBox.max.z.toFixed(3)}]`);
  }
});
