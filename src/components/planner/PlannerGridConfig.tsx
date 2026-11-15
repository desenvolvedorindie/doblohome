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
      </div>

    </>
  );
};
