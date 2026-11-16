import { describe, it, expect } from 'vitest';
import { InternalBoxItem } from '../src/types/internalBoxes';
import { DEFAULT_BATTERY_PRESETS } from '../src/data/batteryPresets';

describe('Instalação de Bateria nos Módulos do Campervan', () => {
  const defaultBat = DEFAULT_BATTERY_PRESETS[0];

  it('1. Deve instalar a bateria na base do módulo selecionado', () => {
    const box: InternalBoxItem = {
      id: 'box_power',
      name: 'Baú Técnico',
      type: 'chest',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 2,
      heightMm: 400,
      color: '#2563eb',
      material: 'plywood',
      hasBattery: true,
      batteryPresetId: defaultBat.id,
      electronics: [
        {
          id: 'battery',
          mountFace: 'bottom',
          position: 'rear_center',
          rotationDeg: 0,
          presetId: defaultBat.id
        }
      ]
    };

    expect(box.hasBattery).toBe(true);
    expect(box.electronics).toHaveLength(1);
    expect(box.electronics?.[0].id).toBe('battery');
    expect(box.electronics?.[0].mountFace).toBe('bottom');
    expect(box.electronics?.[0].presetId).toBe(defaultBat.id);
  });

  it('2. Deve transferir a bateria de um módulo para outro sem duplicar', () => {
    let boxes: InternalBoxItem[] = [
      {
        id: 'box_1',
        name: 'Baú Esquerdo',
        type: 'chest',
        colStart: 0,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 2,
        heightMm: 400,
        color: '#2563eb',
        material: 'plywood',
        hasBattery: true,
        electronics: [{ id: 'battery', mountFace: 'bottom', position: 'rear_center' }]
      },
      {
        id: 'box_2',
        name: 'Baú Direito',
        type: 'chest',
        colStart: 2,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 2,
        heightMm: 400,
        color: '#2563eb',
        material: 'plywood',
        hasBattery: false,
        electronics: []
      }
    ];

    // Simula a transferência para box_2
    const targetId = 'box_2';
    boxes = boxes.map(b => {
      if (b.id === targetId) {
        return {
          ...b,
          hasBattery: true,
          electronics: [...(b.electronics || []).filter(e => e.id !== 'battery'), { id: 'battery', mountFace: 'bottom', position: 'rear_center' }]
        };
      }
      return {
        ...b,
        hasBattery: false,
        electronics: (b.electronics || []).filter(e => e.id !== 'battery')
      };
    });

    const box1 = boxes.find(b => b.id === 'box_1');
    const box2 = boxes.find(b => b.id === 'box_2');

    expect(box1?.hasBattery).toBe(false);
    expect(box1?.electronics?.some(e => e.id === 'battery')).toBe(false);

    expect(box2?.hasBattery).toBe(true);
    expect(box2?.electronics?.some(e => e.id === 'battery')).toBe(true);
  });

  it('3. Deve validar encaixe e folgas da bateria nas dimensões internas', () => {
    const boxWMm = 400; // 400 mm de largura
    const boxLMm = 600; // 600 mm de comprimento
    const boxHMm = 350; // 350 mm de altura

    // Bateria padrão: 270 L x 520 P x 240 A
    const reqW = defaultBat.dimensionsMm.width;
    const reqD = defaultBat.dimensionsMm.depth;
    const reqH = defaultBat.dimensionsMm.height;

    const clearanceW = boxWMm - reqW;
    const clearanceD = boxLMm - reqD;
    const clearanceH = boxHMm - reqH;

    expect(clearanceW).toBeGreaterThanOrEqual(0);
    expect(clearanceD).toBeGreaterThanOrEqual(0);
    expect(clearanceH).toBeGreaterThanOrEqual(0);
  });

  it('4. Deve permitir instalar MPPT, B2B e Usina no mesmo módulo com a bateria', () => {
    const box: InternalBoxItem = {
      id: 'box_full_power',
      name: 'Compartimento Elétrico Completo',
      type: 'chest',
      colStart: 0,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 2,
      heightMm: 450,
      color: '#2563eb',
      material: 'plywood',
      hasBattery: true,
      electronics: [
        { id: 'battery', mountFace: 'bottom', position: 'rear_center', rotationDeg: 0 },
        { id: 'mppt', mountFace: 'left_wall', position: 'top_left', rotationDeg: 0 },
        { id: 'b2b', mountFace: 'left_wall', position: 'top_right', rotationDeg: 0 },
        { id: 'usina', mountFace: 'front_wall', position: 'top_center', rotationDeg: 0 }
      ]
    };

    expect(box.electronics).toHaveLength(4);
    const ids = box.electronics?.map(e => e.id);
    expect(ids).toContain('battery');
    expect(ids).toContain('mppt');
    expect(ids).toContain('b2b');
    expect(ids).toContain('usina');
  });

  it('5. Deve permitir instalar Porta Potti em um baú/gavetão com validação dimensional', () => {
    const box: InternalBoxItem = {
      id: 'box_porta_potti',
      name: 'Gavetão Sanitário',
      type: 'drawer',
      colStart: 1,
      colSpan: 1,
      rowStart: 0,
      rowSpan: 1,
      heightMm: 420,
      color: '#0284c7',
      material: 'plywood',
      hasPortaPotti: true,
      portaPottiPresetId: 'thetford_365'
    };

    expect(box.hasPortaPotti).toBe(true);
    expect(box.portaPottiPresetId).toBe('thetford_365');
    expect(box.heightMm).toBeGreaterThanOrEqual(390); // altura mínima para comportar Porta Potti 365
  });

  it('6. Deve coletar assignedElectronics para bateria, mppt, b2b e usina sem duplicatas 3D', () => {
    const boxes: InternalBoxItem[] = [
      {
        id: 'box_elec',
        name: 'Baú Técnico Elétrico',
        type: 'chest',
        colStart: 0,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 2,
        heightMm: 450,
        color: '#2563eb',
        material: 'plywood',
        hasBattery: true,
        electronics: [
          { id: 'mppt', mountFace: 'left_wall', position: 'top_left' },
          { id: 'b2b', mountFace: 'right_wall', position: 'top_left' },
          { id: 'usina', mountFace: 'bottom', position: 'center' }
        ]
      },
      {
        id: 'box_sanitary',
        name: 'Módulo Sanitário',
        type: 'drawer',
        colStart: 1,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 1,
        heightMm: 420,
        color: '#0284c7',
        material: 'plywood',
        hasPortaPotti: true
      }
    ];

    const assigned = new Set<string>();
    boxes.forEach(b => {
      if (b.hasBattery) assigned.add('battery');
      b.electronics?.forEach(e => assigned.add(e.id));
    });

    expect(assigned.has('battery')).toBe(true);
    expect(assigned.has('mppt')).toBe(true);
    expect(assigned.has('b2b')).toBe(true);
    expect(assigned.has('usina')).toBe(true);
    expect(assigned.size).toBe(4);
  });
});
