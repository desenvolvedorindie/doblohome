import React, { useState, useMemo } from 'react';
import { useSolar } from '../context/SolarContext';
import { CameraPreset } from '../types';

export const RightPanel: React.FC = () => {
  const {
    expansionProgress,
    setExpansion,
    retract,
    expand,
    rewind,
    toggleAutoAnim,
    isAutoAnimating,
    sunHour,
    setSunHour,
    isVehicleVisible,
    toggleVehicle,
    isDimensionsVisible,
    toggleDimensions,
    isTransparent,
    toggleTransparency,
    isSoundEnabled,
    toggleSound,
    viewMode,
    setViewMode,
    sceneManager,
    activeCameraPreset,
    setCameraPreset,
    energyStats,
    batteryPerformance,
    openModal,
    cargoBox,
    setCargoBoxEnabled,
    setCargoBoxVerticalLift,
    setCargoBoxTelescopic,
    awning,
    setAwning,
    toggleAwningOpen,
    setTiltAngle,
    setBoxLidAngle,
    tiltSolarRack,
    closeSolarRack,
    openBoxLid,
    closeBoxLid,
    retractAndTilt,
    collisionSummary,
    checkCollisions,
    clearCollisions,
    floatingSummary,
    checkFloating,
    clearFloating,
    flashToast,
    b2bCharger,
    setB2BEngineHours,
    usinaCharger,
    toggleUsinaAC,
    setUsinaModel,
    structureMaterial,
    steelProfileUnit,
    metalonWallThickness,
    metalonThickness40,
    metalonThickness30,
    stackLevels,
    waterTank,
    activePanelPreset,
    activeCargoBoxPreset
  } = useSolar();

  // Estado para visualização do peso com água cheia vs seco no teto
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
    // Base rack: subchassi de ancoragem nas calhas do teto da Doblò
    // Torres telescópicas têm estágios duplos e colares (+2kg a +3kg); torres fixas são monobloco mais leves
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
      // Peso tubos PVC Série R + conexões joelhos 90°, caps e registros
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
    // Pistões a gás de amortecimento/basculamento (400N a 800N) + parafusos M8/M10 inox e sapatas
    const hardwareWeight = cargoBox.enabled ? 5.0 : 3.2;

    // Totais: Seco (sem água, baú vazio) e Operacional (com água conforme seleção)
    const totalDry = +(structureWeight + panelsWeight + pipeWeight + cargoBoxWeight + awningWeight + hardwareWeight).toFixed(1);
    const totalFull = +(structureWeight + panelsWeight + pipeWeight + waterLiters + cargoBoxWeight + awningWeight + hardwareWeight).toFixed(1);
    const activeTotal = isWaterWeightFull ? totalFull : totalDry;

    // Limites de Carga do Teto da Fiat Doblò
    const limitDynamicRoofKg = 100; // Limite dinâmico recomendado pela Fiat em rodovias
    const limitStaticRoofKg = 300;  // Limite estático com veículo estacionado no camping
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
    // 1. Altura da base do rack (perfil estrutural de fixação nas calhas da Doblò)
    const baseProfileMm = 40; // 40 mm (0.040 m)

    // 2. Altura do Baú de Teto Motobul + folga mínima + elevação vertical telescópica
    let cargoBoxH_Mm = 0;
    let verticalLiftMm = 0;
    let clearanceHingesMm = 0;
    const isTelescopic = (cargoBox.isTelescopic !== false);

    if (cargoBox.enabled) {
      cargoBoxH_Mm = cargoBox.height || 330;
      clearanceHingesMm = 8; // Folga ultra-otimizada entre baú e estrutura (8mm)
      const maxLiftMm = isTelescopic ? Math.max(60, cargoBoxH_Mm - 100) : 0;
      verticalLiftMm = isTelescopic ? Math.min(maxLiftMm, Math.max(0, cargoBox.verticalLiftMm || 0)) : 0;
    }

    // 3. Superestrutura de gavetas/bandejas solares retráteis:
    // Otimização de altura mínima: os slides do nível inferior operam no MESMO nível Y (coplanares),
    // eliminando o antigo degrau de 60mm entre subníveis e deixando o vão rente no limite de altura!
    // Se 2 níveis (duplo coplanar + superior a +45mm): 75 mm
    // Se 1 nível (plano único): 30 mm
    const solarTraysH_Mm = stackLevels === 2 ? 75 : 30;
    const panelThicknessMm = Math.round((activePanelPreset?.thickness ?? 0.003) * 1000);

    // Altura total da carga no teto (a contar da lataria do teto até o topo da placa solar)
    const totalRackHeightMm = baseProfileMm + cargoBoxH_Mm + clearanceHingesMm + verticalLiftMm + solarTraysH_Mm + panelThicknessMm;
    const totalRackHeightCm = +(totalRackHeightMm / 10).toFixed(1);
    const totalRackHeightM = +(totalRackHeightMm / 1000).toFixed(2);

    // Legislação Brasileira de Trânsito: CONTRAN Resolução nº 955/2022 (antiga Res. 349/2010), Art. 5º:
    // Limite máximo permitido para cargas transportadas no teto de veículos de passeio: 50 cm (500 mm)
    const limitContranMm = 500;
    const limitContranCm = 50.0;

    const diffMm = totalRackHeightMm - limitContranMm;
    const diffCm = +(diffMm / 10).toFixed(1);
    const pctOfLimit = Math.round((totalRackHeightMm / limitContranMm) * 100);
    const isAboveLimit = totalRackHeightMm > limitContranMm;
    const pctAbove = isAboveLimit ? Math.round(((totalRackHeightMm - limitContranMm) / limitContranMm) * 100) : 0;

    // Altura Total Veículo Fiat Doblò + Conjunto:
    // Altura padrão de fábrica da Fiat Doblò: 1.84 m (1839 mm)
    const vehicleBaseHeightM = 1.84;
    const totalVehicleHeightM = +(vehicleBaseHeightM + totalRackHeightMm / 1000).toFixed(2);
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

  const expansionPct = Math.round(expansionProgress * 100);
  const isRetracted = expansionPct <= 0;
  const isFullyOpen = expansionPct >= 100;

  // Cálculo MPPT Kingbo 60A: limite nominal @ 12V é ~720W (60A * 12V = 720W; ou 864W @ 14.4V)
  const mpptMaxWatts = 720;
  const mpptPeakMaxWatts = 864;
  const mpptRawPct = Math.round((energyStats.effectiveWatts / mpptMaxWatts) * 100);
  const mpptPct = Math.min(100, mpptRawPct);
  const mpptMargin = Math.max(0, mpptMaxWatts - energyStats.effectiveWatts);
  const mpptOverWatts = Math.max(0, energyStats.effectiveWatts - mpptMaxWatts);
  const mpptOverPct = Math.max(0, Math.round(((energyStats.effectiveWatts - mpptMaxWatts) / mpptMaxWatts) * 100));
  const mpptRemainingPct = Math.max(0, Math.round(((mpptMaxWatts - energyStats.effectiveWatts) / mpptMaxWatts) * 100));
  const isNominalOverMppt = energyStats.nominalPowerW > mpptMaxWatts;
  const isEffectiveOverMppt = energyStats.effectiveWatts > mpptMaxWatts;
  const isOverAbsolutePeak = energyStats.nominalPowerW > mpptPeakMaxWatts || energyStats.effectiveWatts > mpptPeakMaxWatts;
  const nominalOverWatts = Math.max(0, energyStats.nominalPowerW - mpptMaxWatts);
  const nominalOverPct = Math.max(0, Math.round(((energyStats.nominalPowerW - mpptMaxWatts) / mpptMaxWatts) * 100));
  const nominalUsagePct = Math.round((energyStats.nominalPowerW / mpptMaxWatts) * 100);
  const nominalRemainingPct = Math.max(0, Math.round(((mpptMaxWatts - energyStats.nominalPowerW) / mpptMaxWatts) * 100));
  const nominalRemainingWatts = Math.max(0, mpptMaxWatts - energyStats.nominalPowerW);
  const peakOverPct = Math.max(0, Math.round(((energyStats.nominalPowerW - mpptPeakMaxWatts) / mpptPeakMaxWatts) * 100));

  // Recarga combinada: Solar (MPPT) + Alternador Doblò (B2B1230 30A) + Shore Power (Usina)
  const b2bExtraWatts = (b2bCharger.enabled && b2bCharger.isEngineRunning) ? b2bCharger.watts : 0;
  const usinaExtraWatts = (usinaCharger.enabled && usinaCharger.isConnectedAC) ? Math.round(usinaCharger.chargingAmps * usinaCharger.voltageOut) : 0;
  const totalChargingWatts = energyStats.effectiveWatts + b2bExtraWatts + usinaExtraWatts;
  const combinedChargeHours = totalChargingWatts > 10
    ? +(batteryPerformance.batUsableWh / totalChargingWatts).toFixed(1)
    : 999;

  const formatSunTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}h`;
  };

  return (
    <>
      {/* Barra Flutuante Central no Topo da Tela: Alternar entre Modo 1 (Caixas Internas), Modo 2 (Doblò + Estrutura) e Modo 3 (Peças) */}
      <div
        className="glass-panel"
        style={{
          position: 'fixed',
          top: '84px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 35,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px',
          borderRadius: '999px',
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.55), 0 0 16px rgba(56, 189, 248, 0.2)'
        }}
      >
        <button
          onClick={() => setViewMode('internal_boxes')}
          style={{
            border: 'none',
            borderRadius: '999px',
            padding: '7px 16px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: viewMode === 'internal_boxes' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
            color: viewMode === 'internal_boxes' ? '#ffffff' : '#94a3b8',
            boxShadow: viewMode === 'internal_boxes' ? '0 2px 10px rgba(245, 158, 11, 0.45)' : 'none'
          }}
        >
          📦 1. Caixas Internas
        </button>
        <button
          onClick={() => setViewMode('assembled')}
          style={{
            border: 'none',
            borderRadius: '999px',
            padding: '7px 16px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: viewMode === 'assembled' ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : 'transparent',
            color: viewMode === 'assembled' ? '#ffffff' : '#94a3b8',
            boxShadow: viewMode === 'assembled' ? '0 2px 10px rgba(14, 165, 233, 0.45)' : 'none'
          }}
        >
          🚐 2. Doblò + Estrutura
        </button>
        <button
          onClick={() => setViewMode('bars_lineup')}
          style={{
            border: 'none',
            borderRadius: '999px',
            padding: '7px 16px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: viewMode === 'bars_lineup' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
            color: viewMode === 'bars_lineup' ? '#ffffff' : '#94a3b8',
            boxShadow: viewMode === 'bars_lineup' ? '0 2px 10px rgba(16, 185, 129, 0.45)' : 'none'
          }}
        >
          📏 3. Peças
        </button>
      </div>

      {/* Painel Direito Unificado com Scroll: Expansão + Acessórios + Dashboard Elétrico (Apenas no Modo 2: Doblò + Estrutura) */}
      {viewMode === 'assembled' && (
        <aside className="right-panel glass-panel" id="right-panel">
          <div className="expansion-widget-header">
            <span>📐 GAVETAS</span>
            <div className="expansion-status">
              {cargoBox.enabled && cargoBox.tiltAngle > 0 ? (
                <span
                  className="status-badge"
                  style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    fontSize: '9px'
                  }}
                >
                  🔒 Travado (Basculado)
                </span>
              ) : (
                <span
                  className={`status-badge ${isRetracted ? 'retracted' : isFullyOpen ? 'expanded' : 'partial'}`}
                  id="expansion-badge"
                >
                  {isRetracted ? 'Fechado' : isFullyOpen ? 'Extensão Total' : 'Parcial'}
                </span>
              )}
              <span className="extension-val" id="expansion-val">
                {expansionPct}%
              </span>
            </div>
          </div>

          <input
            type="range"
            id="expansion-slider"
            className="custom-slider"
            min="0"
            max="100"
            value={expansionPct}
            disabled={cargoBox.enabled && cargoBox.tiltAngle > 0}
            title={cargoBox.enabled && cargoBox.tiltAngle > 0 ? 'Feche o basculamento do rack para movimentar as gavetas' : ''}
            onChange={(e) => setExpansion(parseFloat(e.target.value) / 100)}
          />

          <div className="slider-actions">
            <button
              className="btn-compact"
              id="btn-retract"
              onClick={retract}
              disabled={cargoBox.enabled && cargoBox.tiltAngle > 0}
            >
              🔒 Recolher
            </button>
            <button
              className="btn-compact primary"
              id="btn-expand"
              onClick={expand}
              disabled={cargoBox.enabled && cargoBox.tiltAngle > 0}
            >
              ⚡ Expandir
            </button>
            <button
              className="btn-compact accent"
              id="btn-rewind"
              title="Rebobinar"
              onClick={rewind}
              disabled={cargoBox.enabled && cargoBox.tiltAngle > 0}
            >
              ⏪ Rebobinar
            </button>
            <button
              className={`btn-compact ${isAutoAnimating ? 'active' : ''}`}
              id="btn-auto-anim"
              onClick={toggleAutoAnim}
              disabled={cargoBox.enabled && cargoBox.tiltAngle > 0}
            >
              {isAutoAnimating ? '⏸️ Pausar' : '▶️ Loop'}
            </button>
          </div>

          <div className="expansion-widget-divider"></div>

          {/* 🧰 CONTROLE DE ACESSO AO BAÚ MOTOBUL & BASCULAMENTO SOLAR */}
          {cargoBox.enabled ? (
            <div
              className="cargo-box-panel"
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '8px',
                padding: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '9px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div className="expansion-widget-header" style={{ marginBottom: '2px' }}>
                <span style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  🧰 BAÚ MOTOBUL & BASCULAMENTO
                </span>
                <span
                  className="status-badge"
                  style={{
                    background: cargoBox.tiltAngle > 0 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(100, 116, 139, 0.25)',
                    color: cargoBox.tiltAngle > 0 ? '#fbbf24' : '#94a3b8',
                    border: cargoBox.tiltAngle > 0 ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(100, 116, 139, 0.3)',
                    fontSize: '10px'
                  }}
                >
                  {cargoBox.tiltAngle > 0 ? `Basculado ${Math.round(cargoBox.tiltAngle)}°` : 'Travado (0°)'}
                </span>
              </div>

              {/* Aviso de sobretorque: SÓ aparece se o rack estiver de fato basculado COM gavetas abertas */}
              {cargoBox.enabled && cargoBox.tiltAngle > 0 && expansionPct > 0 && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.18)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '11px',
                    color: '#fca5a5',
                    lineHeight: 1.35
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                    ⚠️ Risco de Sobretorque nos Pistões!
                  </div>
                  Rack basculado com gavetas abertas ({expansionPct}%). Recolha as gavetas para evitar torção mecânica.
                  <button
                    className="btn-compact"
                    onClick={retract}
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      background: '#ef4444',
                      borderColor: '#f87171',
                      color: '#fff',
                      fontWeight: 700,
                      padding: '6px 8px'
                    }}
                  >
                    🔒 Recolher Gavetas Agora
                  </button>
                </div>
              )}

              {/* 1. Bascular Superestrutura Solar (Pistões a Gás de 0° a 65°) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Bascular Painéis Solares:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#f59e0b', fontWeight: 800 }}>
                    {Math.round(cargoBox.tiltAngle)}° / 65°
                  </span>
                </div>
                <input
                  type="range"
                  className="custom-slider"
                  min="0"
                  max="65"
                  step="1"
                  value={cargoBox.tiltAngle}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val > 0 && expansionPct > 0) {
                      retractAndTilt();
                    } else {
                      setTiltAngle(val);
                    }
                  }}
                />
                <div className="slider-actions">
                  <button
                    className={`btn-compact ${cargoBox.tiltAngle === 0 ? 'active' : ''}`}
                    onClick={closeSolarRack}
                  >
                    🔒 Fechar Rack (0°)
                  </button>
                  <button
                    className={`btn-compact ${cargoBox.tiltAngle >= 65 ? 'active accent-amber' : ''}`}
                    onClick={tiltSolarRack}
                  >
                    {expansionPct > 0 ? '⚡ Recolher & Bascular' : '🚀 Bascular (65°)'}
                  </button>
                </div>
              </div>

              {/* 2. Abrir Tampa do Baú Motobul (0° a 38°) */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Tampa do Baú Motobul:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 800 }}>
                    {Math.round(cargoBox.lidAngle)}° / 38°
                  </span>
                </div>
                <input
                  type="range"
                  className="custom-slider"
                  min="0"
                  max="38"
                  step="1"
                  value={cargoBox.lidAngle}
                  onChange={(e) => setBoxLidAngle(parseFloat(e.target.value))}
                />
                <div className="slider-actions">
                  <button
                    className={`btn-compact ${cargoBox.lidAngle === 0 ? 'active' : ''}`}
                    onClick={closeBoxLid}
                  >
                    📦 Fechar Tampa
                  </button>
                  <button
                    className={`btn-compact ${cargoBox.lidAngle >= 35 ? 'active' : ''}`}
                    onClick={openBoxLid}
                  >
                    🔓 Abrir Tampa (38°)
                  </button>
                </div>
              </div>

              {/* 3. Abertura Vertical / Ajuste de Altura do Vão (Torres Telescópicas vs Fixas) */}
              {(() => {
                const isTelescopic = (cargoBox.isTelescopic !== false);
                const maxLiftMm = isTelescopic ? Math.max(60, Math.floor(((cargoBox.height || 330) - 100) / 10) * 10) : 0;
                const curLiftMm = isTelescopic ? Math.min(maxLiftMm, cargoBox.verticalLiftMm || 0) : 0;
                return (
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px' }}>
                    {/* Checkbox Torres Telescópicas de Elevação */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '5px 8px',
                      borderRadius: '5px',
                      marginBottom: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#f8fafc',
                        userSelect: 'none'
                      }}>
                        <input
                          type="checkbox"
                          checked={isTelescopic}
                          onChange={(e) => setCargoBoxTelescopic(e.target.checked)}
                          style={{ accentColor: '#38bdf8', width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        <span>Torres Telescópicas (Subir/Descer)</span>
                      </label>
                      <span style={{
                        fontSize: '9.5px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isTelescopic ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                        color: isTelescopic ? '#38bdf8' : '#94a3b8',
                        fontWeight: 700
                      }}>
                        {isTelescopic ? '↕ Telescópica' : '🔒 Fixa (Mín. Altura)'}
                      </span>
                    </div>

                    {isTelescopic ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>↕ Abertura Vertical (Altura Vão):</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 800 }}>
                            +{curLiftMm} / {maxLiftMm} mm
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', marginBottom: '4px' }}>
                          <span>Barra 30×30 ({cargoBox.height + 20}mm, engaste mín. 90mm)</span>
                          <span style={{ color: '#4ade80', fontWeight: 700 }}>
                            Vão: {cargoBox.height + curLiftMm + 8} mm
                          </span>
                        </div>
                        <input
                          type="range"
                          className="custom-slider"
                          min="0"
                          max={maxLiftMm}
                          step="10"
                          value={curLiftMm}
                          onChange={(e) => setCargoBoxVerticalLift(parseFloat(e.target.value))}
                        />
                        <div className="slider-actions">
                          <button
                            className={`btn-compact ${curLiftMm === 0 ? 'active' : ''}`}
                            onClick={() => setCargoBoxVerticalLift(0)}
                          >
                            ⬇ Baixar (0 mm)
                          </button>
                          <button
                            className={`btn-compact ${curLiftMm >= maxLiftMm ? 'active' : ''}`}
                            onClick={() => setCargoBoxVerticalLift(maxLiftMm)}
                          >
                            ⬆ Curso Máx. (+{maxLiftMm} mm)
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        background: 'rgba(15, 23, 42, 0.5)',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        borderLeft: '3px solid #38bdf8'
                      }}>
                        🔒 <strong>Torres Fixas Selecionadas:</strong> Perfil monobloco fixo no limite mínimo de altura (vão livre rente de 8mm sobre a tampa). Economiza peso e garante a menor altura do conjunto.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px dashed rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                padding: '8px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Baú de teto desativado</span>
              <button
                className="btn-compact primary"
                onClick={() => setCargoBoxEnabled(true)}
                style={{ fontSize: '10px', padding: '4px 8px', color: '#f59e0b', borderColor: '#f59e0b' }}
              >
                + Ativar Baú Motobul
              </button>
            </div>
          )}

          {/* ⛺ CONTROLE DO TOLDO OVERLAND (TRASEIRO OU ASA DE MORCEGO 270°) */}
          <div className="expansion-widget-divider"></div>
          <div
            className="cargo-box-panel"
            style={{
              borderColor: awning.enabled ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)',
              background: awning.enabled ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.4)'
            }}
          >
            <div className="expansion-widget-header">
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: awning.enabled ? '#38bdf8' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                ⛺ TOLDO RETRÁTIL OVERLAND
              </span>
              <button
                className={`btn-compact ${awning.enabled ? 'active' : ''}`}
                onClick={() => setAwning({ enabled: !awning.enabled })}
                style={{
                  fontSize: '10px',
                  padding: '3px 8px',
                  fontWeight: 700,
                  color: awning.enabled ? '#38bdf8' : '#94a3b8',
                  borderColor: awning.enabled ? '#38bdf8' : undefined
                }}
              >
                {awning.enabled ? 'Ativado' : 'Desativado'}
              </button>
            </div>

            {awning.enabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {/* Modelo do Toldo: Traseiro Reto vs Asa de Morcego 270° */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <button
                    className={`btn-compact ${awning.type === 'rear' ? 'active' : ''}`}
                    onClick={() => setAwning({ type: 'rear' })}
                    style={{
                      fontSize: '10px',
                      padding: '6px 4px',
                      fontWeight: 700
                    }}
                  >
                    🚗 Traseiro Reto
                  </button>
                  <button
                    className={`btn-compact ${awning.type === 'batwing_270' ? 'active accent-amber' : ''}`}
                    onClick={() => setAwning({ type: 'batwing_270' })}
                    style={{
                      fontSize: '10px',
                      padding: '6px 4px',
                      fontWeight: 700
                    }}
                  >
                    🦇 Asa Morcego 270°
                  </button>
                </div>

                {/* Lado de Fixação se for Asa de Morcego */}
                {awning.type === 'batwing_270' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8' }}>
                      <span>Montagem do Case:</span>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                        {awning.side === 'passenger' ? 'Passageiro (Direita)' : 'Motorista (Esquerda)'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                      <button
                        className={`btn-compact ${awning.side === 'passenger' ? 'active' : ''}`}
                        onClick={() => setAwning({ side: 'passenger' })}
                        style={{ fontSize: '9.5px', padding: '4px' }}
                      >
                        Direita (Passageiro)
                      </button>
                      <button
                        className={`btn-compact ${awning.side === 'driver' ? 'active' : ''}`}
                        onClick={() => setAwning({ side: 'driver' })}
                        style={{ fontSize: '9.5px', padding: '4px' }}
                      >
                        Esquerda (Motorista)
                      </button>
                    </div>
                  </div>
                )}

                {/* Botão de Abrir / Desdobrar Lona */}
                <button
                  className={`btn-compact primary ${awning.isOpen ? 'active' : ''}`}
                  onClick={toggleAwningOpen}
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    fontWeight: 800,
                    fontSize: '11px',
                    background: awning.isOpen
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.4))'
                      : 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(37, 99, 235, 0.3))',
                    borderColor: awning.isOpen ? '#10b981' : '#38bdf8',
                    color: awning.isOpen ? '#34d399' : '#38bdf8'
                  }}
                >
                  {awning.isOpen ? '⛺ Recolher Toldo no Estojo' : '⛺ Desdobrar Lona (Abrir Toldo)'}
                </button>

                {/* Seleção de cor da lona */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', paddingTop: '2px' }}>
                  <span>Cor da Lona Ripstop:</span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {[
                      { label: 'Safari', color: '#c2b280' },
                      { label: 'Grafite', color: '#374151' },
                      { label: 'Oliva', color: '#4b5320' },
                      { label: 'Preto', color: '#18181b' }
                    ].map(c => (
                      <button
                        key={c.color}
                        onClick={() => setAwning({ fabricColor: c.color })}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: c.color,
                          border: awning.fabricColor === c.color ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.3)',
                          cursor: 'pointer'
                        }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="expansion-widget-divider"></div>

          {/* 🔬 Verificação Estrutural de Colisões */}
          <div className="expansion-widget-header" style={{ marginTop: '2px' }}>
            <span className="expansion-widget-subheader">🔬 VERIFICAÇÃO ESTRUTURAL</span>
            {collisionSummary !== null && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: collisionSummary.errorCount === 0 ? '#4ade80' : '#ef4444',
                  background: collisionSummary.errorCount === 0 ? 'rgba(74, 222, 128, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${collisionSummary.errorCount === 0 ? 'rgba(74,222,128,0.4)' : 'rgba(239,68,68,0.4)'}`,
                  borderRadius: '10px',
                  padding: '2px 7px',
                }}
              >
                {collisionSummary.errorCount === 0 ? '✅ OK' : `🔴 ${collisionSummary.errorCount} erro(s)`}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: collisionSummary && collisionSummary.errorCount > 0 ? '6px' : '0' }}>
            <button
              className="btn-compact primary"
              onClick={checkCollisions}
              style={{ flex: 1, background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#f87171' }}
            >
              🔴 Verificar Colisões
            </button>
            {collisionSummary !== null && (
              <button
                className="btn-compact"
                onClick={clearCollisions}
                title="Limpar destaques de colisão"
              >
                ✅ Limpar
              </button>
            )}
          </div>

          {collisionSummary && collisionSummary.errorCount > 0 && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '10px',
                lineHeight: '1.6',
                marginBottom: '2px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: '#fca5a5', fontWeight: 700 }}>
                  {collisionSummary.collidingBars} barras colidindo em {collisionSummary.totalBars} verificadas:
                </span>
                <button
                  className="btn-compact"
                  title="Copiar relatório de colisões"
                  style={{ fontSize: '10px', padding: '2px 7px', color: '#94a3b8' }}
                  onClick={() => {
                    const lines = [
                      `🔴 Relatório de Colisões Estruturais`,
                      `Barras verificadas: ${collisionSummary.totalBars}`,
                      `Barras colidindo: ${collisionSummary.collidingBars}`,
                      `Total de colisões: ${collisionSummary.errorCount}`,
                      ``,
                      ...collisionSummary.collisions.map((c, i) =>
                        `${i + 1}. ${c.labelA} × ${c.labelB} (eixo ${c.axisA}, vol ≈ ${(c.overlapVolumeM3 * 1e6).toFixed(2)} cm³)`
                      )
                    ].join('\n');
                    navigator.clipboard.writeText(lines).then(() => flashToast('📋 Relatório copiado!'));
                  }}
                >
                  📋 Copiar
                </button>
              </div>
              {collisionSummary.collisions.slice(0, 5).map((c, i) => (
                <div
                  key={i}
                  style={{ color: 'var(--text-muted)', borderBottom: i < Math.min(4, collisionSummary.collisions.length - 1) ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: '2px', marginBottom: '2px' }}
                >
                  <span style={{ color: '#fbbf24' }}>⚠</span>{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#fca5a5' }}>{c.labelA}</span>
                  {' × '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#fca5a5' }}>{c.labelB}</span>
                </div>
              ))}
              {collisionSummary.collisions.length > 5 && (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  ...e mais {collisionSummary.collisions.length - 5} colisão(ões)
                </div>
              )}
            </div>
          )}

          {collisionSummary && collisionSummary.errorCount === 0 && (
            <div
              style={{
                background: 'rgba(74, 222, 128, 0.07)',
                border: '1px solid rgba(74, 222, 128, 0.25)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '10px',
                color: '#86efac',
                marginBottom: '2px',
              }}
            >
              ✅ Estrutura verificada — {collisionSummary.totalBars} barras sem colisões!
            </div>
          )}

          {/* Verificação de Peças Flutuando (Sustentação na Base / Subchassi) */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', marginBottom: floatingSummary && floatingSummary.errorCount > 0 ? '6px' : '0' }}>
            <button
              className="btn-compact"
              onClick={checkFloating}
              style={{ flex: 1, background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.5)', color: '#fbbf24' }}
              title="Verifica se todos os perfis estão apoiados em uma peça abaixo (o subchassi base é o alicerce)"
            >
              🔍 Checar Peças Flutuando
            </button>
            {floatingSummary !== null && (
              <button
                className="btn-compact"
                onClick={clearFloating}
                title="Limpar destaques de peças flutuantes"
              >
                ✅ Limpar
              </button>
            )}
          </div>

          {floatingSummary && floatingSummary.errorCount > 0 && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '10px',
                lineHeight: '1.6',
                marginBottom: '2px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: '#fcd34d', fontWeight: 700 }}>
                  ⚠️ {floatingSummary.floatingBars} peça(s) flutuando (sem apoio):
                </span>
                <button
                  className="btn-compact"
                  title="Copiar relatório de peças flutuantes"
                  style={{ fontSize: '10px', padding: '2px 7px', color: '#94a3b8' }}
                  onClick={() => {
                    const lines = [
                      `⚠️ Relatório de Peças Flutuantes (Sem Sustentação Inferior)`,
                      `Total de barras: ${floatingSummary.totalBars}`,
                      `Base (subchassi): ${floatingSummary.baseBars}`,
                      `Barras verificadas: ${floatingSummary.checkedBars}`,
                      `Peças flutuando: ${floatingSummary.floatingBars}`,
                      ``,
                      ...floatingSummary.floatingList.map((f, i) =>
                        `${i + 1}. ${f.label} [Y: ${f.box.min.y.toFixed(3)} - ${f.box.max.y.toFixed(3)}]`
                      )
                    ].join('\n');
                    navigator.clipboard.writeText(lines).then(() => flashToast('📋 Relatório copiado!'));
                  }}
                >
                  📋 Copiar
                </button>
              </div>
              {floatingSummary.floatingList.slice(0, 5).map((f, i) => (
                <div
                  key={i}
                  style={{ color: 'var(--text-muted)', borderBottom: i < Math.min(4, floatingSummary.floatingList.length - 1) ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: '2px', marginBottom: '2px' }}
                >
                  <span style={{ color: '#f59e0b' }}>⚠</span>{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#fde68a' }}>{f.label}</span>
                  <span style={{ fontSize: '9px', color: '#94a3b8', marginLeft: '4px' }}>
                    (Y: {f.box.min.y.toFixed(2)}m)
                  </span>
                </div>
              ))}
              {floatingSummary.floatingList.length > 5 && (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  ...e mais {floatingSummary.floatingList.length - 5} peça(s) flutuando
                </div>
              )}
            </div>
          )}

          {floatingSummary && floatingSummary.errorCount === 0 && (
            <div
              style={{
                background: 'rgba(74, 222, 128, 0.07)',
                border: '1px solid rgba(74, 222, 128, 0.25)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '10px',
                color: '#86efac',
                marginBottom: '2px',
              }}
            >
              ✅ Sustentação 100% OK — todas as {floatingSummary.checkedBars} peças apoiadas no subchassi!
            </div>
          )}

          <div className="expansion-widget-divider"></div>

          {/* ⚖️ ESTIMATIVA DE PESO & GABARITO DO RACK (TETO DA FIAT DOBLÒ) */}
          <div
            className="cargo-box-panel"
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: `1px solid ${rackWeightStats.pctDynamic > 100
                ? 'rgba(239, 68, 68, 0.55)'
                : rackHeightStats.isAboveLimit || rackWeightStats.pctDynamic > 80
                  ? 'rgba(245, 158, 11, 0.45)'
                  : 'rgba(56, 189, 248, 0.4)'
                }`,
              borderRadius: '8px',
              padding: '11px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)'
            }}
          >
            {/* Cabeçalho do Card: Sem estourar, flexWrap e badge compacta */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '6px',
                marginBottom: '2px'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color:
                    rackWeightStats.pctDynamic > 100
                      ? '#f87171'
                      : rackWeightStats.pctDynamic > 80 || rackHeightStats.isAboveLimit
                        ? '#fbbf24'
                        : '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>⚖️</span>
                <span>PESO & ALTURA DO RACK (DOBLÒ)</span>
              </div>
              <div
                style={{
                  background:
                    rackWeightStats.pctDynamic > 100
                      ? 'rgba(239, 68, 68, 0.25)'
                      : rackWeightStats.pctDynamic > 80
                        ? 'rgba(245, 158, 11, 0.25)'
                        : 'rgba(16, 185, 129, 0.2)',
                  color:
                    rackWeightStats.pctDynamic > 100
                      ? '#fca5a5'
                      : rackWeightStats.pctDynamic > 80
                        ? '#fbbf24'
                        : '#34d399',
                  border: `1px solid ${rackWeightStats.pctDynamic > 100
                    ? 'rgba(239, 68, 68, 0.5)'
                    : rackWeightStats.pctDynamic > 80
                      ? 'rgba(245, 158, 11, 0.5)'
                      : 'rgba(16, 185, 129, 0.4)'
                    }`,
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  lineHeight: '1.4'
                }}
              >
                {rackWeightStats.pctDynamic > 100
                  ? `⚠️ Excede Rodovia (+${Math.round(rackWeightStats.activeTotal - 100)} kg)`
                  : `${rackWeightStats.pctDynamic}% da Capacidade`}
              </div>
            </div>

            {/* Destaque Principal Duplo: Peso no Teto + Altura do Conjunto */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px'
              }}
            >
              {/* Bloco 1: Peso Total no Teto */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  padding: '8px 9px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ⚖️ Peso no Teto
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '2px' }}>
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        fontFamily: 'var(--font-mono)',
                        color:
                          rackWeightStats.pctDynamic > 100
                            ? '#f87171'
                            : rackWeightStats.pctDynamic > 80
                              ? '#fbbf24'
                              : '#38bdf8',
                        letterSpacing: '-0.5px'
                      }}
                    >
                      {rackWeightStats.activeTotal}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>kg</span>
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#94a3b8', marginTop: '1px' }}>
                    {waterTank.enabled
                      ? (isWaterWeightFull ? 'Tanque cheio' : 'Tanque seco')
                      : 'Total no teto'}
                  </div>
                </div>

                {/* Alternador de Água compacto */}
                {waterTank.enabled && (
                  <div style={{ display: 'flex', gap: '2px', marginTop: '5px' }}>
                    <button
                      type="button"
                      className={`btn-compact ${isWaterWeightFull ? 'active' : ''}`}
                      onClick={() => setIsWaterWeightFull(true)}
                      style={{ fontSize: '8.5px', padding: '2px 4px', flex: 1 }}
                      title="Considera água 100% cheia nos canos em U"
                    >
                      💧 Cheio
                    </button>
                    <button
                      type="button"
                      className={`btn-compact ${!isWaterWeightFull ? 'active accent-amber' : ''}`}
                      onClick={() => setIsWaterWeightFull(false)}
                      style={{ fontSize: '8.5px', padding: '2px 4px', flex: 1 }}
                      title="Considera canos vazios (apenas tubos PVC)"
                    >
                      🏜️ Seco
                    </button>
                  </div>
                )}
              </div>

              {/* Bloco 2: Altura do Conjunto no Teto */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  padding: '8px 9px',
                  borderRadius: '6px',
                  border: `1px solid ${rackHeightStats.isAboveLimit
                    ? 'rgba(239, 68, 68, 0.35)'
                    : 'rgba(255, 255, 255, 0.08)'
                    }`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    📏 Altura Carga
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '2px' }}>
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        fontFamily: 'var(--font-mono)',
                        color: rackHeightStats.isAboveLimit ? '#f87171' : '#34d399',
                        letterSpacing: '-0.5px'
                      }}
                    >
                      {rackHeightStats.totalRackHeightCm}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>cm</span>
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#94a3b8', marginTop: '1px' }}>
                    Limite CONTRAN: 50 cm
                  </div>
                </div>

                {/* Badge de Altura vs Legislação */}
                <div
                  style={{
                    marginTop: '5px',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    background: rackHeightStats.isAboveLimit ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                    border: `1px solid ${rackHeightStats.isAboveLimit ? 'rgba(239, 68, 68, 0.45)' : 'rgba(16, 185, 129, 0.3)'}`,
                    fontSize: '8.5px',
                    fontWeight: 800,
                    color: rackHeightStats.isAboveLimit ? '#fca5a5' : '#86efac',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={`Resolução CONTRAN nº 955/2022 (Art. 5º) limita carga no teto a 50 cm. Atual: ${rackHeightStats.totalRackHeightCm} cm.`}
                >
                  {rackHeightStats.isAboveLimit
                    ? `⚠️ +${rackHeightStats.pctAbove}% vs CONTRAN`
                    : `✅ Regular (máx 50cm)`}
                </div>
              </div>
            </div>

            {/* Barra 1: Limite de Carga no Teto (100 kg Dinâmico Fiat) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', marginBottom: '3px' }}>
                <span>Carga no Teto (Limite Rodovia):</span>
                <span style={{ fontWeight: 700, color: rackWeightStats.pctDynamic > 100 ? '#f87171' : '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                  {rackWeightStats.activeTotal} kg / 100 kg
                </span>
              </div>
              <div
                style={{
                  position: 'relative',
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (rackWeightStats.activeTotal / 150) * 100)}%`,
                    background:
                      rackWeightStats.pctDynamic > 100
                        ? 'linear-gradient(90deg, #38bdf8 0%, #fbbf24 66%, #ef4444 100%)'
                        : rackWeightStats.pctDynamic > 80
                          ? 'linear-gradient(90deg, #38bdf8 0%, #fbbf24 100%)'
                          : 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#64748b', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                <span>0 kg</span>
                <span>50 kg</span>
                <span style={{ color: '#fbbf24' }}>100 kg (Teto Doblò)</span>
                <span>150 kg</span>
              </div>
            </div>

            {/* Barra 2: Altura do Conjunto no Teto (Limite CONTRAN 50 cm - Res. 955/2022) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', marginBottom: '3px' }}>
                <span>Altura no Teto (CONTRAN Res. 955/22):</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: rackHeightStats.isAboveLimit ? '#f87171' : '#34d399',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {rackHeightStats.totalRackHeightCm} cm / 50 cm{' '}
                  <span style={{ fontSize: '8.5px', fontWeight: 800 }}>
                    ({rackHeightStats.isAboveLimit ? `+${rackHeightStats.pctAbove}% acima` : `${rackHeightStats.pctOfLimit}%`})
                  </span>
                </span>
              </div>
              <div
                style={{
                  position: 'relative',
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (rackHeightStats.totalRackHeightCm / 75) * 100)}%`,
                    background:
                      rackHeightStats.isAboveLimit
                        ? 'linear-gradient(90deg, #34d399 0%, #fbbf24 60%, #ef4444 100%)'
                        : 'linear-gradient(90deg, #059669, #34d399)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#64748b', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                <span>0 cm</span>
                <span>25 cm</span>
                <span style={{ color: rackHeightStats.isAboveLimit ? '#f87171' : '#fbbf24' }}>50 cm (Limite Legal)</span>
                <span>75 cm</span>
              </div>
            </div>

            {/* Banner de Altura Total Veículo + Conjunto (Garagens, Balsas e Pedágios) */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '6px',
                padding: '5px 8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '9px'
              }}
            >
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🚗</span>
                <span><strong>Altura Total Doblò + Rack:</strong></span>
              </span>
              <span
                style={{
                  fontWeight: 800,
                  color: rackHeightStats.totalVehicleHeightM > 2.30 ? '#fbbf24' : '#38bdf8',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px'
                }}
                title="Doblò de fábrica: 1.84 m + Conjunto no teto. Atenção a garagens e cancelas ≤ 2.20 m."
              >
                {rackHeightStats.totalVehicleHeightM} m ({rackHeightStats.totalVehicleHeightCm} cm)
              </span>
            </div>

            {/* Grid de Chips com a Composição Detalhada */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '5px',
                marginTop: '1px'
              }}
            >
              {/* 1. Ferro / Metalon ou Alumínio */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '6px',
                  padding: '5px 7px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1px'
                }}
              >
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                  {rackWeightStats.isSteel ? `🔩 Metalon Aço (${rackWeightStats.t40.toFixed(1)}mm) + Trilhos:` : rackWeightStats.isAluTube ? `🔲 Metalon Alumínio (${rackWeightStats.t40.toFixed(1)}mm) + Trilhos:` : '🔩 Alumínio T-Slot + Trilhos:'}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                  {rackWeightStats.structureWeight} kg
                </span>
              </div>

              {/* 2. Placas Solares */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '6px',
                  padding: '5px 7px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1px'
                }}
              >
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                  ☀️ Placas ({rackWeightStats.panelCount} un):
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  {rackWeightStats.panelsWeight} kg
                </span>
              </div>

              {/* 3. Sistema de Água */}
              {waterTank.enabled ? (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '6px',
                    padding: '5px 7px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px'
                  }}
                >
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                    💧 Água ({isWaterWeightFull ? `${rackWeightStats.waterLiters}L + PVC` : 'PVC Seco'}):
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {rackWeightStats.waterSystemWeight} kg
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    padding: '5px 7px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px'
                  }}
                >
                  <span style={{ fontSize: '9px', color: '#64748b' }}>💧 Água no Rack:</span>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>Desativada</span>
                </div>
              )}

              {/* 4. Baú de Teto Motobul */}
              {cargoBox.enabled ? (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '6px',
                    padding: '5px 7px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px'
                  }}
                >
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>🧰 Baú ({cargoBox.height}mm):</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                    {rackWeightStats.cargoBoxWeight} kg
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    padding: '5px 7px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px'
                  }}
                >
                  <span style={{ fontSize: '9px', color: '#64748b' }}>🧰 Baú de Teto:</span>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>Desativado</span>
                </div>
              )}

              {/* 5. Toldo Overland */}
              {awning.enabled && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '6px',
                    padding: '5px 7px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px'
                  }}
                >
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                    ⛺ Toldo ({awning.type === 'batwing_270' ? 'Asa 270°' : 'Reto'}):
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                    {rackWeightStats.awningWeight} kg
                  </span>
                </div>
              )}

              {/* 6. Ferragens & Pistões a Gás */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '6px',
                  padding: '5px 7px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1px'
                }}
              >
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>⚙️ Pistões & Fixadores:</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                  {rackWeightStats.hardwareWeight} kg
                </span>
              </div>
            </div>

            {/* Acordeão / Botão de Detalhes Técnicos */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowWeightDetails(!showWeightDetails)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '2px 0'
                }}
              >
                <span>{showWeightDetails ? '▼ Ocultar detalhes de engenharia' : '► Detalhes & Limites do Teto Doblò'}</span>
                <span style={{ color: '#94a3b8', fontSize: '9px' }}>
                  Seco: {rackWeightStats.totalDry} kg · Altura: {rackHeightStats.totalRackHeightCm} cm
                </span>
              </button>

              {showWeightDetails && (
                <div
                  style={{
                    marginTop: '6px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '6px',
                    padding: '7px 9px',
                    fontSize: '9.5px',
                    lineHeight: 1.45,
                    color: '#cbd5e1',
                    border: '1px solid rgba(148, 163, 184, 0.15)'
                  }}
                >
                  <div style={{ color: '#f8fafc', fontWeight: 700, marginBottom: '3px' }}>
                    📐 Especificações de Carga do Teto Fiat Doblò:
                  </div>
                  <div>
                    • <strong>Limite Dinâmico (Rodovia):</strong> 100 kg máx. (para evitar elevação do centro de gravidade em curvas e frenagens).
                  </div>
                  <div>
                    • <strong>Limite Estático (Camping):</strong> 300 kg (veículo parado distribui o peso sobre as 6 colunas estruturais da carroceria).
                  </div>

                  <div style={{ color: '#f8fafc', fontWeight: 700, marginTop: '6px', marginBottom: '3px' }}>
                    ⚖️ Legislação CONTRAN (Resolução nº 955/2022 - Art. 5º):
                  </div>
                  <div>
                    • <strong>Limite de Altura da Carga no Teto:</strong> 50 cm (500 mm) máx. incluindo rack, suporte e carga.
                  </div>
                  <div>
                    • <strong>Composição da Altura Atual ({rackHeightStats.totalRackHeightCm} cm):</strong>
                    <div style={{ paddingLeft: '8px', color: '#94a3b8', fontSize: '9px', marginTop: '2px' }}>
                      - Subchassi / calhas: {rackHeightStats.baseProfileMm} mm (4.0 cm)<br />
                      {cargoBox.enabled && (
                        <>- Baú Motobul: {rackHeightStats.cargoBoxH_Mm} mm ({+(rackHeightStats.cargoBoxH_Mm / 10).toFixed(1)} cm) + {rackHeightStats.clearanceHingesMm} mm suporte{rackHeightStats.verticalLiftMm > 0 ? ` + ${rackHeightStats.verticalLiftMm} mm lift` : ''}<br /></>
                      )}
                      - Superestrutura Solar ({stackLevels} níveis - slides coplanares no mesmo nível): {rackHeightStats.solarTraysH_Mm} mm ({+(rackHeightStats.solarTraysH_Mm / 10).toFixed(1)} cm)<br />
                      - Espessura placas solares: {rackHeightStats.panelThicknessMm} mm
                    </div>
                  </div>
                  <div style={{ marginTop: '3px' }}>
                    • <strong>Enquadramento Legal:</strong>{' '}
                    {rackHeightStats.isAboveLimit ? (
                      <span style={{ color: '#f87171', fontWeight: 700 }}>
                        ⚠️ Está {rackHeightStats.diffCm} cm acima do limite de 50 cm (+{rackHeightStats.pctAbove}% acima da legislação).
                      </span>
                    ) : (
                      <span style={{ color: '#34d399', fontWeight: 700 }}>
                        ✅ 100% em conformidade com a legislação CONTRAN ({rackHeightStats.pctOfLimit}% do limite de 50 cm).
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: '3px' }}>
                    • <strong>Gabarito Total do Veículo:</strong> {rackHeightStats.totalVehicleHeightM} m (Doblò 1.84m + Rack {rackHeightStats.totalRackHeightM}m). Evite garagens subterrâneas ou coberturas com gabarito ≤ 2.20 m.
                  </div>

                  {waterTank.enabled && (
                    <div style={{ marginTop: '4px', color: '#38bdf8' }}>
                      💡 <em>Dica de Viagem:</em> Viaje com o reservatório de água mais baixo ou vazio na rodovia ({rackWeightStats.totalDry} kg) e encha no destino ou próximo ao camping para aproveitar os {rackWeightStats.waterLiters} Litros (+{rackWeightStats.waterLiters} kg)!
                    </div>
                  )}
                  {rackWeightStats.isSteel && (
                    <div style={{ marginTop: '3px', color: '#f59e0b' }}>
                      💡 Mudando a estrutura para <strong>Metalon Alumínio</strong> você economiza ~{(rackWeightStats.baseWeight + rackWeightStats.traysWeight - (8.5 + stackLevels * 1.2)).toFixed(1)} kg no teto!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="expansion-widget-divider"></div>

          {/* Simulação do Sol & Horário */}
          <div className="expansion-widget-header" style={{ marginTop: '2px' }}>
            <span className="expansion-widget-subheader">☀️ SIMULAÇÃO DO SOL & SOMBRAS</span>
            <span
              id="sun-time-val"
              style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}
            >
              {formatSunTime(sunHour)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '9px',
              color: 'var(--text-muted)',
              marginBottom: '1px'
            }}
          >
            <span>🌅 08h (Manhã)</span>
            <span>☀️ 12h (Zênite)</span>
            <span>🌇 18h (Tarde)</span>
          </div>
          <input
            type="range"
            id="sun-slider"
            className="custom-slider"
            min="8"
            max="18"
            step="0.5"
            value={sunHour}
            onChange={(e) => setSunHour(parseFloat(e.target.value))}
          />

          <div className="expansion-widget-divider"></div>

          <div className="expansion-widget-subheader">🔍 VISIBILIDADE</div>
          <div className="toggles-grid">
            <button
              className={`toggle-btn ${isVehicleVisible ? 'active' : ''}`}
              id="toggle-vehicle"
              onClick={toggleVehicle}
            >
              <span>Fiat Doblò</span>
              <div className="toggle-indicator"></div>
            </button>
            <button
              className={`toggle-btn ${isDimensionsVisible ? 'active' : ''}`}
              id="toggle-dimensions"
              onClick={toggleDimensions}
            >
              <span>Labels / Cotas 3D</span>
              <div className="toggle-indicator"></div>
            </button>
            <button
              className={`toggle-btn ${isTransparent ? 'active' : ''}`}
              id="toggle-transparent"
              onClick={toggleTransparency}
            >
              <span>Raio-X (Topo)</span>
              <div className="toggle-indicator"></div>
            </button>
            <button
              className={`toggle-btn ${isSoundEnabled ? 'active' : ''}`}
              id="toggle-sound"
              onClick={toggleSound}
            >
              <span className="toggle-label">{isSoundEnabled ? 'Som: Ativado' : 'Som: Mudo'}</span>
              <div className="toggle-indicator"></div>
            </button>
          </div>

          <div className="expansion-widget-divider"></div>

          <div className="expansion-widget-subheader">🎥 CÂMERAS</div>
          <div className="cam-grid">
            <button
              className={`cam-btn ${activeCameraPreset === 'top' ? 'active' : ''}`}
              onClick={() => setCameraPreset('top')}
            >
              📐 Topo
            </button>
            <button
              className={`cam-btn ${activeCameraPreset === 'iso' ? 'active' : ''}`}
              onClick={() => setCameraPreset('iso')}
            >
              🔍 Isométrica
            </button>
            <button
              className={`cam-btn ${activeCameraPreset === 'side' ? 'active' : ''}`}
              onClick={() => setCameraPreset('side')}
            >
              📏 Lateral
            </button>
            <button
              className={`cam-btn ${activeCameraPreset === 'front' ? 'active' : ''}`}
              onClick={() => setCameraPreset('front')}
            >
              🚗 Frontal
            </button>
            <button
              className={`cam-btn ${activeCameraPreset === 'panels' ? 'active' : ''}`}
              onClick={() => setCameraPreset('panels')}
              style={{
                gridColumn: 'span 4',
                background: 'rgba(56, 189, 248, 0.12)',
                borderColor: 'rgba(56, 189, 248, 0.35)',
                color: '#38bdf8'
              }}
            >
              🔬 Inspecionar Perfil T-Slot 40x40
            </button>
          </div>

          {/* Divisor Visual de Seção */}
          <div className="expansion-widget-divider" style={{ margin: '14px 0 8px 0' }} />

          {/* Dashboard Elétrico & Bateria Kingbo (incorporado no mesmo painel com scroll) */}
          <div className="energy-card" style={{ marginTop: '0', background: 'rgba(15, 23, 42, 0.45)' }}>
            <div className="energy-header">
              <div className="energy-title">
                <span>☀️ GERAÇÃO FOTOVOLTAICA</span>
              </div>
              <div className="energy-state-tag" id="stat-state">
                {isRetracted ? 'Modo Rodovia (Travado)' : isFullyOpen ? 'Capacidade Máxima Aberta' : 'Expansão Parcial'}
              </div>
            </div>

            <div className="stat-row-main">
              <div className="stat-item">
                <div className="stat-num" id="stat-watts">
                  {energyStats.effectiveWatts} <span>W</span>
                </div>
                <div className="stat-sub">Potência Instantânea</div>
              </div>
              <div className="stat-item">
                <div className="stat-num" id="stat-daily-kwh">
                  {energyStats.dailyKWh.toFixed(2)} <span>kWh</span>
                </div>
                <div className="stat-sub">Média Diária (5.2 HSP)</div>
              </div>
            </div>

            <div className="stat-chips">
              <div className="stat-chip">
                <span>MPPT Kingbo 60A:</span>
                <span id="stat-amps-12v">{energyStats.mpptCurrentAmps.toFixed(1)} A</span>
              </div>
              <div className="stat-chip highlight-green">
                <span>Injeção Diária:</span>
                <span id="stat-bat-recharge">+{batteryPerformance.dailyAhInjected} Ah/dia</span>
              </div>
            </div>

            <div className="stat-chips" style={{ marginTop: '6px' }}>
              <div className="stat-chip">
                <span>Tensão Voc:</span>
                <span id="stat-voc">44.56 V</span>
              </div>
              <div className="stat-chip">
                <span>Total Placas:</span>
                <span id="stat-weight-total" style={{ color: 'var(--primary)' }}>
                  {energyStats.panelCount} un ({energyStats.nominalPowerW}W)
                </span>
              </div>
            </div>

            {/* ⚡ Medidor de Carga do MPPT Kingbo 60A */}
            <div
              className="mppt-meter-box"
              id="mppt-meter-box"
              style={
                isNominalOverMppt || isEffectiveOverMppt
                  ? {
                    borderColor: 'rgba(239, 68, 68, 0.65)',
                    background: 'rgba(127, 29, 29, 0.22)',
                    boxShadow: '0 0 14px rgba(239, 68, 68, 0.25)'
                  }
                  : undefined
              }
            >
              <div className="mppt-meter-header">
                <div className="mppt-meter-title">
                  <span className="mppt-icon">{isNominalOverMppt || isEffectiveOverMppt ? '🚨' : '⚡'}</span>
                  <span>Capacidade MPPT Kingbo 60A</span>
                </div>
                <div
                  className="mppt-meter-badge"
                  id="mppt-status-badge"
                  style={
                    isEffectiveOverMppt || isNominalOverMppt
                      ? {
                        background: 'rgba(239, 68, 68, 0.28)',
                        color: '#fca5a5',
                        border: '1px solid rgba(239, 68, 68, 0.65)',
                        fontWeight: 800
                      }
                      : undefined
                  }
                >
                  {isEffectiveOverMppt
                    ? `🚨 ACIMA DO LIMITE (+${mpptOverPct}%)`
                    : isNominalOverMppt
                      ? `⚠️ PLACAS +${nominalOverPct}% ACIMA`
                      : mpptRawPct > 90
                        ? `CARGA ALTA (${mpptRemainingPct}% LIVRE)`
                        : `OK (${mpptRemainingPct}% LIVRE)`}
                </div>
              </div>
              <div className="mppt-gauge-track">
                <div
                  className="mppt-gauge-fill"
                  id="mppt-gauge-fill"
                  style={{
                    width: `${mpptPct}%`,
                    background:
                      isEffectiveOverMppt || isNominalOverMppt
                        ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 70%, #dc2626 100%)'
                        : undefined
                  }}
                ></div>
                <div className="mppt-limit-marker" title="Limite MPPT: 720W"></div>
              </div>
              <div className="mppt-scale-labels">
                <span>0 W</span>
                <span id="mppt-scale-mid">360 W</span>
                <span>720 W (máx 12V)</span>
              </div>
              <div className="mppt-detail-chips">
                <div className="mppt-detail-chip">
                  <span className="lbl">Geração atual:</span>
                  <span
                    className="val"
                    id="mppt-watts-val"
                    style={{ color: isEffectiveOverMppt ? '#f87171' : undefined }}
                  >
                    {energyStats.effectiveWatts} W
                  </span>
                </div>
                <div className="mppt-detail-chip">
                  <span className="lbl">Uso do MPPT:</span>
                  <span
                    className="val"
                    id="mppt-pct-val"
                    style={{ color: isEffectiveOverMppt ? '#f87171' : undefined }}
                  >
                    {mpptRawPct}%
                  </span>
                </div>
                <div className="mppt-detail-chip">
                  <span className="lbl">{isEffectiveOverMppt ? 'Excesso atual:' : 'Cap. restante:'}</span>
                  <span
                    className="val"
                    id="mppt-margin-val"
                    style={{ color: isEffectiveOverMppt ? '#f87171' : '#4ade80', fontWeight: 800 }}
                  >
                    {isEffectiveOverMppt
                      ? `+${mpptOverPct}% (+${mpptOverWatts}W)`
                      : `${mpptRemainingPct}% (${mpptMargin}W)`}
                  </span>
                </div>
              </div>

              {/* Resumo de Capacidade Nominal Instalada (em % acima ou % livre do total) */}
              {isNominalOverMppt || isEffectiveOverMppt ? (
                <div
                  id="mppt-overload-alert"
                  style={{
                    marginTop: '8px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.18)',
                    border: '1px solid rgba(239, 68, 68, 0.55)',
                    color: '#fecaca',
                    fontSize: '10.5px',
                    lineHeight: 1.4
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#f87171', marginBottom: '3px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '5px' }}>
                    <span>⚠️ Potência Excede o Limite do MPPT!</span>
                    <span style={{ fontFamily: 'var(--font-mono)', background: 'rgba(239, 68, 68, 0.3)', padding: '1px 6px', borderRadius: '4px', color: '#fff' }}>
                      +{nominalOverPct}% (+{nominalOverWatts}W)
                    </span>
                  </div>
                  Arranjo solar instalado de <strong>{energyStats.nominalPowerW}W</strong> ({energyStats.panelCount} placas) está{' '}
                  <strong>{nominalOverPct}% acima</strong> (<strong>+{nominalOverWatts}W</strong>) da capacidade nominal de{' '}
                  <strong>{mpptMaxWatts}W</strong> (60A @ 12V) — operando a <strong>{nominalUsagePct}%</strong> do limite nominal.
                  {isOverAbsolutePeak ? (
                    <span>
                      {' '}Ultrapassa também o limite de pico em absorção (<strong>864W @ 14.4V</strong>) em{' '}
                      <strong>+{peakOverPct}% (+{energyStats.nominalPowerW - mpptPeakMaxWatts}W)</strong>: o controlador fará{' '}
                      <em>clipping</em> (corte em 60A) ou exigirá um 2º MPPT.
                    </span>
                  ) : (
                    <span>
                      {' '}Em tensão de absorção (14.4V = 864W máx), ainda restam{' '}
                      <strong>{Math.max(0, Math.round(((mpptPeakMaxWatts - energyStats.nominalPowerW) / mpptPeakMaxWatts) * 100))}% ({mpptPeakMaxWatts - energyStats.nominalPowerW}W)</strong> até o teto absoluto de 60A.
                    </span>
                  )}
                </div>
              ) : (
                <div
                  id="mppt-capacity-ok-summary"
                  style={{
                    marginTop: '8px',
                    padding: '6px 9px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#a7f3d0',
                    fontSize: '10.5px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>
                    ✅ Arranjo instalado: <strong>{energyStats.nominalPowerW}W</strong> ({nominalUsagePct}% de {mpptMaxWatts}W)
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#34d399' }}>
                    Restam {nominalRemainingPct}% ({nominalRemainingWatts}W livres)
                  </span>
                </div>
              )}
            </div>

            {/* 🚗⚡ Carregador Inteligente DC-DC B2B1230 (12V 30A · Alternador Doblò) */}
            <div
              className="mppt-meter-box"
              style={{
                background: b2bCharger.isEngineRunning ? 'rgba(30, 58, 138, 0.22)' : 'rgba(15, 23, 42, 0.45)',
                borderColor: b2bCharger.isEngineRunning ? 'rgba(56, 189, 248, 0.45)' : 'rgba(56, 189, 248, 0.2)'
              }}
            >
              <div className="mppt-meter-header">
                <div className="mppt-meter-title">
                  <span className="mppt-icon">🔋</span>
                  <span>Carregador DC-DC B2B1230 (30A)</span>
                </div>
                <div
                  className="mppt-meter-badge"
                  style={{
                    background: b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.25)' : 'rgba(100, 116, 139, 0.25)',
                    color: b2bCharger.isEngineRunning ? '#4ade80' : '#94a3b8',
                    borderColor: b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.4)' : 'rgba(100, 116, 139, 0.3)'
                  }}
                >
                  {b2bCharger.isEngineRunning ? '🚗 ALTERNADOR ATIVO (30A)' : '🅿️ MOTOR DESLIGADO'}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: '6px 0',
                  padding: '6px 8px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700 }}>📶 Bluetooth 5.0:</span>
                  <span style={{ fontSize: '10px', color: '#4ade80' }}>Conectado</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: b2bCharger.isEngineRunning ? '#4ade80' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{b2bCharger.isEngineRunning ? '🚗⚡' : '🅿️'}</span>
                  <span>{b2bCharger.isEngineRunning ? 'Alternador Ativo' : 'Motor Desligado'}</span>
                </span>
              </div>

              {/* Configuração rápida de tempo de motor ligado / rodagem */}
              <div
                style={{
                  margin: '6px 0',
                  padding: '6px 8px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '6px',
                  border: '1px solid rgba(56, 189, 248, 0.18)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⏱️</span> Rodagem com motor:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <button
                      type="button"
                      className="btn-compact"
                      onClick={() => setB2BEngineHours(Math.max(0, b2bCharger.engineHoursPerDay - 0.5))}
                      title="Diminuir 30 min"
                      style={{ padding: '0 6px', fontSize: '11px', height: '18px', minWidth: '18px', lineHeight: '16px' }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: b2bCharger.engineHoursPerDay > 0 ? '#4ade80' : '#94a3b8',
                        minWidth: '40px',
                        textAlign: 'center'
                      }}
                    >
                      {b2bCharger.engineHoursPerDay.toFixed(1)}h/d
                    </span>
                    <button
                      type="button"
                      className="btn-compact"
                      onClick={() => setB2BEngineHours(Math.min(12, b2bCharger.engineHoursPerDay + 0.5))}
                      title="Aumentar 30 min"
                      style={{ padding: '0 6px', fontSize: '11px', height: '18px', minWidth: '18px', lineHeight: '16px' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {b2bCharger.engineHoursPerDay > 0
                      ? `+${Math.round(b2bCharger.engineHoursPerDay * 30)} Ah/dia injetados`
                      : '0 Ah (modo estacionado)'}
                  </span>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                    {b2bCharger.engineHoursPerDay > 0
                      ? `+${Math.round(b2bCharger.engineHoursPerDay * 390)} Wh/dia`
                      : '0 Wh/dia'}
                  </span>
                </div>
              </div>

              <div className="mppt-detail-chips">
                <div className="mppt-detail-chip">
                  <span className="lbl">Entrada Alternador:</span>
                  <span className="val" style={{ color: b2bCharger.isEngineRunning ? '#38bdf8' : '#94a3b8' }}>
                    {b2bCharger.isEngineRunning ? '14.1 V' : '12.4 V'}
                  </span>
                </div>
                <div className="mppt-detail-chip">
                  <span className="lbl">Corrente Injetada:</span>
                  <span className="val" style={{ color: b2bCharger.isEngineRunning ? '#4ade80' : '#94a3b8' }}>
                    {b2bCharger.isEngineRunning ? '+30.0 A' : '0.0 A'}
                  </span>
                </div>
                <div className="mppt-detail-chip">
                  <span className="lbl">Potência Extra:</span>
                  <span className="val" style={{ color: b2bCharger.isEngineRunning ? '#fbbf24' : '#94a3b8' }}>
                    {b2bCharger.isEngineRunning ? '+390 W' : '0 W'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  className="btn-link-action"
                  onClick={() => openModal('b2b')}
                  style={{ fontSize: '10px', color: '#38bdf8' }}
                >
                  ℹ️ Esquema e Especificações do B2B1230 &rarr;
                </button>
              </div>
            </div>

            {/* 🔌⚡ Fonte e Carregador Usina Smart Connect (70A/120A/150A/200A · Bivolt) */}
            <div
              className="mppt-meter-box"
              style={{
                background: usinaCharger.isConnectedAC ? 'rgba(153, 27, 27, 0.22)' : 'rgba(15, 23, 42, 0.45)',
                borderColor: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.2)'
              }}
            >
              <div className="mppt-meter-header">
                <div className="mppt-meter-title">
                  <span className="mppt-icon">🔌</span>
                  <span>Fonte Usina Smart Connect ({usinaCharger.modelRating}A)</span>
                </div>
                <div
                  className="mppt-meter-badge"
                  style={{
                    background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.25)' : 'rgba(100, 116, 139, 0.25)',
                    color: usinaCharger.isConnectedAC ? '#f87171' : '#94a3b8',
                    borderColor: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.4)' : 'rgba(100, 116, 139, 0.3)'
                  }}
                >
                  {usinaCharger.isConnectedAC ? `⚡ SHORE POWER (+${usinaCharger.chargingAmps}A)` : '⛺ MODO OFF-GRID'}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: '6px 0',
                  padding: '6px 8px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 700 }}>Bivolt Automático:</span>
                  <span style={{ fontSize: '10px', color: '#4ade80' }}>100V~250V AC</span>
                </div>
                <button
                  className="btn-compact primary"
                  onClick={toggleUsinaAC}
                  style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)',
                    borderColor: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)',
                    color: usinaCharger.isConnectedAC ? '#fca5a5' : '#86efac'
                  }}
                >
                  {usinaCharger.isConnectedAC ? '🔌 Desconectar' : '⚡ Ligar Tomada'}
                </button>
              </div>

              <div className="mppt-detail-chips">
                <div className="mppt-detail-chip">
                  <span className="lbl">Tensão LiFePO4:</span>
                  <span className="val" style={{ color: usinaCharger.isConnectedAC ? '#38bdf8' : '#94a3b8' }}>
                    {usinaCharger.isConnectedAC ? `${usinaCharger.voltageOut.toFixed(1)} V` : '0.0 V'}
                  </span>
                </div>
                <div className="mppt-detail-chip">
                  <span className="lbl">Corrente Injetada:</span>
                  <span className="val" style={{ color: usinaCharger.isConnectedAC ? '#f87171' : '#94a3b8' }}>
                    {usinaCharger.isConnectedAC ? `+${usinaCharger.chargingAmps}.0 A` : '0.0 A'}
                  </span>
                </div>
                <div className="mppt-detail-chip">
                  <span className="lbl">Potência Extra:</span>
                  <span className="val" style={{ color: usinaCharger.isConnectedAC ? '#fbbf24' : '#94a3b8' }}>
                    {usinaCharger.isConnectedAC ? `+${Math.round(usinaCharger.chargingAmps * usinaCharger.voltageOut)} W` : '0 W'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  className="btn-link-action"
                  onClick={() => openModal('usina')}
                  style={{ fontSize: '10px', color: '#f87171' }}
                >
                  ℹ️ Painel Smart Connect (70A/120A/150A/200A) &rarr;
                </button>
              </div>
            </div>

            {/* Box Exclusivo da Bateria Kingbo LiFePO4 12V 560Ah (7.168 kWh) */}
            <div className="battery-card-box">
              <div className="battery-card-header">
                <div className="bat-title">
                  <span>🔋 Bateria Kingbo 12V 560Ah</span>
                </div>
                <div className="bat-badge-soc" id="stat-bat-percent">
                  {batteryPerformance.percent}% Balanço
                </div>
              </div>
              <div className="battery-gauge-bar">
                <div
                  className="battery-gauge-fill"
                  id="bat-gauge-fill"
                  style={{ width: `${Math.min(100, batteryPerformance.percent)}%` }}
                ></div>
              </div>
              <div className="bat-metrics-grid">
                <div className="bat-metric">
                  <span className="lbl">Tempo 0 a 100%:</span>
                  <span className="val" id="stat-charge-time">
                    {usinaCharger.isConnectedAC
                      ? `${combinedChargeHours}h (Rede Shore Power Usina ${usinaCharger.chargingAmps}A)`
                      : b2bCharger.isEngineRunning
                        ? `${combinedChargeHours}h (Solar + B2B 30A)`
                        : `${batteryPerformance.solarHoursToFull}h sol pleno`}
                  </span>
                </div>
                <div className="bat-metric">
                  <span className="lbl">Autonomia na Chuva:</span>
                  <span className="val highlight" id="stat-rain-autonomy">
                    {batteryPerformance.daysRainAutonomyWithEngine && batteryPerformance.daysRainAutonomyWithEngine >= 999
                      ? 'Infinita (com motor diário)'
                      : `${batteryPerformance.daysRainAutonomyWithEngine ?? batteryPerformance.daysRainAutonomy} dias`}
                    {b2bCharger.engineHoursPerDay > 0 && (
                      <span style={{ fontSize: '9px', display: 'block', fontWeight: 400, color: 'var(--text-muted)' }}>
                        ({batteryPerformance.daysRainAutonomy}d van parada)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="autonomy-preview" id="stat-autonomy">
              <strong>Autonomia Motorhome:</strong>{' '}
              {batteryPerformance.isAutonomous
                ? `Sistema 100% autossustentável com superávit de +${batteryPerformance.surplusWh} Wh/dia!`
                : `Déficit de ${Math.abs(batteryPerformance.surplusWh)} Wh/dia; a bateria de 7.168 kWh supre por ${batteryPerformance.daysRainAutonomy} dias.`}
              {b2bCharger.engineHoursPerDay > 0 && (
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                  🚗 Inclui {b2bCharger.engineHoursPerDay}h/dia de motor ligado (+{batteryPerformance.b2bDailyWh} Wh · +{batteryPerformance.b2bDailyAh} Ah)
                </div>
              )}
            </div>

            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-link-action"
                id="btn-quick-loads"
                onClick={() => openModal('loads')}
                title="Abrir Editor de Cargas Elétricas"
              >
                ⚡ Editar lista de consumo (W / horas) &rarr;
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};

