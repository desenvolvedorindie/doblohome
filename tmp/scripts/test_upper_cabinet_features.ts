import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { InternalBoxItem, InternalGridConfig } from '../../src/types';

console.log('--- TESTE: Armários Aéreos (Espaçamento Inferior, Largura para Trás, Madeira Única) ---');

const grid: InternalGridConfig = {
  lengthMm: 1700,
  widthMm: 1200,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4
};

const builder = new InternalBoxesBuilder();

// Test 1: upperCabinetBottomGapMm = 0 (Sem espaçamento inferior -> 1 única madeira, sem base duplicada)
const boxNoGap: InternalBoxItem = {
  id: 'box_kitchen',
  name: 'Bancada Cozinha',
  type: 'chest',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 2,
  heightMm: 400,
  color: '#2563eb',
  material: 'plywood',
  upperCabinet: true,
  upperCabinetBottomGapMm: 0,
  upperCabinetDepthMm: 350,
  upperCabinetAlign: 'rear',
  upperCabinetDoors: true,
  upperCabinetShelves: 1
};

builder.update(grid, [boxNoGap]);

const woodPartsNoGap: string[] = [];
builder.boxesGroup.traverse((obj: any) => {
  if (obj.isMesh && obj.userData?.isWoodPart) {
    woodPartsNoGap.push(obj.userData.partLabel);
  }
});

console.log('\n--- CENÁRIO 1: Sem Espaçamento Inferior (gap = 0mm) ---');
console.log('Peças de madeira geradas:');
woodPartsNoGap.forEach(p => console.log('  -', p));

const hasBasePanelNoGap = woodPartsNoGap.some(p => p.includes('Armário Aéreo Base'));
console.log('Contém "Armário Aéreo Base"?', hasBasePanelNoGap);
if (hasBasePanelNoGap) {
  throw new Error('FALHA: Não deveria gerar Base Inferior do aéreo quando gap = 0 (deve usar madeira única do tampo)!');
} else {
  console.log('SUCESSO: Chapa dupla evitada! Apenas 1 madeira usada (tampo da bancada serve de base).');
}

// Test 2: upperCabinetBottomGapMm = 300 (Com vão livre de 300mm -> Aéreo suspenso com base própria)
const boxWithGap: InternalBoxItem = {
  ...boxNoGap,
  id: 'box_kitchen_gap',
  upperCabinetBottomGapMm: 300,
  upperCabinetDepthMm: 500,
  upperCabinetWidthMm: 350
};

builder.update(grid, [boxWithGap]);

const woodPartsWithGap: string[] = [];
let basePanelMesh: any = null;
let topPanelLowerBox: any = null;

builder.boxesGroup.traverse((obj: any) => {
  if (obj.isMesh && obj.userData?.isWoodPart) {
    woodPartsWithGap.push(obj.userData.partLabel);
    if (obj.userData.partLabel.includes('Base Inferior')) {
      basePanelMesh = obj;
    }
    if (obj.userData.partLabel.includes('Tampo Superior') || obj.userData.partLabel.includes('Tampa Basculante')) {
      topPanelLowerBox = obj;
    }
  }
});

console.log('\n--- CENÁRIO 2: Com Espaçamento Inferior (gap = 300mm) ---');
console.log('Peças de madeira geradas:');
woodPartsWithGap.forEach(p => console.log('  -', p));

const hasBasePanelWithGap = woodPartsWithGap.some(p => p.includes('Base Inferior'));
console.log('Contém "Armário Aéreo Base Inferior"?', hasBasePanelWithGap);
if (!hasBasePanelWithGap) {
  throw new Error('FALHA: Deveria gerar Base Inferior do aéreo quando suspenso (gap > 0)!');
} else {
  console.log('SUCESSO: Base própria de madeira criada para o armário suspenso.');
}

// Verificar medição no mundo 3D
if (basePanelMesh && topPanelLowerBox) {
  const baseWorldPos = new THREE.Vector3();
  basePanelMesh.getWorldPosition(baseWorldPos);
  const topBoxWorldPos = new THREE.Vector3();
  topPanelLowerBox.getWorldPosition(topBoxWorldPos);

  const measuredCenterGapMm = Math.round((baseWorldPos.y - topBoxWorldPos.y) * 1000);
  const clearanceMm = Math.round(((baseWorldPos.y - 0.015 / 2) - (topBoxWorldPos.y + 0.015 / 2)) * 1000);
  console.log(`Gap medido entre centros: ${measuredCenterGapMm}mm, vão livre (clearance entre faces): ${clearanceMm} mm (esperado 300mm)`);
  if (Math.abs(clearanceMm - 300) > 2) {
    throw new Error(`FALHA no espaçamento: esperado 300mm de vão livre, medido ${clearanceMm}mm`);
  }
  console.log('SUCESSO: Medição 3D do espaçamento inferior perfeitamente exata!');
}

console.log('\nTODOS OS TESTES PASSARAM COM SUCESSO!');

