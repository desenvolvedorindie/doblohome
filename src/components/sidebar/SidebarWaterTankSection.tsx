import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const SidebarWaterTankSection: React.FC = () => {
  const {
    waterTank,
    setWaterTankEnabled,
    setWaterTankLength,
    setWaterTankRadius,
    setWaterTankConnectionPosition,
  } = useSolar();

  const baseMaxLengthMm = 2200;
  const pipeRadiusMm = Math.round(waterTank.diameterMm / 2);
  const pipeDiameterMm = waterTank.diameterMm;
  const pipeRadiusDm = pipeRadiusMm / 100;
  const pipeRadiusM = pipeRadiusMm / 1000;
  const frameInnerX = 0.70 - 0.04;
  const pipeOffsetX = frameInnerX - pipeRadiusM;
  const bendR = Math.max(0.06, pipeRadiusM * 1.35);
  const frontPipeSpanM = Math.max(0.20, (pipeOffsetX - bendR) * 2);
  const frontCircuitAddonM = frontPipeSpanM + Math.PI * bendR;
  const singlePipeLiters = +(Math.PI * pipeRadiusDm * pipeRadiusDm * (waterTank.lengthMm / 100)).toFixed(1);
  const frontCircuitLiters = +(Math.PI * pipeRadiusDm * pipeRadiusDm * (frontCircuitAddonM * 10)).toFixed(1);
  const totalWaterLiters = +(singlePipeLiters * 2 + frontCircuitLiters).toFixed(1);
  const litersPerMeterSingle = +(Math.PI * pipeRadiusDm * pipeRadiusDm * 10).toFixed(1);
  const litersPerMeterTotal = +(litersPerMeterSingle * 2).toFixed(1);
  const baseLengthOccupationPct = Math.round((waterTank.lengthMm / baseMaxLengthMm) * 100);

  return (
      <div className="panel-section">
        <div className="section-label">
          <span>💧 CAIXA D'ÁGUA EM U (2× Joelhos 90° · Ø{pipeDiameterMm}mm)</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 800,
              color: waterTank.enabled ? '#38bdf8' : 'var(--text-muted)'
            }}
          >
            {waterTank.enabled ? `${totalWaterLiters.toFixed(1)} L` : 'Desativada'}
          </span>
        </div>

        {/* Checkbox principal para incluir/remover a caixa d'água em U */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '9px 10px',
            borderRadius: '8px',
            cursor: 'pointer',
            background: waterTank.enabled ? 'rgba(14, 165, 233, 0.14)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${waterTank.enabled ? 'rgba(56, 189, 248, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
            marginBottom: waterTank.enabled ? '10px' : '0',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            type="checkbox"
            checked={waterTank.enabled}
            onChange={(e) => setWaterTankEnabled(e.target.checked)}
            style={{
              width: '16px',
              height: '16px',
              accentColor: '#0ea5e9',
              cursor: 'pointer',
              flexShrink: 0
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: waterTank.enabled ? '#f8fafc' : '#94a3b8' }}>
              Caixa d'Água em U (100% Dentro do Ferro · Ø{pipeDiameterMm}mm)
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              2 canos laterais + 1 frontal + 2 joelhos de 90° em volta do baú • 100% embutida no subchassi
            </span>
          </div>
        </label>

        {waterTank.enabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 1. Seleção do Raio Fixo do Cano */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Raio do Cano:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
                  Raio {pipeRadiusMm} mm (Ø{pipeDiameterMm} mm)
                </span>
              </div>

              {/* Botões de Raio Fixo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
                {[50, 75, 100, 125, 150].map((rMm) => (
                  <button
                    key={rMm}
                    type="button"
                    className={`btn-compact ${pipeRadiusMm === rMm ? 'active' : ''}`}
                    onClick={() => setWaterTankRadius(rMm)}
                    style={{
                      fontSize: '10px',
                      padding: '6px 2px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    title={`Raio ${rMm}mm (Diâmetro Ø${rMm * 2}mm)`}
                  >
                    <strong>R{rMm}</strong>
                    <span style={{ fontSize: '8.5px', opacity: 0.8 }}>Ø{rMm * 2}mm</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Controle de Comprimento dos Canos (até o limite de 2200mm da base) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Comprimento dos Canos:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min={400}
                    max={baseMaxLengthMm}
                    step={50}
                    value={waterTank.lengthMm}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!Number.isNaN(val)) setWaterTankLength(val);
                    }}
                    style={{
                      width: '68px',
                      padding: '2px 5px',
                      fontSize: '11px',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: '#38bdf8',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                      borderRadius: '4px',
                      textAlign: 'right'
                    }}
                  />
                  <span style={{ fontSize: '10.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    / {baseMaxLengthMm} mm
                  </span>
                </div>
              </div>

              <input
                type="range"
                className="custom-slider"
                min="400"
                max={baseMaxLengthMm}
                step="50"
                value={waterTank.lengthMm}
                onChange={(e) => setWaterTankLength(parseFloat(e.target.value))}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>
                <span>Mín: 400 mm (0.40m)</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                  {(waterTank.lengthMm / 1000).toFixed(2)} m ({baseLengthOccupationPct}% da base)
                </span>
                <span>Máx Base: {baseMaxLengthMm} mm (2.20m)</span>
              </div>

              {/* Atalhos rápidos de medida */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '6px' }}>
                {[1000, 1500, 1800, 2200].map((presetMm) => (
                  <button
                    key={presetMm}
                    type="button"
                    className={`btn-compact ${waterTank.lengthMm === presetMm ? 'active' : ''}`}
                    onClick={() => setWaterTankLength(presetMm)}
                    style={{ fontSize: '10px', padding: '4px 2px' }}
                  >
                    {presetMm === 2200 ? '2200 (Máx)' : `${presetMm}mm`}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Posição da Conexão / Bocal (Frente ou Trás da estrutura do rack) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Posição da Conexão (Tê & Bocal):</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
                  {waterTank.connectionPosition === 'rear' ? 'Traseira (Porta-malas)' : 'Dianteira (Frente)'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button
                  type="button"
                  className={`btn-compact ${waterTank.connectionPosition !== 'rear' ? 'active' : ''}`}
                  onClick={() => setWaterTankConnectionPosition?.('front')}
                  style={{
                    fontSize: '10.5px',
                    padding: '7px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                  title="Posiciona a conexão transversal, Tê 90° e bocal na dianteira do rack"
                >
                  <span>🚗</span>
                  <strong>Dianteira (Frente)</strong>
                </button>
                <button
                  type="button"
                  className={`btn-compact ${waterTank.connectionPosition === 'rear' ? 'active' : ''}`}
                  onClick={() => setWaterTankConnectionPosition?.('rear')}
                  style={{
                    fontSize: '10.5px',
                    padding: '7px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                  title="Posiciona a conexão transversal, Tê 90° e bocal na traseira do rack (acesso fácil pelo porta-malas)"
                >
                  <span>🚪</span>
                  <strong>Traseira (Trás)</strong>
                </button>
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '4px' }}>
                {waterTank.connectionPosition === 'rear'
                  ? 'Conexão na traseira: abastecimento prático em pé no para-choque/porta-malas.'
                  : 'Conexão na dianteira: bocal posicionado na frente da van.'}
              </div>
            </div>

            {/* Especificação do conjunto Tê + CAP + Tampinha */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '6px',
                padding: '7px 9px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                fontSize: '9.5px'
              }}
            >
              <div style={{ color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>🔧</span> Montagem do Bocal: Tê 90° + Niple + CAP + Tampinha
              </div>
              <div style={{ color: '#94a3b8', lineHeight: 1.4 }}>
                • <strong>Tê 90°</strong> Ø{pipeDiameterMm}mm central dividindo o cano transversal em 2 peças.<br />
                • <strong>Niple vertical</strong> de união entre a bolsa superior do Tê e o CAP.<br />
                • <strong>CAP superior</strong> Ø{pipeDiameterMm}mm com <strong>tampinha hermética</strong> rosqueável no topo.
              </div>
            </div>

            {/* Card de Cálculo Automático de Capacidade de Água */}
            <div
              style={{
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '8px',
                padding: '9px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#bae6fd', fontWeight: 700 }}>
                  💧 Capacidade Total de Água (Circuito em U):
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#38bdf8'
                  }}
                >
                  {totalWaterLiters.toFixed(1)} Litros
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: '10px'
                }}
              >
                <div style={{ color: '#94a3b8' }}>
                  2× Laterais (Ø{pipeDiameterMm}):{' '}
                  <strong style={{ color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                    {(singlePipeLiters * 2).toFixed(1)} L
                  </strong>
                </div>
                <div style={{ color: '#94a3b8', textAlign: 'right' }}>
                  Peso da água cheio:{' '}
                  <strong style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                    ~{totalWaterLiters.toFixed(1)} kg
                  </strong>
                </div>
                <div style={{ color: '#94a3b8' }}>
                  Frontal + 2 Joelhos 90°:{' '}
                  <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    +{frontCircuitLiters.toFixed(1)} L
                  </strong>
                </div>
                <div style={{ color: '#94a3b8', textAlign: 'right' }}>
                  Montagem:{' '}
                  <strong style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                    100% interna ao ferro
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

  );
};
