import { useState } from 'react';
import { ApplianceItem, LoadsSummary, BatteryPerformance, EnergyStats } from '../../types';

export function useAppliancesManager(
  sceneManager: any,
  flashToast: (msg: string) => void
) {
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

  return {
    energyStats,
    setEnergyStats,
    appliances,
    setAppliances,
    loadsSummary,
    setLoadsSummary,
    batteryPerformance,
    setBatteryPerformance,
    updateCalculations,
    addAppliance,
    updateAppliance,
    removeAppliance,
    moveAppliance,
    reorderAppliances,
    resetAppliances
  };
}
