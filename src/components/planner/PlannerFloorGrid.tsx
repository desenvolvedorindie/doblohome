import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, calculateMaxVerticalLift } from '../../types';

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
    setInternalGrid,
    internalBoxes,
    setInternalBoxes,
    selectedBoxId,
    setSelectedBoxId,
    isolatedBoxId,
    addInternalBox,
    updateInternalBox,
    removeInternalBox,
    setIsolatedBoxId,
  } = useSolar();

  const [isDimensionControlsOpen, setIsDimensionControlsOpen] = React.useState<boolean>(true);

  const isDefaultDoblo = internalGrid.widthMm === 1200 && internalGrid.lengthMm === 1700;

  const handleUpdateGridDimensions = (
    newWidthMm: number,
    newLengthMm: number
  ) => {
    const sanitizedW = Math.max(500, Math.min(3000, Math.round(newWidthMm) || 1200));
    const sanitizedL = Math.max(500, Math.min(4000, Math.round(newLengthMm) || 1700));

    setInternalGrid((prev) => ({
      ...prev,
      widthMm: sanitizedW,
      lengthMm: sanitizedL,
      ceiling: prev.ceiling
        ? {
            ...prev.ceiling,
            widthMm: sanitizedW,
            lengthMm: sanitizedL
          }
        : undefined
    }));
  };
  const cellWidthMm = Math.round(internalGrid.widthMm / cols);
  const cellLengthMm = Math.round(internalGrid.lengthMm / rows);

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
  const totalAreaM2 = ((internalGrid.widthMm * internalGrid.lengthMm) / 1_000_000).toFixed(2);

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

  const adjustExtraWidth = (deltaMm: number) => {
    if (!selectedBox) return;
    const currentExtra = selectedBox.extraWidthMm || 0;
    const newExtra = Math.max(-250, Math.min(400, currentExtra + deltaMm));
    updateInternalBox(selectedBox.id, { extraWidthMm: newExtra });
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.5px' }}>
              📐 PLANTA DO GRID DO ASSOALHO DA DOBLÒ
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
              💡 Alargue o grid ou posicione módulos arrastando e usando os controles diretos.
            </div>
          </div>

          {/* Controles Diretos para Alargar / Configurar o Grid */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(30, 41, 59, 0.7)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>Colunas (L):</span>
              <button
                type="button"
                disabled={cols <= 1}
                onClick={() => setInternalGrid(prev => ({ ...prev, colsX: Math.max(1, cols - 1) }))}
                className="btn-compact"
                style={{ padding: '1px 6px', fontSize: '11px', fontWeight: 800, minWidth: '22px' }}
                title="Encolher largura do grid (-1 coluna)"
              >
                -
              </button>
              <strong style={{ color: '#38bdf8', fontSize: '11.5px', minWidth: '16px', textAlign: 'center' }}>{cols}</strong>
              <button
                type="button"
                disabled={cols >= 6}
                onClick={() => setInternalGrid(prev => ({ ...prev, colsX: Math.min(6, cols + 1) }))}
                className="btn-compact"
                style={{ padding: '1px 6px', fontSize: '11px', fontWeight: 800, minWidth: '22px' }}
                title="Alargar o grid (+1 coluna na largura)"
              >
                +
              </button>
              <span style={{ fontSize: '9.5px', color: '#cbd5e1', marginLeft: '2px' }}>({cellWidthCm} cm)</span>
            </div>

            <div style={{ width: '1px', height: '16px', background: 'rgba(148, 163, 184, 0.3)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>Linhas (C):</span>
              <button
                type="button"
                disabled={rows <= 1}
                onClick={() => setInternalGrid(prev => ({ ...prev, rowsZ: Math.max(1, rows - 1) }))}
                className="btn-compact"
                style={{ padding: '1px 6px', fontSize: '11px', fontWeight: 800, minWidth: '22px' }}
                title="Encolher comprimento do grid (-1 linha)"
              >
                -
              </button>
              <strong style={{ color: '#38bdf8', fontSize: '11.5px', minWidth: '16px', textAlign: 'center' }}>{rows}</strong>
              <button
                type="button"
                disabled={rows >= 8}
                onClick={() => setInternalGrid(prev => ({ ...prev, rowsZ: Math.min(8, rows + 1) }))}
                className="btn-compact"
                style={{ padding: '1px 6px', fontSize: '11px', fontWeight: 800, minWidth: '22px' }}
                title="Alongar o grid (+1 linha no comprimento)"
              >
                +
              </button>
              <span style={{ fontSize: '9.5px', color: '#cbd5e1', marginLeft: '2px' }}>({cellLengthCm} cm)</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>
              {occupationPct}% Ocupado ({occupiedVolumeL} L)
            </div>
          </div>
        </div>

        {/* Banner de Informações Globais & Ajuste de Dimensões do Espaço da Doblò */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))',
            border: isDefaultDoblo ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(245, 158, 11, 0.5)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '12px',
            boxShadow: '0 3px 12px rgba(0, 0, 0, 0.35)'
          }}
        >
          {/* Linha 1: Título, Status e Botões de Controle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              paddingBottom: isDimensionControlsOpen ? '10px' : '0',
              borderBottom: isDimensionControlsOpen ? '1px solid rgba(148, 163, 184, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '18px' }}>🚐</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px' }}>
                    ESPAÇO TOTAL DA VAN:
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {internalGrid.widthMm} × {internalGrid.lengthMm} mm
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                    ({(internalGrid.widthMm / 1000).toFixed(2)} × {(internalGrid.lengthMm / 1000).toFixed(2)} m)
                  </span>
                  {isDefaultDoblo ? (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: '#34d399',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                      title="Dimensões padrão de fábrica da Fiat Doblò (1200 mm largura entre caixas de roda × 1700 mm de comprimento útil)"
                    >
                      ✓ Padrão Doblò (1200 × 1700)
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: '#fbbf24',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                      title="Dimensões personalizadas"
                    >
                      ⚡ Personalizado
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                  Área útil: <strong style={{ color: '#f1f5f9' }}>{totalAreaM2} m²</strong> • Altura base: <strong style={{ color: '#f1f5f9' }}>{internalGrid.heightMm} mm ({internalGrid.heightMm / 10} cm)</strong> • Volume: <strong style={{ color: '#f1f5f9' }}>{totalFloorVolumeL} L</strong> • Célula: <strong style={{ color: '#cbd5e1' }}>{cellWidthMm} × {cellLengthMm} mm</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: occupationPct > 90 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                  color: occupationPct > 90 ? '#fca5a5' : '#38bdf8',
                  border: occupationPct > 90 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                {occupationPct}% Ocupado ({occupiedVolumeL} L)
              </span>

              {!isDefaultDoblo && (
                <button
                  type="button"
                  onClick={() => handleUpdateGridDimensions(1200, 1700)}
                  style={{
                    padding: '3px 9px',
                    fontSize: '10px',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Restaurar dimensões padrão da Doblò: 1200 × 1700 mm"
                >
                  ↺ Restaurar Padrão Doblò (1200 × 1700)
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDimensionControlsOpen(prev => !prev)}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: isDimensionControlsOpen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: isDimensionControlsOpen ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: isDimensionControlsOpen ? '#38bdf8' : '#94a3b8',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
                title={isDimensionControlsOpen ? 'Recolher ajuste de medidas' : 'Expandir ajuste de medidas'}
              >
                {isDimensionControlsOpen ? '▲ Fechar Ajustes' : '✏️ Ajustar Medidas'}
              </button>
            </div>
          </div>

          {/* Linha 2: Controles Interativos de Ajuste de Largura, Comprimento e Altura */}
          {isDimensionControlsOpen && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '10px'
                }}
              >
                {/* 1. Ajuste de Largura Total (X) */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.25)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8' }}>
                      ↔ Largura Total (X):
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {(internalGrid.widthMm / 10).toFixed(0)} cm
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleUpdateGridDimensions(internalGrid.widthMm - 50, internalGrid.lengthMm)}
                      style={{
                        padding: '4px 6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Diminuir 50 mm na largura"
                    >
                      -50
                    </button>
                    <input
                      type="number"
                      step={10}
                      min={600}
                      max={2600}
                      value={internalGrid.widthMm}
                      onChange={(e) => handleUpdateGridDimensions(Number(e.target.value), internalGrid.lengthMm)}
                      style={{
                        flex: 1,
                        background: '#090d16',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        fontWeight: 800,
                        fontSize: '12px',
                        textAlign: 'center',
                        borderRadius: '4px',
                        padding: '4px 2px',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>mm</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateGridDimensions(internalGrid.widthMm + 50, internalGrid.lengthMm)}
                      style={{
                        padding: '4px 6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Aumentar 50 mm na largura"
                    >
                      +50
                    </button>
                  </div>
                  {/* Atalhos Rápidos de Largura */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
                    {[1100, 1200, 1300, 1400].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleUpdateGridDimensions(w, internalGrid.lengthMm)}
                        style={{
                          flex: 1,
                          padding: '2px 0',
                          fontSize: '9px',
                          fontWeight: internalGrid.widthMm === w ? 800 : 600,
                          background: internalGrid.widthMm === w ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                          border: internalGrid.widthMm === w ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: internalGrid.widthMm === w ? '#38bdf8' : '#94a3b8',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        {w}{w === 1200 ? ' (Doblò)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Ajuste de Comprimento / Altura do Grid (Z) */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.25)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8' }}>
                      ↕ Comprimento / Altura Útil (Z):
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {(internalGrid.lengthMm / 10).toFixed(0)} cm
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleUpdateGridDimensions(internalGrid.widthMm, internalGrid.lengthMm - 50)}
                      style={{
                        padding: '4px 6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Diminuir 50 mm no comprimento"
                    >
                      -50
                    </button>
                    <input
                      type="number"
                      step={10}
                      min={800}
                      max={3500}
                      value={internalGrid.lengthMm}
                      onChange={(e) => handleUpdateGridDimensions(internalGrid.widthMm, Number(e.target.value))}
                      style={{
                        flex: 1,
                        background: '#090d16',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        fontWeight: 800,
                        fontSize: '12px',
                        textAlign: 'center',
                        borderRadius: '4px',
                        padding: '4px 2px',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>mm</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateGridDimensions(internalGrid.widthMm, internalGrid.lengthMm + 50)}
                      style={{
                        padding: '4px 6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Aumentar 50 mm no comprimento"
                    >
                      +50
                    </button>
                  </div>
                  {/* Atalhos Rápidos de Comprimento */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
                    {[1500, 1700, 1850, 2000].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => handleUpdateGridDimensions(internalGrid.widthMm, l)}
                        style={{
                          flex: 1,
                          padding: '2px 0',
                          fontSize: '9px',
                          fontWeight: internalGrid.lengthMm === l ? 800 : 600,
                          background: internalGrid.lengthMm === l ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                          border: internalGrid.lengthMm === l ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: internalGrid.lengthMm === l ? '#38bdf8' : '#94a3b8',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        {l}{l === 1700 ? ' (Doblò)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nota de Recálculo Automático */}
              <div
                style={{
                  fontSize: '9.5px',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '4px',
                  paddingTop: '4px'
                }}
              >
                <span>
                  💡 <strong>Espaço Útil da Van:</strong> A largura e o comprimento úteis definem a malha do piso, teto 3D e plano de corte geral. A altura de cada módulo é configurada individualmente em suas propriedades.
                </span>
                <span style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  Piso: {internalGrid.widthMm} × {internalGrid.lengthMm} mm • {cols}×{rows} = {cols * rows} células de {cellWidthMm}×{cellLengthMm} mm
                </span>
              </div>
            </div>
          )}
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
              gridTemplateRows: `repeat(${rows}, 68px)`,
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
              gridTemplateRows: `repeat(${rows}, 68px)`,
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
                  title={isIsolated ? '🎯 Em foco isolado. Dê 2x cliques para voltar.' : `${box.name} (${boxWMm / 10}×${boxLMm / 10} cm) • Clique para selecionar / 2x cliques para isolar`}
                  style={{
                    gridColumn: `${box.colStart + 1} / span ${box.colSpan}`,
                    gridRow: `${box.rowStart + 1} / span ${box.rowSpan}`,
                    zIndex: isSelected ? 15 : 1,
                    background: isIsolated
                      ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.95), rgba(30, 58, 138, 0.95))'
                      : isSelected
                      ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.92), rgba(37, 99, 235, 0.92))'
                      : `linear-gradient(135deg, ${box.color}dd, ${box.color}aa)`,
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
                      ? '0 0 18px rgba(56, 189, 248, 0.9), 0 6px 18px rgba(0, 0, 0, 0.7)'
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
                        {box.type === 'drawer' ? '📦' : box.type === 'slide_tray' ? '📥' : box.type === 'open' ? '🚪' : box.type === 'slat_bed' ? '🛏️' : box.type === 'vertical_lift' ? '🏗️' : '🧰'}
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
                      {box.hasBed && box.type !== 'slat_bed' && <span title="Cama / Sofá-Cama Acoplada" style={{ fontSize: '11px' }}>🛏️</span>}
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
                        ? `Gaveta (${box.slideDirection === 'front' ? '▲' : box.slideDirection === 'left' ? '◀' : box.slideDirection === 'right' ? '▶' : '▼'})`
                        : box.type === 'slide_tray'
                        ? `Bandeja (${box.slideDirection === 'front' ? '▲' : box.slideDirection === 'left' ? '◀' : box.slideDirection === 'right' ? '▶' : '▼'})`
                        : box.type === 'vertical_lift'
                        ? `Elevatório (+${Math.min(calculateMaxVerticalLift(box.heightMm), box.liftHeightMm ?? Math.min(250, calculateMaxVerticalLift(box.heightMm)))}mm)`
                        : box.type === 'open'
                        ? 'Nicho'
                        : box.type === 'slat_bed'
                        ? `${box.bedMode === 'hinged' ? 'Cama Dobradiça' : 'Cama Ripas'} (${box.slatBedDirection === 'left' ? '◀' : box.slatBedDirection === 'right' ? '▶' : box.slatBedDirection === 'rear' ? '▼' : '▲'})`
                        : `Baú (${box.chestHingeDirection === 'rear' ? '▼' : box.chestHingeDirection === 'left' ? '◀' : box.chestHingeDirection === 'right' ? '▶' : '▲'})`}
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

        {/* Painel de Controle de Posição & Deslocamento em Baixo do Grid */}
        {selectedBox ? (
          <div
            style={{
              marginTop: '10px',
              padding: '10px 14px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1.5px solid rgba(56, 189, 248, 0.45)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Linha de Título do Módulo Selecionado */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                  {selectedBox.name}
                </span>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  ({selectedBoxWMm / 10} × {selectedBoxLMm / 10} cm • {selectedBoxVolL} L)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBoxId(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '4px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px'
                }}
                title="Desmarcar módulo"
              >
                ✕ Desmarcar
              </button>
            </div>

            {/* Linha de Botões de Ação */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
              {/* Grupo 1: Deslocar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Deslocar:
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    disabled={!canMoveLeft}
                    onClick={() => moveBox(-1, 0)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '5px 9px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canMoveLeft ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: canMoveLeft ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canMoveLeft ? '#38bdf8' : '#64748b',
                      cursor: canMoveLeft ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Deslocar Esquerda (←)"
                  >
                    ◀ Esq
                  </button>
                  <button
                    type="button"
                    disabled={!canMoveFront}
                    onClick={() => moveBox(0, -1)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '5px 9px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canMoveFront ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: canMoveFront ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canMoveFront ? '#38bdf8' : '#64748b',
                      cursor: canMoveFront ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Deslocar Frente (↑)"
                  >
                    ▲ Frente
                  </button>
                  <button
                    type="button"
                    disabled={!canMoveRear}
                    onClick={() => moveBox(0, 1)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '5px 9px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canMoveRear ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: canMoveRear ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canMoveRear ? '#38bdf8' : '#64748b',
                      cursor: canMoveRear ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Deslocar Trás (↓)"
                  >
                    ▼ Trás
                  </button>
                  <button
                    type="button"
                    disabled={!canMoveRight}
                    onClick={() => moveBox(1, 0)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '5px 9px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canMoveRight ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: canMoveRight ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canMoveRight ? '#38bdf8' : '#64748b',
                      cursor: canMoveRight ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Deslocar Direita (→)"
                  >
                    ▶ Dir
                  </button>
                </div>
              </div>

              {/* Grupo 2: Aumentar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Tamanho:
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    disabled={!canShrinkWidth}
                    onClick={() => resizeBox(-1, 0)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canShrinkWidth ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: canShrinkWidth ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canShrinkWidth ? '#ffffff' : '#64748b',
                      cursor: canShrinkWidth ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Encolher Largura (-1 col)"
                  >
                    -L
                  </button>
                  <button
                    type="button"
                    disabled={!canExpandWidth}
                    onClick={() => resizeBox(1, 0)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canExpandWidth ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: canExpandWidth ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canExpandWidth ? '#ffffff' : '#64748b',
                      cursor: canExpandWidth ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Aumentar Largura (+1 col)"
                  >
                    +L
                  </button>
                  <button
                    type="button"
                    disabled={!canShrinkLength}
                    onClick={() => resizeBox(0, -1)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canShrinkLength ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: canShrinkLength ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canShrinkLength ? '#ffffff' : '#64748b',
                      cursor: canShrinkLength ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Encolher Comprimento (-1 lin)"
                  >
                    -C
                  </button>
                  <button
                    type="button"
                    disabled={!canExpandLength}
                    onClick={() => resizeBox(0, 1)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canExpandLength ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: canExpandLength ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canExpandLength ? '#ffffff' : '#64748b',
                      cursor: canExpandLength ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Aumentar Comprimento (+1 lin)"
                  >
                    +C
                  </button>
                </div>
              </div>

              {/* Grupo 3: Ajuste Fino */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                  Ajuste Fino:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => adjustExtraWidth(-10)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(245, 158, 11, 0.18)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '5px',
                      color: '#fbbf24',
                      cursor: 'pointer',
                      lineHeight: 1
                    }}
                    title="Reduzir 10 mm na largura"
                  >
                    -10mm L
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustExtraWidth(10)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(245, 158, 11, 0.18)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '5px',
                      color: '#fbbf24',
                      cursor: 'pointer',
                      lineHeight: 1
                    }}
                    title="Aumentar 10 mm na largura"
                  >
                    +10mm L
                  </button>
                  {(selectedBox.extraWidthMm || 0) !== 0 && (
                    <span style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700, marginLeft: '2px' }}>
                      {(selectedBox.extraWidthMm || 0) > 0 ? `+${selectedBox.extraWidthMm}` : selectedBox.extraWidthMm}mm
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dica de Teclado */}
            <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center', marginTop: '2px' }}>
              Dica: Você também pode usar as setas ◀ ▲ ▼ ▶ do teclado para deslocar o módulo selecionado.
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', padding: '6px', fontStyle: 'italic', marginTop: '6px' }}>
            💡 Dica: Clique em qualquer módulo no grid acima para selecioná-lo e deslocá-lo pelo piso.
          </div>
        )}
      </div>
    </>
  );
};
