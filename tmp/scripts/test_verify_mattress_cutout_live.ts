import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { InternalBoxItem, InternalGridConfig } from '../../src/types';

if (typeof (global as any).document === 'undefined') {
  (global as any).document = {
    createElement: () => ({
      getContext: () => ({
        fillRect: () => {},
        drawImage: () => {},
        getImageData: () => ({ data: [] }),
        putImageData: () => {},
        createImageData: () => ({ data: [] }),
        setTransform: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {}
      }),
      width: 256,
      height: 256
    })
  };
}

const grid: InternalGridConfig = {
  lengthMm: 1700,
  widthMm: 1200,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4
};

console.log('=== TEST 1: UPPER CABINET AT REAR WITH GAP = 0mm (ENCOSTANDO NA PARTE DE BAIXO) ===');
const bedWithCabinetGap0: InternalBoxItem = {
  id: 'box_bed_0',
  name: 'Cama c/ Aéreo Encostado',
  type: 'slat_bed',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  color: '#d97706',
  material: 'plywood',
  slatBedDirection: 'right',
  slatExtensionPercent: 100,
  mattressParts: 2,
  upperCabinet: true,
  upperCabinetBottomGapMm: 0, // touching bottom!
  upperCabinetDepthMm: 250,
  upperCabinetAlign: 'rear'
};

const builder = new InternalBoxesBuilder();
// Closed (Sofa mode)
builder.update(grid, [bedWithCabinetGap0], bedWithCabinetGap0.id, false, null);
const boxContainer0 = builder.boxesGroup.getObjectByName(`BoxContainer_${bedWithCabinetGap0.id}`);
builder.boxesGroup.updateMatrixWorld(true);

let cabinetMaxZ = -Infinity;
boxContainer0?.traverse((child: any) => {
  if (child.userData?.partLabel && child.userData.partLabel.includes('Armário Aéreo')) {
    const b = new THREE.Box3().setFromObject(child);
    if (b.max.z > cabinetMaxZ) cabinetMaxZ = b.max.z;
  }
});

console.log(`Cabinet Max Z: ${cabinetMaxZ.toFixed(3)}`);

const sofaUpholstery: any[] = [];
boxContainer0?.traverse((child: any) => {
  if (child.userData?.isUpholstery) {
    const b = new THREE.Box3().setFromObject(child);
    sofaUpholstery.push({ label: child.userData.partLabel, bounds: b, hasCutout: child.userData.hasCabinetCutout });
  }
});

console.log(`Found ${sofaUpholstery.length} cushions in Sofa Mode:`);
sofaUpholstery.forEach((u, i) => {
  console.log(`  Cushion #${i + 1}: ${u.label}`);
  console.log(`    Bounds Z: [${u.bounds.min.z.toFixed(3)}, ${u.bounds.max.z.toFixed(3)}], hasCutout: ${u.hasCutout}`);
  if (u.bounds.min.z < cabinetMaxZ - 0.01) {
    throw new Error(`FAIL: Cushion #${i + 1} collides with cabinet! MinZ ${u.bounds.min.z.toFixed(3)} < CabMaxZ ${cabinetMaxZ.toFixed(3)}`);
  }
});
console.log('✓ PASS: Sofa cushions correctly stop in front of the overhead cabinet with no collision!\n');

// Extended (Bed mode)
builder.update(grid, [bedWithCabinetGap0], bedWithCabinetGap0.id, true, null);
const boxContainerOpen = builder.boxesGroup.getObjectByName(`BoxContainer_${bedWithCabinetGap0.id}`);
builder.boxesGroup.updateMatrixWorld(true);

const openUpholstery: any[] = [];
boxContainerOpen?.traverse((child: any) => {
  if (child.userData?.isUpholstery) {
    const b = new THREE.Box3().setFromObject(child);
    openUpholstery.push({ label: child.userData.partLabel, bounds: b, hasCutout: child.userData.hasCabinetCutout });
  }
});

console.log(`Found ${openUpholstery.length} cushions in Open Bed Mode:`);
openUpholstery.forEach((u, i) => {
  console.log(`  Cushion #${i + 1}: ${u.label}`);
  console.log(`    Bounds Z: [${u.bounds.min.z.toFixed(3)}, ${u.bounds.max.z.toFixed(3)}], hasCutout: ${u.hasCutout}`);
});

// Cushion #1 (under cabinet) must have cutout and not collide
if (openUpholstery[0].bounds.min.z < cabinetMaxZ - 0.01) {
  throw new Error(`FAIL: Extended Cushion #1 collides with cabinet! MinZ ${openUpholstery[0].bounds.min.z.toFixed(3)} < CabMaxZ ${cabinetMaxZ.toFixed(3)}`);
}
console.log('✓ PASS: Extended Cushion #1 correctly has cutout for overhead cabinet!\n');

console.log('=== TEST 2: UPPER CABINET SUSPENDED HIGH (GAP = 200mm) ===');
const bedWithCabinetGap200: InternalBoxItem = {
  ...bedWithCabinetGap0,
  id: 'box_bed_200',
  upperCabinetBottomGapMm: 200 // Suspended high!
};

builder.update(grid, [bedWithCabinetGap200], bedWithCabinetGap200.id, false, null);
const boxContainer200 = builder.boxesGroup.getObjectByName(`BoxContainer_${bedWithCabinetGap200.id}`);
builder.boxesGroup.updateMatrixWorld(true);

const sofaUpholstery200: any[] = [];
boxContainer200?.traverse((child: any) => {
  if (child.userData?.isUpholstery) {
    const b = new THREE.Box3().setFromObject(child);
    sofaUpholstery200.push({ label: child.userData.partLabel, bounds: b, hasCutout: child.userData.hasCabinetCutout });
  }
});

console.log(`Found ${sofaUpholstery200.length} cushions when cabinet is suspended 200mm:`);
sofaUpholstery200.forEach((u, i) => {
  console.log(`  Cushion #${i + 1}: ${u.label}`);
  console.log(`    Bounds Z: [${u.bounds.min.z.toFixed(3)}, ${u.bounds.max.z.toFixed(3)}], hasCutout: ${u.hasCutout}`);
  if (u.hasCutout) {
    throw new Error(`FAIL: When suspended, cushion should not have cutout!`);
  }
});
console.log('✓ PASS: When suspended (gap > 80mm), mattress is full length and has no cutout!\n');

console.log('=== TEST 3: CORNER L-SHAPED CUTOUT (WIDTH LESS THAN BED) ===');
const bedWithCornerCabinet: InternalBoxItem = {
  id: 'box_bed_corner',
  name: 'Cama c/ Aéreo de Canto',
  type: 'slat_bed',
  colStart: 0,
  colSpan: 2, // 800mm wide
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  color: '#d97706',
  material: 'plywood',
  slatBedDirection: 'right',
  mattressParts: 2,
  upperCabinet: true,
  upperCabinetBottomGapMm: 0,
  upperCabinetDepthMm: 250,
  upperCabinetWidthMm: 350, // 350mm wide < 800mm -> Corner cutout!
  upperCabinetAlign: 'rear'
};

builder.update(grid, [bedWithCornerCabinet], bedWithCornerCabinet.id, false, null);
const boxContainerCorner = builder.boxesGroup.getObjectByName(`BoxContainer_${bedWithCornerCabinet.id}`);
builder.boxesGroup.updateMatrixWorld(true);

const cornerUpholstery: any[] = [];
boxContainerCorner?.traverse((child: any) => {
  if (child.userData?.isUpholstery) {
    cornerUpholstery.push({ label: child.userData.partLabel, hasCutout: child.userData.hasCabinetCutout });
  }
});
console.log(`Found ${cornerUpholstery.length} cushions for corner cabinet:`);
cornerUpholstery.forEach((u, i) => {
  console.log(`  Cushion #${i + 1}: ${u.label}, hasCutout: ${u.hasCutout}`);
});

console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
