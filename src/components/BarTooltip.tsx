import React from 'react';
import { useSolar } from '../context/SolarContext';

export const BarTooltip: React.FC = () => {
  const { hoveredBar, hoverPos } = useSolar();

  if (!hoveredBar) return null;

  const posX = Math.min(hoverPos.x + 14, window.innerWidth - 300);
  const posY = Math.min(hoverPos.y + 14, window.innerHeight - 150);

  return (
    <div
      className="bar-measurement-tooltip visible"
      style={{
        position: 'fixed',
        left: `${posX}px`,
        top: `${posY}px`,
        pointerEvents: 'none',
        zIndex: 9999
      }}
    >
      <div className="tooltip-title">📐 {hoveredBar.name}</div>
      <div className="tooltip-divider"></div>
      <div className="tooltip-grid">
        {hoveredBar.barLength !== undefined && (
          <div className="tooltip-row highlight">
            <span className="lbl">Comprimento:</span>
            <span className="val">{Math.round(hoveredBar.barLength * 1000)} mm</span>
          </div>
        )}
        {hoveredBar.barProfile && (
          <div className="tooltip-row">
            <span className="lbl">Perfil:</span>
            <span className="val">{hoveredBar.barProfile}</span>
          </div>
        )}
        {hoveredBar.cutAngle && (
          <div className="tooltip-row">
            <span className="lbl">Corte nas Pontas:</span>
            <span className="val">{hoveredBar.cutAngle}</span>
          </div>
        )}
        {hoveredBar.material && (
          <div className="tooltip-row">
            <span className="lbl">Material:</span>
            <span className="val">{hoveredBar.material}</span>
          </div>
        )}
      </div>
    </div>
  );
};

