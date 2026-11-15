import React from 'react';
import { FUSE_COLOR_TABLE } from '../../../types/electricalPlanar';
import { ElectricalBomSummary } from '../../../utils/electricalCalculations';

interface ElectricalBomTabProps {
  bom: ElectricalBomSummary;
  nodesCount: number;
}

export const ElectricalBomTab: React.FC<ElectricalBomTabProps> = ({
  bom,
  nodesCount
}) => {
  return (
    <>
      {/* Lista de Cabos */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '8px',
          padding: '9px'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
          🧵 Cabos Flexíveis ({bom.totalCableMeters}m total)
        </div>
        {bom.cables.length === 0 ? (
          <div style={{ fontSize: '10.5px', color: '#64748b' }}>
            Ligue os componentes com fios no diagrama para calcular a metragem por cor e bitola.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {bom.cables.map((c) => (
              <div
                key={`${c.polarity}_${c.gaugeMm2}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 7px',
                  borderRadius: '6px',
                  background: 'rgba(2, 6, 23, 0.45)',
                  border: '1px solid rgba(148, 163, 184, 0.14)',
                  fontSize: '11px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: c.polarity === 'neg' ? '#334155' : c.color,
                      border: '1px solid rgba(255,255,255,0.4)'
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f1f5f9' }}>
                      {c.gaugeMm2} mm² · {c.polarityLabel}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                      {c.wireCount} trecho(s)
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: '#38bdf8'
                  }}
                >
                  {c.totalMeters} m
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Fusíveis */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '8px',
          padding: '9px'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', marginBottom: '6px' }}>
          🛡️ Fusíveis Lâmina ({bom.totalFuses} un)
        </div>
        {bom.fuses.length === 0 ? (
          <div style={{ fontSize: '10.5px', color: '#64748b' }}>
            Nenhuma Caixa de Fusíveis adicionada ao diagrama ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {bom.fuses.map((f) => (
              <div
                key={f.amps}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 7px',
                  borderRadius: '6px',
                  background: 'rgba(2, 6, 23, 0.5)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  fontSize: '10.5px'
                }}
              >
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: f.hex
                  }}
                />
                <span style={{ fontWeight: 800, color: '#f8fafc' }}>{f.amps}A</span>
                <span style={{ color: '#94a3b8' }}>({f.colorName})</span>
                <span style={{ fontWeight: 800, color: '#fbbf24' }}>×{f.qty}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipamentos e Proteções */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '8px',
          padding: '9px'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>
          📦 Componentes no Diagrama ({nodesCount})
        </div>
        {bom.equipment.length === 0 ? (
          <div style={{ fontSize: '10.5px', color: '#64748b' }}>
            Diagrama vazio.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {bom.equipment.map((eq) => (
              <div
                key={eq.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 7px',
                  borderRadius: '6px',
                  background: 'rgba(2, 6, 23, 0.45)',
                  fontSize: '10.5px'
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <span style={{ marginRight: '5px' }}>{eq.icon}</span>
                  <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{eq.label}</span>
                  <span style={{ color: '#94a3b8', marginLeft: '5px', fontSize: '9.5px' }}>
                    {eq.detail}
                  </span>
                </div>
                <span style={{ fontWeight: 800, color: '#34d399', marginLeft: '6px' }}>
                  ×{eq.qty}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabela de Referência de Cores de Fusíveis Automotivos */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(148, 163, 184, 0.16)',
          borderRadius: '8px',
          padding: '8px'
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: 800, color: '#cbd5e1', marginBottom: '5px' }}>
          🎨 Referência Padrão de Fusíveis Automotivos
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          {FUSE_COLOR_TABLE.map((f) => (
            <div
              key={f.amps}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '9.5px',
                color: '#cbd5e1'
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  minWidth: '28px',
                  textAlign: 'center',
                  fontWeight: 800,
                  borderRadius: '3px',
                  background: f.hex,
                  color: f.textColor,
                  padding: '1px 3px'
                }}
              >
                {f.amps}A
              </span>
              <span>{f.colorName}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
