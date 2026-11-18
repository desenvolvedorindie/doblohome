const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/components/planner/PlannerFloorGrid.tsx');

const newCode = `import React from 'react';
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

  // Selected Box & Direct Navigation helpers
  const selectedBox = internalBoxes.find(b => b.id === selectedBoxId);

  const canMoveLeft = Boolean(selectedBox && selectedBox.colStart > 0);
  const canMoveRight = Boolean(selectedBox && selectedBox.colStart + selectedBox.colSpan < cols);
  const canMoveFront = Boolean(selectedBox && selectedBox.rowStart > 0);
  const canMoveRear = Boolean(selectedBox && selectedBox.rowStart + selectedBox.rowSpan < rows);

  const moveBox = (dCol: number, dRow: number) => {
    if (!selectedBox) return;
    const newCol = Math.max(0, Math.min(cols - selectedBox.colSpan, selectedBox.colStart + dCol));
    const newRow = Math.max(0, Math.min(rows - selectedBox.rowSpan, selectedBox.rowStart + dRow));
    updateInternalBox(selectedBox.id, { colStart: newCol, rowStart: newRow });
  };

  const canShrinkWidth = Boolean(selectedBox && selectedBox.colSpan > 1);
  const canExpandWidth = Boolean(selectedBox && selectedBox.colStart + selectedBox.colSpan < cols);
  const canShrinkLength = Boolean(selectedBox && selectedBox.rowSpan > 1);
  const canExpandLength = Boolean(selectedBox && selectedBox.rowStart + selectedBox.rowSpan < rows);

  const resizeBox = (dColSpan: number, dRowSpan: number) => {
    if (!selectedBox) return;
    const newColSpan = Math.max(1, Math.min(cols - selectedBox.colStart, selectedBox.colSpan + dColSpan));
    const newRowSpan = Math.max(1, Math.min(rows - selectedBox.rowStart, selectedBox.rowSpan + dRowSpan));
    updateInternalBox(selectedBox.id, { colSpan: newColSpan, rowSpan: newRowSpan });
  };

  const selectedBoxWMm = selectedBox
    ? Math.max(50, Math.round(selectedBox.colSpan * (internalGrid.widthMm / cols) + (selectedBox.extraWidthMm || 0)))
    : 0;
  const selectedBoxLMm = selectedBox
    ? Math.max(50, Math.round(selectedBox.rowSpan * (internalGrid.lengthMm / rows) + (selectedBox.extraLengthMm || 0)))
    : 0;
  const selectedBoxVolL = selectedBox
    ? Math.round((selectedBoxWMm * selectedBoxLMm * (selectedBox.heightMm || internalGrid.heightMm)) / 1_000_000)
    : 0;

  // Keyboard navigation support for selected module
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (!selectedBox) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canShrinkWidth) resizeBox(-1, 0);
        } else {
          if (canMoveLeft) moveBox(-1, 0);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canExpandWidth) resizeBox(1, 0);
        } else {
          if (canMoveRight) moveBox(1, 0);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canShrinkLength) resizeBox(0, -1);
        } else {
          if (canMoveFront) moveBox(0, -1);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canExpandLength) resizeBox(0, 1);
        } else {
          if (canMoveRear) moveBox(0, 1);
        }
      } else if (e.key === 'Escape') {
        setSelectedBoxId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBox, canMoveLeft, canMoveRight, canMoveFront, canMoveRear, canShrinkWidth, canExpandWidth, canShrinkLength, canExpandLength]);

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
      name: \`Módulo \${internalBoxes.length + 1}\`,
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

        {/* Barra de Navegação Direta do Módulo Selecionado */}
        {selectedBox ? (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))',
              border: '1.5px solid #38bdf8',
              borderRadius: '8px',
              padding: '8px 12px',
              marginBottom: '10px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Info do Módulo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '170px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  backgroundColor: selectedBox.color || '#38bdf8',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  flexShrink: 0
                }}
              />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{selectedBox.name}</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
                    ({selectedBoxWMm / 10} × {selectedBoxLMm / 10} cm • {selectedBoxVolL} L)
                  </span>
                </div>
                <div style={{ fontSize: '9.5px', color: '#38bdf8' }}>
                  Célula {String.fromCharCode(65 + selectedBox.colStart)}{selectedBox.rowStart + 1} ({selectedBox.colSpan} col × {selectedBox.rowSpan} lin)
                </div>
              </div>
            </div>

            {/* Ações de Mover e Redimensionar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Grupo Mover */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginRight: '3px' }}>Mover:</span>
                <button
                  type="button"
                  disabled={!canMoveLeft}
                  onClick={() => moveBox(-1, 0)}
                  className="btn-compact"
                  style={{ fontSize: '11px', padding: '3px 8px', fontWeight: 700 }}
                  title="Mover para a esquerda (←)"
                >
                  ⬅ Esq
                </button>
                <button
                  type="button"
                  disabled={!canMoveRight}
                  onClick={() => moveBox(1, 0)}
                  className="btn-compact"
                  style={{ fontSize: '11px', padding: '3px 8px', fontWeight: 700 }}
                  title="Mover para a direita (→)"
                >
                  Dir ➡
                </button>
                <button
                  type="button"
                  disabled={!canMoveFront}
                  onClick={() => moveBox(0, -1)}
                  className="btn-compact"
                  style={{ fontSize: '11px', padding: '3px 8px', fontWeight: 700 }}
                  title="Mover para frente (↑)"
                >
                  ⬆ Frente
                </button>
                <button
                  type="button"
                  disabled={!canMoveRear}
                  onClick={() => moveBox(0, 1)}
                  className="btn-compact"
                  style={{ fontSize: '11px', padding: '3px 8px', fontWeight: 700 }}
                  title="Mover para trás (↓)"
                >
                  Trás ⬇
                </button>
              </div>

              {/* Separador */}
              <div style={{ width: '1px', height: '18px', background: 'rgba(148, 163, 184, 0.25)' }} />

              {/* Grupo Tamanho */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginRight: '3px' }}>Tamanho:</span>
                <button
                  type="button"
                  disabled={!canShrinkWidth}
                  onClick={() => resizeBox(-1, 0)}
                  className="btn-compact"
                  style={{ fontSize: '11px', padding: '3px 7px', fontWeight: 700 }}
                  title="Encolher largura (Shift + ←)"
                >
                  ◀ Larg -
                </button>
                <button
                  type="button"
                  disabled={!canExpandWidth}
                  onClick={() => resizeBox(1, 0)}
                  className="btn-compact"
                  style={{ fontSize: '11px', padding: '3px 7px', fontWeight: 700 }}
                  title="Esticar largura (Shift + →)"
                >
                  Larg + ▶
                </button>
                <button
                  type="button"
                  disabled={!canShrinkLength}
                  onClick={() => resizeBox(0, -1)}
                  className="btn-compact"
                  style={{ fontSize: '11px', padding: '3px 7px', fontWeight: 700 }}
                  title="Encolher comprimento (Shift + ↑)"
                >
                  ▲ Comp -
                </button>
                <button
                  type="button"
                  disabled={!canExpandLength}
                  onClick={() => resizeBox(0, 1)}
                  className="btn-compact"
                  style={{ fontSize: '11px', padding: '3px 7px', fontWeight: 700 }}
                  title="Esticar comprimento (Shift + ↓)"
                >
                  Comp + ▼
                </button>
              </div>
            </div>

            {/* Isolar e Desmarcar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsolatedBoxId(isolatedBoxId === selectedBox.id ? null : selectedBox.id)}
                className="btn-compact"
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  fontWeight: 700,
                  background: isolatedBoxId === selectedBox.id ? '#0284c7' : 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid #38bdf8',
                  color: '#ffffff'
                }}
                title={isolatedBoxId === selectedBox.id ? 'Restaurar visão completa' : 'Isolar este módulo em 3D'}
              >
                {isolatedBoxId === selectedBox.id ? '← Sair do Foco' : '🔍 Isolar 3D'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedBoxId(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: '2px 7px',
                  lineHeight: '1.2'
                }}
                title="Desmarcar seleção (Esc)"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.3)',
              border: '1px dashed rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              padding: '6px 12px',
              marginBottom: '10px',
              fontSize: '11px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>👉 Clique em qualquer módulo para <strong>mover e redimensionar diretamente aqui</strong> no grid.</span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Teclas [← ↑ ↓ →] navegam o selecionado</span>
          </div>
        )}

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
              gridTemplateColumns: \`repeat(\${cols}, 1fr)\`,
              gridTemplateRows: \`repeat(\${rows}, 68px)\`,
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
                    key={\`cell_\${c}_\${r}\`}
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
              gridTemplateColumns: \`repeat(\${cols}, 1fr)\`,
              gridTemplateRows: \`repeat(\${rows}, 68px)\`,
              gap: '2px',
              padding: '6px',
              pointerEvents: 'none'
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
                  title={isIsolated ? '🎯 Em foco isolado. Dê 2x cliques para voltar.' : \`\${box.name} (\${boxWMm / 10}×\${boxLMm / 10} cm) • Clique para selecionar / 2x cliques para isolar\`}
                  style={{
                    gridColumn: \`\${box.colStart + 1} / span \${box.colSpan}\`,
                    gridRow: \`\${box.rowStart + 1} / span \${box.rowSpan}\`,
                    background: isIsolated
                      ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.95), rgba(30, 58, 138, 0.95))'
                      : isSelected
                      ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.88), rgba(37, 99, 235, 0.88))'
                      : \`linear-gradient(135deg, \${box.color}dd, \${box.color}aa)\`,
                    border: isIsolated
                      ? '2.5px solid #38bdf8'
                      : isSelected
                      ? '2px solid #ffffff'
                      : '1px solid rgba(255, 255, 255, 0.35)',
                    borderRadius: '8px',
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    opacity: isGhosted ? 0.35 : 1,
                    boxShadow: isIsolated
                      ? '0 0 20px rgba(56, 189, 248, 0.95), 0 4px 14px rgba(0, 0, 0, 0.6)'
                      : isSelected
                      ? '0 0 16px rgba(56, 189, 248, 0.85), 0 4px 12px rgba(0, 0, 0, 0.5)'
                      : '0 2px 8px rgba(0, 0, 0, 0.35)',
                    color: '#ffffff',
                    transition: 'border 0.15s ease, box-shadow 0.15s ease',
                    overflow: 'hidden'
                  }}
                >
                  {/* Cabeçalho Compacto: Ícone + Nome + Badges Sutis + Volume */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, overflow: 'hidden' }}>
                      <span style={{ flexShrink: 0, fontSize: '11px' }}>
                        {box.type === 'drawer' ? '📦' : box.type === 'slide_tray' ? '📥' : box.type === 'open' ? '🚪' : box.type === 'slat_bed' ? '🛏️' : '🧰'}
                      </span>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '11px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                        }}
                        title={box.name}
                      >
                        {box.name}
                      </span>
                    </div>

                    {/* Mini badges sutis de recursos e volume */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                      {box.hasStove && <span title="Fogareiro Portátil" style={{ fontSize: '11px' }}>🔥</span>}
                      {box.rearFoldShelf && <span title="Mesa Traseira Rebatível" style={{ fontSize: '11px' }}>🪵</span>}
                      {box.topPerforated && <span title="Tampo Vazado CNC" style={{ fontSize: '11px' }}>🕳️</span>}
                      {isIsolated && (
                        <span
                          title="Foco 3D ativo"
                          style={{
                            fontSize: '9px',
                            background: '#0284c7',
                            border: '1px solid #7dd3fc',
                            padding: '0 3px',
                            borderRadius: '3px',
                            fontWeight: 800
                          }}
                        >
                          🎯
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '9px',
                          background: 'rgba(0, 0, 0, 0.45)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          fontWeight: 700
                        }}
                      >
                        {boxVolL} L
                      </span>
                    </div>
                  </div>

                  {/* Controles de Navegação Direta no Card quando Selecionado */}
                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        background: 'rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: '6px',
                        padding: '2px 4px',
                        margin: '2px 0'
                      }}
                    >
                      {/* D-Pad de Movimento Rápido */}
                      <button
                        type="button"
                        disabled={!canMoveLeft}
                        onClick={() => moveBox(-1, 0)}
                        style={{
                          width: '19px',
                          height: '18px',
                          padding: 0,
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: canMoveLeft ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          borderRadius: '3px',
                          color: canMoveLeft ? '#ffffff' : '#64748b',
                          cursor: canMoveLeft ? 'pointer' : 'not-allowed'
                        }}
                        title="Mover Esquerda"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        disabled={!canMoveFront}
                        onClick={() => moveBox(0, -1)}
                        style={{
                          width: '19px',
                          height: '18px',
                          padding: 0,
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: canMoveFront ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          borderRadius: '3px',
                          color: canMoveFront ? '#ffffff' : '#64748b',
                          cursor: canMoveFront ? 'pointer' : 'not-allowed'
                        }}
                        title="Mover Frente"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={!canMoveRear}
                        onClick={() => moveBox(0, 1)}
                        style={{
                          width: '19px',
                          height: '18px',
                          padding: 0,
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: canMoveRear ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          borderRadius: '3px',
                          color: canMoveRear ? '#ffffff' : '#64748b',
                          cursor: canMoveRear ? 'pointer' : 'not-allowed'
                        }}
                        title="Mover Trás"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        disabled={!canMoveRight}
                        onClick={() => moveBox(1, 0)}
                        style={{
                          width: '19px',
                          height: '18px',
                          padding: 0,
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: canMoveRight ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          borderRadius: '3px',
                          color: canMoveRight ? '#ffffff' : '#64748b',
                          cursor: canMoveRight ? 'pointer' : 'not-allowed'
                        }}
                        title="Mover Direita"
                      >
                        ▶
                      </button>
                    </div>
                  )}

                  {/* Rodapé Compacto */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      fontSize: '9px',
                      opacity: 0.92,
                      lineHeight: 1.1,
                      marginTop: '2px'
                    }}
                  >
                    <span>{boxWMm / 10} × {boxLMm / 10} cm</span>
                    <span
                      style={{
                        fontStyle: 'italic',
                        opacity: 0.85,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '65%'
                      }}
                    >
                      {box.type === 'drawer'
                        ? \`Gaveta (\${box.slideDirection === 'front' ? '▲' : box.slideDirection === 'left' ? '◀' : box.slideDirection === 'right' ? '▶' : '▼'})\`
                        : box.type === 'slide_tray'
                        ? \`Bandeja (\${box.slideDirection === 'front' ? '▲' : box.slideDirection === 'left' ? '◀' : box.slideDirection === 'right' ? '▶' : '▼'})\`
                        : box.type === 'open'
                        ? 'Nicho'
                        : box.type === 'slat_bed'
                        ? \`Cama Ripas (\${box.slatBedDirection === 'left' ? '◀' : box.slatBedDirection === 'right' ? '▶' : box.slatBedDirection === 'rear' ? '▼' : '▲'})\`
                        : \`Baú (\${box.chestHingeDirection === 'rear' ? '▼' : box.chestHingeDirection === 'left' ? '◀' : box.chestHingeDirection === 'right' ? '▶' : '▲'})\`}
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
`;

fs.writeFileSync(targetPath, newCode, 'utf8');
console.log('Successfully updated PlannerFloorGrid.tsx');
