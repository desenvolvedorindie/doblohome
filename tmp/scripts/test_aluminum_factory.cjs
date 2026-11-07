const fs = require('fs');
const vm = require('vm');
const threeCode = fs.readFileSync('./libs/three.min.js', 'utf8');
const context = { window: {}, console: console, THREE: null };
vm.createContext(context);
vm.runInContext(threeCode, context);
context.THREE = context.THREE;

console.log("Three version loaded:", context.THREE.REVISION);

// Carregamos ou testamos a lógica do AluminumExtrusionFactory
const code = `
class AluminumExtrusionFactory {
  static init() {
    this.geoCache = new Map();
    this.shape40 = this.buildProfileShape(0.040);
  }

  static buildProfileShape(size = 0.040) {
    const hs = size / 2.0;               // 0.020 m (20.0 mm)
    const slotW = 0.0082 / 2.0;          // 4.1 mm metade da fenda
    const innerW = 0.0196 / 2.0;         // 9.8 mm metade da câmara interna
    const lipT = 0.0025;                 // 2.5 mm espessura do lábio
    const slotDepth = 0.0095;            // 9.5 mm profundidade total do canal
    const chamfer = 0.0015;              // 1.5 mm chanfro nos 4 cantos externos
    const mouthChamfer = 0.0008;         // 0.8 mm chanfro de 45 graus na entrada da fenda

    function rot(x, y, angle) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [x * c - y * s, x * s + y * c];
    }

    // Percurso do lado superior (TOP, y positivo), sentido horário (de x negativo para x positivo)
    const sidePts = [
      [-hs + chamfer, hs],
      [-slotW - mouthChamfer, hs],
      [-slotW, hs - mouthChamfer],
      [-slotW, hs - lipT],
      [-innerW, hs - lipT - 0.0014],
      [-innerW, hs - slotDepth],
      [innerW, hs - slotDepth],
      [innerW, hs - lipT - 0.0014],
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

    // 1. Furo central (Ø 6.8mm -> raio 3.4mm, rosca M8)
    const centerHole = new THREE.Path();
    const centerRadius = 0.0034;
    const centerSegments = 16;
    for (let i = 0; i <= centerSegments; i++) {
      const theta = (i / centerSegments) * Math.PI * 2;
      const x = Math.cos(theta) * centerRadius;
      const y = Math.sin(theta) * centerRadius;
      if (i === 0) centerHole.moveTo(x, y);
      else centerHole.lineTo(x, y);
    }
    shape.holes.push(centerHole);

    // 2. 4 Furos estruturais de alívio nos cantos (Ø 4.0mm -> raio 2.0mm em +-13mm)
    const cornerR = 0.0020;
    const cornerDist = 0.0130;
    const cornerPositions = [
      [-cornerDist, -cornerDist],
      [cornerDist, -cornerDist],
      [cornerDist, cornerDist],
      [-cornerDist, cornerDist]
    ];

    cornerPositions.forEach(([cx, cy]) => {
      const hole = new THREE.Path();
      const holeSegments = 12;
      for (let i = 0; i <= holeSegments; i++) {
        const theta = (i / holeSegments) * Math.PI * 2;
        const x = cx + Math.cos(theta) * cornerR;
        const y = cy + Math.sin(theta) * cornerR;
        if (i === 0) hole.moveTo(x, y);
        else hole.lineTo(x, y);
      }
      shape.holes.push(hole);
    });

    return shape;
  }

  static getProfileGeometry(length, size = 0.040, axis = 'z') {
    if (!this.shape40) this.init();

    const cacheKey = \`\${size}_\${length.toFixed(4)}_\${axis}\`;
    if (this.geoCache.has(cacheKey)) {
      return this.geoCache.get(cacheKey);
    }

    const extrudeSettings = {
      steps: 1,
      depth: length,
      bevelEnabled: false
    };

    const geo = new THREE.ExtrudeGeometry(this.shape40, extrudeSettings);
    geo.center();

    if (axis === 'x') {
      geo.rotateY(Math.PI / 2);
    } else if (axis === 'y') {
      geo.rotateX(Math.PI / 2);
    }

    geo.computeVertexNormals();
    this.geoCache.set(cacheKey, geo);
    return geo;
  }
}

AluminumExtrusionFactory.init();
const geoLong = AluminumExtrusionFactory.getProfileGeometry(2.20, 0.040, 'z');
const geoCross = AluminumExtrusionFactory.getProfileGeometry(1.32, 0.040, 'x');
const geoPost = AluminumExtrusionFactory.getProfileGeometry(0.10, 0.040, 'y');
console.log("Extrusões geradas com sucesso:", {
  long: geoLong.attributes.position.count,
  cross: geoCross.attributes.position.count,
  post: geoPost.attributes.position.count
});
`;

vm.runInContext(code, context);
