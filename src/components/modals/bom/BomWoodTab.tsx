import React from 'react';
import { WoodCutGroup, WoodGroupByCategory } from '../../../utils/woodUtils';
import { CuttingPlanPanel } from '../../cutting/CuttingPlanPanel';

interface BomWoodTabProps {
  woodStats: { totalPieces: number; totalAreaM2: number; standardSheets: number; cutGroups: WoodCutGroup[] };
  woodGroupsByCategory: WoodGroupByCategory[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeGroupKey: string;
  setActiveGroupKey: (key: string) => void;
  selectedPieceKey: string | null;
  setSelectedPieceKey: (key: string | null) => void;
}

export const BomWoodTab: React.FC<BomWoodTabProps> = ({
  woodStats,
  woodGroupsByCategory,
  searchTerm,
  setSearchTerm,
  activeGroupKey,
  setActiveGroupKey,
  selectedPieceKey,
  setSelectedPieceKey
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(500px, 1fr) minmax(520px, 1.2fr)',
        gap: '14px',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        marginTop: '10px'
      }}
    >
      {/* ─── COLUNA DA ESQUERDA: GRID POR LINHA AGRUPADO POR TIPO & ESPESSURA ─── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '8px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          padding: '10px',
          overflow: 'hidden'
        }}
      >
        {/* Barra de Filtro / Busca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 Filtrar por nome da peça, módulo ou dimensão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'rgba(2, 6, 23, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '11px',
                outline: 'none'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                &times;
              </button>
            )}
          </div>
          <div style={{ fontSize: '10.5px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
            <strong>{woodGroupsByCategory.length}</strong> {woodGroupsByCategory.length === 1 ? 'grupo' : 'grupos'}
          </div>
        </div>

        {/* Lista com Rolagem dos Grupos de Madeira e Espessura */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            paddingRight: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {woodGroupsByCategory.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
              Nenhum item encontrado nesta categoria.
            </div>
          ) : (
            woodGroupsByCategory.map((category) => {
              const isFoamCat = Boolean(category.woodMaterial.includes('Espuma') || category.pieces.some(p => p.isUpholstery));
              const filteredPieces = category.pieces.filter((p) => {
                if (!searchTerm) return true;
                const term = searchTerm.toLowerCase();
                return (
                  p.label.toLowerCase().includes(term) ||
                  (p.moduleName && p.moduleName.toLowerCase().includes(term)) ||
                  `${p.lengthMm}`.includes(term) ||
                  `${p.widthMm}`.includes(term)
                );
              });

              if (searchTerm && filteredPieces.length === 0) return null;

              const isCurrentActiveGroup = activeGroupKey === category.key;

              return (
                <div
                  key={category.key}
                  style={{
                    background: 'rgba(2, 6, 23, 0.65)',
                    borderRadius: '8px',
                    border: isCurrentActiveGroup
                      ? '1px solid #10b981'
                      : '1px solid rgba(148, 163, 184, 0.25)',
                    overflow: 'hidden',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  {/* Cabeçalho do Grupo de Material e Espessura */}
                  <div
                    style={{
                      padding: '8px 12px',
                      background: isCurrentActiveGroup
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(5, 150, 105, 0.12))'
                        : 'rgba(15, 23, 42, 0.85)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '6px',
                      borderBottom: '1px solid rgba(148, 163, 184, 0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{isFoamCat ? '🛏️' : '🪵'}</span>
                      <div>
                        <strong style={{ fontSize: '12px', color: '#f8fafc' }}>
                          {category.woodMaterial} — {category.thicknessMm} mm
                        </strong>
                        <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '6px' }}>
                          ({category.totalPieces} {category.totalPieces === 1 ? 'peça' : 'peças'} · {category.totalAreaM2.toFixed(2)} m²)
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: isFoamCat ? '#38bdf8' : '#fbbf24',
                          background: isFoamCat ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        ~{category.estimatedSheets} {isFoamCat ? (category.estimatedSheets === 1 ? 'bloco' : 'blocos') : (category.estimatedSheets === 1 ? 'chapa' : 'chapas')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveGroupKey(category.key);
                          if (category.pieces.length > 0) {
                            setSelectedPieceKey(category.pieces[0].key);
                          }
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '5px',
                          border: isCurrentActiveGroup ? '1px solid #10b981' : '1px solid rgba(148, 163, 184, 0.3)',
                          background: isCurrentActiveGroup ? '#10b981' : 'rgba(15, 23, 42, 0.7)',
                          color: isCurrentActiveGroup ? '#022c22' : '#cbd5e1',
                          fontSize: '10px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isCurrentActiveGroup ? '✓ Folha Ativa' : '📐 Ver Plano de Corte'}
                      </button>
                    </div>
                  </div>

                  {/* Tabela do Grid de Peças deste Grupo */}
                  <div style={{ overflowX: 'auto' }}>
                    <table className="bom-table" style={{ margin: 0, width: '100%', fontSize: '11px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '32px', textAlign: 'center' }}>#</th>
                          <th>Peça / Componente</th>
                          <th>Módulo</th>
                          <th>Medidas (C × L × E)</th>
                          <th style={{ textAlign: 'center' }}>Qtd</th>
                          <th>Área</th>
                          <th>Usinagem / Furação CNC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPieces.map((piece, idx) => {
                          const isSelected = selectedPieceKey === piece.key;

                          return (
                            <tr
                              key={piece.key}
                              onClick={() => {
                                setSelectedPieceKey(piece.key);
                                setActiveGroupKey(category.key);
                              }}
                              style={{
                                cursor: 'pointer',
                                background: isSelected
                                  ? 'rgba(56, 189, 248, 0.22)'
                                  : undefined,
                                borderLeft: isSelected ? '3px solid #38bdf8' : '3px solid transparent',
                                transition: 'background 0.12s ease'
                              }}
                            >
                              <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                                {idx + 1}
                              </td>
                              <td>
                                <strong style={{ color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                                  {piece.label}
                                </strong>
                              </td>
                              <td>
                                {piece.moduleName ? (
                                  <span
                                    style={{
                                      fontSize: '9px',
                                      fontWeight: 700,
                                      padding: '2px 5px',
                                      borderRadius: '4px',
                                      background: 'rgba(148, 163, 184, 0.15)',
                                      color: '#cbd5e1'
                                    }}
                                  >
                                    {piece.moduleName}
                                  </span>
                                ) : (
                                  <span style={{ color: '#64748b', fontSize: '9px' }}>—</span>
                                )}
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f59e0b', whiteSpace: 'nowrap' }}>
                                {piece.lengthMm} × {piece.widthMm} × {piece.thicknessMm} mm
                              </td>
                              <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                                {piece.qty} un
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)', color: '#34d399', fontSize: '10.5px' }}>
                                {piece.totalAreaM2 >= 0.1 ? `${piece.totalAreaM2.toFixed(3)} m²` : `${Math.round(piece.totalAreaM2 * 10000)} cm²`}
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {piece.isPerforated && (
                                    <span
                                      style={{
                                        fontSize: '8.5px',
                                        fontWeight: 700,
                                        color: '#34d399',
                                        background: 'rgba(52, 211, 153, 0.15)',
                                        border: '1px solid rgba(52, 211, 153, 0.4)',
                                        padding: '1px 5px',
                                        borderRadius: '3px',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      🕳️ CNC Ø{piece.holeDiameterMm || 40}mm
                                    </span>
                                  )}
                                  {piece.hasCabinetExclusion && (
                                    <span
                                      style={{
                                        fontSize: '8.5px',
                                        fontWeight: 700,
                                        color: '#38bdf8',
                                        background: 'rgba(56, 189, 248, 0.18)',
                                        border: '1px solid rgba(56, 189, 248, 0.4)',
                                        padding: '1px 5px',
                                        borderRadius: '3px',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      🍃 Base Aéreo
                                    </span>
                                  )}
                                  {piece.isRearShelf && (
                                    <span
                                      style={{
                                        fontSize: '8.5px',
                                        fontWeight: 700,
                                        color: '#fbbf24',
                                        background: 'rgba(245, 158, 11, 0.18)',
                                        border: '1px solid rgba(245, 158, 11, 0.4)',
                                        padding: '1px 5px',
                                        borderRadius: '3px',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      🪵 Mesa Rebatível
                                    </span>
                                  )}
                                  {piece.isUpholstery && (
                                    <span
                                      style={{
                                        fontSize: '8.5px',
                                        fontWeight: 700,
                                        color: '#38bdf8',
                                        background: 'rgba(56, 189, 248, 0.18)',
                                        border: '1px solid rgba(56, 189, 248, 0.4)',
                                        padding: '1px 5px',
                                        borderRadius: '3px',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      🛏️ {piece.woodMaterial.replace(/\s*\(Colchão\)/i, '') || 'Espuma D33'}
                                    </span>
                                  )}
                                  {piece.hasCabinetCutout && (
                                    <span
                                      style={{
                                        fontSize: '8.5px',
                                        fontWeight: 700,
                                        color: '#fbbf24',
                                        background: 'rgba(245, 158, 11, 0.18)',
                                        border: '1px solid rgba(245, 158, 11, 0.4)',
                                        padding: '1px 5px',
                                        borderRadius: '3px',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      ✂️ Recorte p/ Armário Aéreo
                                    </span>
                                  )}
                                  {!piece.isPerforated && !piece.hasCabinetExclusion && !piece.isRearShelf && !piece.isUpholstery && !piece.hasCabinetCutout && (
                                    <span style={{ fontSize: '9px', color: '#64748b' }}>Corte Reto</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── COLUNA DA DIREITA: PAINEL DE PLANO DE CORTE CNC 2D (ESTILO CORTE CLOUD) ─── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        <CuttingPlanPanel
          woodCutGroups={woodStats.cutGroups}
          selectedPieceKey={selectedPieceKey}
          onSelectPiece={setSelectedPieceKey}
          activeGroupKey={activeGroupKey}
          onSelectGroupKey={setActiveGroupKey}
        />
      </div>
    </div>
  );
};
