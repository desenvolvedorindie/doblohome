/**
 * Fábrica de Perfis de Alumínio Estrutural (Aluminium Extrusion Factory)
 * Modelação paramétrica de alta precisão baseada no desenho técnico de perfis T-Slot 40x40 (Série 40 Base 8).
 * 
 * Geometria exata do perfil de alumínio extrudado:
 * - Dimensões: 40 x 40 mm (0.040 x 0.040 m)
 * - 4 Ranhuras T (T-Slots) padrão industrial:
 *   * Abertura externa: 8.2 mm com chanfro de entrada a 45° (boca tipo V-groove/T-slot)
 *   * Lábios de retenção de 2.5 mm de espessura
 *   * Câmara interna alargada para 19.6 mm (apoio para porca T-Nut / cabeça de parafuso)
 *   * Fundo da ranhura a 9.5 mm de profundidade
 * - 4 Cantos externos chanfrados a 45° (1.5 mm)
 * - Furo Cilíndrico Central contínuo de Ø 6.8 mm (preparado para rosca M8)
 * - 4 Furos de Alívio Estrutural nos 4 cantos de Ø 4.0 mm a ±13.0 mm
 * - Cantoneiras L 4040 injetadas com nervura triangular de reforço a 45°
 * - Parafusos sextavados internos M8 (Allen) com cabeça cilíndrica e arruelas
 */

class AluminumExtrusionFactory {
  static geoCache = new Map();
  static shape40 = null;
  static bracketGeoCache = null;
  static screwMeshCache = null;

  /**
   * Constrói o THREE.Shape 2D exatamente conforme o desenho técnico de extrusão de alumínio 40x40
   */
  static buildProfileShape(size = 0.040) {
    const hs = size / 2.0;               // 20.0 mm
    const slotW = 0.0082 / 2.0;          // 4.1 mm
    const innerW = 0.0196 / 2.0;         // 9.8 mm
    const lipT = 0.0025;                 // 2.5 mm
    const slotDepth = 0.0095;            // 9.5 mm
    const chamfer = 0.0015;              // 1.5 mm chanfro de canto
    const mouthChamfer = 0.0008;         // 0.8 mm chanfro de entrada da ranhura

    function rot(x, y, angle) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [x * c - y * s, x * s + y * c];
    }

    // Traçado do topo (TOP, face Y positiva), sentido horário da esquerda para a direita
    const sidePts = [
      [-hs + chamfer, hs],
      [-slotW - mouthChamfer, hs],
      [-slotW, hs - mouthChamfer],
      [-slotW, hs - lipT],
      [-innerW, hs - lipT - 0.0014],
      [-innerW, hs - slotDepth],
      [innerW, hs - slotDepth],
      [innerW, hs - lipT - 0.0014],
      [slotW, hs - lipT],
      [slotW, hs - mouthChamfer],
      [slotW + mouthChamfer, hs],
      [hs - chamfer, hs],
      [hs, hs - chamfer]
    ];

    const fullPts = [];
    for (let side = 0; side < 4; side++) {
      const angle = -side * (Math.PI / 2.0);
      for (let i = 0; i < sidePts.length; i++) {
        const p = sidePts[i];
        const r = rot(p[0], p[1], angle);
        if (fullPts.length > 0) {
          const last = fullPts[fullPts.length - 1];
          if (Math.hypot(last[0] - r[0], last[1] - r[1]) < 1e-6) continue;
        }
        fullPts.push(r);
      }
    }

    const shape = new THREE.Shape();
    shape.moveTo(fullPts[0][0], fullPts[0][1]);
    for (let i = 1; i < fullPts.length; i++) {
      shape.lineTo(fullPts[i][0], fullPts[i][1]);
    }
    shape.closePath();

    // 1. Furo cilíndrico central (Ø 6.8 mm, rosca M8)
    const centerHole = new THREE.Path();
    const centerRadius = 0.0034;
    const centerSegments = 20;
    for (let i = 0; i <= centerSegments; i++) {
      const theta = (i / centerSegments) * Math.PI * 2;
      const x = Math.cos(theta) * centerRadius;
      const y = Math.sin(theta) * centerRadius;
      if (i === 0) centerHole.moveTo(x, y);
      else centerHole.lineTo(x, y);
    }
    shape.holes.push(centerHole);

    // 2. Quatro furos de alívio estrutural nos cantos (Ø 4.0 mm a ±13 mm do centro)
    const cornerR = 0.0020;
    const cornerDist = 0.0130;
    const cornerPositions = [
      [-cornerDist, -cornerDist],
      [cornerDist, -cornerDist],
      [cornerDist, cornerDist],
      [-cornerDist, cornerDist]
    ];

    cornerPositions.forEach(([cx, cy]) => {
      const hole = new THREE.Path();
      const holeSegments = 14;
      for (let i = 0; i <= holeSegments; i++) {
        const theta = (i / holeSegments) * Math.PI * 2;
        const x = cx + Math.cos(theta) * cornerR;
        const y = cy + Math.sin(theta) * cornerR;
        if (i === 0) hole.moveTo(x, y);
        else hole.lineTo(x, y);
      }
      shape.holes.push(hole);
    });

    return shape;
  }

  /**
   * Retorna ou gera a geometria 3D extrudada do perfil 40x40 com cache
   * @param {number} length Comprimento em metros
   * @param {number} size Tamanho da seção transversal (0.040 m = 40 mm)
   * @param {string} axis Eixo de alinhamento ('z' para longitudinal, 'x' para transversal, 'y' para vertical)
   */
  static getProfileGeometry(length, size = 0.040, axis = 'z') {
    if (!this.shape40) {
      this.shape40 = this.buildProfileShape(size);
    }

    const cacheKey = `${size.toFixed(3)}_${length.toFixed(4)}_${axis}`;
    if (this.geoCache.has(cacheKey)) {
      return this.geoCache.get(cacheKey);
    }

    const extrudeSettings = {
      steps: 1,
      depth: length,
      bevelEnabled: false
    };

    const geo = new THREE.ExtrudeGeometry(this.shape40, extrudeSettings);
    geo.center();

    if (axis === 'x') {
      geo.rotateY(Math.PI / 2);
    } else if (axis === 'y') {
      geo.rotateX(Math.PI / 2);
    }

    geo.computeVertexNormals();
    this.geoCache.set(cacheKey, geo);
    return geo;
  }

  /**
   * Cria uma barra completa de extrusão de alumínio, opcionalmente com acabamento das pontas
   */
  static createProfileMesh(length, material, options = {}) {
    const axis = options.axis || 'z';
    const size = options.size || 0.040;
    const geo = this.getProfileGeometry(length, size, axis);

    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Se solicitado detalhe de corte usinado de precisão nas pontas:
    if (options.showCutFace && MaterialLibrary.materials.aluminumCutFace) {
      const cutMat = MaterialLibrary.materials.aluminumCutFace;
      const endShape = this.shape40;
      const endGeo = new THREE.ShapeGeometry(endShape);

      if (axis === 'z') {
        // Ponta frontal
        const endFront = new THREE.Mesh(endGeo, cutMat);
        endFront.position.set(0, 0, length / 2 + 0.0002);
        mesh.add(endFront);

        // Ponta traseira
        const endRear = new THREE.Mesh(endGeo, cutMat);
        endRear.rotation.y = Math.PI;
        endRear.position.set(0, 0, -length / 2 - 0.0002);
        mesh.add(endRear);
      }
    }

    return mesh;
  }

  /**
   * Constrói uma Cantoneira em L 4040 de alumínio fundido com nervura triangular a 45°
   * e 2 parafusos Allen M8 cilíndricos com arruelas
   */
  static createCornerBracket() {
    const mats = MaterialLibrary.materials;
    const bracketMat = mats.extrusionBracket || mats.aluminumProfileBlack;
    const screwMat = mats.allenScrew || mats.weldedSteelMetalon;

    const group = new THREE.Group();
    group.name = "CornerBracket4040";

    const bracketW = 0.036; // 36 mm largura (eixo Y)
    const bracketL = 0.036; // 36 mm comprimento perna 1
    const bracketH = 0.036; // 36 mm comprimento perna 2
    const wallT = 0.004;    // 4.0 mm espessura da chapa L

    // 1. Corpo em L no plano XZ
    const lShape = new THREE.Shape();
    lShape.moveTo(0, 0);
    lShape.lineTo(bracketL, 0);
    lShape.lineTo(bracketL, wallT);
    lShape.lineTo(wallT, wallT);
    lShape.lineTo(wallT, bracketH);
    lShape.lineTo(0, bracketH);
    lShape.closePath();

    const lGeo = new THREE.ExtrudeGeometry(lShape, {
      depth: bracketW,
      bevelEnabled: true,
      bevelThickness: 0.0006,
      bevelSize: 0.0006,
      bevelSegments: 2
    });
    // Extrusão orientada para a altura Y
    lGeo.rotateX(-Math.PI / 2);
    lGeo.center();

    const lMesh = new THREE.Mesh(lGeo, bracketMat);
    lMesh.castShadow = true;
    group.add(lMesh);

    // 2. Nervura triangular central de reforço (gusset a 45°)
    const gussetShape = new THREE.Shape();
    gussetShape.moveTo(wallT, wallT);
    gussetShape.lineTo(bracketL - 0.004, wallT);
    gussetShape.lineTo(wallT, bracketH - 0.004);
    gussetShape.closePath();

    const gussetGeo = new THREE.ExtrudeGeometry(gussetShape, {
      depth: 0.0035, // 3.5 mm espessura da nervura
      bevelEnabled: false
    });
    gussetGeo.rotateX(-Math.PI / 2);
    gussetGeo.center();

    const gussetMesh = new THREE.Mesh(gussetGeo, bracketMat);
    gussetMesh.castShadow = true;
    group.add(gussetMesh);

    return group;
  }

  /**
   * Adiciona cantoneiras 4040 com parafusos Allen em todos os 8 nós de junção do rack
   */
  static addRackBrackets(targetGroup, width, length, zCenter, baseY, profileSize = 0.040, customMidZs = null) {
    const halfW = width / 2;
    const innerEdgeX = halfW - profileSize; // 0.66 m
    const offsetBracket = 0.018; // metade da perna da cantoneira para encostar nas faces

    const midFrontZ = (customMidZs && customMidZs[0] !== undefined) ? customMidZs[0] : (zCenter + 0.45);
    const midRearZ  = (customMidZs && customMidZs[1] !== undefined) ? customMidZs[1] : (zCenter - 0.45);

    const crossZs = [
      { z: zCenter + length / 2 - profileSize / 2, type: 'front' },
      { z: midFrontZ, type: 'mid' },
      { z: midRearZ, type: 'mid' },
      { z: zCenter - length / 2 + profileSize / 2, type: 'rear' }
    ];

    crossZs.forEach(cross => {
      // 1. Canto Esquerdo (X negativo)
      const bLeft = this.createCornerBracket();
      if (cross.type === 'front') {
        bLeft.position.set(-innerEdgeX + offsetBracket, baseY, cross.z - profileSize / 2 - offsetBracket);
        bLeft.rotation.y = 0;
      } else if (cross.type === 'rear') {
        bLeft.position.set(-innerEdgeX + offsetBracket, baseY, cross.z + profileSize / 2 + offsetBracket);
        bLeft.rotation.y = -Math.PI / 2;
      } else {
        // Intermediárias
        bLeft.position.set(-innerEdgeX + offsetBracket, baseY, cross.z - profileSize / 2 - offsetBracket);
        bLeft.rotation.y = 0;
      }
      targetGroup.add(bLeft);

      // 2. Canto Direito (X positivo)
      const bRight = this.createCornerBracket();
      if (cross.type === 'front') {
        bRight.position.set(innerEdgeX - offsetBracket, baseY, cross.z - profileSize / 2 - offsetBracket);
        bRight.rotation.y = Math.PI / 2;
      } else if (cross.type === 'rear') {
        bRight.position.set(innerEdgeX - offsetBracket, baseY, cross.z + profileSize / 2 + offsetBracket);
        bRight.rotation.y = Math.PI;
      } else {
        // Intermediárias
        bRight.position.set(innerEdgeX - offsetBracket, baseY, cross.z - profileSize / 2 - offsetBracket);
        bRight.rotation.y = Math.PI / 2;
      }
      targetGroup.add(bRight);
    });
  }
}
