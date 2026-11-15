export type ElectricalPortPolarity =
  | 'pos'
  | 'neg'
  | 'ac_phase'
  | 'ac_neutral'
  | 'ac_ground'
  | 'signal';

export type ElectricalPortSide = 'left' | 'right' | 'top' | 'bottom';
export type ElectricalPortDirection = 'in' | 'out' | 'bidirectional';

export interface ElectricalPort {
  id: string;
  label: string;
  polarity: ElectricalPortPolarity;
  side: ElectricalPortSide;
  direction: ElectricalPortDirection;
  fuseAmps?: number;
  isManualFuse?: boolean;
  maxAmps?: number;
  wayIndex?: number;
}

export type ElectricalNodeCategory =
  | 'system_fixed'
  | 'consumption_load'
  | 'distribution_protection'
  | 'custom';

export type ElectricalNodeTypeKind =
  | 'generic'
  | 'fuse_box'
  | 'busbar'
  | 'breaker'
  | 'transfer_switch';

export interface ElectricalNodeData {
  catalogId: string;
  applianceId?: string;
  systemKey?:
  | 'solar_panels'
  | 'mppt'
  | 'battery'
  | 'alternator'
  | 'b2b'
  | 'usina'
  | 'led_system';
  label: string;
  subtitle?: string;
  category: ElectricalNodeCategory;
  kind: ElectricalNodeTypeKind;
  icon: string;
  voltage: number;
  watts: number;
  amps: number;
  ports: ElectricalPort[];
  fuseWayCount?: number;
  busbarPolarity?: ElectricalPortPolarity;
  busbarTermCount?: number;
  breakerAmps?: number;
  breakerPoles?: 1 | 2;
  isEnabled?: boolean;
  isSource?: boolean;
  notes?: string;
  [key: string]: unknown;
}

export interface ElectricalEdgeData {
  polarity: ElectricalPortPolarity;
  color: string;
  lengthMeters: number;
  currentAmps: number;
  voltage: number;
  suggestedGaugeMm2: number;
  gaugeMm2: number;
  isManualGauge?: boolean;
  isManualAmps?: boolean;
  suggestedProtectionAmps: number;
  voltageDropVolts: number;
  voltageDropPercent: number;
  isOverloaded: boolean;
  overloadWarning?: string;
  customLabel?: string;
  [key: string]: unknown;
}

export type ElectricalEdgeStyle = 'smoothstep' | 'default' | 'straight';

export interface PolarityMeta {
  id: ElectricalPortPolarity;
  label: string;
  shortLabel: string;
  color: string;
  handleBorder: string;
}

export const POLARITY_META: Record<ElectricalPortPolarity, PolarityMeta> = {
  pos: {
    id: 'pos',
    label: 'Positivo (+ DC)',
    shortLabel: '+',
    color: '#ef4444',
    handleBorder: '#fca5a5'
  },
  neg: {
    id: 'neg',
    label: 'Negativo (- DC)',
    shortLabel: '-',
    color: '#1e293b',
    handleBorder: '#94a3b8'
  },
  ac_phase: {
    id: 'ac_phase',
    label: 'Fase AC (110/220V)',
    shortLabel: 'F',
    color: '#f97316',
    handleBorder: '#fdba74'
  },
  ac_neutral: {
    id: 'ac_neutral',
    label: 'Neutro AC',
    shortLabel: 'N',
    color: '#3b82f6',
    handleBorder: '#93c5fd'
  },
  ac_ground: {
    id: 'ac_ground',
    label: 'Terra (PE)',
    shortLabel: 'T',
    color: '#22c55e',
    handleBorder: '#86efac'
  },
  signal: {
    id: 'signal',
    label: 'Sinal / Ignição (D+)',
    shortLabel: 'S',
    color: '#eab308',
    handleBorder: '#fef08a'
  }
};

export interface FuseRatingSpec {
  amps: number;
  colorName: string;
  hex: string;
  textColor: string;
}

export const FUSE_COLOR_TABLE: FuseRatingSpec[] = [
  { amps: 5, colorName: 'Marrom', hex: '#92400e', textColor: '#fef3c7' },
  { amps: 10, colorName: 'Vermelho', hex: '#dc2626', textColor: '#ffffff' },
  { amps: 15, colorName: 'Azul', hex: '#2563eb', textColor: '#ffffff' },
  { amps: 20, colorName: 'Amarelo', hex: '#eab308', textColor: '#0f172a' },
  { amps: 25, colorName: 'Verde Claro', hex: '#84cc16', textColor: '#0f172a' },
  { amps: 30, colorName: 'Verde', hex: '#16a34a', textColor: '#ffffff' },
  { amps: 35, colorName: 'Rosa', hex: '#ec4899', textColor: '#ffffff' },
  { amps: 40, colorName: 'Vermelho Escuro', hex: '#7f1d1d', textColor: '#fecaca' }
];

export function getFuseColorSpec(amps: number): FuseRatingSpec {
  const exact = FUSE_COLOR_TABLE.find((f) => f.amps === amps);
  if (exact) return exact;
  const closest = FUSE_COLOR_TABLE.reduce((prev, curr) =>
    Math.abs(curr.amps - amps) < Math.abs(prev.amps - amps) ? curr : prev
  );
  return closest;
}

/**
 * Sugere o fusível lâmina comercial (5A a 40A) com folga de segurança de 25% para a corrente da via.
 */
export function suggestBladeFuseAmps(currentAmps: number): number {
  const target = Math.max(currentAmps, 0.1) * 1.25;
  for (const spec of FUSE_COLOR_TABLE) {
    if (spec.amps >= target) return spec.amps;
  }
  return FUSE_COLOR_TABLE[FUSE_COLOR_TABLE.length - 1].amps;
}

export interface ElectricalCatalogTemplate {
  catalogId: string;
  label: string;
  subtitle: string;
  category: ElectricalNodeCategory;
  kind: ElectricalNodeTypeKind;
  icon: string;
  voltage: number;
  watts: number;
  amps: number;
  isSource?: boolean;
  fuseWayCount?: number;
  busbarPolarity?: ElectricalPortPolarity;
  busbarTermCount?: number;
  breakerAmps?: number;
  breakerPoles?: 1 | 2;
  ports: ElectricalPort[];
}
