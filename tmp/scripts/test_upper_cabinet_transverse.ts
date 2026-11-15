if (typeof globalThis.document === 'undefined') {
  const dummyCtx: any = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'measureText') return () => ({ width: 0 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop: () => {} });
      }
      return () => {};
    },
    set: () => true
  });
  (globalThis as any).document = {
    createElement: () => ({
      getContext: () => dummyCtx,
      width: 100,
      height: 100
    })
  };
}

import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder.ts';
import { InternalBoxItem, InternalGridConfig } from '../../src/types/index.ts';

const scene = new THREE.Scene();
const group = new THREE.Group();
scene.add(group);

const grid: InternalGridConfig = {
  lengthMm: 1700,
  widthMm: 1200,
  heightMm: 400,
  colsX: 3,
  rowsZ: 4
};

const testScenarios: Partial<InternalBoxItem>[] = [
  // 1. Longitudinal on_box
  { upperCabinet: true, upperCabinetAlign: 'left', upperCabinetPositionMode: 'on_box', upperCabinetTransverseMode: 'on_box' },
  // 2. Longitudinal behind_box (fora longitudinalmente)
  { upperCabinet: true, upperCabinetAlign: 'left', upperCabinetPositionMode: 'behind_box', upperCabinetBehindOffsetMm: 150 },
  // 3. Longitudinal beside_box (fora transversalmente para o corredor)
  { upperCabinet: true, upperCabinetAlign: 'left', upperCabinetPositionMode: 'on_box', upperCabinetTransverseMode: 'beside_box', upperCabinetBesideOffsetMm: 80, upperCabinetBesideSide: 'corridor' },
  // 4. Longitudinal fora em AMBOS os eixos (atrás e ao lado)
  { upperCabinet: true, upperCabinetAlign: 'left', upperCabinetPositionMode: 'behind_box', upperCabinetBehindOffsetMm: 100, upperCabinetTransverseMode: 'beside_box', upperCabinetBesideOffsetMm: 50 },
  // 5. Transversal (Traseira) on_box
  { upperCabinet: true, upperCabinetAlign: 'rear', upperCabinetPositionMode: 'on_box', upperCabinetTransverseMode: 'on_box' },
  // 6. Transversal (Traseira) behind_box
  { upperCabinet: true, upperCabinetAlign: 'rear', upperCabinetPositionMode: 'behind_box', upperCabinetBehindOffsetMm: 120 },
  // 7. Transversal (Traseira) beside_box (fora transversalmente)
  { upperCabinet: true, upperCabinetAlign: 'rear', upperCabinetTransverseMode: 'beside_box', upperCabinetBesideOffsetMm: 100 },
  // 8. Lateral Direita beside_box
  { upperCabinet: true, upperCabinetAlign: 'right', upperCabinetTransverseMode: 'beside_box', upperCabinetBesideOffsetMm: 60, upperCabinetBesideSide: 'corridor' }
];

console.log('Testando cenários de posicionamento longitudinal e transversal do Armário Aéreo...');

testScenarios.forEach((sc, idx) => {
  const box: InternalBoxItem = {
    id: `box_${idx}`,
    name: `Módulo Teste ${idx + 1}`,
    type: 'cabinet',
    colStart: 0,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 2,
    heightMm: 400,
    color: '#0284c7',
    material: 'naval_plywood',
    ...sc
  };

  const builder = new InternalBoxesBuilder();
  builder.update(grid, [box], box.id, false, null);

  const upperGroup = builder.boxesGroup.getObjectByName(`UpperCabinet_${box.id}_${box.upperCabinetAlign}`);
  if (!upperGroup) {
    console.error(`ERRO: UpperCabinet_${box.id}_${box.upperCabinetAlign} não foi encontrado!`);
    process.exit(1);
  }

  const box3 = new THREE.Box3().setFromObject(upperGroup);
  const size = new THREE.Vector3();
  box3.getSize(size);

  console.log(`Cenário #${idx + 1} (${box.upperCabinetAlign}): OK! Pos = (${upperGroup.position.x.toFixed(3)}, ${upperGroup.position.y.toFixed(3)}, ${upperGroup.position.z.toFixed(3)}), Dim = (${size.x.toFixed(3)} x ${size.y.toFixed(3)} x ${size.z.toFixed(3)})`);
});

console.log('TODOS OS CENÁRIOS LONGITUDINAIS E TRANSVERSAIS VALIDADOS COM SUCESSO!');
