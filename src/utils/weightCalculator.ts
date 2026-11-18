import {
  InternalBoxItem,
  InternalGridConfig,
  SavedConfig,
  SolarPanelPreset,
  CargoBoxConfig,
  CargoBoxPreset,
  WaterTankConfig,
  AwningConfig,
  BatteryPreset,
  MpptPreset,
  B2bPreset,
  FridgePreset,
  PortaPottiPreset,
  StovePreset,
  StructureMaterial,
} from '../types';

export type WeightCategory = 'roof' | 'furniture' | 'electrical' | 'appliances' | 'water';

export interface InstalledWeightItem {
  id: string;
  name: string;
  specification: string;
  category: WeightCategory;
  categoryLabel: string;
  location: string;
  quantity: number;
  unitWeightKg: number;
  totalWeightKg: number;
  isOptionalOrVariable?: boolean;
  notes?: string;
  icon?: string;
}

export interface WeightBalanceSummary {
  items: InstalledWeightItem[];
  totalDryKg: number;
  totalFullKg: number;
  activeTotalKg: number;

  // Detalhamento por categoria
  roofTotalKg: number;
  furnitureTotalKg: number;
  electricalTotalKg: number;
  appliancesTotalKg: number;
  waterTotalKg: number;

  // Limites da Fiat Doblò
  dobloPayloadLimitKg: number; // 620 kg de capacidade de carga útil
  remainingPayloadKg: number;
  payloadUsagePct: number;

  // Limites do Teto
  roofDynamicLimitKg: number; // 100 kg (em movimento)
  roofStaticLimitKg: number;  // 300 kg (acampamento parado)
  roofDynamicUsagePct: number;

  // Centro de Gravidade / Distribuição
  roofSharePct: number;
  floorSharePct: number;

  isRoofOverloaded: boolean;
  isVehicleOverloaded: boolean;
}

export interface WeightCalculatorParams {
  structureMaterial: StructureMaterial;
  metalonThickness40?: number;
  metalonThickness30?: number;
  stackLevels: number;
  panelCount: number;
  activePanelPreset?: SolarPanelPreset | null;
  cargoBox: CargoBoxConfig;
  activeCargoBoxPreset?: CargoBoxPreset | null;
  waterTank: WaterTankConfig;
  awning: AwningConfig;
  internalGrid: InternalGridConfig;
  internalBoxes: InternalBoxItem[];
  activeBatteryPreset?: BatteryPreset | null;
  activeMpptPreset?: MpptPreset | null;
  activeB2bPreset?: B2bPreset | null;
  activeFridgePreset?: FridgePreset | null;
  activePortaPottiPreset?: PortaPottiPreset | null;
  activeStovePreset?: StovePreset | null;
  isWaterFull?: boolean;
  isPortaPottiFull?: boolean;
}

export function calculateWeightBalance(params: WeightCalculatorParams): WeightBalanceSummary {
  const {
    structureMaterial,
    metalonThickness40 = 2.0,
    metalonThickness30 = 1.5,
    stackLevels = 2,
    panelCount = 4,
    activePanelPreset,
    cargoBox,
    activeCargoBoxPreset,
    waterTank,
    awning,
    internalGrid,
    internalBoxes,
    activeBatteryPreset,
    activeMpptPreset,
    activeB2bPreset,
    activeFridgePreset,
    activePortaPottiPreset,
    activeStovePreset,
    isWaterFull = true,
    isPortaPottiFull = false,
  } = params;

  const items: InstalledWeightItem[] = [];

  // ==========================================
  // 1. TETO & ESTRUTURA METÁLICA (ROOF RACK)
  // ==========================================
  const isSteel = structureMaterial === 'steel';
  const isAluTube = structureMaterial === 'aluminum_tube';
  const isTelescopic = cargoBox?.isTelescopic !== false;

  const refArea40 = 4 * 0.0020 * (0.040 - 0.0020);
  const curArea40 = 4 * (metalonThickness40 / 1000) * (0.040 - metalonThickness40 / 1000);
  const k40 = (isSteel || isAluTube) ? (curArea40 / refArea40) : 1.0;

  const refArea30 = 4 * 0.0015 * (0.030 - 0.0015);
  const curArea30 = 4 * (metalonThickness30 / 1000) * (0.030 - metalonThickness30 / 1000);
  const k30 = (isSteel || isAluTube) ? (curArea30 / refArea30) : 1.0;

  // Base do Rack e Torres
  const nominalBase = cargoBox.enabled
    ? (isSteel ? (isTelescopic ? 28.5 : 25.5) : isAluTube ? (isTelescopic ? 9.5 : 8.2) : (isTelescopic ? 14.5 : 12.5))
    : (isSteel ? 26.0 : isAluTube ? 8.5 : 11.5);
  const baseWeight = +(nominalBase * k40).toFixed(1);

  items.push({
    id: 'rack_base_frame',
    name: 'Chassi do Rack & Torres de Fixação',
    specification: isSteel ? 'Metalon Aço 40x40mm' : isAluTube ? 'Tubo Alumínio 40x40mm' : 'Perfil Estrutural T-Slot 40x40',
    category: 'roof',
    categoryLabel: 'Teto & Estrutura',
    location: 'Teto da Doblò',
    quantity: 1,
    unitWeightKg: baseWeight,
    totalWeightKg: baseWeight,
    icon: '🏗️',
  });

  // Bandejas retráteis dos leitos solares
  const nominalTrays = stackLevels * (isSteel ? 5.2 : isAluTube ? 1.2 : 2.3);
  const traysWeight = +(nominalTrays * k30).toFixed(1);
  const guideHardwareWeight = Math.max(0, stackLevels - 1) * 0.8; // Parafusos guia M8 inox + arruelas de nylon/teflon + perfil guia
  const slidingSystemWeight = +(traysWeight + guideHardwareWeight).toFixed(1);

  items.push({
    id: 'sliding_trays_slides',
    name: 'Bandejas Solares & Guias c/ Parafusos Deslizantes',
    specification: `${stackLevels} Níveis retráteis c/ perfis guia de alumínio e parafusos guia M8 inox (sem corrediças metálicas)`,
    category: 'roof',
    categoryLabel: 'Teto & Estrutura',
    location: 'Rack de Teto',
    quantity: 1,
    unitWeightKg: slidingSystemWeight,
    totalWeightKg: slidingSystemWeight,
    icon: '🔄',
  });

  // Placas Solares
  const panelUnitKg = activePanelPreset?.weightKg ?? 1.8;
  const panelsTotalKg = +(panelCount * panelUnitKg).toFixed(1);
  items.push({
    id: 'solar_panels',
    name: 'Painéis Fotovoltaicos Flexíveis',
    specification: activePanelPreset ? `${activePanelPreset.name} (${activePanelPreset.powerWatts}W)` : 'Placas Flexíveis 100W',
    category: 'roof',
    categoryLabel: 'Teto & Estrutura',
    location: 'Rack de Teto',
    quantity: panelCount,
    unitWeightKg: panelUnitKg,
    totalWeightKg: panelsTotalKg,
    icon: '☀️',
  });

  // Baú de Teto Motobul
  if (cargoBox.enabled) {
    const cargoWeight = activeCargoBoxPreset?.weightKg ?? (cargoBox.length >= 1800 ? 21.0 : cargoBox.length <= 1500 ? 15.5 : 18.0);
    items.push({
      id: 'cargo_box',
      name: 'Baú de Teto Motobul Off-Road',
      specification: activeCargoBoxPreset ? `${activeCargoBoxPreset.name} (ABS UV)` : 'Baú Automotivo 550L',
      category: 'roof',
      categoryLabel: 'Teto & Estrutura',
      location: 'Rack de Teto',
      quantity: 1,
      unitWeightKg: cargoWeight,
      totalWeightKg: cargoWeight,
      icon: '🧰',
    });
  }

  // Toldo Retrátil
  if (awning.enabled) {
    const awningKg = awning.type === 'batwing_270' ? 20.0 : 10.5;
    items.push({
      id: 'awning',
      name: awning.type === 'batwing_270' ? 'Toldo Asa de Morcego 270°' : 'Toldo Traseiro Reto',
      specification: `Lona Ripstop impermeável + braços articulados (${awning.lengthMm}mm)`,
      category: 'roof',
      categoryLabel: 'Teto & Estrutura',
      location: 'Lateral do Rack',
      quantity: 1,
      unitWeightKg: awningKg,
      totalWeightKg: awningKg,
      icon: '⛺',
    });
  }

  // Caixa d'água tubular (Tubulação PVC)
  let waterLiters = 0;
  let pipeWeight = 0;
  if (waterTank.enabled) {
    const pipeRadiusMm = Math.round(waterTank.diameterMm / 2);
    const pipeRadiusDm = pipeRadiusMm / 100;
    const pipeRadiusM = pipeRadiusMm / 1000;
    const frameInnerX = 0.70 - 0.04;
    const pipeOffsetX = frameInnerX - pipeRadiusM;
    const bendR = Math.max(0.06, pipeRadiusM * 1.35);
    const frontPipeSpanM = Math.max(0.20, (pipeOffsetX - bendR) * 2);
    const frontCircuitAddonM = frontPipeSpanM + Math.PI * bendR;
    const singlePipeLiters = Math.PI * pipeRadiusDm * pipeRadiusDm * (waterTank.lengthMm / 100);
    const frontCircuitLiters = Math.PI * pipeRadiusDm * pipeRadiusDm * (frontCircuitAddonM * 10);
    waterLiters = +(singlePipeLiters * 2 + frontCircuitLiters).toFixed(1);
    pipeWeight = +(Math.round((waterTank.diameterMm / 100) * 8.5 * 10) / 10).toFixed(1);

    items.push({
      id: 'water_tank_tubes',
      name: 'Reservatório Tubular PVC (Estrutura Seca)',
      specification: `2× Canos PVC Ø${waterTank.diameterMm}mm × ${waterTank.lengthMm}mm + Curva Frontal`,
      category: 'water',
      categoryLabel: 'Água & Hidráulica',
      location: 'Laterais do Rack',
      quantity: 1,
      unitWeightKg: pipeWeight,
      totalWeightKg: pipeWeight,
      icon: '🚰',
    });

    const activeWaterKg = isWaterFull ? waterLiters : 0;
    items.push({
      id: 'water_liquid',
      name: 'Água Potável no Reservatório',
      specification: `${waterLiters} Litros (${isWaterFull ? 'Tanque Cheio' : 'Tanque Vazio'})`,
      category: 'water',
      categoryLabel: 'Água & Hidráulica',
      location: 'Interno nos Tubos',
      quantity: 1,
      unitWeightKg: activeWaterKg,
      totalWeightKg: activeWaterKg,
      isOptionalOrVariable: true,
      notes: isWaterFull ? 'Peso da água cheia operacional' : 'Sem água (transporte seco)',
      icon: '💧',
    });
  }

  // Ferragens e fixadores do rack
  const rackHardwareKg = cargoBox.enabled ? 5.0 : 3.2;
  items.push({
    id: 'rack_hardware',
    name: 'Parafusos Inox, Suportes & Pistões a Gás',
    specification: 'Fixadores bicromatizados/inox + amortecedores a gás',
    category: 'roof',
    categoryLabel: 'Teto & Estrutura',
    location: 'Rack de Teto',
    quantity: 1,
    unitWeightKg: rackHardwareKg,
    totalWeightKg: rackHardwareKg,
    icon: '🔩',
  });

  // ==========================================
  // 2. MARCENARIA & MÓDULOS INTERNOS
  // ==========================================
  const colWidthM = (internalGrid.widthMm / (internalGrid.colsX || 3)) / 1000;
  const rowLengthM = (internalGrid.lengthMm / (internalGrid.rowsZ || 4)) / 1000;

  internalBoxes.forEach((box) => {
    const widthM = (box.colSpan || 1) * colWidthM;
    const lengthM = (box.rowSpan || 1) * rowLengthM;
    const heightM = (box.heightMm || 400) / 1000;

    // Área de superfície aproximada da caixa em m²:
    // Fundo (L×W) + Frente/Trás (2×W×H) + Laterais (2×L×H) + Tampa superior (L×W)
    const areaM2 = (lengthM * widthM) * 2 + (2 * widthM * heightM) + (2 * lengthM * heightM);
    // Compensado 15mm ~9.75 kg/m², MDF 15mm ~11.25 kg/m²
    const unitDensity = box.material === 'white_mdf' ? 11.25 : box.material === 'dark_wood' ? 10.5 : 9.75;
    const woodKg = +(areaM2 * unitDensity).toFixed(1);
    const hardwareKg = box.type === 'drawer' ? 3.5 : box.type === 'vertical_lift' ? 4.5 : 1.5; // Corrediças, barras pantográficas de elevação ou dobradiças
    const boxTotalKg = +(woodKg + hardwareKg).toFixed(1);

    const typeDesc =
      box.type === 'drawer'
        ? 'Gavetão Telescópico'
        : box.type === 'vertical_lift'
        ? 'Módulo Elevatório Vertical (Extensível)'
        : box.type === 'slat_bed'
      ? 'Base de Cama / Estrado Ripado'
      : box.type === 'chest'
        ? 'Baú com Tampa Articulada'
        : box.type === 'slide_tray'
          ? 'Bandeja Deslizante'
          : 'Módulo Aberto';

    items.push({
      id: `box_${box.id}`,
      name: `Módulo: ${box.name}`,
      specification: `${typeDesc} (${Math.round(widthM * 1000)}×${Math.round(lengthM * 1000)}×${box.heightMm}mm) em ${box.material === 'white_mdf' ? 'MDF Branco' : box.material === 'dark_wood' ? 'Madeira Escura' : 'Compensado Naval 15mm'}`,
      category: 'furniture',
      categoryLabel: 'Marcenaria & Móveis',
      location: 'Interior da Doblò',
      quantity: 1,
      unitWeightKg: boxTotalKg,
      totalWeightKg: boxTotalKg,
      icon: box.type === 'drawer' ? '🗄️' : box.type === 'vertical_lift' ? '🏗️' : '📦',
    });
  });

  // Forro de teto ripado (Ceiling)
  if (internalGrid.ceiling?.enabled) {
    const ceilingKg = internalGrid.ceiling.type === 'slatted' ? 13.5 : 8.5;
    items.push({
      id: 'ceiling_lining',
      name: 'Forro de Teto Termoacústico c/ LEDs',
      specification: `Ripado em madeira nobre ${internalGrid.ceiling.slattedWood || 'Freijó'} + Feltro acústico`,
      category: 'furniture',
      categoryLabel: 'Marcenaria & Móveis',
      location: 'Teto Interno (Forro)',
      quantity: 1,
      unitWeightKg: ceilingKg,
      totalWeightKg: ceilingKg,
      icon: '✨',
    });
  }

  // Colchão & Estofados D33
  items.push({
    id: 'mattress_upholstery',
    name: 'Colchão Tri-Partite D33 Naval',
    specification: 'Espuma ortopédica alta densidade D33 + Tecido impermeável náutico',
    category: 'furniture',
    categoryLabel: 'Marcenaria & Móveis',
    location: 'Sobre os Baús/Cama',
    quantity: 1,
    unitWeightKg: 8.5,
    totalWeightKg: 8.5,
    icon: '🛏️',
  });

  // ==========================================
  // 3. SISTEMA ELÉTRICO & ENERGIA
  // ==========================================
  // Bateria LiFePO4
  const batteryKg = activeBatteryPreset?.weightKg ?? 26.5;
  items.push({
    id: 'battery_lifepo4',
    name: 'Banco de Bateria LiFePO4',
    specification: activeBatteryPreset ? `${activeBatteryPreset.name} (${activeBatteryPreset.capacityAh}Ah / 12.8V)` : 'LiFePO4 200Ah Smart BMS',
    category: 'electrical',
    categoryLabel: 'Sistema Elétrico',
    location: 'Baú Elétrico (Assoalho)',
    quantity: 1,
    unitWeightKg: batteryKg,
    totalWeightKg: batteryKg,
    icon: '🔋',
  });

  // Controlador MPPT
  const mpptKg = activeMpptPreset?.weightKg ?? 2.8;
  items.push({
    id: 'mppt_controller',
    name: 'Controlador Solar MPPT',
    specification: activeMpptPreset ? `${activeMpptPreset.name}` : 'MPPT 40A c/ Display LCD',
    category: 'electrical',
    categoryLabel: 'Sistema Elétrico',
    location: 'Painel Elétrico',
    quantity: 1,
    unitWeightKg: mpptKg,
    totalWeightKg: mpptKg,
    icon: '⚡',
  });

  // Carregador B2B (Alternador)
  const b2bKg = activeB2bPreset?.weightKg ?? 1.8;
  items.push({
    id: 'b2b_charger',
    name: 'Carregador DC-DC Alternador (B2B)',
    specification: activeB2bPreset ? `${activeB2bPreset.name}` : 'B2B 30A Smart Charger',
    category: 'electrical',
    categoryLabel: 'Sistema Elétrico',
    location: 'Painel Elétrico',
    quantity: 1,
    unitWeightKg: b2bKg,
    totalWeightKg: b2bKg,
    icon: '🔄',
  });

  // Fonte Usina Smart Connect
  items.push({
    id: 'usina_charger',
    name: 'Fonte Carregador Usina Smart Connect',
    specification: 'Usina 150A Bivolt c/ Voltímetro/Amperímetro integrado',
    category: 'electrical',
    categoryLabel: 'Sistema Elétrico',
    location: 'Painel Elétrico',
    quantity: 1,
    unitWeightKg: 3.5,
    totalWeightKg: 3.5,
    icon: '🔌',
  });

  // Chicotes Elétricos, Disjuntores & Barramentos
  items.push({
    id: 'electrical_cables_busbars',
    name: 'Cabeamento de Cobre 35mm² & Barramentos',
    specification: 'Chicotes automotivos anti-chama, porta-fusíveis MEGA/MIDI e disjuntores',
    category: 'electrical',
    categoryLabel: 'Sistema Elétrico',
    location: 'Passagens e Dutos',
    quantity: 1,
    unitWeightKg: 4.2,
    totalWeightKg: 4.2,
    icon: '🧵',
  });

  // ==========================================
  // 4. ELETRODOMÉSTICOS & EQUIPAMENTOS
  // ==========================================
  // Geladeira 12V
  const fridgeKg = activeFridgePreset?.weightKg ?? 13.5;
  items.push({
    id: 'fridge_12v',
    name: 'Geladeira Automotiva 12V / 24V',
    specification: activeFridgePreset ? `${activeFridgePreset.name} (Compressor Hermético)` : 'Geladeira 31 Litros',
    category: 'appliances',
    categoryLabel: 'Eletrodomésticos',
    location: 'Gavetão / Baú Deslizante',
    quantity: 1,
    unitWeightKg: fridgeKg,
    totalWeightKg: fridgeKg,
    icon: '❄️',
  });

  // Vaso Sanitário Químico (Porta Potti)
  const pottiDryKg = activePortaPottiPreset?.weightEmptyKg ?? 5.4;
  const pottiFullKg = activePortaPottiPreset?.weightFullKg ?? 15.4;
  const activePottiKg = isPortaPottiFull ? pottiFullKg : pottiDryKg;
  items.push({
    id: 'porta_potti',
    name: 'Vaso Sanitário Químico (Porta Potti)',
    specification: activePortaPottiPreset
      ? `${activePortaPottiPreset.name} (${isPortaPottiFull ? 'Cheio operacional' : 'Vazio seco'})`
      : 'Porta Potti 20L',
    category: 'appliances',
    categoryLabel: 'Eletrodomésticos',
    location: 'Módulo Retrátil Embutido',
    quantity: 1,
    unitWeightKg: activePottiKg,
    totalWeightKg: activePottiKg,
    isOptionalOrVariable: true,
    icon: '🚽',
  });

  // Fogão Cooktop
  const stoveKg = activeStovePreset?.weightKg ?? 2.2;
  items.push({
    id: 'gas_stove',
    name: 'Fogareiro / Fogão Cooktop a Gás',
    specification: activeStovePreset ? `${activeStovePreset.name} + Cartuchos/Botijão` : 'Fogão 2 bocas portátil',
    category: 'appliances',
    categoryLabel: 'Eletrodomésticos',
    location: 'Gaveta Cozinha Traseira',
    quantity: 1,
    unitWeightKg: +(stoveKg + 1.5).toFixed(1),
    totalWeightKg: +(stoveKg + 1.5).toFixed(1),
    icon: '🍳',
  });

  // Bomba d'água 12V e conexões
  items.push({
    id: 'water_pump_fixtures',
    name: 'Bomba d\'Água 12V Pressurizada & Conexões',
    specification: 'Seaflo 3.0 GPM 45 PSI + Vaso de Expansão + Mangueiras PEX',
    category: 'appliances',
    categoryLabel: 'Eletrodomésticos',
    location: 'Assoalho Lateral',
    quantity: 1,
    unitWeightKg: 2.8,
    totalWeightKg: 2.8,
    icon: '⚙️',
  });

  // ==========================================
  // TOTAIS E BALANÇO DE CARGA
  // ==========================================
  let totalDryKg = 0;
  let totalFullKg = 0;
  let activeTotalKg = 0;

  let roofTotalKg = 0;
  let furnitureTotalKg = 0;
  let electricalTotalKg = 0;
  let appliancesTotalKg = 0;
  let waterTotalKg = 0;

  items.forEach((item) => {
    activeTotalKg += item.totalWeightKg;

    // Categorias
    if (item.category === 'roof') roofTotalKg += item.totalWeightKg;
    if (item.category === 'furniture') furnitureTotalKg += item.totalWeightKg;
    if (item.category === 'electrical') electricalTotalKg += item.totalWeightKg;
    if (item.category === 'appliances') appliancesTotalKg += item.totalWeightKg;
    if (item.category === 'water') waterTotalKg += item.totalWeightKg;

    // Cálculo Seco vs Cheio
    if (item.id === 'water_liquid') {
      totalFullKg += item.totalWeightKg;
    } else if (item.id === 'porta_potti') {
      totalDryKg += pottiDryKg;
      totalFullKg += pottiFullKg;
    } else {
      totalDryKg += item.totalWeightKg;
      totalFullKg += item.totalWeightKg;
    }
  });

  // Arredonda valores
  roofTotalKg = +roofTotalKg.toFixed(1);
  furnitureTotalKg = +furnitureTotalKg.toFixed(1);
  electricalTotalKg = +electricalTotalKg.toFixed(1);
  appliancesTotalKg = +appliancesTotalKg.toFixed(1);
  waterTotalKg = +waterTotalKg.toFixed(1);
  totalDryKg = +totalDryKg.toFixed(1);
  totalFullKg = +totalFullKg.toFixed(1);
  activeTotalKg = +activeTotalKg.toFixed(1);

  // Capacidades da Fiat Doblò
  const dobloPayloadLimitKg = 620; // 620 kg capacidade de carga útil
  const remainingPayloadKg = +(dobloPayloadLimitKg - activeTotalKg).toFixed(1);
  const payloadUsagePct = Math.round((activeTotalKg / dobloPayloadLimitKg) * 100);

  // Teto (Atenção: a água no teto conta como peso no teto!)
  const roofDynamicLimitKg = 100; // Limite dinâmico em movimento recomendado pela Fiat
  const roofStaticLimitKg = 300;  // Limite estático em acampamento

  const totalRoofWithWater = +(roofTotalKg + (waterTank.enabled ? (isWaterFull ? waterLiters : 0) + pipeWeight : 0)).toFixed(1);
  const roofDynamicUsagePct = Math.round((totalRoofWithWater / roofDynamicLimitKg) * 100);

  const roofSharePct = Math.round((totalRoofWithWater / activeTotalKg) * 100);
  const floorSharePct = 100 - roofSharePct;

  const isRoofOverloaded = totalRoofWithWater > roofDynamicLimitKg;
  const isVehicleOverloaded = activeTotalKg > dobloPayloadLimitKg;

  return {
    items,
    totalDryKg,
    totalFullKg,
    activeTotalKg,
    roofTotalKg: totalRoofWithWater,
    furnitureTotalKg,
    electricalTotalKg,
    appliancesTotalKg,
    waterTotalKg,
    dobloPayloadLimitKg,
    remainingPayloadKg,
    payloadUsagePct,
    roofDynamicLimitKg,
    roofStaticLimitKg,
    roofDynamicUsagePct,
    roofSharePct,
    floorSharePct,
    isRoofOverloaded,
    isVehicleOverloaded,
  };
}
