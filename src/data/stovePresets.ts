import { StovePreset } from '../types';
import { dbGet, dbSet } from './db';

export const DEFAULT_STOVE_PRESETS: StovePreset[] = [
  {
    id: 'ntk-duo-ceramik',
    name: 'Fogareiro Portátil NTK Duo Ceramik (Padrão)',
    brand: 'NTK (Nautika)',
    model: 'Duo Ceramik',
    burnersCount: 1,
    burnerType: 'Cerâmica Infravermelho',
    fuelType: 'Flex Fuel (Cartucho Campgás 227g / Botijão GLP)',
    gasConsumptionGh: 145,
    ignitionType: 'Piezoelétrico Automático (Sem Fósforo)',
    width: 350,   // Largura (L) em mm
    depth: 330,   // Profundidade (P) em mm
    height: 90,   // Altura (A) em mm
    weightKg: 2.2,
    material: 'Aço esmaltado com pintura epóxi e base em enamel atóxico',
    hasCarryCase: true,
    dualFuelAdapter: true,
    windResistant: true,
    safetyLock: true,
    features: [
      'Sistema Flex Fuel: compatível com cartucho Campgás ou botijão de gás tradicional (GLP)',
      'Queimador em cerâmica infravermelho: chama uniforme, maior economia e alta resistência ao vento',
      'Ignição automática por sistema Piezo (acionamento com um clique)',
      'Trava de segurança integrada para controle do fluxo e acoplamento de gás',
      'Consumo econômico aproximado de 145 g/h com regulagem fina de chama',
      'Apoio de panela removível e base em enamel atóxico para fácil limpeza',
      'Acompanha maleta plástica rígida para transporte e guarda segura na campervan'
    ],
    description: 'Fogareiro portátil NTK Duo Ceramik (Nautika) Flex Fuel com queimador cerâmico de alta eficiência térmica, resistente ao vento e acendimento piezoelétrico automático. Ideal para cozinhas modulares, bandejas corrediças ou mesas rebatíveis em campervans.',
    isDefault: true
  },
  {
    id: 'ntk-frontier',
    name: 'Fogareiro Portátil NTK Frontier Flex (1 Boca)',
    brand: 'NTK (Nautika)',
    model: 'Frontier Flex',
    burnersCount: 1,
    burnerType: 'Queimador Tradicional em Alumínio',
    fuelType: 'Flex Fuel (Cartucho Campgás 227g / Botijão GLP)',
    gasConsumptionGh: 145,
    ignitionType: 'Piezoelétrico Automático',
    width: 340,
    depth: 280,
    height: 85,
    weightKg: 1.8,
    material: 'Aço esmaltado epóxi com base em aço galvanizado',
    hasCarryCase: true,
    dualFuelAdapter: true,
    windResistant: false,
    safetyLock: true,
    features: [
      'Compacto de 340 × 280 mm com apenas 1,8 kg',
      'Compatível com cartucho Campgás ou botijão de gás tradicional via adaptador',
      'Ignição automática Piezoelétrica com regulador de chama',
      'Acompanha maleta de transporte'
    ],
    description: 'Modelo clássico e leve da Nautika com largura reduzida (280 mm de profundidade), excelente para gavetas e bancadas estreitas.',
    isDefault: true
  },
  {
    id: 'ntk-bistro-inox',
    name: 'Fogareiro Portátil NTK Bistro Inox',
    brand: 'NTK (Nautika)',
    model: 'Bistro Inox',
    burnersCount: 1,
    burnerType: 'Coroa em Liga de Alumínio',
    fuelType: 'Cartucho de Gás Campgás 227g',
    gasConsumptionGh: 150,
    ignitionType: 'Piezoelétrico Automático',
    width: 345,
    depth: 280,
    height: 90,
    weightKg: 1.9,
    material: 'Corpo em aço inoxidável escovado',
    hasCarryCase: true,
    dualFuelAdapter: false,
    windResistant: false,
    safetyLock: true,
    features: [
      'Estrutura em aço inox de fácil higienização e alta durabilidade contra maresia',
      'Sistema de trava de segurança e corte automático por sobrepressão',
      'Acompanha maleta plástica rígida'
    ],
    description: 'Fogareiro portátil com acabamento em aço inoxidável para uso com cartucho aerossol tipo Campgás.',
    isDefault: true
  },
  {
    id: 'duplo-camper-2b',
    name: 'Fogareiro Duplo 2 Bocas Compacto Camper',
    brand: 'Camper Line',
    model: 'Twin Burn 2B',
    burnersCount: 2,
    burnerType: '2× Queimadores de Alta Potência',
    fuelType: 'Botijão GLP (Baixa Pressão)',
    gasConsumptionGh: 290,
    ignitionType: 'Piezoelétrico Automático Duplo',
    width: 620,
    depth: 340,
    height: 100,
    weightKg: 4.2,
    material: 'Aço esmaltado reforçado com grelha em ferro esmaltado',
    hasCarryCase: false,
    dualFuelAdapter: false,
    windResistant: true,
    safetyLock: true,
    features: [
      '2 bocas simultâneas para preparo completo de refeições na estrada',
      'Controles independentes com acendimento automático Piezo',
      'Ligação direta em botijão P2/P5/P13 com válvula reguladora de baixa pressão'
    ],
    description: 'Fogareiro de 2 bocas para cozinhas de campervan com bancadas ou gavetões largos acima de 620 mm.',
    isDefault: true
  }
];

const STOVE_PRESETS_STORAGE_KEY = 'doblo_stove_presets';
const ACTIVE_STOVE_PRESET_KEY = 'doblo_active_stove_preset_id';

let memoryStovePresets: StovePreset[] = [...DEFAULT_STOVE_PRESETS];
let memoryActivePresetId: string = DEFAULT_STOVE_PRESETS[0].id;

export function loadStovePresets(): StovePreset[] {
  try {
    const raw = localStorage.getItem(STOVE_PRESETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryStovePresets = parsed;
        return parsed;
      }
    }
  } catch { }

  dbGet<StovePreset[]>(STOVE_PRESETS_STORAGE_KEY).then((fromDb) => {
    if (fromDb && Array.isArray(fromDb) && fromDb.length > 0) {
      memoryStovePresets = fromDb;
    }
  }).catch(() => { });

  return memoryStovePresets;
}

export function saveStovePresets(presets: StovePreset[]): void {
  memoryStovePresets = presets;
  try {
    localStorage.setItem(STOVE_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch { }
  dbSet(STOVE_PRESETS_STORAGE_KEY, presets).catch(() => { });
}

export function loadActiveStovePresetId(): string {
  try {
    const raw = localStorage.getItem(ACTIVE_STOVE_PRESET_KEY);
    if (raw) {
      memoryActivePresetId = raw;
      return raw;
    }
  } catch { }

  dbGet<string>(ACTIVE_STOVE_PRESET_KEY).then((fromDb) => {
    if (fromDb) memoryActivePresetId = fromDb;
  }).catch(() => { });

  return memoryActivePresetId;
}

export function saveActiveStovePresetId(id: string): void {
  memoryActivePresetId = id;
  try {
    localStorage.setItem(ACTIVE_STOVE_PRESET_KEY, id);
  } catch { }
  dbSet(ACTIVE_STOVE_PRESET_KEY, id).catch(() => { });
}

export function resetStovePresets(): StovePreset[] {
  const defaults = [...DEFAULT_STOVE_PRESETS];
  saveStovePresets(defaults);
  saveActiveStovePresetId(defaults[0].id);
  return defaults;
}
