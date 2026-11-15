const fs = require('fs');

const files = [
  'src/components/planner/PlannerBoxInspector.tsx',
  'src/components/planner/PlannerCeilingLighting.tsx',
  'src/components/planner/PlannerCeilingSection.tsx',
  'src/components/planner/PlannerUpperCabinetSection.tsx'
];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const divOpen = (content.match(/<div(\s|>)/g) || []).length;
  const divClose = (content.match(/<\/div>/g) || []).length;
  console.log(`${f}: <div open=${divOpen}, div close=${divClose}`);
});
