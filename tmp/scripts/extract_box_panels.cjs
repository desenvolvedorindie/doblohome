const fs = require('fs');
const path = require('path');

const inspPath = 'src/components/planner/PlannerBoxInspector.tsx';
let insp = fs.readFileSync(inspPath, 'utf8');

const panelsStart = insp.indexOf('{/* Tamponamento & Fechamento de Chapas (15mm) */}');
const panelsEnd = insp.indexOf('<PlannerDinetteTableSection selectedBox={selectedBox} />');

const panelsCode = insp.slice(panelsStart, panelsEnd);

const panelsComponent = `import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, BoxPanelsConfig } from '../../types';

interface PlannerBoxPanelsSectionProps {
  selectedBox: InternalBoxItem;
}

export const PlannerBoxPanelsSection: React.FC<PlannerBoxPanelsSectionProps> = ({ selectedBox }) => {
  const { updateInternalBox } = useSolar();

  return (
    <>
      ${panelsCode}
    </>
  );
};
`;
fs.writeFileSync('src/components/planner/PlannerBoxPanelsSection.tsx', panelsComponent);

insp = insp.slice(0, panelsStart) +
  `<PlannerBoxPanelsSection selectedBox={selectedBox} />\n      ` +
  insp.slice(panelsEnd);

// Add import
insp = `import { PlannerBoxPanelsSection } from './PlannerBoxPanelsSection';\n` + insp;
fs.writeFileSync(inspPath, insp);

console.log('PlannerBoxPanelsSection extracted successfully!');
