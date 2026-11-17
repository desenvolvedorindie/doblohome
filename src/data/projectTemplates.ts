import { ProjectData, ProjectTemplate } from '../types/project';
import { SavedConfig } from '../types/solar';
import { DEFAULT_INTERNAL_GRID, INTERNAL_BOXES_PRESETS } from './internalBoxesPresets';

export function getDefaultProjectConfig(): SavedConfig {
  return {
    stackLevels: 2,
    level1: {
      panels: 2,
      direction: 'longitudinal',
      orientation: 'longitudinal',
    },
    level2: {
      panels: 2,
      direction: 'fixed',
      orientation: 'longitudinal',
    },
    structureMaterial: 'aluminum',
    steelProfileUnit: 'mm',
    aluminumColor: 'silver',
    metalonColor: '#334155',
    metalonWallThickness: 1.5,
    metalonThickness40: 40,
    metalonThickness30: 30,
    cargoBox: {
      enabled: true,
      length: 1750,
      width: 820,
      height: 330,
      isTelescopic: true,
      verticalLiftMm: 200,
      hingeSide: 'driver',
      tiltAngle: 0,
      lidAngle: 0,
    },
    waterTank: {
      enabled: true,
      lengthMm: 2200,
      diameterMm: 200,
      connectionPosition: 'rear',
    },
    awning: {
      enabled: true,
      type: 'batwing_270',
      side: 'driver',
      lengthMm: 2000,
      extensionMm: 2000,
      isOpen: false,
      fabricColor: '#1e293b',
    },
    offsetZ: -1.2,
    offsetY: -0.14,
    expansionProgress: 0,
    b2bEngineHours: 2.5,
  };
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'full_camper',
    name: 'Motorhome Completo (Recomendado)',
    description: 'Teto solar duplo retrátil, baú 550L, toldo 270°, caixa d\'água lateral e layout interno completo (cama, cozinha e elétrica).',
    badge: 'Popular',
    createData: (): ProjectData => {
      const classicPreset = INTERNAL_BOXES_PRESETS[0];
      return {
        config: getDefaultProjectConfig(),
        internalBoxes: JSON.parse(JSON.stringify(classicPreset.boxes)),
        internalGrid: JSON.parse(JSON.stringify(DEFAULT_INTERNAL_GRID)),
        partsFilter: 'all',
      };
    },
  },
  {
    id: 'roof_overland',
    name: 'Expedição & Teto Solar',
    description: 'Estrutura solar completa de 4 placas, baú de teto Motobul, caixa d\'água 200mm e toldo asa de morcego, com interior livre.',
    badge: 'Expedição',
    createData: (): ProjectData => {
      return {
        config: getDefaultProjectConfig(),
        internalBoxes: [],
        internalGrid: JSON.parse(JSON.stringify(DEFAULT_INTERNAL_GRID)),
        partsFilter: 'all',
      };
    },
  },
  {
    id: 'blank',
    name: 'Projeto em Branco',
    description: 'Inicie do zero sem módulos ou configurações prévias, ideal para prototipagem personalizada.',
    badge: 'Vazio',
    createData: (): ProjectData => {
      const cfg = getDefaultProjectConfig();
      cfg.cargoBox = { ...cfg.cargoBox!, enabled: false };
      cfg.waterTank = { ...cfg.waterTank!, enabled: false };
      cfg.awning = { ...cfg.awning!, enabled: false };
      return {
        config: cfg,
        internalBoxes: [],
        internalGrid: JSON.parse(JSON.stringify(DEFAULT_INTERNAL_GRID)),
        partsFilter: 'all',
      };
    },
  },
];
