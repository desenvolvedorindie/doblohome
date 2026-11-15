import { StovePreset } from '../../../types';

export type StoveFormData = Omit<StovePreset, 'id' | 'isDefault'>;

export function emptyStoveForm(): StoveFormData {
  return {
    name: '',
    brand: 'NTK (Nautika)',
    model: '',
    burnersCount: 1,
    burnerType: 'Cerâmica Infravermelho',
    fuelType: 'Flex Fuel (Cartucho Campgás 227g / Botijão GLP)',
    gasConsumptionGh: 145,
    ignitionType: 'Piezoelétrico Automático',
    width: 350,
    depth: 330,
    height: 90,
    weightKg: 2.2,
    material: 'Aço esmaltado com pintura epóxi e base em enamel atóxico',
    hasCarryCase: true,
    dualFuelAdapter: true,
    windResistant: true,
    safetyLock: true,
    features: [
      'Sistema Flex Fuel (Cartucho Campgás + Botijão GLP)',
      'Ignição automática por sistema Piezo',
      'Trava de segurança do fluxo de gás'
    ],
    description: ''
  };
}
