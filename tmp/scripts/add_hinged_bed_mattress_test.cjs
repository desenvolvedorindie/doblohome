const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('tests/hingedBedMode.test.ts');
let content = fs.readFileSync(targetPath, 'utf8');

const newTest = `
  it('12. Cama com dobradiça fechada eleva o colchão acima da folha articulada dobrada (sem colidir com a madeira)', () => {
    const builder = new SlatBedBuilder();
    const container = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial();
    const w = 0.40;
    const l = 1.70;
    const h = 0.40;
    const slatT = 0.015; // 15mm

    const boxHinged: InternalBoxItem = {
      id: 'box_hinged_mattress_height',
      name: 'Sofá-Cama Dobradiça Altura Colchão',
      type: 'slat_bed',
      bedMode: 'hinged',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      slatBedDirection: 'left',
      isOpen: false,
      mattressParts: 2,
      mattressThicknessMm: 120
    };

    builder.buildSlatBedModule(container, w, l, h, mat, boxHinged, false, false);

    // Encontra o grupo visual do colchão no modo sofá
    const visualGroup = container.getObjectByName('mattress_visual_sofa');
    expect(visualGroup).toBeDefined();

    // A camada inferior do colchão (Layer 1/2)
    const cushionMeshes: THREE.Mesh[] = [];
    visualGroup?.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.isUpholstery) {
        cushionMeshes.push(obj);
      }
    });

    expect(cushionMeshes.length).toBeGreaterThanOrEqual(1);

    // Ordena por Y para pegar a almofada inferior
    cushionMeshes.sort((a, b) => a.position.y - b.position.y);
    const bottomCushion = cushionMeshes[0];
    const dimH = bottomCushion.userData.dimH;
    const bottomY = bottomCushion.position.y - dimH / 2;

    // A base do colchão deve assentar EXATAMENTE sobre o topo da folha articulada dobrada:
    // Tampo fixo vai até h/2 = 0.200m
    // Folha dobrada vai de 0.200m a 0.200m + slatT = 0.215m
    const expectedTopSurfaceOfWood = h / 2 + slatT;
    expect(bottomY).toBeCloseTo(expectedTopSurfaceOfWood, 4);
  });
});
`;

content = content.replace(/\n\}\);\s*$/, newTest);
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully added hinged bed mattress height test!');
