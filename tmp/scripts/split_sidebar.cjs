const fs = require('fs');
const path = require('path');

const src = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
const lines = src.split('\n');

// 0-indexed line slices:
// 146-467 (1-based lines 147 to 467) -> lines[146..466]
// 468-827 (1-based lines 469 to 827) -> lines[468..826]
// 828-1060 (1-based lines 829 to 1060) -> lines[828..1059]
// 1061-1298 (1-based lines 1062 to 1298) -> lines[1061..1297]
// 1299-1523 (1-based lines 1300 to 1523) -> lines[1299..1522]
// 1524-1710 (1-based lines 1525 to 1710) -> lines[1523..1709]
// 1711-1889 (1-based lines 1712 to 1889) -> lines[1711..1888]

const outDir = 'src/components/sidebar';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. SidebarSolarSection
const solarLines = lines.slice(146, 467).join('\n');
const solarComponent = `import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { SlideDirection, PanelOrientation } from '../../types';

export const SidebarSolarSection: React.FC = () => {
  const {
    stackLevels,
    setStackLevels,
    level1,
    setLevel1Panels,
    setLevel1Direction,
    setLevel1Orientation,
    level2,
    setLevel2Panels,
    setLevel2Direction,
    setLevel2Orientation,
    openModal,
    panelPresets,
    activePanelPreset,
    selectPanelPreset,
  } = useSolar();

  const panelW = activePanelPreset.powerWatts;
  const panelCmW = Math.round(activePanelPreset.width * 100);
  const panelCmL = Math.round(activePanelPreset.length * 100);
  const totalPanelsCount = level1.panels + (stackLevels === 2 ? level2.panels : 0);
  const totalNominalWatts = totalPanelsCount * panelW;
  const mpptLimitWatts = 720;
  const mpptPeakLimitWatts = 864;
  const isSolarOverLimit = totalNominalWatts > mpptLimitWatts;
  const isSolarOverPeak = totalNominalWatts > mpptPeakLimitWatts;
  const mpptUsageNominalPct = Math.round((totalNominalWatts / mpptLimitWatts) * 100);
  const mpptOverNominalPct = Math.max(0, Math.round(((totalNominalWatts - mpptLimitWatts) / mpptLimitWatts) * 100));
  const mpptRemainingNominalPct = Math.max(0, Math.round(((mpptLimitWatts - totalNominalWatts) / mpptLimitWatts) * 100));
  const mpptRemainingWatts = Math.max(0, mpptLimitWatts - totalNominalWatts);
  const mpptOverPeakPct = Math.max(0, Math.round(((totalNominalWatts - mpptPeakLimitWatts) / mpptPeakLimitWatts) * 100));

  return (
${solarLines}
  );
};
`;
fs.writeFileSync(path.join(outDir, 'SidebarSolarSection.tsx'), solarComponent);

// 2. SidebarStructureSection
const structLines = lines.slice(468, 827).join('\n');
const structComponent = `import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { METALON_COLOR_PRESETS, getMetalonGauge } from '../../types';

export const SidebarStructureSection: React.FC = () => {
  const {
    structureMaterial,
    setStructureMaterial,
    steelProfileUnit,
    setSteelProfileUnit,
    aluminumColor,
    setAluminumColor,
    metalonColor,
    setMetalonColor,
    metalonWallThickness,
    metalonThickness40,
    metalonThickness30,
    setMetalonWallThickness,
    setMetalonThickness40,
    setMetalonThickness30,
  } = useSolar();

  const [showCustomThicknessSizes, setShowCustomThicknessSizes] = useState<boolean>(false);

  return (
${structLines}
  );
};
`;
fs.writeFileSync(path.join(outDir, 'SidebarStructureSection.tsx'), structComponent);

// 3. SidebarPositionSection
const posLines = lines.slice(828, 1060).join('\n');
const posComponent = `import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const SidebarPositionSection: React.FC = () => {
  const {
    offsetZ,
    setOffsetZ,
    offsetY,
    setOffsetY,
    internalGrid,
    setInternalGrid,
    isOpenPreview,
    setIsOpenPreview,
    isVehicleVisible,
    toggleVehicle,
    vehicleOpacity,
    setVehicleOpacity,
  } = useSolar();

  return (
${posLines}
  );
};
`;
fs.writeFileSync(path.join(outDir, 'SidebarPositionSection.tsx'), posComponent);

// 4. SidebarCargoBoxSection
const cargoLines = lines.slice(1061, 1298).join('\n');
const cargoComponent = `import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const SidebarCargoBoxSection: React.FC = () => {
  const {
    cargoBox,
    setCargoBoxEnabled,
    setCargoBoxDimensions,
    setCargoBoxVerticalLift,
    setCargoBoxTelescopic,
    setCargoBoxHingeSide,
    openModal,
    cargoBoxPresets,
    activeCargoBoxPreset,
    selectCargoBoxPreset,
  } = useSolar();

  return (
${cargoLines}
  );
};
`;
fs.writeFileSync(path.join(outDir, 'SidebarCargoBoxSection.tsx'), cargoComponent);

// 5. SidebarWaterTankSection
const waterLines = lines.slice(1299, 1523).join('\n');
const waterComponent = `import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const SidebarWaterTankSection: React.FC = () => {
  const {
    waterTank,
    setWaterTankEnabled,
    setWaterTankLength,
    setWaterTankRadius,
  } = useSolar();

  const baseMaxLengthMm = 2200;
  const pipeRadiusMm = Math.round(waterTank.diameterMm / 2);
  const pipeDiameterMm = waterTank.diameterMm;
  const pipeRadiusDm = pipeRadiusMm / 100;
  const pipeRadiusM = pipeRadiusMm / 1000;
  const frameInnerX = 0.70 - 0.04;
  const pipeOffsetX = frameInnerX - pipeRadiusM;
  const bendR = Math.max(0.06, pipeRadiusM * 1.35);
  const frontPipeSpanM = Math.max(0.20, (pipeOffsetX - bendR) * 2);
  const frontCircuitAddonM = frontPipeSpanM + Math.PI * bendR;
  const singlePipeLiters = +(Math.PI * pipeRadiusDm * pipeRadiusDm * (waterTank.lengthMm / 100)).toFixed(1);
  const frontCircuitLiters = +(Math.PI * pipeRadiusDm * pipeRadiusDm * (frontCircuitAddonM * 10)).toFixed(1);
  const totalWaterLiters = +(singlePipeLiters * 2 + frontCircuitLiters).toFixed(1);
  const litersPerMeterSingle = +(Math.PI * pipeRadiusDm * pipeRadiusDm * 10).toFixed(1);
  const litersPerMeterTotal = +(litersPerMeterSingle * 2).toFixed(1);
  const baseLengthOccupationPct = Math.round((waterTank.lengthMm / baseMaxLengthMm) * 100);

  return (
${waterLines}
  );
};
`;
fs.writeFileSync(path.join(outDir, 'SidebarWaterTankSection.tsx'), waterComponent);

// 6. SidebarAwningSection
const awningLines = lines.slice(1523, 1710).join('\n');
const awningComponent = `import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const SidebarAwningSection: React.FC = () => {
  const {
    awning,
    setAwning,
    toggleAwningOpen,
  } = useSolar();

  return (
${awningLines}
  );
};
`;
fs.writeFileSync(path.join(outDir, 'SidebarAwningSection.tsx'), awningComponent);

// 7. SidebarElectricalSection
const electLines = lines.slice(1711, 1889).join('\n');
const electComponent = `import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const SidebarElectricalSection: React.FC = () => {
  const {
    b2bCharger,
    setB2BEngineHours,
    usinaCharger,
    toggleUsinaAC,
    setUsinaModel,
    openModal,
  } = useSolar();

  return (
${electLines}
  );
};
`;
fs.writeFileSync(path.join(outDir, 'SidebarElectricalSection.tsx'), electComponent);

// Rewritten Sidebar.tsx
const newSidebar = `import React from 'react';
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
      <aside className="sidebar-panel glass-panel" style={{ width: '600px', maxWidth: 'calc(100vw - 40px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>📦</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.5px' }}>
                1. CAIXAS INTERNAS & GRID CAMPER
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                Sistema de Grid & Armazenadores Modulares da Doblò
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
`;

fs.writeFileSync('src/components/Sidebar.tsx', newSidebar);
console.log('Sidebar split complete!');
