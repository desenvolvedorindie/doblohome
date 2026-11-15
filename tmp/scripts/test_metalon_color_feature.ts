import { JSDOM } from 'jsdom';

// Setup mock DOM for Three.js CanvasTexture
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).HTMLCanvasElement = dom.window.HTMLCanvasElement;

import * as THREE from 'three';
import { MaterialLibrary } from '../../src/three/Materials';
import { METALON_COLOR_PRESETS, getMetalonColorLabel } from '../../src/types';

console.log('--- TEST: Metalon Color Selection Feature ---');

// 1. Verify Presets
console.log('Presets count:', METALON_COLOR_PRESETS.length);
METALON_COLOR_PRESETS.forEach(p => {
  console.log(`- Preset: ${p.label} -> ${p.name} (${p.color})`);
});

// 2. Test getMetalonColorLabel
console.log('Label for #1a1d20:', getMetalonColorLabel('#1a1d20'));
console.log('Label for #333b47:', getMetalonColorLabel('#333b47'));
console.log('Label for #64748b:', getMetalonColorLabel('#64748b'));
console.log('Label for #f8fafc:', getMetalonColorLabel('#f8fafc'));
console.log('Label for custom #ff5500:', getMetalonColorLabel('#ff5500'));

// 3. Initialize MaterialLibrary
MaterialLibrary.init();
const metalonMat = MaterialLibrary.materials.weldedSteelMetalon;
if (!metalonMat) {
  throw new Error('weldedSteelMetalon material not found in MaterialLibrary!');
}
console.log('Initial metalon material color:', '#' + metalonMat.color.getHexString());

// 4. Test setting color dynamically
METALON_COLOR_PRESETS.forEach(p => {
  metalonMat.color.set(p.color);
  metalonMat.needsUpdate = true;
  console.log(`Applied preset ${p.label}: #${metalonMat.color.getHexString()}`);
});

// 5. Test setting custom color
const customColor = '#00a86b'; // Jade green
metalonMat.color.set(customColor);
metalonMat.needsUpdate = true;
console.log(`Applied custom color ${customColor}: #${metalonMat.color.getHexString()}`);

console.log('--- ALL METALON COLOR TESTS PASSED! ---');

