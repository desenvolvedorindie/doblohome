import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MaterialLibrary } from './Materials';
import { MechanicalAudio } from './Audio';
import { DobloVehicle } from './DobloModel';
import { SolarSystem } from './SolarSystem';
import { SolarSimulation } from './SolarSimulation';
import { BarMeasurementData, CameraPreset, ViewMode, PartsGroupFilter, InternalBoxItem, InternalGridConfig } from '../types';
import { CollisionChecker, CollisionSummary } from './CollisionChecker';
import { FloatingChecker, FloatingSummary } from './FloatingChecker';
import { InternalBoxesBuilder } from './InternalBoxesBuilder';

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
      emissiveColor = d.isWoodPart ? 0xd97706 : 0x38bdf8;
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
      if (mesh.name === '__box_hitbox' || mesh.name === '__hitbox' || mesh.userData?.isInternalBoxHitbox) return;
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
    previewOpen: boolean = false,
    isolatedBoxId: string | null = null
  ) {
    this.internalBoxesBuilder.update(grid, boxes, selectedBoxId, previewOpen, isolatedBoxId);
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
      const maxLen = this.barsLineupGroup.userData.maxLen || 2.0;
      const centerX = this.barsLineupGroup.userData.centerX || 0;
      const camDist = Math.max(3.8, Math.max(totalSpanX * 0.62, maxLen * 1.35));
      this.animateCameraTo(
        new THREE.Vector3(centerX, camDist * 0.72, camDist * 0.82),
        new THREE.Vector3(centerX, 0.05, maxLen * 0.35)
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
      const maxLen = this.barsLineupGroup.userData.maxLen || 2.0;
      const centerX = this.barsLineupGroup.userData.centerX || 0;
      const camDist = Math.max(3.8, Math.max(totalSpanX * 0.62, maxLen * 1.35));
      this.animateCameraTo(
        new THREE.Vector3(centerX, camDist * 0.72, camDist * 0.82),
        new THREE.Vector3(centerX, 0.05, maxLen * 0.35)
      );
    }
  }

  buildBarsLineup(filter: PartsGroupFilter = this.currentLineupFilter): number {
    while (this.barsLineupGroup.children.length > 0) {
      const child = this.barsLineupGroup.children[0];
      this.barsLineupGroup.remove(child);
    }

    interface LineupItem {
      sourceMesh: THREE.Mesh;
      type: 'metal' | 'wood';
      length: number;
      width: number;
      thickness: number;
      area: number;
      name: string;
      profileSpec: string;
      material: string;
      isPerforated?: boolean;
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
      const thickness = Math.max(0.005, dims[2]);
      const area = length * width;
      const isPerforated = Boolean(obj.userData.isPerforated);

      woodItems.push({
        sourceMesh: obj as THREE.Mesh,
        type: 'wood',
        length,
        width,
        thickness,
        area,
        isPerforated,
        name: obj.userData.partLabel || obj.userData.name || 'Chapa Compensado 15mm',
        profileSpec: `Chapa ${Math.round(width * 1000)} × ${Math.round(length * 1000)} × ${Math.round(thickness * 1000)} mm${isPerforated ? ' [Vazada CNC]' : ''}`,
        material: obj.userData.material || (isPerforated ? 'Compensado Naval 15mm Vazado (Alívio Peso)' : 'Compensado Naval 15mm Impermeabilizado')
      });
    });

    // Ordenação do Grupo Ferragens: da maior para a menor barra pelo comprimento (depois pela área)
    metalItems.sort((a, b) => {
      if (Math.abs(b.length - a.length) > 0.001) return b.length - a.length;
      if (Math.abs(b.area - a.area) > 0.0001) return b.area - a.area;
      return a.name.localeCompare(b.name);
    });

    // Ordenação do Grupo Madeira: da maior para a menor peça rigorosamente pela área de corte (m²)
    woodItems.sort((a, b) => {
      if (Math.abs(b.area - a.area) > 0.0001) return b.area - a.area;
      if (Math.abs(b.length - a.length) > 0.001) return b.length - a.length;
      return a.name.localeCompare(b.name);
    });

    const gapX = 0.04; // 4 cm de espaçamento entre cada peça adjacente
    const zBaseline = 0; // linha de base comum na frente da bancada de medição

    const totalWidthMetal = metalItems.reduce((sum, item) => sum + item.width, 0);
    const spanMetal = totalWidthMetal + Math.max(0, metalItems.length - 1) * gapX;
    const maxLenMetal = metalItems.reduce((max, item) => Math.max(max, item.length), 0.1);

    const totalWidthWood = woodItems.reduce((sum, item) => sum + item.width, 0);
    const spanWood = totalWidthWood + Math.max(0, woodItems.length - 1) * gapX;
    const maxLenWood = woodItems.reduce((max, item) => Math.max(max, item.length), 0.1);

    const maxLen = Math.max(maxLenMetal, maxLenWood);

    let totalSpanX = 0;
    let centerX = 0;

    // Função auxiliar para renderizar uma bancada completa de itens
    const renderItems = (
      items: LineupItem[],
      startX: number,
      categoryLabel: string,
      prefix: string,
      outlineColorHex: number
    ) => {
      let currentX = startX;
      items.forEach((item, idx) => {
        const xPos = currentX + item.width / 2;
        currentX += item.width + gapX;

        const yPos = item.thickness / 2;
        const zPos = zBaseline + item.length / 2;

        const geo = item.isPerforated
          ? InternalBoxesBuilder.createPerforatedGeometry(item.width, item.thickness, item.length)
          : new THREE.BoxGeometry(item.width, item.thickness, item.length);
        const mesh = new THREE.Mesh(geo, item.sourceMesh.material);
        mesh.position.set(xPos, yPos, zPos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const edgeGeo = new THREE.EdgesGeometry(geo, item.isPerforated ? 25 : undefined);
        const edgeMat = new THREE.LineBasicMaterial({
          color: outlineColorHex,
          transparent: true,
          opacity: 0.75
        });
        const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
        mesh.add(edgeLine);

        mesh.userData = {
          isLineupPart: true,
          isBar: item.type === 'metal',
          isWoodPart: item.type === 'wood',
          isPerforated: item.isPerforated,
          rank: idx + 1,
          name: `${prefix} #${idx + 1} • ${item.name}${item.isPerforated ? ' 🕳️ [Vazado CNC]' : ''}`,
          barLength: item.length,
          barWidth: item.width,
          barThickness: item.thickness,
          area: item.area,
          profileSpec: item.profileSpec,
          material: item.material,
          category: categoryLabel,
          purpose: `${item.isPerforated ? '🍃 Vazado CNC (-35% peso / Aeração) | ' : ''}Área: ${item.area >= 0.1 ? item.area.toFixed(2) + ' m²' : Math.round(item.area * 10000) + ' cm²'} (${Math.round(item.width * 1000)} × ${Math.round(item.length * 1000)} mm)`
        };

        this.barsLineupGroup.add(mesh);

        const labelSprite = this.createBarLengthSprite(idx + 1, item.length, item.width, item.area, item.type);
        labelSprite.position.set(xPos, yPos + 0.05, zBaseline + item.length + 0.05);
        this.barsLineupGroup.add(labelSprite);
      });
    };

    if (filter === 'metal') {
      // ─── APENAS GRUPO 1: FERRAGENS & PERFIS METÁLICOS ───
      totalSpanX = spanMetal;
      centerX = 0;
      const startX = -spanMetal / 2;

      // Linha guia no solo
      const baseLinePts = [
        new THREE.Vector3(startX - 0.2, 0.004, zBaseline),
        new THREE.Vector3(startX + spanMetal + 0.2, 0.004, zBaseline)
      ];
      const baseLineGeo = new THREE.BufferGeometry().setFromPoints(baseLinePts);
      const baseLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
      this.barsLineupGroup.add(new THREE.Line(baseLineGeo, baseLineMat));

      // Header 3D do Grupo 1
      const headerSprite = this.createGroupHeaderSprite(
        '🔩 GRUPO 1: FERRAGENS & ESTRUTURA METÁLICA',
        `${metalItems.length} perfis e trilhos de alumínio/metalon`,
        '#38bdf8'
      );
      headerSprite.position.set(0, 0.45, zBaseline - 0.45);
      this.barsLineupGroup.add(headerSprite);

      renderItems(metalItems, startX, '🔩 Perfil Metálico Estrutural', '🔩 Ferragem', 0x38bdf8);
    } else if (filter === 'wood') {
      // ─── APENAS GRUPO 2: MARCENARIA & PEÇAS DE MADEIRA ───
      totalSpanX = spanWood;
      centerX = 0;
      const startX = -spanWood / 2;

      // Linha guia no solo
      const baseLinePts = [
        new THREE.Vector3(startX - 0.2, 0.004, zBaseline),
        new THREE.Vector3(startX + spanWood + 0.2, 0.004, zBaseline)
      ];
      const baseLineGeo = new THREE.BufferGeometry().setFromPoints(baseLinePts);
      const baseLineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 });
      this.barsLineupGroup.add(new THREE.Line(baseLineGeo, baseLineMat));

      // Header 3D do Grupo 2
      const headerSprite = this.createGroupHeaderSprite(
        '🪵 GRUPO 2: MARCENARIA & PEÇAS DE MADEIRA',
        `${woodItems.length} peças e ripas de compensado naval 15mm`,
        '#f59e0b'
      );
      headerSprite.position.set(0, 0.45, zBaseline - 0.45);
      this.barsLineupGroup.add(headerSprite);

      renderItems(woodItems, startX, '🪵 Madeira / Compensado 15mm', '🪵 Madeira', 0xd97706);
    } else {
      // ─── AMBOS OS GRUPOS LADO A LADO COM CORREDOR CENTRAL ───
      const aisleWidth = 0.85; // 85 cm de corredor separando as bancadas de ferragem e madeira
      totalSpanX = spanMetal + aisleWidth + spanWood;
      centerX = 0;

      // 1. Grupo Ferragens (à Esquerda do observador: X < 0)
      const startXMetal = -aisleWidth / 2 - spanMetal;
      const baseLineMetalPts = [
        new THREE.Vector3(startXMetal - 0.2, 0.004, zBaseline),
        new THREE.Vector3(-aisleWidth / 2 + 0.05, 0.004, zBaseline)
      ];
      const baseLineMetal = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(baseLineMetalPts),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
      );
      this.barsLineupGroup.add(baseLineMetal);

      const headerMetal = this.createGroupHeaderSprite(
        '🔩 GRUPO 1: FERRAGENS',
        `${metalItems.length} barras e trilhos metálicos`,
        '#38bdf8'
      );
      headerMetal.position.set(startXMetal + spanMetal / 2, 0.45, zBaseline - 0.45);
      this.barsLineupGroup.add(headerMetal);

      renderItems(metalItems, startXMetal, '🔩 Perfil Metálico Estrutural', '🔩 Ferragem', 0x38bdf8);

      // 2. Corredor Central Divisório Iluminado
      const aisleLinePts = [
        new THREE.Vector3(0, 0.005, -0.65),
        new THREE.Vector3(0, 0.005, maxLen + 0.35)
      ];
      const aisleLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(aisleLinePts),
        new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.5 })
      );
      this.barsLineupGroup.add(aisleLine);

      // 3. Grupo Madeira (à Direita do observador: X > 0)
      const startXWood = aisleWidth / 2;
      const baseLineWoodPts = [
        new THREE.Vector3(aisleWidth / 2 - 0.05, 0.004, zBaseline),
        new THREE.Vector3(startXWood + spanWood + 0.2, 0.004, zBaseline)
      ];
      const baseLineWood = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(baseLineWoodPts),
        new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 })
      );
      this.barsLineupGroup.add(baseLineWood);

      const headerWood = this.createGroupHeaderSprite(
        '🪵 GRUPO 2: MADEIRA',
        `${woodItems.length} peças de compensado naval 15mm`,
        '#f59e0b'
      );
      headerWood.position.set(startXWood + spanWood / 2, 0.45, zBaseline - 0.45);
      this.barsLineupGroup.add(headerWood);

      renderItems(woodItems, startXWood, '🪵 Madeira / Compensado 15mm', '🪵 Madeira', 0xd97706);
    }

    const totalRendered =
      filter === 'metal' ? metalItems.length : filter === 'wood' ? woodItems.length : metalItems.length + woodItems.length;

    this.barsLineupGroup.userData.totalBars = totalRendered;
    this.barsLineupGroup.userData.totalSpanX = totalSpanX;
    this.barsLineupGroup.userData.maxLen = maxLen;
    this.barsLineupGroup.userData.centerX = centerX;
    this.barsLineupGroup.userData.metalCount = metalItems.length;
    this.barsLineupGroup.userData.woodCount = woodItems.length;

    return totalRendered;
  }

  private createGroupHeaderSprite(
    title: string,
    subtitle: string,
    colorHex: string
  ): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 560;
    canvas.height = 130;
    const ctx = canvas.getContext('2d')!;

    // Fundo escuro elegante translúcido
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 544, 114, 16);
    ctx.fill();

    // Borda luminosa colorida
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Título Principal
    ctx.fillStyle = colorHex;
    ctx.font = 'bold 30px "Segoe UI", Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 280, 48);

    // Subtítulo descritivo
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 20px "Segoe UI", Inter, Arial, sans-serif';
    ctx.fillText(subtitle, 280, 88);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.8, 0.42, 1);
    return sprite;
  }

  private createBarLengthSprite(
    rank: number,
    lengthM: number,
    widthM: number,
    areaM2: number,
    type: 'metal' | 'wood'
  ): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 72;
    const ctx = canvas.getContext('2d')!;

    const isWood = type === 'wood';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.strokeStyle = isWood ? 'rgba(245, 158, 11, 0.8)' : 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(4, 4, 172, 64, 8);
    ctx.fill();
    ctx.stroke();

    // Rank & Type Icon
    ctx.fillStyle = isWood ? '#f59e0b' : '#38bdf8';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${isWood ? '🪵' : '🔩'} #${rank}`, 12, 24);

    // Area
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    const areaStr = areaM2 >= 0.1 ? `${areaM2.toFixed(2)}m²` : `${Math.round(areaM2 * 10000)}cm²`;
    ctx.fillText(areaStr, 168, 24);

    // Dimensions: Length × Width (mm)
    ctx.fillStyle = isWood ? '#fed7aa' : '#bae6fd';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    const lMm = Math.round(lengthM * 1000);
    const wMm = Math.round(widthM * 1000);
    ctx.fillText(`${lMm} × ${wMm} mm`, 90, 50);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.08, 0.032, 1);
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

