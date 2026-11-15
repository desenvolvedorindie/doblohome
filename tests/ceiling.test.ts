import { describe, it, expect } from 'vitest';
import { InternalBoxesBuilder } from '../src/three/InternalBoxesBuilder';
import { extractWoodCutGroups } from '../src/utils/woodUtils';
import { DEFAULT_CEILING_CONFIG, DEFAULT_INTERNAL_GRID } from '../src/data/internalBoxesPresets';
import { InternalGridConfig, InternalBoxItem } from '../src/types';

describe('Ceiling / Forro do Campervan System', () => {
  it('has valid default ceiling configuration', () => {
    expect(DEFAULT_CEILING_CONFIG.enabled).toBe(true);
    expect(DEFAULT_CEILING_CONFIG.visibleIn3D).toBe(true);
    expect(DEFAULT_CEILING_CONFIG.type).toBe('slatted');
    expect(DEFAULT_CEILING_CONFIG.slattedWood).toBe('freijo');
    expect(DEFAULT_CEILING_CONFIG.slatWidthMm).toBe(40);
    expect(DEFAULT_CEILING_CONFIG.slatThicknessMm).toBe(12);
    expect(DEFAULT_CEILING_CONFIG.slatGapMm).toBe(10);
    expect(DEFAULT_CEILING_CONFIG.led?.enabled).toBe(true);
  });

  it('builds slatted ceiling in InternalBoxesBuilder and attaches wood cutting metadata', () => {
    const builder = new InternalBoxesBuilder();
    const grid: InternalGridConfig = {
      ...DEFAULT_INTERNAL_GRID,
      ceiling: {
        ...DEFAULT_CEILING_CONFIG,
        enabled: true,
        type: 'slatted',
        slattedWood: 'freijo',
        slatWidthMm: 40,
        slatThicknessMm: 12,
        slatGapMm: 10,
        slatDirection: 'longitudinal',
        acousticFeltBacking: true,
        lengthMm: 1700,
        widthMm: 1200
      }
    };
    const boxes: InternalBoxItem[] = [];

    builder.update(grid, boxes);

    // Deve ter criado o grupo do teto e seus elementos
    expect(builder.ceilingGroup.children.length).toBeGreaterThan(0);

    // Verifica se as ripas foram criadas com isWoodPart e incluídas em extractWoodCutGroups
    const mockSceneManager = { internalBoxesBuilder: builder };
    const woodStats = extractWoodCutGroups(mockSceneManager);

    expect(woodStats.totalPieces).toBeGreaterThan(15);
    const slatGroup = woodStats.cutGroups.find((g) => g.partType === 'ceiling');
    expect(slatGroup).toBeDefined();
    expect(slatGroup?.woodMaterial).toBe('Freijó Nobre');
    expect(slatGroup?.thicknessMm).toBe(12);
    expect(slatGroup?.lengthMm).toBe(1700);
    expect(slatGroup?.widthMm).toBe(40);
  });

  it('builds sheet ceiling (MDF Branco Ultra and Compensado Naval) correctly', () => {
    const builder = new InternalBoxesBuilder();
    const gridMdf: InternalGridConfig = {
      ...DEFAULT_INTERNAL_GRID,
      ceiling: {
        ...DEFAULT_CEILING_CONFIG,
        enabled: true,
        type: 'sheet',
        sheetMaterial: 'white_mdf',
        thicknessMm: 9,
        sheetPanels: 'single',
        lengthMm: 1700,
        widthMm: 1200
      }
    };

    builder.update(gridMdf, []);

    const mockSceneManager = { internalBoxesBuilder: builder };
    const woodStatsMdf = extractWoodCutGroups(mockSceneManager);

    const sheetPiece = woodStatsMdf.cutGroups.find((g) => g.partType === 'ceiling');
    expect(sheetPiece).toBeDefined();
    expect(sheetPiece?.woodMaterial).toBe('MDF Branco Ultra');
    expect(sheetPiece?.thicknessMm).toBe(9);
    expect(sheetPiece?.lengthMm).toBe(1700);
    expect(sheetPiece?.widthMm).toBe(1200);

    // Teste com compensado bipartido
    const gridPly: InternalGridConfig = {
      ...DEFAULT_INTERNAL_GRID,
      ceiling: {
        ...DEFAULT_CEILING_CONFIG,
        enabled: true,
        type: 'sheet',
        sheetMaterial: 'plywood',
        thicknessMm: 12,
        sheetPanels: 'split_longitudinal',
        lengthMm: 1700,
        widthMm: 1200
      }
    };

    builder.update(gridPly, []);
    const woodStatsPly = extractWoodCutGroups({ internalBoxesBuilder: builder });
    const plyPieces = woodStatsPly.cutGroups.filter((g) => g.partType === 'ceiling');
    expect(plyPieces.length).toBeGreaterThanOrEqual(1);
    expect(plyPieces[0].woodMaterial).toBe('Compensado Naval');
    expect(plyPieces[0].thicknessMm).toBe(12);
    expect(plyPieces[0].qty).toBe(2);
  });

  it('supports integrated LED ceiling lighting (strips and spots with PointLights)', () => {
    const builder = new InternalBoxesBuilder();
    const grid: InternalGridConfig = {
      ...DEFAULT_INTERNAL_GRID,
      ceiling: {
        ...DEFAULT_CEILING_CONFIG,
        enabled: true,
        led: {
          enabled: true,
          type: 'strip_double',
          color: '#fef3c7',
          brightness: 90
        }
      }
    };

    builder.update(grid, []);

    // Deve conter PointLights e strips
    const lights = builder.ceilingGroup.children.filter((c: any) => c.isPointLight);
    expect(lights.length).toBeGreaterThanOrEqual(2);

    // Teste com Spots
    const gridSpots: InternalGridConfig = {
      ...DEFAULT_INTERNAL_GRID,
      ceiling: {
        ...DEFAULT_CEILING_CONFIG,
        enabled: true,
        led: {
          enabled: true,
          type: 'spots',
          spotsCount: 6,
          color: '#ffffff',
          brightness: 80
        }
      }
    };

    builder.update(gridSpots, []);
    const spotObjects = builder.ceilingGroup.children.filter((c) => c.name.startsWith('CeilingSpot_'));
    expect(spotObjects.length).toBe(6);
  });

  it('allows disabling the ceiling completely or hiding it in 3D', () => {
    const builder = new InternalBoxesBuilder();

    // 1. Desativado
    const gridDisabled: InternalGridConfig = {
      ...DEFAULT_INTERNAL_GRID,
      ceiling: {
        ...DEFAULT_CEILING_CONFIG,
        enabled: false
      }
    };

    builder.update(gridDisabled, []);
    expect(builder.ceilingGroup.children.length).toBe(0);

    // 2. Ativado porém com visibleIn3D = false (para ver interior por cima)
    const gridHidden3D: InternalGridConfig = {
      ...DEFAULT_INTERNAL_GRID,
      ceiling: {
        ...DEFAULT_CEILING_CONFIG,
        enabled: true,
        visibleIn3D: false
      }
    };

    builder.update(gridHidden3D, []);
    expect(builder.ceilingGroup.visible).toBe(false);
    // Mas as peças continuam calculadas para o plano de corte e marcenaria!
    const woodStats = extractWoodCutGroups({ internalBoxesBuilder: builder });
    expect(woodStats.cutGroups.some((g) => g.partType === 'ceiling')).toBe(true);
  });

  it('calculates and applies roof curvature matching Fiat Doblo transversal arch', () => {
    const w = 1.2;
    const archM = 0.025; // 25mm

    // Teste da função estática matemática de curvatura:
    // Base de referência = laterais mais baixas (yDrop = 0)
    // Curvatura compensa subindo em direção ao centro (yDrop = +archM)
    const centerOffset = InternalBoxesBuilder.getCeilingArchOffset(0, w, archM);
    expect(centerOffset.yDrop).toBeCloseTo(0.025, 4);
    expect(centerOffset.rotZ).toBeCloseTo(0, 4);

    const rightEdgeOffset = InternalBoxesBuilder.getCeilingArchOffset(0.6, w, archM);
    expect(rightEdgeOffset.yDrop).toBeCloseTo(0, 4);
    expect(rightEdgeOffset.rotZ).toBeLessThan(0); // Inclina para baixo na lateral direita

    const leftEdgeOffset = InternalBoxesBuilder.getCeilingArchOffset(-0.6, w, archM);
    expect(leftEdgeOffset.yDrop).toBeCloseTo(0, 4);
    expect(leftEdgeOffset.rotZ).toBeGreaterThan(0); // Inclina para cima na tangente saindo da lateral esquerda

    // Teste da aplicação nas ripas do teto
    const builder = new InternalBoxesBuilder();
    const grid: InternalGridConfig = {
      ...DEFAULT_INTERNAL_GRID,
      ceiling: {
        ...DEFAULT_CEILING_CONFIG,
        enabled: true,
        type: 'slatted',
        curvatureMm: 25,
        widthMm: 1200,
        lengthMm: 1700
      }
    };
    builder.update(grid, []);

    const slats = builder.ceilingGroup.children.filter((c) => c.name.startsWith('CeilingSlat_'));
    expect(slats.length).toBeGreaterThan(0);

    // Ripa mais ao centro deve estar mais alta em Y do que ripa nas extremidades
    const sortedByX = [...slats].sort((a, b) => a.position.x - b.position.x);
    const leftmost = sortedByX[0];
    const centerSlat = sortedByX[Math.floor(sortedByX.length / 2)];
    const rightmost = sortedByX[sortedByX.length - 1];

    expect(centerSlat.position.y).toBeGreaterThan(leftmost.position.y);
    expect(centerSlat.position.y).toBeGreaterThan(rightmost.position.y);
    expect(leftmost.rotation.z).toBeGreaterThan(0);
    expect(rightmost.rotation.z).toBeLessThan(0);
    expect(Math.abs(centerSlat.rotation.z)).toBeLessThan(0.02);

    // Teste de clamp da curvatura máxima em 30mm (0.03m)
    const gridOverMax: InternalGridConfig = {
      ...DEFAULT_INTERNAL_GRID,
      ceiling: {
        ...DEFAULT_CEILING_CONFIG,
        enabled: true,
        type: 'slatted',
        curvatureMm: 80, // Valor acima do limite de 30mm
        widthMm: 1200,
        lengthMm: 1700
      }
    };
    builder.update(gridOverMax, []);
    const slatsClamped = builder.ceilingGroup.children.filter((c) => c.name.startsWith('CeilingSlat_'));
    const sortedClamped = [...slatsClamped].sort((a, b) => a.position.x - b.position.x);
    const centerClamped = sortedClamped[Math.floor(sortedClamped.length / 2)];
    const leftmostClamped = sortedClamped[0];
    // A elevação máxima entre o centro e as laterais deve respeitar o teto de 30mm (0.03m)
    expect(centerClamped.position.y - leftmostClamped.position.y).toBeCloseTo(0.03, 2);
  });
});
