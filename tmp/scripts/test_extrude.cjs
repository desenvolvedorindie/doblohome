const fs = require('fs');

// Testa carregar Three.js via vm
const vm = require('vm');
const threeCode = fs.readFileSync('./libs/three.min.js', 'utf8');
const context = { window: {}, console: console };
vm.createContext(context);
vm.runInContext(threeCode, context);
const THREE = context.THREE;

console.log("Three revision:", THREE.REVISION);

// Vamos testar a criação do Shape do perfil 40x40 T-Slot
function createProfileShape(size = 0.040) {
  const hs = size / 2.0; // 0.020
  const slotW = 0.0082 / 2.0; // 0.0041
  const innerW = 0.0170 / 2.0; // 0.0085
  const lipT = 0.0022; // espessura do lábio
  const slotDepth = 0.0090; // profundidade do fundo do slot
  const chamfer = 0.0015; // chanfro dos cantos
  const mouthChamfer = 0.0008; // chanfro da boca do T-slot (tipo V-slot)

  // Função para rotacionar ponto
  function rot(x, y, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [x * c - y * s, x * s + y * c];
  }

  // Pontos de um lado (lado TOP, y positivo), sentido horário (de x negativo para x positivo)
  const sidePts = [
    [-hs + chamfer, hs],
    [-slotW - mouthChamfer, hs],
    [-slotW, hs - mouthChamfer],
    [-slotW, hs - lipT],
    [-innerW, hs - lipT - 0.0012],
    [-innerW, hs - slotDepth],
    [innerW, hs - slotDepth],
    [innerW, hs - lipT - 0.0012],
    [slotW, hs - lipT],
    [slotW, hs - mouthChamfer],
    [slotW + mouthChamfer, hs],
    [hs - chamfer, hs],
    [hs, hs - chamfer]
  ];

  const fullPts = [];
  for (let side = 0; side < 4; side++) {
    const angle = -side * (Math.PI / 2.0);
    for (let i = 0; i < sidePts.length; i++) {
      const p = sidePts[i];
      const r = rot(p[0], p[1], angle);
      if (fullPts.length > 0) {
        const last = fullPts[fullPts.length - 1];
        if (Math.hypot(last[0] - r[0], last[1] - r[1]) < 1e-6) continue;
      }
      fullPts.push(r);
    }
  }

  const shape = new THREE.Shape();
  shape.moveTo(fullPts[0][0], fullPts[0][1]);
  for (let i = 1; i < fullPts.length; i++) {
    shape.lineTo(fullPts[i][0], fullPts[i][1]);
  }
  shape.closePath();

  // Furo central (Ø 6.8mm -> raio 3.4mm)
  const centerHole = new THREE.Path();
  const centerRadius = 0.0034;
  const segments = 16;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * centerRadius;
    const y = Math.sin(theta) * centerRadius;
    if (i === 0) centerHole.moveTo(x, y);
    else centerHole.lineTo(x, y);
  }
  shape.holes.push(centerHole);

  // 4 Furos de alívio nos cantos (Ø 4.4mm -> raio 2.2mm a +-12.5mm do centro)
  const cornerR = 0.0022;
  const cornerDist = 0.0125;
  const cornerPositions = [
    [-cornerDist, -cornerDist],
    [cornerDist, -cornerDist],
    [cornerDist, cornerDist],
    [-cornerDist, cornerDist]
  ];

  cornerPositions.forEach(([cx, cy]) => {
    const hole = new THREE.Path();
    for (let i = 0; i <= 12; i++) {
      const theta = (i / 12) * Math.PI * 2;
      const x = cx + Math.cos(theta) * cornerR;
      const y = cy + Math.sin(theta) * cornerR;
      if (i === 0) hole.moveTo(x, y);
      else hole.lineTo(x, y);
    }
    shape.holes.push(hole);
  });

  return shape;
}

const shape = createProfileShape(0.040);
console.log("Shape criado com", shape.holes.length, "furos.");

// Teste de extrusão
const extrudeSettings = {
  steps: 1,
  depth: 1.0,
  bevelEnabled: false
};

const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
console.log("ExtrudeGeometry criada com sucesso!");
console.log("Vértices:", geo.attributes.position.count);
geo.center();
geo.computeVertexNormals();
geo.computeBoundingBox();
console.log("Bounding box:", geo.boundingBox);

