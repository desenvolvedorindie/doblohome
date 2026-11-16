import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MaterialLibrary } from './Materials';
import { MechanicalAudio } from './Audio';
import { DobloVehicle } from './DobloModel';
import { SolarSystem } from './SolarSystem';
import { SolarSimulation } from './SolarSimulation';
import { BarMeasurementData, CameraPreset, ViewMode, PartsGroupFilter, InternalBoxItem, InternalGridConfig, InternalBoxesPreviewOptions, RulerLiveState } from '../types';
import { CollisionChecker, CollisionSummary } from './CollisionChecker';
import { FloatingChecker, FloatingSummary } from './FloatingChecker';
import { InternalBoxesBuilder } from './InternalBoxesBuilder';
import { InternalBoxesRuler } from './boxes/InternalBoxesRuler';
import { SceneRaycaster } from './scene/SceneRaycaster';
import { BarsLineupBuilder } from './scene/BarsLineupBuilder';
import { SceneCameraManager } from './scene/SceneCameraManager';
import { SceneEnvironment } from './scene/SceneEnvironment';

export class SceneManager {
  container: HTMLElement;
  scene!: THREE.Scene;
  renderer!: THREE.WebGLRenderer;
  camera!: THREE.PerspectiveCamera;
  controls!: OrbitControls;
  clock: THREE.Clock;

  audio: MechanicalAudio;
  vehicle: DobloVehicle;
  solarSystem: SolarSystem;
  solarSim: SolarSimulation;
  internalBoxesBuilder: InternalBoxesBuilder;
  internalBoxesRuler: InternalBoxesRuler;

  viewMode: ViewMode = 'assembled';
  barsLineupGroup: THREE.Group;
  currentLineupFilter: PartsGroupFilter = 'all';
  savedVehicleVisible: boolean = true;

  activeExpansionAnim: number | null = null;
  rewindTimeout: any = null;
  isAutoAnimating: boolean = false;
  autoAnimDirection: number = 1;
  autoAnimSpeed: number = 0.45;
  autoAnimPause: number = 0.0;
  lastLockPct: number = 0;

  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  hoveredObject: THREE.Object3D | null = null;
  hoveredOriginalMaterials: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map();
  onBarHoverChange?: (data: BarMeasurementData | null, screenX: number, screenY: number) => void;
  onExpansionChange?: (progress: number) => void;
  onBoxSelect?: (boxId: string | null) => void;
  onBoxDoubleClick?: (boxId: string | null) => void;
  onRulerStateChange?: (state: RulerLiveState) => void;

  private isDisposed: boolean = false;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    container: HTMLElement,
    callbacks?: {
      onBarHoverChange?: (data: BarMeasurementData | null, screenX: number, screenY: number) => void;
      onExpansionChange?: (progress: number) => void;
      onBoxSelect?: (boxId: string | null) => void;
      onBoxDoubleClick?: (boxId: string | null) => void;
    }
  ) {
    this.container = container;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);

    if (callbacks) {
      this.onBarHoverChange = callbacks.onBarHoverChange;
      this.onExpansionChange = callbacks.onExpansionChange;
      this.onBoxSelect = callbacks.onBoxSelect;
      this.onBoxDoubleClick = callbacks.onBoxDoubleClick;
    }

    this.initScene();
    this.initRenderer();
    this.initCamera();
    this.initControls();
    this.initEnvironment();

    MaterialLibrary.init();
    this.audio = new MechanicalAudio();
    this.vehicle = new DobloVehicle();
    this.scene.add(this.vehicle.group);

    this.solarSystem = new SolarSystem(this.scene);
    this.solarSim = new SolarSimulation(this.scene);
    this.internalBoxesBuilder = new InternalBoxesBuilder();
    this.scene.add(this.internalBoxesBuilder.group);

    this.internalBoxesRuler = new InternalBoxesRuler(this);
    this.scene.add(this.internalBoxesRuler.group);

    this.barsLineupGroup = new THREE.Group();
    this.barsLineupGroup.name = 'BarsLineupGroup';
    this.barsLineupGroup.visible = false;
    this.scene.add(this.barsLineupGroup);

    const origBuildSystem = this.solarSystem.buildSystem.bind(this.solarSystem);
    this.solarSystem.buildSystem = () => {
      origBuildSystem();
      if (this.viewMode === 'bars_lineup') {
        this.buildBarsLineup();
      }
    };

    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.onWindowResize();
      });
      this.resizeObserver.observe(this.container);
    }

    this.initBarHoverEvents();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initScene() {
    this.scene = SceneEnvironment.createScene();
  }

  initRenderer() {
    this.renderer = SceneEnvironment.createRenderer(this.container);
  }

  initCamera() {
    this.camera = SceneCameraManager.createCamera(this.container);
  }

  initControls() {
    this.controls = SceneCameraManager.createControls(this.camera, this.renderer.domElement);
  }

  initEnvironment() {
    SceneEnvironment.createEnvironment(this.scene);
  }

  onWindowResize() {
    if (!this.container || this.isDisposed) return;
    SceneCameraManager.onResize(this.container, this.camera, this.renderer);
  }

  cancelCurrentAnimation() {
    if (this.activeExpansionAnim) {
      cancelAnimationFrame(this.activeExpansionAnim);
      this.activeExpansionAnim = null;
    }
    if (this.rewindTimeout) {
      clearTimeout(this.rewindTimeout);
      this.rewindTimeout = null;
    }
  }

  setExpansion(val: number) {
    const clamped = Math.max(0, Math.min(1, val));
    this.solarSystem.updateExpansion(clamped);

    const pct = Math.round(clamped * 100);
    if ((pct === 0 || pct === 100) && this.lastLockPct !== pct) {
      this.audio.playLockClick();
      this.lastLockPct = pct;
    } else if (pct > 0 && pct < 100) {
      this.lastLockPct = -1;
    }

    if (this.onExpansionChange) {
      this.onExpansionChange(clamped);
    }
  }

  animateExpansionTo(target: number, duration: number = 800, onComplete?: () => void) {
    this.cancelCurrentAnimation();
    this.isAutoAnimating = false;

    const startVal = this.solarSystem.expansionProgress;
    const startTime = performance.now();
    const self = this;

    function step(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1.0);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const current = startVal + (target - startVal) * ease;
      self.setExpansion(current);
      self.audio.playSlideSound(0.8);

      if (t < 1.0) {
        self.activeExpansionAnim = requestAnimationFrame(step);
      } else {
        self.activeExpansionAnim = null;
        if (onComplete) onComplete();
      }
    }

    this.activeExpansionAnim = requestAnimationFrame(step);
  }

  rewindCycle(onFinished?: () => void) {
    this.cancelCurrentAnimation();
    this.isAutoAnimating = false;

    const current = this.solarSystem.expansionProgress;
    const self = this;

    if (current < 0.9) {
      this.animateExpansionTo(1.0, 700, () => {
        self.rewindTimeout = setTimeout(() => {
          self.animateExpansionTo(0.0, 900, () => {
            if (onFinished) onFinished();
          });
        }, 350);
      });
    } else {
      this.animateExpansionTo(0.0, 900, () => {
        if (onFinished) onFinished();
      });
    }
  }

  toggleAutoAnim(): boolean {
    this.cancelCurrentAnimation();
    this.isAutoAnimating = !this.isAutoAnimating;
    this.autoAnimPause = 0.0;
    this.audio.playLockClick();
    return this.isAutoAnimating;
  }

  setCameraPreset(view: CameraPreset) {
    SceneCameraManager.setCameraPreset(this.camera, this.controls, view);
  }

  animateCameraTo(targetPos: THREE.Vector3, targetLookAt: THREE.Vector3) {
    SceneCameraManager.animateCameraTo(this.camera, this.controls, targetPos, targetLookAt);
  }

  initBarHoverEvents() {
    let isMouseDown = false;
    let downX = 0;
    let downY = 0;
    let didDrag = false;

    const el = this.renderer.domElement;

    el.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      didDrag = false;
      downX = e.clientX;
      downY = e.clientY;
      this.clearBarHover();
    });

    el.addEventListener('mouseup', (e: MouseEvent) => {
      const wasDrag = didDrag || Math.hypot(e.clientX - downX, e.clientY - downY) > 4;
      isMouseDown = false;
      didDrag = false;
      if (!wasDrag && this.viewMode === 'internal_boxes' && this.internalBoxesRuler.isActive) {
        if (e.button === 0) {
          this.internalBoxesRuler.handleClick(e.clientX, e.clientY, e.shiftKey);
          this.audio.playLockClick();
          return;
        }
        if (e.button === 2 && this.internalBoxesRuler.hasPendingStartPoint()) {
          this.internalBoxesRuler.cancelPendingPoint();
          return;
        }
      }
      if (!wasDrag && e.button === 0) {
        this.handleCanvasClick(e.clientX, e.clientY);
      }
    });

    el.addEventListener('dblclick', (e: MouseEvent) => {
      if (e.button === 0) {
        if (this.viewMode === 'internal_boxes' && this.internalBoxesRuler.isActive) {
          return;
        }
        this.handleCanvasDoubleClick(e.clientX, e.clientY);
      }
    });

    el.addEventListener('mousemove', (e) => {
      if (isMouseDown) {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 3) {
          didDrag = true;
        }
        this.clearBarHover();
        return;
      }
      if (this.viewMode === 'internal_boxes' && this.internalBoxesRuler.isActive) {
        this.clearBarHover();
        this.internalBoxesRuler.handleMouseMove(e.clientX, e.clientY, e.shiftKey);
        return;
      }
      // Hover só acontece quando não estiver arrastando (botão solto)
      this.updateBarHover(e.clientX, e.clientY);
    });

    el.addEventListener('mouseleave', () => {
      isMouseDown = false;
      didDrag = false;
      this.clearBarHover();
      this.internalBoxesRuler.handleMouseLeave();
    });
  }

  handleCanvasClick(screenX: number, screenY: number) {
    SceneRaycaster.handleCanvasClick(this, screenX, screenY);
  }

  handleCanvasDoubleClick(screenX: number, screenY: number) {
    SceneRaycaster.handleCanvasDoubleClick(this, screenX, screenY);
  }

  updateBarHover(screenX: number, screenY: number) {
    SceneRaycaster.updateBarHover(this, screenX, screenY);
  }

  highlightObject(target: THREE.Object3D) {
    SceneRaycaster.highlightObject(this, target);
  }

  highlightBar(mesh: THREE.Mesh) {
    this.highlightObject(mesh);
  }

  clearBarHover() {
    SceneRaycaster.clearBarHover(this);
  }

  // ─── Modo de Visualização: Caixas Internas vs Montado vs Só Barras ──────────

  updateInternalBoxes(
    grid: InternalGridConfig,
    boxes: InternalBoxItem[],
    selectedBoxId: string | null = null,
    previewOpen: boolean | InternalBoxesPreviewOptions = false,
    isolatedBoxId: string | null = null
  ) {
    this.clearBarHover();
    this.internalBoxesBuilder.update(grid, boxes, selectedBoxId, previewOpen, isolatedBoxId);

    // Sincroniza componentes elétricos instalados nos módulos para evitar duplicatas flutuantes
    const assigned = new Set<string>();
    boxes.forEach((b) => {
      if (b.hasBattery) assigned.add('battery');
      b.electronics?.forEach((e) => assigned.add(e.id));
    });
    this.solarSystem.setAssignedElectronics(assigned);

    if (this.viewMode === 'bars_lineup') {
      this.buildBarsLineup(this.currentLineupFilter);
    }
  }

  focusOnBox(boxId: string | null) {
    SceneCameraManager.focusOnBox(this.internalBoxesBuilder.boxesGroup, this.camera, this.controls, boxId);
  }

  setViewMode(mode: ViewMode, currentVehicleVisible: boolean = true) {
    this.clearBarHover();
    this.viewMode = mode;

    if (mode !== 'internal_boxes') {
      this.internalBoxesRuler.setActive(false);
      this.internalBoxesRuler.group.visible = false;
    } else {
      this.internalBoxesRuler.group.visible = true;
    }

    if (mode === 'internal_boxes') {
      this.barsLineupGroup.visible = false;
      this.solarSystem.group.visible = false;
      this.vehicle.setVisible(false);
      this.internalBoxesBuilder.group.visible = true;

      // Câmera isométrica focada no assoalho traseiro da Doblò
      this.animateCameraTo(
        new THREE.Vector3(1.6, 2.0, -2.5),
        new THREE.Vector3(0, 0.60, -0.85)
      );
    } else if (mode === 'bars_lineup') {
      this.savedVehicleVisible = currentVehicleVisible;
      this.solarSystem.group.visible = false;
      this.vehicle.setVisible(false);
      this.internalBoxesBuilder.group.visible = false;
      this.buildBarsLineup(this.currentLineupFilter);
      this.barsLineupGroup.visible = true;

      const totalSpanX = this.barsLineupGroup.userData.totalSpanX || 3.5;
      const totalDepthZ = this.barsLineupGroup.userData.totalDepthZ || this.barsLineupGroup.userData.maxLen || 3.0;
      const centerX = this.barsLineupGroup.userData.centerX || 0;
      const centerZ = this.barsLineupGroup.userData.centerZ || (totalDepthZ / 2);
      const camDist = Math.max(4.0, Math.max(totalSpanX * 0.65, totalDepthZ * 0.85));

      this.animateCameraTo(
        new THREE.Vector3(centerX + camDist * 0.15, camDist * 0.80, centerZ + camDist * 0.90),
        new THREE.Vector3(centerX, 0.05, centerZ)
      );
    } else if (mode === 'electrical_planar' || mode === 'hydraulic_planar') {
      this.barsLineupGroup.visible = false;
      this.solarSystem.group.visible = false;
      this.vehicle.setVisible(false);
      this.internalBoxesBuilder.group.visible = false;
    } else {
      // assembled
      this.barsLineupGroup.visible = false;
      this.solarSystem.group.visible = true;
      this.vehicle.setVisible(currentVehicleVisible);
      this.internalBoxesBuilder.group.visible = true;
      this.setCameraPreset('iso');
    }
  }

  setVehicleOpacity(opacity: number) {
    this.vehicle.setOpacity(opacity);
  }

  setBarsLineupFilter(filter: PartsGroupFilter) {
    this.currentLineupFilter = filter;
    if (this.viewMode === 'bars_lineup') {
      this.buildBarsLineup(filter);
      const totalSpanX = this.barsLineupGroup.userData.totalSpanX || 3.5;
      const totalDepthZ = this.barsLineupGroup.userData.totalDepthZ || this.barsLineupGroup.userData.maxLen || 3.0;
      const centerX = this.barsLineupGroup.userData.centerX || 0;
      const centerZ = this.barsLineupGroup.userData.centerZ || (totalDepthZ / 2);
      const camDist = Math.max(4.0, Math.max(totalSpanX * 0.65, totalDepthZ * 0.85));

      this.animateCameraTo(
        new THREE.Vector3(centerX + camDist * 0.15, camDist * 0.80, centerZ + camDist * 0.90),
        new THREE.Vector3(centerX, 0.05, centerZ)
      );
    }
  }

  createGroupHeaderSprite(title: string, subtitle: string, colorHex: string): THREE.Sprite {
    return BarsLineupBuilder.createGroupHeaderSprite(title, subtitle, colorHex);
  }

  createBarLengthSprite(rank: number, lengthM: number, widthM: number, areaM2: number, type: 'metal' | 'wood' | 'upholstery' | 'pvc', customLabel?: string): THREE.Sprite {
    return BarsLineupBuilder.createBarLengthSprite(rank, lengthM, widthM, areaM2, type, customLabel);
  }

  buildBarsLineup(filter: PartsGroupFilter = this.currentLineupFilter): number {
    return BarsLineupBuilder.build(this.barsLineupGroup, this.solarSystem, this.internalBoxesBuilder, filter, this);
  }

  // ─── Verificação Estrutural de Colisões ────────────────────────────────────

  checkStructuralCollisions(): CollisionSummary {
    return CollisionChecker.checkAll(this.scene);
  }

  clearStructuralCollisions(): void {
    CollisionChecker.clearAll();
  }

  hasStructuralCollisions(): boolean {
    return CollisionChecker.hasCollisions();
  }

  // ─── Verificação de Peças Flutuantes (Sustentação da Base) ──────────────────

  checkFloatingProfiles(): FloatingSummary {
    return FloatingChecker.checkAll(this.scene);
  }

  clearFloatingHighlights(): void {
    FloatingChecker.clearAll();
  }

  hasFloatingProfiles(): boolean {
    return FloatingChecker.hasFloating();
  }

  takeScreenshot() {
    this.renderer.render(this.scene, this.camera);
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `doblohome-3d-${Date.now()}.png`;
    a.click();
  }

  animate() {
    if (this.isDisposed) return;
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    this.controls.update();

    if (this.isAutoAnimating) {
      if (this.autoAnimPause > 0) {
        this.autoAnimPause -= delta;
      } else {
        let current = this.solarSystem.expansionProgress;
        current += this.autoAnimDirection * this.autoAnimSpeed * delta;

        if (current >= 1.0) {
          current = 1.0;
          this.autoAnimDirection = -1;
          this.autoAnimPause = 1.2;
        } else if (current <= 0.0) {
          current = 0.0;
          this.autoAnimDirection = 1;
          this.autoAnimPause = 0.9;
        }

        this.setExpansion(current);
        this.audio.playSlideSound(0.5);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.isDisposed = true;
    window.removeEventListener('resize', this.onWindowResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.cancelCurrentAnimation();
    this.internalBoxesRuler.dispose();
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

