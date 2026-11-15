import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { SceneManager } from '../three/SceneManager';
import { SavedConfig } from '../types';
import { loadPanelPresets } from '../data/solarPanelPresets';
import { loadCargoBoxPresets } from '../data/cargoBoxPresets';
import { SolarContextType } from './solar/SolarContextTypes';
import { useInternalBoxesManager } from './solar/useInternalBoxesManager';
import { usePresetsManager } from './solar/usePresetsManager';
import { useAppliancesManager } from './solar/useAppliancesManager';
import { useStructureActions } from './solar/useStructureActions';
import { useCargoAndEquipmentActions } from './solar/useCargoAndEquipmentActions';
import { useViewAndInspectionActions } from './solar/useViewAndInspectionActions';
import { SolarPersistence } from './solar/SolarPersistence';

export * from './solar/SolarContextTypes';

const SolarContext = createContext<SolarContextType | null>(null);

export const SolarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<any>(null);
  const isDbLoadedRef = useRef<boolean>(false);
  const [selectedBoxId, setSelectedBoxIdState] = useState<string | null>(null);
  const [isolatedBoxId, setIsolatedBoxIdState] = useState<string | null>(null);

  const flashToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Appliances & Energy
  const appliancesMgr = useAppliancesManager(sceneManager, flashToast);

  // Cargo & Equipment State & Actions
  const cargoAndEquipMgr = useCargoAndEquipmentActions(
    sceneManager,
    (overrides) => saveConfig(overrides),
    appliancesMgr.updateCalculations,
    flashToast,
    0
  );

  // Structure State & Actions
  const structureMgr = useStructureActions(
    sceneManager,
    (overrides) => saveConfig(overrides),
    appliancesMgr.updateCalculations,
    flashToast,
    cargoAndEquipMgr.cargoBox,
    (val: boolean) => viewMgr.setIsAutoAnimating(val)
  );

  // Presets
  const presetsMgr = usePresetsManager(
    flashToast,
    sceneManager,
    (updates: any) => cargoAndEquipMgr.setCargoBox(updates),
    cargoAndEquipMgr.cargoBox,
    appliancesMgr.updateCalculations
  );

  // View, Camera & Inspection Actions
  const viewMgr = useViewAndInspectionActions(
    sceneManager,
    flashToast,
    isDbLoadedRef.current,
    isolatedBoxId,
    (id) => {
      setIsolatedBoxIdState(id);
      if (!id) {
        setSelectedBoxIdState(null);
        sceneManager?.clearBarHover();
      }
    }
  );

  // Internal Boxes & Grid
  const boxesMgr = useInternalBoxesManager(
    isDbLoadedRef.current,
    flashToast,
    sceneManager,
    viewMgr.viewMode,
    viewMgr.setViewModeState,
    viewMgr.isVehicleVisible,
    {
      selectedBoxId,
      setSelectedBoxIdState,
      isolatedBoxId,
      setIsolatedBoxIdState
    }
  );

  // Limpa seleção/isolamento ao sair do modo internal_boxes
  useEffect(() => {
    if (viewMgr.viewMode !== 'internal_boxes' && (selectedBoxId || isolatedBoxId)) {
      setSelectedBoxIdState(null);
      setIsolatedBoxIdState(null);
      sceneManager?.clearBarHover();
    }
  }, [viewMgr.viewMode, selectedBoxId, isolatedBoxId, sceneManager]);

  // Carrega configurações do Banco de Dados ao montar
  useEffect(() => {
    (async () => {
      await SolarPersistence.restoreConfig({
        setStackLevelsState: structureMgr.setStackLevelsState,
        setLevel1State: structureMgr.setLevel1State,
        setLevel2State: structureMgr.setLevel2State,
        setStructureMaterialState: structureMgr.setStructureMaterialState,
        setSteelProfileUnitState: structureMgr.setSteelProfileUnitState,
        setAluminumColorState: structureMgr.setAluminumColorState,
        setMetalonColorState: structureMgr.setMetalonColorState,
        setMetalonWallThicknessState: structureMgr.setMetalonWallThicknessState,
        setMetalonThickness40State: structureMgr.setMetalonThickness40State,
        setMetalonThickness30State: structureMgr.setMetalonThickness30State,
        setCargoBoxState: cargoAndEquipMgr.setCargoBoxState,
        setWaterTankState: cargoAndEquipMgr.setWaterTankState,
        setAwningState: cargoAndEquipMgr.setAwningState,
        setB2BCharger: cargoAndEquipMgr.setB2BCharger,
        setActivePanelPresetIdState: presetsMgr.setActivePanelPresetIdState,
        setActiveCargoPresetIdState: presetsMgr.setActiveCargoPresetIdState,
        setOffsetZState: structureMgr.setOffsetZState,
        setOffsetYState: structureMgr.setOffsetZState,
        setExpansionProgressState: structureMgr.setExpansionProgressState,
        setPanelPresetsState: presetsMgr.setPanelPresetsState,
        setCargoBoxPresetsState: presetsMgr.setCargoBoxPresetsState,
        setInternalGridState: boxesMgr.setInternalGridState,
        setInternalBoxesState: boxesMgr.setInternalBoxesState,
        setPartsFilterState: viewMgr.setPartsFilterState,
        loadPanelPresets,
        loadCargoBoxPresets
      });
      isDbLoadedRef.current = true;
    })();
  }, []);

  // Quando o sceneManager estiver disponível, aplica as configurações restauradas
  useEffect(() => {
    if (!sceneManager) return;

    sceneManager.solarSystem.setCargoBox(cargoAndEquipMgr.cargoBox);
    sceneManager.solarSystem.setWaterTank(cargoAndEquipMgr.waterTank);
    sceneManager.solarSystem.setAwningConfig(cargoAndEquipMgr.awning);
    if (presetsMgr.activePanelPreset) {
      sceneManager.solarSystem.setPanelSpecs({
        width: presetsMgr.activePanelPreset.width,
        length: presetsMgr.activePanelPreset.length,
        thickness: presetsMgr.activePanelPreset.thickness,
        weightKg: presetsMgr.activePanelPreset.weightKg,
        powerWatts: presetsMgr.activePanelPreset.powerWatts,
        voc: presetsMgr.activePanelPreset.voc,
        vmp: presetsMgr.activePanelPreset.vmp,
        isc: presetsMgr.activePanelPreset.isc,
        imp: presetsMgr.activePanelPreset.imp,
        name: presetsMgr.activePanelPreset.name,
        cellCount: presetsMgr.activePanelPreset.cellCount,
        cols: presetsMgr.activePanelPreset.cols,
        rows: presetsMgr.activePanelPreset.rows
      });
    }

    sceneManager.solarSystem.setStackLevels(structureMgr.stackLevels);
    sceneManager.solarSystem.setLevel1Panels(structureMgr.level1.panels);
    sceneManager.solarSystem.setLevel1Direction(structureMgr.level1.direction);
    sceneManager.solarSystem.setLevel1Orientation(structureMgr.level1.orientation);

    sceneManager.solarSystem.setLevel2Panels(structureMgr.level2.panels);
    sceneManager.solarSystem.setLevel2Direction(structureMgr.level2.direction);
    sceneManager.solarSystem.setLevel2Orientation(structureMgr.level2.orientation);

    sceneManager.solarSystem.setStructureMaterial(structureMgr.structureMaterial);
    sceneManager.solarSystem.setSteelProfileUnit(structureMgr.steelProfileUnit);
    sceneManager.solarSystem.setAluminumColor(structureMgr.aluminumColor);
    sceneManager.solarSystem.setMetalonColor(structureMgr.metalonColor);
    sceneManager.solarSystem.setMetalonThickness(structureMgr.metalonThickness40, structureMgr.metalonThickness30);

    sceneManager.solarSystem.setGroupOffsetZ(structureMgr.offsetZ);
    sceneManager.solarSystem.setGroupOffsetY(structureMgr.offsetY);
    sceneManager.setExpansion(structureMgr.expansionProgress);

    appliancesMgr.updateCalculations();
  }, [sceneManager]);

  // Mantém os callbacks do SceneManager sempre sincronizados (evita closures obsoletas)
  useEffect(() => {
    if (!sceneManager) return;

    sceneManager.onBarHoverChange = (data, x, y) => {
      viewMgr.setHoveredBar(data);
      viewMgr.setHoverPos({ x, y });
    };

    sceneManager.onExpansionChange = (prog) => {
      structureMgr.setExpansionProgressState(prog);
      appliancesMgr.updateCalculations();
    };

    sceneManager.onBoxSelect = (boxId: string | null) => {
      if (boxId !== null) {
        boxesMgr.setSelectedBoxId(boxId);
      } else {
        boxesMgr.setSelectedBoxId(null);
        if (boxesMgr.isolatedBoxId) {
          boxesMgr.setIsolatedBoxId(null);
        }
      }
    };

    sceneManager.onBoxDoubleClick = (boxId: string | null) => {
      boxesMgr.setIsolatedBoxId(boxId);
    };

    sceneManager.onRulerStateChange = (state) => {
      boxesMgr.setRulerState(state);
    };
  }, [
    sceneManager,
    viewMgr.viewMode,
    boxesMgr.internalBoxes,
    boxesMgr.selectedBoxId,
    boxesMgr.isolatedBoxId
  ]);

  useEffect(() => {
    if (!sceneManager) return;
    sceneManager.solarSystem.setAwningConfig(cargoAndEquipMgr.awning);
  }, [sceneManager, cargoAndEquipMgr.awning]);

  const prevBoxesCountRef = useRef<number>(boxesMgr.internalBoxes.length);

  useEffect(() => {
    if (!sceneManager) return;
    sceneManager.updateInternalBoxes(
      boxesMgr.internalGrid,
      boxesMgr.internalBoxes,
      boxesMgr.selectedBoxId,
      {
        openCabinets: boxesMgr.isCabinetsOpenPreview || boxesMgr.isOpenPreview,
        openBed: boxesMgr.isBedOpenPreview || boxesMgr.isOpenPreview,
        showMattress: boxesMgr.showMattress
      },
      boxesMgr.isolatedBoxId
    );

    if (
      boxesMgr.internalBoxes.length > prevBoxesCountRef.current &&
      viewMgr.viewMode === 'internal_boxes' &&
      boxesMgr.selectedBoxId
    ) {
      sceneManager.focusOnBox(boxesMgr.selectedBoxId);
    }
    prevBoxesCountRef.current = boxesMgr.internalBoxes.length;
  }, [
    sceneManager,
    viewMgr.viewMode,
    boxesMgr.internalGrid,
    boxesMgr.internalBoxes,
    boxesMgr.selectedBoxId,
    boxesMgr.isCabinetsOpenPreview,
    boxesMgr.isBedOpenPreview,
    boxesMgr.showMattress,
    boxesMgr.isOpenPreview,
    boxesMgr.isolatedBoxId
  ]);

  const saveConfig = (overrides?: Partial<SavedConfig>) => {
    const configToSave: SavedConfig = {
      stackLevels: overrides?.stackLevels ?? structureMgr.stackLevels,
      level1: overrides?.level1 ?? structureMgr.level1,
      level2: overrides?.level2 ?? structureMgr.level2,
      structureMaterial: overrides?.structureMaterial ?? structureMgr.structureMaterial,
      steelProfileUnit: overrides?.steelProfileUnit ?? structureMgr.steelProfileUnit,
      aluminumColor: overrides?.aluminumColor ?? structureMgr.aluminumColor,
      metalonColor: overrides?.metalonColor ?? structureMgr.metalonColor,
      metalonWallThickness: overrides?.metalonWallThickness ?? structureMgr.metalonWallThickness,
      metalonThickness40: overrides?.metalonThickness40 ?? structureMgr.metalonThickness40,
      metalonThickness30: overrides?.metalonThickness30 ?? structureMgr.metalonThickness30,
      cargoBox: overrides?.cargoBox ?? cargoAndEquipMgr.cargoBox,
      waterTank: overrides?.waterTank ?? cargoAndEquipMgr.waterTank,
      awning: overrides?.awning ?? cargoAndEquipMgr.awning,
      offsetZ: overrides?.offsetZ ?? structureMgr.offsetZ,
      offsetY: overrides?.offsetY ?? structureMgr.offsetY,
      expansionProgress: overrides?.expansionProgress ?? structureMgr.expansionProgress,
      b2bEngineHours: overrides?.b2bEngineHours ?? cargoAndEquipMgr.b2bCharger.engineHoursPerDay,
      panelPresetId: overrides?.panelPresetId ?? presetsMgr.activePanelPresetId,
      cargoBoxPresetId: overrides?.cargoBoxPresetId ?? presetsMgr.activeCargoPresetId
    };
    SolarPersistence.saveConfig(configToSave);
    flashToast('✅ Configuração Salva no Banco de Dados');
  };

  return (
    <SolarContext.Provider
      value={{
        sceneManager,
        setSceneManager,
        stackLevels: structureMgr.stackLevels,
        level1: structureMgr.level1,
        level2: structureMgr.level2,
        structureMaterial: structureMgr.structureMaterial,
        steelProfileUnit: structureMgr.steelProfileUnit,
        aluminumColor: structureMgr.aluminumColor,
        metalonColor: structureMgr.metalonColor,
        offsetZ: structureMgr.offsetZ,
        offsetY: structureMgr.offsetY,
        expansionProgress: structureMgr.expansionProgress,
        cargoBox: cargoAndEquipMgr.cargoBox,
        waterTank: cargoAndEquipMgr.waterTank,
        awning: cargoAndEquipMgr.awning,
        b2bCharger: cargoAndEquipMgr.b2bCharger,
        usinaCharger: cargoAndEquipMgr.usinaCharger,
        isVehicleVisible: viewMgr.isVehicleVisible,
        vehicleOpacity: viewMgr.vehicleOpacity,
        setVehicleOpacity: viewMgr.setVehicleOpacity,
        isDimensionsVisible: viewMgr.isDimensionsVisible,
        isChainVisible: viewMgr.isChainVisible,
        isTransparent: viewMgr.isTransparent,
        isSoundEnabled: viewMgr.isSoundEnabled,
        isAutoAnimating: viewMgr.isAutoAnimating,
        viewMode: viewMgr.viewMode,
        partsFilter: viewMgr.partsFilter,
        activeCameraPreset: viewMgr.activeCameraPreset,
        sunHour: viewMgr.sunHour,
        hoveredBar: viewMgr.hoveredBar,
        hoverPos: viewMgr.hoverPos,
        activeModal: viewMgr.activeModal,
        toastMessage,
        panelPresets: presetsMgr.panelPresets,
        activePanelPreset: presetsMgr.activePanelPreset,
        selectPanelPreset: presetsMgr.selectPanelPreset,
        addPanelPreset: presetsMgr.addPanelPreset,
        updatePanelPreset: presetsMgr.updatePanelPreset,
        removePanelPreset: presetsMgr.removePanelPreset,
        cargoBoxPresets: presetsMgr.cargoBoxPresets,
        activeCargoBoxPreset: presetsMgr.activeCargoBoxPreset,
        selectCargoBoxPreset: presetsMgr.selectCargoBoxPreset,
        addCargoBoxPreset: presetsMgr.addCargoBoxPreset,
        updateCargoBoxPreset: presetsMgr.updateCargoBoxPreset,
        removeCargoBoxPreset: presetsMgr.removeCargoBoxPreset,
        fridgePresets: presetsMgr.fridgePresets,
        activeFridgePresetId: presetsMgr.activeFridgePresetId,
        activeFridgePreset: presetsMgr.activeFridgePreset,
        selectFridgePreset: presetsMgr.selectFridgePreset,
        addFridgePreset: presetsMgr.addFridgePreset,
        updateFridgePreset: presetsMgr.updateFridgePreset,
        removeFridgePreset: presetsMgr.removeFridgePreset,
        resetFridgePresets: presetsMgr.resetFridgePresetsToDefault,
        portaPottiPresets: presetsMgr.portaPottiPresets,
        activePortaPottiPresetId: presetsMgr.activePortaPottiPresetId,
        activePortaPottiPreset: presetsMgr.activePortaPottiPreset,
        selectPortaPottiPreset: presetsMgr.selectPortaPottiPreset,
        addPortaPottiPreset: presetsMgr.addPortaPottiPreset,
        updatePortaPottiPreset: presetsMgr.updatePortaPottiPreset,
        removePortaPottiPreset: presetsMgr.removePortaPottiPreset,
        resetPortaPottiPresets: presetsMgr.resetPortaPottiPresetsToDefault,
        stovePresets: presetsMgr.stovePresets,
        activeStovePresetId: presetsMgr.activeStovePresetId,
        activeStovePreset: presetsMgr.activeStovePreset,
        selectStovePreset: presetsMgr.selectStovePreset,
        addStovePreset: presetsMgr.addStovePreset,
        updateStovePreset: presetsMgr.updateStovePreset,
        removeStovePreset: presetsMgr.removeStovePreset,
        resetStovePresets: presetsMgr.resetStovePresetsToDefault,
        energyStats: appliancesMgr.energyStats,
        batteryPerformance: appliancesMgr.batteryPerformance,
        loadsSummary: appliancesMgr.loadsSummary,
        appliances: appliancesMgr.appliances,
        internalGrid: boxesMgr.internalGrid,
        setInternalGrid: boxesMgr.setInternalGrid,
        setCeiling: boxesMgr.setCeiling,
        toggleCeiling3D: boxesMgr.toggleCeiling3D,
        internalBoxes: boxesMgr.internalBoxes,
        setInternalBoxes: boxesMgr.setInternalBoxes,
        selectedBoxId: boxesMgr.selectedBoxId,
        setSelectedBoxId: boxesMgr.setSelectedBoxId,
        isolatedBoxId: boxesMgr.isolatedBoxId,
        setIsolatedBoxId: boxesMgr.setIsolatedBoxId,
        isOpenPreview: boxesMgr.isOpenPreview,
        setIsOpenPreview: boxesMgr.setIsOpenPreview,
        isCabinetsOpenPreview: boxesMgr.isCabinetsOpenPreview,
        setIsCabinetsOpenPreview: boxesMgr.setIsCabinetsOpenPreview,
        isBedOpenPreview: boxesMgr.isBedOpenPreview,
        setIsBedOpenPreview: boxesMgr.setIsBedOpenPreview,
        showMattress: boxesMgr.showMattress,
        setShowMattress: boxesMgr.setShowMattress,
        applyInternalBoxesPreset: boxesMgr.applyInternalBoxesPreset,
        addInternalBox: boxesMgr.addInternalBox,
        updateInternalBox: boxesMgr.updateInternalBox,
        removeInternalBox: boxesMgr.removeInternalBox,
        clearInternalBoxes: boxesMgr.clearInternalBoxes,
        rulerState: boxesMgr.rulerState,
        toggleRuler: boxesMgr.toggleRuler,
        setRulerActive: boxesMgr.setRulerActive,
        setRulerAxisLock: boxesMgr.setRulerAxisLock,
        clearRulerMeasurements: boxesMgr.clearRulerMeasurements,
        removeRulerMeasurement: boxesMgr.removeRulerMeasurement,
        setStackLevels: structureMgr.setStackLevels,
        setLevel1Panels: structureMgr.setLevel1Panels,
        setLevel1Direction: structureMgr.setLevel1Direction,
        setLevel1Orientation: structureMgr.setLevel1Orientation,
        setLevel2Panels: structureMgr.setLevel2Panels,
        setLevel2Direction: structureMgr.setLevel2Direction,
        setLevel2Orientation: structureMgr.setLevel2Orientation,
        setStructureMaterial: structureMgr.setStructureMaterial,
        setSteelProfileUnit: structureMgr.setSteelProfileUnit,
        setAluminumColor: structureMgr.setAluminumColor,
        setMetalonColor: structureMgr.setMetalonColor,
        metalonWallThickness: structureMgr.metalonWallThickness,
        metalonThickness40: structureMgr.metalonThickness40,
        metalonThickness30: structureMgr.metalonThickness30,
        setMetalonWallThickness: structureMgr.setMetalonWallThickness,
        setMetalonThickness40: structureMgr.setMetalonThickness40,
        setMetalonThickness30: structureMgr.setMetalonThickness30,
        setOffsetZ: structureMgr.setOffsetZ,
        setOffsetY: structureMgr.setOffsetY,
        setExpansion: structureMgr.setExpansion,
        setCargoBox: cargoAndEquipMgr.setCargoBox,
        setCargoBoxEnabled: cargoAndEquipMgr.setCargoBoxEnabled,
        setCargoBoxDimensions: cargoAndEquipMgr.setCargoBoxDimensions,
        setCargoBoxVerticalLift: cargoAndEquipMgr.setCargoBoxVerticalLift,
        setCargoBoxTelescopic: cargoAndEquipMgr.setCargoBoxTelescopic,
        setCargoBoxHingeSide: cargoAndEquipMgr.setCargoBoxHingeSide,
        setTiltAngle: cargoAndEquipMgr.setTiltAngle,
        setBoxLidAngle: cargoAndEquipMgr.setBoxLidAngle,
        tiltSolarRack: cargoAndEquipMgr.tiltSolarRack,
        closeSolarRack: cargoAndEquipMgr.closeSolarRack,
        openBoxLid: cargoAndEquipMgr.openBoxLid,
        closeBoxLid: cargoAndEquipMgr.closeBoxLid,
        retractAndTilt: cargoAndEquipMgr.retractAndTilt,
        setWaterTank: cargoAndEquipMgr.setWaterTank,
        setWaterTankEnabled: cargoAndEquipMgr.setWaterTankEnabled,
        setWaterTankLength: cargoAndEquipMgr.setWaterTankLength,
        setWaterTankRadius: cargoAndEquipMgr.setWaterTankRadius,
        setWaterTankConnectionPosition: cargoAndEquipMgr.setWaterTankConnectionPosition,
        setAwning: cargoAndEquipMgr.setAwning,
        toggleAwningOpen: cargoAndEquipMgr.toggleAwningOpen,
        setB2BEnabled: cargoAndEquipMgr.setB2BEnabled,
        toggleB2BEngine: cargoAndEquipMgr.toggleB2BEngine,
        setB2BEngineHours: cargoAndEquipMgr.setB2BEngineHours,
        toggleUsinaAC: cargoAndEquipMgr.toggleUsinaAC,
        setUsinaAmps: cargoAndEquipMgr.setUsinaAmps,
        setUsinaVoltage: cargoAndEquipMgr.setUsinaVoltage,
        setUsinaModel: cargoAndEquipMgr.setUsinaModel,
        collisionSummary: viewMgr.collisionSummary,
        checkCollisions: viewMgr.checkCollisions,
        clearCollisions: viewMgr.clearCollisions,
        floatingSummary: viewMgr.floatingSummary,
        checkFloating: viewMgr.checkFloating,
        clearFloating: viewMgr.clearFloating,
        toggleVehicle: viewMgr.toggleVehicle,
        toggleDimensions: viewMgr.toggleDimensions,
        toggleChain: viewMgr.toggleChain,
        toggleTransparency: viewMgr.toggleTransparency,
        toggleSound: viewMgr.toggleSound,
        toggleAutoAnim: viewMgr.toggleAutoAnim,
        setViewMode: viewMgr.setViewMode,
        setPartsFilter: viewMgr.setPartsFilter,
        toggleViewMode: viewMgr.toggleViewMode,
        expand: structureMgr.expand,
        retract: structureMgr.retract,
        rewind: structureMgr.rewind,
        setCameraPreset: viewMgr.setCameraPreset,
        setSunHour: viewMgr.setSunHour,
        takeScreenshot: viewMgr.takeScreenshot,
        openModal: viewMgr.openModal,
        closeModal: viewMgr.closeModal,
        flashToast,
        addAppliance: appliancesMgr.addAppliance,
        updateAppliance: appliancesMgr.updateAppliance,
        removeAppliance: appliancesMgr.removeAppliance,
        moveAppliance: appliancesMgr.moveAppliance,
        reorderAppliances: appliancesMgr.reorderAppliances,
        resetAppliances: appliancesMgr.resetAppliances
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
