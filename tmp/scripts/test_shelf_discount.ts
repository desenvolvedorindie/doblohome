import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';
import { InternalGridConfig, InternalBoxItem } from '../../src/types';
import { extractWoodCutGroups } from '../../src/utils/woodUtils';

const builder = new InternalBoxesBuilder();
const grid: InternalGridConfig = { ...DEFAULT_INTERNAL_GRID };

function testBox(name: string, box: InternalBoxItem, side: 'rear' | 'front' | 'left' | 'right') {
  builder.update(grid, [box], null, { openCabinets: false });
  const woodStats = extractWoodCutGroups({ internalBoxesBuilder: builder });
  const shelfPart = woodStats.cutGroups.find(g => g.label.includes('Prateleira'));
  const cabinetGroup = builder.boxesGroup.getObjectByName(`UpperCabinet_${box.id}_${side}`);
  let shelfMesh: any = null;
  cabinetGroup?.traverse((obj: any) => {
    if (obj.userData?.isUpperCabinetShelf) shelfMesh = obj;
  });

  console.log(`\n=== TESTE: ${name} (${side}) ===`);
  console.log('Plano de corte:', shelfPart?.label, 'Dimensões:', shelfPart?.lengthMm, 'x', shelfPart?.widthMm);
  shelfMesh.geometry.computeBoundingBox();
  const bb = shelfMesh.geometry.boundingBox;

  if (side === 'rear' || side === 'front') {
    const zMin = shelfMesh.position.z + bb.min.z;
    const zMax = shelfMesh.position.z + bb.max.z;
    console.log('Limites Z:', zMin.toFixed(4), 'até', zMax.toFixed(4));
  } else {
    const xMin = shelfMesh.position.x + bb.min.x;
    const xMax = shelfMesh.position.x + bb.max.x;
    console.log('Limites X:', xMin.toFixed(4), 'até', xMax.toFixed(4));
  }
}

// 1. Front com porta basculante (desconto 25mm)
testBox('Front Basculante', {
  id: 'box-front-doors',
  name: 'Front Doors',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 1,
  type: 'chest',
  material: 'plywood',
  color: '#d4a373',
  upperCabinet: true,
  upperCabinetAlign: 'front',
  upperCabinetDepthMm: 250,
  upperCabinetClosure: 'doors',
  upperCabinetShelves: 1
}, 'front');

// 2. Lateral esquerda com correr (desconto 30mm)
testBox('Lateral Esquerda Correr', {
  id: 'box-left-sliding',
  name: 'Left Sliding',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 1,
  type: 'chest',
  material: 'plywood',
  color: '#d4a373',
  upperCabinet: true,
  upperCabinetAlign: 'left',
  upperCabinetDepthMm: 250,
  upperCabinetClosure: 'sliding_doors',
  upperCabinetShelves: 1
}, 'left');

// 3. Lateral direita com desconto manual de 20mm
testBox('Lateral Direita Custom 20mm', {
  id: 'box-right-custom',
  name: 'Right Custom',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 1,
  type: 'chest',
  material: 'plywood',
  color: '#d4a373',
  upperCabinet: true,
  upperCabinetAlign: 'right',
  upperCabinetDepthMm: 250,
  upperCabinetClosure: 'doors',
  upperCabinetShelfDoorDiscountMm: 20,
  upperCabinetShelves: 1
}, 'right');
