import { ApplianceItem, B2BChargerConfig, EnergyStats, UsinaChargerConfig } from '../types';
import {
  ElectricalCatalogTemplate,
  ElectricalNodeData,
  ElectricalPort,
  INFRASTRUCTURE_CATALOG
} from '../types/electricalPlanar';

export function buildSystemFixedTemplates(
  energyStats: EnergyStats,
  b2bCharger: B2BChargerConfig,
  usinaCharger: UsinaChargerConfig
): ElectricalCatalogTemplate[] {
  const solarWatts = energyStats.nominalPowerW || 400;
  const solarVoc = parseFloat(energyStats.voc || '44.56') || 44.56;
  const solarAmps = +(solarWatts / Math.max(12, solarVoc * 0.82)).toFixed(1);

  const mpptAmps = 60;
  const usinaAmps = usinaCharger.modelRating || 120;
  const usinaWatts = Math.round(usinaAmps * (usinaCharger.voltageOut || 14.4));
  const b2bAmps = b2bCharger.chargingAmps || 30;
  const b2bWatts = b2bCharger.watts || 390;

  return [
    {
      catalogId: 'sys_solar_panels',
      label: `Placas Solares (${energyStats.panelCount}x)`,
      subtitle: `Arranjo Teto ${solarWatts}W · Voc ${solarVoc.toFixed(1)}V`,
      category: 'system_fixed',
      kind: 'generic',
      icon: '☀️',
      voltage: +solarVoc.toFixed(1),
      watts: solarWatts,
      amps: solarAmps,
      isSource: true,
      ports: [
        { id: 'pv_pos', label: '+ FV Solar', polarity: 'pos', side: 'top', direction: 'out', maxAmps: Math.max(20, Math.ceil(solarAmps * 1.5)) },
        { id: 'pv_neg', label: '- FV Solar', polarity: 'neg', side: 'top', direction: 'out', maxAmps: Math.max(20, Math.ceil(solarAmps * 1.5)) }
      ]
    },
    {
      catalogId: 'sys_mppt',
      label: 'MPPT Kingbo 60A',
      subtitle: 'Controlador Solar 230Vdc ➔ 12V',
      category: 'system_fixed',
      kind: 'generic',
      icon: '⚡',
      voltage: 12.8,
      watts: 768,
      amps: mpptAmps,
      isSource: true,
      ports: [
        { id: 'pv_pos', label: '+ PV IN', polarity: 'pos', side: 'bottom', direction: 'in', maxAmps: 40 },
        { id: 'pv_neg', label: '- PV IN', polarity: 'neg', side: 'bottom', direction: 'in', maxAmps: 40 },
        { id: 'bat_pos', label: '+ BAT OUT', polarity: 'pos', side: 'top', direction: 'out', maxAmps: 60 },
        { id: 'bat_neg', label: '- BAT OUT', polarity: 'neg', side: 'top', direction: 'out', maxAmps: 60 }
      ]
    },
    {
      catalogId: 'sys_battery',
      label: 'Bateria LiFePO4 560Ah',
      subtitle: 'Kingbo 12.8V · 7.168 kWh · BMS 200A',
      category: 'system_fixed',
      kind: 'generic',
      icon: '🔋',
      voltage: 12.8,
      watts: 2560,
      amps: 200,
      isSource: true,
      ports: [
        { id: 'bat_pos', label: '+ Borne Positivo', polarity: 'pos', side: 'right', direction: 'bidirectional', maxAmps: 250 },
        { id: 'bat_neg', label: '- Borne Negativo', polarity: 'neg', side: 'right', direction: 'bidirectional', maxAmps: 250 }
      ]
    },
    {
      catalogId: 'sys_alternator',
      label: 'Alternador + Bateria Cofre',
      subtitle: 'Fiat Doblò 12V · Ignição D+',
      category: 'system_fixed',
      kind: 'generic',
      icon: '🚗',
      voltage: 14.2,
      watts: 1200,
      amps: 30,
      isSource: true,
      ports: [
        { id: 'alt_pos', label: '+ Bateria Partida', polarity: 'pos', side: 'right', direction: 'out', maxAmps: 80 },
        { id: 'alt_neg', label: '- Chassi / Terra', polarity: 'neg', side: 'right', direction: 'bidirectional', maxAmps: 80 },
        { id: 'ign_dplus', label: 'Sinal Ignição D+', polarity: 'signal', side: 'right', direction: 'out' }
      ]
    },
    {
      catalogId: 'sys_b2b',
      label: `Carregador DC-DC B2B ${b2bAmps}A`,
      subtitle: `Alternador ➔ LiFePO4 (${b2bWatts}W)`,
      category: 'system_fixed',
      kind: 'generic',
      icon: '🔄',
      voltage: 12.8,
      watts: b2bWatts,
      amps: b2bAmps,
      isSource: true,
      ports: [
        { id: 'in_pos', label: '+ Alt IN', polarity: 'pos', side: 'left', direction: 'in', maxAmps: 45 },
        { id: 'in_neg', label: '- GND IN', polarity: 'neg', side: 'left', direction: 'in', maxAmps: 45 },
        { id: 'in_dplus', label: 'Sinal D+', polarity: 'signal', side: 'bottom', direction: 'in' },
        { id: 'out_pos', label: '+ Casa OUT', polarity: 'pos', side: 'right', direction: 'out', maxAmps: 45 },
        { id: 'out_neg', label: '- Casa OUT', polarity: 'neg', side: 'right', direction: 'out', maxAmps: 45 }
      ]
    },
    {
      catalogId: 'sys_usina',
      label: `Fonte Usina ${usinaAmps}A`,
      subtitle: `Smart Connect Bivolt (${usinaWatts}W)`,
      category: 'system_fixed',
      kind: 'generic',
      icon: '🔌',
      voltage: 12.8,
      watts: usinaWatts,
      amps: usinaAmps,
      isSource: true,
      ports: [
        { id: 'ac_phase', label: 'AC Fase', polarity: 'ac_phase', side: 'top', direction: 'in', maxAmps: 20 },
        { id: 'ac_neutral', label: 'AC Neutro', polarity: 'ac_neutral', side: 'top', direction: 'in', maxAmps: 20 },
        { id: 'dc_pos', label: '+ DC OUT', polarity: 'pos', side: 'right', direction: 'out', maxAmps: usinaAmps + 30 },
        { id: 'dc_neg', label: '- DC OUT', polarity: 'neg', side: 'right', direction: 'out', maxAmps: usinaAmps + 30 }
      ]
    }
  ];
}

export function buildApplianceTemplate(app: ApplianceItem): ElectricalCatalogTemplate {
  const isAcLoad =
    app.name.toLowerCase().includes('inversor') ||
    app.name.toLowerCase().includes('cafeteira') ||
    app.name.toLowerCase().includes('220v') ||
    app.name.toLowerCase().includes('110v');
  const voltage = isAcLoad ? 220 : 12.8;
  const totalWatts = Math.round(app.watts * (app.qty || 1));
  const amps = +(totalWatts / voltage).toFixed(1);

  return {
    catalogId: `load_${app.id}`,
    label: app.name,
    subtitle: `${totalWatts}W · ${app.hours}h/dia${app.qty > 1 ? ` (${app.qty}x)` : ''}`,
    category: 'consumption_load',
    kind: 'generic',
    icon: getApplianceIcon(app.name),
    voltage,
    watts: totalWatts,
    amps,
    isSource: false,
    ports: isAcLoad
      ? [
        { id: 'ac_phase', label: 'Fase AC', polarity: 'ac_phase', side: 'left', direction: 'in' },
        { id: 'ac_neutral', label: 'Neutro AC', polarity: 'ac_neutral', side: 'left', direction: 'in' }
      ]
      : [
        { id: 'in_pos', label: '+ 12V', polarity: 'pos', side: 'left', direction: 'in' },
        { id: 'in_neg', label: '- 12V', polarity: 'neg', side: 'left', direction: 'in' }
      ]
  };
}

export function getApplianceIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('geladeira') || lower.includes('fridge')) return '❄️';
  if (lower.includes('led') || lower.includes('ilumina') || lower.includes('luz')) return '💡';
  if (lower.includes('bomba') || lower.includes('água') || lower.includes('agua')) return '🚿';
  if (lower.includes('notebook') || lower.includes('laptop')) return '💻';
  if (lower.includes('monitor') || lower.includes('tv')) return '🖥️';
  if (lower.includes('starlink') || lower.includes('roteador') || lower.includes('wifi')) return '📡';
  if (lower.includes('ventilador') || lower.includes('climatizador')) return '💨';
  if (lower.includes('cafeteira')) return '☕';
  if (lower.includes('smartphone') || lower.includes('tablet') || lower.includes('usb')) return '📱';
  return '🔌';
}

export function templateToNodeData(
  tpl: ElectricalCatalogTemplate,
  extra?: Partial<ElectricalNodeData>
): ElectricalNodeData {
  const systemKeyMap: Record<string, ElectricalNodeData['systemKey']> = {
    sys_solar_panels: 'solar_panels',
    sys_mppt: 'mppt',
    sys_battery: 'battery',
    sys_alternator: 'alternator',
    sys_b2b: 'b2b',
    sys_usina: 'usina'
  };

  return {
    catalogId: tpl.catalogId,
    systemKey: systemKeyMap[tpl.catalogId],
    label: tpl.label,
    subtitle: tpl.subtitle,
    category: tpl.category,
    kind: tpl.kind,
    icon: tpl.icon,
    voltage: tpl.voltage,
    watts: tpl.watts,
    amps: tpl.amps,
    isSource: tpl.isSource ?? false,
    isEnabled: true,
    fuseWayCount: tpl.fuseWayCount,
    busbarPolarity: tpl.busbarPolarity,
    busbarTermCount: tpl.busbarTermCount,
    breakerAmps: tpl.breakerAmps,
    breakerPoles: tpl.breakerPoles,
    ports: tpl.ports.map((p) => ({ ...p })),
    ...extra
  };
}

export function buildCustomTemplate(params: {
  name: string;
  subtitle?: string;
  icon: string;
  voltage: number;
  watts: number;
  isAc?: boolean;
  ports?: ElectricalPort[];
}): ElectricalCatalogTemplate {
  const voltage = Math.max(1, params.voltage || 12.8);
  const watts = Math.max(0, params.watts || 0);
  const amps = +(watts / voltage).toFixed(1);

  const defaultPorts: ElectricalPort[] = params.isAc
    ? [
      { id: 'ac_phase', label: 'Fase AC', polarity: 'ac_phase', side: 'left', direction: 'in' },
      { id: 'ac_neutral', label: 'Neutro AC', polarity: 'ac_neutral', side: 'left', direction: 'in' }
    ]
    : [
      { id: 'in_pos', label: '+ Positivo', polarity: 'pos', side: 'left', direction: 'in' },
      { id: 'in_neg', label: '- Negativo', polarity: 'neg', side: 'left', direction: 'in' }
    ];

  return {
    catalogId: `custom_${Date.now()}`,
    label: params.name.trim() || 'Componente Customizado',
    subtitle: params.subtitle?.trim() || `${watts}W @ ${voltage}V`,
    category: 'custom',
    kind: 'generic',
    icon: params.icon || '🧩',
    voltage,
    watts,
    amps,
    isSource: false,
    ports: params.ports && params.ports.length > 0 ? params.ports : defaultPorts
  };
}

export { INFRASTRUCTURE_CATALOG };
