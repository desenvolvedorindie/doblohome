import React from 'react';
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
    activeCameraPreset,
    setCameraPreset,
    energyStats,
    batteryPerformance,
    openModal,
    cargoBox,
    setCargoBoxEnabled,
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
    flashToast,
    b2bCharger,
    setB2BEngineHours,
    usinaCharger,
    toggleUsinaAC,
    setUsinaModel
  } = useSolar();

  const expansionPct = Math.round(expansionProgress * 100);
  const isRetracted = expansionPct <= 0;
  const isFullyOpen = expansionPct >= 100;

  // Cálculo MPPT Kingbo 60A: limite nominal @ 12V é ~720W (60A * 12V = 720W; ou 864W @ 14.4V)
  const mpptMaxWatts = 720;
  const mpptPct = Math.min(100, Math.round((energyStats.effectiveWatts / mpptMaxWatts) * 100));
  const mpptMargin = Math.max(0, mpptMaxWatts - energyStats.effectiveWatts);

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
      {/* Widget flutuante: Expandir / Contrair Gavetas + Visibilidade (top-right) */}
      <div className="expansion-widget glass-panel" id="expansion-widget">
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
                  className={`btn-compact primary ${cargoBox.tiltAngle >= 65 ? 'active' : ''}`}
                  onClick={tiltSolarRack}
                  style={{ background: 'rgba(245, 158, 11, 0.25)', borderColor: 'rgba(245, 158, 11, 0.5)', color: '#fbbf24' }}
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
                  style={{ background: 'rgba(56, 189, 248, 0.2)', borderColor: 'rgba(56, 189, 248, 0.45)', color: '#38bdf8' }}
                >
                  🔓 Abrir Tampa (38°)
                </button>
              </div>
            </div>
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
      </div>

      {/* Card Inferior Direito: Dashboard Elétrico & Bateria Kingbo */}
      <div className="energy-card glass-panel">
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
        <div className="mppt-meter-box" id="mppt-meter-box">
          <div className="mppt-meter-header">
            <div className="mppt-meter-title">
              <span className="mppt-icon">⚡</span>
              <span>Capacidade MPPT Kingbo 60A</span>
            </div>
            <div className="mppt-meter-badge" id="mppt-status-badge">
              {mpptPct > 90 ? 'CARGA ALTA' : 'OK'}
            </div>
          </div>
          <div className="mppt-gauge-track">
            <div className="mppt-gauge-fill" id="mppt-gauge-fill" style={{ width: `${mpptPct}%` }}></div>
            <div className="mppt-limit-marker" title="Limite MPPT: 720W"></div>
          </div>
          <div className="mppt-scale-labels">
            <span>0 W</span>
            <span id="mppt-scale-mid">360 W</span>
            <span>720 W (máx)</span>
          </div>
          <div className="mppt-detail-chips">
            <div className="mppt-detail-chip">
              <span className="lbl">Geração atual:</span>
              <span className="val" id="mppt-watts-val">{energyStats.effectiveWatts} W</span>
            </div>
            <div className="mppt-detail-chip">
              <span className="lbl">Uso do MPPT:</span>
              <span className="val" id="mppt-pct-val">{mpptPct}%</span>
            </div>
            <div className="mppt-detail-chip">
              <span className="lbl">Margem disponível:</span>
              <span className="val" id="mppt-margin-val">{mpptMargin} W</span>
            </div>
          </div>
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
    </>
  );
};

