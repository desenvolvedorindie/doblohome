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

const scene = new THREE.Scene();
const solar = new SolarSystem(scene);
solar.setStackLevels(2);
solar.setLevel1Panels(2);
solar.setLevel1Direction('longitudinal');
solar.setLevel1Orientation('transverse'); // Transversal
solar.setLevel2Panels(2);
solar.setLevel2Direction('fixed');
solar.setLevel2Orientation('transverse');

const extra = 0.12;
const delta = (extra - (-0.03));
solar['level1Motion'].travelA += delta;
solar['level1Motion'].travelB += delta;

solar.updateExpansion(1.0);
scene.updateMatrixWorld(true);

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

console.log('--- TESTE TRANSVERSAL com extra +12 cm ---');
paineis.forEach(p => {
  const isFront = p.box.min.z > 0;
  const travBox = isFront ? travessaFrontBox! : travessaRearBox!;
  const overlapZ = Math.min(travBox.max.z, p.box.max.z) - Math.max(travBox.min.z, p.box.min.z);
  if (overlapZ > 0) {
    console.log(`❌ Sombra: Sobreposição de ${(overlapZ * 100).toFixed(1)} cm em ${isFront ? 'Frente' : 'Trás'}`);
  } else {
    const clearance = isFront ? (p.box.min.z - travBox.max.z) : (travBox.min.z - p.box.max.z);
    console.log(`✅ LIVRE DE SOMBRA em ${isFront ? 'Frente' : 'Trás'}! Folga livre entre travessa e placa: ${(clearance * 100).toFixed(1)} cm`);
  }
});

