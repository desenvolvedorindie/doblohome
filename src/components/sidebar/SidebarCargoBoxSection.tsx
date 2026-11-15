import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const SidebarCargoBoxSection: React.FC = () => {
  const {
    cargoBox,
    setCargoBoxEnabled,
    setCargoBoxDimensions,
    setCargoBoxVerticalLift,
    setCargoBoxTelescopic,
    setCargoBoxHingeSide,
    openModal,
    cargoBoxPresets,
    activeCargoBoxPreset,
    selectCargoBoxPreset,
  } = useSolar();

  return (
      <div className="panel-section">
        <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
          <span>🧰 BAÚ DE TETO / BAGAGEIRO</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="btn-compact"
              onClick={() => openModal('cargo-presets')}
              style={{ fontSize: '10px', padding: '3px 7px', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.45)' }}
              title="Gerenciar e cadastrar presets de baú de teto"
            >
              📦 Presets
            </button>
            <button
              className={`btn-compact ${cargoBox.enabled ? 'primary active' : ''}`}
              onClick={() => setCargoBoxEnabled(!cargoBox.enabled)}
              style={{ fontSize: '10px', padding: '3px 7px' }}
            >
              {cargoBox.enabled ? '✅ Ativado' : '❌ Desativado'}
            </button>
          </div>
        </div>

        {cargoBox.enabled && (
          <>
            {/* Seletor Rápido de Presets de Baú */}
            <div style={{ marginBottom: '6px' }}>
              <select
                value={activeCargoBoxPreset.id}
                onChange={(e) => selectCargoBoxPreset(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: '#f8fafc',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {cargoBoxPresets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.length}×{b.width}×{b.height}mm)
                  </option>
                ))}
              </select>
            </div>

            {/* Ficha Técnica Rápida */}
            <div className="panel-spec-badge" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#fbbf24' }}>{activeCargoBoxPreset.name}</strong>
                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '11px' }}>
                  {activeCargoBoxPreset.weightKg} kg / {activeCargoBoxPreset.maxLoadKg} kg útil
                </span>
              </div>
              <div className="panel-spec-grid">
                <span>📐 Medidas: {cargoBox.length} × {cargoBox.width} × {cargoBox.height} mm</span>
                <span>🛡️ {activeCargoBoxPreset.volumeLiters} Litros</span>
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
                  min="200"
                  max="600"
                  step="10"
                  value={cargoBox.height}
                  onChange={(e) => setCargoBoxDimensions(cargoBox.length, cargoBox.width, parseFloat(e.target.value))}
                />
              </div>

              {/* Checkbox Torres Telescópicas vs Fixas */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '6px 8px',
                borderRadius: '6px',
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
                    checked={cargoBox.isTelescopic !== false}
                    onChange={(e) => setCargoBoxTelescopic(e.target.checked)}
                    style={{ accentColor: '#38bdf8', width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                  <span>Torres Telescópicas de Elevação</span>
                </label>
                <span style={{
                  fontSize: '9.5px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: cargoBox.isTelescopic !== false ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                  color: cargoBox.isTelescopic !== false ? '#38bdf8' : '#94a3b8',
                  fontWeight: 700
                }}>
                  {cargoBox.isTelescopic !== false ? '↕ Telescópica' : '🔒 Fixa'}
                </span>
              </div>

              {cargoBox.isTelescopic !== false ? (
                (() => {
                  const maxLiftMm = Math.max(60, Math.floor(((cargoBox.height || 330) - 100) / 10) * 10);
                  const curLiftMm = Math.min(maxLiftMm, cargoBox.verticalLiftMm || 0);
                  return (
                    <div
                      style={{
                        background: 'rgba(14, 165, 233, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '6px',
                        padding: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
                        <span>↕ Abertura Vertical (Torres Telescópicas):</span>
                        <strong>+{curLiftMm} / {maxLiftMm} mm</strong>
                      </div>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Curso real da barra 30×30 ({cargoBox.height + 20}mm c/ 90mm engaste mín. na base 40×40) • Vão livre: {cargoBox.height + curLiftMm + 8} mm
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
                    </div>
                  );
                })()
              ) : (
                <div style={{
                  fontSize: '10px',
                  color: '#94a3b8',
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  borderLeft: '3px solid #38bdf8'
                }}>
                  🔒 <strong>Torres Fixas Selecionadas:</strong> Perfil monobloco fixo no limite mínimo de altura (vão livre rente de 8mm sobre a tampa do baú). Economiza peso e garante a menor altura do conjunto.
                </div>
              )}
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

  );
};
