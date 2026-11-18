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
    const cabinetDoorPart = woodStats.cutGroups.find((g) => (g.partType === 'cabinet' || g.partType === 'door') && g.label.includes('Porta c/ Trava'));
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

  it('opens ALL upper cabinets simultaneously when multiple modules have upper cabinets', () => {
    const builder = new InternalBoxesBuilder();
    const grid: InternalGridConfig = { ...DEFAULT_INTERNAL_GRID };

    const box1: InternalBoxItem = {
      id: 'box-side-tall',
      name: 'Armário Alto Lateral',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 2,
      type: 'chest',
      material: 'plywood',
      upperCabinet: true,
      upperCabinetAlign: 'left',
      upperCabinetClosure: 'sliding_doors',
      upperCabinetDepthMm: 250
    };

    const box2: InternalBoxItem = {
      id: 'box-front-upper',
      name: 'Aéreo Frontal',
      colStart: 1,
      colSpan: 2,
      rowStart: 0,
      rowSpan: 1,
      type: 'chest',
      material: 'plywood',
      upperCabinet: true,
      upperCabinetAlign: 'front',
      upperCabinetClosure: 'sliding_doors',
      upperCabinetDepthMm: 250
    };

    // Fechados
    builder.update(grid, [box1, box2], null, { openCabinets: false });
    const box1Door2Closed = builder.boxesGroup.getObjectByName(`UpperCabinetSlidingDoor2_${box1.id}_left`);
    const box2Door2Closed = builder.boxesGroup.getObjectByName(`UpperCabinetSlidingDoor2_${box2.id}_front`);
    expect(box1Door2Closed).toBeDefined();
    expect(box2Door2Closed).toBeDefined();

    const box1Door2MeshClosed = (box1Door2Closed as any)?.children?.find((c: any) => c.isMesh);
    const box2Door2MeshClosed = (box2Door2Closed as any)?.children?.find((c: any) => c.isMesh);

    // Abertos globalmente com openCabinets: true
    builder.update(grid, [box1, box2], null, { openCabinets: true });
    const box1Door2Open = builder.boxesGroup.getObjectByName(`UpperCabinetSlidingDoor2_${box1.id}_left`);
    const box2Door2Open = builder.boxesGroup.getObjectByName(`UpperCabinetSlidingDoor2_${box2.id}_front`);
    expect(box1Door2Open).toBeDefined();
    expect(box2Door2Open).toBeDefined();

    const box1Door2MeshOpen = (box1Door2Open as any)?.children?.find((c: any) => c.isMesh);
    const box2Door2MeshOpen = (box2Door2Open as any)?.children?.find((c: any) => c.isMesh);

    // Folha 2 do aéreo lateral (Z) deve ter deslizado
    expect(box1Door2MeshOpen.position.z).not.toBeCloseTo(box1Door2MeshClosed.position.z);
    // Folha 2 do aéreo frontal (X) deve ter deslizado
    expect(box2Door2MeshOpen.position.x).not.toBeCloseTo(box2Door2MeshClosed.position.x);
  });

  it('applies door discount to internal shelves preventing collision with doors and tracks', () => {
    const builder = new InternalBoxesBuilder();
    const grid: InternalGridConfig = { ...DEFAULT_INTERNAL_GRID };

    // 1. Armário transversal traseiro com portas de correr (desconto padrão 30mm)
    const boxSliding: InternalBoxItem = {
      id: 'box-shelf-sliding',
      name: 'Aéreo Correr',
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

    builder.update(grid, [boxSliding], null, { openCabinets: false });
    const woodStats = extractWoodCutGroups({ internalBoxesBuilder: builder });
    const shelfPart = woodStats.cutGroups.find((g) => g.label.includes('Prateleira') && g.moduleName === boxSliding.name);
    expect(shelfPart).toBeDefined();
    // 250mm total - 15mm fundo - 30mm desconto porta = 205mm
    expect(shelfPart?.widthMm).toBe(205);

    const cabinetGroup = builder.boxesGroup.getObjectByName(`UpperCabinet_${boxSliding.id}_rear`);
    let shelfMesh: any = null;
    cabinetGroup?.traverse((obj: any) => {
      if (obj.userData?.isUpperCabinetShelf) shelfMesh = obj;
    });
    expect(shelfMesh).toBeDefined();
    expect(shelfMesh.userData.doorDiscountMm).toBe(30);

    // 2. Armário transversal com porta basculante (desconto padrão 25mm)
    const boxDoors: InternalBoxItem = {
      id: 'box-shelf-doors',
      name: 'Aéreo Basculante',
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
      upperCabinetClosure: 'doors',
      upperCabinetShelves: 1
    };

    builder.update(grid, [boxDoors], null, { openCabinets: false });
    const woodStatsDoors = extractWoodCutGroups({ internalBoxesBuilder: builder });
    const shelfPartDoors = woodStatsDoors.cutGroups.find((g) => g.label.includes('Prateleira') && g.moduleName === boxDoors.name);
    // 250mm total - 15mm fundo - 25mm desconto porta = 210mm
    expect(shelfPartDoors?.widthMm).toBe(210);

    // 3. Desconto manual customizado de 20mm
    const boxCustom: InternalBoxItem = {
      id: 'box-shelf-custom',
      name: 'Aéreo Custom',
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
      upperCabinetShelfDoorDiscountMm: 20,
      upperCabinetShelves: 1
    };

    builder.update(grid, [boxCustom], null, { openCabinets: false });
    const woodStatsCustom = extractWoodCutGroups({ internalBoxesBuilder: builder });
    const shelfPartCustom = woodStatsCustom.cutGroups.find((g) => g.label.includes('Prateleira') && g.moduleName === boxCustom.name);
    // 250mm total - 15mm fundo - 20mm desconto manual = 215mm
    expect(shelfPartCustom?.widthMm).toBe(215);
  });
});
