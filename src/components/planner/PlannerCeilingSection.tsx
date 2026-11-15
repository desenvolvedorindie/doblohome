import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { CeilingConfig, CeilingLedConfig } from '../../types';
import { DEFAULT_CEILING_CONFIG } from '../../data/internalBoxesPresets';
import { PlannerCeilingMaterial } from './PlannerCeilingMaterial';
import { PlannerCeilingLighting } from './PlannerCeilingLighting';

export const PlannerCeilingSection: React.FC = () => {
  const { internalGrid, setCeiling, toggleCeiling3D } = useSolar();

  const ceilingCfg: CeilingConfig = internalGrid.ceiling || DEFAULT_CEILING_CONFIG;
  const isCeilingEnabled = ceilingCfg.enabled !== false;
  const isSlatted = (ceilingCfg.type || 'slatted') === 'slatted';
  const isCeilingVisible3D = ceilingCfg.visibleIn3D !== false;
  const ceilingOpacity = ceilingCfg.opacity ?? 1.0;

  const slatW = ceilingCfg.slatWidthMm || 40;
  const slatGap = ceilingCfg.slatGapMm || 10;
  const slatThick = ceilingCfg.slatThicknessMm || 12;
  const ceilingW = ceilingCfg.widthMm || internalGrid.widthMm;
  const ceilingL = ceilingCfg.lengthMm || internalGrid.lengthMm;
  const isTransverse = ceilingCfg.slatDirection === 'transverse';
  const pitch = slatW + slatGap;
  const calculatedSlatCount = isTransverse
    ? Math.max(1, Math.floor((ceilingL - slatGap) / pitch))
    : Math.max(1, Math.floor((ceilingW - slatGap) / pitch));
  const slatLength = isTransverse ? ceilingW : ceilingL;
  const totalSlatAreaM2 = ((calculatedSlatCount * slatW * slatLength) / 1_000_000).toFixed(2);

  return (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '12px',
              border: isCeilingEnabled ? '1.5px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(148, 163, 184, 0.25)',
              padding: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Cabeçalho da Seção */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🪵</span>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    TETO & FORRO DO CAMPERVAN
                  </div>
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                  Forro de teto acústico e térmico: ripado de madeira nobre ou chapa contínua (MDF / compensado) com LED
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {isCeilingEnabled && (
                  <button
                    onClick={toggleCeiling3D}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '5px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: isCeilingVisible3D ? '1px solid rgba(56, 189, 248, 0.4)' : '1.5px solid #fbbf24',
                      background: isCeilingVisible3D ? 'rgba(30, 41, 59, 0.6)' : 'rgba(217, 119, 6, 0.25)',
                      color: isCeilingVisible3D ? '#94a3b8' : '#fbbf24',
                      transition: 'all 0.15s ease'
                    }}
                    title={
                      isCeilingVisible3D
                        ? 'Ocultar teto no 3D para visualizar o interior dos baús por cima'
                        : 'Exibir teto no 3D'
                    }
                  >
                    <span>{isCeilingVisible3D ? '👁️' : '🙈'}</span>
                    <span>{isCeilingVisible3D ? 'Teto 3D Visível' : 'Teto 3D Oculto'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setCeiling({
                      enabled: !isCeilingEnabled
                    });
                  }}
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: 'none',
                    background: isCeilingEnabled
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                    boxShadow: isCeilingEnabled
                      ? '0 2px 8px rgba(239, 68, 68, 0.4)'
                      : '0 2px 8px rgba(245, 158, 11, 0.4)'
                  }}
                >
                  {isCeilingEnabled ? '🗑️ Desativar Teto' : '➕ Ativar Teto no Projeto'}
                </button>
              </div>
            </div>

            {!isCeilingEnabled ? (
              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.55, background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
                💡 <em>O teto do campervan isola termicamente a cabine da Doblò contra o calor do teto de metal, oferece acabamento de alto padrão (madeira ripada ou chapa lisa) e acomoda fita LED linear ou spots embutidos para iluminação geral do veículo. Clique no botão acima para incluir o teto no seu projeto.</em>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <PlannerCeilingMaterial
            ceilingCfg={ceilingCfg}
            calculatedSlatCount={calculatedSlatCount}
            totalSlatAreaM2={totalSlatAreaM2}
          />
                {/* 4. OPACIDADE NO 3D & AJUSTES DIMENSIONAIS */}
                <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.2)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {/* Curvatura Transversal do Teto */}
                  <div style={{ gridColumn: '1 / -1', background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#e2e8f0' }}>
                      <span style={{ fontWeight: 700, color: '#fbbf24' }}>
                        🏹 Curvatura do Teto (Arco Transversal da Doblò):
                      </span>
                      <strong style={{ color: (ceilingCfg.curvatureMm ?? 25) > 0 ? '#34d399' : '#94a3b8', fontSize: '11px' }}>
                        {(ceilingCfg.curvatureMm ?? 25) > 0 ? `${ceilingCfg.curvatureMm ?? 25} mm de Flecha (Abaulado)` : '0 mm (Totalmente Plano)'}
                      </strong>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={30}
                      step={5}
                      value={Math.min(30, ceilingCfg.curvatureMm ?? 25)}
                      onChange={(e) => setCeiling({ curvatureMm: Math.min(30, Number(e.target.value)) })}
                      style={{ width: '100%', marginTop: '6px' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                        Base de referência nas laterais mais baixas; o arco compensa subindo ao centro (+pé-direito)
                      </span>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[
                          { val: 0, label: '0mm (Plano)' },
                          { val: 10, label: '10mm (Leve)' },
                          { val: 20, label: '20mm (Médio)' },
                          { val: 25, label: '25mm (Doblò)' },
                          { val: 30, label: '30mm (Máx)' }
                        ].map((btn) => (
                          <button
                            key={btn.val}
                            onClick={() => setCeiling({ curvatureMm: btn.val })}
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              border: (ceilingCfg.curvatureMm ?? 25) === btn.val ? '1px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
                              background: (ceilingCfg.curvatureMm ?? 25) === btn.val ? 'rgba(245, 158, 11, 0.3)' : 'rgba(30, 41, 59, 0.5)',
                              color: (ceilingCfg.curvatureMm ?? 25) === btn.val ? '#ffffff' : '#94a3b8'
                            }}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Opacidade 3D */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
                      <span>Opacidade 3D:</span>
                      <strong style={{ color: '#38bdf8' }}>{Math.round(ceilingOpacity * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={Math.round(ceilingOpacity * 100)}
                      onChange={(e) => setCeiling({ opacity: Number(e.target.value) / 100 })}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                    <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
                      Reduza para ver através do teto no 3D
                    </div>
                  </div>

                  {/* Comprimento do Teto */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
                      <span>Comprimento:</span>
                      <strong style={{ color: '#38bdf8' }}>{ceilingL} mm</strong>
                    </div>
                    <input
                      type="range"
                      min={1200}
                      max={2200}
                      step={50}
                      value={ceilingL}
                      onChange={(e) => setCeiling({ lengthMm: Number(e.target.value) })}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>

                  {/* Largura do Teto */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
                      <span>Largura:</span>
                      <strong style={{ color: '#38bdf8' }}>{ceilingW} mm</strong>
                    </div>
                    <input
                      type="range"
                      min={1000}
                      max={1350}
                      step={25}
                      value={ceilingW}
                      onChange={(e) => setCeiling({ widthMm: Number(e.target.value) })}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                </div>

          <PlannerCeilingLighting ceilingCfg={ceilingCfg} />
              </div>
            )}
    </div>
  );
};
