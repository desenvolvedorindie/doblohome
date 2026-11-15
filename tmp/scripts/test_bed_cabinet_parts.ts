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

const bedWithCabinet: InternalBoxItem = {
  id: 'box_bed_test',
  name: 'Cama c/ Aéreo',
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
  upperCabinetBottomGapMm: 0,
  upperCabinetDepthMm: 250,
  upperCabinetAlign: 'rear'
};

const builder = new InternalBoxesBuilder();
builder.update(grid, [bedWithCabinet], bedWithCabinet.id, false, null);

const boxContainer = builder.boxesGroup.getObjectByName(`BoxContainer_${bedWithCabinet.id}`);
builder.boxesGroup.updateMatrixWorld(true);

console.log('--- SLATS ---');
boxContainer?.traverse((child: any) => {
  if (child.userData?.partType === 'slat') {
    const b = new THREE.Box3().setFromObject(child);
    console.log(`Slat: ${child.userData.partLabel} Z[${b.min.z.toFixed(3)}, ${b.max.z.toFixed(3)}]`);
  }
});
