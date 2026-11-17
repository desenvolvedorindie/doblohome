import { useState } from 'react';
import {
  StackLevels,
  SlideDirection,
  PanelOrientation,
  StructureMaterial,
  SteelProfileUnit,
  AluminumColor,
  LevelConfig,
  SavedConfig
} from '../../types';
import { getSavedConfigSync } from './SolarPersistence';

export function useStructureActions(
  sceneManager: any,
  saveConfig: (overrides?: Partial<SavedConfig>) => void,
  updateCalculations: () => void,
  flashToast: (msg: string) => void,
  cargoBox: any,
  setIsAutoAnimating: (val: boolean) => void
) {
  const initialCfg = getSavedConfigSync();

  const [stackLevels, setStackLevelsState] = useState<StackLevels>(() => {
    return initialCfg?.stackLevels === 1 || initialCfg?.stackLevels === 2 ? initialCfg.stackLevels : 2;
  });
  const [level1, setLevel1State] = useState<LevelConfig>(() => {
    if (initialCfg?.level1 && typeof initialCfg.level1.panels === 'number' && [1, 2, 3, 4].includes(initialCfg.level1.panels)) {
      return initialCfg.level1;
    }
    return {
      panels: 2,
      direction: 'longitudinal',
      orientation: 'longitudinal'
    };
  });
  const [level2, setLevel2State] = useState<LevelConfig>(() => {
    if (initialCfg?.level2 && typeof initialCfg.level2.panels === 'number' && [1, 2, 3, 4].includes(initialCfg.level2.panels)) {
      return initialCfg.level2;
    }
    return {
      panels: 2,
      direction: 'fixed',
      orientation: 'longitudinal'
    };
  });
  const [structureMaterial, setStructureMaterialState] = useState<StructureMaterial>(() => {
    return initialCfg?.structureMaterial || 'aluminum';
  });
  const [steelProfileUnit, setSteelProfileUnitState] = useState<SteelProfileUnit>(() => {
    return initialCfg?.steelProfileUnit || 'mm';
  });
  const [aluminumColor, setAluminumColorState] = useState<AluminumColor>(() => {
    return initialCfg?.aluminumColor || 'silver';
  });
  const [metalonColor, setMetalonColorState] = useState<string>(() => {
    return initialCfg?.metalonColor || '#333b47';
  });
  const [metalonWallThickness, setMetalonWallThicknessState] = useState<number>(() => {
    return initialCfg?.metalonWallThickness !== undefined ? initialCfg.metalonWallThickness : 1.5;
  });
  const [metalonThickness40, setMetalonThickness40State] = useState<number>(() => {
    return initialCfg?.metalonThickness40 !== undefined ? initialCfg.metalonThickness40 : 2.0;
  });
  const [metalonThickness30, setMetalonThickness30State] = useState<number>(() => {
    return initialCfg?.metalonThickness30 !== undefined ? initialCfg.metalonThickness30 : 1.5;
  });
  const [offsetZ, setOffsetZState] = useState<number>(() => {
    if (initialCfg?.offsetZ !== undefined) {
      let z = initialCfg.offsetZ > 0.1 ? -initialCfg.offsetZ : initialCfg.offsetZ;
      return Math.abs(z - (-0.68)) < 0.01 ? -1.20 : z;
    }
    return -1.20;
  });
  const [offsetY, setOffsetYState] = useState<number>(() => {
    if (initialCfg?.offsetY !== undefined) {
      let y = Math.max(-0.30, Math.min(0.50, initialCfg.offsetY));
      return Math.abs(y) < 0.001 ? -0.14 : y;
    }
    return -0.14;
  });
  const [expansionProgress, setExpansionProgressState] = useState<number>(() => {
    return initialCfg?.expansionProgress !== undefined ? initialCfg.expansionProgress : 0.0;
  });

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

  return {
    stackLevels,
    setStackLevelsState,
    level1,
    setLevel1State,
    level2,
    setLevel2State,
    structureMaterial,
    setStructureMaterialState,
    steelProfileUnit,
    setSteelProfileUnitState,
    aluminumColor,
    setAluminumColorState,
    metalonColor,
    setMetalonColorState,
    metalonWallThickness,
    setMetalonWallThicknessState,
    metalonThickness40,
    setMetalonThickness40State,
    metalonThickness30,
    setMetalonThickness30State,
    offsetZ,
    setOffsetZState,
    offsetY,
    setOffsetYState,
    expansionProgress,
    setExpansionProgressState,
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
    setMetalonWallThickness,
    setMetalonThickness40,
    setMetalonThickness30,
    setOffsetZ,
    setOffsetY,
    setExpansion,
    expand,
    retract,
    rewind
  };
}
