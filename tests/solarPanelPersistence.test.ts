import { describe, it, expect, beforeEach, vi } from 'vitest';

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, val: string) => { store[key] = String(val); },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
(globalThis as any).localStorage = localStorageMock;
(globalThis as any).window = globalThis;

import { dbClear } from '../src/data/db';
import { SolarPersistence, getSavedConfigSync } from '../src/context/solar/SolarPersistence';
import { SavedConfig } from '../src/types';

describe('Solar Panel Number Persistence', () => {
  beforeEach(async () => {
    localStorageMock.clear();
    await dbClear();
  });

  it('getSavedConfigSync should read synchronously from localStorage', () => {
    const mockConfig: Partial<SavedConfig> = {
      stackLevels: 2,
      level1: { panels: 3, direction: 'longitudinal', orientation: 'longitudinal' },
      level2: { panels: 4, direction: 'fixed', orientation: 'longitudinal' }
    };
    localStorageMock.setItem('doblo_solar_config', JSON.stringify(mockConfig));

    const syncConfig = getSavedConfigSync();
    expect(syncConfig).not.toBeNull();
    expect(syncConfig?.level1?.panels).toBe(3);
    expect(syncConfig?.level2?.panels).toBe(4);
    expect(syncConfig?.stackLevels).toBe(2);
  });

  it('saveConfig should persist to localStorage synchronously', () => {
    const configToSave: SavedConfig = {
      stackLevels: 2,
      level1: { panels: 3, direction: 'longitudinal', orientation: 'longitudinal' },
      level2: { panels: 1, direction: 'fixed', orientation: 'longitudinal' },
      structureMaterial: 'aluminum',
      aluminumColor: 'black',
      offsetZ: -1.20,
      offsetY: -0.14
    };

    SolarPersistence.saveConfig(configToSave);

    const stored = localStorageMock.getItem('doblo_solar_config');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.level1.panels).toBe(3);
    expect(parsed.level2.panels).toBe(1);
  });

  it('restoreConfig should update sceneManager directly if sceneManager is passed', async () => {
    const mockConfig: SavedConfig = {
      stackLevels: 2,
      level1: { panels: 3, direction: 'lateral', orientation: 'transverse' },
      level2: { panels: 4, direction: 'fixed', orientation: 'longitudinal' },
      structureMaterial: 'steel',
      aluminumColor: 'silver',
      offsetZ: -1.20,
      offsetY: -0.14
    };
    localStorageMock.setItem('doblo_solar_config', JSON.stringify(mockConfig));

    const setLevel1State = vi.fn();
    const setLevel2State = vi.fn();
    const setStackLevelsState = vi.fn();
    const mockSolarSystem = {
      setLevel1Panels: vi.fn(),
      setLevel1Direction: vi.fn(),
      setLevel1Orientation: vi.fn(),
      setLevel2Panels: vi.fn(),
      setLevel2Direction: vi.fn(),
      setLevel2Orientation: vi.fn(),
      setStackLevels: vi.fn(),
      setStructureMaterial: vi.fn(),
      setCargoBox: vi.fn(),
      setWaterTank: vi.fn(),
      setAwningConfig: vi.fn(),
      setGroupOffsetZ: vi.fn(),
      setGroupOffsetY: vi.fn(),
      setSteelProfileUnit: vi.fn()
    };
    const mockSceneManager = {
      solarSystem: mockSolarSystem,
      setExpansion: vi.fn()
    };
    const updateCalculations = vi.fn();

    await SolarPersistence.restoreConfig({
      setStackLevelsState,
      setLevel1State,
      setLevel2State,
      setStructureMaterialState: vi.fn(),
      setSteelProfileUnitState: vi.fn(),
      setAluminumColorState: vi.fn(),
      setMetalonColorState: vi.fn(),
      setMetalonWallThicknessState: vi.fn(),
      setMetalonThickness40State: vi.fn(),
      setMetalonThickness30State: vi.fn(),
      setCargoBoxState: vi.fn(),
      setWaterTankState: vi.fn(),
      setAwningState: vi.fn(),
      setB2BCharger: vi.fn(),
      setActivePanelPresetIdState: vi.fn(),
      setActiveCargoPresetIdState: vi.fn(),
      setOffsetZState: vi.fn(),
      setOffsetYState: vi.fn(),
      setExpansionProgressState: vi.fn(),
      setPanelPresetsState: vi.fn(),
      setCargoBoxPresetsState: vi.fn(),
      setInternalGridState: vi.fn(),
      setInternalBoxesState: vi.fn(),
      setPartsFilterState: vi.fn(),
      loadPanelPresets: () => [],
      loadCargoBoxPresets: () => [],
      sceneManager: mockSceneManager,
      updateCalculations
    });

    expect(setLevel1State).toHaveBeenCalledWith(expect.objectContaining({ panels: 3 }));
    expect(setLevel2State).toHaveBeenCalledWith(expect.objectContaining({ panels: 4 }));
    expect(mockSolarSystem.setLevel1Panels).toHaveBeenCalledWith(3);
    expect(mockSolarSystem.setLevel2Panels).toHaveBeenCalledWith(4);
    expect(updateCalculations).toHaveBeenCalled();
  });

  it('restoreConfig should migrate legacy formats like panelsPerLevel', async () => {
    const legacyConfig = {
      stackLevels: 1,
      panelsPerLevel: 3,
      level2Panels: 2
    };
    localStorageMock.setItem('doblo_solar_config', JSON.stringify(legacyConfig));

    const setLevel1State = vi.fn();
    const setLevel2State = vi.fn();

    await SolarPersistence.restoreConfig({
      setStackLevelsState: vi.fn(),
      setLevel1State,
      setLevel2State,
      setStructureMaterialState: vi.fn(),
      setSteelProfileUnitState: vi.fn(),
      setAluminumColorState: vi.fn(),
      setMetalonColorState: vi.fn(),
      setMetalonWallThicknessState: vi.fn(),
      setMetalonThickness40State: vi.fn(),
      setMetalonThickness30State: vi.fn(),
      setCargoBoxState: vi.fn(),
      setWaterTankState: vi.fn(),
      setAwningState: vi.fn(),
      setB2BCharger: vi.fn(),
      setActivePanelPresetIdState: vi.fn(),
      setActiveCargoPresetIdState: vi.fn(),
      setOffsetZState: vi.fn(),
      setOffsetYState: vi.fn(),
      setExpansionProgressState: vi.fn(),
      setPanelPresetsState: vi.fn(),
      setCargoBoxPresetsState: vi.fn(),
      setInternalGridState: vi.fn(),
      setInternalBoxesState: vi.fn(),
      setPartsFilterState: vi.fn(),
      loadPanelPresets: () => [],
      loadCargoBoxPresets: () => []
    });

    expect(setLevel1State).toHaveBeenCalledWith(expect.objectContaining({ panels: 3 }));
    expect(setLevel2State).toHaveBeenCalledWith(expect.objectContaining({ panels: 2 }));
  });
});
