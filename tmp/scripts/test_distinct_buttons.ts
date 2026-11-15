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
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder.ts';
import { InternalBoxItem, InternalGridConfig } from '../../src/types/index.ts';

const scene = new THREE.Scene();
const group = new THREE.Group();
scene.add(group);

const grid: InternalGridConfig = {
  lengthMm: 1700,
  widthMm: 1200,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4
};

const chestBox: InternalBoxItem = {
  id: 'box_chest',
  name: 'Baú',
  colStart: 1,
  rowStart: 0,
  colSpan: 1,
  rowSpan: 2,
  heightMm: 400,
  type: 'chest',
  color: '#0284c7',
  material: 'compensado_naval',
  chestHingeDirection: 'front',
  upperCabinet: true
};

const slatBedBox: InternalBoxItem = {
  id: 'box_bed',
  name: 'Cama Retrátil',
  colStart: 0,
  rowStart: 0,
  colSpan: 1,
  rowSpan: 3,
  heightMm: 400,
  type: 'slat_bed',
  color: '#0284c7',
  material: 'compensado_naval',
  slatBedDirection: 'left',
  slatExtensionPercent: 100,
  mattressParts: 3
};

const boxes = [chestBox, slatBedBox];

console.log('--- TESTE DE BOTÕES DISTINTOS: ABRIR ARMÁRIOS vs ABRIR CAMA vs EXIBIR COLCHÃO ---');

const builder = new InternalBoxesBuilder(scene, group);

// Cenário 1: Abrir apenas os armários (cama fechada, colchão oculto)
{
  const testGroup = new THREE.Group();
  (builder as any).boxesGroup = testGroup;
  builder.update(grid, boxes, null, { openCabinets: true, openBed: false, showMattress: false }, null);

  let mattressCount = 0;
  let chestLidPivoted = false;
  let upperCabinetDoorPivoted = false;
  let bedSlidingFrameOffset = 0;

  testGroup.traverse(child => {
    if (child.userData?.isUpholstery) mattressCount++;
    if (child.name === 'ChestLidPivot' && (child.rotation.x !== 0 || child.rotation.z !== 0)) {
      chestLidPivoted = true;
    }
    if (child.name === 'UpperCabinetDoorPivot' && (child.rotation.x !== 0 || child.rotation.z !== 0)) {
      upperCabinetDoorPivoted = true;
    }
    if (child.name === 'SlatBedSlidingFrame') {
      bedSlidingFrameOffset = Math.abs(child.position.x);
    }
  });

  console.log('[Cenário 1: Somente Armários Abertos]');
  console.log(`  - Tampas/Portas de armários abertas: ${chestLidPivoted} (esperado: true)`);
  console.log(`  - Deslocamento da cama retrátil: ${bedSlidingFrameOffset}m (esperado: 0 - cama fechada)`);
  console.log(`  - Almofadas de colchão renderizadas: ${mattressCount} (esperado: 0 - colchão oculto)`);

  if (!chestLidPivoted || bedSlidingFrameOffset !== 0 || mattressCount !== 0) {
    throw new Error('Falha no Cenário 1: armários deveriam abrir sem mexer na cama ou colchão');
  }
}

// Cenário 2: Abrir apenas a cama com colchão (armários fechados)
{
  const testGroup = new THREE.Group();
  (builder as any).boxesGroup = testGroup;
  builder.update(grid, boxes, null, { openCabinets: false, openBed: true, showMattress: true }, null);

  let mattressCount = 0;
  let chestLidPivoted = false;
  let bedSlidingFrameOffset = 0;

  testGroup.traverse(child => {
    if (child.userData?.isUpholstery) mattressCount++;
    if (child.name === 'ChestLidPivot' && (child.rotation.x !== 0 || child.rotation.z !== 0)) {
      chestLidPivoted = true;
    }
    if (child.name === 'SlatBedSlidingFrame') {
      bedSlidingFrameOffset = Math.abs(child.position.x);
    }
  });

  console.log('[Cenário 2: Somente Cama Aberta + Colchão Exibido]');
  console.log(`  - Armários abertos: ${chestLidPivoted} (esperado: false - armários fechados)`);
  console.log(`  - Deslocamento da cama retrátil: ${(bedSlidingFrameOffset * 1000).toFixed(0)}mm (esperado: 800mm curso total)`);
  console.log(`  - Almofadas de colchão renderizadas: ${mattressCount} (esperado: 3 - colchão exibido)`);

  if (chestLidPivoted || bedSlidingFrameOffset < 0.75 || mattressCount !== 3) {
    throw new Error('Falha no Cenário 2: cama e colchão deveriam abrir sem abrir os armários');
  }
}

// Cenário 3: Cama aberta SEM colchão (apenas ripas de madeira expostas)
{
  const testGroup = new THREE.Group();
  (builder as any).boxesGroup = testGroup;
  builder.update(grid, boxes, null, { openCabinets: false, openBed: true, showMattress: false }, null);

  let mattressCount = 0;
  let bedSlidingFrameOffset = 0;

  testGroup.traverse(child => {
    if (child.userData?.isUpholstery) mattressCount++;
    if (child.name === 'SlatBedSlidingFrame') {
      bedSlidingFrameOffset = Math.abs(child.position.x);
    }
  });

  console.log('[Cenário 3: Cama Aberta com Colchão Oculto]');
  console.log(`  - Deslocamento da cama: ${(bedSlidingFrameOffset * 1000).toFixed(0)}mm (esperado: 800mm)`);
  console.log(`  - Almofadas de colchão renderizadas: ${mattressCount} (esperado: 0 - visualização da madeira)`);

  if (bedSlidingFrameOffset < 0.75 || mattressCount !== 0) {
    throw new Error('Falha no Cenário 3: cama aberta deveria permitir ocultar o colchão');
  }
}

console.log('\n✅ TODOS OS TESTES DE BOTÕES DISTINTOS PASSARAM COM SUCESSO!');
