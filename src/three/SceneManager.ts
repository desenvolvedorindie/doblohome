import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MaterialLibrary } from './Materials';
import { MechanicalAudio } from './Audio';
import { DobloVehicle } from './DobloModel';
import { SolarSystem } from './SolarSystem';
import { SolarSimulation } from './SolarSimulation';
import { BarMeasurementData, CameraPreset, ViewMode } from '../types';
import { CollisionChecker, CollisionSummary } from './CollisionChecker';
import { FloatingChecker, FloatingSummary } from './FloatingChecker';

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

  viewMode: ViewMode = 'assembled';
  barsLineupGroup: THREE.Group;
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
        targetPos.set(0, 2.2, -5.8);
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
    const activeRoots = this.viewMode === 'bars_lineup'
      ? [this.barsLineupGroup]
      : [this.solarSystem.group, this.vehicle.group];
    const intersects = this.raycaster.intersectObjects(activeRoots, true);

    const isAncestorVisible = (node: THREE.Object3D): boolean => {
      let cur: THREE.Object3D | null = node;
      while (cur) {
        if (!cur.visible) return false;
        cur = cur.parent;
      }
      return true;
    };

    let target: THREE.Object3D | null = null;
    for (const hit of intersects) {
      const obj = hit.object;
      if (!isAncestorVisible(obj)) continue;

      // Ignora sprites, linhas, colisores invisíveis do teto e helpers
      if ((obj as any).isSprite || (obj as any).isLine || (obj as any).isLineSegments) continue;
      if (obj.name === '__roof_collider' || obj.userData?.isRoofCollider) continue;

      // Ignora hitboxes transparentes (não bloqueiam o scan)
      if (obj.name === '__hitbox') {
        if (obj.parent && obj.parent.userData && (obj.parent.userData.isBar || obj.parent.userData.isElectrical)) {
          target = obj.parent.userData.electricalRoot || obj.parent;
          break;
        }
        continue; // hitbox sem componente associado
      }

      // 1. Checa se o objeto ou algum ancestral é componente elétrico
      let electricalNode: THREE.Object3D | null = null;
      if (obj.userData && obj.userData.isElectrical) {
        electricalNode = obj;
      } else {
        let p: THREE.Object3D | null = obj.parent;
        for (let depth = 0; depth < 6 && p && p !== this.scene; depth++, p = p.parent) {
          if (p.userData && p.userData.isElectrical) {
            electricalNode = p;
            break;
          }
        }
      }

      if (electricalNode) {
        // Encontra o grupo raiz do componente elétrico para iluminar o conjunto como um todo unificado
        let root: THREE.Object3D = electricalNode.userData?.electricalRoot || electricalNode;
        let curr: THREE.Object3D | null = electricalNode;
        while (curr && curr !== this.scene) {
          if (curr.userData && curr.userData.isElectricalRoot) {
            root = curr;
            break;
          }
          if (curr.userData && curr.userData.isElectrical) {
            root = curr;
          }
          curr = curr.parent;
        }
        target = root;
        break;
      }

      // 2. Checa se é barra estrutural
      if (obj.userData && obj.userData.isBar) {
        target = obj;
        break;
      }

      // Checa a cadeia de pais (até 5 níveis) para encontrar se pertence a uma barra estrutural
      let p: THREE.Object3D | null = obj.parent;
      let found = false;
      for (let depth = 0; depth < 5 && p && p !== this.scene; depth++, p = p.parent) {
        if (p.userData && p.userData.isBar) {
          target = p;
          found = true;
          break;
        }
      }
      if (found) break;

      // Objeto opaco sem isBar/isElectrical bloqueia o raycast (ex: lataria externa do veículo)
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const matAny = mat as any;
        if (matAny.opacity === 0) continue;
        const transparent = matAny.transparent === true;
        const opacity = typeof matAny.opacity === 'number' ? matAny.opacity : 1;
        if (!transparent || opacity > 0.7) {
          break;
        }
      }
    }

    if (target) {
      if (this.hoveredObject !== target) {
        this.clearBarHover();
        this.highlightObject(target);
      }
      if (this.onBarHoverChange) {
        const d = target.userData;
        if (d.isElectrical) {
          this.onBarHoverChange({
            name: d.name || target.name || 'Componente Elétrico',
            category: d.category || 'Componente Elétrico',
            isElectrical: true,
            electricalType: d.electricalType,
            voltage: d.voltage,
            capacity: d.capacity,
            current: d.current,
            power: d.power,
            efficiency: d.efficiency,
            material: d.material,
            purpose: d.purpose,
            features: d.features
          }, screenX, screenY);
        } else {
          this.onBarHoverChange({
            name: d.barLabel || target.name || 'Barra Estrutural',
            barLength: d.barLength,
            barProfile: d.profileSpec,
            cutAngle: d.cutAngle,
            material: d.material,
            level: d.level
          }, screenX, screenY);
        }
      }
    } else {
      this.clearBarHover();
    }
  }

  highlightObject(target: THREE.Object3D) {
    this.hoveredObject = target;
    this.hoveredOriginalMaterials.clear();

    const d = target.userData || {};
    let emissiveColor = 0x38bdf8; // Azul padrão para perfis
    let emissiveIntensity = 0.55;

    if (d.isElectrical) {
      if (d.electricalType === 'battery') {
        emissiveColor = 0x10b981; // Verde esmeralda Kingbo LiFePO4
        emissiveIntensity = 0.65;
      } else if (d.electricalType === 'mppt') {
        emissiveColor = 0x0ea5e9; // Ciano MPPT
        emissiveIntensity = 0.65;
      } else if (d.electricalType === 'b2b') {
        emissiveColor = 0x38bdf8; // Azul B2B
        emissiveIntensity = 0.65;
      } else if (d.electricalType === 'usina') {
        emissiveColor = 0xef4444; // Vermelho Usina
        emissiveIntensity = 0.65;
      } else if (d.electricalType === 'panel') {
        emissiveColor = 0xf59e0b; // Dourado âmbar solar brilhante
        emissiveIntensity = 0.80;
      }
    }

    const applyHighlightToMesh = (mesh: THREE.Mesh) => {
      if (!mesh.isMesh || !mesh.material) return;
      if (this.hoveredOriginalMaterials.has(mesh)) return;
      this.hoveredOriginalMaterials.set(mesh, mesh.material);

      const makeHighlight = (m: any) => {
        const clone = m.clone();
        if (clone.emissive) {
          clone.emissive.setHex(emissiveColor);
          clone.emissiveIntensity = emissiveIntensity;
        }
        return clone;
      };

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(makeHighlight);
      } else {
        mesh.material = makeHighlight(mesh.material);
      }
    };

    if ((target as any).isMesh) {
      applyHighlightToMesh(target as THREE.Mesh);
    } else {
      target.traverse((child: any) => {
        if (child.isMesh) {
          applyHighlightToMesh(child);
        }
      });
    }
  }

  highlightBar(mesh: THREE.Mesh) {
    this.highlightObject(mesh);
  }

  clearBarHover() {
    if (this.hoveredOriginalMaterials.size > 0) {
      this.hoveredOriginalMaterials.forEach((origMat, mesh) => {
        if (mesh && origMat) {
          mesh.material = origMat;
        }
      });
      this.hoveredOriginalMaterials.clear();
      this.hoveredObject = null;
    }
    if (this.onBarHoverChange) {
      this.onBarHoverChange(null, 0, 0);
    }
  }

  // ─── Modo de Visualização: Montado vs Bancada de Barras Ordenadas ──────────

  setViewMode(mode: ViewMode, currentVehicleVisible: boolean = true) {
    this.clearBarHover();
    this.viewMode = mode;

    if (mode === 'bars_lineup') {
      this.savedVehicleVisible = currentVehicleVisible;
      this.solarSystem.group.visible = false;
      this.vehicle.setVisible(false);
      this.buildBarsLineup();
      this.barsLineupGroup.visible = true;

      const count = this.barsLineupGroup.userData.totalBars || 30;
      const spanX = Math.max(2.5, count * 0.085);
      const camDist = Math.max(3.6, spanX * 0.68);
      this.animateCameraTo(
        new THREE.Vector3(0, camDist * 0.72, camDist * 0.78),
        new THREE.Vector3(0, 0.05, 0)
      );
    } else {
      this.barsLineupGroup.visible = false;
      this.solarSystem.group.visible = true;
      this.vehicle.setVisible(currentVehicleVisible);
      this.setCameraPreset('iso');
    }
  }

  buildBarsLineup(): number {
    while (this.barsLineupGroup.children.length > 0) {
      const child = this.barsLineupGroup.children[0];
      this.barsLineupGroup.remove(child);
    }

    const collected: {
      mesh: THREE.Mesh;
      barLength: number;
      barLabel: string;
      profileSpec: string;
    }[] = [];

    const cargoDisabled = !this.solarSystem.cargoBoxConfig?.enabled;
    const cargoGroup = this.solarSystem.cargoBoxSystem?.group;

    this.solarSystem.group.traverse((obj: any) => {
      if (!obj.isMesh || !obj.userData || !obj.userData.isBar) return;

      if (cargoDisabled && cargoGroup) {
        let p = obj.parent;
        while (p) {
          if (p === cargoGroup) return;
          p = p.parent;
        }
      }

      const len = Number(obj.userData.barLength) || 0.1;
      collected.push({
        mesh: obj as THREE.Mesh,
        barLength: len,
        barLabel: obj.userData.barLabel || 'Barra Estrutural',
        profileSpec: obj.userData.profileSpec || 'Perfil Estrutural'
      });
    });

    collected.sort((a, b) => {
      if (Math.abs(b.barLength - a.barLength) > 0.0005) {
        return b.barLength - a.barLength;
      }
      return a.barLabel.localeCompare(b.barLabel);
    });

    const total = collected.length;
    this.barsLineupGroup.userData.totalBars = total;
    if (total === 0) return 0;

    const maxLen = collected[0].barLength;
    const spacingX = 0.085;
    const totalSpanX = (total - 1) * spacingX;
    const startX = -totalSpanX / 2;
    const zBaseline = -maxLen / 2;

    const baseLinePts = [
      new THREE.Vector3(startX - 0.15, 0.006, zBaseline),
      new THREE.Vector3(-startX + 0.15, 0.006, zBaseline)
    ];
    const baseLineGeo = new THREE.BufferGeometry().setFromPoints(baseLinePts);
    const baseLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });
    const baseLine = new THREE.Line(baseLineGeo, baseLineMat);
    this.barsLineupGroup.add(baseLine);

    collected.forEach((item, idx) => {
      const clone = item.mesh.clone(true);

      if (!item.mesh.geometry.boundingBox) {
        item.mesh.geometry.computeBoundingBox();
      }
      const bb = item.mesh.geometry.boundingBox;
      let crossHeight = 0.04;
      if (bb) {
        const dx = bb.max.x - bb.min.x;
        const dy = bb.max.y - bb.min.y;
        const dz = bb.max.z - bb.min.z;

        if (dx > dz && dx > dy) {
          clone.rotation.set(0, Math.PI / 2, 0);
          crossHeight = dy;
        } else if (dy > dz && dy > dx) {
          clone.rotation.set(Math.PI / 2, 0, 0);
          crossHeight = dz;
        } else {
          clone.rotation.set(0, 0, 0);
          crossHeight = dy;
        }
      }

      const xPos = startX + idx * spacingX;
      const yPos = Math.max(0.015, crossHeight / 2);
      const zPos = zBaseline + item.barLength / 2;

      clone.position.set(xPos, yPos, zPos);
      clone.visible = true;
      clone.userData = {
        ...item.mesh.userData,
        barLabel: `#${idx + 1} • ${item.barLabel}`,
        barLength: item.barLength,
        profileSpec: item.profileSpec
      };

      this.barsLineupGroup.add(clone);

      const labelSprite = this.createBarLengthSprite(idx + 1, item.barLength);
      labelSprite.position.set(xPos, yPos + 0.045, zBaseline + item.barLength + 0.04);
      this.barsLineupGroup.add(labelSprite);
    });

    return total;
  }

  private createBarLengthSprite(rank: number, lengthM: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(4, 4, 152, 56, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`#${rank}`, 80, 24);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`${Math.round(lengthM * 1000)}mm`, 80, 48);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.075, 0.03, 1);
    return sprite;
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

