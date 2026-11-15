const fs = require('fs');
const path = require('path');

const outDir = 'src/components/planner';

// 1. PlannerPresetConfirmModal.tsx
let modal = fs.readFileSync(path.join(outDir, 'PlannerPresetConfirmModal.tsx'), 'utf8');
modal = modal.replace(/handleCancelAction/g, 'onCancel');
modal = modal.replace(/handleConfirmAction/g, 'onConfirm');
fs.writeFileSync(path.join(outDir, 'PlannerPresetConfirmModal.tsx'), modal);

// 2. PlannerActionBar.tsx
let bar = fs.readFileSync(path.join(outDir, 'PlannerActionBar.tsx'), 'utf8');
bar = bar.replace(/handleRequestPreset/g, 'onRequestPreset');
bar = bar.replace(/handleRequestClear/g, 'onRequestClear');
bar = bar.replace('isCabinetsOpenPreview,\n    setIsCabinetsOpenPreview,',
  'isCabinetsOpenPreview,\n    setIsCabinetsOpenPreview,\n    updateInternalBox,\n    toggleCeiling3D,');
bar = bar.replace('return (\n    <>',
  'const isolatedBox = internalBoxes.find(b => b.id === isolatedBoxId);\n\n  return (\n    <>');
fs.writeFileSync(path.join(outDir, 'PlannerActionBar.tsx'), bar);

// 3. PlannerCeilingMaterial.tsx
let cm = fs.readFileSync(path.join(outDir, 'PlannerCeilingMaterial.tsx'), 'utf8');
cm = cm.replace('const isTransverse = ceilingCfg.slatDirection === \'transverse\';',
`const isTransverse = ceilingCfg.slatDirection === 'transverse';
  const ceilingW = ceilingCfg.widthMm || internalGrid.widthMm;
  const ceilingL = ceilingCfg.lengthMm || internalGrid.lengthMm;
  const slatLength = isTransverse ? ceilingW : ceilingL;`);
fs.writeFileSync(path.join(outDir, 'PlannerCeilingMaterial.tsx'), cm);

// 4. PlannerGridConfig.tsx
let gc = fs.readFileSync(path.join(outDir, 'PlannerGridConfig.tsx'), 'utf8');
gc = gc.replace('return (\n    <>',
`const cols = Math.max(1, internalGrid.colsX);
  const rows = Math.max(1, internalGrid.rowsZ);
  const cellWidthCm = (internalGrid.widthMm / cols / 10).toFixed(1);
  const cellLengthCm = (internalGrid.lengthMm / rows / 10).toFixed(1);

  return (
    <>`);
fs.writeFileSync(path.join(outDir, 'PlannerGridConfig.tsx'), gc);

// 5. PlannerRearTableSection.tsx
let rt = fs.readFileSync(path.join(outDir, 'PlannerRearTableSection.tsx'), 'utf8');
rt = rt.replace('const { updateInternalBox } = useSolar();', 'const { updateInternalBox, isOpenPreview } = useSolar();');
fs.writeFileSync(path.join(outDir, 'PlannerRearTableSection.tsx'), rt);

// 6. PlannerUpperCabinetSection.tsx
let uc = fs.readFileSync(path.join(outDir, 'PlannerUpperCabinetSection.tsx'), 'utf8');
uc = uc.replace('const { updateInternalBox, isCabinetsOpenPreview, setIsCabinetsOpenPreview } = useSolar();',
  'const { updateInternalBox, isCabinetsOpenPreview, setIsCabinetsOpenPreview, internalGrid } = useSolar();\n  const rows = Math.max(1, internalGrid.rowsZ);');
fs.writeFileSync(path.join(outDir, 'PlannerUpperCabinetSection.tsx'), uc);

// 7. PlannerSlatBedSection.tsx
const slatBedCode = `import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, SlatBedDirection } from '../../types';

interface PlannerSlatBedProps {
  selectedBox: InternalBoxItem;
  cols: number;
  rows: number;
}

export const PlannerSlatBedSection: React.FC<PlannerSlatBedProps> = ({ selectedBox, cols, rows }) => {
  const { updateInternalBox, internalGrid, setIsOpenPreview } = useSolar();

  if (selectedBox.type !== 'slat_bed') return null;

  const isLateral = (selectedBox.slatBedDirection || 'left') === 'left' || selectedBox.slatBedDirection === 'right';
  const baseDimMm = Math.round(isLateral
    ? selectedBox.colSpan * (internalGrid.widthMm / cols)
    : selectedBox.rowSpan * (internalGrid.lengthMm / rows));
  const extPct = Math.min(100, Math.max(40, selectedBox.slatExtensionPercent ?? 85));
  const extDimMm = Math.round(baseDimMm * (1 + extPct / 100));

  return (
    <>
      {/* Configuração Exclusiva para Cama Retrátil com Ripas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
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
            <option value="rear">▼ Traseira (Abre p/ Porta-Malas)</option>
            <option value="front">▲ Dianteira (Abre p/ Bancos da Frente)</option>
          </select>
        </div>

        {/* Extensão e Botão de Abrir Toda a Cama */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '6px', padding: '8px 10px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
              🛏️ Extensão do Estrado Deslizante:
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Base fixa: {baseDimMm} mm ➔ Aberta: <strong>{extDimMm} mm</strong> (+{extPct}%)
            </div>
          </div>
          <button
            onClick={() => {
              const newExt = (selectedBox.slatExtensionPercent ?? 85) >= 95 ? 40 : 100;
              updateInternalBox(selectedBox.id, { slatExtensionPercent: newExt });
              setIsOpenPreview(true);
            }}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              background: (selectedBox.slatExtensionPercent ?? 85) >= 95 ? '#38bdf8' : 'rgba(56, 189, 248, 0.25)',
              color: (selectedBox.slatExtensionPercent ?? 85) >= 95 ? '#0f172a' : '#38bdf8'
            }}
          >
            {(selectedBox.slatExtensionPercent ?? 85) >= 95 ? '✓ 100% Cama Aberta' : '⚡ Abrir Toda Cama'}
          </button>
        </div>
      </div>

      {/* Painel de Controle Avançado da Cama Retrátil com Ripas */}
      <div
        style={{
          marginTop: '8px',
          padding: '10px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '6px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
            📐 Medidas da Cama Aberta:
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 800 }}>
            {extDimMm} mm (+{extPct}%)
          </span>
        </div>
        <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>
          • Estrado de ripas compensadas em leque tipo pente retrátil com pés de apoio articulados ao assoalho.
        </div>
      </div>
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'PlannerSlatBedSection.tsx'), slatBedCode);

// 8. PlannerFloorGrid.tsx
let fg = fs.readFileSync(path.join(outDir, 'PlannerFloorGrid.tsx'), 'utf8');
fg = fg.replace('updateInternalBox,\n    removeInternalBox,\n  } = useSolar();',
`updateInternalBox,
    removeInternalBox,
    setIsolatedBoxId,
  } = useSolar();

  const totalFloorVolumeL = Math.round(
    (internalGrid.widthMm / 1000) * (internalGrid.lengthMm / 1000) * (internalGrid.heightMm / 1000) * 1000
  );

  const occupiedVolumeL = internalBoxes.reduce((acc, box) => {
    const boxWM = (box.colSpan * (internalGrid.widthMm / cols)) / 1000;
    const boxLM = (box.rowSpan * (internalGrid.lengthMm / rows)) / 1000;
    const boxHM = (box.heightMm || internalGrid.heightMm) / 1000;
    return acc + Math.round(boxWM * boxLM * boxHM * 1000);
  }, 0);

  const occupationPct = totalFloorVolumeL > 0 ? Math.min(100, Math.round((occupiedVolumeL / totalFloorVolumeL) * 100)) : 0;

  const dragRect = dragStart && dragCurrent ? {
    colMin: Math.min(dragStart.col, dragCurrent.col),
    colMax: Math.max(dragStart.col, dragCurrent.col),
    rowMin: Math.min(dragStart.row, dragCurrent.row),
    rowMax: Math.max(dragStart.row, dragCurrent.row),
  } : null;

  const handleCellMouseDown = (col: number, row: number) => {
    isDraggingRef.current = true;
    setDragStart({ col, row });
    setDragCurrent({ col, row });
  };

  const handleCellMouseEnter = (col: number, row: number) => {
    if (isDraggingRef.current) {
      setDragCurrent({ col, row });
    }
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (dragStart && dragCurrent) {
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
    }
    setDragStart(null);
    setDragCurrent(null);
  };`);
fs.writeFileSync(path.join(outDir, 'PlannerFloorGrid.tsx'), fg);

console.log('All planner errors fixed!');
