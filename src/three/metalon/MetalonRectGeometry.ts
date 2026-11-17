import * as THREE from 'three';
import { MaterialLibrary } from '../Materials';

/**
 * Desenha um caminho retangular com cantos arredondados (fillet) característicos de metalon conformado a frio
 * @param clockwise Sentido do traçado. 'false' (padrão) para o contorno externo (CCW), 'true' para furos internos (CW)
 */
export function drawRoundedRectPath(
  path: THREE.Path | THREE.Shape,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  clockwise: boolean = false
): void {
  const x0 = x;
  const x1 = x + w;
  const y0 = y;
  const y1 = y + h;

  if (r <= 0.0002) {
    if (clockwise) {
      path.moveTo(x0, y0);
      path.lineTo(x0, y1);
      path.lineTo(x1, y1);
      path.lineTo(x1, y0);
      path.closePath();
    } else {
      path.moveTo(x0, y0);
      path.lineTo(x1, y0);
      path.lineTo(x1, y1);
      path.lineTo(x0, y1);
      path.closePath();
    }
    return;
  }

  if (clockwise) {
    // Sentido Horário (Clockwise / CW): área negativa, essencial para THREE.Shape.holes
    path.moveTo(x0 + r, y1);
    path.lineTo(x1 - r, y1);
    path.absarc(x1 - r, y1 - r, r, Math.PI / 2, 0, true);
    path.lineTo(x1, y0 + r);
    path.absarc(x1 - r, y0 + r, r, 0, -Math.PI / 2, true);
    path.lineTo(x0 + r, y0);
    path.absarc(x0 + r, y0 + r, r, -Math.PI / 2, -Math.PI, true);
    path.lineTo(x0, y1 - r);
    path.absarc(x0 + r, y1 - r, r, Math.PI, Math.PI / 2, true);
    path.closePath();
  } else {
    // Sentido Anti-Horário (Counter-Clockwise / CCW): área positiva para contorno externo
    path.moveTo(x0 + r, y0);
    path.lineTo(x1 - r, y0);
    path.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
    path.lineTo(x1, y1 - r);
    path.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
    path.lineTo(x0 + r, y1);
    path.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
    path.lineTo(x0, y0 + r);
    path.absarc(x0 + r, y0 + r, r, Math.PI, 1.5 * Math.PI, false);
    path.closePath();
  }
}

/**
 * Constrói o Shape 2D de um perfil tubular oco (metalon) com espessura de parede e furo central
 */
export function buildMetalonTubeShape(
  width: number,
  height: number,
  thickness: number,
  radius: number = 0.0025
): THREE.Shape {
  // Garante que a espessura não exceda a metade do menor lado (deixando vão mínimo de 1mm)
  const maxT = Math.min(width, height) / 2 - 0.0005;
  const safeT = Math.max(0.0005, Math.min(thickness, maxT));

  // Limita o raio ao espaço disponível
  const maxR = Math.min(0.0035, safeT * 1.5, (width - 2 * safeT) / 2, (height - 2 * safeT) / 2);
  const safeR = Math.max(0, Math.min(radius, maxR));

  const shape = new THREE.Shape();
  drawRoundedRectPath(shape, -width / 2, -height / 2, width, height, safeR, false);

  // Furo oco central (cavidade interna do tubo com a espessura de parede)
  // O furo DEVE ser gerado em sentido horário (CW, clockwise: true) para garantir área negativa
  // e triangulação Earcut 100% oca e vazada no Three.js
  const hole = new THREE.Path();
  const inW = width - 2 * safeT;
  const inH = height - 2 * safeT;
  const inR = Math.max(0, safeR - safeT);
  drawRoundedRectPath(hole, -inW / 2, -inH / 2, inW, inH, inR, true);
  shape.holes.push(hole);

  return shape;
}

export function getCachedTubeShape(
  shapeCache: Map<string, THREE.Shape>,
  width = 0.040,
  height = 0.040,
  thickness = 0.0020,
  radius = 0.0025
): THREE.Shape {
  const key = `${Math.round(width * 10000)}_${Math.round(height * 10000)}_${Math.round(thickness * 10000)}_${Math.round(radius * 10000)}`;
  if (!shapeCache.has(key)) {
    shapeCache.set(key, buildMetalonTubeShape(width, height, thickness, radius));
  }
  return shapeCache.get(key)!;
}

export function getCachedTubeGeometry(
  geoCache: Map<string, THREE.BufferGeometry>,
  shapeCache: Map<string, THREE.Shape>,
  length: number,
  width = 0.040,
  height = 0.040,
  thickness = 0.0020,
  axis: 'x' | 'y' | 'z' = 'z',
  radius = 0.0025
): THREE.BufferGeometry {
  const key = `${Math.round(width * 10000)}_${Math.round(height * 10000)}_${Math.round(thickness * 10000)}_${length.toFixed(4)}_${axis}`;
  if (geoCache.has(key)) {
    return geoCache.get(key)!;
  }

  const shape = getCachedTubeShape(shapeCache, width, height, thickness, radius);
  const extrudeSettings = {
    steps: 1,
    depth: length,
    bevelEnabled: false,
    curveSegments: 3
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

export function createMetalonTubeMesh(
  geoCache: Map<string, THREE.BufferGeometry>,
  shapeCache: Map<string, THREE.Shape>,
  length: number,
  material: THREE.Material,
  options: {
    axis?: 'x' | 'y' | 'z';
    size?: number;
    width?: number;
    height?: number;
    thickness?: number;
    radius?: number;
    showCutFace?: boolean;
    cutFaceMaterial?: THREE.Material;
    addCaps?: boolean;
    capMaterial?: THREE.Material;
  } = {}
): THREE.Mesh {
  const axis = options.axis || 'z';
  const size = options.size || 0.040;
  const width = options.width || size;
  const height = options.height || size;
  const thickness = options.thickness || 0.0020;

  const geo = getCachedTubeGeometry(geoCache, shapeCache, length, width, height, thickness, axis, options.radius);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Hitbox invisível BoxGeometry para detecção imediata de cliques e hover
  let hitGeo: THREE.BoxGeometry;
  if (axis === 'z') {
    hitGeo = new THREE.BoxGeometry(width, height, length);
  } else if (axis === 'x') {
    hitGeo = new THREE.BoxGeometry(length, height, width);
  } else { // 'y'
    hitGeo = new THREE.BoxGeometry(width, length, height);
  }

  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.name = '__hitbox';
  mesh.add(hitMesh);

  // Faces de corte usinadas (Cut Face) nas extremidades abertas, evidenciando a espessura de parede e furo vazado
  if (options.showCutFace) {
    const mats = MaterialLibrary.materials;
    const isAlu = (material === mats?.aluminumTubeSilver || material === mats?.aluminumTubeBlack);
    let cutMat = options.cutFaceMaterial || (isAlu ? mats?.aluminumCutFace : (mats?.steelCutFace || mats?.aluminumCutFace));

    // Fallback seguro para ambiente de testes (Node.js sem document/canvas)
    if (!cutMat) {
      cutMat = new THREE.MeshStandardMaterial({
        color: isAlu ? 0xe8edf2 : 0xd4dbe2,
        metalness: 0.94,
        roughness: 0.22,
        side: THREE.DoubleSide
      });
    }

    if (cutMat) {
      const endShape = getCachedTubeShape(shapeCache, width, height, thickness, options.radius);
      const endGeo = new THREE.ShapeGeometry(endShape);

      if (axis === 'z') {
        const endFront = new THREE.Mesh(endGeo, cutMat);
        endFront.position.set(0, 0, length / 2 + 0.0002);
        mesh.add(endFront);

        const endRear = new THREE.Mesh(endGeo, cutMat);
        endRear.rotation.y = Math.PI;
        endRear.position.set(0, 0, -length / 2 - 0.0002);
        mesh.add(endRear);
      } else if (axis === 'y') {
        const endTop = new THREE.Mesh(endGeo, cutMat);
        endTop.rotation.x = -Math.PI / 2;
        endTop.position.set(0, length / 2 + 0.0002, 0);
        mesh.add(endTop);

        const endBottom = new THREE.Mesh(endGeo, cutMat);
        endBottom.rotation.x = Math.PI / 2;
        endBottom.position.set(0, -length / 2 - 0.0002, 0);
        mesh.add(endBottom);
      } else if (axis === 'x') {
        const endRight = new THREE.Mesh(endGeo, cutMat);
        endRight.rotation.y = Math.PI / 2;
        endRight.position.set(length / 2 + 0.0002, 0, 0);
        mesh.add(endRight);

        const endLeft = new THREE.Mesh(endGeo, cutMat);
        endLeft.rotation.y = -Math.PI / 2;
        endLeft.position.set(-length / 2 - 0.0002, 0, 0);
        mesh.add(endLeft);
      }
    }
  }

  // Tampões plásticos / CAPs nas extremidades
  if (options.addCaps) {
    const capFront = buildMetalonCapMesh(width, height, thickness, options.capMaterial, { centered: true });
    capFront.position.set(0, 0, length / 2);
    mesh.add(capFront);

    const capRear = buildMetalonCapMesh(width, height, thickness, options.capMaterial, { centered: true });
    capRear.position.set(0, 0, -length / 2);
    mesh.add(capRear);
  }

  return mesh;
}

/**
 * Constrói o Mesh 3D de um CAP de Metalon (Ponteira plástica com aletas de retenção e flange)
 */
export function buildMetalonCapMesh(
  width: number = 0.040,
  height: number = 0.040,
  wallThickness: number = 0.0020,
  material?: THREE.Material,
  options: { centered?: boolean } = {}
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'MetalonCapMesh';

  const capMat = material || new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.65,
    metalness: 0.15
  });

  const flangeThick = 0.004;
  const shankDepth = 0.016;
  const totalDepth = flangeThick + shankDepth; // 0.020m (> 0.015m)

  const shankW = Math.max(0.010, width - 2 * wallThickness - 0.001);
  const shankH = Math.max(0.010, height - 2 * wallThickness - 0.001);

  // Offset Z caso centered seja true
  const zOffset = options.centered ? 0 : -totalDepth / 2;

  // Hitbox
  const hitGeo = new THREE.BoxGeometry(width, height, totalDepth);
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const hitbox = new THREE.Mesh(hitGeo, hitMat);
  hitbox.name = '__hitbox';
  hitbox.position.set(0, 0, zOffset);
  group.add(hitbox);

  // Flange frontal externa
  const flangeGeo = new THREE.BoxGeometry(width, height, flangeThick);
  const flange = new THREE.Mesh(flangeGeo, capMat);
  flange.name = 'MetalonCap_Flange';
  flange.position.set(0, 0, zOffset + (totalDepth / 2 - flangeThick / 2));
  group.add(flange);

  // Haste de encaixe interno (Shank)
  const shankGeo = new THREE.BoxGeometry(shankW, shankH, shankDepth);
  const shank = new THREE.Mesh(shankGeo, capMat);
  shank.name = 'MetalonCap_Shank';
  shank.position.set(0, 0, zOffset - flangeThick / 2);
  group.add(shank);

  // 3 Aletas de retenção (Ribs)
  const ribGeo = new THREE.BoxGeometry(shankW + 0.0015, shankH + 0.0015, 0.0015);
  const ribPositions = [-0.004, 0, 0.004];
  ribPositions.forEach((zRel, idx) => {
    const rib = new THREE.Mesh(ribGeo, capMat);
    rib.name = `MetalonCap_Rib_${idx + 1}`;
    rib.position.set(0, 0, zOffset - flangeThick / 2 + zRel);
    group.add(rib);
  });

  return group;
}
