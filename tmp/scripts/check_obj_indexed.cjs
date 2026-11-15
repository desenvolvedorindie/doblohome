const THREE = require('three');
const fs = require('fs');

// We can check with a mock or read the obj loader directly
const content = fs.readFileSync('node_modules/three/examples/jsm/loaders/OBJLoader.js', 'utf-8');
console.log('Does OBJLoader use setIndex?', content.includes('setIndex'));
console.log('Does OBJLoader use addAttribute or setAttribute position?', content.includes('setAttribute(\'position\'') || content.includes('setAttribute( \'position\''));

