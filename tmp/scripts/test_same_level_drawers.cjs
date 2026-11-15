// Test positioning of Level 1 front/rear drawers on the same Y level

const pW = 0.590;
const pL = 0.875;
const gapCol = 0.030;
const gapRow = 0.030;
const marginFrame = 0.08;

// Function to calculate tray dimensions
function calculateTrayDimensions(panelCount, orientation) {
  const pWidth = (orientation === 'longitudinal') ? pW : pL;
  const pLength = (orientation === 'longitudinal') ? pL : pW;

  let cols = 1, rows = 1;
  if (panelCount === 1) { cols = 1; rows = 1; }
  else if (panelCount === 2) {
    if (orientation === 'longitudinal') { cols = 2; rows = 1; }
    else { cols = 1; rows = 2; }
  } else if (panelCount === 3) {
    if (orientation === 'longitudinal') { cols = 2; rows = 2; }
    else { cols = 1; rows = 3; }
  } else if (panelCount === 4) {
    cols = 2; rows = 2;
  }

  const gCol = (cols > 1) ? gapCol : 0;
  const gRow = (rows > 1) ? gapRow : 0;
  const trayWidth = (cols * pWidth) + ((cols - 1) * gCol) + marginFrame;
  const trayLength = (rows * pLength) + ((rows - 1) * gRow) + marginFrame;

  return {
    trayWidth: Math.max(0.68, trayWidth),
    trayLength: Math.max(0.68, trayLength)
  };
}

const zCenter = 0.40;
const rackLength = 2.20;
const rackFrontZ = zCenter + rackLength / 2; // 1.50
const rackRearZ = zCenter - rackLength / 2;  // -0.70

console.log(`Rack bounds: Z from ${rackRearZ.toFixed(2)} to ${rackFrontZ.toFixed(2)}`);

// Case 1: Level 1 with 2 panels longitudinal (1 front, 1 rear)
const frontDims = calculateTrayDimensions(1, 'longitudinal');
const rearDims = calculateTrayDimensions(1, 'longitudinal');

console.log('Front tray length:', frontDims.trayLength.toFixed(3));
console.log('Rear tray length:', rearDims.trayLength.toFixed(3));

// If both are placed end-to-end around zCenter:
// Center dividing gap: 0.02m (20mm)
const centerGap = 0.02;
const zStartFront = zCenter + (centerGap / 2) + (frontDims.trayLength / 2);
const zStartRear = zCenter - (centerGap / 2) - (rearDims.trayLength / 2);

const frontMinZ = zStartFront - frontDims.trayLength / 2;
const frontMaxZ = zStartFront + frontDims.trayLength / 2;
const rearMinZ = zStartRear - rearDims.trayLength / 2;
const rearMaxZ = zStartRear + rearDims.trayLength / 2;

console.log(`\n--- Retracted Positions on the SAME Y Level ---`);
console.log(`Front tray: center Z = ${zStartFront.toFixed(3)}, bounds = [${frontMinZ.toFixed(3)}, ${frontMaxZ.toFixed(3)}]`);
console.log(`Rear tray:  center Z = ${zStartRear.toFixed(3)}, bounds = [${rearMinZ.toFixed(3)}, ${rearMaxZ.toFixed(3)}]`);
console.log(`Gap between trays: ${(frontMinZ - rearMaxZ).toFixed(3)}m (20mm)`);
console.log(`Front tray inside rack? frontMaxZ (${frontMaxZ.toFixed(3)}) <= rackFrontZ (${rackFrontZ.toFixed(3)}): ${frontMaxZ <= rackFrontZ}`);
console.log(`Rear tray inside rack? rearMinZ (${rearMinZ.toFixed(3)}) >= rackRearZ (${rackRearZ.toFixed(3)}): ${rearMinZ >= rackRearZ}`);
