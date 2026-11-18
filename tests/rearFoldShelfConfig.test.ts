import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildRearFoldShelfAccessory } from '../src/three/boxes/accessories/RearFoldShelfBuilder';
import { getFoldingBracketForHeight, InternalBoxItem } from '../src/types/internalBoxes';

describe('Configuração da Prateleira Rebatível Traseira (Limitada à Altura com Descontos)', () => {
  const baseBox: InternalBoxItem = {
    id: 'box_rear_1',
    name: 'Baú Traseiro',
    type: 'chest',
    colStart: 1,
    colSpan: 1,
    rowStart: 1,
    rowSpan: 1,
    heightMm: 400,
    color: '#8b5cf6',
    material: 'pine_finger',
    rearFoldShelf: true,
  };

  it('calcula a profundidade máxima respeitando os 40mm de desconto da altura (22mm pivô + 18mm piso)', () => {
    const container = new THREE.Group();
    // Altura do módulo: 400mm (0.40m), Largura: 500mm (0.50m), Comprimento: 600mm (0.60m)
    // Sem valor customizado: shelfH deve ser 0.40 - 0.040 = 0.36m (360mm)
    buildRearFoldShelfAccessory(container, 0.50, 0.60, 0.40, baseBox, false, false);

    const shelfPivot = container.getObjectByName('RearFoldShelfPivot') as THREE.Group;
    expect(shelfPivot).toBeDefined();

    const shelfMesh = shelfPivot.children.find((c: any) => c.isMesh && c.userData?.isWoodPart) as THREE.Mesh;
    expect(shelfMesh).toBeDefined();
    expect(shelfMesh.userData.dimL).toBeCloseTo(0.36, 3);
  });

  it('permite configurar largura/profundidade menor que o limite máximo da altura', () => {
    const container = new THREE.Group();
    const boxWithCustomDepth: InternalBoxItem = {
      ...baseBox,
      heightMm: 450,
      rearShelfDepthMm: 280, // Usuário quer bancada de 280mm
    };

    buildRearFoldShelfAccessory(container, 0.50, 0.60, 0.45, boxWithCustomDepth, false, false);

    const shelfPivot = container.getObjectByName('RearFoldShelfPivot') as THREE.Group;
    const shelfMesh = shelfPivot.children.find((c: any) => c.isMesh && c.userData?.isWoodPart) as THREE.Mesh;
    expect(shelfMesh.userData.dimL).toBeCloseTo(0.28, 3);
  });

  it('trava e limita o valor caso o usuário tente configurar uma largura maior que a altura menos os descontos', () => {
    const container = new THREE.Group();
    const boxExceeding: InternalBoxItem = {
      ...baseBox,
      heightMm: 350,
      rearShelfDepthMm: 500, // Tentou 500mm num móvel de 350mm (limite: 350 - 40 = 310mm)
    };

    buildRearFoldShelfAccessory(container, 0.50, 0.60, 0.35, boxExceeding, false, false);

    const shelfPivot = container.getObjectByName('RearFoldShelfPivot') as THREE.Group;
    const shelfMesh = shelfPivot.children.find((c: any) => c.isMesh && c.userData?.isWoodPart) as THREE.Mesh;
    // Deve ser limitado a 350mm - 40mm = 310mm (0.31m)
    expect(shelfMesh.userData.dimL).toBeCloseTo(0.31, 3);
  });

  it('permite configurar a extensão transversal (comprimento no móvel) limitada pela largura', () => {
    const container = new THREE.Group();
    const boxWithCustomWidth: InternalBoxItem = {
      ...baseBox,
      heightMm: 400,
      rearShelfDepthMm: 300,
      rearShelfWidthMm: 420, // Móvel tem 500mm de largura, prateleira configurada com 420mm
    };

    buildRearFoldShelfAccessory(container, 0.50, 0.60, 0.40, boxWithCustomWidth, false, false);

    const shelfPivot = container.getObjectByName('RearFoldShelfPivot') as THREE.Group;
    const shelfMesh = shelfPivot.children.find((c: any) => c.isMesh && c.userData?.isWoodPart) as THREE.Mesh;
    expect(shelfMesh.userData.dimW).toBeCloseTo(0.42, 3);
  });

  it('seleciona mão francesa compatível que não ultrapasse a profundidade da bancada', () => {
    // Para móvel alto (500mm), mas prateleira pequena (250mm):
    // A mão francesa deve ser de 8" ou 10" (200 ou 250mm), nunca uma de 18" ou 20" (450/500mm)
    const spec = getFoldingBracketForHeight(500, undefined, 250);
    expect(spec.lengthMm).toBeLessThanOrEqual(260);
    expect(spec.inches).toBeLessThanOrEqual(10);
  });

  it('permite descer a prateleira rebatível e limita o tampo pela diferença do deslocamento até o final do móvel', () => {
    const container = new THREE.Group();
    // Móvel de 400mm de altura, prateleira deslocada 100mm para baixo (rearShelfOffsetYMm: 100)
    // Posição normal do pivô: 400/2 - 22mm = 178mm (0.178m)
    // Com offset de 100mm para baixo: novo pivô = 178 - 100 = 78mm (0.078m)
    // Limite máximo do tampo até o piso (com 18mm de folga): 400 - 22 - 100 - 18 = 260mm (0.260m)
    const boxLowered: InternalBoxItem = {
      ...baseBox,
      heightMm: 400,
      rearShelfOffsetYMm: 100,
      rearShelfDepthMm: 350, // Tentou 350mm, deve ser travado no máximo restante de 260mm
    };

    buildRearFoldShelfAccessory(container, 0.50, 0.60, 0.40, boxLowered, false, false);

    const shelfPivot = container.getObjectByName('RearFoldShelfPivot') as THREE.Group;
    expect(shelfPivot).toBeDefined();
    // O pivô em Y deve ter descido em 0.10m (de 0.178m para 0.078m)
    expect(shelfPivot.position.y).toBeCloseTo(0.40 / 2 - 0.022 - 0.10, 3);

    const shelfMesh = shelfPivot.children.find((c: any) => c.isMesh && c.userData?.isWoodPart) as THREE.Mesh;
    expect(shelfMesh).toBeDefined();
    // O tampo deve ser limitado estritamente a 260mm (0.26m)
    expect(shelfMesh.userData.dimL).toBeCloseTo(0.26, 3);
  });

  it('permite subir a prateleira rebatível em direção ao topo e ajusta o limite do tampo', () => {
    const container = new THREE.Group();
    // Móvel de 400mm, prateleira subida 10mm em direção ao topo (rearShelfOffsetYMm: -10)
    // Novo pivô: 178 + 10 = 188mm (0.188m)
    // Limite máximo do tampo até o piso: 400 - 22 - (-10) - 18 = 370mm (0.370m)
    const boxRaised: InternalBoxItem = {
      ...baseBox,
      heightMm: 400,
      rearShelfOffsetYMm: -10,
      rearShelfDepthMm: 400, // Tentou 400mm, deve travar em 370mm
    };

    buildRearFoldShelfAccessory(container, 0.50, 0.60, 0.40, boxRaised, false, false);

    const shelfPivot = container.getObjectByName('RearFoldShelfPivot') as THREE.Group;
    expect(shelfPivot).toBeDefined();
    expect(shelfPivot.position.y).toBeCloseTo(0.40 / 2 - 0.022 - (-0.010), 3);

    const shelfMesh = shelfPivot.children.find((c: any) => c.isMesh && c.userData?.isWoodPart) as THREE.Mesh;
    expect(shelfMesh.userData.dimL).toBeCloseTo(0.37, 3);
  });
});
