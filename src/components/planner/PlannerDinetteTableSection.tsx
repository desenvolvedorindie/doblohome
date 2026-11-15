import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, InternalBoxMaterial } from '../../types';

interface PlannerDinetteProps {
  selectedBox: InternalBoxItem;
}

export const PlannerDinetteTableSection: React.FC<PlannerDinetteProps> = ({ selectedBox }) => {
  const { updateInternalBox } = useSolar();

  return (
    <>
          {/* Opção de Mesa Central Dinette c/ Pedestal Náutico e Deslocamento X/Z/Altura/Giro */}
          {(selectedBox.panels?.top ?? (selectedBox.type !== 'open')) && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                background: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled)
                  ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.18), rgba(37, 99, 235, 0.10))'
                  : 'rgba(30, 41, 59, 0.45)',
                border: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled)
                  ? '1px solid rgba(56, 189, 248, 0.6)'
                  : '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? '10px' : '0', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? '#38bdf8' : '#e2e8f0' }}>
                      🍽️ Mesa Dinette Central c/ Pedestal Náutico (Foto da Van)
                    </span>
                    <span
                      style={{
                        fontSize: '8.5px',
                        fontWeight: 800,
                        color: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? '#38bdf8' : '#94a3b8',
                        background: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {(selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? '✓ MESA ATIVA' : 'DESATIVADA'}
                    </span>
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
                    Mesa central de apoio e refeições com <strong>coluna tubular preta fixada por braçadeiras duplas</strong> e <strong>tampo em madeira com cantos arredondados</strong>. Permite deslocamento livre (frente/trás, lateral, altura e giro 360°).
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const willEnable = !(selectedBox.hasCentralTable || selectedBox.centralTable?.enabled);
                    updateInternalBox(selectedBox.id, {
                      hasCentralTable: willEnable,
                      centralTable: {
                        enabled: willEnable,
                        widthMm: selectedBox.centralTable?.widthMm ?? 450,
                        lengthMm: selectedBox.centralTable?.lengthMm ?? 650,
                        heightMm: selectedBox.centralTable?.heightMm ?? 720,
                        offsetX: selectedBox.centralTable?.offsetX ?? 0,
                        offsetZ: selectedBox.centralTable?.offsetZ ?? 0,
                        rotationDeg: selectedBox.centralTable?.rotationDeg ?? 0,
                        finish: selectedBox.centralTable?.finish ?? (selectedBox.rearShelfFinish || 'pine_block')
                      }
                    });
                  }}
                  className="btn-compact"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '6px 12px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    background: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled)
                      ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                      : 'rgba(51, 65, 85, 0.8)',
                    borderColor: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? '#38bdf8' : 'rgba(148, 163, 184, 0.4)',
                    color: '#ffffff'
                  }}
                >
                  {(selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? '✓ Mesa Ativa' : '+ Adicionar Mesa Central'}
                </button>
              </div>

              {/* Controles de Deslocamento e Ajuste Fino da Mesa */}
              {(selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) && (
                <div
                  style={{
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(56, 189, 248, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {/* Deslocamento Longitudinal (Z: Frente / Trás) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700 }}>↕ Deslocamento Longitudinal (Frente / Trás):</span>
                      <span style={{ fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        {(selectedBox.centralTable?.offsetZ ?? 0) > 0 ? `+${selectedBox.centralTable?.offsetZ} mm (Frente)` : (selectedBox.centralTable?.offsetZ ?? 0) < 0 ? `${selectedBox.centralTable?.offsetZ} mm (Traseira)` : '0 mm (Centro)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-500"
                      max="500"
                      step="25"
                      value={selectedBox.centralTable?.offsetZ ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        updateInternalBox(selectedBox.id, {
                          centralTable: {
                            ...(selectedBox.centralTable || { enabled: true }),
                            offsetZ: val
                          }
                        });
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Deslocamento Lateral (X: Esquerda / Direita) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700 }}>↔ Deslocamento Lateral (Esquerda / Direita):</span>
                      <span style={{ fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        {(selectedBox.centralTable?.offsetX ?? 0) > 0 ? `+${selectedBox.centralTable?.offsetX} mm (Esq.)` : (selectedBox.centralTable?.offsetX ?? 0) < 0 ? `${selectedBox.centralTable?.offsetX} mm (Dir.)` : '0 mm (Centro)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-350"
                      max="350"
                      step="25"
                      value={selectedBox.centralTable?.offsetX ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        updateInternalBox(selectedBox.id, {
                          centralTable: {
                            ...(selectedBox.centralTable || { enabled: true }),
                            offsetX: val
                          }
                        });
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Altura da Mesa e Rotação */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {/* Altura (Y) */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 700 }}>Altura do Piso:</span>
                        <span style={{ fontWeight: 800, color: '#4ade80', fontFamily: 'var(--font-mono)' }}>
                          {selectedBox.centralTable?.heightMm ?? 720} mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min="380"
                        max="850"
                        step="20"
                        value={selectedBox.centralTable?.heightMm ?? 720}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          updateInternalBox(selectedBox.id, {
                            centralTable: {
                              ...(selectedBox.centralTable || { enabled: true }),
                              heightMm: val
                            }
                          });
                        }}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button
                          type="button"
                          className={`btn-compact ${(selectedBox.centralTable?.heightMm ?? 720) === 720 ? 'active' : ''}`}
                          onClick={() => {
                            updateInternalBox(selectedBox.id, {
                              centralTable: {
                                ...(selectedBox.centralTable || { enabled: true }),
                                heightMm: 720
                              }
                            });
                          }}
                          style={{ fontSize: '9px', padding: '2px 5px', flex: 1 }}
                        >
                          🍽️ Mesa 72cm
                        </button>
                        <button
                          type="button"
                          className={`btn-compact ${(selectedBox.centralTable?.heightMm ?? 720) === 400 ? 'active' : ''}`}
                          onClick={() => {
                            updateInternalBox(selectedBox.id, {
                              centralTable: {
                                ...(selectedBox.centralTable || { enabled: true }),
                                heightMm: 400
                              }
                            });
                          }}
                          style={{ fontSize: '9px', padding: '2px 5px', flex: 1 }}
                        >
                          🛏️ Cama 40cm
                        </button>
                      </div>
                    </div>

                    {/* Giro / Rotação Náutica */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 700 }}>Giro do Tampo:</span>
                        <span style={{ fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                          {selectedBox.centralTable?.rotationDeg ?? 0}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="15"
                        value={selectedBox.centralTable?.rotationDeg ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          updateInternalBox(selectedBox.id, {
                            centralTable: {
                              ...(selectedBox.centralTable || { enabled: true }),
                              rotationDeg: val
                            }
                          });
                        }}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button
                          type="button"
                          className="btn-compact"
                          onClick={() => {
                            updateInternalBox(selectedBox.id, {
                              centralTable: {
                                ...(selectedBox.centralTable || { enabled: true }),
                                rotationDeg: 0
                              }
                            });
                          }}
                          style={{ fontSize: '9px', padding: '2px 5px', flex: 1 }}
                        >
                          0° Reto
                        </button>
                        <button
                          type="button"
                          className="btn-compact"
                          onClick={() => {
                            updateInternalBox(selectedBox.id, {
                              centralTable: {
                                ...(selectedBox.centralTable || { enabled: true }),
                                rotationDeg: 90
                              }
                            });
                          }}
                          style={{ fontSize: '9px', padding: '2px 5px', flex: 1 }}
                        >
                          90° Giro
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dimensões do Tampo e Acabamento da Madeira */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                        Dimensões Tampo (C × L):
                      </label>
                      <select
                        value={`${selectedBox.centralTable?.lengthMm ?? 650}x${selectedBox.centralTable?.widthMm ?? 450}`}
                        onChange={(e) => {
                          const [l, w] = e.target.value.split('x').map(Number);
                          updateInternalBox(selectedBox.id, {
                            centralTable: {
                              ...(selectedBox.centralTable || { enabled: true }),
                              lengthMm: l,
                              widthMm: w
                            }
                          });
                        }}
                        style={{
                          width: '100%',
                          background: 'rgba(30, 41, 59, 0.9)',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          color: '#ffffff',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          fontSize: '11px'
                        }}
                      >
                        <option value="650x450">650 × 450 mm (Padrão Camper Foto)</option>
                        <option value="600x400">600 × 400 mm (Compacto)</option>
                        <option value="750x500">750 × 500 mm (Amplo Trabalho/Jantar)</option>
                        <option value="500x350">500 × 350 mm (Mesa Café Lateral)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                        Acabamento da Madeira:
                      </label>
                      <select
                        value={selectedBox.centralTable?.finish || 'pine_block'}
                        onChange={(e) => {
                          updateInternalBox(selectedBox.id, {
                            centralTable: {
                              ...(selectedBox.centralTable || { enabled: true }),
                              finish: e.target.value as any
                            }
                          });
                        }}
                        style={{
                          width: '100%',
                          background: 'rgba(30, 41, 59, 0.9)',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          color: '#ffffff',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          fontSize: '11px'
                        }}
                      >
                        <option value="pine_block">🪵 Pinus Finger-Joint (Igual à Foto)</option>
                        <option value="teak">🪵 Teca Naval Dourada Impermeável</option>
                        <option value="dark_wood">🪵 Imbuia Nobre Escura</option>
                        <option value="plywood">🪵 Compensado Naval Selado 18mm</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

    </>
  );
};
