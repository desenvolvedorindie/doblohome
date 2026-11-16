import { describe, it, expect } from 'vitest';
import { InternalBoxesBuilder } from '../src/three/InternalBoxesBuilder';
import { extractWoodCutGroups } from '../src/utils/woodUtils';
import { DEFAULT_INTERNAL_GRID } from '../src/data/internalBoxesPresets';
import { InternalGridConfig, InternalBoxItem } from '../src/types';

describe('Upper Cabinets / Armários Aéreos Opening System', () => {
  it('opens transversal upper cabinet door basculante (~75°) when openCabinets is true', () => {
    const builder = new InternalBoxesBuilder();
    const grid: InternalGridConfig = { ...DEFAULT_INTERNAL_GRID };
    const box: InternalBoxItem = {
      id: 'box-kitchen',
      name: 'Bancada Cozinha',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      type: 'chest',
      material: 'plywood',
      color: '#d4a373',
      upperCabinet: true,
      upperCabinetAlign: 'rear',
      upperCabinetDepthMm: 250,
      upperCabinetDoors: true,
      upperCabinetShelves: 1
    };

    // 1. Fechado (openCabinets = false)
    builder.update(grid, [box], null, { openCabinets: false });
    const pivotClosed = builder.boxesGroup.getObjectByName(`UpperCabinetDoorPivot_${box.id}_rear`);
    expect(pivotClosed).toBeDefined();
    expect(pivotClosed?.rotation.x).toBeCloseTo(0, 4);

    // 2. Aberto (openCabinets = true)
    builder.update(grid, [box], null, { openCabinets: true });
    const pivotOpen = builder.boxesGroup.getObjectByName(`UpperCabinetDoorPivot_${box.id}_rear`);
    expect(pivotOpen).toBeDefined();
    // Basculante para cima: rotação deve ser próxima de -75 graus (~ -1.31 radianos)
    expect(pivotOpen?.rotation.x).toBeLessThan(-1.0);
  });

  it('opens lateral upper cabinet door basculante into corridor when openCabinets is true', () => {
    const builder = new InternalBoxesBuilder();
    const grid: InternalGridConfig = { ...DEFAULT_INTERNAL_GRID };
    const box: InternalBoxItem = {
      id: 'box-side',
      name: 'Armário Lateral',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      type: 'chest',
      material: 'plywood',
      color: '#d4a373',
      upperCabinet: true,
      upperCabinetAlign: 'left',
      upperCabinetDepthMm: 250,
      upperCabinetDoors: true,
      upperCabinetShelves: 2
    };

    // 1. Fechado
    builder.update(grid, [box], null, { openCabinets: false });
    const pivotClosed = builder.boxesGroup.getObjectByName(`UpperCabinetDoorPivot_${box.id}_left`);
    expect(pivotClosed).toBeDefined();
    expect(pivotClosed?.rotation.z).toBeCloseTo(0, 4);

    // 2. Aberto
    builder.update(grid, [box], null, { openCabinets: true });
    const pivotOpen = builder.boxesGroup.getObjectByName(`UpperCabinetDoorPivot_${box.id}_left`);
    expect(pivotOpen).toBeDefined();
    expect(pivotOpen?.rotation.z).toBeLessThan(-1.0);
  });

  it('keeps door parts in wood cut plan and BOM even when doors are opened', () => {
    const builder = new InternalBoxesBuilder();
    const grid: InternalGridConfig = { ...DEFAULT_INTERNAL_GRID };
    const box: InternalBoxItem = {
      id: 'box-test',
      name: 'Gabinete Aéreo',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      type: 'chest',
      material: 'white_mdf',
      color: '#ffffff',
      upperCabinet: true,
      upperCabinetAlign: 'rear',
      upperCabinetDepthMm: 250,
      upperCabinetDoors: true,
      upperCabinetShelves: 1
    };

    builder.update(grid, [box], null, { openCabinets: true });
    const woodStats = extractWoodCutGroups({ internalBoxesBuilder: builder });
    const cabinetDoorPart = woodStats.cutGroups.find((g) => g.partType === 'cabinet' && g.label.includes('Porta c/ Trava'));
    expect(cabinetDoorPart).toBeDefined();
    expect(cabinetDoorPart?.qty).toBe(1);
  });

  it('builds upper cabinet with sliding doors (2 leaves divided in middle) when upperCabinetClosure is sliding_doors or drawer', () => {
    const builder = new InternalBoxesBuilder();
    const grid: InternalGridConfig = { ...DEFAULT_INTERNAL_GRID };
    const box: InternalBoxItem = {
      id: 'box-drawer-cabinet',
      name: 'Aéreo Corrediça',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      type: 'chest',
      material: 'plywood',
      color: '#d4a373',
      upperCabinet: true,
      upperCabinetAlign: 'rear',
      upperCabinetDepthMm: 250,
      upperCabinetClosure: 'sliding_doors',
      upperCabinetShelves: 1
    };

    // 1. Fechado: 2 folhas de porta divididas no meio
    builder.update(grid, [box], null, { openCabinets: false });
    const door1Closed = builder.boxesGroup.getObjectByName(`UpperCabinetSlidingDoor1_${box.id}_rear`);
    const door2Closed = builder.boxesGroup.getObjectByName(`UpperCabinetSlidingDoor2_${box.id}_rear`);
    expect(door1Closed).toBeDefined();
    expect(door2Closed).toBeDefined();

    // 2. Aberto: Folha 2 corre lateralmente no eixo X sobre a Folha 1 (e NÃO para frente no eixo Z)
    builder.update(grid, [box], null, { openCabinets: true });
    const door2Open = builder.boxesGroup.getObjectByName(`UpperCabinetSlidingDoor2_${box.id}_rear`);
    expect(door2Open).toBeDefined();

    // 3. Plano de corte de madeira inclui as 2 folhas da porta de correr com espessura de 6mm
    const woodStats = extractWoodCutGroups({ internalBoxesBuilder: builder });
    const slidingPart = woodStats.cutGroups.find((g) => g.label.includes('Porta de Correr'));
    expect(slidingPart).toBeDefined();
    expect(slidingPart?.qty).toBe(2);
    expect(slidingPart?.thicknessMm).toBe(6);
  });

  it('builds longitudinal upper cabinet with sliding doors moving along Z axis', () => {
    const builder = new InternalBoxesBuilder();
    const grid: InternalGridConfig = { ...DEFAULT_INTERNAL_GRID };
    const box: InternalBoxItem = {
      id: 'box-side-sliding',
      name: 'Aéreo Lateral Correr',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      type: 'chest',
      material: 'plywood',
      color: '#d4a373',
      upperCabinet: true,
      upperCabinetAlign: 'left',
      upperCabinetDepthMm: 250,
      upperCabinetClosure: 'sliding_doors',
      upperCabinetShelves: 2
    };

    builder.update(grid, [box], null, { openCabinets: false });
    const door1Closed = builder.boxesGroup.getObjectByName(`UpperCabinetSlidingDoor1_${box.id}_left`);
    const door2Closed = builder.boxesGroup.getObjectByName(`UpperCabinetSlidingDoor2_${box.id}_left`);
    expect(door1Closed).toBeDefined();
    expect(door2Closed).toBeDefined();

    builder.update(grid, [box], null, { openCabinets: true });
    const door2Open = builder.boxesGroup.getObjectByName(`UpperCabinetSlidingDoor2_${box.id}_left`);
    expect(door2Open).toBeDefined();

    const woodStats = extractWoodCutGroups({ internalBoxesBuilder: builder });
    const slidingPart = woodStats.cutGroups.find((g) => g.label.includes('Porta de Correr') && g.moduleName === box.name);
    expect(slidingPart).toBeDefined();
    expect(slidingPart?.qty).toBe(2);
    expect(slidingPart?.thicknessMm).toBe(6);
  });
});
