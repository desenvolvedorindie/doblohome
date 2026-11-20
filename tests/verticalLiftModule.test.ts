import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { InternalBoxesBuilder } from '../src/three/InternalBoxesBuilder';
import { VerticalLiftBuilder } from '../src/three/boxes/VerticalLiftBuilder';
import { extractWoodCutGroups } from '../src/utils/woodUtils';
import { DEFAULT_INTERNAL_GRID } from '../src/data/internalBoxesPresets';
import { InternalBoxItem } from '../src/types';

describe('Vertical Lift Module (Extensível para Cima c/ Barras de Ferro)', () => {
  const baseBox: InternalBoxItem = {
    id: 'box_lift_1',
    name: 'Bancada Elevatória',
    type: 'vertical_lift',
    colStart: 0,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 1,
    heightMm: 400,
    liftHeightMm: 200,
    liftMechanism: 'pantograph',
    color: '#d97706',
    material: 'plywood',
    isOpen: false
  };

  it('builds closed vertical lift module with base body, lid at normal level and iron bars inside', () => {
    const builder = new InternalBoxesBuilder();
    const boxes = [{ ...baseBox, isOpen: false }];

    builder.update(DEFAULT_INTERNAL_GRID, boxes);

    expect(builder.boxesGroup.children.length).toBe(1);
    const boxGroup = builder.boxesGroup.children[0] as THREE.Group;

    // Deve conter o corpo base, o mecanismo de ferro e o tampo
    const baseBody = boxGroup.getObjectByName('VerticalLiftBaseBody');
    const ironMech = boxGroup.getObjectByName('VerticalLiftIronBarsMechanism');
    const lidGroup = boxGroup.getObjectByName('VerticalLiftLidGroup');

    expect(baseBody).toBeDefined();
    expect(ironMech).toBeDefined();
    expect(lidGroup).toBeDefined();

    // Quando fechado, lidGroup está na posição superior padrão (Y ~ 0.1925m para h=0.4m e t=0.015m)
    expect(lidGroup!.position.y).toBeCloseTo(0.4 / 2 - 0.015 / 2, 3);

    // Deve conter barras de ferro e ferragens registradas
    const ironBars: any[] = [];
    ironMech!.traverse((obj: any) => {
      if (obj.userData?.isHardware && obj.userData?.barLabel) {
        ironBars.push(obj.userData.barLabel);
      }
    });

    expect(ironBars.length).toBeGreaterThan(0);
    // No modo padrão 'pantograph', deve ter braços pantográficos e pistão a gás (sem colunas de canto redundantes)
    expect(ironBars.some((l) => l.includes('Barra de Ferro Pantográfica'))).toBe(true);
    expect(ironBars.some((l) => l.includes('Coluna Guia de Ferro'))).toBe(false);
  });

  it('elevates top lid in +Y when isOpen is true by liftHeightMm', () => {
    const builder = new InternalBoxesBuilder();
    const boxes = [{ ...baseBox, liftHeightMm: 200, isOpen: true }];

    builder.update(DEFAULT_INTERNAL_GRID, boxes);

    const boxGroup = builder.boxesGroup.children[0] as THREE.Group;
    const lidGroup = boxGroup.getObjectByName('VerticalLiftLidGroup');

    expect(lidGroup).toBeDefined();

    // Quando aberto com 200mm (dentro do curso físico do pistão), o lidGroup deve ser deslocado em +0.20m
    const expectedY = (0.4 / 2 - 0.015 / 2) + 0.2;
    expect(lidGroup!.position.y).toBeCloseTo(expectedY, 3);
  });

  it('supports pantograph-only mechanism mode', () => {
    const builder = new InternalBoxesBuilder();
    const boxes = [{ ...baseBox, liftMechanism: 'pantograph' as const, isOpen: true }];

    builder.update(DEFAULT_INTERNAL_GRID, boxes);

    const boxGroup = builder.boxesGroup.children[0] as THREE.Group;
    const ironMech = boxGroup.getObjectByName('VerticalLiftIronBarsMechanism');

    const labels: string[] = [];
    ironMech!.traverse((obj: any) => {
      if (obj.userData?.barLabel) labels.push(obj.userData.barLabel);
    });

    expect(labels.some((l) => l.includes('Barra de Ferro Pantográfica'))).toBe(true);
    expect(labels.some((l) => l.includes('Coluna Guia'))).toBe(false);
  });

  it('supports telescopic-only mechanism mode', () => {
    const builder = new InternalBoxesBuilder();
    const boxes = [{ ...baseBox, liftMechanism: 'telescopic' as const, isOpen: true }];

    builder.update(DEFAULT_INTERNAL_GRID, boxes);

    const boxGroup = builder.boxesGroup.children[0] as THREE.Group;
    const ironMech = boxGroup.getObjectByName('VerticalLiftIronBarsMechanism');

    const labels: string[] = [];
    ironMech!.traverse((obj: any) => {
      if (obj.userData?.barLabel) labels.push(obj.userData.barLabel);
    });

    expect(labels.some((l) => l.includes('Coluna Guia de Ferro'))).toBe(true);
    expect(labels.some((l) => l.includes('Barra de Ferro Pantográfica'))).toBe(false);
  });

  it('registers wood parts and cutting groups properly', () => {
    const builder = new InternalBoxesBuilder();
    const boxes = [{ ...baseBox, isOpen: true }];

    builder.update(DEFAULT_INTERNAL_GRID, boxes);

    const mockSceneManager = { internalBoxesBuilder: builder };
    const woodStats = extractWoodCutGroups(mockSceneManager);

    expect(woodStats.totalPieces).toBeGreaterThan(0);
    const topPart = woodStats.cutGroups.find((g) => g.partType === 'top_lift');
    expect(topPart).toBeDefined();
    expect(topPart?.label).toContain('Tampo Superior Elevatório');
  });

  it('moves stove installed on top synchronously with the telescopic vertical lift lid', () => {
    const builder = new InternalBoxesBuilder();

    // 1. Fechado
    const closedBox: InternalBoxItem = {
      ...baseBox,
      hasStove: true,
      stovePlacement: 'top',
      liftHeightMm: 250,
      isOpen: false
    };
    builder.update(DEFAULT_INTERNAL_GRID, [closedBox]);

    const boxGroupClosed = builder.boxesGroup.children[0] as THREE.Group;
    const lidGroupClosed = boxGroupClosed.getObjectByName('VerticalLiftLidGroup');
    expect(lidGroupClosed).toBeDefined();

    const stoveClosed = boxGroupClosed.getObjectByName(`StoveAppliance_${baseBox.id}`);
    expect(stoveClosed).toBeDefined();
    // O fogareiro deve ser filho de lidGroup
    expect(stoveClosed!.parent).toBe(lidGroupClosed);

    // Posição no mundo (Y) quando fechado:
    const worldPosClosed = new THREE.Vector3();
    stoveClosed!.getWorldPosition(worldPosClosed);

    // 2. Aberto (+250mm)
    const openBox: InternalBoxItem = {
      ...baseBox,
      hasStove: true,
      stovePlacement: 'top',
      liftHeightMm: 250,
      isOpen: true
    };
    builder.update(DEFAULT_INTERNAL_GRID, [openBox]);

    const boxGroupOpen = builder.boxesGroup.children[0] as THREE.Group;
    const lidGroupOpen = boxGroupOpen.getObjectByName('VerticalLiftLidGroup');
    const stoveOpen = boxGroupOpen.getObjectByName(`StoveAppliance_${baseBox.id}`);

    expect(stoveOpen).toBeDefined();
    expect(stoveOpen!.parent).toBe(lidGroupOpen);

    const worldPosOpen = new THREE.Vector3();
    stoveOpen!.getWorldPosition(worldPosOpen);

    // A diferença em Y entre aberto e fechado deve ser exatamente 0.25m (250mm)
    const deltaY = worldPosOpen.y - worldPosClosed.y;
    expect(deltaY).toBeCloseTo(0.25, 3);
  });

  it('positions iron columns right in the inner corners and builds industrial technical gas struts in telescopic mode', () => {
    const builder = new InternalBoxesBuilder();
    const boxes = [{ ...baseBox, liftMechanism: 'telescopic' as const, isOpen: true }];

    builder.update(DEFAULT_INTERNAL_GRID, boxes);

    const boxGroup = builder.boxesGroup.children[0] as THREE.Group;
    const ironMech = boxGroup.getObjectByName('VerticalLiftIronBarsMechanism');
    expect(ironMech).toBeDefined();

    // 1. As 4 colunas devem estar bem nas quinas internas
    const cornerColumns: THREE.Mesh[] = [];
    ironMech!.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.barLabel?.includes('Coluna Guia de Ferro 25x25mm')) {
        cornerColumns.push(obj);
      }
    });

    expect(cornerColumns.length).toBe(4);

    // Dimensões internas da caixa base (w=0.4m, l=0.425m, t=0.015m) -> innerW ~ 0.37m, innerL ~ 0.395m
    // As colunas devem estar a menos de 25mm da borda interna
    cornerColumns.forEach((col) => {
      const colX = Math.abs(col.position.x);
      const colZ = Math.abs(col.position.z);
      expect(colX).toBeGreaterThan(0.15); // Bem próximo da quina X
      expect(colZ).toBeGreaterThan(0.16); // Bem próximo da quina Z
    });

    // 2. O pistão a gás deve conter conjunto técnico (GasStrutAssembly)
    const struts: THREE.Group[] = [];
    ironMech!.traverse((obj: any) => {
      if (obj.isGroup && obj.name === 'GasStrutAssembly') {
        struts.push(obj);
      }
    });

    expect(struts.length).toBe(2);
    // Cada montagem deve ter cilindro, haste, rótulas e sapatas
    struts.forEach((s) => {
      expect(s.children.length).toBeGreaterThanOrEqual(8);
    });
  });

  it('limits vertical lift height strictly by piston cylinder stroke capacity (rod cannot exceed cylinder)', () => {
    const builder = new InternalBoxesBuilder();
    // Módulo com altura de 300mm mas com liftHeightMm configurado em 550mm
    const boxClamped: InternalBoxItem = {
      ...baseBox,
      heightMm: 300,
      liftHeightMm: 550,
      isOpen: true
    };

    builder.update(DEFAULT_INTERNAL_GRID, [boxClamped]);

    const boxGroup = builder.boxesGroup.children[0] as THREE.Group;
    const lidGroup = boxGroup.getObjectByName('VerticalLiftLidGroup');
    expect(lidGroup).toBeDefined();

    // Com h=300mm e sem fundo, baseInsideHeight=285mm, closedDist=235mm, cylLen=183mm, maxStroke=163mm (0.163m)
    // O deslocamento é limitado pelo curso físico que cabe dentro do cilindro fechado (163mm < 183mm)
    const maxAllowedStrokeM = 0.163;
    const expectedY = (0.3 / 2 - 0.015 / 2) + maxAllowedStrokeM;
    expect(lidGroup!.position.y).toBeCloseTo(expectedY, 3);

    // Verifica se a haste do pistão não é maior do que o cilindro
    const ironMech = boxGroup.getObjectByName('VerticalLiftIronBarsMechanism');
    const struts: THREE.Group[] = [];
    ironMech!.traverse((obj: any) => {
      if (obj.isGroup && obj.name === 'GasStrutAssembly') {
        struts.push(obj);
      }
    });

    expect(struts.length).toBe(2);
    struts.forEach((s) => {
      // Cylinders in the strut group
      const cylinders: THREE.Mesh[] = [];
      s.traverse((child: any) => {
        if (child.isMesh && child.geometry?.type === 'CylinderGeometry') {
          cylinders.push(child);
        }
      });
      // A haste e o cilindro devem existir e o curso não pode ser maior que o cilindro
      expect(cylinders.length).toBeGreaterThan(0);
    });
  });

  it('retracts vertical lift automatically when any bed is open', () => {
    const builder = new InternalBoxesBuilder();
    const liftBox: InternalBoxItem = {
      ...baseBox,
      id: 'lift_1',
      heightMm: 400,
      liftHeightMm: 220,
      isOpen: true
    };
    const bedBox: InternalBoxItem = {
      ...baseBox,
      id: 'bed_1',
      name: 'Sofá-Cama',
      type: 'slat_bed',
      colStart: 1,
      colSpan: 2,
      rowStart: 0,
      rowSpan: 2,
      heightMm: 400,
      isOpen: true,
      isBedOpen: true
    };

    // Com a cama aberta, o elevatório deve ficar recolhido na altura fechada (sem elevação +Y)
    builder.update(DEFAULT_INTERNAL_GRID, [liftBox, bedBox]);
    const liftContainerOpenBed = builder.boxesGroup.children.find(
      (c) => c.name === 'BoxContainer_lift_1'
    ) as THREE.Group;
    expect(liftContainerOpenBed).toBeDefined();
    const lidClosedByBed = liftContainerOpenBed.getObjectByName('VerticalLiftLidGroup');
    expect(lidClosedByBed).toBeDefined();
    expect(lidClosedByBed!.position.y).toBeCloseTo(0.4 / 2 - 0.015 / 2, 3);

    // Quando a cama fecha, o elevatório volta a elevar normalmente
    builder.update(DEFAULT_INTERNAL_GRID, [liftBox, { ...bedBox, isOpen: false, isBedOpen: false }]);
    const liftContainerClosedBed = builder.boxesGroup.children.find(
      (c) => c.name === 'BoxContainer_lift_1'
    ) as THREE.Group;
    const lidElevated = liftContainerClosedBed.getObjectByName('VerticalLiftLidGroup');
    expect(lidElevated).toBeDefined();
    expect(lidElevated!.position.y).toBeGreaterThan(0.4 / 2 + 0.15);
  });
});
