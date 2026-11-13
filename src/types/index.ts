export type StackLevels = 1 | 2;

export type SlideDirection = 'longitudinal' | 'lateral' | 'fixed' | 'rear_only' | 'front_only';

export type PanelOrientation = 'longitudinal' | 'transverse';

export type StructureMaterial = 'aluminum' | 'steel';

export type SteelProfileUnit = 'mm' | 'inch';

export function getSteelProfileSpec(size: 30 | 40, unit: SteelProfileUnit = 'mm'): string {
  if (unit === 'inch') {
    return size === 40 ? 'Metalon 1 ½" x 1 ½"' : 'Metalon 1 ¼" x 1 ¼"';
  }
  return size === 40 ? 'Metalon 40x40 mm' : 'Metalon 30x30 mm';
}

export type AluminumColor = 'silver' | 'black';

export type ViewMode = 'internal_boxes' | 'assembled' | 'bars_lineup';
export type PartsGroupFilter = 'all' | 'metal' | 'wood';

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
  { inches: 8,  lengthMm: 200, heightMm: 105, diagonalMm: 130, minBoxHeightMm: 220, maxLoadKg: 50,  label: '8" (200 mm)' },
  { inches: 10, lengthMm: 250, heightMm: 120, diagonalMm: 160, minBoxHeightMm: 275, maxLoadKg: 60,  label: '10" (250 mm)' },
  { inches: 12, lengthMm: 300, heightMm: 135, diagonalMm: 190, minBoxHeightMm: 325, maxLoadKg: 75,  label: '12" (300 mm)' },
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

export interface BoxPanelsConfig {
  front?: boolean;   // Parede frontal (voltada para os bancos dianteiros: +Z)
  rear?: boolean;    // Parede traseira/fundo (voltada para o porta-malas: -Z)
  left?: boolean;    // Parede lateral esquerda (+X olhando da traseira)
  right?: boolean;   // Parede lateral direita (-X olhando da traseira)
  top?: boolean;     // Tampo superior ou tampa basculante (+Y)
  bottom?: boolean;  // Chapa inferior de fundo própria (-Y)
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
  topPerforated?: boolean;       // Tampo/Tampa superior vazado para alívio de peso e aeração do colchão
  rearFoldShelf?: boolean;       // Decoração em madeira na face traseira que abre para cima como prateleira/mesa rebatível
  rearShelfFinish?: RearShelfFinish; // Acabamento da madeira da prateleira decorativa
  rearShelfBracketInches?: number;   // Medida comercial em polegadas da mão francesa (8", 10", 12", 14", 16", 18", 20", 24"). Se omitido, calcula automaticamente pela altura!
  isRearShelfOpen?: boolean;     // Estado aberto/fechado da prateleira traseira
  upperCabinet?: boolean;        // Armário aéreo de quina sobre a caixa até o teto da Doblò
  upperCabinetDepthMm?: number;  // Profundidade configurável em mm (ex: 250mm, liberando bancada à frente)
  upperCabinetAlign?: 'rear' | 'front'; // Alinhamento no eixo longitudinal ('rear' = encostado no fundo traseiro, 'front' = encostado na frente)
  upperCabinetDoors?: boolean;   // Porta fechada com puxador (padrão true) ou nicho aéreo aberto
  upperCabinetShelves?: number;  // Quantidade de prateleiras internas (1 a 3, padrão 1)
  drawerMode?: DrawerMode;       // Alternância entre 'drawer' (gaveteiro alto fechado) ou 'slide_tray' (bandeja corrediça rasa)
  hasCentralTable?: boolean;     // Mesa dinette central removível c/ pedestal náutico
  centralTable?: CentralTableConfig; // Configuração dimensional e de deslocamento da mesa central
  isOpen?: boolean;
  panels?: BoxPanelsConfig;
}

export interface InternalGridConfig {
  lengthMm: number; // Comprimento total da área de carga (padrão 1700mm)
  widthMm: number;  // Largura total da área de carga (padrão 1200mm)
  heightMm: number; // Altura padrão do estrado/baús (padrão 400mm)
  colsX: number;    // Divisórias na largura (X: 1 a 6)
  rowsZ: number;    // Divisórias no comprimento (Z: 1 a 8)
  offsetX?: number; // Deslocamento lateral em metros (padrão 0)
  offsetY?: number; // Deslocamento vertical de altura em metros (padrão 0)
  offsetZ?: number; // Deslocamento longitudinal frente/trás em metros (padrão 0)
  ledBaseboard?: LedBaseboardConfig; // Iluminação em perfil de LED no rodapé do assoalho
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

