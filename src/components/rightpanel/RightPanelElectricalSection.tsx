import { RightPanelChargersCard } from './RightPanelChargersCard';
import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const RightPanelElectricalSection: React.FC = () => {
  const {
    expansionProgress,
    energyStats,
    batteryPerformance,
    openModal,
    b2bCharger,
    setB2BEngineHours,
    usinaCharger,
    toggleUsinaAC,
    setUsinaModel,
  } = useSolar();

  const expansionPct = Math.round(expansionProgress * 100);
  const isRetracted = expansionPct <= 0;
  const isFullyOpen = expansionPct >= 100;

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

  const b2bExtraWatts = (b2bCharger.enabled && b2bCharger.isEngineRunning) ? b2bCharger.watts : 0;
  const usinaExtraWatts = (usinaCharger.enabled && usinaCharger.isConnectedAC) ? Math.round(usinaCharger.chargingAmps * usinaCharger.voltageOut) : 0;
  const totalChargingWatts = energyStats.effectiveWatts + b2bExtraWatts + usinaExtraWatts;
  const combinedChargeHours = totalChargingWatts > 10
    ? +(batteryPerformance.batUsableWh / totalChargingWatts).toFixed(1)
    : 999;

  return (
    <>
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

            <RightPanelChargersCard />

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
    </>
  );
};
