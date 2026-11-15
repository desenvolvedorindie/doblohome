const fs = require('fs');
const path = require('path');

const src = fs.readFileSync('src/components/InternalBoxesPlanner.tsx', 'utf8');
const lines = src.split('\n');

const outDir = 'src/components/planner';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Helper: 1-based start and end line slice (inclusive)
function getSlice(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

// 1. PlannerPresetConfirmModal.tsx (lines 200 to 329)
const modalBody = getSlice(200, 329);
const modalCode = `import React from 'react';

interface PlannerPresetConfirmModalProps {
  confirmDialog: {
    isOpen: boolean;
    type: 'clear' | 'preset';
    title: string;
    message: string;
    targetPresetId?: string;
    presetName?: string;
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PlannerPresetConfirmModal: React.FC<PlannerPresetConfirmModalProps> = ({
  confirmDialog,
  onConfirm,
  onCancel
}) => {
  if (!confirmDialog?.isOpen) return null;

  return (
${modalBody}
  );
};
`;
fs.writeFileSync(path.join(outDir, 'PlannerPresetConfirmModal.tsx'), modalCode);

// 2. PlannerActionBar.tsx (lines 330 to 551)
const actionBarBody = getSlice(330, 551);
const actionBarCode = `import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { INTERNAL_BOXES_PRESETS } from '../../data/internalBoxesPresets';

interface PlannerActionBarProps {
  onRequestClear: () => void;
  onRequestPreset: (preset: typeof INTERNAL_BOXES_PRESETS[0]) => void;
  hasUpperCabinets: boolean;
}

export const PlannerActionBar: React.FC<PlannerActionBarProps> = ({
  onRequestClear,
  onRequestPreset,
  hasUpperCabinets
}) => {
  const {
    internalGrid,
    setInternalGrid,
    internalBoxes,
    isolatedBoxId,
    setIsolatedBoxId,
    isOpenPreview,
    setIsOpenPreview,
    isCabinetsOpenPreview,
    setIsCabinetsOpenPreview,
  } = useSolar();

  return (
    <>
${actionBarBody}
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'PlannerActionBar.tsx'), actionBarCode);

// 3. PlannerFloorGrid.tsx (lines 552 to 859)
const floorGridBody = getSlice(552, 859);
const floorGridCode = `import React from 'react';
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
  } = useSolar();

  return (
    <>
${floorGridBody}
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'PlannerFloorGrid.tsx'), floorGridCode);

// 4. PlannerSlatBedSection.tsx (lines 1218 to 1396)
const slatBedBody = getSlice(1218, 1396);
const slatBedCode = `import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, SlatBedDirection } from '../../types';

interface PlannerSlatBedProps {
  selectedBox: InternalBoxItem;
}

export const PlannerSlatBedSection: React.FC<PlannerSlatBedProps> = ({ selectedBox }) => {
  const { updateInternalBox } = useSolar();

  return (
    <>
${slatBedBody}
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'PlannerSlatBedSection.tsx'), slatBedCode);

// 5. PlannerDinetteTableSection.tsx (lines 1574 to 1905)
const dinetteBody = getSlice(1574, 1905);
const dinetteCode = `import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, InternalBoxMaterial } from '../../types';

interface PlannerDinetteProps {
  selectedBox: InternalBoxItem;
}

export const PlannerDinetteTableSection: React.FC<PlannerDinetteProps> = ({ selectedBox }) => {
  const { updateInternalBox } = useSolar();

  return (
    <>
${dinetteBody}
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'PlannerDinetteTableSection.tsx'), dinetteCode);

// 6. PlannerRearTableSection.tsx (lines 1906 to 2036)
const rearTableBody = getSlice(1906, 2036);
const rearTableCode = `import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, InternalBoxMaterial } from '../../types';

interface PlannerRearTableProps {
  selectedBox: InternalBoxItem;
}

export const PlannerRearTableSection: React.FC<PlannerRearTableProps> = ({ selectedBox }) => {
  const { updateInternalBox } = useSolar();

  return (
    <>
${rearTableBody}
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'PlannerRearTableSection.tsx'), rearTableCode);

// 7. PlannerUpperCabinetSection.tsx (lines 2037 to 2258)
const upperCabinetBody = getSlice(2037, 2258);
const upperCabinetCode = `import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, UpperCabinetClosure, getUpperCabinetClosure } from '../../types';

interface PlannerUpperCabinetProps {
  selectedBox: InternalBoxItem;
}

export const PlannerUpperCabinetSection: React.FC<PlannerUpperCabinetProps> = ({ selectedBox }) => {
  const { updateInternalBox, isCabinetsOpenPreview, setIsCabinetsOpenPreview } = useSolar();

  return (
    <>
${upperCabinetBody}
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'PlannerUpperCabinetSection.tsx'), upperCabinetCode);

// 8. PlannerBoxInspector.tsx (lines 860 to 1217, <PlannerSlatBedSection>, lines 1397 to 1573, <Dinette>, <RearTable>, <UpperCabinet>, line 2258)
const part1 = getSlice(860, 1217);
const part2 = getSlice(1397, 1573);

const boxInspectorCode = `import React from 'react';
import { useSolar } from '../../context/SolarContext';
import {
  InternalBoxItem,
  InternalBoxMaterial,
  InternalBoxType,
  ChestHingeDirection,
  BoxPanelsConfig
} from '../../types';
import { PlannerSlatBedSection } from './PlannerSlatBedSection';
import { PlannerDinetteTableSection } from './PlannerDinetteTableSection';
import { PlannerRearTableSection } from './PlannerRearTableSection';
import { PlannerUpperCabinetSection } from './PlannerUpperCabinetSection';

interface PlannerBoxInspectorProps {
  cols: number;
  rows: number;
}

export const PlannerBoxInspector: React.FC<PlannerBoxInspectorProps> = ({ cols, rows }) => {
  const {
    internalGrid,
    internalBoxes,
    selectedBoxId,
    setSelectedBoxId,
    isolatedBoxId,
    setIsolatedBoxId,
    isOpenPreview,
    setIsOpenPreview,
    updateInternalBox,
    removeInternalBox,
  } = useSolar();

  const selectedBox = internalBoxes.find((b) => b.id === selectedBoxId);
  if (!selectedBox) return null;

  return (
    <>
${part1}
      <PlannerSlatBedSection selectedBox={selectedBox} />
${part2}
      <PlannerDinetteTableSection selectedBox={selectedBox} />
      <PlannerRearTableSection selectedBox={selectedBox} />
      <PlannerUpperCabinetSection selectedBox={selectedBox} />
    </div>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'PlannerBoxInspector.tsx'), boxInspectorCode);

// 9. PlannerGridConfig.tsx (lines 2259 to 2323)
const gridConfigBody = getSlice(2259, 2323);
const gridConfigCode = `import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const PlannerGridConfig: React.FC = () => {
  const { internalGrid, setInternalGrid } = useSolar();

  return (
    <>
${gridConfigBody}
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'PlannerGridConfig.tsx'), gridConfigCode);

// 10. PlannerCeilingMaterial.tsx (lines 2440 to 2855)
const ceilingMaterialBody = getSlice(2440, 2855);
const ceilingMaterialCode = `import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { CeilingConfig, CeilingType, CeilingSheetMaterial, CeilingSlattedWood } from '../../types';
import { DEFAULT_CEILING_CONFIG } from '../../data/internalBoxesPresets';

interface PlannerCeilingMaterialProps {
  ceilingCfg: CeilingConfig;
  calculatedSlatCount: number;
  totalSlatAreaM2: string;
}

export const PlannerCeilingMaterial: React.FC<PlannerCeilingMaterialProps> = ({
  ceilingCfg,
  calculatedSlatCount,
  totalSlatAreaM2
}) => {
  const { internalGrid, setCeiling } = useSolar();
  const [lastMdfType, setLastMdfType] = useState<CeilingSheetMaterial>('white_mdf');

  const isSlatted = (ceilingCfg.type || 'slatted') === 'slatted';
  const slatW = ceilingCfg.slatWidthMm || 40;
  const slatGap = ceilingCfg.slatGapMm || 10;
  const slatThick = ceilingCfg.slatThicknessMm || 12;
  const isTransverse = ceilingCfg.slatDirection === 'transverse';

  return (
    <>
${ceilingMaterialBody}
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'PlannerCeilingMaterial.tsx'), ceilingMaterialCode);

// 11. PlannerCeilingLighting.tsx (lines 2968 to 3195)
const ceilingLightingBody = getSlice(2968, 3195);
const ceilingLightingCode = `import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { CeilingConfig, CeilingLedConfig, CeilingLedType } from '../../types';
import { DEFAULT_CEILING_CONFIG } from '../../data/internalBoxesPresets';

interface PlannerCeilingLightingProps {
  ceilingCfg: CeilingConfig;
}

export const PlannerCeilingLighting: React.FC<PlannerCeilingLightingProps> = ({ ceilingCfg }) => {
  const { setCeiling } = useSolar();

  const ledCfg: CeilingLedConfig = ceilingCfg.led || {
    enabled: true,
    type: 'strip_double',
    color: '#fef3c7',
    brightness: 85,
    spotsCount: 4
  };
  const isLedEnabled = Boolean(ledCfg.enabled);

  return (
    <>
${ceilingLightingBody}
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'PlannerCeilingLighting.tsx'), ceilingLightingCode);

// 12. PlannerCeilingSection.tsx (lines 2324 to 2439, <PlannerCeilingMaterial>, lines 2856 to 2967, <PlannerCeilingLighting>, lines 3196 to 3198)
const ceilingHead = getSlice(2354, 2439);
const ceilingDims = getSlice(2856, 2967);

const ceilingSectionCode = `import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { CeilingConfig, CeilingLedConfig } from '../../types';
import { DEFAULT_CEILING_CONFIG } from '../../data/internalBoxesPresets';
import { PlannerCeilingMaterial } from './PlannerCeilingMaterial';
import { PlannerCeilingLighting } from './PlannerCeilingLighting';

export const PlannerCeilingSection: React.FC = () => {
  const { internalGrid, setCeiling, toggleCeiling3D } = useSolar();

  const ceilingCfg: CeilingConfig = internalGrid.ceiling || DEFAULT_CEILING_CONFIG;
  const isCeilingEnabled = ceilingCfg.enabled !== false;
  const isSlatted = (ceilingCfg.type || 'slatted') === 'slatted';
  const isCeilingVisible3D = ceilingCfg.visibleIn3D !== false;
  const ceilingOpacity = ceilingCfg.opacity ?? 1.0;

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
${ceilingHead}
      {isCeilingEnabled && (
        <>
          <PlannerCeilingMaterial
            ceilingCfg={ceilingCfg}
            calculatedSlatCount={calculatedSlatCount}
            totalSlatAreaM2={totalSlatAreaM2}
          />
${ceilingDims}
          <PlannerCeilingLighting ceilingCfg={ceilingCfg} />
        </>
      )}
    </div>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'PlannerCeilingSection.tsx'), ceilingSectionCode);

// 13. New InternalBoxesPlanner.tsx
const newPlannerCode = `import React, { useState, useRef } from 'react';
import { useSolar } from '../context/SolarContext';
import { INTERNAL_BOXES_PRESETS } from '../data/internalBoxesPresets';
import { PlannerPresetConfirmModal } from './planner/PlannerPresetConfirmModal';
import { PlannerActionBar } from './planner/PlannerActionBar';
import { PlannerFloorGrid } from './planner/PlannerFloorGrid';
import { PlannerBoxInspector } from './planner/PlannerBoxInspector';
import { PlannerGridConfig } from './planner/PlannerGridConfig';
import { PlannerCeilingSection } from './planner/PlannerCeilingSection';

export const InternalBoxesPlanner: React.FC = () => {
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
      message: \`Tem certeza que deseja remover todos os \${internalBoxes.length} módulos e caixas do assoalho da Doblò? Esta ação apagará as caixas configuradas.\`
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
      title: \`Substituir pelo Preset "\${preset.name.split(':')[0]}"?\`,
      message: \`Deseja substituir o layout atual (\${internalBoxes.length} módulos no assoalho) pelas caixas do preset "\${preset.name}"? As alterações não salvas serão substituídas.\`,
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

      <PlannerBoxInspector cols={cols} rows={rows} />

      <PlannerGridConfig />

      <PlannerCeilingSection />
    </div>
  );
};
`;
fs.writeFileSync('src/components/InternalBoxesPlanner.tsx', newPlannerCode);

console.log('InternalBoxesPlanner split complete!');
