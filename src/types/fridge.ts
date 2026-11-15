export interface FridgePreset {
  id: string;
  name: string;
  brand: string;
  model: string;
  partNumber?: string;
  asin?: string;
  volumeLiters: number;
  canCapacity350ml?: number;
  canCapacity473ml?: number;

  // Dimensões em milímetros (mm)
  width: number;  // Largura (L) em mm
  depth: number;  // Profundidade (P) em mm
  height: number; // Altura (A) em mm
  weightKg: number;

  // Elétrica & Potência
  voltage: string;
  powerEcoWatts: number;
  powerMaxWatts: number;
  ratedWatts: number;       // Potência média típica para dimensionamento solar
  dutyCyclePercent: number; // Ciclo do compressor típico (ex: 40%)
  dailyHours: number;       // Horas diárias equivalentes de compressor ligado (ex: 9.6h)
  current12V: string;       // ex: '4,05 ± 5,0A'
  current24V: string;       // ex: '2,03 ± 2,5A'
  annualKWh?: number;       // ex: 300 kWh/ano

  // Refrigeração & Isolamento
  tempRange: string;        // ex: '+10°C a -21°C'
  refrigerantGas: string;   // ex: 'R134a (34g)'
  insulation: string;       // ex: 'CP (Ciclopentano)'

  // Recursos & Conectividade
  bluetooth: boolean;
  bluetoothApp?: string;    // ex: 'App Resfri Ar Experience'
  digitalController: boolean;
  internalLed: boolean;
  tempSensor: boolean;
  batteryProtection: string; // ex: 'Alta / Baixa Ajustável'
  removableDivider: boolean;
  drainPlug: boolean;
  warranty: string;
  features: string[];
  description: string;
  isDefault?: boolean;
}
