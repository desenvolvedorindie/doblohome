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

export type ViewMode = 'assembled' | 'bars_lineup';

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
  offsetZ?: number;
  offsetY?: number;
  expansionProgress?: number;
  b2bEngineHours?: number;
  panelPresetId?: string;
  cargoBoxPresetId?: string;
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

