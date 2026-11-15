import { useState } from 'react';
import { SolarPanelPreset, CargoBoxPreset, FridgePreset, PortaPottiPreset, StovePreset } from '../../types';
import {
  loadPanelPresets,
  savePanelPresets,
  loadActivePresetId,
  saveActivePresetId
} from '../../data/solarPanelPresets';
import {
  loadCargoBoxPresets,
  saveCargoBoxPresets,
  loadActiveCargoPresetId,
  saveActiveCargoPresetId
} from '../../data/cargoBoxPresets';
import {
  loadFridgePresets,
  saveFridgePresets,
  loadActiveFridgePresetId,
  saveActiveFridgePresetId,
  resetFridgePresets
} from '../../data/fridgePresets';
import {
  loadPortaPottiPresets,
  savePortaPottiPresets,
  loadActivePortaPottiPresetId,
  saveActivePortaPottiPresetId,
  resetPortaPottiPresets
} from '../../data/portaPottiPresets';
import {
  loadStovePresets,
  saveStovePresets,
  loadActiveStovePresetId,
  saveActiveStovePresetId,
  resetStovePresets
} from '../../data/stovePresets';

export function usePresetsManager(
  flashToast: (msg: string) => void,
  sceneManager: any,
  setCargoBox: (updates: any) => void,
  cargoBox: any,
  updateCalculations: () => void
) {
  // Presets de Placas Solares
  const [panelPresets, setPanelPresetsState] = useState<SolarPanelPreset[]>(() => loadPanelPresets());
  const [activePanelPresetId, setActivePanelPresetIdState] = useState<string>(() => loadActivePresetId());
  const activePanelPreset = panelPresets.find(p => p.id === activePanelPresetId) || panelPresets[0];

  // Presets de Baús de Teto
  const [cargoBoxPresets, setCargoBoxPresetsState] = useState<CargoBoxPreset[]>(() => loadCargoBoxPresets());
  const [activeCargoPresetId, setActiveCargoPresetIdState] = useState<string>(() => loadActiveCargoPresetId());
  const activeCargoBoxPreset = cargoBoxPresets.find(p => p.id === activeCargoPresetId) || cargoBoxPresets[0];

  // Presets de Geladeiras 12V / 24V Portáteis
  const [fridgePresets, setFridgePresetsState] = useState<FridgePreset[]>(() => loadFridgePresets());
  const [activeFridgePresetId, setActiveFridgePresetIdState] = useState<string>(() => loadActiveFridgePresetId());
  const activeFridgePreset = fridgePresets.find(p => p.id === activeFridgePresetId) || fridgePresets[0];

  // Presets de Porta Potti (Vaso Sanitário Químico)
  const [portaPottiPresets, setPortaPottiPresetsState] = useState<PortaPottiPreset[]>(() => loadPortaPottiPresets());
  const [activePortaPottiPresetId, setActivePortaPottiPresetIdState] = useState<string>(() => loadActivePortaPottiPresetId());
  const activePortaPottiPreset = portaPottiPresets.find(p => p.id === activePortaPottiPresetId) || portaPottiPresets[0];

  // Presets de Fogareiros Portáteis (NTK Duo Ceramik, etc.)
  const [stovePresets, setStovePresetsState] = useState<StovePreset[]>(() => loadStovePresets());
  const [activeStovePresetId, setActiveStovePresetIdState] = useState<string>(() => loadActiveStovePresetId());
  const activeStovePreset = stovePresets.find(p => p.id === activeStovePresetId) || stovePresets[0];

  const selectPanelPreset = (id: string) => {
    const found = panelPresets.find(p => p.id === id);
    if (!found) return;
    setActivePanelPresetIdState(id);
    saveActivePresetId(id);
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      sceneManager.solarSystem.setPanelSpecs({
        width: found.width,
        length: found.length,
        thickness: found.thickness,
        weightKg: found.weightKg,
        powerWatts: found.powerWatts,
        voc: found.voc,
        vmp: found.vmp,
        isc: found.isc,
        imp: found.imp,
        name: found.name,
        cellCount: found.cellCount,
        cols: found.cols,
        rows: found.rows
      });
      sceneManager.audio.playLockClick();
      updateCalculations();
    }
    flashToast(`☀️ Placa selecionada: ${found.name} (${found.powerWatts}W)`);
  };

  const addPanelPreset = (presetData: Omit<SolarPanelPreset, 'id' | 'isDefault'>) => {
    const newPreset: SolarPanelPreset = {
      ...presetData,
      id: `panel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isDefault: false
    };
    const next = [...panelPresets, newPreset];
    setPanelPresetsState(next);
    savePanelPresets(next);
    selectPanelPreset(newPreset.id);
    flashToast(`✅ Novo preset de placa cadastrado: ${newPreset.name}`);
  };

  const updatePanelPreset = (id: string, updates: Partial<SolarPanelPreset>) => {
    const next = panelPresets.map(p => (p.id === id ? { ...p, ...updates } : p));
    setPanelPresetsState(next);
    savePanelPresets(next);
    if (activePanelPresetId === id) {
      const updated = next.find(p => p.id === id);
      if (updated && sceneManager) {
        sceneManager.solarSystem.setPanelSpecs({
          width: updated.width,
          length: updated.length,
          thickness: updated.thickness,
          weightKg: updated.weightKg,
          powerWatts: updated.powerWatts,
          voc: updated.voc,
          vmp: updated.vmp,
          isc: updated.isc,
          imp: updated.imp,
          name: updated.name,
          cellCount: updated.cellCount,
          cols: updated.cols,
          rows: updated.rows
        });
        updateCalculations();
      }
    }
    flashToast('✏️ Preset de placa atualizado!');
  };

  const removePanelPreset = (id: string) => {
    const target = panelPresets.find(p => p.id === id);
    if (!target || target.isDefault) return;
    const next = panelPresets.filter(p => p.id !== id);
    setPanelPresetsState(next);
    savePanelPresets(next);
    if (activePanelPresetId === id && next.length > 0) {
      selectPanelPreset(next[0].id);
    }
    flashToast('🗑️ Preset de placa removido');
  };

  const selectCargoBoxPreset = (id: string) => {
    const found = cargoBoxPresets.find(p => p.id === id);
    if (!found) return;
    setActiveCargoPresetIdState(id);
    saveActiveCargoPresetId(id);
    setCargoBox({
      enabled: true,
      length: found.length,
      width: found.width,
      height: found.height,
      hingeSide: found.hingeSide || cargoBox.hingeSide
    });
    flashToast(`🧰 Baú selecionado: ${found.name} (${found.length}×${found.width}×${found.height}mm)`);
  };

  const addCargoBoxPreset = (presetData: Omit<CargoBoxPreset, 'id' | 'isDefault'>) => {
    const newPreset: CargoBoxPreset = {
      ...presetData,
      id: `cargo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isDefault: false
    };
    const next = [...cargoBoxPresets, newPreset];
    setCargoBoxPresetsState(next);
    saveCargoBoxPresets(next);
    selectCargoBoxPreset(newPreset.id);
    flashToast(`✅ Novo baú cadastrado: ${newPreset.name}`);
  };

  const updateCargoBoxPreset = (id: string, updates: Partial<CargoBoxPreset>) => {
    const next = cargoBoxPresets.map(p => (p.id === id ? { ...p, ...updates } : p));
    setCargoBoxPresetsState(next);
    saveCargoBoxPresets(next);
    if (activeCargoPresetId === id) {
      const updated = next.find(p => p.id === id);
      if (updated) {
        setCargoBox({
          length: updated.length,
          width: updated.width,
          height: updated.height,
          hingeSide: updated.hingeSide || cargoBox.hingeSide
        });
      }
    }
    flashToast('✏️ Preset de baú atualizado!');
  };

  const removeCargoBoxPreset = (id: string) => {
    const target = cargoBoxPresets.find(p => p.id === id);
    if (!target || target.isDefault) return;
    const next = cargoBoxPresets.filter(p => p.id !== id);
    setCargoBoxPresetsState(next);
    saveCargoBoxPresets(next);
    if (activeCargoPresetId === id && next.length > 0) {
      selectCargoBoxPreset(next[0].id);
    }
    flashToast('🗑️ Preset de baú removido');
  };

  const selectFridgePreset = (id: string) => {
    const found = fridgePresets.find(p => p.id === id);
    if (!found) return;
    setActiveFridgePresetIdState(id);
    saveActiveFridgePresetId(id);

    // Sincroniza automaticamente com a carga de geladeira no simulador de energia
    if (sceneManager && sceneManager.solarSim) {
      const appliances = sceneManager.solarSim.APPLIANCES;
      const fridgeApp = appliances.find((a: any) =>
        a.id === 'app_1' ||
        a.name.toLowerCase().includes('geladeira') ||
        a.name.toLowerCase().includes('resfri') ||
        a.name.toLowerCase().includes('refrigerador')
      );

      const targetWatts = found.ratedWatts || found.powerEcoWatts || 48;
      const targetHours = found.dailyHours || 9.6;
      const targetName = `${found.name} (12V Compressor)`;

      if (fridgeApp) {
        sceneManager.solarSim.updateAppliance(fridgeApp.id, {
          name: targetName,
          watts: targetWatts,
          hours: targetHours,
          enabled: true
        });
      } else {
        sceneManager.solarSim.addAppliance(targetName, targetWatts, targetHours, 1);
      }
      updateCalculations();
    }

    flashToast(`❄️ Geladeira selecionada: ${found.name} (${found.volumeLiters}L · ${found.powerEcoWatts}W ECO / ${found.powerMaxWatts}W MAX)`);
  };

  const addFridgePreset = (presetData: Omit<FridgePreset, 'id' | 'isDefault'>) => {
    const newPreset: FridgePreset = {
      ...presetData,
      id: `fridge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isDefault: false
    };
    const next = [...fridgePresets, newPreset];
    setFridgePresetsState(next);
    saveFridgePresets(next);
    selectFridgePreset(newPreset.id);
    flashToast(`✅ Nova geladeira cadastrada: ${newPreset.name}`);
  };

  const updateFridgePreset = (id: string, updates: Partial<FridgePreset>) => {
    const next = fridgePresets.map(p => (p.id === id ? { ...p, ...updates } : p));
    setFridgePresetsState(next);
    saveFridgePresets(next);
    if (activeFridgePresetId === id) {
      const updated = next.find(p => p.id === id);
      if (updated && sceneManager?.solarSim) {
        const appliances = sceneManager.solarSim.APPLIANCES;
        const fridgeApp = appliances.find((a: any) =>
          a.id === 'app_1' ||
          a.name.toLowerCase().includes('geladeira') ||
          a.name.toLowerCase().includes('resfri')
        );
        if (fridgeApp) {
          sceneManager.solarSim.updateAppliance(fridgeApp.id, {
            name: `${updated.name} (12V Compressor)`,
            watts: updated.ratedWatts || updated.powerEcoWatts || 48,
            hours: updated.dailyHours || 9.6
          });
          updateCalculations();
        }
      }
    }
    flashToast('✏️ Preset de geladeira atualizado!');
  };

  const removeFridgePreset = (id: string) => {
    const target = fridgePresets.find(p => p.id === id);
    if (!target || target.isDefault) {
      flashToast('⚠️ Não é permitido excluir o modelo padrão de fábrica.');
      return;
    }
    const next = fridgePresets.filter(p => p.id !== id);
    setFridgePresetsState(next);
    saveFridgePresets(next);
    if (activeFridgePresetId === id && next.length > 0) {
      selectFridgePreset(next[0].id);
    }
    flashToast('🗑️ Preset de geladeira removido');
  };

  const resetFridgePresetsToDefault = () => {
    const defaults = resetFridgePresets();
    setFridgePresetsState(defaults);
    selectFridgePreset(defaults[0].id);
    flashToast('🔄 Presets de geladeira restaurados para os padrões originais');
  };

  const selectPortaPottiPreset = (id: string) => {
    const found = portaPottiPresets.find(p => p.id === id);
    if (!found) return;
    setActivePortaPottiPresetIdState(id);
    saveActivePortaPottiPresetId(id);
    flashToast(`🚽 Porta Potti selecionado: ${found.name}`);
  };

  const addPortaPottiPreset = (presetData: Omit<PortaPottiPreset, 'id' | 'isDefault'>) => {
    const newId = `custom-portapotti-${Date.now()}`;
    const newPreset: PortaPottiPreset = {
      ...presetData,
      id: newId,
      isDefault: false
    };
    const next = [...portaPottiPresets, newPreset];
    setPortaPottiPresetsState(next);
    savePortaPottiPresets(next);
    selectPortaPottiPreset(newId);
    flashToast(`✨ Novo preset de Porta Potti criado: ${newPreset.name}`);
  };

  const updatePortaPottiPreset = (id: string, updates: Partial<PortaPottiPreset>) => {
    const next = portaPottiPresets.map(p => {
      if (p.id === id) {
        return { ...p, ...updates };
      }
      return p;
    });
    setPortaPottiPresetsState(next);
    savePortaPottiPresets(next);
    flashToast('✏️ Preset de Porta Potti atualizado!');
  };

  const removePortaPottiPreset = (id: string) => {
    const target = portaPottiPresets.find(p => p.id === id);
    if (!target || target.isDefault) {
      flashToast('⚠️ Não é permitido excluir o modelo padrão de fábrica.');
      return;
    }
    const next = portaPottiPresets.filter(p => p.id !== id);
    setPortaPottiPresetsState(next);
    savePortaPottiPresets(next);
    if (activePortaPottiPresetId === id && next.length > 0) {
      selectPortaPottiPreset(next[0].id);
    }
    flashToast('🗑️ Preset de Porta Potti removido');
  };

  const resetPortaPottiPresetsToDefault = () => {
    const defaults = resetPortaPottiPresets();
    setPortaPottiPresetsState(defaults);
    selectPortaPottiPreset(defaults[0].id);
    flashToast('🔄 Presets de Porta Potti restaurados para os padrões originais');
  };

  const selectStovePreset = (id: string) => {
    const found = stovePresets.find(p => p.id === id);
    if (!found) return;
    setActiveStovePresetIdState(id);
    saveActiveStovePresetId(id);
    flashToast(`🔥 Fogareiro selecionado: ${found.name}`);
  };

  const addStovePreset = (presetData: Omit<StovePreset, 'id' | 'isDefault'>) => {
    const newId = `custom-stove-${Date.now()}`;
    const newPreset: StovePreset = {
      ...presetData,
      id: newId,
      isDefault: false
    };
    const next = [...stovePresets, newPreset];
    setStovePresetsState(next);
    saveStovePresets(next);
    selectStovePreset(newId);
    flashToast(`✨ Novo preset de fogareiro criado: ${newPreset.name}`);
  };

  const updateStovePreset = (id: string, updates: Partial<StovePreset>) => {
    const next = stovePresets.map(p => (p.id === id ? { ...p, ...updates } : p));
    setStovePresetsState(next);
    saveStovePresets(next);
    flashToast('✏️ Preset de fogareiro atualizado!');
  };

  const removeStovePreset = (id: string) => {
    const target = stovePresets.find(p => p.id === id);
    if (!target || target.isDefault) {
      flashToast('⚠️ Não é permitido excluir o modelo padrão de fábrica.');
      return;
    }
    const next = stovePresets.filter(p => p.id !== id);
    setStovePresetsState(next);
    saveStovePresets(next);
    if (activeStovePresetId === id && next.length > 0) {
      selectStovePreset(next[0].id);
    }
    flashToast('🗑️ Preset de fogareiro removido');
  };

  const resetStovePresetsToDefault = () => {
    const defaults = resetStovePresets();
    setStovePresetsState(defaults);
    selectStovePreset(defaults[0].id);
    flashToast('🔄 Presets de fogareiro restaurados para os padrões originais');
  };

  return {
    panelPresets,
    setPanelPresetsState,
    activePanelPresetId,
    setActivePanelPresetIdState,
    activePanelPreset,
    selectPanelPreset,
    addPanelPreset,
    updatePanelPreset,
    removePanelPreset,
    cargoBoxPresets,
    setCargoBoxPresetsState,
    activeCargoPresetId,
    setActiveCargoPresetIdState,
    activeCargoBoxPreset,
    selectCargoBoxPreset,
    addCargoBoxPreset,
    updateCargoBoxPreset,
    removeCargoBoxPreset,
    fridgePresets,
    setFridgePresetsState,
    activeFridgePresetId,
    setActiveFridgePresetIdState,
    activeFridgePreset,
    selectFridgePreset,
    addFridgePreset,
    updateFridgePreset,
    removeFridgePreset,
    resetFridgePresetsToDefault,
    portaPottiPresets,
    setPortaPottiPresetsState,
    activePortaPottiPresetId,
    setActivePortaPottiPresetIdState,
    activePortaPottiPreset,
    selectPortaPottiPreset,
    addPortaPottiPreset,
    updatePortaPottiPreset,
    removePortaPottiPreset,
    resetPortaPottiPresetsToDefault,
    stovePresets,
    setStovePresetsState,
    activeStovePresetId,
    setActiveStovePresetIdState,
    activeStovePreset,
    selectStovePreset,
    addStovePreset,
    updateStovePreset,
    removeStovePreset,
    resetStovePresetsToDefault
  };
}
