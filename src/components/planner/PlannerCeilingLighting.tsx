import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { CeilingConfig, CeilingLedConfig, CeilingLedType } from '../../types';
import { DEFAULT_CEILING_CONFIG } from '../../data/internalBoxesPresets';

interface PlannerCeilingLightingProps {
  ceilingCfg: CeilingConfig;
}

export const PlannerCeilingLighting: React.FC<PlannerCeilingLightingProps> = ({ ceilingCfg }) => {
  const { setCeiling } = useSolar();

  const ledCfg: CeilingLedConfig = ceilingCfg.led || {
    enabled: true,
    type: 'strip_double',
    color: '#fef3c7',
    brightness: 85,
    spotsCount: 4
  };
  const isLedEnabled = Boolean(ledCfg.enabled);

  return (
    <>
                {/* 5. CARD: ILUMINAÇÃO LED INTEGRADA NO TETO */}
                <div
                  style={{
                    background: isLedEnabled
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.85) 100%)'
                      : 'rgba(30, 41, 59, 0.4)',
                    border: isLedEnabled ? '1.5px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '10px',
                    padding: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>💡</span>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: isLedEnabled ? '#fbbf24' : '#e2e8f0' }}>
                          ILUMINAÇÃO LED NO TETO
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          Perfis de fita LED COB com difusor leitoso ou spots circulares com iluminação real no 3D
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCeiling({
                          led: {
                            ...ledCfg,
                            enabled: !isLedEnabled
                          }
                        });
                      }}
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '6px 14px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: 'none',
                        background: isLedEnabled
                          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                          : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#ffffff',
                        boxShadow: isLedEnabled
                          ? '0 2px 8px rgba(239, 68, 68, 0.4)'
                          : '0 2px 8px rgba(245, 158, 11, 0.4)'
                      }}
                    >
                      {isLedEnabled ? '🗑️ Desativar LED' : '➕ Ativar LED no Teto'}
                    </button>
                  </div>

                  {isLedEnabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                      {/* Tipo de Iluminação */}
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '6px', fontWeight: 700 }}>
                          Estilo da Luminária do Teto:
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
                          {[
                            { id: 'strip_double', label: '2 Fitas Laterais', desc: 'Duplo perfil longitudinal' },
                            { id: 'strip_center', label: '1 Fita Central', desc: 'Perfil longitudinal único' },
                            { id: 'strip_triple', label: '3 Fitas Triplas', desc: 'Centro + 2 laterais' },
                            { id: 'spots', label: 'Spots Embutidos', desc: 'Plafons circulares embutir' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setCeiling({ led: { ...ledCfg, type: item.id as CeilingLedType } })}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                border: ledCfg.type === item.id ? '1.5px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
                                background: ledCfg.type === item.id ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                                color: ledCfg.type === item.id ? '#ffffff' : '#cbd5e1'
                              }}
                            >
                              <div style={{ fontSize: '10.5px', fontWeight: 700 }}>{item.label}</div>
                              <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>{item.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Se Spots: Quantidade de Spots */}
                      {ledCfg.type === 'spots' && (
                        <div>
                          <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px', fontWeight: 700 }}>
                            Quantidade de Spots de LED:
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {[2, 4, 6, 8].map((qty) => (
                              <button
                                key={qty}
                                onClick={() => setCeiling({ led: { ...ledCfg, spotsCount: qty } })}
                                style={{
                                  flex: 1,
                                  padding: '5px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  border: (ledCfg.spotsCount || 4) === qty ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
                                  background: (ledCfg.spotsCount || 4) === qty ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                                  color: (ledCfg.spotsCount || 4) === qty ? '#ffffff' : '#94a3b8'
                                }}
                              >
                                {qty} Spots
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cor da Luz / Presets Rápidos */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '10.5px', color: '#e2e8f0', fontWeight: 700 }}>
                            Tonalidade da Luz:
                          </span>
                          <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700 }}>
                            {ledCfg.color === '#fef3c7'
                              ? '3000K Branco Quente'
                              : ledCfg.color === '#ffffff'
                                ? '4000K Branco Neutro'
                                : ledCfg.color === '#e0f2fe'
                                  ? '6000K Branco Frio'
                                  : ledCfg.color === '#f59e0b'
                                    ? 'Âmbar Noturno'
                                    : ledCfg.color === '#38bdf8'
                                      ? 'Azul Céu'
                                      : ledCfg.color}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {[
                            { color: '#fef3c7', label: '3000K Quente', bg: '#fef3c7' },
                            { color: '#ffffff', label: '4000K Neutro', bg: '#ffffff' },
                            { color: '#e0f2fe', label: '6000K Frio', bg: '#bae6fd' },
                            { color: '#f59e0b', label: 'Âmbar', bg: '#f59e0b' },
                            { color: '#38bdf8', label: 'Azul', bg: '#38bdf8' }
                          ].map((c) => {
                            const isSelected = (ledCfg.color || '#fef3c7').toLowerCase() === c.color.toLowerCase();
                            return (
                              <button
                                key={c.color}
                                onClick={() => setCeiling({ led: { ...ledCfg, color: c.color } })}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  border: isSelected ? '1.5px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
                                  background: isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                                  color: isSelected ? '#ffffff' : '#cbd5e1'
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: c.bg,
                                    border: '1px solid rgba(0,0,0,0.3)',
                                    boxShadow: isSelected ? `0 0 6px ${c.bg}` : 'none'
                                  }}
                                />
                                {c.label}
                              </button>
                            );
                          })}

                          {/* Seletor Customizado */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                            <span style={{ fontSize: '9px', color: '#94a3b8' }}>Custom:</span>
                            <input
                              type="color"
                              value={ledCfg.color || '#fef3c7'}
                              onChange={(e) => setCeiling({ led: { ...ledCfg, color: e.target.value } })}
                              style={{
                                width: '24px',
                                height: '24px',
                                padding: 0,
                                border: '1px solid rgba(148, 163, 184, 0.4)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                background: 'transparent'
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Brilho / Intensidade */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
                          <span>Brilho / Intensidade Luminosa:</span>
                          <strong style={{ color: '#fbbf24' }}>{ledCfg.brightness ?? 85}%</strong>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          step={5}
                          value={ledCfg.brightness ?? 85}
                          onChange={(e) => setCeiling({ led: { ...ledCfg, brightness: Number(e.target.value) } })}
                          style={{ width: '100%', marginTop: '4px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
    </>
  );
};
