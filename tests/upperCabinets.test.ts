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

  it('builds upper cabinet with telescopic slides and drawer when upperCabinetClosure is drawer', () => {
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
      upperCabinetClosure: 'drawer',
      upperCabinetShelves: 1
    };

    // 1. Fechado
    builder.update(grid, [box], null, { openCabinets: false });
    const drawerClosed = builder.boxesGroup.getObjectByName(`UpperCabinetDrawer_${box.id}_rear`);
    expect(drawerClosed).toBeDefined();
    expect(drawerClosed?.position.z).toBeCloseTo(0, 4);

    // 2. Aberto (gaveta desliza para frente no eixo Z)
    builder.update(grid, [box], null, { openCabinets: true });
    const drawerOpen = builder.boxesGroup.getObjectByName(`UpperCabinetDrawer_${box.id}_rear`);
    expect(drawerOpen).toBeDefined();
    expect(drawerOpen?.position.z).toBeGreaterThan(0.05);

    // 3. Plano de corte de madeira inclui frente e fundo da gaveta
    const woodStats = extractWoodCutGroups({ internalBoxesBuilder: builder });
    const frontPart = woodStats.cutGroups.find((g) => g.label.includes('Frente Gaveta c/ Trava'));
    const bottomPart = woodStats.cutGroups.find((g) => g.label.includes('Fundo da Gaveta'));
    expect(frontPart).toBeDefined();
    expect(bottomPart).toBeDefined();
  });
});
