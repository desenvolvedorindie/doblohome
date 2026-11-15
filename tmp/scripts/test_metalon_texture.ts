import * as THREE from 'three';

console.log('Testing metalon colors with different base lightness...');

// Test color multiplication
function simulateAlbedo(texRGB: number[], matColorHex: string) {
  const c = new THREE.Color(matColorHex);
  const r = (texRGB[0] / 255) * c.r;
  const g = (texRGB[1] / 255) * c.g;
  const b = (texRGB[2] / 255) * c.b;
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    hex: '#' + new THREE.Color(r, g, b).getHexString()
  };
}

console.log('With OLD dark texture (#282d36 = [40, 45, 54]):');
console.log('  White (#ffffff):', simulateAlbedo([40, 45, 54], '#ffffff'));
console.log('  Black (#1a1d20):', simulateAlbedo([40, 45, 54], '#1a1d20'));
console.log('  Graphite (#333b47):', simulateAlbedo([40, 45, 54], '#333b47'));

console.log('\nWith NEUTRAL LIGHT texture (#e2e8f0 = [226, 232, 240]):');
console.log('  White (#ffffff):', simulateAlbedo([226, 232, 240], '#ffffff'));
console.log('  Black (#1a1d20):', simulateAlbedo([226, 232, 240], '#1a1d20'));
console.log('  Graphite (#333b47):', simulateAlbedo([226, 232, 240], '#333b47'));
console.log('  Grey (#64748b):', simulateAlbedo([226, 232, 240], '#64748b'));

