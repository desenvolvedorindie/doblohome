import { CutPieceInput, PlacedPiece, SheetPlan, CuttingResult } from '../../utils/cuttingOptimizer';

export type SheetStandard = 'plywood_2440' | 'mdf_2750' | 'custom';

export interface WoodCutGroupInput {
  key: string;
  label: string;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  qty: number;
  material: string;
  woodMaterial?: string;
  isPerforated?: boolean;
  holeDiameterMm?: number;
  spacingMm?: number;
  exclusionZones?: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }>;
  moduleName?: string;
  partType?: string;
}

export interface CuttingPlanPanelProps {
  woodCutGroups: WoodCutGroupInput[];
  selectedPieceKey?: string | null;
  onSelectPiece?: (pieceKey: string | null) => void;
  activeGroupKey?: string;
  onSelectGroupKey?: (key: string) => void;
}

export interface MaterialGroup {
  key: string;
  woodMaterial: string;
  thicknessMm: number;
  pieces: CutPieceInput[];
  totalPieces: number;
}
