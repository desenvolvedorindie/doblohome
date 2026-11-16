import { MpptPreset } from '../types';
import { dbGet, dbSet } from './db';

export const DEFAULT_MPPT_PRESETS: MpptPreset[] = [
  {
    id: 'kingbo-mppt-60a',
    name: 'Kingbo MPPT 60A (Padrão)',
    brand: 'Kingbo Power',
    model: 'MPPT 60A 230Vdc FV',
    maxAmps: 60,
    maxPvVoltage: 230,
    dimensionsMm: { width: 202, height: 215, depth: 100 },
    weightKg: 3.2,
    features: [
      'Rastreamento MPPT com eficiência 99.5%',
      'Display LCD com parâmetros solares em tempo real',
      'Dissipador aletado de alta performance',
      'Abas de fixação para parafusamento em compensado'
    ],
    description: 'Controlador MPPT com dissipador de calor e aletas em alumínio fundido. Fixação por parafusos na parede do móvel para excelente ventilação ou no piso.',
    isDefault: true
  }
];

const MPPT_PRESETS_STORAGE_KEY = 'doblo_mppt_presets';
const ACTIVE_MPPT_PRESET_KEY = 'doblo_mppt_preset_active';

let memoryMpptPresets: MpptPreset[] = [...DEFAULT_MPPT_PRESETS];
let memoryActiveMpptPresetId: string = DEFAULT_MPPT_PRESETS[0].id;

export function loadMpptPresets(): MpptPreset[] {
  try {
    const raw = localStorage.getItem(MPPT_PRESETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryMpptPresets = parsed;
        return parsed;
      }
    }
  } catch { }

  dbGet<MpptPreset[]>(MPPT_PRESETS_STORAGE_KEY).then((fromDb) => {
    if (fromDb && Array.isArray(fromDb) && fromDb.length > 0) {
      memoryMpptPresets = fromDb;
    }
  }).catch(() => { });

  return memoryMpptPresets;
}

export function saveMpptPresets(presets: MpptPreset[]): void {
  memoryMpptPresets = presets;
  try {
    localStorage.setItem(MPPT_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch { }
  dbSet(MPPT_PRESETS_STORAGE_KEY, presets).catch(() => { });
}

export function loadActiveMpptPresetId(): string {
  try {
    const raw = localStorage.getItem(ACTIVE_MPPT_PRESET_KEY);
    if (raw) {
      memoryActiveMpptPresetId = raw;
      return raw;
    }
  } catch { }

  dbGet<string>(ACTIVE_MPPT_PRESET_KEY).then((fromDb) => {
    if (fromDb) memoryActiveMpptPresetId = fromDb;
  }).catch(() => { });

  return memoryActiveMpptPresetId;
}

export function saveActiveMpptPresetId(id: string): void {
  memoryActiveMpptPresetId = id;
  try {
    localStorage.setItem(ACTIVE_MPPT_PRESET_KEY, id);
  } catch { }
  dbSet(ACTIVE_MPPT_PRESET_KEY, id).catch(() => { });
}

export function resetMpptPresets(): MpptPreset[] {
  const defaults = [...DEFAULT_MPPT_PRESETS];
  saveMpptPresets(defaults);
  saveActiveMpptPresetId(defaults[0].id);
  return defaults;
}
