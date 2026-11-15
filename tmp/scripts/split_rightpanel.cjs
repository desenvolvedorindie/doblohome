const fs = require('fs');
const path = require('path');

const src = fs.readFileSync('src/components/RightPanel.tsx', 'utf8');
const lines = src.split('\n');

const outDir = 'src/components/rightpanel';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. RightPanelModeSwitcher.tsx (lines 323 to 392)
const modeSwitcherContent = `import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const RightPanelModeSwitcher: React.FC = () => {
  const { viewMode, setViewMode } = useSolar();

  return (
    <div
      className="glass-panel"
      style={{
        position: 'fixed',
        top: '84px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 35,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px',
        borderRadius: '999px',
        background: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid rgba(56, 189, 248, 0.45)',
        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.55), 0 0 16px rgba(56, 189, 248, 0.2)'
      }}
    >
      <button
        onClick={() => setViewMode('internal_boxes')}
        style={{
          border: 'none',
          borderRadius: '999px',
          padding: '7px 16px',
          fontSize: '12px',
          fontWeight: 800,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          background: viewMode === 'internal_boxes' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
          color: viewMode === 'internal_boxes' ? '#ffffff' : '#94a3b8',
          boxShadow: viewMode === 'internal_boxes' ? '0 2px 10px rgba(245, 158, 11, 0.45)' : 'none'
        }}
      >
        📦 1. Caixas Internas
      </button>
      <button
        onClick={() => setViewMode('assembled')}
        style={{
          border: 'none',
          borderRadius: '999px',
          padding: '7px 16px',
          fontSize: '12px',
          fontWeight: 800,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          background: viewMode === 'assembled' ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : 'transparent',
          color: viewMode === 'assembled' ? '#ffffff' : '#94a3b8',
          boxShadow: viewMode === 'assembled' ? '0 2px 10px rgba(14, 165, 233, 0.45)' : 'none'
        }}
      >
        🚐 2. Doblò + Estrutura
      </button>
      <button
        onClick={() => setViewMode('bars_lineup')}
        style={{
          border: 'none',
          borderRadius: '999px',
          padding: '7px 16px',
          fontSize: '12px',
          fontWeight: 800,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          background: viewMode === 'bars_lineup' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
          color: viewMode === 'bars_lineup' ? '#ffffff' : '#94a3b8',
          boxShadow: viewMode === 'bars_lineup' ? '0 2px 10px rgba(16, 185, 129, 0.45)' : 'none'
        }}
      >
        📏 3. Peças
      </button>
    </div>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'RightPanelModeSwitcher.tsx'), modeSwitcherContent);

// 2. useRackWeightAndHeight.ts (lines 74 to 281)
const weightCalcLines = lines.slice(73, 210).join('\n');
const heightCalcLines = lines.slice(212, 281).join('\n');
const hookContent = `import { useMemo, useState } from 'react';
import { useSolar } from '../../context/SolarContext';

export function useRackWeightAndHeight() {
  const {
    structureMaterial,
    metalonThickness40,
    metalonThickness30,
    stackLevels,
    energyStats,
    activePanelPreset,
    waterTank,
    cargoBox,
    activeCargoBoxPreset,
    awning,
  } = useSolar();

  const [isWaterWeightFull, setIsWaterWeightFull] = useState<boolean>(true);
  const [showWeightDetails, setShowWeightDetails] = useState<boolean>(false);

  const rackWeightStats = useMemo(() => {
${weightCalcLines}
  }, [
    structureMaterial,
    metalonThickness40,
    metalonThickness30,
    stackLevels,
    energyStats.panelCount,
    activePanelPreset,
    waterTank,
    isWaterWeightFull,
    cargoBox.enabled,
    cargoBox.length,
    cargoBox.isTelescopic,
    activeCargoBoxPreset,
    awning.enabled,
    awning.type
  ]);

  const rackHeightStats = useMemo(() => {
${heightCalcLines}
  }, [cargoBox.enabled, cargoBox.height, cargoBox.verticalLiftMm, cargoBox.isTelescopic, stackLevels, activePanelPreset?.thickness]);

  return {
    isWaterWeightFull,
    setIsWaterWeightFull,
    showWeightDetails,
    setShowWeightDetails,
    rackWeightStats,
    rackHeightStats,
  };
}
`;
fs.writeFileSync(path.join(outDir, 'useRackWeightAndHeight.ts'), hookContent);

// 3. RightPanelWeightSection.tsx (lines 1094 to 1686)
const weightUiLines = lines.slice(1093, 1686).join('\n');
const weightSectionContent = `import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { useRackWeightAndHeight } from './useRackWeightAndHeight';

export const RightPanelWeightSection: React.FC = () => {
  const {
    stackLevels,
    cargoBox,
    openModal,
  } = useSolar();

  const {
    isWaterWeightFull,
    setIsWaterWeightFull,
    showWeightDetails,
    setShowWeightDetails,
    rackWeightStats,
    rackHeightStats,
  } = useRackWeightAndHeight();

  return (
    <>
${weightUiLines}
      <div className="expansion-widget-divider"></div>
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'RightPanelWeightSection.tsx'), weightSectionContent);

// 4. RightPanelExpansionSection.tsx (lines 397 to 474 and 885 to 1091)
const expansionControlsLines = lines.slice(396, 474).join('\n');
const inspectionLines = lines.slice(884, 1091).join('\n');
const expansionSectionContent = `import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const RightPanelExpansionSection: React.FC = () => {
  const {
    expansionProgress,
    setExpansion,
    retract,
    expand,
    rewind,
    toggleAutoAnim,
    isAutoAnimating,
    cargoBox,
    collisionSummary,
    checkCollisions,
    clearCollisions,
    floatingSummary,
    checkFloating,
    clearFloating,
  } = useSolar();

  const expansionPct = Math.round(expansionProgress * 100);
  const isRetracted = expansionPct <= 0;
  const isFullyOpen = expansionPct >= 100;

  return (
    <>
${expansionControlsLines}
      <div className="expansion-widget-divider"></div>
${inspectionLines}
      <div className="expansion-widget-divider"></div>
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'RightPanelExpansionSection.tsx'), expansionSectionContent);

// 5. RightPanelAccessorySection.tsx (lines 476 to 882)
const accessoryLines = lines.slice(475, 882).join('\n');
const accessorySectionContent = `import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const RightPanelAccessorySection: React.FC = () => {
  const {
    cargoBox,
    setCargoBoxEnabled,
    setCargoBoxVerticalLift,
    setCargoBoxTelescopic,
    awning,
    setAwning,
    toggleAwningOpen,
    setTiltAngle,
    setBoxLidAngle,
    tiltSolarRack,
    closeSolarRack,
    openBoxLid,
    closeBoxLid,
    retractAndTilt,
    openModal,
    expansionProgress,
  } = useSolar();

  return (
    <>
${accessoryLines}
      <div className="expansion-widget-divider"></div>
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'RightPanelAccessorySection.tsx'), accessorySectionContent);

// 6. RightPanelEnvironmentSection.tsx (lines 1690 to 1803)
const envLines = lines.slice(1689, 1803).join('\n');
const envSectionContent = `import React from 'react';
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
    return \`\${String(h).padStart(2, '0')}:\${String(m).padStart(2, '0')}h\`;
  };

  return (
    <>
${envLines}
      <div className="expansion-widget-divider" style={{ margin: '14px 0 8px 0' }} />
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'RightPanelEnvironmentSection.tsx'), envSectionContent);

// 7. RightPanelElectricalSection.tsx (lines 1807 to 2319)
const electricLines = lines.slice(1806, 2319).join('\n');
const electricSectionContent = `import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const RightPanelElectricalSection: React.FC = () => {
  const {
    expansionProgress,
    energyStats,
    batteryPerformance,
    openModal,
    b2bCharger,
    setB2BEngineHours,
    usinaCharger,
    toggleUsinaAC,
    setUsinaModel,
  } = useSolar();

  const expansionPct = Math.round(expansionProgress * 100);
  const isRetracted = expansionPct <= 0;
  const isFullyOpen = expansionPct >= 100;

  const mpptMaxWatts = 720;
  const mpptPeakMaxWatts = 864;
  const mpptRawPct = Math.round((energyStats.effectiveWatts / mpptMaxWatts) * 100);
  const mpptPct = Math.min(100, mpptRawPct);
  const mpptMargin = Math.max(0, mpptMaxWatts - energyStats.effectiveWatts);
  const mpptOverWatts = Math.max(0, energyStats.effectiveWatts - mpptMaxWatts);
  const mpptOverPct = Math.max(0, Math.round(((energyStats.effectiveWatts - mpptMaxWatts) / mpptMaxWatts) * 100));
  const mpptRemainingPct = Math.max(0, Math.round(((mpptMaxWatts - energyStats.effectiveWatts) / mpptMaxWatts) * 100));
  const isNominalOverMppt = energyStats.nominalPowerW > mpptMaxWatts;
  const isEffectiveOverMppt = energyStats.effectiveWatts > mpptMaxWatts;
  const isOverAbsolutePeak = energyStats.nominalPowerW > mpptPeakMaxWatts || energyStats.effectiveWatts > mpptPeakMaxWatts;
  const nominalOverWatts = Math.max(0, energyStats.nominalPowerW - mpptMaxWatts);
  const nominalOverPct = Math.max(0, Math.round(((energyStats.nominalPowerW - mpptMaxWatts) / mpptMaxWatts) * 100));
  const nominalUsagePct = Math.round((energyStats.nominalPowerW / mpptMaxWatts) * 100);
  const nominalRemainingPct = Math.max(0, Math.round(((mpptMaxWatts - energyStats.nominalPowerW) / mpptMaxWatts) * 100));
  const nominalRemainingWatts = Math.max(0, mpptMaxWatts - energyStats.nominalPowerW);
  const peakOverPct = Math.max(0, Math.round(((energyStats.nominalPowerW - mpptPeakMaxWatts) / mpptPeakMaxWatts) * 100));

  const b2bExtraWatts = (b2bCharger.enabled && b2bCharger.isEngineRunning) ? b2bCharger.watts : 0;
  const usinaExtraWatts = (usinaCharger.enabled && usinaCharger.isConnectedAC) ? Math.round(usinaCharger.chargingAmps * usinaCharger.voltageOut) : 0;
  const totalChargingWatts = energyStats.effectiveWatts + b2bExtraWatts + usinaExtraWatts;
  const combinedChargeHours = totalChargingWatts > 10
    ? +(batteryPerformance.batUsableWh / totalChargingWatts).toFixed(1)
    : 999;

  return (
    <>
${electricLines}
    </>
  );
};
`;
fs.writeFileSync(path.join(outDir, 'RightPanelElectricalSection.tsx'), electricSectionContent);

// 8. New RightPanel.tsx
const newRightPanel = `import React from 'react';
import { useSolar } from '../context/SolarContext';
import { RightPanelModeSwitcher } from './rightpanel/RightPanelModeSwitcher';
import { RightPanelExpansionSection } from './rightpanel/RightPanelExpansionSection';
import { RightPanelAccessorySection } from './rightpanel/RightPanelAccessorySection';
import { RightPanelWeightSection } from './rightpanel/RightPanelWeightSection';
import { RightPanelEnvironmentSection } from './rightpanel/RightPanelEnvironmentSection';
import { RightPanelElectricalSection } from './rightpanel/RightPanelElectricalSection';

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
    </>
  );
};
`;
fs.writeFileSync('src/components/RightPanel.tsx', newRightPanel);
console.log('RightPanel split complete!');
