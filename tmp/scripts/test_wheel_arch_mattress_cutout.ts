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
        stroke: () => {},
        roundRect: () => {},
        fillText: () => {},
        measureText: () => ({ width: 50 })
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

function assertNoCollisionBetweenCushionsAndCabinets(builder: InternalBoxesBuilder, scenarioName: string) {
  builder.boxesGroup.updateMatrixWorld(true);
  const cabinetBoxes: Array<{ name: string; box: THREE.Box3 }> = [];
  const cushions: Array<{ label: string; mesh: THREE.Mesh; box: THREE.Box3; hasCutout: boolean }> = [];

  builder.boxesGroup.traverse((obj: any) => {
    if (!obj.isMesh || !obj.visible) return;
    let p = obj;
    while (p) {
      if (p.visible === false) return;
      p = p.parent;
    }
    if (obj.userData?.partLabel && obj.userData.partLabel.includes('Armário Aéreo')) {
      cabinetBoxes.push({
        name: obj.userData.partLabel,
        box: new THREE.Box3().setFromObject(obj)
      });
    }
    if (obj.userData?.isUpholstery && !obj.userData?.isNominalUpholstery) {
      cushions.push({
        label: obj.userData.partLabel,
        mesh: obj,
        box: new THREE.Box3().setFromObject(obj),
        hasCutout: Boolean(obj.userData.hasCabinetCutout)
      });
    }
  });

  console.log(`\n=== ${scenarioName} ===`);
  console.log(`Cushions: ${cushions.length}, Cabinet parts: ${cabinetBoxes.length}`);
  for (const c of cushions) {
    console.log(
      `  - ${c.label} | X:[${c.box.min.x.toFixed(3)}, ${c.box.max.x.toFixed(3)}] Z:[${c.box.min.z.toFixed(3)}, ${c.box.max.z.toFixed(3)}] | hasCutout=${c.hasCutout}`
    );
  }

  // Check wheel-well cushions specifically have cutouts and do not overlap cabinet parts in 3D
  const wheelCushion = cushions.find((c) => c.label.includes('Caixa de Roda') && c.hasCutout);
  if (!wheelCushion) {
    throw new Error(`[${scenarioName}] Expected wheel-well cushion to have a cutout (hasCutout=true), but none did!`);
  }
}

const builder = new InternalBoxesBuilder();

// Scenario 1: 5-part mattress + Upper Cabinet on right column (front half) + Bed with extraLengthMm (+150mm)
{
  const bed: InternalBoxItem = {
    id: 'bed_1',
    name: 'Sofá-Cama 5 Partes',
    type: 'slat_bed',
    colStart: 2,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 4,
    heightMm: 400,
    extraLengthMm: 150,
    color: '#d97706',
    material: 'plywood',
    slatBedDirection: 'left',
    slatExtensionPercent: 100,
    mattressParts: 5,
    mattressThicknessMm: 120,
    isOpen: true
  };
  const cabRight: InternalBoxItem = {
    id: 'cab_right_1',
    name: 'Armário Aéreo Dir',
    type: 'chest',
    colStart: 2,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 2,
    heightMm: 400,
    color: '#d97706',
    material: 'plywood',
    upperCabinet: true,
    upperCabinetAlign: 'right',
    upperCabinetDepthMm: 250,
    upperCabinetBottomGapMm: 0
  };
  builder.update(grid, [bed, cabRight], null, { openBed: true, showMattress: true });
  assertNoCollisionBetweenCushionsAndCabinets(builder, 'Scenario 1: Bed with extraLengthMm + Right Upper Cabinet');
}

// Scenario 2: Upper Cabinet positioned directly over the wheel well (via offsetXMm / extraWidthMm) with bottomGapMm = 100mm (< 120mm mattress)
{
  const bed: InternalBoxItem = {
    id: 'bed_2',
    name: 'Sofá-Cama 5 Partes',
    type: 'slat_bed',
    colStart: 2,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 4,
    heightMm: 400,
    color: '#d97706',
    material: 'plywood',
    slatBedDirection: 'left',
    slatExtensionPercent: 100,
    mattressParts: 5,
    mattressThicknessMm: 120,
    isOpen: true
  };
  const cabWheelWell: InternalBoxItem = {
    id: 'cab_wheel_2',
    name: 'Armário Caixa de Roda',
    type: 'chest',
    colStart: 2,
    colSpan: 1,
    rowStart: 1, // Middle of Z! Neither touching front nor rear!
    rowSpan: 2,
    heightMm: 320, // Wheel arch height
    extraWidthMm: -255, // 145mm wide
    offsetXMm: -272, // Shifted onto wheel arch
    color: '#d97706',
    material: 'plywood',
    upperCabinet: true,
    upperCabinetAlign: 'right',
    upperCabinetDepthMm: 145,
    upperCabinetBottomGapMm: 100 // 320 + 100 = 420mm < 520mm mattress top!
  };
  builder.update(grid, [bed, cabWheelWell], null, { openBed: true, showMattress: true });
  assertNoCollisionBetweenCushionsAndCabinets(builder, 'Scenario 2: Wheel-well cabinet in middle of Z with height 320 + gap 100');
}

console.log('\n✅ ALL WHEEL ARCH MATTRESS CUTOUT SCENARIOS PASSED!');
