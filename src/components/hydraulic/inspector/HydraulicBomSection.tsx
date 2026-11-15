import React from 'react';
import { calculateHydraulicBom } from '../../../utils/hydraulicCalculations';

type HydraulicBomResult = ReturnType<typeof calculateHydraulicBom>;

interface HydraulicBomSectionProps {
  bom: HydraulicBomResult;
  nodeCount: number;
}

export const HydraulicBomSection: React.FC<HydraulicBomSectionProps> = ({
  bom,
  nodeCount
}) => {
  return (
    <>
      {/* Lista de Mangueiras / Tubos */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '8px',
          padding: '9px'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
          〰️ Mangueiras & Tubos ({bom.totalPipeMeters}m total)
        </div>
        {bom.pipes.length === 0 ? (
          <div style={{ fontSize: '10.5px', color: '#64748b' }}>
            Conecte os componentes no diagrama para calcular a metragem por linha, material e bitola.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {bom.pipes.map((p) => (
              <div
                key={`${p.fluidType}_${p.material}_${p.diameterMm}`}
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
                      background: p.color,
                      border: '1px solid rgba(255,255,255,0.4)'
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f1f5f9' }}>
                      {p.diameterLabel} · {p.fluidLabel}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                      {p.materialLabel} · {p.segmentCount} trecho(s)
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
                  {p.totalMeters} m
                </span>
              </div>
            ))}
          </div>
        )}

        {bom.estimatedPushConnectors > 0 && (
          <div
            style={{
              marginTop: '8px',
              padding: '5px 7px',
              borderRadius: '6px',
              background: 'rgba(14, 165, 233, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontSize: '10px',
              color: '#bae6fd',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>🔗 Engates Rápidos / Abraçadeiras est.:</span>
            <strong>{bom.estimatedPushConnectors} un</strong>
          </div>
        )}
      </div>

      {/* Válvulas, Conexões e Tanques */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '8px',
          padding: '9px'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>
          📦 Conexões, Válvulas & Tanques ({nodeCount})
        </div>
        {bom.components.length === 0 ? (
          <div style={{ fontSize: '10.5px', color: '#64748b' }}>
            Diagrama vazio.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {bom.components.map((comp) => (
              <div
                key={comp.key}
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
                  <span style={{ marginRight: '5px' }}>{comp.icon}</span>
                  <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{comp.label}</span>
                  <span style={{ color: '#94a3b8', marginLeft: '5px', fontSize: '9.5px' }}>
                    {comp.detail}
                  </span>
                </div>
                <span style={{ fontWeight: 800, color: '#34d399', marginLeft: '6px' }}>
                  ×{comp.qty}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
