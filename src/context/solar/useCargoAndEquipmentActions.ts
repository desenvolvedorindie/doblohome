import { useState, useRef } from 'react';
import {
  CargoBoxConfig,
  WaterTankConfig,
  AwningConfig,
  B2BChargerConfig,
  UsinaChargerConfig,
  UsinaModelRating,
  SavedConfig
} from '../../types';

export function useCargoAndEquipmentActions(
  sceneManager: any,
  saveConfig: (overrides?: Partial<SavedConfig>) => void,
  updateCalculations: () => void,
  flashToast: (msg: string) => void,
  expansionProgress: number
) {
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

  // Caixa d'Água Lateral
  const [waterTank, setWaterTankState] = useState<WaterTankConfig>({
    enabled: true,
    lengthMm: 2200,
    diameterMm: 200,
    connectionPosition: 'front'
  });

  // Toldo Retrátil Overland
  const [awning, setAwningState] = useState<AwningConfig>({
    enabled: false,
    type: 'rear',
    side: 'passenger',
    lengthMm: 1400,
    extensionMm: 2000,
    isOpen: false,
    fabricColor: '#374151'
  });

  // Carregador Inteligente DC-DC B2B1230
  const [b2bCharger, setB2BCharger] = useState<B2BChargerConfig>({
    enabled: true,
    isEngineRunning: false,
    engineHoursPerDay: 1.5,
    chargingAmps: 30,
    voltageIn: 14.1,
    voltageOut: 14.4,
    watts: 390,
    bluetoothConnected: true
  });
  const b2bChargerRef = useRef<B2BChargerConfig>(b2bCharger);
  b2bChargerRef.current = b2bCharger;

  // Fonte e Carregador Automotivo Usina Smart Connect
  const [usinaCharger, setUsinaCharger] = useState<UsinaChargerConfig>({
    enabled: true,
    isConnectedAC: false,
    modelRating: 150,
    chargingAmps: 150,
    voltageOut: 14.4,
    watts: 2160,
    acVoltage: 220,
    smartConnectActive: true
  });

  // Animações do Baú
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

  // Caixa d'Água
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

  const setWaterTankConnectionPosition = (position: 'front' | 'rear') => {
    setWaterTank({ connectionPosition: position });
    flashToast(
      position === 'rear'
        ? "💧 Conexão da caixa d'água posicionada na TRASEIRA (acesso fácil pelo porta-malas)"
        : "💧 Conexão da caixa d'água posicionada na DIANTEIRA (frente do rack)"
    );
  };

  // Toldo
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

  // B2B
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

  // Usina
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

  return {
    cargoBox,
    setCargoBoxState,
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
    waterTank,
    setWaterTankState,
    setWaterTank,
    setWaterTankEnabled,
    setWaterTankLength,
    setWaterTankRadius,
    setWaterTankConnectionPosition,
    awning,
    setAwningState,
    setAwning,
    toggleAwningOpen,
    b2bCharger,
    setB2BCharger,
    setB2BEnabled,
    toggleB2BEngine,
    setB2BEngineHours,
    usinaCharger,
    setUsinaCharger,
    toggleUsinaAC,
    setUsinaModel,
    setUsinaAmps,
    setUsinaVoltage
  };
}
