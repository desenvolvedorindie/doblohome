import { dbGet, dbSet } from '../../data/db';
import {
  SavedConfig,
  SolarPanelPreset,
  CargoBoxPreset,
  InternalGridConfig,
  InternalBoxItem,
  PartsGroupFilter
} from '../../types';
import { DEFAULT_CEILING_CONFIG } from '../../data/internalBoxesPresets';

export class SolarPersistence {
  static async restoreConfig(handlers: {
    setStackLevelsState: (val: any) => void;
    setLevel1State: (val: any) => void;
    setLevel2State: (val: any) => void;
    setStructureMaterialState: (val: any) => void;
    setSteelProfileUnitState: (val: any) => void;
    setAluminumColorState: (val: any) => void;
    setMetalonColorState: (val: any) => void;
    setMetalonWallThicknessState: (val: any) => void;
    setMetalonThickness40State: (val: any) => void;
    setMetalonThickness30State: (val: any) => void;
    setCargoBoxState: (val: any) => void;
    setWaterTankState: (val: any) => void;
    setAwningState: (val: any) => void;
    setB2BCharger: (updater: (prev: any) => any) => void;
    setActivePanelPresetIdState: (val: string) => void;
    setActiveCargoPresetIdState: (val: string) => void;
    setOffsetZState: (val: number) => void;
    setOffsetYState: (val: number) => void;
    setExpansionProgressState: (val: number) => void;
    setPanelPresetsState: (val: any) => void;
    setCargoBoxPresetsState: (val: any) => void;
    setInternalGridState: (val: any) => void;
    setInternalBoxesState: (val: any) => void;
    setPartsFilterState: (val: any) => void;
    loadPanelPresets: () => SolarPanelPreset[];
    loadCargoBoxPresets: () => CargoBoxPreset[];
  }) {
    try {
      let cfg = await dbGet<SavedConfig>('doblo_solar_config');
      if (!cfg) {
        const legacyFullCfg = await dbGet<any>('doblo_solar_full_config');
        if (legacyFullCfg) {
          cfg = legacyFullCfg;
        }
      }

      if (cfg) {
        if (cfg.stackLevels) handlers.setStackLevelsState(cfg.stackLevels);
        if (cfg.level1) handlers.setLevel1State(cfg.level1);
        if (cfg.level2) handlers.setLevel2State(cfg.level2);
        if (cfg.structureMaterial) handlers.setStructureMaterialState(cfg.structureMaterial);
        if (cfg.steelProfileUnit) handlers.setSteelProfileUnitState(cfg.steelProfileUnit);
        if (cfg.aluminumColor) handlers.setAluminumColorState(cfg.aluminumColor);
        if (cfg.metalonColor) handlers.setMetalonColorState(cfg.metalonColor);
        if (cfg.metalonWallThickness !== undefined) handlers.setMetalonWallThicknessState(cfg.metalonWallThickness);
        if (cfg.metalonThickness40 !== undefined) handlers.setMetalonThickness40State(cfg.metalonThickness40);
        if (cfg.metalonThickness30 !== undefined) handlers.setMetalonThickness30State(cfg.metalonThickness30);
        if (cfg.cargoBox) {
          const maxLift = Math.max(60, Math.floor(((cfg.cargoBox.height || 330) - 100) / 10) * 10);
          handlers.setCargoBoxState({
            ...cfg.cargoBox,
            verticalLiftMm: Math.max(0, Math.min(maxLift, cfg.cargoBox.verticalLiftMm || 0))
          });
        }
        if (cfg.waterTank) {
          handlers.setWaterTankState({
            enabled: Boolean(cfg.waterTank.enabled),
            lengthMm: Math.max(400, Math.min(2200, Math.round(cfg.waterTank.lengthMm || 2200))),
            diameterMm: Math.max(80, Math.min(350, Math.round(cfg.waterTank.diameterMm || 200))),
            connectionPosition: cfg.waterTank.connectionPosition === 'rear' ? 'rear' : 'front'
          });
        }
        if (cfg.awning) {
          handlers.setAwningState(cfg.awning);
        }
        if (cfg.b2bEngineHours !== undefined) {
          handlers.setB2BCharger((prev: any) => ({ ...prev, engineHoursPerDay: cfg!.b2bEngineHours! }));
        }
        if (cfg.panelPresetId) {
          handlers.setActivePanelPresetIdState(cfg.panelPresetId);
        }
        if (cfg.cargoBoxPresetId) {
          handlers.setActiveCargoPresetIdState(cfg.cargoBoxPresetId);
        }
        if (cfg.offsetZ !== undefined) {
          const zVal = cfg.offsetZ > 0.1 ? -cfg.offsetZ : cfg.offsetZ;
          handlers.setOffsetZState(zVal);
        }
        if (cfg.offsetY !== undefined) {
          const safeOffsetY = Math.max(0, cfg.offsetY);
          handlers.setOffsetYState(safeOffsetY);
        }
        if (cfg.expansionProgress !== undefined) handlers.setExpansionProgressState(cfg.expansionProgress);
      }

      const savedPanelPresets = await dbGet<SolarPanelPreset[]>('doblo_solar_panel_presets');
      if (savedPanelPresets && Array.isArray(savedPanelPresets) && savedPanelPresets.length > 0) {
        handlers.setPanelPresetsState(handlers.loadPanelPresets());
      }
      const savedActivePanelId = await dbGet<string>('doblo_solar_active_preset_id');
      if (savedActivePanelId) {
        handlers.setActivePanelPresetIdState(savedActivePanelId);
      }

      const savedCargoPresets = await dbGet<CargoBoxPreset[]>('doblo_cargo_box_presets');
      if (savedCargoPresets && Array.isArray(savedCargoPresets) && savedCargoPresets.length > 0) {
        handlers.setCargoBoxPresetsState(handlers.loadCargoBoxPresets());
      }
      const savedActiveCargoId = await dbGet<string>('doblo_active_cargo_preset_id');
      if (savedActiveCargoId) {
        handlers.setActiveCargoPresetIdState(savedActiveCargoId);
      }

      const savedGrid = await dbGet<InternalGridConfig>('doblo_internal_grid');
      if (savedGrid && savedGrid.colsX && savedGrid.rowsZ) {
        if (!savedGrid.ceiling) {
          savedGrid.ceiling = { ...DEFAULT_CEILING_CONFIG };
        }
        handlers.setInternalGridState(savedGrid);
      }

      const savedBoxes = await dbGet<InternalBoxItem[]>('doblo_internal_boxes');
      if (savedBoxes && Array.isArray(savedBoxes)) {
        handlers.setInternalBoxesState(savedBoxes);
      }

      const savedPartsFilter = await dbGet<PartsGroupFilter>('doblo_parts_filter');
      if (savedPartsFilter) {
        handlers.setPartsFilterState(savedPartsFilter);
      }
    } catch (e) {
      console.warn('Erro ao restaurar configurações do banco de dados:', e);
    }
  }

  static saveConfig(config: SavedConfig) {
    dbSet('doblo_solar_config', config);
  }
}
