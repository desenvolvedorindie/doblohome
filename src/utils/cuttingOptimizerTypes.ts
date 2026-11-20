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
  isUpholstery?: boolean;
  hasCabinetCutout?: boolean;
  cutOutlineNorm?: Array<{ u: number; v: number }>;
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
  isUpholstery?: boolean;
  hasCabinetCutout?: boolean;
  cutOutlineNorm?: Array<{ u: number; v: number }>;
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
