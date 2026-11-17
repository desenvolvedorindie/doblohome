/**
 * Utilitários para Cálculo e Otimização do Plano de Corte Linear dos Tubos de PVC
 * para o Reservatório de Água Potável em formato U (Teto da Fiat Doblò).
 */

export interface PvcCutItem {
  key: string;
  label: string;
  spec: string;
  diameterMm: number;
  lengthMm: number;
  lengthM: number;
  qty: number;
  totalLengthM: number;
  category: string;
  notes: string;
}

export interface PvcFittingItem {
  key: string;
  label: string;
  spec: string;
  qty: number;
  unit: string;
  group: string;
  notes: string;
}

export interface PvcCutSegment {
  label: string;
  lengthMm: number;
  color: string;
  pct: number;
}

export interface PvcBarPlan {
  barIndex: number;
  barLengthMm: number;
  usedMm: number;
  wasteMm: number;
  kerfMm: number;
  efficiencyPct: number;
  segments: PvcCutSegment[];
}

export interface PvcCuttingPlanResult {
  enabled: boolean;
  diameterMm: number;
  radiusMm: number;
  connectionPosition: 'front' | 'rear';
  lateralPipeLengthMm: number;
  frontPipeLengthMm: number;
  transversePieceLengthMm: number;
  verticalNippleLengthMm: number;
  totalEffectiveLengthM: number;
  totalCapacityL: number;
  singleLateralL: number;
  frontCircuitL: number;
  totalPieces: number;
  totalLinearMeters: number;
  cutItems: PvcCutItem[];
  fittings: PvcFittingItem[];
  plan6m: PvcBarPlan[];
  plan3m: PvcBarPlan[];
  recommendedBarOption: '6m' | '3m';
}

function computeLinearBarPlan(
  barLengthMm: number,
  pieces: Array<{ label: string; lengthMm: number; color: string }>,
  kerfMm: number
): PvcBarPlan[] {
  interface WorkingBar {
    cuts: Array<{ label: string; lengthMm: number; color: string }>;
    usedMm: number;
  }

  const bars: WorkingBar[] = [];

  // Ordena decrescente pelo comprimento (Best-Fit Decreasing)
  const sorted = [...pieces].sort((a, b) => b.lengthMm - a.lengthMm);

  sorted.forEach((p) => {
    let placed = false;
    for (const b of bars) {
      const addedKerf = b.cuts.length > 0 ? kerfMm : 0;
      if (b.usedMm + p.lengthMm + addedKerf <= barLengthMm) {
        b.cuts.push(p);
        b.usedMm += p.lengthMm + addedKerf;
        placed = true;
        break;
      }
    }

    if (!placed) {
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

    const segments: PvcCutSegment[] = b.cuts.map((c) => ({
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
        pct: +(wasteMm / barLengthMm * 100).toFixed(1)
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
 * Extrai todas as dimensões, lista de peças, conexões e plano de corte linear
 * dos canos de PVC do reservatório d'água contínuo em U.
 */
export function extractPvcCutStats(
  waterTankConfig?: { enabled?: boolean; lengthMm?: number; diameterMm?: number; connectionPosition?: 'front' | 'rear' }
): PvcCuttingPlanResult {
  const enabled = waterTankConfig?.enabled ?? true;
  const connectionPosition: 'front' | 'rear' = waterTankConfig?.connectionPosition === 'rear' ? 'rear' : 'front';
  const isRear = connectionPosition === 'rear';
  const BASE_MAX_MM = 2200;
  const lengthMm = Math.max(400, Math.min(BASE_MAX_MM, Math.round(waterTankConfig?.lengthMm || BASE_MAX_MM)));
  const diameterMm = Math.max(80, Math.min(350, Math.round(waterTankConfig?.diameterMm || 200)));
  const radiusMm = +(diameterMm / 2).toFixed(1);
  const lateralLengthM = lengthMm / 1000;
  const radiusM = radiusMm / 1000;
  const radiusDm = radiusMm / 100;

  const baseHalfWidth = 0.70;
  const frameInnerX = baseHalfWidth - 0.04; // 0.66m
  const pipeOffsetX = frameInnerX - radiusM;

  const bendR = Math.max(0.06, radiusM * 1.35);
  const frontPipeSpan = (pipeOffsetX - bendR) * 2;
  const frontPipeLengthM = Math.max(0.20, frontPipeSpan);

  const zCenter = 0;
  const zFrontFrame = zCenter + (BASE_MAX_MM / 2) / 1000;
  const zRearFrame = zCenter - (BASE_MAX_MM / 2) / 1000;
  const zInnerFront = zFrontFrame - 0.04;
  const zInnerRear = zRearFrame + 0.04;
  const zFrontPipe = zInnerFront - radiusM;
  const zPipeStart = zFrontPipe - bendR;
  const maxAvailableLateral = zPipeStart - zInnerRear;
  const lateralPipeLengthM = Math.max(0.20, Math.min(lateralLengthM - bendR, maxAvailableLateral));

  const lateralPipeLengthMm = Math.round(lateralPipeLengthM * 1000);
  const frontPipeLengthMm = Math.round(frontPipeLengthM * 1000);

  // Divisões do Cano Transversal pelo Tê 90° Central e Niple Vertical entre Tê e Cap
  const teeRunLengthM = Math.min(0.24, radiusM * 2.2);
  const teeSocketDepthM = Math.max(0.035, radiusM * 0.35);
  const transversePieceLengthM = Math.max(0.08, +( (frontPipeLengthM / 2) - (teeRunLengthM / 2 - teeSocketDepthM) ).toFixed(3));
  const transversePieceLengthMm = Math.round(transversePieceLengthM * 1000);

  // Pedacinho de cano entre o Tê e o Cap superior
  const verticalNippleLengthM = Math.max(0.08, Math.min(0.14, +(radiusM * 1.0).toFixed(3)));
  const verticalNippleLengthMm = Math.round(verticalNippleLengthM * 1000);

  const totalEffectiveLengthM = +(2 * lateralLengthM + frontPipeLengthM + Math.PI * bendR).toFixed(2);
  const singleLateralL = +(Math.PI * radiusDm * radiusDm * (lateralLengthM * 10)).toFixed(1);
  const frontCircuitL = +(Math.PI * radiusDm * radiusDm * ((frontPipeLengthM + Math.PI * bendR) * 10)).toFixed(1);
  const totalCapacityL = +(Math.PI * radiusDm * radiusDm * (totalEffectiveLengthM * 10)).toFixed(1);

  const posLabel = isRear ? 'Traseiro' : 'Dianteiro';
  const posNote = isRear ? 'traseira da van (acesso fácil pelo porta-malas)' : 'dianteira da van (frente do rack)';

  const cutItems: PvcCutItem[] = [
    {
      key: 'pvc_lateral_left',
      label: 'Cano Lateral Esquerdo (Motorista)',
      spec: `Tubo PVC Esgoto/Série R Ø${diameterMm} mm`,
      diameterMm,
      lengthMm: lateralPipeLengthMm,
      lengthM: lateralPipeLengthM,
      qty: 1,
      totalLengthM: lateralPipeLengthM,
      category: 'Tubulação Longitudinal',
      notes: 'Fixado com abraçadeiras inox na longarina interna esquerda da Doblò'
    },
    {
      key: 'pvc_lateral_right',
      label: 'Cano Lateral Direito (Passageiro)',
      spec: `Tubo PVC Esgoto/Série R Ø${diameterMm} mm`,
      diameterMm,
      lengthMm: lateralPipeLengthMm,
      lengthM: lateralPipeLengthM,
      qty: 1,
      totalLengthM: lateralPipeLengthM,
      category: 'Tubulação Longitudinal',
      notes: 'Fixado com abraçadeiras inox na longarina interna direita da Doblò'
    },
    {
      key: 'pvc_transverse_left',
      label: `Cano Transversal Esquerdo (${posLabel})`,
      spec: `Tubo PVC Esgoto/Série R Ø${diameterMm} mm`,
      diameterMm,
      lengthMm: transversePieceLengthMm,
      lengthM: transversePieceLengthM,
      qty: 1,
      totalLengthM: transversePieceLengthM,
      category: 'Tubulação Transversal',
      notes: `Conecta o joelho 90° esquerdo à bolsa esquerda do Tê central na ${posNote}`
    },
    {
      key: 'pvc_transverse_right',
      label: `Cano Transversal Direito (${posLabel})`,
      spec: `Tubo PVC Esgoto/Série R Ø${diameterMm} mm`,
      diameterMm,
      lengthMm: transversePieceLengthMm,
      lengthM: transversePieceLengthM,
      qty: 1,
      totalLengthM: transversePieceLengthM,
      category: 'Tubulação Transversal',
      notes: `Conecta o joelho 90° direito à bolsa direita do Tê central na ${posNote}`
    },
    {
      key: 'pvc_vertical_nipple',
      label: 'Extensão Vertical / Niple (Tê ao Cap)',
      spec: `Tubo PVC Esgoto/Série R Ø${diameterMm} mm`,
      diameterMm,
      lengthMm: verticalNippleLengthMm,
      lengthM: verticalNippleLengthM,
      qty: 1,
      totalLengthM: verticalNippleLengthM,
      category: 'Extensão do Bocal',
      notes: 'Pedacinho de cano que une a bolsa vertical do Tê 90° ao CAP superior onde assenta a tampinha'
    }
  ];

  const totalPieces = 5;
  const totalLinearMeters = +(2 * lateralPipeLengthM + 2 * transversePieceLengthM + verticalNippleLengthM).toFixed(2);

  const fittings: PvcFittingItem[] = [
    {
      key: 'fit_elbow_90',
      label: 'Joelhos (Curvas) 90° PVC com bolsa reforçada',
      spec: `90° Ø${diameterMm} mm`,
      qty: 2,
      unit: 'un',
      group: '↪️ Joelhos 90° PVC',
      notes: `Interligam os canos laterais aos canos transversais na ${posNote}`
    },
    {
      key: 'fit_tee_90',
      label: 'Tê 90° PVC com 3 bolsas reforçadas',
      spec: `Tê 90° Ø${diameterMm} mm`,
      qty: 1,
      unit: 'un',
      group: '🔀 Tê 90° PVC',
      notes: `Instalado no centro do cano transversal ${posLabel.toLowerCase()} para elevação vertical do bocal`
    },
    {
      key: 'fit_cap',
      label: 'CAPs (Tampões) de Vedação PVC Soldáveis',
      spec: `CAP Soldável Ø${diameterMm} mm`,
      qty: 3,
      unit: 'un',
      group: '🛑 CAPs (Tampões) de Vedação',
      notes: `3 unidades: 2× de extremidade (${isRear ? 'dianteiras' : 'traseiras'}) + 1× superior no Tê (base da tampinha)`
    },
    {
      key: 'fit_filler',
      label: 'Bocal / Tampinha Hermética de Abastecimento e Inspeção',
      spec: 'Rosqueável 2" ou 3" com vedação hermética',
      qty: 1,
      unit: 'un',
      group: '🚰 Válvulas, Bocal & Registros',
      notes: 'Montada no topo do CAP superior do Tê para abastecimento rápido de água potável'
    },
    {
      key: 'fit_valve',
      label: 'Registros / Torneiras de Esfera Metálicas (Latão)',
      spec: '1/2" ou 3/4" BSP com manopla',
      qty: 2,
      unit: 'un',
      group: '🚰 Válvulas, Bocal & Registros',
      notes: 'Instalados na traseira para dreno, ducha externa e tomada de água'
    },
    {
      key: 'fit_breather',
      label: 'Válvula de Respiro / Alívio de Ar (Anti-vácuo)',
      spec: '1/2" automática c/ membrana',
      qty: 1,
      unit: 'un',
      group: '🚰 Válvulas, Bocal & Registros',
      notes: 'Instalada junto ao CAP/Tê para garantir fluxo contínuo sem vácuo ou refluxo'
    },
    {
      key: 'fit_clamp',
      label: 'Cintas / Abraçadeiras Inox Tipo D para Tubos',
      spec: `Inox 304 para Ø${diameterMm} mm`,
      qty: lateralPipeLengthM >= 1.4 ? 6 : 4,
      unit: 'un',
      group: '🔩 Fixação & Soldagem',
      notes: 'Ancoragem firme na face interna dos perfis de metalon 40×40'
    },
    {
      key: 'fit_glue',
      label: 'Adesivo Plástico PVC + Pasta Lubrificante para Anéis',
      spec: 'Bisnaga 175g / 75g',
      qty: 1,
      unit: 'kit',
      group: '🔩 Fixação & Soldagem',
      notes: 'Soldagem a frio com adesivo nas bolsas, Tê e joelhos'
    }
  ];

  const KERF = 4; // 4 mm de corte de serra

  // Lista de todas as 5 peças a cortar
  const piecesToCut = [
    { label: 'Lateral Esq.', lengthMm: lateralPipeLengthMm, color: '#0284c7' },
    { label: 'Lateral Dir.', lengthMm: lateralPipeLengthMm, color: '#0ea5e9' },
    { label: 'Transv. Esq.', lengthMm: transversePieceLengthMm, color: '#38bdf8' },
    { label: 'Transv. Dir.', lengthMm: transversePieceLengthMm, color: '#67e8f9' },
    { label: 'Extensão Tê-Cap', lengthMm: verticalNippleLengthMm, color: '#a5f3fc' }
  ];

  // Plano para Barras Comerciais de 6.000 mm (6m):
  const plan6m = computeLinearBarPlan(6000, piecesToCut, KERF);

  // Plano para Barras Comerciais de 3.000 mm (3m):
  const plan3m = computeLinearBarPlan(3000, piecesToCut, KERF);

  return {
    enabled,
    diameterMm,
    radiusMm,
    connectionPosition,
    lateralPipeLengthMm,
    frontPipeLengthMm,
    transversePieceLengthMm,
    verticalNippleLengthMm,
    totalEffectiveLengthM,
    totalCapacityL,
    singleLateralL,
    frontCircuitL,
    totalPieces,
    totalLinearMeters,
    cutItems,
    fittings,
    plan6m,
    plan3m,
    recommendedBarOption: plan6m.length === 1 ? '6m' : '3m'
  };
}
