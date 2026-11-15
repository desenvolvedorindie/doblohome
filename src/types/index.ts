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

export type ViewMode = 'internal_boxes' | 'assembled' | 'bars_lineup';
export type PartsGroupFilter = 'all' | 'metal' | 'wood' | 'pvc' | 'cutting';

export type InternalBoxType = 'chest' | 'drawer' | 'slide_tray' | 'open' | 'slat_bed';
export type DrawerMode = 'drawer' | 'slide_tray'; // Gaveteiro fechado alto vs Bandeja corrediça rasa
export type InternalBoxMaterial = 'plywood' | 'dark_wood' | 'white_mdf' | 'aluminum_box';
export type RearShelfFinish = 'pine_block' | 'teak' | 'dark_wood' | 'plywood';
export type ChestHingeDirection = 'front' | 'rear' | 'left' | 'right';
export type SlatBedDirection = 'left' | 'right' | 'front' | 'rear';

export type AwningType = 'rear' | 'batwing_270';
export type AwningSide = 'passenger' | 'driver';

export interface AwningConfig {
  enabled: boolean;          // Toldo instalado no rack de teto
  type: AwningType;          // Toldo Traseiro Reto vs Asa de Morcego 270°
  side: AwningSide;          // Lado de fixação do toldo asa de morcego ('passenger' ou 'driver')
  lengthMm: number;          // Comprimento do estojo fechado (1400mm a 2000mm)
  extensionMm: number;       // Extensão/Projeção da lona aberta (2000mm a 2500mm)
  isOpen: boolean;           // Aberto / estendido cobrindo acampamento
  fabricColor: string;       // Cor da lona impermeável (ex: '#c2b280', '#374151', '#4b5320', '#18181b')
}

export interface LedBaseboardConfig {
  enabled: boolean;          // Perfil de LED no rodapé do assoalho
  color: string;            // Cor da luz (ex: '#fef3c7' 3000K, '#ffffff' 4000K, '#38bdf8' azul, '#f59e0b' âmbar)
  brightness: number;       // Brilho / Intensidade luminosa (0 a 100%)
}

export type BoxLedEdge = 'rear' | 'front' | 'left' | 'right';

export interface BoxLedConfig {
  enabled: boolean;          // Perfil de quina com LED na parte de baixo do módulo
  color?: string;            // Cor da luz (ex: '#fef3c7' 3000K, '#ffffff' 4000K, '#38bdf8' azul, '#f59e0b' âmbar)
  brightness?: number;       // Brilho / Intensidade luminosa (0 a 100%)
  edges?: BoxLedEdge[];      // Quinas inferiores onde o perfil de cantoneira será instalado
}

export type FoldingBracketInches = 8 | 10 | 12 | 16 | 18 | 20;

export interface FoldingBracketSpec {
  inches: FoldingBracketInches;
  lengthMm: number;       // comprimento da haste horizontal (suporte da mesa)
  heightMm: number;       // altura da base vertical de fixação
  diagonalMm: number;     // comprimento da haste diagonal com trava
  minBoxHeightMm: number; // altura mínima recomendada do baú
  maxLoadKg: number;      // capacidade de carga recomendada do par (kg)
  label: string;          // ex: '20" (500 mm)'
}

export const FOLDING_BRACKET_SPECS: FoldingBracketSpec[] = [
  { inches: 8, lengthMm: 200, heightMm: 105, diagonalMm: 130, minBoxHeightMm: 220, maxLoadKg: 50, label: '8" (200 mm)' },
  { inches: 10, lengthMm: 250, heightMm: 120, diagonalMm: 160, minBoxHeightMm: 275, maxLoadKg: 60, label: '10" (250 mm)' },
  { inches: 12, lengthMm: 300, heightMm: 135, diagonalMm: 190, minBoxHeightMm: 325, maxLoadKg: 75, label: '12" (300 mm)' },
  { inches: 16, lengthMm: 400, heightMm: 165, diagonalMm: 225, minBoxHeightMm: 425, maxLoadKg: 100, label: '16" (400 mm)' },
  { inches: 18, lengthMm: 450, heightMm: 170, diagonalMm: 240, minBoxHeightMm: 475, maxLoadKg: 115, label: '18" (450 mm)' },
  { inches: 20, lengthMm: 500, heightMm: 170, diagonalMm: 250, minBoxHeightMm: 525, maxLoadKg: 130, label: '20" (500 mm)' }
];

/**
 * Calcula a mão francesa rebatível ideal com base na altura disponível do baú (em mm).
 * Suporta os tamanhos padronizados comerciais: 8", 10", 12", 16", 18" e 20".
 * Substitui pistões a gás por suporte mecânico de alta rigidez com trava rápida e gatilho.
 */
export function getFoldingBracketForHeight(boxHeightMm: number, manualInches?: number): FoldingBracketSpec {
  if (manualInches) {
    const found = FOLDING_BRACKET_SPECS.find((s) => s.inches === manualInches);
    if (found) return found;
  }
  // A prancha recolhida na vertical precisa caber na face do baú com folga de segurança de ~25mm
  const targetMaxL = Math.max(180, boxHeightMm - 25);
  const eligible = FOLDING_BRACKET_SPECS.filter((s) => s.lengthMm <= targetMaxL);
  if (eligible.length > 0) {
    return eligible[eligible.length - 1];
  }
  return FOLDING_BRACKET_SPECS[0];
}

export interface CentralTableConfig {
  enabled: boolean;          // Mesa dinette central instalada no vão
  lengthMm?: number;         // Comprimento do tampo da mesa (padrão ~650mm)
  widthMm?: number;          // Largura do tampo da mesa (padrão ~450mm)
  heightMm?: number;         // Altura em relação ao piso (400mm modo cama até 850mm modo trabalho)
  offsetX?: number;          // Deslocamento lateral em mm (-350mm a +350mm)
  offsetZ?: number;          // Deslocamento longitudinal em mm (-500mm a +500mm)
  rotationDeg?: number;      // Ângulo de rotação náutica do tampo (0° a 360°)
  finish?: RearShelfFinish;  // Acabamento da madeira do tampo
}

export type UpperCabinetSide = 'rear' | 'front' | 'left' | 'right';

export type CeilingType = 'slatted' | 'sheet'; // Ripado vs Chapa
export type CeilingSheetMaterial = 'white_mdf' | 'gray_mdf' | 'wood_mdf' | 'black_mdf' | 'sand_mdf' | 'plywood';
export type CeilingSlattedWood = 'pinus' | 'freijo' | 'teak' | 'dark_wood' | 'cedro' | 'plywood' | 'white_mdf';
export type CeilingLedType = 'strip_center' | 'strip_double' | 'strip_triple' | 'spots';

export interface CeilingLedConfig {
  enabled: boolean;          // Iluminação LED no teto
  type: CeilingLedType;      // Perfil linear (centro, duplo, triplo) ou Spots embutidos
  color: string;             // Cor da luz (ex: '#fef3c7' 3000K, '#ffffff' 4000K, '#e0f2fe' 6000K, '#f59e0b' âmbar, '#38bdf8' azul)
  brightness: number;        // Intensidade luminosa (0 a 100%)
  spotsCount?: number;       // 2 | 4 | 6 | 8 spots circulares (quando type === 'spots')
}

export interface CeilingConfig {
  enabled: boolean;          // Teto instalado no projeto
  visibleIn3D?: boolean;     // Exibir / ocultar no 3D (para visualização livre do interior)
  opacity?: number;          // Opacidade no 3D (0.1 a 1.0, padrão 1.0)
  type: CeilingType;         // 'slatted' (ripado) | 'sheet' (chapa)

  // Opções para Teto de Chapa (MDF ou Compensado)
  sheetMaterial?: CeilingSheetMaterial; // 'white_mdf' | 'gray_mdf' | 'wood_mdf' | 'plywood'
  thicknessMm?: number;      // Espessura da chapa ou ripas em mm (ex: 6, 9, 12, 15mm)
  sheetPanels?: 'single' | 'split_longitudinal' | 'split_transverse'; // 1 chapa única, 2 longitudinais ou 3 transversais

  // Opções para Teto Ripado
  slattedWood?: CeilingSlattedWood; // Espécie / tom de madeira das ripas
  slatWidthMm?: number;      // Largura da ripa em mm (ex: 25, 30, 40, 50, 60mm; padrão 40mm)
  slatThicknessMm?: number;  // Espessura da ripa em mm (ex: 10, 12, 15, 18mm; padrão 12mm)
  slatGapMm?: number;        // Espaçamento / fenda entre ripas em mm (ex: 5, 8, 10, 15mm; padrão 10mm)
  slatDirection?: 'longitudinal' | 'transverse'; // Padrão longitudinal
  acousticFeltBacking?: boolean; // Fundo preto acústico / feltro automotivo atrás das ripas (padrão true)

  // Dimensões & Posição
  lengthMm?: number;         // Comprimento do forro de teto em mm (padrão: grid.lengthMm ou 1700mm)
  widthMm?: number;          // Largura do forro de teto em mm (padrão: grid.widthMm ou 1200mm)
  heightOffsetMm?: number;   // Ajuste fino na altura Y em mm (-100mm a +100mm)
  curvatureMm?: number;      // Curvatura / flecha do arco transversal do teto em mm (0 a 30mm máx, padrão ~25mm para acompanhar o teto da Doblò)

  // Iluminação LED
  led?: CeilingLedConfig;
}

export interface InternalBoxesPreviewOptions {
  openCabinets?: boolean;
  openBed?: boolean;
  showMattress?: boolean;
  hideCeiling?: boolean;
}

export interface BoxPanelsConfig {
  front?: boolean;   // Parede frontal (voltada para os bancos dianteiros: +Z)
  rear?: boolean;    // Parede traseira/fundo (voltada para o porta-malas: -Z)
  left?: boolean;    // Parede lateral esquerda (+X olhando da traseira)
  right?: boolean;   // Parede lateral direita (-X olhando da traseira)
  top?: boolean;     // Tampo superior ou tampa basculante (+Y)
  bottom?: boolean;  // Chapa inferior de fundo própria (-Y)
}

export interface BoxPanelThicknessConfig {
  front?: number;    // Espessura da parede frontal em mm (ex: 6, 9, 12, 15, 18, 20, 25)
  rear?: number;     // Espessura da parede traseira/fundo em mm
  left?: number;     // Espessura da lateral esquerda em mm
  right?: number;    // Espessura da lateral direita em mm
  top?: number;      // Espessura do tampo superior / tampa basculante em mm
  bottom?: number;   // Espessura do piso / base do módulo em mm
  cabinet?: number;  // Espessura das chapas do armário aéreo em mm
  slat?: number;     // Espessura das ripas da cama retrátil em mm
  shelf?: number;    // Espessura da mesa/prateleira rebatível traseira em mm
}

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

export type UpperCabinetClosure = 'doors' | 'open' | 'drawer';

export function getUpperCabinetClosure(box: { upperCabinetClosure?: UpperCabinetClosure; upperCabinetDoors?: boolean }): UpperCabinetClosure {
  if (box.upperCabinetClosure) return box.upperCabinetClosure;
  if (box.upperCabinetDoors === false) return 'open';
  return 'doors';
}

export interface InternalBoxItem {
  id: string;
  name: string;
  type: InternalBoxType;
  colStart: number;
  colSpan: number;
  rowStart: number;
  rowSpan: number;
  heightMm: number;
  color: string;
  material: InternalBoxMaterial;
  chestHingeDirection?: ChestHingeDirection;
  slatBedDirection?: SlatBedDirection;
  slatExtensionPercent?: number; // Porcentagem de extensão ao abrir (50% a 100%, padrão 85%)
  slatWidthMm?: number;          // Largura nominal de cada ripa em mm (padrão ~70mm)
  mattressParts?: 1 | 2 | 3 | 4 | 5; // Divisão do colchão/estofado (1 = Inteiro, 2 = Bipartido, 3 = Tripartido, 5 = Total c/ Caixas de Roda)
  topPerforated?: boolean;       // Tampo/Tampa superior vazado para alívio de peso e aeração do colchão
  perforationHoleDiameterMm?: number; // Diâmetro dos furos passantes CNC em mm (ex: 15mm a 80mm, padrão ~40mm)
  perforationSpacingMm?: number;      // Espaçamento entre centros dos furos em mm (ex: 50mm a 150mm, padrão ~85mm)
  rearFoldShelf?: boolean;       // Decoração em madeira na face traseira que abre para cima como prateleira/mesa rebatível
  rearShelfFinish?: RearShelfFinish; // Acabamento da madeira da prateleira decorativa
  rearShelfBracketInches?: number;   // Medida comercial em polegadas da mão francesa (8", 10", 12", 14", 16", 18", 20", 24"). Se omitido, calcula automaticamente pela altura!
  isRearShelfOpen?: boolean;     // Estado aberto/fechado da prateleira traseira
  upperCabinet?: boolean;        // Armário aéreo de quina sobre a caixa até o teto da Doblò
  upperCabinetDepthMm?: number;  // Largura para trás / Profundidade longitudinal em mm (Z) ou transversal (X) se lateral
  upperCabinetWidthMm?: number;  // Largura transversal do armário em mm (X) ou comprimento (Z) se lateral
  upperCabinetBottomGapMm?: number; // Espaçamento inferior em mm entre a bancada/caixa e a base do armário aéreo (padrão 0mm)
  upperCabinetOffsetMm?: number;    // Deslocamento longitudinal sobre a caixa em mm (limitado entre o início e o fim da caixa)
  upperCabinetPositionMode?: 'on_box' | 'behind_box'; // Posicionamento longitudinal: 'on_box' (sobre a caixa) ou 'behind_box' (atrás do móvel)
  upperCabinetBehindOffsetMm?: number; // Recuo para trás do móvel em mm (quando posicionado atrás do móvel)
  upperCabinetTransverseMode?: 'on_box' | 'beside_box'; // Posicionamento transversal: 'on_box' (sobre a caixa) ou 'beside_box' (ao lado / fora do móvel no eixo transversal)
  upperCabinetBesideOffsetMm?: number; // Recuo / afastamento para fora do móvel no eixo transversal em mm
  upperCabinetBesideSide?: 'corridor' | 'outer'; // Direção para fora transversal ('corridor' = em direção ao centro/corredor, 'outer' = em direção à parede/lataria)
  upperCabinetDepthOffsetMm?: number; // Recuo em profundidade / afastamento da borda ou parede em mm
  upperCabinetAlign?: UpperCabinetSide | 'all'; // Alinhamento no eixo longitudinal/lateral ou todas as faces
  upperCabinetSides?: UpperCabinetSide[]; // Lista de lados com armário aéreo ativo ('rear' | 'front' | 'left' | 'right')
  upperCabinetDoors?: boolean;   // Porta fechada com puxador (padrão true) ou nicho aéreo aberto (legado)
  upperCabinetClosure?: UpperCabinetClosure; // Tipo de fechamento: 'doors' (porta basculante), 'drawer' (gaveta c/ corrediça telescópica), 'open' (nicho aberto)
  upperCabinetShelves?: number;  // Quantidade de prateleiras internas (1 a 3, padrão 1)
  drawerMode?: DrawerMode;       // Alternância entre 'drawer' (gaveteiro alto fechado) ou 'slide_tray' (bandeja corrediça rasa)
  hasCentralTable?: boolean;     // Mesa dinette central removível c/ pedestal náutico
  centralTable?: CentralTableConfig; // Configuração dimensional e de deslocamento da mesa central
  hasLedCorner?: boolean;        // Perfil cantoneira de quina com LED na parte de baixo do módulo
  ledCorner?: BoxLedConfig;      // Configuração de iluminação e quinas da base com perfil LED
  isOpen?: boolean;
  panels?: BoxPanelsConfig;
  thicknessMm?: number;          // Espessura padrão das chapas de madeira do módulo em mm (padrão: 15mm)
  panelThickness?: BoxPanelThicknessConfig; // Espessura individual por face/parte do módulo
  electronics?: InstalledElectronicItem[]; // Componentes elétricos instalados no interior deste módulo
}

export interface InternalGridConfig {
  lengthMm: number; // Comprimento total da área de carga (padrão 1700mm)
  widthMm: number;  // Largura total da área de carga (padrão 1200mm)
  heightMm: number; // Altura padrão do estrado/baús (padrão 400mm)
  floorThicknessMm?: number; // Espessura da chapa do assoalho base em mm (padrão 15mm)
  colsX: number;    // Divisórias na largura (X: 1 a 6)
  rowsZ: number;    // Divisórias no comprimento (Z: 1 a 8)
  offsetX?: number; // Deslocamento lateral em metros (padrão 0)
  offsetY?: number; // Deslocamento vertical de altura em metros (padrão 0)
  offsetZ?: number; // Deslocamento longitudinal frente/trás em metros (padrão 0)
  ledBaseboard?: LedBaseboardConfig; // Iluminação em perfil de LED no rodapé do assoalho
  centralTable?: CentralTableConfig; // Mesa dinette central fixada na chapa de compensado naval de 15mm (assoalho)
  ceiling?: CeilingConfig;           // Teto e forro do campervan (ripado ou chapa MDF/compensado com LED)
}

export interface InternalBoxesPreset {
  id: string;
  name: string;
  description: string;
  grid: InternalGridConfig;
  boxes: InternalBoxItem[];
}

export type CameraPreset = 'iso' | 'top' | 'front' | 'side' | 'panels';

export interface CargoBoxConfig {
  enabled: boolean;
  length: number;    // em mm (padrão: 1600mm)
  width: number;     // em mm (padrão: 1000mm)
  height: number;    // em mm (padrão: 330mm)
  isTelescopic?: boolean; // Se false: torres fixas sem mecanismo de subir/descer (padrão: true)
  verticalLiftMm?: number; // abertura / deslocamento vertical extra (mm) para ajuste de altura do vão do baú
  hingeSide: 'driver' | 'passenger'; // lado da dobradiça (padrão: 'driver', abre para calçada/passageiro)
  tiltAngle: number; // ângulo de basculamento da estrutura solar em graus (0 a 70°)
  lidAngle: number;  // ângulo de abertura da tampa do próprio baú em graus (0 a 45°)
}

export interface WaterTankConfig {
  enabled: boolean;    // Checkbox: inclui 2 canos de 200mm (1 de cada lado)
  lengthMm: number;    // Comprimento de cada cano em mm (limite máx = 2200mm, comprimento da base da estrutura)
  diameterMm: number;  // Diâmetro do cano em mm (200mm)
}

export interface CargoBoxPreset {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  volumeLiters: number;
  length: number;      // em mm (ex: 1600)
  width: number;       // em mm (ex: 1000)
  height: number;      // em mm (ex: 330)
  weightKg: number;    // em kg (ex: 18)
  maxLoadKg: number;   // em kg (ex: 50)
  material: string;
  color?: string;
  hingeSide?: 'driver' | 'passenger';
  features?: string[];
  description?: string;
  isDefault?: boolean;
}

export interface B2BChargerConfig {
  enabled: boolean;
  isEngineRunning: boolean; // Alternador da Doblò em funcionamento
  engineHoursPerDay: number; // Tempo diário com motor ligado / rodando (em horas)
  chargingAmps: number;     // 30A nominal
  voltageIn: number;        // Tensão do alternador (~13.8V–14.4V)
  voltageOut: number;       // Tensão de carga LiFePO4 (~14.4V)
  watts: number;            // Potência injetada (~390W–420W)
  bluetoothConnected: boolean;
}

export type UsinaModelRating = 70 | 120 | 150 | 200;

export interface UsinaChargerConfig {
  enabled: boolean;
  isConnectedAC: boolean;   // Conectado à rede elétrica 110V/220V (Shore Power / Camping)
  modelRating: UsinaModelRating; // Modelo: 70A | 120A | 150A | 200A
  chargingAmps: number;     // Ajustável até o limite do modelo (nominal)
  voltageOut: number;       // Ajuste fino Smart Connect (12.5V a 14.4V)
  watts: number;            // Watts gerados na tensão ajustada
  acVoltage: 110 | 220;     // Bivolt automático
  smartConnectActive: boolean;
}

export interface LevelConfig {
  panels: number;
  direction: SlideDirection;
  orientation: PanelOrientation;
}

export interface SolarPanelPreset {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  powerWatts: number;
  vmp: number;
  imp: number;
  voc: number;
  isc: number;
  maxSystemVoltage?: number;
  efficiencyPercent: number;
  cellType: string;
  cellCount?: number;
  cols?: number;
  rows?: number;
  material: string;
  width: number;       // em metros (ex: 0.590 ou 0.880)
  length: number;      // em metros (ex: 0.875 ou 1.145)
  thickness: number;   // em metros (ex: 0.003)
  weightKg: number;    // em kg (ex: 1.8 ou 4.0)
  connector?: string;
  features?: string[];
  description?: string;
  isDefault?: boolean;
}

export interface SavedConfig {
  stackLevels: StackLevels;
  level1: LevelConfig;
  level2: LevelConfig;
  structureMaterial: StructureMaterial;
  steelProfileUnit?: SteelProfileUnit;
  aluminumColor: AluminumColor;
  metalonColor?: string;
  metalonWallThickness?: number;
  metalonThickness40?: number;
  metalonThickness30?: number;
  cargoBox?: CargoBoxConfig;
  waterTank?: WaterTankConfig;
  awning?: AwningConfig;
  offsetZ?: number;
  offsetY?: number;
  expansionProgress?: number;
  b2bEngineHours?: number;
  panelPresetId?: string;
  cargoBoxPresetId?: string;
  internalBoxes?: InternalBoxItem[];
  internalGrid?: InternalGridConfig;
}

export interface ApplianceItem {
  id: string;
  name: string;
  watts: number;
  hours: number;
  qty: number;
  enabled: boolean;
  whPerDay?: number;
}

export interface LoadsSummary {
  count: number;
  activeCount: number;
  totalWatts: number;
  totalWh: number;
  totalAh: number;
  totalKWh: number;
}

export interface BatteryPerformance {
  dailyWhGenerated: number;
  solarDailyWh?: number;
  b2bDailyWh?: number;
  dailyConsumptionWh: number;
  surplusWh: number;
  isAutonomous: boolean;
  percent: number;
  solarAmps12V: number;
  dailyAhInjected: number;
  solarDailyAh?: number;
  b2bDailyAh?: number;
  solarHoursToFull: number;
  solarDaysToFull: number;
  daysRainAutonomy: number;
  daysRainAutonomyWithEngine?: number;
  batCapacityWh: number;
  batUsableWh: number;
  appliances: ApplianceItem[];
  loadsSummary: LoadsSummary;
}

export interface EnergyStats {
  nominalPowerW: number;
  effectiveWatts: number;
  dailyKWh: number;
  panelCount: number;
  efficiencyPercent: number;
  systemVoltage: number;
  mpptCurrentAmps: number;
  voc?: string;
  vmp?: string;
  isc?: string;
  presetName?: string;
  level1Panels: number;
  level2Panels: number;
  stackLevels: StackLevels;
}

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
  isElectrical?: boolean;
  electricalType?: 'battery' | 'mppt' | 'b2b' | 'usina' | 'water' | 'panel';
  voltage?: string;
  capacity?: string;
  current?: string;
  power?: string;
  efficiency?: string;
  statusText?: string;
  features?: string[];
}

