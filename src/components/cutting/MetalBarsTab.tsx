import React from 'react';
import { extractBarStats } from '../../utils/woodUtils';

export interface MetalBarsTabProps {
  barStats: ReturnType<typeof extractBarStats>;
  weldedJointsReport: {
    totalJoints: number;
    miterCorners45: number;
    teeJoints: number;
    mountBracketsJoints: number;
    consumables: {
      cuttingDiscs4Half: number;
      flapDiscsGrinding: number;
      flapDiscsFinishing: number;
    };
  };
}

export const MetalBarsTab: React.FC<MetalBarsTabProps> = ({
  barStats,
  weldedJointsReport
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div
        style={{
          padding: '8px 10px',
          background: 'rgba(56, 189, 248, 0.12)',
          borderRadius: '6px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          fontSize: '11px',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>🔩 Total: {barStats.totalPieces} peças metálicas ({barStats.totalMeters.toFixed(1)} m lineares)</span>
        <span style={{ fontSize: '10px', color: '#cbd5e1' }}>~{barStats.totalBars6m} barras de 6 metros (+5% refilo)</span>
      </div>

      {/* Card da Métrica das Quinas */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '8px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px' }}>📐</span>
            <strong style={{ fontSize: '11px', color: '#38bdf8' }}>
              Métrica das "Quinas" (Juntas e Nós Estruturais)
            </strong>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
            {weldedJointsReport.totalJoints} Quinas Totais
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '10px', color: '#cbd5e1', lineHeight: 1.45, background: 'rgba(15, 23, 42, 0.5)', padding: '6px 8px', borderRadius: '5px', borderLeft: '2px solid #38bdf8' }}>
          Cada "quina" (encontro de tubos) exige ciclo completo: <strong>corte em esquadria (45º/boca de lobo)</strong>, <strong>esquadro magnético</strong>, <strong>ponteamento 4 faces</strong>, <strong>solda definitiva</strong> e <strong>lixamento com disco flap</strong>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '4px' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '4px 6px', borderRadius: '4px', fontSize: '9.5px' }}>
            <span style={{ color: '#94a3b8' }}>Quinas 45°:</span> <strong style={{ color: '#38bdf8' }}>{weldedJointsReport.miterCorners45}</strong>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '4px 6px', borderRadius: '4px', fontSize: '9.5px' }}>
            <span style={{ color: '#94a3b8' }}>Juntas em T:</span> <strong style={{ color: '#38bdf8' }}>{weldedJointsReport.teeJoints}</strong>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '4px 6px', borderRadius: '4px', fontSize: '9.5px' }}>
            <span style={{ color: '#94a3b8' }}>Sapatas/Torres:</span> <strong style={{ color: '#38bdf8' }}>{weldedJointsReport.mountBracketsJoints}</strong>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '4px 6px', borderRadius: '4px', fontSize: '9.5px' }}>
            <span style={{ color: '#94a3b8' }}>Consumíveis:</span> <strong style={{ color: '#f59e0b' }}>~{weldedJointsReport.consumables.cuttingDiscs4Half} cortes / ~{weldedJointsReport.consumables.flapDiscsGrinding + weldedJointsReport.consumables.flapDiscsFinishing} flaps</strong>
          </div>
        </div>
      </div>

      {/* Resumo por Tipo de Perfil Agrupado por Espessura */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: '8px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '11.5px', color: '#f8fafc' }}>Resumo de Barras Comerciais de 6m (por Espessura):</strong>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>Total: {barStats.totalBars6m} barras de 6m</span>
        </div>

        {barStats.thicknessGroups.map((grp) => (
          <div
            key={grp.groupTitle}
            style={{
              background: 'rgba(30, 41, 59, 0.45)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '6px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
              <strong style={{ fontSize: '10.5px', color: '#38bdf8' }}>{grp.groupTitle}</strong>
              <span style={{ fontSize: '10px', color: '#4ade80', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                Subtotal: {grp.totalBars6m} barra{grp.totalBars6m > 1 ? 's' : ''} 6m ({grp.totalMeters.toFixed(1)} m)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '6px' }}>
              {grp.profiles.map((prof, i) => (
                <div
                  key={i}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '5px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.15)'
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#f8fafc' }}>{prof.profileSpec}</div>
                  <div style={{ fontSize: '9.5px', color: '#cbd5e1' }}>
                    {prof.pieces} cortes • {prof.totalMeters.toFixed(2)} m
                  </div>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#4ade80', marginTop: '2px' }}>
                    📦 {prof.bars6m} barra{prof.bars6m > 1 ? 's' : ''} de 6m
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tabela de Cortes de Perfis Agrupada por Espessura */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: '8px',
          padding: '10px'
        }}
      >
        <strong style={{ fontSize: '11.5px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
          Lista de Cortes Estruturais por Espessura ({barStats.totalPieces} peças):
        </strong>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '4px 6px' }}>Descrição</th>
                <th style={{ padding: '4px 6px' }}>Perfil</th>
                <th style={{ padding: '4px 6px' }}>Comprimento</th>
                <th style={{ padding: '4px 6px' }}>Qtd</th>
                <th style={{ padding: '4px 6px' }}>Metros</th>
              </tr>
            </thead>
            <tbody>
              {barStats.cutThicknessGroups.map((section) => (
                <React.Fragment key={section.groupTitle}>
                  <tr style={{ background: 'rgba(30, 41, 59, 0.90)', borderTop: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    <td colSpan={5} style={{ padding: '4px 6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ color: '#38bdf8', fontSize: '10px' }}>{section.groupTitle}</strong>
                        <span style={{ fontSize: '9.5px', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                          {section.totalPieces} peças · {section.totalMeters.toFixed(2)} m
                        </span>
                      </div>
                    </td>
                  </tr>
                  {section.items.map((b) => (
                    <tr key={b.key} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                      <td style={{ padding: '4px 6px', fontWeight: 600, color: '#f8fafc' }}>{b.label}</td>
                      <td style={{ padding: '4px 6px', color: '#38bdf8' }}>{b.profileSpec}</td>
                      <td style={{ padding: '4px 6px', fontFamily: 'var(--font-mono)' }}>{b.lengthMm} mm</td>
                      <td style={{ padding: '4px 6px', fontWeight: 700, color: '#f59e0b' }}>{b.qty}</td>
                      <td style={{ padding: '4px 6px', fontFamily: 'var(--font-mono)' }}>{b.totalLengthM.toFixed(2)} m</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
