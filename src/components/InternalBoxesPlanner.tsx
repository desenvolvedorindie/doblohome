import React, { useState, useRef } from 'react';
import { useSolar } from '../context/SolarContext';
import { INTERNAL_BOXES_PRESETS } from '../data/internalBoxesPresets';
import { PlannerPresetConfirmModal } from './planner/PlannerPresetConfirmModal';
import { PlannerActionBar } from './planner/PlannerActionBar';
import { PlannerFloorGrid } from './planner/PlannerFloorGrid';
import { PlannerGridConfig } from './planner/PlannerGridConfig';
import { PlannerCeilingSection } from './planner/PlannerCeilingSection';

export type InternalBoxesLeftTab = 'all' | 'grid' | 'ceiling';

interface InternalBoxesPlannerProps {
  activeTab?: InternalBoxesLeftTab;
}

export const InternalBoxesPlanner: React.FC<InternalBoxesPlannerProps> = ({
  activeTab = 'all',
}) => {
  const {
    internalGrid,
    internalBoxes,
    applyInternalBoxesPreset,
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

  const cols = Math.max(1, internalGrid.colsX);
  const rows = Math.max(1, internalGrid.rowsZ);
  const hasUpperCabinets = internalBoxes.some((b) => b.upperCabinet);

  const cellWidthCm = (internalGrid.widthMm / cols / 10).toFixed(1);
  const cellLengthCm = (internalGrid.lengthMm / rows / 10).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
      <PlannerPresetConfirmModal
        confirmDialog={confirmDialog}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />

      {(activeTab === 'all' || activeTab === 'grid') && (
        <>
          <PlannerActionBar
            onRequestClear={handleRequestClear}
            onRequestPreset={handleRequestPreset}
            hasUpperCabinets={hasUpperCabinets}
          />

          <PlannerFloorGrid
            dragStart={dragStart}
            setDragStart={setDragStart}
            dragCurrent={dragCurrent}
            setDragCurrent={setDragCurrent}
            isDraggingRef={isDraggingRef}
            cols={cols}
            rows={rows}
            cellWidthCm={cellWidthCm}
            cellLengthCm={cellLengthCm}
          />

          <PlannerGridConfig />
        </>
      )}

      {(activeTab === 'all' || activeTab === 'ceiling') && <PlannerCeilingSection />}
    </div>
  );
};
