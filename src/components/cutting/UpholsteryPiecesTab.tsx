import React from 'react';
import { WoodGroupByCategory, UpholsteryStats } from '../../utils/woodUtils';

export interface UpholsteryPiecesTabProps {
  upholsteryStats: UpholsteryStats;
  upholsteryCategories: WoodGroupByCategory[];
  selectedPieceKey: string | null;
  setSelectedPieceKey: (key: string | null) => void;
  setActiveGroupKey: (key: string) => void;
  setActiveTab: (tab: 'cutting_plan' | 'wood_pieces' | 'upholstery_pieces' | 'metal_bars' | 'pvc_pipes') => void;
}

export const UpholsteryPiecesTab: React.FC<UpholsteryPiecesTabProps> = ({
  upholsteryStats,
  upholsteryCategories,
  selectedPieceKey,
  setSelectedPieceKey,
  setActiveGroupKey,
  setActiveTab
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* Resumo Quantitativo Geral de Espuma */}
      <div
        style={{
          padding: '8px 10px',
          background: 'rgba(2, 132, 199, 0.15)',
          borderRadius: '6px',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          fontSize: '11px',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px'
        }}
      >
        <span>
          🛏️ Total: {upholsteryStats.totalPieces} {upholsteryStats.totalPieces === 1 ? 'almofada' : 'almofadas'} de espuma D33 ({upholsteryStats.totalAreaM2.toFixed(2)} m² · {upholsteryStats.totalVolumeLiters.toFixed(1)} L)
        </span>
        <span style={{ fontSize: '10px', color: '#cbd5e1' }}>
          ~{upholsteryStats.estimatedSheets1900} {upholsteryStats.estimatedSheets1900 === 1 ? 'bloco' : 'blocos'} padrão 1.90×1.40m
        </span>
      </div>

      {upholsteryCategories.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
          Nenhuma almofada de colchão encontrada nos módulos de cama.
        </div>
      ) : (
        upholsteryCategories.map((cat) => (
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
                  ({cat.totalPieces} {cat.totalPieces === 1 ? 'almofada' : 'almofadas'} • {cat.totalAreaM2.toFixed(2)} m²)
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
                📐 Ver no Plano de Corte 2D
              </button>
            </div>

            {/* Tabela de Almofadas / Peças */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                <thead>
                  <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '4px 6px' }}>Almofada</th>
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
                        <td style={{ padding: '4px 6px', color: isSelected ? '#38bdf8' : '#f8fafc', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px' }}>🛏️</span>
                            <span>{p.label}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '8.5px',
                                color: '#38bdf8',
                                background: 'rgba(56, 189, 248, 0.15)',
                                padding: '1px 4px',
                                borderRadius: '3px'
                              }}
                            >
                              Espuma D33
                            </span>
                            {p.hasCabinetCutout && (
                              <span
                                style={{
                                  fontSize: '8.5px',
                                  color: '#fbbf24',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  padding: '1px 4px',
                                  borderRadius: '3px'
                                }}
                              >
                                ✂️ Recorte p/ Armário Aéreo
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '4px 6px', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                          {p.lengthMm} × {p.widthMm} × {p.thicknessMm}
                        </td>
                        <td style={{ padding: '4px 6px', color: '#cbd5e1' }}>{p.qty}x</td>
                        <td style={{ padding: '4px 6px', color: '#cbd5e1' }}>
                          {p.moduleName || '🛏️ Cama Retrátil / Sofá-Cama'}
                        </td>
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                          <button
                            className="btn-compact"
                            onClick={() => {
                              setSelectedPieceKey(isSelected ? null : p.key);
                              setActiveGroupKey(cat.key);
                              setActiveTab('cutting_plan');
                            }}
                            style={{
                              fontSize: '9.5px',
                              padding: '2px 6px',
                              background: isSelected ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.8)',
                              color: isSelected ? '#38bdf8' : '#cbd5e1'
                            }}
                          >
                            {isSelected ? '✓ Selecionado' : '🔍 Otimizar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Dicas Profissionais de Corte de Espuma */}
      <div
        style={{
          padding: '8px 10px',
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '6px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          fontSize: '10.5px',
          color: '#94a3b8',
          lineHeight: '1.4'
        }}
      >
        <strong style={{ color: '#fbbf24' }}>💡 Dica Profissional de Corte da Espuma D33:</strong>
        <p style={{ margin: '4px 0 0 0' }}>
          Para cortes precisos em blocos de espuma D33 com 80mm de espessura, utilize uma faca elétrica de estofador (lâmina dupla oscilante) ou fita lisa sem dentes em serra fita. Para a almofada com o chanfro/recorte em L do armário aéreo, marque o contorno com régua e caneta hidrocor antes de realizar o corte a 90°.
        </p>
      </div>
    </div>
  );
};
