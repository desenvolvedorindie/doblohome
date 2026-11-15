import * as THREE from 'three';
import { MaterialLibrary } from './Materials';

/**
 * Fábrica de Tubos Estruturais (Metalon de Ferro / Aço Carbono e Alumínio Tubular)
 * Modelação paramétrica de tubos ocos de secção retangular ou quadrada com espessura de parede configurável.
 */
export class MetalonTubeFactory {
  static geoCache = new Map<string, THREE.BufferGeometry>();
  static shapeCache = new Map<string, THREE.Shape>();

  /**
   * Limpa o cache de geometrias e shapes (útil quando espessuras ou configurações mudam)
   */
  static clearCache(): void {
    this.geoCache.forEach(geo => geo.dispose());
    this.geoCache.clear();
    this.shapeCache.clear();
  }

  /**
   * Desenha um caminho retangular com cantos arredondados (fillet) característicos de metalon conformado a frio
   * @param clockwise Sentido do traçado. 'false' (padrão) para o contorno externo (CCW), 'true' para furos internos (CW)
   */
  private static drawRoundedRectPath(
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
   * @param width Largura externa em metros (ex: 0.040 ou 0.030)
   * @param height Altura externa em metros (ex: 0.040 ou 0.030)
   * @param thickness Espessura da parede do tubo em metros (ex: 0.0015 ou 0.0020)
   * @param radius Raio de arredondamento externo dos cantos em metros (padrão 0.0025m / 2.5mm)
   */
  static buildTubeShape(
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
    this.drawRoundedRectPath(shape, -width / 2, -height / 2, width, height, safeR, false);

    // Furo oco central (cavidade interna do tubo com a espessura de parede)
    // O furo DEVE ser gerado em sentido horário (CW, clockwise: true) para garantir área negativa
    // e triangulação Earcut 100% oca e vazada no Three.js
    const hole = new THREE.Path();
    const inW = width - 2 * safeT;
    const inH = height - 2 * safeT;
    const inR = Math.max(0, safeR - safeT);
    this.drawRoundedRectPath(hole, -inW / 2, -inH / 2, inW, inH, inR, true);
    shape.holes.push(hole);

    return shape;
  }

  /**
   * Retorna o Shape 2D em cache para as dimensões e espessura solicitadas
   */
  static getTubeShape(
    width = 0.040,
    height = 0.040,
    thickness = 0.0020,
    radius = 0.0025
  ): THREE.Shape {
    const key = `${Math.round(width * 10000)}_${Math.round(height * 10000)}_${Math.round(thickness * 10000)}_${Math.round(radius * 10000)}`;
    if (!this.shapeCache.has(key)) {
      this.shapeCache.set(key, this.buildTubeShape(width, height, thickness, radius));
    }
    return this.shapeCache.get(key)!;
  }

  /**
   * Retorna ou gera a geometria 3D extrudada do tubo oco (metalon) com cache
   */
  static getTubeGeometry(
    length: number,
    width = 0.040,
    height = 0.040,
    thickness = 0.0020,
    axis: 'x' | 'y' | 'z' = 'z',
    radius = 0.0025
  ): THREE.BufferGeometry {
    const key = `${Math.round(width * 10000)}_${Math.round(height * 10000)}_${Math.round(thickness * 10000)}_${length.toFixed(4)}_${axis}`;
    if (this.geoCache.has(key)) {
      return this.geoCache.get(key)!;
    }

    const shape = this.getTubeShape(width, height, thickness, radius);
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

    this.geoCache.set(key, geo);
    return geo;
  }

  /**
   * Cria uma barra completa em perfil tubular oco (Metalon).
   * Adiciona hitbox invisível BoxGeometry para garantir raycasting e hover 100% responsivos.
   */
  static createTubeMesh(
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
    } = {}
  ): THREE.Mesh {
    const axis = options.axis || 'z';
    const size = options.size || 0.040;
    const width = options.width || size;
    const height = options.height || size;
    const thickness = options.thickness || 0.0020;

    const geo = this.getTubeGeometry(length, width, height, thickness, axis, options.radius);
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
        const endShape = this.getTubeShape(width, height, thickness, options.radius);
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

    return mesh;
  }

  /**
   * Constrói e retorna a geometria tubular oca para tubos de PVC (com furo central e espessura de parede real)
   * @param length Comprimento do tubo em metros
   * @param diameter Diâmetro externo do tubo em metros (ex: 0.200m / 200mm)
   * @param wallThickness Espessura da parede do tubo em metros (padrão ~4.2mm para PVC Série R)
   * @param axis Eixo ao longo do qual o tubo se estende ('z', 'x' ou 'y')
   * @param segments Quantidade de segmentos angulares da circunferência (padrão 36)
   */
  static getPvcPipeGeometry(
    length: number,
    diameter: number = 0.200,
    wallThickness: number = 0.0042,
    axis: 'x' | 'y' | 'z' = 'z',
    segments: number = 36
  ): THREE.BufferGeometry {
    const key = `pvc_${Math.round(diameter * 1000)}_${Math.round(wallThickness * 10000)}_${length.toFixed(4)}_${axis}`;
    if (this.geoCache.has(key)) {
      return this.geoCache.get(key)!;
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

    this.geoCache.set(key, geo);
    return geo;
  }

  /**
   * Constrói e retorna um Mesh 3D do Joelho 90° em PVC com bolsas reforçadas nas extremidades
   */
  static createPvcElbowMesh(
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
  static createPvcCapMesh(
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
}
