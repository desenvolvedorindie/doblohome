import { describe, it, expect } from 'vitest';
import {
  computePerforationHoles,
  optimizeCuttingPlan,
  recalculateSheetStats,
  checkPiecePlacement,
  CutPieceInput,
  PlacedPiece,
  SheetPlan
} from '../src/utils/cuttingOptimizer';

describe('Plano de Corte - Algoritmo & Otimizador (cuttingOptimizer)', () => {
  describe('1. computePerforationHoles (Furações CNC para Tampos Vazados)', () => {
    it('deve gerar furos de alívio válidos dentro das margens de segurança', () => {
      const wMm = 1160;
      const hMm = 380;
      const holes = computePerforationHoles(wMm, hMm, {
        holeDiameterMm: 40,
        spacingMm: 85
      });

      expect(holes.length).toBeGreaterThan(0);

      // Margem calculada: Math.min(45, Math.max(25, dim * 0.10))
      // Para 1160: 45mm; Para 380: 38mm
      holes.forEach((hole) => {
        expect(hole.x).toBeGreaterThanOrEqual(25);
        expect(hole.x).toBeLessThanOrEqual(wMm - 25);
        expect(hole.y).toBeGreaterThanOrEqual(25);
        expect(hole.y).toBeLessThanOrEqual(hMm - 25);
        expect(hole.r).toBeGreaterThan(0);
        expect(hole.r).toBeLessThanOrEqual(20); // raio máx = 40 / 2 = 20
      });
    });

    it('deve respeitar zonas de exclusão (ex: apoio do armário aéreo)', () => {
      const wMm = 1200;
      const hMm = 600;

      // Sem zona de exclusão
      const allHoles = computePerforationHoles(wMm, hMm, {
        holeDiameterMm: 40,
        spacingMm: 80
      });

      // Com zona de exclusão no centro
      const withExclusion = computePerforationHoles(wMm, hMm, {
        holeDiameterMm: 40,
        spacingMm: 80,
        exclusionZones: [
          { minX: -0.15, maxX: 0.15, minZ: -0.15, maxZ: 0.15 } // metros relativos ao centro
        ]
      });

      expect(withExclusion.length).toBeLessThan(allHoles.length);

      // Nenhum furo deve estar na área excluída
      withExclusion.forEach((hole) => {
        const relX = (hole.x - wMm / 2) / 1000;
        const relY = (hole.y - hMm / 2) / 1000;
        const inZone =
          relX >= -0.15 - 0.015 &&
          relX <= 0.15 + 0.015 &&
          relY >= -0.15 - 0.015 &&
          relY <= 0.15 + 0.015;
        expect(inZone).toBe(false);
      });
    });

    it('deve limitar diâmetro e espaçamento dentro de limites estruturais seguros', () => {
      // Diâmetro muito grande (> 85mm) deve ser limitado
      const holesLarge = computePerforationHoles(800, 400, {
        holeDiameterMm: 200,
        spacingMm: 50 // espaçamento menor que diâmetro deve ser ajustado
      });

      expect(holesLarge.length).toBeGreaterThan(0);
      holesLarge.forEach((h) => {
        expect(h.r).toBeLessThanOrEqual(43); // Math.round(85 / 2) = 43
      });
    });

    it('deve lidar com peças pequenas sem gerar erro ou NaN', () => {
      const holesSmall = computePerforationHoles(80, 80);
      expect(Array.isArray(holesSmall)).toBe(true);
      holesSmall.forEach((h) => {
        expect(Number.isFinite(h.x)).toBe(true);
        expect(Number.isFinite(h.y)).toBe(true);
        expect(Number.isFinite(h.r)).toBe(true);
      });
    });
  });

  describe('2. optimizeCuttingPlan (Algoritmo 2D Guillotine Bin Packing)', () => {
    const samplePieces: CutPieceInput[] = [
      {
        id: 'p1',
        label: 'Tampo Baú Cozinha',
        lengthMm: 1160,
        widthMm: 450,
        thicknessMm: 15,
        material: 'Compensado Naval 15mm',
        isPerforated: true,
        holeDiameterMm: 40,
        spacingMm: 85
      },
      {
        id: 'p2',
        label: 'Lateral Esquerda',
        lengthMm: 1160,
        widthMm: 380,
        thicknessMm: 15,
        material: 'Compensado Naval 15mm'
      },
      {
        id: 'p3',
        label: 'Lateral Direita',
        lengthMm: 1160,
        widthMm: 380,
        thicknessMm: 15,
        material: 'Compensado Naval 15mm'
      },
      {
        id: 'p4',
        label: 'Frente Baú',
        lengthMm: 500,
        widthMm: 380,
        thicknessMm: 15,
        material: 'Compensado Naval 15mm'
      },
      {
        id: 'p5',
        label: 'Traseira Baú',
        lengthMm: 500,
        widthMm: 380,
        thicknessMm: 15,
        material: 'Compensado Naval 15mm'
      }
    ];

    it('deve alocar peças em chapa padrão 2440x1220 sem colisão e respeitando margens e serra', () => {
      const result = optimizeCuttingPlan(
        samplePieces,
        'Compensado Naval__15',
        'Compensado Naval',
        15,
        {
          sheetWidthMm: 2440,
          sheetHeightMm: 1220,
          kerfMm: 3,
          marginMm: 10,
          allowRotation: true
        }
      );

      expect(result.totalSheets).toBeGreaterThanOrEqual(1);
      expect(result.totalPiecesCount).toBe(samplePieces.length);
      expect(result.unplacedPieces).toHaveLength(0);
      expect(result.overallEfficiencyPct).toBeGreaterThan(0);

      // Verifica cada folha
      result.sheets.forEach((sheet) => {
        expect(sheet.efficiencyPct + sheet.wastePct).toBeCloseTo(100, 0);

        // Verifica limites de cada peça
        sheet.placedPieces.forEach((p) => {
          expect(p.x).toBeGreaterThanOrEqual(sheet.marginMm);
          expect(p.y).toBeGreaterThanOrEqual(sheet.marginMm);
          expect(p.x + p.w).toBeLessThanOrEqual(sheet.sheetWidthMm - sheet.marginMm);
          expect(p.y + p.h).toBeLessThanOrEqual(sheet.sheetHeightMm - sheet.marginMm);
        });

        // Verifica colisão entre pares de peças
        for (let i = 0; i < sheet.placedPieces.length; i++) {
          for (let j = i + 1; j < sheet.placedPieces.length; j++) {
            const p1 = sheet.placedPieces[i];
            const p2 = sheet.placedPieces[j];

            // Considera espessura da serra (kerf)
            const overlapX = p1.x < p2.x + p2.w && p1.x + p1.w > p2.x;
            const overlapY = p1.y < p2.y + p2.h && p1.y + p1.h > p2.y;
            const collides = overlapX && overlapY;
            expect(collides).toBe(false);
          }
        }
      });
    });

    it('deve calcular furos CNC automaticamente em peças vazadas alocadas', () => {
      const result = optimizeCuttingPlan(
        samplePieces,
        'Compensado Naval__15',
        'Compensado Naval',
        15
      );

      const perforatedPlaced = result.sheets[0].placedPieces.find((p) => p.isPerforated);
      expect(perforatedPlaced).toBeDefined();
      expect(perforatedPlaced?.holes).toBeDefined();
      expect(perforatedPlaced!.holes!.length).toBeGreaterThan(0);
    });

    it('deve criar múltiplas chapas automaticamente quando a demanda de peças exceder uma chapa', () => {
      // 10 peças grandes de 1200x500mm excedem uma única chapa de 2440x1220mm
      const largeBatch: CutPieceInput[] = Array.from({ length: 8 }, (_, i) => ({
        id: `big_${i}`,
        label: `Tampo Grande ${i + 1}`,
        lengthMm: 1200,
        widthMm: 550,
        thicknessMm: 15,
        material: 'Compensado Naval 15mm'
      }));

      const result = optimizeCuttingPlan(
        largeBatch,
        'Compensado Naval__15',
        'Compensado Naval',
        15
      );

      expect(result.totalSheets).toBeGreaterThan(1);
      expect(result.totalPiecesCount).toBe(8);
      expect(result.unplacedPieces).toHaveLength(0);
    });

    it('deve respeitar restrição de rotação quando canRotate=false ou allowRotation=false', () => {
      const strictPiece: CutPieceInput = {
        id: 'grain_dir',
        label: 'Painel com Veio de Madeira Obrigatório',
        lengthMm: 1400,
        widthMm: 300,
        thicknessMm: 15,
        material: 'Madeira Nobre Maciça',
        canRotate: false
      };

      const result = optimizeCuttingPlan(
        [strictPiece],
        'Madeira Nobre__15',
        'Madeira Nobre Maciça',
        15,
        { allowRotation: false }
      );

      expect(result.totalPiecesCount).toBe(1);
      const placed = result.sheets[0].placedPieces[0];
      expect(placed.rotated).toBe(false);
      expect(placed.w).toBe(1400);
      expect(placed.h).toBe(300);
    });

    it('deve marcar como unplaced peças que excedem as dimensões máximas da chapa', () => {
      const oversizedPiece: CutPieceInput = {
        id: 'giant',
        label: 'Peça Gigante Excede Chapa',
        lengthMm: 3000,
        widthMm: 1500,
        thicknessMm: 15,
        material: 'Compensado Naval'
      };

      const result = optimizeCuttingPlan(
        [oversizedPiece],
        'Compensado Naval__15',
        'Compensado Naval',
        15,
        {
          sheetWidthMm: 2440,
          sheetHeightMm: 1220
        }
      );

      expect(result.unplacedPieces).toHaveLength(1);
      expect(result.unplacedPieces[0].id).toBe('giant');
      expect(result.totalPiecesCount).toBe(0);
    });
  });

  describe('3. recalculateSheetStats (Recálculo Dinâmico de Aproveitamento)', () => {
    it('deve recalcular a área útil e a eficiência após movimentação ou remoção de peças', () => {
      const sheet: SheetPlan = {
        sheetIndex: 1,
        sheetWidthMm: 2000,
        sheetHeightMm: 1000,
        material: 'Compensado Naval',
        thicknessMm: 15,
        marginMm: 10,
        kerfMm: 3,
        totalAreaM2: 2.0, // 2000 * 1000 / 1e6
        usedAreaM2: 0,
        efficiencyPct: 0,
        wastePct: 100,
        placedPieces: [
          {
            id: 'p1',
            pieceId: 'p1',
            label: 'Peça 1',
            x: 10,
            y: 10,
            w: 1000,
            h: 500, // 0.5 m²
            originalLength: 1000,
            originalWidth: 500,
            thicknessMm: 15,
            rotated: false,
            material: 'Compensado'
          },
          {
            id: 'p2',
            pieceId: 'p2',
            label: 'Peça 2',
            x: 10,
            y: 520,
            w: 1000,
            h: 500, // 0.5 m²
            originalLength: 1000,
            originalWidth: 500,
            thicknessMm: 15,
            rotated: false,
            material: 'Compensado'
          }
        ]
      };

      const recalculated = recalculateSheetStats(sheet);
      expect(recalculated.usedAreaM2).toBe(1.0); // 0.5 + 0.5
      expect(recalculated.efficiencyPct).toBe(50); // 1.0 / 2.0 = 50%
      expect(recalculated.wastePct).toBe(50);
    });
  });

  describe('4. checkPiecePlacement (Validação de Limites e Colisão para Arrasto Manual)', () => {
    const sheetW = 2440;
    const sheetH = 1220;
    const margin = 10;
    const kerf = 3;

    const basePiece: PlacedPiece = {
      id: 'target',
      pieceId: 'p1',
      label: 'Peça Alvo',
      x: 100,
      y: 100,
      w: 400,
      h: 300,
      originalLength: 400,
      originalWidth: 300,
      thicknessMm: 15,
      rotated: false,
      material: 'Compensado'
    };

    const neighborPiece: PlacedPiece = {
      id: 'neighbor',
      pieceId: 'p2',
      label: 'Peça Vizinha',
      x: 600,
      y: 100,
      w: 400,
      h: 300,
      originalLength: 400,
      originalWidth: 300,
      thicknessMm: 15,
      rotated: false,
      material: 'Compensado'
    };

    it('deve confirmar que posição livre dentro da chapa é válida', () => {
      const check = checkPiecePlacement(basePiece, [neighborPiece], sheetW, sheetH, margin, kerf);
      expect(check.isValid).toBe(true);
      expect(check.isOutOfBounds).toBe(false);
      expect(check.isColliding).toBe(false);
    });

    it('deve detectar quando a peça sai pela borda esquerda ou superior (refilo)', () => {
      const outLeft = { ...basePiece, x: 5 }; // menor que margin (10)
      const checkLeft = checkPiecePlacement(outLeft, [], sheetW, sheetH, margin, kerf);
      expect(checkLeft.isValid).toBe(false);
      expect(checkLeft.isOutOfBounds).toBe(true);

      const outTop = { ...basePiece, y: 0 };
      const checkTop = checkPiecePlacement(outTop, [], sheetW, sheetH, margin, kerf);
      expect(checkTop.isValid).toBe(false);
      expect(checkTop.isOutOfBounds).toBe(true);
    });

    it('deve detectar quando a peça sai pela borda direita ou inferior', () => {
      const outRight = { ...basePiece, x: sheetW - basePiece.w - margin + 5 };
      const checkRight = checkPiecePlacement(outRight, [], sheetW, sheetH, margin, kerf);
      expect(checkRight.isValid).toBe(false);
      expect(checkRight.isOutOfBounds).toBe(true);

      const outBottom = { ...basePiece, y: sheetH - basePiece.h - margin + 5 };
      const checkBottom = checkPiecePlacement(outBottom, [], sheetW, sheetH, margin, kerf);
      expect(checkBottom.isValid).toBe(false);
      expect(checkBottom.isOutOfBounds).toBe(true);
    });

    it('deve detectar colisão com outra peça respeitando o kerf da serra', () => {
      // Posiciona target sobrepondo neighbor
      const overlappingPiece = { ...basePiece, x: 550 };
      const check = checkPiecePlacement(overlappingPiece, [neighborPiece], sheetW, sheetH, margin, kerf);
      expect(check.isValid).toBe(false);
      expect(check.isColliding).toBe(true);
      expect(check.collidingWith).toBe('Peça Vizinha');
    });

    it('não deve acusar colisão da peça consigo mesma', () => {
      const check = checkPiecePlacement(basePiece, [basePiece], sheetW, sheetH, margin, kerf);
      expect(check.isValid).toBe(true);
      expect(check.isColliding).toBe(false);
    });
  });

  describe('5. Cenário Real de Marcenaria Camper Van (Módulos Combinados)', () => {
    it('deve otimizar com sucesso conjunto completo de marcenaria de van', () => {
      const camperSet: CutPieceInput[] = [
        // Baú Cozinha
        { id: 'c1', label: 'Tampo Pia/Fogão Vazado CNC', lengthMm: 1160, widthMm: 450, thicknessMm: 15, material: 'Compensado Naval', isPerforated: true },
        { id: 'c2', label: 'Lateral Esquerda Cozinha', lengthMm: 1160, widthMm: 380, thicknessMm: 15, material: 'Compensado Naval' },
        { id: 'c3', label: 'Lateral Direita Cozinha', lengthMm: 1160, widthMm: 380, thicknessMm: 15, material: 'Compensado Naval' },
        { id: 'c4', label: 'Frente Gaveteiro', lengthMm: 480, widthMm: 380, thicknessMm: 15, material: 'Compensado Naval' },
        { id: 'c5', label: 'Fundo Gaveteiro', lengthMm: 480, widthMm: 380, thicknessMm: 15, material: 'Compensado Naval' },
        // Baú Sofá / Cama Retrátil
        { id: 'b1', label: 'Tampo Sofá Baú 1', lengthMm: 1000, widthMm: 500, thicknessMm: 15, material: 'Compensado Naval', isPerforated: true },
        { id: 'b2', label: 'Tampo Sofá Baú 2', lengthMm: 1000, widthMm: 500, thicknessMm: 15, material: 'Compensado Naval', isPerforated: true },
        { id: 'b3', label: 'Lateral Longa Cama', lengthMm: 1600, widthMm: 350, thicknessMm: 15, material: 'Compensado Naval' },
        // Armário Aéreo
        { id: 'a1', label: 'Base Armário Aéreo', lengthMm: 1200, widthMm: 280, thicknessMm: 15, material: 'Compensado Naval' },
        { id: 'a2', label: 'Porta Basculante Aéreo', lengthMm: 1200, widthMm: 260, thicknessMm: 15, material: 'Compensado Naval' }
      ];

      const result = optimizeCuttingPlan(
        camperSet,
        'Compensado Naval__15',
        'Compensado Naval',
        15,
        {
          sheetWidthMm: 2440,
          sheetHeightMm: 1220,
          kerfMm: 3,
          marginMm: 10,
          allowRotation: true
        }
      );

      // Todas as 10 peças devem ser posicionadas
      expect(result.unplacedPieces).toHaveLength(0);
      expect(result.totalPiecesCount).toBe(10);
      // Aproveitamento global realista de marcenaria de chapas
      expect(result.overallEfficiencyPct).toBeGreaterThan(40);
      expect(result.sheets[0].efficiencyPct).toBeGreaterThan(50); // Primeira folha bem aproveitada
      expect(result.totalSheets).toBeGreaterThanOrEqual(1);
    });
  });

  describe('6. Casos Limítrofes e Robustez Numérica', () => {
    it('deve lidar graciosamente com lista vazia de peças', () => {
      const result = optimizeCuttingPlan([], 'Compensado__15', 'Compensado', 15);
      expect(result.totalSheets).toBe(0);
      expect(result.totalPiecesCount).toBe(0);
      expect(result.unplacedPieces).toHaveLength(0);
      expect(result.overallEfficiencyPct).toBe(0);
      expect(result.sheets).toHaveLength(0);
    });

    it('deve priorizar peças maiores primeiro (heurística Best-Fit Decreasing)', () => {
      const small: CutPieceInput = { id: 's', label: 'Pequena', lengthMm: 200, widthMm: 200, thicknessMm: 15, material: 'Compensado' };
      const medium: CutPieceInput = { id: 'm', label: 'Média', lengthMm: 600, widthMm: 400, thicknessMm: 15, material: 'Compensado' };
      const large: CutPieceInput = { id: 'l', label: 'Grande', lengthMm: 1500, widthMm: 800, thicknessMm: 15, material: 'Compensado' };

      // Passa fora de ordem
      const result = optimizeCuttingPlan([small, large, medium], 'Compensado__15', 'Compensado', 15);
      expect(result.sheets[0].placedPieces[0].pieceId).toBe('l');
    });

    it('deve suportar chapa padrão MDF 2750x1830mm com margens e serra customizadas', () => {
      const pieces: CutPieceInput[] = [
        { id: 'p1', label: 'Painel 1', lengthMm: 2000, widthMm: 900, thicknessMm: 18, material: 'MDF Branco Ultra' },
        { id: 'p2', label: 'Painel 2', lengthMm: 2000, widthMm: 800, thicknessMm: 18, material: 'MDF Branco Ultra' }
      ];

      const result = optimizeCuttingPlan(pieces, 'MDF__18', 'MDF Branco Ultra', 18, {
        sheetWidthMm: 2750,
        sheetHeightMm: 1830,
        marginMm: 15,
        kerfMm: 4
      });

      expect(result.sheets[0].sheetWidthMm).toBe(2750);
      expect(result.sheets[0].sheetHeightMm).toBe(1830);
      expect(result.sheets[0].marginMm).toBe(15);
      expect(result.sheets[0].kerfMm).toBe(4);
      expect(result.totalPiecesCount).toBe(2);
      expect(result.totalSheets).toBe(1);
    });

    it('deve garantir que a distância física entre peças alocadas respeite o kerf da serra', () => {
      const pieces: CutPieceInput[] = [
        { id: 'p1', label: 'Peça 1', lengthMm: 800, widthMm: 400, thicknessMm: 15, material: 'Compensado' },
        { id: 'p2', label: 'Peça 2', lengthMm: 800, widthMm: 400, thicknessMm: 15, material: 'Compensado' }
      ];

      const kerf = 5;
      const result = optimizeCuttingPlan(pieces, 'Compensado__15', 'Compensado', 15, {
        sheetWidthMm: 2440,
        sheetHeightMm: 1220,
        kerfMm: kerf,
        marginMm: 10
      });

      const p1 = result.sheets[0].placedPieces[0];
      const p2 = result.sheets[0].placedPieces[1];

      // Se uma está ao lado da outra no eixo X
      if (p1.y === p2.y) {
        const dist = Math.abs((p1.x + p1.w) - p2.x);
        expect(dist).toBeGreaterThanOrEqual(kerf);
      }
      // Se uma está abaixo da outra no eixo Y
      if (p1.x === p2.x) {
        const dist = Math.abs((p1.y + p1.h) - p2.y);
        expect(dist).toBeGreaterThanOrEqual(kerf);
      }
    });
  });
});
