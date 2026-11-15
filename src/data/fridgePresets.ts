import { FridgePreset } from '../types';
import { dbGet, dbSet } from './db';

export const DEFAULT_FRIDGE_PRESETS: FridgePreset[] = [
  {
    id: 'resfriar-35l',
    name: 'Geladeira Portátil Resfri Ar 35L (Padrão)',
    brand: 'Resfri Ar',
    model: 'Geladeira Portátil 35L',
    partNumber: '307.0035',
    asin: 'B0F8RHX4S7',
    volumeLiters: 35,
    canCapacity350ml: 46,
    canCapacity473ml: 38,
    width: 378,
    depth: 652,
    height: 386,
    weightKg: 13.5,
    voltage: '12/24 VDC | 110/220V (Fonte Externa Inclusa)',
    powerEcoWatts: 48,
    powerMaxWatts: 60,
    ratedWatts: 48,
    dutyCyclePercent: 40,
    dailyHours: 9.6, // 24h * 40% ciclo médio do compressor
    current12V: '4,05 ± 5,0 A',
    current24V: '2,03 ± 2,5 A',
    annualKWh: 300,
    tempRange: '+10°C a -21°C (Geladeira e Freezer)',
    refrigerantGas: 'R134a | 34g',
    insulation: 'CP (Ciclopentano)',
    bluetooth: true,
    bluetoothApp: 'App Resfri Ar Experience',
    digitalController: true,
    internalLed: true,
    tempSensor: true,
    batteryProtection: 'Proteção Ajustável contra Descarga da Bateria (Alta ou Baixa)',
    removableDivider: true,
    drainPlug: true,
    warranty: '1 Ano com o fabricante',
    features: [
      'Controlador Digital integrado com display LCD de fácil leitura e ajuste de temperatura',
      'Conectividade Bluetooth para controle total via Smartphone no App Resfri Ar Experience',
      'Iluminação interna em LED brilhante de baixo consumo',
      'Sensor e medição contínua da temperatura interna',
      'Proteção de bateria ajustável (Alta ou Baixa) para não descarregar a bateria do veículo',
      'Divisória interna removível para organização dos alimentos e bebidas',
      'Dreno inferior para escoamento e facilidade na higienização',
      'Capacidade para 46 latas de 350 ml ou 38 latas de 473 ml',
      'Funciona como refrigerador (+10°C) ou freezer potente (-21°C)'
    ],
    description: 'Geladeira portátil oficial Resfri Ar de 35 Litros, referência para motorhomes e campervans. Encaixa com precisão nos gavetões de marcenaria da Fiat Doblò, oferecendo baixíssimo consumo (48W ECO / 60W MAX) e controle via aplicativo Bluetooth.',
    isDefault: true
  },
  {
    id: 'resfriar-31l-compact',
    name: 'Geladeira Portátil Resfri Ar 31L (Compacta)',
    brand: 'Resfri Ar',
    model: 'Portátil 31L',
    partNumber: '307.0031',
    volumeLiters: 31,
    canCapacity350ml: 40,
    canCapacity473ml: 32,
    width: 380,
    depth: 585,
    height: 340,
    weightKg: 12.5,
    voltage: '12/24 VDC | 110/220V',
    powerEcoWatts: 42,
    powerMaxWatts: 55,
    ratedWatts: 42,
    dutyCyclePercent: 40,
    dailyHours: 9.6,
    current12V: '3,8 ± 4,5 A',
    current24V: '1,9 ± 2,2 A',
    annualKWh: 275,
    tempRange: '+10°C a -20°C',
    refrigerantGas: 'R134a | 30g',
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
      'Perfil compacto com 585 mm de profundidade e 340 mm de altura',
      'Ideal para gavetas menores e gaveteiros rasos de motorhome',
      'Baixo consumo em 12V e compressor silencioso',
      'Controle por aplicativo Bluetooth Resfri Ar'
    ],
    description: 'Versão mais curta (585 mm de profundidade), ideal para montagens campervan onde o espaço longitudinal do gavetão traseiro é mais restrito.',
    isDefault: true
  },
  {
    id: 'resfriar-45l-expedition',
    name: 'Geladeira Portátil Resfri Ar 45L (Expedição)',
    brand: 'Resfri Ar',
    model: 'Portátil 45L',
    partNumber: '307.0045',
    volumeLiters: 45,
    canCapacity350ml: 62,
    canCapacity473ml: 50,
    width: 410,
    depth: 690,
    height: 450,
    weightKg: 16.0,
    voltage: '12/24 VDC | 110/220V',
    powerEcoWatts: 50,
    powerMaxWatts: 65,
    ratedWatts: 50,
    dutyCyclePercent: 42,
    dailyHours: 10.0,
    current12V: '4,5 ± 5,5 A',
    current24V: '2,2 ± 2,8 A',
    annualKWh: 340,
    tempRange: '+10°C a -21°C',
    refrigerantGas: 'R134a | 40g',
    insulation: 'CP (Ciclopentano)',
    bluetooth: true,
    bluetoothApp: 'App Resfri Ar Experience',
    digitalController: true,
    internalLed: true,
    tempSensor: true,
    batteryProtection: 'Alta / Média / Baixa',
    removableDivider: true,
    drainPlug: true,
    warranty: '1 Ano',
    features: [
      'Volume ampliado de 45 Litros para viagens longas de vários dias',
      'Suporta garrafas de 2L em pé',
      'Cestos internos removíveis e alças dobráveis de alta resistência',
      'Controlador digital e Bluetooth'
    ],
    description: 'Modelo de maior volume para casais ou expedições estendidas, exigindo baú ou gavetão com pelo menos 460 mm de altura livre.',
    isDefault: true
  },
  {
    id: 'alpicool-c35',
    name: 'Geladeira Portátil Alpicool C35 (35L)',
    brand: 'Alpicool',
    model: 'C35',
    volumeLiters: 35,
    canCapacity350ml: 44,
    canCapacity473ml: 36,
    width: 365,
    depth: 650,
    height: 390,
    weightKg: 12.8,
    voltage: '12/24 VDC | 110/220V',
    powerEcoWatts: 45,
    powerMaxWatts: 60,
    ratedWatts: 45,
    dutyCyclePercent: 40,
    dailyHours: 9.6,
    current12V: '3,75 ± 4,8 A',
    current24V: '1,85 ± 2,4 A',
    annualKWh: 290,
    tempRange: '+20°C a -20°C',
    refrigerantGas: 'R134a | 32g',
    insulation: 'Espuma PU Alta Densidade',
    bluetooth: true,
    bluetoothApp: 'Alpicool App',
    digitalController: true,
    internalLed: true,
    tempSensor: true,
    batteryProtection: 'Proteção 3 Níveis (H/M/L)',
    removableDivider: false,
    drainPlug: true,
    warranty: '1 Ano',
    features: [
      'Design compacto e leve (12,8 kg)',
      'Modo MAX de resfriamento rápido e ECO de economia',
      'Painel digital touch',
      'Proteção de bateria em 3 estágios'
    ],
    description: 'Alternativa popular e acessível para motorhomes, com dimensões similares à Resfri Ar 35L.',
    isDefault: true
  },
  {
    id: 'elber-cab35-black',
    name: 'Geladeira Portátil Elber CAB 35L Black',
    brand: 'Elber',
    model: 'CAB 35 Black',
    volumeLiters: 35,
    canCapacity350ml: 45,
    canCapacity473ml: 38,
    width: 385,
    depth: 660,
    height: 395,
    weightKg: 14.0,
    voltage: '12/24 VDC | 110/220V',
    powerEcoWatts: 48,
    powerMaxWatts: 60,
    ratedWatts: 48,
    dutyCyclePercent: 40,
    dailyHours: 9.6,
    current12V: '4,0 ± 5,0 A',
    current24V: '2,0 ± 2,5 A',
    annualKWh: 305,
    tempRange: '+10°C a -20°C',
    refrigerantGas: 'R134a | 35g',
    insulation: 'CP (Ciclopentano)',
    bluetooth: false,
    digitalController: true,
    internalLed: true,
    tempSensor: true,
    batteryProtection: 'Proteção Automática de Bateria',
    removableDivider: true,
    drainPlug: true,
    warranty: '2 Anos',
    features: [
      'Gabinete metálico reforçado com pintura preta epóxi',
      'Compressor hermético com garantia estendida Elber',
      'Excelente isolamento térmico para altas temperaturas externas',
      'Dreno de limpeza e cesto interno removível'
    ],
    description: 'Geladeira de construção robusta em metal, consagrada no segmento náutico e motorhome.',
    isDefault: true
  }
];

const FRIDGE_PRESETS_STORAGE_KEY = 'doblo_fridge_presets';
const ACTIVE_FRIDGE_PRESET_KEY = 'doblo_active_fridge_preset_id';

let memoryFridgePresets: FridgePreset[] = [...DEFAULT_FRIDGE_PRESETS];
let memoryActivePresetId: string = DEFAULT_FRIDGE_PRESETS[0].id;

export function loadFridgePresets(): FridgePreset[] {
  try {
    const raw = localStorage.getItem(FRIDGE_PRESETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryFridgePresets = parsed;
        return parsed;
      }
    }
  } catch { }

  dbGet<FridgePreset[]>(FRIDGE_PRESETS_STORAGE_KEY).then((fromDb) => {
    if (fromDb && Array.isArray(fromDb) && fromDb.length > 0) {
      memoryFridgePresets = fromDb;
    }
  }).catch(() => { });

  return memoryFridgePresets;
}

export function saveFridgePresets(presets: FridgePreset[]): void {
  memoryFridgePresets = presets;
  try {
    localStorage.setItem(FRIDGE_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch { }
  dbSet(FRIDGE_PRESETS_STORAGE_KEY, presets).catch(() => { });
}

export function loadActiveFridgePresetId(): string {
  try {
    const raw = localStorage.getItem(ACTIVE_FRIDGE_PRESET_KEY);
    if (raw) {
      memoryActivePresetId = raw;
      return raw;
    }
  } catch { }

  dbGet<string>(ACTIVE_FRIDGE_PRESET_KEY).then((fromDb) => {
    if (fromDb) memoryActivePresetId = fromDb;
  }).catch(() => { });

  return memoryActivePresetId;
}

export function saveActiveFridgePresetId(id: string): void {
  memoryActivePresetId = id;
  try {
    localStorage.setItem(ACTIVE_FRIDGE_PRESET_KEY, id);
  } catch { }
  dbSet(ACTIVE_FRIDGE_PRESET_KEY, id).catch(() => { });
}

export function resetFridgePresets(): FridgePreset[] {
  const defaults = [...DEFAULT_FRIDGE_PRESETS];
  saveFridgePresets(defaults);
  saveActiveFridgePresetId(defaults[0].id);
  return defaults;
}
