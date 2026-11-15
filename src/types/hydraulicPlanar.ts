export type HydraulicFluidType =
  | 'cold'
  | 'hot'
  | 'gray_drain'
  | 'vent'
  | 'control';

export type HydraulicPipeMaterial =
  | 'pu_pushfit'
  | 'braided_hose'
  | 'pex'
  | 'pvc'
  | 'corrugated_drain';

export type HydraulicPortSide = 'left' | 'right' | 'top' | 'bottom';
export type HydraulicPortDirection = 'in' | 'out' | 'bidirectional';

export interface HydraulicPort {
  id: string;
  label: string;
  fluidType: HydraulicFluidType;
  side: HydraulicPortSide;
  direction: HydraulicPortDirection;
  connectionSpec?: string;
}

export type HydraulicNodeCategory =
  | 'system_fixed'
  | 'water_points'
  | 'valves_fittings'
  | 'custom';

export type HydraulicNodeKind =
  | 'generic'
  | 'tank'
  | 'pump'
  | 'tee_fitting'
  | 'selector_valve'
  | 'mixing_valve'
  | 'heat_exchanger';

export interface HydraulicNodeData {
  catalogId: string;
  systemKey?:
    | 'water_tank_u'
    | 'internal_clean_tank'
    | 'gray_tank'
    | 'seaflo_pump'
    | 'porta_potti';
  label: string;
  subtitle?: string;
  category: HydraulicNodeCategory;
  kind: HydraulicNodeKind;
  icon: string;
  flowLpm: number;
  pressurePsi: number;
  capacityLiters: number;
  defaultDiameterMm: number;
  ports: HydraulicPort[];
  isSource?: boolean;
  isDrain?: boolean;
  isEnabled?: boolean;
  notes?: string;
  [key: string]: unknown;
}

export interface HydraulicEdgeData {
  fluidType: HydraulicFluidType;
  color: string;
  material: HydraulicPipeMaterial;
  lengthMeters: number;
  flowLpm: number;
  pressurePsi: number;
  suggestedDiameterMm: number;
  diameterMm: number;
  isManualDiameter?: boolean;
  isManualFlow?: boolean;
  velocityMs: number;
  headLossPsi: number;
  isOverloaded: boolean;
  warning?: string;
  customLabel?: string;
  [key: string]: unknown;
}

export type HydraulicEdgeStyle = 'smoothstep' | 'default' | 'straight';

export interface FluidMeta {
  id: HydraulicFluidType;
  label: string;
  shortLabel: string;
  color: string;
  handleBorder: string;
  defaultDiameterMm: number;
  defaultMaterial: HydraulicPipeMaterial;
}

export const FLUID_META: Record<HydraulicFluidType, FluidMeta> = {
  cold: {
    id: 'cold',
    label: 'Água Fria / Potável',
    shortLabel: 'Fria',
    color: '#2563eb',
    handleBorder: '#93c5fd',
    defaultDiameterMm: 12,
    defaultMaterial: 'pu_pushfit'
  },
  hot: {
    id: 'hot',
    label: 'Água Quente / Mista',
    shortLabel: 'Quente',
    color: '#dc2626',
    handleBorder: '#fca5a5',
    defaultDiameterMm: 12,
    defaultMaterial: 'pex'
  },
  gray_drain: {
    id: 'gray_drain',
    label: 'Esgoto / Água Cinza',
    shortLabel: 'Esgoto',
    color: '#94a3b8',
    handleBorder: '#e2e8f0',
    defaultDiameterMm: 25,
    defaultMaterial: 'corrugated_drain'
  },
  vent: {
    id: 'vent',
    label: 'Ladrão / Respiro',
    shortLabel: 'Respiro',
    color: '#38bdf8',
    handleBorder: '#bae6fd',
    defaultDiameterMm: 10,
    defaultMaterial: 'pu_pushfit'
  },
  control: {
    id: 'control',
    label: 'Acionamento / Vínculo',
    shortLabel: 'Sinal',
    color: '#eab308',
    handleBorder: '#fef08a',
    defaultDiameterMm: 8,
    defaultMaterial: 'pu_pushfit'
  }
};

export interface PipeMaterialMeta {
  id: HydraulicPipeMaterial;
  label: string;
  shortLabel: string;
}

export const PIPE_MATERIAL_META: Record<HydraulicPipeMaterial, PipeMaterialMeta> = {
  pu_pushfit: {
    id: 'pu_pushfit',
    label: 'Mangueira PU / PEAD Engate Rápido',
    shortLabel: 'PU Engate'
  },
  braided_hose: {
    id: 'braided_hose',
    label: 'Mangueira Trançada Atóxica',
    shortLabel: 'Trançada'
  },
  pex: {
    id: 'pex',
    label: 'Tubo PEX (Água Quente/Fria)',
    shortLabel: 'PEX'
  },
  pvc: {
    id: 'pvc',
    label: 'Tubo PVC Soldável',
    shortLabel: 'PVC'
  },
  corrugated_drain: {
    id: 'corrugated_drain',
    label: 'Mangueira Corrugada de Esgoto',
    shortLabel: 'Corrugada'
  }
};

export interface HydraulicCatalogTemplate {
  catalogId: string;
  label: string;
  subtitle: string;
  category: HydraulicNodeCategory;
  kind: HydraulicNodeKind;
  icon: string;
  flowLpm: number;
  pressurePsi: number;
  capacityLiters: number;
  defaultDiameterMm: number;
  isSource?: boolean;
  isDrain?: boolean;
  ports: HydraulicPort[];
}

export const HYDRAULIC_WATER_POINTS_CATALOG: HydraulicCatalogTemplate[] = [
  {
    catalogId: 'wp_external_tap',
    label: 'Entrada Água Externa / Rua',
    subtitle: 'Torneira de Camping / Abastecimento',
    category: 'water_points',
    kind: 'generic',
    icon: '🚰',
    flowLpm: 12.0,
    pressurePsi: 40,
    capacityLiters: 0,
    defaultDiameterMm: 12,
    isSource: true,
    ports: [
      { id: 'out_cold', label: 'Saída Rede', fluidType: 'cold', side: 'right', direction: 'out', connectionSpec: '1/2"' }
    ]
  },
  {
    catalogId: 'wp_fill_port',
    label: 'Bocal Abastecimento + Respiro',
    subtitle: 'Bocal Externo c/ Trava e Suspiro',
    category: 'water_points',
    kind: 'generic',
    icon: '⛽',
    flowLpm: 15.0,
    pressurePsi: 10,
    capacityLiters: 0,
    defaultDiameterMm: 20,
    isSource: true,
    ports: [
      { id: 'out_fill', label: 'Abastece Tanque', fluidType: 'cold', side: 'right', direction: 'out', connectionSpec: '3/4"' },
      { id: 'in_vent', label: 'Retorno Respiro', fluidType: 'vent', side: 'bottom', direction: 'in', connectionSpec: '10mm' }
    ]
  },
  {
    catalogId: 'wp_sink_faucet',
    label: 'Torneira da Pia (Cozinha)',
    subtitle: 'Monocomando / Bica Móvel 1/2"',
    category: 'water_points',
    kind: 'generic',
    icon: '🚿',
    flowLpm: 6.0,
    pressurePsi: 35,
    capacityLiters: 0,
    defaultDiameterMm: 12,
    ports: [
      { id: 'in_water', label: 'Entrada Água', fluidType: 'hot', side: 'bottom', direction: 'in', connectionSpec: '1/2"' },
      { id: 'in_cold_opt', label: 'Fria (se mixer)', fluidType: 'cold', side: 'left', direction: 'in', connectionSpec: '1/2"' },
      { id: 'ctrl_sink', label: 'Despeja na Cuba', fluidType: 'control', side: 'bottom', direction: 'out' }
    ]
  },
  {
    catalogId: 'wp_sink_basin',
    label: 'Cuba / Pia Inox',
    subtitle: 'Válvula 3 1/2" + Sifão Esgoto',
    category: 'water_points',
    kind: 'generic',
    icon: '🍽️',
    flowLpm: 6.0,
    pressurePsi: 0,
    capacityLiters: 0,
    defaultDiameterMm: 25,
    isDrain: true,
    ports: [
      { id: 'ctrl_in', label: 'Torneira', fluidType: 'control', side: 'top', direction: 'in' },
      { id: 'out_drain', label: 'Saída Esgoto', fluidType: 'gray_drain', side: 'right', direction: 'out', connectionSpec: '1"' }
    ]
  },
  {
    catalogId: 'wp_shower',
    label: 'Ducha / Chuveirinho',
    subtitle: 'Ducha Interna / Externa c/ Gatilho',
    category: 'water_points',
    kind: 'generic',
    icon: '🚿',
    flowLpm: 7.5,
    pressurePsi: 35,
    capacityLiters: 0,
    defaultDiameterMm: 12,
    ports: [
      { id: 'in_water', label: 'Entrada Mista', fluidType: 'hot', side: 'left', direction: 'in', connectionSpec: '1/2"' }
    ]
  }
];

export const HYDRAULIC_VALVES_FITTINGS_CATALOG: HydraulicCatalogTemplate[] = [
  {
    catalogId: 'vf_tee',
    label: 'Conexão T (3 Vias)',
    subtitle: 'Engate Rápido / Espigão 12mm',
    category: 'valves_fittings',
    kind: 'tee_fitting',
    icon: '🔀',
    flowLpm: 0,
    pressurePsi: 0,
    capacityLiters: 0,
    defaultDiameterMm: 12,
    ports: [
      { id: 'p_1', label: 'Via 1', fluidType: 'cold', side: 'left', direction: 'bidirectional' },
      { id: 'p_2', label: 'Via 2', fluidType: 'cold', side: 'right', direction: 'bidirectional' },
      { id: 'p_3', label: 'Derivação', fluidType: 'cold', side: 'bottom', direction: 'bidirectional' }
    ]
  },
  {
    catalogId: 'vf_y_splitter',
    label: 'Divisor Y (3 Vias)',
    subtitle: 'Derivação Suave de Fluxo',
    category: 'valves_fittings',
    kind: 'tee_fitting',
    icon: '🌿',
    flowLpm: 0,
    pressurePsi: 0,
    capacityLiters: 0,
    defaultDiameterMm: 12,
    ports: [
      { id: 'p_1', label: 'Entrada', fluidType: 'cold', side: 'left', direction: 'in' },
      { id: 'p_2', label: 'Saída A', fluidType: 'cold', side: 'right', direction: 'out' },
      { id: 'p_3', label: 'Saída B', fluidType: 'cold', side: 'bottom', direction: 'out' }
    ]
  },
  {
    catalogId: 'vf_elbow_90',
    label: 'Joelho 90°',
    subtitle: 'Cotovelo Engate Rápido / Rosca',
    category: 'valves_fittings',
    kind: 'generic',
    icon: '↩️',
    flowLpm: 0,
    pressurePsi: 0,
    capacityLiters: 0,
    defaultDiameterMm: 12,
    ports: [
      { id: 'in_p', label: 'Entrada', fluidType: 'cold', side: 'left', direction: 'in' },
      { id: 'out_p', label: 'Saída 90°', fluidType: 'cold', side: 'bottom', direction: 'out' }
    ]
  },
  {
    catalogId: 'vf_ball_valve',
    label: 'Registro de Esfera',
    subtitle: 'Válvula Abre / Fecha 1/2"',
    category: 'valves_fittings',
    kind: 'generic',
    icon: '🔧',
    flowLpm: 0,
    pressurePsi: 0,
    capacityLiters: 0,
    defaultDiameterMm: 12,
    ports: [
      { id: 'in_p', label: 'Entrada', fluidType: 'cold', side: 'left', direction: 'in' },
      { id: 'out_p', label: 'Saída', fluidType: 'cold', side: 'right', direction: 'out' }
    ]
  },
  {
    catalogId: 'vf_check_valve',
    label: 'Válvula de Retenção Inox',
    subtitle: 'Unidirecional Anti-Retorno',
    category: 'valves_fittings',
    kind: 'generic',
    icon: '➡️',
    flowLpm: 0,
    pressurePsi: 0,
    capacityLiters: 0,
    defaultDiameterMm: 12,
    ports: [
      { id: 'in_p', label: 'Fluxo IN', fluidType: 'cold', side: 'left', direction: 'in' },
      { id: 'out_p', label: 'Fluxo OUT', fluidType: 'cold', side: 'right', direction: 'out' }
    ]
  },
  {
    catalogId: 'vf_selector_3way',
    label: 'Válvula Seletora 3 Vias',
    subtitle: 'Desviadora (Tanque / Rua / Direto)',
    category: 'valves_fittings',
    kind: 'selector_valve',
    icon: '🎛️',
    flowLpm: 0,
    pressurePsi: 0,
    capacityLiters: 0,
    defaultDiameterMm: 12,
    ports: [
      { id: 'in_a', label: 'Entrada A', fluidType: 'cold', side: 'left', direction: 'in' },
      { id: 'in_b', label: 'Entrada B', fluidType: 'cold', side: 'top', direction: 'in' },
      { id: 'out_c', label: 'Comum OUT', fluidType: 'cold', side: 'right', direction: 'out' }
    ]
  },
  {
    catalogId: 'vf_mixing_valve',
    label: 'Válvula Misturadora Termostática',
    subtitle: 'Fria + Quente ➔ Mista Regulada',
    category: 'valves_fittings',
    kind: 'mixing_valve',
    icon: '🌡️',
    flowLpm: 0,
    pressurePsi: 40,
    capacityLiters: 0,
    defaultDiameterMm: 12,
    ports: [
      { id: 'in_cold', label: 'Fria (C)', fluidType: 'cold', side: 'top', direction: 'in' },
      { id: 'in_hot', label: 'Quente (H)', fluidType: 'hot', side: 'bottom', direction: 'in' },
      { id: 'out_mix', label: 'Mista (M)', fluidType: 'hot', side: 'right', direction: 'out' }
    ]
  },
  {
    catalogId: 'vf_heat_exchanger',
    label: 'Chiller — Trocador de Calor de Placas',
    subtitle: 'Wort Plate Chiller Inox/Cobre + Espigões (4 Vias)',
    category: 'valves_fittings',
    kind: 'heat_exchanger',
    icon: '♨️',
    flowLpm: 0,
    pressurePsi: 45,
    capacityLiters: 0,
    defaultDiameterMm: 12,
    ports: [
      { id: 'wort_in', label: 'Wort In (Inox)', fluidType: 'hot', side: 'top', direction: 'in', connectionSpec: '1/2" Engate Inox' },
      { id: 'water_out', label: 'Water Out (Latão)', fluidType: 'hot', side: 'top', direction: 'out', connectionSpec: '1/2" Espigão' },
      { id: 'wort_out', label: 'Wort Out (Inox)', fluidType: 'hot', side: 'bottom', direction: 'out', connectionSpec: '1/2" Engate Inox' },
      { id: 'water_in', label: 'Water In (Latão)', fluidType: 'cold', side: 'bottom', direction: 'in', connectionSpec: '3/4" Rosca' }
    ]
  },
  {
    catalogId: 'vf_pressure_relief',
    label: 'Válvula de Alívio / Dreno',
    subtitle: 'Segurança Pressão / Esvaziamento Latão',
    category: 'valves_fittings',
    kind: 'generic',
    icon: '🛡️',
    flowLpm: 0,
    pressurePsi: 60,
    capacityLiters: 0,
    defaultDiameterMm: 12,
    ports: [
      { id: 'in_p', label: 'Linha IN', fluidType: 'hot', side: 'left', direction: 'in' },
      { id: 'out_p', label: 'Alívio / Dreno', fluidType: 'hot', side: 'right', direction: 'out' }
    ]
  },
  {
    catalogId: 'vf_water_filter',
    label: 'Filtro de Água / Pré-Filtro',
    subtitle: 'Carvão Ativado / Tela Inox Bomba',
    category: 'valves_fittings',
    kind: 'generic',
    icon: '🧪',
    flowLpm: 0,
    pressurePsi: 40,
    capacityLiters: 0,
    defaultDiameterMm: 12,
    ports: [
      { id: 'in_p', label: 'Entrada', fluidType: 'cold', side: 'left', direction: 'in' },
      { id: 'out_p', label: 'Filtrada', fluidType: 'cold', side: 'right', direction: 'out' }
    ]
  },
  {
    catalogId: 'vf_accumulator',
    label: 'Tanque Acumulador de Pressão',
    subtitle: '0.75L Pré-pressurizado (Anti-Golpe)',
    category: 'valves_fittings',
    kind: 'generic',
    icon: '🧯',
    flowLpm: 0,
    pressurePsi: 45,
    capacityLiters: 0.75,
    defaultDiameterMm: 12,
    ports: [
      { id: 'in_p', label: 'Entrada', fluidType: 'hot', side: 'left', direction: 'in' },
      { id: 'out_p', label: 'Saída Estável', fluidType: 'hot', side: 'right', direction: 'out' }
    ]
  },
  {
    catalogId: 'vf_pump_switch',
    label: 'Interruptor / Botão da Bomba',
    subtitle: 'Acionamento 12V Liga/Desliga',
    category: 'valves_fittings',
    kind: 'generic',
    icon: '🔘',
    flowLpm: 0,
    pressurePsi: 0,
    capacityLiters: 0,
    defaultDiameterMm: 8,
    ports: [
      { id: 'ctrl_out', label: 'Aciona Bomba', fluidType: 'control', side: 'top', direction: 'out' }
    ]
  }
];
