import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { SlideDirection, PanelOrientation } from '../../types';

export const SidebarSolarSection: React.FC = () => {
  const {
    stackLevels,
    setStackLevels,
    level1,
    setLevel1Panels,
    setLevel1Direction,
    setLevel1Orientation,
    level2,
    setLevel2Panels,
    setLevel2Direction,
    setLevel2Orientation,
    openModal,
    panelPresets,
    activePanelPreset,
    selectPanelPreset,
  } = useSolar();

  const panelW = activePanelPreset.powerWatts;
  const panelCmW = Math.round(activePanelPreset.width * 100);
  const panelCmL = Math.round(activePanelPreset.length * 100);
  const totalPanelsCount = level1.panels + (stackLevels === 2 ? level2.panels : 0);
  const totalNominalWatts = totalPanelsCount * panelW;
  const mpptLimitWatts = 720;
  const mpptPeakLimitWatts = 864;
  const isSolarOverLimit = totalNominalWatts > mpptLimitWatts;
  const isSolarOverPeak = totalNominalWatts > mpptPeakLimitWatts;
  const mpptUsageNominalPct = Math.round((totalNominalWatts / mpptLimitWatts) * 100);
  const mpptOverNominalPct = Math.max(0, Math.round(((totalNominalWatts - mpptLimitWatts) / mpptLimitWatts) * 100));
  const mpptRemainingNominalPct = Math.max(0, Math.round(((mpptLimitWatts - totalNominalWatts) / mpptLimitWatts) * 100));
  const mpptRemainingWatts = Math.max(0, mpptLimitWatts - totalNominalWatts);
  const mpptOverPeakPct = Math.max(0, Math.round(((totalNominalWatts - mpptPeakLimitWatts) / mpptPeakLimitWatts) * 100));

  return (
      <div className="panel-section">
        <div className="section-label">
          <span>⚡ SISTEMA SOLAR FLEXÍVEL ({panelW}W)</span>
          <button
            className="btn-compact primary"
            onClick={() => openModal('panel-presets')}
            style={{ fontSize: '10px', padding: '3px 8px' }}
            title="Gerenciar presets de placas solares"
          >
            ☀️ Presets
          </button>
        </div>

        {/* Seletor Rápido de Presets de Placas */}
        <div style={{ marginBottom: '8px' }}>
          <select
            value={activePanelPreset.id}
            onChange={(e) => selectPanelPreset(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '6px',
              padding: '6px 8px',
              color: '#f8fafc',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {panelPresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.powerWatts}W • {Math.round(p.width * 1000)}×{Math.round(p.length * 1000)}mm)
              </option>
            ))}
          </select>
        </div>

        {/* Ficha Técnica do Painel Flexível Selecionado */}
        <div className="panel-spec-badge">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{activePanelPreset.name}</strong>
            <span style={{ color: '#10b981', fontWeight: 800, fontSize: '11px' }}>
              {activePanelPreset.powerWatts}W / {activePanelPreset.weightKg}kg
            </span>
          </div>
          <div className="panel-spec-grid">
            <span>📐 {panelCmW} cm × {(activePanelPreset.length).toFixed(2)} m ({Math.round(activePanelPreset.thickness * 1000)}mm)</span>
            <span>⚡ Voc: {activePanelPreset.voc}V | Vmp: {activePanelPreset.vmp}V</span>
            <span>🔩 {activePanelPreset.cellType}</span>
            <span>⛓️ Eficiência: {activePanelPreset.efficiencyPercent}%</span>
          </div>
        </div>

        {/* Configuração 1: Quantidade de Níveis (Stack) */}
        <div className="config-group">
          <div className="config-group-header">
            <span>1. NÍVEIS EMPILHADOS (STACK)</span>
            <span className="tag" id="tag-stack-levels">
              {stackLevels === 1 ? '1 Nível' : '2 Níveis'}
            </span>
          </div>
          <div className="config-btn-grid">
            <button
              className={`cfg-btn ${stackLevels === 1 ? 'active' : ''}`}
              onClick={() => setStackLevels(1)}
            >
              <span>1 Nível (Fixo)</span>
              <small>Apenas Topo</small>
            </button>
            <button
              className={`cfg-btn ${stackLevels === 2 ? 'active' : ''}`}
              onClick={() => setStackLevels(2)}
            >
              <span>2 Níveis (Duplo)</span>
              <small>Topo + Gavetas</small>
            </button>
          </div>
        </div>

        {/* PRIMEIRO NO PAINEL: NÍVEL 1 (EM BAIXO / INFERIOR) */}
        <div
          className="level-config-card"
          id="card-level-1"
          style={{
            background: 'rgba(15, 23, 42, 0.45)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '8px',
            padding: '11px',
            marginBottom: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ color: '#10b981', fontSize: '12px', letterSpacing: '0.5px' }}>
              🔻 NÍVEL 1 (EM BAIXO / INFERIOR)
            </strong>
            <span
              className="tag"
              id="tag-level1-summary"
              style={{ borderColor: '#10b981', color: '#10b981' }}
            >
              {level1.panels} Placa{level1.panels > 1 ? 's' : ''} • {level1.panels * panelW}W
            </span>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
            Quantidade de Placas:
          </div>
          <div className="config-btn-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '8px' }}>
            {[1, 2, 3, 4].map(p => (
              <button
                key={p}
                className={`cfg-btn ${level1.panels === p ? 'active' : ''}`}
                onClick={() => setLevel1Panels(p)}
              >
                <span>{p}</span>
                <small>{p * panelW}W</small>
              </button>
            ))}
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
            Direção de Abertura / Movimento:
          </div>
          <div className="config-btn-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '8px' }}>
            <button
              className={`cfg-btn ${level1.direction === 'longitudinal' ? 'active' : ''}`}
              onClick={() => setLevel1Direction('longitudinal')}
            >
              <span>🔄 Frente / Trás</span>
              <small>Bipartido simétrico</small>
            </button>
            <button
              className={`cfg-btn ${level1.direction === 'lateral' ? 'active' : ''}`}
              onClick={() => setLevel1Direction('lateral')}
            >
              <span>↔️ Lateral Duplo</span>
              <small>Asas para os lados</small>
            </button>
            <button
              className={`cfg-btn ${level1.direction === 'fixed' ? 'active' : ''}`}
              onClick={() => setLevel1Direction('fixed')}
            >
              <span>🔒 Fixo</span>
              <small>No centro do rack</small>
            </button>
            <button
              className={`cfg-btn ${level1.direction === 'rear_only' ? 'active' : ''}`}
              onClick={() => setLevel1Direction('rear_only')}
            >
              <span>⬇️ Apenas Trás</span>
              <small>Desliza para traseira</small>
            </button>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
            Direção / Orientação das Placas:
          </div>
          <div className="config-btn-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <button
              className={`cfg-btn ${level1.orientation === 'longitudinal' ? 'active' : ''}`}
              onClick={() => setLevel1Orientation('longitudinal')}
            >
              <span>⬆️ Longitudinal</span>
              <small>No comprimento</small>
            </button>
            <button
              className={`cfg-btn ${level1.orientation === 'transverse' ? 'active' : ''}`}
              onClick={() => setLevel1Orientation('transverse')}
            >
              <span>➡️ Transversal</span>
              <small>Na largura</small>
            </button>
          </div>
        </div>

        {/* SEGUNDO NO PAINEL: NÍVEL 2 (EM CIMA / SUPERIOR) */}
        {stackLevels === 2 && (
          <div
            className="level-config-card"
            id="card-level-2"
            style={{
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '8px',
              padding: '11px',
              marginBottom: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ color: 'var(--primary)', fontSize: '12px', letterSpacing: '0.5px' }}>
                🔺 NÍVEL 2 (EM CIMA / SUPERIOR)
              </strong>
              <span
                className="tag"
                id="tag-level2-summary"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                {level2.panels} Placa{level2.panels > 1 ? 's' : ''} • {level2.panels * panelW}W
              </span>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Quantidade de Placas:
            </div>
            <div className="config-btn-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '8px' }}>
              {[1, 2, 3, 4].map(p => (
                <button
                  key={p}
                  className={`cfg-btn ${level2.panels === p ? 'active' : ''}`}
                  onClick={() => setLevel2Panels(p)}
                >
                  <span>{p}</span>
                  <small>{p * panelW}W</small>
                </button>
              ))}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Direção de Abertura / Movimento:
            </div>
            <div className="config-btn-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '8px' }}>
              <button
                className={`cfg-btn ${level2.direction === 'fixed' ? 'active' : ''}`}
                onClick={() => setLevel2Direction('fixed')}
              >
                <span>🔒 Fixo no Topo</span>
                <small>No centro elevado</small>
              </button>
              <button
                className={`cfg-btn ${level2.direction === 'longitudinal' ? 'active' : ''}`}
                onClick={() => setLevel2Direction('longitudinal')}
              >
                <span>🔄 Frente / Trás</span>
                <small>Bipartido simétrico</small>
              </button>
              <button
                className={`cfg-btn ${level2.direction === 'lateral' ? 'active' : ''}`}
                onClick={() => setLevel2Direction('lateral')}
              >
                <span>↔️ Lateral Duplo</span>
                <small>Asas para os lados</small>
              </button>
              <button
                className={`cfg-btn ${level2.direction === 'rear_only' ? 'active' : ''}`}
                onClick={() => setLevel2Direction('rear_only')}
              >
                <span>⬇️ Apenas Trás</span>
                <small>Desliza para traseira</small>
              </button>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
              Direção / Orientação das Placas:
            </div>
            <div className="config-btn-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <button
                className={`cfg-btn ${level2.orientation === 'longitudinal' ? 'active' : ''}`}
                onClick={() => setLevel2Orientation('longitudinal')}
              >
                <span>⬆️ Longitudinal</span>
                <small>No comprimento</small>
              </button>
              <button
                className={`cfg-btn ${level2.orientation === 'transverse' ? 'active' : ''}`}
                onClick={() => setLevel2Orientation('transverse')}
              >
                <span>➡️ Transversal</span>
                <small>Na largura</small>
              </button>
            </div>
          </div>
        )}

        {/* Resumo de Potência Total Instalada vs Limite do Controlador/Inversor MPPT 60A */}
        <div
          id="sidebar-mppt-power-check"
          style={{
            background: isSolarOverLimit ? 'rgba(239, 68, 68, 0.16)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${isSolarOverLimit ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.35)'}`,
            borderRadius: '8px',
            padding: '9px 10px',
            fontSize: '11px',
            lineHeight: 1.4
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: 700, color: isSolarOverLimit ? '#f87171' : '#34d399' }}>
              {isSolarOverLimit
                ? `🚨 Limite MPPT Excedido (+${mpptOverNominalPct}%)`
                : `✅ MPPT: ${mpptRemainingNominalPct}% livre (${mpptUsageNominalPct}% em uso)`}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: isSolarOverLimit ? '#fca5a5' : '#f8fafc',
                fontSize: '11px'
              }}
            >
              {totalNominalWatts}W / {mpptLimitWatts}W ({mpptUsageNominalPct}%)
            </span>
          </div>
          {isSolarOverLimit ? (
            <div style={{ color: '#fecaca', fontSize: '10.5px' }}>
              As <strong>{totalPanelsCount} placas de {panelW}W</strong> somam <strong>{totalNominalWatts}W</strong>, ficando{' '}
              <strong>+{mpptOverNominalPct}% acima</strong> (<strong>+{totalNominalWatts - mpptLimitWatts}W</strong>) da capacidade nominal do MPPT Kingbo 60A em 12V (720W nom. / 864W pico @ 14.4V).
              {isSolarOverPeak
                ? ` Ultrapassa também em +${mpptOverPeakPct}% (+${totalNominalWatts - mpptPeakLimitWatts}W) o teto absoluto de 864W — haverá corte de corrente (clipping em 60A) ou exigirá 2º MPPT!`
                : ` No teto de absorção (864W @ 14.4V), ainda restam ${Math.max(0, Math.round(((mpptPeakLimitWatts - totalNominalWatts) / mpptPeakLimitWatts) * 100))}% (${mpptPeakLimitWatts - totalNominalWatts}W) de margem.`}
            </div>
          ) : (
            <div style={{ color: '#a7f3d0', fontSize: '10.5px' }}>
              Em uso: <strong>{mpptUsageNominalPct}%</strong> ({totalNominalWatts}W) • Capacidade livre disponível:{' '}
              <strong>{mpptRemainingNominalPct}% ({mpptRemainingWatts}W)</strong> do total nominal de {mpptLimitWatts}W.
            </div>
          )}
        </div>
      </div>

  );
};
