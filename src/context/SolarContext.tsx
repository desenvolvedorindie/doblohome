import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { SceneManager } from '../three/SceneManager';
import { CollisionSummary } from '../three/CollisionChecker';
import { FloatingSummary } from '../three/FloatingChecker';
import {
  StackLevels,
  SlideDirection,
  PanelOrientation,
  StructureMaterial,
  SteelProfileUnit,
  AluminumColor,
  ViewMode,
  PartsGroupFilter,
  CameraPreset,
  LevelConfig,
  SavedConfig,
  CargoBoxConfig,
  CargoBoxPreset,
  WaterTankConfig,
  AwningConfig,
  SolarPanelPreset,
  B2BChargerConfig,
  UsinaChargerConfig,
  UsinaModelRating,
  ApplianceItem,
  LoadsSummary,
  BatteryPerformance,
  EnergyStats,
  BarMeasurementData,
  InternalBoxItem,
  InternalGridConfig,
  InternalBoxesPreset,
  CeilingConfig
} from '../types';
import {
  DEFAULT_INTERNAL_GRID,
  INTERNAL_BOXES_PRESETS,
  DEFAULT_CEILING_CONFIG
} from '../data/internalBoxesPresets';
import { dbGet, dbSet } from '../data/db';
import {
  loadPanelPresets,
  savePanelPresets,
  loadActivePresetId,
  saveActivePresetId
} from '../data/solarPanelPresets';
import {
  loadCargoBoxPresets,
  saveCargoBoxPresets,
  loadActiveCargoPresetId,
  saveActiveCargoPresetId
} from '../data/cargoBoxPresets';

interface SolarContextType {
  sceneManager: SceneManager | null;
  setSceneManager: (mgr: SceneManager | null) => void;

  stackLevels: StackLevels;
  level1: LevelConfig;
  level2: LevelConfig;
  structureMaterial: StructureMaterial;
  steelProfileUnit: SteelProfileUnit;
  aluminumColor: AluminumColor;
  metalonColor: string;
  offsetZ: number;
  offsetY: number;
  expansionProgress: number;

  // Baú de Teto Motobul Off Road & Basculamento
  cargoBox: CargoBoxConfig;

  // Caixa d'Água Lateral (2× Canos PVC 200mm — 1 de cada lado)
  waterTank: WaterTankConfig;

  // Toldo Retrátil Overland (Traseiro ou Asa de Morcego 270°)
  awning: AwningConfig;
  setAwning: (updates: Partial<AwningConfig>) => void;
  toggleAwningOpen: () => void;

  // Carregador Inteligente DC-DC B2B1230 (Alternador Doblò -> LiFePO4)
  b2bCharger: B2BChargerConfig;

  // Fonte e Carregador Usina 150A Smart Connect (Shore Power / Camping)
  usinaCharger: UsinaChargerConfig;

  isVehicleVisible: boolean;
  vehicleOpacity: number;
  setVehicleOpacity: (opacity: number) => void;
  isDimensionsVisible: boolean;
  isChainVisible: boolean;
  isTransparent: boolean;
  isSoundEnabled: boolean;
  isAutoAnimating: boolean;
  viewMode: ViewMode;
  partsFilter: PartsGroupFilter;
  activeCameraPreset: CameraPreset;
  sunHour: number;

  hoveredBar: BarMeasurementData | null;
  hoverPos: { x: number; y: number };

  activeModal: 'loads' | 'battery' | 'mppt' | 'bom' | 'b2b' | 'usina' | 'panel-presets' | 'cargo-presets' | 'help' | null;
  toastMessage: string | null;

  // Presets de Placas Solares (100W / 200W / Custom)
  panelPresets: SolarPanelPreset[];
  activePanelPreset: SolarPanelPreset;
  selectPanelPreset: (id: string) => void;
  addPanelPreset: (preset: Omit<SolarPanelPreset, 'id' | 'isDefault'>) => void;
  updatePanelPreset: (id: string, updates: Partial<SolarPanelPreset>) => void;
  removePanelPreset: (id: string) => void;

  // Presets de Baús de Teto
  cargoBoxPresets: CargoBoxPreset[];
  activeCargoBoxPreset: CargoBoxPreset;
  selectCargoBoxPreset: (id: string) => void;
  addCargoBoxPreset: (preset: Omit<CargoBoxPreset, 'id' | 'isDefault'>) => void;
  updateCargoBoxPreset: (id: string, updates: Partial<CargoBoxPreset>) => void;
  removeCargoBoxPreset: (id: string) => void;

  energyStats: EnergyStats;
  batteryPerformance: BatteryPerformance;
  loadsSummary: LoadsSummary;
  appliances: ApplianceItem[];

  // Armazenadores e Caixas Internas (Grid Camper)
  internalGrid: InternalGridConfig;
  setInternalGrid: (grid: InternalGridConfig | ((prev: InternalGridConfig) => InternalGridConfig)) => void;
  setCeiling: (updates: Partial<CeilingConfig> | ((prev: CeilingConfig) => Partial<CeilingConfig>)) => void;
  toggleCeiling3D: () => void;
  internalBoxes: InternalBoxItem[];
  setInternalBoxes: (boxes: InternalBoxItem[] | ((prev: InternalBoxItem[]) => InternalBoxItem[])) => void;
  selectedBoxId: string | null;
  setSelectedBoxId: (id: string | null) => void;
  isolatedBoxId: string | null;
  setIsolatedBoxId: (id: string | null) => void;
  isOpenPreview: boolean;
  setIsOpenPreview: (open: boolean | ((prev: boolean) => boolean)) => void;
  isCabinetsOpenPreview: boolean;
  setIsCabinetsOpenPreview: (open: boolean | ((prev: boolean) => boolean)) => void;
  isBedOpenPreview: boolean;
  setIsBedOpenPreview: (open: boolean | ((prev: boolean) => boolean)) => void;
  showMattress: boolean;
  setShowMattress: (show: boolean | ((prev: boolean) => boolean)) => void;
  applyInternalBoxesPreset: (presetId: string) => void;
  addInternalBox: (box: Omit<InternalBoxItem, 'id'>) => string;
  updateInternalBox: (id: string, updates: Partial<InternalBoxItem>) => void;
  removeInternalBox: (id: string) => void;
  clearInternalBoxes: () => void;

  setStackLevels: (levels: StackLevels) => void;
  setLevel1Panels: (count: number) => void;
  setLevel1Direction: (direction: SlideDirection) => void;
  setLevel1Orientation: (orientation: PanelOrientation) => void;
  setLevel2Panels: (count: number) => void;
  setLevel2Direction: (direction: SlideDirection) => void;
  setLevel2Orientation: (orientation: PanelOrientation) => void;
  setStructureMaterial: (material: StructureMaterial) => void;
  setSteelProfileUnit: (unit: SteelProfileUnit) => void;
  setAluminumColor: (color: AluminumColor) => void;
  setMetalonColor: (color: string) => void;
  metalonWallThickness: number;
  metalonThickness40: number;
  metalonThickness30: number;
  setMetalonWallThickness: (thickness: number) => void;
  setMetalonThickness40: (thickness: number) => void;
  setMetalonThickness30: (thickness: number) => void;
  setOffsetZ: (z: number) => void;
  setOffsetY: (y: number) => void;
  setExpansion: (val: number) => void;

  // Controles do Baú e Basculamento
  setCargoBox: (updates: Partial<CargoBoxConfig>) => void;
  setCargoBoxEnabled: (enabled: boolean) => void;
  setCargoBoxDimensions: (length: number, width: number, height: number) => void;
  setCargoBoxVerticalLift: (liftMm: number) => void;
  setCargoBoxTelescopic: (isTelescopic: boolean) => void;
  setCargoBoxHingeSide: (side: 'driver' | 'passenger') => void;
  setTiltAngle: (angle: number) => void;
  setBoxLidAngle: (angle: number) => void;
  tiltSolarRack: () => void;
  closeSolarRack: () => void;
  openBoxLid: () => void;
  closeBoxLid: () => void;
  retractAndTilt: () => void;

  // Controles da Caixa d'Água (2× Canos Laterais)
  setWaterTank: (updates: Partial<WaterTankConfig>) => void;
  setWaterTankEnabled: (enabled: boolean) => void;
  setWaterTankLength: (lengthMm: number) => void;
  setWaterTankRadius: (radiusMm: number) => void;

  // Carregador Inteligente DC-DC B2B1230
  setB2BEnabled: (enabled: boolean) => void;
  toggleB2BEngine: () => void;
  setB2BEngineHours: (hours: number) => void;

  // Fonte e Carregador Usina 70A/120A/150A/200A Smart Connect
  toggleUsinaAC: () => void;
  setUsinaAmps: (amps: number) => void;
  setUsinaVoltage: (volts: number) => void;
  setUsinaModel: (model: UsinaModelRating) => void;

  // Verificação Estrutural de Colisões
  collisionSummary: CollisionSummary | null;
  checkCollisions: () => void;
  clearCollisions: () => void;

  // Verificação de Peças Flutuantes (Sustentação na Base)
  floatingSummary: FloatingSummary | null;
  checkFloating: () => void;
  clearFloating: () => void;

  toggleVehicle: () => void;
  toggleDimensions: () => void;
  toggleChain: () => void;
  toggleTransparency: () => void;
  toggleSound: () => void;
  toggleAutoAnim: () => void;
  setViewMode: (mode: ViewMode) => void;
  setPartsFilter: (filter: PartsGroupFilter) => void;
  toggleViewMode: () => void;

  expand: () => void;
  retract: () => void;
  rewind: () => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setSunHour: (hour: number) => void;
  takeScreenshot: () => void;

  openModal: (modal: 'loads' | 'battery' | 'mppt' | 'bom' | 'b2b' | 'usina' | 'panel-presets' | 'cargo-presets' | 'help' | null) => void;
  closeModal: () => void;
  flashToast: (msg: string) => void;

  addAppliance: (name: string, watts: number, hours: number, qty?: number) => void;
  updateAppliance: (id: string, updates: Partial<ApplianceItem>) => void;
  removeAppliance: (id: string) => void;
  moveAppliance: (id: string, direction: 'up' | 'down') => void;
  reorderAppliances: (fromIndex: number, toIndex: number) => void;
  resetAppliances: () => void;
}

const SolarContext = createContext<SolarContextType | null>(null);

export const SolarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null);

  // Estados principais
  const [stackLevels, setStackLevelsState] = useState<StackLevels>(2);
  const [level1, setLevel1State] = useState<LevelConfig>({
    panels: 2,
    direction: 'longitudinal',
    orientation: 'longitudinal'
  });
  const [level2, setLevel2State] = useState<LevelConfig>({
    panels: 2,
    direction: 'fixed',
    orientation: 'longitudinal'
  });
  const [structureMaterial, setStructureMaterialState] = useState<StructureMaterial>('aluminum');
  const [steelProfileUnit, setSteelProfileUnitState] = useState<SteelProfileUnit>('mm');
  const [aluminumColor, setAluminumColorState] = useState<AluminumColor>('silver');
  const [metalonColor, setMetalonColorState] = useState<string>('#333b47');
  const [metalonWallThickness, setMetalonWallThicknessState] = useState<number>(1.5);
  const [metalonThickness40, setMetalonThickness40State] = useState<number>(2.0);
  const [metalonThickness30, setMetalonThickness30State] = useState<number>(1.5);
  const [offsetZ, setOffsetZState] = useState<number>(-0.68);
  const [offsetY, setOffsetYState] = useState<number>(0.00);
  const [expansionProgress, setExpansionProgressState] = useState<number>(0.0);

  // Baú de Teto Motobul Off Road & Basculamento
  const [cargoBox, setCargoBoxState] = useState<CargoBoxConfig>({
    enabled: true,
    length: 1600,
    width: 1000,
    height: 330,
    hingeSide: 'driver',
    tiltAngle: 0,
    lidAngle: 0,
    verticalLiftMm: 0
  });

  // Caixa d'Água Lateral (2× Canos de 200mm — 1 de cada lado da estrutura base)
  const [waterTank, setWaterTankState] = useState<WaterTankConfig>({
    enabled: true,
    lengthMm: 2200,
    diameterMm: 200
  });

  // Toldo Retrátil Overland (Traseiro ou Asa de Morcego 270°)
  const [awning, setAwningState] = useState<AwningConfig>({
    enabled: false,
    type: 'rear',
    side: 'passenger',
    lengthMm: 1400,
    extensionMm: 2000,
    isOpen: false,
    fabricColor: '#374151'
  });

  // Carregador Inteligente DC-DC B2B1230 (Alternador Doblò -> LiFePO4)
  const [b2bCharger, setB2BCharger] = useState<B2BChargerConfig>({
    enabled: true,
    isEngineRunning: false, // Inicia desligado (estacionado)
    engineHoursPerDay: 1.5, // Padrão 1.5h/dia de rodagem com van ligada
    chargingAmps: 30,       // 30A contínuos
    voltageIn: 14.1,        // Alternador da Doblò
    voltageOut: 14.4,       // Curva LiFePO4
    watts: 390,             // ~390W
    bluetoothConnected: true
  });

  const b2bChargerRef = useRef<B2BChargerConfig>(b2bCharger);
  b2bChargerRef.current = b2bCharger;

  // Fonte e Carregador Automotivo Usina Smart Connect (70A/120A/150A/200A · 12V Bivolt)
  const [usinaCharger, setUsinaCharger] = useState<UsinaChargerConfig>({
    enabled: true,
    isConnectedAC: false,  // Inicia desconectado da tomada (off-grid)
    modelRating: 150,      // Modelo padrão: 150A
    chargingAmps: 150,     // 150A nominal
    voltageOut: 14.4,      // Ajuste Smart Connect para LiFePO4
    watts: 2160,           // ~2.160W
    acVoltage: 220,        // Bivolt automático
    smartConnectActive: true
  });

  // Visual toggles
  const [isVehicleVisible, setIsVehicleVisible] = useState<boolean>(true);
  const [vehicleOpacity, setVehicleOpacityState] = useState<number>(1.0);
  const [isDimensionsVisible, setIsDimensionsVisible] = useState<boolean>(true);
  const [isChainVisible, setIsChainVisible] = useState<boolean>(false);
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isAutoAnimating, setIsAutoAnimating] = useState<boolean>(false);
  const [viewMode, setViewModeState] = useState<ViewMode>('assembled');
  const [partsFilter, setPartsFilterState] = useState<PartsGroupFilter>(() => {
    try {
      const saved = localStorage.getItem('doblo_parts_filter');
      if (saved === 'all' || saved === 'wood' || saved === 'metal' || saved === 'pvc') {
        return saved as PartsGroupFilter;
      }
    } catch {}
    return 'all';
  });
  const [activeCameraPreset, setActiveCameraPreset] = useState<CameraPreset>('iso');
  const [sunHour, setSunHourState] = useState<number>(12.0);

  // Modais e UI
  const [activeModal, setActiveModal] = useState<'loads' | 'battery' | 'mppt' | 'bom' | 'b2b' | 'usina' | 'panel-presets' | 'cargo-presets' | 'help' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<BarMeasurementData | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Presets de Placas Solares
  const [panelPresets, setPanelPresetsState] = useState<SolarPanelPreset[]>(() => loadPanelPresets());
  const [activePanelPresetId, setActivePanelPresetIdState] = useState<string>(() => loadActivePresetId());
  const activePanelPreset = panelPresets.find(p => p.id === activePanelPresetId) || panelPresets[0];

  // Presets de Baús de Teto
  const [cargoBoxPresets, setCargoBoxPresetsState] = useState<CargoBoxPreset[]>(() => loadCargoBoxPresets());
  const [activeCargoPresetId, setActiveCargoPresetIdState] = useState<string>(() => loadActiveCargoPresetId());
  const activeCargoBoxPreset = cargoBoxPresets.find(p => p.id === activeCargoPresetId) || cargoBoxPresets[0];

  // Armazenadores e Caixas Internas (Grid Camper)
  const [internalGrid, setInternalGridState] = useState<InternalGridConfig>(DEFAULT_INTERNAL_GRID);
  const [internalBoxes, setInternalBoxesState] = useState<InternalBoxItem[]>(INTERNAL_BOXES_PRESETS[0].boxes);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isolatedBoxId, setIsolatedBoxIdState] = useState<string | null>(null);
  const [isOpenPreview, setIsOpenPreview] = useState<boolean>(false);
  const [isCabinetsOpenPreview, setIsCabinetsOpenPreview] = useState<boolean>(false);
  const [isBedOpenPreview, setIsBedOpenPreview] = useState<boolean>(false);
  const [showMattress, setShowMattress] = useState<boolean>(true);

  // Métricas
  const [energyStats, setEnergyStats] = useState<EnergyStats>({
    nominalPowerW: 400,
    effectiveWatts: 200,
    dailyKWh: 1.04,
    panelCount: 4,
    efficiencyPercent: 0,
    systemVoltage: 24,
    mpptCurrentAmps: 14.7,
    level1Panels: 2,
    level2Panels: 2,
    stackLevels: 2
  });

  const [appliances, setAppliances] = useState<ApplianceItem[]>([]);
  const [loadsSummary, setLoadsSummary] = useState<LoadsSummary>({
    count: 7,
    activeCount: 7,
    totalWatts: 225,
    totalWh: 1222,
    totalAh: 95.5,
    totalKWh: 1.22
  });

  const [batteryPerformance, setBatteryPerformance] = useState<BatteryPerformance>({
    dailyWhGenerated: 1040,
    dailyConsumptionWh: 1222,
    surplusWh: -182,
    isAutonomous: false,
    percent: 85,
    solarAmps12V: 15.6,
    dailyAhInjected: 86,
    solarHoursToFull: 28.7,
    solarDaysToFull: 6,
    daysRainAutonomy: 4.7,
    batCapacityWh: 7168,
    batUsableWh: 5734,
    appliances: [],
    loadsSummary: { count: 7, activeCount: 7, totalWatts: 225, totalWh: 1222, totalAh: 95.5, totalKWh: 1.22 }
  });

  const toastTimerRef = useRef<any>(null);

  const flashToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  const updateCalculations = () => {
    if (!sceneManager) return;
    const stats = sceneManager.solarSystem.getEnergyStats();
    const curWatts = stats.watts;
    const dailyKWhNum = parseFloat(stats.dailyKWh);

    const batPerf = sceneManager.solarSim.calculateBatteryPerformance(curWatts, dailyKWhNum);
    const summary = sceneManager.solarSim.getLoadsSummary();

    setEnergyStats({
      nominalPowerW: stats.powerOpen,
      effectiveWatts: curWatts,
      dailyKWh: dailyKWhNum,
      panelCount: stats.totalPanels,
      efficiencyPercent: stats.percent,
      systemVoltage: 24,
      mpptCurrentAmps: parseFloat(stats.currentAmps12V),
      voc: stats.voc,
      vmp: stats.vmp,
      isc: stats.isc,
      level1Panels: stats.level1Panels,
      level2Panels: stats.level2Panels,
      stackLevels: stats.stackLevels
    });

    setBatteryPerformance(batPerf);
    setLoadsSummary(summary);
    setAppliances([...sceneManager.solarSim.APPLIANCES]);
  };

  const isDbLoadedRef = useRef<boolean>(false);

  // Carrega configurações do Banco de Dados (IndexedDB) ao montar
  useEffect(() => {
    (async () => {
      try {
        let cfg = await dbGet<SavedConfig>('doblo_solar_config');
        if (!cfg) {
          const legacyFullCfg = await dbGet<any>('doblo_solar_full_config');
          if (legacyFullCfg) {
            cfg = legacyFullCfg;
          }
        }

        if (cfg) {
          if (cfg.stackLevels) setStackLevelsState(cfg.stackLevels);
          if (cfg.level1) setLevel1State(cfg.level1);
          if (cfg.level2) setLevel2State(cfg.level2);
          if (cfg.structureMaterial) setStructureMaterialState(cfg.structureMaterial);
          if (cfg.steelProfileUnit) setSteelProfileUnitState(cfg.steelProfileUnit);
          if (cfg.aluminumColor) setAluminumColorState(cfg.aluminumColor);
          if (cfg.metalonColor) setMetalonColorState(cfg.metalonColor);
          if (cfg.metalonWallThickness !== undefined) setMetalonWallThicknessState(cfg.metalonWallThickness);
          if (cfg.metalonThickness40 !== undefined) setMetalonThickness40State(cfg.metalonThickness40);
          if (cfg.metalonThickness30 !== undefined) setMetalonThickness30State(cfg.metalonThickness30);
          if (cfg.cargoBox) {
            const maxLift = Math.max(60, Math.floor(((cfg.cargoBox.height || 330) - 100) / 10) * 10);
            setCargoBoxState({
              ...cfg.cargoBox,
              verticalLiftMm: Math.max(0, Math.min(maxLift, cfg.cargoBox.verticalLiftMm || 0))
            });
          }
          if (cfg.waterTank) {
            setWaterTankState({
              enabled: Boolean(cfg.waterTank.enabled),
              lengthMm: Math.max(400, Math.min(2200, Math.round(cfg.waterTank.lengthMm || 2200))),
              diameterMm: Math.max(80, Math.min(350, Math.round(cfg.waterTank.diameterMm || 200)))
            });
          }
          if (cfg.awning) {
            setAwningState(cfg.awning);
          }
          if (cfg.b2bEngineHours !== undefined) {
            setB2BCharger(prev => ({ ...prev, engineHoursPerDay: cfg.b2bEngineHours! }));
          }
          if (cfg.panelPresetId) {
            setActivePanelPresetIdState(cfg.panelPresetId);
          }
          if (cfg.cargoBoxPresetId) {
            setActiveCargoPresetIdState(cfg.cargoBoxPresetId);
          }
          if (cfg.offsetZ !== undefined) {
            const zVal = cfg.offsetZ > 0.1 ? -cfg.offsetZ : cfg.offsetZ;
            setOffsetZState(zVal);
          }
          if (cfg.offsetY !== undefined) {
            const safeOffsetY = Math.max(0, cfg.offsetY);
            setOffsetYState(safeOffsetY);
          }
          if (cfg.expansionProgress !== undefined) setExpansionProgressState(cfg.expansionProgress);
        }

        const savedPanelPresets = await dbGet<SolarPanelPreset[]>('doblo_solar_panel_presets');
        if (savedPanelPresets && Array.isArray(savedPanelPresets) && savedPanelPresets.length > 0) {
          setPanelPresetsState(loadPanelPresets());
        }
        const savedActivePanelId = await dbGet<string>('doblo_solar_active_preset_id');
        if (savedActivePanelId) {
          setActivePanelPresetIdState(savedActivePanelId);
        }

        const savedCargoPresets = await dbGet<CargoBoxPreset[]>('doblo_cargo_box_presets');
        if (savedCargoPresets && Array.isArray(savedCargoPresets) && savedCargoPresets.length > 0) {
          setCargoBoxPresetsState(loadCargoBoxPresets());
        }
        const savedActiveCargoId = await dbGet<string>('doblo_active_cargo_preset_id');
        if (savedActiveCargoId) {
          setActiveCargoPresetIdState(savedActiveCargoId);
        }

        const savedGrid = await dbGet<InternalGridConfig>('doblo_internal_grid');
        if (savedGrid && savedGrid.colsX && savedGrid.rowsZ) {
          if (!savedGrid.ceiling) {
            savedGrid.ceiling = { ...DEFAULT_CEILING_CONFIG };
          }
          setInternalGridState(savedGrid);
        }

        const savedBoxes = await dbGet<InternalBoxItem[]>('doblo_internal_boxes');
        if (savedBoxes && Array.isArray(savedBoxes)) {
          setInternalBoxesState(savedBoxes);
        }

        const savedPartsFilter = await dbGet<PartsGroupFilter>('doblo_parts_filter');
        if (savedPartsFilter) {
          setPartsFilterState(savedPartsFilter);
        }
      } catch (e) {
        console.warn('Erro ao restaurar configurações do banco de dados:', e);
      } finally {
        isDbLoadedRef.current = true;
      }
    })();
  }, []);

  // Quando o sceneManager estiver disponível, aplica as configurações restauradas
  useEffect(() => {
    if (!sceneManager) return;

    sceneManager.solarSystem.setCargoBox(cargoBox);
    sceneManager.solarSystem.setWaterTank(waterTank);
    sceneManager.solarSystem.setAwningConfig(awning);
    if (activePanelPreset) {
      sceneManager.solarSystem.setPanelSpecs({
        width: activePanelPreset.width,
        length: activePanelPreset.length,
        thickness: activePanelPreset.thickness,
        weightKg: activePanelPreset.weightKg,
        powerWatts: activePanelPreset.powerWatts,
        voc: activePanelPreset.voc,
        vmp: activePanelPreset.vmp,
        isc: activePanelPreset.isc,
        imp: activePanelPreset.imp,
        name: activePanelPreset.name,
        cellCount: activePanelPreset.cellCount,
        cols: activePanelPreset.cols,
        rows: activePanelPreset.rows
      });
    }

    sceneManager.solarSystem.setStackLevels(stackLevels);
    sceneManager.solarSystem.setLevel1Panels(level1.panels);
    sceneManager.solarSystem.setLevel1Direction(level1.direction);
    sceneManager.solarSystem.setLevel1Orientation(level1.orientation);

    sceneManager.solarSystem.setLevel2Panels(level2.panels);
    sceneManager.solarSystem.setLevel2Direction(level2.direction);
    sceneManager.solarSystem.setLevel2Orientation(level2.orientation);

    sceneManager.solarSystem.setStructureMaterial(structureMaterial);
    sceneManager.solarSystem.setSteelProfileUnit(steelProfileUnit);
    sceneManager.solarSystem.setAluminumColor(aluminumColor);
    sceneManager.solarSystem.setMetalonColor(metalonColor);
    sceneManager.solarSystem.setMetalonThickness(metalonThickness40, metalonThickness30);

    sceneManager.solarSystem.setGroupOffsetZ(offsetZ);
    sceneManager.solarSystem.setGroupOffsetY(offsetY);
    sceneManager.setExpansion(expansionProgress);

    sceneManager.onBarHoverChange = (data, x, y) => {
      setHoveredBar(data);
      setHoverPos({ x, y });
    };

    sceneManager.onExpansionChange = (prog) => {
      setExpansionProgressState(prog);
      updateCalculations();
    };

    sceneManager.onBoxSelect = (boxId: string | null) => {
      setSelectedBoxId(boxId);
    };

    sceneManager.onBoxDoubleClick = (boxId: string | null) => {
      setIsolatedBoxId(boxId);
    };

    updateCalculations();
  }, [sceneManager]);

  // Sincroniza o toldo 3D sempre que o estado awning ou o sceneManager mudar
  useEffect(() => {
    if (!sceneManager) return;
    sceneManager.solarSystem.setAwningConfig(awning);
  }, [sceneManager, awning]);

  const setIsolatedBoxId = (id: string | null) => {
    setIsolatedBoxIdState(id);
    if (id) {
      setSelectedBoxId(id);
      if (viewMode !== 'internal_boxes') {
        setViewModeState('internal_boxes');
        if (sceneManager) sceneManager.setViewMode('internal_boxes', isVehicleVisible);
      }
      const targetBox = internalBoxes.find((b) => b.id === id);
      flashToast(`🎯 Modo Foco: Visualizando apenas "${targetBox?.name || 'Baú'}"`);
      if (sceneManager) {
        sceneManager.focusOnBox(id);
      }
    } else {
      flashToast('👁️ Exibindo todos os baús');
      if (sceneManager) {
        sceneManager.focusOnBox(null);
      }
    }
  };

  // Sincroniza o sistema 3D de caixas internas sempre que mudar
  useEffect(() => {
    if (!sceneManager) return;
    sceneManager.updateInternalBoxes(
      internalGrid,
      internalBoxes,
      selectedBoxId,
      {
        openCabinets: isCabinetsOpenPreview || isOpenPreview,
        openBed: isBedOpenPreview || isOpenPreview,
        showMattress: showMattress
      },
      isolatedBoxId
    );
  }, [sceneManager, internalGrid, internalBoxes, selectedBoxId, isCabinetsOpenPreview, isBedOpenPreview, showMattress, isOpenPreview, isolatedBoxId]);

  // Tecla ESC para sair do modo de foco isolado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isolatedBoxId) {
        setIsolatedBoxId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isolatedBoxId]);

  // Persiste caixas e grid no IndexedDB apenas após a carga inicial
  useEffect(() => {
    if (!isDbLoadedRef.current) return;
    dbSet('doblo_internal_grid', internalGrid);
  }, [internalGrid]);

  useEffect(() => {
    if (!isDbLoadedRef.current) return;
    dbSet('doblo_internal_boxes', internalBoxes);
  }, [internalBoxes]);

  // Funções de manipulação das caixas internas com persistência direta imediata
  const setInternalGrid = (newGrid: InternalGridConfig | ((prev: InternalGridConfig) => InternalGridConfig)) => {
    setInternalGridState(prev => {
      const next = typeof newGrid === 'function' ? newGrid(prev) : newGrid;
      if (isDbLoadedRef.current) {
        dbSet('doblo_internal_grid', next);
      }
      return next;
    });
  };

  const setCeiling = (updates: Partial<CeilingConfig> | ((prev: CeilingConfig) => Partial<CeilingConfig>)) => {
    setInternalGridState(prev => {
      const currentCeiling = prev.ceiling || { ...DEFAULT_CEILING_CONFIG };
      const resolved = typeof updates === 'function' ? updates(currentCeiling) : updates;
      const sanitizedUpdates = { ...resolved };
      if (typeof sanitizedUpdates.curvatureMm === 'number') {
        sanitizedUpdates.curvatureMm = Math.max(0, Math.min(30, sanitizedUpdates.curvatureMm));
      }
      const next: InternalGridConfig = {
        ...prev,
        ceiling: {
          ...currentCeiling,
          ...sanitizedUpdates
        }
      };
      if (isDbLoadedRef.current) {
        dbSet('doblo_internal_grid', next);
      }
      return next;
    });
  };

  const toggleCeiling3D = () => {
    setCeiling(prev => ({ visibleIn3D: !(prev.visibleIn3D !== false) }));
  };

  const setInternalBoxes = (newBoxes: InternalBoxItem[] | ((prev: InternalBoxItem[]) => InternalBoxItem[])) => {
    setInternalBoxesState(prev => {
      const next = typeof newBoxes === 'function' ? newBoxes(prev) : newBoxes;
      if (isDbLoadedRef.current) {
        dbSet('doblo_internal_boxes', next);
      }
      return next;
    });
  };

  const applyInternalBoxesPreset = (presetId: string) => {
    const preset = INTERNAL_BOXES_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setInternalGridState(preset.grid);
      setInternalBoxesState(preset.boxes);
      setSelectedBoxId(null);
      setIsolatedBoxIdState(null);
      if (isDbLoadedRef.current) {
        dbSet('doblo_internal_grid', preset.grid);
        dbSet('doblo_internal_boxes', preset.boxes);
      }
      flashToast(`📐 Layout Aplicado: ${preset.name}`);
    }
  };

  const addInternalBox = (box: Omit<InternalBoxItem, 'id'>): string => {
    const id = `box_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newBox: InternalBoxItem = { ...box, id };
    setInternalBoxesState(prev => {
      const next = [...prev, newBox];
      if (isDbLoadedRef.current) {
        dbSet('doblo_internal_boxes', next);
      }
      return next;
    });
    setSelectedBoxId(id);
    flashToast(`📦 Caixa "${newBox.name}" adicionada ao grid`);
    return id;
  };

  const updateInternalBox = (id: string, updates: Partial<InternalBoxItem>) => {
    setInternalBoxesState(prev => {
      const next = prev.map(b => (b.id === id ? { ...b, ...updates } : b));
      if (isDbLoadedRef.current) {
        dbSet('doblo_internal_boxes', next);
      }
      return next;
    });
  };

  const removeInternalBox = (id: string) => {
    setInternalBoxesState(prev => {
      const next = prev.filter(b => b.id !== id);
      if (isDbLoadedRef.current) {
        dbSet('doblo_internal_boxes', next);
      }
      return next;
    });
    if (selectedBoxId === id) setSelectedBoxId(null);
    if (isolatedBoxId === id) {
      setIsolatedBoxIdState(null);
      if (sceneManager) sceneManager.focusOnBox(null);
    }
    flashToast('🗑️ Caixa removida do grid');
  };

  const clearInternalBoxes = () => {
    setInternalBoxesState([]);
    setSelectedBoxId(null);
    setIsolatedBoxIdState(null);
    if (sceneManager) sceneManager.focusOnBox(null);
    if (isDbLoadedRef.current) {
      dbSet('doblo_internal_boxes', []);
    }
    flashToast('🧹 Grid limpo: todas as caixas foram removidas');
  };

  // Salva configurações no Banco de Dados (IndexedDB)
  const saveConfig = (overrides?: Partial<SavedConfig>) => {
    const configToSave: SavedConfig = {
      stackLevels: overrides?.stackLevels ?? stackLevels,
      level1: overrides?.level1 ?? level1,
      level2: overrides?.level2 ?? level2,
      structureMaterial: overrides?.structureMaterial ?? structureMaterial,
      steelProfileUnit: overrides?.steelProfileUnit ?? steelProfileUnit,
      aluminumColor: overrides?.aluminumColor ?? aluminumColor,
      metalonColor: overrides?.metalonColor ?? metalonColor,
      metalonWallThickness: overrides?.metalonWallThickness ?? metalonWallThickness,
      metalonThickness40: overrides?.metalonThickness40 ?? metalonThickness40,
      metalonThickness30: overrides?.metalonThickness30 ?? metalonThickness30,
      cargoBox: overrides?.cargoBox ?? cargoBox,
      waterTank: overrides?.waterTank ?? waterTank,
      awning: overrides?.awning ?? awning,
      offsetZ: overrides?.offsetZ ?? offsetZ,
      offsetY: overrides?.offsetY ?? offsetY,
      expansionProgress: overrides?.expansionProgress ?? expansionProgress,
      b2bEngineHours: overrides?.b2bEngineHours ?? b2bCharger.engineHoursPerDay,
      panelPresetId: overrides?.panelPresetId ?? activePanelPresetId,
      cargoBoxPresetId: overrides?.cargoBoxPresetId ?? activeCargoPresetId
    };
    dbSet('doblo_solar_config', configToSave);
    flashToast('✅ Configuração Salva no Banco de Dados');
  };

  const setStackLevels = (levels: StackLevels) => {
    setStackLevelsState(levels);
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      sceneManager.solarSystem.setStackLevels(levels);
      sceneManager.audio.playLockClick();
      updateCalculations();
    }
    saveConfig({ stackLevels: levels });
  };

  const setLevel1Panels = (count: number) => {
    const next = { ...level1, panels: count };
    setLevel1State(next);
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      sceneManager.solarSystem.setLevel1Panels(count);
      sceneManager.audio.playLockClick();
      updateCalculations();
    }
    saveConfig({ level1: next });
  };

  const setLevel1Direction = (direction: SlideDirection) => {
    const next = { ...level1, direction };
    setLevel1State(next);
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      sceneManager.solarSystem.setLevel1Direction(direction);
      sceneManager.audio.playLockClick();
      updateCalculations();
    }
    saveConfig({ level1: next });
  };

  const setLevel1Orientation = (orientation: PanelOrientation) => {
    const next = { ...level1, orientation };
    setLevel1State(next);
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      sceneManager.solarSystem.setLevel1Orientation(orientation);
      sceneManager.audio.playLockClick();
      updateCalculations();
    }
    saveConfig({ level1: next });
  };

  const setLevel2Panels = (count: number) => {
    const next = { ...level2, panels: count };
    setLevel2State(next);
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      sceneManager.solarSystem.setLevel2Panels(count);
      sceneManager.audio.playLockClick();
      updateCalculations();
    }
    saveConfig({ level2: next });
  };

  const setLevel2Direction = (direction: SlideDirection) => {
    const next = { ...level2, direction };
    setLevel2State(next);
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      sceneManager.solarSystem.setLevel2Direction(direction);
      sceneManager.audio.playLockClick();
      updateCalculations();
    }
    saveConfig({ level2: next });
  };

  const setLevel2Orientation = (orientation: PanelOrientation) => {
    const next = { ...level2, orientation };
    setLevel2State(next);
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      sceneManager.solarSystem.setLevel2Orientation(orientation);
      sceneManager.audio.playLockClick();
      updateCalculations();
    }
    saveConfig({ level2: next });
  };

  const setStructureMaterial = (mat: StructureMaterial) => {
    setStructureMaterialState(mat);
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      sceneManager.solarSystem.setStructureMaterial(mat);
      sceneManager.audio.playLockClick();
      updateCalculations();
    }
    saveConfig({ structureMaterial: mat });
  };

  const setSteelProfileUnit = (unit: SteelProfileUnit) => {
    setSteelProfileUnitState(unit);
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      sceneManager.solarSystem.setSteelProfileUnit(unit);
      sceneManager.audio.playLockClick();
      updateCalculations();
    }
    saveConfig({ steelProfileUnit: unit });
  };

  const setAluminumColor = (color: AluminumColor) => {
    setAluminumColorState(color);
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      sceneManager.solarSystem.setAluminumColor(color);
      sceneManager.audio.playLockClick();
    }
    saveConfig({ aluminumColor: color });
  };

  const setMetalonColor = (color: string) => {
    setMetalonColorState(color);
    if (sceneManager) {
      sceneManager.solarSystem.setMetalonColor(color);
      sceneManager.audio.playLockClick();
    }
    saveConfig({ metalonColor: color });
  };

  const setMetalonWallThickness = (thickness: number) => {
    const clamped = Math.max(0.5, Math.min(6.0, Number(thickness) || 1.5));
    setMetalonWallThicknessState(clamped);
    setMetalonThickness40State(clamped);
    setMetalonThickness30State(clamped);
    if (sceneManager) {
      sceneManager.solarSystem.setMetalonThickness(clamped, clamped);
      sceneManager.audio.playLockClick();
      updateCalculations();
    }
    saveConfig({
      metalonWallThickness: clamped,
      metalonThickness40: clamped,
      metalonThickness30: clamped
    });
  };

  const setMetalonThickness40 = (thickness: number) => {
    const clamped = Math.max(0.5, Math.min(6.0, Number(thickness) || 2.0));
    setMetalonThickness40State(clamped);
    if (sceneManager) {
      sceneManager.solarSystem.setMetalonThickness(clamped, metalonThickness30);
      sceneManager.audio.playLockClick();
      updateCalculations();
    }
    saveConfig({ metalonThickness40: clamped });
  };

  const setMetalonThickness30 = (thickness: number) => {
    const clamped = Math.max(0.5, Math.min(6.0, Number(thickness) || 1.5));
    setMetalonThickness30State(clamped);
    if (sceneManager) {
      sceneManager.solarSystem.setMetalonThickness(metalonThickness40, clamped);
      sceneManager.audio.playLockClick();
      updateCalculations();
    }
    saveConfig({ metalonThickness30: clamped });
  };

  const setOffsetZ = (z: number) => {
    setOffsetZState(z);
    if (sceneManager) {
      sceneManager.solarSystem.setGroupOffsetZ(z);
    }
    saveConfig({ offsetZ: z });
  };

  const setOffsetY = (y: number) => {
    setOffsetYState(y);
    if (sceneManager) {
      sceneManager.solarSystem.setGroupOffsetY(y);
    }
    saveConfig({ offsetY: y });
  };

  const setExpansion = (val: number) => {
    if (cargoBox.enabled && cargoBox.tiltAngle > 0 && val > 0) {
      flashToast('⚠️ Feche o rack solar (0°) antes de expandir as gavetas!');
      return;
    }
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      setIsAutoAnimating(false);
      sceneManager.isAutoAnimating = false;
      sceneManager.setExpansion(val);
      sceneManager.audio.playSlideSound(0.5);
    } else {
      setExpansionProgressState(val);
    }
    updateCalculations();
  };

  const toggleVehicle = () => {
    const next = !isVehicleVisible;
    setIsVehicleVisible(next);
    if (sceneManager) sceneManager.vehicle.setVisible(next);
  };

  const setVehicleOpacity = (op: number) => {
    setVehicleOpacityState(op);
    if (sceneManager) sceneManager.setVehicleOpacity(op);
  };

  const toggleDimensions = () => {
    const next = !isDimensionsVisible;
    setIsDimensionsVisible(next);
    if (sceneManager) sceneManager.solarSystem.setDimensionsVisible(next);
  };

  const toggleChain = () => {
    const next = !isChainVisible;
    setIsChainVisible(next);
    if (sceneManager) sceneManager.solarSystem.setCableChainVisible(next);
  };

  const toggleTransparency = () => {
    const next = !isTransparent;
    setIsTransparent(next);
    if (sceneManager) sceneManager.solarSystem.setUpperTransparency(next);
  };

  const toggleSound = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    if (sceneManager) sceneManager.audio.toggleSound(next);
  };

  const toggleAutoAnim = () => {
    if (sceneManager) {
      const running = sceneManager.toggleAutoAnim();
      setIsAutoAnimating(running);
    }
  };

  const expand = () => {
    if (cargoBox.enabled && cargoBox.tiltAngle > 0) {
      flashToast('⚠️ Feche o rack solar (0°) antes de expandir as gavetas!');
      return;
    }
    if (sceneManager) {
      setIsAutoAnimating(false);
      sceneManager.animateExpansionTo(1.0);
    }
  };

  const retract = () => {
    if (sceneManager) {
      setIsAutoAnimating(false);
      sceneManager.animateExpansionTo(0.0);
    }
  };

  const rewind = () => {
    if (sceneManager) {
      setIsAutoAnimating(false);
      sceneManager.rewindCycle();
    }
  };

  const setCameraPreset = (preset: CameraPreset) => {
    setActiveCameraPreset(preset);
    if (sceneManager) sceneManager.setCameraPreset(preset);
  };

  const setSunHour = (hour: number) => {
    setSunHourState(hour);
    if (sceneManager) sceneManager.solarSim.updateSunPosition(hour);
  };

  const takeScreenshot = () => {
    if (sceneManager) sceneManager.takeScreenshot();
  };

  const openModal = (modal: 'loads' | 'battery' | 'mppt' | 'bom' | 'b2b' | 'usina' | 'panel-presets' | 'cargo-presets' | 'help' | null) => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // --- PRESETS DE PLACA SOLAR ---
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

  // --- PRESETS DE BAÚ DE TETO ---
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

  const addAppliance = (name: string, watts: number, hours: number, qty: number = 1) => {
    if (sceneManager) {
      sceneManager.solarSim.addAppliance(name, watts, hours, qty);
      updateCalculations();
      flashToast('🔌 Carga Adicionada');
    }
  };

  const updateAppliance = (id: string, updates: Partial<ApplianceItem>) => {
    if (sceneManager) {
      sceneManager.solarSim.updateAppliance(id, updates);
      updateCalculations();
    }
  };

  const removeAppliance = (id: string) => {
    if (sceneManager) {
      sceneManager.solarSim.removeAppliance(id);
      updateCalculations();
      flashToast('🗑️ Carga Removida');
    }
  };

  const moveAppliance = (id: string, direction: 'up' | 'down') => {
    if (sceneManager) {
      sceneManager.solarSim.moveAppliance(id, direction);
      updateCalculations();
    }
  };

  const reorderAppliances = (fromIndex: number, toIndex: number) => {
    if (sceneManager) {
      sceneManager.solarSim.reorderAppliances(fromIndex, toIndex);
      updateCalculations();
    }
  };

  const resetAppliances = () => {
    if (sceneManager) {
      sceneManager.solarSim.resetDefaultAppliances();
      updateCalculations();
      flashToast('🔄 Cargas Restauradas');
    }
  };

  // --- ANIMAÇÃO E MÉTODOS DO BAÚ DE TETO & BASCULAMENTO ---

  const tiltAnimRef = useRef<number | null>(null);
  const animateTiltTo = (targetAngle: number) => {
    if (tiltAnimRef.current) cancelAnimationFrame(tiltAnimRef.current);
    const startAngle = cargoBox.tiltAngle;
    const startTime = performance.now();
    const duration = 850;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const current = startAngle + (targetAngle - startAngle) * ease;
      setTiltAngle(current);
      if (progress < 1) {
        tiltAnimRef.current = requestAnimationFrame(step);
      } else {
        tiltAnimRef.current = null;
      }
    };
    tiltAnimRef.current = requestAnimationFrame(step);
  };

  const lidAnimRef = useRef<number | null>(null);
  const animateBoxLidTo = (targetAngle: number) => {
    if (lidAnimRef.current) cancelAnimationFrame(lidAnimRef.current);
    const startAngle = cargoBox.lidAngle;
    const startTime = performance.now();
    const duration = 550;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const current = startAngle + (targetAngle - startAngle) * ease;
      setBoxLidAngle(current);
      if (progress < 1) {
        lidAnimRef.current = requestAnimationFrame(step);
      } else {
        lidAnimRef.current = null;
      }
    };
    lidAnimRef.current = requestAnimationFrame(step);
  };

  const setCargoBox = (updates: Partial<CargoBoxConfig>) => {
    const next = { ...cargoBox, ...updates };
    setCargoBoxState(next);
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      sceneManager.solarSystem.setCargoBox(next);
      updateCalculations();
    }
    saveConfig({ cargoBox: next });
  };

  const setCargoBoxEnabled = (enabled: boolean) => {
    setCargoBox({ enabled });
    flashToast(enabled ? '🧰 Baú de Teto Ativado' : '🚫 Baú de Teto Desativado');
  };

  const setCargoBoxDimensions = (length: number, width: number, height: number) => {
    const maxLiftMm = Math.max(60, Math.floor((height - 100) / 10) * 10);
    const verticalLiftMm = Math.min(maxLiftMm, cargoBox.verticalLiftMm || 0);
    setCargoBox({ length, width, height, verticalLiftMm });
  };

  const setCargoBoxVerticalLift = (liftMm: number) => {
    const maxLiftMm = Math.max(60, Math.floor(((cargoBox.height || 330) - 100) / 10) * 10);
    const clamped = Math.max(0, Math.min(maxLiftMm, Math.round(liftMm)));
    setCargoBox({ verticalLiftMm: clamped });
  };

  const setCargoBoxTelescopic = (isTelescopic: boolean) => {
    const next = {
      ...cargoBox,
      isTelescopic,
      verticalLiftMm: isTelescopic ? (cargoBox.verticalLiftMm || 0) : 0
    };
    setCargoBoxState(next);
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      sceneManager.solarSystem.setCargoBox(next);
      updateCalculations();
    }
    saveConfig({ cargoBox: next });
    flashToast(isTelescopic ? '↕ Torres Telescópicas de Elevação Ativadas' : '🔒 Torres Fixas Ativadas (Mínima Altura)');
  };

  const setCargoBoxHingeSide = (hingeSide: 'driver' | 'passenger') => {
    setCargoBox({ hingeSide, tiltAngle: 0, lidAngle: 0 });
    flashToast(`🔄 Dobradiças no lado do ${hingeSide === 'driver' ? 'Motorista (abre para calçada)' : 'Passageiro'}`);
  };

  const setTiltAngle = (tiltAngle: number) => {
    const next = { ...cargoBox, tiltAngle };
    setCargoBoxState(next);
    if (sceneManager) {
      sceneManager.solarSystem.setTiltAngle(tiltAngle);
    }
  };

  const setBoxLidAngle = (lidAngle: number) => {
    const next = { ...cargoBox, lidAngle };
    setCargoBoxState(next);
    if (sceneManager) {
      sceneManager.solarSystem.setBoxLidAngle(lidAngle);
    }
  };

  const tiltSolarRack = () => {
    if (expansionProgress > 0.02) {
      retractAndTilt();
      return;
    }
    animateTiltTo(65);
  };

  const closeSolarRack = () => {
    setBoxLidAngle(0);
    animateTiltTo(0);
  };

  const openBoxLid = () => {
    animateBoxLidTo(38);
  };

  const closeBoxLid = () => {
    animateBoxLidTo(0);
  };

  const retractAndTilt = () => {
    if (sceneManager) {
      sceneManager.animateExpansionTo(0.0);
    }
    flashToast('⚡ Recolhendo gavetas com segurança...');
    setTimeout(() => {
      animateTiltTo(65);
    }, 700);
  };

  // ─── Caixa d'Água Lateral (2× Canos — 1 de cada lado) ───────────────
  const setWaterTank = (updates: Partial<WaterTankConfig>) => {
    const clampedLen = updates.lengthMm !== undefined
      ? Math.max(400, Math.min(2200, Math.round(updates.lengthMm)))
      : waterTank.lengthMm;
    const clampedDia = updates.diameterMm !== undefined
      ? Math.max(80, Math.min(350, Math.round(updates.diameterMm)))
      : waterTank.diameterMm;
    const next: WaterTankConfig = {
      ...waterTank,
      ...updates,
      lengthMm: clampedLen,
      diameterMm: clampedDia
    };
    setWaterTankState(next);
    if (sceneManager) {
      sceneManager.solarSystem.setWaterTank(next);
    }
    saveConfig({ waterTank: next });
  };

  const setWaterTankEnabled = (enabled: boolean) => {
    setWaterTank({ enabled });
    const radiusDm = (waterTank.diameterMm / 2) / 100;
    const litersTotal = +(2 * Math.PI * radiusDm * radiusDm * (waterTank.lengthMm / 100)).toFixed(1);
    flashToast(
      enabled
        ? `💧 2× Canos R=${waterTank.diameterMm / 2}mm (Ø${waterTank.diameterMm}mm) ativados (${waterTank.lengthMm}mm • ${litersTotal} L)`
        : `🚫 Caixa d'água desativada`
    );
  };

  const setWaterTankLength = (lengthMm: number) => {
    const clamped = Math.max(400, Math.min(2200, Math.round(lengthMm)));
    setWaterTank({ lengthMm: clamped });
  };

  const setWaterTankRadius = (radiusMm: number) => {
    const clampedRadius = Math.max(40, Math.min(175, Math.round(radiusMm)));
    setWaterTank({ diameterMm: clampedRadius * 2 });
  };

  // ─── Toldo Retrátil Overland (Traseiro ou Asa de Morcego 270°) ────────
  const setAwning = (updates: Partial<AwningConfig>) => {
    const next: AwningConfig = { ...awning, ...updates };
    setAwningState(next);
    if (sceneManager) {
      sceneManager.solarSystem.setAwningConfig(next);
      updateCalculations();
    }
    if (updates.enabled !== undefined) {
      flashToast(updates.enabled ? '⛺ Toldo Retrátil Overland Ativado' : '🚫 Toldo Overland Desativado');
    }
    saveConfig({ awning: next });
  };

  const toggleAwningOpen = () => {
    const next: AwningConfig = { ...awning, isOpen: !awning.isOpen };
    setAwningState(next);
    if (sceneManager) {
      sceneManager.solarSystem.setAwningConfig(next);
      updateCalculations();
    }
    flashToast(next.isOpen ? '⛺ Toldo Overland Aberto / Desdobrado!' : '⛺ Toldo Recolhido no Estojo');
    saveConfig({ awning: next });
  };

  // ─── Carregador Inteligente DC-DC B2B1230 ──────────────────────────────────
  const setB2BEnabled = (enabled: boolean) => {
    setB2BCharger(prev => ({ ...prev, enabled }));
    flashToast(enabled ? '🔋 Carregador B2B1230 ativado!' : '⏸️ Carregador B2B1230 desativado');
  };

  const toggleB2BEngine = () => {
    setB2BCharger(prev => {
      const isRunning = !prev.isEngineRunning;
      if (isRunning) {
        flashToast('🚗 Alternador Doblò LIGADO! Injetando 30A (390W) na LiFePO4');
        if (sceneManager) {
          sceneManager.audio.startEngineSound();
        }
      } else {
        flashToast('🅿️ Motor Doblò DESLIGADO (modo estacionado / apenas solar)');
        if (sceneManager) {
          sceneManager.audio.stopEngineSound();
        }
      }
      const updated = { ...prev, isEngineRunning: isRunning };
      b2bChargerRef.current = updated;
      return updated;
    });
  };

  const setB2BEngineHours = (hours: number) => {
    const clamped = Math.max(0, Math.min(24, Math.round(hours * 10) / 10));
    setB2BCharger(prev => {
      const next = { ...prev, engineHoursPerDay: clamped };
      b2bChargerRef.current = next;
      return next;
    });
    b2bChargerRef.current = { ...b2bChargerRef.current, engineHoursPerDay: clamped };
    updateCalculations();
    saveConfig({ b2bEngineHours: clamped });
    if (clamped === 0) {
      flashToast('🅿️ Van estacionada (0h motor ligado): apenas geração solar considerada');
    } else {
      flashToast(`🚗 Motor Doblò configurado: ${clamped}h/dia (+${Math.round(clamped * 30)} Ah/dia)`);
    }
  };

  // ─── Fonte Usina Smart Connect (70A/120A/150A/200A · Shore Power / Camping) ─
  const toggleUsinaAC = () => {
    setUsinaCharger(prev => {
      const isConnected = !prev.isConnectedAC;
      if (isConnected) {
        flashToast(`🔌 Shore Power CONECTADO! Usina ${prev.modelRating}A injetando até ${prev.chargingAmps}A (${Math.round(prev.chargingAmps * prev.voltageOut)}W) na bateria`);
      } else {
        flashToast('🔌 Shore Power DESCONECTADO (Modo Off-Grid)');
      }
      return { ...prev, isConnectedAC: isConnected };
    });
  };

  const setUsinaModel = (modelRating: UsinaModelRating) => {
    setUsinaCharger(prev => ({
      ...prev,
      modelRating,
      chargingAmps: modelRating,
      watts: Math.round(modelRating * prev.voltageOut)
    }));
    flashToast(`⚡ Usina alterada para modelo ${modelRating}A (${Math.round(modelRating * 14.4)}W máx)`);
  };

  const setUsinaAmps = (chargingAmps: number) => {
    setUsinaCharger(prev => ({
      ...prev,
      chargingAmps,
      watts: Math.round(chargingAmps * prev.voltageOut)
    }));
  };

  const setUsinaVoltage = (voltageOut: number) => {
    setUsinaCharger(prev => ({
      ...prev,
      voltageOut,
      watts: Math.round(prev.chargingAmps * voltageOut)
    }));
  };

  // ─── Verificação Estrutural de Colisões ─────────────────────────────────────
  const [collisionSummary, setCollisionSummary] = useState<CollisionSummary | null>(null);

  const checkCollisions = () => {
    if (!sceneManager) return;
    const summary = sceneManager.checkStructuralCollisions();
    setCollisionSummary(summary);
    if (summary.errorCount === 0) {
      flashToast(`✅ Nenhuma colisão detectada em ${summary.totalBars} barras!`);
    } else {
      flashToast(`🔴 ${summary.errorCount} colisão(ões) detectada(s)! Barras afetadas: ${summary.collidingBars}`);
    }
  };

  const clearCollisions = () => {
    if (sceneManager) sceneManager.clearStructuralCollisions();
    setCollisionSummary(null);
  };

  // ─── Verificação de Peças Flutuantes (Sustentação na Base) ──────────────────
  const [floatingSummary, setFloatingSummary] = useState<FloatingSummary | null>(null);

  const checkFloating = () => {
    if (!sceneManager) return;
    const summary = sceneManager.checkFloatingProfiles();
    setFloatingSummary(summary);
    if (summary.errorCount === 0) {
      flashToast(`✅ Todas as ${summary.checkedBars} peças sustentadas no subchassi! Nenhuma peça flutuando.`);
    } else {
      flashToast(`⚠️ ${summary.errorCount} peça(s) flutuando sem sustentação inferior!`);
    }
  };

  const clearFloating = () => {
    if (sceneManager) sceneManager.clearFloatingHighlights();
    setFloatingSummary(null);
  };

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (mode !== 'internal_boxes' && isolatedBoxId) {
      setIsolatedBoxIdState(null);
    }
    if (sceneManager) {
      sceneManager.setViewMode(mode, isVehicleVisible);
      if (mode === 'internal_boxes') {
        flashToast('📦 Modo 1: Caixas Internas (Grid & Armazenadores Camper)');
      } else if (mode === 'bars_lineup') {
        const total = sceneManager.barsLineupGroup.userData.totalBars || 0;
        flashToast(`📏 Modo 3: Bancada de Peças (${total} peças alinhadas)`);
      } else {
        flashToast('🚐 Modo 2: Doblò + Estrutura Solar Completa');
      }
    }
  };

  const setPartsFilter = (filter: PartsGroupFilter) => {
    setPartsFilterState(filter);
    try {
      localStorage.setItem('doblo_parts_filter', filter);
    } catch {}
    if (isDbLoadedRef.current) {
      dbSet('doblo_parts_filter', filter);
    }
    if (sceneManager) {
      sceneManager.setBarsLineupFilter(filter);
      if (viewMode === 'bars_lineup') {
        const total = sceneManager.barsLineupGroup.userData.totalBars || 0;
        const label = filter === 'metal' ? '🔩 Ferragens' : filter === 'wood' ? '🪵 Madeira' : '📦 Todas as Peças';
        flashToast(`${label}: ${total} peças alinhadas`);
      }
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'assembled' ? 'bars_lineup' : 'assembled');
  };

  return (
    <SolarContext.Provider
      value={{
        sceneManager,
        setSceneManager,
        stackLevels,
        level1,
        level2,
        structureMaterial,
        steelProfileUnit,
        aluminumColor,
        metalonColor,
        offsetZ,
        offsetY,
        expansionProgress,
        cargoBox,
        waterTank,
        awning,
        b2bCharger,
        usinaCharger,
        isVehicleVisible,
        vehicleOpacity,
        setVehicleOpacity,
        isDimensionsVisible,
        isChainVisible,
        isTransparent,
        isSoundEnabled,
        isAutoAnimating,
        viewMode,
        partsFilter,
        activeCameraPreset,
        sunHour,
        hoveredBar,
        hoverPos,
        activeModal,
        toastMessage,
        panelPresets,
        activePanelPreset,
        selectPanelPreset,
        addPanelPreset,
        updatePanelPreset,
        removePanelPreset,
        cargoBoxPresets,
        activeCargoBoxPreset,
        selectCargoBoxPreset,
        addCargoBoxPreset,
        updateCargoBoxPreset,
        removeCargoBoxPreset,
        energyStats,
        batteryPerformance,
        loadsSummary,
        appliances,
        internalGrid,
        setInternalGrid,
        setCeiling,
        toggleCeiling3D,
        internalBoxes,
        setInternalBoxes,
        selectedBoxId,
        setSelectedBoxId,
        isolatedBoxId,
        setIsolatedBoxId,
        isOpenPreview,
        setIsOpenPreview,
        isCabinetsOpenPreview,
        setIsCabinetsOpenPreview,
        isBedOpenPreview,
        setIsBedOpenPreview,
        showMattress,
        setShowMattress,
        applyInternalBoxesPreset,
        addInternalBox,
        updateInternalBox,
        removeInternalBox,
        clearInternalBoxes,
        setStackLevels,
        setLevel1Panels,
        setLevel1Direction,
        setLevel1Orientation,
        setLevel2Panels,
        setLevel2Direction,
        setLevel2Orientation,
        setStructureMaterial,
        setSteelProfileUnit,
        setAluminumColor,
        setMetalonColor,
        metalonWallThickness,
        metalonThickness40,
        metalonThickness30,
        setMetalonWallThickness,
        setMetalonThickness40,
        setMetalonThickness30,
        setOffsetZ,
        setOffsetY,
        setExpansion,
        setCargoBox,
        setCargoBoxEnabled,
        setCargoBoxDimensions,
        setCargoBoxVerticalLift,
        setCargoBoxTelescopic,
        setCargoBoxHingeSide,
        setTiltAngle,
        setBoxLidAngle,
        tiltSolarRack,
        closeSolarRack,
        openBoxLid,
        closeBoxLid,
        retractAndTilt,
        setWaterTank,
        setWaterTankEnabled,
        setWaterTankLength,
        setWaterTankRadius,
        setAwning,
        toggleAwningOpen,
        setB2BEnabled,
        toggleB2BEngine,
        setB2BEngineHours,
        toggleUsinaAC,
        setUsinaAmps,
        setUsinaVoltage,
        setUsinaModel,
        collisionSummary,
        checkCollisions,
        clearCollisions,
        floatingSummary,
        checkFloating,
        clearFloating,
        toggleVehicle,
        toggleDimensions,
        toggleChain,
        toggleTransparency,
        toggleSound,
        toggleAutoAnim,
        setViewMode,
        setPartsFilter,
        toggleViewMode,
        expand,
        retract,
        rewind,
        setCameraPreset,
        setSunHour,
        takeScreenshot,
        openModal,
        closeModal,
        flashToast,
        addAppliance,
        updateAppliance,
        removeAppliance,
        moveAppliance,
        reorderAppliances,
        resetAppliances
      }}
    >
      {children}
    </SolarContext.Provider>
  );
};

export const useSolar = (): SolarContextType => {
  const context = useContext(SolarContext);
  if (!context) {
    throw new Error('useSolar deve ser usado dentro de um SolarProvider');
  }
  return context;
};

