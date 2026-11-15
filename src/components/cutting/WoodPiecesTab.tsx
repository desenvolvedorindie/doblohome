import React from 'react';
import { WoodGroupByCategory } from '../../utils/woodUtils';

export interface WoodPiecesTabProps {
  woodStats: {
    totalPieces: number;
    totalAreaM2: number;
    standardSheets: number;
  };
  woodCategories: WoodGroupByCategory[];
  selectedPieceKey: string | null;
  setSelectedPieceKey: (key: string | null) => void;
  setActiveGroupKey: (key: string) => void;
  setActiveTab: (tab: 'cutting_plan' | 'wood_pieces' | 'upholstery_pieces' | 'metal_bars' | 'pvc_pipes') => void;
}

export const WoodPiecesTab: React.FC<WoodPiecesTabProps> = ({
  woodStats,
  woodCategories,
  selectedPieceKey,
  setSelectedPieceKey,
  setActiveGroupKey,
  setActiveTab
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div
        style={{
          padding: '8px 10px',
          background: 'rgba(245, 158, 11, 0.12)',
          borderRadius: '6px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          fontSize: '11px',
          color: '#fbbf24',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>🪵 Total: {woodStats.totalPieces} peças de marcenaria ({woodStats.totalAreaM2.toFixed(2)} m²)</span>
        <span style={{ fontSize: '10px', color: '#cbd5e1' }}>~{woodStats.standardSheets} chapas padrão 2.44×1.22m</span>
      </div>

      {woodCategories.map((cat) => (
        <div
          key={cat.key}
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
            <div>
              <strong style={{ fontSize: '12px', color: '#38bdf8' }}>
                {cat.woodMaterial} {cat.thicknessMm}mm
              </strong>
              <span style={{ fontSize: '10.5px', color: '#94a3b8', marginLeft: '6px' }}>
                ({cat.totalPieces} {cat.totalPieces === 1 ? 'peça' : 'peças'} • {cat.totalAreaM2.toFixed(2)} m²)
              </span>
            </div>
            <button
              className="btn-compact primary"
              onClick={() => {
                setActiveGroupKey(cat.key);
                setActiveTab('cutting_plan');
              }}
              style={{ fontSize: '10px', padding: '3px 8px' }}
            >
              📐 Ver no Plano de Corte
            </button>
          </div>

          {/* Tabela de Peças */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '4px 6px' }}>Peça</th>
                  <th style={{ padding: '4px 6px' }}>Medidas (mm)</th>
                  <th style={{ padding: '4px 6px' }}>Qtd</th>
                  <th style={{ padding: '4px 6px' }}>Módulo</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {cat.pieces.map((p) => {
                  const isSelected = selectedPieceKey === p.key;
                  return (
                    <tr
                      key={p.key}
                      style={{
                        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
                        background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '4px 6px', fontWeight: 600, color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                        {p.label}
                        {p.isPerforated && (
                          <span style={{ fontSize: '9px', color: '#34d399', marginLeft: '4px' }}>
                            🕳️ Furos CNC
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '4px 6px', fontFamily: 'var(--font-mono)' }}>
                        {p.lengthMm} × {p.widthMm} × {p.thicknessMm}
                      </td>
                      <td style={{ padding: '4px 6px', fontWeight: 700, color: '#f59e0b' }}>
                        {p.qty}
                      </td>
                      <td style={{ padding: '4px 6px', color: '#cbd5e1' }}>
                        {p.moduleName || '-'}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <button
                          className="btn-compact"
                          onClick={() => {
                            setSelectedPieceKey(p.key);
                            setActiveGroupKey(cat.key);
                            setActiveTab('cutting_plan');
                          }}
                          style={{ fontSize: '9.5px', padding: '2px 6px' }}
                          title="Destacar no plano de corte 2D"
                        >
                          🔍 Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};
