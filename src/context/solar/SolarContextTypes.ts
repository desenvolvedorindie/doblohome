import { SceneManager } from '../../three/SceneManager';
import { CollisionSummary } from '../../three/CollisionChecker';
import { FloatingSummary } from '../../three/FloatingChecker';
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
  CargoBoxConfig,
  CargoBoxPreset,
  WaterTankConfig,
  AwningConfig,
  SolarPanelPreset,
  FridgePreset,
  PortaPottiPreset,
  StovePreset,
  BatteryPreset,
  MpptPreset,
  B2bPreset,
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
  CeilingConfig,
  RulerLiveState,
  RulerAxisLock
} from '../../types';

export interface SolarContextType {
  sceneManager: SceneManager | null;
  setSceneManager: (mgr: SceneManager | null) => void;
  loadProjectData?: (data: any) => void;

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

  // Boneco de referência humana
  humanFigureVisible: boolean;
  humanFigureHeightM: number;
  toggleHumanFigure: () => void;
  setHumanFigureHeight: (heightM: number) => void;

  hoveredBar: BarMeasurementData | null;
  hoverPos: { x: number; y: number };
  activeModal: 'loads' | 'battery' | 'mppt' | 'bom' | 'b2b' | 'usina' | 'panel-presets' | 'cargo-presets' | 'fridge-presets' | 'portapotti-presets' | 'stove-presets' | 'battery-presets' | 'mppt-presets' | 'b2b-presets' | 'help' | 'about' | null;
  toastMessage: string | null;

  panelPresets: SolarPanelPreset[];
  activePanelPreset: SolarPanelPreset;
  selectPanelPreset: (id: string) => void;
  addPanelPreset: (preset: Omit<SolarPanelPreset, 'id' | 'isDefault'>) => void;
  updatePanelPreset: (id: string, updates: Partial<SolarPanelPreset>) => void;
  removePanelPreset: (id: string) => void;

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
  toggleFloor3D: () => void;
  toggleFloorEnabled: () => void;
  internalBoxes: InternalBoxItem[];
  setInternalBoxes: (boxes: InternalBoxItem[] | ((prev: InternalBoxItem[]) => InternalBoxItem[])) => void;
  selectedBoxId: string | null;
  setSelectedBoxId: (id: string | null) => void;
  isolatedBoxId: string | null;
  setIsolatedBoxId: (id: string | null) => void;
  isOpenPreview: boolean;
  setIsOpenPreview: React.Dispatch<React.SetStateAction<boolean>>;
  isCabinetsOpenPreview: boolean;
  setIsCabinetsOpenPreview: React.Dispatch<React.SetStateAction<boolean>>;
  toggleCabinetsOpenPreview: (forceState?: boolean) => void;
  isBedOpenPreview: boolean;
  setIsBedOpenPreview: React.Dispatch<React.SetStateAction<boolean>>;
  showMattress: boolean;
  setShowMattress: React.Dispatch<React.SetStateAction<boolean>>;
  applyInternalBoxesPreset: (presetId: string) => void;
  addInternalBox: (box: Omit<InternalBoxItem, 'id'>) => string;
  updateInternalBox: (id: string, updates: Partial<InternalBoxItem>) => void;
  removeInternalBox: (id: string) => void;
  clearInternalBoxes: () => void;

  // Régua 3D estilo SketchUp (Caixas Internas)
  rulerState: RulerLiveState;
  toggleRuler: () => void;
  setRulerActive: (active: boolean) => void;
  setRulerAxisLock: (axis: RulerAxisLock) => void;
  clearRulerMeasurements: () => void;
  removeRulerMeasurement: (id: string) => void;

  setStackLevels: (levels: StackLevels) => void;
  setLevel1Panels: (count: number) => void;
  setLevel1Direction: (direction: SlideDirection) => void;
  setLevel1Orientation: (orientation: PanelOrientation) => void;
  setLevel2Panels: (count: number) => void;
  setLevel2Direction: (direction: SlideDirection) => void;
  setLevel2Orientation: (orientation: PanelOrientation) => void;
  setStructureMaterial: (mat: StructureMaterial) => void;
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

  // Ações do Baú de Teto & Basculamento
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

  // Ações da Caixa d'Água Lateral (2× Canos PVC)
  setWaterTank: (updates: Partial<WaterTankConfig>) => void;
  setWaterTankEnabled: (enabled: boolean) => void;
  setWaterTankLength: (lengthMm: number) => void;
  setWaterTankRadius: (radiusMm: number) => void;
  setWaterTankConnectionPosition: (position: 'front' | 'rear') => void;

  // Ações do Carregador Inteligente DC-DC B2B1230
  setB2BEnabled: (enabled: boolean) => void;
  toggleB2BEngine: () => void;
  setB2BEngineHours: (hours: number) => void;

  // Ações da Fonte Usina Smart Connect (Shore Power / Camping)
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

  openModal: (modal: 'loads' | 'battery' | 'mppt' | 'bom' | 'b2b' | 'usina' | 'panel-presets' | 'cargo-presets' | 'fridge-presets' | 'portapotti-presets' | 'stove-presets' | 'battery-presets' | 'mppt-presets' | 'b2b-presets' | 'help' | 'about' | null) => void;
  closeModal: () => void;
  flashToast: (msg: string) => void;

  // Presets de Geladeiras 12V / 24V
  fridgePresets: FridgePreset[];
  activeFridgePresetId: string;
  activeFridgePreset: FridgePreset;
  selectFridgePreset: (id: string) => void;
  addFridgePreset: (presetData: Omit<FridgePreset, 'id' | 'isDefault'>) => void;
  updateFridgePreset: (id: string, updates: Partial<FridgePreset>) => void;
  removeFridgePreset: (id: string) => void;
  resetFridgePresets: () => void;

  // Presets de Porta Potti (Vaso Sanitário Químico Portátil)
  portaPottiPresets: PortaPottiPreset[];
  activePortaPottiPresetId: string;
  activePortaPottiPreset: PortaPottiPreset;
  selectPortaPottiPreset: (id: string) => void;
  addPortaPottiPreset: (presetData: Omit<PortaPottiPreset, 'id' | 'isDefault'>) => void;
  updatePortaPottiPreset: (id: string, updates: Partial<PortaPottiPreset>) => void;
  removePortaPottiPreset: (id: string) => void;
  resetPortaPottiPresets: () => void;

  // Presets de Fogareiros Portáteis (NTK Duo Ceramik, etc.)
  stovePresets: StovePreset[];
  activeStovePresetId: string;
  activeStovePreset: StovePreset;
  selectStovePreset: (id: string) => void;
  addStovePreset: (presetData: Omit<StovePreset, 'id' | 'isDefault'>) => void;
  updateStovePreset: (id: string, updates: Partial<StovePreset>) => void;
  removeStovePreset: (id: string) => void;
  resetStovePresets: () => void;

  // Presets de Bateria LiFePO4
  batteryPresets: BatteryPreset[];
  activeBatteryPresetId: string;
  activeBatteryPreset: BatteryPreset;
  selectBatteryPreset: (id: string) => void;
  addBatteryPreset: (presetData: Omit<BatteryPreset, 'id' | 'isDefault'>) => void;
  updateBatteryPreset: (id: string, updates: Partial<BatteryPreset>) => void;
  removeBatteryPreset: (id: string) => void;
  resetBatteryPresets: () => void;

  // Presets de Controlador MPPT
  mpptPresets: MpptPreset[];
  activeMpptPresetId: string;
  activeMpptPreset: MpptPreset;
  selectMpptPreset: (id: string) => void;
  addMpptPreset: (presetData: Omit<MpptPreset, 'id' | 'isDefault'>) => void;
  updateMpptPreset: (id: string, updates: Partial<MpptPreset>) => void;
  removeMpptPreset: (id: string) => void;
  resetMpptPresets: () => void;

  // Presets de Carregador DC-DC B2B
  b2bPresets: B2bPreset[];
  activeB2bPresetId: string;
  activeB2bPreset: B2bPreset;
  selectB2bPreset: (id: string) => void;
  addB2bPreset: (presetData: Omit<B2bPreset, 'id' | 'isDefault'>) => void;
  updateB2bPreset: (id: string, updates: Partial<B2bPreset>) => void;
  removeB2bPreset: (id: string) => void;
  resetB2bPresets: () => void;

  addAppliance: (name: string, watts: number, hours: number, qty?: number) => void;
  updateAppliance: (id: string, updates: Partial<ApplianceItem>) => void;
  removeAppliance: (id: string) => void;
  moveAppliance: (id: string, direction: 'up' | 'down') => void;
  reorderAppliances: (fromIndex: number, toIndex: number) => void;
  resetAppliances: () => void;
}
