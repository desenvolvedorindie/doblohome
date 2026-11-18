import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { BoxElectronicsBuilder } from '../src/three/boxes/BoxElectronicsBuilder';
import { buildPortaPottiApplianceAccessory, buildFridgeApplianceAccessory } from '../src/three/boxes/accessories/FridgePortaPottiBuilder';
import { InternalBoxItem } from '../src/types';

describe('Ajuste de altura Y de módulos instalados em nichos com base em ter tampa de baixo ou não', () => {
  const h = 0.5; // 500mm
  const w = 0.4; // 400mm
  const l = 0.425; // 425mm

  it('1. Componentes eletrônicos (Bateria/Usina) assentam no piso (-h/2) sem tampa de baixo, e sobre a chapa (-h/2 + tBottom) com tampa', () => {
    const builder = new BoxElectronicsBuilder();

    // Caso A: Nicho sem tampa de baixo (panels.bottom = false)
    const boxWithoutBottom: InternalBoxItem = {
      id: 'box-open-no-bottom',
      name: 'Nicho Sem Fundo',
      type: 'open',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      heightMm: 500,
      thicknessMm: 15,
      panels: { bottom: false, top: false, left: true, right: true, front: true, rear: true },
      electronics: [
        { id: 'battery', mountFace: 'bottom', position: 'center' }
      ]
    };

    const containerA = new THREE.Group();
    builder.buildBoxElectronics(containerA, w, l, h, boxWithoutBottom, false);
    const wrapperA = containerA.getObjectByName('Installed_battery_box-open-no-bottom') as THREE.Group;
    expect(wrapperA).toBeDefined();

    // Caso B: Nicho com tampa de baixo (panels.bottom = true, 15mm)
    const boxWithBottom: InternalBoxItem = {
      ...boxWithoutBottom,
      id: 'box-open-with-bottom',
      name: 'Nicho Com Fundo',
      panels: { ...boxWithoutBottom.panels, bottom: true }
    };

    const containerB = new THREE.Group();
    builder.buildBoxElectronics(containerB, w, l, h, boxWithBottom, false);
    const wrapperB = containerB.getObjectByName('Installed_battery_box-open-with-bottom') as THREE.Group;
    expect(wrapperB).toBeDefined();

    // A diferença de altura entre ter tampa e não ter tampa deve ser exatamente a espessura da chapa de baixo (15mm = 0.015m)
    const diffY = wrapperB.position.y - wrapperA.position.y;
    expect(diffY).toBeCloseTo(0.015, 3);
  });

  it('2. Porta Potti ajusta a altura Y com base em ter a tampa de baixo ou não', () => {
    const boxNoBottom: InternalBoxItem = {
      id: 'box-potti-no-bottom',
      name: 'Nicho Sanitário Sem Fundo',
      type: 'open',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      heightMm: 500,
      thicknessMm: 15,
      hasPortaPotti: true,
      panels: { bottom: false }
    };

    const containerA = new THREE.Group();
    buildPortaPottiApplianceAccessory(containerA, w, l, h, boxNoBottom, false);
    const pottiA = containerA.getObjectByName('PortaPottiAppliance_box-potti-no-bottom') as THREE.Group;
    expect(pottiA).toBeDefined();

    const boxWithBottom: InternalBoxItem = {
      ...boxNoBottom,
      id: 'box-potti-with-bottom',
      name: 'Nicho Sanitário Com Fundo',
      panels: { bottom: true }
    };

    const containerB = new THREE.Group();
    buildPortaPottiApplianceAccessory(containerB, w, l, h, boxWithBottom, false);
    const pottiB = containerB.getObjectByName('PortaPottiAppliance_box-potti-with-bottom') as THREE.Group;
    expect(pottiB).toBeDefined();

    const diffY = pottiB.position.y - pottiA.position.y;
    expect(diffY).toBeCloseTo(0.015, 3);
  });

  it('3. Geladeira ajusta a altura Y com base em ter a tampa de baixo ou não', () => {
    const boxNoBottom: InternalBoxItem = {
      id: 'box-fridge-no-bottom',
      name: 'Nicho Geladeira Sem Fundo',
      type: 'open',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      heightMm: 500,
      thicknessMm: 15,
      hasFridge: true,
      panels: { bottom: false }
    };

    const containerA = new THREE.Group();
    buildFridgeApplianceAccessory(containerA, w, l, h, boxNoBottom, false);
    const fridgeA = containerA.getObjectByName('FridgeAppliance_box-fridge-no-bottom') as THREE.Group;
    expect(fridgeA).toBeDefined();

    const boxWithBottom: InternalBoxItem = {
      ...boxNoBottom,
      id: 'box-fridge-with-bottom',
      name: 'Nicho Geladeira Com Fundo',
      panels: { bottom: true }
    };

    const containerB = new THREE.Group();
    buildFridgeApplianceAccessory(containerB, w, l, h, boxWithBottom, false);
    const fridgeB = containerB.getObjectByName('FridgeAppliance_box-fridge-with-bottom') as THREE.Group;
    expect(fridgeB).toBeDefined();

    const diffY = fridgeB.position.y - fridgeA.position.y;
    expect(diffY).toBeCloseTo(0.015, 3);
  });

  it('4. Componentes internos (Porta Potti e Geladeira) mantêm tamanho fixo do preset mesmo reduzindo comprimento ou largura da caixa', () => {
    // Caixa grande (comprimento normal)
    const boxBig: InternalBoxItem = {
      id: 'box-big',
      name: 'Módulo Grande',
      type: 'open',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      heightMm: 500,
      extraLengthMm: 100,
      hasPortaPotti: true,
      hasFridge: true
    };

    const containerBig = new THREE.Group();
    buildPortaPottiApplianceAccessory(containerBig, 0.60, 0.80, 0.50, boxBig, false);
    buildFridgeApplianceAccessory(containerBig, 0.60, 0.80, 0.50, boxBig, false);

    const pottiBig = containerBig.getObjectByName('PortaPottiAppliance_box-big') as THREE.Group;
    const fridgeBig = containerBig.getObjectByName('FridgeAppliance_box-big') as THREE.Group;

    const pottiBoxBig = new THREE.Box3().setFromObject(pottiBig);
    const fridgeBoxBig = new THREE.Box3().setFromObject(fridgeBig);

    const pottiSizeBig = new THREE.Vector3();
    const fridgeSizeBig = new THREE.Vector3();
    pottiBoxBig.getSize(pottiSizeBig);
    fridgeBoxBig.getSize(fridgeSizeBig);

    // Caixa encolhida (comprimento e largura reduzidos intencionalmente)
    const boxSmall: InternalBoxItem = {
      ...boxBig,
      id: 'box-small',
      name: 'Módulo Pequeno',
      extraLengthMm: -150
    };

    const containerSmall = new THREE.Group();
    buildPortaPottiApplianceAccessory(containerSmall, 0.25, 0.25, 0.30, boxSmall, false);
    buildFridgeApplianceAccessory(containerSmall, 0.25, 0.25, 0.30, boxSmall, false);

    const pottiSmall = containerSmall.getObjectByName('PortaPottiAppliance_box-small') as THREE.Group;
    const fridgeSmall = containerSmall.getObjectByName('FridgeAppliance_box-small') as THREE.Group;

    const pottiBoxSmall = new THREE.Box3().setFromObject(pottiSmall);
    const fridgeBoxSmall = new THREE.Box3().setFromObject(fridgeSmall);

    const pottiSizeSmall = new THREE.Vector3();
    const fridgeSizeSmall = new THREE.Vector3();
    pottiBoxSmall.getSize(pottiSizeSmall);
    fridgeBoxSmall.getSize(fridgeSizeSmall);

    // O tamanho do Porta Potti NÃO deve mudar com o tamanho da caixa
    expect(pottiSizeSmall.x).toBeCloseTo(pottiSizeBig.x, 3);
    expect(pottiSizeSmall.y).toBeCloseTo(pottiSizeBig.y, 3);
    expect(pottiSizeSmall.z).toBeCloseTo(pottiSizeBig.z, 3);

    // O tamanho da Geladeira NÃO deve mudar com o tamanho da caixa
    expect(fridgeSizeSmall.x).toBeCloseTo(fridgeSizeBig.x, 3);
    expect(fridgeSizeSmall.y).toBeCloseTo(fridgeSizeBig.y, 3);
    expect(fridgeSizeSmall.z).toBeCloseTo(fridgeSizeBig.z, 3);
  });
});
