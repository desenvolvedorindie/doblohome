import * as THREE from 'three';
import {
  InternalBoxItem,
  InternalGridConfig,
  ChestHingeDirection,
  BoxPanelsConfig,
  SlatBedDirection,
  CentralTableConfig,
  BoxLedConfig,
  BoxLedEdge,
  getFoldingBracketForHeight,
  FoldingBracketSpec,
  UpperCabinetSide,
  InternalBoxesPreviewOptions,
  InstalledElectronicItem,
  ELECTRONIC_COMPONENTS_CATALOG,
  CeilingConfig,
  CeilingType,
  CeilingSheetMaterial,
  CeilingSlattedWood,
  CeilingLedType,
  CeilingLedConfig,
  getUpperCabinetClosure,
  UpperCabinetClosure
} from '../types';
import { PowerStorageBuilder } from './PowerStorage';

/**
 * Construtor 3D dos Armazenadores e Caixas Internas da Fiat Doblò
 * Renderiza o piso do compartimento, grid modular milimétrico, caixas 3D,
 * tampas basculantes de baús e gavetões deslizantes com puxadores.
 */
export class InternalBoxesBuilder {
  group: THREE.Group;
  boxesGroup: THREE.Group;
  floorGroup: THREE.Group;
  ceilingGroup: THREE.Group;
  gridLinesGroup: THREE.Group;
  floorMesh?: THREE.Mesh;

  // Altura do assoalho interno e teto da Doblò em relação à origem (Y = 0)
  static readonly FLOOR_Y = 0.48;
  static readonly CEILING_Y = 1.72;

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
  }

  /**
   * Reconstrói todo o sistema de caixas e grid interno
   */
  update(
    grid: InternalGridConfig,
    boxes: InternalBoxItem[],
    selectedBoxId: string | null = null,
    previewOpen: boolean | InternalBoxesPreviewOptions = false,
    isolatedBoxId: string | null = null
  ) {
    this.clearGroup(this.floorGroup);
    this.clearGroup(this.ceilingGroup);
    this.clearGroup(this.gridLinesGroup);
    this.clearGroup(this.boxesGroup);

    // Aplica o deslocamento tridimensional (offset X, Y, Z) do conjunto no interior da Doblò
    this.group.position.set(
      grid.offsetX || 0,
      grid.offsetY || 0,
      grid.offsetZ || 0
    );

    const lengthM = grid.lengthMm / 1000;
    const widthM = grid.widthMm / 1000;
    const floorY = InternalBoxesBuilder.FLOOR_Y;

    // 1. Constrói a base do piso campervan (com perfil de LED no rodapé)
    this.buildFloor(grid, widthM, lengthM, floorY);

    // 2. Constrói o grid subdividido no piso
    this.buildGrid(grid, widthM, lengthM, floorY);

    // 3. Constrói as caixas 3D
    this.buildBoxes(grid, boxes, floorY, selectedBoxId, previewOpen, isolatedBoxId);

    // 4. Constrói o teto / forro do campervan (ripado ou chapa MDF/compensado com LED)
    this.buildCeiling(grid, widthM, lengthM, floorY, previewOpen);
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

  /**
   * Constrói o piso de apoio campervan com chapa de compensado naval de 15mm, caixas de roda
   * e perfil de iluminação LED embutido no rodapé do assoalho.
   */
  private buildFloor(grid: InternalGridConfig, widthM: number, lengthM: number, floorY: number) {
    const centerZ = -lengthM / 2;
    const floorThicknessMm = grid.floorThicknessMm || 15;
    const floorThickness = floorThicknessMm / 1000;

    // Chapa de compensado naval na base do assoalho (serve de fundo para todas as caixas)
    const floorGeo = new THREE.BoxGeometry(widthM, floorThickness, lengthM);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x92613b, // Madeira compensado naval quente e sólida
      roughness: 0.80,
      metalness: 0.04
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, floorY - floorThickness / 2, centerZ);
    floorMesh.receiveShadow = true;
    floorMesh.name = 'BaseNavalPlywoodFloor';
    floorMesh.userData = {
      isWoodPart: true,
      dimW: widthM,
      dimH: floorThickness,
      dimL: lengthM,
      thicknessMm: floorThicknessMm,
      partLabel: `Chapa Base do Assoalho Doblò (Compensado Naval ${floorThicknessMm}mm)`,
      isInternalFloorPlywood: true,
      isBasePlywood: true,
      name: `Chapa de Compensado Naval ${floorThicknessMm}mm`,
      category: '🪵 Assoalho Base Campervan',
      barProfile: `${Math.round(widthM * 1000)} × ${Math.round(lengthM * 1000)} × ${floorThicknessMm} mm`,
      capacity: 'Fundo Comum dos Módulos',
      material: `Compensado Naval ${floorThicknessMm}mm Impermeabilizado`,
      woodMaterial: 'Compensado Naval',
      moduleName: 'Assoalho Base',
      partType: 'floor',
      purpose: 'Base estrutural de nivelamento da Doblò que serve como fundo unificado para todos os baús e nichos'
    };
    this.floorMesh = floorMesh;
    this.floorGroup.add(floorMesh);

    // Borda perimetral de acabamento em alumínio
    const edgeGeo = new THREE.EdgesGeometry(floorGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
    edgeLine.position.copy(floorMesh.position);
    this.floorGroup.add(edgeLine);

    // Caixas de roda estilizadas (referência dimensional real da Doblò)
    const wheelArchGeo = new THREE.BoxGeometry(0.18, 0.32, 0.72);
    const wheelArchMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.2
    });

    // Lado Esquerdo (Motorista — esquerda do observador olhando da traseira)
    const archLeft = new THREE.Mesh(wheelArchGeo, wheelArchMat);
    archLeft.position.set(widthM / 2 + 0.09, floorY + 0.16, -1.15);
    this.floorGroup.add(archLeft);

    // Lado Direito (Passageiro — direita do observador olhando da traseira)
    const archRight = new THREE.Mesh(wheelArchGeo, wheelArchMat);
    archRight.position.set(-(widthM / 2 + 0.09), floorY + 0.16, -1.15);
    this.floorGroup.add(archRight);

    // ─── MESA DINETTE CENTRAL (FIXADA NA CHAPA DE COMPENSADO NAVAL 15mm) ───
    if (grid.centralTable?.enabled) {
      this.buildFloorCentralTable(this.floorGroup, widthM, lengthM, floorY, grid.centralTable);
    }
  }

  /**
   * Constrói as linhas e etiquetas do grid paramétrico no piso
   */
  private buildGrid(grid: InternalGridConfig, widthM: number, lengthM: number, floorY: number) {
    const cols = Math.max(1, grid.colsX);
    const rows = Math.max(1, grid.rowsZ);

    const cellWM = widthM / cols;
    const cellLM = lengthM / rows;
    const y = floorY + 0.001; // ligeiramente acima do piso

    const gridLinesMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45
    });

    const gridPoints: THREE.Vector3[] = [];

    // Linhas paralelas ao eixo Z (ao longo do comprimento, da esquerda para a direita)
    for (let c = 0; c <= cols; c++) {
      const x = widthM / 2 - c * cellWM;
      gridPoints.push(new THREE.Vector3(x, y, 0));
      gridPoints.push(new THREE.Vector3(x, y, -lengthM));
    }

    // Linhas paralelas ao eixo X (ao longo da largura)
    for (let r = 0; r <= rows; r++) {
      const z = -r * cellLM;
      gridPoints.push(new THREE.Vector3(-widthM / 2, y, z));
      gridPoints.push(new THREE.Vector3(widthM / 2, y, z));
    }

    const gridGeo = new THREE.BufferGeometry().setFromPoints(gridPoints);
    const gridLineSegments = new THREE.LineSegments(gridGeo, gridLinesMat);
    this.gridLinesGroup.add(gridLineSegments);
  }

  /**
   * Constrói as caixas com seus detalhes em 3D
   */
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

    // Garante que o módulo selecionado seja construído por último, ficando com prioridade visual total no Three.js
    const sortedBoxes = [...boxes].sort((a, b) => {
      if (a.id === selectedBoxId) return 1;
      if (b.id === selectedBoxId) return -1;
      return 0;
    });

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

      const isIsolatedTarget = isolatedBoxId ? box.id === isolatedBoxId : false;
      const isSelected = box.id === selectedBoxId || isIsolatedTarget;

      const isDrawerOpen = globalCabinetsOpen || Boolean(box.isOpen);
      const isChestOpen = globalCabinetsOpen || Boolean(box.isOpen);
      const isUpperCabinetOpen = globalCabinetsOpen || Boolean(box.isOpen);
      const isBedOpen = globalBedOpen || Boolean(box.isOpen);
      const isShelfOpen = box.isRearShelfOpen !== undefined ? box.isRearShelfOpen : globalCabinetsOpen;

      const boxContainer = new THREE.Group();
      boxContainer.name = `BoxContainer_${box.id}`;
      boxContainer.position.set(posX, posY, posZ);

      // Metadados para raycasting e inspeção
      boxContainer.userData = {
        isInternalBox: true,
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

      // Hitbox sólida transparente: cobre com precisão todo o volume da caixa,
      // garantindo clique e hover imediatos sem perfurar o interior oco
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

      // Material principal do corpo da caixa
      const boxMat = this.createBoxMaterial(box, isSelected);

      if (box.type === 'drawer' || box.type === 'slide_tray') {
        // --- MÓDULO GAVETÃO DESLIZANTE OU BANDEJA CORREDIÇA ---
        this.buildDrawerModule(boxContainer, boxWM, boxLM, boxHM, boxMat, box, isSelected, isDrawerOpen);
      } else if (box.type === 'slat_bed') {
        // --- MÓDULO CAMA RETRÁTIL COM RIPAS ---
        this.buildSlatBedModule(boxContainer, boxWM, boxLM, boxHM, boxMat, box, isSelected, isBedOpen, cellWM, cellLM, showMattress);
      } else {
        // --- MÓDULO BAÚ COM TAMPA OU NICHO ABERTO ---
        this.buildChestModule(
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
        this.buildRearFoldShelf(boxContainer, boxWM, boxLM, boxHM, box, isSelected, isShelfOpen);
      }

      // --- ARMÁRIO AÉREO SUPERIOR DE QUINA ATÉ O TETO DA DOBLÒ ---
      if (box.upperCabinet) {
        this.buildUpperCabinet(boxContainer, boxWM, boxLM, boxHM, box, isSelected, isUpperCabinetOpen);
      }

      // --- PERFIL DE QUINA LED NA PARTE DE BAIXO DO MÓDULO ---
      if (box.hasLedCorner || box.ledCorner?.enabled) {
        this.buildBoxLedCorner(boxContainer, boxWM, boxLM, boxHM, box, isSelected);
      }

      // --- COMPONENTES ELÉTRICOS & INSTALAÇÃO TÉCNICA (Bateria LiFePO4, MPPT, B2B, Usina) ---
      if (box.electronics && box.electronics.length > 0) {
        this.buildBoxElectronics(boxContainer, boxWM, boxLM, boxHM, box, isSelected);
      }

      // Se estiver em modo de foco isolado (isolatedBoxId ativo):
      // Apenas a caixa isolada permanece 100% opaca e destacada.
      // Todas as demais caixas tornam-se altamente transparentes (10% de opacidade) e sem sombras pesadas.
      if (isolatedBoxId && !isIsolatedTarget) {
        boxContainer.traverse((child: any) => {
          if (child.isMesh && child.name !== '__box_hitbox') {
            child.castShadow = false;
            child.receiveShadow = false;
            const origMat = child.material;
            if (origMat) {
              if (Array.isArray(origMat)) {
                child.material = origMat.map((m: any) => {
                  const clone = m.clone();
                  clone.transparent = true;
                  clone.opacity = 0.10;
                  clone.depthWrite = false;
                  if (clone.roughness !== undefined) clone.roughness = 0.9;
                  if (clone.metalness !== undefined) clone.metalness = 0.0;
                  return clone;
                });
              } else {
                const clone = origMat.clone();
                clone.transparent = true;
                clone.opacity = 0.10;
                clone.depthWrite = false;
                if (clone.roughness !== undefined) clone.roughness = 0.9;
                if (clone.metalness !== undefined) clone.metalness = 0.0;
                child.material = clone;
              }
            }
          }
        });
      }

      this.boxesGroup.add(boxContainer);
    });
  }

  private createBoxMaterial(box: InternalBoxItem, isSelected: boolean): THREE.Material {
    const color = isSelected ? 0x38bdf8 : new THREE.Color(box.color).getHex();

    switch (box.material) {
      case 'plywood':
        return new THREE.MeshStandardMaterial({
          color: isSelected ? 0x38bdf8 : 0xd4a373,
          roughness: 0.75,
          metalness: 0.05
        });
      case 'dark_wood':
        return new THREE.MeshStandardMaterial({
          color: isSelected ? 0x38bdf8 : 0x78350f,
          roughness: 0.65,
          metalness: 0.05
        });
      case 'white_mdf':
        return new THREE.MeshStandardMaterial({
          color: isSelected ? 0x38bdf8 : 0xf8fafc,
          roughness: 0.35,
          metalness: 0.1
        });
      case 'aluminum_box':
        return new THREE.MeshStandardMaterial({
          color: isSelected ? 0x38bdf8 : 0x94a3b8,
          roughness: 0.25,
          metalness: 0.8
        });
      default:
        return new THREE.MeshStandardMaterial({
          color,
          roughness: 0.5,
          metalness: 0.2
        });
    }
  }

  // Espessura padrão das folhas de compensado naval da marcenaria camper
  static readonly PLYWOOD_THICKNESS = 0.015; // 15mm

  /**
   * Obtém a espessura configurada em metros para cada face do módulo
   */
  static getBoxThickness(box?: InternalBoxItem) {
    const dMm = box?.thicknessMm || 15;
    const p = box?.panelThickness;
    return {
      default: dMm / 1000,
      top: ((p?.top ?? dMm) || 15) / 1000,
      bottom: ((p?.bottom ?? dMm) || 15) / 1000,
      left: ((p?.left ?? dMm) || 15) / 1000,
      right: ((p?.right ?? dMm) || 15) / 1000,
      front: ((p?.front ?? dMm) || 15) / 1000,
      rear: ((p?.rear ?? dMm) || 15) / 1000,
      cabinet: ((p?.cabinet ?? dMm) || 15) / 1000,
      slat: ((p?.slat ?? dMm) || 15) / 1000,
      shelf: ((p?.shelf ?? 18) || 18) / 1000
    };
  }

  /**
   * Converte o identificador do material para o nome comercial legível
   */
  static getWoodMaterialName(material?: string): string {
    if (!material) return 'Compensado Naval';
    const matLower = material.toLowerCase();
    if (matLower.includes('mdf') || matLower === 'white_mdf') return 'MDF Branco Ultra';
    if (matLower.includes('maciça') || matLower.includes('macica') || matLower.includes('dark_wood') || matLower.includes('nobre') || matLower.includes('imbuia') || matLower.includes('teca')) return 'Madeira Nobre Maciça';
    if (matLower.includes('aluminum') || matLower.includes('aluminio')) return 'Gabinete Alumínio Modular';
    return 'Compensado Naval';
  }

  /**
   * Calcula as zonas retangulares do tampo onde o armário aéreo encosta diretamente
   * sobre a tampa da caixa, para que nenhuma furação ocorra nessas áreas.
   */
  static getUpperCabinetExclusionZones(
    box: InternalBoxItem,
    boxWM: number,
    boxLM: number
  ): Array<{ minX: number; maxX: number; minZ: number; maxZ: number }> {
    if (!box.upperCabinet) return [];

    // Se houver espaçamento inferior significativo (> 25mm), o armário não encosta na tampa de cima
    const bottomGapMm = box.upperCabinetBottomGapMm ?? 0;
    if (bottomGapMm > 25) return [];

    const positionMode = box.upperCabinetPositionMode || 'on_box';
    const transverseMode = box.upperCabinetTransverseMode || 'on_box';
    if (positionMode === 'behind_box' || transverseMode === 'beside_box') {
      return [];
    }

    const offsetM = (box.upperCabinetOffsetMm ?? 0) / 1000;
    const depthOffsetM = (box.upperCabinetDepthOffsetMm ?? 0) / 1000;

    const activeSides: UpperCabinetSide[] = (() => {
      if (box.upperCabinetSides && box.upperCabinetSides.length > 0) {
        return Array.from(new Set(box.upperCabinetSides));
      }
      if (box.upperCabinetAlign === 'all') return ['rear', 'front', 'left', 'right'];
      if (box.upperCabinetAlign === 'left') return ['left'];
      if (box.upperCabinetAlign === 'right') return ['right'];
      if (box.upperCabinetAlign === 'front') return ['front'];
      return ['rear'];
    })();

    const zones: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }> = [];

    activeSides.forEach(side => {
      if (side === 'rear' || side === 'front') {
        const maxDepthMm = Math.max(Math.round(boxLM * 1000), 1200);
        const depthMm = Math.max(100, Math.min(maxDepthMm, box.upperCabinetDepthMm ?? 250));
        const cabinetDepthM = depthMm / 1000;

        const maxWMm = Math.max(Math.round(boxWM * 1000), 1600);
        const widthMm = Math.max(100, Math.min(maxWMm, box.upperCabinetWidthMm ?? Math.round(boxWM * 1000)));
        const cabinetWidthM = widthMm / 1000;

        const cabinetCenterX = (-boxWM / 2 + cabinetWidthM / 2) + offsetM;
        const cabinetCenterZ = side === 'rear'
          ? (-boxLM / 2 + cabinetDepthM / 2 + depthOffsetM)
          : (boxLM / 2 - cabinetDepthM / 2 - depthOffsetM);

        zones.push({
          minX: cabinetCenterX - cabinetWidthM / 2 - 0.015,
          maxX: cabinetCenterX + cabinetWidthM / 2 + 0.015,
          minZ: cabinetCenterZ - cabinetDepthM / 2 - 0.015,
          maxZ: cabinetCenterZ + cabinetDepthM / 2 + 0.015
        });
      } else {
        const maxDepthMm = Math.max(Math.round(boxWM * 1000), 800);
        const depthMm = Math.max(100, Math.min(maxDepthMm, box.upperCabinetDepthMm ?? 250));
        const cabinetDepthM = depthMm / 1000;

        const maxLMm = Math.max(Math.round(boxLM * 1000), 2000);
        const lengthMm = Math.max(100, Math.min(maxLMm, box.upperCabinetWidthMm ?? Math.round(boxLM * 1000)));
        const cabinetLengthM = lengthMm / 1000;

        const cabinetCenterX = side === 'left'
          ? (boxWM / 2 - cabinetDepthM / 2 - depthOffsetM)
          : (-boxWM / 2 + cabinetDepthM / 2 + depthOffsetM);
        const cabinetCenterZ = (-boxLM / 2 + cabinetLengthM / 2) + offsetM;

        zones.push({
          minX: cabinetCenterX - cabinetDepthM / 2 - 0.015,
          maxX: cabinetCenterX + cabinetDepthM / 2 + 0.015,
          minZ: cabinetCenterZ - cabinetLengthM / 2 - 0.015,
          maxZ: cabinetCenterZ + cabinetLengthM / 2 + 0.015
        });
      }
    });

    return zones;
  }

  /**
   * Constrói a geometria de uma chapa com furos circulares passantes CNC para alívio de peso e aeração do colchão.
   * Centralizada em (0, 0, 0), com largura w (eixo X), espessura h (eixo Y) e comprimento l (eixo Z).
   */
  static createPerforatedGeometry(
    w: number,
    h: number,
    l: number,
    options?: {
      holeDiameterMm?: number;
      spacingMm?: number;
      exclusionZones?: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }>;
    }
  ): THREE.BufferGeometry {
    const hw = w / 2;
    const hl = l / 2;

    const shape = new THREE.Shape();
    shape.moveTo(-hw, -hl);
    shape.lineTo(hw, -hl);
    shape.lineTo(hw, hl);
    shape.lineTo(-hw, hl);
    shape.closePath();

    // Diâmetro configurável do furo (padrão 40mm / 4cm)
    const diameterMm = Math.max(15, Math.min(85, options?.holeDiameterMm ?? 40));
    const customHoleRadius = (diameterMm / 1000) / 2;

    // Espaçamento configurável entre centros (padrão 85mm)
    const spacingMm = Math.max(diameterMm + 12, Math.min(180, options?.spacingMm ?? 85));
    const targetSpacing = spacingMm / 1000;

    const margin = Math.min(0.05, Math.min(w, l) * 0.12);
    const usableW = Math.max(0.02, w - 2 * margin);
    const usableL = Math.max(0.02, l - 2 * margin);

    const cols = Math.max(1, Math.round(usableW / targetSpacing));
    const rows = Math.max(1, Math.round(usableL / targetSpacing));
    const stepX = usableW / cols;
    const stepZ = usableL / rows;

    // Garante borda estrutural de madeira de segurança
    const maxSafeRadius = Math.max(0.008, Math.min(stepX, stepZ) * 0.46);
    const holeRadius = Math.min(customHoleRadius, maxSafeRadius);

    const exclusionZones = options?.exclusionZones || [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = -hw + margin + (c + 0.5) * stepX;
        const cz = -hl + margin + (r + 0.5) * stepZ;

        // Se o furo estiver sob a área de contato do armário aéreo encostado na tampa, NÃO perfura
        const isExcluded = exclusionZones.some(zone =>
          (cx + holeRadius >= zone.minX) &&
          (cx - holeRadius <= zone.maxX) &&
          (cz + holeRadius >= zone.minZ) &&
          (cz - holeRadius <= zone.maxZ)
        );

        if (isExcluded) continue;

        // Nota: ExtrudeGeometry é girado em -90° no eixo X (rotateX(-PI/2)),
        // o que projeta o eixo Y 2D da Shape diretamente no eixo -Z 3D.
        // Portanto, para que o centro 3D do furo coincida com o cz calculado e testado,
        // o centro Y no plano 2D é -cz (pois -(-cz) = +cz em 3D).
        const holePath = new THREE.Path();
        holePath.absarc(cx, -cz, holeRadius, 0, Math.PI * 2, true);
        shape.holes.push(holePath);
      }
    }

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: h,
      bevelEnabled: false,
      curveSegments: 16
    });

    // ExtrudeGeometry extruda para +Z. Giramos -90° em X para o plano horizontal XZ
    // e transladamos em Y para centralizar perfeitamente [-h/2, +h/2].
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -h / 2, 0);

    return geo;
  }

  private addPerforatedPanel(
    parent: THREE.Group,
    w: number,
    h: number,
    l: number,
    posX: number,
    posY: number,
    posZ: number,
    mat: THREE.Material,
    edgeMat?: THREE.LineBasicMaterial,
    boxId?: string,
    boxRoot?: THREE.Group,
    panelLabel?: string,
    box?: InternalBoxItem,
    extraUserData?: Record<string, any>
  ): THREE.Mesh {
    const exclusionZones = box ? InternalBoxesBuilder.getUpperCabinetExclusionZones(box, w, l) : [];
    const hasCabinetExclusion = exclusionZones.length > 0;
    const geo = InternalBoxesBuilder.createPerforatedGeometry(w, h, l, {
      holeDiameterMm: box?.perforationHoleDiameterMm,
      spacingMm: box?.perforationSpacingMm,
      exclusionZones
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(posX, posY, posZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const woodMaterial = InternalBoxesBuilder.getWoodMaterialName(box?.material);
    const thickMm = extraUserData?.thicknessMm || Math.round(Math.min(w, h, l) * 1000);
    mesh.userData = {
      isWoodPart: true,
      dimW: w,
      dimH: h,
      dimL: l,
      thicknessMm: thickMm,
      partLabel: panelLabel || (hasCabinetExclusion
        ? `Tampo Superior Vazado CNC c/ Apoio Maciço de Armário (${thickMm}mm)`
        : `Tampo Superior Vazado ${thickMm}mm (Alívio de Peso)`),
      material: `${woodMaterial} ${thickMm}mm ${hasCabinetExclusion ? 'Vazado CNC c/ Apoio do Aéreo' : 'Vazado (Alívio Peso)'}`,
      woodMaterial,
      moduleName: box?.name || '',
      partType: extraUserData?.partType || 'top',
      isInternalBox: Boolean(boxId),
      boxId,
      boxRoot,
      isPerforated: true,
      hasCabinetExclusion,
      exclusionZones,
      holeDiameterMm: box?.perforationHoleDiameterMm || 40,
      spacingMm: box?.perforationSpacingMm || 85,
      ...extraUserData
    };
    parent.add(mesh);

    if (edgeMat) {
      const edgeGeo = new THREE.EdgesGeometry(geo, 25);
      const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
      edgeLine.position.set(posX, posY, posZ);
      parent.add(edgeLine);
    }

    return mesh;
  }

  private addPanel(
    parent: THREE.Group,
    w: number,
    h: number,
    l: number,
    posX: number,
    posY: number,
    posZ: number,
    mat: THREE.Material,
    edgeMat?: THREE.LineBasicMaterial,
    boxId?: string,
    boxRoot?: THREE.Group,
    panelLabel?: string,
    extraUserData?: Record<string, any>
  ): THREE.Mesh {
    const geo = new THREE.BoxGeometry(w, h, l);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(posX, posY, posZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const sortedDims = [w, h, l].sort((a, b) => a - b);
    const thickMm = extraUserData?.thicknessMm || Math.round(sortedDims[0] * 1000);
    const woodMaterial = extraUserData?.woodMaterial || 'Compensado Naval';
    mesh.userData = {
      isWoodPart: true,
      dimW: w,
      dimH: h,
      dimL: l,
      thicknessMm: thickMm,
      partLabel: panelLabel || `Chapa ${woodMaterial} ${thickMm}mm`,
      material: extraUserData?.material || `${woodMaterial} ${thickMm}mm Impermeabilizado`,
      woodMaterial,
      moduleName: extraUserData?.moduleName || '',
      partType: extraUserData?.partType || 'panel',
      isInternalBox: Boolean(boxId),
      boxId,
      boxRoot,
      ...extraUserData
    };
    parent.add(mesh);

    if (edgeMat) {
      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
      edgeLine.position.set(posX, posY, posZ);
      parent.add(edgeLine);
    }

    return mesh;
  }

  /**
   * Constrói paredes perimetrais de 15mm conforme a configuração de tamponamento
   * Por padrão NÃO possui fundo, pois o fundo de todas as caixas é a própria
   * chapa de compensado naval de 15mm da base da Doblò.
   * includeBottom só é true para a gaveta corrediça móvel (que sai para fora da van no ar) ou se selecionado.
   */
  private buildHollowBox(
    parent: THREE.Group,
    w: number,
    h: number,
    l: number,
    t: number,
    mat: THREE.Material,
    edgeMat: THREE.LineBasicMaterial,
    includeBottom: boolean = false,
    boxId?: string,
    boxRoot?: THREE.Group,
    panelsConfig?: BoxPanelsConfig,
    boxName?: string,
    box?: InternalBoxItem
  ) {
    const hasBottom = panelsConfig?.bottom ?? includeBottom;
    const hasLeft = panelsConfig?.left ?? true;
    const hasRight = panelsConfig?.right ?? true;
    const hasFront = panelsConfig?.front ?? true;
    const hasRear = panelsConfig?.rear ?? true;

    const tConfig = InternalBoxesBuilder.getBoxThickness(box);
    const tBottom = tConfig.bottom;
    const tLeft = tConfig.left;
    const tRight = tConfig.right;
    const tFront = tConfig.front;
    const tRear = tConfig.rear;
    const woodMat = InternalBoxesBuilder.getWoodMaterialName(box?.material);

    const wallH = hasBottom ? Math.max(0.01, h - tBottom) : h;
    const wallY = hasBottom ? (-h / 2 + tBottom + wallH / 2) : 0;
    const prefix = boxName ? `${boxName} • ` : '';

    // Fundo: APENAS se hasBottom for true
    if (hasBottom) {
      const tBMm = Math.round(tBottom * 1000);
      this.addPanel(
        parent, w, tBottom, l, 0, -h / 2 + tBottom / 2, 0, mat, edgeMat, boxId, boxRoot,
        `${prefix}Fundo Base (${tBMm}mm)`,
        { thicknessMm: tBMm, woodMaterial: woodMat, moduleName: boxName, partType: 'bottom', material: `${woodMat} ${tBMm}mm Impermeabilizado` }
      );
    }

    // Lateral Esquerda (+X / motorista)
    if (hasLeft) {
      const tLMm = Math.round(tLeft * 1000);
      this.addPanel(
        parent, tLeft, wallH, l, w / 2 - tLeft / 2, wallY, 0, mat, edgeMat, boxId, boxRoot,
        `${prefix}Lateral Esquerda (${tLMm}mm)`,
        { thicknessMm: tLMm, woodMaterial: woodMat, moduleName: boxName, partType: 'left', material: `${woodMat} ${tLMm}mm Impermeabilizado` }
      );
    }

    // Lateral Direita (-X / passageiro)
    if (hasRight) {
      const tRMm = Math.round(tRight * 1000);
      this.addPanel(
        parent, tRight, wallH, l, -w / 2 + tRight / 2, wallY, 0, mat, edgeMat, boxId, boxRoot,
        `${prefix}Lateral Direita (${tRMm}mm)`,
        { thicknessMm: tRMm, woodMaterial: woodMat, moduleName: boxName, partType: 'right', material: `${woodMat} ${tRMm}mm Impermeabilizado` }
      );
    }

    // Cálculo exato da largura e centro interno das paredes frontal e traseira
    const xMin = hasRight ? (-w / 2 + tRight) : (-w / 2);
    const xMax = hasLeft ? (w / 2 - tLeft) : (w / 2);
    const innerW = Math.max(0.01, xMax - xMin);
    const centerInnerX = (xMin + xMax) / 2;

    // Parede Frontal (+Z, em direção aos bancos dianteiros)
    if (hasFront) {
      const tFMm = Math.round(tFront * 1000);
      this.addPanel(
        parent, innerW, wallH, tFront, centerInnerX, wallY, l / 2 - tFront / 2, mat, edgeMat, boxId, boxRoot,
        `${prefix}Parede Frontal (${tFMm}mm)`,
        { thicknessMm: tFMm, woodMaterial: woodMat, moduleName: boxName, partType: 'front', material: `${woodMat} ${tFMm}mm Impermeabilizado` }
      );
    }

    // Parede Traseira (-Z, em direção ao porta-malas)
    if (hasRear) {
      const tRMm = Math.round(tRear * 1000);
      this.addPanel(
        parent, innerW, wallH, tRear, centerInnerX, wallY, -l / 2 + tRear / 2, mat, edgeMat, boxId, boxRoot,
        `${prefix}Parede Traseira (${tRMm}mm)`,
        { thicknessMm: tRMm, woodMaterial: woodMat, moduleName: boxName, partType: 'rear', material: `${woodMat} ${tRMm}mm Impermeabilizado` }
      );
    }
  }

  private buildDrawerModule(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    mat: THREE.Material,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean
  ) {
    const tConfig = InternalBoxesBuilder.getBoxThickness(box);
    const tTop = tConfig.top;
    const tBottom = tConfig.bottom;
    const tLeft = tConfig.left;
    const tRight = tConfig.right;
    const tFront = tConfig.front;
    const tRear = tConfig.rear;
    const tDef = tConfig.default;
    const woodMat = InternalBoxesBuilder.getWoodMaterialName(box.material);
    const tTopMm = Math.round(tTop * 1000);
    const tBottomMm = Math.round(tBottom * 1000);
    const tLeftMm = Math.round(tLeft * 1000);
    const tRightMm = Math.round(tRight * 1000);
    const tFrontMm = Math.round(tFront * 1000);
    const tDefMm = Math.round(tDef * 1000);

    const edgeMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0x38bdf8 : 0x475569,
      linewidth: 1,
      transparent: true,
      opacity: 0.65
    });

    const isSlideTray = box.type === 'slide_tray' || box.drawerMode === 'slide_tray';
    const isDrawer = box.type === 'drawer' || isSlideTray;

    const hasTop = box.panels?.top ?? true;
    const hasLeft = box.panels?.left ?? true;
    const hasRight = box.panels?.right ?? true;
    const hasFront = box.panels?.front ?? true;
    // O vão traseiro (-Z, virado para o porta-malas) de gavetões e bandejas corrediças
    // deve ser SEMPRE 100% vazado/aberto para permitir que a bandeja ou gaveta deslize para fora da Doblò.
    const hasRear = isDrawer ? false : (box.panels?.rear ?? false);
    const hasBottom = box.panels?.bottom ?? false;

    // 1. Gabinete / Carcaça externa fixa
    const cabinetMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2
    });

    const sideH = Math.max(0.01, h - (hasTop ? tTop : 0) - (hasBottom ? tBottom : 0));
    const sideY = hasBottom ? (-h / 2 + tBottom + sideH / 2) : (hasTop ? -tTop / 2 : 0);

    // Tampo superior
    if (hasTop) {
      const exclusionZones = box ? InternalBoxesBuilder.getUpperCabinetExclusionZones(box, w, l) : [];
      const hasCabExcl = exclusionZones.length > 0;
      const topLabel = hasCabExcl
        ? `${box.name} • Tampo Superior Vazado CNC c/ Apoio do Aéreo (${tTopMm}mm)`
        : `${box.name} • Tampo Superior Vazado (${tTopMm}mm)`;
      if (box.topPerforated) {
        this.addPerforatedPanel(container, w, tTop, l, 0, h / 2 - tTop / 2, 0, cabinetMat, edgeMat, box.id, container, topLabel, box, {
          thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
        });
      } else {
        this.addPanel(container, w, tTop, l, 0, h / 2 - tTop / 2, 0, cabinetMat, edgeMat, box.id, container, `${box.name} • Tampo Superior (${tTopMm}mm)`, {
          thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: `${woodMat} ${tTopMm}mm Impermeabilizado`
        });
      }
    }
    // Fundo inferior próprio
    if (hasBottom) {
      this.addPanel(container, w, tBottom, l, 0, -h / 2 + tBottom / 2, 0, cabinetMat, edgeMat, box.id, container, `${box.name} • Base Carcaça (${tBottomMm}mm)`, {
        thicknessMm: tBottomMm, woodMaterial: woodMat, moduleName: box.name, partType: 'bottom', material: `${woodMat} ${tBottomMm}mm Impermeabilizado`
      });
    }
    // Lateral Esquerda (+X / motorista)
    if (hasLeft) {
      this.addPanel(container, tLeft, sideH, l, w / 2 - tLeft / 2, sideY, 0, cabinetMat, edgeMat, box.id, container, `${box.name} • Lateral Esq. Carcaça (${tLeftMm}mm)`, {
        thicknessMm: tLeftMm, woodMaterial: woodMat, moduleName: box.name, partType: 'left', material: `${woodMat} ${tLeftMm}mm Impermeabilizado`
      });
    }
    // Lateral Direita (-X / passageiro)
    if (hasRight) {
      this.addPanel(container, tRight, sideH, l, -w / 2 + tRight / 2, sideY, 0, cabinetMat, edgeMat, box.id, container, `${box.name} • Lateral Dir. Carcaça (${tRightMm}mm)`, {
        thicknessMm: tRightMm, woodMaterial: woodMat, moduleName: box.name, partType: 'right', material: `${woodMat} ${tRightMm}mm Impermeabilizado`
      });
    }

    // Cálculo do vão interno da carcaça para acomodar a gaveta
    const cabXMin = hasRight ? (-w / 2 + tRight) : (-w / 2);
    const cabXMax = hasLeft ? (w / 2 - tLeft) : (w / 2);
    const cabInnerW = Math.max(0.01, cabXMax - cabXMin);
    const cabCenterX = (cabXMin + cabXMax) / 2;

    // Fundo frontal (+Z, virado para os bancos dianteiros)
    if (hasFront) {
      this.addPanel(container, cabInnerW, sideH, tFront, cabCenterX, sideY, l / 2 - tFront / 2, cabinetMat, edgeMat, box.id, container, `${box.name} • Fundo Frontal Carcaça (${tFrontMm}mm)`, {
        thicknessMm: tFrontMm, woodMaterial: woodMat, moduleName: box.name, partType: 'front', material: `${woodMat} ${tFrontMm}mm Impermeabilizado`
      });
    }
    // Fechamento traseiro (-Z, virado para o porta-malas) se explicitamente ativado (nunca para gavetão ou bandeja corrediça, que devem ser 100% vazados para deslizamento)
    if (hasRear && !isDrawer) {
      const tRearMm = Math.round(tRear * 1000);
      this.addPanel(container, cabInnerW, sideH, tRear, cabCenterX, sideY, -l / 2 + tRear / 2, cabinetMat, edgeMat, box.id, container, `${box.name} • Fechamento Traseiro (${tRearMm}mm)`, {
        thicknessMm: tRearMm, woodMaterial: woodMat, moduleName: box.name, partType: 'rear', material: `${woodMat} ${tRearMm}mm Impermeabilizado`
      });
    }

    // 2. Gaveta interna deslizante (oca, com chapas, topo aberto e fundo móvel para carregar objetos)
    const drawerGroup = new THREE.Group();
    drawerGroup.name = 'DrawerSlide';

    // Deslocamento para fora quando aberta (desliza para trás, em direção ao porta-malas, eixo -Z)
    const slideOffsetZ = isOpen ? -l * 0.75 : 0;
    drawerGroup.position.set(0, 0, slideOffsetZ);

    // Dimensões da gaveta com folga de 6mm de cada lado para as corrediças telescópicas
    const clearance = 0.012;
    const dW = Math.max(0.05, cabInnerW - clearance);
    const dH = Math.max(0.05, sideH - clearance);
    const dL = Math.max(0.05, l - (hasFront ? tFront : 0) - 0.01);
    const drawerCenterZ = tDef / 2;
    // Caixa / Bandeja móvel deslizante (com fundo pois desliza no ar para fora da Doblò)
    const drawerBodyGroup = new THREE.Group();
    drawerBodyGroup.position.set(cabCenterX, 0, drawerCenterZ);

    if (isSlideTray) {
      // Bandeja Corrediça Rasa (para Geladeira 12V / Fogão portátil):
      // Fundo plano + 4 abas baixas de contenção (45mm de altura)
      const lipH = 0.045;
      const trayY = -dH / 2 + tBottom / 2;

      // Base plana da bandeja
      this.addPanel(
        drawerBodyGroup,
        dW,
        tBottom,
        dL,
        0,
        trayY,
        0,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Base Bandeja Corrediça Rasa (${tBottomMm}mm)`,
        { thicknessMm: tBottomMm, woodMaterial: woodMat, moduleName: box.name, partType: 'bottom', material: `${woodMat} ${tBottomMm}mm Impermeabilizado` }
      );

      // Abas de contenção (Laterais, traseira e frontal de 45mm)
      this.addPanel(drawerBodyGroup, tLeft, lipH, dL, dW / 2 - tLeft / 2, trayY + tBottom / 2 + lipH / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Aba Baixa Lateral Esq. (${tLeftMm}mm)`, {
        thicknessMm: tLeftMm, woodMaterial: woodMat, moduleName: box.name, partType: 'left', material: `${woodMat} ${tLeftMm}mm`
      });
      this.addPanel(drawerBodyGroup, tRight, lipH, dL, -dW / 2 + tRight / 2, trayY + tBottom / 2 + lipH / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Aba Baixa Lateral Dir. (${tRightMm}mm)`, {
        thicknessMm: tRightMm, woodMaterial: woodMat, moduleName: box.name, partType: 'right', material: `${woodMat} ${tRightMm}mm`
      });
      this.addPanel(drawerBodyGroup, dW - tLeft - tRight, lipH, tRear, 0, trayY + tBottom / 2 + lipH / 2, dL / 2 - tRear / 2, mat, edgeMat, box.id, container, `${box.name} • Aba Baixa Traseira (${Math.round(tRear * 1000)}mm)`, {
        thicknessMm: Math.round(tRear * 1000), woodMaterial: woodMat, moduleName: box.name, partType: 'rear', material: `${woodMat} ${Math.round(tRear * 1000)}mm`
      });
      this.addPanel(drawerBodyGroup, dW - tLeft - tRight, lipH, tFront, 0, trayY + tBottom / 2 + lipH / 2, -dL / 2 + tFront / 2, mat, edgeMat, box.id, container, `${box.name} • Aba Baixa Frontal (${tFrontMm}mm)`, {
        thicknessMm: tFrontMm, woodMaterial: woodMat, moduleName: box.name, partType: 'front', material: `${woodMat} ${tFrontMm}mm`
      });

      // Puxador rebaixado na aba frontal
      const handleGeo = new THREE.BoxGeometry(Math.min(0.20, dW * 0.4), 0.020, 0.015);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.set(0, trayY + tBottom / 2 + lipH / 2, -dL / 2 - 0.01);
      handleMesh.userData = { isInternalBox: true, boxId: box.id, boxRoot: container };
      drawerBodyGroup.add(handleMesh);

      // Par de corrediças telescópicas pesadas com trava de fim de curso
      [-dW / 2 - 0.005, dW / 2 + 0.005].forEach((railX, idx) => {
        const railGeo = new THREE.BoxGeometry(0.008, 0.035, dL);
        const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });
        const railMesh = new THREE.Mesh(railGeo, railMat);
        railMesh.position.set(railX, trayY + 0.02, 0);
        railMesh.userData = {
          isHardware: true,
          partLabel: `Par de Corrediças Telescópicas Reforçadas 45kg c/ Trava (${idx === 0 ? 'Esq.' : 'Dir.'})`,
          category: '🔩 Ferragens de Gaveteiros e Bandejas'
        };
        drawerBodyGroup.add(railMesh);
      });
    } else {
      // Gaveteiro Alto Fechado Convencional
      this.buildHollowBox(drawerBodyGroup, dW, dH, dL, tDef, mat, edgeMat, true, box.id, container, undefined, `${box.name} [Gaveta]`, box);

      // Frente da gaveta
      const frontFaceW = w - 0.008;
      const frontFaceH = h - 0.008;
      this.addPanel(
        drawerGroup,
        frontFaceW,
        frontFaceH,
        tFront,
        0,
        0,
        -l / 2 - tFront / 2,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Frente Externa Gaveta (${tFrontMm}mm)`,
        { thicknessMm: tFrontMm, woodMaterial: woodMat, moduleName: box.name, partType: 'front', material: `${woodMat} ${tFrontMm}mm` }
      );

      // Puxador metálico embutido
      const handleGeo = new THREE.BoxGeometry(Math.min(0.24, dW * 0.5), 0.024, 0.02);
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.2
      });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.set(0, 0, -l / 2 - tFront - 0.01);
      handleMesh.userData = { isInternalBox: true, boxId: box.id, boxRoot: container };
      drawerGroup.add(handleMesh);
    }

    drawerGroup.add(drawerBodyGroup);

    // Hitbox da gaveta quando estendida para fora
    const drawerHitGeo = new THREE.BoxGeometry(dW, dH, dL);
    const drawerHitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const drawerHitMesh = new THREE.Mesh(drawerHitGeo, drawerHitMat);
    drawerHitMesh.name = '__box_hitbox';
    drawerHitMesh.position.set(cabCenterX, 0, drawerCenterZ);
    drawerHitMesh.userData = {
      isInternalBoxHitbox: true,
      isInternalBox: true,
      boxId: box.id,
      boxRoot: container
    };
    drawerGroup.add(drawerHitMesh);

    container.add(drawerGroup);
  }

  private buildChestModule(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    mat: THREE.Material,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean,
    hingeDirection: ChestHingeDirection = 'front'
  ) {
    const tConfig = InternalBoxesBuilder.getBoxThickness(box);
    const tTop = tConfig.top;
    const tTopMm = Math.round(tTop * 1000);
    const woodMat = InternalBoxesBuilder.getWoodMaterialName(box.material);

    const edgeMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0x38bdf8 : 0x78350f,
      linewidth: 1,
      transparent: true,
      opacity: 0.6
    });

    const hasTop = box.panels?.top ?? (box.type === 'chest');

    if (box.type === 'open') {
      // Nicho aberto: 100% oco com paredes conforme tamponamento selecionado (SEM FUNDO por padrão)
      this.buildHollowBox(container, w, h, l, tConfig.default, mat, edgeMat, false, box.id, container, box.panels, box.name, box);
      if (hasTop) {
        const exclusionZones = box ? InternalBoxesBuilder.getUpperCabinetExclusionZones(box, w, l) : [];
        const hasCabExcl = exclusionZones.length > 0;
        const openTopLabel = hasCabExcl
          ? `${box.name} • Tampo Superior Vazado CNC c/ Apoio do Aéreo (${tTopMm}mm)`
          : `${box.name} • Tampo Superior Vazado (${tTopMm}mm)`;
        if (box.topPerforated) {
          this.addPerforatedPanel(container, w, tTop, l, 0, h / 2 - tTop / 2, 0, mat, edgeMat, box.id, container, openTopLabel, box, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
          });
        } else {
          this.addPanel(container, w, tTop, l, 0, h / 2 - tTop / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Tampo Superior (${tTopMm}mm)`, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: `${woodMat} ${tTopMm}mm Impermeabilizado`
          });
        }
      }
      return;
    }

    // Baú com tampa basculante:
    // Corpo inferior oco feito com paredes (SEM FUNDO por padrão)
    const bodyHeight = Math.max(0.05, h - (hasTop ? tTop : 0));
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, hasTop ? -tTop / 2 : 0, 0);
    this.buildHollowBox(bodyGroup, w, bodyHeight, l, tConfig.default, mat, edgeMat, false, box.id, container, box.panels, box.name, box);
    container.add(bodyGroup);

    // Tampa com folha de compensado e articulação conforme hingeDirection (apenas se hasTop for true)
    if (hasTop) {
      const lidPivot = new THREE.Group();
      lidPivot.name = 'ChestLidPivot';
      const openAngle = Math.PI / 3.4; // bascula ~53° para CIMA
      const hingeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.25 });

      const exclusionZones = box ? InternalBoxesBuilder.getUpperCabinetExclusionZones(box, w, l) : [];
      const hasCabExcl = exclusionZones.length > 0;
      const lidLabel = hasCabExcl
        ? `${box.name} • Tampa Basculante Vazada CNC c/ Apoio do Aéreo (${tTopMm}mm)`
        : `${box.name} • Tampa Basculante Vazada (${tTopMm}mm)`;

      if (hingeDirection === 'rear') {
        // 1. Dobradiça na Traseira (-Z / porta-malas): levanta a ponta dianteira
        lidPivot.position.set(0, h / 2 - tTop, -l / 2);
        if (isOpen) {
          lidPivot.rotation.x = -openAngle;
        }
        if (box.topPerforated) {
          this.addPerforatedPanel(lidPivot, w, tTop, l, 0, tTop / 2, l / 2, mat, edgeMat, box.id, container, lidLabel, box, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
          });
        } else {
          this.addPanel(lidPivot, w, tTop, l, 0, tTop / 2, l / 2, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante (${tTopMm}mm)`, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: `${woodMat} ${tTopMm}mm Impermeabilizado`
          });
        }

        const hingeGeo = new THREE.CylinderGeometry(0.007, 0.007, w * 0.94, 12);
        hingeGeo.rotateZ(Math.PI / 2);
        const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
        hingeMesh.position.set(0, tTop, 0);
        hingeMesh.userData = { isInternalBox: true, boxId: box.id, boxRoot: container };
        lidPivot.add(hingeMesh);
      } else if (hingeDirection === 'left') {
        // 2. Dobradiça no Lado Esquerdo / Motorista (+X olhando da traseira): levanta o lado direito
        lidPivot.position.set(w / 2, h / 2 - tTop, 0);
        if (isOpen) {
          lidPivot.rotation.z = -openAngle;
        }
        if (box.topPerforated) {
          this.addPerforatedPanel(lidPivot, w, tTop, l, -w / 2, tTop / 2, 0, mat, edgeMat, box.id, container, lidLabel, box, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
          });
        } else {
          this.addPanel(lidPivot, w, tTop, l, -w / 2, tTop / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante (${tTopMm}mm)`, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: `${woodMat} ${tTopMm}mm Impermeabilizado`
          });
        }

        // Deita o cilindro ao longo do eixo Z (comprimento do baú)
        const hingeGeo = new THREE.CylinderGeometry(0.007, 0.007, l * 0.94, 12);
        hingeGeo.rotateX(Math.PI / 2);
        const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
        hingeMesh.position.set(0, tTop, 0);
        hingeMesh.userData = { isInternalBox: true, boxId: box.id, boxRoot: container };
        lidPivot.add(hingeMesh);
      } else if (hingeDirection === 'right') {
        // 3. Dobradiça no Lado Direito / Passageiro (-X olhando da traseira): levanta o lado esquerdo
        lidPivot.position.set(-w / 2, h / 2 - tTop, 0);
        if (isOpen) {
          lidPivot.rotation.z = openAngle;
        }
        if (box.topPerforated) {
          this.addPerforatedPanel(lidPivot, w, tTop, l, w / 2, tTop / 2, 0, mat, edgeMat, box.id, container, lidLabel, box, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
          });
        } else {
          this.addPanel(lidPivot, w, tTop, l, w / 2, tTop / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante (${tTopMm}mm)`, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: `${woodMat} ${tTopMm}mm Impermeabilizado`
          });
        }

        // Deita o cilindro ao longo do eixo Z (comprimento do baú)
        const hingeGeo = new THREE.CylinderGeometry(0.007, 0.007, l * 0.94, 12);
        hingeGeo.rotateX(Math.PI / 2);
        const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
        hingeMesh.position.set(0, tTop, 0);
        hingeMesh.userData = { isInternalBox: true, boxId: box.id, boxRoot: container };
        lidPivot.add(hingeMesh);
      } else {
        // 4. Padrão: Dobradiça na Frente (+Z / bancos): levanta a ponta traseira
        lidPivot.position.set(0, h / 2 - tTop, l / 2);
        if (isOpen) {
          lidPivot.rotation.x = openAngle;
        }
        if (box.topPerforated) {
          this.addPerforatedPanel(lidPivot, w, tTop, l, 0, tTop / 2, -l / 2, mat, edgeMat, box.id, container, lidLabel, box, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top'
          });
        } else {
          this.addPanel(lidPivot, w, tTop, l, 0, tTop / 2, -l / 2, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante (${tTopMm}mm)`, {
            thicknessMm: tTopMm, woodMaterial: woodMat, moduleName: box.name, partType: 'top', material: `${woodMat} ${tTopMm}mm Impermeabilizado`
          });
        }

        const hingeGeo = new THREE.CylinderGeometry(0.007, 0.007, w * 0.94, 12);
        hingeGeo.rotateZ(Math.PI / 2);
        const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
        hingeMesh.position.set(0, tTop, 0);
        hingeMesh.userData = { isInternalBox: true, boxId: box.id, boxRoot: container };
        lidPivot.add(hingeMesh);
      }

      container.add(lidPivot);
    }
  }

  /**
   * Constrói o Módulo Sofá-Cama Retrátil com Ripas Intercaladas (Slatted Pull-Out Bed)
   * Possui caixa base inferior de apoio/armazenamento e dois conjuntos de ripas
   * entrelaçadas (pente de ripas): estrado fixo + estrado móvel deslizante com
   * longarina de puxar e pés de apoio no assoalho.
   */
  private buildSlatBedModule(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    mat: THREE.Material,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean,
    cellWM?: number,
    cellLM?: number,
    showMattress: boolean = true
  ) {
    const tConfig = InternalBoxesBuilder.getBoxThickness(box);
    const t = tConfig.default;
    const slatT = tConfig.slat; // espessura das ripas de compensado naval
    const slatTMm = Math.round(slatT * 1000);
    const woodMat = InternalBoxesBuilder.getWoodMaterialName(box.material);
    const edgeMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0x38bdf8 : 0x78350f,
      linewidth: 1,
      transparent: true,
      opacity: 0.65
    });
    const mobileEdgeMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0x38bdf8 : 0xd97706,
      linewidth: 1,
      transparent: true,
      opacity: 0.8
    });

    const direction: SlatBedDirection = box.slatBedDirection || 'left';
    const extPercent = Math.min(100, Math.max(40, box.slatExtensionPercent ?? 85));
    const extRatio = extPercent / 100;
    const isExtended = isOpen;

    // 1. Caixa base inferior de apoio / baú de arrumação sob a cama (sem o tampo superior)
    const baseH = Math.max(0.05, h - slatT);
    const baseGroup = new THREE.Group();
    baseGroup.position.set(0, -slatT / 2, 0);
    this.buildHollowBox(
      baseGroup,
      w,
      baseH,
      l,
      t,
      mat,
      edgeMat,
      box.panels?.bottom ?? false,
      box.id,
      container,
      box.panels,
      box.name,
      box
    );
    container.add(baseGroup);

    // 2. Sistema de Ripas Retráteis Intercaladas (Pente de Madeira)
    const ySlat = h / 2 - slatT / 2;
    // parts define a quantidade de colunas/subdivisões que a cama ocupa ao estender (2 colunas = padrão Doblò c/ armário alto lateral, 3 colunas = ocupar tudo, 5 = com abas das caixas de roda esq/dir)
    const parts = (box.mattressParts ?? (box.colSpan === 1 ? 2 : 3)) as 1 | 2 | 3 | 4 | 5;

    if (direction === 'left' || direction === 'right') {
      // --- ABERTURA LATERAL (Eixo X) ---
      // parts define quantas subdivisões do grid a cama aberta ocupa (5 partes cobre as 3 colunas + abas das caixas de roda)
      const cellW = cellWM || w;
      const targetSubdivisions = parts === 5 ? 3 : Math.max(1, parts);
      const totalOpenSpanX = targetSubdivisions * cellW;
      const strokeMax = Math.max(0, totalOpenSpanX - w);
      const slideStroke = isExtended ? strokeMax * extRatio : 0;
      const slideOffsetX = direction === 'left' ? slideStroke : -slideStroke;

      // As ripas correm na largura (X, comprimento = w) e intercalam-se ao longo do comprimento (Z, de -l/2 a +l/2).
      const targetSlatW = 0.07; // ~70mm de largura nominal por ripa
      let numSlats = Math.max(6, Math.floor(l / targetSlatW));
      if (numSlats % 2 !== 0) numSlats += 1; // número par para alternância perfeita
      const pitch = l / numSlats;
      const gap = 0.006; // folga funcional de 6mm entre ripas
      const slatDimZ = Math.max(0.025, pitch - gap);

      // Comprimento das ripas adaptado para o vão aberto quando estendido
      const fixedSlatW = isExtended ? Math.min(totalOpenSpanX, w + strokeMax * 0.55) : w;
      const mobileSlatW = isExtended ? Math.min(totalOpenSpanX, w + strokeMax * 0.55) : w;
      const fixedSlatX = direction === 'left' ? (fixedSlatW - w) / 2 : -(fixedSlatW - w) / 2;

      // (A) Estrado Fixo (Ripas nos índices pares: 0, 2, 4...)
      for (let i = 0; i < numSlats; i += 2) {
        const zPos = -l / 2 + (i + 0.5) * pitch;
        this.addPanel(
          container,
          fixedSlatW,
          slatT,
          slatDimZ,
          fixedSlatX,
          ySlat,
          zPos,
          mat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Ripa Fixa #${i / 2 + 1} (${Math.round(fixedSlatW * 1000)}×${Math.round(slatDimZ * 1000)}×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'slat', material: `${woodMat} ${slatTMm}mm` }
        );
      }

      // (B) Estrado Móvel Retrátil (Ripas nos índices ímpares: 1, 3, 5... + Longarina Externa de Puxar + Pés)
      const mobileGroup = new THREE.Group();
      mobileGroup.name = 'SlatBedSlidingFrame';
      mobileGroup.position.set(slideOffsetX, 0, 0);

      const mobileSlatX = direction === 'left' ? -(mobileSlatW - w) / 2 : (mobileSlatW - w) / 2;

      // Ripas móveis deslizantes
      for (let i = 1; i < numSlats; i += 2) {
        const zPos = -l / 2 + (i + 0.5) * pitch;
        this.addPanel(
          mobileGroup,
          mobileSlatW,
          slatT,
          slatDimZ,
          mobileSlatX,
          ySlat,
          zPos,
          mat,
          mobileEdgeMat,
          box.id,
          container,
          `${box.name} • Ripa Móvel #${Math.floor(i / 2) + 1} (${Math.round(mobileSlatW * 1000)}×${Math.round(slatDimZ * 1000)}×${slatTMm}mm)`,
          { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'slat', material: `${woodMat} ${slatTMm}mm` }
        );
      }

      // Longarina lateral externa que une as ripas móveis e serve de fachada
      const outerX = direction === 'left' ? (w / 2 - t / 2) : (-w / 2 + t / 2);
      this.addPanel(
        mobileGroup,
        t,
        h,
        l,
        outerX,
        0,
        0,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Longarina Lateral Móvel (${Math.round(l * 1000)}×${Math.round(h * 1000)}×${Math.round(t * 1000)}mm)`,
        { thicknessMm: Math.round(t * 1000), woodMaterial: woodMat, moduleName: box.name, partType: 'left', material: `${woodMat} ${Math.round(t * 1000)}mm` }
      );

      // Pés de apoio articulados que alcançam o assoalho da van
      const legH = h - slatT;
      const legY = -slatT / 2;
      const legZ1 = -l / 2 + Math.min(0.08, l * 0.15);
      const legZ2 = l / 2 - Math.min(0.08, l * 0.15);
      this.addPanel(
        mobileGroup,
        0.035,
        legH,
        0.035,
        outerX,
        legY,
        legZ1,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Pé de Apoio Traseiro (${slatTMm}mm)`,
        { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'leg', material: `${woodMat} ${slatTMm}mm` }
      );
      this.addPanel(
        mobileGroup,
        0.035,
        legH,
        0.035,
        outerX,
        legY,
        legZ2,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Pé de Apoio Dianteiro (${slatTMm}mm)`,
        { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'leg', material: `${woodMat} ${slatTMm}mm` }
      );

      // Puxador metálico na longarina externa
      const handleGeo = new THREE.BoxGeometry(0.015, 0.024, Math.min(0.24, l * 0.4));
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.2
      });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.set(outerX + (direction === 'left' ? 0.012 : -0.012), 0, 0);
      handleMesh.userData = { isInternalBox: true, boxId: box.id, boxRoot: container };
      mobileGroup.add(handleMesh);

      // Hitbox do conjunto móvel
      const mobileHitGeo = new THREE.BoxGeometry(w, h, l);
      const mobileHitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const mobileHitMesh = new THREE.Mesh(mobileHitGeo, mobileHitMat);
      mobileHitMesh.name = '__box_hitbox';
      mobileHitMesh.userData = { isInternalBoxHitbox: true, isInternalBox: true, boxId: box.id, boxRoot: container };
      mobileGroup.add(mobileHitMesh);

      container.add(mobileGroup);

      if (parts === 5) {
        // Abas de apoio estrutural em compensado 15mm sobre as caixas de roda esquerda e direita
        const archW = 0.145; // ~145mm sobre o vão da caixa de roda
        const baseArchX = direction === 'left' ? (-w / 2 - archW / 2) : (w / 2 + archW / 2);
        this.addPanel(
          container,
          archW,
          slatT,
          l,
          baseArchX,
          ySlat,
          0,
          mat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Aba Fixa de Apoio Caixa de Roda (${Math.round(archW * 1000)}×${Math.round(l * 1000)}mm)`,
          { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'slat', material: `${woodMat} ${slatTMm}mm` }
        );

        if (isExtended) {
          const farArchX = direction === 'left' ? (-w / 2 + 3 * cellW + archW / 2) : (w / 2 - 3 * cellW - archW / 2);
          this.addPanel(
            container,
            archW,
            slatT,
            l,
            farArchX,
            ySlat,
            0,
            mat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Aba Oposta de Apoio Caixa de Roda (${Math.round(archW * 1000)}×${Math.round(l * 1000)}mm)`,
            { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'slat', material: `${woodMat} ${slatTMm}mm` }
          );
        }
      }
    } else {
      // --- ABERTURA LONGITUDINAL (Eixo Z: Frente ou Trás) ---
      const cellL = cellLM || l;
      const targetSubdivisions = Math.max(1, parts);
      const totalOpenSpanZ = targetSubdivisions * cellL;
      const strokeMaxZ = Math.max(0, totalOpenSpanZ - l);
      const slideStrokeZ = isExtended ? strokeMaxZ * extRatio : 0;
      const slideOffsetZ = direction === 'front' ? slideStrokeZ : -slideStrokeZ;

      // As ripas correm no comprimento (Z, comprimento = l) e intercalam-se na largura (X, de -w/2 a +w/2).
      const targetSlatW = 0.07;
      let numSlats = Math.max(6, Math.floor(w / targetSlatW));
      if (numSlats % 2 !== 0) numSlats += 1;
      const pitch = w / numSlats;
      const gap = 0.006;
      const slatDimX = Math.max(0.025, pitch - gap);

      const fixedSlatL = isExtended ? Math.min(totalOpenSpanZ, l + strokeMaxZ * 0.55) : l;
      const mobileSlatL = isExtended ? Math.min(totalOpenSpanZ, l + strokeMaxZ * 0.55) : l;
      const fixedSlatZ = direction === 'front' ? (fixedSlatL - l) / 2 : -(fixedSlatL - l) / 2;

      // (A) Estrado Fixo (Ripas nos índices pares: 0, 2, 4...)
      for (let i = 0; i < numSlats; i += 2) {
        const xPos = w / 2 - (i + 0.5) * pitch;
        this.addPanel(
          container,
          slatDimX,
          slatT,
          fixedSlatL,
          xPos,
          ySlat,
          fixedSlatZ,
          mat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Ripa Fixa #${i / 2 + 1} (${Math.round(slatDimX * 1000)}×${Math.round(fixedSlatL * 1000)}mm)`,
          { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'slat', material: `${woodMat} ${slatTMm}mm` }
        );
      }

      // (B) Estrado Móvel Retrátil (Ripas nos índices ímpares: 1, 3, 5... + Longarina Externa + Pés)
      const mobileGroup = new THREE.Group();
      mobileGroup.name = 'SlatBedSlidingFrame';
      mobileGroup.position.set(0, 0, slideOffsetZ);

      const mobileSlatZ = direction === 'front' ? -(mobileSlatL - l) / 2 : (mobileSlatL - l) / 2;

      // Ripas móveis deslizantes
      for (let i = 1; i < numSlats; i += 2) {
        const xPos = w / 2 - (i + 0.5) * pitch;
        this.addPanel(
          mobileGroup,
          slatDimX,
          slatT,
          mobileSlatL,
          xPos,
          ySlat,
          mobileSlatZ,
          mat,
          mobileEdgeMat,
          box.id,
          container,
          `${box.name} • Ripa Móvel #${Math.floor(i / 2) + 1} (${Math.round(slatDimX * 1000)}×${Math.round(mobileSlatL * 1000)}mm)`,
          { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'slat', material: `${woodMat} ${slatTMm}mm` }
        );
      }

      // Longarina frontal/traseira externa
      const outerZ = direction === 'front' ? (l / 2 - t / 2) : (-l / 2 + t / 2);
      this.addPanel(
        mobileGroup,
        w,
        h,
        t,
        0,
        0,
        outerZ,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Longarina Frontal Móvel (${Math.round(w * 1000)}×${Math.round(h * 1000)}mm)`,
        { thicknessMm: Math.round(t * 1000), woodMaterial: woodMat, moduleName: box.name, partType: 'front', material: `${woodMat} ${Math.round(t * 1000)}mm` }
      );

      // Pés de apoio articulados
      const legH = h - slatT;
      const legY = -slatT / 2;
      const legX1 = -w / 2 + Math.min(0.08, w * 0.15);
      const legX2 = w / 2 - Math.min(0.08, w * 0.15);
      this.addPanel(
        mobileGroup,
        0.035,
        legH,
        0.035,
        legX1,
        legY,
        outerZ,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Pé de Apoio Esq. (${slatTMm}mm)`,
        { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'leg', material: `${woodMat} ${slatTMm}mm` }
      );
      this.addPanel(
        mobileGroup,
        0.035,
        legH,
        0.035,
        legX2,
        legY,
        outerZ,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Pé de Apoio Dir. (${slatTMm}mm)`,
        { thicknessMm: slatTMm, woodMaterial: woodMat, moduleName: box.name, partType: 'leg', material: `${woodMat} ${slatTMm}mm` }
      );

      // Puxador metálico
      const handleGeo = new THREE.BoxGeometry(Math.min(0.24, w * 0.4), 0.024, 0.015);
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.2
      });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.set(0, 0, outerZ + (direction === 'front' ? 0.012 : -0.012));
      handleMesh.userData = { isInternalBox: true, boxId: box.id, boxRoot: container };
      mobileGroup.add(handleMesh);

      // Hitbox do conjunto móvel
      const mobileHitGeo = new THREE.BoxGeometry(w, h, l);
      const mobileHitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const mobileHitMesh = new THREE.Mesh(mobileHitGeo, mobileHitMat);
      mobileHitMesh.name = '__box_hitbox';
      mobileHitMesh.userData = { isInternalBoxHitbox: true, isInternalBox: true, boxId: box.id, boxRoot: container };
      mobileGroup.add(mobileHitMesh);

      container.add(mobileGroup);
    }

    // 3. COLCHÃO / ESTOFADO MULTIPARTIDO CAMPERVAN
    if (!showMattress) {
      return;
    }
    // parts define exatamente a quantidade de subdivisões do grid que a cama ocupa ao abrir (ex: 3 subdivisões = toda a largura, 5 partes = com abas das caixas de roda esq/dir)
    const partsName = parts === 1 ? 'Inteiro' : parts === 3 ? 'Tripartido' : parts === 5 ? '5 Partes (Total c/ Caixas de Roda)' : parts === 4 ? 'Quadripartido' : 'Bipartido';
    const mattressThickness = 0.08; // Espuma D33 de 80mm
    const mattressY = ySlat + slatT / 2 + mattressThickness / 2;

    const mattressMat = new THREE.MeshStandardMaterial({
      color: isSelected ? 0x38bdf8 : 0x334155, // Tecido náutico grafite escuro texturizado
      roughness: 0.90,
      metalness: 0.02
    });
    const seamMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

    if (direction === 'left' || direction === 'right') {
      const cellW = cellWM || w;
      const cushionW = cellW - 0.012; // Cada almofada tem a largura de 1 subdivisão do grid
      const cushionL = l - 0.016;

      if (parts === 5) {
        // --- 5 PARTES: 3 COLUNAS CENTRAIS + 2 ABAS DE CAIXA DE RODA ESQ/DIR ---
        const archW = 0.142; // ~142mm para cada caixa de roda

        if (isExtended) {
          // 1. Aba Caixa de Roda do lado da base
          const baseArchX = direction === 'left' ? (-w / 2 - archW / 2) : (w / 2 + archW / 2);
          const baseArchGeo = new THREE.BoxGeometry(archW, mattressThickness, cushionL);
          const baseArchMesh = new THREE.Mesh(baseArchGeo, mattressMat);
          baseArchMesh.position.set(baseArchX, mattressY, 0);
          baseArchMesh.castShadow = true;
          baseArchMesh.receiveShadow = true;
          baseArchMesh.userData = {
            isWoodPart: false,
            isUpholstery: true,
            dimW: archW,
            dimH: mattressThickness,
            dimL: cushionL,
            partLabel: `${box.name} • Colchão Aba Caixa de Roda (${Math.round(archW * 1000)}×${Math.round(cushionL * 1000)}×80mm)`,
            material: 'Espuma D33 Revestida em Tecido Impermeável',
            category: '🛏️ Estofaria Campervan'
          };
          container.add(baseArchMesh);

          // Costura com a 1ª coluna
          const baseSeamX = direction === 'left' ? -w / 2 : w / 2;
          const baseSeamGeo = new THREE.BoxGeometry(0.004, mattressThickness + 0.002, cushionL);
          const baseSeamMesh = new THREE.Mesh(baseSeamGeo, seamMat);
          baseSeamMesh.position.set(baseSeamX, mattressY, 0);
          container.add(baseSeamMesh);

          // 2. Três almofadas centrais
          for (let i = 0; i < 3; i++) {
            const pieceCenterX = direction === 'left'
              ? (-w / 2 + (i + 0.5) * cellW)
              : (w / 2 - (i + 0.5) * cellW);

            const pieceGeo = new THREE.BoxGeometry(cushionW, mattressThickness, cushionL);
            const pieceMesh = new THREE.Mesh(pieceGeo, mattressMat);
            pieceMesh.position.set(pieceCenterX, mattressY, 0);
            pieceMesh.castShadow = true;
            pieceMesh.receiveShadow = true;
            pieceMesh.userData = {
              isWoodPart: false,
              isUpholstery: true,
              dimW: cushionW,
              dimH: mattressThickness,
              dimL: cushionL,
              partLabel: `${box.name} • Colchão Almofada Central ${i + 1}/3 (${Math.round(cushionW * 1000)}×${Math.round(cushionL * 1000)}×80mm)`,
              material: 'Espuma D33 Revestida em Tecido Impermeável',
              category: '🛏️ Estofaria Campervan'
            };
            container.add(pieceMesh);

            if (i < 2) {
              const seamX = direction === 'left'
                ? (-w / 2 + (i + 1) * cellW)
                : (w / 2 - (i + 1) * cellW);
              const seamGeo = new THREE.BoxGeometry(0.004, mattressThickness + 0.002, cushionL);
              const seamMesh = new THREE.Mesh(seamGeo, seamMat);
              seamMesh.position.set(seamX, mattressY, 0);
              container.add(seamMesh);
            }
          }

          // 3. Aba Caixa de Roda do lado oposto (aberto)
          const farArchX = direction === 'left' ? (-w / 2 + 3 * cellW + archW / 2) : (w / 2 - 3 * cellW - archW / 2);
          const farArchGeo = new THREE.BoxGeometry(archW, mattressThickness, cushionL);
          const farArchMesh = new THREE.Mesh(farArchGeo, mattressMat);
          farArchMesh.position.set(farArchX, mattressY, 0);
          farArchMesh.castShadow = true;
          farArchMesh.receiveShadow = true;
          farArchMesh.userData = {
            isWoodPart: false,
            isUpholstery: true,
            dimW: archW,
            dimH: mattressThickness,
            dimL: cushionL,
            partLabel: `${box.name} • Colchão Aba Oposta Caixa de Roda (${Math.round(archW * 1000)}×${Math.round(cushionL * 1000)}×80mm)`,
            material: 'Espuma D33 Revestida em Tecido Impermeável',
            category: '🛏️ Estofaria Campervan'
          };
          container.add(farArchMesh);

          const farSeamX = direction === 'left' ? (-w / 2 + 3 * cellW) : (w / 2 - 3 * cellW);
          const farSeamGeo = new THREE.BoxGeometry(0.004, mattressThickness + 0.002, cushionL);
          const farSeamMesh = new THREE.Mesh(farSeamGeo, seamMat);
          farSeamMesh.position.set(farSeamX, mattressY, 0);
          container.add(farSeamMesh);
        } else {
          // Modo sofá fechado: 3 almofadas centrais empilhadas + 2 abas de caixa de roda
          const layerH = 0.040;
          for (let p = 0; p < 3; p++) {
            const layerY = ySlat + slatT / 2 + layerH / 2 + p * (layerH + 0.003);
            const mGeo = new THREE.BoxGeometry(cushionW, layerH, cushionL);
            const mMesh = new THREE.Mesh(mGeo, mattressMat);
            mMesh.position.set(0, layerY, 0);
            mMesh.castShadow = true;
            mMesh.receiveShadow = true;
            mMesh.userData = {
              isWoodPart: false,
              isUpholstery: true,
              dimW: cushionW,
              dimH: layerH,
              dimL: cushionL,
              partLabel: `${box.name} • Colchão 5 Partes Empilhado (Almofada Central ${p + 1}/3)`,
              material: 'Espuma D33 Revestida em Tecido Impermeável',
              category: '🛏️ Estofaria Campervan'
            };
            container.add(mMesh);
          }
          for (let p = 0; p < 2; p++) {
            const flapLayerY = ySlat + slatT / 2 + 3 * (layerH + 0.003) + layerH / 2 + p * (layerH + 0.003);
            const fGeo = new THREE.BoxGeometry(cushionW * 0.48, layerH, cushionL * 0.96);
            const fMesh = new THREE.Mesh(fGeo, mattressMat);
            fMesh.position.set(p === 0 ? -cushionW * 0.24 : cushionW * 0.24, flapLayerY, 0);
            fMesh.castShadow = true;
            fMesh.receiveShadow = true;
            fMesh.userData = {
              isWoodPart: false,
              isUpholstery: true,
              dimW: cushionW * 0.48,
              dimH: layerH,
              dimL: cushionL * 0.96,
              partLabel: `${box.name} • Colchão Aba Caixa de Roda Dobrada #${p + 1}`,
              material: 'Espuma D33 Revestida em Tecido Impermeável',
              category: '🛏️ Estofaria Campervan'
            };
            container.add(fMesh);
          }
        }
      } else if (isExtended) {
        // Cama Aberta: cada uma das parts almofadas cobre exatamente uma subdivisão do grid (ex: 3 almofadas cobrem toda a largura da van)
        for (let i = 0; i < parts; i++) {
          const pieceCenterX = direction === 'left'
            ? (-w / 2 + (i + 0.5) * cellW)
            : (w / 2 - (i + 0.5) * cellW);

          const pieceGeo = new THREE.BoxGeometry(cushionW, mattressThickness, cushionL);
          const pieceMesh = new THREE.Mesh(pieceGeo, mattressMat);
          pieceMesh.position.set(pieceCenterX, mattressY, 0);
          pieceMesh.castShadow = true;
          pieceMesh.receiveShadow = true;
          pieceMesh.userData = {
            isWoodPart: false,
            isUpholstery: true,
            dimW: cushionW,
            dimH: mattressThickness,
            dimL: cushionL,
            partLabel: `${box.name} • Colchão ${partsName} D33 Casal Aberto (Almofada ${i + 1}/${parts} • Subdivisão ${i + 1} - ${Math.round(cushionW * 1000)}×${Math.round(cushionL * 1000)}×80mm)`,
            material: `Espuma D33 Revestida em Tecido Impermeável ${partsName}`,
            category: '🛏️ Estofaria Campervan'
          };
          container.add(pieceMesh);

          if (i < parts - 1) {
            const seamX = direction === 'left'
              ? (-w / 2 + (i + 1) * cellW)
              : (w / 2 - (i + 1) * cellW);
            const seamGeo = new THREE.BoxGeometry(0.004, mattressThickness + 0.002, cushionL);
            const seamMesh = new THREE.Mesh(seamGeo, seamMat);
            seamMesh.position.set(seamX, mattressY, 0);
            container.add(seamMesh);
          }
        }
      } else {
        // Cama Fechada: almofada(s) empilhadas sobre o estrado fixo no modo sofá
        if (parts === 1) {
          const mGeo = new THREE.BoxGeometry(cushionW, mattressThickness, cushionL);
          const mMesh = new THREE.Mesh(mGeo, mattressMat);
          mMesh.position.set(0, mattressY, 0);
          mMesh.castShadow = true;
          mMesh.receiveShadow = true;
          mMesh.userData = {
            isWoodPart: false,
            isUpholstery: true,
            dimW: cushionW,
            dimH: mattressThickness,
            dimL: cushionL,
            partLabel: `${box.name} • Colchão Inteiro Modo Sofá (${Math.round(cushionW * 1000)}×${Math.round(cushionL * 1000)}×80mm)`,
            material: 'Espuma D33 Revestida em Tecido Impermeável',
            category: '🛏️ Estofaria Campervan'
          };
          container.add(mMesh);
        } else {
          // As N almofadas empilhadas no modo sofá sobre a base
          const layerH = parts === 2 ? 0.06 : parts === 3 ? 0.055 : 0.045;
          for (let p = 0; p < parts; p++) {
            const layerY = ySlat + slatT / 2 + layerH / 2 + p * (layerH + 0.003);
            const mGeo = new THREE.BoxGeometry(cushionW, layerH, cushionL);
            const mMesh = new THREE.Mesh(mGeo, mattressMat);
            mMesh.position.set(0, layerY, 0);
            mMesh.castShadow = true;
            mMesh.receiveShadow = true;
            mMesh.userData = {
              isWoodPart: false,
              isUpholstery: true,
              dimW: cushionW,
              dimH: layerH,
              dimL: cushionL,
              partLabel: `${box.name} • Colchão ${partsName} Dobrado Modo Sofá (Almofada ${p + 1}/${parts} - ${Math.round(cushionW * 1000)}×${Math.round(cushionL * 1000)}×${Math.round(layerH * 1000)}mm)`,
              material: `Espuma D33 Revestida em Tecido Impermeável ${partsName}`,
              category: '🛏️ Estofaria Campervan'
            };
            container.add(mMesh);

            if (p < parts - 1) {
              const seamGeo = new THREE.BoxGeometry(cushionW + 0.002, 0.002, cushionL + 0.002);
              const seamMesh = new THREE.Mesh(seamGeo, seamMat);
              seamMesh.position.set(0, ySlat + slatT / 2 + (p + 1) * (layerH + 0.003) - 0.0015, 0);
              container.add(seamMesh);
            }
          }
        }
      }
    } else {
      // --- ABERTURA LONGITUDINAL (Frente ou Trás) ---
      const cellL = cellLM || l;
      const cushionW = w - 0.016;
      const cushionL = cellL - 0.012; // Cada almofada tem o comprimento de 1 subdivisão longitudinal

      if (isExtended) {
        for (let i = 0; i < parts; i++) {
          const pieceCenterZ = direction === 'front'
            ? (-l / 2 + (i + 0.5) * cellL)
            : (l / 2 - (i + 0.5) * cellL);

          const pieceGeo = new THREE.BoxGeometry(cushionW, mattressThickness, cushionL);
          const pieceMesh = new THREE.Mesh(pieceGeo, mattressMat);
          pieceMesh.position.set(0, mattressY, pieceCenterZ);
          pieceMesh.castShadow = true;
          pieceMesh.receiveShadow = true;
          pieceMesh.userData = {
            isWoodPart: false,
            isUpholstery: true,
            dimW: cushionW,
            dimH: mattressThickness,
            dimL: cushionL,
            partLabel: `${box.name} • Colchão ${partsName} Espuma D33 Longitudinal Aberto (Almofada ${i + 1}/${parts} • Subdivisão ${i + 1} - ${Math.round(cushionW * 1000)}×${Math.round(cushionL * 1000)}×80mm)`,
            material: `Espuma D33 Revestida em Tecido Impermeável ${partsName}`,
            category: '🛏️ Estofaria Campervan'
          };
          container.add(pieceMesh);

          if (i < parts - 1) {
            const seamZ = direction === 'front'
              ? (-l / 2 + (i + 1) * cellL)
              : (l / 2 - (i + 1) * cellL);
            const seamGeo = new THREE.BoxGeometry(cushionW, mattressThickness + 0.002, 0.004);
            const seamMesh = new THREE.Mesh(seamGeo, seamMat);
            seamMesh.position.set(0, mattressY, seamZ);
            container.add(seamMesh);
          }
        }
      } else {
        if (parts === 1) {
          const mGeo = new THREE.BoxGeometry(cushionW, mattressThickness, cushionL);
          const mMesh = new THREE.Mesh(mGeo, mattressMat);
          mMesh.position.set(0, mattressY, 0);
          mMesh.castShadow = true;
          mMesh.receiveShadow = true;
          mMesh.userData = {
            isWoodPart: false,
            isUpholstery: true,
            dimW: cushionW,
            dimH: mattressThickness,
            dimL: cushionL,
            partLabel: `${box.name} • Colchão Inteiro Modo Sofá (${Math.round(cushionW * 1000)}×${Math.round(cushionL * 1000)}×80mm)`,
            material: 'Espuma D33 Revestida em Tecido Impermeável',
            category: '🛏️ Estofaria Campervan'
          };
          container.add(mMesh);
        } else {
          const layerH = parts === 2 ? 0.06 : parts === 3 ? 0.055 : 0.045;
          for (let p = 0; p < parts; p++) {
            const layerY = ySlat + slatT / 2 + layerH / 2 + p * (layerH + 0.003);
            const mGeo = new THREE.BoxGeometry(cushionW, layerH, cushionL);
            const mMesh = new THREE.Mesh(mGeo, mattressMat);
            mMesh.position.set(0, layerY, 0);
            mMesh.castShadow = true;
            mMesh.receiveShadow = true;
            mMesh.userData = {
              isWoodPart: false,
              isUpholstery: true,
              dimW: cushionW,
              dimH: layerH,
              dimL: cushionL,
              partLabel: `${box.name} • Colchão ${partsName} Dobrado Modo Sofá (Almofada ${p + 1}/${parts} - ${Math.round(cushionW * 1000)}×${Math.round(cushionL * 1000)}×${Math.round(layerH * 1000)}mm)`,
              material: `Espuma D33 Revestida em Tecido Impermeável ${partsName}`,
              category: '🛏️ Estofaria Campervan'
            };
            container.add(mMesh);

            if (p < parts - 1) {
              const seamGeo = new THREE.BoxGeometry(cushionW + 0.002, 0.002, cushionL + 0.002);
              const seamMesh = new THREE.Mesh(seamGeo, seamMat);
              seamMesh.position.set(0, ySlat + slatT / 2 + (p + 1) * (layerH + 0.003) - 0.0015, 0);
              container.add(seamMesh);
            }
          }
        }
      }
    }
  }

  /**
   * Constrói o painel decorativo de madeira na face traseira do baú sustentado por um
   * par de mãos-francesas dobráveis metálicas com trava mecânica e gatilho de destravamento (padrão 2PCS).
   * Conforme especificação física e foto real:
   * 1. Canaletas verticais fixadas à face traseira com parafusos de inox.
   * 2. Braços horizontais com perfil em U invertido aparafusados sob o tampo de madeira.
   * 3. Alavanca / gatilho ergonômico de destravamento com mola sob cada braço horizontal.
   * 4. Haste diagonal articulada com trava de encaixe a 90° (aberta) e recolhimento plano (fechada).
   * 5. Tampo de madeira maciça de 18mm com cantos boleados que rebate 90° para baixo rente ao baú.
   */
  private buildRearFoldShelf(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean
  ) {
    const isShelfOpen = box.isRearShelfOpen !== undefined ? box.isRearShelfOpen : isOpen;
    const targetParent = (container.getObjectByName('DrawerSlide') as THREE.Group) || container;

    // Cálculo da mão francesa comercial ideal pela altura disponível
    const bracketSpec = getFoldingBracketForHeight(Math.round(h * 1000), box.rearShelfBracketInches);

    // Dimensões da prancha da prateleira decorativa
    const shelfTMm = box.panelThickness?.shelf || 18;
    const shelfT = shelfTMm / 1000;
    const shelfW = Math.max(0.15, w - 0.03); // Margem de 1.5cm de cada lado para a moldura do baú
    const shelfH = Math.max(0.15, Math.min(h - 0.04, 0.38)); // Profundidade da bancada

    // Geometria estrutural da mão francesa (padrão comercial em chapa de aço inox estampada)
    const W_b = 0.022; // 22mm largura da canaleta
    const D_b = 0.016; // 16mm profundidade da canaleta
    const t_s = 0.002; // 2mm espessura da chapa estampada

    const Hv = Math.min(shelfH * 0.65, bracketSpec.heightMm / 1000);
    const Lh = Math.min(shelfH * 0.85, bracketSpec.lengthMm / 1000);

    const isDrawer = box.type === 'drawer';
    const faceZ = isDrawer ? -l / 2 - InternalBoxesBuilder.PLYWOOD_THICKNESS : -l / 2;
    const pivotY = h / 2 - 0.022;
    const pivotZ = faceZ - D_b + 0.004;

    // Materiais dos suportes dobráveis em aço inoxidável escovado brilhante
    const bracketSteelMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Inox escovado brilhante / prata metalizado
      metalness: 0.94,
      roughness: 0.18
    });

    const rivetMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Pinos e rebites em inox polido
      metalness: 0.98,
      roughness: 0.12
    });

    const triggerGripMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Grip emborrachado preto da alavanca de destravamento rápido
      metalness: 0.25,
      roughness: 0.75
    });

    // Material da madeira decorativa da prateleira
    let woodColor = 0xdf9a57; // Pinus Finger-Joint / Golden Birch (tom quente)
    let woodRoughness = 0.45;
    let woodMetalness = 0.04;
    let finishLabel = 'Pinus Finger-Joint';

    const finish = box.rearShelfFinish || 'pine_block';
    if (finish === 'teak') {
      woodColor = 0xb45309; // Teca naval
      woodRoughness = 0.40;
      finishLabel = 'Teca Naval';
    } else if (finish === 'dark_wood') {
      woodColor = 0x58240c; // Imbuia / Madeira escura nobre
      woodRoughness = 0.50;
      finishLabel = 'Imbuia Nobre';
    } else if (finish === 'plywood') {
      woodColor = 0xd4a373; // Compensado naval
      woodRoughness = 0.65;
      finishLabel = 'Compensado Naval';
    }

    const shelfMat = new THREE.MeshStandardMaterial({
      color: isSelected ? 0x38bdf8 : woodColor,
      roughness: woodRoughness,
      metalness: woodMetalness
    });

    const edgeColor = isSelected ? 0x38bdf8 : (finish === 'dark_wood' ? 0x270f05 : 0x92400e);
    const shelfEdgeMat = new THREE.LineBasicMaterial({
      color: edgeColor,
      linewidth: 1,
      transparent: true,
      opacity: 0.8
    });

    const bracketOffsetX = shelfW * 0.32;
    const bracketXPositions = [-bracketOffsetX, bracketOffsetX];

    // ─── 1. PEÇAS FIXAS: CANALETAS VERTICAIS DE FIXAÇÃO NO BAÚ (Vertical Wall Arms) ───
    bracketXPositions.forEach((bx, idx) => {
      const fixedBracketGroup = new THREE.Group();
      fixedBracketGroup.name = `FoldingBracket_Base_${idx === 0 ? 'Left' : 'Right'}`;

      // Chapa de fundo da canaleta vertical encostada na madeira do baú
      const vertBackGeo = new THREE.BoxGeometry(W_b, Hv, t_s);
      const vertBackMesh = new THREE.Mesh(vertBackGeo, bracketSteelMat);
      vertBackMesh.position.set(bx, pivotY - Hv / 2, faceZ - t_s / 2);
      fixedBracketGroup.add(vertBackMesh);

      // Flanges laterais estruturais da canaleta em U
      const vertFlangeGeo = new THREE.BoxGeometry(t_s, Hv, D_b);
      const leftFlange = new THREE.Mesh(vertFlangeGeo, bracketSteelMat);
      leftFlange.position.set(bx - W_b / 2 + t_s / 2, pivotY - Hv / 2, faceZ - D_b / 2);
      fixedBracketGroup.add(leftFlange);

      const rightFlange = new THREE.Mesh(vertFlangeGeo, bracketSteelMat);
      rightFlange.position.set(bx + W_b / 2 - t_s / 2, pivotY - Hv / 2, faceZ - D_b / 2);
      fixedBracketGroup.add(rightFlange);

      // Parafusos escareados inox de fixação no painel
      [Hv * 0.15, Hv * 0.50, Hv * 0.85].forEach((offY) => {
        const screwGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.002, 10);
        screwGeo.rotateX(Math.PI / 2);
        const screwMesh = new THREE.Mesh(screwGeo, rivetMat);
        screwMesh.position.set(bx, pivotY - offY, faceZ - t_s);
        fixedBracketGroup.add(screwMesh);
      });

      // Eixo / Pino fixo da articulação superior
      const mainPivotPinGeo = new THREE.CylinderGeometry(0.0035, 0.0035, W_b + 0.004, 16);
      mainPivotPinGeo.rotateZ(Math.PI / 2);
      const mainPivotPin = new THREE.Mesh(mainPivotPinGeo, rivetMat);
      mainPivotPin.position.set(bx, pivotY, pivotZ);
      fixedBracketGroup.add(mainPivotPin);

      // Pino fixo inferior da haste diagonal
      const lowerPivotY = pivotY - Hv * 0.75;
      const lowerPivotZ = faceZ - D_b * 0.65;
      const lowerPivotPin = new THREE.Mesh(mainPivotPinGeo, rivetMat);
      lowerPivotPin.position.set(bx, lowerPivotY, lowerPivotZ);
      fixedBracketGroup.add(lowerPivotPin);

      // Haste Diagonal Articulada com Trava
      if (isShelfOpen) {
        // MODO ABERTO: Haste a ~45°-60° com pino de trava encaixado sob o braço horizontal
        const upperLockY = pivotY - 0.009; // Posicionada sob a canaleta horizontal, abaixo da madeira
        const upperLockZ = faceZ - D_b - Lh * 0.62;
        const dY = upperLockY - lowerPivotY;
        const dZ = upperLockZ - lowerPivotZ;
        const strutLength = Math.sqrt(dY * dY + dZ * dZ);
        const strutAngle = Math.atan2(dZ, dY);

        const strutGeo = new THREE.BoxGeometry(0.012, strutLength, 0.004);
        const strutMesh = new THREE.Mesh(strutGeo, bracketSteelMat);
        strutMesh.position.set(bx, (lowerPivotY + upperLockY) / 2, (lowerPivotZ + upperLockZ) / 2);
        strutMesh.rotation.x = strutAngle;
        fixedBracketGroup.add(strutMesh);

        const lockPin = new THREE.Mesh(mainPivotPinGeo, rivetMat);
        lockPin.position.set(bx, upperLockY, upperLockZ);
        fixedBracketGroup.add(lockPin);
      } else {
        // MODO FECHADO: Haste articulada dobrada recolhida dentro da canaleta
        const foldStrutGeo = new THREE.BoxGeometry(0.012, Hv * 0.7, 0.004);
        const foldStrutMesh = new THREE.Mesh(foldStrutGeo, bracketSteelMat);
        foldStrutMesh.position.set(bx, pivotY - Hv * 0.45, faceZ - D_b / 2);
        fixedBracketGroup.add(foldStrutMesh);
      }

      fixedBracketGroup.userData = {
        isHardware: true,
        partLabel: `Suporte Articulado Dobrável c/ Trava Inox ${bracketSpec.inches}" (${bracketSpec.lengthMm} mm) (Par)`,
        name: 'Mão Francesa Dobrável Inox c/ Gatilho (2PCS)',
        category: '🔩 Ferragens de Sustentação & Articulação',
        purpose: 'Suporte dobrável de aço inox escovado com trava automática 90° e gatilho de liberação rápida para bancada/mesa traseira'
      };

      targetParent.add(fixedBracketGroup);
    });

    // ─── 2. GRUPO MÓVEL / ARTICULADO (TAMPO DE MADEIRA + BRAÇOS HORIZONTAIS C/ GATILHO) ───
    const shelfPivot = new THREE.Group();
    shelfPivot.name = 'RearFoldShelfPivot';
    shelfPivot.position.set(0, pivotY, pivotZ);

    if (isShelfOpen) {
      shelfPivot.rotation.x = Math.PI / 2;
    }

    // Tampo de Madeira Maciça de 18mm
    const shelfGeo = new THREE.BoxGeometry(shelfW, shelfH, shelfT);
    const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
    shelfMesh.position.set(0, -shelfH / 2, -shelfT / 2 - 0.003);
    shelfMesh.castShadow = true;
    shelfMesh.receiveShadow = true;
    const shelfWoodMaterial = finish === 'plywood'
      ? 'Compensado Naval'
      : (finish === 'dark_wood' || finish === 'teak' ? 'Madeira Nobre Maciça' : InternalBoxesBuilder.getWoodMaterialName(box.material));

    shelfMesh.userData = {
      isWoodPart: true,
      dimW: shelfW,
      dimH: shelfT,
      dimL: shelfH,
      thicknessMm: shelfTMm,
      partLabel: `${box.name} • Prateleira Rebatível Traseira [${finishLabel} ${shelfTMm}mm]`,
      isInternalBox: Boolean(box.id),
      boxId: box.id,
      boxRoot: container,
      isRearShelf: true,
      material: `${shelfWoodMaterial} ${shelfTMm}mm (${finishLabel})`,
      woodMaterial: shelfWoodMaterial,
      moduleName: box.name,
      partType: 'shelf'
    };
    shelfPivot.add(shelfMesh);

    const shelfEdgeGeo = new THREE.EdgesGeometry(shelfGeo);
    const shelfEdgeLine = new THREE.LineSegments(shelfEdgeGeo, shelfEdgeMat);
    shelfEdgeLine.position.copy(shelfMesh.position);
    shelfPivot.add(shelfEdgeLine);

    // Braços Horizontais aparafusados sob o tampo de madeira (Giram junto com o tampo)
    bracketXPositions.forEach((bx) => {
      // Canaleta do braço horizontal em U invertido
      const armGeo = new THREE.BoxGeometry(W_b - 0.003, Lh, D_b - 0.003);
      const armMesh = new THREE.Mesh(armGeo, bracketSteelMat);
      armMesh.position.set(bx, -Lh / 2, (D_b - 0.003) / 2 - 0.003);
      shelfPivot.add(armMesh);

      // Nariz frontal arredondado característico da mão francesa estampada
      const noseGeo = new THREE.CylinderGeometry(0.006, 0.006, W_b - 0.004, 12);
      noseGeo.rotateZ(Math.PI / 2);
      const noseMesh = new THREE.Mesh(noseGeo, bracketSteelMat);
      noseMesh.position.set(bx, -Lh + 0.006, (D_b - 0.003) / 2 - 0.003);
      shelfPivot.add(noseMesh);

      // Alavanca / Gatilho de Liberação Rápida com mola (Release Trigger)
      const triggerY = -Lh * 0.45;
      const leverBarGeo = new THREE.BoxGeometry(0.008, 0.045, 0.003);
      const leverBarMesh = new THREE.Mesh(leverBarGeo, bracketSteelMat);
      leverBarMesh.position.set(bx, triggerY, (D_b - 0.003) + 0.002);
      shelfPivot.add(leverBarMesh);

      const triggerTabGeo = new THREE.BoxGeometry(0.010, 0.006, 0.012);
      const triggerTabMesh = new THREE.Mesh(triggerTabGeo, triggerGripMat);
      triggerTabMesh.position.set(bx, triggerY - 0.015, (D_b - 0.003) + 0.006);
      shelfPivot.add(triggerTabMesh);
    });

    targetParent.add(shelfPivot);
  }

  /**
   * Constrói o Armário Aéreo sobre a Caixa até o limite do teto da Doblò.
   * Suporta instalação em qualquer uma das 4 faces:
   * 'rear' (traseira), 'front' (frente), 'left' (lateral esquerda / motorista)
   * ou 'right' (lateral direita / passageiro), bem como múltiplas laterais ('all').
   */
  private buildUpperCabinet(
    container: THREE.Group,
    boxWM: number,
    boxLM: number,
    boxHM: number,
    box: InternalBoxItem,
    isSelected: boolean,
    isOpen: boolean
  ) {
    const tConfig = InternalBoxesBuilder.getBoxThickness(box);
    const t = tConfig.cabinet; // Espessura das chapas do armário aéreo
    const tMm = Math.round(t * 1000);
    const woodMat = InternalBoxesBuilder.getWoodMaterialName(box.material);
    const cabinetUserData = {
      thicknessMm: tMm,
      woodMaterial: woodMat,
      moduleName: box.name,
      partType: 'cabinet',
      material: `${woodMat} ${tMm}mm Impermeabilizado`
    };
    const floorY = InternalBoxesBuilder.FLOOR_Y;
    const ceilingY = InternalBoxesBuilder.CEILING_Y; // 1.72m
    const boxTopY = floorY + boxHM;

    // Espaçamento inferior configurável (padrão 0mm)
    const bottomGapMm = Math.max(0, box.upperCabinetBottomGapMm ?? 0);
    const bottomGapM = bottomGapMm / 1000;

    // Altura vai do topo do vão inferior até o teto da Doblò
    const availableH = ceilingY - (boxTopY + bottomGapM);
    const cabinetH = Math.max(0.15, availableH);

    // Posição Y relativa ao centro da caixa base (centro da caixa está em boxHM / 2):
    const cabinetCenterY = boxHM / 2 + bottomGapM + cabinetH / 2;

    const cabinetMat = new THREE.MeshStandardMaterial({
      color: isSelected ? 0x38bdf8 : (box.material === 'white_mdf' ? 0xf8fafc : (box.material === 'dark_wood' ? 0x78350f : 0xd4a373)),
      roughness: 0.65,
      metalness: 0.05
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0x38bdf8 : 0x475569,
      linewidth: 1,
      transparent: true,
      opacity: 0.6
    });

    const positionMode = box.upperCabinetPositionMode || 'on_box';
    const behindOffsetMm = Math.max(0, box.upperCabinetBehindOffsetMm ?? 0);
    const behindOffsetM = behindOffsetMm / 1000;
    const transverseMode = box.upperCabinetTransverseMode || 'on_box';
    const besideOffsetMm = Math.max(0, box.upperCabinetBesideOffsetMm ?? 0);
    const besideOffsetM = besideOffsetMm / 1000;
    const besideSide = box.upperCabinetBesideSide || 'corridor';
    const offsetMm = box.upperCabinetOffsetMm ?? 0;
    const offsetM = offsetMm / 1000;
    const depthOffsetMm = box.upperCabinetDepthOffsetMm ?? 0;
    const depthOffsetM = depthOffsetMm / 1000;

    // Se NÃO tiver espaçamento inferior (bottomGapMm === 0) e a caixa tiver tampo superior,
    // não precisa ter 2 madeiras a menos que o armário comece fora ou depois do final da caixa.
    const isOverhanging = Math.abs(offsetM) > 0.05 || Math.abs(depthOffsetM) > 0.05 || positionMode === 'behind_box' || transverseMode === 'beside_box';
    const hasBasePanel = bottomGapM > 0.001 || (box.panels?.top === false) || isOverhanging;
    const innerH = hasBasePanel ? (cabinetH - 2 * t) : (cabinetH - t);
    const interiorBottomY = hasBasePanel ? (-cabinetH / 2 + t) : (-cabinetH / 2);
    const backY = hasBasePanel ? 0 : -t / 2;

    const closure = getUpperCabinetClosure(box);
    const hasDoors = closure === 'doors';
    const isDrawer = closure === 'drawer';
    const numShelves = Math.max(1, Math.min(3, box.upperCabinetShelves ?? 1));

    // Determina quais laterais estão ativas
    const activeSides: UpperCabinetSide[] = (() => {
      if (box.upperCabinetSides && box.upperCabinetSides.length > 0) {
        return Array.from(new Set(box.upperCabinetSides));
      }
      if (box.upperCabinetAlign === 'all') {
        return ['rear', 'front', 'left', 'right'];
      }
      if (box.upperCabinetAlign === 'left') return ['left'];
      if (box.upperCabinetAlign === 'right') return ['right'];
      if (box.upperCabinetAlign === 'front') return ['front'];
      return ['rear'];
    })();

    activeSides.forEach((side) => {
      const upperGroup = new THREE.Group();
      upperGroup.name = `UpperCabinet_${box.id}_${side}`;

      if (side === 'rear' || side === 'front') {
        // --- ARMARIO TRANSVERSAL (FRENTE OU TRASEIRA) ---
        const maxDepthMm = Math.max(Math.round(boxLM * 1000), 1200);
        const depthMm = Math.max(100, Math.min(maxDepthMm, box.upperCabinetDepthMm ?? 250));
        const cabinetDepthM = depthMm / 1000;

        const maxWMm = Math.max(Math.round(boxWM * 1000), 1600);
        const widthMm = Math.max(100, Math.min(maxWMm, box.upperCabinetWidthMm ?? Math.round(boxWM * 1000)));
        const cabinetWidthM = widthMm / 1000;

        let cabinetCenterX = (-boxWM / 2 + cabinetWidthM / 2) + offsetM;
        if (transverseMode === 'beside_box') {
          cabinetCenterX = (besideSide === 'outer')
            ? (-boxWM / 2 - cabinetWidthM / 2 - besideOffsetM)
            : (boxWM / 2 + cabinetWidthM / 2 + besideOffsetM);
        }

        let cabinetCenterZ = side === 'rear'
          ? (-boxLM / 2 + cabinetDepthM / 2 + depthOffsetM)
          : (boxLM / 2 - cabinetDepthM / 2 - depthOffsetM);

        if (positionMode === 'behind_box') {
          cabinetCenterZ = side === 'rear'
            ? (-boxLM / 2 - cabinetDepthM / 2 - behindOffsetM)
            : (boxLM / 2 + cabinetDepthM / 2 + behindOffsetM);
        }

        upperGroup.position.set(cabinetCenterX, cabinetCenterY, cabinetCenterZ);

        const innerW = cabinetWidthM - 2 * t;
        const innerD = cabinetDepthM - t;

        // 1. Lateral Esquerda 15mm
        this.addPanel(
          upperGroup,
          t,
          cabinetH,
          cabinetDepthM,
          cabinetWidthM / 2 - t / 2,
          0,
          0,
          cabinetMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Armário Aéreo (${side}) Lateral Esq. (${Math.round(cabinetDepthM * 1000)}×${Math.round(cabinetH * 1000)}mm)`,
          cabinetUserData
        );

        // 2. Lateral Direita 15mm
        this.addPanel(
          upperGroup,
          t,
          cabinetH,
          cabinetDepthM,
          -cabinetWidthM / 2 + t / 2,
          0,
          0,
          cabinetMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Armário Aéreo (${side}) Lateral Dir. (${Math.round(cabinetDepthM * 1000)}×${Math.round(cabinetH * 1000)}mm)`,
          cabinetUserData
        );

        // 3. Tampo Superior 15mm
        this.addPanel(
          upperGroup,
          innerW,
          t,
          cabinetDepthM,
          0,
          cabinetH / 2 - t / 2,
          0,
          cabinetMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Armário Aéreo (${side}) Tampo Teto (${Math.round(innerW * 1000)}×${Math.round(cabinetDepthM * 1000)}mm)`,
          cabinetUserData
        );

        // 4. Base Inferior 15mm
        if (hasBasePanel) {
          this.addPanel(
            upperGroup,
            innerW,
            t,
            cabinetDepthM,
            0,
            -cabinetH / 2 + t / 2,
            0,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Base Inferior (${Math.round(innerW * 1000)}×${Math.round(cabinetDepthM * 1000)}mm)`,
            cabinetUserData
          );
        }

        // 5. Fundo
        const backZ = side === 'rear' ? (-cabinetDepthM / 2 + t / 2) : (cabinetDepthM / 2 - t / 2);
        this.addPanel(
          upperGroup,
          innerW,
          innerH,
          t,
          0,
          backY,
          backZ,
          cabinetMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Armário Aéreo (${side}) Fundo (${Math.round(innerW * 1000)}×${Math.round(innerH * 1000)}mm)`,
          cabinetUserData
        );

        // 6. Prateleiras Internas (apenas para armário convencional com porta ou nicho aberto)
        if (!isDrawer) {
          const shelfSpacing = innerH / (numShelves + 1);
          for (let s = 1; s <= numShelves; s++) {
            const shelfY = interiorBottomY + s * shelfSpacing;
            this.addPanel(
              upperGroup,
              innerW,
              t,
              innerD - 0.01,
              0,
              shelfY,
              side === 'rear' ? 0.005 : -0.005,
              cabinetMat,
              edgeMat,
              box.id,
              container,
              `${box.name} • Armário Aéreo (${side}) Prateleira #${s} (${Math.round(innerW * 1000)}×${Math.round(innerD * 1000)}mm)`,
              cabinetUserData
            );
          }
        }

        // 7. Fechamento Frontal: Corrediça Telescópica vs Porta Basculante vs Nicho Aberto
        const frontZ = side === 'rear' ? (cabinetDepthM / 2) : (-cabinetDepthM / 2);
        if (isDrawer) {
          // ─── GAVETA / MÓDULO DESLIZANTE COM CORREDIÇAS TELESCÓPICAS ───
          const drawerGroup = new THREE.Group();
          drawerGroup.name = `UpperCabinetDrawer_${box.id}_${side}`;

          const slideDistance = (innerD * 0.72) * (side === 'rear' ? 1 : -1);
          if (isOpen) {
            drawerGroup.position.z = slideDistance;
          }

          const clearance = 0.012; // 6mm folga lateral para corrediças
          const dW = Math.max(0.06, innerW - clearance * 2);
          const dH = Math.max(0.06, innerH - 0.010);
          const dD = Math.max(0.06, innerD - 0.010);
          const drawerBottomY = interiorBottomY + t / 2 + 0.004;

          // 1. Fundo da gaveta deslizante
          this.addPanel(
            drawerGroup,
            dW,
            t,
            dD,
            0,
            drawerBottomY,
            0,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Fundo da Gaveta (${Math.round(dW * 1000)}×${Math.round(dD * 1000)}mm)`,
            cabinetUserData
          );

          // 2. Laterais da gaveta (Esq e Dir)
          const drawerWallH = Math.min(dH * 0.75, 0.18);
          this.addPanel(
            drawerGroup,
            t,
            drawerWallH,
            dD,
            -dW / 2 + t / 2,
            drawerBottomY + t / 2 + drawerWallH / 2,
            0,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Lateral Gaveta Esq (${Math.round(dD * 1000)}×${Math.round(drawerWallH * 1000)}mm)`,
            cabinetUserData
          );
          this.addPanel(
            drawerGroup,
            t,
            drawerWallH,
            dD,
            dW / 2 - t / 2,
            drawerBottomY + t / 2 + drawerWallH / 2,
            0,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Lateral Gaveta Dir (${Math.round(dD * 1000)}×${Math.round(drawerWallH * 1000)}mm)`,
            cabinetUserData
          );

          // 3. Traseira da gaveta
          this.addPanel(
            drawerGroup,
            dW - 2 * t,
            drawerWallH,
            t,
            0,
            drawerBottomY + t / 2 + drawerWallH / 2,
            side === 'rear' ? (-dD / 2 + t / 2) : (dD / 2 - t / 2),
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Traseira Gaveta (${Math.round((dW - 2 * t) * 1000)}×${Math.round(drawerWallH * 1000)}mm)`,
            cabinetUserData
          );

          // 4. Prateleiras divisórias internas na gaveta (se numShelves > 1)
          if (numShelves > 1) {
            const shelfSpacing = (dH - t) / numShelves;
            for (let s = 1; s < numShelves; s++) {
              const shelfY = interiorBottomY + s * shelfSpacing;
              this.addPanel(
                drawerGroup,
                dW - 2 * t,
                t,
                dD - 0.01,
                0,
                shelfY,
                0,
                cabinetMat,
                edgeMat,
                box.id,
                container,
                `${box.name} • Armário Aéreo (${side}) Divisória Interna Gaveta #${s}`,
                cabinetUserData
              );
            }
          }

          // 5. Frente da gaveta com puxador/trava náutica
          const doorW = cabinetWidthM - 0.006;
          const doorH = cabinetH - 0.006;
          const doorZ = frontZ + (side === 'rear' ? t / 2 : -t / 2);
          this.addPanel(
            drawerGroup,
            doorW,
            doorH,
            t,
            0,
            0,
            doorZ,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Frente Gaveta c/ Trava (${Math.round(doorW * 1000)}×${Math.round(doorH * 1000)}mm)`,
            cabinetUserData
          );

          // Botão Trava Push-Lock Náutico cromado
          const knobGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.018, 20);
          knobGeo.rotateX(Math.PI / 2);
          const knobMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
          const knobMesh = new THREE.Mesh(knobGeo, knobMat);
          knobMesh.position.set(0, 0, doorZ + (side === 'rear' ? (t / 2 + 0.009) : (-t / 2 - 0.009)));
          knobMesh.userData = {
            isHardware: true,
            partLabel: 'Botão Trava Push-Lock Náutico Cromado (Gaveta)',
            category: '🔩 Ferragens Marítimas & Camper'
          };
          drawerGroup.add(knobMesh);

          // 6. Par de Corrediças Telescópicas Metálicas
          [-dW / 2 - 0.005, dW / 2 + 0.005].forEach((railX, idx) => {
            const railGeo = new THREE.BoxGeometry(0.008, 0.035, dD);
            const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });
            const railMesh = new THREE.Mesh(railGeo, railMat);
            railMesh.position.set(railX, interiorBottomY + 0.03, 0);
            railMesh.userData = {
              isHardware: true,
              partLabel: `Par de Corrediças Telescópicas Reforçadas c/ Trava (${idx === 0 ? 'Esq.' : 'Dir.'})`,
              category: '🔩 Ferragens de Gaveteiros e Bandejas'
            };
            drawerGroup.add(railMesh);
          });

          upperGroup.add(drawerGroup);
        } else if (hasDoors) {
          const doorW = cabinetWidthM - 0.006;
          const doorH = cabinetH - 0.006;
          const doorZ = frontZ + (side === 'rear' ? t / 2 : -t / 2);

          // Eixo pivotante superior para porta basculante (abertura típica de motorhome/campervan para cima)
          const doorPivot = new THREE.Group();
          doorPivot.name = `UpperCabinetDoorPivot_${box.id}_${side}`;
          doorPivot.position.set(0, cabinetH / 2, doorZ);

          const openAngle = Math.PI * 0.42; // ~75 graus basculante para cima
          if (isOpen) {
            // Se o armário está na traseira (-Z), abrir para dentro da van (+Z) requer rotX negativo
            // Se está na frente (+Z), abrir para trás (-Z) requer rotX positivo
            doorPivot.rotation.x = side === 'rear' ? -openAngle : openAngle;
          }

          this.addPanel(
            doorPivot,
            doorW,
            doorH,
            t,
            0,
            -doorH / 2,
            0,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Porta c/ Trava (${Math.round(doorW * 1000)}×${Math.round(doorH * 1000)}mm)`,
            cabinetUserData
          );

          // Dobradiça superior contínua / articulador
          const hingeGeo = new THREE.CylinderGeometry(0.005, 0.005, doorW * 0.94, 12);
          hingeGeo.rotateZ(Math.PI / 2);
          const hingeMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            metalness: 0.85,
            roughness: 0.25
          });
          const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
          hingeMesh.position.set(0, 0, 0);
          hingeMesh.userData = { isHardware: true, partLabel: 'Dobradiça Articulador Superior para Aéreo', category: '🔩 Ferragens Marítimas & Camper' };
          doorPivot.add(hingeMesh);

          // Botão Push-Lock Náutico na parte inferior da porta
          const knobGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.018, 20);
          knobGeo.rotateX(Math.PI / 2);
          const knobMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            metalness: 0.95,
            roughness: 0.15
          });
          const knobMesh = new THREE.Mesh(knobGeo, knobMat);
          knobMesh.position.set(
            cabinetWidthM / 2 - 0.05,
            -doorH + 0.04,
            side === 'rear' ? (t / 2 + 0.009) : (-t / 2 - 0.009)
          );
          knobMesh.userData = {
            isHardware: true,
            partLabel: 'Botão Trava Push-Lock Náutico Cromado',
            category: '🔩 Ferragens Marítimas & Camper'
          };
          doorPivot.add(knobMesh);

          upperGroup.add(doorPivot);
        } else {
          const lipH = 0.025;
          const lipY = interiorBottomY + lipH / 2;
          this.addPanel(
            upperGroup,
            innerW,
            lipH,
            t,
            0,
            lipY,
            frontZ + (side === 'rear' ? -t / 2 : t / 2),
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Friso Anti-Queda (25mm)`,
            cabinetUserData
          );
        }
      } else {
        // --- ARMARIO LONGITUDINAL (LATERAL ESQUERDA OU LATERAL DIREITA) ---
        // Profundidade (avanço da parede para o centro da van, eixo X):
        const maxDepthMm = Math.max(Math.round(boxWM * 1000), 1000);
        const depthMm = Math.max(100, Math.min(maxDepthMm, box.upperCabinetDepthMm ?? 250));
        const cabinetDepthM = depthMm / 1000;

        // Comprimento útil ao longo da van (eixo Z):
        const maxLMm = Math.max(Math.round(boxLM * 1000), 1800);
        const lengthMm = Math.max(100, Math.min(maxLMm, box.upperCabinetWidthMm ?? Math.round(boxLM * 1000)));
        const cabinetLengthM = lengthMm / 1000;

        let cabinetCenterX = side === 'left'
          ? (boxWM / 2 - cabinetDepthM / 2 - depthOffsetM)
          : (-boxWM / 2 + cabinetDepthM / 2 + depthOffsetM);

        if (transverseMode === 'beside_box') {
          if (side === 'left') {
            // Face lateral esquerda (+X). O corredor fica em -X (além da face interna -boxWM/2):
            cabinetCenterX = (besideSide === 'outer')
              ? (boxWM / 2 + cabinetDepthM / 2 + besideOffsetM)
              : (-boxWM / 2 - cabinetDepthM / 2 - besideOffsetM);
          } else {
            // Face lateral direita (-X). O corredor fica em +X (além da face interna +boxWM/2):
            cabinetCenterX = (besideSide === 'outer')
              ? (-boxWM / 2 - cabinetDepthM / 2 - besideOffsetM)
              : (boxWM / 2 + cabinetDepthM / 2 + besideOffsetM);
          }
        }

        // Ponto de início longitudinal com recuo:
        // Se positionMode === 'behind_box', posiciona ATRÁS do móvel (em direção à traseira / porta-malas, eixo -Z):
        // Se positionMode === 'on_box', fica delimitado sobre a caixa (entre o início e o fim).
        let cabinetCenterZ = (-boxLM / 2 + cabinetLengthM / 2) + offsetM;
        if (positionMode === 'behind_box') {
          // A face frontal do aéreo encosta na face traseira da caixa base (-boxLM / 2) menos o recuo para trás
          cabinetCenterZ = (-boxLM / 2 - cabinetLengthM / 2) - behindOffsetM;
        }

        upperGroup.position.set(cabinetCenterX, cabinetCenterY, cabinetCenterZ);

        const innerL = cabinetLengthM - 2 * t;
        const innerD = cabinetDepthM - t;

        // 1. Fechamento Traseiro (-Z) 15mm
        this.addPanel(
          upperGroup,
          cabinetDepthM,
          cabinetH,
          t,
          0,
          0,
          -cabinetLengthM / 2 + t / 2,
          cabinetMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Armário Aéreo (${side}) Fechamento Traseiro (${Math.round(cabinetDepthM * 1000)}×${Math.round(cabinetH * 1000)}mm)`,
          cabinetUserData
        );

        // 2. Fechamento Dianteiro (+Z) 15mm
        this.addPanel(
          upperGroup,
          cabinetDepthM,
          cabinetH,
          t,
          0,
          0,
          cabinetLengthM / 2 - t / 2,
          cabinetMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Armário Aéreo (${side}) Fechamento Frontal (${Math.round(cabinetDepthM * 1000)}×${Math.round(cabinetH * 1000)}mm)`,
          cabinetUserData
        );

        // 3. Tampo Superior (Teto) 15mm
        this.addPanel(
          upperGroup,
          cabinetDepthM,
          t,
          innerL,
          0,
          cabinetH / 2 - t / 2,
          0,
          cabinetMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Armário Aéreo (${side}) Tampo Teto (${Math.round(cabinetDepthM * 1000)}×${Math.round(innerL * 1000)}mm)`,
          cabinetUserData
        );

        // 4. Base Inferior 15mm
        if (hasBasePanel) {
          this.addPanel(
            upperGroup,
            cabinetDepthM,
            t,
            innerL,
            0,
            -cabinetH / 2 + t / 2,
            0,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Base Inferior (${Math.round(cabinetDepthM * 1000)}×${Math.round(innerL * 1000)}mm)`,
            cabinetUserData
          );
        }

        // 5. Fundo encostado na lataria lateral (X)
        const backX = side === 'left' ? (cabinetDepthM / 2 - t / 2) : (-cabinetDepthM / 2 + t / 2);
        this.addPanel(
          upperGroup,
          t,
          innerH,
          innerL,
          backX,
          backY,
          0,
          cabinetMat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Armário Aéreo (${side}) Fundo (${Math.round(innerL * 1000)}×${Math.round(innerH * 1000)}mm)`,
          cabinetUserData
        );

        // 6. Prateleiras Internas (apenas para armário convencional com porta ou nicho aberto)
        if (!isDrawer) {
          const shelfSpacing = innerH / (numShelves + 1);
          for (let s = 1; s <= numShelves; s++) {
            const shelfY = interiorBottomY + s * shelfSpacing;
            this.addPanel(
              upperGroup,
              innerD - 0.01,
              t,
              innerL,
              side === 'left' ? -0.005 : 0.005,
              shelfY,
              0,
              cabinetMat,
              edgeMat,
              box.id,
              container,
              `${box.name} • Armário Aéreo (${side}) Prateleira #${s} (${Math.round(innerD * 1000)}×${Math.round(innerL * 1000)}mm)`,
              cabinetUserData
            );
          }
        }

        // 7. Fechamento Frontal: Corrediça Telescópica vs Porta Basculante vs Nicho Aberto
        const frontX = side === 'left' ? (-cabinetDepthM / 2) : (cabinetDepthM / 2);
        if (isDrawer) {
          // ─── GAVETA / MÓDULO DESLIZANTE COM CORREDIÇAS TELESCÓPICAS ───
          const drawerGroup = new THREE.Group();
          drawerGroup.name = `UpperCabinetDrawer_${box.id}_${side}`;

          const slideDistance = (innerD * 0.72) * (side === 'left' ? -1 : 1);
          if (isOpen) {
            drawerGroup.position.x = slideDistance;
          }

          const clearance = 0.012; // folga lateral para corrediças telescópicas
          const dL = Math.max(0.06, innerL - clearance * 2);
          const dH = Math.max(0.06, innerH - 0.010);
          const dD = Math.max(0.06, innerD - 0.010);
          const drawerBottomY = interiorBottomY + t / 2 + 0.004;
          const drawerCenterX = side === 'left' ? (cabinetDepthM / 2 - dD / 2 - t) : (-cabinetDepthM / 2 + dD / 2 + t);

          // 1. Fundo da gaveta deslizante
          this.addPanel(
            drawerGroup,
            dD,
            t,
            dL,
            drawerCenterX,
            drawerBottomY,
            0,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Fundo da Gaveta (${Math.round(dD * 1000)}×${Math.round(dL * 1000)}mm)`,
            cabinetUserData
          );

          // 2. Laterais da gaveta (Frente e Trás)
          const drawerWallH = Math.min(dH * 0.75, 0.18);
          this.addPanel(
            drawerGroup,
            dD,
            drawerWallH,
            t,
            drawerCenterX,
            drawerBottomY + t / 2 + drawerWallH / 2,
            -dL / 2 + t / 2,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Lateral Gaveta Trás (${Math.round(dD * 1000)}×${Math.round(drawerWallH * 1000)}mm)`,
            cabinetUserData
          );
          this.addPanel(
            drawerGroup,
            dD,
            drawerWallH,
            t,
            drawerCenterX,
            drawerBottomY + t / 2 + drawerWallH / 2,
            dL / 2 - t / 2,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Lateral Gaveta Frente (${Math.round(dD * 1000)}×${Math.round(drawerWallH * 1000)}mm)`,
            cabinetUserData
          );

          // 3. Fundo interno da gaveta (junto à lataria)
          this.addPanel(
            drawerGroup,
            t,
            drawerWallH,
            dL - 2 * t,
            side === 'left' ? (cabinetDepthM / 2 - t / 2 - t) : (-cabinetDepthM / 2 + t / 2 + t),
            drawerBottomY + t / 2 + drawerWallH / 2,
            0,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Traseira Gaveta (${Math.round((dL - 2 * t) * 1000)}×${Math.round(drawerWallH * 1000)}mm)`,
            cabinetUserData
          );

          // 4. Prateleiras divisórias internas na gaveta (se numShelves > 1)
          if (numShelves > 1) {
            const shelfSpacing = (dH - t) / numShelves;
            for (let s = 1; s < numShelves; s++) {
              const shelfY = interiorBottomY + s * shelfSpacing;
              this.addPanel(
                drawerGroup,
                dD - 0.01,
                t,
                dL - 2 * t,
                drawerCenterX,
                shelfY,
                0,
                cabinetMat,
                edgeMat,
                box.id,
                container,
                `${box.name} • Armário Aéreo (${side}) Divisória Interna Gaveta #${s}`,
                cabinetUserData
              );
            }
          }

          // 5. Frente da gaveta com botão push-lock náutico
          const doorL = cabinetLengthM - 0.006;
          const doorH = cabinetH - 0.006;
          const doorX = frontX + (side === 'left' ? -t / 2 : t / 2);
          this.addPanel(
            drawerGroup,
            t,
            doorH,
            doorL,
            doorX,
            0,
            0,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Frente Gaveta c/ Trava (${Math.round(doorL * 1000)}×${Math.round(doorH * 1000)}mm)`,
            cabinetUserData
          );

          // Botão Push-Lock Náutico cromado
          const knobGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.018, 20);
          knobGeo.rotateZ(Math.PI / 2);
          const knobMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
          const knobMesh = new THREE.Mesh(knobGeo, knobMat);
          knobMesh.position.set(
            doorX + (side === 'left' ? (-t / 2 - 0.009) : (t / 2 + 0.009)),
            0,
            0
          );
          knobMesh.userData = {
            isHardware: true,
            partLabel: 'Botão Trava Push-Lock Náutico Cromado (Gaveta)',
            category: '🔩 Ferragens Marítimas & Camper'
          };
          drawerGroup.add(knobMesh);

          // 6. Par de Corrediças Telescópicas Metálicas
          [-dL / 2 - 0.005, dL / 2 + 0.005].forEach((railZ, idx) => {
            const railGeo = new THREE.BoxGeometry(dD, 0.035, 0.008);
            const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });
            const railMesh = new THREE.Mesh(railGeo, railMat);
            railMesh.position.set(drawerCenterX, interiorBottomY + 0.03, railZ);
            railMesh.userData = {
              isHardware: true,
              partLabel: `Par de Corrediças Telescópicas Reforçadas c/ Trava (${idx === 0 ? 'Frente' : 'Trás'})`,
              category: '🔩 Ferragens de Gaveteiros e Bandejas'
            };
            drawerGroup.add(railMesh);
          });

          upperGroup.add(drawerGroup);
        } else if (hasDoors) {
          const doorL = cabinetLengthM - 0.006;
          const doorH = cabinetH - 0.006;
          const doorX = frontX + (side === 'left' ? -t / 2 : t / 2);

          // Eixo pivotante superior para porta basculante
          const doorPivot = new THREE.Group();
          doorPivot.name = `UpperCabinetDoorPivot_${box.id}_${side}`;
          doorPivot.position.set(doorX, cabinetH / 2, 0);

          const openAngle = Math.PI * 0.42; // ~75 graus basculante para cima
          if (isOpen) {
            // Se o armário está no lado esquerdo (+X), abrir para o corredor (-X) requer rotZ negativo
            // Se está no lado direito (-X), abrir para o corredor (+X) requer rotZ positivo
            doorPivot.rotation.z = side === 'left' ? -openAngle : openAngle;
          }

          this.addPanel(
            doorPivot,
            t,
            doorH,
            doorL,
            0,
            -doorH / 2,
            0,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Porta c/ Trava (${Math.round(doorL * 1000)}×${Math.round(doorH * 1000)}mm)`,
            cabinetUserData
          );

          // Dobradiça articuladora superior contínua
          const hingeGeo = new THREE.CylinderGeometry(0.005, 0.005, doorL * 0.94, 12);
          hingeGeo.rotateX(Math.PI / 2);
          const hingeMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            metalness: 0.85,
            roughness: 0.25
          });
          const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
          hingeMesh.position.set(0, 0, 0);
          hingeMesh.userData = { isHardware: true, partLabel: 'Dobradiça Articulador Superior para Aéreo', category: '🔩 Ferragens Marítimas & Camper' };
          doorPivot.add(hingeMesh);

          // Botão Push-Lock Náutico apontando em X na parte inferior da porta
          const knobGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.018, 20);
          knobGeo.rotateZ(Math.PI / 2);
          const knobMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            metalness: 0.95,
            roughness: 0.15
          });
          const knobMesh = new THREE.Mesh(knobGeo, knobMat);
          knobMesh.position.set(
            side === 'left' ? (-t / 2 - 0.009) : (t / 2 + 0.009),
            -doorH + 0.04,
            cabinetLengthM / 2 - 0.05
          );
          knobMesh.userData = {
            isHardware: true,
            partLabel: 'Botão Trava Push-Lock Náutico Cromado',
            category: '🔩 Ferragens Marítimas & Camper'
          };
          doorPivot.add(knobMesh);

          upperGroup.add(doorPivot);
        } else {
          const lipH = 0.025;
          const lipY = interiorBottomY + lipH / 2;
          this.addPanel(
            upperGroup,
            t,
            lipH,
            innerL,
            frontX + (side === 'left' ? t / 2 : -t / 2),
            lipY,
            0,
            cabinetMat,
            edgeMat,
            box.id,
            container,
            `${box.name} • Armário Aéreo (${side}) Friso Anti-Queda (25mm)`,
            cabinetUserData
          );
        }
      }

      container.add(upperGroup);
    });
  }

  /**
   * Constrói a Mesa Dinette Central com Pedestal Náutico fixada diretamente
   * na chapa base de compensado naval de 15mm do assoalho da Doblò.
   * Conforme especificação física e fotos reais:
   * 1. Flange náutica circular aparafusada na chapa de compensado naval de 15mm.
   * 2. Coluna tubular de aço preto Ø45mm de encaixe rápido com braçadeiras duplas.
   * 3. Flange superior de suporte sob o tampo.
   * 4. Tampo de madeira maciça com 4 cantos arredondados e bordas boleadas.
   * 5. Ajuste livre de deslocamento longitudinal (Z), lateral (X), altura (Y) e rotação 360°.
   */
  private buildFloorCentralTable(
    floorGroup: THREE.Group,
    widthM: number,
    lengthM: number,
    floorY: number,
    cfg: CentralTableConfig
  ) {
    const tableWM = (cfg.widthMm ?? 450) / 1000;
    const tableLM = (cfg.lengthMm ?? 650) / 1000;
    const heightFromFloorM = (cfg.heightMm ?? 720) / 1000; // padrão 72cm a partir da face superior da chapa de 15mm
    const tableThickness = 0.018; // 18mm de madeira maciça

    const centerZ = -lengthM / 2;
    const offX = (cfg.offsetX ?? 0) / 1000;
    const offZ = (cfg.offsetZ ?? 0) / 1000;
    const rotRad = ((cfg.rotationDeg ?? 0) * Math.PI) / 180;

    const tableGroup = new THREE.Group();
    tableGroup.name = 'FloorCentralTable';
    // Assentada diretamente sobre a face superior do compensado naval de 15mm (floorY = 0.48)
    tableGroup.position.set(offX, floorY, centerZ + offZ);

    // ─── 1. FLANGE NÁUTICA CIRCULAR DE PISO (FIXADA NO COMPENSADO NAVAL 15mm) ───
    const flangeRadius = 0.08; // Ø160mm base de piso
    const flangeH = 0.010; // 10mm de espessura
    const flangeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Alumínio usinado / inox acetinado
      metalness: 0.90,
      roughness: 0.22
    });
    const floorFlangeGeo = new THREE.CylinderGeometry(flangeRadius, flangeRadius, flangeH, 24);
    const floorFlangeMesh = new THREE.Mesh(floorFlangeGeo, flangeMat);
    floorFlangeMesh.name = 'FloorTableFlange_BasePiso';
    floorFlangeMesh.position.set(0, flangeH / 2, 0);
    floorFlangeMesh.castShadow = true;
    floorFlangeMesh.receiveShadow = true;
    floorFlangeMesh.userData = {
      isHardware: true,
      partLabel: 'Flange Náutica de Piso Ø160mm (Compensado Naval 15mm)',
      name: 'Flange Circular de Piso Náutica',
      category: '🔩 Ferragens de Fixação no Assoalho',
      purpose: 'Flange circular de alumínio usinado com parafusos inox fixados na chapa de compensado naval de 15mm'
    };
    tableGroup.add(floorFlangeMesh);

    // ─── 2. PEDESTAL METÁLICO (COLUNA TUBULAR PRETA) ───
    const tubeRadius = 0.0225; // Ø45mm diâmetro
    const tubeHeight = Math.max(0.20, heightFromFloorM - tableThickness);
    const tubeGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeHeight, 24);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // preto acetinado automotivo
      metalness: 0.85,
      roughness: 0.30
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    tubeMesh.name = 'FloorTablePedestal_Column';
    tubeMesh.position.set(0, tubeHeight / 2, 0);
    tubeMesh.castShadow = true;
    tubeMesh.receiveShadow = true;
    tubeMesh.userData = {
      isHardware: true,
      partLabel: `Pedestal Tubular Central Náutico Ø45mm (${Math.round(tubeHeight * 1000)} mm)`,
      name: 'Coluna Tubular Náutica Removível',
      category: '🔩 Ferragens Marítimas & Camper',
      purpose: 'Coluna central de apoio com encaixe rápido na flange de piso fixada no compensado naval 15mm'
    };
    tableGroup.add(tubeMesh);

    // ─── 3. BRAÇADEIRAS DUPLAS DE FIXAÇÃO COM MANÍPULOS ───
    const clampMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const knobMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });

    const clampHeights = [
      Math.min(0.18, tubeHeight * 0.25),
      Math.min(0.38, tubeHeight * 0.55)
    ];

    clampHeights.forEach((cY, idx) => {
      const clampGeo = new THREE.BoxGeometry(tubeRadius * 3.2, 0.035, 0.03);
      const clampMesh = new THREE.Mesh(clampGeo, clampMat);
      clampMesh.name = `FloorTableClamp_Bracket_${idx}`;
      clampMesh.position.set(0, cY, 0.015);
      clampMesh.castShadow = true;
      tableGroup.add(clampMesh);

      const knobGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.032, 12);
      knobGeo.rotateZ(Math.PI / 2);
      const knobMesh = new THREE.Mesh(knobGeo, knobMat);
      knobMesh.name = `FloorTableKnob_${idx}`;
      knobMesh.position.set(tubeRadius * 2.0, cY, 0.015);
      tableGroup.add(knobMesh);
    });

    // ─── 4. FLANGE SUPERIOR SOB O TAMPO ───
    const topFlangeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.012, 24);
    const topFlangeMesh = new THREE.Mesh(topFlangeGeo, clampMat);
    topFlangeMesh.name = 'FloorTableTopFlange';
    topFlangeMesh.position.set(0, heightFromFloorM - tableThickness - 0.006, 0);
    topFlangeMesh.castShadow = true;
    tableGroup.add(topFlangeMesh);

    // ─── 5. TAMPO DE MADEIRA COM CANTOS ARREDONDADOS ───
    const radius = Math.min(0.05, Math.min(tableWM, tableLM) * 0.15);
    const hw = tableWM / 2;
    const hl = tableLM / 2;

    const shape = new THREE.Shape();
    shape.moveTo(-hw + radius, -hl);
    shape.lineTo(hw - radius, -hl);
    shape.quadraticCurveTo(hw, -hl, hw, -hl + radius);
    shape.lineTo(hw, hl - radius);
    shape.quadraticCurveTo(hw, hl, hw - radius, hl);
    shape.lineTo(-hw + radius, hl);
    shape.quadraticCurveTo(-hw, hl, -hw, hl - radius);
    shape.lineTo(-hw, -hl + radius);
    shape.quadraticCurveTo(-hw, -hl, -hw + radius, -hl);

    const tableTopGeo = new THREE.ExtrudeGeometry(shape, {
      depth: tableThickness,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.003,
      bevelThickness: 0.003
    });
    tableTopGeo.rotateX(-Math.PI / 2);

    let finishColor = 0xd4a373; // Pinus / Compensado padrão
    if (cfg.finish === 'teak') finishColor = 0xb45309;
    if (cfg.finish === 'dark_wood') finishColor = 0x78350f;
    if (cfg.finish === 'pine_block') finishColor = 0xd97706;

    const tableMat = new THREE.MeshStandardMaterial({
      color: finishColor,
      roughness: 0.65,
      metalness: 0.05
    });

    const tableTopMesh = new THREE.Mesh(tableTopGeo, tableMat);
    tableTopMesh.position.set(0, heightFromFloorM - tableThickness / 2, 0);
    tableTopMesh.rotation.y = rotRad;
    tableTopMesh.castShadow = true;
    tableTopMesh.receiveShadow = true;
    const tableThicknessMm = Math.round(tableThickness * 1000);
    const tableWoodMaterial = (cfg.finish === 'teak' || cfg.finish === 'dark_wood')
      ? 'Madeira Nobre Maciça'
      : 'Compensado Naval';
    tableTopMesh.userData = {
      isWoodPart: true,
      dimW: tableWM,
      dimH: tableThickness,
      dimL: tableLM,
      thicknessMm: tableThicknessMm,
      woodMaterial: tableWoodMaterial,
      moduleName: 'Mesa Dinette Central',
      partType: 'table',
      partLabel: `Tampo de Mesa Dinette Central (${Math.round(tableWM * 1000)}×${Math.round(tableLM * 1000)}×${tableThicknessMm}mm)`,
      name: 'Tampo Mesa Dinette Central',
      category: '🍽️ Mobília & Mesas Campervan',
      material: `${tableWoodMaterial} ${tableThicknessMm}mm Bordas Boleadas`,
      purpose: 'Mesa de refeições, notebook e convivência com pedestal náutico fixada na chapa de compensado naval de 15mm'
    };
    tableGroup.add(tableTopMesh);

    // Borda perimetral suave
    const topEdgeGeo = new THREE.EdgesGeometry(tableTopGeo, 25);
    const topEdgeMat = new THREE.LineBasicMaterial({ color: 0x78350f, transparent: true, opacity: 0.6 });
    const topEdgeLine = new THREE.LineSegments(topEdgeGeo, topEdgeMat);
    topEdgeLine.position.copy(tableTopMesh.position);
    topEdgeLine.rotation.copy(tableTopMesh.rotation);
    tableGroup.add(topEdgeLine);

    floorGroup.add(tableGroup);
  }

  /**
   * Constrói o perfil de alumínio cantoneira de quina 45° com fita LED COB na base do módulo.
   * Iluminação indireta de piso e balizamento noturno indicada em cada módulo individual.
   */
  private buildBoxLedCorner(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    box: InternalBoxItem,
    isSelected: boolean
  ) {
    const ledCfg = box.ledCorner || { enabled: true };
    if (ledCfg.enabled === false && !box.hasLedCorner) return;

    const ledColorHex = new THREE.Color(ledCfg.color || '#fef3c7').getHex();
    const brightness = Math.max(0.1, Math.min(1.5, (ledCfg.brightness ?? 85) / 100));

    // Determina quais quinas inferiores receberão o perfil
    const edges: BoxLedEdge[] = (ledCfg.edges && ledCfg.edges.length > 0)
      ? ledCfg.edges
      : ['rear'];

    const hasRear = edges.includes('rear');
    const hasFront = edges.includes('front');

    const ledGroup = new THREE.Group();
    ledGroup.name = `BoxLedCorners_${box.id}`;

    // Materiais: Perfil de Alumínio Cinza + Capa Plástica Branca Leitosa + Ponteiras Brancas + Fita COB
    const aluminumMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Alumínio anodizado cinza natural fosco
      metalness: 0.85,
      roughness: 0.32
    });

    const whitePlasticMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Plástico branco leitoso puro (policarbonato fosco translúcido)
      roughness: 0.45,
      metalness: 0.0,
      emissive: ledColorHex,
      emissiveIntensity: brightness * 0.45 // Luz suave através do plástico preservando a tonalidade branca da capa plástica
    });

    const capMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Ponteiras plásticas brancas de fechamento nas extremidades
      roughness: 0.55,
      metalness: 0.0
    });

    const stripMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Fita COB interna amarelo fósforo
      emissive: ledColorHex,
      emissiveIntensity: brightness * 1.6,
      roughness: 0.3
    });

    const S = 0.016; // Perfil de quina 16x16mm
    const yBottom = -h / 2;

    edges.forEach((edge) => {
      // Ajuste de comprimento para junção limpa nos cantos sem sobreposição
      let length = (edge === 'rear' || edge === 'front') ? w : l;
      if (edge === 'left' || edge === 'right') {
        if (hasRear) length -= S;
        if (hasFront) length -= S;
      }
      length = Math.max(0.04, length);

      // 1. Perfil de Alumínio Cinza (Cantoneira 90° com abas de retenção do difusor)
      const profileShape = new THREE.Shape();
      profileShape.moveTo(0, 0);
      profileShape.lineTo(0, S);
      profileShape.lineTo(0.0028, S);
      profileShape.lineTo(0.0028, S - 0.0014);
      profileShape.lineTo(0.0014, S - 0.0025);
      profileShape.lineTo(0.0014, 0.0014);
      profileShape.lineTo(S - 0.0025, 0.0014);
      profileShape.lineTo(S - 0.0014, 0.0028);
      profileShape.lineTo(S, 0.0028);
      profileShape.lineTo(S, 0);
      profileShape.closePath();

      const profileGeo = new THREE.ExtrudeGeometry(profileShape, {
        depth: length,
        bevelEnabled: false
      });

      const profileMesh = new THREE.Mesh(profileGeo, aluminumMat);
      profileMesh.name = `BoxLedProfile_Aluminum_${edge}_${box.id}`;

      // Linhas de quina metálicas no perfil para realçar os cantos de alumínio cinza
      const profileEdgeGeo = new THREE.EdgesGeometry(profileGeo, 30);
      const profileEdgeMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.45 });
      const profileEdgeLine = new THREE.LineSegments(profileEdgeGeo, profileEdgeMat);

      // 2. Capa Difusora em Plástico Branco Leitoso (Lente 45° com abaulamento sutil)
      const diffuserShape = new THREE.Shape();
      const midX = S / 2 + 0.0006;
      const midY = S / 2 + 0.0006;
      const inMidX = S / 2 - 0.0004;
      const inMidY = S / 2 - 0.0004;

      diffuserShape.moveTo(0.0025, S - 0.0010);
      diffuserShape.quadraticCurveTo(midX, midY, S - 0.0010, 0.0025);
      diffuserShape.lineTo(S - 0.0022, 0.0035);
      diffuserShape.quadraticCurveTo(inMidX, inMidY, 0.0035, S - 0.0022);
      diffuserShape.closePath();

      const diffuserGeo = new THREE.ExtrudeGeometry(diffuserShape, {
        depth: Math.max(0.02, length - 0.004),
        bevelEnabled: false
      });

      const diffuserMesh = new THREE.Mesh(diffuserGeo, whitePlasticMat);
      diffuserMesh.name = `BoxLedDiffuser_WhitePlastic_${edge}_${box.id}`;
      diffuserMesh.position.z = 0.002;

      // 3. Ponteiras Plásticas Brancas nas duas extremidades
      const capShape = new THREE.Shape();
      capShape.moveTo(0, 0);
      capShape.lineTo(0, S);
      capShape.lineTo(S, 0);
      capShape.closePath();

      const capGeo = new THREE.ExtrudeGeometry(capShape, {
        depth: 0.0015,
        bevelEnabled: false
      });

      const capStart = new THREE.Mesh(capGeo, capMat);
      capStart.name = `BoxLedCap_Start_${edge}_${box.id}`;
      capStart.position.set(0, 0, -0.001);

      const capEnd = new THREE.Mesh(capGeo, capMat);
      capEnd.name = `BoxLedCap_End_${edge}_${box.id}`;
      capEnd.position.set(0, 0, length - 0.0005);

      // 4. Fita LED COB interna (fita amarela interna visível no canal)
      const stripGeo = new THREE.BoxGeometry(0.006, 0.0006, Math.max(0.02, length - 0.006));
      const stripMesh = new THREE.Mesh(stripGeo, stripMat);
      stripMesh.name = `BoxLedStrip_${edge}_${box.id}`;
      stripMesh.position.set(0.005, 0.005, length / 2);
      stripMesh.rotation.z = -Math.PI / 4;

      const edgeGroup = new THREE.Group();
      edgeGroup.add(profileMesh);
      edgeGroup.add(profileEdgeLine);
      edgeGroup.add(diffuserMesh);
      edgeGroup.add(capStart);
      edgeGroup.add(capEnd);
      edgeGroup.add(stripMesh);

      const edgeLabel = edge === 'rear'
        ? 'Face Traseira (Porta-malas)'
        : edge === 'front'
          ? 'Face Frontal'
          : edge === 'left'
            ? 'Lateral Esquerda'
            : 'Lateral Direita';

      const partData = {
        isHardware: true,
        isElectrical: true,
        partLabel: `Perfil Quina LED 45° Cinza c/ Difusor Plástico Branco (${Math.round(length * 1000)} mm) - ${box.name}`,
        name: 'Perfil Alumínio Cantoneira 45° Cinza c/ Capa Plástica Branca Leitosa e LED COB',
        category: '💡 Iluminação de Quina do Módulo',
        barProfile: `${Math.round(length * 1000)} mm • 12V 10W/m`,
        capacity: 'Iluminação Indireta de Chão / Cortesia',
        purpose: `Perfil de quina 16×16mm em alumínio cinza anodizado com capa difusora em plástico branco leitoso e fita LED COB 12V na quina inferior (${edgeLabel})`
      };

      profileMesh.userData = partData;
      diffuserMesh.userData = {
        ...partData,
        partLabel: `Difusor Plástico Branco Leitoso 45° (${Math.round(length * 1000)} mm) - ${box.name}`,
        name: 'Capa Plástica Branca Leitosa (Difusor Policarbonato)'
      };
      capStart.userData = {
        isHardware: true,
        partLabel: 'Ponteira Plástica Branca Terminal c/ Passa-fio',
        category: '💡 Acessórios Plásticos LED'
      };
      capEnd.userData = {
        isHardware: true,
        partLabel: 'Ponteira Plástica Branca Terminal c/ Passa-fio',
        category: '💡 Acessórios Plásticos LED'
      };

      if (edge === 'rear') {
        edgeGroup.rotation.y = Math.PI / 2;
        edgeGroup.position.set(-length / 2, yBottom, -l / 2);
      } else if (edge === 'front') {
        edgeGroup.rotation.y = -Math.PI / 2;
        edgeGroup.position.set(length / 2, yBottom, l / 2);
      } else if (edge === 'left') {
        const zOffset = hasRear ? -l / 2 + S : -l / 2;
        edgeGroup.position.set(w / 2, yBottom, zOffset);
      } else if (edge === 'right') {
        const zOffset = hasRear ? l / 2 - S : l / 2;
        edgeGroup.rotation.y = Math.PI;
        edgeGroup.position.set(-w / 2, yBottom, zOffset);
      }

      ledGroup.add(edgeGroup);
    });

    // Ponto de luz suave iluminando o chão próximo ao módulo
    const pointLight = new THREE.PointLight(ledColorHex, brightness * 0.7, 1.4, 1.6);
    pointLight.position.set(0, yBottom + 0.05, hasRear ? -l / 2 - 0.05 : 0);
    ledGroup.add(pointLight);

    container.add(ledGroup);
  }

  /**
   * Constrói e instala componentes elétricos no interior de um módulo do camper:
   * - Bateria Kingbo LiFePO4 560Ah: estritamente apoiada na base (fundo do móvel), posições na base e rotação 0°/90°
   * - Controlador MPPT 60A, DC-DC B2B e Usina: fixação parafusada nas paredes internas (traseira, dianteira, esquerda, direita) ou base
   * - Inclui parafusos zincados/inox nas abas de fixação para parafusamento realista em compensado naval
   */
  private buildBoxElectronics(
    container: THREE.Group,
    w: number,
    l: number,
    h: number,
    box: InternalBoxItem,
    isSelected: boolean
  ) {
    if (!box.electronics || box.electronics.length === 0) return;

    // Se for gaveta deslizante, anexa ao grupo da gaveta móvel para deslizar junto ao abrir
    const targetParent = (container.getObjectByName('DrawerSlide') as THREE.Group) || container;
    const t = InternalBoxesBuilder.PLYWOOD_THICKNESS; // 15mm

    // Dimensões internas úteis
    const wIn = Math.max(0.10, w - 2 * t);
    const lIn = Math.max(0.10, l - 2 * t);
    const hIn = Math.max(0.10, h - t);

    // Material dos parafusos de fixação (aço zincado brilhante / inox)
    const screwMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.18
    });
    const screwHeadGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.003, 10);
    screwHeadGeo.rotateX(Math.PI / 2);

    box.electronics.forEach((item) => {
      const catalogMeta = ELECTRONIC_COMPONENTS_CATALOG[item.id];
      if (!catalogMeta) return;

      let mesh: THREE.Group;
      const compW = catalogMeta.dimensionsMm.width / 1000;
      const compH = catalogMeta.dimensionsMm.height / 1000;
      const compD = catalogMeta.dimensionsMm.depth / 1000;

      // Cria a malha do componente correspondente
      if (item.id === 'battery') {
        mesh = PowerStorageBuilder.createBatteryMesh();
      } else if (item.id === 'mppt') {
        mesh = PowerStorageBuilder.createMPPTMesh({ includeCables: false });
        // MPPT: gira Math.PI para alinhar o verso (aletas) com -Z e frente LCD com +Z
        mesh.rotation.y = Math.PI;
      } else if (item.id === 'b2b') {
        mesh = PowerStorageBuilder.createB2BMesh({ includeCables: false });
      } else if (item.id === 'usina') {
        mesh = PowerStorageBuilder.createUsinaMesh({ includeCables: false });
      } else {
        return;
      }

      // Vincula metadados ao grupo e filhos para seleção e hover
      mesh.userData = {
        ...mesh.userData,
        boxId: box.id,
        boxName: box.name
      };
      mesh.traverse((child: any) => {
        if (child.isMesh) {
          child.userData = {
            ...child.userData,
            boxId: box.id,
            boxName: box.name
          };
        }
      });

      // Wrapper para controle independente de translação, rotação e parafusamento
      const compWrapper = new THREE.Group();
      compWrapper.name = `Installed_${item.id}_${box.id}`;
      compWrapper.add(mesh);

      // Bateria é sempre na base ('bottom')
      const face = item.id === 'battery' ? 'bottom' : (item.mountFace || 'bottom');
      const pos = item.position || 'center';
      const isRotated = Boolean(item.rotationDeg === 90);

      // Micro-deslocamentos customizados pelo usuário em milímetros
      const customOffX = (item.customOffsetXmm || 0) / 1000;
      const customOffY = (item.customOffsetYmm || 0) / 1000;
      const customOffZ = (item.customOffsetZmm || 0) / 1000;

      // ─────────────────────────────────────────────────────────────
      // FIXAÇÃO 1: APOIADO NA BASE / FUNDO (FACE: 'bottom')
      // ─────────────────────────────────────────────────────────────
      if (face === 'bottom') {
        const effW = isRotated ? compD : compW;
        const effL = isRotated ? compW : compD;

        // Fundo do módulo: Y = -h/2 + t (apoiado diretamente sobre a chapa de piso)
        const posY = -h / 2 + t + compH / 2 + customOffY;

        // Espaço disponível para posicionamento no plano XZ
        const spanX = Math.max(0, (wIn - effW) / 2);
        const spanZ = Math.max(0, (lIn - effL) / 2);

        let posX = 0;
        let posZ = 0;

        if (pos.includes('left')) posX = spanX;
        else if (pos.includes('right')) posX = -spanX;

        if (pos.includes('front')) posZ = spanZ;
        else if (pos.includes('rear')) posZ = -spanZ;

        compWrapper.position.set(posX + customOffX, posY, posZ + customOffZ);
        compWrapper.rotation.y = isRotated ? Math.PI / 2 : 0;
      }
      // ─────────────────────────────────────────────────────────────
      // FIXAÇÃO 2: PARAFUSADO NA PAREDE TRASEIRA (FACE: 'rear_wall')
      // ─────────────────────────────────────────────────────────────
      else if (face === 'rear_wall') {
        // Verso encostado na face interna da parede traseira (Z = -l/2 + t)
        const posZ = -l / 2 + t + compD / 2 + customOffZ;

        // X ao longo da parede
        const spanX = Math.max(0, (wIn - compW) / 2);
        let posX = 0;
        if (pos.includes('left')) posX = spanX;
        else if (pos.includes('right')) posX = -spanX;

        // Y na parede
        let posY = -h / 2 + t + compH / 2;
        if (pos.startsWith('top')) posY = h / 2 - t - compH / 2;
        else if (pos.startsWith('mid')) posY = 0;
        else if (pos.startsWith('bottom')) posY = -h / 2 + t + compH / 2;

        compWrapper.position.set(posX + customOffX, posY + customOffY, posZ);
        compWrapper.rotation.y = 0; // Frente voltada para a frente (+Z)

        // 4 Parafusos de fixação nas abas contra a parede de compensado
        this.addWallMountingScrews(compWrapper, compW, compH, -compD / 2, screwHeadGeo, screwMat);
      }
      // ─────────────────────────────────────────────────────────────
      // FIXAÇÃO 3: PARAFUSADO NA PAREDE DIANTEIRA (FACE: 'front_wall')
      // ─────────────────────────────────────────────────────────────
      else if (face === 'front_wall') {
        // Verso encostado na face interna da parede dianteira (Z = +l/2 - t)
        const posZ = l / 2 - t - compD / 2 + customOffZ;

        const spanX = Math.max(0, (wIn - compW) / 2);
        let posX = 0;
        if (pos.includes('left')) posX = spanX;
        else if (pos.includes('right')) posX = -spanX;

        let posY = -h / 2 + t + compH / 2;
        if (pos.startsWith('top')) posY = h / 2 - t - compH / 2;
        else if (pos.startsWith('mid')) posY = 0;
        else if (pos.startsWith('bottom')) posY = -h / 2 + t + compH / 2;

        compWrapper.position.set(posX + customOffX, posY + customOffY, posZ);
        compWrapper.rotation.y = Math.PI; // Frente voltada para trás (-Z)

        this.addWallMountingScrews(compWrapper, compW, compH, -compD / 2, screwHeadGeo, screwMat);
      }
      // ─────────────────────────────────────────────────────────────
      // FIXAÇÃO 4: PARAFUSADO NA PAREDE LATERAL ESQUERDA (FACE: 'left_wall')
      // ─────────────────────────────────────────────────────────────
      else if (face === 'left_wall') {
        // Verso encostado na face interna da parede esquerda (+X = +w/2 - t)
        const posX = w / 2 - t - compD / 2 + customOffX;

        // Z ao longo da lateral
        const spanZ = Math.max(0, (lIn - compW) / 2);
        let posZ = 0;
        if (pos.includes('left')) posZ = -spanZ; // Em direção à traseira
        else if (pos.includes('right')) posZ = spanZ; // Em direção à frente

        let posY = -h / 2 + t + compH / 2;
        if (pos.startsWith('top')) posY = h / 2 - t - compH / 2;
        else if (pos.startsWith('mid')) posY = 0;
        else if (pos.startsWith('bottom')) posY = -h / 2 + t + compH / 2;

        compWrapper.position.set(posX, posY + customOffY, posZ + customOffZ);
        compWrapper.rotation.y = -Math.PI / 2; // Frente voltada para a direita (-X)

        this.addWallMountingScrews(compWrapper, compW, compH, -compD / 2, screwHeadGeo, screwMat);
      }
      // ─────────────────────────────────────────────────────────────
      // FIXAÇÃO 5: PARAFUSADO NA PAREDE LATERAL DIREITA (FACE: 'right_wall')
      // ─────────────────────────────────────────────────────────────
      else if (face === 'right_wall') {
        // Verso encostado na face interna da parede direita (-X = -w/2 + t)
        const posX = -w / 2 + t + compD / 2 + customOffX;

        const spanZ = Math.max(0, (lIn - compW) / 2);
        let posZ = 0;
        if (pos.includes('left')) posZ = spanZ; // Em direção à frente
        else if (pos.includes('right')) posZ = -spanZ; // Em direção à traseira

        let posY = -h / 2 + t + compH / 2;
        if (pos.startsWith('top')) posY = h / 2 - t - compH / 2;
        else if (pos.startsWith('mid')) posY = 0;
        else if (pos.startsWith('bottom')) posY = -h / 2 + t + compH / 2;

        compWrapper.position.set(posX, posY + customOffY, posZ + customOffZ);
        compWrapper.rotation.y = Math.PI / 2; // Frente voltada para a esquerda (+X)

        this.addWallMountingScrews(compWrapper, compW, compH, -compD / 2, screwHeadGeo, screwMat);
      }

      targetParent.add(compWrapper);
    });
  }

  /**
   * Adiciona 4 parafusos de fixação metálicos realistas nos cantos das flanges/abas do componente
   */
  private addWallMountingScrews(
    parent: THREE.Group,
    w: number,
    h: number,
    backZ: number,
    geo: THREE.BufferGeometry,
    mat: THREE.Material
  ) {
    const xOff = w / 2 + 0.008;
    const yOff = h / 2 - 0.015;
    const zPos = backZ + 0.0015;

    [
      [-xOff, yOff],
      [xOff, yOff],
      [-xOff, -yOff],
      [xOff, -yOff]
    ].forEach(([sx, sy]) => {
      const screw = new THREE.Mesh(geo, mat);
      screw.position.set(sx, sy, zPos);
      parent.add(screw);
    });
  }

  /**
   * Constrói o teto / forro do compartimento do campervan (Fiat Doblò)
   * Suporta forro Ripado em madeira nobre/pinus/compensado ou Chapa contínua (MDF ou Compensado)
   * com curvatura transversal acompanhando o arco do teto da Doblò e iluminação LED integrada.
   */
  private buildCeiling(
    grid: InternalGridConfig,
    defaultWidthM: number,
    defaultLengthM: number,
    floorY: number,
    previewOpen: boolean | InternalBoxesPreviewOptions = false
  ) {
    const ceiling = grid.ceiling;
    if (!ceiling || ceiling.enabled === false) return;

    const hideCeiling = (typeof previewOpen === 'object' && Boolean(previewOpen.hideCeiling));
    const isVisible3D = (ceiling.visibleIn3D !== false) && !hideCeiling;
    this.ceilingGroup.visible = isVisible3D;

    const ceilingL = (ceiling.lengthMm ? ceiling.lengthMm / 1000 : defaultLengthM);
    const ceilingW = (ceiling.widthMm ? ceiling.widthMm / 1000 : defaultWidthM);
    const heightOffset = (ceiling.heightOffsetMm ?? 0) / 1000;
    const ceilingY = InternalBoxesBuilder.CEILING_Y + heightOffset;
    const centerZ = -ceilingL / 2;
    // Curvatura / flecha transversal do teto em metros (padrão 25mm, limitado a no máx 30mm para a Fiat Doblò)
    const archM = Math.max(0, Math.min(0.03, (ceiling.curvatureMm ?? 25) / 1000));

    const opacity = Math.max(0.1, Math.min(1.0, ceiling.opacity ?? 1.0));
    const isTranslucent = opacity < 0.99;

    const isSlatted = (ceiling.type || 'slatted') === 'slatted';

    if (isSlatted) {
      this.buildSlattedCeiling(ceiling, ceilingW, ceilingL, ceilingY, centerZ, opacity, isTranslucent, archM);
    } else {
      this.buildSheetCeiling(ceiling, ceilingW, ceilingL, ceilingY, centerZ, opacity, isTranslucent, archM);
    }

    // Iluminação LED no Teto
    if (ceiling.led && ceiling.led.enabled !== false) {
      this.buildCeilingLed(ceiling.led, ceilingW, ceilingL, ceilingY, centerZ, isSlatted, archM);
    }
  }

  /**
   * Calcula a elevação vertical em Y e a inclinação rotacional em Z (em radianos)
   * decorrentes do arqueamento transversal do teto da Fiat Doblò.
   * A posição de referência base é SEMPRE a parte mais baixa (bordas laterais x = ±w/2, onde yOffset = 0).
   * A partir das laterais na base, o teto compensa e sobe em direção ao centro (x = 0, onde yOffset = +archM).
   * x = posição lateral (-w/2 a +w/2)
   * w = largura total do teto
   * archM = flecha do arco (elevação do centro em relação às laterais mais baixas em metros)
   */
  static getCeilingArchOffset(x: number, w: number, archM: number): { yDrop: number; rotZ: number } {
    if (archM <= 0.0001 || w <= 0.001) {
      return { yDrop: 0, rotZ: 0 };
    }
    const halfW = w / 2;
    const clampedX = Math.max(-halfW, Math.min(halfW, x));
    const normX = clampedX / halfW; // -1 a +1
    // As laterais são a parte mais baixa de referência (normX = ±1 => yRise = 0).
    // Em direção ao centro (normX = 0), sobe compensando a curvatura (+archM).
    const yRise = archM * (1 - normX * normX);
    // Inclinação angular tangente: dy/dx = -8 * archM * x / (w * w)
    const slope = (-8 * archM * clampedX) / (w * w);
    const rotZ = Math.atan(slope);
    return { yDrop: yRise, rotZ };
  }

  /**
   * Constrói o forro ripado com ripas de madeira nobre e fundo acústico automotivo preto
   * com suporte a curvatura suave acompanhando o arco da Fiat Doblò
   */
  private buildSlattedCeiling(
    ceiling: CeilingConfig,
    w: number,
    l: number,
    ceilingY: number,
    centerZ: number,
    opacity: number,
    isTranslucent: boolean,
    archM: number = 0.025
  ) {
    const woodKey = ceiling.slattedWood || 'freijo';
    const woodSpecs: Record<CeilingSlattedWood, { color: number; label: string; materialName: string }> = {
      pinus: { color: 0xdfb889, label: 'Pinus Claro', materialName: 'Pinus Maciço' },
      freijo: { color: 0xc89355, label: 'Freijó Nobre', materialName: 'Freijó Nobre' },
      teak: { color: 0xb06c35, label: 'Teca Náutica', materialName: 'Teca Náutica' },
      dark_wood: { color: 0x5c3a21, label: 'Imbuia / Madeira Nobre', materialName: 'Madeira Nobre Maciça' },
      cedro: { color: 0xb45309, label: 'Cedro Rosa Real', materialName: 'Cedro Rosa' },
      plywood: { color: 0xd4a373, label: 'Compensado Naval', materialName: 'Compensado Naval' },
      white_mdf: { color: 0xf8fafc, label: 'MDF Branco Ultra', materialName: 'MDF Branco Ultra' }
    };
    const spec = woodSpecs[woodKey] || woodSpecs.freijo;

    const slatWM = (ceiling.slatWidthMm || 40) / 1000;
    const slatHM = (ceiling.slatThicknessMm || 12) / 1000;
    const slatGapM = (ceiling.slatGapMm || 10) / 1000;
    const isTransverse = ceiling.slatDirection === 'transverse';

    // 1. Fundo Acústico Automotivo Preto (Feltro / TNT / Chapa Eucatex 3mm preta)
    if (ceiling.acousticFeltBacking !== false) {
      const feltThick = 0.003;
      const feltMat = new THREE.MeshStandardMaterial({
        color: 0x111827, // Preto grafite escuro fosco de feltro automotivo
        roughness: 0.95,
        metalness: 0.02,
        transparent: isTranslucent,
        opacity: opacity
      });

      if (archM > 0.001) {
        // Superfície curva contínua acompanhando o arco do teto
        const feltShape = new THREE.Shape();
        const segs = 32;
        for (let k = 0; k <= segs; k++) {
          const px = -w / 2 + (k / segs) * w;
          const { yDrop } = InternalBoxesBuilder.getCeilingArchOffset(px, w, archM);
          const py = ceilingY + feltThick + yDrop;
          if (k === 0) feltShape.moveTo(px, py);
          else feltShape.lineTo(px, py);
        }
        for (let k = segs; k >= 0; k--) {
          const px = -w / 2 + (k / segs) * w;
          const { yDrop } = InternalBoxesBuilder.getCeilingArchOffset(px, w, archM);
          const py = ceilingY + yDrop;
          feltShape.lineTo(px, py);
        }
        feltShape.closePath();

        const feltGeo = new THREE.ExtrudeGeometry(feltShape, { depth: l, bevelEnabled: false });
        const feltMesh = new THREE.Mesh(feltGeo, feltMat);
        feltMesh.position.set(0, 0, centerZ - l / 2);
        feltMesh.name = 'CeilingAcousticBacking';
        feltMesh.receiveShadow = true;
        this.ceilingGroup.add(feltMesh);
      } else {
        const feltGeo = new THREE.BoxGeometry(w, feltThick, l);
        const feltMesh = new THREE.Mesh(feltGeo, feltMat);
        feltMesh.position.set(0, ceilingY + feltThick / 2, centerZ);
        feltMesh.name = 'CeilingAcousticBacking';
        feltMesh.receiveShadow = true;
        this.ceilingGroup.add(feltMesh);
      }
    }

    // 2. Ripas de Madeira
    const slatMat = new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.65,
      metalness: 0.04,
      transparent: isTranslucent,
      opacity: opacity
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: isTranslucent ? opacity * 0.4 : 0.45
    });

    const slatY = ceilingY - slatHM / 2;

    if (!isTransverse) {
      // Longitudinal (ao longo do veículo - padrão van life)
      const pitch = slatWM + slatGapM;
      const count = Math.max(1, Math.floor((w - slatGapM) / pitch));
      const totalSpan = count * slatWM + (count - 1) * slatGapM;
      const startX = -totalSpan / 2 + slatWM / 2;

      const slatGeo = new THREE.BoxGeometry(slatWM, slatHM, l);
      const slatEdgeGeo = new THREE.EdgesGeometry(slatGeo);

      for (let i = 0; i < count; i++) {
        const x = startX + i * pitch;
        const { yDrop, rotZ } = InternalBoxesBuilder.getCeilingArchOffset(x, w, archM);

        const slatMesh = new THREE.Mesh(slatGeo, slatMat);
        slatMesh.position.set(x, slatY + yDrop, centerZ);
        slatMesh.rotation.z = rotZ; // Inclina a ripa de acordo com a tangente do arco
        slatMesh.castShadow = true;
        slatMesh.receiveShadow = true;
        slatMesh.name = `CeilingSlat_${i + 1}`;
        slatMesh.userData = {
          isWoodPart: true,
          dimW: slatWM,
          dimL: l,
          dimH: slatHM,
          thicknessMm: Math.round(slatHM * 1000),
          partLabel: `Ripa de Teto (${spec.label}) ${Math.round(slatWM * 1000)}×${Math.round(l * 1000)}mm`,
          name: `Ripa de Teto (${spec.label})`,
          category: '🪵 Teto & Forro Campervan',
          barProfile: `${Math.round(slatWM * 1000)} × ${Math.round(l * 1000)} × ${Math.round(slatHM * 1000)} mm`,
          capacity: `${count} ripas no teto`,
          material: `${spec.materialName} ${Math.round(slatHM * 1000)}mm Acabamento Nobre`,
          woodMaterial: spec.materialName,
          moduleName: 'Forro de Teto Ripado',
          partType: 'ceiling',
          purpose: 'Ripas decorativas e acústicas do forro de teto da Doblò'
        };
        this.ceilingGroup.add(slatMesh);

        const edgeLine = new THREE.LineSegments(slatEdgeGeo, edgeMat);
        edgeLine.position.copy(slatMesh.position);
        edgeLine.rotation.copy(slatMesh.rotation);
        this.ceilingGroup.add(edgeLine);
      }
    } else {
      // Transversal (ao longo da largura com curvatura acompanhando o teto)
      const pitch = slatWM + slatGapM;
      const count = Math.max(1, Math.floor((l - slatGapM) / pitch));
      const totalSpan = count * slatWM + (count - 1) * slatGapM;
      const startZ = centerZ + totalSpan / 2 - slatWM / 2;

      let slatGeo: THREE.BufferGeometry;
      if (archM > 0.001) {
        const slatShape = new THREE.Shape();
        const segs = 32;
        for (let k = 0; k <= segs; k++) {
          const px = -w / 2 + (k / segs) * w;
          const { yDrop } = InternalBoxesBuilder.getCeilingArchOffset(px, w, archM);
          const py = ceilingY + yDrop;
          if (k === 0) slatShape.moveTo(px, py);
          else slatShape.lineTo(px, py);
        }
        for (let k = segs; k >= 0; k--) {
          const px = -w / 2 + (k / segs) * w;
          const { yDrop } = InternalBoxesBuilder.getCeilingArchOffset(px, w, archM);
          const py = ceilingY - slatHM + yDrop;
          slatShape.lineTo(px, py);
        }
        slatShape.closePath();
        slatGeo = new THREE.ExtrudeGeometry(slatShape, { depth: slatWM, bevelEnabled: false });
      } else {
        slatGeo = new THREE.BoxGeometry(w, slatHM, slatWM);
      }
      const slatEdgeGeo = new THREE.EdgesGeometry(slatGeo);

      for (let i = 0; i < count; i++) {
        const z = startZ - i * pitch;
        const slatMesh = new THREE.Mesh(slatGeo, slatMat);
        if (archM > 0.001) {
          slatMesh.position.set(0, 0, z - slatWM / 2);
        } else {
          slatMesh.position.set(0, slatY, z);
        }
        slatMesh.castShadow = true;
        slatMesh.receiveShadow = true;
        slatMesh.name = `CeilingSlatTrans_${i + 1}`;
        slatMesh.userData = {
          isWoodPart: true,
          dimW: w,
          dimL: slatWM,
          dimH: slatHM,
          thicknessMm: Math.round(slatHM * 1000),
          partLabel: `Ripa Transversal de Teto (${spec.label}) ${Math.round(w * 1000)}×${Math.round(slatWM * 1000)}mm`,
          name: `Ripa Transversal (${spec.label})`,
          category: '🪵 Teto & Forro Campervan',
          barProfile: `${Math.round(w * 1000)} × ${Math.round(slatWM * 1000)} × ${Math.round(slatHM * 1000)} mm`,
          capacity: `${count} ripas no teto`,
          material: `${spec.materialName} ${Math.round(slatHM * 1000)}mm`,
          woodMaterial: spec.materialName,
          moduleName: 'Forro de Teto Ripado',
          partType: 'ceiling',
          purpose: 'Ripas transversais de teto campervan'
        };
        this.ceilingGroup.add(slatMesh);

        const edgeLine = new THREE.LineSegments(slatEdgeGeo, edgeMat);
        edgeLine.position.copy(slatMesh.position);
        this.ceilingGroup.add(edgeLine);
      }
    }
  }

  /**
   * Constrói o forro em chapa contínua (MDF ou Compensado Naval)
   * moldado no arco de curvatura transversal da Fiat Doblò
   */
  private buildSheetCeiling(
    ceiling: CeilingConfig,
    w: number,
    l: number,
    ceilingY: number,
    centerZ: number,
    opacity: number,
    isTranslucent: boolean,
    archM: number = 0.025
  ) {
    const matKey = ceiling.sheetMaterial || 'white_mdf';
    const sheetSpecs: Record<CeilingSheetMaterial, { color: number; label: string; materialName: string }> = {
      white_mdf: { color: 0xf8fafc, label: 'MDF Branco Ultra', materialName: 'MDF Branco Ultra' },
      gray_mdf: { color: 0x475569, label: 'MDF Cinza Grafite', materialName: 'MDF Cinza Grafite' },
      wood_mdf: { color: 0xc89355, label: 'MDF Freijó Natural', materialName: 'MDF Freijó Natural' },
      black_mdf: { color: 0x1e293b, label: 'MDF Preto Fosco', materialName: 'MDF Preto Fosco' },
      sand_mdf: { color: 0xdcd0c0, label: 'MDF Bege Areia', materialName: 'MDF Bege Areia' },
      plywood: { color: 0xd4a373, label: 'Compensado Naval', materialName: 'Compensado Naval' }
    };
    const spec = sheetSpecs[matKey] || sheetSpecs.white_mdf;
    const thicknessMm = ceiling.thicknessMm || 9;
    const thickM = thicknessMm / 1000;
    const sheetY = ceilingY - thickM / 2;

    const sheetMat = new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.55,
      metalness: 0.04,
      transparent: isTranslucent,
      opacity: opacity
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: isTranslucent ? opacity * 0.5 : 0.6
    });

    const panelMode = ceiling.sheetPanels || 'single';

    // Cria geometria curva transversal extrudada
    const createCurvedSheetGeo = (xStart: number, xEnd: number, depthL: number) => {
      if (archM <= 0.001) {
        return new THREE.BoxGeometry(xEnd - xStart, thickM, depthL);
      }
      const shape = new THREE.Shape();
      const segs = 32;
      const span = xEnd - xStart;
      for (let k = 0; k <= segs; k++) {
        const px = xStart + (k / segs) * span;
        const { yDrop } = InternalBoxesBuilder.getCeilingArchOffset(px, w, archM);
        const py = ceilingY + yDrop;
        if (k === 0) shape.moveTo(px, py);
        else shape.lineTo(px, py);
      }
      for (let k = segs; k >= 0; k--) {
        const px = xStart + (k / segs) * span;
        const { yDrop } = InternalBoxesBuilder.getCeilingArchOffset(px, w, archM);
        const py = ceilingY - thickM + yDrop;
        shape.lineTo(px, py);
      }
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth: depthL, bevelEnabled: false });
    };

    if (panelMode === 'single') {
      const geo = createCurvedSheetGeo(-w / 2, w / 2, l);
      const mesh = new THREE.Mesh(geo, sheetMat);
      if (archM > 0.001) {
        mesh.position.set(0, 0, centerZ - l / 2);
      } else {
        mesh.position.set(0, sheetY, centerZ);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = 'CeilingSheet_Single';
      mesh.userData = {
        isWoodPart: true,
        dimW: w,
        dimL: l,
        dimH: thickM,
        thicknessMm: thicknessMm,
        partLabel: `Chapa Única de Teto (${spec.label} ${thicknessMm}mm)`,
        name: `Chapa de Teto (${spec.label})`,
        category: '🪵 Teto & Forro Campervan',
        barProfile: `${Math.round(w * 1000)} × ${Math.round(l * 1000)} × ${thicknessMm} mm`,
        material: `${spec.materialName} ${thicknessMm}mm`,
        woodMaterial: spec.materialName,
        moduleName: 'Forro de Teto em Chapa',
        partType: 'ceiling',
        purpose: 'Chapa inteira para forração e isolamento do teto'
      };
      this.ceilingGroup.add(mesh);

      const edgeLine = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      edgeLine.position.copy(mesh.position);
      this.ceilingGroup.add(edgeLine);
    } else if (panelMode === 'split_longitudinal') {
      // 2 chapas longitudinais (lado esquerdo e direito com friso central de 3mm)
      const gap = 0.003;
      const subW = (w - gap) / 2;

      [-1, 1].forEach((side, idx) => {
        const xStart = side === -1 ? -w / 2 : gap / 2;
        const xEnd = side === -1 ? -gap / 2 : w / 2;
        const geo = createCurvedSheetGeo(xStart, xEnd, l);
        const mesh = new THREE.Mesh(geo, sheetMat);
        if (archM > 0.001) {
          mesh.position.set(0, 0, centerZ - l / 2);
        } else {
          const xCenter = (xStart + xEnd) / 2;
          mesh.position.set(xCenter, sheetY, centerZ);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `CeilingSheet_Long_${idx + 1}`;
        mesh.userData = {
          isWoodPart: true,
          dimW: subW,
          dimL: l,
          dimH: thickM,
          thicknessMm: thicknessMm,
          partLabel: `Painel de Teto Bipartido (${spec.label})`,
          name: `Painel de Teto Longitudinal (${spec.label})`,
          category: '🪵 Teto & Forro Campervan',
          barProfile: `${Math.round(subW * 1000)} × ${Math.round(l * 1000)} × ${thicknessMm} mm`,
          material: `${spec.materialName} ${thicknessMm}mm`,
          woodMaterial: spec.materialName,
          moduleName: 'Forro de Teto Bipartido',
          partType: 'ceiling',
          purpose: 'Painel longitudinal para montagem facilitada do forro de teto'
        };
        this.ceilingGroup.add(mesh);

        const edgeLine = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
        edgeLine.position.copy(mesh.position);
        this.ceilingGroup.add(edgeLine);
      });
    } else {
      // 3 chapas transversais (frente, meio, traseira com frisos de 3mm)
      const gap = 0.003;
      const subL = (l - 2 * gap) / 3;

      [-1, 0, 1].forEach((posIdx, idx) => {
        const z = centerZ - posIdx * (subL + gap);
        const geo = createCurvedSheetGeo(-w / 2, w / 2, subL);
        const mesh = new THREE.Mesh(geo, sheetMat);
        if (archM > 0.001) {
          mesh.position.set(0, 0, z - subL / 2);
        } else {
          mesh.position.set(0, sheetY, z);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `CeilingSheet_Trans_${idx + 1}`;
        mesh.userData = {
          isWoodPart: true,
          dimW: w,
          dimL: subL,
          dimH: thickM,
          thicknessMm: thicknessMm,
          partLabel: `Painel Transversal de Teto (${spec.label})`,
          name: `Painel Transversal (${spec.label})`,
          category: '🪵 Teto & Forro Campervan',
          barProfile: `${Math.round(w * 1000)} × ${Math.round(subL * 1000)} × ${thicknessMm} mm`,
          material: `${spec.materialName} ${thicknessMm}mm`,
          woodMaterial: spec.materialName,
          moduleName: 'Forro de Teto Modular',
          partType: 'ceiling',
          purpose: 'Módulo transversal desmontável do teto'
        };
        this.ceilingGroup.add(mesh);

        const edgeLine = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
        edgeLine.position.copy(mesh.position);
        this.ceilingGroup.add(edgeLine);
      });
    }
  }

  /**
   * Constrói a iluminação LED no teto (perfis lineares ou spots circulares)
   * acompanhando o arco e as inclinações da curvatura do teto
   */
  private buildCeilingLed(
    led: CeilingLedConfig,
    w: number,
    l: number,
    ceilingY: number,
    centerZ: number,
    isSlatted: boolean,
    archM: number = 0.025
  ) {
    const ledColorHex = new THREE.Color(led.color || '#fef3c7').getHex();
    const brightness = Math.max(0.1, Math.min(1.5, (led.brightness ?? 85) / 100));

    // Materiais: Perfil de Alumínio Cinza + Difusor Plástico Branco Leitoso Translúcido Emissivo + Fita COB
    const aluMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.30
    });

    const diffuserMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: ledColorHex,
      emissiveIntensity: brightness * 1.6,
      roughness: 0.35,
      metalness: 0.0
    });

    const cobMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: ledColorHex,
      emissiveIntensity: brightness * 2.2,
      roughness: 0.2
    });

    const capMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.5,
      metalness: 0.05
    });

    if (led.type.startsWith('strip')) {
      // Perfil de Fita LED Linear Longitudinal
      const stripXPositions: number[] = (() => {
        if (led.type === 'strip_center') return [0];
        if (led.type === 'strip_triple') return [-w * 0.30, 0, w * 0.30];
        return [-w * 0.28, w * 0.28]; // strip_double (padrão)
      })();

      const stripL = Math.max(0.2, l - 0.04);
      const profW = 0.016; // 16mm
      const profH = 0.010; // 10mm
      const ledY = ceilingY - profH / 2;

      stripXPositions.forEach((x, sIdx) => {
        const stripContainer = new THREE.Group();
        stripContainer.name = `CeilingLedStrip_${sIdx + 1}`;

        // Perfil U de alumínio
        const uShape = new THREE.Shape();
        uShape.moveTo(-profW / 2, 0);
        uShape.lineTo(-profW / 2, profH);
        uShape.lineTo(-profW / 2 + 0.0015, profH);
        uShape.lineTo(-profW / 2 + 0.0015, 0.0015);
        uShape.lineTo(profW / 2 - 0.0015, 0.0015);
        uShape.lineTo(profW / 2 - 0.0015, profH);
        uShape.lineTo(profW / 2, profH);
        uShape.lineTo(profW / 2, 0);
        uShape.closePath();

        const aluGeo = new THREE.ExtrudeGeometry(uShape, { depth: stripL, bevelEnabled: false });
        const aluMesh = new THREE.Mesh(aluGeo, aluMat);
        aluMesh.position.set(0, -profH / 2, -stripL / 2);
        stripContainer.add(aluMesh);

        // Fita COB interna
        const cobGeo = new THREE.BoxGeometry(0.008, 0.001, stripL - 0.01);
        const cobMesh = new THREE.Mesh(cobGeo, cobMat);
        cobMesh.position.set(0, -profH / 2 + 0.002, 0);
        stripContainer.add(cobMesh);

        // Difusor frontal translúcido
        const diffGeo = new THREE.BoxGeometry(profW - 0.001, 0.002, stripL - 0.004);
        const diffMesh = new THREE.Mesh(diffGeo, diffuserMat);
        diffMesh.position.set(0, -profH / 2 + 0.001, 0);
        stripContainer.add(diffMesh);

        // Ponteiras de acabamento frontal e traseira
        const capGeo = new THREE.BoxGeometry(profW + 0.001, profH + 0.001, 0.003);
        const capFront = new THREE.Mesh(capGeo, capMat);
        capFront.position.set(0, 0, stripL / 2 + 0.0015);
        stripContainer.add(capFront);
        const capRear = new THREE.Mesh(capGeo, capMat);
        capRear.position.set(0, 0, -stripL / 2 - 0.0015);
        stripContainer.add(capRear);

        // Aplica o caimento vertical do arco e a inclinação rotacional em Z
        const { yDrop, rotZ } = InternalBoxesBuilder.getCeilingArchOffset(x, w, archM);
        stripContainer.position.set(x, ledY + yDrop, centerZ);
        stripContainer.rotation.z = rotZ;
        this.ceilingGroup.add(stripContainer);
      });

      // Luzes pontuais (PointLights) suaves emitindo luz para baixo dentro do camper
      const lightZ1 = centerZ + l * 0.25;
      const lightZ2 = centerZ - l * 0.25;

      const p1 = new THREE.PointLight(ledColorHex, brightness * 1.8, 3.2, 1.8);
      p1.position.set(0, ceilingY - 0.08, lightZ1);
      this.ceilingGroup.add(p1);

      const p2 = new THREE.PointLight(ledColorHex, brightness * 1.8, 3.2, 1.8);
      p2.position.set(0, ceilingY - 0.08, lightZ2);
      this.ceilingGroup.add(p2);

      if (led.type === 'strip_triple' || l > 1.8) {
        const pCenter = new THREE.PointLight(ledColorHex, brightness * 1.4, 3.0, 1.8);
        pCenter.position.set(0, ceilingY - 0.08, centerZ);
        this.ceilingGroup.add(pCenter);
      }
    } else {
      // Spots circulares de LED embutidos
      const spotCount = led.spotsCount || 4;
      const spotLocations: Array<{ x: number; z: number }> = [];

      const xSpan = w * 0.28;
      if (spotCount === 2) {
        spotLocations.push({ x: -xSpan, z: centerZ }, { x: xSpan, z: centerZ });
      } else if (spotCount === 6) {
        [-0.32, 0, 0.32].forEach((factor) => {
          spotLocations.push({ x: -xSpan, z: centerZ + l * factor });
          spotLocations.push({ x: xSpan, z: centerZ + l * factor });
        });
      } else if (spotCount === 8) {
        [-0.36, -0.12, 0.12, 0.36].forEach((factor) => {
          spotLocations.push({ x: -xSpan, z: centerZ + l * factor });
          spotLocations.push({ x: xSpan, z: centerZ + l * factor });
        });
      } else {
        // 4 spots (padrão)
        [-0.26, 0.26].forEach((factor) => {
          spotLocations.push({ x: -xSpan, z: centerZ + l * factor });
          spotLocations.push({ x: xSpan, z: centerZ + l * factor });
        });
      }

      const outerR = 0.034; // 68mm diâmetro externo
      const innerR = 0.025; // 50mm difusor
      const spotH = 0.005; // 5mm saliência/embutido

      const bezelGeo = new THREE.CylinderGeometry(outerR, outerR, spotH, 24);
      const lensGeo = new THREE.CylinderGeometry(innerR, innerR, spotH + 0.001, 24);

      spotLocations.forEach((loc, idx) => {
        const spotGroup = new THREE.Group();
        spotGroup.name = `CeilingSpot_${idx + 1}`;

        const bezel = new THREE.Mesh(bezelGeo, aluMat);
        spotGroup.add(bezel);

        const lens = new THREE.Mesh(lensGeo, diffuserMat);
        lens.position.y = -0.0005;
        spotGroup.add(lens);

        // Aplica o caimento vertical do arco e a inclinação rotacional em Z
        const { yDrop, rotZ } = InternalBoxesBuilder.getCeilingArchOffset(loc.x, w, archM);
        spotGroup.position.set(loc.x, ceilingY - spotH / 2 + yDrop, loc.z);
        spotGroup.rotation.z = rotZ;
        this.ceilingGroup.add(spotGroup);
      });

      // PointLights para os spots
      const pFront = new THREE.PointLight(ledColorHex, brightness * 1.7, 3.2, 1.8);
      pFront.position.set(0, ceilingY - 0.08, centerZ + l * 0.25);
      this.ceilingGroup.add(pFront);

      const pRear = new THREE.PointLight(ledColorHex, brightness * 1.7, 3.2, 1.8);
      pRear.position.set(0, ceilingY - 0.08, centerZ - l * 0.25);
      this.ceilingGroup.add(pRear);
    }
  }
}

