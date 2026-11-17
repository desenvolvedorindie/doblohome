import { dbGet, dbSet } from '../../data/db';
import {
  SavedConfig,
  SolarPanelPreset,
  CargoBoxPreset,
  InternalGridConfig,
  InternalBoxItem,
  PartsGroupFilter,
  ProjectData
} from '../../types';
import { DEFAULT_CEILING_CONFIG, DEFAULT_INTERNAL_GRID } from '../../data/internalBoxesPresets';
import { ProjectManager } from '../../data/projectManager';

export interface RestoreHandlers {
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
  loadPanelPresets?: () => SolarPanelPreset[];
  loadCargoBoxPresets?: () => CargoBoxPreset[];
  sceneManager?: any;
  updateCalculations?: () => void;
}

/**
 * Lê de forma síncrona a última configuração salva do localStorage para inicialização
 * instantânea de estado (evita race condition e perda de painéis no reload/F5/HMR).
 */
export function getSavedConfigSync(): Partial<SavedConfig> | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem('doblo_solar_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {
    // Ignora erro de JSON ou acesso
  }
  return null;
}

export class SolarPersistence {
  /**
   * Aplica diretamente um objeto de dados de projeto (ProjectData) no estado da aplicação e 3D
   */
  static applyProjectData(data: ProjectData, handlers: RestoreHandlers) {
    if (!data) return;
    const cfg = data.config;

    if (cfg) {
      if (cfg.stackLevels === 1 || cfg.stackLevels === 2) {
        handlers.setStackLevelsState(cfg.stackLevels);
        if (handlers.sceneManager) {
          handlers.sceneManager.solarSystem.setStackLevels(cfg.stackLevels);
        }
      }
      if (cfg.level1 && typeof cfg.level1.panels === 'number' && [1, 2, 3, 4].includes(cfg.level1.panels)) {
        handlers.setLevel1State(cfg.level1);
        if (handlers.sceneManager) {
          handlers.sceneManager.solarSystem.setLevel1Panels(cfg.level1.panels);
          if (cfg.level1.direction) handlers.sceneManager.solarSystem.setLevel1Direction(cfg.level1.direction);
          if (cfg.level1.orientation) handlers.sceneManager.solarSystem.setLevel1Orientation(cfg.level1.orientation);
        }
      }
      if (cfg.level2 && typeof cfg.level2.panels === 'number' && [1, 2, 3, 4].includes(cfg.level2.panels)) {
        handlers.setLevel2State(cfg.level2);
        if (handlers.sceneManager) {
          handlers.sceneManager.solarSystem.setLevel2Panels(cfg.level2.panels);
          if (cfg.level2.direction) handlers.sceneManager.solarSystem.setLevel2Direction(cfg.level2.direction);
          if (cfg.level2.orientation) handlers.sceneManager.solarSystem.setLevel2Orientation(cfg.level2.orientation);
        }
      }
      if (cfg.structureMaterial) {
        handlers.setStructureMaterialState(cfg.structureMaterial);
        if (handlers.sceneManager) {
          handlers.sceneManager.solarSystem.setStructureMaterial(cfg.structureMaterial);
        }
      }
      if (cfg.steelProfileUnit) {
        handlers.setSteelProfileUnitState(cfg.steelProfileUnit);
        if (handlers.sceneManager) {
          handlers.sceneManager.solarSystem.setSteelProfileUnit(cfg.steelProfileUnit);
        }
      }
      if (cfg.aluminumColor) handlers.setAluminumColorState(cfg.aluminumColor);
      if (cfg.metalonColor) handlers.setMetalonColorState(cfg.metalonColor);
      if (cfg.metalonWallThickness !== undefined) handlers.setMetalonWallThicknessState(cfg.metalonWallThickness);
      if (cfg.metalonThickness40 !== undefined) handlers.setMetalonThickness40State(cfg.metalonThickness40);
      if (cfg.metalonThickness30 !== undefined) handlers.setMetalonThickness30State(cfg.metalonThickness30);

      if (cfg.cargoBox) {
        const maxLift = Math.max(60, Math.floor(((cfg.cargoBox.height || 330) - 100) / 10) * 10);
        const nextCargo = {
          ...cfg.cargoBox,
          verticalLiftMm: Math.max(0, Math.min(maxLift, cfg.cargoBox.verticalLiftMm || 0))
        };
        handlers.setCargoBoxState(nextCargo);
        if (handlers.sceneManager) {
          handlers.sceneManager.solarSystem.setCargoBox(nextCargo);
        }
      }
      if (cfg.waterTank) {
        const nextWater = {
          enabled: Boolean(cfg.waterTank.enabled),
          lengthMm: Math.max(400, Math.min(2200, Math.round(cfg.waterTank.lengthMm || 2200))),
          diameterMm: Math.max(80, Math.min(350, Math.round(cfg.waterTank.diameterMm || 200))),
          connectionPosition: cfg.waterTank.connectionPosition === 'rear' ? 'rear' as const : 'front' as const
        };
        handlers.setWaterTankState(nextWater);
        if (handlers.sceneManager) {
          handlers.sceneManager.solarSystem.setWaterTank(nextWater);
        }
      }
      if (cfg.awning) {
        handlers.setAwningState(cfg.awning);
        if (handlers.sceneManager) {
          handlers.sceneManager.solarSystem.setAwningConfig(cfg.awning);
        }
      }
      if (cfg.b2bEngineHours !== undefined) {
        handlers.setB2BCharger((prev: any) => ({ ...prev, engineHoursPerDay: cfg.b2bEngineHours! }));
      }
      if (cfg.panelPresetId) {
        handlers.setActivePanelPresetIdState(cfg.panelPresetId);
      }
      if (cfg.cargoBoxPresetId) {
        handlers.setActiveCargoPresetIdState(cfg.cargoBoxPresetId);
      }
      if (cfg.offsetZ !== undefined) {
        let zVal = cfg.offsetZ > 0.1 ? -cfg.offsetZ : cfg.offsetZ;
        if (Math.abs(zVal - (-0.68)) < 0.01) {
          zVal = -1.20;
        }
        handlers.setOffsetZState(zVal);
        if (handlers.sceneManager) {
          handlers.sceneManager.solarSystem.setGroupOffsetZ(zVal);
        }
      }
      if (cfg.offsetY !== undefined) {
        let safeOffsetY = Math.max(-0.30, Math.min(0.50, cfg.offsetY));
        if (Math.abs(safeOffsetY) < 0.001) {
          safeOffsetY = -0.14;
        }
        handlers.setOffsetYState(safeOffsetY);
        if (handlers.sceneManager) {
          handlers.sceneManager.solarSystem.setGroupOffsetY(safeOffsetY);
        }
      }
      if (cfg.expansionProgress !== undefined) {
        handlers.setExpansionProgressState(cfg.expansionProgress);
        if (handlers.sceneManager) {
          handlers.sceneManager.setExpansion(cfg.expansionProgress);
        }
      }
    }

    // Grid interno
    if (data.internalGrid && data.internalGrid.colsX && data.internalGrid.rowsZ) {
      const grid = { ...data.internalGrid };
      if (!grid.ceiling) {
        grid.ceiling = { ...DEFAULT_CEILING_CONFIG };
      }
      handlers.setInternalGridState(grid);
    } else {
      handlers.setInternalGridState({ ...DEFAULT_INTERNAL_GRID });
    }

    // Móveis / caixas internas
    if (Array.isArray(data.internalBoxes)) {
      handlers.setInternalBoxesState(data.internalBoxes);
    } else {
      handlers.setInternalBoxesState([]);
    }

    // Filtros de peças
    if (data.partsFilter) {
      handlers.setPartsFilterState(data.partsFilter);
    }

    if (handlers.sceneManager && handlers.updateCalculations) {
      handlers.updateCalculations();
    }
  }

  static async restoreConfig(handlers: RestoreHandlers, activeProjectId?: string | null) {
    try {
      // 1. Tenta carregar pelo projeto ativo se houver
      const targetProjId = activeProjectId || (await ProjectManager.getActiveProjectId());
      if (targetProjId) {
        const projData = await ProjectManager.getProjectData(targetProjId);
        if (projData) {
          this.applyProjectData(projData, handlers);
          return;
        }
      }

      // 2. Fallback para configuração global legada
      let cfg = await dbGet<SavedConfig>('doblo_solar_config');
      if (!cfg) {
        const legacyFullCfg = await dbGet<any>('doblo_solar_full_config');
        if (legacyFullCfg) {
          cfg = legacyFullCfg;
        }
      }

      if (cfg) {
        if (!cfg.level1 && (cfg as any).level1Panels) {
          cfg.level1 = {
            panels: (cfg as any).level1Panels,
            direction: 'longitudinal',
            orientation: 'longitudinal'
          };
        } else if (!cfg.level1 && (cfg as any).panelsPerLevel) {
          cfg.level1 = {
            panels: (cfg as any).panelsPerLevel,
            direction: 'longitudinal',
            orientation: 'longitudinal'
          };
        }
        if (!cfg.level2 && (cfg as any).level2Panels) {
          cfg.level2 = {
            panels: (cfg as any).level2Panels,
            direction: 'fixed',
            orientation: 'longitudinal'
          };
        }

        if (cfg.stackLevels === 1 || cfg.stackLevels === 2) {
          handlers.setStackLevelsState(cfg.stackLevels);
          if (handlers.sceneManager) {
            handlers.sceneManager.solarSystem.setStackLevels(cfg.stackLevels);
          }
        }
        if (cfg.level1 && typeof cfg.level1.panels === 'number' && [1, 2, 3, 4].includes(cfg.level1.panels)) {
          handlers.setLevel1State(cfg.level1);
          if (handlers.sceneManager) {
            handlers.sceneManager.solarSystem.setLevel1Panels(cfg.level1.panels);
            if (cfg.level1.direction) handlers.sceneManager.solarSystem.setLevel1Direction(cfg.level1.direction);
            if (cfg.level1.orientation) handlers.sceneManager.solarSystem.setLevel1Orientation(cfg.level1.orientation);
          }
        }
        if (cfg.level2 && typeof cfg.level2.panels === 'number' && [1, 2, 3, 4].includes(cfg.level2.panels)) {
          handlers.setLevel2State(cfg.level2);
          if (handlers.sceneManager) {
            handlers.sceneManager.solarSystem.setLevel2Panels(cfg.level2.panels);
            if (cfg.level2.direction) handlers.sceneManager.solarSystem.setLevel2Direction(cfg.level2.direction);
            if (cfg.level2.orientation) handlers.sceneManager.solarSystem.setLevel2Orientation(cfg.level2.orientation);
          }
        }
        if (cfg.structureMaterial) {
          handlers.setStructureMaterialState(cfg.structureMaterial);
          if (handlers.sceneManager) {
            handlers.sceneManager.solarSystem.setStructureMaterial(cfg.structureMaterial);
          }
        }
        if (cfg.steelProfileUnit) {
          handlers.setSteelProfileUnitState(cfg.steelProfileUnit);
          if (handlers.sceneManager) {
            handlers.sceneManager.solarSystem.setSteelProfileUnit(cfg.steelProfileUnit);
          }
        }
        if (cfg.aluminumColor) handlers.setAluminumColorState(cfg.aluminumColor);
        if (cfg.metalonColor) handlers.setMetalonColorState(cfg.metalonColor);
        if (cfg.metalonWallThickness !== undefined) handlers.setMetalonWallThicknessState(cfg.metalonWallThickness);
        if (cfg.metalonThickness40 !== undefined) handlers.setMetalonThickness40State(cfg.metalonThickness40);
        if (cfg.metalonThickness30 !== undefined) handlers.setMetalonThickness30State(cfg.metalonThickness30);
        if (cfg.cargoBox) {
          const maxLift = Math.max(60, Math.floor(((cfg.cargoBox.height || 330) - 100) / 10) * 10);
          const nextCargo = {
            ...cfg.cargoBox,
            verticalLiftMm: Math.max(0, Math.min(maxLift, cfg.cargoBox.verticalLiftMm || 0))
          };
          handlers.setCargoBoxState(nextCargo);
          if (handlers.sceneManager) {
            handlers.sceneManager.solarSystem.setCargoBox(nextCargo);
          }
        }
        if (cfg.waterTank) {
          const nextWater = {
            enabled: Boolean(cfg.waterTank.enabled),
            lengthMm: Math.max(400, Math.min(2200, Math.round(cfg.waterTank.lengthMm || 2200))),
            diameterMm: Math.max(80, Math.min(350, Math.round(cfg.waterTank.diameterMm || 200))),
            connectionPosition: cfg.waterTank.connectionPosition === 'rear' ? 'rear' as const : 'front' as const
          };
          handlers.setWaterTankState(nextWater);
          if (handlers.sceneManager) {
            handlers.sceneManager.solarSystem.setWaterTank(nextWater);
          }
        }
        if (cfg.awning) {
          handlers.setAwningState(cfg.awning);
          if (handlers.sceneManager) {
            handlers.sceneManager.solarSystem.setAwningConfig(cfg.awning);
          }
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
          let zVal = cfg.offsetZ > 0.1 ? -cfg.offsetZ : cfg.offsetZ;
          if (Math.abs(zVal - (-0.68)) < 0.01) {
            zVal = -1.20;
          }
          handlers.setOffsetZState(zVal);
          if (handlers.sceneManager) {
            handlers.sceneManager.solarSystem.setGroupOffsetZ(zVal);
          }
        } else {
          handlers.setOffsetZState(-1.20);
          if (handlers.sceneManager) {
            handlers.sceneManager.solarSystem.setGroupOffsetZ(-1.20);
          }
        }
        if (cfg.offsetY !== undefined) {
          let safeOffsetY = Math.max(-0.30, Math.min(0.50, cfg.offsetY));
          if (Math.abs(safeOffsetY) < 0.001) {
            safeOffsetY = -0.14;
          }
          handlers.setOffsetYState(safeOffsetY);
          if (handlers.sceneManager) {
            handlers.sceneManager.solarSystem.setGroupOffsetY(safeOffsetY);
          }
        } else {
          handlers.setOffsetYState(-0.14);
          if (handlers.sceneManager) {
            handlers.sceneManager.solarSystem.setGroupOffsetY(-0.14);
          }
        }
        if (cfg.expansionProgress !== undefined) {
          handlers.setExpansionProgressState(cfg.expansionProgress);
          if (handlers.sceneManager) {
            handlers.sceneManager.setExpansion(cfg.expansionProgress);
          }
        }

        if (handlers.sceneManager && handlers.updateCalculations) {
          handlers.updateCalculations();
        }
      }

      const savedPanelPresets = await dbGet<SolarPanelPreset[]>('doblo_solar_panel_presets');
      if (savedPanelPresets && Array.isArray(savedPanelPresets) && savedPanelPresets.length > 0) {
        handlers.setPanelPresetsState(savedPanelPresets);
      }
      const savedActivePanelId = await dbGet<string>('doblo_solar_active_preset_id');
      if (savedActivePanelId) {
        handlers.setActivePanelPresetIdState(savedActivePanelId);
      }

      const savedCargoPresets = await dbGet<CargoBoxPreset[]>('doblo_cargo_box_presets');
      if (savedCargoPresets && Array.isArray(savedCargoPresets) && savedCargoPresets.length > 0) {
        handlers.setCargoBoxPresetsState(savedCargoPresets);
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

  static async saveConfig(
    config: SavedConfig,
    activeProjectId?: string | null,
    extraProjectData?: {
      internalBoxes?: InternalBoxItem[];
      internalGrid?: InternalGridConfig;
      partsFilter?: PartsGroupFilter;
    }
  ) {
    dbSet('doblo_solar_config', config);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('doblo_solar_config', JSON.stringify(config));
      } catch {
        // Ignora cota de localStorage
      }
    }

    if (activeProjectId) {
      try {
        const existingData = await ProjectManager.getProjectData(activeProjectId);
        const updatedData: ProjectData = {
          config,
          internalBoxes: extraProjectData?.internalBoxes ?? existingData?.internalBoxes ?? [],
          internalGrid: extraProjectData?.internalGrid ?? existingData?.internalGrid ?? { ...DEFAULT_INTERNAL_GRID },
          partsFilter: extraProjectData?.partsFilter ?? existingData?.partsFilter
        };
        await ProjectManager.saveProjectData(activeProjectId, updatedData);
      } catch (e) {
        console.warn(`[SolarPersistence] Erro ao sincronizar dados no projeto ${activeProjectId}:`, e);
      }
    }
  }
}
