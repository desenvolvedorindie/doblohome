import * as THREE from 'three';
import { extractPvcCutStats } from '../../src/utils/pvcUtils';

console.log('Testing default front:');
const statsFront = extractPvcCutStats({ enabled: true, lengthMm: 2200, diameterMm: 200, connectionPosition: 'front' });
console.log('Pieces:', statsFront.totalPieces);
console.log('Cut items:', statsFront.cutItems.map(c => `${c.label}: ${c.lengthMm}mm (qty: ${c.qty})`));
console.log('Fittings:', statsFront.fittings.map(f => `${f.label}: ${f.qty} ${f.unit}`));
console.log('Total linear meters:', statsFront.totalLinearMeters);

console.log('\nTesting rear:');
const statsRear = extractPvcCutStats({ enabled: true, lengthMm: 2200, diameterMm: 200, connectionPosition: 'rear' });
console.log('Pieces:', statsRear.totalPieces);
console.log('Cut items:', statsRear.cutItems.map(c => `${c.label}: ${c.lengthMm}mm (qty: ${c.qty})`));
console.log('Fittings:', statsRear.fittings.map(f => `${f.label}: ${f.qty} ${f.unit}`));
