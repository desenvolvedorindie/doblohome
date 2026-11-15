/**
 * cuttingOptimizer.ts
 *
 * Algoritmo profissional de Plano de Corte & Otimização 2D (Estilo Corte Cloud / Seccionadora CNC)
 * com suporte a furações passantes de tampos (usinagens CNC), refilo de borda,
 * espessura de corte de serra (kerf), rotação 90° e manipulação manual interativa.
 */

export interface CutPieceInput {
  id: string;
  pieceId?: string;
  label: string;
  moduleName?: string;
  lengthMm: number; // maior dimensão (comprimento)
  widthMm: number;  // menor dimensão (largura)
  thicknessMm: number;
  material: string;
  woodMaterial?: string;
  isPerforated?: boolean;
  holeDiameterMm?: number;
  spacingMm?: number;
  exclusionZones?: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }>;
  canRotate?: boolean;
  partType?: string;
}

export interface CutHole {
  x: number; // mm relativo ao canto sup. esq. da peça
  y: number;
  r: number; // raio em mm
}

export interface PlacedPiece {
  id: string;
  pieceId: string;
  label: string;
  moduleName?: string;
  x: number; // mm a partir da borda esquerda da folha
  y: number; // mm a partir da borda superior da folha
  w: number; // largura na folha (eixo X)
  h: number; // altura na folha (eixo Y)
  originalLength: number;
  originalWidth: number;
  thicknessMm: number;
  rotated: boolean;
  material: string;
  woodMaterial?: string;
  isPerforated?: boolean;
  holeDiameterMm?: number;
  spacingMm?: number;
  exclusionZones?: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }>;
  holes?: CutHole[];
  partType?: string;
}

export interface SheetPlan {
  sheetIndex: number;
  sheetWidthMm: number;  // padrão 2440 mm
  sheetHeightMm: number; // padrão 1220 mm
  material: string;
  woodMaterial?: string;
  thicknessMm: number;
  marginMm: number;      // refilo (padrão 10 mm)
  kerfMm: number;        // espessura da serra (padrão 3 mm)
  placedPieces: PlacedPiece[];
  usedAreaM2: number;
  totalAreaM2: number;
  efficiencyPct: number; // % aproveitamento útil
  wastePct: number;      // % sobra / retalho
}

export interface CuttingResult {
  materialGroupKey: string;
  materialName: string;
  woodMaterial: string;
  thicknessMm: number;
  sheets: SheetPlan[];
  unplacedPieces: CutPieceInput[];
  totalSheets: number;
  totalPiecesCount: number;
  totalAreaUsedM2: number;
  overallEfficiencyPct: number;
}

export interface CuttingOptimizerOptions {
  sheetWidthMm?: number;
  sheetHeightMm?: number;
  kerfMm?: number;
  marginMm?: number;
  allowRotation?: boolean;
}

/**
 * Calcula a posição exata de cada furo de alívio CNC para um tampo perfurado,
 * respeitando diâmetro, espaçamento e zonas de exclusão (ex: apoio do armário aéreo).
 */
export function computePerforationHoles(
  wMm: number,
  hMm: number,
  options?: {
    holeDiameterMm?: number;
    spacingMm?: number;
    exclusionZones?: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }>;
  }
): CutHole[] {
  const diameterMm = Math.max(15, Math.min(85, options?.holeDiameterMm ?? 40));
  const spacingMm = Math.max(diameterMm + 12, Math.min(180, options?.spacingMm ?? 85));

  // Margem mínima de segurança na borda da madeira
  const marginX = Math.min(45, Math.max(25, wMm * 0.10));
  const marginY = Math.min(45, Math.max(25, hMm * 0.10));

  const usableW = Math.max(20, wMm - 2 * marginX);
  const usableH = Math.max(20, hMm - 2 * marginY);

  const cols = Math.max(1, Math.round(usableW / spacingMm));
  const rows = Math.max(1, Math.round(usableH / spacingMm));

  const stepX = usableW / cols;
  const stepY = usableH / rows;

  const maxSafeRadius = Math.max(6, Math.min(stepX, stepY) * 0.45);
  const holeRadius = Math.min(diameterMm / 2, maxSafeRadius);

  const holes: CutHole[] = [];

  // Exclusões convertidas para mm relativas ao centro da peça
  const exclusions = options?.exclusionZones || [];

  for (let c = 0; c <= cols; c++) {
    const hx = marginX + c * stepX;
    // Centralizado relativo ao centro da peça
    const relX = (hx - wMm / 2) / 1000;

    for (let r = 0; r <= rows; r++) {
      const hy = marginY + r * stepY;
      const relY = (hy - hMm / 2) / 1000;

      // Verifica se o furo cai em zona proibida
      let isExcluded = false;
      for (const zone of exclusions) {
        if (
          relX >= zone.minX - 0.015 &&
          relX <= zone.maxX + 0.015 &&
          relY >= zone.minZ - 0.015 &&
          relY <= zone.maxZ + 0.015
        ) {
          isExcluded = true;
          break;
        }
      }

      if (!isExcluded) {
        holes.push({
          x: Math.round(hx),
          y: Math.round(hy),
          r: Math.round(holeRadius)
        });
      }
    }
  }

  return holes;
}

interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Algoritmo 2D Guillotine Bin Packing com Best-Fit e rotação 90°
 */
export function optimizeCuttingPlan(
  pieces: CutPieceInput[],
  materialKey: string,
  woodMaterial: string,
  thicknessMm: number,
  options?: CuttingOptimizerOptions
): CuttingResult {
  const sheetWidthMm = options?.sheetWidthMm ?? 2440;
  const sheetHeightMm = options?.sheetHeightMm ?? 1220;
  const kerfMm = options?.kerfMm ?? 3;
  const marginMm = options?.marginMm ?? 10;
  const allowRotation = options?.allowRotation ?? true;

  // 1. Descompacta peças e ordena por maior área e maior dimensão (Best-Fit Decreasing)
  const itemsToPack: CutPieceInput[] = [...pieces].sort((a, b) => {
    const areaA = a.lengthMm * a.widthMm;
    const areaB = b.lengthMm * b.widthMm;
    if (Math.abs(areaB - areaA) > 100) return areaB - areaA;
    return Math.max(b.lengthMm, b.widthMm) - Math.max(a.lengthMm, a.widthMm);
  });

  const sheets: SheetPlan[] = [];
  const unplaced: CutPieceInput[] = [];

  function createNewSheet(index: number): SheetPlan {
    return {
      sheetIndex: index,
      sheetWidthMm,
      sheetHeightMm,
      material: materialKey,
      woodMaterial,
      thicknessMm,
      marginMm,
      kerfMm,
      placedPieces: [],
      usedAreaM2: 0,
      totalAreaM2: (sheetWidthMm * sheetHeightMm) / 1_000_000,
      efficiencyPct: 0,
      wastePct: 100
    };
  }

  interface SheetState {
    plan: SheetPlan;
    freeRects: FreeRect[];
  }

  const sheetStates: SheetState[] = [];

  function addSheet(): SheetState {
    const plan = createNewSheet(sheetStates.length + 1);
    const freeRects: FreeRect[] = [
      {
        x: marginMm,
        y: marginMm,
        w: sheetWidthMm - 2 * marginMm,
        h: sheetHeightMm - 2 * marginMm
      }
    ];
    const state: SheetState = { plan, freeRects };
    sheetStates.push(state);
    return state;
  }

  if (itemsToPack.length > 0) {
    addSheet();
  }

  for (const item of itemsToPack) {
    let placed = false;

    // Dimensões candidatas: normal vs girada 90°
    const dim1 = { w: item.lengthMm, h: item.widthMm, rot: false };
    const dim2 = { w: item.widthMm, h: item.lengthMm, rot: true };
    const orientations = allowRotation && item.canRotate !== false ? [dim1, dim2] : [dim1];

    // Tenta alocar em uma das folhas existentes
    for (const state of sheetStates) {
      let bestRectIdx = -1;
      let bestOrientation: { w: number; h: number; rot: boolean } | null = null;
      let minLeftoverArea = Infinity;

      for (let rIdx = 0; rIdx < state.freeRects.length; rIdx++) {
        const rect = state.freeRects[rIdx];

        for (const orient of orientations) {
          if (orient.w <= rect.w && orient.h <= rect.h) {
            const leftover = rect.w * rect.h - orient.w * orient.h;
            if (leftover < minLeftoverArea) {
              minLeftoverArea = leftover;
              bestRectIdx = rIdx;
              bestOrientation = orient;
            }
          }
        }
      }

      if (bestRectIdx >= 0 && bestOrientation) {
        // Encontrou um local ótimo nesta folha!
        const targetRect = state.freeRects[bestRectIdx];
        state.freeRects.splice(bestRectIdx, 1);

        const pieceW = bestOrientation.w;
        const pieceH = bestOrientation.h;
        const px = targetRect.x;
        const py = targetRect.y;

        // Calcula furos se vazado
        const holes = item.isPerforated
          ? computePerforationHoles(pieceW, pieceH, {
              holeDiameterMm: item.holeDiameterMm,
              spacingMm: item.spacingMm,
              exclusionZones: item.exclusionZones
            })
          : undefined;

        const placedObj: PlacedPiece = {
          id: `p-${item.id}-${Math.random().toString(36).substring(2, 7)}`,
          pieceId: item.id,
          label: item.label,
          moduleName: item.moduleName,
          x: px,
          y: py,
          w: pieceW,
          h: pieceH,
          originalLength: item.lengthMm,
          originalWidth: item.widthMm,
          thicknessMm: item.thicknessMm,
          rotated: bestOrientation.rot,
          material: item.material,
          woodMaterial: item.woodMaterial || woodMaterial,
          isPerforated: item.isPerforated,
          holeDiameterMm: item.holeDiameterMm,
          spacingMm: item.spacingMm,
          exclusionZones: item.exclusionZones,
          holes,
          partType: item.partType
        };

        state.plan.placedPieces.push(placedObj);

        // Divisão Guilhotina do retângulo livre restante (Right e Bottom)
        const remW = targetRect.w - pieceW - kerfMm;
        const remH = targetRect.h - pieceH - kerfMm;

        if (remW > 15 && targetRect.h > 15) {
          state.freeRects.push({
            x: px + pieceW + kerfMm,
            y: py,
            w: remW,
            h: targetRect.h
          });
        }

        if (remH > 15 && pieceW > 15) {
          state.freeRects.push({
            x: px,
            y: py + pieceH + kerfMm,
            w: pieceW,
            h: remH
          });
        }

        placed = true;
        break;
      }
    }

    // Se não coube em nenhuma folha aberta, cria uma nova
    if (!placed) {
      const newState = addSheet();
      const rect = newState.freeRects[0];

      let pickedOrient: { w: number; h: number; rot: boolean } | null = null;
      for (const orient of orientations) {
        if (orient.w <= rect.w && orient.h <= rect.h) {
          pickedOrient = orient;
          break;
        }
      }

      if (pickedOrient) {
        newState.freeRects.shift();
        const pieceW = pickedOrient.w;
        const pieceH = pickedOrient.h;
        const px = rect.x;
        const py = rect.y;

        const holes = item.isPerforated
          ? computePerforationHoles(pieceW, pieceH, {
              holeDiameterMm: item.holeDiameterMm,
              spacingMm: item.spacingMm,
              exclusionZones: item.exclusionZones
            })
          : undefined;

        newState.plan.placedPieces.push({
          id: `p-${item.id}-${Math.random().toString(36).substring(2, 7)}`,
          pieceId: item.id,
          label: item.label,
          moduleName: item.moduleName,
          x: px,
          y: py,
          w: pieceW,
          h: pieceH,
          originalLength: item.lengthMm,
          originalWidth: item.widthMm,
          thicknessMm: item.thicknessMm,
          rotated: pickedOrient.rot,
          material: item.material,
          woodMaterial: item.woodMaterial || woodMaterial,
          isPerforated: item.isPerforated,
          holeDiameterMm: item.holeDiameterMm,
          spacingMm: item.spacingMm,
          exclusionZones: item.exclusionZones,
          holes,
          partType: item.partType
        });

        const remW = rect.w - pieceW - kerfMm;
        const remH = rect.h - pieceH - kerfMm;

        if (remW > 15 && rect.h > 15) {
          newState.freeRects.push({
            x: px + pieceW + kerfMm,
            y: py,
            w: remW,
            h: rect.h
          });
        }
        if (remH > 15 && pieceW > 15) {
          newState.freeRects.push({
            x: px,
            y: py + pieceH + kerfMm,
            w: pieceW,
            h: remH
          });
        }
      } else {
        // A peça é maior do que a própria chapa inteira!
        unplaced.push(item);
      }
    }
  }

  // Calcula estatísticas finais de cada folha
  let totalAreaUsed = 0;
  let totalPiecesCount = 0;

  for (const state of sheetStates) {
    const plan = state.plan;
    let sheetUsedM2 = 0;
    for (const p of plan.placedPieces) {
      sheetUsedM2 += (p.w * p.h) / 1_000_000;
    }
    plan.usedAreaM2 = Number(sheetUsedM2.toFixed(3));
    plan.efficiencyPct = Number(((sheetUsedM2 / plan.totalAreaM2) * 100).toFixed(1));
    plan.wastePct = Number((100 - plan.efficiencyPct).toFixed(1));

    totalAreaUsed += sheetUsedM2;
    totalPiecesCount += plan.placedPieces.length;
    sheets.push(plan);
  }

  const totalSheetsArea = sheets.length * ((sheetWidthMm * sheetHeightMm) / 1_000_000);
  const overallEfficiency = totalSheetsArea > 0 ? Number(((totalAreaUsed / totalSheetsArea) * 100).toFixed(1)) : 0;

  return {
    materialGroupKey: materialKey,
    materialName: `${woodMaterial} ${thicknessMm}mm`,
    woodMaterial,
    thicknessMm,
    sheets,
    unplacedPieces: unplaced,
    totalSheets: sheets.length,
    totalPiecesCount,
    totalAreaUsedM2: Number(totalAreaUsed.toFixed(3)),
    overallEfficiencyPct: overallEfficiency
  };
}

/**
 * Recalcula o aproveitamento de uma folha após modificação manual de posições
 */
export function recalculateSheetStats(sheet: SheetPlan): SheetPlan {
  let usedM2 = 0;
  for (const p of sheet.placedPieces) {
    usedM2 += (p.w * p.h) / 1_000_000;
  }
  const efficiency = Number(((usedM2 / sheet.totalAreaM2) * 100).toFixed(1));
  return {
    ...sheet,
    usedAreaM2: Number(usedM2.toFixed(3)),
    efficiencyPct: Math.min(100, efficiency),
    wastePct: Math.max(0, Number((100 - efficiency).toFixed(1)))
  };
}

/**
 * Validação de colisão e limites da chapa para arrasto manual
 */
export function checkPiecePlacement(
  piece: PlacedPiece,
  otherPieces: PlacedPiece[],
  sheetWidthMm: number,
  sheetHeightMm: number,
  marginMm: number,
  kerfMm: number
): { isValid: boolean; isOutOfBounds: boolean; isColliding: boolean; collidingWith?: string } {
  const isOutOfBounds =
    piece.x < marginMm ||
    piece.y < marginMm ||
    piece.x + piece.w > sheetWidthMm - marginMm ||
    piece.y + piece.h > sheetHeightMm - marginMm;

  let isColliding = false;
  let collidingWith: string | undefined;

  for (const other of otherPieces) {
    if (other.id === piece.id) continue;

    // Tolerância com serra (kerf)
    const overlapX = piece.x < other.x + other.w + kerfMm && piece.x + piece.w + kerfMm > other.x;
    const overlapY = piece.y < other.y + other.h + kerfMm && piece.y + piece.h + kerfMm > other.y;

    if (overlapX && overlapY) {
      isColliding = true;
      collidingWith = other.label;
      break;
    }
  }

  return {
    isValid: !isOutOfBounds && !isColliding,
    isOutOfBounds,
    isColliding,
    collidingWith
  };
}
