import React, { useState } from 'react';
import { WoodGroupByCategory, UpholsteryStats, UpholsteryFabricId } from '../../utils/woodUtils';

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
  const [selectedFabricId, setSelectedFabricId] = useState<UpholsteryFabricId>('acquablock');
  const activeFabricEst = upholsteryStats.fabricEstimates.find((f) => f.fabric.id === selectedFabricId) || upholsteryStats.fabricEstimates[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* Resumo Quantitativo Geral de Espuma & Cobertura de Planos */}
      <div
        style={{
          padding: '9px 11px',
          background: 'rgba(2, 132, 199, 0.15)',
          borderRadius: '8px',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          fontSize: '11px',
          color: '#38bdf8',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <span>
            🛏️ <strong>Espuma:</strong> {upholsteryStats.totalPieces} {upholsteryStats.totalPieces === 1 ? 'almofada' : 'almofadas'} ({upholsteryStats.totalAreaM2.toFixed(2)} m² planta · {upholsteryStats.totalVolumeLiters.toFixed(1)} L)
          </span>
          <span style={{ fontSize: '10px', color: '#cbd5e1' }}>
            ~{upholsteryStats.estimatedSheets1900} {upholsteryStats.estimatedSheets1900 === 1 ? 'bloco' : 'blocos'} padrão 1.90×1.40m
          </span>
        </div>

        {/* Cards de Área dos 6 Planos (Tampo + Fundo + 4 Faixas Laterais) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: '6px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
            <div style={{ color: '#94a3b8' }}>Tampos + Fundos (2 faces):</div>
            <strong style={{ color: '#f8fafc', fontSize: '11px' }}>{upholsteryStats.totalTopBottomAreaM2.toFixed(2)} m²</strong>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
            <div style={{ color: '#94a3b8' }}>Faixas Laterais (4 faces):</div>
            <strong style={{ color: '#38bdf8', fontSize: '11px' }}>{upholsteryStats.totalSidesAreaM2.toFixed(2)} m²</strong>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
            <div style={{ color: '#94a3b8' }}>Área Líquida (6 Planos):</div>
            <strong style={{ color: '#4ade80', fontSize: '11px' }}>{upholsteryStats.totalSurfaceNetAreaM2.toFixed(2)} m²</strong>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
            <div style={{ color: '#94a3b8' }}>Corte c/ Costura + Zíper:</div>
            <strong style={{ color: '#fbbf24', fontSize: '11px' }}>
              {upholsteryStats.totalCutAreaWithSeamM2.toFixed(2)} m² • {upholsteryStats.totalZipperMeters.toFixed(1)}m zíper
            </strong>
          </div>
        </div>
      </div>

      {upholsteryCategories.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
          Nenhuma almofada de colchão encontrada nos módulos de cama.
        </div>
      ) : (
        <>
          {upholsteryCategories.map((cat) => (
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
                    ({cat.totalPieces} {cat.totalPieces === 1 ? 'almofada' : 'almofadas'} • {cat.totalAreaM2.toFixed(2)} m² base)
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

              {/* Tabela de Almofadas / Peças com Área dos 6 Planos */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '4px 6px' }}>Almofada</th>
                      <th style={{ padding: '4px 6px' }}>Medidas (mm)</th>
                      <th style={{ padding: '4px 6px' }}>Qtd</th>
                      <th style={{ padding: '4px 6px' }}>Tampo+Fundo</th>
                      <th style={{ padding: '4px 6px' }}>Laterais (4x)</th>
                      <th style={{ padding: '4px 6px' }}>Total 6 Planos</th>
                      <th style={{ padding: '4px 6px', textAlign: 'center' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.pieces.map((p) => {
                      const isSelected = selectedPieceKey === p.key;
                      const bd = upholsteryStats.cushionBreakdowns.find((b) => b.key === p.key);
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
                                {cat.woodMaterial}
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
                          <td style={{ padding: '4px 6px', color: '#f59e0b', fontWeight: 700 }}>{p.qty}x</td>
                          <td style={{ padding: '4px 6px', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                            {bd ? `${(bd.topBottomAreaM2 * p.qty).toFixed(2)} m²` : '-'}
                          </td>
                          <td style={{ padding: '4px 6px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                            {bd ? `${(bd.sidesStripAreaM2 * p.qty).toFixed(2)} m²` : '-'}
                          </td>
                          <td style={{ padding: '4px 6px', color: '#4ade80', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            {bd ? `${bd.totalNetAreaM2.toFixed(2)} m²` : '-'}
                            {bd && (
                              <div style={{ fontSize: '8.5px', color: '#94a3b8', fontWeight: 400 }}>
                                c/ costura: {bd.totalCutAreaM2.toFixed(2)} m²
                              </div>
                            )}
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
          ))}

          {/* Calculadora de Cobertura de Tecidos para Capas dos Colchões */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.82)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <div>
                <strong style={{ fontSize: '12px', color: '#34d399' }}>
                  🧵 Cobertura Têxtil dos Colchões (6 Faces + Costura + Rolo Comercial)
                </strong>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Cálculo completo para envelopamento de todas as almofadas (Tampo Superior + Fundo Inferior + 4 Faixas de Borda/Fole)
                </div>
              </div>
              {activeFabricEst && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}
                >
                  Comprar: {activeFabricEst.recommendedBuyMeters.toFixed(1)} m lineares (Rolo {activeFabricEst.fabric.rollWidthM.toFixed(2)}m)
                </span>
              )}
            </div>

            {/* Botões de Seleção Rápida de Tecido */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '5px' }}>
              {upholsteryStats.fabricEstimates.map((row) => {
                const isSelected = row.fabric.id === selectedFabricId;
                return (
                  <button
                    key={row.fabric.id}
                    type="button"
                    onClick={() => setSelectedFabricId(row.fabric.id)}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.2))'
                        : 'rgba(30, 41, 59, 0.65)',
                      border: isSelected ? '1px solid #10b981' : '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: isSelected ? '#34d399' : '#f8fafc' }}>
                        {row.fabric.name.split(' (')[0]}
                      </span>
                      <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                        {row.recommendedBuyMeters.toFixed(1)}m
                      </span>
                    </div>
                    <span style={{ fontSize: '8.5px', color: '#94a3b8' }}>
                      Rolo {row.fabric.rollWidthM.toFixed(2)}m • {row.totalCutAreaWithWasteM2.toFixed(2)} m²
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tabela Comparativa de Todos os 6 Tecidos */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                <thead>
                  <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '4px 6px' }}>Tecido / Revestimento</th>
                    <th style={{ padding: '4px 6px' }}>Larg. Rolo</th>
                    <th style={{ padding: '4px 6px' }}>Costura</th>
                    <th style={{ padding: '4px 6px' }}>Área c/ Perda</th>
                    <th style={{ padding: '4px 6px' }}>Metros Lineares</th>
                    <th style={{ padding: '4px 6px' }}>Características & Indicação</th>
                  </tr>
                </thead>
                <tbody>
                  {upholsteryStats.fabricEstimates.map((row) => {
                    const isSelected = row.fabric.id === selectedFabricId;
                    return (
                      <tr
                        key={row.fabric.id}
                        onClick={() => setSelectedFabricId(row.fabric.id)}
                        style={{
                          borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
                          background: isSelected ? 'rgba(16, 185, 129, 0.14)' : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <td style={{ padding: '5px 6px', fontWeight: 700, color: isSelected ? '#34d399' : '#f8fafc' }}>
                          {row.fabric.name}
                          <div style={{ fontSize: '8.5px', color: '#38bdf8', fontWeight: 500 }}>
                            {row.fabric.waterproofLevel}
                          </div>
                        </td>
                        <td style={{ padding: '5px 6px', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
                          {row.fabric.rollWidthM.toFixed(2)} m
                        </td>
                        <td style={{ padding: '5px 6px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                          +{row.fabric.seamAllowanceMm} mm
                        </td>
                        <td style={{ padding: '5px 6px', fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 600 }}>
                          {row.totalCutAreaWithWasteM2.toFixed(2)} m²
                        </td>
                        <td style={{ padding: '5px 6px', fontFamily: 'var(--font-mono)', color: '#fbbf24', fontWeight: 800 }}>
                          {row.linearMetersNeeded.toFixed(2)} m
                          <span style={{ fontSize: '9px', color: '#4ade80', marginLeft: '4px' }}>
                            (Comprar {row.recommendedBuyMeters.toFixed(1)}m)
                          </span>
                        </td>
                        <td style={{ padding: '5px 6px', color: '#94a3b8', fontSize: '9.5px' }}>
                          {row.fabric.notes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Dicas Profissionais de Corte de Espuma & Costura */}
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
        <strong style={{ color: '#fbbf24' }}>💡 Dica Profissional de Corte da Espuma & Capas com Zíper:</strong>
        <p style={{ margin: '4px 0 0 0' }}>
          Cada almofada possui <strong>6 planos de tecido</strong>: 1 tampo superior, 1 tampo inferior e 4 faixas laterais (fole de {upholsteryCategories[0]?.thicknessMm || 80}mm). Instale <strong>zíper reforçado nº 6 ou nº 8</strong> ({upholsteryStats.totalZipperMeters.toFixed(1)}m no total) ao longo da faixa lateral traseira avançando 5cm nas duas quinas para remover e lavar as capas com facilidade.
        </p>
      </div>
    </div>
  );
};
