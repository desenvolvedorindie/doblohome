import React from 'react';
import { useSolar } from '../context/SolarContext';

export const Header: React.FC = () => {
  const { loadsSummary, openModal, takeScreenshot, b2bCharger, toggleB2BEngine } = useSolar();

  return (
    <header className="top-header glass-panel">
      <div className="header-left">
        <div className="app-badge">⚡ DOBLÒ MOTORHOME</div>
        <div className="header-title-box">
          <h1>
            Sistema Solar Retrátil 3D <span>v2.0</span>
          </h1>
          <div className="header-subtitle">
            Teto: 220 x 140 cm • Gap Térmico: 3,0 cm • Trilhos Telescópicos Heavy Duty
          </div>
        </div>
      </div>
      <div className="header-right">
        {/* Botão de Ignição / Funcionamento do Motor da Fiat Doblò */}
        <button
          className={`icon-btn ${b2bCharger.isEngineRunning ? 'accent-green' : ''}`}
          onClick={toggleB2BEngine}
          title={
            b2bCharger.isEngineRunning
              ? 'Motor da Doblò LIGADO (alternador injetando +30A / 390W na LiFePO4). Clique para desligar o motor.'
              : 'Ligar motor da Fiat Doblò (Ativa alternador 30A com som de partida e marcha lenta contínua)'
          }
          style={{
            background: b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.22)' : 'rgba(15, 23, 42, 0.6)',
            borderColor: b2bCharger.isEngineRunning ? '#22c55e' : 'rgba(56, 189, 248, 0.4)',
            color: b2bCharger.isEngineRunning ? '#4ade80' : '#e2e8f0',
            fontWeight: 700,
            boxShadow: b2bCharger.isEngineRunning
              ? '0 0 16px rgba(34, 197, 94, 0.45), inset 0 0 8px rgba(34, 197, 94, 0.2)'
              : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.25s ease'
          }}
        >
          <span style={{ fontSize: '15px' }}>{b2bCharger.isEngineRunning ? '🚗⚡' : '🚗'}</span>
          <span>{b2bCharger.isEngineRunning ? 'Motor Ligado (+30A)' : 'Ligar Carro'}</span>
          {b2bCharger.isEngineRunning && (
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#4ade80',
                boxShadow: '0 0 6px #22c55e'
              }}
            ></span>
          )}
        </button>

        <button
          className="icon-btn accent-orange"
          onClick={() => openModal('loads')}
          title="Editor de Consumo de Cargas & Balanço Energético"
        >
          🔌 Consumo ({loadsSummary.totalKWh} kWh/d)
        </button>
        <button
          className="icon-btn accent"
          onClick={() => openModal('battery')}
          title="Ver Bateria Kingbo LiFePO4 12V 560Ah (7.168 kWh)"
        >
          🔋 Bateria Kingbo 560Ah
        </button>
        <button
          className="icon-btn"
          onClick={() => openModal('mppt')}
          title="Ver Controlador MPPT Kingbo 60A (230Vdc / RS485+WiFi)"
        >
          ⚡ MPPT Kingbo 60A
        </button>
        <button
          className="icon-btn"
          onClick={() => openModal('bom')}
          title="Lista de Materiais e Cortes de Alumínio"
        >
          📦 Lista de Materiais
        </button>
        <button
          className="icon-btn"
          onClick={takeScreenshot}
          title="Capturar Foto 3D em Alta Resolução"
        >
          📷 Capturar Foto
        </button>
      </div>
    </header>
  );
};

