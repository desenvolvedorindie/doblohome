import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { SceneManager } from '../three/SceneManager';
import { CollisionSummary } from '../three/CollisionChecker';
import {
  StackLevels,
  SlideDirection,
  PanelOrientation,
  StructureMaterial,
  AluminumColor,
  CameraPreset,
  LevelConfig,
  SavedConfig,
  CargoBoxConfig,
  B2BChargerConfig,
  UsinaChargerConfig,
  UsinaModelRating,
  ApplianceItem,
  LoadsSummary,
  BatteryPerformance,
  EnergyStats,
  BarMeasurementData
} from '../types';

interface SolarContextType {
  sceneManager: SceneManager | null;
  setSceneManager: (mgr: SceneManager | null) => void;

  stackLevels: StackLevels;
  level1: LevelConfig;
  level2: LevelConfig;
  structureMaterial: StructureMaterial;
  aluminumColor: AluminumColor;
  offsetZ: number;
  offsetY: number;
  expansionProgress: number;

  // Baú de Teto Motobul Off Road & Basculamento
  cargoBox: CargoBoxConfig;

  // Carregador Inteligente DC-DC B2B1230 (Alternador Doblò -> LiFePO4)
  b2bCharger: B2BChargerConfig;

  // Fonte e Carregador Usina 150A Smart Connect (Shore Power / Camping)
  usinaCharger: UsinaChargerConfig;

  isVehicleVisible: boolean;
  isDimensionsVisible: boolean;
  isChainVisible: boolean;
  isTransparent: boolean;
  isSoundEnabled: boolean;
  isAutoAnimating: boolean;
  activeCameraPreset: CameraPreset;
  sunHour: number;

  hoveredBar: BarMeasurementData | null;
  hoverPos: { x: number; y: number };

  activeModal: 'loads' | 'battery' | 'mppt' | 'bom' | 'b2b' | 'usina' | 'help' | null;
  toastMessage: string | null;

  energyStats: EnergyStats;
  batteryPerformance: BatteryPerformance;
  loadsSummary: LoadsSummary;
  appliances: ApplianceItem[];

  setStackLevels: (levels: StackLevels) => void;
  setLevel1Panels: (count: number) => void;
  setLevel1Direction: (direction: SlideDirection) => void;
  setLevel1Orientation: (orientation: PanelOrientation) => void;
  setLevel2Panels: (count: number) => void;
  setLevel2Direction: (direction: SlideDirection) => void;
  setLevel2Orientation: (orientation: PanelOrientation) => void;
  setStructureMaterial: (material: StructureMaterial) => void;
  setAluminumColor: (color: AluminumColor) => void;
  setOffsetZ: (z: number) => void;
  setOffsetY: (y: number) => void;
  setExpansion: (val: number) => void;

  // Controles do Baú e Basculamento
  setCargoBox: (updates: Partial<CargoBoxConfig>) => void;
  setCargoBoxEnabled: (enabled: boolean) => void;
  setCargoBoxDimensions: (length: number, width: number, height: number) => void;
  setCargoBoxHingeSide: (side: 'driver' | 'passenger') => void;
  setTiltAngle: (angle: number) => void;
  setBoxLidAngle: (angle: number) => void;
  tiltSolarRack: () => void;
  closeSolarRack: () => void;
  openBoxLid: () => void;
  closeBoxLid: () => void;
  retractAndTilt: () => void;

  // Carregador Inteligente DC-DC B2B1230
  setB2BEnabled: (enabled: boolean) => void;
  toggleB2BEngine: () => void;

  // Fonte e Carregador Usina 70A/120A/150A/200A Smart Connect
  toggleUsinaAC: () => void;
  setUsinaAmps: (amps: number) => void;
  setUsinaVoltage: (volts: number) => void;
  setUsinaModel: (model: UsinaModelRating) => void;

  // Verificação Estrutural de Colisões
  collisionSummary: CollisionSummary | null;
  checkCollisions: () => void;
  clearCollisions: () => void;

  toggleVehicle: () => void;
  toggleDimensions: () => void;
  toggleChain: () => void;
  toggleTransparency: () => void;
  toggleSound: () => void;
  toggleAutoAnim: () => void;

  expand: () => void;
  retract: () => void;
  rewind: () => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setSunHour: (hour: number) => void;
  takeScreenshot: () => void;

  openModal: (modal: 'loads' | 'battery' | 'mppt' | 'bom' | 'b2b' | 'usina' | 'help' | null) => void;
  closeModal: () => void;
  flashToast: (msg: string) => void;

  addAppliance: (name: string, watts: number, hours: number, qty?: number) => void;
  updateAppliance: (id: string, updates: Partial<ApplianceItem>) => void;
  removeAppliance: (id: string) => void;
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
  const [aluminumColor, setAluminumColorState] = useState<AluminumColor>('silver');
  const [offsetZ, setOffsetZState] = useState<number>(0.40);
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
    lidAngle: 0
  });

  // Carregador Inteligente DC-DC B2B1230 (Alternador Doblò -> LiFePO4)
  const [b2bCharger, setB2BCharger] = useState<B2BChargerConfig>({
    enabled: true,
    isEngineRunning: false, // Inicia desligado (estacionado)
    chargingAmps: 30,       // 30A contínuos
    voltageIn: 14.1,        // Alternador da Doblò
    voltageOut: 14.4,       // Curva LiFePO4
    watts: 390,             // ~390W
    bluetoothConnected: true
  });

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
  const [isDimensionsVisible, setIsDimensionsVisible] = useState<boolean>(true);
  const [isChainVisible, setIsChainVisible] = useState<boolean>(false);
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isAutoAnimating, setIsAutoAnimating] = useState<boolean>(false);
  const [activeCameraPreset, setActiveCameraPreset] = useState<CameraPreset>('iso');
  const [sunHour, setSunHourState] = useState<number>(12.0);

  // Modais e UI
  const [activeModal, setActiveModal] = useState<'loads' | 'battery' | 'mppt' | 'bom' | 'b2b' | 'usina' | 'help' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<BarMeasurementData | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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
      level1Panels: stats.level1Panels,
      level2Panels: stats.level2Panels,
      stackLevels: stats.stackLevels
    });

    setBatteryPerformance(batPerf);
    setLoadsSummary(summary);
    setAppliances([...sceneManager.solarSim.APPLIANCES]);
  };

  // Carrega configurações do LocalStorage ao montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem('doblo_solar_config');
      if (raw) {
        const cfg: SavedConfig = JSON.parse(raw);
        if (cfg.stackLevels) setStackLevelsState(cfg.stackLevels);
        if (cfg.level1) setLevel1State(cfg.level1);
        if (cfg.level2) setLevel2State(cfg.level2);
        if (cfg.structureMaterial) setStructureMaterialState(cfg.structureMaterial);
        if (cfg.aluminumColor) setAluminumColorState(cfg.aluminumColor);
        if (cfg.cargoBox) setCargoBoxState(cfg.cargoBox);
        if (cfg.offsetZ !== undefined) setOffsetZState(cfg.offsetZ);
        if (cfg.offsetY !== undefined) setOffsetYState(cfg.offsetY);
        if (cfg.expansionProgress !== undefined) setExpansionProgressState(cfg.expansionProgress);
      }
    } catch (e) {
      console.warn('Erro ao restaurar configurações:', e);
    }
  }, []);

  // Quando o sceneManager estiver disponível, aplica as configurações restauradas
  useEffect(() => {
    if (!sceneManager) return;

    sceneManager.solarSystem.setCargoBox(cargoBox);

    sceneManager.solarSystem.setStackLevels(stackLevels);
    sceneManager.solarSystem.setLevel1Panels(level1.panels);
    sceneManager.solarSystem.setLevel1Direction(level1.direction);
    sceneManager.solarSystem.setLevel1Orientation(level1.orientation);

    sceneManager.solarSystem.setLevel2Panels(level2.panels);
    sceneManager.solarSystem.setLevel2Direction(level2.direction);
    sceneManager.solarSystem.setLevel2Orientation(level2.orientation);

    sceneManager.solarSystem.setStructureMaterial(structureMaterial);
    sceneManager.solarSystem.setAluminumColor(aluminumColor);

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

    updateCalculations();
  }, [sceneManager]);

  // Salva configurações
  const saveConfig = (overrides?: Partial<SavedConfig>) => {
    const configToSave: SavedConfig = {
      stackLevels: overrides?.stackLevels ?? stackLevels,
      level1: overrides?.level1 ?? level1,
      level2: overrides?.level2 ?? level2,
      structureMaterial: overrides?.structureMaterial ?? structureMaterial,
      aluminumColor: overrides?.aluminumColor ?? aluminumColor,
      cargoBox: overrides?.cargoBox ?? cargoBox,
      offsetZ: overrides?.offsetZ ?? offsetZ,
      offsetY: overrides?.offsetY ?? offsetY,
      expansionProgress: overrides?.expansionProgress ?? expansionProgress
    };
    try {
      localStorage.setItem('doblo_solar_config', JSON.stringify(configToSave));
      flashToast('✅ Configuração Salva');
    } catch (e) {
      console.warn('Erro ao salvar no LocalStorage:', e);
    }
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

  const setAluminumColor = (color: AluminumColor) => {
    setAluminumColorState(color);
    if (sceneManager) {
      sceneManager.cancelCurrentAnimation();
      sceneManager.solarSystem.setAluminumColor(color);
      sceneManager.audio.playLockClick();
    }
    saveConfig({ aluminumColor: color });
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

  const openModal = (modal: 'loads' | 'battery' | 'mppt' | 'bom' | 'b2b' | 'usina' | 'help' | null) => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
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
    setCargoBox({ length, width, height });
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
      } else {
        flashToast('🅿️ Motor Doblò DESLIGADO (modo estacionado / apenas solar)');
      }
      return { ...prev, isEngineRunning: isRunning };
    });
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

  return (
    <SolarContext.Provider
      value={{
        sceneManager,
        setSceneManager,
        stackLevels,
        level1,
        level2,
        structureMaterial,
        aluminumColor,
        offsetZ,
        offsetY,
        expansionProgress,
        cargoBox,
        b2bCharger,
        usinaCharger,
        isVehicleVisible,
        isDimensionsVisible,
        isChainVisible,
        isTransparent,
        isSoundEnabled,
        isAutoAnimating,
        activeCameraPreset,
        sunHour,
        hoveredBar,
        hoverPos,
        activeModal,
        toastMessage,
        energyStats,
        batteryPerformance,
        loadsSummary,
        appliances,
        setStackLevels,
        setLevel1Panels,
        setLevel1Direction,
        setLevel1Orientation,
        setLevel2Panels,
        setLevel2Direction,
        setLevel2Orientation,
        setStructureMaterial,
        setAluminumColor,
        setOffsetZ,
        setOffsetY,
        setExpansion,
        setCargoBox,
        setCargoBoxEnabled,
        setCargoBoxDimensions,
        setCargoBoxHingeSide,
        setTiltAngle,
        setBoxLidAngle,
        tiltSolarRack,
        closeSolarRack,
        openBoxLid,
        closeBoxLid,
        retractAndTilt,
        setB2BEnabled,
        toggleB2BEngine,
        toggleUsinaAC,
        setUsinaAmps,
        setUsinaVoltage,
        setUsinaModel,
        collisionSummary,
        checkCollisions,
        clearCollisions,
        toggleVehicle,
        toggleDimensions,
        toggleChain,
        toggleTransparency,
        toggleSound,
        toggleAutoAnim,
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

