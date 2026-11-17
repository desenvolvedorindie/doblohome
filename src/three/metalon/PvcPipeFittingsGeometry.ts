import * as THREE from 'three';

/**
 * Constrói e retorna a geometria tubular oca para tubos de PVC (com furo central e espessura de parede real)
 */
export function getCachedPvcPipeGeometry(
  geoCache: Map<string, THREE.BufferGeometry>,
  length: number,
  diameter: number = 0.200,
  wallThickness: number = 0.0042,
  axis: 'x' | 'y' | 'z' = 'z',
  segments: number = 36
): THREE.BufferGeometry {
  const key = `pvc_${Math.round(diameter * 1000)}_${Math.round(wallThickness * 10000)}_${length.toFixed(4)}_${axis}`;
  if (geoCache.has(key)) {
    return geoCache.get(key)!;
  }

  const rOut = Math.max(0.01, diameter / 2);
  // Espessura segura garantindo vão interno
  const maxT = rOut * 0.45;
  const safeT = Math.max(0.001, Math.min(wallThickness, maxT));
  const rIn = rOut - safeT;

  const shape = new THREE.Shape();
  shape.absarc(0, 0, rOut, 0, Math.PI * 2, false);

  const hole = new THREE.Path();
  hole.absarc(0, 0, rIn, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const extrudeSettings = {
    steps: 1,
    depth: length,
    bevelEnabled: false,
    curveSegments: segments
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();

  if (axis === 'x') {
    geo.rotateY(Math.PI / 2);
  } else if (axis === 'y') {
    geo.rotateX(Math.PI / 2);
  }

  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();

  geoCache.set(key, geo);
  return geo;
}

/**
 * Constrói e retorna um Mesh 3D do Joelho 90° em PVC com bolsas reforçadas nas extremidades
 */
export function buildPvcElbowMesh(
  diameter: number = 0.200,
  material: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PvcElbow90Mesh';

  const r = Math.max(0.01, diameter / 2);
  const wallT = Math.max(0.0038, r * 0.045);
  const rOuter = r + wallT;
  const rCollar = rOuter * 1.05;
  const socketDepth = Math.max(0.045, r * 0.45);
  const collarBand = Math.min(0.022, socketDepth * 0.45);
  const bendR = Math.max(r * 1.35, 0.125);

  const tubularSegments = 24;
  const radialSegments = 28;

  // 1. Curva central de 90° (Torus Bend analítico contínuo)
  const bendPositions: number[] = [];
  const bendNormals: number[] = [];
  const bendUvs: number[] = [];
  const bendIndices: number[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const frac = i / tubularSegments;
    const theta = frac * (Math.PI / 2);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const cx = bendR * cosT;
    const cz = bendR * sinT;

    const normal = new THREE.Vector3(cosT, 0, sinT);
    const binormal = new THREE.Vector3(0, 1, 0);

    for (let j = 0; j <= radialSegments; j++) {
      const phi = (j / radialSegments) * Math.PI * 2;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      const nx = normal.x * cosPhi + binormal.x * sinPhi;
      const ny = normal.y * cosPhi + binormal.y * sinPhi;
      const nz = normal.z * cosPhi + binormal.z * sinPhi;

      const px = cx + rOuter * nx;
      const py = rOuter * ny;
      const pz = cz + rOuter * nz;

      bendPositions.push(px, py, pz);
      bendNormals.push(nx, ny, nz);
      bendUvs.push(frac, j / radialSegments);
    }
  }

  const ringStride = radialSegments + 1;
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * ringStride + j;
      const b = (i + 1) * ringStride + j;
      const c = (i + 1) * ringStride + (j + 1);
      const d = i * ringStride + (j + 1);
      bendIndices.push(a, b, d);
      bendIndices.push(b, c, d);
    }
  }

  const bendGeo = new THREE.BufferGeometry();
  bendGeo.setAttribute('position', new THREE.Float32BufferAttribute(bendPositions, 3));
  bendGeo.setAttribute('normal', new THREE.Float32BufferAttribute(bendNormals, 3));
  bendGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bendUvs, 2));
  bendGeo.setIndex(bendIndices);
  bendGeo.computeVertexNormals();

  const elbowMesh = new THREE.Mesh(bendGeo, material);
  elbowMesh.castShadow = true;
  elbowMesh.receiveShadow = true;
  elbowMesh.name = 'PvcElbow_Bend';

  // 2. Bolsas reforçadas de encaixe (Sockets) com diâmetro interno exato do tubo
  function createSocketGeometry(axis: 'z' | 'x'): THREE.BufferGeometry {
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(0, 0));
    pts.push(new THREE.Vector2(r, 0));
    pts.push(new THREE.Vector2(r, socketDepth));
    pts.push(new THREE.Vector2(rCollar, socketDepth));
    pts.push(new THREE.Vector2(rCollar, socketDepth - collarBand));
    pts.push(new THREE.Vector2(rOuter, socketDepth - collarBand - 0.003));
    pts.push(new THREE.Vector2(rOuter, 0));

    const lGeo = new THREE.LatheGeometry(pts, radialSegments);
    if (axis === 'z') {
      lGeo.rotateX(-Math.PI / 2);
    } else {
      lGeo.rotateZ(Math.PI / 2);
    }
    lGeo.computeVertexNormals();
    return lGeo;
  }

  const collar1Geo = createSocketGeometry('z');
  const collar1 = new THREE.Mesh(collar1Geo, material);
  collar1.position.set(bendR, 0, 0);
  collar1.castShadow = true;
  collar1.receiveShadow = true;
  collar1.name = 'PvcElbow_Collar1';

  const collar2Geo = createSocketGeometry('x');
  const collar2 = new THREE.Mesh(collar2Geo, material);
  collar2.position.set(0, 0, bendR);
  collar2.castShadow = true;
  collar2.receiveShadow = true;
  collar2.name = 'PvcElbow_Collar2';

  // Centraliza o conjunto perfeitamente no ponto (0, 0, 0)
  const tempGroup = new THREE.Group();
  tempGroup.add(elbowMesh);
  tempGroup.add(collar1);
  tempGroup.add(collar2);

  const b3 = new THREE.Box3().setFromObject(tempGroup);
  const center = new THREE.Vector3();
  b3.getCenter(center);

  elbowMesh.position.sub(center);
  collar1.position.sub(center);
  collar2.position.sub(center);

  group.add(elbowMesh);
  group.add(collar1);
  group.add(collar2);

  // Contornos / Edge lines
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
  const edge1 = new THREE.LineSegments(new THREE.EdgesGeometry(bendGeo, 28), edgeMat);
  edge1.position.copy(elbowMesh.position);
  group.add(edge1);

  const edge2 = new THREE.LineSegments(new THREE.EdgesGeometry(collar1Geo, 28), edgeMat);
  edge2.position.copy(collar1.position);
  group.add(edge2);

  const edge3 = new THREE.LineSegments(new THREE.EdgesGeometry(collar2Geo, 28), edgeMat);
  edge3.position.copy(collar2.position);
  group.add(edge3);

  // Hitbox
  const size = new THREE.Vector3();
  b3.getSize(size);
  const hitGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
  const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hitMesh.name = '__pvc_hitbox';
  group.add(hitMesh);

  return group;
}

/**
 * Constrói e retorna um Mesh 3D do CAP (Tampão de Vedação) em PVC
 */
export function buildPvcCapMesh(
  diameter: number = 0.200,
  material: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PvcCapMesh';

  const r = Math.max(0.01, diameter / 2);
  const wallT = Math.max(0.0038, r * 0.045);
  const rOuter = r + wallT;
  const rCollar = rOuter * 1.05;
  const socketDepth = Math.max(0.045, r * 0.45);
  const domeH = Math.max(0.024, r * 0.28);
  const collarBand = Math.min(0.020, socketDepth * 0.40);
  const radialSegments = 28;

  // 1. Corpo cilíndrico com bolsa interna soldável
  const bodyPts: THREE.Vector2[] = [];
  bodyPts.push(new THREE.Vector2(0, -socketDepth));
  bodyPts.push(new THREE.Vector2(r, -socketDepth));
  bodyPts.push(new THREE.Vector2(r, -collarBand));
  bodyPts.push(new THREE.Vector2(rOuter, -collarBand));
  bodyPts.push(new THREE.Vector2(rOuter, -socketDepth));
  const bodyGeo = new THREE.LatheGeometry(bodyPts, radialSegments);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, material);
  bodyMesh.name = 'PvcCap_Body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;

  // 2. Anel frontal reforçado (Colarinho de entrada da bolsa)
  const rimPts: THREE.Vector2[] = [];
  rimPts.push(new THREE.Vector2(r, 0));
  rimPts.push(new THREE.Vector2(rCollar, 0));
  rimPts.push(new THREE.Vector2(rCollar, -collarBand));
  rimPts.push(new THREE.Vector2(rOuter, -collarBand));
  rimPts.push(new THREE.Vector2(r, -collarBand));
  const rimGeo = new THREE.LatheGeometry(rimPts, radialSegments);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, material);
  rimMesh.name = 'PvcCap_Rim';
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;

  // 3. Fundo abaulado traseiro (Domo convexo estanque)
  const domePts: THREE.Vector2[] = [];
  const domeSegments = 12;
  const brassR = 0.014;
  for (let i = 0; i <= domeSegments; i++) {
    const frac = i / domeSegments;
    const angle = frac * (Math.PI / 2);
    const curR = rOuter * Math.cos(angle);
    const curZ = -socketDepth - domeH * Math.sin(angle);
    domePts.push(new THREE.Vector2(Math.max(brassR, curR), curZ));
  }
  domePts.push(new THREE.Vector2(brassR, -socketDepth - domeH));
  const domeGeo = new THREE.LatheGeometry(domePts, radialSegments);
  domeGeo.rotateX(Math.PI / 2);
  const domeMesh = new THREE.Mesh(domeGeo, material);
  domeMesh.name = 'PvcCap_Dome';
  domeMesh.castShadow = true;
  domeMesh.receiveShadow = true;

  // 4. Adaptador roscado central em latão para registro / dreno
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.85,
    roughness: 0.25
  });
  const brassGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.024, 16);
  brassGeo.rotateX(Math.PI / 2);
  const brassFitting = new THREE.Mesh(brassGeo, brassMat);
  brassFitting.name = 'PvcCap_BrassFitting';
  brassFitting.position.set(0, 0, -socketDepth - domeH - 0.012);
  brassFitting.castShadow = true;

  // Centraliza o conjunto no ponto (0, 0, 0)
  const tempG = new THREE.Group();
  tempG.add(bodyMesh, rimMesh, domeMesh, brassFitting);
  const b3 = new THREE.Box3().setFromObject(tempG);
  const c = new THREE.Vector3();
  b3.getCenter(c);

  bodyMesh.position.sub(c);
  rimMesh.position.sub(c);
  domeMesh.position.sub(c);
  brassFitting.position.sub(c);

  group.add(bodyMesh);
  group.add(rimMesh);
  group.add(domeMesh);
  group.add(brassFitting);

  // Contornos
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85
  });
  const edgeBody = new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo, 28), edgeMat);
  edgeBody.position.copy(bodyMesh.position);
  group.add(edgeBody);

  const edgeRim = new THREE.LineSegments(new THREE.EdgesGeometry(rimGeo, 28), edgeMat);
  edgeRim.position.copy(rimMesh.position);
  group.add(edgeRim);

  const edgeDome = new THREE.LineSegments(new THREE.EdgesGeometry(domeGeo, 28), edgeMat);
  edgeDome.position.copy(domeMesh.position);
  group.add(edgeDome);

  // Hitbox
  const s = new THREE.Vector3();
  b3.getSize(s);
  const hitGeo = new THREE.BoxGeometry(s.x, s.y, s.z);
  const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hitMesh.name = '__pvc_hitbox';
  group.add(hitMesh);

  return group;
}

/**
 * Constrói e retorna um Mesh 3D do Tê 90° em PVC com 3 bolsas reforçadas (2 laterais + 1 derivação central)
 */
export function buildPvcTeeMesh(
  diameter: number = 0.200,
  material: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PvcTee90Mesh';

  const r = Math.max(0.01, diameter / 2);
  const wallT = Math.max(0.0038, r * 0.045);
  const rOuter = r + wallT;
  const rCollar = rOuter * 1.05;
  const socketDepth = Math.max(0.040, r * 0.42);
  const collarBand = Math.min(0.020, socketDepth * 0.42);
  const radialSegments = 28;

  // Comprimento do corpo reto principal (eixo Z) e ramal de derivação 90° (eixo X)
  const runLength = Math.max(0.18, r * 2.4 + socketDepth);
  const branchLength = rOuter + socketDepth * 0.85;

  // 1. Tubo principal reto (Run ao longo de Z)
  const runShape = new THREE.Shape();
  runShape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
  const runHole = new THREE.Path();
  runHole.absarc(0, 0, r, 0, Math.PI * 2, true);
  runShape.holes.push(runHole);

  const runGeo = new THREE.ExtrudeGeometry(runShape, {
    steps: 1,
    depth: runLength,
    bevelEnabled: false,
    curveSegments: radialSegments
  });
  runGeo.center();
  runGeo.computeVertexNormals();
  const runMesh = new THREE.Mesh(runGeo, material);
  runMesh.castShadow = true;
  runMesh.receiveShadow = true;
  runMesh.name = 'PvcTee_Run';

  // 2. Ramal perpendicular de 90° (Branch ao longo de +X)
  const branchGeo = new THREE.ExtrudeGeometry(runShape, {
    steps: 1,
    depth: branchLength,
    bevelEnabled: false,
    curveSegments: radialSegments
  });
  branchGeo.rotateY(Math.PI / 2);
  branchGeo.computeVertexNormals();
  const branchMesh = new THREE.Mesh(branchGeo, material);
  branchMesh.position.set(0, 0, 0);
  branchMesh.castShadow = true;
  branchMesh.receiveShadow = true;
  branchMesh.name = 'PvcTee_Branch';

  // 3. Bolsas reforçadas nas 3 extremidades (-Z, +Z e +X)
  function createCollarRing(axis: 'z_pos' | 'z_neg' | 'x_pos'): THREE.BufferGeometry {
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(r, 0));
    pts.push(new THREE.Vector2(rCollar, 0));
    pts.push(new THREE.Vector2(rCollar, collarBand));
    pts.push(new THREE.Vector2(rOuter, collarBand + 0.003));
    pts.push(new THREE.Vector2(r, collarBand + 0.003));
    const lGeo = new THREE.LatheGeometry(pts, radialSegments);
    if (axis === 'z_pos') {
      lGeo.rotateX(Math.PI / 2);
    } else if (axis === 'z_neg') {
      lGeo.rotateX(-Math.PI / 2);
    } else {
      lGeo.rotateZ(Math.PI / 2);
    }
    lGeo.computeVertexNormals();
    return lGeo;
  }

  const collarZPosGeo = createCollarRing('z_pos');
  const collarZPos = new THREE.Mesh(collarZPosGeo, material);
  collarZPos.position.set(0, 0, runLength / 2);
  collarZPos.castShadow = true;

  const collarZNegGeo = createCollarRing('z_neg');
  const collarZNeg = new THREE.Mesh(collarZNegGeo, material);
  collarZNeg.position.set(0, 0, -runLength / 2);
  collarZNeg.castShadow = true;

  const collarXPosGeo = createCollarRing('x_pos');
  const collarXPos = new THREE.Mesh(collarXPosGeo, material);
  collarXPos.position.set(branchLength, 0, 0);
  collarXPos.castShadow = true;

  // Centraliza o conjunto no ponto (0, 0, 0)
  const tempG = new THREE.Group();
  tempG.add(runMesh, branchMesh, collarZPos, collarZNeg, collarXPos);
  const b3 = new THREE.Box3().setFromObject(tempG);
  const c = new THREE.Vector3();
  b3.getCenter(c);

  [runMesh, branchMesh, collarZPos, collarZNeg, collarXPos].forEach((m) => {
    m.position.sub(c);
    group.add(m);
  });

  // Contornos / Edge lines
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85
  });
  [
    { geo: runGeo, pos: runMesh.position },
    { geo: branchGeo, pos: branchMesh.position },
    { geo: collarZPosGeo, pos: collarZPos.position },
    { geo: collarZNegGeo, pos: collarZNeg.position },
    { geo: collarXPosGeo, pos: collarXPos.position }
  ].forEach(({ geo, pos }) => {
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), edgeMat);
    edge.position.copy(pos);
    group.add(edge);
  });

  // Hitbox
  const s = new THREE.Vector3();
  b3.getSize(s);
  const hitGeo = new THREE.BoxGeometry(s.x, s.y, s.z);
  const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hitMesh.name = '__pvc_hitbox';
  group.add(hitMesh);

  return group;
}
