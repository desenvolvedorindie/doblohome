import { useMemo, useState } from 'react';
import { useSolar } from '../../context/SolarContext';

export function useRackWeightAndHeight() {
  const {
    structureMaterial,
    metalonThickness40,
    metalonThickness30,
    stackLevels,
    energyStats,
    activePanelPreset,
    waterTank,
    cargoBox,
    activeCargoBoxPreset,
    awning,
  } = useSolar();

  const [isWaterWeightFull, setIsWaterWeightFull] = useState<boolean>(true);
  const [showWeightDetails, setShowWeightDetails] = useState<boolean>(false);

  // --- ESTIMATIVA DE PESO DO RACK (TETO DA FIAT DOBLÒ) ---
  const rackWeightStats = useMemo(() => {
    const isSteel = structureMaterial === 'steel';
    const isAluTube = structureMaterial === 'aluminum_tube';
    const isTSlot = structureMaterial === 'aluminum';
    const isTelescopic = (cargoBox.isTelescopic !== false);

    // Ajuste dinâmico de peso em função da espessura configurada da parede do tubo (Metalon)
    const t40 = metalonThickness40 || 2.0;
    const t30 = metalonThickness30 || 1.5;
    const refArea40 = 4 * 0.0020 * (0.040 - 0.0020);
    const curArea40 = 4 * (t40 / 1000) * (0.040 - t40 / 1000);
    const k40 = (isSteel || isAluTube) ? (curArea40 / refArea40) : 1.0;

    const refArea30 = 4 * 0.0015 * (0.030 - 0.0015);
    const curArea30 = 4 * (t30 / 1000) * (0.030 - t30 / 1000);
    const k30 = (isSteel || isAluTube) ? (curArea30 / refArea30) : 1.0;

    // 1. Estrutura Metálica (Perfis Metalon Aço, Alumínio Tubular ou Alumínio T-Slot + Torres + Corrediças)
    const nominalBaseWeight = cargoBox.enabled
      ? (isSteel ? (isTelescopic ? 28.5 : 25.5) : isAluTube ? (isTelescopic ? 9.5 : 8.2) : (isTelescopic ? 14.5 : 12.5))
      : (isSteel ? 26.0 : isAluTube ? 8.5 : 11.5);
    const baseWeight = +(nominalBaseWeight * k40).toFixed(1);

    // Gavetas móveis dos leitos solares
    const nominalTraysWeight = stackLevels * (isSteel ? 5.2 : isAluTube ? 1.2 : 2.3);
    const traysWeight = +(nominalTraysWeight * k30).toFixed(1);

    // Corrediças telescópicas industriais reforçadas (pares de trilhos pesados de aço para gavetas)
    const slidesWeight = Math.max(0, stackLevels - 1) * 3.4;
    const structureWeight = +(baseWeight + traysWeight + slidesWeight).toFixed(1);

    // 2. Placas Fotovoltaicas
    const panelCount = energyStats.panelCount || 4;
    const panelUnitWeightKg = activePanelPreset?.weightKg ?? 1.8;
    const panelsWeight = +(panelCount * panelUnitWeightKg).toFixed(1);

    // 3. Sistema de Água (Tubulação em U + Água se cheio)
    let waterLiters = 0;
    let pipeWeight = 0;
    if (waterTank.enabled) {
      const pipeRadiusMm = Math.round(waterTank.diameterMm / 2);
      const pipeRadiusDm = pipeRadiusMm / 100;
      const pipeRadiusM = pipeRadiusMm / 1000;
      const frameInnerX = 0.70 - 0.04;
      const pipeOffsetX = frameInnerX - pipeRadiusM;
      const bendR = Math.max(0.06, pipeRadiusM * 1.35);
      const frontPipeSpanM = Math.max(0.20, (pipeOffsetX - bendR) * 2);
      const frontCircuitAddonM = frontPipeSpanM + Math.PI * bendR;
      const singlePipeLiters = Math.PI * pipeRadiusDm * pipeRadiusDm * (waterTank.lengthMm / 100);
      const frontCircuitLiters = Math.PI * pipeRadiusDm * pipeRadiusDm * (frontCircuitAddonM * 10);
      waterLiters = +(singlePipeLiters * 2 + frontCircuitLiters).toFixed(1);
      pipeWeight = +(Math.round((waterTank.diameterMm / 100) * 8.5 * 10) / 10).toFixed(1);
    }
    const waterWeight = isWaterWeightFull ? waterLiters : 0;
    const waterSystemWeight = +(pipeWeight + waterWeight).toFixed(1);

    // 4. Baú de Teto Motobul (ABS Automotivo UV)
    let cargoBoxWeight = 0;
    if (cargoBox.enabled) {
      cargoBoxWeight = activeCargoBoxPreset?.weightKg ?? (cargoBox.length >= 1800 ? 21.0 : cargoBox.length <= 1500 ? 15.5 : 18.0);
    }

    // 5. Toldo Overland (Asa de Morcego 270° ou Traseiro Reto)
    let awningWeight = 0;
    if (awning.enabled) {
      awningWeight = awning.type === 'batwing_270' ? 20.0 : 10.5;
    }

    // 6. Ferragens & Pistões a Gás
    const hardwareWeight = cargoBox.enabled ? 5.0 : 3.2;

    // Totais: Seco e Operacional
    const totalDry = +(structureWeight + panelsWeight + pipeWeight + cargoBoxWeight + awningWeight + hardwareWeight).toFixed(1);
    const totalFull = +(structureWeight + panelsWeight + pipeWeight + waterLiters + cargoBoxWeight + awningWeight + hardwareWeight).toFixed(1);
    const activeTotal = isWaterWeightFull ? totalFull : totalDry;

    // Limites de Carga do Teto da Fiat Doblò
    const limitDynamicRoofKg = 100;
    const limitStaticRoofKg = 300;
    const pctDynamic = Math.round((activeTotal / limitDynamicRoofKg) * 100);
    const marginDynamicKg = +(limitDynamicRoofKg - activeTotal).toFixed(1);

    return {
      isSteel,
      isAluTube,
      isTSlot,
      isTelescopic,
      structureWeight,
      baseWeight,
      traysWeight,
      slidesWeight,
      panelCount,
      panelUnitWeightKg,
      panelsWeight,
      waterEnabled: waterTank.enabled,
      waterDiameterMm: waterTank.diameterMm,
      waterLengthMm: waterTank.lengthMm,
      waterLiters,
      pipeWeight,
      waterWeight,
      waterSystemWeight,
      cargoBoxEnabled: cargoBox.enabled,
      cargoBoxWeight,
      awningEnabled: awning.enabled,
      awningWeight,
      awningType: awning.type,
      hardwareWeight,
      totalDry,
      totalFull,
      activeTotal,
      limitDynamicRoofKg,
      limitStaticRoofKg,
      pctDynamic,
      marginDynamicKg,
      t40,
      t30
    };
  }, [
    structureMaterial,
    metalonThickness40,
    metalonThickness30,
    stackLevels,
    energyStats.panelCount,
    activePanelPreset,
    waterTank,
    isWaterWeightFull,
    cargoBox.enabled,
    cargoBox.length,
    cargoBox.isTelescopic,
    activeCargoBoxPreset,
    awning.enabled,
    awning.type
  ]);

  // --- ESTIMATIVA DE ALTURA & GABARITO DO CONJUNTO (CONTRAN RES. 955/2022) ---
  const rackHeightStats = useMemo(() => {
    const baseProfileMm = 40;
    let cargoBoxH_Mm = 0;
    let verticalLiftMm = 0;
    let clearanceHingesMm = 0;
    const isTelescopic = (cargoBox.isTelescopic !== false);

    if (cargoBox.enabled) {
      cargoBoxH_Mm = cargoBox.height || 330;
      clearanceHingesMm = 8;
      const maxLiftMm = isTelescopic ? Math.max(60, cargoBoxH_Mm - 100) : 0;
      verticalLiftMm = isTelescopic ? Math.min(maxLiftMm, Math.max(0, cargoBox.verticalLiftMm || 0)) : 0;
    }

    const solarTraysH_Mm = stackLevels === 2 ? 75 : 30;
    const panelThicknessMm = Math.round((activePanelPreset?.thickness ?? 0.003) * 1000);

    const totalRackHeightMm = baseProfileMm + cargoBoxH_Mm + clearanceHingesMm + verticalLiftMm + solarTraysH_Mm + panelThicknessMm;
    const totalRackHeightCm = +(totalRackHeightMm / 10).toFixed(1);
    const totalRackHeightM = +(totalRackHeightMm / 1000).toFixed(2);

    const limitContranMm = 500;
    const limitContranCm = 50.0;

    const diffMm = totalRackHeightMm - limitContranMm;
    const diffCm = +(diffMm / 10).toFixed(1);
    const pctOfLimit = Math.round((totalRackHeightMm / limitContranMm) * 100);
    const isAboveLimit = totalRackHeightMm > limitContranMm;
    const pctAbove = isAboveLimit ? Math.round(((totalRackHeightMm - limitContranMm) / limitContranMm) * 100) : 0;

    const vehicleBaseHeightM = 1.84;
    const totalVehicleHeightM = +(vehicleBaseHeightM + totalRackHeightM).toFixed(2);
    const totalVehicleHeightCm = Math.round(totalVehicleHeightM * 100);

    return {
      baseProfileMm,
      cargoBoxH_Mm,
      clearanceHingesMm,
      verticalLiftMm,
      solarTraysH_Mm,
      panelThicknessMm,
      totalRackHeightMm,
      totalRackHeightCm,
      totalRackHeightM,
      limitContranMm,
      limitContranCm,
      diffMm,
      diffCm,
      pctOfLimit,
      isAboveLimit,
      pctAbove,
      vehicleBaseHeightM,
      totalVehicleHeightM,
      totalVehicleHeightCm
    };
  }, [cargoBox.enabled, cargoBox.height, cargoBox.verticalLiftMm, cargoBox.isTelescopic, stackLevels, activePanelPreset?.thickness]);

  return {
    isWaterWeightFull,
    setIsWaterWeightFull,
    showWeightDetails,
    setShowWeightDetails,
    rackWeightStats,
    rackHeightStats,
  };
}
