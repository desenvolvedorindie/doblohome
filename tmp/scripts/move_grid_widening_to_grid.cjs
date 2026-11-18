const fs = require('fs');
const path = require('path');

// 1. Update PlannerFloorGrid.tsx
const floorGridPath = path.resolve('src/components/planner/PlannerFloorGrid.tsx');
let floorGridCode = fs.readFileSync(floorGridPath, 'utf8');

// Ensure setInternalGrid is destructured from useSolar
floorGridCode = floorGridCode.replace(
  '    internalGrid,\r\n    internalBoxes,',
  '    internalGrid,\r\n    setInternalGrid,\r\n    internalBoxes,'
).replace(
  '    internalGrid,\n    internalBoxes,',
  '    internalGrid,\n    setInternalGrid,\n    internalBoxes,'
);

// Add fine adjustment handler for module extraWidthMm
const resizeModuleTarget = '  const resizeBox = (dColSpan: number, dRowSpan: number) => {';
const resizeModuleReplacement = `  const adjustExtraWidth = (deltaMm: number) => {
    if (!selectedBox) return;
    const currentExtra = selectedBox.extraWidthMm || 0;
    const newExtra = Math.max(-250, Math.min(400, currentExtra + deltaMm));
    updateInternalBox(selectedBox.id, { extraWidthMm: newExtra });
  };

  const resizeBox = (dColSpan: number, dRowSpan: number) => {`;

if (!floorGridCode.includes('adjustExtraWidth')) {
  floorGridCode = floorGridCode.replace(resizeModuleTarget, resizeModuleReplacement);
}

// In the module toolbar, add quick mm adjustment next to Tamanho
const moduleToolbarTarget = `              {/* Grupo Tamanho */}
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
              </div>`;

const moduleToolbarReplacement = `              {/* Grupo Tamanho */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginRight: '3px' }}>Tamanho:</span>
                <button
                  type="button"
                  disabled={!canShrinkWidth}
                  onClick={() => resizeBox(-1, 0)}
                  className="btn-compact"
                  style={{ fontSize: '11px', padding: '3px 7px', fontWeight: 700 }}
                  title="Encolher largura no grid (Shift + ←)"
                >
                  ◀ Larg -
                </button>
                <button
                  type="button"
                  disabled={!canExpandWidth}
                  onClick={() => resizeBox(1, 0)}
                  className="btn-compact"
                  style={{ fontSize: '11px', padding: '3px 7px', fontWeight: 700 }}
                  title="Alargar / esticar largura no grid (Shift + →)"
                >
                  Larg + ▶
                </button>
                <button
                  type="button"
                  disabled={!canShrinkLength}
                  onClick={() => resizeBox(0, -1)}
                  className="btn-compact"
                  style={{ fontSize: '11px', padding: '3px 7px', fontWeight: 700 }}
                  title="Encolher comprimento no grid (Shift + ↑)"
                >
                  ▲ Comp -
                </button>
                <button
                  type="button"
                  disabled={!canExpandLength}
                  onClick={() => resizeBox(0, 1)}
                  className="btn-compact"
                  style={{ fontSize: '11px', padding: '3px 7px', fontWeight: 700 }}
                  title="Esticar comprimento no grid (Shift + ↓)"
                >
                  Comp + ▼
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px', background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#f59e0b', fontWeight: 700 }}>Fino:</span>
                  <button
                    type="button"
                    onClick={() => adjustExtraWidth(-10)}
                    className="btn-compact"
                    style={{ fontSize: '9.5px', padding: '1px 4px', fontWeight: 700 }}
                    title="Reduzir 10mm na largura do módulo"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustExtraWidth(10)}
                    className="btn-compact"
                    style={{ fontSize: '9.5px', padding: '1px 4px', fontWeight: 700 }}
                    title="Alargar 10mm na largura do módulo"
                  >
                    +10
                  </button>
                  {(selectedBox.extraWidthMm || 0) !== 0 && (
                    <span style={{ fontSize: '9px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      {(selectedBox.extraWidthMm || 0) > 0 ? \`+\${selectedBox.extraWidthMm}\` : selectedBox.extraWidthMm}mm
                    </span>
                  )}
                </div>
              </div>`;

floorGridCode = floorGridCode.replace(moduleToolbarTarget, moduleToolbarReplacement);

// Replace grid top header to include direct grid widening and length controls
const gridHeaderRegex = /<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' \}\}>[\s\S]*?<\/div>\r?\n\s*<\/div>/;

const newGridHeader = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
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
        </div>`;

floorGridCode = floorGridCode.replace(gridHeaderRegex, newGridHeader);
fs.writeFileSync(floorGridPath, floorGridCode, 'utf8');
console.log('Successfully updated PlannerFloorGrid.tsx with direct grid widening controls');

// 2. Update PlannerGridConfig.tsx to remove the redundant widening sliders from left menu
const gridConfigPath = path.resolve('src/components/planner/PlannerGridConfig.tsx');
const newGridConfigCode = `import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const PlannerGridConfig: React.FC = () => {
  const { internalGrid, setInternalGrid } = useSolar();

  return (
    <>
      {/* Configuração de Altura & Chapa Base do Assoalho */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: '10px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '14px'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', marginBottom: '8px', textTransform: 'uppercase' }}>
          ⚙️ Altura & Chapa Base do Assoalho da Doblò
        </div>

        <div>
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

        {/* Chapa Base do Assoalho (Tampo de Baixo da Van) */}
        <div
          style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(148, 163, 184, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>
              🪵 Chapa do Assoalho Base (Tampo de Baixo da Van)
            </div>
            <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
              Compensado naval ({internalGrid.floorThicknessMm || 15}mm) que serve de nivelamento e fundo unificado para as caixas.
            </div>
          </div>
          <button
            type="button"
            className={\`btn-compact \${internalGrid.hasFloor !== false ? 'active' : ''}\`}
            onClick={() => setInternalGrid(prev => ({ ...prev, hasFloor: !(prev.hasFloor !== false) }))}
            style={{
              fontSize: '10.5px',
              padding: '6px 12px',
              fontWeight: 700,
              background: internalGrid.hasFloor !== false ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              borderColor: internalGrid.hasFloor !== false ? '#10b981' : '#ef4444',
              color: internalGrid.hasFloor !== false ? '#34d399' : '#f87171'
            }}
          >
            {internalGrid.hasFloor !== false ? '✓ Assoalho Ativo no Projeto' : '✗ Sem Assoalho (Tirar Tampo de Baixo)'}
          </button>
        </div>
      </div>
    </>
  );
};
`;

fs.writeFileSync(gridConfigPath, newGridConfigCode, 'utf8');
console.log('Successfully updated PlannerGridConfig.tsx');
