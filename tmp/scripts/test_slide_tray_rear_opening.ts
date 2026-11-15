import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { InternalBoxItem, InternalGridConfig } from '../../src/types';

console.log('--- TESTANDO ABERTURA VAZADA DA BANDEJA CORREDIÇA & GAVETÃO ---');

const dummyGrid: InternalGridConfig = {
  colsX: 3,
  rowsZ: 4,
  widthMm: 1200,
  lengthMm: 1400,
  heightMm: 420
};

const builder = new InternalBoxesBuilder();

// Caso 1: Bandeja corrediça com panels.rear explicitamente true (cenário anterior ao fix)
const slideTrayBox: InternalBoxItem = {
  id: 'box_test_slide_tray',
  name: 'Bandeja Geladeira',
  type: 'slide_tray',
  drawerMode: 'slide_tray',
  colStart: 0,
  colSpan: 1,
  rowStart: 2,
  rowSpan: 2,
  heightMm: 420,
  panels: {
    front: true,
    rear: true, // Forçando true para testar proteção
    left: true,
    right: true,
    top: true,
    bottom: false
  }
};

// Caso 2: Gavetão alto com panels.rear true
const drawerBox: InternalBoxItem = {
  id: 'box_test_drawer',
  name: 'Gavetão Mantimentos',
  type: 'drawer',
  drawerMode: 'drawer',
  colStart: 1,
  colSpan: 1,
  rowStart: 2,
  rowSpan: 2,
  heightMm: 420,
  panels: {
    front: true,
    rear: true,
    left: true,
    right: true,
    top: true,
    bottom: false
  }
};

// Caso 3: Baú com panels.rear true (deve manter o fechamento traseiro)
const chestBox: InternalBoxItem = {
  id: 'box_test_chest',
  name: 'Baú Superior',
  type: 'chest',
  colStart: 2,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 2,
  heightMm: 420,
  panels: {
    front: true,
    rear: true,
    left: true,
    right: true,
    top: true,
    bottom: false
  }
};

builder.update(
  dummyGrid,
  [slideTrayBox, drawerBox, chestBox],
  null,
  false,
  null
);

const sceneGroup = builder.group;

// Procura por peças na cena gerada (usando userData.partLabel e name)
const allParts: string[] = [];
sceneGroup.traverse((child) => {
  if (child.userData?.partLabel) {
    allParts.push(child.userData.partLabel);
  } else if (child.name) {
    allParts.push(child.name);
  }
});

// Verifica se Fechamento Traseiro foi adicionado na bandeja corrediça
const trayRearPanel = allParts.find(n => n.includes('Bandeja Geladeira') && n.includes('Fechamento Traseiro'));
console.log('1. Bandeja Geladeira possui Fechamento Traseiro?', trayRearPanel ? '❌ SIM (ERRO: tampou tudo!)' : '✅ NÃO (CORRETO: Vão 100% vazado e aberto no porta-malas)');

// Verifica se Fechamento Traseiro foi adicionado no gavetão
const drawerRearPanel = allParts.find(n => n.includes('Gavetão Mantimentos') && n.includes('Fechamento Traseiro'));
console.log('2. Gavetão Mantimentos possui Fechamento Traseiro?', drawerRearPanel ? '❌ SIM (ERRO: tampou tudo!)' : '✅ NÃO (CORRETO: Vão 100% vazado e aberto no porta-malas)');

// Verifica se Baú possui Parede Traseira
const chestRearPanel = allParts.find(n => n.includes('Baú Superior') && n.includes('Parede Traseira'));
console.log('3. Baú Superior possui Parede Traseira?', chestRearPanel ? '✅ SIM (CORRETO: Baú deve ser fechado)' : '❌ NÃO (ERRO)');

// Verifica componentes internos da bandeja corrediça
const trayBase = allParts.find(n => n.includes('Base Bandeja Corrediça Rasa'));
const trayLips = allParts.filter(n => n.includes('Aba Baixa'));
console.log('4. Base da bandeja corrediça presente?', trayBase ? '✅ SIM' : '❌ NÃO');
console.log('5. Quantidade de abas de contenção (45mm):', trayLips.length, trayLips.length === 4 ? '✅ (4 abas perfeitas)' : '❌');

if (!trayRearPanel && !drawerRearPanel && chestRearPanel && trayBase && trayLips.length === 4) {
  console.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO!');
} else {
  console.error('⚠️ ALGUNS TESTES FALHARAM');
  process.exit(1);
}
