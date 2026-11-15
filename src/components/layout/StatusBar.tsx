import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { useRackWeightAndHeight } from '../rightpanel/useRackWeightAndHeight';
import { ViewMode } from '../../types';

const WORKSPACE_NAMES: Record<ViewMode, string> = {
  internal_boxes: '1. Módulos',
  assembled: '2. Doblò + Estrutura',
  bars_lineup: '3. Peças & Corte',
  electrical_planar: '4. Elétrica 2D',
  hydraulic_planar: '5. Hidráulica 2D',
};

export const StatusBar: React.FC = () => {
  const {
    viewMode,
    b2bCharger,
    toggleB2BEngine,
    energyStats,
    batteryPerformance,
    loadsSummary,
    structureMaterial,
    expansionProgress,
    internalBoxes,
    selectedBoxId,
    openModal,
  } = useSolar();

  const { rackWeightStats } = useRackWeightAndHeight();

  const selectedBox = selectedBoxId
    ? internalBoxes.find((b) => b.id === selectedBoxId) || null
    : null;

  const materialLabel =
    structureMaterial === 'aluminum'
      ? 'Alumínio T-Slot'
      : structureMaterial === 'aluminum_tube'
        ? 'Metalon Alumínio'
        : 'Metalon Aço';

  return (
    <footer className="ide-statusbar">
      {/* Esquerda: Sistema, Workspace e Contexto */}
      <div className="ide-statusbar-section">
        <div className="ide-statusbar-item" style={{ color: '#e5e5e5', fontWeight: 600 }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 6px rgba(34, 197, 94, 0.7)',
              display: 'inline-block',
            }}
          />
          <span>DoblòHome</span>
        </div>

        <div className="ide-statusbar-divider" />

        <div className="ide-statusbar-item" style={{ color: '#a5b4fc' }}>
          <span>{WORKSPACE_NAMES[viewMode]}</span>
        </div>

        <div className="ide-statusbar-divider" />

        {viewMode === 'internal_boxes' ? (
          <div className="ide-statusbar-item">
            <span>
              Módulos: <strong style={{ color: '#e5e5e5' }}>{internalBoxes.length}</strong>
              {selectedBox ? ` · Selecionado: ${selectedBox.name}` : ''}
            </span>
          </div>
        ) : (
          <div className="ide-statusbar-item">
            <span>
              {materialLabel} · Expansão: <strong style={{ color: '#e5e5e5' }}>{Math.round(expansionProgress * 100)}%</strong>
            </span>
          </div>
        )}
      </div>

      {/* Direita: Telemetria do Sistema */}
      <div className="ide-statusbar-section">
        <button
          type="button"
          className="ide-statusbar-btn"
          onClick={toggleB2BEngine}
          title="Alternar Ignição / Alternador Doblò (B2B 30A)"
          style={{
            color: b2bCharger.isEngineRunning ? '#4ade80' : '#a3a3a3',
          }}
        >
          <span>{b2bCharger.isEngineRunning ? '🚗⚡ Motor +30A' : '🚗 Motor Off'}</span>
        </button>

        <div className="ide-statusbar-divider" />

        <button
          type="button"
          className="ide-statusbar-btn"
          onClick={() => openModal('mppt')}
          title="Detalhes do Arranjo Solar e Controlador MPPT"
          style={{ color: '#fbbf24' }}
        >
          <span>☀️ {energyStats.effectiveWatts}W / {energyStats.nominalPowerW}Wp</span>
        </button>

        <div className="ide-statusbar-divider" />

        <button
          type="button"
          className="ide-statusbar-btn"
          onClick={() => openModal('loads')}
          title="Abrir Editor de Consumo Diário"
          style={{ color: '#38bdf8' }}
        >
          <span>⚡ {loadsSummary.totalKWh} kWh/d</span>
        </button>

        <div className="ide-statusbar-divider" />

        <button
          type="button"
          className="ide-statusbar-btn"
          onClick={() => openModal('battery')}
          title="Abrir Banco de Bateria LiFePO4"
          style={{ color: '#34d399' }}
        >
          <span>🔋 560Ah · {batteryPerformance.percent}%</span>
        </button>

        <div className="ide-statusbar-divider" />

        <button
          type="button"
          className="ide-statusbar-btn"
          onClick={() => openModal('bom')}
          title="Abrir Lista de Materiais (BOM)"
          style={{
            color:
              rackWeightStats.pctDynamic > 100
                ? '#f87171'
                : rackWeightStats.pctDynamic > 80
                  ? '#fbbf24'
                  : '#cbd5e1',
          }}
        >
          <span>⚖️ Rack {rackWeightStats.activeTotal}kg ({rackWeightStats.pctDynamic}%)</span>
        </button>
      </div>
    </footer>
  );
};
