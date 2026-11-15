import * as THREE from 'three';
import type { SceneManager } from '../SceneManager';
import {
  RulerAxisLock,
  RulerLiveState,
  RulerMeasurement,
  RulerSnapInfo
} from '../../types';
import {
  computeRulerSnap,
  resolveRulerEndPoint
} from './ruler/RulerSnapCalculator';
import {
  disposeRulerGroup,
  rebuildRulerSavedMeasurements,
  renderRulerPreview,
  renderRulerSnapMarker
} from './ruler/RulerRenderer';

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
      disposeRulerGroup(this.previewGroup);
      disposeRulerGroup(this.snapMarkerGroup);
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
    disposeRulerGroup(this.previewGroup);

    if (this.lastRawSnap) {
      this.currentSnap = this.lastRawSnap;
      renderRulerSnapMarker(this.snapMarkerGroup, this.lastRawSnap, this.sceneManager.camera);
    }
    this.emitState();
  }

  clearMeasurements() {
    this.measurements = [];
    disposeRulerGroup(this.savedGroup);
    this.emitState();
  }

  removeMeasurement(id: string) {
    const prevLen = this.measurements.length;
    this.measurements = this.measurements.filter((m) => m.id !== id);
    if (this.measurements.length !== prevLen) {
      rebuildRulerSavedMeasurements(this.savedGroup, this.measurements);
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
    const rawSnap = computeRulerSnap(this.sceneManager, this.raycaster, screenX, screenY);
    this.lastRawSnap = rawSnap;

    if (!rawSnap) {
      this.currentSnap = null;
      disposeRulerGroup(this.snapMarkerGroup);
      if (this.startSnap) {
        this.inferredAxis = this.lockedAxis;
        this.clearPreviewState();
        disposeRulerGroup(this.previewGroup);
      }
      this.emitState();
      return;
    }

    this.currentSnap = rawSnap;
    renderRulerSnapMarker(this.snapMarkerGroup, rawSnap, this.sceneManager.camera);

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
    disposeRulerGroup(this.snapMarkerGroup);
    if (this.startSnap) {
      this.clearPreviewState();
      disposeRulerGroup(this.previewGroup);
    }
    this.emitState();
  }

  handleClick(screenX: number, screenY: number, shiftKey: boolean): boolean {
    if (!this.isActive) return false;

    this.lastShiftKey = shiftKey;
    const rawSnap = computeRulerSnap(this.sceneManager, this.raycaster, screenX, screenY) || this.lastRawSnap;
    if (!rawSnap) return false;

    if (!this.startSnap) {
      this.startSnap = rawSnap;
      this.currentSnap = rawSnap;
      this.lastRawSnap = rawSnap;
      renderRulerSnapMarker(this.snapMarkerGroup, rawSnap, this.sceneManager.camera);
      this.emitState();
      return true;
    }

    const startVec = new THREE.Vector3(
      this.startSnap.point.x,
      this.startSnap.point.y,
      this.startSnap.point.z
    );
    const { endPt, inferredAxis } = resolveRulerEndPoint(startVec, rawSnap, this.lockedAxis, shiftKey);

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
    rebuildRulerSavedMeasurements(this.savedGroup, this.measurements);

    this.startSnap = null;
    this.inferredAxis = null;
    this.clearPreviewState();
    disposeRulerGroup(this.previewGroup);
    this.currentSnap = rawSnap;
    renderRulerSnapMarker(this.snapMarkerGroup, rawSnap, this.sceneManager.camera);
    this.emitState();
    return true;
  }

  dispose() {
    disposeRulerGroup(this.savedGroup);
    disposeRulerGroup(this.previewGroup);
    disposeRulerGroup(this.snapMarkerGroup);
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

  private updatePreview(rawSnap: RulerSnapInfo, shiftKey: boolean) {
    if (!this.startSnap) return;

    const startVec = new THREE.Vector3(
      this.startSnap.point.x,
      this.startSnap.point.y,
      this.startSnap.point.z
    );
    const rawVec = new THREE.Vector3(rawSnap.point.x, rawSnap.point.y, rawSnap.point.z);
    const { endPt, inferredAxis } = resolveRulerEndPoint(startVec, rawSnap, this.lockedAxis, shiftKey);

    this.inferredAxis = inferredAxis;
    this.previewDeltaXMm = Math.round((endPt.x - startVec.x) * 1000);
    this.previewDeltaYMm = Math.round((endPt.y - startVec.y) * 1000);
    this.previewDeltaZMm = Math.round((endPt.z - startVec.z) * 1000);
    this.previewDistanceMm = Math.round(endPt.distanceTo(startVec) * 1000);

    renderRulerPreview({
      previewGroup: this.previewGroup,
      startVec,
      endPt,
      rawVec,
      inferredAxis,
      previewDeltaXMm: this.previewDeltaXMm,
      previewDeltaYMm: this.previewDeltaYMm,
      previewDeltaZMm: this.previewDeltaZMm
    });
    this.emitState();
  }
}
