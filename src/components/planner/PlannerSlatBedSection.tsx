import React from 'react';
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
