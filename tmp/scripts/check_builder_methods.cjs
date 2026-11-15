const fs = require('fs');

const content = fs.readFileSync('src/three/InternalBoxesBuilder.ts', 'utf8');
const lines = content.split('\n');

const methods = [
  'buildFloor(',
  'buildGrid(',
  'buildBoxes(',
  'createBoxMaterial(',
  'getBoxThickness(',
  'getWoodMaterialName(',
  'getUpperCabinetExclusionZones(',
  'createPerforatedGeometry(',
  'addPerforatedPanel(',
  'addPanel(',
  'buildHollowBox(',
  'buildDrawerModule(',
  'buildChestModule(',
  'buildSlatBedModule(',
  'buildRearFoldShelf(',
  'buildUpperCabinet(',
  'buildFloorCentralTable(',
  'buildBoxLedCorner(',
  'buildBoxElectronics(',
  'buildCeiling(',
  'buildSlattedCeiling(',
  'buildSheetCeiling(',
  'buildCeilingLed('
];

methods.forEach(m => {
  const idx = lines.findIndex(l => l.includes(m));
  console.log(`${idx + 1}: ${m}`);
});
console.log(`Total lines: ${lines.length}`);
