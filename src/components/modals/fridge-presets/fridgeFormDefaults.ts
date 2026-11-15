import { FridgePreset } from '../../../types';

export type FridgeFormData = Omit<FridgePreset, 'id' | 'isDefault'>;

export const emptyFridgeForm = (): FridgeFormData => ({
  name: '',
  brand: 'Resfri Ar',
  model: '',
  partNumber: '',
  asin: '',
  volumeLiters: 35,
  canCapacity350ml: 46,
  canCapacity473ml: 38,
  width: 378,
  depth: 652,
  height: 386,
  weightKg: 13.5,
  voltage: '12/24 VDC | 110/220V (Com Fonte)',
  powerEcoWatts: 48,
  powerMaxWatts: 60,
  ratedWatts: 48,
  dutyCyclePercent: 40,
  dailyHours: 9.6,
  current12V: '4,05 ± 5,0 A',
  current24V: '2,03 ± 2,5 A',
  annualKWh: 300,
  tempRange: '+10°C a -21°C',
  refrigerantGas: 'R134a | 34g',
  insulation: 'CP (Ciclopentano)',
  bluetooth: true,
  bluetoothApp: 'App Resfri Ar Experience',
  digitalController: true,
  internalLed: true,
  tempSensor: true,
  batteryProtection: 'Alta / Baixa Ajustável',
  removableDivider: true,
  drainPlug: true,
  warranty: '1 Ano',
  features: [
    'Controlador Digital integrado',
    'Bluetooth para controle via App',
    'Iluminação interna em LED',
    'Divisória interna removível e dreno'
  ],
  description: ''
});
