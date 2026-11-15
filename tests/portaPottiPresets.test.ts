import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_PORTAPOTTI_PRESETS,
  loadPortaPottiPresets,
  savePortaPottiPresets,
  loadActivePortaPottiPresetId,
  saveActivePortaPottiPresetId,
  resetPortaPottiPresets
} from '../src/data/portaPottiPresets';
import { PortaPottiPreset } from '../src/types';

// Mock localStorage for Node test runner
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, val: string) => { store[key] = String(val); },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
(globalThis as any).localStorage = localStorageMock;

describe('PortaPottiPresets Data & Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('1. Deve conter o Vaso Sanitário Químico Seaflo 20L (SFPT-20-02) como preset padrão', () => {
    const seaflo20 = DEFAULT_PORTAPOTTI_PRESETS.find(p => p.id === 'seaflo-20l');
    expect(seaflo20).toBeDefined();
    expect(seaflo20?.brand).toBe('Seaflo');
    expect(seaflo20?.model).toBe('SFPT-20-02');
    expect(seaflo20?.wasteCapacityLiters).toBe(20);
    expect(seaflo20?.freshWaterCapacityLiters).toBe(13);
    expect(seaflo20?.width).toBe(404);
    expect(seaflo20?.depth).toBe(353);
    expect(seaflo20?.height).toBe(390);
    expect(seaflo20?.weightEmptyKg).toBe(6.7);
    expect(seaflo20?.hasSoftClose).toBe(true);
    expect(seaflo20?.antiLeakValve).toBe(true);
    expect(seaflo20?.rotatingSpout).toBe(true);
    expect(seaflo20?.airReliefValve).toBe(true);
    expect(seaflo20?.isDefault).toBe(true);
  });

  it('2. Deve carregar e salvar presets no storage corretamente', () => {
    const initial = loadPortaPottiPresets();
    expect(initial.length).toBeGreaterThanOrEqual(5);

    const customPreset: PortaPottiPreset = {
      id: 'custom-toilet-22l',
      name: 'Custom Camper Toilet 22L',
      brand: 'CamperBrand',
      model: 'CT-22',
      wasteCapacityLiters: 22,
      freshWaterCapacityLiters: 14,
      width: 410,
      depth: 360,
      height: 400,
      weightEmptyKg: 7.0,
      weightFullKg: 29.0,
      maxLoadKg: 200,
      material: 'ABS',
      hasSoftClose: true,
      flushType: 'Pistão',
      antiLeakValve: true,
      rotatingSpout: true,
      airReliefValve: true,
      levelIndicator: true,
      features: ['Tampa soft close'],
      description: 'Sanitário customizado'
    };

    savePortaPottiPresets([...initial, customPreset]);
    const reloaded = loadPortaPottiPresets();
    expect(reloaded.some(p => p.id === 'custom-toilet-22l')).toBe(true);
  });

  it('3. Deve gerenciar activePortaPottiPresetId no storage', () => {
    expect(loadActivePortaPottiPresetId()).toBe('seaflo-20l');
    saveActivePortaPottiPresetId('seaflo-10l-compact');
    expect(loadActivePortaPottiPresetId()).toBe('seaflo-10l-compact');
  });

  it('4. Deve restaurar presets de fábrica com resetPortaPottiPresets', () => {
    saveActivePortaPottiPresetId('custom-toilet-id');
    const resetList = resetPortaPottiPresets();
    expect(resetList.length).toBe(DEFAULT_PORTAPOTTI_PRESETS.length);
    expect(loadActivePortaPottiPresetId()).toBe('seaflo-20l');
  });
});
