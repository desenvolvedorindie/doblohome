import * as THREE from 'three';

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
   */
  private static drawRoundedRectPath(
    path: THREE.Path | THREE.Shape,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    const x0 = x;
    const x1 = x + w;
    const y0 = y;
    const y1 = y + h;

    if (r <= 0.0002) {
      path.moveTo(x0, y0);
      path.lineTo(x1, y0);
      path.lineTo(x1, y1);
      path.lineTo(x0, y1);
      path.closePath();
      return;
    }

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
    this.drawRoundedRectPath(shape, -width / 2, -height / 2, width, height, safeR);

    // Furo oco central (cavidade interna do tubo com a espessura de parede)
    const hole = new THREE.Path();
    const inW = width - 2 * safeT;
    const inH = height - 2 * safeT;
    const inR = Math.max(0, safeR - safeT);
    this.drawRoundedRectPath(hole, -inW / 2, -inH / 2, inW, inH, inR);
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
    const radiusM = Math.max(0.01, diameter / 2);
    const bendR = radiusM * 1.35;

    class ElbowQuarterArcCurve extends THREE.Curve<THREE.Vector3> {
      constructor(public r: number) {
        super();
      }
      getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
        const angle = t * (Math.PI / 2);
        return target.set(
          this.r * Math.cos(angle) - this.r / 2,
          0,
          this.r * Math.sin(angle) - this.r / 2
        );
      }
    }

    const elbowGeo = new THREE.TubeGeometry(new ElbowQuarterArcCurve(bendR), 20, radiusM, 24, false);
    elbowGeo.center();

    const elbowMesh = new THREE.Mesh(elbowGeo, material);
    elbowMesh.castShadow = true;
    elbowMesh.receiveShadow = true;
    group.add(elbowMesh);

    // Bolsas reforçadas (socket collars) nas duas pontas
    const collarLen = Math.max(0.03, radiusM * 0.35);
    const collarGeo = new THREE.CylinderGeometry(radiusM * 1.06, radiusM * 1.06, collarLen, 24, 1, true);

    const collar1 = new THREE.Mesh(collarGeo, material);
    collar1.rotation.x = Math.PI / 2;
    collar1.position.set(bendR / 2, 0, -bendR / 2 + collarLen / 2);
    group.add(collar1);

    const collar2 = new THREE.Mesh(collarGeo, material);
    collar2.rotation.z = Math.PI / 2;
    collar2.position.set(-bendR / 2 + collarLen / 2, 0, bendR / 2);
    group.add(collar2);

    const edgeGeo = new THREE.EdgesGeometry(elbowGeo, 25);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
    group.add(new THREE.LineSegments(edgeGeo, edgeMat));

    const hitGeo = new THREE.BoxGeometry(bendR + diameter, diameter, bendR + diameter);
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
    const radiusM = Math.max(0.01, diameter / 2);
    const capRadius = radiusM * 1.055;
    const depth = Math.max(0.065, radiusM * 0.7);

    // 1. Corpo cilíndrico do CAP
    const bodyGeo = new THREE.CylinderGeometry(capRadius, capRadius, depth, 28, 1, false);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMesh = new THREE.Mesh(bodyGeo, material);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // 2. Fundo abaulado traseiro (-Z)
    const domeGeo = new THREE.SphereGeometry(capRadius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3.5);
    domeGeo.rotateX(-Math.PI / 2);
    const domeMesh = new THREE.Mesh(domeGeo, material);
    domeMesh.position.set(0, 0, -depth / 2);
    group.add(domeMesh);

    // 3. Anel frontal reforçado (+Z)
    const rimGeo = new THREE.CylinderGeometry(capRadius * 1.03, capRadius * 1.03, 0.016, 28);
    rimGeo.rotateX(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, material);
    rimMesh.position.set(0, 0, depth / 2 - 0.008);
    group.add(rimMesh);

    // 4. Adaptador roscado central em latão para registro / dreno (-Z)
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.25
    });
    const brassFitting = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.024, 12), brassMat);
    brassFitting.rotateX(Math.PI / 2);
    brassFitting.position.set(0, 0, -depth / 2 - 0.018);
    group.add(brassFitting);

    // 5. Linhas de contorno
    const edgeGeo = new THREE.EdgesGeometry(bodyGeo, 25);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85
    });
    group.add(new THREE.LineSegments(edgeGeo, edgeMat));

    // 6. Hitbox
    const hitGeo = new THREE.BoxGeometry(capRadius * 2, capRadius * 2, depth + 0.04);
    const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    hitMesh.name = '__pvc_hitbox';
    group.add(hitMesh);

    return group;
  }
}
