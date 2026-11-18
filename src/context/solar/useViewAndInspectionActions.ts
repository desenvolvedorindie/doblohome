import { useState } from 'react';
import {
  ViewMode,
  PartsGroupFilter,
  CameraPreset,
  BarMeasurementData
} from '../../types';
import { CollisionSummary } from '../../three/CollisionChecker';
import { FloatingSummary } from '../../three/FloatingChecker';
import { dbSet } from '../../data/db';

export function useViewAndInspectionActions(
  sceneManager: any,
  flashToast: (msg: string) => void,
  isDbLoaded: boolean,
  isolatedBoxId: string | null,
  setIsolatedBoxId: (id: string | null) => void
) {
  const [isVehicleVisible, setIsVehicleVisible] = useState<boolean>(true);
  const [vehicleOpacity, setVehicleOpacityState] = useState<number>(1.0);
  const [isDimensionsVisible, setIsDimensionsVisible] = useState<boolean>(true);
  const [isChainVisible, setIsChainVisible] = useState<boolean>(false);
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isAutoAnimating, setIsAutoAnimating] = useState<boolean>(false);
  const [viewMode, setViewModeState] = useState<ViewMode>('assembled');

  // Boneco de referência humana — visível por padrão como guia de escala
  const [humanFigureVisible, setHumanFigureVisibleState] = useState<boolean>(true);
  const [humanFigureHeightM, setHumanFigureHeightMState] = useState<number>(1.75);
  const [partsFilter, setPartsFilterState] = useState<PartsGroupFilter>(() => {
    try {
      const saved = localStorage.getItem('doblo_parts_filter');
      if (saved === 'all' || saved === 'wood' || saved === 'upholstery' || saved === 'metal' || saved === 'pvc') {
        return saved as PartsGroupFilter;
      }
    } catch {}
    return 'all';
  });
  const [activeCameraPreset, setActiveCameraPreset] = useState<CameraPreset>('iso');
  const [sunHour, setSunHourState] = useState<number>(12.0);

  const [activeModal, setActiveModal] = useState<'loads' | 'battery' | 'mppt' | 'bom' | 'b2b' | 'usina' | 'panel-presets' | 'cargo-presets' | 'fridge-presets' | 'portapotti-presets' | 'stove-presets' | 'battery-presets' | 'mppt-presets' | 'b2b-presets' | 'help' | 'about' | null>(null);
  const [hoveredBar, setHoveredBar] = useState<BarMeasurementData | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [collisionSummary, setCollisionSummary] = useState<CollisionSummary | null>(null);
  const [floatingSummary, setFloatingSummary] = useState<FloatingSummary | null>(null);

  const toggleVehicle = () => {
    const next = !isVehicleVisible;
    setIsVehicleVisible(next);
    if (sceneManager) sceneManager.vehicle.setVisible(next);
  };

  const toggleHumanFigure = () => {
    const next = !humanFigureVisible;
    setHumanFigureVisibleState(next);
    if (sceneManager) sceneManager.humanFigure.setVisible(next);
  };

  const setHumanFigureHeight = (heightM: number) => {
    setHumanFigureHeightMState(heightM);
    if (sceneManager) sceneManager.humanFigure.setHeight(heightM);
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

  const openModal = (modal: 'loads' | 'battery' | 'mppt' | 'bom' | 'b2b' | 'usina' | 'panel-presets' | 'cargo-presets' | 'fridge-presets' | 'portapotti-presets' | 'stove-presets' | 'battery-presets' | 'mppt-presets' | 'b2b-presets' | 'help' | 'about' | null) => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

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
      setIsolatedBoxId(null);
    }
    if (sceneManager) {
      sceneManager.setViewMode(mode, isVehicleVisible);
      if (mode === 'internal_boxes') {
        flashToast('📦 Modo 1: Caixas Internas (Grid & Armazenadores Camper)');
      } else if (mode === 'bars_lineup') {
        const total = sceneManager.barsLineupGroup.userData.totalBars || 0;
        flashToast(`📏 Modo 3: Bancada de Peças (${total} peças alinhadas)`);
      } else if (mode === 'electrical_planar') {
        flashToast('⚡ Modo 4: Planejamento Elétrico Planar (2D)');
      } else if (mode === 'hydraulic_planar') {
        flashToast('💧 Modo 5: Planejamento Hidráulico Planar (2D)');
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
    if (isDbLoaded) {
      dbSet('doblo_parts_filter', filter);
    }
    if (sceneManager) {
      sceneManager.setBarsLineupFilter(filter);
      if (viewMode === 'bars_lineup') {
        const total = sceneManager.barsLineupGroup.userData.totalBars || 0;
        const label =
          filter === 'upholstery'
            ? '🛏️ Colchão / Estofaria'
            : filter === 'metal'
              ? '🔩 Rack'
              : filter === 'wood'
                ? '🪵 Madeira'
                : filter === 'pvc'
                  ? '💧 Tubos PVC'
                  : filter === 'awning'
                    ? '⛺ Ferragem do Toldo'
                    : '📦 Todas as Peças';
        flashToast(`${label}: ${total} peças alinhadas`);
      }
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'assembled' ? 'bars_lineup' : 'assembled');
  };

  return {
    isVehicleVisible,
    setIsVehicleVisible,
    vehicleOpacity,
    setVehicleOpacity,
    isDimensionsVisible,
    setIsDimensionsVisible,
    isChainVisible,
    setIsChainVisible,
    isTransparent,
    setIsTransparent,
    isSoundEnabled,
    setIsSoundEnabled,
    isAutoAnimating,
    setIsAutoAnimating,
    viewMode,
    setViewModeState,
    partsFilter,
    setPartsFilterState,
    activeCameraPreset,
    setActiveCameraPreset,
    sunHour,
    setSunHourState,
    activeModal,
    setActiveModal,
    hoveredBar,
    setHoveredBar,
    hoverPos,
    setHoverPos,
    collisionSummary,
    setCollisionSummary,
    floatingSummary,
    setFloatingSummary,
    toggleVehicle,
    toggleDimensions,
    toggleChain,
    toggleTransparency,
    toggleSound,
    toggleAutoAnim,
    setCameraPreset,
    setSunHour,
    takeScreenshot,
    openModal,
    closeModal,
    checkCollisions,
    clearCollisions,
    checkFloating,
    clearFloating,
    setViewMode,
    setPartsFilter,
    toggleViewMode,
    humanFigureVisible,
    humanFigureHeightM,
    toggleHumanFigure,
    setHumanFigureHeight,
  };
}
