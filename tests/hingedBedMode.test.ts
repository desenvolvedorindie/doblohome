import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { SlatBedBuilder } from '../src/three/boxes/SlatBedBuilder';
import { InternalBoxItem } from '../src/types';
import { extractWoodCutGroups } from '../src/utils/woodUtils';

describe('Suporte aos 2 modos de Cama: Retrátil com Ripas vs Articulada com Dobradiça', () => {
  const w = 0.40;
  const l = 1.70;
  const h = 0.40;
  const mat = new THREE.MeshStandardMaterial({ color: 0xd97706 });

  it('1. Cama com dobradiça (bedMode: "hinged") constrói tampo fixo base, folha articulada e dobradiças', () => {
    const builder = new SlatBedBuilder();
    const container = new THREE.Group();

    const boxHinged: InternalBoxItem = {
      id: 'box_bed_hinged',
      name: 'Sofá-Cama Dobradiça',
      type: 'slat_bed',
      bedMode: 'hinged',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      slatBedDirection: 'left',
      isOpen: false
    };

    builder.buildSlatBedModule(container, w, l, h, mat, boxHinged, false, false);

    // Deve ter a folha pivotante com dobradiça
    const pivot = container.getObjectByName('HingedBedPivot') as THREE.Group;
    expect(pivot).toBeDefined();
    expect(pivot.rotation.z).toBe(0); // Fechada

    // Verifica que contém os painéis nomeados de cama dobradiça
    const panelNames: string[] = [];
    container.traverse((obj) => {
      if (obj.userData?.partLabel) panelNames.push(obj.userData.partLabel);
      if (obj.userData?.name) panelNames.push(obj.userData.name);
    });

    const hasBaseLid = panelNames.some((n) => n.includes('Tampo Fixo Base'));
    const hasFoldingLeaf = panelNames.some((n) => n.includes('Folha Articulada'));
    const hasLegsClosed = panelNames.some((n) => n.includes('Pé de Apoio') || n.includes('Pé Articulado'));
    expect(hasBaseLid).toBe(true);
    expect(hasFoldingLeaf).toBe(true);
    expect(hasLegsClosed).toBe(true); // Pés articulados ficam rebatidos na folha para constar no plano de corte e marcenaria mesmo quando fechada

    // Quando aberta (isOpen = true), o pivot rebate 180 graus (Math.PI) e os pés aparecem
    const containerOpen = new THREE.Group();
    builder.buildSlatBedModule(containerOpen, w, l, h, mat, { ...boxHinged, isOpen: true }, false, true);
    const pivotOpen = containerOpen.getObjectByName('HingedBedPivot') as THREE.Group;
    expect(pivotOpen).toBeDefined();
    expect(Math.abs(pivotOpen.rotation.z)).toBeCloseTo(Math.PI, 3);

    const openPanelNames: string[] = [];
    containerOpen.traverse((obj) => {
      if (obj.userData?.partLabel) openPanelNames.push(obj.userData.partLabel);
    });
    const hasLegsOpen = openPanelNames.some((n) => n.includes('Pé de Apoio') || n.includes('Pé Articulado'));
    expect(hasLegsOpen).toBe(true); // Pés aparecem quando aberta
  });

  it('2. Cama retrátil com ripas (bedMode: "slat" ou undefined) constrói estrado com ripas fixas e móveis', () => {
    const builder = new SlatBedBuilder();
    const container = new THREE.Group();

    const boxSlat: InternalBoxItem = {
      id: 'box_bed_slat',
      name: 'Sofá-Cama Ripas',
      type: 'slat_bed',
      bedMode: 'slat',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      slatBedDirection: 'left',
      isOpen: false
    };

    builder.buildSlatBedModule(container, w, l, h, mat, boxSlat, false, false);

    // Não deve ter HingedBedPivot
    const pivot = container.getObjectByName('HingedBedPivot');
    expect(pivot).toBeUndefined();

    // Deve ter SlatBedSlidingFrame
    const slidingFrame = container.getObjectByName('SlatBedSlidingFrame');
    expect(slidingFrame).toBeDefined();

    const panelNames: string[] = [];
    container.traverse((obj) => {
      if (obj.userData?.partLabel) panelNames.push(obj.userData.partLabel);
    });

    const hasFixedSlat = panelNames.some((n) => n.includes('Ripa Fixa'));
    const hasMobileSlat = panelNames.some((n) => n.includes('Ripa Móvel'));
    expect(hasFixedSlat).toBe(true);
    expect(hasMobileSlat).toBe(true);
  });

  it('3. Cama ripada: as demais laterais da base encostam exatamente nas ripas sem espaçamento (mesmo com panels.top = true)', () => {
    const builder = new SlatBedBuilder();
    const container = new THREE.Group();

    const boxSlatWithTop: InternalBoxItem = {
      id: 'box_bed_slat_top',
      name: 'Sofá-Cama Ripas',
      type: 'slat_bed',
      bedMode: 'slat',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      thicknessMm: 15,
      slatBedDirection: 'left',
      isOpen: false,
      panels: { top: true, bottom: false, left: true, right: true, front: true, rear: true }
    };

    builder.buildSlatBedModule(container, w, l, h, mat, boxSlatWithTop, false, false);
    container.updateMatrixWorld(true);

    let maxWallTopY = -Infinity;
    let minSlatBottomY = Infinity;

    container.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const pt = obj.userData?.partType;
        if (pt === 'right' || pt === 'front' || pt === 'rear') {
          const box3 = new THREE.Box3().setFromObject(obj);
          if (box3.max.y > maxWallTopY) maxWallTopY = box3.max.y;
        }
        if (pt === 'slat' && obj.userData?.partLabel?.includes('Ripa Fixa')) {
          const box3 = new THREE.Box3().setFromObject(obj);
          if (box3.min.y < minSlatBottomY) minSlatBottomY = box3.min.y;
        }
      }
    });

    // O topo das laterais deve encostar exatamente na face inferior das ripas (gap = 0)
    expect(maxWallTopY).toBeCloseTo(minSlatBottomY, 4);
  });

  it('4. Cama como componente acoplado (hasBed: true) sobre outro módulo (ex: bandeja corrediça) assenta sobre o tampo superior (skipBaseBox)', () => {
    const builder = new SlatBedBuilder();
    const container = new THREE.Group();

    const slideTrayWithBed: InternalBoxItem = {
      id: 'box_tray_with_bed',
      name: 'Bandeja Geladeira + Cama',
      type: 'slide_tray',
      drawerMode: 'slide_tray',
      hasBed: true,
      bedMode: 'hinged',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      slatBedDirection: 'left',
      isBedOpen: true
    };

    builder.buildSlatBedModule(container, w, l, h, mat, slideTrayWithBed, false, true, undefined, undefined, false, undefined, undefined, true);
    container.updateMatrixWorld(true);

    const bedGroup = container.getObjectByName('BedComponentGroup') as THREE.Group;
    expect(bedGroup).toBeDefined();
    // BedComponentGroup é elevado por slatT (0.015m) para assentar em cima do tampo do módulo
    expect(bedGroup.position.y).toBeCloseTo(0.015, 4);

    // Deve conter o pivot da dobradiça quando bedMode = 'hinged'
    const pivot = bedGroup.getObjectByName('HingedBedPivot') as THREE.Group;
    expect(pivot).toBeDefined();
    expect(Math.abs(pivot.rotation.z)).toBeCloseTo(Math.PI, 3);
  });

  it('5. Garante que em TODAS as direções (left, right, front, rear), a cama dobradiça e o colchão abrem exatamente para o mesmo lado', () => {
    const builder = new SlatBedBuilder();
    const dirs: Array<{ dir: 'left' | 'right' | 'front' | 'rear'; axis: 'x' | 'z'; sign: 1 | -1 }> = [
      { dir: 'left', axis: 'x', sign: 1 },   // +X
      { dir: 'right', axis: 'x', sign: -1 }, // -X
      { dir: 'front', axis: 'z', sign: 1 },  // +Z
      { dir: 'rear', axis: 'z', sign: -1 }   // -Z
    ];

    dirs.forEach(({ dir, axis, sign }) => {
      const container = new THREE.Group();
      const box: InternalBoxItem = {
        id: `box_dir_${dir}`,
        name: `Cama ${dir}`,
        type: 'slat_bed',
        bedMode: 'hinged',
        colStart: 0,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 1,
        heightMm: 400,
        slatBedDirection: dir,
        mattressParts: 2,
        isOpen: true
      };

      builder.buildSlatBedModule(container, 0.4, 0.425, 0.4, mat, box, false, true, 0.4, 0.425, true);
      container.updateMatrixWorld(true);

      // Verifica posição da Folha Articulada desdobrada
      let leafCenter = 0;
      let mattressMaxOrMin = 0;
      container.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          if (obj.userData?.partLabel?.includes('Folha Articulada')) {
            const b = new THREE.Box3().setFromObject(obj);
            const c = new THREE.Vector3();
            b.getCenter(c);
            leafCenter = c[axis];
          }
          if (obj.userData?.isUpholstery) {
            const b = new THREE.Box3().setFromObject(obj);
            if (sign > 0 && b.max[axis] > mattressMaxOrMin) mattressMaxOrMin = b.max[axis];
            if (sign < 0 && b.min[axis] < mattressMaxOrMin) mattressMaxOrMin = b.min[axis];
          }
        }
      });

      // A folha desdobrada e o colchão estendido devem ambos apontar no mesmo sinal (direção)
      expect(Math.sign(leafCenter)).toBe(sign);
      expect(Math.sign(mattressMaxOrMin)).toBe(sign);
    });
  });

  it('6. Cama dobrável respeita hingedBedLeafSizeMm e limita ao tamanho máximo do módulo', () => {
    const builder = new SlatBedBuilder();

    // Caso A: Folha menor configurada pelo slide (250mm num módulo de 400mm)
    const containerSmall = new THREE.Group();
    const box250: InternalBoxItem = {
      id: 'box_leaf_250',
      name: 'Cama Folha 250mm',
      type: 'slat_bed',
      bedMode: 'hinged',
      hingedBedLeafSizeMm: 250,
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      heightMm: 400,
      slatBedDirection: 'left',
      isOpen: true
    };
    builder.buildSlatBedModule(containerSmall, 0.4, 0.8, 0.4, mat, box250, false, true);
    containerSmall.updateMatrixWorld(true);

    let leafWidth250 = 0;
    containerSmall.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && obj.userData?.partLabel?.includes('Folha Articulada')) {
        const b = new THREE.Box3().setFromObject(obj);
        leafWidth250 = b.max.x - b.min.x;
      }
    });
    expect(leafWidth250).toBeCloseTo(0.25, 3);

    // Caso B: Valor acima do módulo (ex: 700mm num módulo de 400mm) deve ser limitado a 400mm
    const containerClamped = new THREE.Group();
    builder.buildSlatBedModule(containerClamped, 0.4, 0.8, 0.4, mat, { ...box250, hingedBedLeafSizeMm: 700 }, false, true);
    containerClamped.updateMatrixWorld(true);

    let leafWidthClamped = 0;
    containerClamped.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && obj.userData?.partLabel?.includes('Folha Articulada')) {
        const b = new THREE.Box3().setFromObject(obj);
        leafWidthClamped = b.max.x - b.min.x;
      }
    });
    expect(leafWidthClamped).toBeCloseTo(0.4, 3);
  });

  it('7. Pés da cama dobrável ficam nas quinas com espaçamento igual dos dois lados mais próximos', () => {
    const builder = new SlatBedBuilder();
    const container = new THREE.Group();

    const box: InternalBoxItem = {
      id: 'box_corner_legs',
      name: 'Cama Pés Quina',
      type: 'slat_bed',
      bedMode: 'hinged',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 2,
      heightMm: 400,
      slatBedDirection: 'left',
      isOpen: true
    };

    builder.buildSlatBedModule(container, 0.4, 0.85, 0.4, mat, box, false, true);
    container.updateMatrixWorld(true);

    let leafBox: THREE.Box3 | null = null;
    const legBoxes: THREE.Box3[] = [];

    container.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        if (obj.userData?.partLabel?.includes('Folha Articulada')) {
          leafBox = new THREE.Box3().setFromObject(obj);
        }
        if (obj.userData?.partType === 'leg') {
          legBoxes.push(new THREE.Box3().setFromObject(obj));
        }
      }
    });

    expect(leafBox).not.toBeNull();
    expect(legBoxes.length).toBe(2);

    // Como direction === 'left' (+X), a borda externa da folha é leafBox.max.x,
    // e as bordas laterais são leafBox.min.z e leafBox.max.z.
    const legA = legBoxes[0];
    const legB = legBoxes[1];
    const rearLeg = legA.min.z < legB.min.z ? legA : legB;

    const distFromOuterX = Math.abs(leafBox!.max.x - rearLeg.max.x);
    const distFromSideZ = Math.abs(rearLeg.min.z - leafBox!.min.z);

    // Pés encostados na quina: sem espaçamento nos dois lados mais próximos
    expect(distFromOuterX).toBeCloseTo(0, 4);
    expect(distFromSideZ).toBeCloseTo(0, 4);
  });

  it('7b. Cama de ripas: pés encostados na quina (sem espaçamento) nos dois eixos', () => {
    const builder = new SlatBedBuilder();
    const container = new THREE.Group();
    const w = 0.4;
    const l = 0.85;
    const box: InternalBoxItem = {
      id: 'box_slat_corner',
      name: 'Cama Ripas Quina',
      type: 'slat_bed',
      bedMode: 'slat',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 2,
      heightMm: 400,
      slatBedDirection: 'left',
      isOpen: true
    };
    builder.buildSlatBedModule(container, w, l, 0.4, mat, box, false, true);
    container.updateMatrixWorld(true);

    const legs: THREE.Box3[] = [];
    container.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && obj.userData?.partType === 'leg') {
        legs.push(new THREE.Box3().setFromObject(obj));
      }
    });
    expect(legs.length).toBe(2);

    // Quadro móvel desliza em +X (left): a borda externa é a do quadro deslocado (com tampa frontal avançada de t=15mm)
    const frame = container.getObjectByName('SlatBedSlidingFrame') as THREE.Group;
    const outerX = frame.position.x + w / 2 + 0.015;
    legs.forEach((b) => {
      expect(b.max.x).toBeCloseTo(outerX, 4);
    });
    const zs = legs.map((b) => [b.min.z, b.max.z]).sort((a, b) => a[0] - b[0]);
    expect(zs[0][0]).toBeCloseTo(-l / 2, 4);
    expect(zs[1][1]).toBeCloseTo(l / 2, 4);
  });

  it('8. Cama de ripas (bedMode: "slat") também respeita hingedBedLeafSizeMm limitado ao tamanho do módulo', () => {
    const builder = new SlatBedBuilder();
    const container = new THREE.Group();

    const boxSlat220: InternalBoxItem = {
      id: 'box_slat_220',
      name: 'Cama Ripas 220mm',
      type: 'slat_bed',
      bedMode: 'slat',
      hingedBedLeafSizeMm: 220,
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 2,
      heightMm: 400,
      thicknessMm: 15,
      slatBedDirection: 'left',
      isOpen: true
    };

    builder.buildSlatBedModule(container, 0.4, 0.85, 0.4, mat, boxSlat220, false, true);
    const slidingFrame = container.getObjectByName('SlatBedSlidingFrame') as THREE.Group;
    expect(slidingFrame).toBeDefined();
    expect(slidingFrame.position.x).toBeCloseTo(0.22, 3);

    // Valor acima do máximo (700mm num módulo de 400mm com chapa 15mm -> máx 385mm)
    const containerClamped = new THREE.Group();
    builder.buildSlatBedModule(containerClamped, 0.4, 0.85, 0.4, mat, { ...boxSlat220, hingedBedLeafSizeMm: 700 }, false, true);
    const slidingClamped = containerClamped.getObjectByName('SlatBedSlidingFrame') as THREE.Group;
    expect(slidingClamped).toBeDefined();
    expect(slidingClamped.position.x).toBeCloseTo(0.385, 3);
  });

  it('9. Ripas e pés aceitam madeira independente (slatMaterial / bedLegMaterial)', () => {
    const builder = new SlatBedBuilder();
    const container = new THREE.Group();

    const box: InternalBoxItem = {
      id: 'box_wood',
      name: 'Cama Madeiras',
      type: 'slat_bed',
      bedMode: 'hinged',
      material: 'plywood',
      slatMaterial: 'dark_wood',
      bedLegMaterial: 'white_mdf',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 2,
      heightMm: 400,
      slatBedDirection: 'left',
      isOpen: true
    };

    builder.buildSlatBedModule(container, 0.4, 0.85, 0.4, mat, box, false, true);

    const colorOf = (obj: THREE.Object3D) =>
      ((obj as THREE.Mesh).material as THREE.MeshStandardMaterial).color.getHex();

    let leafColor = -1;
    let legColor = -1;
    let leafWood = '';
    let legWood = '';
    container.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      if (obj.userData?.partType === 'door') { leafColor = colorOf(obj); leafWood = obj.userData.woodMaterial; }
      if (obj.userData?.partType === 'leg') { legColor = colorOf(obj); legWood = obj.userData.woodMaterial; }
    });

    expect(leafColor).toBe(0x78350f); // madeira escura
    expect(legColor).toBe(0xf8fafc);  // MDF branco
    expect(leafWood).toBe('Madeira Nobre Maciça');
    expect(legWood).toBe('MDF Branco Ultra');

    // Sem override: usa o material do módulo
    const c2 = new THREE.Group();
    builder.buildSlatBedModule(c2, 0.4, 0.85, 0.4, mat, { ...box, slatMaterial: undefined, bedLegMaterial: undefined }, false, true);
    let defLeaf = -1;
    c2.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && obj.userData?.partType === 'door') defLeaf = colorOf(obj);
    });
    expect(defLeaf).toBe(0xd4a373); // compensado
  });
  it('11. Cama articulada possui folga (hingeGap) entre o tampo fixo e a folha móvel para compensar a dobradiça', () => {
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

  it('13. Garante que pés de apoio e ripas da cama constam na extração de peças do plano de corte mesmo quando fechada', async () => {
    const { extractWoodCutGroups } = await import('../src/utils/woodUtils');
    const builder = new SlatBedBuilder();

    // 1. Cama com dobradiça fechada: deve ter os 2 pés de apoio
    const containerHinged = new THREE.Group();
    const boxHinged: InternalBoxItem = {
      id: 'box_hinged_closed',
      name: 'Sofá-Cama Dobradiça',
      type: 'slat_bed',
      bedMode: 'hinged',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      slatBedDirection: 'left',
      isOpen: false
    };
    builder.buildSlatBedModule(containerHinged, w, l, h, mat, boxHinged, false, false);
    const statsHinged = extractWoodCutGroups({ internalBoxesBuilder: { group: containerHinged } });
    const legsHinged = statsHinged.cutGroups.filter((g) => g.partType === 'leg');
    expect(legsHinged.length).toBeGreaterThan(0);
    expect(legsHinged.reduce((sum, g) => sum + g.qty, 0)).toBe(2);
    expect(legsHinged[0].label).toContain('Cama Dobradiça - Pé Articulado');

    // 2. Cama retrátil com ripas fechada: deve ter ripas fixas (12), ripas móveis (12) e pés de apoio (2)
    const containerSlat = new THREE.Group();
    const boxSlat: InternalBoxItem = {
      id: 'box_slat_closed',
      name: 'Sofá-Cama com Ripas',
      type: 'slat_bed',
      bedMode: 'slat',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      slatBedDirection: 'left',
      isOpen: false
    };
    builder.buildSlatBedModule(containerSlat, w, l, h, mat, boxSlat, false, false);
    const statsSlat = extractWoodCutGroups({ internalBoxesBuilder: { group: containerSlat } });
    const slats = statsSlat.cutGroups.filter((g) => g.partType === 'slat');
    const fixedSlats = statsSlat.cutGroups.filter((g) => g.partType === 'slat' && g.label.includes('Ripa Fixa'));
    const mobileSlats = statsSlat.cutGroups.filter((g) => g.partType === 'slat' && g.label.includes('Ripa Móvel'));
    const legsSlat = statsSlat.cutGroups.filter((g) => g.partType === 'leg');

    expect(slats.reduce((sum, g) => sum + g.qty, 0)).toBe(25); // 12 fixas + 12 móveis + 1 sarrafo guia
    expect(fixedSlats.reduce((sum, g) => sum + g.qty, 0)).toBe(12);
    expect(mobileSlats.reduce((sum, g) => sum + g.qty, 0)).toBe(12);
    expect(legsSlat.reduce((sum, g) => sum + g.qty, 0)).toBe(2);
  });

  it('14. Cama ripada fechada: a tampa frontal móvel fica avançada para fora da viga/sarrafo de apoio sem colisão', () => {
    const builder = new SlatBedBuilder();
    const container = new THREE.Group();
    const boxSlat: InternalBoxItem = {
      id: 'box_slat_closed_cleat',
      name: 'Sofá-Cama Ripas',
      type: 'slat_bed',
      bedMode: 'slat',
      slatBedDirection: 'left',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      thicknessMm: 15,
      isOpen: false
    };

    builder.buildSlatBedModule(container, 0.4, 1.7, 0.4, mat, boxSlat, false, false);

    // Encontra o Sarrafo Guia e a Tampa Frontal Móvel
    let cleatMesh: THREE.Mesh | undefined;
    let frontPanelMesh: THREE.Mesh | undefined;

    container.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.partLabel) {
        if (obj.userData.partLabel.includes('Sarrafo Guia de Apoio')) {
          cleatMesh = obj;
        } else if (obj.userData.partLabel.includes('Painel Frontal Móvel')) {
          frontPanelMesh = obj;
        }
      }
    });

    expect(cleatMesh).toBeDefined();
    expect(frontPanelMesh).toBeDefined();

    const cleatBox = new THREE.Box3().setFromObject(cleatMesh!);
    const frontPanelBox = new THREE.Box3().setFromObject(frontPanelMesh!);

    // O sarrafo de apoio termina em w/2 (0.20m)
    expect(cleatBox.max.x).toBeCloseTo(0.20, 3);
    expect(cleatBox.min.x).toBeCloseTo(0.20 - 0.015, 3);

    // A tampa frontal móvel começa em w/2 (0.20m) e vai até w/2 + t (0.215m)
    expect(frontPanelBox.min.x).toBeCloseTo(0.20, 3);
    expect(frontPanelBox.max.x).toBeCloseTo(0.20 + 0.015, 3);

    // Não há sobreposição em X: a tampa frontal está do lado de fora da viga!
    expect(frontPanelBox.min.x).toBeGreaterThanOrEqual(cleatBox.max.x - 0.001);
  });

  it('15. Plano de corte e BOM: extração de pés articulados de cama dobradiça nos sentidos lateral e longitudinal', () => {
    const builder = new SlatBedBuilder();

    // Teste no sentido lateral (abertura esquerda/direita)
    const containerLateral = new THREE.Group();
    const boxLateral: InternalBoxItem = {
      id: 'box_hinged_lateral',
      name: 'Sofá Lateral',
      type: 'slat_bed',
      bedMode: 'hinged',
      slatBedDirection: 'left',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 400,
      thicknessMm: 15,
      isOpen: false
    };
    builder.buildSlatBedModule(containerLateral, 0.4, 1.7, 0.4, mat, boxLateral, false, false);
    const statsLateral = extractWoodCutGroups({ internalBoxesBuilder: { group: containerLateral } });
    const legsLateral = statsLateral.cutGroups.filter((g) => g.partType === 'leg');

    expect(legsLateral.length).toBeGreaterThan(0);
    expect(legsLateral.reduce((sum, g) => sum + g.qty, 0)).toBe(2);
    expect(legsLateral[0].label).toContain('Cama Dobradiça - Pé Articulado');
    expect(legsLateral[0].lengthMm).toBe(385); // 400 - 15
    expect(legsLateral[0].widthMm).toBe(35);
    expect(legsLateral[0].thicknessMm).toBe(15);

    // Teste no sentido longitudinal (abertura frontal/traseira)
    const containerLongitudinal = new THREE.Group();
    const boxLongitudinal: InternalBoxItem = {
      id: 'box_hinged_longitudinal',
      name: 'Sofá Longitudinal',
      type: 'slat_bed',
      bedMode: 'hinged',
      slatBedDirection: 'front',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 4,
      heightMm: 450,
      thicknessMm: 15,
      isOpen: true
    };
    builder.buildSlatBedModule(containerLongitudinal, 0.4, 1.7, 0.45, mat, boxLongitudinal, false, true);
    const statsLongitudinal = extractWoodCutGroups({ internalBoxesBuilder: { group: containerLongitudinal } });
    const legsLongitudinal = statsLongitudinal.cutGroups.filter((g) => g.partType === 'leg');

    expect(legsLongitudinal.length).toBeGreaterThan(0);
    expect(legsLongitudinal.reduce((sum, g) => sum + g.qty, 0)).toBe(2);
    expect(legsLongitudinal[0].label).toContain('Cama Dobradiça - Pé Articulado');
    expect(legsLongitudinal[0].lengthMm).toBe(435); // 450 - 15
    expect(legsLongitudinal[0].widthMm).toBe(35);
    expect(legsLongitudinal[0].thicknessMm).toBe(15);
  });
});
