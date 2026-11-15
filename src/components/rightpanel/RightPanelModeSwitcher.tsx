import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const RightPanelModeSwitcher: React.FC = () => {
  const { viewMode, setViewMode } = useSolar();

  return (
    <div
      className="glass-panel"
      style={{
        position: 'fixed',
        top: '84px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 35,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px',
        borderRadius: '999px',
        whiteSpace: 'nowrap',
        maxWidth: 'calc(100vw - 24px)',
        overflowX: 'auto',
        background: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid rgba(56, 189, 248, 0.45)',
        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.55), 0 0 16px rgba(56, 189, 248, 0.2)'
      }}
    >
      <button
        onClick={() => setViewMode('internal_boxes')}
        style={{
          border: 'none',
          borderRadius: '999px',
          padding: '7px 16px',
          fontSize: '12px',
          fontWeight: 800,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          background: viewMode === 'internal_boxes' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
          color: viewMode === 'internal_boxes' ? '#ffffff' : '#94a3b8',
          boxShadow: viewMode === 'internal_boxes' ? '0 2px 10px rgba(245, 158, 11, 0.45)' : 'none'
        }}
      >
        📦 1. Caixas Internas
      </button>
      <button
        onClick={() => setViewMode('assembled')}
        style={{
          border: 'none',
          borderRadius: '999px',
          padding: '7px 16px',
          fontSize: '12px',
          fontWeight: 800,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          background: viewMode === 'assembled' ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : 'transparent',
          color: viewMode === 'assembled' ? '#ffffff' : '#94a3b8',
          boxShadow: viewMode === 'assembled' ? '0 2px 10px rgba(14, 165, 233, 0.45)' : 'none'
        }}
      >
        🚐 2. Doblò + Estrutura
      </button>
      <button
        onClick={() => setViewMode('bars_lineup')}
        style={{
          border: 'none',
          borderRadius: '999px',
          padding: '7px 16px',
          fontSize: '12px',
          fontWeight: 800,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          background: viewMode === 'bars_lineup' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
          color: viewMode === 'bars_lineup' ? '#ffffff' : '#94a3b8',
          boxShadow: viewMode === 'bars_lineup' ? '0 2px 10px rgba(16, 185, 129, 0.45)' : 'none'
        }}
      >
        📏 3. Peças
      </button>
      <button
        onClick={() => setViewMode('electrical_planar')}
        style={{
          border: 'none',
          borderRadius: '999px',
          padding: '7px 16px',
          fontSize: '12px',
          fontWeight: 800,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          background: viewMode === 'electrical_planar' ? 'linear-gradient(135deg, #eab308, #d97706)' : 'transparent',
          color: viewMode === 'electrical_planar' ? '#ffffff' : '#94a3b8',
          boxShadow: viewMode === 'electrical_planar' ? '0 2px 10px rgba(234, 179, 8, 0.45)' : 'none'
        }}
      >
        ⚡ 4. Elétrica 2D
      </button>
      <button
        onClick={() => setViewMode('hydraulic_planar')}
        style={{
          border: 'none',
          borderRadius: '999px',
          padding: '7px 16px',
          fontSize: '12px',
          fontWeight: 800,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          background: viewMode === 'hydraulic_planar' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
          color: viewMode === 'hydraulic_planar' ? '#ffffff' : '#94a3b8',
          boxShadow: viewMode === 'hydraulic_planar' ? '0 2px 10px rgba(2, 132, 199, 0.45)' : 'none'
        }}
      >
        💧 5. Hidráulica 2D
      </button>
    </div>
  );
};
