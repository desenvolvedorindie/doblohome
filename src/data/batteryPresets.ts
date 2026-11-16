import { BatteryPreset } from '../types';
import { dbGet, dbSet } from './db';

export const DEFAULT_BATTERY_PRESETS: BatteryPreset[] = [
  {
    id: 'kingbo-lifepo4-560ah',
    name: 'Kingbo LiFePO4 560Ah (Padrão)',
    brand: 'Kingbo Power',
    model: 'LiFePO4 12V 560Ah c/ Smart BMS 4.3"',
    chemistry: 'LiFePO4',
    voltageNominal: 12.8,
    capacityAh: 560,
    bmsAmps: 200,
    dimensionsMm: { width: 270, height: 240, depth: 520 },
    weightKg: 46.5,
    features: [
      'JK Smart BMS 200A c/ Balanceamento Ativo 2A',
      'Display Digital Touchscreen 4.3" Integrado',
      'Células Prismáticas Grau A (≥9.000 ciclos)',
      'Conexão Bluetooth em tempo real'
    ],
    description: 'Bateria prismática pesada de alta capacidade. Por segurança física e centro de gravidade, deve sempre ser instalada na base do móvel.',
    isDefault: true
  }
];

const BATTERY_PRESETS_STORAGE_KEY = 'doblo_battery_presets';
const ACTIVE_BATTERY_PRESET_KEY = 'doblo_battery_preset_active';

let memoryBatteryPresets: BatteryPreset[] = [...DEFAULT_BATTERY_PRESETS];
let memoryActiveBatteryPresetId: string = DEFAULT_BATTERY_PRESETS[0].id;

export function loadBatteryPresets(): BatteryPreset[] {
  try {
    const raw = localStorage.getItem(BATTERY_PRESETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryBatteryPresets = parsed;
        return parsed;
      }
    }
  } catch { }

  dbGet<BatteryPreset[]>(BATTERY_PRESETS_STORAGE_KEY).then((fromDb) => {
    if (fromDb && Array.isArray(fromDb) && fromDb.length > 0) {
      memoryBatteryPresets = fromDb;
    }
  }).catch(() => { });

  return memoryBatteryPresets;
}

export function saveBatteryPresets(presets: BatteryPreset[]): void {
  memoryBatteryPresets = presets;
  try {
    localStorage.setItem(BATTERY_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch { }
  dbSet(BATTERY_PRESETS_STORAGE_KEY, presets).catch(() => { });
}

export function loadActiveBatteryPresetId(): string {
  try {
    const raw = localStorage.getItem(ACTIVE_BATTERY_PRESET_KEY);
    if (raw) {
      memoryActiveBatteryPresetId = raw;
      return raw;
    }
  } catch { }

  dbGet<string>(ACTIVE_BATTERY_PRESET_KEY).then((fromDb) => {
    if (fromDb) memoryActiveBatteryPresetId = fromDb;
  }).catch(() => { });

  return memoryActiveBatteryPresetId;
}

export function saveActiveBatteryPresetId(id: string): void {
  memoryActiveBatteryPresetId = id;
  try {
    localStorage.setItem(ACTIVE_BATTERY_PRESET_KEY, id);
  } catch { }
  dbSet(ACTIVE_BATTERY_PRESET_KEY, id).catch(() => { });
}

export function resetBatteryPresets(): BatteryPreset[] {
  const defaults = [...DEFAULT_BATTERY_PRESETS];
  saveBatteryPresets(defaults);
  saveActiveBatteryPresetId(defaults[0].id);
  return defaults;
}
