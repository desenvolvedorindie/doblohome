import { StackLevels, StructureMaterial, SteelProfileUnit } from '../../types';

export interface SolarEnergyParams {
  level1: { panels: number; slideDirection: any; orientation: any };
  level2: { panels: number; slideDirection: any; orientation: any };
  stackLevels: StackLevels;
  expansionProgress: number;
  structureMaterial: StructureMaterial;
  steelProfileUnit: SteelProfileUnit;
  panelSpecs: {
    powerWatts: number;
    voc: number;
    vmp: number;
    isc: number;
    weightKg: number;
  };
}

export class SolarEnergyCalculator {
  static calculate(params: SolarEnergyParams) {
    const {
      level1,
      level2,
      stackLevels,
      expansionProgress,
      structureMaterial,
      steelProfileUnit,
      panelSpecs
    } = params;

    const l1Count = level1 ? level1.panels : 2;
    const l2Count = (stackLevels === 2 && level2) ? level2.panels : 0;
    const totalPanels = l1Count + l2Count;

    const powerClosed = ((stackLevels === 2) ? l2Count : l1Count) * panelSpecs.powerWatts;
    const powerOpen = totalPanels * panelSpecs.powerWatts;

    const currentWatts = Math.round(powerClosed + (powerOpen - powerClosed) * expansionProgress);
    const dailyKWh = ((currentWatts * 5.2) / 1000).toFixed(2);
    const currentAmps12V = (currentWatts / 13.6).toFixed(1);

    const isSeriesPair = (totalPanels >= 2);
    const vocTotal = (isSeriesPair ? panelSpecs.voc * 2 : panelSpecs.voc).toFixed(2);
    const vmpTotal = (isSeriesPair ? panelSpecs.vmp * 2 : panelSpecs.vmp).toFixed(1);
    const iscTotal = (isSeriesPair ? panelSpecs.isc * Math.max(1, Math.round(totalPanels / 2)) : panelSpecs.isc * totalPanels).toFixed(1);

    const weightPanels = (totalPanels * panelSpecs.weightKg).toFixed(1);
    const isSteel = (structureMaterial === 'steel');
    const isAluTube = (structureMaterial === 'aluminum_tube');
    const baseRackWeight = isSteel ? 26.0 : (isAluTube ? 8.5 : 11.5);
    const trayWeightPerLevel = isSteel ? 5.2 : (isAluTube ? 1.2 : 2.3);
    const slidesWeight = ((stackLevels - 1) * 3.4);
    const weightStructure = (baseRackWeight + (trayWeightPerLevel * stackLevels)).toFixed(1);
    const weightTotal = (parseFloat(weightPanels) + parseFloat(weightStructure) + slidesWeight).toFixed(1);

    return {
      watts: currentWatts,
      powerClosed,
      powerOpen,
      dailyKWh,
      currentAmps12V,
      voc: vocTotal,
      vmp: vmpTotal,
      isc: iscTotal,
      totalPanels,
      stackLevels,
      panelsPerLevel: l1Count,
      level1Panels: l1Count,
      level2Panels: l2Count,
      slideDirection: level1 ? level1.slideDirection : 'longitudinal',
      panelOrientation: level1 ? level1.orientation : 'longitudinal',
      structureMaterial,
      steelProfileUnit,
      weightPanels,
      weightStructure,
      weightTotal,
      percent: Math.round(expansionProgress * 100)
    };
  }
}
