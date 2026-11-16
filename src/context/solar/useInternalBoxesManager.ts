import React, { useState, useEffect } from 'react';
import {
  InternalBoxItem,
  InternalGridConfig,
  CeilingConfig,
  RulerAxisLock,
  RulerLiveState
} from '../../types';

const INITIAL_RULER_STATE: RulerLiveState = {
  isActive: false,
  lockedAxis: null,
  inferredAxis: null,
  hasStartPoint: false,
  startSnap: null,
  currentSnap: null,
  previewDistanceMm: null,
  previewDeltaXMm: null,
  previewDeltaYMm: null,
  previewDeltaZMm: null,
  measurements: []
};
import {
  DEFAULT_INTERNAL_GRID,
  INTERNAL_BOXES_PRESETS,
  DEFAULT_CEILING_CONFIG
} from '../../data/internalBoxesPresets';
import { dbSet } from '../../data/db';

export interface ExternalBoxFocusState {
  selectedBoxId: string | null;
  setSelectedBoxIdState: React.Dispatch<React.SetStateAction<string | null>>;
  isolatedBoxId: string | null;
  setIsolatedBoxIdState: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useInternalBoxesManager(
  isDbLoaded: boolean,
  flashToast: (msg: string) => void,
  sceneManager: any,
  viewMode: string,
  setViewMode: (mode: any) => void,
  isVehicleVisible: boolean,
  externalSelection?: ExternalBoxFocusState
) {
  const [internalGrid, setInternalGridState] = useState<InternalGridConfig>(DEFAULT_INTERNAL_GRID);
  const [internalBoxes, setInternalBoxesState] = useState<InternalBoxItem[]>(INTERNAL_BOXES_PRESETS[0].boxes);
  const [localSelectedBoxId, setLocalSelectedBoxIdState] = useState<string | null>(null);
  const [localIsolatedBoxId, setLocalIsolatedBoxIdState] = useState<string | null>(null);

  const selectedBoxId = externalSelection ? externalSelection.selectedBoxId : localSelectedBoxId;
  const setSelectedBoxIdState = externalSelection ? externalSelection.setSelectedBoxIdState : setLocalSelectedBoxIdState;
  const isolatedBoxId = externalSelection ? externalSelection.isolatedBoxId : localIsolatedBoxId;
  const setIsolatedBoxIdState = externalSelection ? externalSelection.setIsolatedBoxIdState : setLocalIsolatedBoxIdState;

  const [isOpenPreview, setIsOpenPreview] = useState<boolean>(false);
  const [isCabinetsOpenPreview, setIsCabinetsOpenPreview] = useState<boolean>(false);
  const [isBedOpenPreview, setIsBedOpenPreview] = useState<boolean>(false);
  const [showMattress, setShowMattress] = useState<boolean>(true);
  const [rulerState, setRulerState] = useState<RulerLiveState>(INITIAL_RULER_STATE);

  const toggleCabinetsOpenPreview = (forceState?: boolean) => {
    setIsCabinetsOpenPreview((prev) => {
      const allCabinets = internalBoxes.filter((b) => b.upperCabinet);
      const areAllOpen = allCabinets.length > 0 && allCabinets.every((b) => Boolean(b.isUpperCabinetOpen));
      const next = forceState !== undefined ? forceState : !areAllOpen;

      setInternalBoxesState((boxes) => {
        const nextBoxes = boxes.map((b) => (b.upperCabinet ? { ...b, isUpperCabinetOpen: next } : b));
        if (isDbLoaded) {
          dbSet('doblo_internal_boxes', nextBoxes);
        }
        return nextBoxes;
      });
      return next;
    });
  };

  const setRulerActive = (active: boolean) => {
    if (sceneManager?.internalBoxesRuler) {
      sceneManager.internalBoxesRuler.setActive(active);
    } else {
      setRulerState((prev) => ({ ...prev, isActive: active }));
    }
    if (active) {
      flashToast('📏 Régua ativada: clique em 2 pontos para medir (Setas travam eixo X/Y/Z)');
    } else {
      flashToast('📏 Régua desativada');
    }
  };

  const toggleRuler = () => {
    const currentlyActive = sceneManager?.internalBoxesRuler?.isActive ?? rulerState.isActive;
    setRulerActive(!currentlyActive);
  };

  const setRulerAxisLock = (axis: RulerAxisLock) => {
    if (sceneManager?.internalBoxesRuler) {
      sceneManager.internalBoxesRuler.setAxisLock(axis);
    } else {
      setRulerState((prev) => ({ ...prev, lockedAxis: axis }));
    }
  };

  const clearRulerMeasurements = () => {
    if (sceneManager?.internalBoxesRuler) {
      sceneManager.internalBoxesRuler.clearMeasurements();
    } else {
      setRulerState((prev) => ({ ...prev, measurements: [] }));
    }
    flashToast('🗑️ Medidas da régua removidas');
  };

  const removeRulerMeasurement = (id: string) => {
    if (sceneManager?.internalBoxesRuler) {
      sceneManager.internalBoxesRuler.removeMeasurement(id);
    } else {
      setRulerState((prev) => ({
        ...prev,
        measurements: prev.measurements.filter((m) => m.id !== id)
      }));
    }
  };

  const setSelectedBoxId = (id: string | null) => {
    const prevSelected = selectedBoxId;
    setSelectedBoxIdState(id);
    if (sceneManager) {
      sceneManager.clearBarHover();
    }
    if (id !== null) {
      if (isolatedBoxId && isolatedBoxId !== id) {
        setIsolatedBoxIdState(id);
      }
      if (
        sceneManager &&
        id !== prevSelected &&
        sceneManager.internalBoxesBuilder?.boxesGroup?.getObjectByName(`BoxContainer_${id}`)
      ) {
        sceneManager.focusOnBox(id);
      }
    } else {
      setIsolatedBoxIdState(null);
      if (sceneManager && viewMode === 'internal_boxes') {
        sceneManager.focusOnBox(null);
      }
    }
  };

  const setIsIsolatedBoxId = (id: string | null) => {
    const prevIsolated = isolatedBoxId;
    const prevSelected = selectedBoxId;
    setIsolatedBoxIdState(id);
    if (sceneManager) {
      sceneManager.clearBarHover();
    }
    if (id) {
      setSelectedBoxIdState(id);
      const switchedMode = viewMode !== 'internal_boxes';
      if (switchedMode) {
        setViewMode('internal_boxes');
        if (sceneManager) sceneManager.setViewMode('internal_boxes', isVehicleVisible);
      }
      if (prevIsolated !== id) {
        const targetBox = internalBoxes.find((b) => b.id === id);
        flashToast(`🎯 Modo Foco: Visualizando apenas "${targetBox?.name || 'Baú'}"`);
      }
      if (sceneManager && (switchedMode || prevSelected !== id)) {
        if (sceneManager.internalBoxesBuilder?.boxesGroup?.getObjectByName(`BoxContainer_${id}`)) {
          sceneManager.focusOnBox(id);
        }
      }
    } else {
      setSelectedBoxIdState(null);
      if (prevIsolated || prevSelected) {
        flashToast('👁️ Exibindo todos os baús');
      }
      if (sceneManager && viewMode === 'internal_boxes') {
        sceneManager.setViewMode('internal_boxes', isVehicleVisible);
      }
    }
  };

  // Atalhos de teclado da Régua 3D (T, Setas X/Y/Z, ESC) e saída do modo de foco isolado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
      ) {
        return;
      }

      if (viewMode === 'internal_boxes') {
        if ((e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          toggleRuler();
          return;
        }

        const isRulerActive = sceneManager?.internalBoxesRuler?.isActive ?? rulerState.isActive;
        if (isRulerActive) {
          const currentLock = sceneManager?.internalBoxesRuler?.lockedAxis ?? rulerState.lockedAxis;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            setRulerAxisLock(currentLock === 'x' ? null : 'x');
            return;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setRulerAxisLock(currentLock === 'y' ? null : 'y');
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setRulerAxisLock(currentLock === 'z' ? null : 'z');
            return;
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            if (sceneManager?.internalBoxesRuler?.hasPendingStartPoint()) {
              sceneManager.internalBoxesRuler.cancelPendingPoint();
            } else {
              setRulerActive(false);
            }
            return;
          }
        }
      }

      if (e.key === 'Escape' && (isolatedBoxId || selectedBoxId)) {
        e.preventDefault();
        setIsIsolatedBoxId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isolatedBoxId, selectedBoxId, viewMode, rulerState.isActive, rulerState.lockedAxis, sceneManager]);

  // Persiste caixas e grid no IndexedDB apenas após a carga inicial
  useEffect(() => {
    if (!isDbLoaded) return;
    dbSet('doblo_internal_grid', internalGrid);
  }, [internalGrid, isDbLoaded]);

  useEffect(() => {
    if (!isDbLoaded) return;
    dbSet('doblo_internal_boxes', internalBoxes);
  }, [internalBoxes, isDbLoaded]);

  const setInternalGrid = (newGrid: InternalGridConfig | ((prev: InternalGridConfig) => InternalGridConfig)) => {
    setInternalGridState(prev => {
      const next = typeof newGrid === 'function' ? newGrid(prev) : newGrid;
      if (isDbLoaded) {
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
      if (isDbLoaded) {
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
      if (isDbLoaded) {
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
      if (isDbLoaded) {
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
      if (isDbLoaded) {
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
      if (isDbLoaded) {
        dbSet('doblo_internal_boxes', next);
      }
      return next;
    });
  };

  const removeInternalBox = (id: string) => {
    setInternalBoxesState(prev => {
      const next = prev.filter(b => b.id !== id);
      if (isDbLoaded) {
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
    if (isDbLoaded) {
      dbSet('doblo_internal_boxes', []);
    }
    flashToast('🧹 Grid limpo: todas as caixas foram removidas');
  };

  return {
    internalGrid,
    setInternalGridState,
    setInternalGrid,
    setCeiling,
    toggleCeiling3D,
    internalBoxes,
    setInternalBoxesState,
    setInternalBoxes,
    selectedBoxId,
    setSelectedBoxId,
    setSelectedBoxIdState,
    isolatedBoxId,
    setIsolatedBoxIdState,
    setIsolatedBoxId: setIsIsolatedBoxId,
    isOpenPreview,
    setIsOpenPreview,
    isCabinetsOpenPreview,
    setIsCabinetsOpenPreview,
    toggleCabinetsOpenPreview,
    isBedOpenPreview,
    setIsBedOpenPreview,
    showMattress,
    setShowMattress,
    applyInternalBoxesPreset,
    addInternalBox,
    updateInternalBox,
    removeInternalBox,
    clearInternalBoxes,
    rulerState,
    setRulerState,
    toggleRuler,
    setRulerActive,
    setRulerAxisLock,
    clearRulerMeasurements,
    removeRulerMeasurement
  };
}
