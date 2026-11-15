import * as THREE from 'three';

console.log('Testing Three.js color math for Metalon material...');

const color1 = new THREE.Color('#333b47');
console.log('Graphite color:', color1.getHexString(), color1.r, color1.g, color1.b);

const colorBlack = new THREE.Color('#1a1d20');
console.log('Black color:', colorBlack.getHexString(), colorBlack.r, colorBlack.g, colorBlack.b);

const colorWhite = new THREE.Color('#f8fafc');
console.log('White color:', colorWhite.getHexString(), colorWhite.r, colorWhite.g, colorWhite.b);

const mat = new THREE.MeshStandardMaterial({
  color: color1,
  metalness: 0.75,
  roughness: 0.4
});

console.log('Initial mat color:', '#' + mat.color.getHexString());
mat.color.set('#ffffff');
console.log('Updated mat color to white:', '#' + mat.color.getHexString());
mat.color.set('#e11d48');
console.log('Updated mat color to red:', '#' + mat.color.getHexString());

console.log('Three.js color test successfully completed!');

