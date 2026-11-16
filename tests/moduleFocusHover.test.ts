import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { InternalBoxesBuilder } from '../src/three/InternalBoxesBuilder';
import { SceneRaycaster } from '../src/three/scene/SceneRaycaster';
import { DEFAULT_INTERNAL_GRID, DEFAULT_CEILING_CONFIG, INTERNAL_BOXES_PRESETS } from '../src/data/internalBoxesPresets';

function projectWorldToScreen(
  worldPos: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  width = 800,
  height = 600
): { screenX: number; screenY: number } {
  const projected = worldPos.clone().project(camera);
  return {
    screenX: ((projected.x + 1) / 2) * width,
    screenY: ((-projected.y + 1) / 2) * height
  };
}

function createMockSceneManager(builder: InternalBoxesBuilder, camera: THREE.PerspectiveCamera) {
  const scene = new THREE.Scene();
  const solarGroup = new THREE.Group();
  const vehicleGroup = new THREE.Group();
  const barsLineupGroup = new THREE.Group();
  scene.add(solarGroup);
  scene.add(vehicleGroup);
  scene.add(builder.group);
  scene.add(barsLineupGroup);
  scene.updateMatrixWorld(true);

  const onBarHoverChange = vi.fn();
  const onBoxSelect = vi.fn();
  const onBoxDoubleClick = vi.fn();

  return {
    scene,
    camera,
    viewMode: 'internal_boxes',
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    hoveredObject: null as THREE.Object3D | null,
    hoveredOriginalMaterials: new Map(),
    internalBoxesBuilder: builder,
    solarSystem: { group: solarGroup },
    vehicle: { group: vehicleGroup },
    barsLineupGroup,
    renderer: {
      domElement: {
        style: { cursor: '' },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
      }
    },
    audio: { playLockClick: vi.fn() },
    onBarHoverChange,
    onBoxSelect,
    onBoxDoubleClick
  };
}

describe('Module Focus & Wood-Part Exclusive Hover', () => {
  it('ghosts other boxes, floor, and ceiling when a module is entered via selectedBoxId or isolatedBoxId', () => {
    const builder = new InternalBoxesBuilder();
    const grid = { ...DEFAULT_INTERNAL_GRID };
    const boxes = INTERNAL_BOXES_PRESETS[0].boxes;

    // Entra no módulo apenas via selectedBoxId (clique simples no 3D/grid/lista)
    builder.update(grid, boxes, 'box_power_1', false, null);

    expect(builder.isolatedBoxId).toBe('box_power_1');
    expect(builder.selectedBoxId).toBe('box_power_1');

    const activeBox = builder.boxesGroup.getObjectByName('BoxContainer_box_power_1')!;
    const otherBox = builder.boxesGroup.getObjectByName('BoxContainer_box_clothes_2')!;

    expect(activeBox).toBeDefined();
    expect(otherBox).toBeDefined();

    // Módulo ativo NÃO tem hitbox externa bloqueando as peças internas
    const activeOuterHitbox = activeBox.children.find((c) => c.name === '__box_hitbox');
    expect(activeOuterHitbox).toBeUndefined();

    // Peças de madeira do módulo ativo mantêm cor natural (não são pintadas de 0x38bdf8)
    let activeWoodCount = 0;
    activeBox.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.isWoodPart) {
        activeWoodCount++;
        expect(obj.userData?.isGhost).toBeUndefined();
        const mat = obj.material as THREE.MeshStandardMaterial;
        expect(mat.color.getHex()).not.toBe(0x38bdf8);
      }
    });
    expect(activeWoodCount).toBeGreaterThanOrEqual(4);

    // Outros módulos, piso e teto viram fantasmas
    let ghostMeshChecked = 0;
    otherBox.traverse((obj: any) => {
      if (obj.isMesh && obj.name !== '__box_hitbox') {
        ghostMeshChecked++;
        expect(obj.userData?.isGhost).toBe(true);
        const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
        expect(mat.transparent).toBe(true);
        expect(mat.opacity).toBeLessThanOrEqual(0.1);
      }
    });
    expect(ghostMeshChecked).toBeGreaterThan(0);

    builder.floorGroup.traverse((obj: any) => {
      if (obj.isMesh) {
        expect(obj.userData?.isGhost).toBe(true);
        expect((obj.material as any).opacity).toBeLessThanOrEqual(0.1);
      }
    });
    builder.ceilingGroup.traverse((obj: any) => {
      if (obj.isMesh) {
        expect(obj.userData?.isGhost).toBe(true);
        expect((obj.material as any).opacity).toBeLessThanOrEqual(0.1);
      }
    });
  });

  it('hovers ONLY wood parts of the active module (ignores battery/electronics, other boxes, floor, and ceiling)', () => {
    const builder = new InternalBoxesBuilder();
    const grid = {
      ...DEFAULT_INTERNAL_GRID,
      ceiling: { ...DEFAULT_INTERNAL_GRID.ceiling!, visibleIn3D: false, enabled: false }
    };
    const boxes = INTERNAL_BOXES_PRESETS[0].boxes;

    // Entra no módulo elétrico box_power_1 apenas por clique simples (selectedBoxId)
    builder.update(grid, boxes, 'box_power_1', false, null);

    const activeBox = builder.boxesGroup.getObjectByName('BoxContainer_box_power_1')!;
    const otherBox = builder.boxesGroup.getObjectByName('BoxContainer_box_clothes_2')!;

    const camera = new THREE.PerspectiveCamera(42, 800 / 600, 0.1, 100);
    camera.position.set(1.2, 1.5, 0.6);
    camera.lookAt(activeBox.position.x, activeBox.position.y, activeBox.position.z);
    camera.updateMatrixWorld(true);

    const sm = createMockSceneManager(builder, camera);

    // 1. Aponta para uma peça de madeira real de box_power_1 (ex.: Tampa Basculante)
    const lidMesh = (() => {
      let found: THREE.Mesh | null = null;
      activeBox.traverse((o: any) => {
        if (!found && o.isMesh && o.userData?.isWoodPart && o.userData?.partType === 'top') {
          found = o;
        }
      });
      return found!;
    })();
    expect(lidMesh).toBeTruthy();

    const lidWorldPos = new THREE.Vector3();
    lidMesh.getWorldPosition(lidWorldPos);
    const { screenX: lidX, screenY: lidY } = projectWorldToScreen(lidWorldPos, camera);

    SceneRaycaster.updateBarHover(sm, lidX, lidY);

    expect(sm.hoveredObject).toBe(lidMesh);
    expect(sm.onBarHoverChange).toHaveBeenCalled();
    const lastCall = sm.onBarHoverChange.mock.calls.at(-1)!;
    const payload = lastCall[0];
    expect(payload).toBeTruthy();
    expect(payload.isElectrical).toBeUndefined();
    expect(payload.name).toContain('Tampa');
    expect(payload.category).toContain('⚡ Sistema Elétrico & Baterias');
    expect(payload.purpose).toContain('⚡ Sistema Elétrico & Baterias');

    // 2. Aponta para o outro módulo fantasma (box_clothes_2): NÃO pode fazer hover!
    sm.onBarHoverChange.mockClear();
    const otherPos = otherBox.position.clone();
    const { screenX: otherX, screenY: otherY } = projectWorldToScreen(otherPos, camera);

    SceneRaycaster.updateBarHover(sm, otherX, otherY);
    expect(sm.hoveredObject).toBeNull();
    expect(sm.onBarHoverChange.mock.calls.at(-1)?.[0]).toBeNull();

    // 3. Mesmo olhando por dentro com bateria exposta sem tampa, NÃO faz hover na bateria se nenhuma madeira estiver sob o raio
    builder.update(
      grid,
      [{ ...boxes[0], panels: { top: false, left: false, right: false, front: false, rear: false, bottom: false } }],
      null,
      false,
      'box_power_1'
    );
    sm.scene.updateMatrixWorld(true);
    const onlyElectricalContainer = builder.boxesGroup.getObjectByName('BoxContainer_box_power_1')!;
    let batteryMesh: THREE.Object3D | null = null;
    onlyElectricalContainer.traverse((o: any) => {
      if (!batteryMesh && o.userData?.isElectrical && o.isMesh) {
        batteryMesh = o;
      }
    });
    expect(batteryMesh).toBeTruthy();
    const batPos = new THREE.Vector3();
    batteryMesh!.getWorldPosition(batPos);
    const { screenX: batX, screenY: batY } = projectWorldToScreen(batPos, camera);

    sm.onBarHoverChange.mockClear();
    SceneRaycaster.updateBarHover(sm, batX, batY);
    expect(sm.hoveredObject).toBeNull();
    expect(sm.onBarHoverChange.mock.calls.at(-1)?.[0]).toBeNull();
  });

  it('names inner drawer wood parts distinctly while preserving clean module name', () => {
    const builder = new InternalBoxesBuilder();
    const grid = {
      ...DEFAULT_INTERNAL_GRID,
      ceiling: { ...DEFAULT_INTERNAL_GRID.ceiling!, visibleIn3D: false, enabled: false }
    };
    const kitchenDrawer = INTERNAL_BOXES_PRESETS[0].boxes.find((b) => b.id === 'box_kitchen_drawer_3')!;
    builder.update(grid, [kitchenDrawer], 'box_kitchen_drawer_3', { openCabinets: true }, null);

    const drawerContainer = builder.boxesGroup.getObjectByName('BoxContainer_box_kitchen_drawer_3')!;
    const labels: string[] = [];
    const moduleNames = new Set<string>();
    drawerContainer.traverse((o: any) => {
      if (o.isMesh && o.userData?.isWoodPart) {
        labels.push(o.userData.partLabel);
        moduleNames.add(o.userData.moduleName);
      }
    });

    expect(moduleNames.has(kitchenDrawer.name)).toBe(true);
    expect(moduleNames.has(`${kitchenDrawer.name} [Gaveta]`)).toBe(false);
    expect(labels.some((l) => l.includes('Fundo Base da Gaveta'))).toBe(true);
    expect(labels.some((l) => l.includes('Lateral Esquerda da Gaveta'))).toBe(true);
  });

  it('allows piercing CeilingAcousticBacking from above when no module is selected yet', () => {
    const builder = new InternalBoxesBuilder();
    const grid = { ...DEFAULT_INTERNAL_GRID };
    const boxes = [INTERNAL_BOXES_PRESETS[0].boxes[1]];
    builder.update(grid, boxes, null, false, null);

    const box = builder.boxesGroup.getObjectByName('BoxContainer_box_clothes_2')!;
    const camera = new THREE.PerspectiveCamera(42, 800 / 600, 0.1, 100);
    camera.position.set(1.6, 2.2, -2.5);
    camera.lookAt(box.position.x, box.position.y, box.position.z);
    camera.updateMatrixWorld(true);

    const sm = createMockSceneManager(builder, camera);
    const { screenX, screenY } = projectWorldToScreen(box.position.clone(), camera);

    SceneRaycaster.updateBarHover(sm, screenX, screenY);
    expect(sm.hoveredObject).toBe(box);
    const payload = sm.onBarHoverChange.mock.calls.at(-1)?.[0];
    expect(payload?.name).toBe('🛏️ Baú Cama & Roupas');

    SceneRaycaster.handleCanvasClick(sm, screenX, screenY);
    expect(sm.onBoxSelect).toHaveBeenCalledWith('box_clothes_2');
  });

  it('preserves active module on click inside same module and clears on void click when not strictly isolated', () => {
    const builder = new InternalBoxesBuilder();
    const grid = {
      ...DEFAULT_INTERNAL_GRID,
      ceiling: { ...DEFAULT_INTERNAL_GRID.ceiling!, visibleIn3D: false, enabled: false }
    };
    const boxes = [INTERNAL_BOXES_PRESETS[0].boxes[0]];
    builder.update(grid, boxes, 'box_power_1', false, null);

    const box = builder.boxesGroup.getObjectByName('BoxContainer_box_power_1')!;
    const camera = new THREE.PerspectiveCamera(42, 800 / 600, 0.1, 100);
    camera.position.set(1.2, 1.5, 0.6);
    camera.lookAt(box.position.x, box.position.y, box.position.z);
    camera.updateMatrixWorld(true);

    const sm = createMockSceneManager(builder, camera);

    let lidMesh: THREE.Mesh | null = null;
    box.traverse((o: any) => {
      if (!lidMesh && o.isMesh && o.userData?.isWoodPart && o.userData?.partType === 'top') {
        lidMesh = o;
      }
    });
    const lidPos = new THREE.Vector3();
    lidMesh!.getWorldPosition(lidPos);
    const { screenX, screenY } = projectWorldToScreen(lidPos, camera);

    // Clicar em uma peça do módulo já aberto não chama onBoxSelect novamente
    SceneRaycaster.handleCanvasClick(sm, screenX, screenY);
    expect(sm.onBoxSelect).not.toHaveBeenCalled();

    // Clicar no vazio fora dos módulos quando não está com isolatedBoxId travado limpa a seleção
    SceneRaycaster.handleCanvasClick(sm, 5, 5);
    expect(sm.onBoxSelect).toHaveBeenCalledWith(null);
  });

  it('triggers hover on floor (chão / assoalho) and ceiling (teto) with metadata and visual highlight', () => {
    const builder = new InternalBoxesBuilder();
    const grid = {
      ...DEFAULT_INTERNAL_GRID,
      ceiling: { ...DEFAULT_CEILING_CONFIG, enabled: true, visibleIn3D: true, type: 'slatted' as const }
    };
    builder.update(grid, [], null, false, null);

    const camera = new THREE.PerspectiveCamera(42, 800 / 600, 0.1, 100);
    camera.position.set(0, 1.2, 1.8);
    camera.lookAt(0, 0.48, -0.85);
    camera.updateMatrixWorld(true);

    const sm = createMockSceneManager(builder, camera);

    // 1. Hover no piso/assoalho naval (chão)
    const floorMesh = builder.floorMesh!;
    expect(floorMesh).toBeDefined();
    const floorPos = new THREE.Vector3(0, 0.48, -0.85);
    const { screenX: floorX, screenY: floorY } = projectWorldToScreen(floorPos, camera);

    SceneRaycaster.updateBarHover(sm, floorX, floorY);
    expect(sm.hoveredObject).toBe(floorMesh);
    expect(sm.onBarHoverChange).toHaveBeenCalled();
    const floorPayload = sm.onBarHoverChange.mock.calls.at(-1)![0];
    expect(floorPayload.category).toContain('🪵 Assoalho Base Campervan');
    expect(floorPayload.material).toContain('Compensado Naval');

    // 2. Hover no forro de teto (ripas)
    sm.onBarHoverChange.mockClear();
    camera.position.set(0, 1.2, -0.85);
    camera.lookAt(0, 1.74, -0.85); // Olha para cima no teto
    camera.updateMatrixWorld(true);

    const ceilingSlat = builder.ceilingGroup.children.find((c) => c.name.startsWith('CeilingSlat_')) as THREE.Mesh;
    expect(ceilingSlat).toBeDefined();
    const slatPos = new THREE.Vector3();
    ceilingSlat.getWorldPosition(slatPos);
    const { screenX: slatX, screenY: slatY } = projectWorldToScreen(slatPos, camera);

    SceneRaycaster.updateBarHover(sm, slatX, slatY);
    expect(sm.hoveredObject).toBe(ceilingSlat);
    expect(sm.onBarHoverChange).toHaveBeenCalled();
    const ceilingPayload = sm.onBarHoverChange.mock.calls.at(-1)![0];
    expect(ceilingPayload.category).toContain('🪵 Teto & Forro Campervan');
    expect(ceilingPayload.name).toContain('Ripa de Teto');
  });
});
