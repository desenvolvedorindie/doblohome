const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, target, replacement) {
  const fullPath = path.resolve(filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedTarget = target.replace(/\r\n/g, '\n');
  const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

  if (!normalizedContent.includes(normalizedTarget)) {
    throw new Error(`Target not found in ${filePath}:\n"${normalizedTarget.slice(0, 100)}..."`);
  }

  const newContent = normalizedContent.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(fullPath, newContent, 'utf8');
  console.log(`Successfully updated ${filePath}`);
}

// 1. Update tests/moduleFocusHover.test.ts
replaceInFile(
  'tests/moduleFocusHover.test.ts',
`  it('ghosts other boxes, floor, and ceiling when a module is entered via selectedBoxId or isolatedBoxId', () => {
    const builder = new InternalBoxesBuilder();
    const grid = { ...DEFAULT_INTERNAL_GRID };
    const boxes = INTERNAL_BOXES_PRESETS[0].boxes;

    // Entra no módulo apenas via selectedBoxId (clique simples no 3D/grid/lista)
    builder.update(grid, boxes, 'box_power_1', false, null);

    expect(builder.isolatedBoxId).toBe('box_power_1');
    expect(builder.selectedBoxId).toBe('box_power_1');

    const activeBox = builder.boxesGroup.getObjectByName('BoxContainer_box_power_1')!;
    const otherBox = builder.boxesGroup.getObjectByName('BoxContainer_box_clothes_2')!;

    expect(activeBox).toBeDefined();
    expect(otherBox).toBeDefined();

    // Módulo ativo NÃO tem hitbox externa bloqueando as peças internas
    const activeOuterHitbox = activeBox.children.find((c) => c.name === '__box_hitbox');
    expect(activeOuterHitbox).toBeUndefined();

    // Peças de madeira do módulo ativo mantêm cor natural (não são pintadas de 0x38bdf8)
    let activeWoodCount = 0;
    activeBox.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.isWoodPart) {
        activeWoodCount++;
        expect(obj.userData?.isGhost).toBeUndefined();
        const mat = obj.material as THREE.MeshStandardMaterial;
        expect(mat.color.getHex()).not.toBe(0x38bdf8);
      }
    });
    expect(activeWoodCount).toBeGreaterThanOrEqual(4);

    // Outros módulos, piso e teto viram fantasmas
    let ghostMeshChecked = 0;
    otherBox.traverse((obj: any) => {
      if (obj.isMesh && obj.name !== '__box_hitbox') {
        ghostMeshChecked++;
        expect(obj.userData?.isGhost).toBe(true);
        const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
        expect(mat.transparent).toBe(true);
        expect(mat.opacity).toBeLessThanOrEqual(0.1);
      }
    });
    expect(ghostMeshChecked).toBeGreaterThan(0);

    builder.floorGroup.traverse((obj: any) => {
      if (obj.isMesh) {
        expect(obj.userData?.isGhost).toBe(true);
        expect((obj.material as any).opacity).toBeLessThanOrEqual(0.1);
      }
    });
    builder.ceilingGroup.traverse((obj: any) => {
      if (obj.isMesh) {
        expect(obj.userData?.isGhost).toBe(true);
        expect((obj.material as any).opacity).toBeLessThanOrEqual(0.1);
      }
    });
  });`,
`  it('single click (selectedBoxId) selects module for editing without isolating or ghosting others', () => {
    const builder = new InternalBoxesBuilder();
    const grid = { ...DEFAULT_INTERNAL_GRID };
    const boxes = INTERNAL_BOXES_PRESETS[0].boxes;

    // 1 clique apenas seleciona para edição
    builder.update(grid, boxes, 'box_power_1', false, null);

    expect(builder.isolatedBoxId).toBeNull();
    expect(builder.selectedBoxId).toBe('box_power_1');

    const otherBox = builder.boxesGroup.getObjectByName('BoxContainer_box_clothes_2')!;
    expect(otherBox).toBeDefined();

    // Outros módulos NÃO devem virar fantasmas
    otherBox.traverse((obj: any) => {
      if (obj.isMesh) {
        expect(obj.userData?.isGhost).toBeFalsy();
      }
    });

    // Piso e teto NÃO devem virar fantasmas
    builder.floorGroup.traverse((obj: any) => {
      if (obj.isMesh) {
        expect(obj.userData?.isGhost).toBeFalsy();
      }
    });
  });

  it('double click (isolatedBoxId) isolates the module and ghosts other boxes, floor, and ceiling', () => {
    const builder = new InternalBoxesBuilder();
    const grid = { ...DEFAULT_INTERNAL_GRID };
    const boxes = INTERNAL_BOXES_PRESETS[0].boxes;

    // 2 cliques isolam o módulo
    builder.update(grid, boxes, 'box_power_1', false, 'box_power_1');

    expect(builder.isolatedBoxId).toBe('box_power_1');
    expect(builder.selectedBoxId).toBe('box_power_1');

    const activeBox = builder.boxesGroup.getObjectByName('BoxContainer_box_power_1')!;
    const otherBox = builder.boxesGroup.getObjectByName('BoxContainer_box_clothes_2')!;

    expect(activeBox).toBeDefined();
    expect(otherBox).toBeDefined();

    // Módulo ativo NÃO tem hitbox externa bloqueando as peças internas
    const activeOuterHitbox = activeBox.children.find((c) => c.name === '__box_hitbox');
    expect(activeOuterHitbox).toBeUndefined();

    // Peças de madeira do módulo ativo mantêm cor natural (não são pintadas de 0x38bdf8)
    let activeWoodCount = 0;
    activeBox.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.isWoodPart) {
        activeWoodCount++;
        expect(obj.userData?.isGhost).toBeUndefined();
        const mat = obj.material as THREE.MeshStandardMaterial;
        expect(mat.color.getHex()).not.toBe(0x38bdf8);
      }
    });
    expect(activeWoodCount).toBeGreaterThanOrEqual(4);

    // Outros módulos, piso e teto viram fantasmas
    let ghostMeshChecked = 0;
    otherBox.traverse((obj: any) => {
      if (obj.isMesh && obj.name !== '__box_hitbox') {
        ghostMeshChecked++;
        expect(obj.userData?.isGhost).toBe(true);
        const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
        expect(mat.transparent).toBe(true);
        expect(mat.opacity).toBeLessThanOrEqual(0.1);
      }
    });
    expect(ghostMeshChecked).toBeGreaterThan(0);

    builder.floorGroup.traverse((obj: any) => {
      if (obj.isMesh) {
        expect(obj.userData?.isGhost).toBe(true);
        expect((obj.material as any).opacity).toBeLessThanOrEqual(0.1);
      }
    });
    builder.ceilingGroup.traverse((obj: any) => {
      if (obj.isMesh) {
        expect(obj.userData?.isGhost).toBe(true);
        expect((obj.material as any).opacity).toBeLessThanOrEqual(0.1);
      }
    });
  });`
);

// 2. Add hinge gap test in tests/hingedBedMode.test.ts
const hingedFile = path.resolve('tests/hingedBedMode.test.ts');
let hingedContent = fs.readFileSync(hingedFile, 'utf8');
if (!hingedContent.includes('hingeGap')) {
  const targetEnd = '});\n';
  const lastIndex = hingedContent.lastIndexOf(targetEnd);
  if (lastIndex !== -1) {
    const addition = `  it('11. Cama articulada possui folga (hingeGap) entre o tampo fixo e a folha móvel para compensar a dobradiça', () => {
    const builder = new SlatBedBuilder();
    const container = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial();
    const w = 0.45;
    const l = 0.90;
    const h = 0.40;

    const box: InternalBoxItem = {
      id: 'box_hinge_gap_test',
      name: 'Baú Cama Dobradiça Folga',
      type: 'chest',
      hasBed: true,
      bedMode: 'hinged',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      slatBedDirection: 'left',
      isOpen: true
    };

    builder.buildSlatBedModule(container, w, l, h, mat, box, false, true);

    const pivot = container.getObjectByName('HingedBedPivot') as THREE.Group;
    expect(pivot).toBeDefined();

    // Hinge pivot X está em w/2 + hingeGap/2
    // w = 0.45 -> w/2 = 0.225. Com hingeGap = 0.003, hingeX = 0.225 + 0.0015 = 0.2265
    expect(pivot.position.x).toBeCloseTo(0.2265, 4);

    let foldingLeaf: THREE.Mesh | null = null;
    pivot.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.name?.includes('Folha Articulada')) {
        foldingLeaf = obj;
      }
    });
    expect(foldingLeaf).toBeDefined();
  });
});
`;
    hingedContent = hingedContent.slice(0, lastIndex) + addition;
    fs.writeFileSync(hingedFile, hingedContent, 'utf8');
    console.log(`Successfully added hinge gap test to ${hingedFile}`);
  }
}
