import React from 'react';
import { useSolar } from '../context/SolarContext';

export const Header: React.FC = () => {
  const { loadsSummary, openModal, takeScreenshot } = useSolar();

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

