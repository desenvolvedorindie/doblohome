import React, { useState, useRef } from 'react';
import { useSolar } from '../context/SolarContext';
import { InternalBoxItem, InternalBoxMaterial, InternalBoxType, ChestHingeDirection, SlatBedDirection, BoxPanelsConfig } from '../types';
import { INTERNAL_BOXES_PRESETS } from '../data/internalBoxesPresets';

export const InternalBoxesPlanner: React.FC = () => {
  const {
    internalGrid,
    setInternalGrid,
    internalBoxes,
    selectedBoxId,
    setSelectedBoxId,
    isolatedBoxId,
    setIsolatedBoxId,
    isOpenPreview,
    setIsOpenPreview,
    applyInternalBoxesPreset,
    addInternalBox,
    updateInternalBox,
    removeInternalBox,
    clearInternalBoxes
  } = useSolar();

  // Estado de seleção por arraste (drag-to-select)
  const [dragStart, setDragStart] = useState<{ col: number; row: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ col: number; row: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const cols = Math.max(1, internalGrid.colsX);
  const rows = Math.max(1, internalGrid.rowsZ);

  const cellWidthCm = (internalGrid.widthMm / cols / 10).toFixed(1);
  const cellLengthCm = (internalGrid.lengthMm / rows / 10).toFixed(1);

  // Volumes
  const totalFloorVolumeL = Math.round(
    (internalGrid.widthMm / 1000) * (internalGrid.lengthMm / 1000) * (internalGrid.heightMm / 1000) * 1000
  );

  const occupiedVolumeL = internalBoxes.reduce((acc, box) => {
    const boxWM = (box.colSpan * (internalGrid.widthMm / cols)) / 1000;
    const boxLM = (box.rowSpan * (internalGrid.lengthMm / rows)) / 1000;
    const boxHM = (box.heightMm || internalGrid.heightMm) / 1000;
    return acc + Math.round(boxWM * boxLM * boxHM * 1000);
  }, 0);

  const occupationPct = Math.min(100, Math.round((occupiedVolumeL / (totalFloorVolumeL || 1)) * 100));

  // Caixa selecionada atualmente
  const selectedBox = internalBoxes.find(b => b.id === selectedBoxId);
  const isolatedBox = internalBoxes.find(b => b.id === isolatedBoxId);

  // Manipulação de arraste para seleção de células
  const handleCellMouseDown = (col: number, row: number, e: React.MouseEvent) => {
    // Se clicou com botão esquerdo
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

    const minCol = Math.min(dragStart.col, dragCurrent.col);
    const maxCol = Math.max(dragStart.col, dragCurrent.col);
    const minRow = Math.min(dragStart.row, dragCurrent.row);
    const maxRow = Math.max(dragStart.row, dragCurrent.row);

    const colSpan = maxCol - minCol + 1;
    const rowSpan = maxRow - minRow + 1;

    // Se a seleção cobre pelo menos 1 célula e não colide exatamente com o clique de seleção de uma caixa existente
    const isDrawerByDefault = minRow >= Math.floor(rows / 2);
    const defaultType: InternalBoxType = isDrawerByDefault ? 'drawer' : 'chest';
    const defaultName = isDrawerByDefault
      ? `Gavetão Traseiro (${colSpan}x${rowSpan})`
      : `Baú Superior (${colSpan}x${rowSpan})`;

    const colors = ['#2563eb', '#d97706', '#059669', '#7c3aed', '#0284c7', '#dc2626'];
    const randomColor = colors[internalBoxes.length % colors.length];

    addInternalBox({
      name: defaultName,
      type: defaultType,
      colStart: minCol,
      colSpan,
      rowStart: minRow,
      rowSpan,
      heightMm: internalGrid.heightMm,
      color: randomColor,
      material: 'plywood'
    });

    setDragStart(null);
    setDragCurrent(null);
  };

  // Cálculo de bounding box do arraste para renderização visual
  const getDragRect = () => {
    if (!dragStart || !dragCurrent) return null;
    const minCol = Math.min(dragStart.col, dragCurrent.col);
    const maxCol = Math.max(dragStart.col, dragCurrent.col);
    const minRow = Math.min(dragStart.row, dragCurrent.row);
    const maxRow = Math.max(dragStart.row, dragCurrent.row);
    return { minCol, maxCol, minRow, maxRow };
  };

  const dragRect = getDragRect();

  return (
    <div className="internal-boxes-planner" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Barra de Ações Rápidas e Presets */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '10px 12px',
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: '10px',
          border: '1px solid rgba(56, 189, 248, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
            📦 Presets de Layout:
          </span>
          {INTERNAL_BOXES_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyInternalBoxesPreset(p.id)}
              className="btn-compact"
              style={{
                fontSize: '10.5px',
                padding: '4px 8px',
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#e2e8f0',
                borderRadius: '6px'
              }}
              title={p.description}
            >
              {p.name.split(':')[0]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Iluminação em Perfil de LED no Rodapé do Assoalho */}
          <button
            onClick={() => {
              const currentEnabled = internalGrid.ledBaseboard?.enabled ?? true;
              setInternalGrid(prev => ({
                ...prev,
                ledBaseboard: {
                  enabled: !currentEnabled,
                  color: prev.ledBaseboard?.color || '#fef3c7',
                  brightness: prev.ledBaseboard?.brightness ?? 85
                }
              }));
            }}
            className="btn-compact"
            style={{
              fontSize: '11px',
              padding: '5px 10px',
              fontWeight: 700,
              background: (internalGrid.ledBaseboard?.enabled ?? true)
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))'
                : 'rgba(30, 41, 59, 0.6)',
              borderColor: (internalGrid.ledBaseboard?.enabled ?? true) ? '#f59e0b' : 'rgba(148, 163, 184, 0.3)',
              color: (internalGrid.ledBaseboard?.enabled ?? true) ? '#fbbf24' : '#94a3b8'
            }}
            title="Alternar fita de LED COB no rodapé do assoalho"
          >
            💡 LED Rodapé: {(internalGrid.ledBaseboard?.enabled ?? true) ? 'Ligado' : 'Desligado'}
          </button>

          <button
            onClick={() => {
              const next = !isOpenPreview;
              setIsOpenPreview(next);
              // Quando abre a prévia, se houver cama retrátil, abre 100% (abrir toda a cama com colchão casal)
              if (next) {
                internalBoxes.forEach(b => {
                  if (b.type === 'slat_bed') {
                    updateInternalBox(b.id, { slatExtensionPercent: 100 });
                  }
                });
              }
            }}
            className="btn-compact primary"
            style={{
              fontSize: '11px',
              padding: '5px 12px',
              fontWeight: 700,
              background: isOpenPreview ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #0284c7, #2563eb)'
            }}
          >
            {isOpenPreview ? '🛋️ Modo Sofá / Fechar' : '🛌 Abrir Toda a Cama (100%)'}
          </button>
          <button
            onClick={clearInternalBoxes}
            className="btn-compact"
            style={{
              fontSize: '11px',
              padding: '5px 10px',
              color: '#f87171',
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}
            title="Remover todas as caixas"
          >
            🧹 Limpar
          </button>
        </div>
      </div>

      {/* Banner de Modo de Foco Isolado */}
      {isolatedBox && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1.5px solid #38bdf8',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setIsolatedBoxId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: '1px solid #7dd3fc',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.15s ease'
              }}
              title="Voltar para visualizar e editar todos os demais baús"
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>←</span> Voltar
            </button>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#7dd3fc', fontWeight: 800, letterSpacing: '0.05em' }}>
                Modo de Visualização Isolada
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
                Visualizando apenas: <span style={{ color: '#38bdf8' }}>{isolatedBox.name}</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
            Demais baús transparentes no 3D<br />
            <span style={{ color: '#64748b', fontSize: '10px' }}>Clique na setinha ou dê duplo clique no fundo para voltar</span>
          </div>
        </div>
      )}

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
              const boxWMm = Math.round(box.colSpan * (internalGrid.widthMm / cols));
              const boxLMm = Math.round(box.rowSpan * (internalGrid.lengthMm / rows));
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
                      {(box.hasCentralTable || box.centralTable?.enabled) && (
                        <span
                          title="Mesa Dinette Central c/ Pedestal Náutico"
                          style={{
                            marginLeft: '4px',
                            fontSize: '9px',
                            background: 'rgba(2, 132, 199, 0.4)',
                            border: '1px solid #38bdf8',
                            padding: '1px 4px',
                            borderRadius: '3px'
                          }}
                        >
                          🍽️ Mesa Central
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
                        ? `Gaveta${box.topPerforated ? ' • Vazada' : ''}`
                        : box.type === 'open'
                        ? `Nicho${box.topPerforated ? ' • Vazado' : ''}`
                        : box.type === 'slat_bed'
                        ? `Cama Ripas (${box.slatBedDirection === 'left' ? '◀ Esq' : box.slatBedDirection === 'right' ? '▶ Dir' : box.slatBedDirection === 'rear' ? '▼ Trás' : '▲ Frente'})`
                        : `Baú (${box.chestHingeDirection === 'rear' ? '▼ Trás' : box.chestHingeDirection === 'left' ? '◀ Esq' : box.chestHingeDirection === 'right' ? '▶ Dir' : '▲ Frente'})${box.topPerforated ? ' • Vazado' : ''}`}
                      {box.rearFoldShelf ? ' + 🪵 Mesa Rebatível' : ''}
                      {(box.hasCentralTable || box.centralTable?.enabled) ? ' + 🍽️ Mesa Central' : ''}
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

      {/* 3. Editor e Inspetor da Caixa Selecionada */}
      {selectedBox && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            borderRadius: '12px',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
                🛠️ PROPRIEDADES DO ARMAZENADOR SELECIONADO
              </div>
              {isolatedBoxId === selectedBox.id && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    background: 'rgba(2, 132, 199, 0.4)',
                    border: '1px solid #38bdf8',
                    color: '#7dd3fc',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}
                >
                  🎯 MODO FOCO ATIVO
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsolatedBoxId(isolatedBoxId === selectedBox.id ? null : selectedBox.id)}
                className="btn-compact"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  background: isolatedBoxId === selectedBox.id ? '#0284c7' : 'rgba(56, 189, 248, 0.15)',
                  color: isolatedBoxId === selectedBox.id ? '#ffffff' : '#38bdf8',
                  border: '1px solid #38bdf8'
                }}
                title={isolatedBoxId === selectedBox.id ? 'Voltar para exibir todos os demais baús' : 'Isolar este baú no 3D e tornar os outros transparentes'}
              >
                {isolatedBoxId === selectedBox.id ? '← Voltar (Exibir Todos)' : '🎯 Isolar no 3D (2x cliques)'}
              </button>
              <button
                onClick={() => removeInternalBox(selectedBox.id)}
                className="btn-compact"
                style={{
                  fontSize: '10.5px',
                  padding: '4px 8px',
                  color: '#f87171',
                  borderColor: 'rgba(239, 68, 68, 0.4)'
                }}
              >
                🗑️ Excluir Caixa
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {/* Nome */}
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Nome do Módulo:
              </label>
              <input
                type="text"
                value={selectedBox.name}
                onChange={(e) => updateInternalBox(selectedBox.id, { name: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#ffffff',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
            </div>

            {/* Tipo de Abertura */}
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Tipo de Abertura / Mecanismo:
              </label>
              <select
                value={selectedBox.type}
                onChange={(e) => {
                  const newType = e.target.value as InternalBoxType;
                  updateInternalBox(selectedBox.id, {
                    type: newType,
                    drawerMode: newType === 'slide_tray' ? 'slide_tray' : newType === 'drawer' ? 'drawer' : undefined
                  });
                }}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#ffffff',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              >
                <option value="chest">🧰 Baú com Tampa Basculante Superior</option>
                <option value="drawer">📦 Gavetão Deslizante Traseiro</option>
                <option value="slide_tray">🛝 Bandeja Corrediça Rasa (Geladeira 12V / Fogão)</option>
                <option value="slat_bed">🛏️ Cama Retrátil com Ripas (Sofá-Cama Extensível)</option>
                <option value="open">🚪 Nicho / Compartimento Aberto</option>
              </select>
            </div>

            {/* Alternância entre Gavetão e Bandeja Corrediça */}
            {(selectedBox.type === 'drawer' || selectedBox.type === 'slide_tray') && (
              <div>
                <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Modo do Módulo Deslizante:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button
                    type="button"
                    className={`btn-compact ${selectedBox.type === 'drawer' && selectedBox.drawerMode !== 'slide_tray' ? 'active' : ''}`}
                    onClick={() => updateInternalBox(selectedBox.id, { type: 'drawer', drawerMode: 'drawer' })}
                    style={{
                      fontSize: '11px',
                      padding: '8px 6px',
                      fontWeight: 700,
                      background: selectedBox.type === 'drawer' && selectedBox.drawerMode !== 'slide_tray'
                        ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(37, 99, 235, 0.4))'
                        : undefined
                    }}
                  >
                    📦 Gavetão Alto Fechado
                  </button>
                  <button
                    type="button"
                    className={`btn-compact ${selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray' ? 'active' : ''}`}
                    onClick={() => updateInternalBox(selectedBox.id, { type: 'slide_tray', drawerMode: 'slide_tray' })}
                    style={{
                      fontSize: '11px',
                      padding: '8px 6px',
                      fontWeight: 700,
                      background: selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray'
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.4))'
                        : undefined,
                      borderColor: selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray' ? '#f59e0b' : undefined,
                      color: selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray' ? '#fbbf24' : undefined
                    }}
                  >
                    🛝 Bandeja Corrediça Rasa
                  </button>
                </div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>
                  {selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray'
                    ? '• Abas baixas de contenção (45mm) com corrediças telescópicas reforçadas 45kg c/ trava para deslizar geladeira 12V ou fogão portátil.'
                    : '• Gavetão fechado tradicional com laterais altas e frente total em compensado naval 15mm.'}
                </div>
              </div>
            )}

            {/* Direção da Dobradiça (Exclusivo para Baú) */}
            {selectedBox.type === 'chest' && (
              <div>
                <label style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Direção de Abertura do Baú:
                </label>
                <select
                  value={selectedBox.chestHingeDirection || 'front'}
                  onChange={(e) => {
                    const newDir = e.target.value as ChestHingeDirection;
                    updateInternalBox(selectedBox.id, { chestHingeDirection: newDir });
                    setIsOpenPreview(true);
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    color: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <option value="front">▲ Frente (Dobradiça na Frente / Bancos)</option>
                  <option value="rear">▼ Trás (Dobradiça no Porta-Malas)</option>
                  <option value="left">◀ Esquerda (Dobradiça no Lado do Motorista)</option>
                  <option value="right">▶ Direita (Dobradiça no Lado do Passageiro)</option>
                </select>
              </div>
            )}

            {/* Configuração Exclusiva para Cama Retrátil com Ripas */}
            {selectedBox.type === 'slat_bed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                    🧭 Direção de Abertura / Deslizamento das Ripas:
                  </label>
                  <select
                    value={selectedBox.slatBedDirection || 'left'}
                    onChange={(e) => {
                      const newDir = e.target.value as SlatBedDirection;
                      updateInternalBox(selectedBox.id, { slatBedDirection: newDir });
                      setIsOpenPreview(true);
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(56, 189, 248, 0.6)',
                      color: '#ffffff',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    <option value="left">◀ Esquerda (Abre p/ Lado do Motorista)</option>
                    <option value="right">▶ Direita (Abre p/ Lado do Passageiro)</option>
                    <option value="front">▲ Frente (Abre em Direção aos Bancos Dianteiros)</option>
                    <option value="rear">▼ Trás (Abre em Direção ao Porta-Malas)</option>
                  </select>
                </div>

                {/* Extensão e Botão de Abrir Toda a Cama */}
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                    <span>Extensão do Estrado Retrátil:</span>
                    <span style={{ fontWeight: 800, color: '#38bdf8' }}>{selectedBox.slatExtensionPercent ?? 85}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={selectedBox.slatExtensionPercent ?? 85}
                    onChange={(e) => {
                      updateInternalBox(selectedBox.id, { slatExtensionPercent: parseInt(e.target.value) });
                      setIsOpenPreview(true);
                    }}
                    style={{ width: '100%' }}
                  />
                  <button
                    type="button"
                    className="btn-compact primary"
                    onClick={() => {
                      const next = !isOpenPreview;
                      setIsOpenPreview(next);
                      if (next) {
                        updateInternalBox(selectedBox.id, { slatExtensionPercent: 100 });
                      }
                    }}
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      padding: '6px 10px',
                      fontWeight: 800,
                      fontSize: '11px',
                      background: isOpenPreview
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.4))'
                        : 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(37, 99, 235, 0.35))',
                      borderColor: isOpenPreview ? '#10b981' : '#38bdf8',
                      color: isOpenPreview ? '#34d399' : '#38bdf8'
                    }}
                  >
                    {isOpenPreview ? '🛋️ Recolher Cama (Modo Sofá)' : '🛌 Abrir Toda a Cama (100% Casal)'}
                  </button>
                  <div style={{ fontSize: '9.5px', color: '#cbd5e1', marginTop: '4px' }}>
                    • Ao abrir toda a cama, inclui o colchão bipartido em espuma D33 desdobrado cobrindo as ripas e os pés de apoio no assoalho.
                  </div>
                </div>
              </div>
            )}

            {/* Material / Acabamento */}
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Material / Textura 3D:
              </label>
              <select
                value={selectedBox.material}
                onChange={(e) => updateInternalBox(selectedBox.id, { material: e.target.value as InternalBoxMaterial })}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#ffffff',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              >
                <option value="plywood">🪵 Compensado Naval Claro (Padrão Camper)</option>
                <option value="dark_wood">🪵 Madeira Nobre / Escura</option>
                <option value="white_mdf">⚪ MDF Branco Acetinado</option>
                <option value="aluminum_box">⚙️ Gabinete Alumínio Estrutural</option>
              </select>
            </div>

            {/* Altura da Caixa */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                <span>Altura da Caixa:</span>
                <span style={{ fontWeight: 800, color: '#38bdf8' }}>{selectedBox.heightMm} mm ({(selectedBox.heightMm / 10).toFixed(0)} cm)</span>
              </div>
              <input
                type="range"
                min={200}
                max={700}
                step={10}
                value={selectedBox.heightMm}
                onChange={(e) => updateInternalBox(selectedBox.id, { heightMm: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Painel de Controle Avançado da Cama Retrátil com Ripas */}
          {selectedBox.type === 'slat_bed' && (() => {
            const isLateral = (selectedBox.slatBedDirection || 'left') === 'left' || selectedBox.slatBedDirection === 'right';
            const baseDimMm = Math.round(isLateral
              ? selectedBox.colSpan * (internalGrid.widthMm / cols)
              : selectedBox.rowSpan * (internalGrid.lengthMm / rows));
            const extPct = Math.min(100, Math.max(40, selectedBox.slatExtensionPercent ?? 85));
            const extDimMm = Math.round(baseDimMm * (1 + extPct / 100));

            return (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(37, 99, 235, 0.08))',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🛏️ Extensão do Estrado de Ripas Deslizantes
                  </span>
                  <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>
                    {extPct}% de curso (+{Math.round(baseDimMm * (extPct / 100) / 10)} cm)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '6px' }}>
                  <span>{isLateral ? '↔ Largura Recolhida:' : '↕ Comprimento Recolhido:'} <strong>{(baseDimMm / 10).toFixed(0)} cm</strong></span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>➔ Estendida: <strong>{(extDimMm / 10).toFixed(0)} cm</strong></span>
                </div>

                <input
                  type="range"
                  min={40}
                  max={100}
                  step={5}
                  value={extPct}
                  onChange={(e) => {
                    updateInternalBox(selectedBox.id, { slatExtensionPercent: Number(e.target.value) });
                    setIsOpenPreview(true);
                  }}
                  style={{ width: '100%', marginBottom: '8px' }}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '9.5px',
                    color: '#94a3b8',
                    lineHeight: 1.4,
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(148, 163, 184, 0.2)'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>💡</span>
                  <span>
                    <strong>Sistema Pente de Ripas:</strong> As ripas de compensado naval de 15mm correm entrelaçadas.
                    Ao puxar o estrado móvel na direção <strong>{selectedBox.slatBedDirection === 'left' ? 'Esquerda (Motorista)' : selectedBox.slatBedDirection === 'right' ? 'Direita (Passageiro)' : selectedBox.slatBedDirection === 'front' ? 'Frente (Bancos)' : 'Traseira (Porta-malas)'}</strong>,
                    ele desliza suavemente sobre guias e apoia no assoalho através dos pés retráteis.
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Tamponamento & Fechamento de Chapas (15mm) */}
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📐 Tamponamento das Faces (15mm)
              </span>
              <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                Ativar / Omitir Chapas
              </span>
            </div>
            <p style={{ fontSize: '9.5px', color: '#94a3b8', margin: '0 0 8px 0', lineHeight: 1.35 }}>
              Omita chapas em módulos contíguos para evitar paredes duplas (30mm) ou abrir comunicação entre caixas:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {[
                {
                  key: 'front' as keyof BoxPanelsConfig,
                  label: '⬆️ Frente (Bancos)',
                  val: selectedBox.panels?.front ?? true,
                  desc: 'Parede dianteira (+Z)'
                },
                {
                  key: 'rear' as keyof BoxPanelsConfig,
                  label: '⬇️ Fundo (Porta-malas)',
                  val: selectedBox.panels?.rear ?? (selectedBox.type !== 'drawer'),
                  desc: 'Parede traseira (-Z)'
                },
                {
                  key: 'left' as keyof BoxPanelsConfig,
                  label: '⬅️ Lateral Esquerda',
                  val: selectedBox.panels?.left ?? true,
                  desc: 'Lado motorista (+X)'
                },
                {
                  key: 'right' as keyof BoxPanelsConfig,
                  label: '➡️ Lateral Direita',
                  val: selectedBox.panels?.right ?? true,
                  desc: 'Lado passageiro (-X)'
                },
                {
                  key: 'top' as keyof BoxPanelsConfig,
                  label: selectedBox.type === 'chest' ? '🔝 Tampa Basculante' : selectedBox.type === 'slat_bed' ? '🔝 Estrado de Ripas' : '🔝 Tampo Superior',
                  val: selectedBox.panels?.top ?? (selectedBox.type !== 'open'),
                  desc: 'Fechamento superior (+Y)'
                },
                {
                  key: 'bottom' as keyof BoxPanelsConfig,
                  label: '⏹️ Fundo da Base',
                  val: selectedBox.panels?.bottom ?? false,
                  desc: 'Chapa extra no piso (-Y)'
                }
              ].map((panel) => {
                const isActive = panel.val;
                return (
                  <button
                    key={panel.key}
                    type="button"
                    onClick={() => {
                      const currentPanels: BoxPanelsConfig = {
                        front: selectedBox.panels?.front ?? true,
                        rear: selectedBox.panels?.rear ?? (selectedBox.type !== 'drawer'),
                        left: selectedBox.panels?.left ?? true,
                        right: selectedBox.panels?.right ?? true,
                        top: selectedBox.panels?.top ?? (selectedBox.type !== 'open'),
                        bottom: selectedBox.panels?.bottom ?? false,
                        ...selectedBox.panels
                      };
                      updateInternalBox(selectedBox.id, {
                        panels: {
                          ...currentPanels,
                          [panel.key]: !isActive
                        }
                      });
                    }}
                    style={{
                      background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      border: isActive ? '1px solid #10b981' : '1px dashed rgba(148, 163, 184, 0.3)',
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
                      <span style={{ fontSize: '10px', fontWeight: 700, color: isActive ? '#f8fafc' : '#94a3b8' }}>
                        {panel.label}
                      </span>
                      <span
                        style={{
                          fontSize: '8.5px',
                          fontWeight: 800,
                          color: isActive ? '#34d399' : '#f87171',
                          background: isActive ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                          padding: '1px 4px',
                          borderRadius: '3px'
                        }}
                      >
                        {isActive ? '✓ COM' : '✗ SEM'}
                      </span>
                    </div>
                    <span style={{ fontSize: '8px', color: '#64748b' }}>
                      {panel.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opção de Tampo / Tampa Superior Vazada (Alívio de Peso e Aeração do Colchão) */}
          {selectedBox.type !== 'slat_bed' && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: selectedBox.topPerforated
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08))'
                  : 'rgba(30, 41, 59, 0.45)',
                border: selectedBox.topPerforated
                  ? '1px solid rgba(16, 185, 129, 0.5)'
                  : '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: selectedBox.topPerforated ? '#34d399' : '#e2e8f0' }}>
                    🕳️ Tampa / Tampo Superior Vazado (Usinagem CNC)
                  </span>
                  <span
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 800,
                      color: selectedBox.topPerforated ? '#10b981' : '#94a3b8',
                      background: selectedBox.topPerforated ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {selectedBox.topPerforated ? '🍃 VAZADO ATIVO (-35% peso)' : 'SÓLIDO (Padrão)'}
                  </span>
                </div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
                  Grade de furos passantes para <strong>alívio de peso da madeira (~35% mais leve)</strong> e <strong>aeração contínua sob o colchão</strong> (evita mofo e condensação em viagens).
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateInternalBox(selectedBox.id, { topPerforated: !selectedBox.topPerforated })}
                className="btn-compact"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '6px 12px',
                  whiteSpace: 'nowrap',
                  background: selectedBox.topPerforated
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'rgba(51, 65, 85, 0.8)',
                  borderColor: selectedBox.topPerforated ? '#34d399' : 'rgba(148, 163, 184, 0.4)',
                  color: '#ffffff'
                }}
              >
                {selectedBox.topPerforated ? '✓ Vazado Ativo' : 'Tornar Vazado'}
              </button>
            </div>
          )}

          {/* Opção de Mesa Central Dinette c/ Pedestal Náutico e Deslocamento X/Z/Altura/Giro */}
          {(selectedBox.panels?.top ?? (selectedBox.type !== 'open')) && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                background: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled)
                  ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.18), rgba(37, 99, 235, 0.10))'
                  : 'rgba(30, 41, 59, 0.45)',
                border: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled)
                  ? '1px solid rgba(56, 189, 248, 0.6)'
                  : '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? '10px' : '0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? '#38bdf8' : '#e2e8f0' }}>
                      🍽️ Mesa Dinette Central c/ Pedestal Náutico (Foto da Van)
                    </span>
                    <span
                      style={{
                        fontSize: '8.5px',
                        fontWeight: 800,
                        color: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? '#38bdf8' : '#94a3b8',
                        background: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {(selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? '✓ MESA ATIVA' : 'DESATIVADA'}
                    </span>
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
                    Mesa central de apoio e refeições com <strong>coluna tubular preta fixada por braçadeiras duplas</strong> e <strong>tampo em madeira com cantos arredondados</strong>. Permite deslocamento livre (frente/trás, lateral, altura e giro 360°).
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const willEnable = !(selectedBox.hasCentralTable || selectedBox.centralTable?.enabled);
                    updateInternalBox(selectedBox.id, {
                      hasCentralTable: willEnable,
                      centralTable: {
                        enabled: willEnable,
                        widthMm: selectedBox.centralTable?.widthMm ?? 450,
                        lengthMm: selectedBox.centralTable?.lengthMm ?? 650,
                        heightMm: selectedBox.centralTable?.heightMm ?? 720,
                        offsetX: selectedBox.centralTable?.offsetX ?? 0,
                        offsetZ: selectedBox.centralTable?.offsetZ ?? 0,
                        rotationDeg: selectedBox.centralTable?.rotationDeg ?? 0,
                        finish: selectedBox.centralTable?.finish ?? (selectedBox.rearShelfFinish || 'pine_block')
                      }
                    });
                  }}
                  className="btn-compact"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '6px 12px',
                    whiteSpace: 'nowrap',
                    background: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled)
                      ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                      : 'rgba(51, 65, 85, 0.8)',
                    borderColor: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? '#38bdf8' : 'rgba(148, 163, 184, 0.4)',
                    color: '#ffffff'
                  }}
                >
                  {(selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? '✓ Mesa Ativa' : '+ Adicionar Mesa Central'}
                </button>
              </div>

              {/* Controles de Deslocamento e Ajuste Fino da Mesa */}
              {(selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) && (
                <div
                  style={{
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(56, 189, 248, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {/* Deslocamento Longitudinal (Z: Frente / Trás) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700 }}>↕ Deslocamento Longitudinal (Frente / Trás):</span>
                      <span style={{ fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        {(selectedBox.centralTable?.offsetZ ?? 0) > 0 ? `+${selectedBox.centralTable?.offsetZ} mm (Frente)` : (selectedBox.centralTable?.offsetZ ?? 0) < 0 ? `${selectedBox.centralTable?.offsetZ} mm (Traseira)` : '0 mm (Centro)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-500"
                      max="500"
                      step="25"
                      value={selectedBox.centralTable?.offsetZ ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        updateInternalBox(selectedBox.id, {
                          centralTable: {
                            ...(selectedBox.centralTable || { enabled: true }),
                            offsetZ: val
                          }
                        });
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Deslocamento Lateral (X: Esquerda / Direita) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700 }}>↔ Deslocamento Lateral (Esquerda / Direita):</span>
                      <span style={{ fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        {(selectedBox.centralTable?.offsetX ?? 0) > 0 ? `+${selectedBox.centralTable?.offsetX} mm (Esq.)` : (selectedBox.centralTable?.offsetX ?? 0) < 0 ? `${selectedBox.centralTable?.offsetX} mm (Dir.)` : '0 mm (Centro)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-350"
                      max="350"
                      step="25"
                      value={selectedBox.centralTable?.offsetX ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        updateInternalBox(selectedBox.id, {
                          centralTable: {
                            ...(selectedBox.centralTable || { enabled: true }),
                            offsetX: val
                          }
                        });
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Altura da Mesa e Rotação */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {/* Altura (Y) */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 700 }}>Altura do Piso:</span>
                        <span style={{ fontWeight: 800, color: '#4ade80', fontFamily: 'var(--font-mono)' }}>
                          {selectedBox.centralTable?.heightMm ?? 720} mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min="380"
                        max="850"
                        step="20"
                        value={selectedBox.centralTable?.heightMm ?? 720}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          updateInternalBox(selectedBox.id, {
                            centralTable: {
                              ...(selectedBox.centralTable || { enabled: true }),
                              heightMm: val
                            }
                          });
                        }}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button
                          type="button"
                          className={`btn-compact ${(selectedBox.centralTable?.heightMm ?? 720) === 720 ? 'active' : ''}`}
                          onClick={() => {
                            updateInternalBox(selectedBox.id, {
                              centralTable: {
                                ...(selectedBox.centralTable || { enabled: true }),
                                heightMm: 720
                              }
                            });
                          }}
                          style={{ fontSize: '9px', padding: '2px 5px', flex: 1 }}
                        >
                          🍽️ Mesa 72cm
                        </button>
                        <button
                          type="button"
                          className={`btn-compact ${(selectedBox.centralTable?.heightMm ?? 720) === 400 ? 'active' : ''}`}
                          onClick={() => {
                            updateInternalBox(selectedBox.id, {
                              centralTable: {
                                ...(selectedBox.centralTable || { enabled: true }),
                                heightMm: 400
                              }
                            });
                          }}
                          style={{ fontSize: '9px', padding: '2px 5px', flex: 1 }}
                        >
                          🛏️ Cama 40cm
                        </button>
                      </div>
                    </div>

                    {/* Giro / Rotação Náutica */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 700 }}>Giro do Tampo:</span>
                        <span style={{ fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                          {selectedBox.centralTable?.rotationDeg ?? 0}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="15"
                        value={selectedBox.centralTable?.rotationDeg ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          updateInternalBox(selectedBox.id, {
                            centralTable: {
                              ...(selectedBox.centralTable || { enabled: true }),
                              rotationDeg: val
                            }
                          });
                        }}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button
                          type="button"
                          className="btn-compact"
                          onClick={() => {
                            updateInternalBox(selectedBox.id, {
                              centralTable: {
                                ...(selectedBox.centralTable || { enabled: true }),
                                rotationDeg: 0
                              }
                            });
                          }}
                          style={{ fontSize: '9px', padding: '2px 5px', flex: 1 }}
                        >
                          0° Reto
                        </button>
                        <button
                          type="button"
                          className="btn-compact"
                          onClick={() => {
                            updateInternalBox(selectedBox.id, {
                              centralTable: {
                                ...(selectedBox.centralTable || { enabled: true }),
                                rotationDeg: 90
                              }
                            });
                          }}
                          style={{ fontSize: '9px', padding: '2px 5px', flex: 1 }}
                        >
                          90° Giro
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dimensões do Tampo e Acabamento da Madeira */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                        Dimensões Tampo (C × L):
                      </label>
                      <select
                        value={`${selectedBox.centralTable?.lengthMm ?? 650}x${selectedBox.centralTable?.widthMm ?? 450}`}
                        onChange={(e) => {
                          const [l, w] = e.target.value.split('x').map(Number);
                          updateInternalBox(selectedBox.id, {
                            centralTable: {
                              ...(selectedBox.centralTable || { enabled: true }),
                              lengthMm: l,
                              widthMm: w
                            }
                          });
                        }}
                        style={{
                          width: '100%',
                          background: 'rgba(30, 41, 59, 0.9)',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          color: '#ffffff',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          fontSize: '11px'
                        }}
                      >
                        <option value="650x450">650 × 450 mm (Padrão Camper Foto)</option>
                        <option value="600x400">600 × 400 mm (Compacto)</option>
                        <option value="750x500">750 × 500 mm (Amplo Trabalho/Jantar)</option>
                        <option value="500x350">500 × 350 mm (Mesa Café Lateral)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                        Acabamento da Madeira:
                      </label>
                      <select
                        value={selectedBox.centralTable?.finish || 'pine_block'}
                        onChange={(e) => {
                          updateInternalBox(selectedBox.id, {
                            centralTable: {
                              ...(selectedBox.centralTable || { enabled: true }),
                              finish: e.target.value as any
                            }
                          });
                        }}
                        style={{
                          width: '100%',
                          background: 'rgba(30, 41, 59, 0.9)',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          color: '#ffffff',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          fontSize: '11px'
                        }}
                      >
                        <option value="pine_block">🪵 Pinus Finger-Joint (Igual à Foto)</option>
                        <option value="teak">🪵 Teca Naval Dourada Impermeável</option>
                        <option value="dark_wood">🪵 Imbuia Nobre Escura</option>
                        <option value="plywood">🪵 Compensado Naval Selado 18mm</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Opção de Decoração em Madeira na Face Traseira / Mesa Rebatível que abre para cima */}
          <div
            style={{
              marginTop: '12px',
              padding: '12px',
              background: selectedBox.rearFoldShelf
                ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.16), rgba(180, 83, 9, 0.08))'
                : 'rgba(30, 41, 59, 0.45)',
              border: selectedBox.rearFoldShelf
                ? '1px solid rgba(245, 158, 11, 0.55)'
                : '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: selectedBox.rearFoldShelf ? '10px' : '0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: selectedBox.rearFoldShelf ? '#fbbf24' : '#e2e8f0' }}>
                    🪵 Decoração Traseira: Prateleira Rebatível (Abre p/ Cima)
                  </span>
                  <span
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 800,
                      color: selectedBox.rearFoldShelf ? '#f59e0b' : '#94a3b8',
                      background: selectedBox.rearFoldShelf ? 'rgba(245, 158, 11, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {selectedBox.rearFoldShelf ? '✨ ATIVA (Bancada Traseira)' : 'INATIVA'}
                  </span>
                </div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
                  Painel decorativo em madeira maciça na face voltada para o porta-malas. Quando fechada, embeleza o acabamento traseiro; puxada pela cava inferior, <strong>abre 90° para cima</strong> transformando-se em uma <strong>prateleira / mesa externa de apoio</strong> sustentada por braços de inox.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const willEnable = !selectedBox.rearFoldShelf;
                  updateInternalBox(selectedBox.id, {
                    rearFoldShelf: willEnable,
                    isRearShelfOpen: willEnable ? true : undefined
                  });
                }}
                className="btn-compact"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '6px 12px',
                  whiteSpace: 'nowrap',
                  background: selectedBox.rearFoldShelf
                    ? 'linear-gradient(135deg, #d97706, #b45309)'
                    : 'rgba(51, 65, 85, 0.8)',
                  borderColor: selectedBox.rearFoldShelf ? '#fbbf24' : 'rgba(148, 163, 184, 0.4)',
                  color: '#ffffff'
                }}
              >
                {selectedBox.rearFoldShelf ? '✓ Mesa Ativa' : 'Adicionar Mesa Traseira'}
              </button>
            </div>

            {/* Sub-painel de Configuração da Mesa Traseira */}
            {selectedBox.rearFoldShelf && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(245, 158, 11, 0.25)',
                  alignItems: 'flex-end'
                }}
              >
                <div>
                  <label style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Acabamento da Madeira:
                  </label>
                  <select
                    value={selectedBox.rearShelfFinish || 'pine_block'}
                    onChange={(e) => updateInternalBox(selectedBox.id, { rearShelfFinish: e.target.value as any })}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(245, 158, 11, 0.5)',
                      color: '#ffffff',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      fontSize: '11px'
                    }}
                  >
                    <option value="pine_block">🪵 Pinus Finger-Joint (Bloco Natural como na foto)</option>
                    <option value="teak">🪵 Teca Naval Dourada (Impermeabilizada)</option>
                    <option value="dark_wood">🪵 Imbuia / Nogueira Escura Nobre</option>
                    <option value="plywood">🪵 Compensado Naval Selado (18mm)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Simulação 3D da Articulação:
                  </label>
                  <button
                    type="button"
                    onClick={() => updateInternalBox(selectedBox.id, {
                      isRearShelfOpen: selectedBox.isRearShelfOpen !== undefined ? !selectedBox.isRearShelfOpen : false
                    })}
                    className="btn-compact"
                    style={{
                      width: '100%',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '5px 10px',
                      background: (selectedBox.isRearShelfOpen ?? isOpenPreview)
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #0284c7, #2563eb)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#ffffff'
                    }}
                  >
                    {(selectedBox.isRearShelfOpen ?? isOpenPreview)
                      ? '🔒 Rebater / Fechar Mesa Traseira'
                      : '🔓 Levantar Mesa p/ Cima (90°)'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Opção de Armário Aéreo de Quina até o Teto da Doblò */}
          <div
            style={{
              marginTop: '12px',
              padding: '12px',
              background: selectedBox.upperCabinet
                ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.16), rgba(37, 99, 235, 0.08))'
                : 'rgba(30, 41, 59, 0.45)',
              border: selectedBox.upperCabinet
                ? '1px solid rgba(56, 189, 248, 0.55)'
                : '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: selectedBox.upperCabinet ? '10px' : '0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: selectedBox.upperCabinet ? '#38bdf8' : '#e2e8f0' }}>
                    🗄️ Armário Aéreo de Quina (Até o Teto da Doblò)
                  </span>
                  <span
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 800,
                      color: selectedBox.upperCabinet ? '#38bdf8' : '#94a3b8',
                      background: selectedBox.upperCabinet ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {selectedBox.upperCabinet ? '✓ ATIVO (Até o Teto 1.72m)' : 'DESATIVADO'}
                  </span>
                </div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
                  Módulo aéreo de quina sobre a caixa subindo até o limite do teto da Fiat Doblò (~840mm de altura).
                  Possui profundidade configurável mais rasa para <strong>deixar a bancada frontal livre para pia/torneira</strong> (layout campervan real).
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const willEnable = !selectedBox.upperCabinet;
                  updateInternalBox(selectedBox.id, {
                    upperCabinet: willEnable,
                    upperCabinetDepthMm: selectedBox.upperCabinetDepthMm || 250,
                    upperCabinetAlign: selectedBox.upperCabinetAlign || 'rear',
                    upperCabinetDoors: selectedBox.upperCabinetDoors !== undefined ? selectedBox.upperCabinetDoors : true,
                    upperCabinetShelves: selectedBox.upperCabinetShelves || 1
                  });
                }}
                className="btn-compact"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '6px 12px',
                  whiteSpace: 'nowrap',
                  background: selectedBox.upperCabinet
                    ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                    : 'rgba(51, 65, 85, 0.8)',
                  borderColor: selectedBox.upperCabinet ? '#38bdf8' : 'rgba(148, 163, 184, 0.4)',
                  color: '#ffffff'
                }}
              >
                {selectedBox.upperCabinet ? '✓ Aéreo Ativo' : '+ Adicionar Armário Aéreo'}
              </button>
            </div>

            {/* Sub-painel de Configuração do Armário Aéreo */}
            {selectedBox.upperCabinet && (
              <div
                style={{
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(56, 189, 248, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Profundidade do Aéreo */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 700 }}>Profundidade do Armário Aéreo:</span>
                    <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                      {selectedBox.upperCabinetDepthMm || 250} mm (Bancada livre à frente: {Math.max(0, Math.round(selectedBox.rowSpan * (internalGrid.lengthMm / rows) - (selectedBox.upperCabinetDepthMm || 250)))} mm)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max={Math.max(200, Math.round(selectedBox.rowSpan * (internalGrid.lengthMm / rows) - 50))}
                    step="10"
                    value={selectedBox.upperCabinetDepthMm || 250}
                    onChange={(e) => updateInternalBox(selectedBox.id, { upperCabinetDepthMm: parseInt(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {/* Alinhamento no eixo longitudinal */}
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                      Posicionamento na Caixa:
                    </label>
                    <select
                      value={selectedBox.upperCabinetAlign || 'rear'}
                      onChange={(e) => updateInternalBox(selectedBox.id, { upperCabinetAlign: e.target.value as any })}
                      style={{
                        width: '100%',
                        background: 'rgba(30, 41, 59, 0.9)',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        color: '#ffffff',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        fontSize: '11px'
                      }}
                    >
                      <option value="rear">▼ Encostado no Fundo Traseiro</option>
                      <option value="front">▲ Encostado na Frente</option>
                    </select>
                  </div>

                  {/* Fechamento: Porta c/ Trava Push-Lock vs Nicho Aberto */}
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                      Fechamento Frontal:
                    </label>
                    <select
                      value={selectedBox.upperCabinetDoors !== false ? 'doors' : 'open'}
                      onChange={(e) => updateInternalBox(selectedBox.id, { upperCabinetDoors: e.target.value === 'doors' })}
                      style={{
                        width: '100%',
                        background: 'rgba(30, 41, 59, 0.9)',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        color: '#ffffff',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        fontSize: '11px'
                      }}
                    >
                      <option value="doors">🚪 Porta c/ Botão Trava Náutico Push-Lock</option>
                      <option value="open">🕳️ Nicho Aberto c/ Friso Anti-Queda</option>
                    </select>
                  </div>
                </div>

                {/* Prateleiras Internas */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Prateleiras Internas Divisórias:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        type="button"
                        className={`btn-compact ${(selectedBox.upperCabinetShelves || 1) === num ? 'active' : ''}`}
                        onClick={() => updateInternalBox(selectedBox.id, { upperCabinetShelves: num })}
                        style={{ fontSize: '10px', padding: '3px 8px' }}
                      >
                        {num} {num === 1 ? 'Prateleira' : 'Prateleiras'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ajuste Fino de Posição e Expansão de Células */}
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(148, 163, 184, 0.15)' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
              Ajustar Ocupação no Grid:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {/* Largura (+/- Coluna) */}
              <button
                disabled={selectedBox.colSpan <= 1}
                onClick={() => updateInternalBox(selectedBox.id, { colSpan: selectedBox.colSpan - 1 })}
                className="btn-compact"
                style={{ fontSize: '10.5px', padding: '4px 8px' }}
              >
                ◀ Encolher Largura
              </button>
              <button
                disabled={selectedBox.colStart + selectedBox.colSpan >= cols}
                onClick={() => updateInternalBox(selectedBox.id, { colSpan: selectedBox.colSpan + 1 })}
                className="btn-compact"
                style={{ fontSize: '10.5px', padding: '4px 8px' }}
              >
                Esticar Largura ▶
              </button>

              {/* Comprimento (+/- Linha) */}
              <button
                disabled={selectedBox.rowSpan <= 1}
                onClick={() => updateInternalBox(selectedBox.id, { rowSpan: selectedBox.rowSpan - 1 })}
                className="btn-compact"
                style={{ fontSize: '10.5px', padding: '4px 8px' }}
              >
                ▲ Encolher Comp.
              </button>
              <button
                disabled={selectedBox.rowStart + selectedBox.rowSpan >= rows}
                onClick={() => updateInternalBox(selectedBox.id, { rowSpan: selectedBox.rowSpan + 1 })}
                className="btn-compact"
                style={{ fontSize: '10.5px', padding: '4px 8px' }}
              >
                Esticar Comp. ▼
              </button>

              {/* Mover */}
              <button
                disabled={selectedBox.colStart <= 0}
                onClick={() => updateInternalBox(selectedBox.id, { colStart: selectedBox.colStart - 1 })}
                className="btn-compact"
                style={{ fontSize: '10.5px', padding: '4px 8px' }}
              >
                ⬅ Mover Esq.
              </button>
              <button
                disabled={selectedBox.colStart + selectedBox.colSpan >= cols}
                onClick={() => updateInternalBox(selectedBox.id, { colStart: selectedBox.colStart + 1 })}
                className="btn-compact"
                style={{ fontSize: '10.5px', padding: '4px 8px' }}
              >
                Mover Dir. ➡
              </button>
              <button
                disabled={selectedBox.rowStart <= 0}
                onClick={() => updateInternalBox(selectedBox.id, { rowStart: selectedBox.rowStart - 1 })}
                className="btn-compact"
                style={{ fontSize: '10.5px', padding: '4px 8px' }}
              >
                ⬆ Mover Frente
              </button>
              <button
                disabled={selectedBox.rowStart + selectedBox.rowSpan >= rows}
                onClick={() => updateInternalBox(selectedBox.id, { rowStart: selectedBox.rowStart + 1 })}
                className="btn-compact"
                style={{ fontSize: '10.5px', padding: '4px 8px' }}
              >
                Mover Trás ⬇
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Configuração Paramétrica das Divisórias do Grid */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: '10px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '14px'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', marginBottom: '8px', textTransform: 'uppercase' }}>
          ⚙️ Divisórias & Dimensões do Espaço Interno da Doblò
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {/* Divisórias na Largura X */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
              <span>Divisórias Largura (X):</span>
              <strong style={{ color: '#38bdf8' }}>{cols} colunas ({cellWidthCm} cm cada)</strong>
            </div>
            <input
              type="range"
              min={1}
              max={6}
              value={cols}
              onChange={(e) => setInternalGrid(prev => ({ ...prev, colsX: Number(e.target.value) }))}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>

          {/* Divisórias no Comprimento Z */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
              <span>Divisórias Comprimento (Z):</span>
              <strong style={{ color: '#38bdf8' }}>{rows} linhas ({cellLengthCm} cm cada)</strong>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              value={rows}
              onChange={(e) => setInternalGrid(prev => ({ ...prev, rowsZ: Number(e.target.value) }))}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>

          {/* Altura Máxima da Base/Cama */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
              <span>Altura Base / Cama:</span>
              <strong style={{ color: '#38bdf8' }}>{internalGrid.heightMm} mm ({(internalGrid.heightMm / 10).toFixed(0)} cm)</strong>
            </div>
            <input
              type="range"
              min={250}
              max={750}
              step={10}
              value={internalGrid.heightMm}
              onChange={(e) => setInternalGrid(prev => ({ ...prev, heightMm: Number(e.target.value) }))}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

