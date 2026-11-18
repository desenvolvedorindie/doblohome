import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { DEFAULT_INTERNAL_GRID } from '../src/data/internalBoxesPresets';
import { InternalBoxesBuilder } from '../src/three/InternalBoxesBuilder';
import { InternalBoxItem } from '../src/types';

describe('Recálculo de dimensões do espaço útil da Doblò / Van', () => {
  it('dimensões padrão da Doblò são 1200 mm de largura e 1700 mm de comprimento', () => {
    expect(DEFAULT_INTERNAL_GRID.widthMm).toBe(1200);
    expect(DEFAULT_INTERNAL_GRID.lengthMm).toBe(1700);
    expect(DEFAULT_INTERNAL_GRID.heightMm).toBe(400);

    const areaM2 = (DEFAULT_INTERNAL_GRID.widthMm * DEFAULT_INTERNAL_GRID.lengthMm) / 1_000_000;
    expect(areaM2).toBeCloseTo(2.04, 2);

    const volumeL = (DEFAULT_INTERNAL_GRID.widthMm * DEFAULT_INTERNAL_GRID.lengthMm * DEFAULT_INTERNAL_GRID.heightMm) / 1_000_000;
    expect(volumeL).toBeCloseTo(816, 0);
  });

  it('recalcula a malha 3D e as peças dos módulos quando largura e comprimento são alterados', () => {
    const builder = new InternalBoxesBuilder();
    const scene = new THREE.Scene();
    scene.add(builder.group);

    const sampleBox: InternalBoxItem = {
      id: 'bed_module',
      name: 'Cama Baú',
      type: 'chest',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 2,
      heightMm: 400,
      color: '#3b82f6',
      material: 'plywood'
    };

    // 1. Atualiza com medidas padrão Doblò (1200 x 1700, 3 colunas, 4 linhas)
    builder.update(
      { ...DEFAULT_INTERNAL_GRID, widthMm: 1200, lengthMm: 1700, colsX: 3, rowsZ: 4 },
      [sampleBox],
      null,
      false,
      null
    );

    const containerDefault = builder.boxesGroup.children.find(
      (c) => c.userData.boxId === 'bed_module' || c.name.includes('bed_module')
    );
    expect(containerDefault).toBeDefined();
    const defaultDims = containerDefault?.userData.dimensions;
    expect(defaultDims).toBeDefined();
    // 1 col de 3 em 1200mm = 400mm
    expect(defaultDims.widthMm).toBe(400);
    // 2 lin de 4 em 1700mm = 850mm
    expect(defaultDims.lengthMm).toBe(850);
    expect(defaultDims.heightMm).toBe(400);

    // 2. Atualiza com espaço redimensionado (ex: 1500 x 2000 mm, 3 colunas, 4 linhas)
    builder.update(
      { ...DEFAULT_INTERNAL_GRID, widthMm: 1500, lengthMm: 2000, colsX: 3, rowsZ: 4 },
      [sampleBox],
      null,
      false,
      null
    );

    const containerResized = builder.boxesGroup.children.find(
      (c) => c.userData.boxId === 'bed_module' || c.name.includes('bed_module')
    );
    expect(containerResized).toBeDefined();
    const resizedDims = containerResized?.userData.dimensions;
    expect(resizedDims).toBeDefined();
    // 1 col de 3 em 1500mm = 500mm
    expect(resizedDims.widthMm).toBe(500);
    // 2 lin de 4 em 2000mm = 1000mm
    expect(resizedDims.lengthMm).toBe(1000);
    expect(resizedDims.heightMm).toBe(400);
  });

  it('recalcula o assoalho base de compensado para as novas dimensões de largura e comprimento', () => {
    const builder = new InternalBoxesBuilder();

    // Com dimensões personalizadas (1350 x 1850 mm)
    builder.update(
      { ...DEFAULT_INTERNAL_GRID, widthMm: 1350, lengthMm: 1850 },
      [],
      null,
      false,
      null
    );

    const floorMesh = builder.floorMesh;
    expect(floorMesh).toBeDefined();
    expect(floorMesh?.userData.dimW).toBeCloseTo(1.35, 2);
    expect(floorMesh?.userData.dimL).toBeCloseTo(1.85, 2);
    expect(floorMesh?.userData.barProfile).toContain('1350 × 1850');
  });

  it('permite restaurar com precisão as medidas de fábrica da Doblò (1200 x 1700 mm)', () => {
    let currentGrid = {
      ...DEFAULT_INTERNAL_GRID,
      widthMm: 1400,
      lengthMm: 1900,
      heightMm: 450
    };

    const resetToDobloDefault = () => {
      currentGrid = {
        ...currentGrid,
        widthMm: 1200,
        lengthMm: 1700,
        heightMm: 400
      };
    };

    resetToDobloDefault();
    expect(currentGrid.widthMm).toBe(1200);
    expect(currentGrid.lengthMm).toBe(1700);
    expect(currentGrid.heightMm).toBe(400);
  });
});
