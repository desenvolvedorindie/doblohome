const THREE = require('three');

function testFloorCentralTable() {
  const floorGroup = new THREE.Group();
  const widthM = 1.2;
  const lengthM = 1.7;
  const floorY = 0.48;
  const centerZ = -lengthM / 2;
  const floorThickness = 0.015;

  // 1. Chapa de compensado naval de 15mm
  const floorGeo = new THREE.BoxGeometry(widthM, floorThickness, lengthM);
  const floorMesh = new THREE.Mesh(floorGeo, new THREE.MeshBasicMaterial());
  floorMesh.position.set(0, floorY - floorThickness / 2, centerZ);
  floorGroup.add(floorMesh);

  // 2. Mesa Dinette fixada no piso
  const cfg = {
    enabled: true,
    widthMm: 450,
    lengthMm: 650,
    heightMm: 720,
    offsetX: 0,
    offsetZ: 0,
    rotationDeg: 0,
    finish: 'pine_block'
  };

  const tableWM = cfg.widthMm / 1000;
  const tableLM = cfg.lengthMm / 1000;
  const heightFromFloorM = cfg.heightMm / 1000;
  const tableThickness = 0.018;

  const offX = cfg.offsetX / 1000;
  const offZ = cfg.offsetZ / 1000;
  const rotRad = (cfg.rotationDeg * Math.PI) / 180;

  const tableGroup = new THREE.Group();
  tableGroup.name = 'FloorCentralTable';
  tableGroup.position.set(offX, floorY, centerZ + offZ);

  // Flange náutica de piso na chapa de compensado naval 15mm
  const flangeRadius = 0.08; // Ø160mm
  const flangeHeight = 0.010; // 10mm
  const floorFlangeGeo = new THREE.CylinderGeometry(flangeRadius, flangeRadius, flangeHeight, 24);
  const floorFlangeMesh = new THREE.Mesh(floorFlangeGeo, new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
  floorFlangeMesh.position.set(0, flangeHeight / 2, 0);
  tableGroup.add(floorFlangeMesh);

  // Tubo vertical
  const tubeRadius = 0.0225; // Ø45mm
  const tubeHeight = Math.max(0.20, heightFromFloorM - tableThickness);
  const tubeGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeHeight, 24);
  const tubeMesh = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: 0x18181b }));
  tubeMesh.position.set(0, tubeHeight / 2, 0);
  tableGroup.add(tubeMesh);

  // Flange superior sob o tampo
  const topFlangeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.012, 24);
  const topFlangeMesh = new THREE.Mesh(topFlangeGeo, new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
  topFlangeMesh.position.set(0, heightFromFloorM - tableThickness - 0.006, 0);
  tableGroup.add(topFlangeMesh);

  // Tampo da mesa
  const radius = 0.04;
  const hw = tableWM / 2;
  const hl = tableLM / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + radius, -hl);
  shape.lineTo(hw - radius, -hl);
  shape.quadraticCurveTo(hw, -hl, hw, -hl + radius);
  shape.lineTo(hw, hl - radius);
  shape.quadraticCurveTo(hw, hl, hw - radius, hl);
  shape.lineTo(-hw + radius, hl);
  shape.quadraticCurveTo(-hw, hl, -hw, hl - radius);
  shape.lineTo(-hw, -hl + radius);
  shape.quadraticCurveTo(-hw, -hl, -hw + radius, -hl);

  const tableTopGeo = new THREE.ExtrudeGeometry(shape, {
    depth: tableThickness,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.003,
    bevelThickness: 0.003
  });
  tableTopGeo.rotateX(-Math.PI / 2);

  const tableTopMesh = new THREE.Mesh(tableTopGeo, new THREE.MeshBasicMaterial({ color: 0xd97706 }));
  tableTopMesh.position.set(0, heightFromFloorM - tableThickness / 2, 0);
  tableTopMesh.rotation.y = rotRad;
  tableGroup.add(tableTopMesh);

  floorGroup.add(tableGroup);

  const bbFloor = new THREE.Box3().setFromObject(floorMesh);
  const bbTable = new THREE.Box3().setFromObject(tableGroup);

  console.log('Floor bounds:', {
    minY: bbFloor.min.y,
    maxY: bbFloor.max.y,
    centerZ: centerZ
  });

  console.log('Table bounds:', {
    minY: bbTable.min.y,
    maxY: bbTable.max.y,
    heightTotal: bbTable.max.y - bbTable.min.y,
    centerZ: (bbTable.min.z + bbTable.max.z) / 2
  });

  console.log('Flange rests on top of plywood?:', Math.abs(bbTable.min.y - bbFloor.max.y) < 0.001);
}

testFloorCentralTable();

