import React, { useState, useRef } from 'react';
import { useSolar } from '../context/SolarContext';
import {
  InternalBoxItem,
  InternalBoxMaterial,
  InternalBoxType,
  ChestHingeDirection,
  SlatBedDirection,
  BoxPanelsConfig,
  CeilingConfig,
  CeilingType,
  CeilingSheetMaterial,
  CeilingSlattedWood,
  CeilingLedType,
  CeilingLedConfig,
  UpperCabinetClosure,
  getUpperCabinetClosure
} from '../types';
import { INTERNAL_BOXES_PRESETS, DEFAULT_CEILING_CONFIG } from '../data/internalBoxesPresets';

export const InternalBoxesPlanner: React.FC = () => {
  const {
    internalGrid,
    setInternalGrid,
    setCeiling,
    toggleCeiling3D,
    internalBoxes,
    selectedBoxId,
    setSelectedBoxId,
    isolatedBoxId,
    setIsolatedBoxId,
    isOpenPreview,
    setIsOpenPreview,
    isCabinetsOpenPreview,
    setIsCabinetsOpenPreview,
    applyInternalBoxesPreset,
    addInternalBox,
    updateInternalBox,
    removeInternalBox,
    clearInternalBoxes,
    flashToast
  } = useSolar();

  // Estado para diálogo de confirmação de Ações Críticas (Limpar e Aplicar Presets)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'clear' | 'preset';
    title: string;
    message: string;
    targetPresetId?: string;
    presetName?: string;
  } | null>(null);

  const handleRequestClear = () => {
    if (internalBoxes.length === 0) {
      flashToast?.('ℹ️ O grid já está vazio!');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      type: 'clear',
      title: 'Limpar Todo o Layout do Grid?',
      message: `Tem certeza que deseja remover todos os ${internalBoxes.length} módulos e caixas do assoalho da Doblò? Esta ação apagará as caixas configuradas.`
    });
  };

  const handleRequestPreset = (preset: typeof INTERNAL_BOXES_PRESETS[0]) => {
    if (internalBoxes.length === 0) {
      applyInternalBoxesPreset(preset.id);
      return;
    }
    setConfirmDialog({
      isOpen: true,
      type: 'preset',
      title: `Substituir pelo Preset "${preset.name.split(':')[0]}"?`,
      message: `Deseja substituir o layout atual (${internalBoxes.length} módulos no assoalho) pelas caixas do preset "${preset.name}"? As alterações não salvas serão substituídas.`,
      targetPresetId: preset.id,
      presetName: preset.name
    });
  };

  const handleConfirmAction = () => {
    if (!confirmDialog) return;
    if (confirmDialog.type === 'clear') {
      clearInternalBoxes();
    } else if (confirmDialog.type === 'preset' && confirmDialog.targetPresetId) {
      applyInternalBoxesPreset(confirmDialog.targetPresetId);
    }
    setConfirmDialog(null);
  };

  const handleCancelAction = () => {
    setConfirmDialog(null);
  };

  // Estado de seleção por arraste (drag-to-select)
  const [dragStart, setDragStart] = useState<{ col: number; row: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ col: number; row: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const [lastMdfType, setLastMdfType] = useState<CeilingSheetMaterial>('white_mdf');

  const cols = Math.max(1, internalGrid.colsX);
  const rows = Math.max(1, internalGrid.rowsZ);
  const hasUpperCabinets = internalBoxes.some((b) => b.upperCabinet);

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
      {/* Modal de Confirmação para Limpar e Aplicar Presets */}
      {confirmDialog && confirmDialog.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 15, 29, 0.78)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={handleCancelAction}
        >
          <div
            style={{
              background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
              border: confirmDialog.type === 'clear' ? '1.5px solid #ef4444' : '1.5px solid #38bdf8',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: confirmDialog.type === 'clear'
                ? '0 20px 40px -10px rgba(239, 68, 68, 0.45)'
                : '0 20px 40px -10px rgba(56, 189, 248, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'fadeIn 0.15s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Alerta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: confirmDialog.type === 'clear' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  border: confirmDialog.type === 'clear' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                {confirmDialog.type === 'clear' ? '🧹' : '📦'}
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 800,
                    color: confirmDialog.type === 'clear' ? '#f87171' : '#38bdf8'
                  }}
                >
                  {confirmDialog.title}
                </h3>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {confirmDialog.type === 'clear' ? 'Atenção: Ação irreversível' : 'Substituição de Layout'}
                </span>
              </div>
            </div>

            {/* Mensagem Explicativa */}
            <p
              style={{
                margin: 0,
                fontSize: '12.5px',
                color: '#cbd5e1',
                lineHeight: 1.6,
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '12px 14px',
                borderRadius: '8px',
                borderLeft: confirmDialog.type === 'clear' ? '3px solid #ef4444' : '3px solid #38bdf8'
              }}
            >
              {confirmDialog.message}
            </p>

            {/* Botões Cancelar e Confirmar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleCancelAction}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                style={{
                  padding: '8px 20px',
                  fontSize: '12px',
                  fontWeight: 800,
                  borderRadius: '8px',
                  background: confirmDialog.type === 'clear'
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #0284c7, #2563eb)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: confirmDialog.type === 'clear'
                    ? '0 4px 12px rgba(239, 68, 68, 0.4)'
                    : '0 4px 12px rgba(2, 132, 199, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                {confirmDialog.type === 'clear' ? 'Sim, Limpar Grid' : 'Confirmar e Aplicar'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              onClick={() => handleRequestPreset(p)}
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

          {hasUpperCabinets && (
            <button
              type="button"
              onClick={() => setIsCabinetsOpenPreview((prev) => !prev)}
              className="btn-compact"
              style={{
                fontSize: '11px',
                padding: '5px 12px',
                fontWeight: 700,
                background: isCabinetsOpenPreview
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #0284c7, #2563eb)',
                borderColor: isCabinetsOpenPreview ? '#34d399' : '#38bdf8',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Abrir ou fechar as portas dos armários aéreos no modelo 3D (sistema basculante náutico)"
            >
              <span>{isCabinetsOpenPreview ? '🔓' : '🚪'}</span>
              <span>{isCabinetsOpenPreview ? 'Aéreos: Abertos (Fechar)' : 'Abrir Armários Aéreos'}</span>
            </button>
          )}

          {internalGrid.ceiling?.enabled !== false && (
            <button
              type="button"
              onClick={toggleCeiling3D}
              className="btn-compact"
              style={{
                fontSize: '11px',
                padding: '5px 12px',
                fontWeight: 700,
                background: internalGrid.ceiling?.visibleIn3D !== false
                  ? 'rgba(15, 23, 42, 0.85)'
                  : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                borderColor: internalGrid.ceiling?.visibleIn3D !== false
                  ? 'rgba(56, 189, 248, 0.4)'
                  : '#fbbf24',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title={
                internalGrid.ceiling?.visibleIn3D !== false
                  ? 'Ocultar teto no 3D para visualizar o interior dos móveis por cima (as peças continuam no plano de corte)'
                  : 'Exibir teto no 3D'
              }
            >
              <span>{internalGrid.ceiling?.visibleIn3D !== false ? '👁️' : '🙈'}</span>
              <span>
                {internalGrid.ceiling?.visibleIn3D !== false
                  ? `Teto 3D: Visível (${internalGrid.ceiling?.type === 'slatted' ? 'Ripado' : 'Chapa'})`
                  : 'Teto 3D: Oculto'}
              </span>
            </button>
          )}

          <button
            onClick={handleRequestClear}
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
      {selectedBox && (() => {
        const boxWMm = Math.round(selectedBox.colSpan * (internalGrid.widthMm / cols));
        const boxLMm = Math.round(selectedBox.rowSpan * (internalGrid.lengthMm / rows));

        return (
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

            {/* ─── 1. PRIMEIRAS OPÇÕES: ALTURA & AJUSTE NO GRID ─── */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.9))',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {/* Altura da Caixa */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>📏</span>
                    <span>1. Altura do Módulo:</span>
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                    {selectedBox.heightMm} mm <span style={{ color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>({(selectedBox.heightMm / 10).toFixed(0)} cm)</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={700}
                  step={10}
                  value={selectedBox.heightMm}
                  onChange={(e) => updateInternalBox(selectedBox.id, { heightMm: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {[300, 350, 400, 450, 500].map((hVal) => (
                    <button
                      key={hVal}
                      type="button"
                      onClick={() => updateInternalBox(selectedBox.id, { heightMm: hVal })}
                      className="btn-compact"
                      style={{
                        fontSize: '9.5px',
                        padding: '2px 7px',
                        background: selectedBox.heightMm === hVal ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                        borderColor: selectedBox.heightMm === hVal ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)',
                        color: selectedBox.heightMm === hVal ? '#38bdf8' : '#94a3b8'
                      }}
                    >
                      {hVal} mm
                    </button>
                  ))}
                </div>
              </div>

              {/* Ajuste no Grid: Dimensões (Colunas/Linhas) e Posição */}
              <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.18)', paddingTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>📐</span>
                    <span>2. Ajuste de Ocupação no Grid:</span>
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                    Dimensões: <strong style={{ color: '#fbbf24' }}>{boxWMm} × {boxLMm} mm</strong> ({selectedBox.colSpan} col × {selectedBox.rowSpan} lin)
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {/* Largura (+/- Coluna) */}
                  <button
                    type="button"
                    disabled={selectedBox.colSpan <= 1}
                    onClick={() => updateInternalBox(selectedBox.id, { colSpan: selectedBox.colSpan - 1 })}
                    className="btn-compact"
                    style={{ fontSize: '10.5px', padding: '4px 8px' }}
                    title="Diminuir largura ocupada no grid"
                  >
                    ◀ Encolher Largura
                  </button>
                  <button
                    type="button"
                    disabled={selectedBox.colStart + selectedBox.colSpan >= cols}
                    onClick={() => updateInternalBox(selectedBox.id, { colSpan: selectedBox.colSpan + 1 })}
                    className="btn-compact"
                    style={{ fontSize: '10.5px', padding: '4px 8px' }}
                    title="Aumentar largura ocupada no grid"
                  >
                    Esticar Largura ▶
                  </button>

                  {/* Comprimento (+/- Linha) */}
                  <button
                    type="button"
                    disabled={selectedBox.rowSpan <= 1}
                    onClick={() => updateInternalBox(selectedBox.id, { rowSpan: selectedBox.rowSpan - 1 })}
                    className="btn-compact"
                    style={{ fontSize: '10.5px', padding: '4px 8px' }}
                    title="Diminuir comprimento ocupado no grid"
                  >
                    ▲ Encolher Comp.
                  </button>
                  <button
                    type="button"
                    disabled={selectedBox.rowStart + selectedBox.rowSpan >= rows}
                    onClick={() => updateInternalBox(selectedBox.id, { rowSpan: selectedBox.rowSpan + 1 })}
                    className="btn-compact"
                    style={{ fontSize: '10.5px', padding: '4px 8px' }}
                    title="Aumentar comprimento ocupado no grid"
                  >
                    Esticar Comp. ▼
                  </button>

                  {/* Mover */}
                  <button
                    type="button"
                    disabled={selectedBox.colStart <= 0}
                    onClick={() => updateInternalBox(selectedBox.id, { colStart: selectedBox.colStart - 1 })}
                    className="btn-compact"
                    style={{ fontSize: '10.5px', padding: '4px 8px' }}
                    title="Mover módulo para a esquerda"
                  >
                    ⬅ Mover Esq.
                  </button>
                  <button
                    type="button"
                    disabled={selectedBox.colStart + selectedBox.colSpan >= cols}
                    onClick={() => updateInternalBox(selectedBox.id, { colStart: selectedBox.colStart + 1 })}
                    className="btn-compact"
                    style={{ fontSize: '10.5px', padding: '4px 8px' }}
                    title="Mover módulo para a direita"
                  >
                    Mover Dir. ➡
                  </button>
                  <button
                    type="button"
                    disabled={selectedBox.rowStart <= 0}
                    onClick={() => updateInternalBox(selectedBox.id, { rowStart: selectedBox.rowStart - 1 })}
                    className="btn-compact"
                    style={{ fontSize: '10.5px', padding: '4px 8px' }}
                    title="Mover módulo para frente (direção dos bancos)"
                  >
                    ⬆ Mover Frente
                  </button>
                  <button
                    type="button"
                    disabled={selectedBox.rowStart + selectedBox.rowSpan >= rows}
                    onClick={() => updateInternalBox(selectedBox.id, { rowStart: selectedBox.rowStart + 1 })}
                    className="btn-compact"
                    style={{ fontSize: '10.5px', padding: '4px 8px' }}
                    title="Mover módulo para trás (direção do porta-malas)"
                  >
                    Mover Trás ⬇
                  </button>
                </div>
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

                  {/* Fechamento: Porta c/ Trava Push-Lock vs Corrediça Telescópica vs Nicho Aberto */}
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                      Fechamento Frontal:
                    </label>
                    <select
                      value={getUpperCabinetClosure(selectedBox)}
                      onChange={(e) => {
                        const val = e.target.value as UpperCabinetClosure;
                        updateInternalBox(selectedBox.id, {
                          upperCabinetClosure: val,
                          upperCabinetDoors: val !== 'open'
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
                      <option value="doors">🚪 Porta c/ Botão Trava Náutico Push-Lock</option>
                      <option value="drawer">🗄️ Gaveta Deslizante c/ Corrediça Telescópica (Trava Náutica)</option>
                      <option value="open">🕳️ Nicho Aberto c/ Friso Anti-Queda</option>
                    </select>
                  </div>
                </div>

                {/* Prateleiras Internas */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {getUpperCabinetClosure(selectedBox) === 'drawer' ? 'Divisórias Internas da Gaveta:' : 'Prateleiras Internas Divisórias:'}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        type="button"
                        className={`btn-compact ${(selectedBox.upperCabinetShelves || 1) === num ? 'active' : ''}`}
                        onClick={() => updateInternalBox(selectedBox.id, { upperCabinetShelves: num })}
                        style={{ fontSize: '10px', padding: '3px 8px' }}
                      >
                        {num} {num === 1 ? (getUpperCabinetClosure(selectedBox) === 'drawer' ? 'Vão' : 'Prateleira') : (getUpperCabinetClosure(selectedBox) === 'drawer' ? 'Vãos' : 'Prateleiras')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Teste de Abertura Basculante da Porta ou Deslizamento da Corrediça */}
                {getUpperCabinetClosure(selectedBox) !== 'open' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.4)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#e2e8f0' }}>
                        {getUpperCabinetClosure(selectedBox) === 'drawer' ? 'Deslizamento da Corrediça no 3D:' : 'Abertura da Porta no 3D:'}
                      </div>
                      <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                        {getUpperCabinetClosure(selectedBox) === 'drawer'
                          ? 'Simula o avanço da gaveta nas corrediças telescópicas'
                          : 'Simula o pistão basculante abrindo 75° para cima'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const isCurrentlyOpen = isCabinetsOpenPreview || Boolean(selectedBox.isOpen);
                        if (isCabinetsOpenPreview) {
                          setIsCabinetsOpenPreview(false);
                        }
                        updateInternalBox(selectedBox.id, { isOpen: !isCurrentlyOpen });
                      }}
                      className="btn-compact"
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        background: (isCabinetsOpenPreview || Boolean(selectedBox.isOpen))
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, #0284c7, #2563eb)',
                        borderColor: (isCabinetsOpenPreview || Boolean(selectedBox.isOpen)) ? '#34d399' : '#38bdf8',
                        color: '#ffffff'
                      }}
                    >
                      {(isCabinetsOpenPreview || Boolean(selectedBox.isOpen))
                        ? (getUpperCabinetClosure(selectedBox) === 'drawer' ? '🔒 Recolher Gaveta' : '🔓 Fechar Porta')
                        : (getUpperCabinetClosure(selectedBox) === 'drawer' ? '🗄️ Deslizar Gaveta (Abrir)' : '🚪 Abrir Porta')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
        );
      })()}

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

      {/* 5. Teto & Forro do Campervan (Ripado / Chapa MDF ou Compensado + Iluminação LED) */}
      {(() => {
        const ceilingCfg: CeilingConfig = internalGrid.ceiling || DEFAULT_CEILING_CONFIG;
        const isCeilingEnabled = ceilingCfg.enabled !== false;
        const isSlatted = (ceilingCfg.type || 'slatted') === 'slatted';
        const isCeilingVisible3D = ceilingCfg.visibleIn3D !== false;
        const ceilingOpacity = ceilingCfg.opacity ?? 1.0;
        const ledCfg: CeilingLedConfig = ceilingCfg.led || {
          enabled: true,
          type: 'strip_double',
          color: '#fef3c7',
          brightness: 85,
          spotsCount: 4
        };
        const isLedEnabled = Boolean(ledCfg.enabled);

        const slatW = ceilingCfg.slatWidthMm || 40;
        const slatGap = ceilingCfg.slatGapMm || 10;
        const slatThick = ceilingCfg.slatThicknessMm || 12;
        const ceilingW = ceilingCfg.widthMm || internalGrid.widthMm;
        const ceilingL = ceilingCfg.lengthMm || internalGrid.lengthMm;
        const isTransverse = ceilingCfg.slatDirection === 'transverse';
        const pitch = slatW + slatGap;
        const calculatedSlatCount = isTransverse
          ? Math.max(1, Math.floor((ceilingL - slatGap) / pitch))
          : Math.max(1, Math.floor((ceilingW - slatGap) / pitch));
        const slatLength = isTransverse ? ceilingW : ceilingL;
        const totalSlatAreaM2 = ((calculatedSlatCount * slatW * slatLength) / 1_000_000).toFixed(2);

        return (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '12px',
              border: isCeilingEnabled ? '1.5px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(148, 163, 184, 0.25)',
              padding: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Cabeçalho da Seção */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🪵</span>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    5. TETO & FORRO DO CAMPERVAN
                  </div>
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                  Forro de teto acústico e térmico: ripado de madeira nobre ou chapa contínua (MDF / compensado) com LED
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {isCeilingEnabled && (
                  <button
                    onClick={toggleCeiling3D}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '5px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: isCeilingVisible3D ? '1px solid rgba(56, 189, 248, 0.4)' : '1.5px solid #fbbf24',
                      background: isCeilingVisible3D ? 'rgba(30, 41, 59, 0.6)' : 'rgba(217, 119, 6, 0.25)',
                      color: isCeilingVisible3D ? '#94a3b8' : '#fbbf24',
                      transition: 'all 0.15s ease'
                    }}
                    title={
                      isCeilingVisible3D
                        ? 'Ocultar teto no 3D para visualizar o interior dos baús por cima'
                        : 'Exibir teto no 3D'
                    }
                  >
                    <span>{isCeilingVisible3D ? '👁️' : '🙈'}</span>
                    <span>{isCeilingVisible3D ? 'Teto 3D Visível' : 'Teto 3D Oculto'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setCeiling({
                      enabled: !isCeilingEnabled
                    });
                  }}
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: 'none',
                    background: isCeilingEnabled
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#ffffff',
                    boxShadow: isCeilingEnabled
                      ? '0 2px 8px rgba(239, 68, 68, 0.4)'
                      : '0 2px 8px rgba(245, 158, 11, 0.4)'
                  }}
                >
                  {isCeilingEnabled ? '🗑️ Desativar Teto' : '➕ Ativar Teto no Projeto'}
                </button>
              </div>
            </div>

            {!isCeilingEnabled ? (
              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.55, background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
                💡 <em>O teto do campervan isola termicamente a cabine da Doblò contra o calor do teto de metal, oferece acabamento de alto padrão (madeira ripada ou chapa lisa) e acomoda fita LED linear ou spots embutidos para iluminação geral do veículo. Clique no botão acima para incluir o teto no seu projeto.</em>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 1. SELETOR DE TIPO: RIPADO vs CHAPA */}
                <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Tipo de Forro do Teto
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => setCeiling({ type: 'slatted' })}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: isSlatted ? '2px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.3)',
                        background: isSlatted ? 'rgba(245, 158, 11, 0.18)' : 'rgba(30, 41, 59, 0.6)',
                        color: isSlatted ? '#fbbf24' : '#cbd5e1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>🪵</span>
                      <strong style={{ fontSize: '12px' }}>Teto Ripado</strong>
                      <span style={{ fontSize: '9.5px', color: '#94a3b8', textAlign: 'center' }}>
                        Ripas de madeira com fundo acústico
                      </span>
                    </button>

                    <button
                      onClick={() => setCeiling({ type: 'sheet' })}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: !isSlatted ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
                        background: !isSlatted ? 'rgba(56, 189, 248, 0.18)' : 'rgba(30, 41, 59, 0.6)',
                        color: !isSlatted ? '#38bdf8' : '#cbd5e1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>📄</span>
                      <strong style={{ fontSize: '12px' }}>Chapa Contínua</strong>
                      <span style={{ fontSize: '9.5px', color: '#94a3b8', textAlign: 'center' }}>
                        MDF Branco Ultra ou Compensado Naval
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. CONFIGURAÇÕES ESPECÍFICAS DO TETO RIPADO */}
                {isSlatted && (
                  <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>
                      📐 Configurações das Ripas de Madeira
                    </div>

                    {/* Madeira / Acabamento das Ripas */}
                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px', fontWeight: 700 }}>
                        🌲 Espécie / Tonalidade da Madeira:
                      </label>
                      <select
                        value={ceilingCfg.slattedWood || 'freijo'}
                        onChange={(e) => setCeiling({ slattedWood: e.target.value as CeilingSlattedWood })}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: '#0f172a',
                          color: '#ffffff',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          fontSize: '11px'
                        }}
                      >
                        <option value="freijo">Freijó Nobre Natural (Tons Quentes / Van Life Moderno)</option>
                        <option value="pinus">Pinus Claro Maciço (Nórdico / Claro)</option>
                        <option value="teak">Teca Náutica Selada (Elegante & Resistente)</option>
                        <option value="dark_wood">Imbuia / Nogueira Nobre Escura (Contraste Marcante)</option>
                        <option value="cedro">Cedro Rosa Real (Tons Avermelhados Clássicos)</option>
                        <option value="plywood">Compensado Naval 12mm (Marcenaria Pura)</option>
                        <option value="white_mdf">MDF Branco Ultra (Minimalista Clean)</option>
                      </select>
                    </div>

                    {/* Largura da Ripa & Espaçamento / Fenda */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
                          <span>Largura da Ripa:</span>
                          <strong style={{ color: '#fbbf24' }}>{slatW} mm</strong>
                        </div>
                        <input
                          type="range"
                          min={25}
                          max={70}
                          step={5}
                          value={slatW}
                          onChange={(e) => setCeiling({ slatWidthMm: Number(e.target.value) })}
                          style={{ width: '100%', marginTop: '4px' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
                          <span>Espaçamento (Fenda):</span>
                          <strong style={{ color: '#fbbf24' }}>{slatGap} mm</strong>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={20}
                          step={1}
                          value={slatGap}
                          onChange={(e) => setCeiling({ slatGapMm: Number(e.target.value) })}
                          style={{ width: '100%', marginTop: '4px' }}
                        />
                      </div>
                    </div>

                    {/* Espessura / Profundidade da Ripa & Orientação */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px', fontWeight: 700 }}>
                          Espessura / Profundidade:
                        </label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {[10, 12, 15, 18].map((t) => (
                            <button
                              key={t}
                              onClick={() => setCeiling({ slatThicknessMm: t })}
                              style={{
                                flex: 1,
                                padding: '4px 6px',
                                fontSize: '10px',
                                fontWeight: 700,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                border: slatThick === t ? '1.5px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
                                background: slatThick === t ? 'rgba(245, 158, 11, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                                color: slatThick === t ? '#ffffff' : '#94a3b8'
                              }}
                            >
                              {t}mm
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px', fontWeight: 700 }}>
                          Direção das Ripas:
                        </label>
                        <select
                          value={ceilingCfg.slatDirection || 'longitudinal'}
                          onChange={(e) => setCeiling({ slatDirection: e.target.value as any })}
                          style={{
                            width: '100%',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            background: '#0f172a',
                            color: '#ffffff',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            fontSize: '11px'
                          }}
                        >
                          <option value="longitudinal">Longitudinal (Frente ➔ Traseira)</option>
                          <option value="transverse">Transversal (Largura)</option>
                        </select>
                      </div>
                    </div>

                    {/* Fundo Acústico Preto */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#cbd5e1' }}>
                      <input
                        type="checkbox"
                        checked={ceilingCfg.acousticFeltBacking !== false}
                        onChange={(e) => setCeiling({ acousticFeltBacking: e.target.checked })}
                      />
                      <span>Fundo acústico automotivo preto (feltro / TNT escuro atrás das ripas)</span>
                    </label>

                    {/* Resumo do Ripado */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '10px', color: '#fbbf24', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <span>📊 Total: <strong>{calculatedSlatCount} ripas</strong> de {slatW} × {slatLength} × {slatThick} mm</span>
                      <span>Área: <strong>{totalSlatAreaM2} m²</strong></span>
                    </div>
                  </div>
                )}

                {/* 3. CONFIGURAÇÕES ESPECÍFICAS DO TETO EM CHAPA */}
                {!isSlatted && (
                  <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                      📐 Configurações da Chapa de Teto (MDF / Compensado)
                    </div>

                    {/* 1. Seleção do Material Base da Chapa (MDF vs Compensado) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '6px', fontWeight: 700 }}>
                        Material da Chapa de Forro:
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (ceilingCfg.sheetMaterial === 'plywood') {
                              setCeiling({ sheetMaterial: lastMdfType || 'white_mdf' });
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: (ceilingCfg.sheetMaterial !== 'plywood')
                              ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.35), rgba(37, 99, 235, 0.45))'
                              : 'rgba(15, 23, 42, 0.7)',
                            border: (ceilingCfg.sheetMaterial !== 'plywood')
                              ? '1.5px solid #38bdf8'
                              : '1px solid rgba(148, 163, 184, 0.3)',
                            color: (ceilingCfg.sheetMaterial !== 'plywood') ? '#ffffff' : '#94a3b8',
                            boxShadow: (ceilingCfg.sheetMaterial !== 'plywood') ? '0 0 10px rgba(56, 189, 248, 0.25)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>⬜</span>
                          <span>Chapa de MDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCeiling({ sheetMaterial: 'plywood' });
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: (ceilingCfg.sheetMaterial === 'plywood')
                              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(217, 119, 6, 0.45))'
                              : 'rgba(15, 23, 42, 0.7)',
                            border: (ceilingCfg.sheetMaterial === 'plywood')
                              ? '1.5px solid #fbbf24'
                              : '1px solid rgba(148, 163, 184, 0.3)',
                            color: (ceilingCfg.sheetMaterial === 'plywood') ? '#ffffff' : '#94a3b8',
                            boxShadow: (ceilingCfg.sheetMaterial === 'plywood') ? '0 0 10px rgba(245, 158, 11, 0.25)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>🪵</span>
                          <span>Compensado Naval</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Quando MDF é selecionado: abre opções específicas para os tipos de MDF */}
                    {(ceilingCfg.sheetMaterial !== 'plywood') ? (
                      <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.35)', animation: 'fadeIn 0.2s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🎨</span>
                            <span>Opções de Tipos / Padrões de MDF:</span>
                          </label>
                          <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                            Acabamento melamínico UV
                          </span>
                        </div>

                        <select
                          value={ceilingCfg.sheetMaterial || lastMdfType}
                          onChange={(e) => {
                            const val = e.target.value as CeilingSheetMaterial;
                            setLastMdfType(val);
                            setCeiling({ sheetMaterial: val });
                          }}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            background: '#0f172a',
                            color: '#ffffff',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          <option value="white_mdf">⚪ MDF Branco Ultra (Máxima Claridade & Reflexão de Luz)</option>
                          <option value="gray_mdf">🔘 MDF Cinza Grafite / Titânio (Visual Stealth Moderno)</option>
                          <option value="wood_mdf">🪵 MDF Carvalho / Freijó Amadeirado (Aconchego Clássico)</option>
                          <option value="black_mdf">⚫ MDF Preto Fosco / Black Matte (Estilo Industrial Premium)</option>
                          <option value="sand_mdf">📜 MDF Bege / Areia / Off-White (Ambiente Neutro Acolhedor)</option>
                        </select>

                        {/* Pílulas de seleção rápida com swatch de cor */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                          {[
                            { id: 'white_mdf', label: 'Branco Ultra', bg: '#f8fafc', text: '#0f172a' },
                            { id: 'gray_mdf', label: 'Cinza Grafite', bg: '#475569', text: '#ffffff' },
                            { id: 'wood_mdf', label: 'Freijó Madeira', bg: '#c89355', text: '#ffffff' },
                            { id: 'black_mdf', label: 'Preto Fosco', bg: '#1e293b', text: '#ffffff' },
                            { id: 'sand_mdf', label: 'Bege Areia', bg: '#dcd0c0', text: '#0f172a' }
                          ].map(swatch => {
                            const isCurrent = (ceilingCfg.sheetMaterial === swatch.id || (!ceilingCfg.sheetMaterial && swatch.id === 'white_mdf'));
                            return (
                              <button
                                key={swatch.id}
                                type="button"
                                onClick={() => {
                                  const val = swatch.id as CeilingSheetMaterial;
                                  setLastMdfType(val);
                                  setCeiling({ sheetMaterial: val });
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '9.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  background: isCurrent ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                                  border: isCurrent ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                                  color: isCurrent ? '#ffffff' : '#cbd5e1'
                                }}
                              >
                                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: swatch.bg, border: '1px solid rgba(0,0,0,0.3)', display: 'inline-block' }} />
                                {swatch.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>🪵</span>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>
                            Compensado Naval Impermeabilizado (100% Náutico)
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                            Lâminas de madeira nobre prensadas com cola fenólica naval WBP, resistente a vapor, condensação e umidade automotiva.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Espessura da Chapa & Divisão das Placas */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px', fontWeight: 700 }}>
                          Espessura da Chapa:
                        </label>
                        <select
                          value={ceilingCfg.thicknessMm || 9}
                          onChange={(e) => setCeiling({ thicknessMm: Number(e.target.value) })}
                          style={{
                            width: '100%',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            background: '#0f172a',
                            color: '#34d399',
                            border: '1px solid rgba(52, 211, 153, 0.4)',
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          <option value={6}>6 mm (Super Leve p/ Teto)</option>
                          <option value={9}>9 mm (Padrão Recomendado Doblò)</option>
                          <option value={12}>12 mm (Rigidez Reforçada)</option>
                          <option value={15}>15 mm (Chapa Espessa)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px', fontWeight: 700 }}>
                          Divisão das Placas:
                        </label>
                        <select
                          value={ceilingCfg.sheetPanels || 'single'}
                          onChange={(e) => setCeiling({ sheetPanels: e.target.value as any })}
                          style={{
                            width: '100%',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            background: '#0f172a',
                            color: '#ffffff',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            fontSize: '11px'
                          }}
                        >
                          <option value="single">Chapa Única Inteira ({ceilingW} × {ceilingL} mm)</option>
                          <option value="split_longitudinal">Bipartida Longitudinal (2 Chapas {Math.round(ceilingW / 2)} × {ceilingL} mm)</option>
                          <option value="split_transverse">Tripartida Transversal (3 Painéis {ceilingW} × {Math.round(ceilingL / 3)} mm)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. OPACIDADE NO 3D & AJUSTES DIMENSIONAIS */}
                <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.2)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {/* Curvatura Transversal do Teto */}
                  <div style={{ gridColumn: '1 / -1', background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#e2e8f0' }}>
                      <span style={{ fontWeight: 700, color: '#fbbf24' }}>
                        🏹 Curvatura do Teto (Arco Transversal da Doblò):
                      </span>
                      <strong style={{ color: (ceilingCfg.curvatureMm ?? 25) > 0 ? '#34d399' : '#94a3b8', fontSize: '11px' }}>
                        {(ceilingCfg.curvatureMm ?? 25) > 0 ? `${ceilingCfg.curvatureMm ?? 25} mm de Flecha (Abaulado)` : '0 mm (Totalmente Plano)'}
                      </strong>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={30}
                      step={5}
                      value={Math.min(30, ceilingCfg.curvatureMm ?? 25)}
                      onChange={(e) => setCeiling({ curvatureMm: Math.min(30, Number(e.target.value)) })}
                      style={{ width: '100%', marginTop: '6px' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                        Base de referência nas laterais mais baixas; o arco compensa subindo ao centro (+pé-direito)
                      </span>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[
                          { val: 0, label: '0mm (Plano)' },
                          { val: 10, label: '10mm (Leve)' },
                          { val: 20, label: '20mm (Médio)' },
                          { val: 25, label: '25mm (Doblò)' },
                          { val: 30, label: '30mm (Máx)' }
                        ].map((btn) => (
                          <button
                            key={btn.val}
                            onClick={() => setCeiling({ curvatureMm: btn.val })}
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              border: (ceilingCfg.curvatureMm ?? 25) === btn.val ? '1px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
                              background: (ceilingCfg.curvatureMm ?? 25) === btn.val ? 'rgba(245, 158, 11, 0.3)' : 'rgba(30, 41, 59, 0.5)',
                              color: (ceilingCfg.curvatureMm ?? 25) === btn.val ? '#ffffff' : '#94a3b8'
                            }}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Opacidade 3D */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
                      <span>Opacidade 3D:</span>
                      <strong style={{ color: '#38bdf8' }}>{Math.round(ceilingOpacity * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={Math.round(ceilingOpacity * 100)}
                      onChange={(e) => setCeiling({ opacity: Number(e.target.value) / 100 })}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                    <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
                      Reduza para ver através do teto no 3D
                    </div>
                  </div>

                  {/* Comprimento do Teto */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
                      <span>Comprimento:</span>
                      <strong style={{ color: '#38bdf8' }}>{ceilingL} mm</strong>
                    </div>
                    <input
                      type="range"
                      min={1200}
                      max={2200}
                      step={50}
                      value={ceilingL}
                      onChange={(e) => setCeiling({ lengthMm: Number(e.target.value) })}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>

                  {/* Largura do Teto */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
                      <span>Largura:</span>
                      <strong style={{ color: '#38bdf8' }}>{ceilingW} mm</strong>
                    </div>
                    <input
                      type="range"
                      min={1000}
                      max={1350}
                      step={25}
                      value={ceilingW}
                      onChange={(e) => setCeiling({ widthMm: Number(e.target.value) })}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                </div>

                {/* 5. CARD: ILUMINAÇÃO LED INTEGRADA NO TETO */}
                <div
                  style={{
                    background: isLedEnabled
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.85) 100%)'
                      : 'rgba(30, 41, 59, 0.4)',
                    border: isLedEnabled ? '1.5px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '10px',
                    padding: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>💡</span>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: isLedEnabled ? '#fbbf24' : '#e2e8f0' }}>
                          ILUMINAÇÃO LED NO TETO
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          Perfis de fita LED COB com difusor leitoso ou spots circulares com iluminação real no 3D
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCeiling({
                          led: {
                            ...ledCfg,
                            enabled: !isLedEnabled
                          }
                        });
                      }}
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '6px 14px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: 'none',
                        background: isLedEnabled
                          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                          : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#ffffff',
                        boxShadow: isLedEnabled
                          ? '0 2px 8px rgba(239, 68, 68, 0.4)'
                          : '0 2px 8px rgba(245, 158, 11, 0.4)'
                      }}
                    >
                      {isLedEnabled ? '🗑️ Desativar LED' : '➕ Ativar LED no Teto'}
                    </button>
                  </div>

                  {isLedEnabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                      {/* Tipo de Iluminação */}
                      <div>
                        <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '6px', fontWeight: 700 }}>
                          Estilo da Luminária do Teto:
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
                          {[
                            { id: 'strip_double', label: '2 Fitas Laterais', desc: 'Duplo perfil longitudinal' },
                            { id: 'strip_center', label: '1 Fita Central', desc: 'Perfil longitudinal único' },
                            { id: 'strip_triple', label: '3 Fitas Triplas', desc: 'Centro + 2 laterais' },
                            { id: 'spots', label: 'Spots Embutidos', desc: 'Plafons circulares embutir' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setCeiling({ led: { ...ledCfg, type: item.id as CeilingLedType } })}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                border: ledCfg.type === item.id ? '1.5px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
                                background: ledCfg.type === item.id ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                                color: ledCfg.type === item.id ? '#ffffff' : '#cbd5e1'
                              }}
                            >
                              <div style={{ fontSize: '10.5px', fontWeight: 700 }}>{item.label}</div>
                              <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>{item.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Se Spots: Quantidade de Spots */}
                      {ledCfg.type === 'spots' && (
                        <div>
                          <label style={{ display: 'block', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px', fontWeight: 700 }}>
                            Quantidade de Spots de LED:
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {[2, 4, 6, 8].map((qty) => (
                              <button
                                key={qty}
                                onClick={() => setCeiling({ led: { ...ledCfg, spotsCount: qty } })}
                                style={{
                                  flex: 1,
                                  padding: '5px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  border: (ledCfg.spotsCount || 4) === qty ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
                                  background: (ledCfg.spotsCount || 4) === qty ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                                  color: (ledCfg.spotsCount || 4) === qty ? '#ffffff' : '#94a3b8'
                                }}
                              >
                                {qty} Spots
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cor da Luz / Presets Rápidos */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '10.5px', color: '#e2e8f0', fontWeight: 700 }}>
                            Tonalidade da Luz:
                          </span>
                          <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700 }}>
                            {ledCfg.color === '#fef3c7'
                              ? '3000K Branco Quente'
                              : ledCfg.color === '#ffffff'
                                ? '4000K Branco Neutro'
                                : ledCfg.color === '#e0f2fe'
                                  ? '6000K Branco Frio'
                                  : ledCfg.color === '#f59e0b'
                                    ? 'Âmbar Noturno'
                                    : ledCfg.color === '#38bdf8'
                                      ? 'Azul Céu'
                                      : ledCfg.color}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {[
                            { color: '#fef3c7', label: '3000K Quente', bg: '#fef3c7' },
                            { color: '#ffffff', label: '4000K Neutro', bg: '#ffffff' },
                            { color: '#e0f2fe', label: '6000K Frio', bg: '#bae6fd' },
                            { color: '#f59e0b', label: 'Âmbar', bg: '#f59e0b' },
                            { color: '#38bdf8', label: 'Azul', bg: '#38bdf8' }
                          ].map((c) => {
                            const isSelected = (ledCfg.color || '#fef3c7').toLowerCase() === c.color.toLowerCase();
                            return (
                              <button
                                key={c.color}
                                onClick={() => setCeiling({ led: { ...ledCfg, color: c.color } })}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  border: isSelected ? '1.5px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.3)',
                                  background: isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                                  color: isSelected ? '#ffffff' : '#cbd5e1'
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: c.bg,
                                    border: '1px solid rgba(0,0,0,0.3)',
                                    boxShadow: isSelected ? `0 0 6px ${c.bg}` : 'none'
                                  }}
                                />
                                {c.label}
                              </button>
                            );
                          })}

                          {/* Seletor Customizado */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                            <span style={{ fontSize: '9px', color: '#94a3b8' }}>Custom:</span>
                            <input
                              type="color"
                              value={ledCfg.color || '#fef3c7'}
                              onChange={(e) => setCeiling({ led: { ...ledCfg, color: e.target.value } })}
                              style={{
                                width: '24px',
                                height: '24px',
                                padding: 0,
                                border: '1px solid rgba(148, 163, 184, 0.4)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                background: 'transparent'
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Brilho / Intensidade */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0' }}>
                          <span>Brilho / Intensidade Luminosa:</span>
                          <strong style={{ color: '#fbbf24' }}>{ledCfg.brightness ?? 85}%</strong>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          step={5}
                          value={ledCfg.brightness ?? 85}
                          onChange={(e) => setCeiling({ led: { ...ledCfg, brightness: Number(e.target.value) } })}
                          style={{ width: '100%', marginTop: '4px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

