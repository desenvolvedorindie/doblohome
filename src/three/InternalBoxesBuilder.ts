import * as THREE from 'three';
import { InternalBoxItem, InternalGridConfig, ChestHingeDirection, BoxPanelsConfig, SlatBedDirection, CentralTableConfig } from '../types';

/**
 * Construtor 3D dos Armazenadores e Caixas Internas da Fiat Doblò
 * Renderiza o piso do compartimento, grid modular milimétrico, caixas 3D,
 * tampas basculantes de baús e gavetões deslizantes com puxadores.
 */
export class InternalBoxesBuilder {
  group: THREE.Group;
  boxesGroup: THREE.Group;
  floorGroup: THREE.Group;
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
    previewOpen: boolean = false,
    isolatedBoxId: string | null = null
  ) {
    this.clearGroup(this.floorGroup);
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
    const floorThickness = 0.015; // Chapa de compensado naval de 15mm

    // Chapa de compensado naval de 15mm na base do assoalho (serve de fundo para todas as caixas)
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
      partLabel: 'Chapa Base do Assoalho Doblò (Compensado Naval 15mm)',
      isInternalFloorPlywood: true,
      isBasePlywood: true,
      name: 'Chapa de Compensado Naval 15mm',
      category: '🪵 Assoalho Base Campervan',
      barProfile: `${Math.round(widthM * 1000)} × ${Math.round(lengthM * 1000)} × 15 mm`,
      capacity: 'Fundo Comum dos Módulos',
      material: 'Compensado Naval 15mm Impermeabilizado',
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

    // ─── PERFIL DE LED NO RODAPÉ DO ASSOALHO ──────────────────────
    const ledConfig = grid.ledBaseboard;
    if (ledConfig && ledConfig.enabled !== false) {
      const ledColorHex = new THREE.Color(ledConfig.color || '#fef3c7').getHex();
      const brightness = Math.max(0.1, Math.min(1.5, (ledConfig.brightness ?? 85) / 100));

      const ledMat = new THREE.MeshStandardMaterial({
        color: ledColorHex,
        emissive: ledColorHex,
        emissiveIntensity: brightness * 1.8,
        roughness: 0.2,
        metalness: 0.1
      });

      const profileMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.25
      });

      // Perfil de alumínio anodizado slim 16x16mm com fita COB contínua
      const profileW = 0.016;
      const profileH = 0.016;
      const yPos = floorY + profileH / 2;

      // 1. Linha do rodapé esquerdo (ao longo do comprimento, lado motorista)
      const leftProfileGeo = new THREE.BoxGeometry(profileW, profileH, lengthM);
      const leftProfile = new THREE.Mesh(leftProfileGeo, profileMat);
      leftProfile.position.set(widthM / 2 - profileW / 2, yPos, centerZ);
      this.floorGroup.add(leftProfile);

      const leftStripGeo = new THREE.BoxGeometry(0.008, 0.005, lengthM - 0.02);
      const leftStrip = new THREE.Mesh(leftStripGeo, ledMat);
      leftStrip.position.set(widthM / 2 - profileW / 2, yPos + 0.005, centerZ);
      leftStrip.userData = {
        isHardware: true,
        isElectrical: true,
        partLabel: 'Perfil LED Rodapé Esq. 12V COB 3000K (1.70m)',
        name: 'Perfil Alumínio Embutido c/ Fita LED COB',
        category: '💡 Iluminação Ambiente Campervan',
        barProfile: `${Math.round(lengthM * 1000)} mm • 12V 10W/m`,
        capacity: 'Iluminação Indireta Noturna',
        purpose: 'Fita LED de alta densidade COB no rodapé para iluminação de piso sem ofuscamento'
      };
      this.floorGroup.add(leftStrip);

      // 2. Linha do rodapé direito (lado passageiro)
      const rightProfile = new THREE.Mesh(leftProfileGeo, profileMat);
      rightProfile.position.set(-widthM / 2 + profileW / 2, yPos, centerZ);
      this.floorGroup.add(rightProfile);

      const rightStrip = new THREE.Mesh(leftStripGeo, ledMat);
      rightStrip.position.set(-widthM / 2 + profileW / 2, yPos + 0.005, centerZ);
      rightStrip.userData = {
        isHardware: true,
        isElectrical: true,
        partLabel: 'Perfil LED Rodapé Dir. 12V COB 3000K (1.70m)',
        name: 'Perfil Alumínio Embutido c/ Fita LED COB',
        category: '💡 Iluminação Ambiente Campervan',
        barProfile: `${Math.round(lengthM * 1000)} mm • 12V 10W/m`,
        capacity: 'Iluminação Indireta Noturna',
        purpose: 'Fita LED de alta densidade COB no rodapé para iluminação de piso sem ofuscamento'
      };
      this.floorGroup.add(rightStrip);

      // 3. Linha do rodapé traseiro (soleira do porta-malas)
      const rearProfileGeo = new THREE.BoxGeometry(widthM - 2 * profileW, profileH, profileW);
      const rearProfile = new THREE.Mesh(rearProfileGeo, profileMat);
      rearProfile.position.set(0, yPos, -profileW / 2);
      this.floorGroup.add(rearProfile);

      const rearStripGeo = new THREE.BoxGeometry(widthM - 2 * profileW - 0.02, 0.005, 0.008);
      const rearStrip = new THREE.Mesh(rearStripGeo, ledMat);
      rearStrip.position.set(0, yPos + 0.005, -profileW / 2);
      this.floorGroup.add(rearStrip);

      // Ponto de luz suave iluminando o chão
      const pointLight1 = new THREE.PointLight(ledColorHex, brightness * 0.85, 2.0, 1.5);
      pointLight1.position.set(0, floorY + 0.15, centerZ);
      this.floorGroup.add(pointLight1);
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
    previewOpen: boolean,
    isolatedBoxId: string | null = null
  ) {
    const cols = Math.max(1, grid.colsX);
    const rows = Math.max(1, grid.rowsZ);
    const widthM = grid.widthMm / 1000;
    const lengthM = grid.lengthMm / 1000;

    const cellWM = widthM / cols;
    const cellLM = lengthM / rows;

    boxes.forEach((box) => {
      const colStart = Math.min(cols - 1, Math.max(0, box.colStart));
      const colSpan = Math.min(cols - colStart, Math.max(1, box.colSpan));
      const rowStart = Math.min(rows - 1, Math.max(0, box.rowStart));
      const rowSpan = Math.min(rows - rowStart, Math.max(1, box.rowSpan));

      // Dimensões exatas pelas células do grid: sem folgas/espaçamento entre caixas vizinhas
      const boxWM = Math.max(0.05, colSpan * cellWM);
      const boxLM = Math.max(0.05, rowSpan * cellLM);
      const boxHM = Math.max(0.05, box.heightMm / 1000);

      // Posicionamento X: Da esquerda para a direita na visão traseira (+X para -X)
      const posX = (widthM / 2) - (colStart + colSpan / 2) * cellWM;
      const posZ = -(rowStart + rowSpan / 2) * cellLM;
      const posY = floorY + boxHM / 2;

      const isIsolatedTarget = isolatedBoxId ? box.id === isolatedBoxId : false;
      const isSelected = box.id === selectedBoxId || isIsolatedTarget;
      const isOpen = previewOpen || Boolean(box.isOpen);

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
        this.buildDrawerModule(boxContainer, boxWM, boxLM, boxHM, boxMat, box, isSelected, isOpen);
      } else if (box.type === 'slat_bed') {
        // --- MÓDULO CAMA RETRÁTIL COM RIPAS ---
        this.buildSlatBedModule(boxContainer, boxWM, boxLM, boxHM, boxMat, box, isSelected, isOpen);
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
          isOpen,
          box.chestHingeDirection || 'front'
        );
      }

      // --- DECORAÇÃO TRASEIRA: MESA / PRATELEIRA REBATÍVEL (ABRE PARA CIMA) ---
      if (box.rearFoldShelf) {
        this.buildRearFoldShelf(boxContainer, boxWM, boxLM, boxHM, box, isSelected, isOpen);
      }

      // --- ARMÁRIO AÉREO SUPERIOR DE QUINA ATÉ O TETO DA DOBLÒ ---
      if (box.upperCabinet) {
        this.buildUpperCabinet(boxContainer, boxWM, boxLM, boxHM, box, isSelected, isOpen);
      }

      // --- MESA CENTRAL DINETTE COM PEDESTAL NÁUTICO REMOVÍVEL ---
      if (box.hasCentralTable || box.centralTable?.enabled) {
        this.buildCentralTable(boxContainer, boxWM, boxLM, boxHM, box, isSelected);
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
   * Constrói a geometria de uma chapa com furos circulares passantes CNC para alívio de peso e aeração do colchão.
   * Centralizada em (0, 0, 0), com largura w (eixo X), espessura h (eixo Y) e comprimento l (eixo Z).
   */
  static createPerforatedGeometry(w: number, h: number, l: number): THREE.BufferGeometry {
    const hw = w / 2;
    const hl = l / 2;

    const shape = new THREE.Shape();
    shape.moveTo(-hw, -hl);
    shape.lineTo(hw, -hl);
    shape.lineTo(hw, hl);
    shape.lineTo(-hw, hl);
    shape.closePath();

    // Grade de furos passantes CNC para alívio de peso (~35% mais leve)
    const margin = Math.min(0.05, Math.min(w, l) * 0.15);
    const usableW = Math.max(0.02, w - 2 * margin);
    const usableL = Math.max(0.02, l - 2 * margin);
    const targetSpacing = 0.085; // espaçamento de ~8.5cm entre centros
    const cols = Math.max(1, Math.round(usableW / targetSpacing));
    const rows = Math.max(1, Math.round(usableL / targetSpacing));
    const stepX = usableW / cols;
    const stepZ = usableL / rows;
    const holeRadius = Math.max(0.010, Math.min(0.032, Math.min(stepX, stepZ) * 0.32));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = -hw + margin + (c + 0.5) * stepX;
        const cz = -hl + margin + (r + 0.5) * stepZ;
        const holePath = new THREE.Path();
        holePath.absarc(cx, cz, holeRadius, 0, Math.PI * 2, true);
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
    panelLabel?: string
  ): THREE.Mesh {
    const geo = InternalBoxesBuilder.createPerforatedGeometry(w, h, l);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(posX, posY, posZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      isWoodPart: true,
      dimW: w,
      dimH: h,
      dimL: l,
      partLabel: panelLabel || 'Tampo Superior Vazado 15mm (Alívio de Peso)',
      isInternalBox: Boolean(boxId),
      boxId,
      boxRoot,
      isPerforated: true
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
    panelLabel?: string
  ): THREE.Mesh {
    const geo = new THREE.BoxGeometry(w, h, l);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(posX, posY, posZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      isWoodPart: true,
      dimW: w,
      dimH: h,
      dimL: l,
      partLabel: panelLabel || 'Chapa Compensado 15mm',
      isInternalBox: Boolean(boxId),
      boxId,
      boxRoot
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
    boxName?: string
  ) {
    const hasBottom = panelsConfig?.bottom ?? includeBottom;
    const hasLeft = panelsConfig?.left ?? true;
    const hasRight = panelsConfig?.right ?? true;
    const hasFront = panelsConfig?.front ?? true;
    const hasRear = panelsConfig?.rear ?? true;

    const wallH = hasBottom ? Math.max(0.01, h - t) : h;
    const wallY = hasBottom ? (-h / 2 + t + wallH / 2) : 0;
    const prefix = boxName ? `${boxName} • ` : '';

    // Fundo 15mm: APENAS se hasBottom for true
    if (hasBottom) {
      this.addPanel(parent, w, t, l, 0, -h / 2 + t / 2, 0, mat, edgeMat, boxId, boxRoot, `${prefix}Fundo Base (15mm)`);
    }

    // Lateral Esquerda (+X / motorista) 15mm
    if (hasLeft) {
      this.addPanel(parent, t, wallH, l, w / 2 - t / 2, wallY, 0, mat, edgeMat, boxId, boxRoot, `${prefix}Lateral Esquerda (15mm)`);
    }

    // Lateral Direita (-X / passageiro) 15mm
    if (hasRight) {
      this.addPanel(parent, t, wallH, l, -w / 2 + t / 2, wallY, 0, mat, edgeMat, boxId, boxRoot, `${prefix}Lateral Direita (15mm)`);
    }

    // Cálculo exato da largura e centro interno das paredes frontal e traseira
    // +X é Esquerda (hasLeft) e -X é Direita (hasRight)
    const xMin = hasRight ? (-w / 2 + t) : (-w / 2);
    const xMax = hasLeft ? (w / 2 - t) : (w / 2);
    const innerW = Math.max(0.01, xMax - xMin);
    const centerInnerX = (xMin + xMax) / 2;

    // Parede Frontal (+Z, em direção aos bancos dianteiros) 15mm
    if (hasFront) {
      this.addPanel(parent, innerW, wallH, t, centerInnerX, wallY, l / 2 - t / 2, mat, edgeMat, boxId, boxRoot, `${prefix}Parede Frontal (15mm)`);
    }

    // Parede Traseira (-Z, em direção ao porta-malas) 15mm
    if (hasRear) {
      this.addPanel(parent, innerW, wallH, t, centerInnerX, wallY, -l / 2 + t / 2, mat, edgeMat, boxId, boxRoot, `${prefix}Parede Traseira (15mm)`);
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
    const t = InternalBoxesBuilder.PLYWOOD_THICKNESS; // 15mm
    const edgeMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0x38bdf8 : 0x475569,
      linewidth: 1,
      transparent: true,
      opacity: 0.65
    });

    const hasTop = box.panels?.top ?? true;
    const hasLeft = box.panels?.left ?? true;
    const hasRight = box.panels?.right ?? true;
    const hasFront = box.panels?.front ?? true;
    const hasRear = box.panels?.rear ?? false;
    const hasBottom = box.panels?.bottom ?? false;

    // 1. Gabinete / Carcaça externa fixa (feita em chapas de 15mm)
    const cabinetMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2
    });

    const sideH = Math.max(0.01, h - (hasTop ? t : 0) - (hasBottom ? t : 0));
    const sideY = hasBottom ? (-h / 2 + t + sideH / 2) : (hasTop ? -t / 2 : 0);

    // Tampo superior 15mm
    if (hasTop) {
      if (box.topPerforated) {
        this.addPerforatedPanel(container, w, t, l, 0, h / 2 - t / 2, 0, cabinetMat, edgeMat, box.id, container, `${box.name} • Tampo Superior Vazado (15mm)`);
      } else {
        this.addPanel(container, w, t, l, 0, h / 2 - t / 2, 0, cabinetMat, edgeMat, box.id, container, `${box.name} • Tampo Superior (15mm)`);
      }
    }
    // Fundo inferior próprio 15mm
    if (hasBottom) {
      this.addPanel(container, w, t, l, 0, -h / 2 + t / 2, 0, cabinetMat, edgeMat, box.id, container, `${box.name} • Base Carcaça (15mm)`);
    }
    // Lateral Esquerda (+X / motorista) 15mm
    if (hasLeft) {
      this.addPanel(container, t, sideH, l, w / 2 - t / 2, sideY, 0, cabinetMat, edgeMat, box.id, container, `${box.name} • Lateral Esq. Carcaça (15mm)`);
    }
    // Lateral Direita (-X / passageiro) 15mm
    if (hasRight) {
      this.addPanel(container, t, sideH, l, -w / 2 + t / 2, sideY, 0, cabinetMat, edgeMat, box.id, container, `${box.name} • Lateral Dir. Carcaça (15mm)`);
    }

    // Cálculo do vão interno da carcaça para acomodar a gaveta
    const cabXMin = hasRight ? (-w / 2 + t) : (-w / 2);
    const cabXMax = hasLeft ? (w / 2 - t) : (w / 2);
    const cabInnerW = Math.max(0.01, cabXMax - cabXMin);
    const cabCenterX = (cabXMin + cabXMax) / 2;

    // Fundo frontal (+Z, virado para os bancos dianteiros) 15mm
    if (hasFront) {
      this.addPanel(container, cabInnerW, sideH, t, cabCenterX, sideY, l / 2 - t / 2, cabinetMat, edgeMat, box.id, container, `${box.name} • Fundo Frontal Carcaça (15mm)`);
    }
    // Fechamento traseiro (-Z, virado para o porta-malas) se explicitamente ativado
    if (hasRear) {
      this.addPanel(container, cabInnerW, sideH, t, cabCenterX, sideY, -l / 2 + t / 2, cabinetMat, edgeMat, box.id, container, `${box.name} • Fechamento Traseiro (15mm)`);
    }

    // 2. Gaveta interna deslizante (oca, com chapas de 15mm, topo aberto e fundo móvel para carregar objetos)
    const drawerGroup = new THREE.Group();
    drawerGroup.name = 'DrawerSlide';

    // Deslocamento para fora quando aberta (desliza para trás, em direção ao porta-malas, eixo -Z)
    const slideOffsetZ = isOpen ? -l * 0.75 : 0;
    drawerGroup.position.set(0, 0, slideOffsetZ);

    // Dimensões da gaveta com folga de 6mm de cada lado para as corrediças telescópicas
    const clearance = 0.012;
    const dW = Math.max(0.05, cabInnerW - clearance);
    const dH = Math.max(0.05, sideH - clearance);
    const dL = Math.max(0.05, l - (hasFront ? t : 0) - 0.01);
    const drawerCenterZ = t / 2;
    const isSlideTray = box.type === 'slide_tray' || box.drawerMode === 'slide_tray';

    // Caixa / Bandeja móvel deslizante (com fundo pois desliza no ar para fora da Doblò)
    const drawerBodyGroup = new THREE.Group();
    drawerBodyGroup.position.set(cabCenterX, 0, drawerCenterZ);

    if (isSlideTray) {
      // Bandeja Corrediça Rasa (para Geladeira 12V / Fogão portátil):
      // Fundo plano de compensado naval 15mm + 4 abas baixas de contenção (45mm de altura)
      const lipH = 0.045;
      const trayY = -dH / 2 + t / 2;

      // Base plana da bandeja 15mm
      this.addPanel(
        drawerBodyGroup,
        dW,
        t,
        dL,
        0,
        trayY,
        0,
        mat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Base Bandeja Corrediça Rasa (15mm)`
      );

      // Abas de contenção (Laterais, traseira e frontal de 45mm)
      this.addPanel(drawerBodyGroup, t, lipH, dL, dW / 2 - t / 2, trayY + t / 2 + lipH / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Aba Baixa Lateral Esq. (45mm)`);
      this.addPanel(drawerBodyGroup, t, lipH, dL, -dW / 2 + t / 2, trayY + t / 2 + lipH / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Aba Baixa Lateral Dir. (45mm)`);
      this.addPanel(drawerBodyGroup, dW - 2 * t, lipH, t, 0, trayY + t / 2 + lipH / 2, dL / 2 - t / 2, mat, edgeMat, box.id, container, `${box.name} • Aba Baixa Traseira (45mm)`);
      this.addPanel(drawerBodyGroup, dW - 2 * t, lipH, t, 0, trayY + t / 2 + lipH / 2, -dL / 2 + t / 2, mat, edgeMat, box.id, container, `${box.name} • Aba Baixa Frontal (45mm)`);

      // Puxador rebaixado na aba frontal
      const handleGeo = new THREE.BoxGeometry(Math.min(0.20, dW * 0.4), 0.020, 0.015);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.set(0, trayY + t / 2 + lipH / 2, -dL / 2 - 0.01);
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
      this.buildHollowBox(drawerBodyGroup, dW, dH, dL, t, mat, edgeMat, true, box.id, container, undefined, `${box.name} [Gaveta]`);

      // Frente da gaveta com folha de 15mm
      const frontFaceW = w - 0.008;
      const frontFaceH = h - 0.008;
      this.addPanel(drawerGroup, frontFaceW, frontFaceH, t, 0, 0, -l / 2 - t / 2, mat, edgeMat, box.id, container, `${box.name} • Frente Externa Gaveta (15mm)`);

      // Puxador metálico embutido
      const handleGeo = new THREE.BoxGeometry(Math.min(0.24, dW * 0.5), 0.024, 0.02);
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.2
      });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.position.set(0, 0, -l / 2 - t - 0.01);
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
    const t = InternalBoxesBuilder.PLYWOOD_THICKNESS; // 15mm
    const edgeMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0x38bdf8 : 0x78350f,
      linewidth: 1,
      transparent: true,
      opacity: 0.6
    });

    const hasTop = box.panels?.top ?? (box.type === 'chest');

    if (box.type === 'open') {
      // Nicho aberto: 100% oco com paredes conforme tamponamento selecionado (SEM FUNDO por padrão)
      this.buildHollowBox(container, w, h, l, t, mat, edgeMat, false, box.id, container, box.panels, box.name);
      if (hasTop) {
        if (box.topPerforated) {
          this.addPerforatedPanel(container, w, t, l, 0, h / 2 - t / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Tampo Superior Vazado (15mm)`);
        } else {
          this.addPanel(container, w, t, l, 0, h / 2 - t / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Tampo Superior (15mm)`);
        }
      }
      return;
    }

    // Baú com tampa basculante:
    // Corpo inferior oco feito com paredes de 15mm (SEM FUNDO por padrão)
    const bodyHeight = Math.max(0.05, h - (hasTop ? t : 0));
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, hasTop ? -t / 2 : 0, 0);
    this.buildHollowBox(bodyGroup, w, bodyHeight, l, t, mat, edgeMat, false, box.id, container, box.panels, box.name);
    container.add(bodyGroup);

    // Tampa com folha de compensado de 15mm e articulação conforme hingeDirection (apenas se hasTop for true)
    if (hasTop) {
      const lidPivot = new THREE.Group();
      const openAngle = Math.PI / 3.4; // bascula ~53° para CIMA
      const hingeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.25 });

      if (hingeDirection === 'rear') {
        // 1. Dobradiça na Traseira (-Z / porta-malas): levanta a ponta dianteira
        lidPivot.position.set(0, h / 2 - t, -l / 2);
        if (isOpen) {
          lidPivot.rotation.x = -openAngle;
        }
        if (box.topPerforated) {
          this.addPerforatedPanel(lidPivot, w, t, l, 0, t / 2, l / 2, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante Vazada (15mm)`);
        } else {
          this.addPanel(lidPivot, w, t, l, 0, t / 2, l / 2, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante (15mm)`);
        }

        const hingeGeo = new THREE.CylinderGeometry(0.007, 0.007, w * 0.94, 12);
        hingeGeo.rotateZ(Math.PI / 2);
        const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
        hingeMesh.position.set(0, t, 0);
        hingeMesh.userData = { isInternalBox: true, boxId: box.id, boxRoot: container };
        lidPivot.add(hingeMesh);
      } else if (hingeDirection === 'left') {
        // 2. Dobradiça no Lado Esquerdo / Motorista (+X olhando da traseira): levanta o lado direito
        lidPivot.position.set(w / 2, h / 2 - t, 0);
        if (isOpen) {
          lidPivot.rotation.z = -openAngle;
        }
        if (box.topPerforated) {
          this.addPerforatedPanel(lidPivot, w, t, l, -w / 2, t / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante Vazada (15mm)`);
        } else {
          this.addPanel(lidPivot, w, t, l, -w / 2, t / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante (15mm)`);
        }

        // Deita o cilindro ao longo do eixo Z (comprimento do baú)
        const hingeGeo = new THREE.CylinderGeometry(0.007, 0.007, l * 0.94, 12);
        hingeGeo.rotateX(Math.PI / 2);
        const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
        hingeMesh.position.set(0, t, 0);
        hingeMesh.userData = { isInternalBox: true, boxId: box.id, boxRoot: container };
        lidPivot.add(hingeMesh);
      } else if (hingeDirection === 'right') {
        // 3. Dobradiça no Lado Direito / Passageiro (-X olhando da traseira): levanta o lado esquerdo
        lidPivot.position.set(-w / 2, h / 2 - t, 0);
        if (isOpen) {
          lidPivot.rotation.z = openAngle;
        }
        if (box.topPerforated) {
          this.addPerforatedPanel(lidPivot, w, t, l, w / 2, t / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante Vazada (15mm)`);
        } else {
          this.addPanel(lidPivot, w, t, l, w / 2, t / 2, 0, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante (15mm)`);
        }

        // Deita o cilindro ao longo do eixo Z (comprimento do baú)
        const hingeGeo = new THREE.CylinderGeometry(0.007, 0.007, l * 0.94, 12);
        hingeGeo.rotateX(Math.PI / 2);
        const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
        hingeMesh.position.set(0, t, 0);
        hingeMesh.userData = { isInternalBox: true, boxId: box.id, boxRoot: container };
        lidPivot.add(hingeMesh);
      } else {
        // 4. Padrão: Dobradiça na Frente (+Z / bancos): levanta a ponta traseira
        lidPivot.position.set(0, h / 2 - t, l / 2);
        if (isOpen) {
          lidPivot.rotation.x = openAngle;
        }
        if (box.topPerforated) {
          this.addPerforatedPanel(lidPivot, w, t, l, 0, t / 2, -l / 2, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante Vazada (15mm)`);
        } else {
          this.addPanel(lidPivot, w, t, l, 0, t / 2, -l / 2, mat, edgeMat, box.id, container, `${box.name} • Tampa Basculante (15mm)`);
        }

        const hingeGeo = new THREE.CylinderGeometry(0.007, 0.007, w * 0.94, 12);
        hingeGeo.rotateZ(Math.PI / 2);
        const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
        hingeMesh.position.set(0, t, 0);
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
    isOpen: boolean
  ) {
    const t = InternalBoxesBuilder.PLYWOOD_THICKNESS; // 15mm
    const slatT = t; // espessura de 15mm das ripas de compensado naval
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
      box.name
    );
    container.add(baseGroup);

    // 2. Sistema de Ripas Retráteis Intercaladas (Pente de Madeira)
    const ySlat = h / 2 - slatT / 2;

    if (direction === 'left' || direction === 'right') {
      // --- ABERTURA LATERAL (Eixo X) ---
      // As ripas correm na largura (X, comprimento = w) e intercalam-se ao longo do comprimento (Z, de -l/2 a +l/2).
      const targetSlatW = 0.07; // ~70mm de largura nominal por ripa
      let numSlats = Math.max(6, Math.floor(l / targetSlatW));
      if (numSlats % 2 !== 0) numSlats += 1; // número par para alternância perfeita
      const pitch = l / numSlats;
      const gap = 0.006; // folga funcional de 6mm entre ripas
      const slatDimZ = Math.max(0.025, pitch - gap);

      // (A) Estrado Fixo (Ripas nos índices pares: 0, 2, 4...)
      for (let i = 0; i < numSlats; i += 2) {
        const zPos = -l / 2 + (i + 0.5) * pitch;
        this.addPanel(
          container,
          w,
          slatT,
          slatDimZ,
          0,
          ySlat,
          zPos,
          mat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Ripa Fixa #${i / 2 + 1} (${Math.round(w * 1000)}×${Math.round(slatDimZ * 1000)}mm)`
        );
      }

      // (B) Estrado Móvel Retrátil (Ripas nos índices ímpares: 1, 3, 5... + Longarina Externa de Puxar + Pés)
      const mobileGroup = new THREE.Group();
      mobileGroup.name = 'SlatBedSlidingFrame';

      // Na cena da Doblò olhando da traseira: +X é Esquerda (Motorista), -X é Direita (Passageiro)
      const slideStroke = w * extRatio;
      const slideOffsetX = isExtended ? (direction === 'left' ? slideStroke : -slideStroke) : 0;
      mobileGroup.position.set(slideOffsetX, 0, 0);

      // Ripas móveis deslizantes
      for (let i = 1; i < numSlats; i += 2) {
        const zPos = -l / 2 + (i + 0.5) * pitch;
        this.addPanel(
          mobileGroup,
          w,
          slatT,
          slatDimZ,
          0,
          ySlat,
          zPos,
          mat,
          mobileEdgeMat,
          box.id,
          container,
          `${box.name} • Ripa Móvel #${Math.floor(i / 2) + 1} (${Math.round(w * 1000)}×${Math.round(slatDimZ * 1000)}mm)`
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
        `${box.name} • Longarina Lateral Móvel (${Math.round(l * 1000)}×${Math.round(h * 1000)}mm)`
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
        `${box.name} • Pé de Apoio Traseiro`
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
        `${box.name} • Pé de Apoio Dianteiro`
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
    } else {
      // --- ABERTURA LONGITUDINAL (Eixo Z: Frente ou Trás) ---
      // As ripas correm no comprimento (Z, comprimento = l) e intercalam-se na largura (X, de -w/2 a +w/2).
      const targetSlatW = 0.07;
      let numSlats = Math.max(6, Math.floor(w / targetSlatW));
      if (numSlats % 2 !== 0) numSlats += 1;
      const pitch = w / numSlats;
      const gap = 0.006;
      const slatDimX = Math.max(0.025, pitch - gap);

      // (A) Estrado Fixo (Ripas nos índices pares: 0, 2, 4...)
      for (let i = 0; i < numSlats; i += 2) {
        const xPos = w / 2 - (i + 0.5) * pitch;
        this.addPanel(
          container,
          slatDimX,
          slatT,
          l,
          xPos,
          ySlat,
          0,
          mat,
          edgeMat,
          box.id,
          container,
          `${box.name} • Ripa Fixa #${i / 2 + 1} (${Math.round(slatDimX * 1000)}×${Math.round(l * 1000)}mm)`
        );
      }

      // (B) Estrado Móvel Retrátil (Ripas nos índices ímpares: 1, 3, 5... + Longarina Externa + Pés)
      const mobileGroup = new THREE.Group();
      mobileGroup.name = 'SlatBedSlidingFrame';

      // Na cena: +Z é Frente (Bancos dianteiros), -Z é Trás (Porta-malas)
      const slideStroke = l * extRatio;
      const slideOffsetZ = isExtended ? (direction === 'front' ? slideStroke : -slideStroke) : 0;
      mobileGroup.position.set(0, 0, slideOffsetZ);

      // Ripas móveis deslizantes
      for (let i = 1; i < numSlats; i += 2) {
        const xPos = w / 2 - (i + 0.5) * pitch;
        this.addPanel(
          mobileGroup,
          slatDimX,
          slatT,
          l,
          xPos,
          ySlat,
          0,
          mat,
          mobileEdgeMat,
          box.id,
          container,
          `${box.name} • Ripa Móvel #${Math.floor(i / 2) + 1} (${Math.round(slatDimX * 1000)}×${Math.round(l * 1000)}mm)`
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
        `${box.name} • Longarina Frontal Móvel (${Math.round(w * 1000)}×${Math.round(h * 1000)}mm)`
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
        `${box.name} • Pé de Apoio Esq.`
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
        `${box.name} • Pé de Apoio Dir.`
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

    // 3. COLCHÃO / ESTOFADO BIPARTIDO CAMPERVAN (DESDOBRA AO ABRIR TODA A CAMA)
    // Conforme solicitação: "quero também que inclua quando abrir toda a cama"
    const mattressThickness = 0.08; // Espuma D33 de 80mm
    const mattressY = ySlat + slatT / 2 + mattressThickness / 2;

    const mattressMat = new THREE.MeshStandardMaterial({
      color: isSelected ? 0x38bdf8 : 0x334155, // Tecido náutico grafite escuro texturizado
      roughness: 0.90,
      metalness: 0.02
    });

    if (direction === 'left' || direction === 'right') {
      const cushionW = w - 0.016;
      const cushionL = l - 0.016;

      if (isExtended) {
        // Cama Totalmente Aberta: 2 almofadas estendidas cobrindo 100% da largura útil
        const extendedW = (w * extRatio) - 0.016;
        const totalOpenW = cushionW + extendedW;

        // Folha 1: sobre o estrado fixo
        const m1Geo = new THREE.BoxGeometry(cushionW, mattressThickness, cushionL);
        const m1Mesh = new THREE.Mesh(m1Geo, mattressMat);
        m1Mesh.position.set(0, mattressY, 0);
        m1Mesh.castShadow = true;
        m1Mesh.receiveShadow = true;
        m1Mesh.userData = {
          isWoodPart: false,
          isUpholstery: true,
          dimW: totalOpenW,
          dimH: mattressThickness,
          dimL: cushionL,
          partLabel: `${box.name} • Colchão Bipartido Espuma D33 Casal Aberto (${Math.round(totalOpenW * 1000)}×${Math.round(cushionL * 1000)}×80mm)`,
          material: 'Espuma D33 Revestida em Tecido Impermeável Bipartido',
          category: '🛏️ Estofaria Campervan'
        };
        container.add(m1Mesh);

        // Folha 2: sobre o estrado móvel estendido
        const extCenterX = direction === 'left' ? (w / 2 + (w * extRatio) / 2) : (-w / 2 - (w * extRatio) / 2);
        const m2Geo = new THREE.BoxGeometry(extendedW, mattressThickness, cushionL);
        const m2Mesh = new THREE.Mesh(m2Geo, mattressMat);
        m2Mesh.position.set(extCenterX, mattressY, 0);
        m2Mesh.castShadow = true;
        m2Mesh.receiveShadow = true;
        m2Mesh.userData = {
          isWoodPart: false,
          isUpholstery: true,
          dimW: extendedW,
          dimH: mattressThickness,
          dimL: cushionL,
          partLabel: `${box.name} • Extensão Colchão Casal Bipartido (${Math.round(extendedW * 1000)}×${Math.round(cushionL * 1000)}×80mm)`,
          material: 'Espuma D33 Revestida em Tecido Impermeável Bipartido',
          category: '🛏️ Estofaria Campervan'
        };
        container.add(m2Mesh);

        // Friso estético de divisão entre as duas metades
        const seamGeo = new THREE.BoxGeometry(0.004, mattressThickness + 0.002, cushionL);
        const seamMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
        const seamMesh = new THREE.Mesh(seamGeo, seamMat);
        seamMesh.position.set(direction === 'left' ? w / 2 : -w / 2, mattressY, 0);
        container.add(seamMesh);
      } else {
        // Cama Fechada: almofada dobrada sobre o estrado fixo (modo sofá)
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
          partLabel: `${box.name} • Colchão Dobrado Modo Sofá (${Math.round(cushionW * 1000)}×${Math.round(cushionL * 1000)}×80mm)`,
          material: 'Espuma D33 Revestida em Tecido Impermeável',
          category: '🛏️ Estofaria Campervan'
        };
        container.add(mMesh);
      }
    } else {
      // ABERTURA LONGITUDINAL (Frente ou Trás)
      const cushionW = w - 0.016;
      const cushionL = l - 0.016;

      if (isExtended) {
        const extendedL = (l * extRatio) - 0.016;
        const totalOpenL = cushionL + extendedL;

        const m1Geo = new THREE.BoxGeometry(cushionW, mattressThickness, cushionL);
        const m1Mesh = new THREE.Mesh(m1Geo, mattressMat);
        m1Mesh.position.set(0, mattressY, 0);
        m1Mesh.castShadow = true;
        m1Mesh.receiveShadow = true;
        m1Mesh.userData = {
          isWoodPart: false,
          isUpholstery: true,
          dimW: cushionW,
          dimH: mattressThickness,
          dimL: totalOpenL,
          partLabel: `${box.name} • Colchão Bipartido Espuma D33 Longitudinal (${Math.round(cushionW * 1000)}×${Math.round(totalOpenL * 1000)}×80mm)`,
          material: 'Espuma D33 Revestida em Tecido Impermeável Bipartido',
          category: '🛏️ Estofaria Campervan'
        };
        container.add(m1Mesh);

        const extCenterZ = direction === 'front' ? (l / 2 + (l * extRatio) / 2) : (-l / 2 - (l * extRatio) / 2);
        const m2Geo = new THREE.BoxGeometry(cushionW, mattressThickness, extendedL);
        const m2Mesh = new THREE.Mesh(m2Geo, mattressMat);
        m2Mesh.position.set(0, mattressY, extCenterZ);
        m2Mesh.castShadow = true;
        m2Mesh.receiveShadow = true;
        container.add(m2Mesh);
      } else {
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
          partLabel: `${box.name} • Colchão Dobrado Modo Sofá (${Math.round(cushionW * 1000)}×${Math.round(cushionL * 1000)}×80mm)`,
          material: 'Espuma D33 Revestida em Tecido Impermeável',
          category: '🛏️ Estofaria Campervan'
        };
        container.add(mMesh);
      }
    }
  }

  /**
   * Constrói o painel decorativo de madeira na face traseira do baú que abre para cima
   * como uma bancada/prateleira rebatível externa (mesa retrátil de apoio no porta-malas).
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

    // Dimensões da prancha da prateleira decorativa (madeira maciça 18mm)
    const shelfT = 0.018; // 18mm de espessura
    const shelfW = Math.max(0.15, w - 0.03); // Margem de 1.5cm de cada lado para a moldura do baú
    const shelfH = Math.max(0.15, Math.min(h - 0.04, 0.38)); // Altura fechada / Profundidade da bancada aberta

    // Posição do eixo de articulação (topo da face traseira)
    const pivotY = h / 2 - 0.022;
    // Se for gaveta, a face externa está na frente da carcaça
    const isDrawer = box.type === 'drawer';
    const faceZ = isDrawer ? -l / 2 - InternalBoxesBuilder.PLYWOOD_THICKNESS : -l / 2;
    const pivotZ = faceZ - 0.003;

    const shelfPivot = new THREE.Group();
    shelfPivot.name = 'RearFoldShelfPivot';
    shelfPivot.position.set(0, pivotY, pivotZ);

    // Rotação: 0 = fechada (pendurada verticalmente na face traseira decorando o baú)
    // +90° (+Math.PI / 2) = aberta para cima (horizontal formando a bancada externa no porta-malas)
    const openAngle = Math.PI / 2;
    if (isShelfOpen) {
      shelfPivot.rotation.x = openAngle;
    }

    // Material da madeira decorativa da prateleira
    let woodColor = 0xdf9a57; // Pinus Finger-Joint / Golden Birch (tom quente idêntico ao modelo)
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

    // 1. Chapa principal de madeira maciça da bancada
    const shelfGeo = new THREE.BoxGeometry(shelfW, shelfH, shelfT);
    const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
    shelfMesh.position.set(0, -shelfH / 2, -shelfT / 2);
    shelfMesh.castShadow = true;
    shelfMesh.receiveShadow = true;
    shelfMesh.userData = {
      isWoodPart: true,
      dimW: shelfW,
      dimH: shelfT,
      dimL: shelfH,
      partLabel: `${box.name} • Prateleira Rebatível Traseira [${finishLabel} 18mm]`,
      isInternalBox: Boolean(box.id),
      boxId: box.id,
      boxRoot: container,
      isRearShelf: true,
      material: `Madeira Maciça 18mm (${finishLabel})`
    };
    shelfPivot.add(shelfMesh);

    const shelfEdgeGeo = new THREE.EdgesGeometry(shelfGeo);
    const shelfEdgeLine = new THREE.LineSegments(shelfEdgeGeo, shelfEdgeMat);
    shelfEdgeLine.position.copy(shelfMesh.position);
    shelfPivot.add(shelfEdgeLine);

    // 2. Rebaixo ergonômico no bordo inferior para pegada da mão (como na foto de referência)
    const slotW = Math.min(0.14, shelfW * 0.35);
    const slotH = 0.022;
    const slotD = shelfT * 0.6;
    const slotGeo = new THREE.BoxGeometry(slotW, slotH, slotD);
    const slotMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.1
    });
    const slotMesh = new THREE.Mesh(slotGeo, slotMat);
    slotMesh.position.set(0, -shelfH + slotH / 2 + 0.012, -shelfT + slotD / 2);
    shelfPivot.add(slotMesh);

    // 3. Eixo superior com dobradiça contínua tipo piano em inox escovado
    const hingeGeo = new THREE.CylinderGeometry(0.005, 0.005, shelfW * 0.96, 12);
    hingeGeo.rotateZ(Math.PI / 2);
    const hingeMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.92,
      roughness: 0.2
    });
    const hingeMesh = new THREE.Mesh(hingeGeo, hingeMat);
    hingeMesh.position.set(0, 0, 0);
    shelfPivot.add(hingeMesh);

    targetParent.add(shelfPivot);

    // 4. Par de braços / mãos-francesas dobráveis de suporte estrutural (aço inox)
    const bracketMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.90,
      roughness: 0.25
    });

    const bracketOffsetX = shelfW * 0.36;
    const bracketXPositions = [-bracketOffsetX, bracketOffsetX];

    if (isShelfOpen) {
      // Suportes estendidos a 45° travando a bancada perfeitamente na horizontal
      const strutL = shelfH * 0.62 * Math.SQRT2;
      const strutAngle = Math.PI / 4;
      const strutY = pivotY - (shelfH * 0.62) / 2;
      const strutZ = faceZ - (shelfH * 0.62) / 2;

      bracketXPositions.forEach((bx) => {
        const strutGeo = new THREE.BoxGeometry(0.008, strutL, 0.006);
        strutGeo.rotateX(-strutAngle);
        const strutMesh = new THREE.Mesh(strutGeo, bracketMat);
        strutMesh.position.set(bx, strutY, strutZ);
        strutMesh.castShadow = true;
        targetParent.add(strutMesh);

        // Terminal de fixação inferior no baú
        const baseMountGeo = new THREE.BoxGeometry(0.016, 0.024, 0.008);
        const baseMountMesh = new THREE.Mesh(baseMountGeo, bracketMat);
        baseMountMesh.position.set(bx, pivotY - shelfH * 0.62, faceZ - 0.004);
        targetParent.add(baseMountMesh);
      });
    } else {
      // Suportes recolhidos verticais rentes à face traseira por trás da prancha de madeira
      bracketXPositions.forEach((bx) => {
        const foldGeo = new THREE.BoxGeometry(0.008, shelfH * 0.85, 0.005);
        const foldMesh = new THREE.Mesh(foldGeo, bracketMat);
        foldMesh.position.set(bx, pivotY - shelfH * 0.45, faceZ - 0.002);
        targetParent.add(foldMesh);
      });
    }
  }

  /**
   * Constrói o Armário Aéreo de Quina sobre a Caixa até o limite do teto da Doblò.
   * Conforme foto real do interior da Fiat Doblò, ocupa uma profundidade menor
   * (ex: 250mm configurável) encostado na quina traseira/frontal, liberando a bancada
   * frontal da caixa para cuba de pia e torneira.
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
    const t = InternalBoxesBuilder.PLYWOOD_THICKNESS; // 15mm
    const floorY = InternalBoxesBuilder.FLOOR_Y;
    const ceilingY = InternalBoxesBuilder.CEILING_Y; // 1.72m
    const boxTopY = floorY + boxHM;
    const cabinetH = Math.max(0.20, ceilingY - boxTopY); // Altura vai até o teto da Doblò

    // Profundidade configurável (padrão 250mm), limitada ao comprimento da bancada
    const depthMm = Math.max(150, Math.min(Math.round(boxLM * 1000 - 50), box.upperCabinetDepthMm ?? 250));
    const cabinetDepthM = depthMm / 1000;
    const align = box.upperCabinetAlign || 'rear';

    // Posição no container da caixa:
    // A caixa tem comprimento boxLM centrado em 0 (de -boxLM/2 a +boxLM/2).
    // Se 'rear', fica encostado em -boxLM/2. Se 'front', fica em +boxLM/2.
    const cabinetCenterZ = align === 'rear'
      ? (-boxLM / 2 + cabinetDepthM / 2)
      : (boxLM / 2 - cabinetDepthM / 2);

    // Altura relativa ao centro da caixa base:
    // O centro do container está em floorY + boxHM/2. O centro do armário aéreo está em boxHM / 2 + cabinetH / 2.
    const cabinetCenterY = boxHM / 2 + cabinetH / 2;

    const upperGroup = new THREE.Group();
    upperGroup.name = `UpperCabinet_${box.id}`;
    upperGroup.position.set(0, cabinetCenterY, cabinetCenterZ);

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

    const innerH = cabinetH - 2 * t;
    const innerW = boxWM - 2 * t;
    const innerD = cabinetDepthM - t;

    // 1. Lateral Esquerda 15mm
    this.addPanel(
      upperGroup,
      t,
      cabinetH,
      cabinetDepthM,
      boxWM / 2 - t / 2,
      0,
      0,
      cabinetMat,
      edgeMat,
      box.id,
      container,
      `${box.name} • Armário Aéreo Lateral Esq. (${Math.round(cabinetDepthM * 1000)}×${Math.round(cabinetH * 1000)}mm)`
    );

    // 2. Lateral Direita 15mm
    this.addPanel(
      upperGroup,
      t,
      cabinetH,
      cabinetDepthM,
      -boxWM / 2 + t / 2,
      0,
      0,
      cabinetMat,
      edgeMat,
      box.id,
      container,
      `${box.name} • Armário Aéreo Lateral Dir. (${Math.round(cabinetDepthM * 1000)}×${Math.round(cabinetH * 1000)}mm)`
    );

    // 3. Tampo Superior 15mm (encostado no teto da van)
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
      `${box.name} • Armário Aéreo Tampo Teto (${Math.round(innerW * 1000)}×${Math.round(cabinetDepthM * 1000)}mm)`
    );

    // 4. Base Inferior 15mm (assentada sobre a bancada inferior)
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
      `${box.name} • Armário Aéreo Base Bancada (${Math.round(innerW * 1000)}×${Math.round(cabinetDepthM * 1000)}mm)`
    );

    // 5. Fundo contra a lataria da van
    const backZ = align === 'rear' ? (-cabinetDepthM / 2 + t / 2) : (cabinetDepthM / 2 - t / 2);
    this.addPanel(
      upperGroup,
      innerW,
      innerH,
      t,
      0,
      0,
      backZ,
      cabinetMat,
      edgeMat,
      box.id,
      container,
      `${box.name} • Armário Aéreo Fundo (${Math.round(innerW * 1000)}×${Math.round(innerH * 1000)}mm)`
    );

    // 6. Prateleiras Internas Divisórias
    const numShelves = Math.max(1, Math.min(3, box.upperCabinetShelves ?? 1));
    const shelfSpacing = innerH / (numShelves + 1);
    for (let s = 1; s <= numShelves; s++) {
      const shelfY = -innerH / 2 + s * shelfSpacing;
      this.addPanel(
        upperGroup,
        innerW,
        t,
        innerD - 0.01,
        0,
        shelfY,
        align === 'rear' ? 0.005 : -0.005,
        cabinetMat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Prateleira Interna #${s} (${Math.round(innerW * 1000)}×${Math.round(innerD * 1000)}mm)`
      );
    }

    // 7. Porta frontal com puxador marítimo push-lock OU nicho aberto com friso anti-queda
    const hasDoors = box.upperCabinetDoors !== false;
    const frontZ = align === 'rear' ? (cabinetDepthM / 2) : (-cabinetDepthM / 2);

    if (hasDoors) {
      const doorW = boxWM - 0.006;
      const doorH = cabinetH - 0.006;
      this.addPanel(
        upperGroup,
        doorW,
        doorH,
        t,
        0,
        0,
        frontZ + (align === 'rear' ? t / 2 : -t / 2),
        cabinetMat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Porta Armário Aéreo c/ Trava Push-Lock (${Math.round(doorW * 1000)}×${Math.round(doorH * 1000)}mm)`
      );

      // Botão Trava Push-Lock Náutico
      const knobGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.018, 20);
      knobGeo.rotateX(Math.PI / 2);
      const knobMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.15
      });
      const knobMesh = new THREE.Mesh(knobGeo, knobMat);
      knobMesh.position.set(
        boxWM / 2 - 0.05,
        0,
        frontZ + (align === 'rear' ? t + 0.009 : -t - 0.009)
      );
      knobMesh.userData = {
        isHardware: true,
        partLabel: 'Botão Trava Push-Lock Náutico Cromado',
        category: '🔩 Ferragens Marítimas & Camper'
      };
      upperGroup.add(knobMesh);
    } else {
      // Nicho aberto: Friso anti-queda de 25mm na base
      const lipH = 0.025;
      this.addPanel(
        upperGroup,
        innerW,
        lipH,
        t,
        0,
        -cabinetH / 2 + t + lipH / 2,
        frontZ + (align === 'rear' ? -t / 2 : t / 2),
        cabinetMat,
        edgeMat,
        box.id,
        container,
        `${box.name} • Friso Anti-Queda Nicho Aéreo (25mm)`
      );
    }

    container.add(upperGroup);
  }

  /**
   * Constrói a Mesa Dinette Central com Pedestal Náutico e Tampo Arredondado.
   * Conforme foto real da Fiat Doblò, a mesa possui:
   * 1. Coluna vertical tubular preta fixada na face de madeira por duas braçadeiras com manípulos.
   * 2. Tampo retangular de madeira maciça com 4 cantos arredondados suaves.
   * 3. Ajuste livre de deslocamento longitudinal (Z), lateral (X), altura (Y) e rotação.
   */
  private buildCentralTable(
    container: THREE.Group,
    boxWM: number,
    boxLM: number,
    boxHM: number,
    box: InternalBoxItem,
    isSelected: boolean
  ) {
    const cfg: Partial<CentralTableConfig> = box.centralTable || {};
    const tableWM = (cfg.widthMm ?? 450) / 1000;
    const tableLM = (cfg.lengthMm ?? 650) / 1000;
    const heightFromFloorM = (cfg.heightMm ?? 720) / 1000; // padrão 72cm do piso
    const tableThickness = 0.018; // 18mm

    // Deslocamentos configuráveis (em metros)
    const offX = (cfg.offsetX ?? 0) / 1000;
    const offZ = (cfg.offsetZ ?? 0) / 1000;
    const rotRad = ((cfg.rotationDeg ?? 0) * Math.PI) / 180;

    // Altura relativa ao centro do boxContainer (o boxContainer está em floorY + boxHM/2):
    // y Relativo = (floorY + heightFromFloorM) - (floorY + boxHM/2) = heightFromFloorM - boxHM/2
    const tableCenterY = heightFromFloorM - boxHM / 2;

    const tableGroup = new THREE.Group();
    tableGroup.name = `CentralTable_${box.id}`;
    // A coluna parte da face dianteira ou centro do box com o deslocamento X e Z
    tableGroup.position.set(offX, 0, offZ);

    // ─── 1. PEDESTAL METÁLICO (COLUNA TUBULAR PRETA) ───
    const tubeRadius = 0.022; // diâmetro de 44mm
    const tubeHeight = Math.max(0.20, heightFromFloorM - tableThickness); // do chão até a base do tampo
    const tubeGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeHeight, 24);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // preto acetinado automotivo
      metalness: 0.85,
      roughness: 0.3
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    // Posiciona o tubo do piso (floorY) até a base do tampo
    const tubeCenterY = (-boxHM / 2) + tubeHeight / 2;
    tubeMesh.position.set(0, tubeCenterY, 0);
    tubeMesh.castShadow = true;
    tubeMesh.receiveShadow = true;
    tubeMesh.userData = {
      isHardware: true,
      partLabel: 'Pedestal Tubular Central Náutico Ø45mm (Aço Preto)',
      category: '🔩 Ferragens Marítimas & Camper'
    };
    tableGroup.add(tubeMesh);

    // ─── 2. BRAÇADEIRAS DUPLAS DE FIXAÇÃO COM MANÍPULOS ───
    // Como visto exatamente na foto: 2 braçadeiras pretas com manípulos de aperto rápido
    const clampMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const knobMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });

    const clampHeights = [
      (-boxHM / 2) + 0.12, // braçadeira inferior
      (-boxHM / 2) + Math.min(boxHM * 0.75, 0.30) // braçadeira superior
    ];

    clampHeights.forEach((cY) => {
      // Base da braçadeira
      const clampGeo = new THREE.BoxGeometry(tubeRadius * 3.2, 0.035, 0.03);
      const clampMesh = new THREE.Mesh(clampGeo, clampMat);
      clampMesh.position.set(0, cY, 0.015);
      clampMesh.castShadow = true;
      tableGroup.add(clampMesh);

      // Manípulo / Alavanca de aperto rápido
      const knobGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.032, 12);
      knobGeo.rotateZ(Math.PI / 2);
      const knobMesh = new THREE.Mesh(knobGeo, knobMat);
      knobMesh.position.set(tubeRadius * 2.0, cY, 0.015);
      tableGroup.add(knobMesh);
    });

    // ─── 3. FLANGE SUPERIOR SOB O TAMPO ───
    const flangeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.012, 24);
    const flangeMesh = new THREE.Mesh(flangeGeo, clampMat);
    flangeMesh.position.set(0, tableCenterY - tableThickness / 2 - 0.006, 0);
    flangeMesh.castShadow = true;
    tableGroup.add(flangeMesh);

    // ─── 4. TAMPO DE MADEIRA COM CANTOS ARREDONDADOS ───
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
    tableTopGeo.rotateX(Math.PI / 2);

    let finishColor = 0xd4a373; // Pinus / Compensado padrão
    if (cfg.finish === 'teak') finishColor = 0xb45309;
    if (cfg.finish === 'dark_wood') finishColor = 0x78350f;
    if (cfg.finish === 'pine_block') finishColor = 0xd97706;

    const tableMat = new THREE.MeshStandardMaterial({
      color: isSelected ? 0x38bdf8 : finishColor,
      roughness: 0.65,
      metalness: 0.05
    });

    const tableTopMesh = new THREE.Mesh(tableTopGeo, tableMat);
    tableTopMesh.position.set(0, tableCenterY, 0);
    tableTopMesh.rotation.y = rotRad;
    tableTopMesh.castShadow = true;
    tableTopMesh.receiveShadow = true;
    tableTopMesh.userData = {
      isWoodPart: true,
      dimW: tableWM,
      dimH: tableThickness,
      dimL: tableLM,
      partLabel: `Tampo de Mesa Dinette Central (${Math.round(tableWM * 1000)}×${Math.round(tableLM * 1000)}×18mm)`,
      name: 'Tampo Mesa Dinette Central',
      category: '🍽️ Mobília & Mesas Campervan',
      material: 'Compensado Naval 18mm Bordas Boleadas',
      purpose: 'Mesa de refeições, notebook e convivência com pedestal náutico removível'
    };
    tableGroup.add(tableTopMesh);

    // Borda perimetral suave
    const topEdgeGeo = new THREE.EdgesGeometry(tableTopGeo, 25);
    const topEdgeMat = new THREE.LineBasicMaterial({ color: isSelected ? 0xffffff : 0x78350f, transparent: true, opacity: 0.6 });
    const topEdgeLine = new THREE.LineSegments(topEdgeGeo, topEdgeMat);
    topEdgeLine.position.copy(tableTopMesh.position);
    topEdgeLine.rotation.copy(tableTopMesh.rotation);
    tableGroup.add(topEdgeLine);

    container.add(tableGroup);
  }
}

