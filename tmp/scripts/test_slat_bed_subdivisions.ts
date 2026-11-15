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

console.log('--- TESTANDO CAMA DE RIPAS POR SUBDIVISÕES DO GRID ---');
console.log(`Grid total: ${grid.widthMm}mm largura x ${grid.lengthMm}mm comp | cols=${grid.colsX}, rows=${grid.rowsZ}`);
console.log(`Largura de cada coluna: ${grid.widthMm / grid.colsX} mm\n`);

const partsToTest: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];

partsToTest.forEach(parts => {
  const box: InternalBoxItem = {
    id: `slat_bed_${parts}`,
    name: `Cama ${parts} Subdivisões`,
    colStart: 0,
    rowStart: 0,
    colSpan: 1, // ocupa 1 coluna na base (400mm)
    rowSpan: 3,
    heightMm: 400,
    type: 'slat_bed',
    color: '#0284c7',
    material: 'compensado_naval',
    slatBedDirection: 'left',
    slatExtensionPercent: 100,
    mattressParts: parts
  };

  const builder = new InternalBoxesBuilder(scene, group);

  // Teste 1: Aberta (100% estendida)
  const openBoxesGroup = new THREE.Group();
  (builder as any).boxesGroup = openBoxesGroup;
  builder.update(grid, [box], box.id, true, null);

  const cushions: any[] = [];
  openBoxesGroup.traverse(child => {
    if (child instanceof THREE.Mesh && child.userData?.isUpholstery) {
      cushions.push(child);
    }
  });

  console.log(`[CAMA ABERTA - ${parts} SUBDIVISÕES]`);
  console.log(`  Almofadas encontradas: ${cushions.length} (esperado: ${parts})`);
  if (cushions.length !== parts) {
    throw new Error(`Esperava ${parts} almofadas, obteve ${cushions.length}`);
  }

  cushions.forEach((c, idx) => {
    const geo = c.geometry as THREE.BoxGeometry;
    const w = (geo.parameters.width * 1000).toFixed(0);
    const l = (geo.parameters.depth * 1000).toFixed(0);
    const h = (geo.parameters.height * 1000).toFixed(0);
    console.log(`    Almofada #${idx + 1}: Dimensões = ${w}x${l}x${h}mm | PosX = ${(c.position.x * 1000).toFixed(1)}mm`);
  });

  // Para 3 partes com cols=3 (1200mm): deve cobrir toda a largura (1.20m)
  if (parts === 3) {
    const minX = Math.min(...cushions.map(c => c.position.x - (c.geometry as THREE.BoxGeometry).parameters.width / 2));
    const maxX = Math.max(...cushions.map(c => c.position.x + (c.geometry as THREE.BoxGeometry).parameters.width / 2));
    const totalSpanMm = (maxX - minX) * 1000;
    console.log(`  -> Vão total coberto pelas 3 almofadas: ${totalSpanMm.toFixed(0)}mm (próximo de 1200mm da van)`);
    if (totalSpanMm < 1150 || totalSpanMm > 1250) {
      throw new Error(`Vão total incorreto para 3 subdivisões: ${totalSpanMm}mm`);
    }
  }

  // Teste 2: Fechada (Modo Sofá)
  const closedBoxesGroup = new THREE.Group();
  (builder as any).boxesGroup = closedBoxesGroup;
  builder.update(grid, [box], box.id, false, null);

  const closedCushions: any[] = [];
  closedBoxesGroup.traverse(child => {
    if (child instanceof THREE.Mesh && child.userData?.isUpholstery) {
      closedCushions.push(child);
    }
  });

  console.log(`[CAMA FECHADA / SOFÁ - ${parts} SUBDIVISÕES]`);
  console.log(`  Almofadas empilhadas no sofá: ${closedCushions.length}`);
  closedCushions.forEach((c, idx) => {
    const geo = c.geometry as THREE.BoxGeometry;
    const w = (geo.parameters.width * 1000).toFixed(0);
    const h = (geo.parameters.height * 1000).toFixed(0);
    console.log(`    Camada #${idx + 1}: ${w}mm larg x ${h}mm espessura | PosY = ${(c.position.y * 1000).toFixed(1)}mm | PosX = ${(c.position.x * 1000).toFixed(1)}mm`);
  });
  console.log('');
});

console.log('✅ TODOS OS TESTES DE SUBDIVISÕES DA CAMA PASSARAM COM SUCESSO!');
