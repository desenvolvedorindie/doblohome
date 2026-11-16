import * as THREE from 'three';
import {
  InternalGridConfig,
  InternalBoxItem,
  InternalBoxesPreviewOptions,
  InternalBoxType,
  DrawerMode
} from '../types';
import {
  PLYWOOD_THICKNESS,
  FLOOR_Y,
  CEILING_Y,
  getBoxThickness,
  getWoodMaterialName,
  getUpperCabinetExclusionZones,
  createBoxMaterial,
  createPerforatedGeometry,
  addPerforatedPanel,
  addPanel
} from './boxes/BoxGeometryHelpers';
import { FloorAndGridBuilder } from './boxes/FloorAndGridBuilder';
import { DrawerBuilder } from './boxes/DrawerBuilder';
import { ChestBuilder } from './boxes/ChestBuilder';
import { SlatBedBuilder } from './boxes/SlatBedBuilder';
import { UpperCabinetBuilder } from './boxes/UpperCabinetBuilder';
import { BoxAccessoriesBuilder } from './boxes/BoxAccessoriesBuilder';
import { BoxElectronicsBuilder } from './boxes/BoxElectronicsBuilder';
import { CeilingBuilder, getCeilingArchOffset } from './boxes/CeilingBuilder';

export class InternalBoxesBuilder {
  group: THREE.Group;
  boxesGroup: THREE.Group;
  floorGroup: THREE.Group;
  ceilingGroup: THREE.Group;
  gridLinesGroup: THREE.Group;
  floorMesh?: THREE.Mesh;
  public isolatedBoxId: string | null = null;
  public selectedBoxId: string | null = null;
  public strictIsolatedBoxId: string | null = null;

  // Constantes de compatibilidade estática
  static readonly FLOOR_Y = FLOOR_Y;
  static readonly CEILING_Y = CEILING_Y;
  static readonly PLYWOOD_THICKNESS = PLYWOOD_THICKNESS;
  static readonly getBoxThickness = getBoxThickness;
  static readonly getWoodMaterialName = getWoodMaterialName;
  static readonly getUpperCabinetExclusionZones = getUpperCabinetExclusionZones;
  static readonly createPerforatedGeometry = createPerforatedGeometry;
  static readonly getCeilingArchOffset = getCeilingArchOffset;

  private floorAndGridBuilder!: FloorAndGridBuilder;
  private drawerBuilder = new DrawerBuilder();
  private chestBuilder = new ChestBuilder();
  private slatBedBuilder = new SlatBedBuilder();
  private upperCabinetBuilder = new UpperCabinetBuilder();
  private accessoriesBuilder = new BoxAccessoriesBuilder();
  private electronicsBuilder = new BoxElectronicsBuilder();
  private ceilingBuilder!: CeilingBuilder;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'InternalBoxesSystem';

    this.floorGroup = new THREE.Group();
    this.floorGroup.name = 'CamperFloor';
    this.group.add(this.floorGroup);

    this.ceilingGroup = new THREE.Group();
    this.ceilingGroup.name = 'CamperCeiling';
    this.group.add(this.ceilingGroup);

    this.gridLinesGroup = new THREE.Group();
    this.gridLinesGroup.name = 'GridLines';
    this.group.add(this.gridLinesGroup);

    this.boxesGroup = new THREE.Group();
    this.boxesGroup.name = 'BoxesGroup';
    this.group.add(this.boxesGroup);

    this.floorAndGridBuilder = new FloorAndGridBuilder(this.floorGroup, this.gridLinesGroup);
    this.ceilingBuilder = new CeilingBuilder(this.ceilingGroup);
  }

  update(
    grid: InternalGridConfig,
    boxes: InternalBoxItem[],
    selectedBoxId: string | null = null,
    previewOpen: boolean | InternalBoxesPreviewOptions = false,
    isolatedBoxId: string | null = null
  ) {
    const activeFocusBoxId = isolatedBoxId || selectedBoxId;
    this.isolatedBoxId = activeFocusBoxId;
    this.selectedBoxId = selectedBoxId;
    this.strictIsolatedBoxId = isolatedBoxId;

    this.clearGroup(this.floorGroup);
    this.clearGroup(this.ceilingGroup);
    this.clearGroup(this.gridLinesGroup);
    this.clearGroup(this.boxesGroup);

    this.group.position.set(
      grid.offsetX || 0,
      grid.offsetY || 0,
      grid.offsetZ || 0
    );

    const lengthM = grid.lengthMm / 1000;
    const widthM = grid.widthMm / 1000;
    const floorY = InternalBoxesBuilder.FLOOR_Y;

    // 1. Piso Campervan & Mesa Central
    this.floorAndGridBuilder.buildFloor(grid, widthM, lengthM, floorY);
    this.floorMesh = this.floorAndGridBuilder.floorMesh;

    // 2. Grid subdividido no piso
    this.floorAndGridBuilder.buildGrid(grid, widthM, lengthM, floorY);

    // 3. Caixas 3D
    this.buildBoxes(grid, boxes, floorY, selectedBoxId, previewOpen, isolatedBoxId);

    // 4. Teto / forro do campervan
    this.ceilingBuilder.buildCeiling(grid, widthM, lengthM, floorY, previewOpen);

    // 5. Quando estiver dentro de um módulo, mantém piso, grid e teto fantasmas para não obstruírem
    if (activeFocusBoxId) {
      this.applyGhostTransparency(this.floorGroup, 0.08, 0.04);
      this.applyGhostTransparency(this.gridLinesGroup, 0.08, 0.04);
      this.applyGhostTransparency(this.ceilingGroup, 0.08, 0.04);
    }
  }

  private applyGhostTransparency(group: THREE.Object3D, meshOpacity: number = 0.08, lineOpacity: number = 0.04) {
    group.traverse((child: any) => {
      if (child.name === '__box_hitbox' || child.userData?.isInternalBoxHitbox) return;
      child.userData = { ...(child.userData || {}), isGhost: true };
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        const origMat = child.material;
        if (origMat) {
          const cloneMeshMat = (m: any) => {
            const clone = m.clone();
            clone.transparent = true;
            clone.opacity = Math.min(typeof clone.opacity === 'number' ? clone.opacity : 1, meshOpacity);
            clone.depthWrite = false;
            if (clone.roughness !== undefined) clone.roughness = 0.9;
            if (clone.metalness !== undefined) clone.metalness = 0.0;
            return clone;
          };
          child.material = Array.isArray(origMat) ? origMat.map(cloneMeshMat) : cloneMeshMat(origMat);
        }
      } else if (child.isLine || child.isLineSegments) {
        const origMat = child.material;
        if (origMat) {
          const cloneLineMat = (m: any) => {
            const clone = m.clone();
            clone.transparent = true;
            clone.opacity = Math.min(typeof clone.opacity === 'number' ? clone.opacity : 1, lineOpacity);
            return clone;
          };
          child.material = Array.isArray(origMat) ? origMat.map(cloneLineMat) : cloneLineMat(origMat);
        }
      }
    });
  }

  private clearGroup(g: THREE.Group) {
    while (g.children.length > 0) {
      const child = g.children[0];
      g.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: any) => m.dispose());
        } else {
          (child as any).material.dispose();
        }
      }
    }
  }

  private buildBoxes(
    grid: InternalGridConfig,
    boxes: InternalBoxItem[],
    floorY: number,
    selectedBoxId: string | null,
    previewOpen: boolean | InternalBoxesPreviewOptions,
    isolatedBoxId: string | null = null
  ) {
    const cols = Math.max(1, grid.colsX);
    const rows = Math.max(1, grid.rowsZ);
    const widthM = grid.widthMm / 1000;
    const lengthM = grid.lengthMm / 1000;

    const cellWM = widthM / cols;
    const cellLM = lengthM / rows;

    const isOptionsObj = typeof previewOpen === 'object' && previewOpen !== null;
    const globalCabinetsOpen = isOptionsObj ? Boolean(previewOpen.openCabinets) : Boolean(previewOpen);
    const globalBedOpen = isOptionsObj ? Boolean(previewOpen.openBed) : Boolean(previewOpen);
    const showMattress = isOptionsObj ? (previewOpen.showMattress ?? true) : true;

    const activeFocusBoxId = isolatedBoxId || selectedBoxId;

    // Garante que o módulo em foco/selecionado seja construído por último, ficando com prioridade visual total no Three.js
    const sortedBoxes = [...boxes].sort((a, b) => {
      if (a.id === activeFocusBoxId) return 1;
      if (b.id === activeFocusBoxId) return -1;
      return 0;
    });

    const isAnyBedOpen = globalBedOpen || boxes.some((b) => b.type === 'slat_bed' && Boolean(b.isOpen));

    sortedBoxes.forEach((box) => {
      const colStart = Math.min(cols - 1, Math.max(0, box.colStart));
      const colSpan = Math.min(cols - colStart, Math.max(1, box.colSpan));
      const rowStart = Math.min(rows - 1, Math.max(0, box.rowStart));
      const rowSpan = Math.min(rows - rowStart, Math.max(1, box.rowSpan));

      // Dimensões exatas pelas células do grid: sem folgas/espaçamento entre caixas vizinhas
      const boxWM = Math.max(0.05, colSpan * cellWM);
      const boxLM = Math.max(0.05, rowSpan * cellLM);
      const boxHM = Math.max(0.05, (box.heightMm ?? grid.heightMm) / 1000);

      // Posicionamento X: Da esquerda para a direita na visão traseira (+X para -X)
      const posX = (widthM / 2) - (colStart + colSpan / 2) * cellWM;
      const posZ = -(rowStart + rowSpan / 2) * cellLM;
      const posY = floorY + boxHM / 2;

      const isTargetModule = activeFocusBoxId ? box.id === activeFocusBoxId : false;
      const isGhost = activeFocusBoxId ? box.id !== activeFocusBoxId : false;
      const isSelected = isTargetModule ? false : false;

      const isDrawerOpen = (box.type === 'drawer' || box.type === 'slide_tray') && Boolean(box.isOpen);
      const isChestOpen = box.type === 'chest' && Boolean(box.isOpen);
      const isUpperCabinetOpen = globalCabinetsOpen || Boolean(box.isUpperCabinetOpen);
      const isBedOpen = globalBedOpen || (box.type === 'slat_bed' && Boolean(box.isOpen));
      const isShelfOpen = box.isRearShelfOpen !== undefined ? box.isRearShelfOpen : false;

      const boxContainer = new THREE.Group();
      boxContainer.name = `BoxContainer_${box.id}`;
      boxContainer.position.set(posX, posY, posZ);

      // Metadados para raycasting e inspeção
      boxContainer.userData = {
        isInternalBox: true,
        isTargetModule,
        boxId: box.id,
        boxName: box.name,
        boxType: box.type,
        dimensions: {
          widthMm: Math.round(boxWM * 1000),
          lengthMm: Math.round(boxLM * 1000),
          heightMm: Math.round(boxHM * 1000),
          volumeLiters: Math.round(boxWM * boxLM * boxHM * 1000)
        }
      };

      // Hitbox sólida transparente: cobre todo o volume da caixa para clique e hover imediatos
      // quando nenhum módulo está aberto. Ao entrar em um módulo, omitimos a hitbox externa
      // para permitir hover e clique direto nas peças individuais de madeira.
      if (!activeFocusBoxId) {
        const hitGeo = new THREE.BoxGeometry(boxWM, boxHM, boxLM);
        const hitMat = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false
        });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.name = '__box_hitbox';
        hitMesh.userData = {
          isInternalBoxHitbox: true,
          isInternalBox: true,
          boxId: box.id,
          boxName: box.name,
          boxType: box.type,
          boxRoot: boxContainer,
          dimensions: boxContainer.userData.dimensions
        };
        boxContainer.add(hitMesh);
      }

      // Material principal do corpo da caixa
      const boxMat = createBoxMaterial(box, isSelected);

      if (box.type === 'drawer' || box.type === 'slide_tray') {
        // --- MÓDULO GAVETÃO DESLIZANTE OU BANDEJA CORREDIÇA ---
        this.drawerBuilder.buildDrawerModule(boxContainer, boxWM, boxLM, boxHM, boxMat, box, isSelected, isDrawerOpen);
      } else if (box.type === 'slat_bed') {
        // --- MÓDULO CAMA RETRÁTIL COM RIPAS ---
        this.slatBedBuilder.buildSlatBedModule(boxContainer, boxWM, boxLM, boxHM, boxMat, box, isSelected, isBedOpen, cellWM, cellLM, showMattress, boxes, grid);
      } else {
        // --- MÓDULO BAÚ COM TAMPA OU NICHO ABERTO ---
        this.chestBuilder.buildChestModule(
          boxContainer,
          boxWM,
          boxLM,
          boxHM,
          boxMat,
          box,
          isSelected,
          isChestOpen,
          box.chestHingeDirection || 'front'
        );
      }

      // --- DECORAÇÃO TRASEIRA: MESA / PRATELEIRA REBATÍVEL (ABRE PARA CIMA) ---
      if (box.rearFoldShelf) {
        this.accessoriesBuilder.buildRearFoldShelf(boxContainer, boxWM, boxLM, boxHM, box, isSelected, isShelfOpen);
      }

      // --- ARMÁRIO AÉREO SUPERIOR DE QUINA ATÉ O TETO DA DOBLÒ ---
      if (box.upperCabinet) {
        this.upperCabinetBuilder.buildUpperCabinet(boxContainer, boxWM, boxLM, boxHM, box, isSelected, isUpperCabinetOpen, grid);
      }

      // --- PERFIL DE QUINA LED NA PARTE DE BAIXO DO MÓDULO ---
      if (box.hasLedCorner || box.ledCorner?.enabled) {
        this.accessoriesBuilder.buildBoxLedCorner(boxContainer, boxWM, boxLM, boxHM, box, isSelected);
      }

      // --- COMPONENTES ELÉTRICOS & INSTALAÇÃO TÉCNICA (Bateria LiFePO4, MPPT, B2B, Usina) ---
      if (box.electronics && box.electronics.length > 0) {
        this.electronicsBuilder.buildBoxElectronics(boxContainer, boxWM, boxLM, boxHM, box, isSelected);
      }

      // --- GELADEIRA 12V / 24V EMBARCADA ---
      if (box.hasFridge) {
        this.accessoriesBuilder.buildFridgeAppliance(boxContainer, boxWM, boxLM, boxHM, box, isSelected);
      }

      // --- VASO SANITÁRIO QUÍMICO PORTÁTIL (PORTA POTTI) EMBARCADO ---
      if (box.hasPortaPotti) {
        this.accessoriesBuilder.buildPortaPottiAppliance(boxContainer, boxWM, boxLM, boxHM, box, isSelected);
      }

      // --- FOGAREIRO PORTÁTIL (NTK DUO CERAMIK) EMBARCADO ---
      if (box.hasStove) {
        this.accessoriesBuilder.buildStoveAppliance(
          boxContainer,
          boxWM,
          boxLM,
          boxHM,
          box,
          isSelected,
          isDrawerOpen || isChestOpen,
          isAnyBedOpen
        );
      }

      // Se estiver em modo de módulo ativo (activeFocusBoxId):
      // Apenas o módulo em foco permanece 100% opaco e interativo; todas as demais caixas tornam-se fantasmas (8% de opacidade).
      if (isGhost) {
        this.applyGhostTransparency(boxContainer, 0.08, 0.04);
      }

      this.boxesGroup.add(boxContainer);
    });
  }
}
