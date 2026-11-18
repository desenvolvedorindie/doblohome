import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const PlannerGridConfig: React.FC = () => {
  const { internalGrid, setInternalGrid } = useSolar();

  const isDefaultDoblo = internalGrid.widthMm === 1200 && internalGrid.lengthMm === 1700;

  const handleUpdateDimensions = (newW: number, newL: number) => {
    const sanitizedW = Math.max(500, Math.min(3000, Math.round(newW) || 1200));
    const sanitizedL = Math.max(500, Math.min(4000, Math.round(newL) || 1700));

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

  return (
    <>
      {/* Configuração de Dimensões Gerais do Espaço da Van */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: '10px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
            ⚙️ Dimensões do Espaço Útil da Van / Doblò
          </div>
          {!isDefaultDoblo && (
            <button
              type="button"
              onClick={() => handleUpdateDimensions(1200, 1700)}
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '3px 8px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10b981',
                color: '#34d399',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ↺ Restaurar Padrão Doblò (1200 × 1700 mm)
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {/* Largura Total (X) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px' }}>
              <span>Largura Total (X):</span>
              <strong style={{ color: '#38bdf8' }}>{internalGrid.widthMm} mm ({(internalGrid.widthMm / 10).toFixed(0)} cm)</strong>
            </div>
            <input
              type="range"
              min={600}
              max={2500}
              step={10}
              value={internalGrid.widthMm}
              onChange={(e) => handleUpdateDimensions(Number(e.target.value), internalGrid.lengthMm)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Comprimento / Altura (Z) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#e2e8f0', marginBottom: '4px' }}>
              <span>Comprimento Útil (Z):</span>
              <strong style={{ color: '#38bdf8' }}>{internalGrid.lengthMm} mm ({(internalGrid.lengthMm / 10).toFixed(0)} cm)</strong>
            </div>
            <input
              type="range"
              min={800}
              max={3500}
              step={10}
              value={internalGrid.lengthMm}
              onChange={(e) => handleUpdateDimensions(internalGrid.widthMm, Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Chapa Base do Assoalho (Tampo de Baixo da Van) */}
        <div
          style={{
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
            className={`btn-compact ${internalGrid.hasFloor !== false ? 'active' : ''}`}
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
