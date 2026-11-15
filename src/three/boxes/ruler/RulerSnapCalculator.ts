import * as THREE from 'three';
import type { SceneManager } from '../../SceneManager';
import {
  RulerAxisLock,
  RulerSnapInfo
} from '../../../types';

const BOX_EDGE_PAIRS: [number, number][] = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7]
];

export function extractPartName(mesh: THREE.Mesh): string {
  let cur: THREE.Object3D | null = mesh;
  for (let depth = 0; depth < 5 && cur; depth++) {
    const u = cur.userData;
    if (u) {
      if (typeof u.partLabel === 'string' && u.partLabel.trim()) return u.partLabel.trim();
      if (typeof u.name === 'string' && u.name.trim()) return u.name.trim();
      if (typeof u.boxName === 'string' && u.boxName.trim()) return u.boxName.trim();
    }
    cur = cur.parent;
  }
  return 'Peça';
}

export function computeRulerSnap(
  sceneManager: SceneManager,
  raycaster: THREE.Raycaster,
  screenX: number,
  screenY: number
): RulerSnapInfo | null {
  const renderer = sceneManager.renderer;
  const camera = sceneManager.camera;
  const builder = sceneManager.internalBoxesBuilder;
  if (!renderer || !camera || !builder) return null;

  const rect = renderer.domElement.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const ndc = new THREE.Vector2(
    ((screenX - rect.left) / rect.width) * 2 - 1,
    -((screenY - rect.top) / rect.height) * 2 + 1
  );

  raycaster.setFromCamera(ndc, camera);

  const roots: THREE.Object3D[] = [
    builder.floorGroup,
    builder.boxesGroup,
    builder.ceilingGroup
  ];
  const intersects = raycaster.intersectObjects(roots, true);

  const isAncestorVisible = (node: THREE.Object3D): boolean => {
    let cur: THREE.Object3D | null = node;
    while (cur) {
      if (!cur.visible) return false;
      cur = cur.parent;
    }
    return true;
  };

  const isIgnoredMesh = (obj: THREE.Object3D): boolean => {
    if (!isAncestorVisible(obj)) return true;
    if ((obj as any).isSprite || (obj as any).isLine || (obj as any).isLineSegments) return true;
    if (obj.userData?.isRulerHelper) return true;
    if (
      obj.name === '__box_hitbox' ||
      obj.name === '__hitbox' ||
      obj.name === '__pvc_hitbox' ||
      obj.name === '__roof_collider' ||
      obj.userData?.isInternalBoxHitbox ||
      obj.userData?.isRoofCollider
    ) {
      return true;
    }
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return true;
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const allGhostOrHidden = mats.every((mat: any) => {
        if (!mat) return true;
        if (mat.opacity === 0) return true;
        return mat.transparent === true && typeof mat.opacity === 'number' && mat.opacity <= 0.15;
      });
      if (allGhostOrHidden) return true;
    }
    return false;
  };

  let validHit: THREE.Intersection | null = null;
  for (const hit of intersects) {
    if (!isIgnoredMesh(hit.object)) {
      validHit = hit;
      break;
    }
  }

  if (!validHit) return null;

  const mesh = validHit.object as THREE.Mesh;
  mesh.updateWorldMatrix(true, false);

  if (!mesh.geometry.boundingBox) {
    mesh.geometry.computeBoundingBox();
  }
  const bb = mesh.geometry.boundingBox;
  const partName = extractPartName(mesh);

  const projectToScreen = (pt: THREE.Vector3): { x: number; y: number; visible: boolean } => {
    const projected = pt.clone().project(camera);
    return {
      x: rect.left + ((projected.x + 1) / 2) * rect.width,
      y: rect.top + ((-projected.y + 1) / 2) * rect.height,
      visible: projected.z >= -1 && projected.z <= 1
    };
  };

  const maxWorldDist = Math.max(0.08, validHit.distance * 0.06);

  const vertexCandidates: THREE.Vector3[] = [];
  const midpointCandidates: THREE.Vector3[] = [];
  const faceCenterCandidates: THREE.Vector3[] = [];
  const edges: [THREE.Vector3, THREE.Vector3][] = [];

  if (bb) {
    const corners = [
      new THREE.Vector3(bb.min.x, bb.min.y, bb.min.z),
      new THREE.Vector3(bb.max.x, bb.min.y, bb.min.z),
      new THREE.Vector3(bb.min.x, bb.max.y, bb.min.z),
      new THREE.Vector3(bb.max.x, bb.max.y, bb.min.z),
      new THREE.Vector3(bb.min.x, bb.min.y, bb.max.z),
      new THREE.Vector3(bb.max.x, bb.min.y, bb.max.z),
      new THREE.Vector3(bb.min.x, bb.max.y, bb.max.z),
      new THREE.Vector3(bb.max.x, bb.max.y, bb.max.z)
    ].map((c) => c.applyMatrix4(mesh.matrixWorld));

    vertexCandidates.push(...corners);

    for (const [i, j] of BOX_EDGE_PAIRS) {
      const a = corners[i];
      const b = corners[j];
      edges.push([a, b]);
      midpointCandidates.push(a.clone().add(b).multiplyScalar(0.5));
    }

    const cx = (bb.min.x + bb.max.x) * 0.5;
    const cy = (bb.min.y + bb.max.y) * 0.5;
    const cz = (bb.min.z + bb.max.z) * 0.5;

    const localFaceCenters = [
      new THREE.Vector3(cx, cy, bb.min.z),
      new THREE.Vector3(cx, cy, bb.max.z),
      new THREE.Vector3(bb.min.x, cy, cz),
      new THREE.Vector3(bb.max.x, cy, cz),
      new THREE.Vector3(cx, bb.min.y, cz),
      new THREE.Vector3(cx, bb.max.y, cz)
    ];
    localFaceCenters.forEach((fc) => faceCenterCandidates.push(fc.applyMatrix4(mesh.matrixWorld)));
  }

  const posAttr = mesh.geometry.getAttribute('position');
  if (posAttr && validHit.face) {
    const vA = new THREE.Vector3().fromBufferAttribute(posAttr, validHit.face.a).applyMatrix4(mesh.matrixWorld);
    const vB = new THREE.Vector3().fromBufferAttribute(posAttr, validHit.face.b).applyMatrix4(mesh.matrixWorld);
    const vC = new THREE.Vector3().fromBufferAttribute(posAttr, validHit.face.c).applyMatrix4(mesh.matrixWorld);

    vertexCandidates.push(vA, vB, vC);

    const triMids = [
      vA.clone().add(vB).multiplyScalar(0.5),
      vB.clone().add(vC).multiplyScalar(0.5),
      vC.clone().add(vA).multiplyScalar(0.5)
    ];
    for (const tm of triMids) {
      // Evita que a diagonal interna da face de um box mascare o snap de Centro da Face
      const isFaceCenter = faceCenterCandidates.some((fc) => fc.distanceToSquared(tm) < 1e-6);
      if (!isFaceCenter) {
        midpointCandidates.push(tm);
      }
    }
  }

  const pickClosestCandidate = (candidates: THREE.Vector3[], thresholdPx: number): THREE.Vector3 | null => {
    let best: THREE.Vector3 | null = null;
    let bestDist = thresholdPx;
    for (const pt of candidates) {
      if (pt.distanceTo(validHit!.point) > maxWorldDist) continue;
      const scr = projectToScreen(pt);
      if (!scr.visible) continue;
      const dPx = Math.hypot(scr.x - screenX, scr.y - screenY);
      if (dPx <= bestDist) {
        bestDist = dPx;
        best = pt;
      }
    }
    return best;
  };

  const vertexSnap = pickClosestCandidate(vertexCandidates, 15);
  if (vertexSnap) {
    return {
      point: { x: vertexSnap.x, y: vertexSnap.y, z: vertexSnap.z },
      snapType: 'vertex',
      snapLabel: 'Extremidade',
      partName
    };
  }

  const midpointSnap = pickClosestCandidate(midpointCandidates, 14);
  if (midpointSnap) {
    return {
      point: { x: midpointSnap.x, y: midpointSnap.y, z: midpointSnap.z },
      snapType: 'midpoint',
      snapLabel: 'Ponto Médio',
      partName
    };
  }

  const faceCenterSnap = pickClosestCandidate(faceCenterCandidates, 13);
  if (faceCenterSnap) {
    return {
      point: { x: faceCenterSnap.x, y: faceCenterSnap.y, z: faceCenterSnap.z },
      snapType: 'face_center',
      snapLabel: 'Centro da Face',
      partName
    };
  }

  let bestEdgePt: THREE.Vector3 | null = null;
  let bestEdgeDist = 12;
  const tempLine = new THREE.Line3();
  const tempClosest = new THREE.Vector3();

  for (const [a, b] of edges) {
    tempLine.set(a, b);
    tempLine.closestPointToPoint(validHit.point, true, tempClosest);
    if (tempClosest.distanceTo(validHit.point) > maxWorldDist) continue;
    const scr = projectToScreen(tempClosest);
    if (!scr.visible) continue;
    const dPx = Math.hypot(scr.x - screenX, scr.y - screenY);
    if (dPx <= bestEdgeDist) {
      bestEdgeDist = dPx;
      bestEdgePt = tempClosest.clone();
    }
  }

  if (bestEdgePt) {
    return {
      point: { x: bestEdgePt.x, y: bestEdgePt.y, z: bestEdgePt.z },
      snapType: 'edge',
      snapLabel: 'Na Aresta',
      partName
    };
  }

  return {
    point: { x: validHit.point.x, y: validHit.point.y, z: validHit.point.z },
    snapType: 'face',
    snapLabel: 'Na Face',
    partName
  };
}

export function resolveRulerEndPoint(
  startPt: THREE.Vector3,
  rawSnap: RulerSnapInfo,
  lockedAxis: RulerAxisLock,
  shiftKey: boolean
): { endPt: THREE.Vector3; inferredAxis: RulerAxisLock } {
  const rawEnd = new THREE.Vector3(rawSnap.point.x, rawSnap.point.y, rawSnap.point.z);

  if (lockedAxis === 'x') {
    return {
      endPt: new THREE.Vector3(rawEnd.x, startPt.y, startPt.z),
      inferredAxis: 'x'
    };
  }
  if (lockedAxis === 'y') {
    return {
      endPt: new THREE.Vector3(startPt.x, rawEnd.y, startPt.z),
      inferredAxis: 'y'
    };
  }
  if (lockedAxis === 'z') {
    return {
      endPt: new THREE.Vector3(startPt.x, startPt.y, rawEnd.z),
      inferredAxis: 'z'
    };
  }

  const delta = rawEnd.clone().sub(startPt);
  const len = delta.length();
  let inferredAxis: RulerAxisLock = null;
  let endPt = rawEnd.clone();

  if (len > 0.005) {
    const ax = Math.abs(delta.x);
    const ay = Math.abs(delta.y);
    const az = Math.abs(delta.z);

    let candidate: RulerAxisLock = 'x';
    let sinAngle = Math.hypot(delta.y, delta.z) / len;

    if (ay >= ax && ay >= az) {
      candidate = 'y';
      sinAngle = Math.hypot(delta.x, delta.z) / len;
    } else if (az >= ax && az >= ay) {
      candidate = 'z';
      sinAngle = Math.hypot(delta.x, delta.y) / len;
    }

    const threshold = shiftKey ? 0.25 : 0.085;
    if (sinAngle < threshold) {
      inferredAxis = candidate;
      if (rawSnap.snapType === 'face' || rawSnap.snapType === 'edge' || shiftKey) {
        if (inferredAxis === 'x') {
          endPt = new THREE.Vector3(rawEnd.x, startPt.y, startPt.z);
        } else if (inferredAxis === 'y') {
          endPt = new THREE.Vector3(startPt.x, rawEnd.y, startPt.z);
        } else if (inferredAxis === 'z') {
          endPt = new THREE.Vector3(startPt.x, startPt.y, rawEnd.z);
        }
      }
    }
  }

  return { endPt, inferredAxis };
}
