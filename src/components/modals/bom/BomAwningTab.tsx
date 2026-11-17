import React, { useState } from 'react';
import { AwningHardwareStats } from '../../../utils/awningHardwareUtils';
import { AwningConfig } from '../../../types/awning';

interface BomAwningTabProps {
  awningStats: AwningHardwareStats;
  awning: AwningConfig;
}

export const BomAwningTab: React.FC<BomAwningTabProps> = ({
  awningStats,
  awning
}) => {
  const [barStandard, setBarStandard] = useState<'6m' | '3m'>('6m');
  const activePlan = barStandard === '6m' ? awningStats.plan6m : awningStats.plan3m;

  if (!awning.enabled) {
    return (
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div
          style={{
            maxWidth: '480px',
            textAlign: 'center',
            padding: '24px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '36px' }}>⛺</span>
          <h4 style={{ margin: 0, color: '#fbbf24', fontSize: '15px', fontWeight: 800 }}>
            Toldo Retrátil Desativado
          </h4>
          <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.5 }}>
            O toldo retrátil está desativado no menu da Doblò (aba Acessórios). Ative-o no menu da Doblò para incluir a lista de ferragens, mancais, parafusos e o plano de corte de perfis de alumínio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px', marginTop: '10px' }}>
      {/* Header Resumo */}
      <div
        style={{
          marginBottom: '10px',
          padding: '10px 14px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.24))',
          borderLeft: '4px solid #f59e0b',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.5px' }}>
            ⛺ FERRAGEM DO TOLDO OVERLAND — {awningStats.typeLabel.toUpperCase()}
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
            Cálculo separado • {awningStats.sideLabel} • {awningStats.totalProfilePieces} cortes ({awningStats.totalLinearMeters} m de alumínio) • Peso Total: {awningStats.totalAwningWeightKg} kg
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            className={`btn-compact ${barStandard === '6m' ? 'active' : ''}`}
            onClick={() => setBarStandard('6m')}
            style={{
              fontSize: '10px',
              padding: '4px 10px',
              fontWeight: 800,
              background: barStandard === '6m' ? 'rgba(245, 158, 11, 0.3)' : undefined,
              borderColor: barStandard === '6m' ? '#f59e0b' : undefined,
              color: barStandard === '6m' ? '#fbbf24' : undefined
            }}
          >
            📦 Barra 6 Metros (Padrão)
          </button>
          <button
            className={`btn-compact ${barStandard === '3m' ? 'active' : ''}`}
            onClick={() => setBarStandard('3m')}
            style={{
              fontSize: '10px',
              padding: '4px 10px',
              fontWeight: 800,
              background: barStandard === '3m' ? 'rgba(245, 158, 11, 0.3)' : undefined,
              borderColor: barStandard === '3m' ? '#f59e0b' : undefined,
              color: barStandard === '3m' ? '#fbbf24' : undefined
            }}
          >
            📦 Barras 3 Metros (Varejo)
          </button>
        </div>
      </div>

      {/* Diagrama Visual das Barras de Alumínio Fatiadas */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <strong style={{ fontSize: '12px', color: '#f8fafc' }}>
          📐 Plano de Corte Otimizado das Barras de Alumínio ({barStandard === '6m' ? 'Barras de 6m' : 'Barras de 3m'}):
        </strong>

        {activePlan.map((bar) => (
          <div
            key={bar.barIndex}
            style={{
              background: 'rgba(2, 6, 23, 0.75)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '6px',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
              <span style={{ fontWeight: 800, color: '#fbbf24' }}>
                Barra #{bar.barIndex} ({bar.barLengthMm / 1000} m)
              </span>
              <span style={{ color: '#cbd5e1', fontSize: '10.5px' }}>
                Cortes: <strong>{bar.usedMm} mm</strong> • Sobra: <strong style={{ color: '#94a3b8' }}>{bar.wasteMm} mm</strong> • Aproveitamento:{' '}
                <strong style={{ color: bar.efficiencyPct >= 80 ? '#4ade80' : '#fbbf24' }}>{bar.efficiencyPct}%</strong>
              </span>
            </div>

            <div
              style={{
                height: '34px',
                width: '100%',
                background: '#0b1120',
                borderRadius: '6px',
                overflow: 'hidden',
                display: 'flex',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {bar.segments.map((seg, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    width: `${seg.pct}%`,
                    height: '100%',
                    background: seg.isWaste
                      ? 'repeating-linear-gradient(45deg, rgba(71,85,105,0.4), rgba(71,85,105,0.4) 6px, rgba(51,65,85,0.5) 6px, rgba(51,65,85,0.5) 12px)'
                      : seg.color,
                    borderRight: sIdx < bar.segments.length - 1 ? '1.5px solid #0f172a' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    position: 'relative'
                  }}
                  title={`${seg.label}: ${seg.lengthMm} mm (${seg.pct}%)`}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: seg.isWaste ? '#94a3b8' : '#0f172a',
                      textShadow: seg.isWaste ? 'none' : '0 1px 2px rgba(255,255,255,0.4)'
                    }}
                  >
                    {seg.lengthMm} mm
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '10px', color: '#cbd5e1' }}>
              {bar.segments.map((seg, sIdx) => (
                <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '2px',
                      background: seg.color,
                      display: 'inline-block'
                    }}
                  />
                  <span>
                    {seg.label} (<strong>{seg.lengthMm} mm</strong>)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tabela de Cortes de Perfis */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
          📋 Detalhamento dos Cortes dos Perfis de Alumínio ({awningStats.totalProfilePieces} peças):
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.25)', color: '#94a3b8' }}>
              <th style={{ padding: '6px 8px' }}>Peça / Aplicação</th>
              <th style={{ padding: '6px 8px' }}>Perfil Comercial</th>
              <th style={{ padding: '6px 8px', textAlign: 'center' }}>Qtd</th>
              <th style={{ padding: '6px 8px', textAlign: 'right' }}>Comprimento</th>
              <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total Linear</th>
              <th style={{ padding: '6px 8px', textAlign: 'right' }}>Peso Estimado</th>
            </tr>
          </thead>
          <tbody>
            {awningStats.profileItems.map((p) => (
              <tr key={p.key} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '6px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '2px',
                        background: p.color,
                        display: 'inline-block',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <strong style={{ color: '#f8fafc' }}>{p.label}</strong>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>{p.purpose}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '6px 8px', color: '#cbd5e1' }}>{p.spec}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800, color: '#fbbf24' }}>
                  {p.qty} un
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>
                  {p.lengthMm} mm
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', color: '#cbd5e1' }}>{p.totalLengthM} m</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', color: '#4ade80' }}>{p.totalWeightKg} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tabela de Ferragens e Acessórios */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: '8px',
          padding: '12px'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#a78bfa', marginBottom: '8px' }}>
          🔩 Lista de Ferragens, Mancais, Suportes e Parafusos (Separada):
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.25)', color: '#94a3b8' }}>
              <th style={{ padding: '6px 8px' }}>Componente</th>
              <th style={{ padding: '6px 8px' }}>Especificação</th>
              <th style={{ padding: '6px 8px' }}>Material</th>
              <th style={{ padding: '6px 8px', textAlign: 'center' }}>Qtd</th>
              <th style={{ padding: '6px 8px' }}>Finalidade</th>
            </tr>
          </thead>
          <tbody>
            {awningStats.fittings.map((f) => (
              <tr key={f.key} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '6px 8px', fontWeight: 700, color: '#f8fafc' }}>{f.label}</td>
                <td style={{ padding: '6px 8px', color: '#cbd5e1' }}>{f.spec}</td>
                <td style={{ padding: '6px 8px', color: '#38bdf8' }}>{f.material}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800, color: '#fbbf24' }}>
                  {f.qty} {f.unit}
                </td>
                <td style={{ padding: '6px 8px', color: '#94a3b8', fontSize: '9.5px' }}>{f.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
