import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { CameraPreset } from '../../types';

export const RightPanelEnvironmentSection: React.FC = () => {
  const {
    sunHour,
    setSunHour,
    isVehicleVisible,
    toggleVehicle,
    isDimensionsVisible,
    toggleDimensions,
    isTransparent,
    toggleTransparency,
    isSoundEnabled,
    toggleSound,
    sceneManager,
    activeCameraPreset,
    setCameraPreset,
  } = useSolar();

  const formatSunTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}h`;
  };

  return (
    <>
          {/* Simulação do Sol & Horário */}
          <div className="expansion-widget-header" style={{ marginTop: '2px' }}>
            <span className="expansion-widget-subheader">☀️ SIMULAÇÃO DO SOL & SOMBRAS</span>
            <span
              id="sun-time-val"
              style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}
            >
              {formatSunTime(sunHour)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '9px',
              color: 'var(--text-muted)',
              marginBottom: '1px'
            }}
          >
            <span>🌅 08h (Manhã)</span>
            <span>☀️ 12h (Zênite)</span>
            <span>🌇 18h (Tarde)</span>
          </div>
          <input
            type="range"
            id="sun-slider"
            className="custom-slider"
            min="8"
            max="18"
            step="0.5"
            value={sunHour}
            onChange={(e) => setSunHour(parseFloat(e.target.value))}
          />

          <div className="expansion-widget-divider"></div>

          <div className="expansion-widget-subheader">🔍 VISIBILIDADE</div>
          <div className="toggles-grid">
            <button
              className={`toggle-btn ${isVehicleVisible ? 'active' : ''}`}
              id="toggle-vehicle"
              onClick={toggleVehicle}
            >
              <span>Fiat Doblò</span>
              <div className="toggle-indicator"></div>
            </button>
            <button
              className={`toggle-btn ${isDimensionsVisible ? 'active' : ''}`}
              id="toggle-dimensions"
              onClick={toggleDimensions}
            >
              <span>Labels / Cotas 3D</span>
              <div className="toggle-indicator"></div>
            </button>
            <button
              className={`toggle-btn ${isTransparent ? 'active' : ''}`}
              id="toggle-transparent"
              onClick={toggleTransparency}
            >
              <span>Raio-X (Topo)</span>
              <div className="toggle-indicator"></div>
            </button>
            <button
              className={`toggle-btn ${isSoundEnabled ? 'active' : ''}`}
              id="toggle-sound"
              onClick={toggleSound}
            >
              <span className="toggle-label">{isSoundEnabled ? 'Som: Ativado' : 'Som: Mudo'}</span>
              <div className="toggle-indicator"></div>
            </button>
          </div>

          <div className="expansion-widget-divider"></div>

          <div className="expansion-widget-subheader">🎥 CÂMERAS</div>
          <div className="cam-grid">
            <button
              className={`cam-btn ${activeCameraPreset === 'top' ? 'active' : ''}`}
              onClick={() => setCameraPreset('top')}
            >
              📐 Topo
            </button>
            <button
              className={`cam-btn ${activeCameraPreset === 'iso' ? 'active' : ''}`}
              onClick={() => setCameraPreset('iso')}
            >
              🔍 Isométrica
            </button>
            <button
              className={`cam-btn ${activeCameraPreset === 'side' ? 'active' : ''}`}
              onClick={() => setCameraPreset('side')}
            >
              📏 Lateral
            </button>
            <button
              className={`cam-btn ${activeCameraPreset === 'front' ? 'active' : ''}`}
              onClick={() => setCameraPreset('front')}
            >
              🚗 Frontal
            </button>
            <button
              className={`cam-btn ${activeCameraPreset === 'panels' ? 'active' : ''}`}
              onClick={() => setCameraPreset('panels')}
              style={{
                gridColumn: 'span 4',
                background: 'rgba(56, 189, 248, 0.12)',
                borderColor: 'rgba(56, 189, 248, 0.35)',
                color: '#38bdf8'
              }}
            >
              🔬 Inspecionar Perfil T-Slot 40x40
            </button>
          </div>

      <div className="expansion-widget-divider" style={{ margin: '14px 0 8px 0' }} />
    </>
  );
};
