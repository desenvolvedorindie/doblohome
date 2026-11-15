import { PortaPottiPreset } from '../../../types';

export type PortaPottiFormData = Omit<PortaPottiPreset, 'id' | 'isDefault'>;

export function emptyPortaPottiForm(): PortaPottiFormData {
  return {
    name: '',
    brand: '',
    model: '',
    wasteCapacityLiters: 20,
    freshWaterCapacityLiters: 13,
    width: 404,
    depth: 353,
    height: 390,
    weightEmptyKg: 6.7,
    weightFullKg: 26.7,
    maxLoadKg: 200,
    material: 'Plástico ABS de alta resistência',
    hasSoftClose: true,
    flushType: 'Bomba de pistão manual (jato duplo 360°)',
    antiLeakValve: true,
    rotatingSpout: true,
    airReliefValve: true,
    levelIndicator: true,
    features: [
      'Tanque de resíduos/dejetos com capacidade de 20 Litros',
      'Tampa com fechamento suave Soft Close',
      'Válvula hermética dupla antivazamento e antiodor',
      'Bico de despejo rotativo com botão de respiro'
    ],
    description: ''
  };
}
