import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { InternalBoxesBuilder } from '../src/three/InternalBoxesBuilder';
import { ModuleCollisionChecker } from '../src/three/boxes/ModuleCollisionChecker';
import { DEFAULT_INTERNAL_GRID } from '../src/data/internalBoxesPresets';
import type { InternalBoxItem } from '../src/types/internalBoxes';

function makeBox(over: Partial<InternalBoxItem>): InternalBoxItem {
  return {
    id: 'b1',
    name: 'Módulo Teste',
    type: 'chest',
    colStart: 0,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 1,
    heightMm: 450,
    color: '#2563eb',
    material: 'plywood',
    ...over
  };
}

function run(boxes: InternalBoxItem[], cols = 2) {
  const builder = new InternalBoxesBuilder();
  const scene = new THREE.Scene();
  scene.add(builder.group);
  builder.update({ ...DEFAULT_INTERNAL_GRID, colsX: cols, rowsZ: 2 }, boxes, null, false, null);
  return ModuleCollisionChecker.check(builder.boxesGroup, boxes);
}

describe('Checagem de colisão dos componentes nos módulos', () => {
  it('módulo sem componentes não gera problemas', () => {
    const r = run([makeBox({})]);
    expect(r.issues).toHaveLength(0);
    expect(r.componentsChecked).toBe(0);
  });

  it('bateria grande demais para o módulo é detectada como colisão com o móvel', () => {
    const r = run([
      makeBox({
        electronics: [{ id: 'battery', mountFace: 'bottom', position: 'center', rotationDeg: 0 }]
      })
    ], 6);
    const outside = r.issues.filter((i) => i.kind === 'outside');
    // Célula de ~200 mm de largura é estreita demais para a bateria de 270 mm
    expect(r.componentsChecked).toBe(1);
    expect(outside.length).toBeGreaterThan(0);
  });

  it('dois componentes sobrepostos no mesmo ponto colidem entre si', () => {
    const r = run([
      makeBox({
        colSpan: 2,
        rowSpan: 2,
        electronics: [
          { id: 'battery', mountFace: 'bottom', position: 'center', rotationDeg: 0 },
          { id: 'b2b', mountFace: 'bottom', position: 'center', rotationDeg: 0 }
        ]
      })
    ]);
    expect(r.issues.some((i) => i.kind === 'overlap')).toBe(true);
    expect(r.affectedBoxIds).toContain('b1');
  });

  it('componentes afastados em módulo grande não colidem', () => {
    const r = run([
      makeBox({
        colSpan: 2,
        rowSpan: 2,
        electronics: [
          { id: 'battery', mountFace: 'bottom', position: 'rear_left', rotationDeg: 0 },
          { id: 'mppt', mountFace: 'left_wall', position: 'top_center', rotationDeg: 0 }
        ]
      })
    ]);
    expect(r.issues.filter((i) => i.kind === 'overlap')).toHaveLength(0);
  });

  it('deslocamento customizado que empurra o componente para fora é detectado', () => {
    const r = run([
      makeBox({
        colSpan: 2,
        rowSpan: 2,
        electronics: [
          { id: 'battery', mountFace: 'bottom', position: 'center', rotationDeg: 0, customOffsetXmm: 900 }
        ]
      })
    ]);
    expect(r.issues.some((i) => i.kind === 'outside')).toBe(true);
  });

  it('MPPT instalado em todas as paredes e posições não colide com o dissipador de alumínio na parede', () => {
    const faces = ['bottom', 'rear_wall', 'front_wall', 'left_wall', 'right_wall'] as const;
    const positions = ['top_left', 'top_center', 'top_right', 'mid_center', 'bottom_left', 'bottom_center', 'bottom_right'] as const;
    for (const face of faces) {
      for (const pos of positions) {
        const r = run([
          makeBox({
            colSpan: 2,
            rowSpan: 2,
            electronics: [{ id: 'mppt', mountFace: face, position: pos, rotationDeg: 0 }]
          })
        ]);
        expect(r.issues, `face=${face} pos=${pos}: ${r.issues.map((i) => i.detail).join('; ')}`).toHaveLength(0);
      }
    }
  });

  it('destaca e restaura os objetos ao passar o mouse (hover) na lista de colisão', () => {
    const builder = new InternalBoxesBuilder();
    const scene = new THREE.Scene();
    scene.add(builder.group);
    const boxes = [
      makeBox({
        colSpan: 2,
        rowSpan: 2,
        electronics: [
          { id: 'battery', mountFace: 'bottom', position: 'center', rotationDeg: 0 },
          { id: 'b2b', mountFace: 'bottom', position: 'center', rotationDeg: 0 }
        ]
      })
    ];
    builder.update({ ...DEFAULT_INTERNAL_GRID, colsX: 2, rowsZ: 2 }, boxes, null, false, null);
    const r = ModuleCollisionChecker.check(builder.boxesGroup, boxes);
    const issue = r.issues.find((i) => i.kind === 'overlap')!;
    expect(issue.objectA).toBeDefined();
    expect(issue.objectB).toBeDefined();

    ModuleCollisionChecker.setHoverFocus([issue.objectA!, issue.objectB!], scene);
    expect(scene.children.some((c) => c.name === '__collision_hover_helper')).toBe(true);

    ModuleCollisionChecker.clearHoverFocus();
    expect(scene.children.some((c) => c.name === '__collision_hover_helper')).toBe(false);
  });

  it('aplica acréscimo de largura/comprimento e espessura customizada de porta e bandeja corrediça', () => {
    const builder = new InternalBoxesBuilder();
    const scene = new THREE.Scene();
    scene.add(builder.group);
    const box = makeBox({
      type: 'slide_tray',
      drawerMode: 'slide_tray',
      extraWidthMm: 80,
      extraLengthMm: -40,
      offsetXMm: 20,
      offsetZMm: -15,
      upperCabinet: true,
      upperCabinetClosure: 'sliding_doors',
      panelThickness: {
        door: 9,
        tray: 18
      }
    });
    builder.update({ ...DEFAULT_INTERNAL_GRID, widthMm: 1200, lengthMm: 1600, colsX: 2, rowsZ: 2 }, [box], null, false, null);
    const container = builder.boxesGroup.children[0];
    // Base cell: 600x800mm -> com +80 e -40 = 680x760mm
    expect(container.userData.dimensions.widthMm).toBe(680);
    expect(container.userData.dimensions.lengthMm).toBe(760);

    const trayMeshes: THREE.Mesh[] = [];
    const doorMeshes: THREE.Mesh[] = [];
    container.traverse((c: any) => {
      if (c.isMesh && c.userData?.partType === 'tray') trayMeshes.push(c);
      if (c.isMesh && c.userData?.partType === 'door') doorMeshes.push(c);
    });
    expect(trayMeshes.length).toBeGreaterThan(0);
    expect(trayMeshes[0].userData.thicknessMm).toBe(18);
    expect(doorMeshes.length).toBeGreaterThan(0);
    expect(doorMeshes[0].userData.thicknessMm).toBe(9);
  });

  it('destaca apenas os componentes colididos e NÃO o módulo de madeira em si', () => {
    const builder = new InternalBoxesBuilder();
    const scene = new THREE.Scene();
    scene.add(builder.group);
    const box = makeBox({
      colSpan: 2,
      rowSpan: 2,
      electronics: [
        { id: 'battery', mountFace: 'bottom', position: 'center', rotationDeg: 0 },
        { id: 'b2b', mountFace: 'bottom', position: 'center', rotationDeg: 0 }
      ]
    });
    builder.update({ ...DEFAULT_INTERNAL_GRID, colsX: 2, rowsZ: 2 }, [box], null, false, null);
    const r = ModuleCollisionChecker.check(builder.boxesGroup, [box]);
    const issue = r.issues.find((i) => i.kind === 'overlap')!;
    const container = builder.boxesGroup.children[0];

    // Colete um mesh de madeira do baú
    let woodMesh: THREE.Mesh | null = null;
    container.traverse((c: any) => {
      if (c.isMesh && c.userData?.isWoodPart) woodMesh = c;
    });
    expect(woodMesh).not.toBeNull();
    const origWoodMat = woodMesh!.material;

    // Quando setHoverFocus for chamado mesmo com container na lista (ou os objetos colididos)
    ModuleCollisionChecker.setHoverFocus([issue.objectA!, issue.objectB!, container], scene);

    // O mesh de madeira NÃO deve ter o material de destaque hover aplicado
    expect(woodMesh!.material).toBe(origWoodMat);

    // Já os componentes devem ter sido destacados
    let componentMesh: THREE.Mesh | null = null;
    issue.objectA!.traverse((c: any) => {
      if (c.isMesh && !c.userData?.isScrew && !c.userData?.isWoodPart) componentMesh = c;
    });
    expect(componentMesh).not.toBeNull();
    expect(componentMesh!.material).not.toBe(origWoodMat);

    ModuleCollisionChecker.clearHoverFocus();
  });
});
