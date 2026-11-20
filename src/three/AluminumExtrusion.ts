import * as THREE from 'three';
import { MaterialLibrary } from './Materials';
import { attachEndCapsToMesh } from './metalon/MetalonRectGeometry';

/**
 * Fábrica de Perfis de Alumínio Estrutural (Aluminium Extrusion Factory)
 * Modelação paramétrica de alta precisão baseada no desenho técnico de perfis T-Slot 40x40 (Série 40 Base 8).
 */
export class AluminumExtrusionFactory {
  static geoCache = new Map<string, THREE.BufferGeometry>();
  static shapes = new Map<number, THREE.Shape>();
  static bracketGeoCache: THREE.BufferGeometry | null = null;
  static screwMeshCache: THREE.Mesh | null = null;

  /**
   * Retorna o shape 2D em cache para o tamanho especificado (ex: 30mm ou 40mm)
   */
  static getProfileShape(size = 0.040): THREE.Shape {
    const key = Math.round(size * 1000);
    if (!this.shapes.has(key)) {
      this.shapes.set(key, this.buildProfileShape(size));
    }
    return this.shapes.get(key)!;
  }

  /**
   * Constrói o THREE.Shape 2D exatamente conforme o desenho técnico de extrusão de alumínio
   */
  static buildProfileShape(size = 0.040): THREE.Shape {
    const hs = size / 2.0;               // 20.0 mm
    const slotW = 0.0082 / 2.0;          // 4.1 mm
    const innerW = 0.0196 / 2.0;         // 9.8 mm
    const lipT = 0.0025;                 // 2.5 mm
    const slotDepth = 0.0095;            // 9.5 mm
    const chamfer = 0.0015;              // 1.5 mm chanfro de canto
    const mouthChamfer = 0.0008;         // 0.8 mm chanfro de entrada da ranhura

    function rot(x: number, y: number, angle: number): [number, number] {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [x * c - y * s, x * s + y * c];
    }

    const sidePts: [number, number][] = [
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

    const fullPts: [number, number][] = [];
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
    const cornerPositions: [number, number][] = [
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
   * Retorna ou gera a geometria 3D extrudada do perfil (30x30 ou 40x40) com cache
   */
  static getProfileGeometry(length: number, size = 0.040, axis: 'x' | 'y' | 'z' = 'z'): THREE.BufferGeometry {
    const shape = this.getProfileShape(size);

    const cacheKey = `${size.toFixed(3)}_${length.toFixed(4)}_${axis}`;
    if (this.geoCache.has(cacheKey)) {
      return this.geoCache.get(cacheKey)!;
    }

    const extrudeSettings = {
      steps: 1,
      depth: length,
      bevelEnabled: false
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();

    if (axis === 'x') {
      geo.rotateY(Math.PI / 2);
    } else if (axis === 'y') {
      geo.rotateX(Math.PI / 2);
    }

    geo.computeVertexNormals();
    // RECALCULA BoundingBox e BoundingSphere após rotações para precisão do Raycaster
    geo.computeBoundingBox();
    geo.computeBoundingSphere();

    this.geoCache.set(cacheKey, geo);
    return geo;
  }

  /**
   * Cria uma barra completa de extrusão de alumínio.
   * Adiciona uma hitbox BoxGeometry invisível para o Raycaster funcionar corretamente,
   * pois ExtrudeGeometry + center() + rotações causam bounding sphere desalinhada.
   */
  static createProfileMesh(
    length: number,
    material: THREE.Material,
    options: { axis?: 'x' | 'y' | 'z'; size?: number; showCutFace?: boolean; addCaps?: boolean; capMaterial?: THREE.Material } = {}
  ): THREE.Mesh {
    const axis = options.axis || 'z';
    const size = options.size || 0.040;
    const geo = this.getProfileGeometry(length, size, axis);

    // Mesh visual com a geometria extrudada precisa do perfil T-Slot
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Hitbox invisível com BoxGeometry alinhada ao eixo — detectada com precisão pelo Raycaster
    let hitGeo: THREE.BoxGeometry;
    if (axis === 'z') {
      hitGeo = new THREE.BoxGeometry(size, size, length);
    } else if (axis === 'x') {
      hitGeo = new THREE.BoxGeometry(length, size, size);
    } else { // 'y'
      hitGeo = new THREE.BoxGeometry(size, length, size);
    }
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.name = '__hitbox';
    // O raycaster ao acertar o hitMesh irá subir para o parent (mesh) para pegar userData
    mesh.add(hitMesh);

    if (options.showCutFace && MaterialLibrary.materials.aluminumCutFace) {
      const cutMat = MaterialLibrary.materials.aluminumCutFace;
      const endShape = this.getProfileShape(size);
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
      }
    }

    if (options.addCaps) {
      attachEndCapsToMesh(mesh, length, size, size, 0.0020, axis, options.capMaterial);
    }

    return mesh;
  }

  /**
   * Constrói uma Cantoneira em L 4040 de alumínio fundido com nervura triangular a 45°
   */
  static createCornerBracket(): THREE.Group {
    const mats = MaterialLibrary.materials;
    const bracketMat = mats.extrusionBracket || mats.aluminumProfileBlack;

    const group = new THREE.Group();
    group.name = "CornerBracket4040";

    const bracketW = 0.036;
    const bracketL = 0.036;
    const bracketH = 0.036;
    const wallT = 0.004;

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
    lGeo.rotateX(-Math.PI / 2);
    lGeo.center();

    const lMesh = new THREE.Mesh(lGeo, bracketMat);
    lMesh.castShadow = true;
    group.add(lMesh);

    const gussetShape = new THREE.Shape();
    gussetShape.moveTo(wallT, wallT);
    gussetShape.lineTo(bracketL - 0.004, wallT);
    gussetShape.lineTo(wallT, bracketH - 0.004);
    gussetShape.closePath();

    const gussetGeo = new THREE.ExtrudeGeometry(gussetShape, {
      depth: 0.0035,
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
  static addRackBrackets(
    targetGroup: THREE.Group,
    width: number,
    length: number,
    zCenter: number,
    baseY: number,
    profileSize = 0.040,
    customMidZs: [number, number] | null = null
  ) {
    const halfW = width / 2;
    const innerEdgeX = halfW - profileSize;
    const offsetBracket = 0.018;

    const midFrontZ = (customMidZs && customMidZs[0] !== undefined) ? customMidZs[0] : (zCenter + 0.45);
    const midRearZ  = (customMidZs && customMidZs[1] !== undefined) ? customMidZs[1] : (zCenter - 0.45);

    const crossZs = [
      { z: zCenter + length / 2 - profileSize / 2, type: 'front' },
      { z: midFrontZ, type: 'mid' },
      { z: midRearZ, type: 'mid' },
      { z: zCenter - length / 2 + profileSize / 2, type: 'rear' }
    ];

    crossZs.forEach(cross => {
      const bLeft = this.createCornerBracket();
      if (cross.type === 'front') {
        bLeft.position.set(-innerEdgeX + offsetBracket, baseY, cross.z - profileSize / 2 - offsetBracket);
        bLeft.rotation.y = 0;
      } else if (cross.type === 'rear') {
        bLeft.position.set(-innerEdgeX + offsetBracket, baseY, cross.z + profileSize / 2 + offsetBracket);
        bLeft.rotation.y = -Math.PI / 2;
      } else {
        bLeft.position.set(-innerEdgeX + offsetBracket, baseY, cross.z - profileSize / 2 - offsetBracket);
        bLeft.rotation.y = 0;
      }
      targetGroup.add(bLeft);

      const bRight = this.createCornerBracket();
      if (cross.type === 'front') {
        bRight.position.set(innerEdgeX - offsetBracket, baseY, cross.z - profileSize / 2 - offsetBracket);
        bRight.rotation.y = Math.PI / 2;
      } else if (cross.type === 'rear') {
        bRight.position.set(innerEdgeX - offsetBracket, baseY, cross.z + profileSize / 2 + offsetBracket);
        bRight.rotation.y = Math.PI;
      } else {
        bRight.position.set(innerEdgeX - offsetBracket, baseY, cross.z - profileSize / 2 - offsetBracket);
        bRight.rotation.y = Math.PI / 2;
      }
      targetGroup.add(bRight);
    });
  }
}

