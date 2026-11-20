import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { SlatBedMattressBuilder } from '../src/three/boxes/SlatBedMattressBuilder';
import { InternalBoxesBuilder } from '../src/three/InternalBoxesBuilder';
import { InternalBoxItem, InternalGridConfig } from '../src/types';
import {
  areSubpartsAdjacent,
  buildMattressPartitions,
  computeAllVehicleMattressSubparts,
  computeRectUnionPolygons,
  connectGlobalMattressSubparts,
  connectMattressSubparts,
  disconnectGlobalMattressGroup,
  disconnectMattressGroup
} from '../src/utils/mattressGrouping';

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
    expect((baseArch.userData as any).dimL).toBeCloseTo(1.431, 2);
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

  it('connects and disconnects contiguous mattress subparts and updates 3D cushions & seams', () => {
    // 1. Regras de agrupamento/desagrupamento
    const merged1 = connectMattressSubparts(5, undefined, [0, 1]);
    expect(merged1).toEqual([[0, 1]]);

    // Não-contíguo deve retornar null
    const invalidMerge = connectMattressSubparts(5, merged1!, [0, 3]);
    expect(invalidMerge).toBeNull();

    // Segundo grupo independente
    const merged2 = connectMattressSubparts(5, merged1!, [3, 4]);
    expect(merged2).toEqual([[0, 1], [3, 4]]);

    // Partições resultantes: [0,1], [2], [3,4] -> 3 peças finais
    const partitions = buildMattressPartitions(5, merged2!);
    expect(partitions.map((p) => p.indices)).toEqual([[0, 1], [2], [3, 4]]);

    // Desconectar grupo [0,1] devolve 0 e 1 ao estado individual
    const afterDisconnect = disconnectMattressGroup(5, merged2!, [0, 1]);
    expect(afterDisconnect).toEqual([[3, 4]]);

    // 2. Construção 3D de colchão 5 partes com [[0,1], [3,4]] conectados
    const builder = new SlatBedMattressBuilder();
    const container = new THREE.Group();
    const boxBed: InternalBoxItem = {
      id: 'box_merged_5p',
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
      mattressMergedGroups: [[0, 1], [3, 4]]
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

    const cushions = container.children.filter((c) => (c.userData as any).isUpholstery);
    // 3 peças finais em vez de 5
    expect(cushions.length).toBe(3);
    // Primeira peça conectada (Aba Base 142mm + Central 1 400mm = 542mm)
    expect((cushions[0].userData as any).dimW).toBeCloseTo(0.142 + 0.4, 3);
    expect((cushions[0].userData as any).isMergedMattressGroup).toBe(true);
    // Peça do meio continua individual (400mm)
    expect((cushions[1].userData as any).dimW).toBeCloseTo(0.4, 3);
    expect((cushions[1].userData as any).isMergedMattressGroup).toBe(false);
    // Última peça conectada (Central 3 400mm + Aba Oposta 142mm = 542mm)
    expect((cushions[2].userData as any).dimW).toBeCloseTo(0.4 + 0.142, 3);
    expect((cushions[2].userData as any).isMergedMattressGroup).toBe(true);

    // 3. Construção 3D de colchão 3 partes totalmente conectado em 1 peça inteira (0 costuras)
    const containerWhole = new THREE.Group();
    builder.buildMattress({
      container: containerWhole,
      w: 0.4,
      l: 1.7,
      h: 0.4,
      box: { ...boxBed, mattressParts: 3, mattressMergedGroups: [[0, 1, 2]] },
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
    const wholeCushions = containerWhole.children.filter((c) => (c.userData as any).isUpholstery);
    expect(wholeCushions.length).toBe(1);
    expect((wholeCushions[0].userData as any).dimW).toBeCloseTo(1.2, 3);
    // Sem costuras extras quando tudo está conectado em 1 peça
    expect(containerWhole.children.length).toBe(1);
  });

  it('connects adjacent mattress subparts across DIFFERENT bed modules (all-to-all) and rejects non-adjacent ones', () => {
    const bedFront: InternalBoxItem = {
      id: 'bed_front',
      name: 'Cama Frente',
      type: 'slat_bed',
      colStart: 2,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 2,
      heightMm: 400,
      color: '#d97706',
      material: 'plywood',
      slatBedDirection: 'left',
      slatExtensionPercent: 100,
      mattressParts: 2,
      isOpen: true,
      isBedOpen: true
    };
    const bedRear: InternalBoxItem = {
      id: 'bed_rear',
      name: 'Cama Trás',
      type: 'slat_bed',
      colStart: 2,
      colSpan: 1,
      rowStart: 2,
      rowSpan: 2,
      heightMm: 400,
      color: '#d97706',
      material: 'plywood',
      slatBedDirection: 'left',
      slatExtensionPercent: 100,
      mattressParts: 2,
      isOpen: true,
      isBedOpen: true
    };

    const subparts = computeAllVehicleMattressSubparts(grid, [bedFront, bedRear], 0);
    expect(subparts.length).toBe(4);

    const byId = new Map(subparts.map((s) => [s.id, s]));
    // Mesma coluna (frente e trás encostados em Z): adjacentes!
    expect(areSubpartsAdjacent(byId.get('bed_front::0')!, byId.get('bed_rear::0')!)).toBe(true);
    // Diagonal (não encostam em nenhum lado): NÃO adjacentes!
    expect(areSubpartsAdjacent(byId.get('bed_front::0')!, byId.get('bed_rear::1')!)).toBe(false);

    // Conectar diagonal deve falhar (null)
    expect(connectGlobalMattressSubparts(subparts, undefined, ['bed_front::0', 'bed_rear::1'])).toBeNull();

    // Conectar frente+trás entre módulos diferentes deve funcionar!
    const mergedGroups = connectGlobalMattressSubparts(subparts, undefined, ['bed_front::0', 'bed_rear::0']);
    expect(mergedGroups).toEqual([['bed_front::0', 'bed_rear::0']]);

    // Constrói no 3D via InternalBoxesBuilder com o grupo global conectado
    const boxesBuilder = new InternalBoxesBuilder();
    const gridWithGroups: InternalGridConfig = { ...grid, mattressMergedGroups: mergedGroups! };
    boxesBuilder.update(gridWithGroups, [bedFront, bedRear]);

    const upholsteryMeshes: THREE.Mesh[] = [];
    boxesBuilder.boxesGroup.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.isUpholstery) {
        upholsteryMeshes.push(obj);
      }
    });

    // 4 subpartes originais -> 2 unidas em 1 + 2 individuais = 3 peças finais no 3D!
    expect(upholsteryMeshes.length).toBe(3);
    const unified = upholsteryMeshes.find((m) => m.name.startsWith('UnifiedCrossModuleMattress_'));
    expect(unified).toBeDefined();
    expect(unified!.visible).toBe(true);
    // Comprimento total unido: 850mm + 850mm = 1700mm (1.70m)
    expect((unified!.userData as any).dimL).toBeCloseTo(1.7, 2);
    expect((unified!.userData as any).dimW).toBeCloseTo(0.4, 2);
    // Verifica que os detalhes 3D da junção das peças do grupo foram anexados na malha
    const junctionGroup = unified!.getObjectByName('MattressGroupJunctionDetails');
    expect(junctionGroup).toBeDefined();
    expect(junctionGroup!.children.length).toBeGreaterThan(0);
    expect(((unified!.userData as any).groupJunctionSegments || []).length).toBe(1);

    // Desconectar restaura tudo
    const afterDisconnect = disconnectGlobalMattressGroup(subparts, mergedGroups!, ['bed_front::0']);
    expect(afterDisconnect).toEqual([]);

    // 2. União em formato L (3 retângulos formando L) deve preservar polígono de 6 vértices (não virar retângulo 4 vértices)
    const lPolys = computeRectUnionPolygons(
      [
        { minX: 0, maxX: 400, minY: 0, maxY: 460 },
        { minX: 0, maxX: 400, minY: 460, maxY: 1310 },
        { minX: 400, maxX: 542, minY: 460, maxY: 1310 }
      ],
      5
    );
    expect(lPolys.length).toBe(1);
    expect(lPolys[0].length).toBe(6);
  });

  it('clamps open slat bed extension so slats and front leg never invade adjacent modules', () => {
    const boxesBuilder = new InternalBoxesBuilder();
    // Cenário real do usuário: Doblò 1200mm, armário esquerdo 450mm (+50mm extra),
    // corredor central 350mm, cama direita 400mm abrindo para a esquerda (+X)
    const leftCabinet: InternalBoxItem = {
      id: 'cab_left',
      name: 'Cozinha Esquerda',
      type: 'chest',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 2,
      extraWidthMm: 50,
      offsetXMm: -25, // face direita fica em +600 - 450 = +150mm
      heightMm: 400,
      color: '#f59e0b',
      material: 'plywood'
    };
    const rightBed: InternalBoxItem = {
      id: 'bed_right',
      name: 'Elétrica',
      type: 'slat_bed',
      colStart: 2,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 2,
      heightMm: 400,
      color: '#d97706',
      material: 'plywood',
      slatBedDirection: 'left',
      slatExtensionPercent: 100,
      isOpen: true,
      isBedOpen: true
    };

    boxesBuilder.update(grid, [leftCabinet, rightBed]);

    const bedContainer = boxesBuilder.boxesGroup.children.find(
      (c) => c.name === 'BoxContainer_bed_right'
    ) as THREE.Group;
    expect(bedContainer).toBeDefined();

    const slidingFrame = bedContainer.getObjectByName('SlatBedSlidingFrame') as THREE.Group;
    expect(slidingFrame).toBeDefined();

    // Caixa direita: x in [-0.60, -0.20]. Armário esquerdo: x in [+0.15, +0.60].
    // Vão livre = 0.35m (350mm). Com espessura t=15mm, slideOffsetX deve ser no máximo 0.335m (335mm),
    // fazendo a face externa das ripas e do painel frontal parar exatamente em +0.15m (0mm de invasão)!
    expect(slidingFrame.position.x).toBeLessThanOrEqual(0.35 - 0.015 + 0.002);
    const outerFaceWorldX = bedContainer.position.x + slidingFrame.position.x + 0.40 / 2 + 0.015;
    expect(outerFaceWorldX).toBeLessThanOrEqual(0.15 + 0.002);
  });

  it('does NOT cut mattress when upper cabinet starts at or above mattress top (e.g. taller module or gap >= mattress thickness)', () => {
    const builder = new SlatBedMattressBuilder();
    const container = new THREE.Group();

    const boxBed: InternalBoxItem = {
      id: 'bed_above_cab_test',
      name: 'Sofá-Cama',
      type: 'slat_bed',
      colStart: 2,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      mattressThicknessMm: 80, // topo do colchão em 480mm
      color: '#d97706',
      material: 'plywood',
      slatBedDirection: 'left',
      slatExtensionPercent: 100,
      mattressParts: 5,
      upperCabinet: true,
      upperCabinetAlign: 'right',
      upperCabinetDepthMm: 250,
      upperCabinetBottomGapMm: 80 // base do armário exatamente em 480mm (acima do colchão)
    };

    const neighborWithHighCabinet: InternalBoxItem = {
      id: 'neighbor_high_cab',
      name: 'Módulo Lateral c/ Aéreo Alto',
      type: 'chest',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 2,
      heightMm: 400, // mesma altura da cama
      color: '#f59e0b',
      material: 'plywood',
      upperCabinet: true,
      upperCabinetAlign: 'left',
      upperCabinetDepthMm: 250,
      upperCabinetBottomGapMm: 90 // base do aéreo em 490mm > 480mm (acima do topo do colchão)
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
      allBoxes: [boxBed, neighborWithHighCabinet],
      grid,
      isSelected: false
    });

    const cushions = container.children.filter((c) => (c.userData as any).isUpholstery);
    expect(cushions.length).toBe(5);
    cushions.forEach((c) => {
      expect((c.userData as any).hasCabinetCutout).toBe(false);
    });
  });

  it('extends cabinet cutout all the way to the mattress edge when remaining strip is thin (<= 80mm)', () => {
    const builder = new SlatBedMattressBuilder();
    const container = new THREE.Group();

    // Armário aéreo de 350mm de profundidade sobre almofada de 400mm:
    // Sobrariam apenas 50mm (uma "linha" fina) na borda — o corte deve ir até o final da borda!
    const boxBed: InternalBoxItem = {
      id: 'bed_thin_strip_test',
      name: 'Sofá-Cama',
      type: 'slat_bed',
      colStart: 2,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      mattressThicknessMm: 80,
      color: '#d97706',
      material: 'plywood',
      slatBedDirection: 'left',
      slatExtensionPercent: 100,
      mattressParts: 3,
      upperCabinet: true,
      upperCabinetAlign: 'right',
      upperCabinetDepthMm: 350, // sobraria 50mm na almofada de 400mm (<= 80mm)
      upperCabinetWidthMm: 800,
      upperCabinetBottomGapMm: 0
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

    // Almofada 1/3 (400x1700mm) tem recorte de 800mm em Z que agora atravessa 100% da largura (sem sobrar tirinha de 50mm),
    // resultando em um retângulo limpo de comprimento ~900mm (1700 - 800) e largura 400mm!
    const cushion1 = container.children.find((c) =>
      (c.userData as any).partLabel?.includes('Almofada 1/3')
    ) as THREE.Mesh;
    expect(cushion1).toBeDefined();
    expect((cushion1.userData as any).hasCabinetCutout).toBe(true);
    expect((cushion1.userData as any).dimL).toBeLessThan(1.0);
  });
});
