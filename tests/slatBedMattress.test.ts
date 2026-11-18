import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { SlatBedMattressBuilder } from '../src/three/boxes/SlatBedMattressBuilder';
import { InternalBoxItem, InternalGridConfig } from '../src/types';

describe('SlatBedMattressBuilder - Floating and Cutout Tests', () => {
  const grid: InternalGridConfig = {
    lengthMm: 1700,
    widthMm: 1200,
    heightMm: 400,
    colsX: 3,
    rowsZ: 4,
  };
  const cellWM = 1.2 / 3; // 0.4m
  const cellLM = 1.7 / 4; // 0.425m
  const slatT = 0.015;
  const h = 0.4;
  const topOfSlats = h / 2; // 0.200m

  it('ensures closed mattress bottom rests directly on the slats (0mm gap)', () => {
    const builder = new SlatBedMattressBuilder();
    const container = new THREE.Group();

    const boxBed: InternalBoxItem = {
      id: 'box_slat_bed_main',
      name: 'Sofá-Cama Ripas',
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
      mattressParts: 3,
    };

    builder.buildMattress({
      container,
      w: 0.4,
      l: 1.7,
      h: 0.4,
      box: boxBed,
      slatT,
      direction: 'left',
      isExtended: false,
      extRatio: 1,
      cellWM,
      cellLM,
      allBoxes: [boxBed],
      grid,
      isSelected: false
    });

    // Child 0 is the bottom layer (Layer 1/3)
    const layer0 = container.children[0] as THREE.Mesh;
    const layerH = (layer0.userData as any).dimH;
    const bottomY = layer0.position.y - layerH / 2;

    expect(bottomY).toBeCloseTo(topOfSlats, 4);
  });

  it('ensures 5-parts closed bed flaps have identical Y position (no floating step)', () => {
    const builder = new SlatBedMattressBuilder();
    const container = new THREE.Group();

    const boxBed: InternalBoxItem = {
      id: 'box_slat_bed_main',
      name: 'Sofá-Cama Ripas 5 Partes',
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
    };

    builder.buildMattress({
      container,
      w: 0.4,
      l: 1.7,
      h: 0.4,
      box: boxBed,
      slatT,
      direction: 'left',
      isExtended: false,
      extRatio: 1,
      cellWM,
      cellLM,
      allBoxes: [boxBed],
      grid,
      isSelected: false
    });

    const flaps = container.children.filter(c =>
      (c.userData as any).partLabel?.includes('Aba Caixa de Roda Dobrada')
    );
    expect(flaps.length).toBe(2);

    // Both flaps must be at the exact same Y position
    expect(flaps[0].position.y).toBeCloseTo(flaps[1].position.y, 4);

    // Flaps must be clearly split with a gap between them (not a single whole mattress)
    expect(flaps[0].position.x).not.toBeCloseTo(flaps[1].position.x);
    expect(Math.abs(flaps[0].position.x - flaps[1].position.x)).toBeGreaterThan(0.10);

    // Flaps must sit directly atop the 3rd central layer
    const layer2 = container.children[2] as THREE.Mesh;
    const layerH = (layer2.userData as any).dimH;
    const topOfLayer2 = layer2.position.y + layerH / 2;
    const bottomOfFlaps = flaps[0].position.y - (flaps[0].userData as any).dimH / 2;

    expect(bottomOfFlaps).toBeCloseTo(topOfLayer2 + 0.001, 3);
  });

  it('verifies front upper cabinet cuts both central cushion and base arch in 5-parts mode', () => {
    const builder = new SlatBedMattressBuilder();
    const container = new THREE.Group();

    const boxBed: InternalBoxItem = {
      id: 'box_slat_bed_main',
      name: 'Sofá-Cama Ripas',
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
      upperCabinet: true,
      upperCabinetAlign: 'front',
      upperCabinetDepthMm: 250,
    };

    builder.buildMattress({
      container,
      w: 0.4,
      l: 1.7,
      h: 0.4,
      box: boxBed,
      slatT,
      direction: 'left',
      isExtended: true,
      extRatio: 1,
      cellWM,
      cellLM,
      allBoxes: [boxBed],
      grid,
      isSelected: false
    });

    const baseArch = container.children.find(c =>
      (c.userData as any).partLabel?.includes('Almofada Aba Caixa de Roda')
    ) as THREE.Mesh;
    expect(baseArch).toBeDefined();
    expect((baseArch.userData as any).hasCabinetCutout).toBe(true);

    const central1 = container.children.find(c =>
      (c.userData as any).partLabel?.includes('Almofada Central 1/3')
    ) as THREE.Mesh;
    expect(central1).toBeDefined();
    expect((central1.userData as any).hasCabinetCutout).toBe(true);
  });

  it('verifies neighboring upper cabinet coordinates are not inverted across columns', () => {
    const builder = new SlatBedMattressBuilder();
    const container = new THREE.Group();

    const otherKitchen: InternalBoxItem = {
      id: 'box_kitchen',
      name: 'Armário Alto Cozinha',
      type: 'chest',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      color: '#0284c7',
      material: 'plywood',
      upperCabinet: true,
      upperCabinetAlign: 'front',
      upperCabinetDepthMm: 250,
    };

    const boxBed: InternalBoxItem = {
      id: 'box_slat_bed_main',
      name: 'Sofá-Cama Ripas',
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
      mattressParts: 3,
    };

    builder.buildMattress({
      container,
      w: 0.4,
      l: 1.7,
      h: 0.4,
      box: boxBed,
      slatT,
      direction: 'left',
      isExtended: true,
      extRatio: 1,
      cellWM,
      cellLM,
      allBoxes: [otherKitchen, boxBed],
      grid,
      isSelected: false
    });

    // Central 3/3 is at Col 0 (under otherKitchen). It must have the cabinet cutout!
    const central3 = container.children.find(c =>
      (c.userData as any).partLabel?.includes('Almofada 3/3')
    ) as THREE.Mesh;
    expect(central3).toBeDefined();
    expect((central3.userData as any).hasCabinetCutout).toBe(true);

    // Central 1/3 is at Col 2 (opposite side from otherKitchen). It must NOT have a cutout!
    const central1 = container.children.find(c =>
      (c.userData as any).partLabel?.includes('Almofada 1/3')
    ) as THREE.Mesh;
    expect(central1).toBeDefined();
    expect((central1.userData as any).hasCabinetCutout).toBe(false);
  });

  it('cuts wheel arch cushion and adjacent cushion when longitudinal cabinet sits at bottom (gap 0mm)', () => {
    const builder = new SlatBedMattressBuilder();
    const container = new THREE.Group();

    const boxBed: InternalBoxItem = {
      id: 'box_slat_bed_wheelarch_test',
      name: 'Sofá-Cama Ripas',
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
      upperCabinet: true,
      upperCabinetAlign: 'right',
      upperCabinetDepthMm: 250,
      upperCabinetWidthMm: 800, // 800mm de comprimento sobre a caixa de roda traseira
      upperCabinetOffsetMm: 0,
      upperCabinetBottomGapMm: 0, // Inicia embaixo encostando no baú / caixa de roda
    };

    builder.buildMattress({
      container,
      w: 0.4,
      l: 1.7,
      h: 0.4,
      box: boxBed,
      slatT,
      direction: 'left',
      isExtended: true,
      extRatio: 1,
      cellWM,
      cellLM,
      allBoxes: [boxBed],
      grid,
      isSelected: false
    });

    // 1. Aba Caixa de Roda Direita deve existir e ter o recorte do armário aéreo que desce até embaixo
    const baseArch = container.children.find(c =>
      (c.userData as any).partLabel?.includes('Almofada Aba Caixa de Roda')
    ) as THREE.Mesh;
    expect(baseArch).toBeDefined();
    expect((baseArch.userData as any).hasCabinetCutout).toBe(true);

    // 2. Almofada Central 1/3 deve ter o recorte da quina/lateral onde o armário se estende para dentro
    const central1 = container.children.find(c =>
      (c.userData as any).partLabel?.includes('Almofada Central 1/3')
    ) as THREE.Mesh;
    expect(central1).toBeDefined();
    expect((central1.userData as any).hasCabinetCutout).toBe(true);
  });

  it('does NOT cut mattress when upper cabinet is suspended high (gap > 80mm)', () => {
    const builder = new SlatBedMattressBuilder();
    const container = new THREE.Group();

    const boxBed: InternalBoxItem = {
      id: 'box_slat_bed_high_cabinet',
      name: 'Sofá-Cama Ripas',
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
      upperCabinet: true,
      upperCabinetAlign: 'right',
      upperCabinetDepthMm: 250,
      upperCabinetBottomGapMm: 400, // Suspenso alto a 400mm do baú
    };

    builder.buildMattress({
      container,
      w: 0.4,
      l: 1.7,
      h: 0.4,
      box: boxBed,
      slatT,
      direction: 'left',
      isExtended: true,
      extRatio: 1,
      cellWM,
      cellLM,
      allBoxes: [boxBed],
      grid,
      isSelected: false
    });

    // Almofadas NÃO devem ter recorte quando o armário é suspenso alto
    const baseArch = container.children.find(c =>
      (c.userData as any).partLabel?.includes('Almofada Aba Caixa de Roda')
    ) as THREE.Mesh;
    expect(baseArch).toBeDefined();
    expect((baseArch.userData as any).hasCabinetCutout).toBe(false);

    const central1 = container.children.find(c =>
      (c.userData as any).partLabel?.includes('Almofada Central 1/3')
    ) as THREE.Mesh;
    expect(central1).toBeDefined();
    expect((central1.userData as any).hasCabinetCutout).toBe(false);
  });

  it('reflects custom foam density and cuts wheel arch cushion in parts list and userData', () => {
    const builder = new SlatBedMattressBuilder();
    const container = new THREE.Group();

    const boxBed: InternalBoxItem = {
      id: 'box_custom_foam_test',
      name: 'Sofá-Cama Ripas',
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
      mattressFoam: 'D45',
      mattressThicknessMm: 100,
      upperCabinet: true,
      upperCabinetAlign: 'front',
      upperCabinetDepthMm: 250,
      upperCabinetBottomGapMm: 0,
    };

    builder.buildMattress({
      container,
      w: 0.4,
      l: 1.7,
      h: 0.4,
      box: boxBed,
      slatT,
      direction: 'left',
      isExtended: true,
      extRatio: 1,
      cellWM,
      cellLM,
      allBoxes: [boxBed],
      grid,
      isSelected: false
    });

    const baseArch = container.children.find(c =>
      (c.userData as any).partLabel?.includes('Almofada Aba Caixa de Roda')
    ) as THREE.Mesh;
    expect(baseArch).toBeDefined();
    expect((baseArch.userData as any).hasCabinetCutout).toBe(true);
    expect((baseArch.userData as any).woodMaterial).toBe('Espuma D45 (Colchão)');
    expect((baseArch.userData as any).thicknessMm).toBe(100);
    expect((baseArch.userData as any).dimL).toBeCloseTo(1.423, 2);
  });

  it('verifies parts lineup and collection retain nominal thickness and cabinet cutouts even when bed is closed', async () => {
    const { InternalBoxesBuilder } = await import('../src/three/InternalBoxesBuilder');
    const { BarsLineupCollector } = await import('../src/three/scene/BarsLineupCollector');
    const { BarsLineupBuilder } = await import('../src/three/scene/BarsLineupBuilder');

    const builder = new InternalBoxesBuilder();
    const boxBed: InternalBoxItem = {
      id: 'box_slat_bed_main',
      name: 'Sofá-Cama Ripas',
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
      mattressFoam: 'D33',
      mattressThicknessMm: 80,
      upperCabinet: true,
      upperCabinetAlign: 'front',
      upperCabinetDepthMm: 250,
      upperCabinetBottomGapMm: 0,
    };

    // Update with bed closed (sofa mode)
    builder.update(grid, [boxBed], null, { openBed: false });

    const dummySolar: any = { cargoBoxConfig: { enabled: false }, group: new THREE.Group() };
    const collected = BarsLineupCollector.collect(dummySolar, builder);

    // In closed bed mode, we must collect 5 nominal cushions (not visual sofa slices of 40mm)
    expect(collected.upholsteryItems.length).toBe(5);
    collected.upholsteryItems.forEach((it: any) => {
      expect(it.thicknessMm).toBe(80);
    });

    const cutItems = collected.upholsteryItems.filter((it: any) => it.hasCabinetCutout);
    expect(cutItems.length).toBeGreaterThanOrEqual(2); // Central 1/3 and Base Arch

    // Verify 3D Lineup Builder preserves geometry and cutouts
    const lineupGroup = new THREE.Group();
    BarsLineupBuilder.build(lineupGroup, dummySolar, builder, 'upholstery');

    const lineupUpholsteryMeshes: THREE.Mesh[] = [];
    lineupGroup.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.isUpholstery) {
        lineupUpholsteryMeshes.push(obj);
      }
    });

    expect(lineupUpholsteryMeshes.length).toBe(5);
    const cutLineupMeshes = lineupUpholsteryMeshes.filter(m => m.userData.hasCabinetCutout);
    expect(cutLineupMeshes.length).toBeGreaterThanOrEqual(2);
  });

  it('cuts wheel-well cushion when upper cabinet is in middle of Z or bed has extraLengthMm, and when cabinet passes mattress height', () => {
    const builder = new SlatBedMattressBuilder();
    const container = new THREE.Group();

    const boxBed: InternalBoxItem = {
      id: 'box_slat_bed_extra_len',
      name: 'Sofá-Cama Ripas',
      type: 'slat_bed',
      colStart: 2,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      extraLengthMm: 160,
      color: '#d97706',
      material: 'plywood',
      slatBedDirection: 'left',
      slatExtensionPercent: 100,
      mattressParts: 5,
      mattressThicknessMm: 120,
    };

    const cabOverWheelWell: InternalBoxItem = {
      id: 'box_cab_wheel_well',
      name: 'Armário Aéreo Caixa de Roda',
      type: 'chest',
      colStart: 2,
      colSpan: 1,
      rowStart: 1,
      rowSpan: 2,
      heightMm: 400,
      color: '#d97706',
      material: 'plywood',
      upperCabinet: true,
      upperCabinetAlign: 'right',
      upperCabinetDepthMm: 250,
      upperCabinetBottomGapMm: 100, // 100mm < 120mm (passa da altura do colchão!)
    };

    builder.buildMattress({
      container,
      w: 0.4,
      l: 1.86,
      h: 0.4,
      box: boxBed,
      slatT,
      direction: 'left',
      isExtended: true,
      extRatio: 1,
      cellWM,
      cellLM,
      allBoxes: [boxBed, cabOverWheelWell],
      grid,
      isSelected: false
    });

    const baseArch = container.children.find(c =>
      (c.userData as any).partLabel?.includes('Almofada Aba Caixa de Roda')
    ) as THREE.Mesh;
    expect(baseArch).toBeDefined();
    expect((baseArch.userData as any).hasCabinetCutout).toBe(true);
  });
});
