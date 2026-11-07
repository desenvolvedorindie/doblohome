export type StackLevels = 1 | 2;

export type SlideDirection = 'longitudinal' | 'lateral' | 'fixed' | 'rear_only' | 'front_only';

export type PanelOrientation = 'longitudinal' | 'transverse';

export type StructureMaterial = 'aluminum' | 'steel';

export type AluminumColor = 'silver' | 'black';

export type CameraPreset = 'iso' | 'top' | 'front' | 'side' | 'panels';

export interface CargoBoxConfig {
  enabled: boolean;
  length: number;    // em mm (padrão: 1600mm)
  width: number;     // em mm (padrão: 1000mm)
  height: number;    // em mm (padrão: 330mm)
  hingeSide: 'driver' | 'passenger'; // lado da dobradiça (padrão: 'driver', abre para calçada/passageiro)
  tiltAngle: number; // ângulo de basculamento da estrutura solar em graus (0 a 70°)
  lidAngle: number;  // ângulo de abertura da tampa do próprio baú em graus (0 a 45°)
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
  aluminumColor: AluminumColor;
  cargoBox?: CargoBoxConfig;
  offsetZ?: number;
  offsetY?: number;
  expansionProgress?: number;
  b2bEngineHours?: number;
  panelPresetId?: string;
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
  electricalType?: 'battery' | 'mppt' | 'b2b' | 'usina';
  voltage?: string;
  capacity?: string;
  current?: string;
  power?: string;
  efficiency?: string;
  statusText?: string;
  features?: string[];
}

