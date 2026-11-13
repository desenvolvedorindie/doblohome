import { SolarPanelPreset } from '../types';
import { dbGet, dbSet } from './db';

export const DEFAULT_SOLAR_PANEL_PRESETS: SolarPanelPreset[] = [
  {
    id: 'inohouse-100w',
    name: 'Placa Solar Flexível Inohouse 100W (JTN-100W)',
    brand: 'Inohouse',
    model: 'JTN-100W',
    powerWatts: 100,
    vmp: 15.0,
    imp: 6.67,
    voc: 18.0,
    isc: 7.32,
    maxSystemVoltage: 1500,
    efficiencyPercent: 22.3,
    cellType: 'Silício Monocristalino',
    cellCount: 32,
    cols: 4,
    rows: 8,
    material: 'ETFE',
    width: 0.590,     // 590 mm
    length: 0.875,    // 875 mm
    thickness: 0.003, // 3 mm
    weightKg: 1.8,
    connector: 'MC4 ou compatível com MC4',
    features: [
      'Potência máxima: 100W | Eficiência: 22,3%',
      'Vmp: 15V | Imp: 6,67A | Voc: 18V | Isc: 7,32A',
      'Tensão máxima do sistema: 1500VDC',
      'Tecnologia: Silício monocristalino com revestimento ETFE',
      'Dimensões: 875 × 590 × 3 mm | Vida útil estimada: +10 anos',
      'Formas de fixação: cola, amarração ou parafusos'
    ],
    description:
      'A Placa Solar Flexível Inohouse 100W é uma solução leve, fina e versátil para aplicações onde painéis rígidos tradicionais não são a melhor opção. Fabricada com células de silício monocristalino e revestimento ETFE, oferece boa eficiência, resistência e flexibilidade para instalação em superfícies curvas ou com limitação de peso. É indicada para motorhomes, trailers, embarcações, vans, telhados leves e sistemas off-grid, permitindo instalação por cola, amarração ou parafusos, conforme a aplicação. Compacta e fácil de instalar, é uma excelente opção para quem busca geração solar com baixo peso e maior liberdade de aplicação.',
    isDefault: true
  },
  {
    id: 'inohouse-200w',
    name: 'Placa Solar Flexível Inohouse 200W Monocristalino',
    brand: 'Inohouse',
    model: 'JTN-200W',
    powerWatts: 200,
    vmp: 30.0,
    imp: 6.79,
    voc: 36.2,
    isc: 7.35,
    maxSystemVoltage: 1500,
    efficiencyPercent: 22.3,
    cellType: 'Monocristalino',
    cellCount: 27,
    cols: 3,
    rows: 9,
    material: 'ETFE',
    width: 0.880,     // 880 mm
    length: 1.145,    // 1145 mm
    thickness: 0.003, // 3 mm
    weightKg: 4.0,
    connector: 'MC4 ou compatível com MC4 (Cabo 4mm² 30cm | Caixa IP67)',
    features: [
      'Potência Nominal (P.max): 200W | Maior eficiência do mercado: 22,3%',
      'Tensão Voc: 36,2V | Vmp: 30V | Corrente Imp: 6,79A',
      'Tensão máxima do sistema: 1500VDC | Temperatura de operação: -40~+85°C',
      'Composição: ETFE (maior durabilidade) | Número de células: 27 (Monocristalino)',
      'Dimensões do módulo: 1145 × 880 mm | Peso: 4 kg',
      'Caixa de Conexão: IP67 | Cabo: 4mm² cabo 30cm | Conector: MC4'
    ],
    description:
      'Placa solar FLEXÍVEL 200W MONOCRISTALINO com maior eficiência do mercado (22,3%). Feita de ETFE, melhor material do mercado e maior durabilidade. Características mecânicas: 27 células monocristalinas, dimensões 1145 × 880 mm, peso de 4 kg, caixa de conexão IP67, cabo 4mm² de 30cm e conector MC4 ou compatível.',
    isDefault: true
  }
];

const PRESETS_STORAGE_KEY = 'doblo_solar_panel_presets';
const ACTIVE_PRESET_KEY = 'doblo_solar_active_preset_id';
const LEGACY_DEFAULT_IDS = new Set(['flex-100w-padrao', 'resun-100w-flex', 'flex-200w-inmetro']);

let memoryPanelPresets: SolarPanelPreset[] = [...DEFAULT_SOLAR_PANEL_PRESETS];
let memoryActivePresetId: string = DEFAULT_SOLAR_PANEL_PRESETS[0].id;

if (typeof window !== 'undefined') {
  dbGet<SolarPanelPreset[]>(PRESETS_STORAGE_KEY).then((data) => {
    if (data && Array.isArray(data) && data.length > 0) {
      const defaultIds = new Set(DEFAULT_SOLAR_PANEL_PRESETS.map(d => d.id));
      const customOnly = data.filter(
        (p: SolarPanelPreset) => !p.isDefault && !defaultIds.has(p.id) && !LEGACY_DEFAULT_IDS.has(p.id)
      );
      memoryPanelPresets = [...DEFAULT_SOLAR_PANEL_PRESETS, ...customOnly];
    }
  });

  dbGet<string>(ACTIVE_PRESET_KEY).then((id) => {
    if (id === 'flex-200w-inmetro') memoryActivePresetId = 'inohouse-200w';
    else if (id && LEGACY_DEFAULT_IDS.has(id)) memoryActivePresetId = 'inohouse-100w';
    else if (id) memoryActivePresetId = id;
  });
}

/**
 * Carrega a lista de presets salvos no banco de dados
 */
export function loadPanelPresets(): SolarPanelPreset[] {
  return [...memoryPanelPresets];
}

/**
 * Salva a lista de presets no banco de dados (IndexedDB)
 */
export function savePanelPresets(presets: SolarPanelPreset[]): void {
  memoryPanelPresets = presets;
  dbSet(PRESETS_STORAGE_KEY, presets);
}

/**
 * Carrega o ID do preset ativo salvo
 */
export function loadActivePresetId(): string {
  return memoryActivePresetId;
}

/**
 * Salva o ID do preset ativo no banco de dados (IndexedDB)
 */
export function saveActivePresetId(id: string): void {
  memoryActivePresetId = id;
  dbSet(ACTIVE_PRESET_KEY, id);
}

