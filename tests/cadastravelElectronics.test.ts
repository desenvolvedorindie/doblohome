import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_BATTERY_PRESETS,
  loadBatteryPresets,
  saveBatteryPresets,
  loadActiveBatteryPresetId,
  saveActiveBatteryPresetId,
  resetBatteryPresets
} from '../src/data/batteryPresets';
import {
  DEFAULT_MPPT_PRESETS,
  loadMpptPresets,
  saveMpptPresets,
  loadActiveMpptPresetId,
  saveActiveMpptPresetId,
  resetMpptPresets
} from '../src/data/mpptPresets';
import {
  DEFAULT_B2B_PRESETS,
  loadB2bPresets,
  saveB2bPresets,
  loadActiveB2bPresetId,
  saveActiveB2bPresetId,
  resetB2bPresets
} from '../src/data/b2bPresets';
import { buildSystemFixedTemplates } from '../src/utils/electricalCatalog';
import { BatteryPreset, MpptPreset, B2bPreset } from '../src/types';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, val: string) => { store[key] = String(val); },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
(globalThis as any).localStorage = localStorageMock;

describe('Componentes Cadastráveis: Bateria, MPPT e B2B', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Presets de Bateria', () => {
    it('deve carregar a bateria padrão Kingbo 560Ah', () => {
      const presets = loadBatteryPresets();
      expect(presets.length).toBeGreaterThanOrEqual(1);
      const def = presets.find(p => p.isDefault);
      expect(def).toBeDefined();
      expect(def?.capacityAh).toBe(560);
      expect(def?.voltageNominal).toBe(12.8);
      expect(def?.bmsAmps).toBe(200);
      expect(def?.chemistry).toBe('LiFePO4');
    });

    it('deve salvar e carregar nova bateria customizada', () => {
      const custom: BatteryPreset = {
        id: 'bat_custom_200ah',
        name: 'Bateria LiFePO4 200Ah Compacta',
        brand: 'LifePower',
        model: 'LP-12200',
        chemistry: 'LiFePO4',
        voltageNominal: 12.8,
        capacityAh: 200,
        bmsAmps: 150,
        dimensionsMm: { width: 175, height: 215, depth: 330 },
        weightKg: 21
      };

      const list = [...loadBatteryPresets(), custom];
      saveBatteryPresets(list);

      const loaded = loadBatteryPresets();
      expect(loaded.find(p => p.id === 'bat_custom_200ah')).toBeDefined();
      expect(loaded.find(p => p.id === 'bat_custom_200ah')?.capacityAh).toBe(200);
    });

    it('deve persistir active battery preset ID', () => {
      saveActiveBatteryPresetId('bat_custom_200ah');
      expect(loadActiveBatteryPresetId()).toBe('bat_custom_200ah');
    });

    it('deve restaurar presets para default', () => {
      saveBatteryPresets([]);
      const restored = resetBatteryPresets();
      expect(restored.length).toBe(DEFAULT_BATTERY_PRESETS.length);
      expect(restored[0].id).toBe(DEFAULT_BATTERY_PRESETS[0].id);
    });
  });

  describe('2. Presets de Controlador MPPT', () => {
    it('deve carregar o MPPT padrão Kingbo 60A', () => {
      const presets = loadMpptPresets();
      expect(presets.length).toBeGreaterThanOrEqual(1);
      const def = presets.find(p => p.isDefault);
      expect(def).toBeDefined();
      expect(def?.maxAmps).toBe(60);
      expect(def?.maxPvVoltage).toBe(230);
    });

    it('deve cadastrar um novo MPPT de 40A', () => {
      const custom: MpptPreset = {
        id: 'mppt_custom_40a',
        name: 'Victron SmartSolar 100/30',
        brand: 'Victron Energy',
        model: 'SmartSolar MPPT 100/30',
        maxAmps: 30,
        maxPvVoltage: 100,
        dimensionsMm: { width: 130, height: 186, depth: 70 },
        weightKg: 1.3
      };

      const list = [...loadMpptPresets(), custom];
      saveMpptPresets(list);

      const loaded = loadMpptPresets();
      expect(loaded.find(p => p.id === 'mppt_custom_40a')).toBeDefined();
      expect(loaded.find(p => p.id === 'mppt_custom_40a')?.maxAmps).toBe(30);
    });
  });

  describe('3. Presets de Carregador DC-DC B2B', () => {
    it('deve carregar o B2B padrão 30A', () => {
      const presets = loadB2bPresets();
      expect(presets.length).toBeGreaterThanOrEqual(1);
      const def = presets.find(p => p.isDefault);
      expect(def).toBeDefined();
      expect(def?.chargingAmps).toBe(30);
      expect(def?.voltageIn).toBe(12);
      expect(def?.voltageOut).toBe(14.4);
    });

    it('deve cadastrar um novo carregador B2B de 50A', () => {
      const custom: B2bPreset = {
        id: 'b2b_custom_50a',
        name: 'Renogy DC-DC 50A',
        brand: 'Renogy',
        model: 'RBC50D1S',
        chargingAmps: 50,
        voltageIn: 12,
        voltageOut: 14.6,
        dimensionsMm: { width: 244, height: 146, depth: 77 },
        weightKg: 2.4
      };

      const list = [...loadB2bPresets(), custom];
      saveB2bPresets(list);

      const loaded = loadB2bPresets();
      expect(loaded.find(p => p.id === 'b2b_custom_50a')).toBeDefined();
      expect(loaded.find(p => p.id === 'b2b_custom_50a')?.chargingAmps).toBe(50);
    });
  });

  describe('4. Integração com o Catálogo Elétrico 2D', () => {
    it('deve refletir a bateria cadastrada no catálogo', () => {
      const mockEnergyStats: any = { nominalPowerW: 400, voc: '44.56', panelCount: 4 };
      const mockB2b: any = { chargingAmps: 30, watts: 390 };
      const mockUsina: any = { modelRating: 120, voltageOut: 14.4 };

      const customBat: BatteryPreset = {
        id: 'bat_test',
        name: 'Bateria EVE 280Ah',
        brand: 'EVE Energy',
        model: 'LF280K',
        chemistry: 'LiFePO4',
        voltageNominal: 12.8,
        capacityAh: 280,
        bmsAmps: 150,
        dimensionsMm: { width: 200, height: 200, depth: 300 },
        weightKg: 22
      };

      const templates = buildSystemFixedTemplates(
        mockEnergyStats,
        mockB2b,
        mockUsina,
        customBat
      );

      const batTpl = templates.find(t => t.catalogId === 'sys_battery');
      expect(batTpl).toBeDefined();
      expect(batTpl?.label).toBe('Bateria EVE 280Ah');
      expect(batTpl?.amps).toBe(150);
      expect(batTpl?.watts).toBe(Math.round(280 * 12.8));
    });

    it('deve refletir o MPPT cadastrado no catálogo', () => {
      const mockEnergyStats: any = { nominalPowerW: 400, voc: '44.56', panelCount: 4 };
      const mockB2b: any = { chargingAmps: 30, watts: 390 };
      const mockUsina: any = { modelRating: 120, voltageOut: 14.4 };

      const customMppt: MpptPreset = {
        id: 'mppt_victron',
        name: 'Victron SmartSolar 100/50',
        brand: 'Victron Energy',
        model: '100/50',
        maxAmps: 50,
        maxPvVoltage: 100,
        dimensionsMm: { width: 130, height: 186, depth: 70 },
        weightKg: 1.3
      };

      const templates = buildSystemFixedTemplates(
        mockEnergyStats,
        mockB2b,
        mockUsina,
        undefined,
        customMppt
      );

      const mpptTpl = templates.find(t => t.catalogId === 'sys_mppt');
      expect(mpptTpl).toBeDefined();
      expect(mpptTpl?.label).toBe('Victron SmartSolar 100/50');
      expect(mpptTpl?.amps).toBe(50);
    });
  });
});
