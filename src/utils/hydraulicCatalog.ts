import { ApplianceItem, PortaPottiPreset, WaterTankConfig } from '../types';
import {
  HydraulicCatalogTemplate,
  HydraulicNodeData,
  HydraulicPort
} from '../types/hydraulicPlanar';
import { extractPvcCutStats } from './pvcUtils';

export function buildHydraulicSystemTemplates(
  waterTank: WaterTankConfig,
  appliances: ApplianceItem[],
  activePortaPottiPreset?: PortaPottiPreset
): HydraulicCatalogTemplate[] {
  const pvcStats = extractPvcCutStats(waterTank);
  const pumpApp = appliances.find(
    (a) =>
      a.name.toLowerCase().includes('bomba') ||
      a.name.toLowerCase().includes('seaflo') ||
      a.name.toLowerCase().includes('água')
  );
  const pumpWatts = pumpApp ? Math.round(pumpApp.watts * (pumpApp.qty || 1)) : 60;
  const ppModel = activePortaPottiPreset?.model || activePortaPottiPreset?.name || 'Porta Potti 20L';
  const ppFlushL = activePortaPottiPreset?.freshWaterCapacityLiters || 12;
  const ppWasteL = activePortaPottiPreset?.wasteCapacityLiters || 20;

  return [
    {
      catalogId: 'sys_water_tank_u',
      label: `Caixa d'Água em U (${pvcStats.totalCapacityL}L)`,
      subtitle: waterTank.enabled
        ? `PVC Teto Ø${waterTank.diameterMm}mm · ${pvcStats.totalLinearMeters}m`
        : 'Caixa PVC em U desativada na aba 2',
      category: 'system_fixed',
      kind: 'tank',
      icon: '💧',
      flowLpm: 0,
      pressurePsi: 0,
      capacityLiters: pvcStats.totalCapacityL,
      defaultDiameterMm: 20,
      isSource: true,
      ports: [
        { id: 'in_fill', label: 'Entrada Abast.', fluidType: 'cold', side: 'top', direction: 'in', connectionSpec: '3/4"' },
        { id: 'out_supply', label: 'Saída Bomba', fluidType: 'cold', side: 'right', direction: 'out', connectionSpec: '1/2"' },
        { id: 'out_vent', label: 'Respiro / Ladrão', fluidType: 'vent', side: 'top', direction: 'out', connectionSpec: '10mm' },
        { id: 'out_drain', label: 'Dreno Fundo', fluidType: 'cold', side: 'bottom', direction: 'out', connectionSpec: '1/2"' }
      ]
    },
    {
      catalogId: 'sys_internal_clean_tank',
      label: 'Reservatório Água Limpa Interno',
      subtitle: 'Tanque / Bombona 50L–80L c/ Ladrão',
      category: 'system_fixed',
      kind: 'tank',
      icon: '🛢️',
      flowLpm: 0,
      pressurePsi: 0,
      capacityLiters: 60,
      defaultDiameterMm: 12,
      isSource: true,
      ports: [
        { id: 'in_fill', label: 'Abastecimento', fluidType: 'cold', side: 'left', direction: 'in', connectionSpec: '1/2"' },
        { id: 'out_vent', label: 'Ladrão / Suspiro', fluidType: 'vent', side: 'top', direction: 'out', connectionSpec: '10mm' },
        { id: 'out_pump', label: 'Sucção Bomba', fluidType: 'cold', side: 'right', direction: 'out', connectionSpec: '1/2"' }
      ]
    },
    {
      catalogId: 'sys_gray_tank',
      label: 'Caixa de Água Cinza (Esgoto)',
      subtitle: 'Reservatório Coletor 40L Sob Assoalho',
      category: 'system_fixed',
      kind: 'tank',
      icon: '🪣',
      flowLpm: 0,
      pressurePsi: 0,
      capacityLiters: 40,
      defaultDiameterMm: 25,
      isDrain: true,
      ports: [
        { id: 'in_gray', label: 'Entrada Esgoto', fluidType: 'gray_drain', side: 'top', direction: 'in', connectionSpec: '1"' },
        { id: 'out_vent', label: 'Respiro Cinza', fluidType: 'vent', side: 'top', direction: 'out', connectionSpec: '10mm' },
        { id: 'out_dump', label: 'Registro Descarte', fluidType: 'gray_drain', side: 'bottom', direction: 'out', connectionSpec: '1"' }
      ]
    },
    {
      catalogId: 'sys_seaflo_pump',
      label: 'Bomba Pressurizadora 12V',
      subtitle: `Seaflo Automática 11.3 L/min (${pumpWatts}W)`,
      category: 'system_fixed',
      kind: 'pump',
      icon: '⚙️',
      flowLpm: 11.3,
      pressurePsi: 45,
      capacityLiters: 0,
      defaultDiameterMm: 12,
      isSource: true,
      ports: [
        { id: 'in_suction', label: 'Sucção IN', fluidType: 'cold', side: 'left', direction: 'in', connectionSpec: '1/2"' },
        { id: 'out_press', label: 'Pressurizada OUT', fluidType: 'hot', side: 'right', direction: 'out', connectionSpec: '1/2"' },
        { id: 'ctrl_switch', label: 'Interruptor 12V', fluidType: 'control', side: 'bottom', direction: 'in' }
      ]
    },
    {
      catalogId: 'sys_porta_potti',
      label: ppModel,
      subtitle: `Descarga ${ppFlushL}L · Detritos ${ppWasteL}L`,
      category: 'system_fixed',
      kind: 'tank',
      icon: '🚽',
      flowLpm: 0,
      pressurePsi: 0,
      capacityLiters: ppFlushL,
      defaultDiameterMm: 12,
      ports: [
        { id: 'in_fill', label: 'Reabastecer (opc)', fluidType: 'cold', side: 'left', direction: 'in' }
      ]
    }
  ];
}

export function hydraulicTemplateToNodeData(
  tpl: HydraulicCatalogTemplate,
  extra?: Partial<HydraulicNodeData>
): HydraulicNodeData {
  const systemKeyMap: Record<string, HydraulicNodeData['systemKey']> = {
    sys_water_tank_u: 'water_tank_u',
    sys_internal_clean_tank: 'internal_clean_tank',
    sys_gray_tank: 'gray_tank',
    sys_seaflo_pump: 'seaflo_pump',
    sys_porta_potti: 'porta_potti'
  };

  return {
    catalogId: tpl.catalogId,
    systemKey: systemKeyMap[tpl.catalogId],
    label: tpl.label,
    subtitle: tpl.subtitle,
    category: tpl.category,
    kind: tpl.kind,
    icon: tpl.icon,
    flowLpm: tpl.flowLpm,
    pressurePsi: tpl.pressurePsi,
    capacityLiters: tpl.capacityLiters,
    defaultDiameterMm: tpl.defaultDiameterMm,
    isSource: tpl.isSource ?? false,
    isDrain: tpl.isDrain ?? false,
    isEnabled: true,
    ports: tpl.ports.map((p) => ({ ...p })),
    ...extra
  };
}

export function buildCustomHydraulicTemplate(params: {
  name: string;
  subtitle?: string;
  icon: string;
  flowLpm: number;
  capacityLiters: number;
  diameterMm: number;
  isDrain?: boolean;
  ports?: HydraulicPort[];
}): HydraulicCatalogTemplate {
  const defaultPorts: HydraulicPort[] = params.isDrain
    ? [
        { id: 'in_drain', label: 'Entrada Esgoto', fluidType: 'gray_drain', side: 'left', direction: 'in' },
        { id: 'out_drain', label: 'Saída Esgoto', fluidType: 'gray_drain', side: 'right', direction: 'out' }
      ]
    : [
        { id: 'in_water', label: 'Entrada Água', fluidType: 'cold', side: 'left', direction: 'in' },
        { id: 'out_water', label: 'Saída Água', fluidType: 'cold', side: 'right', direction: 'out' }
      ];

  return {
    catalogId: `h_custom_${Date.now()}`,
    label: params.name.trim() || 'Componente Hidráulico',
    subtitle: params.subtitle?.trim() || `${params.flowLpm} L/min · Ø${params.diameterMm}mm`,
    category: 'custom',
    kind: 'generic',
    icon: params.icon || '💧',
    flowLpm: Math.max(0, params.flowLpm || 0),
    pressurePsi: 35,
    capacityLiters: Math.max(0, params.capacityLiters || 0),
    defaultDiameterMm: params.diameterMm || 12,
    isDrain: params.isDrain,
    ports: params.ports && params.ports.length > 0 ? params.ports : defaultPorts
  };
}
