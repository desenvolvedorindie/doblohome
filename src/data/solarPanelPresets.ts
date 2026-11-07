import { SolarPanelPreset } from '../types';

export const DEFAULT_SOLAR_PANEL_PRESETS: SolarPanelPreset[] = [
  {
    id: 'inohouse-100w',
    name: 'Placa Solar Flexível Inohouse 100W',
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
    material: 'Revestimento ETFE de Alta Resistência',
    width: 0.590,   // 590 mm
    length: 0.875,  // 875 mm
    thickness: 0.003, // 3 mm
    weightKg: 1.8,
    connector: 'Conectores MC4 ou compatíveis',
    features: [
      'Potência máxima 100W (Imp 6.67A | Vmp 15V)',
      'Células de Silício Monocristalino com 22.3% de eficiência',
      'Revestimento polimérico ETFE ultrafino de 3 mm',
      'Tensão Voc 18V | Tensão máx. de sistema até 1500VDC',
      'Fixação versátil: cola estrutural, amarração ou parafusos',
      'Vida útil estimada de mais de 10 anos'
    ],
    description: 'A Placa Solar Flexível Inohouse 100W (JTN-100W) é leve, fina e versátil, perfeita para aplicações onde painéis rígidos não são adequados, como vans, motorhomes e tetos com limite de peso.',
    isDefault: true
  },
  {
    id: 'flex-200w-inmetro',
    name: 'Placa Solar Flexível 200W Monocristalina (Inmetro)',
    brand: 'Monocristalina Inmetro',
    model: 'FLX-200W-60C',
    powerWatts: 200,
    vmp: 29.74,
    imp: 6.79,
    voc: 36.2,
    isc: 7.35,
    maxSystemVoltage: 1000,
    efficiencyPercent: 22.3,
    cellType: 'Monocristalina 60 Células',
    cellCount: 60,
    cols: 6,
    rows: 10,
    material: 'Polímero Flexível ETFE / Caixa IP67',
    width: 0.880,   // 880 mm
    length: 1.145,  // 1145 mm
    thickness: 0.003, // 3 mm
    weightKg: 4.0,
    connector: 'MC4 IP67 com cabo 2,5 mm² (100 cm)',
    features: [
      'Potência nominal 200W com Certificação Inmetro',
      '60 Células Monocristalinas de 22.3% de eficiência',
      'Tensão alta Vmp 29.74V | Voc 36.2V (alta performance MPPT)',
      'Corrente nominal Imp 6.79A | Isc 7.35A',
      'Caixa de conexão IP67 à prova d\'água',
      'Cabo solar 2.5 mm² com 100 cm e conectores MC4',
      'Faixa de temperatura de operação: -40°C a +85°C'
    ],
    description: 'A Placa Solar Flexível 200W Monocristalina com 60 células e selo Inmetro oferece excelente aproveitamento de área no teto da Fiat Doblò, gerando o dobro de energia por placa com peso de apenas 4 kg.',
    isDefault: true
  }
];

const PRESETS_STORAGE_KEY = 'doblo_solar_panel_presets';
const ACTIVE_PRESET_KEY = 'doblo_solar_active_preset_id';

/**
 * Carrega a lista de presets salvos no LocalStorage mesclando com os padrões
 */
export function loadPanelPresets(): SolarPanelPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Assegura que os presets padrões existam caso tenham sido atualizados
        const merged = [...parsed];
        DEFAULT_SOLAR_PANEL_PRESETS.forEach(def => {
          const idx = merged.findIndex(p => p.id === def.id);
          if (idx === -1) {
            merged.push(def);
          } else {
            // Atualiza campos padrão preservando eventuais ajustes
            merged[idx] = { ...def, ...merged[idx], isDefault: true };
          }
        });
        return merged;
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar presets de placas do localStorage:', e);
  }
  return [...DEFAULT_SOLAR_PANEL_PRESETS];
}

/**
 * Salva a lista de presets no LocalStorage
 */
export function savePanelPresets(presets: SolarPanelPreset[]): void {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    console.warn('Erro ao salvar presets de placas no localStorage:', e);
  }
}

/**
 * Carrega o ID do preset ativo salvo
 */
export function loadActivePresetId(): string {
  try {
    const id = localStorage.getItem(ACTIVE_PRESET_KEY);
    if (id) return id;
  } catch (e) {
    console.warn('Erro ao ler active preset id:', e);
  }
  return DEFAULT_SOLAR_PANEL_PRESETS[0].id;
}

/**
 * Salva o ID do preset ativo
 */
export function saveActivePresetId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PRESET_KEY, id);
  } catch (e) {
    console.warn('Erro ao salvar active preset id:', e);
  }
}

