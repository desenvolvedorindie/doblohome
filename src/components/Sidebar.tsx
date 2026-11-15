import React from 'react';
import { useSolar } from '../context/SolarContext';
import { InternalBoxesPlanner } from './InternalBoxesPlanner';
import { CuttingPlanSidePanel } from './cutting/CuttingPlanSidePanel';
import { SidebarSolarSection } from './sidebar/SidebarSolarSection';
import { SidebarStructureSection } from './sidebar/SidebarStructureSection';
import { SidebarPositionSection } from './sidebar/SidebarPositionSection';
import { SidebarCargoBoxSection } from './sidebar/SidebarCargoBoxSection';
import { SidebarWaterTankSection } from './sidebar/SidebarWaterTankSection';
import { SidebarAwningSection } from './sidebar/SidebarAwningSection';
import { SidebarElectricalSection } from './sidebar/SidebarElectricalSection';

export const Sidebar: React.FC = () => {
  const { viewMode, setViewMode } = useSolar();

  if (viewMode === 'internal_boxes') {
    return (
      <aside className="sidebar-panel glass-panel" style={{ width: '480px', maxWidth: 'calc(100vw - 40px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>📦</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.5px' }}>
                1. CAIXAS INTERNAS & GRID CAMPER
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                Propriedades Gerais: Grid, Presets & Forro do Teto
              </div>
            </div>
          </div>
          <button
            onClick={() => setViewMode('assembled')}
            className="btn-compact primary"
            style={{ fontSize: '11px', padding: '6px 12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Ir para o Modo 2: Doblò Externa + Sistema Solar de Teto"
          >
            <span>Doblò Externa & Teto</span>
            <span>➔</span>
          </button>
        </div>

        <InternalBoxesPlanner />
      </aside>
    );
  }

  if (viewMode === 'bars_lineup') {
    return <CuttingPlanSidePanel />;
  }

  if (viewMode === 'electrical_planar' || viewMode === 'hydraulic_planar') {
    return null;
  }

  return (
    <aside className="sidebar-panel glass-panel">
      <SidebarSolarSection />
      <SidebarStructureSection />
      <SidebarPositionSection />
      <SidebarCargoBoxSection />
      <SidebarWaterTankSection />
      <SidebarAwningSection />
      <SidebarElectricalSection />
    </aside>
  );
};
