import React from 'react';
import { useSolar } from '../context/SolarContext';
import { SlideDirection, PanelOrientation } from '../types';

export const Sidebar: React.FC = () => {
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
    structureMaterial,
    setStructureMaterial,
    aluminumColor,
    setAluminumColor,
    offsetZ,
    setOffsetZ,
    offsetY,
    setOffsetY,
    cargoBox,
    setCargoBoxEnabled,
    setCargoBoxDimensions,
    setCargoBoxHingeSide,
    openModal,
    b2bCharger,
    toggleB2BEngine,
    setB2BEngineHours,
    usinaCharger,
    toggleUsinaAC,
    setUsinaModel
  } = useSolar();

  return (
    <aside className="sidebar-panel glass-panel">
      {/* 1. Configurador Paramétrico do Stack de Painéis Solares Flexíveis */}
      <div className="panel-section">
        <div className="section-label">
          <span>⚡ SISTEMA SOLAR FLEXÍVEL (100W)</span>
        </div>

        {/* Ficha Técnica do Painel Flexível Selecionado */}
        <div className="panel-spec-badge">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Painel Flexível Monocristalino</strong>
            <span style={{ color: '#10b981', fontWeight: 800, fontSize: '11px' }}>100W / 1.6kg</span>
          </div>
          <div className="panel-spec-grid">
            <span>📐 60 cm x 1.00 m (3mm)</span>
            <span>⚡ Voc: 22.28V | Vmax: 24V</span>
            <span>🔩 Fixação direta nos ilhoses</span>
            <span>⛓️ Corrediças telescópicas</span>
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
              {level1.panels} Placa{level1.panels > 1 ? 's' : ''} • {level1.panels * 100}W
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
                <small>{p * 100}W</small>
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
                {level2.panels} Placa{level2.panels > 1 ? 's' : ''} • {level2.panels * 100}W
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
                  <small>{p * 100}W</small>
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
      </div>

      {/* 2. Material da Estrutura (Toggle Alumínio vs Ferro Soldado) */}
      <div className="panel-section">
        <div className="section-label">
          <span>⚙️ MATERIAL DA ESTRUTURA</span>
          <span
            id="structure-weight-badge"
            style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          >
            {structureMaterial === 'aluminum' ? '18.5 kg (Alumínio)' : '42.0 kg (Ferro)'}
          </span>
        </div>
        <div className="material-toggle-container">
          <button
            className={`mat-toggle-btn ${structureMaterial === 'aluminum' ? 'active' : ''}`}
            id="btn-mat-aluminum"
            onClick={() => setStructureMaterial('aluminum')}
          >
            <span>🔘 Alumínio Extrusão (T-Slot 40x40)</span>
            <small>Leve (~18.5 kg), 100% anti-corrosão, ranhuras T e porcas T-Nut</small>
          </button>

          {/* Seletor de Acabamento / Cor do Alumínio */}
          {structureMaterial === 'aluminum' && (
            <div id="aluminum-color-subbar" style={{ display: 'flex', gap: '6px', padding: '2px 4px 4px 4px' }}>
              <button
                className={`btn-compact ${aluminumColor === 'silver' ? 'primary active' : ''}`}
                id="btn-color-silver"
                onClick={() => setAluminumColor('silver')}
                style={{ flex: 1, fontSize: '11px', padding: '5px 8px', borderRadius: '4px' }}
              >
                ⚪ Alumínio Natural (Prata)
              </button>
              <button
                className={`btn-compact ${aluminumColor === 'black' ? 'primary active' : ''}`}
                id="btn-color-black"
                onClick={() => setAluminumColor('black')}
                style={{ flex: 1, fontSize: '11px', padding: '5px 8px', borderRadius: '4px' }}
              >
                ⚫ Anodizado Preto
              </button>
            </div>
          )}

          <button
            className={`mat-toggle-btn ${structureMaterial === 'steel' ? 'active' : ''}`}
            id="btn-mat-steel"
            onClick={() => setStructureMaterial('steel')}
          >
            <span>⚙️ Ferro Soldado (Metalon 30x30/40x40)</span>
            <small>Mais pesado (~42.0 kg / +23.5kg no teto), solda fixa</small>
          </button>
        </div>
      </div>

      {/* 7. Posição do Rack no Teto (Alinhamento Longitudinal + Altura) */}
      <div className="panel-section">
        <div className="section-label">
          <span>📍 POSIÇÃO DO RACK NO TETO</span>
        </div>

        {/* Slider Z: Frente ↔ Traseira */}
        <div className="rack-pos-row">
          <span className="rack-pos-lbl">↔ Frente/Trás</span>
          <span id="rack-offset-val" className="rack-pos-val">
            {offsetZ >= 0 ? '+' : ''}{offsetZ.toFixed(2)} m
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            fontSize: '9px',
            color: 'var(--text-muted)',
            marginBottom: '3px'
          }}
        >
          <span>⬅ Tras.</span>
          <span style={{ flex: 1 }}></span>
          <span>Diant. ➡</span>
        </div>
        <input
          type="range"
          id="rack-offset-slider"
          className="custom-slider"
          min="-1.50"
          max="1.50"
          step="0.05"
          value={offsetZ}
          onChange={(e) => setOffsetZ(parseFloat(e.target.value))}
        />

        {/* Slider Y: Baixo ↔ Cima */}
        <div className="rack-pos-row" style={{ marginTop: '10px' }}>
          <span className="rack-pos-lbl">↕ Altura</span>
          <span id="rack-height-val" className="rack-pos-val">
            {offsetY >= 0 ? '+' : ''}{offsetY.toFixed(2)} m
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            fontSize: '9px',
            color: 'var(--text-muted)',
            marginBottom: '3px'
          }}
        >
          <span>⬇ Baixo</span>
          <span style={{ flex: 1 }}></span>
          <span>Cima ⬆</span>
        </div>
        <input
          type="range"
          id="rack-height-slider"
          className="custom-slider"
          min="-0.30"
          max="0.50"
          step="0.02"
          value={offsetY}
          onChange={(e) => setOffsetY(parseFloat(e.target.value))}
        />
      </div>

      {/* 8. Baú de Teto Motobul Off Road & Subchassi */}
      <div className="panel-section">
        <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🧰 BAÚ DE TETO MOTOBUL OFF ROAD</span>
          <button
            className={`btn-compact ${cargoBox.enabled ? 'primary active' : ''}`}
            onClick={() => setCargoBoxEnabled(!cargoBox.enabled)}
            style={{ fontSize: '10px', padding: '3px 7px' }}
          >
            {cargoBox.enabled ? '✅ Ativado' : '❌ Desativado'}
          </button>
        </div>

        {cargoBox.enabled && (
          <>
            {/* Ficha Técnica Rápida */}
            <div className="panel-spec-badge" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#fbbf24' }}>Motobul Off Road 500L</strong>
                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '11px' }}>18 kg / 50 kg útil</span>
              </div>
              <div className="panel-spec-grid">
                <span>📐 Padrão: 1600 x 1000 x 330 mm</span>
                <span>🛡️ ABS Cinza c/ nervuras</span>
                <span>⛓️ Dobradiças e torres inox</span>
                <span>💨 Amortecedores a gás (65°)</span>
              </div>
            </div>

            {/* Lado da Articulação / Dobradiça */}
            <div className="config-group" style={{ marginTop: '8px' }}>
              <div className="config-group-header">
                <span>LADO DA DOBRADIÇA (BASCULAMENTO):</span>
              </div>
              <div className="config-btn-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <button
                  className={`cfg-btn ${cargoBox.hingeSide === 'driver' ? 'active' : ''}`}
                  onClick={() => setCargoBoxHingeSide('driver')}
                >
                  <span>🚗 Motorista</span>
                  <small>Abre para Calçada (Recomendado)</small>
                </button>
                <button
                  className={`cfg-btn ${cargoBox.hingeSide === 'passenger' ? 'active' : ''}`}
                  onClick={() => setCargoBoxHingeSide('passenger')}
                >
                  <span>🚶 Passageiro</span>
                  <small>Abre para Rua</small>
                </button>
              </div>
            </div>

            {/* Dimensões Paramétricas do Baú */}
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Comprimento:</span>
                  <strong style={{ color: 'var(--primary)' }}>{cargoBox.length} mm</strong>
                </div>
                <input
                  type="range"
                  className="custom-slider"
                  min="1200"
                  max="2000"
                  step="50"
                  value={cargoBox.length}
                  onChange={(e) => setCargoBoxDimensions(parseFloat(e.target.value), cargoBox.width, cargoBox.height)}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Largura:</span>
                  <strong style={{ color: 'var(--primary)' }}>{cargoBox.width} mm</strong>
                </div>
                <input
                  type="range"
                  className="custom-slider"
                  min="800"
                  max="1200"
                  step="25"
                  value={cargoBox.width}
                  onChange={(e) => setCargoBoxDimensions(cargoBox.length, parseFloat(e.target.value), cargoBox.height)}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Altura do Baú:</span>
                  <strong style={{ color: 'var(--primary)' }}>{cargoBox.height} mm</strong>
                </div>
                <input
                  type="range"
                  className="custom-slider"
                  min="250"
                  max="450"
                  step="10"
                  value={cargoBox.height}
                  onChange={(e) => setCargoBoxDimensions(cargoBox.length, cargoBox.width, parseFloat(e.target.value))}
                />
              </div>
            </div>

            <button
              className="btn-link-action"
              onClick={() => openModal('bom')}
              style={{ marginTop: '6px', fontSize: '11px', color: '#fbbf24' }}
            >
              📊 Ver Força dos Pistões e Ferragens no BOM &rarr;
            </button>
          </>
        )}
      </div>

      {/* 9. Sistema de Recarga Veicular DC-DC B2B1230 */}
      <div className="panel-section">
        <div className="section-label">
          <span>🔋 ALTERNADOR DOBLÒ & CARREGADOR B2B1230</span>
        </div>

        <div
          style={{
            background: b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.12)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.35)' : 'rgba(56, 189, 248, 0.2)'}`,
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '11px', color: b2bCharger.isEngineRunning ? '#4ade80' : '#38bdf8' }}>
              B2B1230 (12V 30A · 390W)
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: b2bCharger.isEngineRunning ? '#4ade80' : '#94a3b8',
                background: b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                padding: '2px 6px',
                borderRadius: '8px'
              }}
            >
              {b2bCharger.isEngineRunning ? 'RODANDO (+30A)' : 'DESLIGADO'}
            </span>
          </div>

          <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.45 }}>
            Recarrega a bateria de serviço Kingbo 560Ah através do alternador do motor da van com curva de carga de 4 estágios.
          </p>

          {/* Configuração de tempo de rodagem diária */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(56, 189, 248, 0.18)',
              borderRadius: '6px',
              padding: '6px 8px',
              marginBottom: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>⏱️ Rodagem diária:</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: b2bCharger.engineHoursPerDay > 0 ? '#4ade80' : '#94a3b8' }}>
                {b2bCharger.engineHoursPerDay.toFixed(1)} h/dia
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="8"
              step="0.25"
              value={b2bCharger.engineHoursPerDay}
              onChange={(e) => setB2BEngineHours(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', height: '4px', cursor: 'pointer', margin: '2px 0 6px 0' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)' }}>
              <span>
                {b2bCharger.engineHoursPerDay > 0
                  ? `+${Math.round(b2bCharger.engineHoursPerDay * 30)} Ah/dia injetados`
                  : '0 Ah (sem rodar)'}
              </span>
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                {b2bCharger.engineHoursPerDay > 0
                  ? `+${Math.round(b2bCharger.engineHoursPerDay * 390)} Wh/dia`
                  : '0 Wh'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn-compact ${b2bCharger.isEngineRunning ? 'active' : ''}`}
              onClick={toggleB2BEngine}
              style={{
                flex: 1,
                fontSize: '10px',
                background: b2bCharger.isEngineRunning ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)',
                borderColor: b2bCharger.isEngineRunning ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)',
                color: b2bCharger.isEngineRunning ? '#fca5a5' : '#86efac'
              }}
            >
              {b2bCharger.isEngineRunning ? '⏹️ Desligar Motor' : '▶️ Ligar Alternador (+30A)'}
            </button>
            <button
              className="btn-compact primary"
              onClick={() => openModal('b2b')}
              style={{ fontSize: '10px', padding: '4px 8px' }}
            >
              📱 App / Specs
            </button>
          </div>
        </div>
      </div>

      {/* 10. Fonte & Carregador Usina Smart Connect (Rede AC / Camping) */}
      <div className="panel-section">
        <div className="section-label">
          <span>🔌 FONTE & CARREGADOR USINA SMART CONNECT</span>
        </div>

        <div
          style={{
            background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.12)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.2)'}`,
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '11px', color: usinaCharger.isConnectedAC ? '#f87171' : '#fca5a5' }}>
              Usina {usinaCharger.modelRating}A ({Math.round(usinaCharger.chargingAmps * usinaCharger.voltageOut)}W)
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: usinaCharger.isConnectedAC ? '#f87171' : '#94a3b8',
                background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                padding: '2px 6px',
                borderRadius: '8px'
              }}
            >
              {usinaCharger.isConnectedAC ? `SHORE POWER (+${usinaCharger.chargingAmps}A)` : 'OFF-GRID'}
            </span>
          </div>

          <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.45 }}>
            Recarga pesada Bivolt 110V/220V em tomadas de camping, garagem ou gerador externo para a bateria 560Ah.
          </p>

          {/* Seleção do Modelo Usina: 70A, 120A, 150A, 200A */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Modelo Usina Smart Connect:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {([70, 120, 150, 200] as const).map((rating) => (
                <button
                  key={rating}
                  className={`btn-compact ${usinaCharger.modelRating === rating ? 'active' : ''}`}
                  onClick={() => setUsinaModel(rating)}
                  style={{
                    fontSize: '9.5px',
                    padding: '3px 0',
                    fontWeight: 700,
                    textAlign: 'center',
                    background: usinaCharger.modelRating === rating ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: usinaCharger.modelRating === rating ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
                    color: usinaCharger.modelRating === rating ? '#fca5a5' : '#cbd5e1'
                  }}
                  title={`Modelo Usina ${rating}A 12V Bivolt (${Math.round(rating * 14.4)}W)`}
                >
                  {rating}A
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn-compact ${usinaCharger.isConnectedAC ? 'active' : ''}`}
              onClick={toggleUsinaAC}
              style={{
                flex: 1,
                fontSize: '10px',
                background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)',
                borderColor: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)',
                color: usinaCharger.isConnectedAC ? '#fca5a5' : '#86efac'
              }}
            >
              {usinaCharger.isConnectedAC ? '🔌 Desconectar' : '⚡ Conectar Tomada'}
            </button>
            <button
              className="btn-compact primary"
              onClick={() => openModal('usina')}
              style={{ fontSize: '10px', padding: '4px 8px' }}
            >
              📊 Specs / Ajuste
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

