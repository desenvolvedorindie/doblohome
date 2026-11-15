const fs = require('fs');

const path = 'src/components/rightpanel/RightPanelWeightSection.tsx';
const content = fs.readFileSync(path, 'utf8');

// Also fix RightPanelWeightChips.tsx fontWeight: 800
const chipsPath = 'src/components/rightpanel/RightPanelWeightChips.tsx';
let chipsContent = fs.readFileSync(chipsPath, 'utf8');
chipsContent = chipsContent.replace(/fontWeight 800/g, 'fontWeight: 800');
fs.writeFileSync(chipsPath, chipsContent);

// Check tags in RightPanelWeightSection.tsx
const divOpen = (content.match(/<div(\s|>)/g) || []).length;
const divClose = (content.match(/<\/div>/g) || []).length;
console.log(`div open: ${divOpen}, div close: ${divClose}`);
