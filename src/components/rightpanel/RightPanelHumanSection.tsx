import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { useRackWeightAndHeight } from './useRackWeightAndHeight';
import { PersonStandingIcon } from '../layout/IdeIcons';

const HEIGHT_PRESETS = [
  { label: '1.60 m', value: 1.60 },
  { label: '1.70 m', value: 1.70 },
  { label: '1.75 m (Média)', value: 1.75 },
  { label: '1.80 m', value: 1.80 },
  { label: '1.90 m', value: 1.90 },
];

export const RightPanelHumanSection: React.FC = () => {
  const {
    humanFigureVisible,
    humanFigureHeightM,
    toggleHumanFigure,
    setHumanFigureHeight,
  } = useSolar();

  const { rackHeightStats } = useRackWeightAndHeight();

  const dobloRoofH = rackHeightStats?.vehicleBaseHeightM ?? 1.84;
  const totalRackH = rackHeightStats?.totalVehicleHeightM ?? 2.20;
  const diffRoof = +(humanFigureHeightM - dobloRoofH).toFixed(2);

  return (
    <div className="expansion-widget-section" style={{ marginBottom: '8px' }}>
      <div className="expansion-widget-header" style={{ marginBottom: '6px' }}>
        <span
          className="expansion-widget-subheader"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}
        >
          <PersonStandingIcon size={14} />
          <span>BONECO DE REFERÊNCIA (ESCALA)</span>
        </span>
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: humanFigureVisible ? '#38bdf8' : 'var(--text-muted)',
          }}
        >
          {humanFigureVisible ? `${humanFigureHeightM.toFixed(2)} m` : 'Oculto'}
        </span>
      </div>

      {/* Botão de Toggle Liga/Desliga */}
      <div style={{ marginBottom: '8px' }}>
        <button
          type="button"
          className={`toggle-btn ${humanFigureVisible ? 'active' : ''}`}
          onClick={toggleHumanFigure}
          style={{ width: '100%', justifyContent: 'space-between' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PersonStandingIcon size={14} />
            <span>{humanFigureVisible ? 'Boneco Visível (Ativado)' : 'Exibir Boneco na Cena 3D'}</span>
          </span>
          <div className="toggle-indicator" />
        </button>
      </div>

      {/* Controles de Altura — sempre visíveis */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '8px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Altura do Boneco:</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
              {humanFigureHeightM.toFixed(2)}
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>m</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              ({Math.round(humanFigureHeightM * 100)} cm)
            </span>
          </div>
        </div>

        {/* Slider de Altura */}
        <input
          type="range"
          className="custom-slider"
          min="1.40"
          max="2.10"
          step="0.01"
          value={humanFigureHeightM}
          onChange={(e) => setHumanFigureHeight(parseFloat(e.target.value))}
          title="Ajuste fino de altura da pessoa (1.40m a 2.10m)"
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)' }}>
          <span>1.40 m</span>
          <span>1.75 m (Média)</span>
          <span>2.10 m</span>
        </div>

        {/* Presets rápidos */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
          {HEIGHT_PRESETS.map((p) => {
            const isSelected = Math.abs(humanFigureHeightM - p.value) < 0.005;
            return (
              <button
                key={p.label}
                type="button"
                className={`cam-btn ${isSelected ? 'active' : ''}`}
                style={{
                  flex: '1 1 auto',
                  minWidth: '52px',
                  padding: '3px 6px',
                  fontSize: '10px',
                  borderRadius: '4px',
                  background: isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                  borderColor: isSelected ? '#38bdf8' : '#334155',
                  color: isSelected ? '#38bdf8' : '#cbd5e1',
                }}
                onClick={() => setHumanFigureHeight(p.value)}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Comparativo de Referência com a Doblò */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '6px',
            marginTop: '2px',
            fontSize: '10.5px',
            color: '#94a3b8',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>🚗 Teto Doblò:</span>
            <strong style={{ color: '#f1f5f9' }}>{dobloRoofH.toFixed(2)} m</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>🏗️ Topo com Rack/Baú:</span>
            <strong style={{ color: '#fbbf24' }}>{totalRackH.toFixed(2)} m</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>📏 Diferença vs Teto:</span>
            <strong style={{ color: diffRoof >= 0 ? '#34d399' : '#38bdf8' }}>
              {diffRoof >= 0 ? `+${diffRoof} m (Mais alto)` : `${diffRoof} m (Abaixo)`}
            </strong>
          </div>
        </div>
      </div>

      <div className="expansion-widget-divider" style={{ margin: '10px 0 6px 0' }} />
    </div>
  );
};
