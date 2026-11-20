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
import { VerticalLiftBuilder } from './boxes/VerticalLiftBuilder';
import { UpperCabinetBuilder } from './boxes/UpperCabinetBuilder';
import { BoxAccessoriesBuilder } from './boxes/BoxAccessoriesBuilder';
import { BoxElectronicsBuilder } from './boxes/BoxElectronicsBuilder';
import { CeilingBuilder, getCeilingArchOffset } from './boxes/CeilingBuilder';
import { addGroupJunctionDetailsToCushion, buildUnionCushionMesh, CushionRect } from './boxes/slat-bed/MattressCushionGeometry';
import {
  collectEffectiveGlobalGroups,
  computeAllVehicleMattressSubparts,
  computeRectUnionPolygons
} from '../utils/mattressGrouping';

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
  private verticalLiftBuilder = new VerticalLiftBuilder();
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
    this.lastUpdateArgs = [grid, boxes, selectedBoxId, previewOpen, isolatedBoxId];
    this.isolatedBoxId = isolatedBoxId;
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

    // 5. Quando estiver em modo isolado ou com "Ocultar paredes" ativo, mantém piso, grid e teto fantasmas para não obstruírem
    if (isolatedBoxId || this.ghostWalls) {
      this.applyGhostTransparency(this.floorGroup, 0.08, 0.04);
      this.applyGhostTransparency(this.gridLinesGroup, 0.08, 0.04);
      this.applyGhostTransparency(this.ceilingGroup, 0.08, 0.04);
    }
  }

  private applyGhostTransparency(
    group: THREE.Object3D,
    meshOpacity: number = 0.08,
    lineOpacity: number = 0.04,
    skip?: (o: THREE.Object3D) => boolean
  ) {
    const visit = (child: any) => {
      if (skip && skip(child)) return;
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
      child.children.slice().forEach(visit);
    };
    visit(group);
  }

  /** Raiz de um componente instalado (bateria, geladeira, etc.) */
  private static isInstalledComponent(o: THREE.Object3D): boolean {
    return ['Installed_', 'FridgeAppliance_', 'PortaPottiAppliance_', 'StoveAppliance_', 'StoveRearShelfUpright_']
      .some((p) => o.name.startsWith(p));
  }

  /** Quando ativo, paredes/painéis dos módulos ficam translúcidos e só os componentes aparecem sólidos. */
  ghostWalls = false;
  private lastUpdateArgs: Parameters<InternalBoxesBuilder['update']> | null = null;

  setGhostWalls(value: boolean) {
    if (this.ghostWalls === value) return;
    this.ghostWalls = value;
    if (this.lastUpdateArgs) this.update(...this.lastUpdateArgs);
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

    const isAnyBedOpen = globalBedOpen || boxes.some((b) => (b.type === 'slat_bed' || b.hasBed) && Boolean(b.isBedOpen ?? (b.type === 'slat_bed' ? b.isOpen : false)));

    sortedBoxes.forEach((box) => {
      const colStart = Math.min(cols - 1, Math.max(0, box.colStart));
      const colSpan = Math.min(cols - colStart, Math.max(1, box.colSpan));
      const rowStart = Math.min(rows - 1, Math.max(0, box.rowStart));
      const rowSpan = Math.min(rows - rowStart, Math.max(1, box.rowSpan));

      const extraWM = (box.extraWidthMm || 0) / 1000;
      const extraLM = (box.extraLengthMm || 0) / 1000;
      const offsetXM = (box.offsetXMm || 0) / 1000;
      const offsetZM = (box.offsetZMm || 0) / 1000;

      // Dimensões pelas células do grid + acréscimo/redução fina em mm quando configurado
      const boxWM = Math.max(0.05, colSpan * cellWM + extraWM);
      const boxLM = Math.max(0.05, rowSpan * cellLM + extraLM);
      const boxHM = Math.max(0.05, (box.heightMm ?? grid.heightMm) / 1000);

      // Posicionamento X: Da esquerda para a direita na visão traseira (+X para -X)
      const posX = (widthM / 2) - (colStart + colSpan / 2) * cellWM + offsetXM;
      const posZ = -(rowStart + rowSpan / 2) * cellLM + offsetZM;
      const posY = floorY + boxHM / 2;

      const isTargetModule = isolatedBoxId ? box.id === isolatedBoxId : false;
      const isGhost = isolatedBoxId ? box.id !== isolatedBoxId : false;
      const isSelected = selectedBoxId ? box.id === selectedBoxId : false;

      const isDrawerOpen = (box.type === 'drawer' || box.type === 'slide_tray') && Boolean(box.isOpen);
      const isChestOpen = box.type === 'chest' && Boolean(box.isOpen);
      // Quando qualquer cama está aberta, os módulos elevatórios verticais permanecem recolhidos/ocultos
      const isLiftOpen = !isAnyBedOpen && box.type === 'vertical_lift' && Boolean(box.isOpen);
      const isUpperCabinetOpen = globalCabinetsOpen || Boolean(box.isUpperCabinetOpen);
      const hasBed = box.type === 'slat_bed' || Boolean(box.hasBed);
      const isBedOpen = globalBedOpen || (hasBed && Boolean(box.isBedOpen ?? (box.type === 'slat_bed' ? box.isOpen : false)));
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
      // quando o módulo não está isolado. Ao isolar um módulo ou ocultar paredes, omitimos a hitbox externa
      // para permitir hover e clique direto nas peças individuais / componentes.
      if (!isolatedBoxId && !this.ghostWalls) {
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
      } else if (box.type === 'vertical_lift') {
        // --- MÓDULO EXTENSÍVEL PARA CIMA (ELEVATÓRIO COM BARRAS DE FERRO) ---
        this.verticalLiftBuilder.buildVerticalLiftModule(
          boxContainer,
          boxWM,
          boxLM,
          boxHM,
          boxMat,
          box,
          isSelected,
          isLiftOpen
        );
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

      // --- COMPONENTE CAMA ACOPLADO SOBRE O MÓDULO (ex: sobre bandeja corrediça, gavetão, baú ou nicho) ---
      if (box.type !== 'slat_bed' && box.hasBed) {
        this.slatBedBuilder.buildSlatBedModule(
          boxContainer,
          boxWM,
          boxLM,
          boxHM,
          boxMat,
          box,
          isSelected,
          isBedOpen,
          cellWM,
          cellLM,
          showMattress,
          boxes,
          grid,
          true // skipBaseBox = true (assenta sobre o módulo existente)
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
      if ((box.electronics && box.electronics.length > 0) || box.hasBattery) {
        const effectiveBox = box.hasBattery && (!box.electronics || !box.electronics.some((e) => e.id === 'battery'))
          ? {
            ...box,
            electronics: [
              ...(box.electronics || []),
              {
                id: 'battery' as const,
                mountFace: 'bottom' as const,
                position: 'rear_center' as const,
                rotationDeg: 0,
                presetId: box.batteryPresetId
              }
            ]
          }
          : box;
        this.electronicsBuilder.buildBoxElectronics(boxContainer, boxWM, boxLM, boxHM, effectiveBox, isSelected);
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
          isDrawerOpen || isChestOpen || isLiftOpen,
          isBedOpen
        );
      }

      // Se estiver em modo de módulo ativo (activeFocusBoxId):
      // Apenas o módulo em foco permanece 100% opaco e interativo; todas as demais caixas tornam-se fantasmas (8% de opacidade).
      if (isGhost) {
        this.applyGhostTransparency(boxContainer, 0.08, 0.04);
      }

      if (this.ghostWalls && !isGhost) {
        this.applyGhostTransparency(boxContainer, 0.10, 0.10, InternalBoxesBuilder.isInstalledComponent);
      }

      this.boxesGroup.add(boxContainer);
    });

    // --- ALMOFADAS UNIFICADAS ENTRE MÓDULOS ADJACENTES (CROSS-MODULE MERGED GROUPS) ---
    if (showMattress && grid.mattressMergedGroups && grid.mattressMergedGroups.length > 0) {
      const allSubparts = computeAllVehicleMattressSubparts(grid, boxes, floorY);
      const effectiveGroups = collectEffectiveGlobalGroups(allSubparts, grid.mattressMergedGroups, boxes);
      const byId = new Map(allSubparts.map((s) => [s.id, s]));

      // Coleta zonas de recorte de armários aéreos em coordenadas do veículo com sua altura inferior
      const worldCabinetCutouts: Array<{ rect: CushionRect; cabinetBottomMm: number }> = [];
      for (const cabBox of boxes) {
        if (!cabBox.upperCabinet) continue;
        const cabBoxHeightMm = cabBox.heightMm ?? grid.heightMm ?? 400;
        const bottomGapMm = Math.max(0, cabBox.upperCabinetBottomGapMm ?? 0);
        const cabinetBottomMm = cabBoxHeightMm + bottomGapMm;

        const cabColStart = Math.min(cols - 1, Math.max(0, cabBox.colStart));
        const cabColSpan = Math.min(cols - cabColStart, Math.max(1, cabBox.colSpan));
        const cabRowStart = Math.min(rows - 1, Math.max(0, cabBox.rowStart));
        const cabRowSpan = Math.min(rows - cabRowStart, Math.max(1, cabBox.rowSpan));
        const cabWM = Math.max(0.05, cabColSpan * cellWM + (cabBox.extraWidthMm || 0) / 1000);
        const cabLM = Math.max(0.05, cabRowSpan * cellLM + (cabBox.extraLengthMm || 0) / 1000);
        const posX_cab = widthM / 2 - (cabColStart + cabColSpan / 2) * cellWM + (cabBox.offsetXMm || 0) / 1000;
        const posZ_cab = -(cabRowStart + cabRowSpan / 2) * cellLM + (cabBox.offsetZMm || 0) / 1000;
        const rawZones = getUpperCabinetExclusionZones(cabBox, cabWM, cabLM, { maxGapMm: 10000, marginM: 0.003 });
        for (const oz of rawZones) {
          worldCabinetCutouts.push({
            cabinetBottomMm,
            rect: {
              minX: posX_cab + oz.minX,
              maxX: posX_cab + oz.maxX,
              minZ: posZ_cab + oz.minZ,
              maxZ: posZ_cab + oz.maxZ
            }
          });
        }
      }

      effectiveGroups.forEach((grpIds, gIdx) => {
        const grpSubparts = grpIds.map((id) => byId.get(id)!).filter(Boolean);
        if (grpSubparts.length < 2) return;
        const distinctBoxIds = new Set(grpSubparts.map((s) => s.boxId));
        // Grupos dentro de um único módulo já são construídos pelo próprio SlatBedMattressBuilder
        if (distinctBoxIds.size < 2) return;

        const allBedsOpen = globalBedOpen || grpSubparts.every((s) => s.isBedOpen);
        const thicknessM = Math.max(...grpSubparts.map((s) => s.thicknessM));
        const topY = Math.max(...grpSubparts.map((s) => s.topOfSlatsY));
        const mattressY = topY + thicknessM / 2;
        const groupMattressTopMm = Math.round((topY - floorY + thicknessM) * 1000);
        // Só aplica recorte de armários aéreos cuja base entra fisicamente abaixo do topo do colchão
        const worldCutouts: CushionRect[] = worldCabinetCutouts
          .filter((c) => c.cabinetBottomMm < groupMattressTopMm - 1)
          .map((c) => c.rect);
        const foamLabel = grpSubparts[0].foamName || 'Espuma D33';
        const isAnySelected = selectedBoxId ? distinctBoxIds.has(selectedBoxId) : false;

        const mattressMat = new THREE.MeshStandardMaterial({
          color: isAnySelected ? 0x38bdf8 : 0x334155,
          roughness: 0.90,
          metalness: 0.02
        });

        const rects: CushionRect[] = grpSubparts.map((s) => ({
          minX: s.minX,
          maxX: s.maxX,
          minZ: s.minZ,
          maxZ: s.maxZ
        }));

        const res = buildUnionCushionMesh(rects, worldCutouts, thicknessM, mattressY, mattressMat);
        if (!res) return;

        res.mesh.name = `UnifiedCrossModuleMattress_${gIdx}`;
        res.mesh.castShadow = true;
        res.mesh.receiveShadow = true;
        res.mesh.visible = allBedsOpen;

        const curW = res.actualMaxX - res.actualMinX;
        const curL = res.actualMaxZ - res.actualMinZ;

        // Calcula o polígono exato normalizado (u ao longo do maior lado, v ao longo do menor lado) para o Plano de Corte 2D
        let cutOutlineNorm: Array<{ u: number; v: number }> | undefined;
        const polys = computeRectUnionPolygons(
          rects.map((r) => ({ minX: r.minX, maxX: r.maxX, minY: r.minZ, maxY: r.maxZ })),
          0.005
        );
        if (polys.length > 0 && polys[0].length > 4 && curW > 0.01 && curL > 0.01) {
          const isXLonger = curW >= curL;
          cutOutlineNorm = polys[0].map((pt) => {
            const nx = Math.max(0, Math.min(1, (pt.x - res.actualMinX) / curW));
            const nz = Math.max(0, Math.min(1, (pt.y - res.actualMinZ) / curL));
            return isXLonger ? { u: nx, v: nz } : { u: nz, v: nx };
          });
        }

        res.mesh.userData = {
          isWoodPart: false,
          isUpholstery: true,
          dimW: curW,
          dimH: thicknessM,
          dimL: curL,
          thicknessMm: Math.round(thicknessM * 1000),
          partLabel: `Colchão Conectado (${grpSubparts.length} partes entre módulos)${res.labelSuffix}`,
          material: `${foamLabel} Revestida em Tecido Impermeável`,
          woodMaterial: `${foamLabel} (Colchão)`,
          category: '🛏️ Estofaria Campervan',
          hasCabinetCutout: res.isCutout,
          moduleName: '🛏️ Cama Retrátil / Sofá-Cama',
          partType: 'upholstery',
          isMergedMattressGroup: true,
          globalSubpartIds: grpIds,
          cutOutlineNorm
        };

        // Detalha na peça 3D as junções/emendas internas das subpartes que compõem o grupo
        addGroupJunctionDetailsToCushion(res, rects, worldCutouts, thicknessM);

        this.boxesGroup.add(res.mesh);
      });
    }
  }
}

