const fs = require('fs');
const path = require('path');

const src = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// We have the original slices from git or previous read
// Let's read the current created files or regenerate them properly with <>...</>
const outDir = 'src/components/sidebar';

// Fix SidebarAwningSection
const awningPath = path.join(outDir, 'SidebarAwningSection.tsx');
let awningContent = fs.readFileSync(awningPath, 'utf8');
// remove leading comments before JSX if outside, wrap return in <> </>
awningContent = awningContent.replace('return (', 'return (\n    <>');
awningContent = awningContent.replace(/\s*\);\s*};\s*$/, '\n    </>\n  );\n};\n');
fs.writeFileSync(awningPath, awningContent);

// Fix SidebarPositionSection
const posPath = path.join(outDir, 'SidebarPositionSection.tsx');
let posContent = fs.readFileSync(posPath, 'utf8');
posContent = posContent.replace('vehicleOpacity,\n    setVehicleOpacity,', 'vehicleOpacity,\n    setVehicleOpacity,\n    setViewMode,');
posContent = posContent.replace('return (', 'return (\n    <>');
posContent = posContent.replace(/\s*\);\s*};\s*$/, '\n    </>\n  );\n};\n');
fs.writeFileSync(posPath, posContent);

// Fix SidebarElectricalSection
const electPath = path.join(outDir, 'SidebarElectricalSection.tsx');
let electContent = fs.readFileSync(electPath, 'utf8');
electContent = electContent.replace('return (', 'return (\n    <>');
electContent = electContent.replace(/\s*\);\s*};\s*$/, '\n    </>\n  );\n};\n');
fs.writeFileSync(electPath, electContent);

console.log('Fixed fragments in sidebar sections!');
