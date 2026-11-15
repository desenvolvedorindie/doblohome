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
  name: 'Cama Casal Retrátil',
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
builder.update(grid, [bedWithCabinet], bedWithCabinet.id, true, null);

// Mock sceneManager
const mockSceneManager = {
  internalBoxesBuilder: builder
};

console.log('--- TRAVERSING MESHES FOR UPHOLSTERY ---');
const upholsteryPieces: any[] = [];
builder.boxesGroup.traverse((obj: any) => {
  if (obj.isMesh && obj.userData?.isUpholstery) {
    upholsteryPieces.push(obj.userData);
  }
});

console.log(`Found ${upholsteryPieces.length} upholstery meshes in scene:`);
upholsteryPieces.forEach((u, idx) => {
  console.log(`Piece #${idx + 1}:`, u.partLabel);
  console.log(`  dimW: ${u.dimW}, dimL: ${u.dimL}, dimH: ${u.dimH}, cutout: ${u.hasCabinetCutout}`);
});
