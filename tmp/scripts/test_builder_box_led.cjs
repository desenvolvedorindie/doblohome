const THREE = require('three');

function testBuildBoxLedCorner() {
  const container = new THREE.Group();
  const w = 0.6;
  const l = 0.8;
  const h = 0.4;
  const box = {
    id: 'box_test',
    name: 'Gavetão Cozinha',
    hasLedCorner: true,
    ledCorner: {
      enabled: true,
      edges: ['rear', 'left'],
      color: '#fef3c7',
      brightness: 85
    }
  };

  const ledCfg = box.ledCorner || { enabled: true };
  const ledColorHex = new THREE.Color(ledCfg.color || '#fef3c7').getHex();
  const brightness = Math.max(0.1, Math.min(1.5, (ledCfg.brightness ?? 85) / 100));

  const edges = ledCfg.edges || ['rear'];
  const hasRear = edges.includes('rear');
  const hasFront = edges.includes('front');

  const ledGroup = new THREE.Group();
  const aluminumMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
  const diffuserMat = new THREE.MeshBasicMaterial({ color: ledColorHex });

  const S = 0.016;
  const yBottom = -h / 2;

  edges.forEach((edge) => {
    let length = (edge === 'rear' || edge === 'front') ? w : l;
    if (edge === 'left' || edge === 'right') {
      if (hasRear) length -= S;
      if (hasFront) length -= S;
    }
    length = Math.max(0.04, length);

    const profileShape = new THREE.Shape();
    profileShape.moveTo(0, 0);
    profileShape.lineTo(0, S);
    profileShape.lineTo(0.002, S);
    profileShape.lineTo(S, 0.002);
    profileShape.lineTo(S, 0);
    profileShape.closePath();

    const profileGeo = new THREE.ExtrudeGeometry(profileShape, {
      depth: length,
      bevelEnabled: false
    });

    const diffuserShape = new THREE.Shape();
    diffuserShape.moveTo(0.001, S - 0.002);
    diffuserShape.lineTo(S - 0.002, 0.001);
    diffuserShape.lineTo(S - 0.004, 0.003);
    diffuserShape.lineTo(0.003, S - 0.004);
    diffuserShape.closePath();

    const diffuserGeo = new THREE.ExtrudeGeometry(diffuserShape, {
      depth: Math.max(0.02, length - 0.004),
      bevelEnabled: false
    });

    const profileMesh = new THREE.Mesh(profileGeo, aluminumMat);
    const diffuserMesh = new THREE.Mesh(diffuserGeo, diffuserMat);
    diffuserMesh.position.z = 0.002;

    const edgeGroup = new THREE.Group();
    edgeGroup.add(profileMesh);
    edgeGroup.add(diffuserMesh);

    if (edge === 'rear') {
      edgeGroup.rotation.y = Math.PI / 2;
      edgeGroup.position.set(-length / 2, yBottom, -l / 2);
    } else if (edge === 'front') {
      edgeGroup.rotation.y = -Math.PI / 2;
      edgeGroup.position.set(length / 2, yBottom, l / 2);
    } else if (edge === 'left') {
      const zOffset = hasRear ? -l / 2 + S : -l / 2;
      edgeGroup.position.set(w / 2, yBottom, zOffset);
    } else if (edge === 'right') {
      const zOffset = hasRear ? l / 2 - S : l / 2;
      edgeGroup.rotation.y = Math.PI;
      edgeGroup.position.set(-w / 2, yBottom, zOffset);
    }

    ledGroup.add(edgeGroup);
  });

  const pointLight = new THREE.PointLight(ledColorHex, brightness * 0.7, 1.4, 1.6);
  pointLight.position.set(0, yBottom + 0.05, hasRear ? -l / 2 - 0.05 : 0);
  ledGroup.add(pointLight);

  container.add(ledGroup);

  const bb = new THREE.Box3().setFromObject(container);
  console.log('Success! Container bounds:', {
    min: bb.min,
    max: bb.max,
    children: ledGroup.children.length
  });
}

testBuildBoxLedCorner();

