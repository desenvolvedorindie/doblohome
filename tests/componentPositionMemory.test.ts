import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveElectronicMemory,
  getElectronicMemory,
  saveApplianceMemory,
  getApplianceMemory,
  clearComponentMemory
} from '../src/utils/componentPositionMemory';
import { InternalBoxItem } from '../src/types';

describe('Component Position Memory (Preservação de Posições ao Desinstalar/Mover)', () => {
  beforeEach(() => {
    clearComponentMemory();
  });

  describe('Eletrônicos (Bateria LiFePO4, B2B Charger, MPPT, Usina Smart)', () => {
    it('deve salvar e recuperar a posição de um componente eletrônico', () => {
      saveElectronicMemory('battery', {
        mountFace: 'bottom',
        position: 'center',
        rotationDeg: 90,
        customOffsetXmm: 25,
        customOffsetYmm: 0,
        customOffsetZmm: -15
      });

      const memory = getElectronicMemory('battery');
      expect(memory).not.toBeNull();
      expect(memory?.mountFace).toBe('bottom');
      expect(memory?.position).toBe('center');
      expect(memory?.rotationDeg).toBe(90);
      expect(memory?.customOffsetXmm).toBe(25);
      expect(memory?.customOffsetZmm).toBe(-15);
    });

    it('deve mesclar atualizações graduais sem perder parâmetros anteriores', () => {
      saveElectronicMemory('b2b', {
        mountFace: 'left',
        position: 'start',
        rotationDeg: 180
      });

      // Usuário ajusta apenas o offset fino
      saveElectronicMemory('b2b', {
        customOffsetXmm: 10,
        customOffsetYmm: 5
      });

      const memory = getElectronicMemory('b2b');
      expect(memory?.mountFace).toBe('left');
      expect(memory?.position).toBe('start');
      expect(memory?.rotationDeg).toBe(180);
      expect(memory?.customOffsetXmm).toBe(10);
      expect(memory?.customOffsetYmm).toBe(5);
    });

    it('deve armazenar configurações independentes para cada eletrônico', () => {
      saveElectronicMemory('mppt', {
        mountFace: 'right',
        rotationDeg: 270,
        customOffsetZmm: 30
      });

      saveElectronicMemory('usina', {
        mountFace: 'bottom',
        rotationDeg: 0,
        customOffsetXmm: -40
      });

      const mpptMem = getElectronicMemory('mppt');
      const usinaMem = getElectronicMemory('usina');

      expect(mpptMem?.mountFace).toBe('right');
      expect(mpptMem?.rotationDeg).toBe(270);
      expect(mpptMem?.customOffsetZmm).toBe(30);

      expect(usinaMem?.mountFace).toBe('bottom');
      expect(usinaMem?.rotationDeg).toBe(0);
      expect(usinaMem?.customOffsetXmm).toBe(-40);
    });
  });

  describe('Eletrodomésticos & Sanitário (Geladeira, Fogareiro, Porta Potti)', () => {
    it('deve salvar e recuperar posições e rotações da Geladeira', () => {
      saveApplianceMemory('fridge', {
        rotation: 90,
        alignX: 'left',
        alignZ: 'back',
        offsetX: -20,
        offsetZ: 15
      });

      const fridgeMem = getApplianceMemory('fridge');
      expect(fridgeMem?.rotation).toBe(90);
      expect(fridgeMem?.alignX).toBe('left');
      expect(fridgeMem?.alignZ).toBe('back');
      expect(fridgeMem?.offsetX).toBe(-20);
      expect(fridgeMem?.offsetZ).toBe(15);
    });

    it('deve salvar e recuperar posicionamento e local do Fogareiro', () => {
      saveApplianceMemory('stove', {
        placement: 'rear_shelf',
        rotation: 180,
        alignX: 'center',
        alignZ: 'front',
        offsetX: 5,
        offsetZ: -10
      });

      const stoveMem = getApplianceMemory('stove');
      expect(stoveMem?.placement).toBe('rear_shelf');
      expect(stoveMem?.rotation).toBe(180);
      expect(stoveMem?.alignX).toBe('center');
      expect(stoveMem?.alignZ).toBe('front');
      expect(stoveMem?.offsetX).toBe(5);
      expect(stoveMem?.offsetZ).toBe(-10);
    });

    it('deve salvar e recuperar rotações, alinhamentos e offsets do Porta Potti', () => {
      saveApplianceMemory('portaPotti', {
        rotation: 270,
        alignX: 'right',
        alignZ: 'center',
        offsetX: 30,
        offsetZ: 0
      });

      const pottiMem = getApplianceMemory('portaPotti');
      expect(pottiMem?.rotation).toBe(270);
      expect(pottiMem?.alignX).toBe('right');
      expect(pottiMem?.alignZ).toBe('center');
      expect(pottiMem?.offsetX).toBe(30);
      expect(pottiMem?.offsetZ).toBe(0);
    });
  });

  describe('Cenário Real: Remoção ou Desinstalação de Módulo Preserva Posições', () => {
    it('ao desinstalar componentes de uma caixa, suas posições continuam lembradas na reinstalação', () => {
      // 1. Caixa configurada com bateria e geladeira ajustadas pelo usuário
      const configuredBox: InternalBoxItem = {
        id: 'box-1',
        name: 'Módulo Cozinha / Elétrica',
        type: 'cabinet',
        x: 0,
        z: 0,
        widthGrid: 1,
        depthGrid: 1,
        heightMm: 500,
        color: '#ffffff',
        material: 'plywood',
        hasFridge: true,
        fridgeRotation: 90,
        fridgeAlignX: 'right',
        fridgeAlignZ: 'back',
        fridgeOffsetX: 12,
        fridgeOffsetZ: -8,
        hasBattery: true,
        electronics: [
          {
            id: 'battery',
            mountFace: 'bottom',
            position: 'end',
            rotationDeg: 180,
            customOffsetXmm: 15,
            customOffsetYmm: 0,
            customOffsetZmm: 20
          },
          {
            id: 'mppt',
            mountFace: 'left',
            position: 'center',
            rotationDeg: 90,
            customOffsetXmm: 0,
            customOffsetYmm: 10,
            customOffsetZmm: 0
          }
        ]
      };

      // 2. Simula ação de desinstalação ou remoção do módulo (como feito em useInternalBoxesManager)
      configuredBox.electronics?.forEach(el => saveElectronicMemory(el.id, el));
      saveApplianceMemory('fridge', {
        rotation: configuredBox.fridgeRotation,
        alignX: configuredBox.fridgeAlignX,
        alignZ: configuredBox.fridgeAlignZ,
        offsetX: configuredBox.fridgeOffsetX,
        offsetZ: configuredBox.fridgeOffsetZ
      });

      // 3. Simula reinstalação em outra caixa ou na mesma caixa após ter sido desinstalada
      const newBox: Partial<InternalBoxItem> = {
        id: 'box-2',
        name: 'Módulo Novo',
        type: 'cabinet'
      };

      // Recupera memória para a bateria
      const rememberedBattery = getElectronicMemory('battery');
      expect(rememberedBattery).not.toBeNull();
      expect(rememberedBattery?.rotationDeg).toBe(180);
      expect(rememberedBattery?.position).toBe('end');
      expect(rememberedBattery?.customOffsetXmm).toBe(15);
      expect(rememberedBattery?.customOffsetZmm).toBe(20);

      // Recupera memória para o MPPT
      const rememberedMppt = getElectronicMemory('mppt');
      expect(rememberedMppt).not.toBeNull();
      expect(rememberedMppt?.mountFace).toBe('left');
      expect(rememberedMppt?.rotationDeg).toBe(90);
      expect(rememberedMppt?.customOffsetYmm).toBe(10);

      // Recupera memória para a geladeira
      const rememberedFridge = getApplianceMemory('fridge');
      expect(rememberedFridge).not.toBeNull();
      expect(rememberedFridge?.rotation).toBe(90);
      expect(rememberedFridge?.alignX).toBe('right');
      expect(rememberedFridge?.alignZ).toBe('back');
      expect(rememberedFridge?.offsetX).toBe(12);
      expect(rememberedFridge?.offsetZ).toBe(-8);
    });
  });
});
