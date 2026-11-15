import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_FRIDGE_PRESETS,
  loadFridgePresets,
  saveFridgePresets,
  loadActiveFridgePresetId,
  saveActiveFridgePresetId,
  resetFridgePresets
} from '../src/data/fridgePresets';
import { FridgePreset } from '../src/types';

// Simple localStorage mock for Node environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, val: string) => { store[key] = String(val); },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
(globalThis as any).localStorage = localStorageMock;

describe('FridgePresets Data & Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Deve conter a Geladeira Resfri Ar 35L como preset padrão e padrão default', () => {
    const resfriAr35 = DEFAULT_FRIDGE_PRESETS.find(p => p.id === 'resfriar-35l');
    expect(resfriAr35).toBeDefined();
    expect(resfriAr35?.brand).toBe('Resfri Ar');
    expect(resfriAr35?.model).toBe('Geladeira Portátil 35L');
    expect(resfriAr35?.partNumber).toBe('307.0035');
    expect(resfriAr35?.asin).toBe('B0F8RHX4S7');
    expect(resfriAr35?.volumeLiters).toBe(35);
    expect(resfriAr35?.width).toBe(378);
    expect(resfriAr35?.depth).toBe(652);
    expect(resfriAr35?.height).toBe(386);
    expect(resfriAr35?.powerEcoWatts).toBe(48);
    expect(resfriAr35?.powerMaxWatts).toBe(60);
    expect(resfriAr35?.bluetooth).toBe(true);
    expect(resfriAr35?.bluetoothApp).toBe('App Resfri Ar Experience');
    expect(resfriAr35?.isDefault).toBe(true);
  });

  it('2. Deve carregar e salvar presets no localStorage corretamente', () => {
    const initial = loadFridgePresets();
    expect(initial.length).toBeGreaterThanOrEqual(5);

    const customPreset: FridgePreset = {
      id: 'custom-fridge-50l',
      name: 'Custom 50L Freezer',
      brand: 'CustomBrand',
      model: 'CB-50',
      volumeLiters: 50,
      width: 400,
      depth: 700,
      height: 450,
      weightKg: 15,
      voltage: '12/24V DC',
      powerEcoWatts: 50,
      powerMaxWatts: 65,
      ratedWatts: 50,
      dutyCyclePercent: 40,
      dailyHours: 9.6,
      current12V: '4.2A',
      current24V: '2.1A',
      tempRange: '+10°C a -20°C',
      refrigerantGas: 'R134a',
      insulation: 'CP',
      bluetooth: false,
      digitalController: true,
      internalLed: true,
      tempSensor: true,
      batteryProtection: 'Alta / Baixa',
      removableDivider: true,
      drainPlug: true,
      warranty: '1 Ano',
      features: ['Controle Digital'],
      description: 'Geladeira personalizada'
    };

    saveFridgePresets([...initial, customPreset]);
    const reloaded = loadFridgePresets();
    expect(reloaded.some(p => p.id === 'custom-fridge-50l')).toBe(true);
  });

  it('3. Deve gerenciar activeFridgePresetId no localStorage', () => {
    expect(loadActiveFridgePresetId()).toBe('resfriar-35l');
    saveActiveFridgePresetId('alpicool-c35');
    expect(loadActiveFridgePresetId()).toBe('alpicool-c35');
  });

  it('4. Deve restaurar presets originais de fábrica com resetFridgePresets', () => {
    saveActiveFridgePresetId('custom-id');
    const resetList = resetFridgePresets();
    expect(resetList.length).toBe(DEFAULT_FRIDGE_PRESETS.length);
    expect(loadActiveFridgePresetId()).toBe('resfriar-35l');
  });
});
