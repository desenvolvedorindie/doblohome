import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MaterialLibrary } from './Materials';
import { MechanicalAudio } from './Audio';
import { DobloVehicle } from './DobloModel';
import { SolarSystem } from './SolarSystem';
import { SolarSimulation } from './SolarSimulation';
import { BarMeasurementData, CameraPreset } from '../types';
import { CollisionChecker, CollisionSummary } from './CollisionChecker';

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

  activeExpansionAnim: number | null = null;
  rewindTimeout: any = null;
  isAutoAnimating: boolean = false;
  autoAnimDirection: number = 1;
  autoAnimSpeed: number = 0.45;
  autoAnimPause: number = 0.0;
  lastLockPct: number = 0;

  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  hoveredBarMesh: THREE.Mesh | null = null;
  hoveredBarOriginalMaterials: THREE.Material | THREE.Material[] | null = null;
  onBarHoverChange?: (data: BarMeasurementData | null, screenX: number, screenY: number) => void;
  onExpansionChange?: (progress: number) => void;

  private isDisposed: boolean = false;

  constructor(
    container: HTMLElement,
    callbacks?: {
      onBarHoverChange?: (data: BarMeasurementData | null, screenX: number, screenY: number) => void;
      onExpansionChange?: (progress: number) => void;
    }
  ) {
    this.container = container;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);

    if (callbacks) {
      this.onBarHoverChange = callbacks.onBarHoverChange;
      this.onExpansionChange = callbacks.onExpansionChange;
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

    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);

    this.initBarHoverEvents();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1b3252);
    this.scene.fog = new THREE.FogExp2(0x1b3252, 0.018);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.30;
    (this.renderer as any).outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      42,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(3.4, 3.2, 4.2);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 18;
    this.controls.maxPolarAngle = Math.PI * 0.85;
    this.controls.target.set(0, 1.85, 0);
    this.controls.update();
  }

  initEnvironment() {
    const groundGeo = new THREE.PlaneGeometry(36, 36);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x13233a,
      roughness: 0.70,
      metalness: 0.15
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(30, 60, 0x38bdf8, 0x1d4ed8);
    grid.position.y = 0.002;
    this.scene.add(grid);
  }

  onWindowResize() {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
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
    const targetLookAt = new THREE.Vector3(0, 1.85, 0);
    let targetPos = new THREE.Vector3();

    switch (view) {
      case 'iso':
        targetPos.set(3.4, 3.2, 4.2);
        break;
      case 'top':
        targetPos.set(0.01, 7.5, 0);
        break;
      case 'front':
        targetPos.set(0, 2.2, 5.8);
        break;
      case 'side':
        targetPos.set(5.5, 2.2, 0);
        break;
      case 'panels':
        targetPos.set(1.6, 2.7, 1.9);
        targetLookAt.set(0, 2.1, 0.4);
        break;
    }

    this.animateCameraTo(targetPos, targetLookAt);
  }

  animateCameraTo(targetPos: THREE.Vector3, targetLookAt: THREE.Vector3) {
    const startPos = this.camera.position.clone();
    const startLookAt = this.controls.target.clone();
    const startTime = performance.now();
    const duration = 750;
    const self = this;

    function step(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1.0);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      self.camera.position.lerpVectors(startPos, targetPos, ease);
      self.controls.target.lerpVectors(startLookAt, targetLookAt, ease);
      self.controls.update();

      if (t < 1.0) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
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

    el.addEventListener('mouseup', () => {
      isMouseDown = false;
      didDrag = false;
    });

    el.addEventListener('mousemove', (e) => {
      if (isMouseDown) {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 3) {
          didDrag = true;
        }
        this.clearBarHover();
        return;
      }
      // Hover só acontece quando não estiver arrastando (botão solto)
      this.updateBarHover(e.clientX, e.clientY);
    });

    el.addEventListener('mouseleave', () => {
      isMouseDown = false;
      didDrag = false;
      this.clearBarHover();
    });
  }

  updateBarHover(screenX: number, screenY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((screenX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((screenY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    let target: THREE.Mesh | null = null;
    for (const hit of intersects) {
      const obj = hit.object;
      if (!obj.visible) continue;

      // Ignora sprites, linhas e helpers
      if ((obj as any).isSprite || (obj as any).isLine || (obj as any).isLineSegments) continue;

      // Ignora hitboxes transparentes (não bloqueiam o scan)
      if (obj.name === '__hitbox') {
        // Verifica se o pai é uma barra
        if (obj.parent && obj.parent.userData && obj.parent.userData.isBar) {
          target = obj.parent as unknown as THREE.Mesh;
          break;
        }
        continue; // hitbox sem barra associada — passa para o próximo
      }

      // Checa o próprio objeto
      if (obj.userData && obj.userData.isBar) {
        target = obj as THREE.Mesh;
        break;
      }

      // Checa até 3 níveis de hierarquia (pai -> avô -> bisavô)
      let p: THREE.Object3D | null = obj.parent;
      let found = false;
      for (let depth = 0; depth < 3 && p; depth++, p = p.parent) {
        if (p.userData && p.userData.isBar) {
          target = p as unknown as THREE.Mesh;
          found = true;
          break;
        }
      }
      if (found) break;

      // Objeto opaco sem isBar bloqueia (evita hover em barras atrás da carroceria)
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const matAny = mat as any;
        // Pula materiais invisíveis (ex: a própria hitbox com opacity=0)
        if (matAny.opacity === 0) continue;
        const transparent = matAny.transparent === true;
        const opacity = typeof matAny.opacity === 'number' ? matAny.opacity : 1;
        if (!transparent || opacity > 0.7) {
          break;
        }
      }
    }

    if (target) {
      if (this.hoveredBarMesh !== target) {
        this.clearBarHover();
        this.highlightBar(target);
      }
      if (this.onBarHoverChange) {
        const d = target.userData;
        this.onBarHoverChange({
          name: d.barLabel || target.name || 'Barra Estrutural',
          barLength: d.barLength,
          barProfile: d.profileSpec,
          cutAngle: d.cutAngle,
          material: d.material,
          level: d.level
        }, screenX, screenY);
      }
    } else {
      this.clearBarHover();
    }
  }

  highlightBar(mesh: THREE.Mesh) {
    this.hoveredBarMesh = mesh;
    this.hoveredBarOriginalMaterials = mesh.material;

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(m => {
        const clone = (m as any).clone();
        if (clone.emissive) {
          clone.emissive.setHex(0x38bdf8);
          clone.emissiveIntensity = 0.55;
        }
        return clone;
      });
    } else if (mesh.material) {
      const clone = (mesh.material as any).clone();
      if (clone.emissive) {
        clone.emissive.setHex(0x38bdf8);
        clone.emissiveIntensity = 0.55;
      }
      mesh.material = clone;
    }
  }

  clearBarHover() {
    if (this.hoveredBarMesh && this.hoveredBarOriginalMaterials) {
      this.hoveredBarMesh.material = this.hoveredBarOriginalMaterials;
      this.hoveredBarMesh = null;
      this.hoveredBarOriginalMaterials = null;
    }
    if (this.onBarHoverChange) {
      this.onBarHoverChange(null, 0, 0);
    }
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

  takeScreenshot() {
    this.renderer.render(this.scene, this.camera);
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `doblo-solar-3d-${Date.now()}.png`;
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
    this.cancelCurrentAnimation();
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

