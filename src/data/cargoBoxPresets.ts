import { CargoBoxPreset } from '../types';
import { dbGet, dbSet } from './db';

export const DEFAULT_CARGO_BOX_PRESETS: CargoBoxPreset[] = [
  {
    id: 'motobul-500l-offroad',
    name: 'Baú de Teto Motobul Off Road 500L (Padrão)',
    brand: 'Motobul',
    model: 'Off Road 500L',
    volumeLiters: 500,
    length: 1600,
    width: 1000,
    height: 330,
    weightKg: 18.0,
    maxLoadKg: 50,
    material: 'ABS Automotivo de Alto Impacto c/ Proteção UV',
    color: 'Cinza Ardósia / Grafite Texturizado',
    hingeSide: 'driver',
    features: [
      'Capacidade volumétrica real de 500 Litros (1600 × 1000 × 330 mm)',
      'Tampa superior nervurada em quadrantes waffle de alta rigidez',
      'Fechadura central traseira com chave + fivelas laterais de segurança',
      'Perfeito encaixe entre as torres do subchassi de 1,40 m da Fiat Doblò'
    ],
    description: 'Baú expedição largo e baixo da linha Motobul Off Road, ideal para instalação sob o rack solar basculante mantendo baixo centro de gravidade.',
    isDefault: true
  },
  {
    id: 'motobul-420l-compact',
    name: 'Baú de Teto Motobul Off Road 420L (Compacto)',
    brand: 'Motobul',
    model: 'Off Road 420L',
    volumeLiters: 420,
    length: 1450,
    width: 940,
    height: 310,
    weightKg: 15.5,
    maxLoadKg: 50,
    material: 'ABS Automotivo Texturizado UV',
    color: 'Grafite / Preto Fosco',
    hingeSide: 'driver',
    features: [
      'Perfil reduzido em altura (310 mm) para menor arrasto aerodinâmico',
      'Comprimento compacto de 1,45 m liberando amplo espaço nas travessas',
      'Peso próprio reduzido (15,5 kg)'
    ],
    description: 'Versão mais curta e baixa para quem deseja reduzir a altura total do conjunto solar e ganhar folga nas extremidades do rack.',
    isDefault: true
  },
  {
    id: 'motobul-600l-expedition',
    name: 'Baú de Teto Motobul Expedition 600L (Maxi)',
    brand: 'Motobul',
    model: 'Expedition 600L',
    volumeLiters: 600,
    length: 1800,
    width: 1050,
    height: 370,
    weightKg: 21.0,
    maxLoadKg: 60,
    material: 'ABS Reforçado Dupla Camada',
    color: 'Cinza Ardósia',
    hingeSide: 'driver',
    features: [
      'Volume máximo de 600 Litros para expedições longas (1800 × 1050 × 370 mm)',
      'Acomoda cadeiras de camping, barracas, ferramentas e bagagens volumosas',
      'Fixação quadrupla reforçada U-Bolt nas travessas do subchassi'
    ],
    description: 'Modelo de máxima capacidade volumétrica para viagens longas em motorhome, aproveitando quase todo o vão longitudinal do subchassi.',
    isDefault: true
  },
  {
    id: 'slim-lowprofile-340l',
    name: 'Baú Slim Aerodinâmico Low-Profile 340L',
    brand: 'Thule / Jetbag Style',
    model: 'Slim 340L',
    volumeLiters: 340,
    length: 1550,
    width: 850,
    height: 270,
    weightKg: 13.5,
    maxLoadKg: 45,
    material: 'ABS Aerodinâmico Ultraleve',
    color: 'Preto Acetinado',
    hingeSide: 'driver',
    features: [
      'Altura super slim de apenas 270 mm (mínima elevação das placas solares)',
      'Largura estreita de 850 mm com ampla folga para os pistões a gás',
      'Ultraleve: apenas 13,5 kg'
    ],
    description: 'Baú de perfil ultrabaixo pensado para manter o rack solar o mais próximo possível do teto da Fiat Doblò.',
    isDefault: true
  }
];

const CARGO_PRESETS_STORAGE_KEY = 'doblo_cargo_box_presets';
const ACTIVE_CARGO_PRESET_KEY = 'doblo_active_cargo_preset_id';

let memoryCargoPresets: CargoBoxPreset[] = [...DEFAULT_CARGO_BOX_PRESETS];
let memoryActivePresetId: string = DEFAULT_CARGO_BOX_PRESETS[0].id;

// Inicialização síncrona a partir do localStorage para evitar atraso de renderização
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const rawCargo = window.localStorage.getItem(CARGO_PRESETS_STORAGE_KEY);
    if (rawCargo) {
      const data = JSON.parse(rawCargo);
      if (data && Array.isArray(data) && data.length > 0) {
        const merged = [...data];
        DEFAULT_CARGO_BOX_PRESETS.forEach(def => {
          const idx = merged.findIndex(p => p.id === def.id);
          if (idx === -1) {
            merged.push(def);
          } else {
            merged[idx] = { ...def, ...merged[idx], isDefault: true };
          }
        });
        memoryCargoPresets = merged;
      }
    }
    const rawActive = window.localStorage.getItem(ACTIVE_CARGO_PRESET_KEY);
    if (rawActive) {
      memoryActivePresetId = rawActive;
    }
  } catch {}
}

// Inicializa a carga a partir do IndexedDB
if (typeof window !== 'undefined') {
  dbGet<CargoBoxPreset[]>(CARGO_PRESETS_STORAGE_KEY).then((data) => {
    if (data && Array.isArray(data) && data.length > 0) {
      const merged = [...data];
      DEFAULT_CARGO_BOX_PRESETS.forEach(def => {
        const idx = merged.findIndex(p => p.id === def.id);
        if (idx === -1) {
          merged.push(def);
        } else {
          merged[idx] = { ...def, ...merged[idx], isDefault: true };
        }
      });
      memoryCargoPresets = merged;
    }
  });

  dbGet<string>(ACTIVE_CARGO_PRESET_KEY).then((id) => {
    if (id) memoryActivePresetId = id;
  });
}

export function loadCargoBoxPresets(): CargoBoxPreset[] {
  return [...memoryCargoPresets];
}

export function saveCargoBoxPresets(presets: CargoBoxPreset[]): void {
  memoryCargoPresets = presets;
  dbSet(CARGO_PRESETS_STORAGE_KEY, presets);
}

export function loadActiveCargoPresetId(): string {
  return memoryActivePresetId;
}

export function saveActiveCargoPresetId(id: string): void {
  memoryActivePresetId = id;
  dbSet(ACTIVE_CARGO_PRESET_KEY, id);
}

