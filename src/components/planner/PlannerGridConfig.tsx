import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const PlannerGridConfig: React.FC = () => {
  const { internalGrid, setInternalGrid } = useSolar();

  const cols = Math.max(1, internalGrid.colsX);
  const rows = Math.max(1, internalGrid.rowsZ);
  const cellWidthCm = (internalGrid.widthMm / cols / 10).toFixed(1);
  const cellLengthCm = (internalGrid.lengthMm / rows / 10).toFixed(1);

  return (
    <>
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
