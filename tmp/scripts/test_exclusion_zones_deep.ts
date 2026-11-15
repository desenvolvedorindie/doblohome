import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { InternalBoxItem } from '../../src/types';

const boxBase: InternalBoxItem = {
  id: 'test_box',
  name: 'Caixa Teste',
  type: 'drawer',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  color: '#2563eb',
  material: 'plywood',
  topPerforated: true,
  upperCabinet: true,
  upperCabinetBottomGapMm: 0,
  upperCabinetDepthMm: 250,
  upperCabinetWidthMm: 400
};

// Box dimensions: w = 0.40m, l = 1.70m
const w = 0.40;
const l = 1.70;

console.log('--- TEST 1: Align rear ---');
const boxRear = { ...boxBase, upperCabinetAlign: 'rear' as const };
const zonesRear = InternalBoxesBuilder.getUpperCabinetExclusionZones(boxRear, w, l);
console.log('Zones rear:', zonesRear);

console.log('--- TEST 2: Align front ---');
const boxFront = { ...boxBase, upperCabinetAlign: 'front' as const };
const zonesFront = InternalBoxesBuilder.getUpperCabinetExclusionZones(boxFront, w, l);
console.log('Zones front:', zonesFront);

console.log('--- TEST 3: Align left (lateral) ---');
const boxLeft = { ...boxBase, upperCabinetAlign: 'left' as const };
const zonesLeft = InternalBoxesBuilder.getUpperCabinetExclusionZones(boxLeft, w, l);
console.log('Zones left:', zonesLeft);

console.log('--- TEST 4: Align right (lateral) ---');
const boxRight = { ...boxBase, upperCabinetAlign: 'right' as const };
const zonesRight = InternalBoxesBuilder.getUpperCabinetExclusionZones(boxRight, w, l);
console.log('Zones right:', zonesRight);
