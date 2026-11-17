import { getMetalonGauge } from '../types';
import { BarCutGroup, ProfileSummary } from './woodUtils';

export interface WeldedJointsReport {
  // Contagens por tipo de nó/quina
  miterCorners45: number;
  teeJoints: number;
  mountBracketsJoints: number;
  totalJoints: number;

  // Breakdown por subsistema estrutural
  breakdown: {
    rackBase: {
      miter45: number;
      tee: number;
      mounts: number;
      total: number;
    };
    solarTrays: {
      traysCount: number;
      miter45: number;
      tee: number;
      total: number;
    };
    cargoSubchassis: {
      enabled: boolean;
      miter45: number;
      tee: number;
      mounts: number;
      total: number;
    };
  };

  // Estimativa de Mão de Obra e Consumíveis do Ciclo Completo da Quina
  unitPricePerJoint: number;
  totalWeldingLaborCost: number;

  // Consumíveis estimados para todo o ciclo de trabalho
  consumables: {
    cuttingDiscs4Half: number;
    flapDiscsGrinding: number;
    flapDiscsFinishing: number;
    migWireKg: number;
    co2ArgonLiters: number;
    magneticSquaresRecommended: number;
  };

  // As 5 Etapas do Ciclo Completo de Cada Quina
  stepsDescription: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
  };
}

export interface ProfileThicknessGroup {
  thicknessMm: number;
  thicknessLabel: string;
  gaugeLabel: string;
  sectionCategory: '40x40' | '30x30' | 'accessories';
  groupTitle: string;
  groupSubtitle: string;
  profiles: ProfileSummary[];
  totalPieces: number;
  totalMeters: number;
  totalBars6m: number;
  totalBars3m: number;
}

export interface CutGroupThicknessSection {
  thicknessMm: number;
  thicknessLabel: string;
  gaugeLabel: string;
  sectionCategory: '40x40' | '30x30' | 'accessories';
  groupTitle: string;
  groupSubtitle: string;
  items: BarCutGroup[];
  totalPieces: number;
  totalMeters: number;
}

/**
 * Analisa e extrai a espessura da parede (em mm) e a categoria estrutural do perfil
 */
export function parseProfileThickness(profileSpec: string, barLabel: string = ''): {
  thicknessMm: number;
  gaugeLabel: string;
  sectionCategory: '40x40' | '30x30' | 'accessories';
  groupTitle: string;
  groupSubtitle: string;
} {
  const specLower = (profileSpec || '').toLowerCase();
  const labelLower = (barLabel || '').toLowerCase();

  // 1. Detecta acessórios e ferragens mecânicas (sapatas, corrediças, trilhos)
  const isAccessory =
    specLower.includes('trilho') ||
    specLower.includes('corrediça') ||
    specLower.includes('sapata') ||
    specLower.includes('laminado') ||
    labelLower.includes('sapata') ||
    labelLower.includes('trilho') ||
    labelLower.includes('corrediça');

  if (isAccessory) {
    return {
      thicknessMm: 0,
      gaugeLabel: 'Ferragem / Acessório',
      sectionCategory: 'accessories',
      groupTitle: '⚙️ FERRAGENS & PERFIS ESPECIAIS DE MONTAGEM (SAPATAS / TRILHOS)',
      groupSubtitle: 'Sapatas de fixação na calha da Doblò e trilhos corrediça telescópicos heavy-duty'
    };
  }

  // 2. Extrai espessura explícita em mm (ex: "x 2.0mm", "x 1.5mm", "40x40x2.0mm")
  const thickMatch = profileSpec.match(/(\d+(?:\.\d+)?)\s*mm/i);
  let thicknessMm = thickMatch ? parseFloat(thickMatch[1]) : 0;

  const is40 =
    specLower.includes('40') ||
    specLower.includes('1 ½') ||
    labelLower.includes('rack base') ||
    labelLower.includes('subchassi') ||
    labelLower.includes('leito');

  const is30 =
    specLower.includes('30') ||
    specLower.includes('1 ¼') ||
    labelLower.includes('bandeja') ||
    labelLower.includes('gaveta') ||
    labelLower.includes('poste') ||
    labelLower.includes('divisória');

  if (!thicknessMm) {
    if (is40) thicknessMm = 2.0;
    else if (is30) thicknessMm = 1.5;
    else thicknessMm = 2.0;
  }

  const gauge = getMetalonGauge(thicknessMm);

  if (is40 || thicknessMm >= 1.9) {
    return {
      thicknessMm,
      gaugeLabel: gauge,
      sectionCategory: '40x40',
      groupTitle: `📐 TUBOS DO RACK 40×40 MM • ESPESSURA ${thicknessMm.toFixed(1)} MM (${gauge})`,
      groupSubtitle: `Estrutura primária de alta rigidez: Longarinas do Rack Base da Doblò e Subchassi do Baú`
    };
  }

  return {
    thicknessMm,
    gaugeLabel: gauge,
    sectionCategory: '30x30',
    groupTitle: `📐 TUBOS DO RACK 30×30 MM • ESPESSURA ${thicknessMm.toFixed(1)} MM (${gauge})`,
    groupSubtitle: `Estrutura secundária retrátil: Quadros das Bandejas Solares deslizantes e divisórias internas`
  };
}

/**
 * Agrupa os resumos de perfis e cortes por espessura dos tubos
 */
export function groupProfilesByThickness(
  profileSummaries: ProfileSummary[],
  cutGroups: BarCutGroup[]
): {
  thicknessGroups: ProfileThicknessGroup[];
  cutThicknessGroups: CutGroupThicknessSection[];
} {
  // 1. Agrupamento dos resumos de perfis
  const profGroupMap = new Map<string, ProfileThicknessGroup>();

  profileSummaries.forEach((prof) => {
    const meta = parseProfileThickness(prof.profileSpec);
    const key = `${meta.sectionCategory}__${meta.thicknessMm}`;

    let grp = profGroupMap.get(key);
    if (!grp) {
      grp = {
        thicknessMm: meta.thicknessMm,
        thicknessLabel: meta.thicknessMm > 0 ? `${meta.thicknessMm.toFixed(1)} mm` : 'Acessórios',
        gaugeLabel: meta.gaugeLabel,
        sectionCategory: meta.sectionCategory,
        groupTitle: meta.groupTitle,
        groupSubtitle: meta.groupSubtitle,
        profiles: [],
        totalPieces: 0,
        totalMeters: 0,
        totalBars6m: 0,
        totalBars3m: 0
      };
      profGroupMap.set(key, grp);
    }

    grp.profiles.push(prof);
    grp.totalPieces += prof.pieces;
    grp.totalMeters += prof.totalMeters;
    grp.totalBars6m += prof.bars6m;
    grp.totalBars3m += prof.bars3m;
  });

  // Ordenação prioritária: 40x40 (maior espessura), 30x30, depois Acessórios
  const orderRank = { '40x40': 1, '30x30': 2, 'accessories': 3 };
  const thicknessGroups = Array.from(profGroupMap.values()).sort((a, b) => {
    const rA = orderRank[a.sectionCategory] || 99;
    const rB = orderRank[b.sectionCategory] || 99;
    if (rA !== rB) return rA - rB;
    return b.thicknessMm - a.thicknessMm;
  });

  // 2. Agrupamento dos cortes de barras
  const cutGroupMap = new Map<string, CutGroupThicknessSection>();

  cutGroups.forEach((item) => {
    const meta = parseProfileThickness(item.profileSpec, item.label);
    const key = `${meta.sectionCategory}__${meta.thicknessMm}`;

    let grp = cutGroupMap.get(key);
    if (!grp) {
      grp = {
        thicknessMm: meta.thicknessMm,
        thicknessLabel: meta.thicknessMm > 0 ? `${meta.thicknessMm.toFixed(1)} mm` : 'Acessórios',
        gaugeLabel: meta.gaugeLabel,
        sectionCategory: meta.sectionCategory,
        groupTitle: meta.groupTitle,
        groupSubtitle: meta.groupSubtitle,
        items: [],
        totalPieces: 0,
        totalMeters: 0
      };
      cutGroupMap.set(key, grp);
    }

    grp.items.push(item);
    grp.totalPieces += item.qty;
    grp.totalMeters += item.totalLengthM;
  });

  const cutThicknessGroups = Array.from(cutGroupMap.values()).sort((a, b) => {
    const rA = orderRank[a.sectionCategory] || 99;
    const rB = orderRank[b.sectionCategory] || 99;
    if (rA !== rB) return rA - rB;
    return b.thicknessMm - a.thicknessMm;
  });

  return {
    thicknessGroups,
    cutThicknessGroups
  };
}

/**
 * Calcula com precisão matemática todas as juntas/nós ("quinas") soldadas da estrutura metálica,
 * detalhando as 5 etapas de fabricação e a estimativa de custos de mão de obra e consumíveis.
 */
export function calculateWeldedJoints(
  sceneManager: any,
  unitPricePerJoint: number = 35.0
): WeldedJointsReport {
  let rackMiter45 = 4; // 4 quinas em esquadria 45° do quadro base retangular (2 longarinas + 2 travessas ponta)
  let rackTee = 0;
  let rackMounts = 0;

  let traysCount = 0;
  let traysMiter45 = 0;
  let traysTee = 0;

  let cargoEnabled = false;
  let cargoMiter45 = 0;
  let cargoTee = 0;
  let cargoMounts = 0;

  if (sceneManager && sceneManager.solarSystem) {
    const solarSystem = sceneManager.solarSystem;
    cargoEnabled = Boolean(solarSystem.cargoBoxConfig?.enabled);

    // Contagem baseada nas peças ativas na cena
    const barLabels: string[] = [];
    solarSystem.group.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.isBar) {
        barLabels.push(String(obj.userData.barLabel || ''));
      }
    });

    // 1. Rack Base
    const midCrossBars = barLabels.filter((l) => l.includes('Travessa Transversal do Rack Base')).length;
    // As 2 travessas de ponta formam as 4 quinas em 45°. As intermediárias formam 2 juntas em T cada (uma em cada longarina).
    const intermediateCross = Math.max(0, midCrossBars - 2);
    rackTee += intermediateCross * 2;

    const leitoBars = barLabels.filter((l) => l.includes('Longarina Central de Apoio do Leito')).length;
    rackTee += leitoBars * 2; // Cada segmento de leito conecta soldado em 2 travessas transversais

    const risers = barLabels.filter((l) => l.includes('Sapata do Rack Base')).length;
    rackMounts += Math.max(4, risers);

    // 2. Bandejas Solares
    // Cada bandeja tem 2 longarinas e 2 travessas formando 4 quinas em 45°
    const traySides = barLabels.filter((l) => l.includes('Longarina da Bandeja')).length;
    traysCount = Math.max(1, Math.round(traySides / 2));
    traysMiter45 = traysCount * 4;

    const trayDividers = barLabels.filter(
      (l) => l.includes('Travessa Divisória da Bandeja') || l.includes('Longarina Central da Bandeja')
    ).length;
    traysTee = trayDividers * 2; // Cada divisória conecta nas 2 laterais do quadro

    // 3. Subchassi do Baú de Teto
    if (cargoEnabled) {
      cargoMiter45 = 4; // Quadro retangular do subchassi
      const subCross = barLabels.filter((l) => l.includes('Travessa do Subchassi')).length;
      cargoTee = Math.max(2, subCross) * 2;

      const subSapatas = barLabels.filter((l) => l.includes('Sapata do Subchassi')).length;
      cargoMounts = Math.max(4, subSapatas);
    }
  } else {
    // Estimativa geométrica nominal padrão da Fiat Doblò (Rack 2.20m + 1 Bandeja Dupla)
    rackMiter45 = 4;
    rackTee = 4 * 2; // 4 travessas transversais
    rackMounts = 4; // 4 sapatas de ancoragem na calha

    traysCount = 1;
    traysMiter45 = 4;
    traysTee = 2 * 2; // 2 divisórias centrais
  }

  const miterCorners45 = rackMiter45 + traysMiter45 + cargoMiter45;
  const teeJoints = rackTee + traysTee + cargoTee;
  const mountBracketsJoints = rackMounts + cargoMounts;
  const totalJoints = miterCorners45 + teeJoints + mountBracketsJoints;

  const validUnitPrice = Math.max(5.0, unitPricePerJoint || 35.0);
  const totalWeldingLaborCost = Math.round(totalJoints * validUnitPrice);

  // Consumíveis estimados:
  // - 1 disco de corte 4 ½" a cada ~8 quinas/cortes em esquadria
  const cuttingDiscs4Half = Math.max(3, Math.ceil(totalJoints / 8));
  // - 1 disco flap desbaste (grão 40/60) a cada ~12 quinas lixadas
  const flapDiscsGrinding = Math.max(2, Math.ceil(totalJoints / 12));
  // - 1 disco flap acabamento (grão 80/120) a cada ~20 quinas
  const flapDiscsFinishing = Math.max(1, Math.ceil(totalJoints / 20));
  // - ~35g de arame MIG por junta (cordão nas 4 faces do metalon)
  const migWireKg = +((totalJoints * 0.035)).toFixed(2);
  // - ~15 litros de gás de proteção por nó soldado
  const co2ArgonLiters = Math.round(totalJoints * 15);

  return {
    miterCorners45,
    teeJoints,
    mountBracketsJoints,
    totalJoints,
    breakdown: {
      rackBase: {
        miter45: rackMiter45,
        tee: rackTee,
        mounts: rackMounts,
        total: rackMiter45 + rackTee + rackMounts
      },
      solarTrays: {
        traysCount,
        miter45: traysMiter45,
        tee: traysTee,
        total: traysMiter45 + traysTee
      },
      cargoSubchassis: {
        enabled: cargoEnabled,
        miter45: cargoMiter45,
        tee: cargoTee,
        mounts: cargoMounts,
        total: cargoMiter45 + cargoTee + cargoMounts
      }
    },
    unitPricePerJoint: validUnitPrice,
    totalWeldingLaborCost,
    consumables: {
      cuttingDiscs4Half,
      flapDiscsGrinding,
      flapDiscsFinishing,
      migWireKg,
      co2ArgonLiters,
      magneticSquaresRecommended: 4
    },
    stepsDescription: {
      step1: 'Corte em esquadria (45º ou boca de lobo nas travessas)',
      step2: 'Esquadrejamento rigoroso no esquadro magnético e fixação com grampos',
      step3: 'Ponteamento de travamento nas 4 faces do perfil para evitar distorção térmica',
      step4: 'Solda definitiva com penetração contínua (MIG/MAG ou TIG)',
      step5: 'Lixamento e faceamento com disco flap (o mais demorado: desbaste e nivelamento plano para encaixe rente)'
    }
  };
}
