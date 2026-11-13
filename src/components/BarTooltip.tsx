import React from 'react';
import { useSolar } from '../context/SolarContext';

export const BarTooltip: React.FC = () => {
  const { hoveredBar, hoverPos, structureMaterial, steelProfileUnit } = useSolar();

  if (!hoveredBar) return null;

  const posX = Math.min(hoverPos.x + 14, window.innerWidth - 360);
  const posY = Math.min(hoverPos.y + 14, window.innerHeight - 300);

  const isElect = hoveredBar.isElectrical;

  // Cor temática baseada no componente
  let accentColor = '#38bdf8'; // Azul padrão
  let icon = '📐';
  if (isElect) {
    if (hoveredBar.electricalType === 'battery') {
      accentColor = '#10b981';
      icon = '🔋';
    } else if (hoveredBar.electricalType === 'mppt') {
      accentColor = '#0ea5e9';
      icon = '⚡';
    } else if (hoveredBar.electricalType === 'b2b') {
      accentColor = '#38bdf8';
      icon = '🚗⚡';
    } else if (hoveredBar.electricalType === 'usina') {
      accentColor = '#ef4444';
      icon = '🔌⚡';
    } else if (hoveredBar.electricalType === 'water') {
      accentColor = '#0ea5e9';
      icon = '💧';
    } else if (hoveredBar.electricalType === 'panel') {
      accentColor = '#f59e0b';
      icon = '☀️';
    }
  }

  const isWater = hoveredBar.electricalType === 'water';
  const isPanel = hoveredBar.electricalType === 'panel';

  return (
    <div
      style={{
        position: 'fixed',
        left: `${posX}px`,
        top: `${posY}px`,
        pointerEvents: 'none',
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: `1px solid ${accentColor}`,
        boxShadow: `0 10px 28px -5px rgba(0, 0, 0, 0.75), 0 0 16px ${accentColor}40`,
        borderRadius: '10px',
        padding: '12px 14px',
        color: '#fff',
        maxWidth: '340px',
        minWidth: '240px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
        <div style={{ fontWeight: 800, fontSize: '13px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{icon}</span>
          <span>{hoveredBar.name}</span>
        </div>
      </div>

      {hoveredBar.category && (
        <div style={{ fontSize: '9.5px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
          {hoveredBar.category}
        </div>
      )}

      <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '6px 0 8px 0' }}></div>

      {isElect ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px' }}>
          {hoveredBar.voltage && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#94a3b8' }}>{isWater ? 'Medidas:' : (isPanel ? 'Tensão (Voc / Vmp):' : 'Tensão:')}</span>
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>{hoveredBar.voltage}</span>
            </div>
          )}
          {hoveredBar.capacity && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#94a3b8' }}>{isWater ? 'Volume Água:' : 'Capacidade:'}</span>
              <span style={{ fontWeight: 700, color: '#4ade80' }}>{hoveredBar.capacity}</span>
            </div>
          )}
          {hoveredBar.current && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#94a3b8' }}>{isWater ? 'Limite Base:' : (isPanel ? 'Corrente (Imp / Isc):' : 'Corrente:')}</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>{hoveredBar.current}</span>
            </div>
          )}
          {hoveredBar.power && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#94a3b8' }}>{isWater ? 'Peso Cheio:' : (isPanel ? 'Potência (Pmax):' : 'Potência:')}</span>
              <span style={{ fontWeight: 700, color: '#f87171' }}>{hoveredBar.power}</span>
            </div>
          )}
          {hoveredBar.efficiency && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#94a3b8' }}>{isPanel ? 'Eficiência / Células:' : 'Eficiência / Ciclos:'}</span>
              <span style={{ fontWeight: 600, color: '#a7f3d0' }}>{hoveredBar.efficiency}</span>
            </div>
          )}
          {hoveredBar.material && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#94a3b8' }}>{isPanel ? 'Laminado / Dimensões:' : 'Estrutura / Gabinete:'}</span>
              <span style={{ color: '#cbd5e1' }}>{hoveredBar.material}</span>
            </div>
          )}
          {hoveredBar.purpose && (
            <div style={{ marginTop: '4px', fontSize: '10px', color: '#cbd5e1', lineHeight: 1.4, fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.04)', padding: '5px 8px', borderRadius: '4px' }}>
              💡 {hoveredBar.purpose}
            </div>
          )}
          {hoveredBar.features && hoveredBar.features.length > 0 && (
            <div style={{ marginTop: '5px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {hoveredBar.features.map((feat, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '9.5px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#e2e8f0'
                  }}
                >
                  ✓ {feat}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px' }}>
          {hoveredBar.barLength !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#94a3b8' }}>Comprimento:</span>
              <span style={{ fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace', fontSize: '13px' }}>
                {structureMaterial === 'steel' && steelProfileUnit === 'inch'
                  ? `${(hoveredBar.barLength * 39.3701).toFixed(1)}" (${Math.round(hoveredBar.barLength * 1000)} mm)`
                  : `${Math.round(hoveredBar.barLength * 1000)} mm`}
              </span>
            </div>
          )}
          {hoveredBar.barProfile && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#94a3b8' }}>Perfil:</span>
              <span style={{ fontWeight: 600, color: '#10b981' }}>{hoveredBar.barProfile}</span>
            </div>
          )}
          {hoveredBar.cutAngle && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#94a3b8' }}>Corte nas Pontas:</span>
              <span style={{ color: '#cbd5e1' }}>{hoveredBar.cutAngle}</span>
            </div>
          )}
          {hoveredBar.material && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#94a3b8' }}>Material:</span>
              <span style={{ color: '#cbd5e1' }}>{hoveredBar.material}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

