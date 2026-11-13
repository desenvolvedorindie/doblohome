import { InternalBoxesPreset, InternalGridConfig } from '../types';

export const DEFAULT_INTERNAL_GRID: InternalGridConfig = {
  lengthMm: 1700, // 1.70m de comprimento do assoalho útil
  widthMm: 1200,  // 1.20m de largura entre caixas de roda
  heightMm: 400,  // 40cm padrão base de cama / baú
  colsX: 3,       // 3 divisórias na largura (~40cm cada)
  rowsZ: 4        // 4 divisórias no comprimento (~42.5cm cada)
};

export const INTERNAL_BOXES_PRESETS: InternalBoxesPreset[] = [
  {
    id: 'classic_camper',
    name: 'Campervan Clássico: Cama + 2 Gavetões Traseiros',
    description: '2 gavetões deslizantes com acesso pela tampa traseira + baús frontais para bateria e roupas com acesso superior.',
    grid: {
      lengthMm: 1700,
      widthMm: 1200,
      heightMm: 400,
      colsX: 3,
      rowsZ: 4
    },
    boxes: [
      {
        id: 'box_power_1',
        name: '⚡ Sistema Elétrico & Baterias',
        type: 'chest',
        colStart: 0,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 2,
        heightMm: 400,
        color: '#2563eb',
        material: 'plywood'
      },
      {
        id: 'box_clothes_2',
        name: '🛏️ Baú Cama & Roupas',
        type: 'chest',
        colStart: 1,
        colSpan: 2,
        rowStart: 0,
        rowSpan: 2,
        heightMm: 400,
        color: '#d97706',
        material: 'plywood',
        topPerforated: true
      },
      {
        id: 'box_kitchen_drawer_3',
        name: '🍳 Gavetão Cozinha / Fogareiro',
        type: 'drawer',
        colStart: 0,
        colSpan: 2,
        rowStart: 2,
        rowSpan: 2,
        heightMm: 400,
        color: '#059669',
        material: 'dark_wood'
      },
      {
        id: 'box_storage_drawer_4',
        name: '📦 Gavetão Mantimentos & Utensílios',
        type: 'drawer',
        colStart: 2,
        colSpan: 1,
        rowStart: 2,
        rowSpan: 2,
        heightMm: 400,
        color: '#7c3aed',
        material: 'dark_wood'
      }
    ]
  },
  {
    id: 'slat_bed_camper',
    name: 'Sofá-Cama Retrátil com Ripas (Abertura Lateral)',
    description: 'Sofá longitudinal conversível em cama de casal com sistema de ripas entrelaçadas (pente) + gavetão traseiro de cozinha e baú de baterias.',
    grid: {
      lengthMm: 1700,
      widthMm: 1200,
      heightMm: 400,
      colsX: 3,
      rowsZ: 4
    },
    boxes: [
      {
        id: 'box_slat_bed_main',
        name: '🛏️ Cama Retrátil com Ripas (Sofá-Cama)',
        type: 'slat_bed',
        colStart: 0,
        colSpan: 2,
        rowStart: 0,
        rowSpan: 4,
        heightMm: 400,
        color: '#d97706',
        material: 'plywood',
        slatBedDirection: 'right',
        slatExtensionPercent: 85,
        rearFoldShelf: true,
        rearShelfFinish: 'pine_block'
      },
      {
        id: 'box_power_chest',
        name: '⚡ Baterias & Elétrica',
        type: 'chest',
        colStart: 2,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 2,
        heightMm: 400,
        color: '#2563eb',
        material: 'plywood',
        chestHingeDirection: 'front'
      },
      {
        id: 'box_kitchen_drawer',
        name: '🍳 Gavetão Cozinha Traseiro',
        type: 'drawer',
        colStart: 2,
        colSpan: 1,
        rowStart: 2,
        rowSpan: 2,
        heightMm: 400,
        color: '#059669',
        material: 'dark_wood'
      }
    ]
  },
  {
    id: 'lateral_kitchen',
    name: 'Cozinha Lateral + Baús Centrais',
    description: 'Módulo lateral contínuo para pia e fogão + baús centrais modulares para estrado de cama conversível.',
    grid: {
      lengthMm: 1700,
      widthMm: 1200,
      heightMm: 420,
      colsX: 3,
      rowsZ: 4
    },
    boxes: [
      {
        id: 'box_lat_kitchen',
        name: '🍳 Bancada Cozinha Lateral Completa',
        type: 'drawer',
        colStart: 0,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 4,
        heightMm: 420,
        color: '#0284c7',
        material: 'white_mdf'
      },
      {
        id: 'box_chest_center',
        name: '🧰 Baú de Ferramentas & Baterias',
        type: 'chest',
        colStart: 1,
        colSpan: 2,
        rowStart: 0,
        rowSpan: 2,
        heightMm: 420,
        color: '#475569',
        material: 'plywood'
      },
      {
        id: 'box_drawer_rear_bed',
        name: '🛏️ Gaveta Central Suporte Cama',
        type: 'drawer',
        colStart: 1,
        colSpan: 2,
        rowStart: 2,
        rowSpan: 2,
        heightMm: 420,
        color: '#b45309',
        material: 'dark_wood',
        topPerforated: true
      }
    ]
  },
  {
    id: 'empty_grid',
    name: 'Grid Vazio (Criar do Zero)',
    description: 'Inicie com o assoalho limpo e desenhe suas caixas e gavetas clicando e arrastando.',
    grid: {
      lengthMm: 1700,
      widthMm: 1200,
      heightMm: 400,
      colsX: 3,
      rowsZ: 4
    },
    boxes: []
  }
];

