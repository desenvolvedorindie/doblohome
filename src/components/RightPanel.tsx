import React from 'react';
import { useSolar } from '../context/SolarContext';
import { RightPanelModeSwitcher } from './rightpanel/RightPanelModeSwitcher';
import { RightPanelExpansionSection } from './rightpanel/RightPanelExpansionSection';
import { RightPanelAccessorySection } from './rightpanel/RightPanelAccessorySection';
import { RightPanelWeightSection } from './rightpanel/RightPanelWeightSection';
import { RightPanelEnvironmentSection } from './rightpanel/RightPanelEnvironmentSection';
import { RightPanelElectricalSection } from './rightpanel/RightPanelElectricalSection';
import { PlannerBoxPropertiesPanel } from './planner/PlannerBoxPropertiesPanel';

export const RightPanel: React.FC = () => {
  const { viewMode } = useSolar();

  return (
    <>
      <RightPanelModeSwitcher />
      {viewMode === 'assembled' && (
        <aside className="right-panel glass-panel" id="right-panel">
          <RightPanelExpansionSection />
          <RightPanelAccessorySection />
          <RightPanelWeightSection />
          <RightPanelEnvironmentSection />
          <RightPanelElectricalSection />
        </aside>
      )}
      {viewMode === 'internal_boxes' && (
        <aside
          className="right-panel glass-panel"
          id="right-panel-boxes"
          style={{ width: '560px', maxWidth: 'calc(100vw - 36px)' }}
        >
          <PlannerBoxPropertiesPanel />
        </aside>
      )}
    </>
  );
};
