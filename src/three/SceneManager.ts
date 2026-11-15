import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MaterialLibrary } from './Materials';
import { MechanicalAudio } from './Audio';
import { DobloVehicle } from './DobloModel';
import { SolarSystem } from './SolarSystem';
import { SolarSimulation } from './SolarSimulation';
import { BarMeasurementData, CameraPreset, ViewMode, PartsGroupFilter, InternalBoxItem, InternalGridConfig, InternalBoxesPreviewOptions } from '../types';
import { CollisionChecker, CollisionSummary } from './CollisionChecker';
import { FloatingChecker, FloatingSummary } from './FloatingChecker';
import { InternalBoxesBuilder } from './InternalBoxesBuilder';
import { MetalonTubeFactory } from './MetalonTube';
import { extractPvcCutStats } from '../utils/pvcUtils';

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

  private isDisposed: boolean = false;

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
    const width = this.container.clientWidth || window.innerWidth || 800;
    const height = this.container.clientHeight || window.innerHeight || 600;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.30;
    (this.renderer as any).outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
  }

  initCamera() {
    const width = this.container.clientWidth || window.innerWidth || 800;
    const height = this.container.clientHeight || window.innerHeight || 600;
    this.camera = new THREE.PerspectiveCamera(
      42,
      width / height,
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
    const width = this.container.clientWidth || window.innerWidth || 800;
    const height = this.container.clientHeight || window.innerHeight || 600;
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
        targetPos.set(1.6, 2.7, -1.2);
        targetLookAt.set(0, 2.1, -0.68);
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

    el.addEventListener('mouseup', (e: MouseEvent) => {
      const wasDrag = didDrag || Math.hypot(e.clientX - downX, e.clientY - downY) > 4;
      isMouseDown = false;
      didDrag = false;
      if (!wasDrag && e.button === 0) {
        this.handleCanvasClick(e.clientX, e.clientY);
      }
    });

    el.addEventListener('dblclick', (e: MouseEvent) => {
      if (e.button === 0) {
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
      // Hover só acontece quando não estiver arrastando (botão solto)
      this.updateBarHover(e.clientX, e.clientY);
    });

    el.addEventListener('mouseleave', () => {
      isMouseDown = false;
      didDrag = false;
      this.clearBarHover();
    });
  }

  handleCanvasClick(screenX: number, screenY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const clickMouse = new THREE.Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );

    const clickRaycaster = new THREE.Raycaster();
    clickRaycaster.setFromCamera(clickMouse, this.camera);

    const intersects = clickRaycaster.intersectObjects([this.internalBoxesBuilder.group], true);
    for (const hit of intersects) {
      const obj = hit.object;

      // 1. Ignora linhas e edges (Line / LineSegments)
      if ((obj as any).isLine || (obj as any).isLineSegments) continue;

      // 2. Se acertou diretamente uma hitbox da caixa interna
      if (obj.name === '__box_hitbox' || obj.userData?.isInternalBoxHitbox) {
        const boxId = obj.userData?.boxId || obj.parent?.userData?.boxId;
        if (boxId) {
          if (this.onBoxSelect) {
            this.onBoxSelect(boxId);
          }
          this.audio.playLockClick();
          return;
        }
      }

      // 3. Se acertou qualquer painel ou componente da caixa
      let cur: THREE.Object3D | null = obj;
      let foundBoxId: string | null = null;
      while (cur && cur !== this.internalBoxesBuilder.group) {
        if (cur.userData && cur.userData.boxId) {
          foundBoxId = cur.userData.boxId;
          break;
        }
        cur = cur.parent;
      }

      if (foundBoxId) {
        if (this.onBoxSelect) {
          this.onBoxSelect(foundBoxId);
        }
        this.audio.playLockClick();
        return;
      }

      // 4. Se o primeiro objeto físico atingido foi o assoalho de compensado naval ou caixas de roda,
      // interrompe a busca IMEDIATAMENTE para não perfurar o piso e selecionar caixas atrás!
      if (
        obj.userData?.isInternalFloorPlywood ||
        obj.userData?.isBasePlywood ||
        obj.name === 'BaseNavalPlywoodFloor' ||
        obj.parent === this.internalBoxesBuilder.floorGroup
      ) {
        if (this.viewMode === 'internal_boxes') {
          if (this.onBoxSelect) {
            this.onBoxSelect(null);
          }
        }
        return;
      }
    }

    // Se clicou no fundo sem pegar nenhuma caixa no modo de caixas internas
    if (this.viewMode === 'internal_boxes') {
      if (this.onBoxSelect) {
        this.onBoxSelect(null);
      }
    }
  }

  handleCanvasDoubleClick(screenX: number, screenY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const clickMouse = new THREE.Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );

    const clickRaycaster = new THREE.Raycaster();
    clickRaycaster.setFromCamera(clickMouse, this.camera);

    const intersects = clickRaycaster.intersectObjects([this.internalBoxesBuilder.group], true);
    for (const hit of intersects) {
      const obj = hit.object;

      // 1. Ignora linhas e edges
      if ((obj as any).isLine || (obj as any).isLineSegments) continue;

      // 2. Se acertou diretamente uma hitbox da caixa interna
      if (obj.name === '__box_hitbox' || obj.userData?.isInternalBoxHitbox) {
        const boxId = obj.userData?.boxId || obj.parent?.userData?.boxId;
        if (boxId) {
          if (this.onBoxDoubleClick) {
            this.onBoxDoubleClick(boxId);
          }
          this.audio.playLockClick();
          return;
        }
      }

      // 3. Se acertou qualquer painel ou componente da caixa
      let cur: THREE.Object3D | null = obj;
      let foundBoxId: string | null = null;
      while (cur && cur !== this.internalBoxesBuilder.group) {
        if (cur.userData && cur.userData.boxId) {
          foundBoxId = cur.userData.boxId;
          break;
        }
        cur = cur.parent;
      }

      if (foundBoxId) {
        if (this.onBoxDoubleClick) {
          this.onBoxDoubleClick(foundBoxId);
        }
        this.audio.playLockClick();
        return;
      }

      // 4. Se o primeiro objeto físico atingido foi o assoalho ou caixas de roda
      if (
        obj.userData?.isInternalFloorPlywood ||
        obj.userData?.isBasePlywood ||
        obj.name === 'BaseNavalPlywoodFloor' ||
        obj.parent === this.internalBoxesBuilder.floorGroup
      ) {
        if (this.onBoxDoubleClick) {
          this.onBoxDoubleClick(null);
        }
        return;
      }
    }

    // Se deu clique duplo no fundo vazio da cena 3D
    if (this.onBoxDoubleClick) {
      this.onBoxDoubleClick(null);
    }
  }

  updateBarHover(screenX: number, screenY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((screenX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((screenY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const activeRoots: THREE.Object3D[] = [];
    if (this.viewMode === 'bars_lineup') {
      activeRoots.push(this.barsLineupGroup);
    } else if (this.viewMode === 'internal_boxes') {
      activeRoots.push(this.internalBoxesBuilder.group);
    } else {
      activeRoots.push(this.solarSystem.group, this.vehicle.group, this.internalBoxesBuilder.group);
    }
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

    // Prioridade 1: Se o cursor estiver diretamente sobre um componente elétrico (inclusive dentro de uma caixa)
    for (const hit of intersects) {
      const obj = hit.object;
      if (!isAncestorVisible(obj)) continue;
      if ((obj as any).isSprite || (obj as any).isLine || (obj as any).isLineSegments) continue;
      if (obj.name === '__box_hitbox' || obj.name === '__hitbox' || obj.userData?.isInternalBoxHitbox) continue;

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
    }

    if (!target) {
      for (const hit of intersects) {
        const obj = hit.object;
        if (!isAncestorVisible(obj)) continue;

        // Ignora sprites, linhas, colisores invisíveis do teto e helpers
        if ((obj as any).isSprite || (obj as any).isLine || (obj as any).isLineSegments) continue;
        if (obj.name === '__roof_collider' || obj.userData?.isRoofCollider) continue;

        // 0. Hitbox de caixa interna do camper (prioridade imediata)
        if (obj.name === '__box_hitbox' || obj.userData?.isInternalBoxHitbox) {
          target = obj.userData?.boxRoot || obj.parent;
          break;
        }

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

        // 2. Checa se é barra estrutural ou peça da bancada de cortes
        if (obj.userData && (obj.userData.isBar || obj.userData.isLineupPart)) {
          target = obj;
          break;
        }

        // 3. Checa se é caixa interna do camper
        if (obj.userData && obj.userData.isInternalBox) {
          target = obj.userData?.boxRoot || obj;
          break;
        }
        let pBox: THREE.Object3D | null = obj.parent;
        for (let depth = 0; depth < 5 && pBox && pBox !== this.scene; depth++, pBox = pBox.parent) {
          if (pBox.userData && pBox.userData.isInternalBox) {
            target = pBox.userData?.boxRoot || pBox;
            break;
          }
        }
        if (target && target.userData?.isInternalBox) break;

        // 4. Checa se é a chapa de compensado naval de 15mm da base
        if (obj.userData && (obj.userData.isInternalFloorPlywood || obj.userData.isBasePlywood)) {
          target = obj;
          break;
        }

        // Checa a cadeia de pais (até 5 níveis) para encontrar se pertence a uma barra estrutural ou peça da bancada
        let p: THREE.Object3D | null = obj.parent;
        let found = false;
        for (let depth = 0; depth < 5 && p && p !== this.scene; depth++, p = p.parent) {
          if (p.userData && (p.userData.isBar || p.userData.isLineupPart)) {
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
    }

    if (target) {
      if (this.hoveredObject !== target) {
        this.clearBarHover();
        this.highlightObject(target);
      }
      if (this.onBarHoverChange) {
        const d = target.userData;
        if (d.isLineupPart) {
          this.onBarHoverChange({
            name: d.name || 'Peça da Bancada',
            category: d.category || (d.isWoodPart ? '🪵 Madeira 15mm' : '🔩 Perfil Metálico'),
            barLength: d.barLength,
            barWidth: d.barWidth,
            barProfile: d.profileSpec,
            material: d.material,
            purpose: d.purpose
          }, screenX, screenY);
        } else if (d.isInternalFloorPlywood || d.isBasePlywood) {
          this.onBarHoverChange({
            name: d.name || 'Chapa Base Compensado Naval 15mm',
            category: d.category || '🪵 Assoalho Base Campervan',
            barProfile: d.barProfile || 'Compensado Naval 15mm',
            capacity: d.capacity || 'Fundo Comum dos Módulos',
            material: d.material || 'Compensado Naval 15mm Impermeabilizado',
            purpose: d.purpose || 'Base estrutural de nivelamento e fixação dos móveis internos da Doblò'
          }, screenX, screenY);
        } else if (d.isInternalBox) {
          const dims = d.dimensions || {};
          this.onBarHoverChange({
            name: d.boxName || 'Armazenador Interno',
            category: d.boxType === 'drawer' ? '📦 Gavetão Deslizante Camper' : '🧰 Baú de Armazenamento',
            barProfile: `${dims.widthMm} × ${dims.lengthMm} × ${dims.heightMm} mm`,
            capacity: `${dims.volumeLiters} Litros`,
            material: 'Compensado Naval / MDF Camper',
            purpose: 'Armazenamento interno modular no assoalho da Doblò'
          }, screenX, screenY);
        } else if (d.isElectrical) {
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

    if (d.isLineupPart) {
      emissiveColor = d.isWoodPart ? 0xd97706 : (d.isPvcPart ? 0x0ea5e9 : 0x38bdf8);
      emissiveIntensity = 0.6;
    } else if (d.isElectrical) {
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
    } else if (d.isInternalFloorPlywood || d.isBasePlywood) {
      emissiveColor = 0xd97706; // Dourado âmbar naval quente para a chapa base
      emissiveIntensity = 0.50;
    } else if (d.isInternalBox) {
      emissiveColor = 0x38bdf8; // Azul ciano brilhante de destaque
      emissiveIntensity = 0.55;
    }

    const applyHighlightToMesh = (mesh: THREE.Mesh) => {
      if (!mesh.isMesh || !mesh.material) return;
      if (mesh.name === '__box_hitbox' || mesh.name === '__hitbox' || mesh.name === '__pvc_hitbox' || mesh.userData?.isInternalBoxHitbox) return;
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

  // ─── Modo de Visualização: Caixas Internas vs Montado vs Só Barras ──────────

  updateInternalBoxes(
    grid: InternalGridConfig,
    boxes: InternalBoxItem[],
    selectedBoxId: string | null = null,
    previewOpen: boolean | InternalBoxesPreviewOptions = false,
    isolatedBoxId: string | null = null
  ) {
    this.internalBoxesBuilder.update(grid, boxes, selectedBoxId, previewOpen, isolatedBoxId);

    // Sincroniza componentes elétricos instalados nos módulos para evitar duplicatas flutuantes
    const assigned = new Set<string>();
    boxes.forEach((b) => {
      b.electronics?.forEach((e) => assigned.add(e.id));
    });
    this.solarSystem.setAssignedElectronics(assigned);

    if (this.viewMode === 'bars_lineup') {
      this.buildBarsLineup(this.currentLineupFilter);
    }
  }

  focusOnBox(boxId: string | null) {
    if (!boxId) {
      // Retorna a câmera para a visão geral isométrica do compartimento traseiro
      this.animateCameraTo(
        new THREE.Vector3(1.6, 2.0, -2.5),
        new THREE.Vector3(0, 0.60, -0.85)
      );
      return;
    }

    const boxContainer = this.internalBoxesBuilder.boxesGroup.getObjectByName(`BoxContainer_${boxId}`);
    if (!boxContainer) return;

    // Calcula o centro e dimensões exatas da caixa no mundo
    const boxAABB = new THREE.Box3().setFromObject(boxContainer);
    const center = new THREE.Vector3();
    boxAABB.getCenter(center);
    const size = new THREE.Vector3();
    boxAABB.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z, 0.45);
    const signX = center.x >= 0 ? 1 : -1;
    // Câmera ligeiramente elevada, lateral e voltada para o baú em perspectiva focada
    const camOffset = new THREE.Vector3(signX * maxDim * 1.5, maxDim * 1.25, maxDim * 1.7);
    const targetCamPos = center.clone().add(camOffset);

    this.animateCameraTo(targetCamPos, center);
  }

  setViewMode(mode: ViewMode, currentVehicleVisible: boolean = true) {
    this.clearBarHover();
    this.viewMode = mode;

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

  buildBarsLineup(filter: PartsGroupFilter = this.currentLineupFilter): number {
    while (this.barsLineupGroup.children.length > 0) {
      const child = this.barsLineupGroup.children[0];
      this.barsLineupGroup.remove(child);
    }

    interface LineupItem {
      sourceMesh: THREE.Mesh | null;
      type: 'metal' | 'wood' | 'pvc';
      length: number;
      width: number;
      thickness: number;
      thicknessMm: number;
      woodMaterial?: string;
      area: number;
      name: string;
      profileSpec: string;
      material: string;
      isPerforated?: boolean;
      hasCabinetExclusion?: boolean;
      pvcFittingType?: 'elbow_90' | 'cap' | 'pipe';
    }

    interface LineupRowGroup {
      key: string;
      type: 'metal' | 'wood' | 'pvc';
      title: string;
      subtitle: string;
      woodMaterial?: string;
      thicknessMm?: number;
      profileSpec?: string;
      colorHex: number;
      items: LineupItem[];
    }

    const metalItems: LineupItem[] = [];
    const woodItems: LineupItem[] = [];

    // 1. Coleta das barras metálicas estruturais (Grupo Ferragens)
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

      if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
      const bb = obj.geometry.boundingBox;
      const dx = bb ? Math.abs(bb.max.x - bb.min.x) : 0.04;
      const dy = bb ? Math.abs(bb.max.y - bb.min.y) : 0.04;
      const dz = bb ? Math.abs(bb.max.z - bb.min.z) : 0.04;
      const dims = [dx, dy, dz].sort((a, b) => b - a);

      const length = Number(obj.userData.barLength) || dims[0];
      const width = Math.max(0.015, dims[1]);
      const thickness = Math.max(0.005, dims[2]);
      const area = length * width;

      metalItems.push({
        sourceMesh: obj as THREE.Mesh,
        type: 'metal',
        length,
        width,
        thickness,
        thicknessMm: Math.round(thickness * 1000),
        area,
        name: obj.userData.barLabel || 'Barra Estrutural',
        profileSpec: obj.userData.profileSpec || 'Perfil Metálico Estrutural',
        material: obj.userData.material || 'Alumínio Estrutural T-Slot / Aço'
      });
    });

    // 2. Coleta das peças e chapas de madeira (Grupo Madeira / Marcenaria)
    this.internalBoxesBuilder.group.traverse((obj: any) => {
      if (!obj.isMesh || !obj.userData || !obj.userData.isWoodPart) return;
      if (obj.userData.isInternalBoxHitbox) return; // ignora hitbox invisível de raycasting

      if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
      const bb = obj.geometry.boundingBox;
      const dx = Number(obj.userData.dimW) || (bb ? Math.abs(bb.max.x - bb.min.x) : 0.05);
      const dy = Number(obj.userData.dimH) || (bb ? Math.abs(bb.max.y - bb.min.y) : 0.015);
      const dz = Number(obj.userData.dimL) || (bb ? Math.abs(bb.max.z - bb.min.z) : 0.05);
      const dims = [dx, dy, dz].sort((a, b) => b - a);

      const length = dims[0];
      const width = Math.max(0.015, dims[1]);
      const rawThickness = Math.max(0.003, dims[2]);
      const area = length * width;
      const isPerforated = Boolean(obj.userData.isPerforated);
      const hasCabinetExclusion = Boolean(obj.userData.hasCabinetExclusion);

      const thicknessMm = Number(obj.userData.thicknessMm) || Math.round(rawThickness * 1000);
      const thickness = thicknessMm > 0 ? thicknessMm / 1000 : rawThickness;
      const woodMaterial = String(
        obj.userData.woodMaterial ||
        InternalBoxesBuilder.getWoodMaterialName(obj.userData.material) ||
        'Compensado Naval'
      );

      woodItems.push({
        sourceMesh: obj as THREE.Mesh,
        type: 'wood',
        length,
        width,
        thickness,
        thicknessMm,
        woodMaterial,
        area,
        isPerforated,
        hasCabinetExclusion,
        name: obj.userData.partLabel || obj.userData.name || `Chapa ${woodMaterial} ${thicknessMm}mm`,
        profileSpec: `Chapa ${Math.round(width * 1000)} × ${Math.round(length * 1000)} × ${thicknessMm} mm${isPerforated ? (hasCabinetExclusion ? ' [Vazada CNC + Base Maciça Aéreo]' : ' [Vazada CNC]') : ''}`,
        material: obj.userData.material || `${woodMaterial} ${thicknessMm}mm Impermeabilizado`
      });
    });

    // ─── 3. AGRUPAMENTO EM GRID: CADA LINHA É UM GRUPO (TIPO DE MADEIRA + ESPESSURA) ───
    // Requisito: "um grid em que cada linha é um grupo de madeira diferente sempre posicionando lado a lado
    // da mesma espessura e em baixo para madeira e espessura diferente"
    const woodRowMap = new Map<string, LineupRowGroup>();

    woodItems.forEach((item) => {
      const thickMm = item.thicknessMm || 15;
      const woodMat = item.woodMaterial || 'Compensado Naval';
      const key = `${woodMat}__${thickMm}`;

      if (!woodRowMap.has(key)) {
        let colorHex = 0xd97706; // Compensado naval quente padrão
        if (woodMat.includes('MDF')) {
          colorHex = 0x38bdf8; // Azul claro para MDF
        } else if (woodMat.includes('Maciça') || woodMat.includes('Nobre')) {
          colorHex = 0xb45309; // Madeira nobre maciça
        } else if (thickMm >= 18) {
          colorHex = 0xf59e0b;
        }

        woodRowMap.set(key, {
          key,
          type: 'wood',
          title: `🪵 ${woodMat.toUpperCase()} • ${thickMm}mm`,
          subtitle: '',
          woodMaterial: woodMat,
          thicknessMm: thickMm,
          colorHex,
          items: []
        });
      }
      woodRowMap.get(key)!.items.push(item);
    });

    // Ordenar as linhas de madeira:
    // 1. Tipo de madeira alfabético (Compensado Naval, MDF, etc.)
    // 2. Espessura decrescente (ex: 25mm, 18mm, 15mm, 12mm...)
    const sortedWoodRows = Array.from(woodRowMap.values()).sort((a, b) => {
      if (a.woodMaterial !== b.woodMaterial) return (a.woodMaterial || '').localeCompare(b.woodMaterial || '');
      return (b.thicknessMm || 0) - (a.thicknessMm || 0);
    });

    // Dentro de cada linha de madeira, ordenar as peças da maior para a menor área de corte
    sortedWoodRows.forEach((row) => {
      row.items.sort((a, b) => {
        if (Math.abs(b.area - a.area) > 0.0001) return b.area - a.area;
        if (Math.abs(b.length - a.length) > 0.001) return b.length - a.length;
        return a.name.localeCompare(b.name);
      });
      const totalArea = row.items.reduce((acc, it) => acc + it.area, 0);
      row.subtitle = `${row.items.length} peças • ${totalArea.toFixed(2)} m²`;
    });

    // ─── 4. AGRUPAMENTO DAS FERRAGENS METÁLICAS EM LINHAS POR PERFIL ───
    const metalRowMap = new Map<string, LineupRowGroup>();

    metalItems.forEach((item) => {
      const spec = item.profileSpec || 'Perfil Metálico';
      const key = spec;

      if (!metalRowMap.has(key)) {
        metalRowMap.set(key, {
          key,
          type: 'metal',
          title: `🔩 ${spec.toUpperCase()}`,
          subtitle: '',
          profileSpec: spec,
          colorHex: 0x38bdf8,
          items: []
        });
      }
      metalRowMap.get(key)!.items.push(item);
    });

    const sortedMetalRows = Array.from(metalRowMap.values()).sort((a, b) => {
      return b.items.length - a.items.length;
    });

    sortedMetalRows.forEach((row) => {
      row.items.sort((a, b) => {
        if (Math.abs(b.length - a.length) > 0.001) return b.length - a.length;
        return a.name.localeCompare(b.name);
      });
      const totalMeters = row.items.reduce((acc, it) => acc + it.length, 0);
      row.subtitle = `${row.items.length} barras • ${totalMeters.toFixed(1)} m`;
    });

    // ─── 4.1 COLETA DOS CANOS & CONEXÕES DE PVC DA CAIXA D'ÁGUA EM U ───
    const pvcItems: LineupItem[] = [];
    const pvcFittingItems: LineupItem[] = [];
    const sortedPvcRows: LineupRowGroup[] = [];
    if (this.solarSystem.waterTankConfig?.enabled) {
      const pvcStats = extractPvcCutStats(this.solarSystem.waterTankConfig);
      const diamM = pvcStats.diameterMm / 1000;
      pvcStats.cutItems.forEach((c) => {
        pvcItems.push({
          sourceMesh: null,
          type: 'pvc',
          length: c.lengthM,
          width: diamM,
          thickness: diamM,
          thicknessMm: pvcStats.diameterMm,
          area: c.lengthM * diamM,
          name: c.label,
          profileSpec: c.spec,
          material: `PVC Série R / Esgoto Ø${pvcStats.diameterMm}mm`,
          pvcFittingType: 'pipe'
        });
      });

      if (pvcItems.length > 0) {
        sortedPvcRows.push({
          key: 'pvc_water_pipes',
          type: 'pvc',
          title: `💧 TUBOS PVC • Ø${pvcStats.diameterMm}mm (CAIXA D'ÁGUA EM U)`,
          subtitle: `${pvcItems.length} tubos lineares • ${pvcStats.totalLinearMeters}m corte • ${pvcStats.totalCapacityL}L total`,
          profileSpec: `Tubo PVC Ø${pvcStats.diameterMm}mm`,
          colorHex: 0x0ea5e9,
          items: pvcItems
        });
      }

      // Joelhos 90° e CAPs traseiros de vedação
      pvcFittingItems.push(
        {
          sourceMesh: null,
          type: 'pvc',
          length: diamM * 1.25,
          width: diamM * 1.25,
          thickness: diamM,
          thicknessMm: pvcStats.diameterMm,
          area: 0.05,
          name: 'Joelho 90° PVC com Bolsa Reforçada (Dianteiro Esq.)',
          profileSpec: `Joelho 90° Ø${pvcStats.diameterMm}mm`,
          material: `PVC Série R / Esgoto Ø${pvcStats.diameterMm}mm`,
          pvcFittingType: 'elbow_90'
        },
        {
          sourceMesh: null,
          type: 'pvc',
          length: diamM * 1.25,
          width: diamM * 1.25,
          thickness: diamM,
          thicknessMm: pvcStats.diameterMm,
          area: 0.05,
          name: 'Joelho 90° PVC com Bolsa Reforçada (Dianteiro Dir.)',
          profileSpec: `Joelho 90° Ø${pvcStats.diameterMm}mm`,
          material: `PVC Série R / Esgoto Ø${pvcStats.diameterMm}mm`,
          pvcFittingType: 'elbow_90'
        },
        {
          sourceMesh: null,
          type: 'pvc',
          length: 0.08,
          width: diamM * 1.06,
          thickness: diamM * 1.06,
          thicknessMm: pvcStats.diameterMm,
          area: 0.02,
          name: 'CAP (Tampão) de Vedação PVC Traseiro (Esq.)',
          profileSpec: `CAP Soldável Ø${pvcStats.diameterMm}mm`,
          material: `PVC Série R / Esgoto Ø${pvcStats.diameterMm}mm`,
          pvcFittingType: 'cap'
        },
        {
          sourceMesh: null,
          type: 'pvc',
          length: 0.08,
          width: diamM * 1.06,
          thickness: diamM * 1.06,
          thicknessMm: pvcStats.diameterMm,
          area: 0.02,
          name: 'CAP (Tampão) de Vedação PVC Traseiro (Dir.)',
          profileSpec: `CAP Soldável Ø${pvcStats.diameterMm}mm`,
          material: `PVC Série R / Esgoto Ø${pvcStats.diameterMm}mm`,
          pvcFittingType: 'cap'
        }
      );

      sortedPvcRows.push({
        key: 'pvc_water_fittings',
        type: 'pvc',
        title: `💧 CONEXÕES PVC & VEDAÇÃO • Ø${pvcStats.diameterMm}mm (JOELHOS 90° & CAPS)`,
        subtitle: `4 conexões (2× Joelhos 90° c/ bolsa + 2× CAPs soldáveis) • Caixa d'Água em U`,
        profileSpec: `Conexões PVC Ø${pvcStats.diameterMm}mm`,
        colorHex: 0x38bdf8,
        items: pvcFittingItems
      });
    }

    // Seleção das linhas a serem renderizadas com base no filtro
    let activeRows: LineupRowGroup[] = [];
    if (filter === 'wood') {
      activeRows = sortedWoodRows;
    } else if (filter === 'metal') {
      activeRows = sortedMetalRows;
    } else if (filter === 'pvc') {
      activeRows = sortedPvcRows;
    } else {
      activeRows = [...sortedWoodRows, ...sortedMetalRows, ...sortedPvcRows];
    }

    // ─── 5. POSICIONAMENTO EM GRID 2D NO SOLO: LADO A LADO NA MESMA LINHA E EM BAIXO PARA O PRÓXIMO GRUPO ───
    const gapX = 0.05; // 5 cm de folga entre peças adjacentes na mesma linha
    const rowGapZ = 0.55; // 55 cm de corredor livre entre uma linha e outra
    let currentZ = 0;
    let maxRowSpanX = 0;

    activeRows.forEach((row, rowIdx) => {
      const items = row.items;
      if (items.length === 0) return;

      const rowSpanX = items.reduce((sum, it) => sum + it.width, 0) + Math.max(0, items.length - 1) * gapX;
      const rowMaxLen = items.reduce((max, it) => Math.max(max, it.length), 0.1);
      if (rowSpanX > maxRowSpanX) maxRowSpanX = rowSpanX;

      const startX = -rowSpanX / 2;
      const rowBaselineZ = currentZ;

      // Linha guia visual no solo delimitando a bancada desta linha
      const linePts = [
        new THREE.Vector3(startX - 0.25, 0.004, rowBaselineZ),
        new THREE.Vector3(startX + rowSpanX + 0.25, 0.004, rowBaselineZ)
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
      const lineMat = new THREE.LineBasicMaterial({
        color: row.colorHex,
        transparent: true,
        opacity: 0.85
      });
      this.barsLineupGroup.add(new THREE.Line(lineGeo, lineMat));

      // Header 3D da Linha (Placa suspensa com identificação do grupo e espessura)
      const headerColor = row.type === 'metal' ? '#38bdf8' : (row.woodMaterial?.includes('MDF') ? '#38bdf8' : '#f59e0b');
      const headerSprite = this.createGroupHeaderSprite(
        row.title,
        row.subtitle,
        headerColor
      );
      headerSprite.position.set(0, 0.45, rowBaselineZ - 0.28);
      this.barsLineupGroup.add(headerSprite);

      // Renderização das peças lado a lado nesta linha
      let curX = startX;
      items.forEach((item, idx) => {
        const xPos = curX + item.width / 2;
        curX += item.width + gapX;

        const yPos = item.thickness / 2;
        const zPos = rowBaselineZ + item.length / 2;

        let partObj: THREE.Object3D;
        const isFitting = item.type === 'pvc' && (item.pvcFittingType === 'elbow_90' || item.pvcFittingType === 'cap');

        if (item.type === 'pvc') {
          const pvcMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.35,
            metalness: 0.20,
            side: THREE.DoubleSide
          });

          if (item.pvcFittingType === 'elbow_90') {
            partObj = MetalonTubeFactory.createPvcElbowMesh(item.thicknessMm / 1000, pvcMat);
          } else if (item.pvcFittingType === 'cap') {
            partObj = MetalonTubeFactory.createPvcCapMesh(item.thicknessMm / 1000, pvcMat);
          } else {
            // Tubo cilíndrico oco real em PVC com espessura de parede (~4.2mm) e furo passante
            const wallThickM = Math.max(0.0032, Math.min(0.0055, item.width * 0.022));
            const geo = MetalonTubeFactory.getPvcPipeGeometry(item.length, item.width, wallThickM, 'z', 36);
            const mesh = new THREE.Mesh(geo, pvcMat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Hitbox invisível cilíndrica para detecção e hover imediatos
            const hitGeo = new THREE.CylinderGeometry(item.width / 2, item.width / 2, item.length, 16);
            hitGeo.rotateX(Math.PI / 2);
            const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
            hitMesh.name = '__pvc_hitbox';
            mesh.add(hitMesh);

            const edgeGeo = new THREE.EdgesGeometry(geo, 25);
            const edgeMat = new THREE.LineBasicMaterial({
              color: row.colorHex,
              transparent: true,
              opacity: 0.9
            });
            mesh.add(new THREE.LineSegments(edgeGeo, edgeMat));

            partObj = mesh;
          }
        } else {
          let geo: THREE.BufferGeometry;
          const isMetalonOrTube = item.type === 'metal' && (item.profileSpec?.includes('Metalon') || item.profileSpec?.includes('Tubo'));
          if (item.isPerforated) {
            geo = InternalBoxesBuilder.createPerforatedGeometry(item.width, item.thickness, item.length, {
              holeDiameterMm: item.sourceMesh?.userData?.holeDiameterMm,
              spacingMm: item.sourceMesh?.userData?.spacingMm,
              exclusionZones: item.sourceMesh?.userData?.exclusionZones
            });
          } else if (isMetalonOrTube) {
            const tMm = item.profileSpec?.includes('40') ? (this.solarSystem.metalonThickness40 || 2.0) : (this.solarSystem.metalonThickness30 || 1.5);
            geo = MetalonTubeFactory.getTubeGeometry(item.length, item.width, item.thickness, tMm / 1000, 'z');
          } else {
            geo = new THREE.BoxGeometry(item.width, item.thickness, item.length);
          }

          const baseMat = item.sourceMesh
            ? (Array.isArray(item.sourceMesh.material) ? item.sourceMesh.material[0] : item.sourceMesh.material)
            : null;
          const mat = baseMat ? (baseMat.clone ? baseMat.clone() : baseMat) : new THREE.MeshStandardMaterial({ color: row.colorHex });
          if ('transparent' in mat) (mat as any).transparent = false;
          if ('opacity' in mat) (mat as any).opacity = 1.0;

          const mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const edgeGeo = new THREE.EdgesGeometry(geo, item.isPerforated ? 25 : undefined);
          const edgeMat = new THREE.LineBasicMaterial({
            color: row.colorHex,
            transparent: true,
            opacity: 0.75
          });
          mesh.add(new THREE.LineSegments(edgeGeo, edgeMat));

          partObj = mesh;
        }

        partObj.position.set(xPos, yPos, zPos);

        partObj.userData = {
          isLineupPart: true,
          isBar: item.type === 'metal',
          isWoodPart: item.type === 'wood',
          isPvcPart: item.type === 'pvc',
          isPvcFitting: isFitting,
          pvcFittingType: item.pvcFittingType,
          isPerforated: item.isPerforated,
          hasCabinetExclusion: item.hasCabinetExclusion,
          woodMaterial: item.woodMaterial,
          thicknessMm: item.thicknessMm,
          groupKey: row.key,
          rowIndex: rowIdx + 1,
          rank: idx + 1,
          name: `${row.title} #${idx + 1} • ${item.name}${item.isPerforated ? (item.hasCabinetExclusion ? ' 🕳️ [Vazado CNC + Base Maciça Aéreo]' : ' 🕳️ [Vazado CNC]') : ''}`,
          barLength: item.length,
          barWidth: item.width,
          barThickness: item.thickness,
          area: item.area,
          profileSpec: item.profileSpec,
          material: item.material,
          category: row.title,
          purpose: isFitting
            ? (item.pvcFittingType === 'elbow_90'
              ? 'Conexão 90° de alta resistência com bolsas para fusão soldável a frio na tubulação de água limpa'
              : 'Vedação estanque final traseira com ponto rosqueado para inspeção/dreno de fundo')
            : `${item.isPerforated ? (item.hasCabinetExclusion ? '🍃 Vazado CNC c/ Apoio Maciço p/ Armário Aéreo | ' : '🍃 Vazado CNC (-35% peso / Aeração) | ') : ''}Área: ${item.area >= 0.1 ? item.area.toFixed(2) + ' m²' : Math.round(item.area * 10000) + ' cm²'} (${Math.round(item.width * 1000)} × ${Math.round(item.length * 1000)} mm)`
        };

        this.barsLineupGroup.add(partObj);

        const customLabel = item.pvcFittingType === 'elbow_90'
          ? 'Joelho 90°'
          : item.pvcFittingType === 'cap'
            ? 'CAP Tampão'
            : undefined;
        const labelSprite = this.createBarLengthSprite(idx + 1, item.length, item.width, item.area, item.type, customLabel);
        labelSprite.position.set(xPos, yPos + 0.05, rowBaselineZ + item.length + 0.05);
        this.barsLineupGroup.add(labelSprite);
      });

      // Avança no eixo Z para posicionar o próximo grupo em baixo
      currentZ += rowMaxLen + rowGapZ;
    });

    const totalPvc = pvcItems.length + pvcFittingItems.length;
    const totalRendered =
      filter === 'metal' ? metalItems.length
        : filter === 'wood' ? woodItems.length
          : filter === 'pvc' ? totalPvc
            : metalItems.length + woodItems.length + totalPvc;

    this.barsLineupGroup.userData.totalBars = totalRendered;
    this.barsLineupGroup.userData.totalSpanX = Math.max(maxRowSpanX, 3.5);
    this.barsLineupGroup.userData.totalDepthZ = Math.max(currentZ, 2.0);
    this.barsLineupGroup.userData.maxLen = Math.max(currentZ, 2.0);
    this.barsLineupGroup.userData.centerX = 0;
    this.barsLineupGroup.userData.centerZ = currentZ / 2;
    this.barsLineupGroup.userData.metalCount = metalItems.length;
    this.barsLineupGroup.userData.woodCount = woodItems.length;
    this.barsLineupGroup.userData.pvcCount = totalPvc;

    return totalRendered;
  }

  private createGroupHeaderSprite(
    title: string,
    subtitle: string,
    colorHex: string
  ): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 140;
    const ctx = canvas.getContext('2d')!;

    // Fundo escuro elegante translúcido
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.beginPath();
    ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 16);
    ctx.fill();

    // Borda luminosa colorida
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 4;
    ctx.stroke();

    const maxWidth = canvas.width - 64; // Margem de segurança de 32px de cada lado
    const centerX = canvas.width / 2;

    // Título Principal com escala dinâmica de fonte para evitar qualquer corte de texto
    let titleFontSize = 28;
    ctx.font = `bold ${titleFontSize}px "Segoe UI", Inter, Arial, sans-serif`;
    let titleMetrics = ctx.measureText(title);
    if (titleMetrics.width > maxWidth) {
      titleFontSize = Math.max(18, Math.floor((maxWidth / titleMetrics.width) * titleFontSize));
      ctx.font = `bold ${titleFontSize}px "Segoe UI", Inter, Arial, sans-serif`;
    }
    ctx.fillStyle = colorHex;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, centerX, 50);

    // Subtítulo descritivo com escala dinâmica
    let subFontSize = 19;
    ctx.font = `600 ${subFontSize}px "Segoe UI", Inter, Arial, sans-serif`;
    let subMetrics = ctx.measureText(subtitle);
    if (subMetrics.width > maxWidth) {
      subFontSize = Math.max(14, Math.floor((maxWidth / subMetrics.width) * subFontSize));
      ctx.font = `600 ${subFontSize}px "Segoe UI", Inter, Arial, sans-serif`;
    }
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(subtitle, centerX, 94);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2.40, 0.35, 1);
    return sprite;
  }

  private createBarLengthSprite(
    rank: number,
    lengthM: number,
    widthM: number,
    areaM2: number,
    type: 'metal' | 'wood' | 'pvc',
    customLabel?: string
  ): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 76;
    const ctx = canvas.getContext('2d')!;

    const isWood = type === 'wood';
    const isPvc = type === 'pvc';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = isWood
      ? 'rgba(245, 158, 11, 0.85)'
      : isPvc
        ? 'rgba(14, 165, 233, 0.85)'
        : 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 10);
    ctx.fill();
    ctx.stroke();

    // Rank & Type Icon
    ctx.fillStyle = isWood ? '#f59e0b' : isPvc ? '#38bdf8' : '#38bdf8';
    ctx.font = 'bold 13.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${isWood ? '🪵' : isPvc ? '💧' : '🔩'} #${rank}`, 12, 26);

    // Area / Diameter
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12.5px monospace';
    ctx.textAlign = 'right';
    const areaStr = isPvc
      ? `Ø${Math.round(widthM * 1000)}mm`
      : (areaM2 >= 0.1 ? `${areaM2.toFixed(2)}m²` : `${Math.round(areaM2 * 10000)}cm²`);
    ctx.fillText(areaStr, canvas.width - 12, 26);

    // Dimensions: Length × Width (mm) or Custom Label
    ctx.fillStyle = isWood ? '#fed7aa' : isPvc ? '#7dd3fc' : '#bae6fd';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    const centerX = canvas.width / 2;
    if (customLabel) {
      ctx.fillText(customLabel, centerX, 53);
    } else {
      const lMm = Math.round(lengthM * 1000);
      const wMm = Math.round(widthM * 1000);
      ctx.fillText(isPvc ? `${lMm} mm` : `${lMm} × ${wMm} mm`, centerX, 53);
    }

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.095, 0.033, 1);
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

