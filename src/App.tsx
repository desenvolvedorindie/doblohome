import React, { useState } from 'react';
import { useSolar } from './context/SolarContext';
import { CanvasViewport } from './components/CanvasViewport';
import { Header } from './components/Header';
import { WorkspaceSwitcher } from './components/layout/WorkspaceSwitcher';
import { StatusBar } from './components/layout/StatusBar';
import { Sidebar } from './components/Sidebar';
import { RightPanel } from './components/RightPanel';
import { BarTooltip } from './components/BarTooltip';
import { Toast } from './components/Toast';
import { LoadsModal } from './components/modals/LoadsModal';
import { BatteryModal } from './components/modals/BatteryModal';
import { MpptModal } from './components/modals/MpptModal';
import { B2bModal } from './components/modals/B2bModal';
import { UsinaModal } from './components/modals/UsinaModal';
import { BomModal } from './components/modals/BomModal';
import { PanelPresetsModal } from './components/modals/PanelPresetsModal';
import { CargoBoxPresetsModal } from './components/modals/CargoBoxPresetsModal';
import { FridgePresetsModal } from './components/modals/FridgePresetsModal';
import { PortaPottiPresetsModal } from './components/modals/PortaPottiPresetsModal';
import { StovePresetsModal } from './components/modals/StovePresetsModal';
import { ElectricalPlanarView } from './components/electrical/ElectricalPlanarView';
import { HydraulicPlanarView } from './components/hydraulic/HydraulicPlanarView';

export const App: React.FC = () => {
  const { viewMode } = useSolar();
  const [leftSidebarVisible, setLeftSidebarVisible] = useState<boolean>(true);
  const [rightSidebarVisible, setRightSidebarVisible] = useState<boolean>(true);

  const isPlanarMode =
    viewMode === 'electrical_planar' || viewMode === 'hydraulic_planar';

  const toggleLeftSidebar = () => setLeftSidebarVisible((v) => !v);
  const toggleRightSidebar = () => setRightSidebarVisible((v) => !v);

  return (
    <div className="ide-app-shell">
      <Header
        leftSidebarVisible={leftSidebarVisible}
        rightSidebarVisible={rightSidebarVisible}
        onToggleLeftSidebar={toggleLeftSidebar}
        onToggleRightSidebar={toggleRightSidebar}
      />

      <WorkspaceSwitcher />

      <div className="ide-workspace-body">
        {/* Workspace 3D permanece montado para preservar o SceneManager e WebGL */}
        <div
          style={{
            display: isPlanarMode ? 'none' : 'flex',
            flex: 1,
            width: '100%',
            height: '100%',
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Sidebar
            isVisible={leftSidebarVisible}
            onToggleVisible={toggleLeftSidebar}
          />
          <CanvasViewport />
          <RightPanel
            isVisible={rightSidebarVisible}
            onToggleVisible={toggleRightSidebar}
          />
        </div>

        <ElectricalPlanarView
          leftSidebarVisible={leftSidebarVisible}
          rightSidebarVisible={rightSidebarVisible}
          onToggleLeftSidebar={toggleLeftSidebar}
          onToggleRightSidebar={toggleRightSidebar}
        />

        <HydraulicPlanarView
          leftSidebarVisible={leftSidebarVisible}
          rightSidebarVisible={rightSidebarVisible}
          onToggleLeftSidebar={toggleLeftSidebar}
          onToggleRightSidebar={toggleRightSidebar}
        />
      </div>

      <StatusBar />

      <BarTooltip />
      <Toast />

      {/* Modais */}
      <LoadsModal />
      <BatteryModal />
      <MpptModal />
      <B2bModal />
      <UsinaModal />
      <BomModal />
      <PanelPresetsModal />
      <CargoBoxPresetsModal />
      <FridgePresetsModal />
      <PortaPottiPresetsModal />
      <StovePresetsModal />
    </div>
  );
};
