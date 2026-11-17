import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const RightPanelAccessorySection: React.FC = () => {
  const {
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
    openModal,
    expansionProgress,
    retract,
  } = useSolar();

  const expansionPct = Math.round(expansionProgress * 100);

  return (
    <>
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
                    onClick={() => setAwning({ type: 'rear', lengthMm: 1400, extensionMm: 2000 })}
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
                    onClick={() => setAwning({ type: 'batwing_270', lengthMm: 2000, extensionMm: 2200 })}
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
    </>
  );
};
