import { getUpperCabinetExclusionZones } from '../../src/three/boxes/BoxGeometryHelpers';

const cabBox: any = {
  id: 'cabinet_box',
  type: 'chest',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 1,
  heightMm: 400,
  upperCabinet: true,
  upperCabinetAlign: 'left',
  upperCabinetDepthMm: 250,
  upperCabinetBottomGapMm: 0
};

const cellWM = 0.4;
const cellLM = 0.425;

const rawZones = getUpperCabinetExclusionZones(cabBox, cellWM, cellLM);
console.log('rawZones (align: left):', JSON.stringify(rawZones));
