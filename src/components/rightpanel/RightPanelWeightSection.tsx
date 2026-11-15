import { RightPanelWeightChips } from './RightPanelWeightChips';
import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { useRackWeightAndHeight } from './useRackWeightAndHeight';

export const RightPanelWeightSection: React.FC = () => {
  const {
    stackLevels,
    cargoBox,
    openModal,
    waterTank,
    awning,
    structureMaterial,
  } = useSolar();

  const {
    isWaterWeightFull,
    setIsWaterWeightFull,
    showWeightDetails,
    setShowWeightDetails,
    rackWeightStats,
    rackHeightStats,
  } = useRackWeightAndHeight();

  return (
    <>
          {/* ⚖️ ESTIMATIVA DE PESO & GABARITO DO RACK (TETO DA FIAT DOBLÒ) */}
          <div
            className="cargo-box-panel"
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: `1px solid ${rackWeightStats.pctDynamic > 100
                ? 'rgba(239, 68, 68, 0.55)'
                : rackHeightStats.isAboveLimit || rackWeightStats.pctDynamic > 80
                  ? 'rgba(245, 158, 11, 0.45)'
                  : 'rgba(56, 189, 248, 0.4)'
                }`,
              borderRadius: '8px',
              padding: '11px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)'
            }}
          >
            {/* Cabeçalho do Card: Sem estourar, flexWrap e badge compacta */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '6px',
                marginBottom: '2px'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color:
                    rackWeightStats.pctDynamic > 100
                      ? '#f87171'
                      : rackWeightStats.pctDynamic > 80 || rackHeightStats.isAboveLimit
                        ? '#fbbf24'
                        : '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>⚖️</span>
                <span>PESO & ALTURA DO RACK (DOBLÒ)</span>
              </div>
              <div
                style={{
                  background:
                    rackWeightStats.pctDynamic > 100
                      ? 'rgba(239, 68, 68, 0.25)'
                      : rackWeightStats.pctDynamic > 80
                        ? 'rgba(245, 158, 11, 0.25)'
                        : 'rgba(16, 185, 129, 0.2)',
                  color:
                    rackWeightStats.pctDynamic > 100
                      ? '#fca5a5'
                      : rackWeightStats.pctDynamic > 80
                        ? '#fbbf24'
                        : '#34d399',
                  border: `1px solid ${rackWeightStats.pctDynamic > 100
                    ? 'rgba(239, 68, 68, 0.5)'
                    : rackWeightStats.pctDynamic > 80
                      ? 'rgba(245, 158, 11, 0.5)'
                      : 'rgba(16, 185, 129, 0.4)'
                    }`,
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  lineHeight: '1.4'
                }}
              >
                {rackWeightStats.pctDynamic > 100
                  ? `⚠️ Excede Rodovia (+${Math.round(rackWeightStats.activeTotal - 100)} kg)`
                  : `${rackWeightStats.pctDynamic}% da Capacidade`}
              </div>
            </div>

            {/* Destaque Principal Duplo: Peso no Teto + Altura do Conjunto */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px'
              }}
            >
              {/* Bloco 1: Peso Total no Teto */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  padding: '8px 9px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ⚖️ Peso no Teto
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '2px' }}>
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        fontFamily: 'var(--font-mono)',
                        color:
                          rackWeightStats.pctDynamic > 100
                            ? '#f87171'
                            : rackWeightStats.pctDynamic > 80
                              ? '#fbbf24'
                              : '#38bdf8',
                        letterSpacing: '-0.5px'
                      }}
                    >
                      {rackWeightStats.activeTotal}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>kg</span>
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#94a3b8', marginTop: '1px' }}>
                    {waterTank.enabled
                      ? (isWaterWeightFull ? 'Tanque cheio' : 'Tanque seco')
                      : 'Total no teto'}
                  </div>
                </div>

                {/* Alternador de Água compacto */}
                {waterTank.enabled && (
                  <div style={{ display: 'flex', gap: '2px', marginTop: '5px' }}>
                    <button
                      type="button"
                      className={`btn-compact ${isWaterWeightFull ? 'active' : ''}`}
                      onClick={() => setIsWaterWeightFull(true)}
                      style={{ fontSize: '8.5px', padding: '2px 4px', flex: 1 }}
                      title="Considera água 100% cheia nos canos em U"
                    >
                      💧 Cheio
                    </button>
                    <button
                      type="button"
                      className={`btn-compact ${!isWaterWeightFull ? 'active accent-amber' : ''}`}
                      onClick={() => setIsWaterWeightFull(false)}
                      style={{ fontSize: '8.5px', padding: '2px 4px', flex: 1 }}
                      title="Considera canos vazios (apenas tubos PVC)"
                    >
                      🏜️ Seco
                    </button>
                  </div>
                )}
              </div>

              {/* Bloco 2: Altura do Conjunto no Teto */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  padding: '8px 9px',
                  borderRadius: '6px',
                  border: `1px solid ${rackHeightStats.isAboveLimit
                    ? 'rgba(239, 68, 68, 0.35)'
                    : 'rgba(255, 255, 255, 0.08)'
                    }`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    📏 Altura Carga
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '2px' }}>
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        fontFamily: 'var(--font-mono)',
                        color: rackHeightStats.isAboveLimit ? '#f87171' : '#34d399',
                        letterSpacing: '-0.5px'
                      }}
                    >
                      {rackHeightStats.totalRackHeightCm}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>cm</span>
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#94a3b8', marginTop: '1px' }}>
                    Limite CONTRAN: 50 cm
                  </div>
                </div>

                {/* Badge de Altura vs Legislação */}
                <div
                  style={{
                    marginTop: '5px',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    background: rackHeightStats.isAboveLimit ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                    border: `1px solid ${rackHeightStats.isAboveLimit ? 'rgba(239, 68, 68, 0.45)' : 'rgba(16, 185, 129, 0.3)'}`,
                    fontSize: '8.5px',
                    fontWeight: 800,
                    color: rackHeightStats.isAboveLimit ? '#fca5a5' : '#86efac',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={`Resolução CONTRAN nº 955/2022 (Art. 5º) limita carga no teto a 50 cm. Atual: ${rackHeightStats.totalRackHeightCm} cm.`}
                >
                  {rackHeightStats.isAboveLimit
                    ? `⚠️ +${rackHeightStats.pctAbove}% vs CONTRAN`
                    : `✅ Regular (máx 50cm)`}
                </div>
              </div>
            </div>

            {/* Barra 1: Limite de Carga no Teto (100 kg Dinâmico Fiat) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', marginBottom: '3px' }}>
                <span>Carga no Teto (Limite Rodovia):</span>
                <span style={{ fontWeight: 700, color: rackWeightStats.pctDynamic > 100 ? '#f87171' : '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                  {rackWeightStats.activeTotal} kg / 100 kg
                </span>
              </div>
              <div
                style={{
                  position: 'relative',
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (rackWeightStats.activeTotal / 150) * 100)}%`,
                    background:
                      rackWeightStats.pctDynamic > 100
                        ? 'linear-gradient(90deg, #38bdf8 0%, #fbbf24 66%, #ef4444 100%)'
                        : rackWeightStats.pctDynamic > 80
                          ? 'linear-gradient(90deg, #38bdf8 0%, #fbbf24 100%)'
                          : 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#64748b', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                <span>0 kg</span>
                <span>50 kg</span>
                <span style={{ color: '#fbbf24' }}>100 kg (Teto Doblò)</span>
                <span>150 kg</span>
              </div>
            </div>

            {/* Barra 2: Altura do Conjunto no Teto (Limite CONTRAN 50 cm - Res. 955/2022) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', marginBottom: '3px' }}>
                <span>Altura no Teto (CONTRAN Res. 955/22):</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: rackHeightStats.isAboveLimit ? '#f87171' : '#34d399',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {rackHeightStats.totalRackHeightCm} cm / 50 cm{' '}
                  <span style={{ fontSize: '8.5px', fontWeight: 800 }}>
                    ({rackHeightStats.isAboveLimit ? `+${rackHeightStats.pctAbove}% acima` : `${rackHeightStats.pctOfLimit}%`})
                  </span>
                </span>
              </div>
              <div
                style={{
                  position: 'relative',
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (rackHeightStats.totalRackHeightCm / 75) * 100)}%`,
                    background:
                      rackHeightStats.isAboveLimit
                        ? 'linear-gradient(90deg, #34d399 0%, #fbbf24 60%, #ef4444 100%)'
                        : 'linear-gradient(90deg, #059669, #34d399)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#64748b', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                <span>0 cm</span>
                <span>25 cm</span>
                <span style={{ color: rackHeightStats.isAboveLimit ? '#f87171' : '#fbbf24' }}>50 cm (Limite Legal)</span>
                <span>75 cm</span>
              </div>
            </div>

            {/* Banner de Altura Total Veículo + Conjunto (Garagens, Balsas e Pedágios) */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '6px',
                padding: '5px 8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '9px'
              }}
            >
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🚗</span>
                <span><strong>Altura Total Doblò + Rack:</strong></span>
              </span>
              <span
                style={{
                  fontWeight: 800,
                  color: rackHeightStats.totalVehicleHeightM > 2.30 ? '#fbbf24' : '#38bdf8',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px'
                }}
                title="Doblò de fábrica: 1.84 m + Conjunto no teto. Atenção a garagens e cancelas ≤ 2.20 m."
              >
                {rackHeightStats.totalVehicleHeightM} m ({rackHeightStats.totalVehicleHeightCm} cm)
              </span>
            </div>

            <RightPanelWeightChips
              rackWeightStats={rackWeightStats}
              openModal={openModal}
              showWeightDetails={showWeightDetails}
              setShowWeightDetails={setShowWeightDetails}
              rackHeightStats={rackHeightStats}
            />
          </div>

          <div className="expansion-widget-divider"></div>
        </>
      );
    };
