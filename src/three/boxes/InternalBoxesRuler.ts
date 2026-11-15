import * as THREE from 'three';
import type { SceneManager } from '../SceneManager';
import {
  RulerAxisLock,
  RulerLiveState,
  RulerMeasurement,
  RulerSnapInfo,
  RulerSnapType
} from '../../types';

const SNAP_COLORS: Record<RulerSnapType, number> = {
  vertex: 0x22c55e,
  midpoint: 0x06b6d4,
  face_center: 0xa855f7,
  edge: 0xef4444,
  face: 0x3b82f6
};

const SNAP_HEX: Record<RulerSnapType, string> = {
  vertex: '#22c55e',
  midpoint: '#06b6d4',
  face_center: '#a855f7',
  edge: '#ef4444',
  face: '#3b82f6'
};

const AXIS_COLORS = {
  x: 0xef4444,
  y: 0x3b82f6,
  z: 0x22c55e,
  free: 0xfacc15
};

const AXIS_HEX = {
  x: '#ef4444',
  y: '#3b82f6',
  z: '#22c55e',
  free: '#facc15'
};

const BOX_EDGE_PAIRS: [number, number][] = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7]
];

export class InternalBoxesRuler {
  private sceneManager: SceneManager;
  private raycaster: THREE.Raycaster;

  group: THREE.Group;
  private savedGroup: THREE.Group;
  private previewGroup: THREE.Group;
  private snapMarkerGroup: THREE.Group;

  isActive: boolean = false;
  lockedAxis: RulerAxisLock = null;
  inferredAxis: RulerAxisLock = null;

  private startSnap: RulerSnapInfo | null = null;
  private currentSnap: RulerSnapInfo | null = null;
  private lastRawSnap: RulerSnapInfo | null = null;
  private lastShiftKey: boolean = false;

  private previewDistanceMm: number | null = null;
  private previewDeltaXMm: number | null = null;
  private previewDeltaYMm: number | null = null;
  private previewDeltaZMm: number | null = null;

  measurements: RulerMeasurement[] = [];

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.raycaster = new THREE.Raycaster();

    this.group = new THREE.Group();
    this.group.name = 'InternalBoxesRulerGroup';
    this.group.visible = false;
    this.group.userData.isRulerHelper = true;

    this.savedGroup = new THREE.Group();
    this.savedGroup.name = 'RulerSavedMeasurements';
    this.savedGroup.userData.isRulerHelper = true;

    this.previewGroup = new THREE.Group();
    this.previewGroup.name = 'RulerPreview';
    this.previewGroup.userData.isRulerHelper = true;

    this.snapMarkerGroup = new THREE.Group();
    this.snapMarkerGroup.name = 'RulerSnapMarker';
    this.snapMarkerGroup.userData.isRulerHelper = true;

    this.group.add(this.savedGroup, this.previewGroup, this.snapMarkerGroup);
  }

  hasPendingStartPoint(): boolean {
    return this.startSnap !== null;
  }

  setActive(active: boolean) {
    if (this.isActive === active) return;
    this.isActive = active;

    if (this.sceneManager.renderer?.domElement) {
      this.sceneManager.renderer.domElement.style.cursor = active ? 'crosshair' : '';
    }

    if (!active) {
      this.startSnap = null;
      this.currentSnap = null;
      this.lastRawSnap = null;
      this.inferredAxis = null;
      this.lockedAxis = null;
      this.clearPreviewState();
      this.disposeGroup(this.previewGroup);
      this.disposeGroup(this.snapMarkerGroup);
    }

    this.emitState();
  }

  setAxisLock(axis: RulerAxisLock) {
    this.lockedAxis = axis;
    if (this.isActive && this.startSnap && this.lastRawSnap) {
      this.updatePreview(this.lastRawSnap, this.lastShiftKey);
    } else {
      this.emitState();
    }
  }

  cancelPendingPoint() {
    if (!this.startSnap) return;
    this.startSnap = null;
    this.inferredAxis = null;
    this.clearPreviewState();
    this.disposeGroup(this.previewGroup);

    if (this.lastRawSnap) {
      this.currentSnap = this.lastRawSnap;
      this.renderSnapMarker(this.lastRawSnap);
    }
    this.emitState();
  }

  clearMeasurements() {
    this.measurements = [];
    this.disposeGroup(this.savedGroup);
    this.emitState();
  }

  removeMeasurement(id: string) {
    const prevLen = this.measurements.length;
    this.measurements = this.measurements.filter((m) => m.id !== id);
    if (this.measurements.length !== prevLen) {
      this.rebuildSavedMeasurements();
      this.emitState();
    }
  }

  getLiveState(): RulerLiveState {
    return {
      isActive: this.isActive,
      lockedAxis: this.lockedAxis,
      inferredAxis: this.inferredAxis,
      hasStartPoint: this.startSnap !== null,
      startSnap: this.startSnap,
      currentSnap: this.currentSnap,
      previewDistanceMm: this.previewDistanceMm,
      previewDeltaXMm: this.previewDeltaXMm,
      previewDeltaYMm: this.previewDeltaYMm,
      previewDeltaZMm: this.previewDeltaZMm,
      measurements: [...this.measurements]
    };
  }

  handleMouseMove(screenX: number, screenY: number, shiftKey: boolean) {
    if (!this.isActive) return;

    this.lastShiftKey = shiftKey;
    const rawSnap = this.computeSnap(screenX, screenY);
    this.lastRawSnap = rawSnap;

    if (!rawSnap) {
      this.currentSnap = null;
      this.disposeGroup(this.snapMarkerGroup);
      if (this.startSnap) {
        this.inferredAxis = this.lockedAxis;
        this.clearPreviewState();
        this.disposeGroup(this.previewGroup);
      }
      this.emitState();
      return;
    }

    this.currentSnap = rawSnap;
    this.renderSnapMarker(rawSnap);

    if (this.startSnap) {
      this.updatePreview(rawSnap, shiftKey);
    } else {
      this.emitState();
    }
  }

  handleMouseLeave() {
    if (!this.isActive) return;
    this.currentSnap = null;
    this.lastRawSnap = null;
    this.disposeGroup(this.snapMarkerGroup);
    if (this.startSnap) {
      this.clearPreviewState();
      this.disposeGroup(this.previewGroup);
    }
    this.emitState();
  }

  handleClick(screenX: number, screenY: number, shiftKey: boolean): boolean {
    if (!this.isActive) return false;

    this.lastShiftKey = shiftKey;
    const rawSnap = this.computeSnap(screenX, screenY) || this.lastRawSnap;
    if (!rawSnap) return false;

    if (!this.startSnap) {
      this.startSnap = rawSnap;
      this.currentSnap = rawSnap;
      this.lastRawSnap = rawSnap;
      this.renderSnapMarker(rawSnap);
      this.emitState();
      return true;
    }

    const startVec = new THREE.Vector3(
      this.startSnap.point.x,
      this.startSnap.point.y,
      this.startSnap.point.z
    );
    const { endPt, inferredAxis } = this.resolveEndPoint(startVec, rawSnap, shiftKey);

    const deltaXMm = Math.round((endPt.x - startVec.x) * 1000);
    const deltaYMm = Math.round((endPt.y - startVec.y) * 1000);
    const deltaZMm = Math.round((endPt.z - startVec.z) * 1000);
    const distanceMm = Math.round(endPt.distanceTo(startVec) * 1000);

    if (distanceMm < 1) {
      return false;
    }

    const measurement: RulerMeasurement = {
      id: `ruler_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      start: { ...this.startSnap.point },
      end: { x: endPt.x, y: endPt.y, z: endPt.z },
      distanceMm,
      deltaXMm,
      deltaYMm,
      deltaZMm,
      axis: inferredAxis,
      startLabel: this.startSnap.snapLabel,
      endLabel: rawSnap.snapLabel
    };

    this.measurements = [...this.measurements, measurement];
    this.rebuildSavedMeasurements();

    this.startSnap = null;
    this.inferredAxis = null;
    this.clearPreviewState();
    this.disposeGroup(this.previewGroup);
    this.currentSnap = rawSnap;
    this.renderSnapMarker(rawSnap);
    this.emitState();
    return true;
  }

  dispose() {
    this.disposeGroup(this.savedGroup);
    this.disposeGroup(this.previewGroup);
    this.disposeGroup(this.snapMarkerGroup);
  }

  private clearPreviewState() {
    this.previewDistanceMm = null;
    this.previewDeltaXMm = null;
    this.previewDeltaYMm = null;
    this.previewDeltaZMm = null;
  }

  private emitState() {
    if (this.sceneManager.onRulerStateChange) {
      this.sceneManager.onRulerStateChange(this.getLiveState());
    }
  }

  private computeSnap(screenX: number, screenY: number): RulerSnapInfo | null {
    const renderer = this.sceneManager.renderer;
    const camera = this.sceneManager.camera;
    const builder = this.sceneManager.internalBoxesBuilder;
    if (!renderer || !camera || !builder) return null;

    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const ndc = new THREE.Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );

    this.raycaster.setFromCamera(ndc, camera);

    const roots: THREE.Object3D[] = [
      builder.floorGroup,
      builder.boxesGroup,
      builder.ceilingGroup
    ];
    const intersects = this.raycaster.intersectObjects(roots, true);

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
    const partName = this.extractPartName(mesh);

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

  private extractPartName(mesh: THREE.Mesh): string {
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

  private resolveEndPoint(
    startPt: THREE.Vector3,
    rawSnap: RulerSnapInfo,
    shiftKey: boolean
  ): { endPt: THREE.Vector3; inferredAxis: RulerAxisLock } {
    const rawEnd = new THREE.Vector3(rawSnap.point.x, rawSnap.point.y, rawSnap.point.z);

    if (this.lockedAxis === 'x') {
      return {
        endPt: new THREE.Vector3(rawEnd.x, startPt.y, startPt.z),
        inferredAxis: 'x'
      };
    }
    if (this.lockedAxis === 'y') {
      return {
        endPt: new THREE.Vector3(startPt.x, rawEnd.y, startPt.z),
        inferredAxis: 'y'
      };
    }
    if (this.lockedAxis === 'z') {
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

  private updatePreview(rawSnap: RulerSnapInfo, shiftKey: boolean) {
    if (!this.startSnap) return;

    const startVec = new THREE.Vector3(
      this.startSnap.point.x,
      this.startSnap.point.y,
      this.startSnap.point.z
    );
    const rawVec = new THREE.Vector3(rawSnap.point.x, rawSnap.point.y, rawSnap.point.z);
    const { endPt, inferredAxis } = this.resolveEndPoint(startVec, rawSnap, shiftKey);

    this.inferredAxis = inferredAxis;
    this.previewDeltaXMm = Math.round((endPt.x - startVec.x) * 1000);
    this.previewDeltaYMm = Math.round((endPt.y - startVec.y) * 1000);
    this.previewDeltaZMm = Math.round((endPt.z - startVec.z) * 1000);
    this.previewDistanceMm = Math.round(endPt.distanceTo(startVec) * 1000);

    this.renderPreview(startVec, endPt, rawVec, inferredAxis);
    this.emitState();
  }

  private renderSnapMarker(snap: RulerSnapInfo) {
    this.disposeGroup(this.snapMarkerGroup);

    const pt = new THREE.Vector3(snap.point.x, snap.point.y, snap.point.z);
    const colorNum = SNAP_COLORS[snap.snapType];
    const colorHex = SNAP_HEX[snap.snapType];

    const dotGeo = new THREE.SphereGeometry(0.0085, 14, 14);
    const dotMat = new THREE.MeshBasicMaterial({
      color: colorNum,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.96
    });
    const dotMesh = new THREE.Mesh(dotGeo, dotMat);
    dotMesh.position.copy(pt);
    dotMesh.renderOrder = 995;
    dotMesh.userData.isRulerHelper = true;
    this.snapMarkerGroup.add(dotMesh);

    const ringGeo = new THREE.RingGeometry(0.011, 0.0155, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.85
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(pt);
    if (this.sceneManager.camera) {
      ringMesh.quaternion.copy(this.sceneManager.camera.quaternion);
    }
    ringMesh.renderOrder = 995;
    ringMesh.userData.isRulerHelper = true;
    this.snapMarkerGroup.add(ringMesh);

    const badge = this.createTextSprite(snap.snapLabel, '', 'rgba(15, 23, 42, 0.92)', colorHex, 0.18, 0.044);
    badge.position.copy(pt).add(new THREE.Vector3(0, 0.036, 0));
    badge.renderOrder = 998;
    badge.userData.isRulerHelper = true;
    this.snapMarkerGroup.add(badge);
  }

  private renderPreview(
    startVec: THREE.Vector3,
    endPt: THREE.Vector3,
    rawVec: THREE.Vector3,
    inferredAxis: RulerAxisLock
  ) {
    this.disposeGroup(this.previewGroup);

    const axisKey = inferredAxis || 'free';
    const lineColor = AXIS_COLORS[axisKey];
    const hexColor = AXIS_HEX[axisKey];

    // Ponto inicial marcado com esfera fixa
    const startDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.0075, 12, 12),
      new THREE.MeshBasicMaterial({
        color: lineColor,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 0.95
      })
    );
    startDot.position.copy(startVec);
    startDot.renderOrder = 992;
    startDot.userData.isRulerHelper = true;
    this.previewGroup.add(startDot);

    const distM = endPt.distanceTo(startVec);
    if (distM > 0.0005) {
      this.addDimensionLineWithTicks(this.previewGroup, startVec, endPt, lineColor, 990);
    }

    // Linha guia tracejada perpendicular quando o ponto final foi projetado em um eixo
    if (rawVec.distanceTo(endPt) > 0.002) {
      const guideGeo = new THREE.BufferGeometry().setFromPoints([rawVec, endPt]);
      const guideMat = new THREE.LineDashedMaterial({
        color: 0x94a3b8,
        dashSize: 0.015,
        gapSize: 0.01,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 0.8
      });
      const guideLine = new THREE.Line(guideGeo, guideMat);
      guideLine.computeLineDistances();
      guideLine.renderOrder = 988;
      guideLine.userData.isRulerHelper = true;
      this.previewGroup.add(guideLine);
    }

    // Projeções ortogonais ΔX / ΔY / ΔZ quando a medição é diagonal
    const absX = Math.abs(endPt.x - startVec.x);
    const absY = Math.abs(endPt.y - startVec.y);
    const absZ = Math.abs(endPt.z - startVec.z);
    const activeComponents = [absX > 0.003, absY > 0.003, absZ > 0.003].filter(Boolean).length;

    if (activeComponents > 1) {
      const cornerX = new THREE.Vector3(endPt.x, startVec.y, startVec.z);
      const cornerXZ = new THREE.Vector3(endPt.x, startVec.y, endPt.z);
      this.addDashedSegment(this.previewGroup, startVec, cornerX, AXIS_COLORS.x, 987);
      this.addDashedSegment(this.previewGroup, cornerX, cornerXZ, AXIS_COLORS.z, 987);
      this.addDashedSegment(this.previewGroup, cornerXZ, endPt, AXIS_COLORS.y, 987);
    }

    const distMm = Math.round(distM * 1000);
    if (distMm >= 1) {
      const axisTag =
        inferredAxis === 'x'
          ? 'Eixo X (Larg.)'
          : inferredAxis === 'y'
            ? 'Eixo Y (Alt.)'
            : inferredAxis === 'z'
              ? 'Eixo Z (Comp.)'
              : `ΔX ${this.previewDeltaXMm} · ΔY ${this.previewDeltaYMm} · ΔZ ${this.previewDeltaZMm}`;

      const sprite = this.createTextSprite(
        `${distMm} mm (${(distMm / 10).toFixed(1)} cm)`,
        axisTag,
        'rgba(15, 23, 42, 0.94)',
        hexColor,
        0.29,
        0.072
      );
      sprite.position.copy(startVec).add(endPt).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.045, 0));
      sprite.renderOrder = 999;
      sprite.userData.isRulerHelper = true;
      this.previewGroup.add(sprite);
    }
  }

  private rebuildSavedMeasurements() {
    this.disposeGroup(this.savedGroup);

    for (const m of this.measurements) {
      const startVec = new THREE.Vector3(m.start.x, m.start.y, m.start.z);
      const endVec = new THREE.Vector3(m.end.x, m.end.y, m.end.z);
      const axisKey = m.axis || 'free';
      const lineColor = AXIS_COLORS[axisKey];
      const hexColor = AXIS_HEX[axisKey];

      this.addDimensionLineWithTicks(this.savedGroup, startVec, endVec, lineColor, 985);

      const dotMat = new THREE.MeshBasicMaterial({
        color: lineColor,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 0.95
      });

      const sphereA = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 10), dotMat);
      sphereA.position.copy(startVec);
      sphereA.renderOrder = 986;
      sphereA.userData.isRulerHelper = true;
      this.savedGroup.add(sphereA);

      const sphereB = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 10), dotMat.clone());
      sphereB.position.copy(endVec);
      sphereB.renderOrder = 986;
      sphereB.userData.isRulerHelper = true;
      this.savedGroup.add(sphereB);

      const subtext = m.axis
        ? `Eixo ${m.axis.toUpperCase()} • ${m.startLabel} → ${m.endLabel}`
        : `ΔX ${m.deltaXMm} · ΔY ${m.deltaYMm} · ΔZ ${m.deltaZMm} mm`;

      const sprite = this.createTextSprite(
        `${m.distanceMm} mm (${(m.distanceMm / 10).toFixed(1)} cm)`,
        subtext,
        'rgba(15, 23, 42, 0.92)',
        hexColor,
        0.28,
        0.068
      );
      sprite.position.copy(startVec).add(endVec).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.04, 0));
      sprite.renderOrder = 997;
      sprite.userData.isRulerHelper = true;
      this.savedGroup.add(sprite);
    }
  }

  private addDimensionLineWithTicks(
    targetGroup: THREE.Group,
    ptA: THREE.Vector3,
    ptB: THREE.Vector3,
    colorNum: number,
    renderOrder: number
  ) {
    const lineMat = new THREE.LineBasicMaterial({
      color: colorNum,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.98
    });

    const lineGeo = new THREE.BufferGeometry().setFromPoints([ptA, ptB]);
    const mainLine = new THREE.Line(lineGeo, lineMat);
    mainLine.renderOrder = renderOrder;
    mainLine.userData.isRulerHelper = true;
    targetGroup.add(mainLine);

    const dir = ptB.clone().sub(ptA);
    if (dir.lengthSq() > 1e-8) {
      dir.normalize();
      const upRef = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const tickDir = new THREE.Vector3().crossVectors(dir, upRef).normalize().multiplyScalar(0.018);

      const tickGeoA = new THREE.BufferGeometry().setFromPoints([
        ptA.clone().sub(tickDir),
        ptA.clone().add(tickDir)
      ]);
      const tickA = new THREE.Line(tickGeoA, lineMat.clone());
      tickA.renderOrder = renderOrder;
      tickA.userData.isRulerHelper = true;
      targetGroup.add(tickA);

      const tickGeoB = new THREE.BufferGeometry().setFromPoints([
        ptB.clone().sub(tickDir),
        ptB.clone().add(tickDir)
      ]);
      const tickB = new THREE.Line(tickGeoB, lineMat.clone());
      tickB.renderOrder = renderOrder;
      tickB.userData.isRulerHelper = true;
      targetGroup.add(tickB);
    }
  }

  private addDashedSegment(
    targetGroup: THREE.Group,
    ptA: THREE.Vector3,
    ptB: THREE.Vector3,
    colorNum: number,
    renderOrder: number
  ) {
    if (ptA.distanceToSquared(ptB) < 1e-6) return;
    const geo = new THREE.BufferGeometry().setFromPoints([ptA, ptB]);
    const mat = new THREE.LineDashedMaterial({
      color: colorNum,
      dashSize: 0.014,
      gapSize: 0.01,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.65
    });
    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    line.renderOrder = renderOrder;
    line.userData.isRulerHelper = true;
    targetGroup.add(line);
  }

  private createTextSprite(
    title: string,
    subtitle: string,
    bgColor: string,
    borderColor: string,
    scaleW: number,
    scaleH: number
  ): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = subtitle ? 128 : 96;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Sprite();

    const w = canvas.width;
    const h = canvas.height;
    const r = 18;
    const pad = 8;

    ctx.fillStyle = bgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(pad + r, pad);
    ctx.lineTo(w - pad - r, pad);
    ctx.quadraticCurveTo(w - pad, pad, w - pad, pad + r);
    ctx.lineTo(w - pad, h - pad - r);
    ctx.quadraticCurveTo(w - pad, h - pad, w - pad - r, h - pad);
    ctx.lineTo(pad + r, h - pad);
    ctx.quadraticCurveTo(pad, h - pad, pad, h - pad - r);
    ctx.lineTo(pad, pad + r);
    ctx.quadraticCurveTo(pad, pad, pad + r, pad);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = subtitle
      ? 'bold 36px "JetBrains Mono", monospace, sans-serif'
      : 'bold 34px "JetBrains Mono", monospace, sans-serif';
    ctx.fillText(title, w / 2, subtitle ? 44 : h / 2);

    if (subtitle) {
      ctx.font = '600 22px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = borderColor;
      ctx.fillText(subtitle, w / 2, 92);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.96
    });

    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scaleW, scaleH, 1);
    return sprite;
  }

  private disposeGroup(g: THREE.Group) {
    while (g.children.length > 0) {
      const child = g.children[0];
      g.remove(child);
      child.traverse((node: any) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach((m: any) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
      });
    }
  }
}
