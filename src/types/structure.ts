export type StackLevels = 1 | 2;

export type SlideDirection = 'longitudinal' | 'lateral' | 'fixed' | 'rear_only' | 'front_only';

export type PanelOrientation = 'longitudinal' | 'transverse';

export type StructureMaterial = 'aluminum' | 'aluminum_tube' | 'steel';

export type SteelProfileUnit = 'mm' | 'inch';

export function getMetalonGauge(thicknessMm: number): string {
  if (thicknessMm <= 1.05) return '#20 (0.9mm)';
  if (thicknessMm <= 1.35) return '#18 (1.2mm)';
  if (thicknessMm <= 1.75) return '#16 (1.5mm)';
  if (thicknessMm <= 2.10) return '#14 (2.0mm)';
  if (thicknessMm <= 2.45) return '#13 (2.25mm)';
  if (thicknessMm <= 2.85) return '#12 (2.65mm)';
  return '#1/8" (3.0mm)';
}

export function getSteelProfileSpec(size: 30 | 40, unit: SteelProfileUnit = 'mm', thicknessMm?: number): string {
  const tStr = thicknessMm ? ` × ${thicknessMm.toFixed(1)}mm` : '';
  if (unit === 'inch') {
    const gauge = thicknessMm ? ` (${getMetalonGauge(thicknessMm)})` : '';
    return size === 40 ? `Metalon 1 ½" × 1 ½"${tStr}${gauge}` : `Metalon 1 ¼" × 1 ¼"${tStr}${gauge}`;
  }
  return size === 40 ? `Metalon 40×40${tStr}` : `Metalon 30×30${tStr}`;
}

export type AluminumColor = 'silver' | 'black';

export type MetalonColor = string;

export interface MetalonColorPreset {
  label: string;
  name: string;
  color: string;
}

export const METALON_COLOR_PRESETS: MetalonColorPreset[] = [
  { label: 'Preto', name: 'Preto Epóxi Fosco', color: '#1a1d20' },
  { label: 'Grafite', name: 'Grafite / Aço Natural', color: '#333b47' },
  { label: 'Cinza', name: 'Cinza Platina', color: '#64748b' },
  { label: 'Branco', name: 'Branco Epóxi', color: '#f8fafc' }
];

export function getMetalonColorLabel(color?: string): string {
  if (!color) return 'Grafite / Aço Natural';
  const found = METALON_COLOR_PRESETS.find(p => p.color.toLowerCase() === color.toLowerCase());
  return found ? found.name : color.toUpperCase();
}

export type ViewMode = 'internal_boxes' | 'assembled' | 'bars_lineup' | 'electrical_planar' | 'hydraulic_planar';
export type PartsGroupFilter = 'all' | 'metal' | 'wood' | 'upholstery' | 'pvc' | 'cutting';

export interface BarMeasurementData {
  name: string;
  category?: string;
  barLength?: number;
  barWidth?: number;
  barProfile?: string;
  cutAngle?: string;
  material?: string;
  quantity?: number;
  purpose?: string;
  level?: string;
  isMetalonCap?: boolean;
  capProfileSize?: 30 | 40;
  isElectrical?: boolean;
  electricalType?: 'battery' | 'mppt' | 'b2b' | 'usina' | 'water' | 'panel';
  isAppliance?: boolean;
  applianceType?: 'stove' | 'fridge' | 'portapotti';
  weightText?: string;
  voltage?: string;
  capacity?: string;
  current?: string;
  power?: string;
  efficiency?: string;
  statusText?: string;
  features?: string[];
}
