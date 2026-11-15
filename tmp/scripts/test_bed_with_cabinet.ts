import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { InternalBoxItem, InternalGridConfig } from '../../src/types';

// Mock document for textures if needed in Node
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

// Scenario: A slat bed with an upper cabinet at the rear!
const bedWithCabinet: InternalBoxItem = {
  id: 'box_bed_test',
  name: 'Cama c/ Aéreo',
  type: 'slat_bed',
  colStart: 0,
  colSpan: 2,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  color: '#d97706',
  material: 'plywood',
  slatBedDirection: 'left',
  slatExtensionPercent: 100,
  mattressParts: 2,
  upperCabinet: true,
  upperCabinetBottomGapMm: 0, // Encostando na parte de baixo!
  upperCabinetDepthMm: 250,
  upperCabinetAlign: 'rear'
};

const builder = new InternalBoxesBuilder();
builder.update(grid, [bedWithCabinet], bedWithCabinet.id, false, null);

console.log('--- BOX CONTAINER CHILDREN ---');
const boxContainer = builder.boxesGroup.getObjectByName(`BoxContainer_${bedWithCabinet.id}`);
if (!boxContainer) {
  console.error('Box container not found!');
  process.exit(1);
}

const upholsteryMeshes: THREE.Mesh[] = [];
let cabinetGroup: THREE.Group | null = null;

boxContainer.traverse((child: any) => {
  if (child.userData?.isUpholstery) {
    upholsteryMeshes.push(child);
  }
  if (child.name && child.name.includes('UpperCabinet')) {
    cabinetGroup = child;
  }
});

console.log(`Found ${upholsteryMeshes.length} upholstery meshes.`);
upholsteryMeshes.forEach((mesh, idx) => {
  const box3 = new THREE.Box3().setFromObject(mesh);
  console.log(`Upholstery #${idx + 1}: ${mesh.userData?.partLabel}`);
  console.log(`  Local pos: (${mesh.position.x.toFixed(3)}, ${mesh.position.y.toFixed(3)}, ${mesh.position.z.toFixed(3)})`);
  console.log(`  Bounds: X[${box3.min.x.toFixed(3)}, ${box3.max.x.toFixed(3)}], Y[${box3.min.y.toFixed(3)}, ${box3.max.y.toFixed(3)}], Z[${box3.min.z.toFixed(3)}, ${box3.max.z.toFixed(3)}]`);
});

if (cabinetGroup) {
  const cabBox = new THREE.Box3().setFromObject(cabinetGroup);
  console.log(`Upper Cabinet: ${(cabinetGroup as THREE.Group).name}`);
  console.log(`  Local pos: (${(cabinetGroup as THREE.Group).position.x.toFixed(3)}, ${(cabinetGroup as THREE.Group).position.y.toFixed(3)}, ${(cabinetGroup as THREE.Group).position.z.toFixed(3)})`);
  console.log(`  Bounds: X[${cabBox.min.x.toFixed(3)}, ${cabBox.max.x.toFixed(3)}], Y[${cabBox.min.y.toFixed(3)}, ${cabBox.max.y.toFixed(3)}], Z[${cabBox.min.z.toFixed(3)}, ${cabBox.max.z.toFixed(3)}]`);
} else {
  console.log('No cabinet group found!');
}
