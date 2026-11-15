import { PortaPottiPreset } from '../types';
import { dbGet, dbSet } from './db';

export const DEFAULT_PORTAPOTTI_PRESETS: PortaPottiPreset[] = [
  {
    id: 'seaflo-20l',
    name: 'Vaso Sanitário Químico Portátil Seaflo 20L (Padrão)',
    brand: 'Seaflo',
    model: 'SFPT-20-02',
    wasteCapacityLiters: 20,
    freshWaterCapacityLiters: 13,
    width: 404,  // Largura frontal em mm
    depth: 353,  // Comprimento / Profundidade em mm
    height: 390, // Altura em mm
    weightEmptyKg: 6.7,
    weightFullKg: 26.7,
    maxLoadKg: 200,
    material: 'Plástico ABS de alta resistência e Polietileno',
    hasSoftClose: true,
    flushType: 'Bomba de pistão manual (jato duplo 360°)',
    antiLeakValve: true,
    rotatingSpout: true,
    airReliefValve: true,
    levelIndicator: true,
    features: [
      'Tanque de resíduos/dejetos com capacidade de 20 Litros',
      'Tanque superior de descarga com 13 Litros de água limpa',
      'Assento sanitário ergonômico com tampa de fechamento suave (Soft Close)',
      'Válvula de vedação dupla hermética de alta eficácia antivazamento e antiodor',
      'Bomba de pistão manual de acionamento suave com descarga multidirecional em 360°',
      'Bico de despejo rotativo extralongo com botão de alívio de ar (respiro descompressor)',
      'Travas laterais reforçadas de liberação rápida para desacoplar os reservatórios',
      'Capacidade de suporte estático de até 200 kg'
    ],
    description: 'Vaso sanitário químico portátil oficial Seaflo 20L (modelo SFPT-20-02). Desenvolvido com plástico ABS de alto impacto, tampa com fechamento suave, sistema hermético antivazamento e dimensões compactas ideais para gavetões de campervan na Fiat Doblò.',
    isDefault: true
  },
  {
    id: 'seaflo-10l-compact',
    name: 'Vaso Sanitário Químico Seaflo 10L (Compacto)',
    brand: 'Seaflo',
    model: 'SFPT-10-01',
    wasteCapacityLiters: 10,
    freshWaterCapacityLiters: 10,
    width: 404,
    depth: 353,
    height: 304,
    weightEmptyKg: 5.4,
    weightFullKg: 15.4,
    maxLoadKg: 200,
    material: 'Plástico ABS e Polietileno de Alta Densidade',
    hasSoftClose: true,
    flushType: 'Bomba de pistão manual (jato duplo 360°)',
    antiLeakValve: true,
    rotatingSpout: true,
    airReliefValve: true,
    levelIndicator: false,
    features: [
      'Perfil baixo com apenas 304 mm de altura (ideal para baús rasos)',
      'Tanque de dejetos de 10 Litros e água limpa de 10 Litros',
      'Tampa com fechamento suave Soft Close',
      'Válvula hermética dupla antivazamento'
    ],
    description: 'Versão de perfil baixo (304 mm de altura), perfeito para módulos ou gavetas onde a altura do móvel é limitada abaixo de 350 mm.',
    isDefault: true
  },
  {
    id: 'thetford-porta-potti-165',
    name: 'Thetford Porta Potti 165 Qube (21L)',
    brand: 'Thetford',
    model: 'Porta Potti Qube 165',
    wasteCapacityLiters: 21,
    freshWaterCapacityLiters: 15,
    width: 383,
    depth: 427,
    height: 414,
    weightEmptyKg: 3.9,
    weightFullKg: 24.9,
    maxLoadKg: 120,
    material: 'Polipropileno moldado de alta densidade',
    hasSoftClose: false,
    flushType: 'Bomba de fole manual sanfonada',
    antiLeakValve: true,
    rotatingSpout: true,
    airReliefValve: true,
    levelIndicator: false,
    features: [
      'Tanque de dejetos de 21 Litros e descarga de 15 Litros',
      'Bico rotativo integrado para drenagem higiênica',
      'Excelente confiabilidade tradicional da marca Thetford'
    ],
    description: 'Modelo clássico da Thetford com bomba de fole sanfonada manual e capacidade generosa de 21 Litros.',
    isDefault: true
  },
  {
    id: 'thetford-porta-potti-365',
    name: 'Thetford Porta Potti 365 Qube (Pistão + Nível)',
    brand: 'Thetford',
    model: 'Porta Potti Qube 365',
    wasteCapacityLiters: 21,
    freshWaterCapacityLiters: 15,
    width: 383,
    depth: 427,
    height: 414,
    weightEmptyKg: 4.0,
    weightFullKg: 25.0,
    maxLoadKg: 120,
    material: 'Polipropileno de alto impacto',
    hasSoftClose: false,
    flushType: 'Bomba de pistão manual de fluxo contínuo',
    antiLeakValve: true,
    rotatingSpout: true,
    airReliefValve: true,
    levelIndicator: true,
    features: [
      'Indicador de nível visual no tanque de dejetos',
      'Bomba de pistão de alta pressão',
      'Tanque de dejetos com 21 Litros'
    ],
    description: 'Versão premium da Thetford com acionamento por pistão e mostrador de nível visual do tanque de resíduos.',
    isDefault: true
  },
  {
    id: 'dometic-976',
    name: 'Dometic 976 Sanitário Químico Portátil (18.9L)',
    brand: 'Dometic',
    model: '976 Portable Toilet',
    wasteCapacityLiters: 18.9,
    freshWaterCapacityLiters: 8.7,
    width: 333,
    depth: 387,
    height: 387,
    weightEmptyKg: 5.9,
    weightFullKg: 24.8,
    maxLoadKg: 150,
    material: 'Plástico ABS com acabamento brilhante',
    hasSoftClose: false,
    flushType: 'Bomba pressurizada com botão de gatilho',
    antiLeakValve: true,
    rotatingSpout: true,
    airReliefValve: true,
    levelIndicator: true,
    features: [
      'Largura compacta de apenas 333 mm (excelente para nichos estreitos)',
      'Sistema de pressurização prévia com botão de descarga tipo gatilho',
      'Indicador de nível de retenção prismático'
    ],
    description: 'Sanitário compacto da Dometic com sistema de acúmulo de pressão no tanque de água, permitindo descarga com um toque de botão.',
    isDefault: true
  }
];

const PORTAPOTTI_PRESETS_STORAGE_KEY = 'doblo_portapotti_presets';
const ACTIVE_PORTAPOTTI_PRESET_KEY = 'doblo_active_portapotti_preset_id';

let memoryPortaPottiPresets: PortaPottiPreset[] = [...DEFAULT_PORTAPOTTI_PRESETS];
let memoryActivePresetId: string = DEFAULT_PORTAPOTTI_PRESETS[0].id;

export function loadPortaPottiPresets(): PortaPottiPreset[] {
  try {
    const raw = localStorage.getItem(PORTAPOTTI_PRESETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryPortaPottiPresets = parsed;
        return parsed;
      }
    }
  } catch { }

  dbGet<PortaPottiPreset[]>(PORTAPOTTI_PRESETS_STORAGE_KEY).then((fromDb) => {
    if (fromDb && Array.isArray(fromDb) && fromDb.length > 0) {
      memoryPortaPottiPresets = fromDb;
    }
  }).catch(() => { });

  return memoryPortaPottiPresets;
}

export function savePortaPottiPresets(presets: PortaPottiPreset[]): void {
  memoryPortaPottiPresets = presets;
  try {
    localStorage.setItem(PORTAPOTTI_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch { }
  dbSet(PORTAPOTTI_PRESETS_STORAGE_KEY, presets).catch(() => { });
}

export function loadActivePortaPottiPresetId(): string {
  try {
    const raw = localStorage.getItem(ACTIVE_PORTAPOTTI_PRESET_KEY);
    if (raw) {
      memoryActivePresetId = raw;
      return raw;
    }
  } catch { }

  dbGet<string>(ACTIVE_PORTAPOTTI_PRESET_KEY).then((fromDb) => {
    if (fromDb) memoryActivePresetId = fromDb;
  }).catch(() => { });

  return memoryActivePresetId;
}

export function saveActivePortaPottiPresetId(id: string): void {
  memoryActivePresetId = id;
  try {
    localStorage.setItem(ACTIVE_PORTAPOTTI_PRESET_KEY, id);
  } catch { }
  dbSet(ACTIVE_PORTAPOTTI_PRESET_KEY, id).catch(() => { });
}

export function resetPortaPottiPresets(): PortaPottiPreset[] {
  const defaults = [...DEFAULT_PORTAPOTTI_PRESETS];
  savePortaPottiPresets(defaults);
  saveActivePortaPottiPresetId(defaults[0].id);
  return defaults;
}
