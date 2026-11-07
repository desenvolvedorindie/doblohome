const fs = require('fs');
const vm = require('vm');
const threeCode = fs.readFileSync('./libs/three.min.js', 'utf8');
const context = { window: {}, console: console };
vm.createContext(context);
vm.runInContext(threeCode, context);
const THREE = context.THREE;

console.log("Three loaded for bracket test");

// Cantoneira L 40x40
function createCornerBracketMesh() {
  const group = new THREE.Group();
  
  // Base em L: 38mm largura, 38mm altura, 38mm comprimento, espessura da parede 4mm
  // Ou modelada com Shape extrudado!
  const bracketW = 0.036; // 36mm largura (encaixa dentro da face do 4040)
  const bracketL = 0.036; // 36mm comprimento
  const bracketH = 0.036; // 36mm altura
  const wallT = 0.004;    // 4mm espessura

  // Shape em L no plano XY:
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(bracketL, 0);
  shape.lineTo(bracketL, wallT);
  shape.lineTo(wallT, wallT);
  shape.lineTo(wallT, bracketH);
  shape.lineTo(0, bracketH);
  shape.closePath();

  const lGeo = new THREE.ExtrudeGeometry(shape, {
    depth: bracketW,
    bevelEnabled: false
  });
  lGeo.center();
  
  // Nervura triangular de reforço central (gusset a 45°)
  const gussetShape = new THREE.Shape();
  gussetShape.moveTo(wallT, wallT);
  gussetShape.lineTo(bracketL - 0.004, wallT);
  gussetShape.lineTo(wallT, bracketH - 0.004);
  gussetShape.closePath();

  const gussetGeo = new THREE.ExtrudeGeometry(gussetShape, {
    depth: 0.0035, // 3.5mm de nervura central
    bevelEnabled: false
  });
  gussetGeo.center();

  // Parafuso Allen M8 com arruela
  function createAllenScrew() {
    const screwGroup = new THREE.Group();
    // Cabeça cilíndrica M8 (D = 13mm, H = 8mm)
    const headGeo = new THREE.CylinderGeometry(0.0065, 0.0065, 0.006, 16);
    const headMesh = new THREE.Mesh(headGeo);
    screwGroup.add(headMesh);

    // Cavidade hexagonal interna (Allen)
    const hexGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.002, 6);
    const hexMesh = new THREE.Mesh(hexGeo);
    hexMesh.position.y = 0.0025;
    screwGroup.add(hexMesh);

    // Arruela
    const washerGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.0012, 16);
    const washerMesh = new THREE.Mesh(washerGeo);
    washerMesh.position.y = -0.0035;
    screwGroup.add(washerMesh);

    return screwGroup;
  }

  console.log("Bracket criado com sucesso!");
  return group;
}

createCornerBracketMesh();

