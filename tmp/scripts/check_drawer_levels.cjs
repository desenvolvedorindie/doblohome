// Test if front and rear drawers overlap when at the same Y level
const pW = 0.590;
const pL = 0.875;
const gapCol = 0.030;
const gapRow = 0.030;
const marginFrame = 0.08;

// Level 2 has 2 panels longitudinal:
const l2Cols = 2, l2Rows = 1;
const l2Length = (l2Rows * pL) + ((l2Rows - 1) * gapRow) + marginFrame; // ~0.955m
const zCenter = 0.40;

// Level 1 has 2 panels longitudinal (1 front, 1 rear):
const frontLength = (1 * pL) + marginFrame; // ~0.955m
const rearLength = (1 * pL) + marginFrame;

console.log('l2Length:', l2Length);
console.log('frontLength:', frontLength, 'rearLength:', rearLength);

const upperFrontEdgeZ = zCenter + (l2Length / 2);
const upperRearEdgeZ = zCenter - (l2Length / 2);

const zStartFront = upperFrontEdgeZ - (frontLength / 2);
const zStartRear = upperRearEdgeZ + (rearLength / 2);

console.log('upperFrontEdgeZ:', upperFrontEdgeZ.toFixed(3));
console.log('upperRearEdgeZ:', upperRearEdgeZ.toFixed(3));
console.log('zStartFront:', zStartFront.toFixed(3));
console.log('zStartRear:', zStartRear.toFixed(3));

// Check bounds of front drawer:
const frontMinZ = zStartFront - frontLength / 2;
const frontMaxZ = zStartFront + frontLength / 2;
// Check bounds of rear drawer:
const rearMinZ = zStartRear - rearLength / 2;
const rearMaxZ = zStartRear + rearLength / 2;

console.log('Front drawer Z:', frontMinZ.toFixed(3), 'to', frontMaxZ.toFixed(3));
console.log('Rear drawer Z:', rearMinZ.toFixed(3), 'to', rearMaxZ.toFixed(3));
console.log('Overlap in Z?', frontMinZ < rearMaxZ ? `YES, overlap by ${(rearMaxZ - frontMinZ).toFixed(3)}m` : `NO overlap! Gap: ${(frontMinZ - rearMaxZ).toFixed(3)}m`);
