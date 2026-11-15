import { CutHole, PlacedPiece, SheetPlan } from './cuttingOptimizerTypes';

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
