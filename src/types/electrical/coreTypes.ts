export type ElectricalPortPolarity =
  | 'pos'
  | 'neg'
  | 'ac_phase'
  | 'ac_neutral'
  | 'ac_ground'
  | 'signal';

export type ElectricalPortSide = 'left' | 'right' | 'top' | 'bottom';
export type ElectricalPortDirection = 'in' | 'out' | 'bidirectional';

export type ElectricalConnectorType =
  | 'ring_m8'
  | 'ring_m6'
  | 'ring_m5'
  | 'spade'
  | 'faston'
  | 'ferrule'
  | 'mc4'
  | 'wago'
  | 'anderson'
  | 'xt60'
  | 'bare'
  | 'none';

export interface ConnectorMeta {
  id: ElectricalConnectorType;
  label: string;
  shortLabel: string;
  description: string;
  usesGauge: boolean;
}

export const CONNECTOR_META: Record<ElectricalConnectorType, ConnectorMeta> = {
  ring_m8: {
    id: 'ring_m8',
    label: 'Terminal Olhal M8',
    shortLabel: 'Olhal M8',
    description: 'Bateria, Shunt, Inversor e Barramentos 250A',
    usesGauge: true
  },
  ring_m6: {
    id: 'ring_m6',
    label: 'Terminal Olhal M6',
    shortLabel: 'Olhal M6',
    description: 'Barramentos e Entrada Geral da Caixa de Fusíveis',
    usesGauge: true
  },
  ring_m5: {
    id: 'ring_m5',
    label: 'Terminal Olhal M4/M5',
    shortLabel: 'Olhal M4/M5',
    description: 'Parafusos menores, relés e sensores',
    usesGauge: true
  },
  spade: {
    id: 'spade',
    label: 'Terminal Forquilha (Garfo)',
    shortLabel: 'Forquilha',
    description: 'Vias da Caixa de Fusíveis e bornes de parafuso',
    usesGauge: true
  },
  faston: {
    id: 'faston',
    label: 'Terminal Faston 6.3mm',
    shortLabel: 'Faston',
    description: 'Interruptores, botões 12V e painéis USB',
    usesGauge: true
  },
  ferrule: {
    id: 'ferrule',
    label: 'Terminal Tubular (Ilhós)',
    shortLabel: 'Ilhós',
    description: 'Disjuntores DIN, MPPT, B2B, Usina e bornes a parafuso',
    usesGauge: true
  },
  mc4: {
    id: 'mc4',
    label: 'Conector Solar MC4',
    shortLabel: 'MC4',
    description: 'Placas solares e divisores MC4',
    usesGauge: false
  },
  wago: {
    id: 'wago',
    label: 'Conector Wago (Alavanca)',
    shortLabel: 'Wago',
    description: 'Emendas rápidas 12V/220V sem crimpagem',
    usesGauge: false
  },
  anderson: {
    id: 'anderson',
    label: 'Conector Anderson (SB50/120)',
    shortLabel: 'Anderson',
    description: 'Engate rápido DC de alta corrente',
    usesGauge: false
  },
  xt60: {
    id: 'xt60',
    label: 'Conector XT60 / XT90',
    shortLabel: 'XT60',
    description: 'Engate rápido DC de média corrente',
    usesGauge: false
  },
  bare: {
    id: 'bare',
    label: 'Fio Estanhado / Direto',
    shortLabel: 'Direto',
    description: 'Ligação direta no borne sem terminal',
    usesGauge: false
  },
  none: {
    id: 'none',
    label: 'Nenhum',
    shortLabel: 'Nenhum',
    description: 'Sem conector nesta ponta',
    usesGauge: false
  }
};

export interface ElectricalPort {
  id: string;
  label: string;
  polarity: ElectricalPortPolarity;
  side: ElectricalPortSide;
  direction: ElectricalPortDirection;
  connectorType?: ElectricalConnectorType;
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
  | 'transfer_switch'
  | 'connector';

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
  connectorType?: ElectricalConnectorType;
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
  sourceConnector?: ElectricalConnectorType;
  targetConnector?: ElectricalConnectorType;
  isManualSourceConnector?: boolean;
  isManualTargetConnector?: boolean;
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
  connectorType?: ElectricalConnectorType;
  ports: ElectricalPort[];
}
