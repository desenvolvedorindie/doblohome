import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { InternalBoxesBuilder } from '../src/three/InternalBoxesBuilder';
import { InternalBoxItem, InternalGridConfig } from '../src/types';
import { optimizeCuttingPlan, computePerforationHoles } from '../src/utils/cuttingOptimizer';

describe('Corte Cloud & Configuração de Espessuras das Peças', () => {
  it('1. Deve extrair espessuras customizadas por face do módulo (getBoxThickness)', () => {
    const box: InternalBoxItem = {
      id: 'box-1',
      name: 'Módulo Cozinha Gourmet',
      type: 'chest',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 2,
      heightMm: 450,
      color: '#d97706',
      material: 'plywood',
      thicknessMm: 18,
      panelThickness: {
        top: 25,
        bottom: 12,
        front: 15,
        rear: 9,
        left: 18,
        right: 18,
        cabinet: 15,
        slat: 12,
        shelf: 20
      }
    };

    const thickness = InternalBoxesBuilder.getBoxThickness(box);

    expect(thickness.default).toBe(0.018);
    expect(thickness.top).toBe(0.025);
    expect(thickness.bottom).toBe(0.012);
    expect(thickness.front).toBe(0.015);
    expect(thickness.rear).toBe(0.009);
    expect(thickness.left).toBe(0.018);
    expect(thickness.right).toBe(0.018);
    expect(thickness.cabinet).toBe(0.015);
    expect(thickness.slat).toBe(0.012);
    expect(thickness.shelf).toBe(0.020);
  });

  it('2. Deve usar espessura padrão de 15mm quando não houver customização', () => {
    const box: InternalBoxItem = {
      id: 'box-2',
      name: 'Baú Padrão',
      type: 'chest',
      colStart: 1,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      heightMm: 400,
      color: '#2563eb'
    };

    const thickness = InternalBoxesBuilder.getBoxThickness(box);

    expect(thickness.default).toBe(0.015);
    expect(thickness.top).toBe(0.015);
    expect(thickness.bottom).toBe(0.015);
    expect(thickness.front).toBe(0.015);
    expect(thickness.rear).toBe(0.015);
    expect(thickness.left).toBe(0.015);
    expect(thickness.right).toBe(0.015);
  });

  it('3. Deve converter nomes comerciais de materiais corretamente', () => {
    expect(InternalBoxesBuilder.getWoodMaterialName('plywood')).toBe('Compensado Naval');
    expect(InternalBoxesBuilder.getWoodMaterialName('dark_wood')).toBe('Madeira Nobre Maciça');
    expect(InternalBoxesBuilder.getWoodMaterialName('white_mdf')).toBe('MDF Branco Ultra');
    expect(InternalBoxesBuilder.getWoodMaterialName('aluminum')).toBe('Gabinete Alumínio Modular');
    expect(InternalBoxesBuilder.getWoodMaterialName(undefined)).toBe('Compensado Naval');
  });

  it('4. Deve construir a chapa base com espessura configurada no grid (floorThicknessMm)', () => {
    const builder = new InternalBoxesBuilder();
    const grid: InternalGridConfig = {
      widthMm: 1200,
      lengthMm: 1800,
      heightMm: 400,
      colsX: 3,
      rowsZ: 4,
      floorThicknessMm: 18
    };

    builder.update(grid, []);

    let floorFound = false;
    builder.group.traverse((obj: any) => {
      if (obj.isMesh && obj.name === 'BaseNavalPlywoodFloor') {
        floorFound = true;
        expect(obj.userData.thicknessMm).toBe(18);
        expect(obj.userData.woodMaterial).toBe('Compensado Naval');
        expect(obj.userData.partType).toBe('floor');
      }
    });

    expect(floorFound).toBe(true);
  });

  it('5. Deve construir módulos atribuindo espessuras e materiais específicos para cada face', () => {
    const builder = new InternalBoxesBuilder();
    const grid: InternalGridConfig = {
      widthMm: 1200,
      lengthMm: 1800,
      heightMm: 400,
      colsX: 3,
      rowsZ: 4
    };

    const boxes: InternalBoxItem[] = [
      {
        id: 'box-3',
        name: 'Baú Personalizado',
        type: 'chest',
        colStart: 0,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 1,
        heightMm: 400,
        color: '#059669',
        material: 'dark_wood',
        thicknessMm: 20,
        panelThickness: {
          top: 25,
          left: 18,
          right: 18,
          front: 15,
          rear: 12
        },
        topPerforated: true,
        perforationHoleDiameterMm: 45,
        perforationSpacingMm: 90
      }
    ];

    builder.update(grid, boxes);

    const woodPieces: any[] = [];
    builder.group.traverse((obj: any) => {
      if (obj.isMesh && obj.userData && obj.userData.isWoodPart && !obj.userData.isInternalBoxHitbox) {
        woodPieces.push(obj.userData);
      }
    });

    expect(woodPieces.length).toBeGreaterThan(0);

    const topPanel = woodPieces.find((p) => p.partType === 'top');
    expect(topPanel).toBeDefined();
    expect(topPanel.thicknessMm).toBe(25);
    expect(topPanel.woodMaterial).toBe('Madeira Nobre Maciça');
    expect(topPanel.isPerforated).toBe(true);
    expect(topPanel.holeDiameterMm).toBe(45);
    expect(topPanel.spacingMm).toBe(90);

    const leftPanel = woodPieces.find((p) => p.partType === 'left');
    expect(leftPanel).toBeDefined();
    expect(leftPanel.thicknessMm).toBe(18);

    const frontPanel = woodPieces.find((p) => p.partType === 'front');
    expect(frontPanel).toBeDefined();
    expect(frontPanel.thicknessMm).toBe(15);
  });

  it('6. Otimizador de corte deve organizar peças em chapas considerando furações CNC e espessuras', () => {
    const pieces = [
      {
        id: 'p-top-1',
        label: 'Tampo Vazado Cozinha',
        lengthMm: 1160,
        widthMm: 450,
        thicknessMm: 25,
        material: 'Madeira Nobre Maciça 25mm',
        woodMaterial: 'Madeira Nobre Maciça',
        isPerforated: true,
        holeDiameterMm: 40,
        spacingMm: 80,
        canRotate: true
      },
      {
        id: 'p-side-1',
        label: 'Lateral Baú',
        lengthMm: 450,
        widthMm: 380,
        thicknessMm: 25,
        material: 'Madeira Nobre Maciça 25mm',
        woodMaterial: 'Madeira Nobre Maciça',
        canRotate: true
      }
    ];

    const result = optimizeCuttingPlan(
      pieces,
      'Madeira Nobre Maciça__25',
      'Madeira Nobre Maciça',
      25,
      {
        sheetWidthMm: 2440,
        sheetHeightMm: 1220,
        kerfMm: 3,
        marginMm: 10,
        allowRotation: true
      }
    );

    expect(result.sheets.length).toBeGreaterThan(0);
    const sheet1 = result.sheets[0];
    expect(sheet1.placedPieces.length).toBe(2);

    const placedTop = sheet1.placedPieces.find((p) => p.isPerforated);
    expect(placedTop).toBeDefined();
    expect(placedTop?.holes).toBeDefined();
    expect(placedTop!.holes!.length).toBeGreaterThan(0);

    // Todos os furos devem estar dentro das dimensões da peça
    placedTop!.holes!.forEach((hole) => {
      expect(hole.x).toBeGreaterThanOrEqual(15);
      expect(hole.x).toBeLessThanOrEqual(placedTop!.w - 15);
      expect(hole.y).toBeGreaterThanOrEqual(15);
      expect(hole.y).toBeLessThanOrEqual(placedTop!.h - 15);
    });
  });

  it('7. Deve extrair grupos de corte e agrupar por [Tipo de Madeira] + [Espessura] estilo Corte Cloud', async () => {
    const builder = new InternalBoxesBuilder();
    const grid: InternalGridConfig = {
      widthMm: 1200,
      lengthMm: 1400,
      heightMm: 400,
      colsX: 2,
      rowsZ: 2,
      floorThicknessMm: 18
    };

    const boxes: InternalBoxItem[] = [
      {
        id: 'box-naval-15',
        name: 'Baú Compensado 15mm',
        type: 'chest',
        colStart: 0,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 1,
        heightMm: 400,
        color: '#d97706',
        material: 'plywood',
        thicknessMm: 15
      },
      {
        id: 'box-mdf-18',
        name: 'Gaveteiro MDF 18mm',
        type: 'drawer',
        colStart: 1,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 1,
        heightMm: 400,
        color: '#f8fafc',
        material: 'white_mdf',
        thicknessMm: 18,
        panelThickness: {
          bottom: 12
        }
      }
    ];

    builder.update(grid, boxes);

    // Cria mock do sceneManager contendo o internalBoxesBuilder
    const mockSceneManager = {
      internalBoxesBuilder: builder
    };

    const { extractWoodCutGroups, groupWoodCutPieces } = await import('../src/utils/woodUtils');
    const woodStats = extractWoodCutGroups(mockSceneManager);
    expect(woodStats.totalPieces).toBeGreaterThan(0);
    expect(woodStats.totalAreaM2).toBeGreaterThan(0);

    const categories = groupWoodCutPieces(woodStats.cutGroups);
    expect(categories.length).toBeGreaterThanOrEqual(2);

    // Deve conter grupo de Compensado Naval e grupo de MDF
    const navalGroup = categories.find((c) => c.woodMaterial.includes('Compensado') && c.thicknessMm === 15);
    expect(navalGroup).toBeDefined();
    expect(navalGroup?.totalPieces).toBeGreaterThan(0);

    const mdf18Group = categories.find((c) => c.woodMaterial.includes('MDF') && c.thicknessMm === 18);
    expect(mdf18Group).toBeDefined();

    const mdf12Group = categories.find((c) => c.woodMaterial.includes('MDF') && c.thicknessMm === 12);
    expect(mdf12Group).toBeDefined(); // Fundo da gaveta com 12mm
  });

  it('8. Deve organizar a bancada 3D em grid com linhas separadas por madeira/espessura', async () => {
    const builder = new InternalBoxesBuilder();
    const grid: InternalGridConfig = {
      widthMm: 1200,
      lengthMm: 1400,
      heightMm: 400,
      colsX: 2,
      rowsZ: 2,
      floorThicknessMm: 18
    };

    const boxes: InternalBoxItem[] = [
      {
        id: 'box-naval-15',
        name: 'Baú Compensado 15mm',
        type: 'chest',
        colStart: 0,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 1,
        heightMm: 400,
        color: '#d97706',
        material: 'plywood',
        thicknessMm: 15
      },
      {
        id: 'box-mdf-18',
        name: 'Gaveteiro MDF 18mm',
        type: 'drawer',
        colStart: 1,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 1,
        heightMm: 400,
        color: '#f8fafc',
        material: 'white_mdf',
        thicknessMm: 18,
        panelThickness: {
          bottom: 12
        }
      }
    ];

    builder.update(grid, boxes);

    // Mock SceneManager com barsLineupGroup e solarSystem
    const lineupGroup = new THREE.Group();
    const mockSolarSystem = {
      group: new THREE.Group(),
      cargoBoxConfig: { enabled: false },
      cargoBoxSystem: null
    };

    // Objeto mock que simula o SceneManager
    const sm: any = {
      solarSystem: mockSolarSystem,
      internalBoxesBuilder: builder,
      barsLineupGroup: lineupGroup,
      currentLineupFilter: 'wood',
      createGroupHeaderSprite: (title: string, sub: string, col: string) => {
        const s = new THREE.Sprite();
        s.name = `HeaderSprite_${title}`;
        return s;
      },
      createBarLengthSprite: (rank: number, l: number, w: number, a: number, t: string) => {
        const s = new THREE.Sprite();
        s.name = `LengthSprite_${rank}`;
        return s;
      }
    };

    // Importa SceneManager prototype e executa buildBarsLineup em modo 'wood'
    const { SceneManager } = await import('../src/three/SceneManager');
    const totalRendered = SceneManager.prototype.buildBarsLineup.call(sm, 'wood');

    expect(totalRendered).toBeGreaterThan(0);
    expect(lineupGroup.children.length).toBeGreaterThan(0);

    // Deve ter múltiplos meshes de peças
    const woodMeshes = lineupGroup.children.filter((c: any) => c.isMesh && c.userData?.isLineupPart);
    expect(woodMeshes.length).toBeGreaterThan(0);

    // Coleta as posições Z das peças para verificar se estão em linhas distintas (grid em Z)
    const zPositions = new Set(woodMeshes.map((m: any) => Math.round(m.position.z * 10) / 10));
    expect(zPositions.size).toBeGreaterThan(1); // Mais de 1 linha de profundidade!

    // As peças do mesmo grupo devem ter mesma espessura e estar lado a lado (diferentes posições X)
    const row1Meshes = woodMeshes.filter((m: any) => m.userData?.rowIndex === 1);
    if (row1Meshes.length > 1) {
      const xPositions = new Set(row1Meshes.map((m: any) => m.position.x));
      expect(xPositions.size).toBe(row1Meshes.length); // Lado a lado em X!
    }
  });

  it('9. Deve extrair dados completos de marcenaria e perfis para o painel de plano de corte na tela 3. Peças', async () => {
    const { extractWoodCutGroups, extractBarStats, groupWoodCutPieces } = await import('../src/utils/woodUtils');

    const woodStats = extractWoodCutGroups(null);
    expect(woodStats).toHaveProperty('totalPieces');
    expect(woodStats).toHaveProperty('cutGroups');
    expect(woodStats.standardSheets).toBeGreaterThanOrEqual(1);

    const categories = groupWoodCutPieces(woodStats.cutGroups);
    expect(Array.isArray(categories)).toBe(true);

    const barStats = extractBarStats(null);
    expect(barStats).toHaveProperty('totalPieces');
    expect(barStats).toHaveProperty('totalBars6m');
    expect(Array.isArray(barStats.cutGroups)).toBe(true);
    expect(Array.isArray(barStats.profileSummaries)).toBe(true);
  });
});
