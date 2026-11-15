export type ElectronicComponentId = 'battery' | 'mppt' | 'b2b' | 'usina';

export type ElectronicMountFace = 'bottom' | 'rear_wall' | 'front_wall' | 'left_wall' | 'right_wall';

export type ElectronicGridPosition =
  | 'center'
  | 'top_left'
  | 'top_center'
  | 'top_right'
  | 'mid_left'
  | 'mid_center'
  | 'mid_right'
  | 'bottom_left'
  | 'bottom_center'
  | 'bottom_right'
  | 'front_left'
  | 'front_center'
  | 'front_right'
  | 'rear_left'
  | 'rear_center'
  | 'rear_right'
  | 'left_center'
  | 'right_center';

export interface InstalledElectronicItem {
  id: ElectronicComponentId;
  mountFace: ElectronicMountFace;
  position: ElectronicGridPosition;
  rotationDeg?: number; // 0 ou 90 graus
  customOffsetXmm?: number;
  customOffsetYmm?: number;
  customOffsetZmm?: number;
}

export interface ElectronicComponentMeta {
  id: ElectronicComponentId;
  name: string;
  shortName: string;
  category: string;
  icon: string;
  brand: string;
  model: string;
  voltage: string;
  capacity?: string;
  power?: string;
  current?: string;
  dimensionsMm: { width: number; height: number; depth: number }; // X, Y, Z
  weightKg: number;
  allowedFaces: ElectronicMountFace[];
  mountType: 'floor_only' | 'wall_screwable';
  description: string;
  features: string[];
}

export const ELECTRONIC_COMPONENTS_CATALOG: Record<ElectronicComponentId, ElectronicComponentMeta> = {
  battery: {
    id: 'battery',
    name: 'Bateria Kingbo LiFePO4 560Ah',
    shortName: 'Bateria 560Ah',
    category: 'Armazenamento LiFePO4',
    icon: '🔋',
    brand: 'Kingbo Power',
    model: 'LiFePO4 12V 560Ah c/ Smart BMS 4.3"',
    voltage: '12.8 Vdc (Bulk 14.4V / Float 13.8V)',
    capacity: '560 Ah (7.168 Wh)',
    power: '7.168 Wh (5.734 Wh úteis @ 80% DOD)',
    current: '200A Descarga Contínua (Inversor 2500W)',
    dimensionsMm: { width: 270, height: 240, depth: 520 },
    weightKg: 46.5,
    allowedFaces: ['bottom'], // Bateria obrigatoriamente na base
    mountType: 'floor_only',
    description: 'Bateria prismática pesada de alta capacidade. Por segurança física e centro de gravidade, deve sempre ser instalada na base do móvel.',
    features: [
      'JK Smart BMS 200A c/ Balanceamento Ativo 2A',
      'Display Digital Touchscreen 4.3" Integrado',
      'Células Prismáticas Grau A (≥9.000 ciclos)',
      'Conexão Bluetooth em tempo real'
    ]
  },
  mppt: {
    id: 'mppt',
    name: 'Controlador Solar Kingbo MPPT 60A',
    shortName: 'MPPT 60A',
    category: 'Gerenciamento Solar',
    icon: '⚡',
    brand: 'Kingbo Power',
    model: 'MPPT 60A 230Vdc FV',
    voltage: '12V/24V Auto (Tensão FV máx: 230Vdc)',
    current: '60A de Carga Contínua',
    power: 'Até 800W em 12V / 1600W em 24V',
    dimensionsMm: { width: 202, height: 215, depth: 100 },
    weightKg: 3.2,
    allowedFaces: ['rear_wall', 'front_wall', 'left_wall', 'right_wall', 'bottom'],
    mountType: 'wall_screwable',
    description: 'Controlador MPPT com dissipador de calor e aletas em alumínio fundido. Fixação por parafusos na parede do móvel para excelente ventilação ou no piso.',
    features: [
      'Rastreamento MPPT com eficiência 99.5%',
      'Display LCD com parâmetros solares em tempo real',
      'Dissipador aletado de alta performance',
      'Abas de fixação para parafusamento em compensado'
    ]
  },
  b2b: {
    id: 'b2b',
    name: 'Carregador DC-DC B2B 12V 30A',
    shortName: 'DC-DC B2B 30A',
    category: 'Carga via Alternador',
    icon: '🔄',
    brand: 'Renogy / Victron Type',
    model: 'B2B 12V-12V 30A com Bluetooth',
    voltage: '12V Entrada (Alternador Doblò) ➔ 14.4V Saída LiFePO4',
    current: '30A Corrente Contínua',
    power: '~420W Injetados com motor ligado',
    dimensionsMm: { width: 190, height: 130, depth: 58 },
    weightKg: 1.8,
    allowedFaces: ['rear_wall', 'front_wall', 'left_wall', 'right_wall', 'bottom'],
    mountType: 'wall_screwable',
    description: 'Carregador inteligente que recupera a bateria LiFePO4 através do alternador do carro em viagens e deslocamentos. Parafusado nas paredes do baú.',
    features: [
      'Isolamento galvânico e proteção do alternador',
      'Sensor de ignição D+ automático',
      'LEDs e telemetria Bluetooth integrada',
      'Flanges metálicas de parafusamento'
    ]
  },
  usina: {
    id: 'usina',
    name: 'Fonte Carregadora Usina Smart Connect 120A',
    shortName: 'Usina 120A',
    category: 'Rede Elétrica Externa',
    icon: '🔌',
    brand: 'Spark Usina',
    model: 'Smart Connect 120A Bivolt',
    voltage: '110V/220V AC ➔ 12.5V-14.4V DC',
    current: '120A Ajustável',
    power: '1700W Potência em Rede Externa',
    dimensionsMm: { width: 320, height: 88, depth: 180 },
    weightKg: 2.6,
    allowedFaces: ['rear_wall', 'front_wall', 'left_wall', 'right_wall', 'bottom'],
    mountType: 'wall_screwable',
    description: 'Fonte chaveada de alta potência para conexão em campings ou tomadas residenciais (Shore Power). Parafusável no compensado naval.',
    features: [
      'Microcontrolador Smart Connect ativo',
      'Ventilação forçada inteligente termo-controlada',
      'Display voltímetro e amperímetro digital integrado',
      'Abas de fixação reforçadas'
    ]
  }
};
