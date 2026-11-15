const fs = require('fs');
const path = require('path');

const outDir = 'src/components/planner';

// 1. Rewrite PlannerSlatBedSection.tsx
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
          marginTop: '10px',
          padding: '10px 12px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(15, 23, 42, 0.6))',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          borderRadius: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
            🪵 Especificações Estruturais do Ripado (Cama Doblò):
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            {selectedBox.slatCount || 10} ripas intercaladas
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
              Qtd de Ripas:
            </label>
            <input
              type="number"
              min={6}
              max={24}
              value={selectedBox.slatCount || 10}
              onChange={(e) => updateInternalBox(selectedBox.id, { slatCount: Math.max(6, Math.min(24, parseInt(e.target.value) || 10)) })}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#ffffff',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '11px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
              Largura Ripa (mm):
            </label>
            <input
              type="number"
              min={30}
              max={120}
              value={selectedBox.slatWidthMm || 55}
              onChange={(e) => updateInternalBox(selectedBox.id, { slatWidthMm: Math.max(30, Math.min(120, parseInt(e.target.value) || 55)) })}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#ffffff',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '11px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
              Espaçamento / Vão (mm):
            </label>
            <input
              type="number"
              min={15}
              max={80}
              value={selectedBox.slatGapMm || 30}
              onChange={(e) => updateInternalBox(selectedBox.id, { slatGapMm: Math.max(15, Math.min(80, parseInt(e.target.value) || 30)) })}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#ffffff',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '11px'
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '8px', fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.4 }}>
          💡 <em>O sistema de pente com ripas compensadas de 15mm desliza suavemente sobre guias e apoia no assoalho através dos pés retráteis.</em>
        </div>
      </div>
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'PlannerSlatBedSection.tsx'), slatBedCode);

// 2. Rewrite PlannerUpperCabinetSection.tsx
let uc = fs.readFileSync(path.join(outDir, 'PlannerUpperCabinetSection.tsx'), 'utf8');
const ucEndIndex = uc.lastIndexOf('</div>\n            )}\n          </div>');
if (ucEndIndex !== -1) {
  uc = uc.slice(0, ucEndIndex + '</div>\n            )}\n          </div>'.length) + '\n    </>\n  );\n};\n';
  fs.writeFileSync(path.join(outDir, 'PlannerUpperCabinetSection.tsx'), uc);
}

console.log('PlannerSlatBed and UpperCabinet updated!');
