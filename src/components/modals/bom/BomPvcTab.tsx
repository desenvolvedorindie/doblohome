import React from 'react';
import { PvcCuttingPlanResult, PvcCutSegment } from '../../../utils/pvcUtils';

interface BomPvcTabProps {
  pvcStats: PvcCuttingPlanResult;
  pvcBarStandard: '6m' | '3m';
  setPvcBarStandard: (std: '6m' | '3m') => void;
}

export const BomPvcTab: React.FC<BomPvcTabProps> = ({
  pvcStats,
  pvcBarStandard,
  setPvcBarStandard
}) => {
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px', marginTop: '10px' }}>
      <div
        style={{
          marginBottom: '10px',
          padding: '10px 14px',
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(2, 132, 199, 0.24))',
          borderLeft: '4px solid #0ea5e9',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.5px' }}>
            💧 RESERVATÓRIO DE ÁGUA EM FORMATO U • Ø{pvcStats.diameterMm} mm ({pvcStats.totalCapacityL} LITROS)
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
            Tubulação contínua integrada internamente no quadro de ferro ao redor do baú • 2× Laterais ({pvcStats.singleLateralL}L cada) + Circuito Frontal ({pvcStats.frontCircuitL}L)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`btn-compact ${pvcBarStandard === '6m' ? 'active' : ''}`}
            onClick={() => setPvcBarStandard('6m')}
            style={{
              fontSize: '10px',
              padding: '4px 10px',
              fontWeight: 800,
              background: pvcBarStandard === '6m' ? 'rgba(14, 165, 233, 0.3)' : undefined,
              borderColor: pvcBarStandard === '6m' ? '#0ea5e9' : undefined,
              color: pvcBarStandard === '6m' ? '#38bdf8' : undefined
            }}
          >
            📦 Barra 6 Metros (Padrão)
          </button>
          <button
            className={`btn-compact ${pvcBarStandard === '3m' ? 'active' : ''}`}
            onClick={() => setPvcBarStandard('3m')}
            style={{
              fontSize: '10px',
              padding: '4px 10px',
              fontWeight: 800,
              background: pvcBarStandard === '3m' ? 'rgba(14, 165, 233, 0.3)' : undefined,
              borderColor: pvcBarStandard === '3m' ? '#0ea5e9' : undefined,
              color: pvcBarStandard === '3m' ? '#38bdf8' : undefined
            }}
          >
            📦 Barras 3 Metros (Varejo)
          </button>
        </div>
      </div>

      {/* Diagrama Visual de Corte Linear */}
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
          📐 Plano de Corte das Barras Comerciais de PVC ({pvcBarStandard === '6m' ? 'Barras de 6m' : 'Barras de 3m'}):
        </strong>

        {(pvcBarStandard === '6m' ? pvcStats.plan6m : pvcStats.plan3m).map((bar) => (
          <div
            key={bar.barIndex}
            style={{
              background: 'rgba(2, 6, 23, 0.75)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '6px',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
              <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                Barra #{bar.barIndex} ({bar.barLengthMm / 1000} m)
              </span>
              <span style={{ color: '#cbd5e1' }}>
                Cortes: <strong>{bar.usedMm} mm</strong> • Sobra: <strong style={{ color: '#94a3b8' }}>{bar.wasteMm} mm</strong> • Aproveitamento:{' '}
                <strong style={{ color: bar.efficiencyPct >= 80 ? '#4ade80' : '#fbbf24' }}>{bar.efficiencyPct}%</strong>
              </span>
            </div>

            <div
              style={{
                height: '36px',
                width: '100%',
                background: '#0b1120',
                borderRadius: '6px',
                overflow: 'hidden',
                display: 'flex',
                border: '1px solid rgba(148, 163, 184, 0.3)'
              }}
            >
              {bar.segments.map((seg: PvcCutSegment, sIdx: number) => {
                const isWaste = seg.label === 'Sobra Aproveitável';
                return (
                  <div
                    key={sIdx}
                    style={{
                      width: `${seg.pct}%`,
                      minWidth: seg.pct < 3 ? '14px' : undefined,
                      background: isWaste
                        ? 'repeating-linear-gradient(45deg, rgba(71, 85, 105, 0.35), rgba(71, 85, 105, 0.35) 6px, rgba(51, 65, 85, 0.5) 6px, rgba(51, 65, 85, 0.5) 12px)'
                        : seg.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      borderRight: sIdx < bar.segments.length - 1 ? '2px solid #0f172a' : undefined
                    }}
                    title={`${seg.label}: ${seg.lengthMm} mm (${seg.pct}%)`}
                  >
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        color: isWaste ? '#94a3b8' : '#ffffff',
                        textShadow: isWaste ? undefined : '0 1px 2px rgba(0,0,0,0.8)'
                      }}
                    >
                      {seg.pct >= 10 ? `${seg.label} (${seg.lengthMm}mm)` : `${seg.lengthMm}mm`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tabela Completa de Cortes de Tubos de PVC */}
      <div
        style={{
          marginBottom: '6px',
          padding: '7px 10px',
          background: 'rgba(14, 165, 233, 0.12)',
          borderLeft: '3px solid #0ea5e9',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#38bdf8'
        }}
      >
        📏 LISTA DE CORTES DE TUBOS PVC ({pvcStats.totalPieces} PEÇAS • {pvcStats.totalLinearMeters} METROS)
      </div>
      <table className="bom-table" style={{ marginBottom: '18px' }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Identificação da Tubulação</th>
            <th>Especificação do Tubo</th>
            <th>Medida de Corte (mm)</th>
            <th>Qtd</th>
            <th>Total Linear</th>
            <th>Fixação e Montagem</th>
          </tr>
        </thead>
        <tbody>
          {pvcStats.cutItems.map((c, idx) => (
            <tr key={c.key}>
              <td style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>{idx + 1}</td>
              <td><strong style={{ color: '#f8fafc' }}>{c.label}</strong></td>
              <td style={{ color: '#38bdf8' }}>{c.spec}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>{c.lengthMm} mm</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f59e0b' }}>{c.qty} un</td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>{c.totalLengthM.toFixed(2)} m</td>
              <td style={{ color: '#94a3b8', fontSize: '10.5px' }}>{c.notes}</td>
            </tr>
          ))}
          <tr style={{ background: 'rgba(14, 165, 233, 0.12)', fontWeight: 800 }}>
            <td colSpan={4} style={{ color: '#38bdf8' }}>TOTAL GERAL TUBOS PVC</td>
            <td style={{ fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>{pvcStats.totalPieces} un</td>
            <td style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>{pvcStats.totalLinearMeters.toFixed(2)} m</td>
            <td style={{ color: '#cbd5e1', fontSize: '10.5px' }}>Volume total: {pvcStats.totalCapacityL} Litros</td>
          </tr>
        </tbody>
      </table>

      {/* Tabela de Conexões e Ferragens Hidráulicas */}
      <div
        style={{
          marginBottom: '6px',
          padding: '7px 10px',
          background: 'rgba(56, 189, 248, 0.12)',
          borderLeft: '3px solid #38bdf8',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#38bdf8'
        }}
      >
        🔧 CONEXÕES & ACESSÓRIOS HIDRÁULICOS NECESSÁRIOS ({pvcStats.fittings.length} ITENS)
      </div>
      <table className="bom-table">
        <thead>
          <tr>
            <th>Componente Hidráulico</th>
            <th>Especificação Técnica</th>
            <th>Qtd</th>
            <th>Função & Aplicação no Veículo</th>
          </tr>
        </thead>
        <tbody>
          {pvcStats.fittings.map((f) => (
            <tr key={f.key}>
              <td><strong style={{ color: '#f8fafc' }}>{f.label}</strong></td>
              <td style={{ color: '#38bdf8' }}>{f.spec}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#4ade80' }}>
                {f.qty} {f.unit}
              </td>
              <td style={{ color: '#cbd5e1', fontSize: '10.5px' }}>{f.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
