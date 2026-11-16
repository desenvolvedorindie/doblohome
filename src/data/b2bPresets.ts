import { B2bPreset } from '../types';
import { dbGet, dbSet } from './db';

export const DEFAULT_B2B_PRESETS: B2bPreset[] = [
  {
    id: 'b2b1230-30a',
    name: 'B2B1230 30A (Padrão)',
    brand: 'Renogy / Victron Type',
    model: 'B2B 12V-12V 30A com Bluetooth',
    chargingAmps: 30,
    voltageIn: 12,
    voltageOut: 14.4,
    dimensionsMm: { width: 190, height: 130, depth: 58 },
    weightKg: 1.8,
    features: [
      'Isolamento galvânico e proteção do alternador',
      'Sensor de ignição D+ automático',
      'LEDs e telemetria Bluetooth integrada',
      'Flanges metálicas de parafusamento'
    ],
    description: 'Carregador inteligente que recupera a bateria LiFePO4 através do alternador do carro em viagens e deslocamentos. Parafusado nas paredes do baú.',
    isDefault: true
  }
];

const B2B_PRESETS_STORAGE_KEY = 'doblo_b2b_presets';
const ACTIVE_B2B_PRESET_KEY = 'doblo_b2b_preset_active';

let memoryB2bPresets: B2bPreset[] = [...DEFAULT_B2B_PRESETS];
let memoryActiveB2bPresetId: string = DEFAULT_B2B_PRESETS[0].id;

export function loadB2bPresets(): B2bPreset[] {
  try {
    const raw = localStorage.getItem(B2B_PRESETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryB2bPresets = parsed;
        return parsed;
      }
    }
  } catch { }

  dbGet<B2bPreset[]>(B2B_PRESETS_STORAGE_KEY).then((fromDb) => {
    if (fromDb && Array.isArray(fromDb) && fromDb.length > 0) {
      memoryB2bPresets = fromDb;
    }
  }).catch(() => { });

  return memoryB2bPresets;
}

export function saveB2bPresets(presets: B2bPreset[]): void {
  memoryB2bPresets = presets;
  try {
    localStorage.setItem(B2B_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch { }
  dbSet(B2B_PRESETS_STORAGE_KEY, presets).catch(() => { });
}

export function loadActiveB2bPresetId(): string {
  try {
    const raw = localStorage.getItem(ACTIVE_B2B_PRESET_KEY);
    if (raw) {
      memoryActiveB2bPresetId = raw;
      return raw;
    }
  } catch { }

  dbGet<string>(ACTIVE_B2B_PRESET_KEY).then((fromDb) => {
    if (fromDb) memoryActiveB2bPresetId = fromDb;
  }).catch(() => { });

  return memoryActiveB2bPresetId;
}

export function saveActiveB2bPresetId(id: string): void {
  memoryActiveB2bPresetId = id;
  try {
    localStorage.setItem(ACTIVE_B2B_PRESET_KEY, id);
  } catch { }
  dbSet(ACTIVE_B2B_PRESET_KEY, id).catch(() => { });
}

export function resetB2bPresets(): B2bPreset[] {
  const defaults = [...DEFAULT_B2B_PRESETS];
  saveB2bPresets(defaults);
  saveActiveB2bPresetId(defaults[0].id);
  return defaults;
}
