import * as fs from 'fs';

const sidebarCode = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');
const rightPanelCode = fs.readFileSync('src/components/RightPanel.tsx', 'utf-8');

console.log('--- Verifying Awning Configuration Placement ---');

// 1. Sidebar should have full awning configuration
const hasAwningInSidebar = sidebarCode.includes('TOLDO RETRÁTIL OVERLAND');
const hasAwningModelInSidebar = sidebarCode.includes("type: 'rear'") && sidebarCode.includes("type: 'batwing_270'");
const hasAwningSideInSidebar = sidebarCode.includes("side: 'passenger'") && sidebarCode.includes("side: 'driver'");
const hasFabricColorInSidebar = sidebarCode.includes('fabricColor: c.color');

console.log('Sidebar has awning section:', hasAwningInSidebar);
console.log('Sidebar has model selection:', hasAwningModelInSidebar);
console.log('Sidebar has side selection:', hasAwningSideInSidebar);
console.log('Sidebar has fabric color selection:', hasFabricColorInSidebar);

// 2. RightPanel should NOT have awning configuration options
const rightPanelHasSetAwning = rightPanelCode.includes('setAwning');
const rightPanelHasColorPicker = rightPanelCode.includes('fabricColor:');
const rightPanelHasModelToggle = rightPanelCode.includes("type: 'rear'");

console.log('RightPanel has setAwning (should be false):', rightPanelHasSetAwning);
console.log('RightPanel has fabric color (should be false):', rightPanelHasColorPicker);
console.log('RightPanel has model toggle (should be false):', rightPanelHasModelToggle);

if (
  hasAwningInSidebar &&
  hasAwningModelInSidebar &&
  hasAwningSideInSidebar &&
  hasFabricColorInSidebar &&
  !rightPanelHasSetAwning &&
  !rightPanelHasColorPicker &&
  !rightPanelHasModelToggle
) {
  console.log('✅ VERIFICATION SUCCESSFUL: Awning configuration is cleanly located in Sidebar (left panel)!');
} else {
  console.error('❌ Verification failed!');
  process.exit(1);
}

