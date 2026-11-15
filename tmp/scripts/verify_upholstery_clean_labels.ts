import * as THREE from 'three';
import { sanitizeUpholsteryLabel, sanitizeUpholsteryModuleName, extractWoodCutGroups } from '../../src/utils/woodUtils';
import { SlatBedMattressBuilder } from '../../src/three/boxes/SlatBedMattressBuilder';
import { BarsLineupCollector } from '../../src/three/scene/BarsLineupCollector';
import { InternalBoxConfig } from '../../src/types/structure';

// 1. Testa os sanitizadores diretamente
console.log('--- 1. Testando sanitizadores unitários ---');

const testCases = [
  {
    input: '🪵 Gavetão Mantimentos & Utensílios • Colchão Almofada Central 1/3 (388×1259×80mm)',
    expectedLabel: 'Almofada Central 1/3'
  },
  {
    input: '📦 Gavetão Mantimentos & Utensílios • Colchão Aba Caixa de Roda (142×1259×80mm)',
    expectedLabel: 'Almofada Aba Caixa de Roda'
  },
  {
    input: 'Almofada Aba Oposta Caixa de Roda',
    expectedLabel: 'Almofada Aba Oposta Caixa de Roda'
  },
  {
    input: 'Colchão Central 2/3 (388×1259×80mm)',
    expectedLabel: 'Almofada Central 2/3'
  }
];

testCases.forEach((tc, idx) => {
  const result = sanitizeUpholsteryLabel(tc.input);
  console.log(`[Test ${idx + 1}] Input: "${tc.input}"`);
  console.log(`           Result: "${result}"`);
  if (result !== tc.expectedLabel) {
    throw new Error(`Falha no teste ${idx + 1}: esperado "${tc.expectedLabel}", obtido "${result}"`);
  }
});

const modTest = sanitizeUpholsteryModuleName('🪵 Gavetão Mantimentos & Utensílios');
console.log(`ModuleName sanitizado: "${modTest}"`);
if (modTest !== '🛏️ Cama Retrátil / Sofá-Cama') {
  throw new Error(`Falha na sanitização de moduleName: ${modTest}`);
}

// 2. Testa a geração de colchões via SlatBedMattressBuilder em uma box com nome de gavetão
console.log('\n--- 2. Testando SlatBedMattressBuilder com box.name sujo ---');

const dirtyBox: InternalBoxConfig = {
  id: 'box_test_slat',
  name: '🪵 Gavetão Mantimentos & Utensílios',
  type: 'slat_bed',
  colStart: 1,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  color: '#d97706',
  material: 'plywood',
  slatBedDirection: 'left',
  slatExtensionPercent: 100,
  mattressParts: 5,
  rearFoldShelf: false
};

const builder = new SlatBedMattressBuilder();
const container = new THREE.Group();

builder.buildMattress({
  box: dirtyBox,
  container,
  w: 0.80,
  h: 0.40,
  l: 1.70,
  slatT: 0.015,
  direction: 'left',
  isExtended: true,
  extRatio: 1.0,
  cellWM: 0.40,
  cellLM: 0.425
});

console.log(`Meshes adicionadas ao container: ${container.children.length}`);
const upholsteryMeshes: THREE.Mesh[] = [];
container.traverse((obj: any) => {
  if (obj.isMesh && obj.userData?.isUpholstery) {
    upholsteryMeshes.push(obj);
  }
});

console.log(`Total de almofadas geradas: ${upholsteryMeshes.length}`);
if (upholsteryMeshes.length === 0) {
  throw new Error('Nenhuma almofada foi gerada!');
}

upholsteryMeshes.forEach((mesh, idx) => {
  console.log(`Almofada #${idx + 1}:`);
  console.log(`  partLabel: "${mesh.userData.partLabel}"`);
  console.log(`  moduleName: "${mesh.userData.moduleName}"`);

  if (mesh.userData.partLabel.includes('🪵') || mesh.userData.partLabel.includes('Gavetão')) {
    throw new Error(`partLabel ainda contém madeira ou gavetão: ${mesh.userData.partLabel}`);
  }
  if (mesh.userData.moduleName.includes('🪵') || mesh.userData.moduleName.includes('Gavetão')) {
    throw new Error(`moduleName ainda contém madeira ou gavetão: ${mesh.userData.moduleName}`);
  }
  if (/\(\d+×\d+×\d+mm\)/.test(mesh.userData.partLabel)) {
    throw new Error(`partLabel contém dimensões redundantes: ${mesh.userData.partLabel}`);
  }
});

// 3. Testa extractWoodCutGroups simulando um sceneManager com esse container
console.log('\n--- 3. Testando extractWoodCutGroups ---');

const mockSceneManager = {
  internalBoxesBuilder: {
    group: container
  }
};

const cutStats = extractWoodCutGroups(mockSceneManager);
console.log(`Peças totais no cutStats: ${cutStats.totalPieces}`);
console.log(`Grupos de corte: ${cutStats.cutGroups.length}`);

cutStats.cutGroups.forEach((group, idx) => {
  console.log(`Grupo #${idx + 1}:`);
  console.log(`  label: "${group.label}"`);
  console.log(`  moduleName: "${group.moduleName}"`);
  console.log(`  woodMaterial: "${group.woodMaterial}"`);
  console.log(`  isUpholstery: ${group.isUpholstery}`);

  if (group.label.includes('🪵') || group.label.includes('Gavetão')) {
    throw new Error(`Grupo de corte contém madeira/gavetão: ${group.label}`);
  }
  if (group.moduleName && (group.moduleName.includes('🪵') || group.moduleName.includes('Gavetão'))) {
    throw new Error(`Grupo de corte moduleName contém gavetão: ${group.moduleName}`);
  }
});

// 4. Testa BarsLineupCollector
console.log('\n--- 4. Testando BarsLineupCollector ---');
const lineupResult = BarsLineupCollector.collect(
  { group: new THREE.Group(), cargoBoxConfig: { enabled: false } },
  { group: container }
);

console.log(`Lineup upholstery rows: ${lineupResult.sortedUpholsteryRows.length}`);
console.log(`Lineup upholstery items: ${lineupResult.upholsteryItems.length}`);

lineupResult.upholsteryItems.forEach((it, idx) => {
  console.log(`Lineup Item #${idx + 1}: name="${it.name}"`);
  if (it.name.includes('🪵') || it.name.includes('Gavetão')) {
    throw new Error(`Lineup item contém madeira/gavetão: ${it.name}`);
  }
});

console.log('\n✅ TODOS OS TESTES PASSARAM COM SUCESSO! Listagem do colchão está 100% limpa de madeira e gavetões.');
