const fs = require('fs');
const path = require('path');

const outDir = 'src/components/planner';

// 1. Fix PlannerPresetConfirmModal.tsx
let modal = fs.readFileSync(path.join(outDir, 'PlannerPresetConfirmModal.tsx'), 'utf8');
modal = modal.replace('return (\n      {/* Modal', 'return (\n    <>\n      {/* Modal');
modal = modal.replace(/\s*\);\s*};\s*$/, '\n    </>\n  );\n};\n');
fs.writeFileSync(path.join(outDir, 'PlannerPresetConfirmModal.tsx'), modal);

// 2. Fix PlannerCeilingLighting.tsx
let cl = fs.readFileSync(path.join(outDir, 'PlannerCeilingLighting.tsx'), 'utf8');
const clCut = cl.indexOf('                  )}');
// Find last closing tags
cl = cl.slice(0, cl.lastIndexOf('</div>\n            )}')) +
`</div>\n            )}\n          </div>\n        </div>\n    </>\n  );\n};\n`;
fs.writeFileSync(path.join(outDir, 'PlannerCeilingLighting.tsx'), cl);

// Let's check PlannerUpperCabinetSection.tsx
let uc = fs.readFileSync(path.join(outDir, 'PlannerUpperCabinetSection.tsx'), 'utf8');
console.log('Upper cabinet tail:\n', uc.slice(-200));

// Let's check PlannerSlatBedSection.tsx
let sb = fs.readFileSync(path.join(outDir, 'PlannerSlatBedSection.tsx'), 'utf8');
console.log('Slat bed tail:\n', sb.slice(-200));
