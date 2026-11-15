import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { InternalBoxItem } from '../../src/types';

// Mock document for textures
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

const builder = new InternalBoxesBuilder();

const baseGrid = {
  lengthMm: 1700,
  widthMm: 1200,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4
};

console.log('--- TESTING MATTRESS MULTI-PARTS (1, 2, 3, 4) ---');

for (const parts of [1, 2, 3, 4] as const) {
  // Test Extended (Open Bed)
  const boxExtended: InternalBoxItem = {
    id: `slat_bed_parts_${parts}`,
    name: 'Cama Retrátil',
    type: 'slat_bed',
    colStart: 0,
    colSpan: 2,
    rowStart: 0,
    rowSpan: 4,
    heightMm: 400,
    color: '#d97706',
    material: 'plywood',
    slatBedDirection: 'right',
    slatExtensionPercent: 100,
    mattressParts: parts
  };

  builder.update(baseGrid, [boxExtended], boxExtended.id, true, null);
  const boxContainerExt = builder.boxesGroup.getObjectByName(`BoxContainer_${boxExtended.id}`);
  if (!boxContainerExt) throw new Error('BoxContainer not found');

  const upholsteryExt: any[] = [];
  boxContainerExt.traverse((obj: any) => {
    if (obj.userData?.isUpholstery) {
      upholsteryExt.push(obj);
    }
  });

  console.log(`[EXTENDED] Mattress Parts = ${parts}: Found ${upholsteryExt.length} upholstery pieces.`);
  if (upholsteryExt.length !== parts) {
    throw new Error(`Expected ${parts} upholstery pieces when extended, got ${upholsteryExt.length}`);
  }
  upholsteryExt.forEach((mesh: any, idx: number) => {
    console.log(`  Piece ${idx + 1}: ${mesh.userData.partLabel} (W=${(mesh.userData.dimW*100).toFixed(1)}cm, L=${(mesh.userData.dimL*100).toFixed(1)}cm)`);
  });

  // Test Closed (Sofa Mode)
  const boxClosed: InternalBoxItem = {
    id: `slat_bed_parts_${parts}_closed`,
    name: 'Cama Retrátil',
    type: 'slat_bed',
    colStart: 0,
    colSpan: 2,
    rowStart: 0,
    rowSpan: 4,
    heightMm: 400,
    color: '#d97706',
    material: 'plywood',
    slatBedDirection: 'right',
    slatExtensionPercent: 100,
    mattressParts: parts
  };

  builder.update(baseGrid, [boxClosed], boxClosed.id, false, null);
  const boxContainerClosed = builder.boxesGroup.getObjectByName(`BoxContainer_${boxClosed.id}`);
  if (!boxContainerClosed) throw new Error('BoxContainer not found');

  const upholsteryClosed: any[] = [];
  boxContainerClosed.traverse((obj: any) => {
    if (obj.userData?.isUpholstery) {
      upholsteryClosed.push(obj);
    }
  });

  console.log(`[CLOSED] Mattress Parts = ${parts}: Found ${upholsteryClosed.length} upholstery layers.`);
  if (upholsteryClosed.length !== parts) {
    throw new Error(`Expected ${parts} upholstery layers when closed, got ${upholsteryClosed.length}`);
  }
  upholsteryClosed.forEach((mesh: any, idx: number) => {
    console.log(`  Layer ${idx + 1}: ${mesh.userData.partLabel} (H=${(mesh.userData.dimH*100).toFixed(1)}cm)`);
  });
}

console.log('--- ALL MATTRESS MULTI-PART TESTS PASSED 100%! ---');
