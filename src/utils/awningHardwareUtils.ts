import { AwningConfig, AwningType } from '../types/awning';

/**
 * Utilitários para Cálculo e Otimização do Plano de Corte Linear da Ferragem do Toldo Retrátil Overland
 * (Toldo Asa de Morcego 270° e Toldo Traseiro Reto para Fiat Doblò).
 *
 * Mantém o cálculo da ferragem e o plano de corte 100% SEPARADOS da estrutura principal do rack solar
 * e da marcenaria da van.
 */

export interface AwningProfileItem {
  key: string;
  label: string;
  spec: string;
  profileType: 'rectangular_tube' | 'round_tube' | 'channel_u' | 'angle_bracket';
  dimensionsMm: string;
  lengthMm: number;
  lengthM: number;
  qty: number;
  totalLengthM: number;
  weightKgPerMeter: number;
  totalWeightKg: number;
  purpose: string;
  color: string;
}

export interface AwningFittingItem {
  key: string;
  label: string;
  spec: string;
  qty: number;
  unit: string;
  material: string;
  group: 'pivot_assembly' | 'mounting_brackets' | 'hardware' | 'telescopic_locks' | 'anchoring';
  notes: string;
}

export interface AwningCutSegment {
  label: string;
  lengthMm: number;
  color: string;
  pct: number;
  isWaste?: boolean;
}

export interface AwningBarPlan {
  barIndex: number;
  barLengthMm: number;
  usedMm: number;
  wasteMm: number;
  kerfMm: number;
  efficiencyPct: number;
  segments: AwningCutSegment[];
}

export interface AwningHardwareStats {
  enabled: boolean;
  type: AwningType;
  typeLabel: string;
  side: 'passenger' | 'driver';
  sideLabel: string;
  lengthMm: number;
  extensionMm: number;
  isOpen: boolean;
  totalProfilePieces: number;
  totalLinearMeters: number;
  profilesWeightKg: number;
  fittingsWeightKg: number;
  fabricWeightKg: number;
  totalAwningWeightKg: number;
  profileItems: AwningProfileItem[];
  fittings: AwningFittingItem[];
  plan6m: AwningBarPlan[];
  plan3m: AwningBarPlan[];
  recommendedBarOption: '6m' | '3m';
}

/**
 * Algoritmo Best-Fit Decreasing para Otimização de Corte Linear 1D de Barras Comerciais de Alumínio
 */
export function computeAwningLinearBarPlan(
  barLengthMm: number,
  pieces: Array<{ label: string; lengthMm: number; color: string }>,
  kerfMm: number = 3
): AwningBarPlan[] {
  interface WorkingBar {
    cuts: Array<{ label: string; lengthMm: number; color: string }>;
    usedMm: number;
  }

  const bars: WorkingBar[] = [];

  // Ordena decrescente pelo comprimento (Best-Fit Decreasing)
  const sorted = [...pieces].sort((a, b) => b.lengthMm - a.lengthMm);

  sorted.forEach((p) => {
    let bestBarIdx = -1;
    let minRemainingSpace = Infinity;

    // Procura a barra existente que melhor acomoda a peça com menor sobra
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      const addedKerf = b.cuts.length > 0 ? kerfMm : 0;
      const spaceNeeded = p.lengthMm + addedKerf;
      const spaceRemaining = barLengthMm - (b.usedMm + spaceNeeded);

      if (spaceRemaining >= 0 && spaceRemaining < minRemainingSpace) {
        minRemainingSpace = spaceRemaining;
        bestBarIdx = i;
      }
    }

    if (bestBarIdx !== -1) {
      const b = bars[bestBarIdx];
      const addedKerf = b.cuts.length > 0 ? kerfMm : 0;
      b.cuts.push(p);
      b.usedMm += p.lengthMm + addedKerf;
    } else {
      bars.push({
        cuts: [p],
        usedMm: p.lengthMm
      });
    }
  });

  return bars.map((b, idx) => {
    const wasteMm = Math.max(0, barLengthMm - b.usedMm);
    const cutsTotalMm = b.cuts.reduce((acc, c) => acc + c.lengthMm, 0);
    const kerfTotalMm = Math.max(0, b.usedMm - cutsTotalMm);
    const efficiencyPct = +(cutsTotalMm / barLengthMm * 100).toFixed(1);

    const segments: AwningCutSegment[] = b.cuts.map((c) => ({
      label: c.label,
      lengthMm: c.lengthMm,
      color: c.color,
      pct: +(c.lengthMm / barLengthMm * 100).toFixed(1)
    }));

    if (wasteMm > 0) {
      segments.push({
        label: 'Sobra Aproveitável',
        lengthMm: wasteMm,
        color: 'rgba(100, 116, 139, 0.35)',
        pct: +(wasteMm / barLengthMm * 100).toFixed(1),
        isWaste: true
      });
    }

    return {
      barIndex: idx + 1,
      barLengthMm,
      usedMm: cutsTotalMm,
      wasteMm,
      kerfMm: kerfTotalMm,
      efficiencyPct,
      segments
    };
  });
}

/**
 * Extrai todas as dimensões, lista de peças de alumínio, ferragens/acessórios e planos de corte lineares
 * exclusivos para o Toldo Overland (Asa de Morcego 270° ou Traseiro Reto).
 */
export function extractAwningHardwareStats(config?: Partial<AwningConfig>): AwningHardwareStats {
  const enabled = config?.enabled ?? true;
  const type: AwningType = config?.type === 'rear' ? 'rear' : 'batwing_270';
  const side = config?.side === 'driver' ? 'driver' : 'passenger';

  let rawLength = config?.lengthMm;
  // Se o tipo for batwing e o comprimento for de toldo traseiro (ex: <= 1600mm), adota 2000mm
  // Se o tipo for rear e o comprimento for de batwing (ex: >= 1800mm), adota 1400mm
  if (type === 'batwing_270' && (!rawLength || rawLength <= 1600)) {
    rawLength = 2000;
  } else if (type === 'rear' && (!rawLength || rawLength >= 1800)) {
    rawLength = 1400;
  }
  const lengthMm = Math.max(1200, Math.min(2500, rawLength || (type === 'rear' ? 1400 : 2000)));

  let rawExt = config?.extensionMm;
  if (type === 'batwing_270' && (!rawExt || rawExt === 2000)) {
    rawExt = 2200;
  } else if (type === 'rear' && (!rawExt || rawExt === 2200)) {
    rawExt = 2000;
  }
  const extensionMm = Math.max(1500, Math.min(2600, rawExt || (type === 'rear' ? 2000 : 2200)));
  const isOpen = config?.isOpen ?? false;

  const typeLabel = type === 'batwing_270' ? 'Asa de Morcego 270° Overland' : 'Toldo Traseiro Reto Overland';
  const sideLabel = side === 'passenger' ? 'Lado Passageiro (Direita)' : 'Lado Motorista (Esquerda)';

  const profileItems: AwningProfileItem[] = [];
  const fittings: AwningFittingItem[] = [];

  // Paleta de cores para identificação visual rápida de cada peça no plano de corte
  const COLORS = {
    backbone: '#38bdf8',  // Sky blue
    arms: '#f59e0b',      // Amber
    leadBar: '#06b6d4',   // Cyan
    tensionArms: '#eab308', // Yellow
    upperPoles: '#10b981', // Emerald
    lowerPoles: '#14b8a6', // Teal
  };

  if (type === 'batwing_270') {
    // ---------------------------------------------------------
    // 1. TOLDO ASA DE MORCEGO 270° (EXPEDIÇÃO OVERLAND)
    // ---------------------------------------------------------

    // 1.1 Perfil Calha Base Estrutural (Backbone Longitudinal no Rack)
    const backboneLengthMm = lengthMm; // 2000mm
    profileItems.push({
      key: 'awning_backbone',
      label: 'Calha Base Estrutural (Backbone de Fixação)',
      spec: 'Perfil Estrutural U Alumínio 50x30x2.5mm',
      profileType: 'channel_u',
      dimensionsMm: '50 × 30 mm (Parede 2.5mm)',
      lengthMm: backboneLengthMm,
      lengthM: +(backboneLengthMm / 1000).toFixed(3),
      qty: 1,
      totalLengthM: +(backboneLengthMm / 1000).toFixed(3),
      weightKgPerMeter: 0.98,
      totalWeightKg: +(0.98 * (backboneLengthMm / 1000)).toFixed(2),
      purpose: 'Viga dorsal de apoio fixada na longarina lateral do rack para ancoragem do pivô e da lona recolhida',
      color: COLORS.backbone
    });

    // 1.2 Braços Radiais Articulados em Perfil Retangular (5 braços cobrindo 270°)
    const radialArmLengthMm = extensionMm; // 2200mm
    const radialArmQty = 5;
    profileItems.push({
      key: 'awning_radial_arms',
      label: 'Braços Radiais Articulados (Leque 270°)',
      spec: 'Tubo Retangular Alumínio Estrutural 35x25x2.0mm',
      profileType: 'rectangular_tube',
      dimensionsMm: '35 × 25 mm (Parede 2.0mm)',
      lengthMm: radialArmLengthMm,
      lengthM: +(radialArmLengthMm / 1000).toFixed(3),
      qty: radialArmQty,
      totalLengthM: +((radialArmLengthMm * radialArmQty) / 1000).toFixed(3),
      weightKgPerMeter: 0.62,
      totalWeightKg: +(0.62 * (radialArmLengthMm * radialArmQty / 1000)).toFixed(2),
      purpose: '5 hastes radiais articuladas no pivô central cobrindo a lateral e traseira completa da van',
      color: COLORS.arms
    });

    // 1.3 Postes Telescópicos de Apoio ao Solo (3 conjuntos: Braços 1, 3 e 5)
    // Estágio Superior (Tubo redondo externo Ø28mm x 1.5mm)
    const upperPoleLengthMm = 1150;
    const polesQty = 3;
    profileItems.push({
      key: 'awning_poles_upper',
      label: 'Postes de Solo — Estágio Superior Externo',
      spec: 'Tubo Redondo Alumínio Ø28mm (Parede 1.5mm)',
      profileType: 'round_tube',
      dimensionsMm: 'Ø 28 mm ext. (Parede 1.5mm)',
      lengthMm: upperPoleLengthMm,
      lengthM: +(upperPoleLengthMm / 1000).toFixed(3),
      qty: polesQty,
      totalLengthM: +((upperPoleLengthMm * polesQty) / 1000).toFixed(3),
      weightKgPerMeter: 0.34,
      totalWeightKg: +(0.34 * (upperPoleLengthMm * polesQty / 1000)).toFixed(2),
      purpose: 'Corpo telescópico superior articulado na ponta dos braços radiais com trava twist-lock',
      color: COLORS.upperPoles
    });

    // Estágio Inferior (Tubo redondo interno deslizante Ø22mm x 1.5mm)
    const lowerPoleLengthMm = 1100;
    profileItems.push({
      key: 'awning_poles_lower',
      label: 'Postes de Solo — Estágio Inferior Deslizante',
      spec: 'Tubo Redondo Alumínio Ø22mm (Parede 1.5mm)',
      profileType: 'round_tube',
      dimensionsMm: 'Ø 22 mm ext. (Parede 1.5mm)',
      lengthMm: lowerPoleLengthMm,
      lengthM: +(lowerPoleLengthMm / 1000).toFixed(3),
      qty: polesQty,
      totalLengthM: +((lowerPoleLengthMm * polesQty) / 1000).toFixed(3),
      weightKgPerMeter: 0.26,
      totalWeightKg: +(0.26 * (lowerPoleLengthMm * polesQty / 1000)).toFixed(2),
      purpose: 'Haste telescópica inferior ajustável de altura (1.20m a 2.15m) conectada à sapata de solo',
      color: COLORS.lowerPoles
    });

    // 1.4 Ferragens, Mancais, Parafusos e Acessórios
    fittings.push(
      {
        key: 'awning_batwing_pivot_hub',
        label: 'Mancal Central do Pivô 270° com Eixo em Inox',
        spec: 'Bloco de Alumínio Naval Usinado CNC + Eixo Aço Inox 304 Ø16mm',
        qty: 1,
        unit: 'cj',
        material: 'Alumínio 6061-T6 + Inox 304',
        group: 'pivot_assembly',
        notes: 'Pivô de alta resistência na quina traseira do rack com buchas de teflon antifricção para os 5 braços'
      },
      {
        key: 'awning_batwing_arm_brackets',
        label: 'Terminais Articulados dos Braços no Pivô',
        spec: 'Chapas Duplas Dobradas Alumínio 4.0mm com Buchas Autolubrificantes',
        qty: 5,
        unit: 'pç',
        material: 'Alumínio 5052-H34 + Teflon',
        group: 'pivot_assembly',
        notes: 'Articulação individual de cada braço radial com rotação suave independente'
      },
      {
        key: 'awning_mount_brackets_l',
        label: 'Suportes Reforçados em L para Fixação no Rack',
        spec: 'Cantoneira Pesada Aço Inox 304 60x60x4.0mm (Furação M8)',
        qty: 3,
        unit: 'pç',
        material: 'Aço Inoxidável 304',
        group: 'mounting_brackets',
        notes: 'Ancoragem da calha dorsal nas canaletas T-Slot / longarina do rack Doblò'
      },
      {
        key: 'awning_t_nuts_m8',
        label: 'Porcas Martelo T-Nut M8 + Parafusos Inox M8x25mm',
        spec: 'Porca T-Slot 40x40 M8 + Parafuso Sextavado Interno Inox A2 M8x25',
        qty: 6,
        unit: 'cj',
        material: 'Aço Inox 304 + Aço Galvanizado',
        group: 'hardware',
        notes: 'Fixação firme dos 3 suportes L na ranhura de 8mm do perfil de alumínio 40x40'
      },
      {
        key: 'awning_arm_pivot_bolts',
        label: 'Parafusos Pivotantes M8 com Porcas Parlock de Travamento',
        spec: 'Parafuso Inox M8x50mm c/ Arruelas de Teflon + Porca Auto-travante',
        qty: 5,
        unit: 'cj',
        material: 'Aço Inoxidável 304',
        group: 'hardware',
        notes: 'Eixos horizontais de fixação dos 5 braços radiais no mancal central'
      },
      {
        key: 'awning_pole_twist_locks',
        label: 'Travas Rápidas de Ajuste Telescópico (Twist-Lock / Manípulo)',
        spec: 'Anel Expansor de Poliacetal c/ Rosca ou Abraçadeira Rápida M6',
        qty: 3,
        unit: 'pç',
        material: 'Nylon Reforçado + Inox',
        group: 'telescopic_locks',
        notes: 'Bloqueio instantâneo da altura dos 3 postes telescópicos verticais'
      },
      {
        key: 'awning_ground_feet',
        label: 'Sapatas Articuladas de Apoio ao Solo com Furo para Estaca',
        spec: 'Base Circular Ø60mm Alumínio Fundido com Pino Articulado Ø8mm',
        qty: 3,
        unit: 'pç',
        material: 'Alumínio + Aço Galvanizado',
        group: 'anchoring',
        notes: 'Distribui a carga no solo e permite estaquear contra ventos fortes'
      },
      {
        key: 'awning_pegs_and_ropes',
        label: 'Kit de Ancoragem (Estacas de Solo + Cordas Paracord com Esticador)',
        spec: '6× Estacas de Aço Ø6x200mm + 6× Cordas Paracord 3.5m c/ Tensor Alumínio',
        qty: 1,
        unit: 'kit',
        material: 'Aço Galvanizado + Corda Náutica',
        group: 'anchoring',
        notes: 'Amarras anti-vento indispensáveis para estabilidade overland em acampamentos'
      }
    );
  } else {
    // ---------------------------------------------------------
    // 2. TOLDO TRASEIRO RETO (OVERLAND REAR AWNING)
    // ---------------------------------------------------------

    // 2.1 Estojo / Tubo Carcaça Traseira de Fixação
    const rearCaseLengthMm = lengthMm; // 1400mm
    profileItems.push({
      key: 'awning_rear_case',
      label: 'Estojo Estrutural de Fixação Traseiro',
      spec: 'Perfil Tubular Alumínio Anodizado Preto Ø90mm / Parede 2.0mm',
      profileType: 'round_tube',
      dimensionsMm: 'Ø 90 mm ext. (Parede 2.0mm)',
      lengthMm: rearCaseLengthMm,
      lengthM: +(rearCaseLengthMm / 1000).toFixed(3),
      qty: 1,
      totalLengthM: +(rearCaseLengthMm / 1000).toFixed(3),
      weightKgPerMeter: 1.48,
      totalWeightKg: +(1.48 * (rearCaseLengthMm / 1000)).toFixed(2),
      purpose: 'Carcaça cilíndrica de montagem na travessa traseira do rack que abriga a lona e o rolete interno',
      color: COLORS.backbone
    });

    // 2.2 Barra Frontal Externa Móvel (Borda Frontal da Lona)
    const leadBarLengthMm = Math.round(rearCaseLengthMm * 0.98); // 1370mm
    profileItems.push({
      key: 'awning_lead_bar',
      label: 'Barra Frontal Móvel (Borda Externa da Lona)',
      spec: 'Perfil Retangular Alumínio 35x35x2.0mm',
      profileType: 'rectangular_tube',
      dimensionsMm: '35 × 35 mm (Parede 2.0mm)',
      lengthMm: leadBarLengthMm,
      lengthM: +(leadBarLengthMm / 1000).toFixed(3),
      qty: 1,
      totalLengthM: +(leadBarLengthMm / 1000).toFixed(3),
      weightKgPerMeter: 0.72,
      totalWeightKg: +(0.72 * (leadBarLengthMm / 1000)).toFixed(2),
      purpose: 'Perfil frontal onde a lona se engata e onde se recolhem os postes e braços telescópicos',
      color: COLORS.leadBar
    });

    // 2.3 Braços Articulados / Hastes Telescópicas Horizontais de Tensão (2 unidades)
    const armLengthMm = Math.round(Math.hypot(extensionMm, 120)); // ~2004mm
    profileItems.push({
      key: 'awning_tension_arms',
      label: 'Hastes Laterais Articuladas de Tensão Horizontal',
      spec: 'Tubo Quadrado Alumínio 25x25x1.8mm',
      profileType: 'rectangular_tube',
      dimensionsMm: '25 × 25 mm (Parede 1.8mm)',
      lengthMm: armLengthMm,
      lengthM: +(armLengthMm / 1000).toFixed(3),
      qty: 2,
      totalLengthM: +((armLengthMm * 2) / 1000).toFixed(3),
      weightKgPerMeter: 0.45,
      totalWeightKg: +(0.45 * (armLengthMm * 2 / 1000)).toFixed(2),
      purpose: 'Mantêm a lona esticada horizontalmente conectando o estojo à barra frontal',
      color: COLORS.tensionArms
    });

    // 2.4 Postes Telescópicos Verticais de Sustentação ao Solo (2 unidades)
    const upperPoleLengthMm = 1100;
    const lowerPoleLengthMm = 1050;
    profileItems.push(
      {
        key: 'awning_poles_upper',
        label: 'Postes Verticais de Solo — Estágio Superior',
        spec: 'Tubo Redondo Alumínio Ø28mm (Parede 1.5mm)',
        profileType: 'round_tube',
        dimensionsMm: 'Ø 28 mm ext. (Parede 1.5mm)',
        lengthMm: upperPoleLengthMm,
        lengthM: +(upperPoleLengthMm / 1000).toFixed(3),
        qty: 2,
        totalLengthM: +((upperPoleLengthMm * 2) / 1000).toFixed(3),
        weightKgPerMeter: 0.34,
        totalWeightKg: +(0.34 * (upperPoleLengthMm * 2 / 1000)).toFixed(2),
        purpose: 'Postes verticais superiores embutidos na barra frontal',
        color: COLORS.upperPoles
      },
      {
        key: 'awning_poles_lower',
        label: 'Postes Verticais de Solo — Estágio Inferior',
        spec: 'Tubo Redondo Alumínio Ø22mm (Parede 1.5mm)',
        profileType: 'round_tube',
        dimensionsMm: 'Ø 22 mm ext. (Parede 1.5mm)',
        lengthMm: lowerPoleLengthMm,
        lengthM: +(lowerPoleLengthMm / 1000).toFixed(3),
        qty: 2,
        totalLengthM: +((lowerPoleLengthMm * 2) / 1000).toFixed(3),
        weightKgPerMeter: 0.26,
        totalWeightKg: +(0.26 * (lowerPoleLengthMm * 2 / 1000)).toFixed(2),
        purpose: 'Haste telescópica deslizante até o solo com sapata regulável',
        color: COLORS.lowerPoles
      }
    );

    // 2.5 Ferragens de Fixação e Acessórios do Toldo Traseiro
    fittings.push(
      {
        key: 'awning_rear_brackets_l',
        label: 'Suportes Reforçados em L para Travessa Traseira 40x40',
        spec: 'Chapa Aço Inox 304 50x50x4.0mm c/ furação M8',
        qty: 2,
        unit: 'pç',
        material: 'Aço Inoxidável 304',
        group: 'mounting_brackets',
        notes: 'Fixam o estojo traseiro na face posterior da última travessa 40x40 da Doblò'
      },
      {
        key: 'awning_rear_t_nuts_m8',
        label: 'Porcas Martelo T-Nut M8 + Parafusos Inox M8x25mm',
        spec: 'Porca T-Slot 40x40 M8 + Parafuso Inox A2 M8x25mm',
        qty: 4,
        unit: 'cj',
        material: 'Aço Inox 304',
        group: 'hardware',
        notes: 'Prendem os brackets em L nas canaletas do perfil 40x40'
      },
      {
        key: 'awning_knuckle_joints',
        label: 'Articulações Knuckle Giratórias para as Hastes e Postes',
        spec: 'Pivôs Duplos Fundidos em Alumínio c/ Parafusos M6 Inox',
        qty: 4,
        unit: 'cj',
        material: 'Alumínio Injetado + Inox',
        group: 'pivot_assembly',
        notes: 'Permitem dobrar os postes e braços para dentro da calha frontal ao recolher'
      },
      {
        key: 'awning_pole_twist_locks',
        label: 'Travas Rápidas de Ajuste Telescópico (Twist-Lock)',
        spec: 'Anel Expansor de Poliacetal c/ Rosca Rápida 1/4 volta',
        qty: 2,
        unit: 'pç',
        material: 'Poliacetal (POM) + Inox',
        group: 'telescopic_locks',
        notes: 'Bloqueio de altura dos 2 postes verticais'
      },
      {
        key: 'awning_ground_feet',
        label: 'Sapatas Articuladas de Solo c/ Furo para Estacas',
        spec: 'Base Oval Alumínio Estampado 50x30mm c/ Furo Ø8mm',
        qty: 2,
        unit: 'pç',
        material: 'Alumínio + Aço Galvanizado',
        group: 'anchoring',
        notes: 'Apoio no solo com fixação para estacas'
      },
      {
        key: 'awning_pegs_and_ropes',
        label: 'Kit de Ancoragem (Estacas + Cordas Paracord com Esticador)',
        spec: '4× Estacas de Aço Ø6x200mm + 4× Cordas Paracord 3.0m c/ Tensor Alumínio',
        qty: 1,
        unit: 'kit',
        material: 'Aço Galvanizado + Nylon',
        group: 'anchoring',
        notes: 'Ancoragem ao solo contra rajadas de vento traseiras'
      }
    );
  }

  // ---------------------------------------------------------
  // 3. GERAÇÃO DOS PLANOS DE CORTE LINEARES (6m e 3m)
  // ---------------------------------------------------------
  // Prepara as peças individuais para o algoritmo de corte 1D
  const individualCuts: Array<{ label: string; lengthMm: number; color: string }> = [];

  profileItems.forEach((item) => {
    for (let i = 0; i < item.qty; i++) {
      const suffix = item.qty > 1 ? ` #${i + 1}` : '';
      individualCuts.push({
        label: `${item.label}${suffix}`,
        lengthMm: item.lengthMm,
        color: item.color
      });
    }
  });

  const plan6m = computeAwningLinearBarPlan(6000, individualCuts, 3);
  const plan3m = computeAwningLinearBarPlan(3000, individualCuts, 3);

  // Totais consolidados
  const totalProfilePieces = profileItems.reduce((acc, it) => acc + it.qty, 0);
  const totalLinearMeters = +(profileItems.reduce((acc, it) => acc + it.totalLengthM, 0)).toFixed(2);
  const profilesWeightKg = +(profileItems.reduce((acc, it) => acc + it.totalWeightKg, 0)).toFixed(2);

  // Estimativa de peso dos acessórios e ferragens
  const fittingsWeightKg = type === 'batwing_270' ? 4.8 : 2.5;

  // Estimativa de peso da lona Oxford Ripstop 420D / 600D com capa PVC
  // Asa 270° cobre ~9m² a ~11m² (peso da lona ~5.5kg a 6.5kg)
  // Traseiro Reto cobre ~2.8m² (peso da lona ~2.2kg)
  const fabricWeightKg = type === 'batwing_270' ? 6.2 : 2.8;

  const totalAwningWeightKg = +(profilesWeightKg + fittingsWeightKg + fabricWeightKg).toFixed(1);

  // Opção recomendada de barra comercial
  // Se a maior peça for > 3000mm, obriga 6m; caso contrário, compara a perda total
  const maxPieceLen = Math.max(...individualCuts.map((c) => c.lengthMm));
  let recommendedBarOption: '6m' | '3m' = '6m';
  if (maxPieceLen <= 3000) {
    const waste6m = plan6m.reduce((acc, b) => acc + b.wasteMm, 0);
    const waste3m = plan3m.reduce((acc, b) => acc + b.wasteMm, 0);
    recommendedBarOption = waste6m <= waste3m ? '6m' : '3m';
  }

  return {
    enabled,
    type,
    typeLabel,
    side,
    sideLabel,
    lengthMm,
    extensionMm,
    isOpen,
    totalProfilePieces,
    totalLinearMeters,
    profilesWeightKg,
    fittingsWeightKg,
    fabricWeightKg,
    totalAwningWeightKg,
    profileItems,
    fittings,
    plan6m,
    plan3m,
    recommendedBarOption
  };
}
