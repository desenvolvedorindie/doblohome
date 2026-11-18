import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { InternalBoxesBuilder } from '../src/three/InternalBoxesBuilder';
import { ChestBuilder } from '../src/three/boxes/ChestBuilder';
import { DEFAULT_INTERNAL_GRID } from '../src/data/internalBoxesPresets';
import { InternalBoxItem } from '../src/types';

describe('Beradinha anti-queda em todas as prateleiras de nichos', () => {
  it('1. Armário aéreo nicho aberto (upperCabinetClosure: "open") adiciona beradinha em toda prateleira', () => {
    const builder = new InternalBoxesBuilder();

    const boxAereoNicho: InternalBoxItem = {
      id: 'box_aereo_nicho',
      name: 'Aéreo Nicho',
      type: 'chest',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 2,
      heightMm: 400,
      color: '#d4a373',
      material: 'plywood',
      upperCabinet: true,
      upperCabinetAlign: 'rear',
      upperCabinetClosure: 'open',
      upperCabinetShelves: 2 // 2 prateleiras internas
    };

    builder.update(DEFAULT_INTERNAL_GRID, [boxAereoNicho], null, false, null);

    const cabinetGroup = builder.boxesGroup.getObjectByName(`UpperCabinet_${boxAereoNicho.id}_rear`);
    expect(cabinetGroup).toBeDefined();

    const lipPanels: THREE.Mesh[] = [];
    cabinetGroup?.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.partLabel?.includes('Friso Anti-Queda')) {
        lipPanels.push(obj);
      }
    });

    // Deve ter 1 friso na base + 1 friso para cada prateleira (2 prateleiras = 3 frisos no total)
    expect(lipPanels.length).toBe(3);

    const baseLip = lipPanels.find((p) => p.userData?.partLabel?.includes('Base'));
    expect(baseLip).toBeDefined();

    const shelf1Lip = lipPanels.find((p) => p.userData?.partLabel?.includes('Prateleira #1'));
    expect(shelf1Lip).toBeDefined();

    const shelf2Lip = lipPanels.find((p) => p.userData?.partLabel?.includes('Prateleira #2'));
    expect(shelf2Lip).toBeDefined();

    // Cada friso deve ter altura de 25mm (0.025m)
    const shelf1Geo = shelf1Lip!.geometry as THREE.BoxGeometry;
    expect(shelf1Geo.parameters.height).toBeCloseTo(0.025, 3);
  });

  it('2. Nicho aberto inferior (type: "open") com prateleiras adiciona beradinha em cada prateleira', () => {
    const chestBuilder = new ChestBuilder();
    const container = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial();

    const boxBaseNicho: InternalBoxItem = {
      id: 'box_base_nicho',
      name: 'Nicho Aberto',
      type: 'open',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      heightMm: 400,
      color: '#d4a373',
      material: 'plywood',
      openShelves: 2,
      panels: {
        top: true,
        bottom: true,
        left: true,
        right: true,
        front: false, // Aberto para a frente
        rear: true
      }
    };

    chestBuilder.buildChestModule(container, 0.4, 0.4, 0.4, mat, boxBaseNicho, false, false);

    const shelves: THREE.Mesh[] = [];
    const lips: THREE.Mesh[] = [];

    container.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.partType === 'shelf') {
        shelves.push(obj);
      }
      if (obj.isMesh && obj.userData?.partType === 'lip') {
        lips.push(obj);
      }
    });

    expect(shelves.length).toBe(2);
    // Deve ter beradinhas anti-queda na frente para as 2 prateleiras e para a base
    expect(lips.length).toBe(3);

    const shelf1Lip = lips.find((l) => l.userData?.shelfIndex === 1);
    expect(shelf1Lip).toBeDefined();

    const shelf2Lip = lips.find((l) => l.userData?.shelfIndex === 2);
    expect(shelf2Lip).toBeDefined();

    const shelf1LipGeo = shelf1Lip!.geometry as THREE.BoxGeometry;
    expect(shelf1LipGeo.parameters.height).toBeCloseTo(0.025, 3);
  });
});
