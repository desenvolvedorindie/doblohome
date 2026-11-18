import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem } from '../../types';

interface PlannerFloorGridProps {
  dragStart: { col: number; row: number } | null;
  setDragStart: React.Dispatch<React.SetStateAction<{ col: number; row: number } | null>>;
  dragCurrent: { col: number; row: number } | null;
  setDragCurrent: React.Dispatch<React.SetStateAction<{ col: number; row: number } | null>>;
  isDraggingRef: React.MutableRefObject<boolean>;
  cols: number;
  rows: number;
  cellWidthCm: string;
  cellLengthCm: string;
}

export const PlannerFloorGrid: React.FC<PlannerFloorGridProps> = ({
  dragStart,
  setDragStart,
  dragCurrent,
  setDragCurrent,
  isDraggingRef,
  cols,
  rows,
  cellWidthCm,
  cellLengthCm
}) => {
  const {
    internalGrid,
    internalBoxes,
    selectedBoxId,
    setSelectedBoxId,
    isolatedBoxId,
    addInternalBox,
    updateInternalBox,
    removeInternalBox,
    setIsolatedBoxId,
  } = useSolar();

  const totalFloorVolumeL = Math.round(
    (internalGrid.widthMm / 1000) * (internalGrid.lengthMm / 1000) * (internalGrid.heightMm / 1000) * 1000
  );

  const occupiedVolumeL = internalBoxes.reduce((acc, box) => {
    const boxWM = Math.max(0.05, (box.colSpan * (internalGrid.widthMm / cols) + (box.extraWidthMm || 0)) / 1000);
    const boxLM = Math.max(0.05, (box.rowSpan * (internalGrid.lengthMm / rows) + (box.extraLengthMm || 0)) / 1000);
    const boxHM = (box.heightMm || internalGrid.heightMm) / 1000;
    return acc + Math.round(boxWM * boxLM * boxHM * 1000);
  }, 0);

  const occupationPct = totalFloorVolumeL > 0 ? Math.min(100, Math.round((occupiedVolumeL / totalFloorVolumeL) * 100)) : 0;

  const getDragRect = () => {
    if (!dragStart || !dragCurrent) return null;
    const minCol = Math.min(dragStart.col, dragCurrent.col);
    const maxCol = Math.max(dragStart.col, dragCurrent.col);
    const minRow = Math.min(dragStart.row, dragCurrent.row);
    const maxRow = Math.max(dragStart.row, dragCurrent.row);
    return { minCol, maxCol, minRow, maxRow };
  };

  const dragRect = getDragRect();

  const handleCellMouseDown = (col: number, row: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    setDragStart({ col, row });
    setDragCurrent({ col, row });
  };

  const handleCellMouseEnter = (col: number, row: number) => {
    if (isDraggingRef.current && dragStart) {
      setDragCurrent({ col, row });
    }
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current || !dragStart || !dragCurrent) {
      isDraggingRef.current = false;
      setDragStart(null);
      setDragCurrent(null);
      return;
    }
    isDraggingRef.current = false;
    const colMin = Math.min(dragStart.col, dragCurrent.col);
    const colMax = Math.max(dragStart.col, dragCurrent.col);
    const rowMin = Math.min(dragStart.row, dragCurrent.row);
    const rowMax = Math.max(dragStart.row, dragCurrent.row);
    const colSpan = colMax - colMin + 1;
    const rowSpan = rowMax - rowMin + 1;
    addInternalBox({
      name: `Módulo ${internalBoxes.length + 1}`,
      type: 'chest',
      colStart: colMin,
      colSpan,
      rowStart: rowMin,
      rowSpan,
      heightMm: internalGrid.heightMm,
      color: '#f59e0b',
      material: 'plywood',
      chestHingeDirection: 'front'
    });
    setDragStart(null);
    setDragCurrent(null);
  };

  return (
    <>
      {/* 2. Grid Interativo do Assoalho */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.90)',
          borderRadius: '12px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          padding: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)'
        }}
        onMouseUp={handleMouseUp}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.5px' }}>
              📐 PLANTA DO GRID DO ASSOALHO DA DOBLÒ
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
              💡 Clique e arraste sobre as células vazias para desenhar uma nova caixa no tamanho desejado.
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>
              {occupationPct}% Ocupado ({occupiedVolumeL} L de {totalFloorVolumeL} L)
            </div>
            <div style={{ fontSize: '10px', color: '#38bdf8' }}>
              Célula: {cellWidthCm} cm (L) × {cellLengthCm} cm (C)
            </div>
          </div>
        </div>

        {/* Indicador Frente / Bancos */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: 800,
            color: '#64748b',
            letterSpacing: '2px',
            padding: '4px',
            background: 'rgba(30, 41, 59, 0.4)',
            borderRadius: '6px',
            marginBottom: '8px'
          }}
        >
          ▲ FRENTE (BANCOS DIANTEIROS) ▲
        </div>

        {/* Container do Grid */}
        <div style={{ position: 'relative', userSelect: 'none' }}>
          {/* Matriz de Células */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 64px)`,
              gap: '2px',
              background: '#090d16',
              padding: '6px',
              borderRadius: '8px',
              border: '2px dashed rgba(56, 189, 248, 0.35)'
            }}
          >
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((_, c) => {
                const isSelectedInDrag =
                  dragRect &&
                  c >= dragRect.minCol &&
                  c <= dragRect.maxCol &&
                  r >= dragRect.minRow &&
                  r <= dragRect.maxRow;

                return (
                  <div
                    key={`cell_${c}_${r}`}
                    onMouseDown={(e) => handleCellMouseDown(c, r, e)}
                    onMouseEnter={() => handleCellMouseEnter(c, r)}
                    style={{
                      background: isSelectedInDrag
                        ? 'rgba(56, 189, 248, 0.45)'
                        : 'rgba(30, 41, 59, 0.55)',
                      border: isSelectedInDrag
                        ? '2px solid #38bdf8'
                        : '1px solid rgba(148, 163, 184, 0.15)',
                      borderRadius: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'crosshair',
                      fontSize: '9.5px',
                      color: isSelectedInDrag ? '#ffffff' : '#64748b',
                      fontWeight: 600,
                      transition: 'background 0.1s ease'
                    }}
                  >
                    <span>{String.fromCharCode(65 + c)}{r + 1}</span>
                    <span style={{ fontSize: '8px', opacity: 0.6 }}>{cellWidthCm}×{cellLengthCm}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Caixas posicionadas sobre o Grid com CSS Grid Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 64px)`,
              gap: '2px',
              padding: '6px',
              pointerEvents: 'none' // para não bloquear mousedown se clicar em áreas transparentes
            }}
          >
            {internalBoxes.map((box) => {
              const isSelected = box.id === selectedBoxId;
              const isIsolated = box.id === isolatedBoxId;
              const isGhosted = Boolean(isolatedBoxId && !isIsolated);
              const boxWMm = Math.max(50, Math.round(box.colSpan * (internalGrid.widthMm / cols) + (box.extraWidthMm || 0)));
              const boxLMm = Math.max(50, Math.round(box.rowSpan * (internalGrid.lengthMm / rows) + (box.extraLengthMm || 0)));
              const boxVolL = Math.round((boxWMm * boxLMm * (box.heightMm || internalGrid.heightMm)) / 1_000_000);

              return (
                <div
                  key={box.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBoxId(box.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setIsolatedBoxId(isIsolated ? null : box.id);
                  }}
                  title={isIsolated ? '🎯 Em foco isolado. Dê 2x cliques para voltar.' : 'Clique para selecionar ou dê 2x cliques para isolar visualização'}
                  style={{
                    gridColumn: `${box.colStart + 1} / span ${box.colSpan}`,
                    gridRow: `${box.rowStart + 1} / span ${box.rowSpan}`,
                    background: isIsolated
                      ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.95), rgba(30, 58, 138, 0.95))'
                      : isSelected
                      ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.85), rgba(37, 99, 235, 0.85))'
                      : `linear-gradient(135deg, ${box.color}dd, ${box.color}aa)`,
                    border: isIsolated
                      ? '2.5px solid #38bdf8'
                      : isSelected
                      ? '2px solid #ffffff'
                      : '1px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    opacity: isGhosted ? 0.38 : 1,
                    boxShadow: isIsolated
                      ? '0 0 20px rgba(56, 189, 248, 0.95), 0 4px 14px rgba(0, 0, 0, 0.6)'
                      : isSelected
                      ? '0 0 16px rgba(56, 189, 248, 0.8), 0 4px 12px rgba(0, 0, 0, 0.5)'
                      : '0 2px 8px rgba(0, 0, 0, 0.4)',
                    color: '#ffffff',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 800, fontSize: '11px', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                      {box.type === 'drawer' ? '📦 ' : box.type === 'open' ? '🚪 ' : box.type === 'slat_bed' ? '🛏️ ' : '🧰 '}
                      {box.name}
                      {isIsolated && (
                        <span
                          title="Baú isolado em foco 3D"
                          style={{
                            marginLeft: '4px',
                            fontSize: '9px',
                            background: '#0284c7',
                            border: '1px solid #7dd3fc',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: 800
                          }}
                        >
                          🎯 FOCO
                        </span>
                      )}
                      {box.topPerforated && (
                        <span
                          title="Tampo Vazado CNC (-35% peso / Aeração)"
                          style={{
                            marginLeft: '4px',
                            fontSize: '9px',
                            background: 'rgba(16, 185, 129, 0.35)',
                            border: '1px solid #10b981',
                            padding: '1px 4px',
                            borderRadius: '3px'
                          }}
                        >
                          🕳️ Vazado
                        </span>
                      )}
                      {box.rearFoldShelf && (
                        <span
                          title="Prateleira / Mesa Rebatível Traseira em Madeira (Abre para cima)"
                          style={{
                            marginLeft: '4px',
                            fontSize: '9px',
                            background: 'rgba(217, 119, 6, 0.4)',
                            border: '1px solid #f59e0b',
                            padding: '1px 4px',
                            borderRadius: '3px'
                          }}
                        >
                          🪵 Mesa Traseira
                        </span>
                      )}
                      {box.hasStove && (
                        <span
                          title="Fogareiro Portátil (NTK Duo Ceramik)"
                          style={{
                            marginLeft: '4px',
                            fontSize: '9px',
                            background: 'rgba(234, 88, 12, 0.45)',
                            border: '1px solid #f97316',
                            padding: '1px 4px',
                            borderRadius: '3px'
                          }}
                        >
                          🔥 Fogareiro
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsolatedBoxId(isIsolated ? null : box.id);
                        }}
                        style={{
                          fontSize: '9px',
                          padding: '2px 5px',
                          background: isIsolated ? '#0284c7' : 'rgba(0, 0, 0, 0.45)',
                          border: isIsolated ? '1px solid #7dd3fc' : '1px solid rgba(255, 255, 255, 0.25)',
                          borderRadius: '4px',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                        title={isIsolated ? 'Voltar e visualizar todos os baús' : 'Isolar este baú no 3D (2x cliques)'}
                      >
                        {isIsolated ? '← Voltar' : '🔍 Isolar'}
                      </button>
                      <span
                        style={{
                          fontSize: '9px',
                          background: 'rgba(0, 0, 0, 0.4)',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}
                      >
                        {boxVolL} L
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '9px', opacity: 0.9 }}>
                    <span>{boxWMm / 10} × {boxLMm / 10} × {(box.heightMm || internalGrid.heightMm) / 10} cm</span>
                    <span style={{ fontStyle: 'italic', opacity: 0.85 }}>
                      {box.type === 'drawer'
                        ? `Gaveta (${box.slideDirection === 'front' ? '▲ Frente' : box.slideDirection === 'left' ? '◀ Esq' : box.slideDirection === 'right' ? '▶ Dir' : '▼ Trás'})${box.topPerforated ? ' • Vazada' : ''}`
                        : box.type === 'slide_tray'
                        ? `Bandeja (${box.slideDirection === 'front' ? '▲ Frente' : box.slideDirection === 'left' ? '◀ Esq' : box.slideDirection === 'right' ? '▶ Dir' : '▼ Trás'})${box.topPerforated ? ' • Vazada' : ''}`
                        : box.type === 'open'
                        ? `Nicho${box.topPerforated ? ' • Vazado' : ''}`
                        : box.type === 'slat_bed'
                        ? `Cama Ripas (${box.slatBedDirection === 'left' ? '◀ Esq' : box.slatBedDirection === 'right' ? '▶ Dir' : box.slatBedDirection === 'rear' ? '▼ Trás' : '▲ Frente'})`
                        : `Baú (${box.chestHingeDirection === 'rear' ? '▼ Trás' : box.chestHingeDirection === 'left' ? '◀ Esq' : box.chestHingeDirection === 'right' ? '▶ Dir' : '▲ Frente'})${box.topPerforated ? ' • Vazado' : ''}`}
                      {box.rearFoldShelf ? ' + 🪵 Mesa Rebatível' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Indicador Traseira / Porta-Malas */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: 800,
            color: '#64748b',
            letterSpacing: '2px',
            padding: '4px',
            background: 'rgba(30, 41, 59, 0.4)',
            borderRadius: '6px',
            marginTop: '8px'
          }}
        >
          ▼ TRASEIRA (PORTA-MALAS & ACESSO DE CARGA) ▼
        </div>
      </div>

    </>
  );
};
