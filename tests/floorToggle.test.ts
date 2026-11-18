import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { FloorAndGridBuilder } from '../src/three/boxes/FloorAndGridBuilder';
import { InternalGridConfig } from '../src/types/internalBoxes';
import { DEFAULT_INTERNAL_GRID } from '../src/data/internalBoxesPresets';

describe('Tampo de Baixo (Assoalho Base & Módulos)', () => {
  it('deve ocultar a chapa do assoalho base quando floorVisibleIn3D for false', () => {
    const floorGroup = new THREE.Group();
    const gridLinesGroup = new THREE.Group();
    const builder = new FloorAndGridBuilder(floorGroup, gridLinesGroup);

    // Caso 1: Visível por padrão
    const gridVisible: InternalGridConfig = {
      ...DEFAULT_INTERNAL_GRID,
      floorVisibleIn3D: true,
      hasFloor: true
    };
    builder.buildFloor(gridVisible, 1.2, 1.7, 0.48);
    expect(builder.floorMesh).toBeDefined();
    expect(builder.floorMesh?.visible).toBe(true);

    // Limpa grupo
    floorGroup.clear();

    // Caso 2: Oculto no 3D
    const gridHidden: InternalGridConfig = {
      ...DEFAULT_INTERNAL_GRID,
      floorVisibleIn3D: false,
      hasFloor: true
    };
    builder.buildFloor(gridHidden, 1.2, 1.7, 0.48);
    expect(builder.floorMesh).toBeDefined();
    expect(builder.floorMesh?.visible).toBe(false);

    // Limpa grupo
    floorGroup.clear();

    // Caso 3: Desativado no projeto
    const gridDisabled: InternalGridConfig = {
      ...DEFAULT_INTERNAL_GRID,
      hasFloor: false
    };
    builder.buildFloor(gridDisabled, 1.2, 1.7, 0.48);
    expect(builder.floorMesh).toBeUndefined();
  });
});
