import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { InternalBoxItem, InternalGridConfig } from '../../src/types';

console.log('--- TESTE: Múltiplas caixas na traseira com Armário Aéreo ---');

const grid: InternalGridConfig = {
  lengthMm: 1700,
  widthMm: 1200,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4
};

// 3 caixas na última fileira (row 2 e 3, na traseira)
// Ex: Classic Camper preset:
// Box 3: col 0, span 2, row 2, span 2 (Gavetão Traseiro)
// Box 4: col 2, span 1, row 2, span 2 (Gavetão Mantimentos)
const boxes: InternalBoxItem[] = [
  {
    id: 'box_left_rear',
    name: 'Gavetão Cozinha Esq',
    type: 'drawer',
    colStart: 0,
    colSpan: 2,
    rowStart: 2,
    rowSpan: 2,
    heightMm: 400,
    color: '#059669',
    material: 'dark_wood',
    upperCabinet: true,
    upperCabinetAlign: 'rear'
  },
  {
    id: 'box_right_rear',
    name: 'Gavetão Mantimentos Dir',
    type: 'drawer',
    colStart: 2,
    colSpan: 1,
    rowStart: 2,
    rowSpan: 2,
    heightMm: 400,
    color: '#7c3aed',
    material: 'dark_wood',
    upperCabinet: true,
    upperCabinetAlign: 'rear'
  }
];

const builder = new InternalBoxesBuilder();
builder.update(grid, boxes);

console.log('Caixas construídas no grupo:');
builder.boxesGroup.children.forEach(c => {
  console.log('Container:', c.name, 'pos:', c.position);
  c.children.forEach(sub => {
    if (sub.name.includes('UpperCabinet')) {
      console.log('  -> Achou', sub.name, 'pos local:', sub.position);
      const worldPos = new THREE.Vector3();
      sub.getWorldPosition(worldPos);
      console.log('     worldPos:', worldPos);
    }
  });
});

