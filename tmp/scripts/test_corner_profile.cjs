const THREE = require('three');

function buildEdgeMeshes(w, l, h, edge, length) {
  const S = 0.016; // 16mm cantoneira perfil de quina
  const aluminumMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xfff0b0 });

  // Profile aluminum shape (90-deg corner bracket in U-V: U is outward, V is upward)
  // Corner at (0, 0), V goes up +V, U goes outward +U
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

  // Diffuser ribbon shape (thin 45° strip)
  const diffuserShape = new THREE.Shape();
  diffuserShape.moveTo(0.001, S - 0.002);
  diffuserShape.lineTo(S - 0.002, 0.001);
  diffuserShape.lineTo(S - 0.004, 0.003);
  diffuserShape.lineTo(0.003, S - 0.004);
  diffuserShape.closePath();

  const diffuserGeo = new THREE.ExtrudeGeometry(diffuserShape, {
    depth: Math.max(0.05, length - 0.004),
    bevelEnabled: false
  });

  const profileMesh = new THREE.Mesh(profileGeo, aluminumMat);
  const diffuserMesh = new THREE.Mesh(diffuserGeo, ledMat);
  diffuserMesh.position.z = 0.002;

  const edgeGroup = new THREE.Group();
  edgeGroup.add(profileMesh);
  edgeGroup.add(diffuserMesh);

  const yBottom = -h / 2;

  if (edge === 'rear') {
    // Extrusion along Z -> rotate so depth runs along X
    // Outward is -Z, upward is +Y
    edgeGroup.rotation.y = Math.PI / 2;
    edgeGroup.position.set(-length / 2, yBottom, -l / 2);
    // In local space: U was along +X, after rotY(90) +X points to -Z!
    // V was along +Y, still points to +Y!
    // Depth was along +Z, after rotY(90) points to +X!
    // Perfect!
  } else if (edge === 'front') {
    // Extrusion along Z -> depth runs along X
    // Outward is +Z, upward is +Y
    edgeGroup.rotation.y = -Math.PI / 2;
    edgeGroup.position.set(length / 2, yBottom, l / 2);
    // After rotY(-90): +X points to +Z, Depth points to -X!
  } else if (edge === 'left') {
    // Left edge at x = +w/2 (+X)
    // Runs along Z from rear to front (length)
    // Outward is +X, upward is +Y
    // Depth along +Z
    edgeGroup.position.set(w / 2, yBottom, -length / 2);
    // +X is outward, +Y is upward, depth is along +Z!
  } else if (edge === 'right') {
    // Right edge at x = -w/2 (-X)
    // Runs along Z
    // Outward is -X, upward is +Y
    edgeGroup.rotation.y = Math.PI;
    edgeGroup.position.set(-w / 2, yBottom, length / 2);
    // After rotY(180): +X points to -X (outward), depth along -Z!
  }

  return edgeGroup;
}

const w = 0.6, l = 0.8, h = 0.4;
['rear', 'front', 'left', 'right'].forEach(edge => {
  const len = (edge === 'rear' || edge === 'front') ? w : l;
  const grp = buildEdgeMeshes(w, l, h, edge, len);
  const box = new THREE.Box3().setFromObject(grp);
  console.log(`${edge.toUpperCase()}:`, {
    x: [box.min.x.toFixed(3), box.max.x.toFixed(3)],
    y: [box.min.y.toFixed(3), box.max.y.toFixed(3)],
    z: [box.min.z.toFixed(3), box.max.z.toFixed(3)]
  });
});
