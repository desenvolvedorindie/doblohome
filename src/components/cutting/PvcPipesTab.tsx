import React from 'react';
import { PvcCuttingPlanResult } from '../../utils/pvcUtils';

export interface PvcPipesTabProps {
  waterTankEnabled: boolean;
  setWaterTankEnabled: (enabled: boolean) => void;
  pvcStats: PvcCuttingPlanResult;
  pvcBarStandard: '6m' | '3m';
  setPvcBarStandard: (val: '6m' | '3m') => void;
  flashToast?: (msg: string) => void;
  setPartsFilter: (filter: any) => void;
  setViewMode: (mode: any) => void;
}

export const PvcPipesTab: React.FC<PvcPipesTabProps> = ({
  waterTankEnabled,
  setWaterTankEnabled,
  pvcStats,
  pvcBarStandard,
  setPvcBarStandard,
  flashToast,
  setPartsFilter,
  setViewMode
}) => {
  if (!waterTankEnabled) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div
          style={{
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '28px' }}>💧</span>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
            Reservatório de Água Potável em U Desativado
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '420px', lineHeight: 1.5 }}>
            O sistema de caixa d'água contínua em formato U instalada internamente no quadro de ferro ao redor do baú de teto está desativado no configurador.
          </div>
          <button
            className="btn-compact primary"
            onClick={() => setWaterTankEnabled(true)}
            style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
          >
            💧 Ativar Reservatório de Água (Ø{pvcStats.diameterMm}mm • {pvcStats.totalCapacityL}L)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* Resumo Geral de Capacidade & Metragem */}
      <div
        style={{
          padding: '10px 12px',
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.16), rgba(2, 132, 199, 0.24))',
          borderRadius: '8px',
          border: '1px solid rgba(14, 165, 233, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>💧</span>
            <div>
              <strong style={{ fontSize: '12px', color: '#38bdf8' }}>
                CAIXA D'ÁGUA EM U • Ø{pvcStats.diameterMm} mm ({pvcStats.totalCapacityL} Litros)
              </strong>
              <div style={{ fontSize: '10px', color: '#cbd5e1' }}>
                2× Laterais ({pvcStats.singleLateralL}L cada) + 1× Circuito Frontal ({pvcStats.frontCircuitL}L) • 100% Embutido no Ferro
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn-compact"
              onClick={() => {
                const activePlan = pvcBarStandard === '6m' ? pvcStats.plan6m : pvcStats.plan3m;
                const lines = [
                  `=== PLANO DE CORTE - TUBOS PVC CAIXA D'ÁGUA EM U (DOBLÒ) ===`,
                  `Reservatório Contínuo ao Redor do Baú: Ø${pvcStats.diameterMm} mm | Capacidade: ${pvcStats.totalCapacityL} Litros`,
                  `Extensão Linear Total: ${pvcStats.totalLinearMeters} m | Padrão Selecionado: Barras de ${pvcBarStandard}`,
                  `Total de Barras Necessárias: ${activePlan.length} barra(s) de ${pvcBarStandard}`,
                  ``,
                  `--- APROVEITAMENTO DAS BARRAS COMERCIAIS (${pvcBarStandard}) ---`,
                  ...activePlan.map((b) => {
                    const cutsStr = b.segments
                      .filter((s) => s.label !== 'Sobra Aproveitável')
                      .map((s) => `${s.label} (${s.lengthMm}mm)`)
                      .join(' + ');
                    return `Barra #${b.barIndex} (${b.barLengthMm / 1000}m): [ ${cutsStr} ] | Sobra: ${b.wasteMm}mm (${b.efficiencyPct}% aproveitamento)`;
                  }),
                  ``,
                  `--- LISTA DE CORTES DE TUBOS PVC ---`,
                  ...pvcStats.cutItems.map((c, i) => `${i + 1}. ${c.label}: ${c.lengthMm} mm (Qtd: ${c.qty} un • ${c.spec}) - ${c.notes}`),
                  ``,
                  `--- CONEXÕES E ACESSÓRIOS HIDRÁULICOS ---`,
                  ...pvcStats.fittings.map((f) => `• ${f.label}: ${f.qty} ${f.unit} (${f.spec}) - ${f.notes}`)
                ];
                navigator.clipboard.writeText(lines.join('\n'));
                flashToast?.(`✅ Plano de corte dos canos de PVC copiado!`);
              }}
              style={{ fontSize: '9.5px', padding: '3px 8px', fontWeight: 700 }}
              title="Copiar relatório e lista de corte dos canos de PVC"
            >
              📋 Copiar Plano
            </button>
            <button
              className="btn-compact primary"
              onClick={() => {
                setPartsFilter('pvc');
                setViewMode('bars_lineup');
              }}
              style={{ fontSize: '9.5px', padding: '3px 8px', fontWeight: 800 }}
              title="Ver os tubos de PVC alinhados na bancada 3D no solo"
            >
              📏 Ver no 3D
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '6px',
            marginTop: '4px'
          }}
        >
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
            <span style={{ color: '#94a3b8' }}>Total Cortes Reta:</span>{' '}
            <strong style={{ color: '#f8fafc' }}>{pvcStats.totalPieces} peças ({pvcStats.totalLinearMeters} m)</strong>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
            <span style={{ color: '#94a3b8' }}>Barras Comerciais:</span>{' '}
            <strong style={{ color: '#4ade80' }}>
              {pvcBarStandard === '6m' ? `${pvcStats.plan6m.length} barra de 6m` : `${pvcStats.plan3m.length} barras de 3m`}
            </strong>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
            <span style={{ color: '#94a3b8' }}>Diâmetro / Raio:</span>{' '}
            <strong style={{ color: '#38bdf8' }}>Ø{pvcStats.diameterMm} mm (R={pvcStats.radiusMm} mm)</strong>
          </div>
        </div>
      </div>

      {/* Seletor de Padrão de Barra: 6m vs 3m */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: '8px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <strong style={{ fontSize: '11.5px', color: '#f8fafc' }}>
            📐 Diagrama de Aproveitamento das Barras de PVC:
          </strong>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className={`btn-compact ${pvcBarStandard === '6m' ? 'active' : ''}`}
              onClick={() => setPvcBarStandard('6m')}
              style={{
                fontSize: '9.5px',
                padding: '3px 8px',
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
                fontSize: '9.5px',
                padding: '3px 8px',
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

        {/* Renderização Visual de cada Barra de Corte Linear */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px' }}>
              <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                Barra #{bar.barIndex} ({bar.barLengthMm / 1000} m)
              </span>
              <span style={{ color: '#cbd5e1', fontSize: '10px' }}>
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
                position: 'relative'
              }}
            >
              {bar.segments.map((seg, sIdx) => {
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
                      borderRight: sIdx < bar.segments.length - 1 ? '2px solid #0f172a' : undefined,
                      boxShadow: isWaste ? undefined : 'inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                    title={`${seg.label}: ${seg.lengthMm} mm (${seg.pct}%)`}
                  >
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        color: isWaste ? '#94a3b8' : '#ffffff',
                        textShadow: isWaste ? undefined : '0 1px 2px rgba(0,0,0,0.8)'
                      }}
                    >
                      {seg.pct >= 12 ? `${seg.label} (${seg.lengthMm}mm)` : seg.pct >= 6 ? `${seg.lengthMm}mm` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tabela Detalhada de Cortes dos Tubos de PVC */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: '8px',
          padding: '10px'
        }}
      >
        <strong style={{ fontSize: '11.5px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
          📏 Lista de Cortes dos Tubos de PVC ({pvcStats.totalPieces} peças):
        </strong>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '4px 6px' }}>#</th>
                <th style={{ padding: '4px 6px' }}>Identificação</th>
                <th style={{ padding: '4px 6px' }}>Diâmetro</th>
                <th style={{ padding: '4px 6px' }}>Comprimento</th>
                <th style={{ padding: '4px 6px' }}>Qtd</th>
                <th style={{ padding: '4px 6px' }}>Metros</th>
                <th style={{ padding: '4px 6px' }}>Instalação</th>
              </tr>
            </thead>
            <tbody>
              {pvcStats.cutItems.map((c, idx) => (
                <tr key={c.key} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                  <td style={{ padding: '4px 6px', color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ padding: '4px 6px', fontWeight: 600, color: '#f8fafc' }}>{c.label}</td>
                  <td style={{ padding: '4px 6px', color: '#38bdf8' }}>Ø{c.diameterMm} mm</td>
                  <td style={{ padding: '4px 6px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                    {c.lengthMm} mm
                  </td>
                  <td style={{ padding: '4px 6px', fontWeight: 700, color: '#f59e0b' }}>{c.qty}</td>
                  <td style={{ padding: '4px 6px', fontFamily: 'var(--font-mono)' }}>{c.totalLengthM.toFixed(2)} m</td>
                  <td style={{ padding: '4px 6px', color: '#94a3b8', fontSize: '10px' }}>{c.notes}</td>
                </tr>
              ))}
              <tr style={{ background: 'rgba(14, 165, 233, 0.12)', fontWeight: 800 }}>
                <td colSpan={4} style={{ padding: '6px', color: '#38bdf8' }}>
                  TOTAL TUBULAÇÃO PVC RETILÍNEA
                </td>
                <td style={{ padding: '6px', color: '#f59e0b' }}>{pvcStats.totalPieces} un</td>
                <td style={{ padding: '6px', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                  {pvcStats.totalLinearMeters.toFixed(2)} m
                </td>
                <td style={{ padding: '6px', color: '#cbd5e1', fontSize: '10px' }}>
                  Capacidade útil: {pvcStats.totalCapacityL} L
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Conexões e Acessórios Hidráulicos para Montagem */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: '8px',
          padding: '10px'
        }}
      >
        <strong style={{ fontSize: '11.5px', color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
          🔧 Conexões & Acessórios Hidráulicos Necessários ({pvcStats.fittings.length} itens):
        </strong>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '4px 6px' }}>Conexão / Acessório</th>
                <th style={{ padding: '4px 6px' }}>Especificação</th>
                <th style={{ padding: '4px 6px' }}>Qtd</th>
                <th style={{ padding: '4px 6px' }}>Função & Aplicação</th>
              </tr>
            </thead>
            <tbody>
              {pvcStats.fittings.map((f) => (
                <tr key={f.key} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                  <td style={{ padding: '4px 6px', fontWeight: 600, color: '#f8fafc' }}>{f.label}</td>
                  <td style={{ padding: '4px 6px', color: '#38bdf8' }}>{f.spec}</td>
                  <td style={{ padding: '4px 6px', fontWeight: 700, color: '#4ade80' }}>
                    {f.qty} {f.unit}
                  </td>
                  <td style={{ padding: '4px 6px', color: '#94a3b8', fontSize: '10px' }}>{f.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
