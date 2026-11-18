import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { TelescopicRailsBuilder } from '../src/three/TelescopicRails';
import { MaterialLibrary } from '../src/three/Materials';
import { calculateWeightBalance } from '../src/utils/weightCalculator';

describe('Sistema Deslizante do Rack por Perfis de Alumínio e Parafusos Guia', () => {
  MaterialLibrary.materials.telescopicRail = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
  MaterialLibrary.materials.flexiblePanelSubstrate = new THREE.MeshStandardMaterial({ color: 0xffffff });

  it('constrói guias longitudinais com perfis de alumínio e parafusos guia M8 inox', () => {
    const fixedGroup = new THREE.Group();
    const interGroup = new THREE.Group();
    const movingGroup = new THREE.Group();

    TelescopicRailsBuilder.addLongitudinalRails(
      fixedGroup,
      interGroup,
      movingGroup,
      1.10, // width
      1.20, // length
      0,    // xCenter
      0.45, // yLevel
      0.10, // zCenter
      1,    // directionSign
      0.40  // baseTopY
    );

    // 1. Verifica perfis de alumínio fixos no rack base
    const fixedBars: THREE.Mesh[] = [];
    fixedGroup.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.isBar) fixedBars.push(obj);
    });
    expect(fixedBars.length).toBeGreaterThanOrEqual(2);
    const fixedGuide = fixedBars.find((b) => b.userData?.isRailGuide);
    expect(fixedGuide).toBeDefined();
    expect(fixedGuide!.userData.barLabel).toContain('Perfil Alumínio Guia');
    expect(fixedGuide!.userData.profileSpec).toContain('Perfil Alumínio Guia 20x20 c/ Canal');

    // 2. Verifica perfis de alumínio deslizantes na bandeja móvel
    const movingBars: THREE.Mesh[] = [];
    movingGroup.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.isBar) movingBars.push(obj);
    });
    expect(movingBars.length).toBeGreaterThanOrEqual(2);
    const movingRunner = movingBars.find((b) => b.userData?.isRailRunner);
    expect(movingRunner).toBeDefined();
    expect(movingRunner!.userData.barLabel).toContain('Perfil Alumínio Deslizante da Bandeja');

    // 3. Verifica parafusos guia deslizantes M8 inox c/ arruela de teflon
    const boltGuides: THREE.Object3D[] = [];
    movingGroup.traverse((obj: any) => {
      if (obj.userData?.isBoltGuide) boltGuides.push(obj);
    });
    expect(boltGuides.length).toBeGreaterThanOrEqual(4);
    expect(boltGuides[0].userData.barLabel).toContain('Parafuso Guia Deslizante M8 Inox c/ Arruela Teflon');

    // 4. Garante que não há braços pesados de corrediça telescópica de gaveta no interGroup
    expect(interGroup.children.length).toBe(0);
  });

  it('constrói guias laterais com perfis de alumínio transversais e parafusos guia', () => {
    const fixedGroup = new THREE.Group();
    const interGroup = new THREE.Group();
    const movingGroup = new THREE.Group();

    TelescopicRailsBuilder.addLateralRails(
      fixedGroup,
      interGroup,
      movingGroup,
      1.10, // width
      1.20, // length
      0,    // xCenter
      0.45, // yLevel
      0.10, // zCenter
      1,    // directionSign
      0.40  // baseTopY
    );

    const fixedBars: THREE.Mesh[] = [];
    fixedGroup.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.isBar) fixedBars.push(obj);
    });
    const fixedGuide = fixedBars.find((b) => b.userData?.isRailGuide);
    expect(fixedGuide).toBeDefined();
    expect(fixedGuide!.userData.barLabel).toContain('Perfil Alumínio Guia Transversal');

    const boltGuides: THREE.Object3D[] = [];
    movingGroup.traverse((obj: any) => {
      if (obj.userData?.isBoltGuide) boltGuides.push(obj);
    });
    expect(boltGuides.length).toBeGreaterThanOrEqual(4);
  });

  it('calcula peso do sistema deslizante de forma otimizada sem corrediças pesadas de aço', () => {
    const weightResult = calculateWeightBalance({
      panelCount: 4,
      stackLevels: 2,
      structureMaterial: 'aluminum',
      aluminumProfileType: '2020',
      activePanelPreset: {
        id: 'p100',
        name: 'Painel 100W',
        powerWatts: 100,
        lengthMm: 1050,
        widthMm: 540,
        thicknessMm: 2.5,
        weightKg: 1.8,
        voc: 21.6,
        isc: 5.8,
        vmp: 18.0,
        imp: 5.5,
        priceBrl: 450,
        efficiencyPct: 19.5,
      },
      b2bPreset: {
        id: 'b2b_30',
        name: 'B2B 30A',
        ratedCurrentA: 30,
        priceBrl: 1200,
        maxEfficiencyPct: 92,
        weightKg: 1.8,
        chargePhases: 3,
        compatibleBatteries: ['lifepo4'],
        hasSmartAlternatorSupport: true,
      },
      activeBatteryPreset: {
        id: 'bat_100',
        name: 'LiFePO4 100Ah',
        type: 'lifepo4',
        capacityAh: 100,
        voltageNominal: 12.8,
        priceBrl: 2200,
        weightKg: 10.5,
        bmsAmps: 100,
        dimensions: { lengthMm: 330, widthMm: 172, heightMm: 215 },
        maxContinuousCurrentAmps: 100,
        efficiencyPct: 95,
        peakPowerWatts: 1280,
      },
      internalBoxes: [],
      installedAccessories: [],
      cargoBox: { enabled: false, isTelescopic: false, length: 1600 } as any,
      awning: { enabled: false } as any,
      waterTank: { enabled: false } as any,
      internalGrid: { widthMm: 1200, lengthMm: 1500, colsX: 3, rowsZ: 4, hasFloor: true } as any,
    });

    const slidingItem = weightResult.items.find((it) => it.id === 'sliding_trays_slides');
    expect(slidingItem).toBeDefined();
    expect(slidingItem!.name).toContain('Guias c/ Parafusos Deslizantes');
    expect(slidingItem!.specification).toContain('sem corrediças metálicas');
    expect(slidingItem!.totalWeightKg).toBeLessThan(10);
  });
});
