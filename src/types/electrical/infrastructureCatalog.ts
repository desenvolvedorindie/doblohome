import { ElectricalCatalogTemplate } from './coreTypes';
import {
  buildBreakerPorts,
  buildBusbarPorts,
  buildFuseBoxPorts
} from './portBuilders';

export const INFRASTRUCTURE_CATALOG: ElectricalCatalogTemplate[] = [
  {
    catalogId: 'breaker_box_dc',
    label: 'Caixa de Disjuntor DC',
    subtitle: 'Proteção Unipolar / Bipolar DC',
    category: 'distribution_protection',
    kind: 'breaker',
    icon: '🛡️',
    voltage: 12.8,
    watts: 0,
    amps: 0,
    breakerAmps: 60,
    breakerPoles: 2,
    ports: buildBreakerPorts(60, 2, false)
  },
  {
    catalogId: 'breaker_ac',
    label: 'Caixa de Disjuntor AC',
    subtitle: 'Proteção Rede 110V/220V DIN',
    category: 'distribution_protection',
    kind: 'breaker',
    icon: '⚡',
    voltage: 220,
    watts: 0,
    amps: 0,
    breakerAmps: 20,
    breakerPoles: 2,
    ports: buildBreakerPorts(20, 2, true)
  },
  {
    catalogId: 'fuse_box_12',
    label: 'Caixa de Fusíveis 12 Vias',
    subtitle: 'Com Barramento Negativo + LEDs',
    category: 'distribution_protection',
    kind: 'fuse_box',
    icon: '🧰',
    voltage: 12.8,
    watts: 0,
    amps: 0,
    fuseWayCount: 12,
    ports: buildFuseBoxPorts(12)
  },
  {
    catalogId: 'fuse_box_6',
    label: 'Caixa de Fusíveis 6 Vias',
    subtitle: 'Compacta com Barra Negativa',
    category: 'distribution_protection',
    kind: 'fuse_box',
    icon: '📦',
    voltage: 12.8,
    watts: 0,
    amps: 0,
    fuseWayCount: 6,
    ports: buildFuseBoxPorts(6)
  },
  {
    catalogId: 'busbar_pos',
    label: 'Barramento Positivo (+)',
    subtitle: 'Distribuição Latão 150A/250A',
    category: 'distribution_protection',
    kind: 'busbar',
    icon: '🟥',
    voltage: 12.8,
    watts: 0,
    amps: 0,
    busbarPolarity: 'pos',
    busbarTermCount: 8,
    ports: buildBusbarPorts('pos', 8)
  },
  {
    catalogId: 'busbar_neg',
    label: 'Barramento Negativo (-)',
    subtitle: 'Retorno Comum Latão 150A/250A',
    category: 'distribution_protection',
    kind: 'busbar',
    icon: '⬛',
    voltage: 12.8,
    watts: 0,
    amps: 0,
    busbarPolarity: 'neg',
    busbarTermCount: 10,
    ports: buildBusbarPorts('neg', 10)
  },
  {
    catalogId: 'busbar_ac',
    label: 'Barramento AC (F/N/T)',
    subtitle: 'Distribuição 110V/220V',
    category: 'distribution_protection',
    kind: 'busbar',
    icon: '🟦',
    voltage: 220,
    watts: 0,
    amps: 0,
    busbarPolarity: 'ac_phase',
    busbarTermCount: 8,
    ports: [
      { id: 'term_p1', label: 'F T1', polarity: 'ac_phase', side: 'left', direction: 'bidirectional', wayIndex: 1 },
      { id: 'term_p2', label: 'F T2', polarity: 'ac_phase', side: 'left', direction: 'bidirectional', wayIndex: 2 },
      { id: 'term_p3', label: 'F T3', polarity: 'ac_phase', side: 'left', direction: 'bidirectional', wayIndex: 3 },
      { id: 'term_n1', label: 'N T1', polarity: 'ac_neutral', side: 'left', direction: 'bidirectional', wayIndex: 4 },
      { id: 'term_n2', label: 'N T2', polarity: 'ac_neutral', side: 'left', direction: 'bidirectional', wayIndex: 5 },
      { id: 'term_n3', label: 'N T3', polarity: 'ac_neutral', side: 'left', direction: 'bidirectional', wayIndex: 6 },
      { id: 'term_g1', label: 'T T1', polarity: 'ac_ground', side: 'left', direction: 'bidirectional', wayIndex: 7 },
      { id: 'term_g2', label: 'T T2', polarity: 'ac_ground', side: 'left', direction: 'bidirectional', wayIndex: 8 }
    ]
  },
  {
    catalogId: 'inverter_2500',
    label: 'Inversor 12V ➔ 220V',
    subtitle: 'Onda Senoidal Pura 2500W',
    category: 'distribution_protection',
    kind: 'generic',
    icon: '🔌',
    voltage: 12.8,
    watts: 2500,
    amps: 195,
    isSource: true,
    ports: [
      { id: 'dc_pos', label: '+ 12V IN', polarity: 'pos', side: 'left', direction: 'in', maxAmps: 250 },
      { id: 'dc_neg', label: '- 12V IN', polarity: 'neg', side: 'left', direction: 'in', maxAmps: 250 },
      { id: 'ac_phase', label: 'Fase 220V', polarity: 'ac_phase', side: 'right', direction: 'out', maxAmps: 16 },
      { id: 'ac_neutral', label: 'Neutro 220V', polarity: 'ac_neutral', side: 'right', direction: 'out', maxAmps: 16 },
      { id: 'ac_ground', label: 'Terra (PE)', polarity: 'ac_ground', side: 'bottom', direction: 'bidirectional' }
    ]
  },
  {
    catalogId: 'transfer_switch_ac',
    label: 'Chave Comutadora AC',
    subtitle: 'Seletora Rede Externa / Inversor',
    category: 'distribution_protection',
    kind: 'transfer_switch',
    icon: '🎛️',
    voltage: 220,
    watts: 0,
    amps: 40,
    ports: [
      { id: 'ext_f', label: 'Rede Ext F', polarity: 'ac_phase', side: 'left', direction: 'in' },
      { id: 'ext_n', label: 'Rede Ext N', polarity: 'ac_neutral', side: 'left', direction: 'in' },
      { id: 'inv_f', label: 'Inversor F', polarity: 'ac_phase', side: 'left', direction: 'in' },
      { id: 'inv_n', label: 'Inversor N', polarity: 'ac_neutral', side: 'left', direction: 'in' },
      { id: 'out_f', label: 'Saída Carga F', polarity: 'ac_phase', side: 'right', direction: 'out' },
      { id: 'out_n', label: 'Saída Carga N', polarity: 'ac_neutral', side: 'right', direction: 'out' }
    ]
  },
  {
    catalogId: 'dcdc_step_12_19',
    label: 'Conversor DC-DC 12V ➔ 19V',
    subtitle: 'Step-Up 30A / 540W (Notebooks/Monitor)',
    category: 'distribution_protection',
    kind: 'generic',
    icon: '🔋',
    voltage: 19,
    watts: 540,
    amps: 28.4,
    isSource: true,
    ports: [
      { id: 'in_pos', label: '+ 12V IN', polarity: 'pos', side: 'left', direction: 'in', maxAmps: 45 },
      { id: 'in_neg', label: '- 12V IN', polarity: 'neg', side: 'left', direction: 'in', maxAmps: 45 },
      { id: 'out_pos_1', label: '+ 19V (1)', polarity: 'pos', side: 'right', direction: 'out', maxAmps: 15 },
      { id: 'out_neg_1', label: '- 19V (1)', polarity: 'neg', side: 'right', direction: 'out', maxAmps: 15 },
      { id: 'out_pos_2', label: '+ 19V (2)', polarity: 'pos', side: 'right', direction: 'out', maxAmps: 15 },
      { id: 'out_neg_2', label: '- 19V (2)', polarity: 'neg', side: 'right', direction: 'out', maxAmps: 15 }
    ]
  },
  {
    catalogId: 'switch_12v',
    label: 'Interruptor / Botão 12V',
    subtitle: 'Chave Gangorra c/ LED 20A',
    category: 'distribution_protection',
    kind: 'generic',
    icon: '🔘',
    voltage: 12.8,
    watts: 0,
    amps: 0,
    ports: [
      { id: 'in_pos', label: '+ IN', polarity: 'pos', side: 'left', direction: 'in', maxAmps: 20 },
      { id: 'out_pos', label: '+ OUT', polarity: 'pos', side: 'right', direction: 'out', maxAmps: 20 },
      { id: 'led_neg', label: '- LED (opc)', polarity: 'neg', side: 'bottom', direction: 'in' }
    ]
  },
  {
    catalogId: 'mc4_splitter',
    label: 'Conector MC4 Ramo Y',
    subtitle: 'Paralelo / Série Painéis Solares',
    category: 'distribution_protection',
    kind: 'generic',
    icon: '🔀',
    voltage: 44.5,
    watts: 0,
    amps: 20,
    ports: [
      { id: 'in_1', label: 'Entrada 1', polarity: 'pos', side: 'bottom', direction: 'in' },
      { id: 'in_2', label: 'Entrada 2', polarity: 'pos', side: 'bottom', direction: 'in' },
      { id: 'in_3', label: 'Entrada 3', polarity: 'pos', side: 'bottom', direction: 'in' },
      { id: 'out_main', label: 'Saída MC4', polarity: 'pos', side: 'top', direction: 'out' }
    ]
  },
  {
    catalogId: 'outlet_ac_ext',
    label: 'Tomada Externa / Interna AC',
    subtitle: 'Shore Power 2P+T 20A',
    category: 'distribution_protection',
    kind: 'generic',
    icon: '🔌',
    voltage: 220,
    watts: 2200,
    amps: 10,
    ports: [
      { id: 'ac_phase', label: 'Fase', polarity: 'ac_phase', side: 'right', direction: 'bidirectional' },
      { id: 'ac_neutral', label: 'Neutro', polarity: 'ac_neutral', side: 'right', direction: 'bidirectional' },
      { id: 'ac_ground', label: 'Terra', polarity: 'ac_ground', side: 'right', direction: 'bidirectional' }
    ]
  },
  {
    catalogId: 'outlet_12v_usb',
    label: 'Painel Tomadas 12V / USB',
    subtitle: '2x USB QC3.0 + Isqueiro + Voltímetro',
    category: 'distribution_protection',
    kind: 'generic',
    icon: '🔌',
    voltage: 12.8,
    watts: 60,
    amps: 4.7,
    ports: [
      { id: 'in_pos', label: '+ 12V', polarity: 'pos', side: 'left', direction: 'in' },
      { id: 'in_neg', label: '- 12V', polarity: 'neg', side: 'left', direction: 'in' }
    ]
  },
  {
    catalogId: 'shunt_monitor',
    label: 'Shunt Monitor de Bateria',
    subtitle: 'Medidor 300A/500A no Negativo (-)',
    category: 'distribution_protection',
    kind: 'generic',
    icon: '📊',
    voltage: 12.8,
    watts: 0,
    amps: 0,
    ports: [
      { id: 'bat_neg', label: 'B- (Bateria)', polarity: 'neg', side: 'left', direction: 'in', maxAmps: 500 },
      { id: 'load_neg', label: 'P- (Cargas)', polarity: 'neg', side: 'right', direction: 'out', maxAmps: 500 },
      { id: 'sig_pos', label: '+ Sensor V', polarity: 'signal', side: 'top', direction: 'in' }
    ]
  }
];
