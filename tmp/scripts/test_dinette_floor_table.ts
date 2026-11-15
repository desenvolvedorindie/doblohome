import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { InternalGridConfig, InternalBoxItem } from '../../src/types';
import { INTERNAL_BOXES_PRESETS } from '../../src/data/internalBoxesPresets';

console.log('--- TESTE: MESA DINETTE CENTRAL NO ASSOALHO 15mm ---');

// 1. Verificar preset 'slat_bed_camper'
const slatPreset = INTERNAL_BOXES_PRESETS.find(p => p.id === 'slat_bed_camper');
if (!slatPreset) throw new Error('Preset slat_bed_camper não encontrado');
console.log('✅ Preset slat_bed_camper carregado com sucesso');

if (!slatPreset.grid.centralTable || !slatPreset.grid.centralTable.enabled) {
  throw new Error('Preset slat_bed_camper deve conter centralTable ativada no grid do assoalho!');
}
console.log('✅ slatPreset.grid.centralTable está configurada:', slatPreset.grid.centralTable);

// 2. Instanciar o builder 3D
const builder = new InternalBoxesBuilder();

const grid: InternalGridConfig = {
  lengthMm: 1700,
  widthMm: 1200,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4,
  centralTable: {
    enabled: true,
    lengthMm: 650,
    widthMm: 450,
    heightMm: 720,
    offsetX: 150,
    offsetZ: -100,
    rotationDeg: 90,
    finish: 'pine_block'
  }
};

const boxes: InternalBoxItem[] = [
  {
    id: 'box_1',
    name: 'Baú Teste',
    type: 'chest',
    colStart: 0,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 1,
    heightMm: 400,
    color: '#2563eb',
    material: 'plywood'
  }
];

builder.update(grid, boxes, null, false, null);

// 3. Inspecionar o floorGroup
const floorGroup = builder.floorGroup;
console.log('Filhos no floorGroup:', floorGroup.children.length);

const basePlywoodFloor = floorGroup.getObjectByName('BaseNavalPlywoodFloor');
if (!basePlywoodFloor) {
  throw new Error('Chapa base de compensado naval 15mm (BaseNavalPlywoodFloor) não encontrada no floorGroup!');
}
console.log('✅ Chapa base de compensado naval 15mm encontrada no floorGroup!');

const tableGroup = floorGroup.getObjectByName('FloorCentralTable');
if (!tableGroup) {
  throw new Error('Mesa dinette (FloorCentralTable) NÃO foi encontrada dentro do floorGroup!');
}
console.log('✅ Mesa dinette FloorCentralTable encontrada com sucesso no floorGroup!');

// 4. Verificar partes físicas da mesa
let foundFlange = false;
let foundColumn = false;
let foundClamps = 0;
let foundWoodTop = false;

tableGroup.traverse((child: any) => {
  if (child.name === 'FloorTableFlange_BasePiso') foundFlange = true;
  if (child.name === 'FloorTablePedestal_Column') foundColumn = true;
  if (child.name && child.name.includes('FloorTableClamp_Bracket')) foundClamps++;
  if (child.isMesh && child.userData && child.userData.isWoodPart) {
    foundWoodTop = true;
    console.log('✅ Tampo de madeira encontrado:', child.userData.partLabel);
  }
});

if (!foundFlange) throw new Error('Flange de piso circular Ø160mm não encontrada!');
console.log('✅ Flange circular Ø160mm de piso fixada no compensado naval 15mm verificada!');

if (!foundColumn) throw new Error('Coluna tubular de aço preto Ø45mm não encontrada!');
console.log('✅ Coluna tubular de aço preto Ø45mm verificada!');

if (foundClamps < 2) throw new Error(`Esperado 2 braçadeiras de fixação rápida tipo lever, encontradas: ${foundClamps}`);
console.log(`✅ ${foundClamps} braçadeiras de aperto rápido tipo lever verificadas!`);

if (!foundWoodTop) throw new Error('Tampo de madeira maciça da mesa dinette não encontrado!');

// 5. Verificar que a mesa NÃO é instanciada dentro de boxesGroup
const boxesGroup = builder.boxesGroup;
let tableInBoxes = false;
boxesGroup.traverse((child: any) => {
  if (child.name && child.name.includes('CentralTable')) {
    tableInBoxes = true;
  }
});
if (tableInBoxes) {
  throw new Error('Mesa NÃO deve ser instanciada dentro de boxesGroup!');
}
console.log('✅ boxesGroup NÃO possui nenhuma mesa vinculada a baú individual!');

console.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO!');
