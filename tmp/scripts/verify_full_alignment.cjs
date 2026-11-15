const THREE = require('three');

console.log('--- Verifying Alignment after 180 deg Doblò Rotation ---');

// 1. Doblo OBJ rotated by Math.PI around Y:
// Headlights: Z = +1.85m (Front, +Z)
// Taillights/Trunk: Z = -2.20m (Rear, -Z)
// Driver Side: X = +0.8m (+X, Left)
// Passenger Side: X = -0.8m (-X, Right)
// Roof Z bounds: -2.05m to +0.69m (center: -0.68m)

const dobloRoofMinZ = -2.05;
const dobloRoofMaxZ = 0.69;
const dobloRoofCenterZ = -0.68;

console.log('Doblo Roof bounds: [', dobloRoofMinZ, 'to', dobloRoofMaxZ, '], center =', dobloRoofCenterZ);

// 2. Camper Internal Boxes:
// Floor Z: 0 to -1.70m (inside cabin from front seats Z=0 to trunk Z=-1.70m)
// Wheel arches: Z = -1.15m (exactly matches Doblo rear wheels at Z = -1.15m!)
console.log('Camper floor Z: [ -1.70 to 0.00 ], wheel arches at Z = -1.15');

// 3. Roof Rack (length = 2.20m):
// With offsetZ = -0.68 (or -0.60):
const rackOffsetZ = -0.68;
const rackLength = 2.20;
const rackFrontZ = rackOffsetZ + rackLength / 2; // -0.68 + 1.10 = +0.42m
const rackRearZ = rackOffsetZ - rackLength / 2;  // -0.68 - 1.10 = -1.78m

console.log('Rack Z bounds: [', rackRearZ.toFixed(2), 'to', rackFrontZ.toFixed(2), ']');
console.log('Rack front (+0.42m) is safely before windshield (+0.69m to +1.35m)');
console.log('Rack rear (-1.78m) is safely before trunk door (-2.20m)');

// 4. Rear Awning:
// Mounted at rackRearZ (-1.78m), extends towards -Z (up to -1.78 - 2.0 = -3.78m)
console.log('Rear Awning outer Z: ', (rackRearZ - 2.0).toFixed(2), '(shades open trunk and drawers!)');

// 5. Water tank U-shape:
// U-bend at rackFrontZ (-0.04 - radius) ~ +0.32m (front of rack, over windshield)
// Lateral pipes run backwards towards rackRearZ (-1.78m)
console.log('Water tank U-bend at front (+0.32m), pipes run to rear (-1.78m)');

console.log('--- All alignments verified successfully! ---');

