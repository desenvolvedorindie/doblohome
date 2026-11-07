const fs = require('fs');
const vm = require('vm');
const threeCode = fs.readFileSync('./libs/three.min.js', 'utf8');
const context = { window: {}, console: console };
vm.createContext(context);
vm.runInContext(threeCode, context);
const THREE = context.THREE;

// Teste de montagem da cantoneira no canto
console.log("Simulando montagem da cantoneira...");

function createCornerBracketMesh() {
  const group = new THREE.Group();
  
  const bracketW = 0.036; // 36mm largura na vertical Y
  const bracketL = 0.036; // 36mm perna X
  const bracketH = 0.036; // 36mm perna Z
  const wallT = 0.004;    // 4mm parede

  // Shape no plano XZ:
  const lShape = new THREE.Shape();
  lShape.moveTo(0, 0);
  lShape.lineTo(bracketL, 0);
  lShape.lineTo(bracketL, wallT);
  lShape.lineTo(wallT, wallT);
  lShape.lineTo(wallT, bracketH);
  lShape.lineTo(0, bracketH);
  lShape.closePath();

  // Extruda na vertical (Y)
  const lGeo = new THREE.ExtrudeGeometry(lShape, {
    depth: bracketW,
    bevelEnabled: true,
    bevelThickness: 0.0006,
    bevelSize: 0.0006,
    bevelSegments: 2
  });
  // Rotaciona a geometria para que a extrusão seja em Y
  lGeo.rotateX(-Math.PI / 2);
  lGeo.center();

  // Nervura triangular no plano XZ
  const gShape = new THREE.Shape();
  gShape.moveTo(wallT, wallT);
  gShape.lineTo(bracketL - 0.004, wallT);
  gShape.lineTo(wallT, bracketH - 0.004);
  gShape.closePath();

  const gGeo = new THREE.ExtrudeGeometry(gShape, {
    depth: 0.0035,
    bevelEnabled: false
  });
  gGeo.rotateX(-Math.PI / 2);
  gGeo.center();

  console.log("Geometria da cantoneira gerada com sucesso!");
  return group;
}

createCornerBracketMesh();

