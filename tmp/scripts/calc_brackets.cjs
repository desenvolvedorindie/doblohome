const fs = require('fs');
const vm = require('vm');
const threeCode = fs.readFileSync('./libs/three.min.js', 'utf8');
const context = { window: {}, console: console };
vm.createContext(context);
vm.runInContext(threeCode, context);
const THREE = context.THREE;

console.log("Calculando posições das 8 cantoneiras L 4040...");

const width = 1.40;
const length = 2.20;
const profileSize = 0.040;
const zCenter = 0.40;
const baseY = 2.06;

const xLeft = -width / 2 + profileSize / 2;  // -0.68
const xRight = width / 2 - profileSize / 2;  // +0.68

// A face interna da longarina esquerda está em x = -0.68 + 0.02 = -0.66
// A face interna da longarina direita está em x = +0.68 - 0.02 = +0.66

const crossZList = [
  zCenter + length / 2 - profileSize / 2, // Dianteira
  zCenter + 0.45,                         // Mid 1
  zCenter - 0.45,                         // Mid 2
  zCenter - length / 2 + profileSize / 2  // Traseira
];

console.log("Face interna Longarina Esquerda X:", -width/2 + profileSize);
console.log("Face interna Longarina Direita X:", width/2 - profileSize);
console.log("Z das travessas:", crossZList);

