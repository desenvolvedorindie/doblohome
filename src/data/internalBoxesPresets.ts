import { InternalBoxesPreset, InternalGridConfig, CeilingConfig } from '../types';

export const DEFAULT_CEILING_CONFIG: CeilingConfig = {
  enabled: true,
  visibleIn3D: true,
  opacity: 1.0,
  type: 'slatted',
  slattedWood: 'freijo',
  slatWidthMm: 40,
  slatThicknessMm: 12,
  slatGapMm: 10,
  slatDirection: 'longitudinal',
  acousticFeltBacking: true,
  sheetMaterial: 'white_mdf',
  thicknessMm: 9,
  sheetPanels: 'single',
  lengthMm: 1700,
  widthMm: 1200,
  heightOffsetMm: 0,
  curvatureMm: 25, // Curvatura transversal suave (25mm) acompanhando a curvatura da Doblò
  led: {
    enabled: true,
    type: 'strip_double',
    color: '#fef3c7', // 3000K Branco Quente
    brightness: 85,
    spotsCount: 4
  }
};

export const DEFAULT_INTERNAL_GRID: InternalGridConfig = {
  lengthMm: 1700, // 1.70m de comprimento do assoalho útil
  widthMm: 1200,  // 1.20m de largura entre caixas de roda
  heightMm: 400,  // 40cm padrão base de cama / baú
  colsX: 3,       // 3 divisórias na largura (~40cm cada)
  rowsZ: 4,       // 4 divisórias no comprimento (~42.5cm cada)
  ceiling: { ...DEFAULT_CEILING_CONFIG }
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
        material: 'plywood',
        electronics: [
          {
            id: 'battery',
            mountFace: 'bottom',
            position: 'rear_center',
            rotationDeg: 0
          },
          {
            id: 'mppt',
            mountFace: 'left_wall',
            position: 'top_left',
            rotationDeg: 0
          },
          {
            id: 'b2b',
            mountFace: 'left_wall',
            position: 'top_right',
            rotationDeg: 0
          },
          {
            id: 'usina',
            mountFace: 'front_wall',
            position: 'top_center',
            rotationDeg: 0
          }
        ]
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
        material: 'dark_wood',
        hasStove: true,
        stovePresetId: 'ntk-duo-ceramik',
        stovePlacement: 'inside',
        hasLedCorner: true,
        ledCorner: {
          enabled: true,
          edges: ['rear'],
          color: '#fef3c7',
          brightness: 85
        }
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
        material: 'dark_wood',
        hasLedCorner: true,
        ledCorner: {
          enabled: true,
          edges: ['rear'],
          color: '#fef3c7',
          brightness: 85
        }
      }
    ]
  },
  {
    id: 'slat_bed_camper',
    name: 'Sofá-Cama c/ Armário Alto Lateral (Padrão Doblò)',
    description: 'Layout clássico campervan Doblò: Coluna 1 com Armário Alto de cozinha (75cm) + Sofá-Cama nas Colunas 2 e 3 extensível para 2 colunas (80cm) ou largura total (120cm) + Mesa Dinette central.',
    grid: {
      lengthMm: 1700,
      widthMm: 1200,
      heightMm: 400,
      colsX: 3,
      rowsZ: 4,
      centralTable: {
        enabled: true,
        lengthMm: 650,
        widthMm: 450,
        heightMm: 720,
        offsetX: 0,
        offsetZ: 0,
        rotationDeg: 0,
        finish: 'pine_block'
      }
    },
    boxes: [
      {
        id: 'box_kitchen_tall_cabinet',
        name: '🍳 Armário Alto Lateral & Cozinha',
        type: 'chest',
        colStart: 0,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 4,
        heightMm: 750,
        color: '#0284c7',
        material: 'plywood',
        chestHingeDirection: 'right',
        upperCabinet: true,
        upperCabinetDepthMm: 250,
        hasLedCorner: true,
        ledCorner: {
          enabled: true,
          edges: ['right'],
          color: '#fef3c7',
          brightness: 85
        }
      },
      {
        id: 'box_slat_bed_main',
        name: '🛏️ Sofá-Cama Retrátil com Ripas (2 Colunas / Total)',
        type: 'slat_bed',
        colStart: 2,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 4,
        heightMm: 400,
        color: '#d97706',
        material: 'plywood',
        slatBedDirection: 'left',
        slatExtensionPercent: 100,
        mattressParts: 2,
        rearFoldShelf: true,
        rearShelfFinish: 'pine_block',
        hasLedCorner: true,
        ledCorner: {
          enabled: true,
          edges: ['rear'],
          color: '#fef3c7',
          brightness: 85
        }
      }
    ]
  },
  {
    id: 'slat_bed_full_width',
    name: 'Sofá-Cama Retrátil Total (Ocupar Tudo • 120cm)',
    description: 'Cama casal retrátil que se expande por toda a largura da van (1,20m) ocupando as 3 colunas completas no modo estendido, com mesa dinette central.',
    grid: {
      lengthMm: 1700,
      widthMm: 1200,
      heightMm: 400,
      colsX: 3,
      rowsZ: 4,
      centralTable: {
        enabled: true,
        lengthMm: 650,
        widthMm: 450,
        heightMm: 720,
        offsetX: 0,
        offsetZ: 0,
        rotationDeg: 0,
        finish: 'pine_block'
      }
    },
    boxes: [
      {
        id: 'box_slat_bed_full',
        name: '🛏️ Sofá-Cama Ripas Total (Ocupar Tudo 120cm)',
        type: 'slat_bed',
        colStart: 2,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 4,
        heightMm: 400,
        color: '#d97706',
        material: 'plywood',
        slatBedDirection: 'left',
        slatExtensionPercent: 100,
        mattressParts: 3,
        rearFoldShelf: true,
        rearShelfFinish: 'pine_block',
        hasLedCorner: true,
        ledCorner: {
          enabled: true,
          edges: ['left', 'rear'],
          color: '#fef3c7',
          brightness: 85
        }
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
        name: '🍳 Bancada Cozinha Lateral Alta (75cm)',
        type: 'drawer',
        colStart: 0,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 4,
        heightMm: 750,
        color: '#0284c7',
        material: 'white_mdf',
        hasLedCorner: true,
        ledCorner: {
          enabled: true,
          edges: ['right'],
          color: '#fef3c7',
          brightness: 85
        }
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
        topPerforated: true,
        hasLedCorner: true,
        ledCorner: {
          enabled: true,
          edges: ['rear'],
          color: '#fef3c7',
          brightness: 85
        }
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

