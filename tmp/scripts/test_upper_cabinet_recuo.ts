import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).HTMLCanvasElement = dom.window.HTMLCanvasElement;

import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { InternalBoxItem } from '../../src/types';

console.log('--- Testing Upper Cabinet Recuo / Offset ---');

const builder = new InternalBoxesBuilder();

const boxWithRecuo: InternalBoxItem = {
  id: 'box_test_recuo',
  name: 'Bancada Lateral',
  type: 'chest',
  material: 'plywood',
  color: '#ffffff',
  colStart: 0,
  rowStart: 0,
  colSpan: 1,
  rowSpan: 2, // 2 rows = ~850mm
  heightMm: 400,
  upperCabinet: true,
  upperCabinetDepthMm: 250,
  upperCabinetWidthMm: 500,
  upperCabinetOffsetMm: 200, // Recuo de 200mm (começa 200mm depois do início)
  upperCabinetSides: ['left'],
  upperCabinetDoors: true,
  upperCabinetShelves: 2
};

const boxPastEnd: InternalBoxItem = {
  id: 'box_test_past_end',
  name: 'Bancada c/ Aéreo Depois do Fim',
  type: 'chest',
  material: 'plywood',
  color: '#ffffff',
  colStart: 1,
  rowStart: 0,
  colSpan: 1,
  rowSpan: 1, // 1 row = ~425mm
  heightMm: 400,
  upperCabinet: true,
  upperCabinetDepthMm: 250,
  upperCabinetWidthMm: 400,
  upperCabinetOffsetMm: 550, // 550mm > 425mm -> Começa 125mm DEPOIS do final da caixa!
  upperCabinetSides: ['left'],
  upperCabinetDoors: true,
  upperCabinetShelves: 1
};

import { DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';

builder.update(DEFAULT_INTERNAL_GRID, [boxWithRecuo, boxPastEnd]);

let foundRecuoGroup = false;
let foundPastEndGroup = false;

builder.group.traverse((obj) => {
  if (obj.name === 'UpperCabinet_box_test_recuo_left') {
    foundRecuoGroup = true;
    console.log('UpperCabinet_box_test_recuo_left position:', obj.position);
  }
  if (obj.name === 'UpperCabinet_box_test_past_end_left') {
    foundPastEndGroup = true;
    console.log('UpperCabinet_box_test_past_end_left position:', obj.position);
  }
});

console.log('Found recuo group:', foundRecuoGroup);
console.log('Found past end group:', foundPastEndGroup);

console.log('--- UPPER CABINET RECUO TEST FINISHED ---');
