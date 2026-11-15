import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { CeilingConfig, CeilingType, CeilingSheetMaterial, CeilingSlattedWood } from '../../types';
import { DEFAULT_CEILING_CONFIG } from '../../data/internalBoxesPresets';

interface PlannerCeilingMaterialProps {
  ceilingCfg: CeilingConfig;
  calculatedSlatCount: number;
  totalSlatAreaM2: string;
}

export const PlannerCeilingMaterial: React.FC<PlannerCeilingMaterialProps> = ({
  ceilingCfg,
  calculatedSlatCount,
  totalSlatAreaM2
}) => {
  const { internalGrid, setCeiling } = useSolar();
  const [lastMdfType, setLastMdfType] = useState<CeilingSheetMaterial>('white_mdf');

  const isSlatted = (ceilingCfg.type || 'slatted') === 'slatted';
  const slatW = ceilingCfg.slatWidthMm || 40;
  const slatGap = ceilingCfg.slatGapMm || 10;
  const slatThick = ceilingCfg.slatThicknessMm || 12;
  const isTransverse = ceilingCfg.slatDirection === 'transverse';
  const ceilingW = ceilingCfg.widthMm || internalGrid.widthMm;
  const ceilingL = ceilingCfg.lengthMm || internalGrid.lengthMm;
  const slatLength = isTransverse ? ceilingW : ceilingL;

  return (
    <>
                {/* 1. SELETOR DE TIPO: RIPADO vs CHAPA */}
                <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Tipo de Forro do Teto
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => setCeiling({ type: 'slatted' })}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: isSlatted ? '2px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.3)',
                        background: isSlatted ? 'rgba(245, 158, 11, 0.18)' : 'rgba(30, 41, 59, 0.6)',
                        color: isSlatted ? '#fbbf24' : '#cbd5e1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>🪵</span>
                      <strong style={{ fontSize: '12px' }}>Teto Ripado</strong>
                      <span style={{ fontSize: '9.5px', color: '#94a3b8', textAlign: 'center' }}>
                        Ripas de madeira com fundo acústico
                      </span>
                    </button>

                    <button
                      onClick={() => setCeiling({ type: 'sheet' })}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: !isSlatted ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
                        background: !isSlatted ? 'rgba(56, 189, 248, 0.18)' : 'rgba(30, 41, 59, 0.6)',
                        color: !isSlatted ? '#38bdf8' : '#cbd5e1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>📄</span>
                      <strong style={{ fontSize: '12px' }}>Chapa Contínua</strong>
                      <span style={{ fontSize: '9.5px', color: '#94a3b8', textAlign: 'center' }}>
                        MDF Branco Ultra ou Compensado Naval
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. CONFIGURAÇÕES ESPECÍFICAS DO TETO RIPADO */}
                {isSlatted && (
                  <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>
                      📐 Configurações das Ripas de Madeira
                    </div>

                    {/* Madeira / Acabamento das Ripas */}
                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px', fontWeight: 700 }}>
                        🌲 Espécie / Tonalidade da Madeira:
                      </label>
                      <select
                        value={ceilingCfg.slattedWood || 'freijo'}
                        onChange={(e) => setCeiling({ slattedWood: e.target.value as CeilingSlattedWood })}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: '#0f172a',
                          color: '#ffffff',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          fontSize: '11px'
                        }}
                      >
                        <option value="freijo">Freijó Nobre Natural (Tons Quentes / Van Life Moderno)</option>
                        <option value="pinus">Pinus Claro Maciço (Nórdico / Claro)</option>
                        <option value="teak">Teca Náutica Selada (Elegante & Resistente)</option>
                        <option value="dark_wood">Imbuia / Nogueira Nobre Escura (Contraste Marcante)</option>
                        <option value="cedro">Cedro Rosa Real (Tons Avermelhados Clássicos)</option>
                        <option value="plywood">Compensado Naval 12mm (Marcenaria Pura)</option>
                        <option value="white_mdf">MDF Branco Ultra (Minimalista Clean)</option>
                      </select>
                    </div>

                    {/* Largura da Ripa & Espaçamento / Fenda */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
                          <span>Largura da Ripa:</span>
                          <strong style={{ color: '#fbbf24' }}>{slatW} mm</strong>
                        </div>
                        <input
                          type="range"
                          min={25}
                          max={70}
                          step={5}
                          value={slatW}
                          onChange={(e) => setCeiling({ slatWidthMm: Number(e.target.value) })}
                          style={{ width: '100%', marginTop: '4px' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
                          <span>Espaçamento (Fenda):</span>
                          <strong style={{ color: '#fbbf24' }}>{slatGap} mm</strong>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={20}
                          step={1}
                          value={slatGap}
                          onChange={(e) => setCeiling({ slatGapMm: Number(e.target.value) })}
                          style={{ width: '100%', marginTop: '4px' }}
                        />
                      </div>
                    </div>

                    {/* Espessura / Profundidade da Ripa & Orientação */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px', fontWeight: 700 }}>
                          Espessura / Profundidade:
                        </label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {[10, 12, 15, 18].map((t) => (
                            <button
                              key={t}
                              onClick={() => setCeiling({ slatThicknessMm: t })}
                              style={{
                                flex: 1,
                                padding: '4px 6px',
                                fontSize: '10px',
                                fontWeight: 700,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                border: slatThick === t ? '1.5px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
                                background: slatThick === t ? 'rgba(245, 158, 11, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                                color: slatThick === t ? '#ffffff' : '#94a3b8'
                              }}
                            >
                              {t}mm
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px', fontWeight: 700 }}>
                          Direção das Ripas:
                        </label>
                        <select
                          value={ceilingCfg.slatDirection || 'longitudinal'}
                          onChange={(e) => setCeiling({ slatDirection: e.target.value as any })}
                          style={{
                            width: '100%',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            background: '#0f172a',
                            color: '#ffffff',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            fontSize: '11px'
                          }}
                        >
                          <option value="longitudinal">Longitudinal (Frente ➔ Traseira)</option>
                          <option value="transverse">Transversal (Largura)</option>
                        </select>
                      </div>
                    </div>

                    {/* Fundo Acústico Preto */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#cbd5e1' }}>
                      <input
                        type="checkbox"
                        checked={ceilingCfg.acousticFeltBacking !== false}
                        onChange={(e) => setCeiling({ acousticFeltBacking: e.target.checked })}
                      />
                      <span>Fundo acústico automotivo preto (feltro / TNT escuro atrás das ripas)</span>
                    </label>

                    {/* Resumo do Ripado */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '10px', color: '#fbbf24', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <span>📊 Total: <strong>{calculatedSlatCount} ripas</strong> de {slatW} × {slatLength} × {slatThick} mm</span>
                      <span>Área: <strong>{totalSlatAreaM2} m²</strong></span>
                    </div>
                  </div>
                )}

                {/* 3. CONFIGURAÇÕES ESPECÍFICAS DO TETO EM CHAPA */}
                {!isSlatted && (
                  <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                      📐 Configurações da Chapa de Teto (MDF / Compensado)
                    </div>

                    {/* 1. Seleção do Material Base da Chapa (MDF vs Compensado) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '6px', fontWeight: 700 }}>
                        Material da Chapa de Forro:
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (ceilingCfg.sheetMaterial === 'plywood') {
                              setCeiling({ sheetMaterial: lastMdfType || 'white_mdf' });
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: (ceilingCfg.sheetMaterial !== 'plywood')
                              ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.35), rgba(37, 99, 235, 0.45))'
                              : 'rgba(15, 23, 42, 0.7)',
                            border: (ceilingCfg.sheetMaterial !== 'plywood')
                              ? '1.5px solid #38bdf8'
                              : '1px solid rgba(148, 163, 184, 0.3)',
                            color: (ceilingCfg.sheetMaterial !== 'plywood') ? '#ffffff' : '#94a3b8',
                            boxShadow: (ceilingCfg.sheetMaterial !== 'plywood') ? '0 0 10px rgba(56, 189, 248, 0.25)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>⬜</span>
                          <span>Chapa de MDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCeiling({ sheetMaterial: 'plywood' });
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: (ceilingCfg.sheetMaterial === 'plywood')
                              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(217, 119, 6, 0.45))'
                              : 'rgba(15, 23, 42, 0.7)',
                            border: (ceilingCfg.sheetMaterial === 'plywood')
                              ? '1.5px solid #fbbf24'
                              : '1px solid rgba(148, 163, 184, 0.3)',
                            color: (ceilingCfg.sheetMaterial === 'plywood') ? '#ffffff' : '#94a3b8',
                            boxShadow: (ceilingCfg.sheetMaterial === 'plywood') ? '0 0 10px rgba(245, 158, 11, 0.25)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>🪵</span>
                          <span>Compensado Naval</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Quando MDF é selecionado: abre opções específicas para os tipos de MDF */}
                    {(ceilingCfg.sheetMaterial !== 'plywood') ? (
                      <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.35)', animation: 'fadeIn 0.2s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🎨</span>
                            <span>Opções de Tipos / Padrões de MDF:</span>
                          </label>
                          <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                            Acabamento melamínico UV
                          </span>
                        </div>

                        <select
                          value={ceilingCfg.sheetMaterial || lastMdfType}
                          onChange={(e) => {
                            const val = e.target.value as CeilingSheetMaterial;
                            setLastMdfType(val);
                            setCeiling({ sheetMaterial: val });
                          }}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            background: '#0f172a',
                            color: '#ffffff',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          <option value="white_mdf">⚪ MDF Branco Ultra (Máxima Claridade & Reflexão de Luz)</option>
                          <option value="gray_mdf">🔘 MDF Cinza Grafite / Titânio (Visual Stealth Moderno)</option>
                          <option value="wood_mdf">🪵 MDF Carvalho / Freijó Amadeirado (Aconchego Clássico)</option>
                          <option value="black_mdf">⚫ MDF Preto Fosco / Black Matte (Estilo Industrial Premium)</option>
                          <option value="sand_mdf">📜 MDF Bege / Areia / Off-White (Ambiente Neutro Acolhedor)</option>
                        </select>

                        {/* Pílulas de seleção rápida com swatch de cor */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                          {[
                            { id: 'white_mdf', label: 'Branco Ultra', bg: '#f8fafc', text: '#0f172a' },
                            { id: 'gray_mdf', label: 'Cinza Grafite', bg: '#475569', text: '#ffffff' },
                            { id: 'wood_mdf', label: 'Freijó Madeira', bg: '#c89355', text: '#ffffff' },
                            { id: 'black_mdf', label: 'Preto Fosco', bg: '#1e293b', text: '#ffffff' },
                            { id: 'sand_mdf', label: 'Bege Areia', bg: '#dcd0c0', text: '#0f172a' }
                          ].map(swatch => {
                            const isCurrent = (ceilingCfg.sheetMaterial === swatch.id || (!ceilingCfg.sheetMaterial && swatch.id === 'white_mdf'));
                            return (
                              <button
                                key={swatch.id}
                                type="button"
                                onClick={() => {
                                  const val = swatch.id as CeilingSheetMaterial;
                                  setLastMdfType(val);
                                  setCeiling({ sheetMaterial: val });
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '9.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  background: isCurrent ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                                  border: isCurrent ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                                  color: isCurrent ? '#ffffff' : '#cbd5e1'
                                }}
                              >
                                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: swatch.bg, border: '1px solid rgba(0,0,0,0.3)', display: 'inline-block' }} />
                                {swatch.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>🪵</span>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>
                            Compensado Naval Impermeabilizado (100% Náutico)
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                            Lâminas de madeira nobre prensadas com cola fenólica naval WBP, resistente a vapor, condensação e umidade automotiva.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Espessura da Chapa & Divisão das Placas */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px', fontWeight: 700 }}>
                          Espessura da Chapa:
                        </label>
                        <select
                          value={ceilingCfg.thicknessMm || 9}
                          onChange={(e) => setCeiling({ thicknessMm: Number(e.target.value) })}
                          style={{
                            width: '100%',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            background: '#0f172a',
                            color: '#34d399',
                            border: '1px solid rgba(52, 211, 153, 0.4)',
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          <option value={6}>6 mm (Super Leve p/ Teto)</option>
                          <option value={9}>9 mm (Padrão Recomendado Doblò)</option>
                          <option value={12}>12 mm (Rigidez Reforçada)</option>
                          <option value={15}>15 mm (Chapa Espessa)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px', fontWeight: 700 }}>
                          Divisão das Placas:
                        </label>
                        <select
                          value={ceilingCfg.sheetPanels || 'single'}
                          onChange={(e) => setCeiling({ sheetPanels: e.target.value as any })}
                          style={{
                            width: '100%',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            background: '#0f172a',
                            color: '#ffffff',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            fontSize: '11px'
                          }}
                        >
                          <option value="single">Chapa Única Inteira ({ceilingW} × {ceilingL} mm)</option>
                          <option value="split_longitudinal">Bipartida Longitudinal (2 Chapas {Math.round(ceilingW / 2)} × {ceilingL} mm)</option>
                          <option value="split_transverse">Tripartida Transversal (3 Painéis {ceilingW} × {Math.round(ceilingL / 3)} mm)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

    </>
  );
};
