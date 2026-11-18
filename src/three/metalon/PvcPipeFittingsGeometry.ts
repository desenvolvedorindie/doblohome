import * as THREE from 'three';

/**
 * Constr√≥i e retorna a geometria tubular oca para tubos de PVC (com furo central e espessura de parede real)
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
  // Espessura segura garantindo v√£o interno
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
 * Constr√≥i e retorna um Mesh 3D do Joelho 90¬∞ em PVC com bolsas refor√ßadas nas extremidades
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

  // 1. Curva central de 90¬∞ (Torus Bend anal√≠tico cont√≠nuo)
  const bendPositions: number[] = [];
  const bendNormals: number[] = [];
  const bendUvs: number[] = [];
  const bendIndices: number[] = [];

  // Duas paredes: externa (rOuter) e interna/furo (r, normais invertidas e faces viradas)
  const ringStride = radialSegments + 1;
  [{ rad: rOuter, sign: 1 }, { rad: r, sign: -1 }].forEach(({ rad, sign }) => {
    const base = bendPositions.length / 3;
    for (let i = 0; i <= tubularSegments; i++) {
      const frac = i / tubularSegments;
      const theta = frac * (Math.PI / 2);
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const cx = bendR * cosT;
      const cz = bendR * sinT;

      for (let j = 0; j <= radialSegments; j++) {
        const phi = (j / radialSegments) * Math.PI * 2;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        const nx = cosT * cosPhi;
        const ny = sinPhi;
        const nz = sinT * cosPhi;

        bendPositions.push(cx + rad * nx, rad * ny, cz + rad * nz);
        bendNormals.push(sign * nx, sign * ny, sign * nz);
        bendUvs.push(frac, j / radialSegments);
      }
    }
    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = base + i * ringStride + j;
        const b = base + (i + 1) * ringStride + j;
        const c2 = base + (i + 1) * ringStride + (j + 1);
        const d = base + i * ringStride + (j + 1);
        if (sign > 0) {
          bendIndices.push(a, d, b, b, d, c2);
        } else {
          bendIndices.push(a, b, d, b, c2, d);
        }
      }
    }
  });
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

  // 2. Bolsas refor√ßadas de encaixe (Sockets) com di√¢metro interno exato do tubo
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
 * Constr√≥i e retorna um Mesh 3D do CAP (Tamp√£o de Veda√ß√£o) em PVC
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

  // 1. Corpo cil√≠ndrico com bolsa interna sold√°vel
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

  // 2. Anel frontal refor√ßado (Colarinho de entrada da bolsa)
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

  // 4. Adaptador roscado central em lat√£o para registro / dreno
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
 * Constr√≥i e retorna um Mesh 3D do T√™ 90¬∞ em PVC com 3 bolsas refor√ßadas (2 laterais + 1 deriva√ß√£o central)
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

  // Comprimento do corpo reto principal (eixo Z) e ramal de deriva√ß√£o 90¬∞ (eixo X)
  const runLength = Math.max(0.18, r * 2.4 + socketDepth);
  const branchLength = rOuter + socketDepth * 0.85;

  // 1/2. Corpo do TÍ como uni„o real de dois tubos de mesmo di‚metro (run em Z + ramal em +X).
  // Com raios iguais as curvas de interseÁ„o s„o planos x = ±z, ent„o a superfÌcie È exata:
  //  - run: removido onde x>0 e |z|<x (abre a passagem para o ramal)
  //  - ramal: comeÁa na curva de interseÁ„o (x = R|sin?|), sem cano atravessando o interior
  // Feito para as superfÌcies externa (rOuter) e interna (r), logo a junÁ„o fica vazada.
  const NU = 48;
  const NV = 16;
  type SurfFn = (u: number, v: number) => { p: [number, number, number]; n: [number, number, number] };
  function buildSurfaceGeo(parts: SurfFn[]): THREE.BufferGeometry {
    const pos: number[] = [];
    const nor: number[] = [];
    const idx: number[] = [];
    parts.forEach((fn) => {
      const base = pos.length / 3;
      for (let i = 0; i <= NU; i++) {
        for (let j = 0; j <= NV; j++) {
          const { p, n } = fn(i / NU, j / NV);
          pos.push(p[0], p[1], p[2]);
          nor.push(n[0], n[1], n[2]);
        }
      }
      const stride = NV + 1;
      const tri = (a: number, b: number, c: number) => {
        const A = new THREE.Vector3(pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2]);
        const B = new THREE.Vector3(pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2]);
        const C = new THREE.Vector3(pos[c * 3], pos[c * 3 + 1], pos[c * 3 + 2]);
        const fn2 = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(C, A));
        const nn = new THREE.Vector3(nor[a * 3], nor[a * 3 + 1], nor[a * 3 + 2]);
        if (fn2.lengthSq() < 1e-14) return; // tri‚ngulo degenerado
        if (fn2.dot(nn) >= 0) idx.push(a, b, c);
        else idx.push(a, c, b);
      };
      for (let i = 0; i < NU; i++) {
        for (let j = 0; j < NV; j++) {
          const a = base + i * stride + j;
          const b = base + (i + 1) * stride + j;
          const c = base + (i + 1) * stride + j + 1;
          const d = base + i * stride + j + 1;
          tri(a, b, d);
          tri(b, c, d);
        }
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setIndex(idx);
    return g;
  }

  // SuperfÌcie do run (eixo Z) com abertura para o ramal. sign=+1 externo, -1 interno
  const runSurf = (rad: number, sign: number): SurfFn[] =>
    [-1, 1].map((s) => (u: number, v: number) => {
      const phi = u * Math.PI * 2;
      const cx = Math.cos(phi);
      const sy = Math.sin(phi);
      const g = Math.max(0, rad * cx);
      const z0 = s < 0 ? -runLength / 2 : g;
      const z1 = s < 0 ? -g : runLength / 2;
      return {
        p: [rad * cx, rad * sy, z0 + (z1 - z0) * v],
        n: [sign * cx, sign * sy, 0],
      };
    });

  // SuperfÌcie do ramal (eixo X) comeÁando na curva de interseÁ„o com o run
  const branchSurf = (rad: number, sign: number): SurfFn[] => [
    (u: number, v: number) => {
      const psi = u * Math.PI * 2;
      const cy = Math.cos(psi);
      const sz = Math.sin(psi);
      const x0 = rad * Math.abs(sz);
      return {
        p: [x0 + (branchLength - x0) * v, rad * cy, rad * sz],
        n: [0, sign * cy, sign * sz],
      };
    },
  ];

  const runGeo = buildSurfaceGeo([...runSurf(rOuter, 1), ...runSurf(r, -1)]);
  const runMesh = new THREE.Mesh(runGeo, material);
  runMesh.castShadow = true;
  runMesh.receiveShadow = true;
  runMesh.name = 'PvcTee_Run';

  const branchGeo = buildSurfaceGeo([...branchSurf(rOuter, 1), ...branchSurf(r, -1)]);
  const branchMesh = new THREE.Mesh(branchGeo, material);
  branchMesh.castShadow = true;
  branchMesh.receiveShadow = true;
  branchMesh.name = 'PvcTee_Branch';

  // 3. Bolsas refor√ßadas nas 3 extremidades (-Z, +Z e +X)
  function createCollarRing(axis: 'z_pos' | 'z_neg' | 'x_pos'): THREE.BufferGeometry {
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(r, 0));
    pts.push(new THREE.Vector2(rCollar, 0));
    pts.push(new THREE.Vector2(rCollar, collarBand));
    pts.push(new THREE.Vector2(rOuter, collarBand + 0.003));
    pts.push(new THREE.Vector2(r, collarBand + 0.003));
    const lGeo = new THREE.LatheGeometry(pts, radialSegments);
    if (axis === 'z_pos') {
      lGeo.rotateX(-Math.PI / 2);
    } else if (axis === 'z_neg') {
      lGeo.rotateX(Math.PI / 2);
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
