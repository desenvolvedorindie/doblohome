import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const SidebarPositionSection: React.FC = () => {
  const {
    offsetZ,
    setOffsetZ,
    offsetY,
    setOffsetY,
    internalGrid,
    setInternalGrid,
    isOpenPreview,
    setIsOpenPreview,
    setViewMode,
  } = useSolar();

  return (
    <>
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

      {/* 8. Posição dos Armazenadores & Caixas Internas dentro da Doblò */}
      <div className="panel-section" style={{ borderLeft: '3px solid #f59e0b' }}>
        <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#f59e0b' }}>📦 POSIÇÃO DAS CAIXAS NA DOBLÒ</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="btn-compact"
              onClick={() => setIsOpenPreview(!isOpenPreview)}
              style={{
                fontSize: '10px',
                padding: '3px 7px',
                color: isOpenPreview ? '#34d399' : '#94a3b8',
                borderColor: isOpenPreview ? 'rgba(52, 211, 153, 0.5)' : 'rgba(148, 163, 184, 0.3)'
              }}
              title="Simula abertura de gavetões deslizantes e tampas de baús"
            >
              {isOpenPreview ? '🔓 Abertos' : '🔒 Fechados'}
            </button>
            <button
              className="btn-compact"
              onClick={() => setViewMode('internal_boxes')}
              style={{ fontSize: '10px', padding: '3px 7px', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.45)' }}
              title="Abrir o Editor de Grid 2D Completo (Modo 1)"
            >
              ✏️ Modo Grid ➔
            </button>
          </div>
        </div>

        {/* Sliders de Posição Tridimensional do Conjunto */}
        {/* Slider Z: Frente ↔ Traseira */}
        <div className="rack-pos-row">
          <span className="rack-pos-lbl">↔ Frente / Trás (Z)</span>
          <span className="rack-pos-val" style={{ color: '#f59e0b' }}>
            {(internalGrid.offsetZ || 0) >= 0 ? '+' : ''}{(internalGrid.offsetZ || 0).toFixed(2)} m ({Math.round((internalGrid.offsetZ || 0) * 100)} cm)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '3px' }}>
          <span>⬅ Traseira / Porta-Malas</span>
          <span style={{ flex: 1 }}></span>
          <span>Bancos Dianteiros ➡</span>
        </div>
        <input
          type="range"
          className="custom-slider"
          min="-0.80"
          max="0.80"
          step="0.01"
          value={internalGrid.offsetZ || 0}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setInternalGrid(prev => ({ ...prev, offsetZ: val }));
          }}
        />

        {/* Slider Y: Altura do Assoalho / Estrado */}
        <div className="rack-pos-row" style={{ marginTop: '10px' }}>
          <span className="rack-pos-lbl">↕ Altura do Estrado (Y)</span>
          <span className="rack-pos-val" style={{ color: '#f59e0b' }}>
            {(internalGrid.offsetY || 0) >= 0 ? '+' : ''}{(internalGrid.offsetY || 0).toFixed(2)} m ({Math.round((internalGrid.offsetY || 0) * 100)} cm)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '3px' }}>
          <span>⬇ Rebaixar Piso</span>
          <span style={{ flex: 1 }}></span>
          <span>Elevar Estrado ⬆</span>
        </div>
        <input
          type="range"
          className="custom-slider"
          min="-0.20"
          max="0.40"
          step="0.01"
          value={internalGrid.offsetY || 0}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setInternalGrid(prev => ({ ...prev, offsetY: val }));
          }}
        />

        {/* Slider X: Alinhamento Lateral */}
        <div className="rack-pos-row" style={{ marginTop: '10px' }}>
          <span className="rack-pos-lbl">⬅ Lateralidade Esq / Dir (X)</span>
          <span className="rack-pos-val" style={{ color: '#f59e0b' }}>
            {(internalGrid.offsetX || 0) >= 0 ? '+' : ''}{(internalGrid.offsetX || 0).toFixed(2)} m ({Math.round((internalGrid.offsetX || 0) * 100)} cm)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '3px' }}>
          <span>Passageiro (-X)</span>
          <span style={{ flex: 1 }}></span>
          <span>Motorista (+X)</span>
        </div>
        <input
          type="range"
          className="custom-slider"
          min="-0.30"
          max="0.30"
          step="0.01"
          value={internalGrid.offsetX || 0}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setInternalGrid(prev => ({ ...prev, offsetX: val }));
          }}
        />

        {/* Botão Reset de Posição */}
        {((internalGrid.offsetZ || 0) !== 0 || (internalGrid.offsetY || 0) !== 0 || (internalGrid.offsetX || 0) !== 0) && (
          <div style={{ textAlign: 'right', marginTop: '6px' }}>
            <button
              className="btn-compact"
              onClick={() => setInternalGrid(prev => ({ ...prev, offsetX: 0, offsetY: 0, offsetZ: 0 }))}
              style={{ fontSize: '9.5px', padding: '2px 8px', color: '#94a3b8' }}
            >
              ↺ Resetar Posição Original
            </button>
          </div>
        )}

      </div>
    </>
  );
};
