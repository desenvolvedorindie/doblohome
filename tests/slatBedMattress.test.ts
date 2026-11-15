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
});
