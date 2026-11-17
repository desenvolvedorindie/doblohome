import { describe, it, expect } from 'vitest';
import {
  extractAwningHardwareStats,
  computeAwningLinearBarPlan
} from '../src/utils/awningHardwareUtils';

describe('Plano de Corte da Ferragem do Toldo e Cálculo Separado (awningHardwareUtils)', () => {
  it('1. Deve calcular separadamente as ferragens e cortes do Toldo Asa de Morcego 270°', () => {
    const stats = extractAwningHardwareStats({
      enabled: true,
      type: 'batwing_270',
      side: 'passenger',
      lengthMm: 2000,
      extensionMm: 2200
    });

    expect(stats.enabled).toBe(true);
    expect(stats.type).toBe('batwing_270');
    expect(stats.typeLabel).toContain('Asa de Morcego 270°');
    expect(stats.sideLabel).toContain('Passageiro');

    // 1 backbone + 5 braços + 3 postes superiores + 3 postes inferiores = 12 peças de perfil
    expect(stats.totalProfilePieces).toBe(12);

    // Backbone de 2000mm
    const backbone = stats.profileItems.find((p) => p.key === 'awning_backbone');
    expect(backbone).toBeDefined();
    expect(backbone!.lengthMm).toBe(2000);
    expect(backbone!.qty).toBe(1);

    // 5 braços de 2200mm
    const arms = stats.profileItems.find((p) => p.key === 'awning_radial_arms');
    expect(arms).toBeDefined();
    expect(arms!.lengthMm).toBe(2200);
    expect(arms!.qty).toBe(5);
    expect(arms!.totalLengthM).toBeCloseTo(11.0, 1);

    // 3 postes superiores de 1150mm
    const upperPoles = stats.profileItems.find((p) => p.key === 'awning_poles_upper');
    expect(upperPoles).toBeDefined();
    expect(upperPoles!.lengthMm).toBe(1150);
    expect(upperPoles!.qty).toBe(3);

    // 3 postes inferiores de 1100mm
    const lowerPoles = stats.profileItems.find((p) => p.key === 'awning_poles_lower');
    expect(lowerPoles).toBeDefined();
    expect(lowerPoles!.lengthMm).toBe(1100);
    expect(lowerPoles!.qty).toBe(3);

    // Metragem linear total de perfis: 2.0 + 11.0 + 3.45 + 3.30 = 19.75m
    expect(stats.totalLinearMeters).toBeCloseTo(19.75, 2);

    // Ferragens separadas: mancal do pivô, terminais, suportes L, parafusos, travas, sapatas, kit ancoragem
    expect(stats.fittings.length).toBeGreaterThanOrEqual(8);
    const pivot = stats.fittings.find((f) => f.key === 'awning_batwing_pivot_hub');
    expect(pivot).toBeDefined();
    expect(pivot!.material).toContain('Inox');

    // Suportes L para o rack
    const brackets = stats.fittings.find((f) => f.key === 'awning_mount_brackets_l');
    expect(brackets).toBeDefined();
    expect(brackets!.qty).toBe(3);

    // Verificação dos planos de corte lineares comerciais (6m e 3m)
    expect(stats.plan6m.length).toBeGreaterThan(0);
    expect(stats.plan3m.length).toBeGreaterThan(0);

    // Nenhuma barra pode ultrapassar seu tamanho máximo comercial
    stats.plan6m.forEach((bar) => {
      const cutsSum = bar.segments.filter(s => !s.isWaste).reduce((acc, s) => acc + s.lengthMm, 0);
      expect(cutsSum).toBeLessThanOrEqual(6000);
      expect(bar.efficiencyPct).toBeGreaterThan(0);
      expect(bar.efficiencyPct).toBeLessThanOrEqual(100);
    });

    stats.plan3m.forEach((bar) => {
      const cutsSum = bar.segments.filter(s => !s.isWaste).reduce((acc, s) => acc + s.lengthMm, 0);
      expect(cutsSum).toBeLessThanOrEqual(3000);
    });
  });

  it('2. Deve calcular separadamente as ferragens e cortes do Toldo Traseiro Reto', () => {
    const stats = extractAwningHardwareStats({
      enabled: true,
      type: 'rear',
      lengthMm: 1400,
      extensionMm: 2000
    });

    expect(stats.type).toBe('rear');
    expect(stats.typeLabel).toContain('Traseiro Reto');

    // 1 estojo cilíndrico + 1 barra frontal + 2 hastes horizontais + 2 postes superiores + 2 postes inferiores = 8 peças
    expect(stats.totalProfilePieces).toBe(8);

    const leadBar = stats.profileItems.find((p) => p.key === 'awning_lead_bar');
    expect(leadBar).toBeDefined();
    expect(leadBar!.lengthMm).toBe(1372); // 1400 * 0.98

    const tensionArms = stats.profileItems.find((p) => p.key === 'awning_tension_arms');
    expect(tensionArms).toBeDefined();
    expect(tensionArms!.qty).toBe(2);
    expect(tensionArms!.lengthMm).toBeCloseTo(2004, 0);

    // Suportes traseiros em L
    const brackets = stats.fittings.find((f) => f.key === 'awning_rear_brackets_l');
    expect(brackets).toBeDefined();
    expect(brackets!.qty).toBe(2);
    expect(brackets!.material).toContain('Inox');

    // Metragem linear e peso
    expect(stats.totalLinearMeters).toBeGreaterThan(10);
    expect(stats.profilesWeightKg).toBeGreaterThan(0);
    expect(stats.totalAwningWeightKg).toBeGreaterThan(0);
  });

  it('3. computeAwningLinearBarPlan deve otimizar cortes respeitando kerf de corte e limites de barra', () => {
    const pieces = [
      { label: 'Braço 1', lengthMm: 2200, color: '#f59e0b' },
      { label: 'Braço 2', lengthMm: 2200, color: '#f59e0b' },
      { label: 'Braço 3', lengthMm: 2200, color: '#f59e0b' },
      { label: 'Calha Base', lengthMm: 2000, color: '#38bdf8' },
      { label: 'Poste 1', lengthMm: 1150, color: '#10b981' }
    ];

    const plan6m = computeAwningLinearBarPlan(6000, pieces, 3);
    expect(plan6m.length).toBeGreaterThan(0);

    // Total de peças cortadas em todas as barras deve ser igual ao número de peças de entrada
    let totalCuts = 0;
    plan6m.forEach((bar) => {
      const validCuts = bar.segments.filter(s => !s.isWaste);
      totalCuts += validCuts.length;
      expect(bar.usedMm + bar.wasteMm + bar.kerfMm).toBeLessThanOrEqual(6000 + 10);
    });
    expect(totalCuts).toBe(5);
  });

  it('4. Deve manter o cálculo do toldo totalmente desacoplado mesmo quando chamado sem parâmetros', () => {
    const statsDefault = extractAwningHardwareStats();
    expect(statsDefault).toBeDefined();
    expect(statsDefault.totalProfilePieces).toBeGreaterThan(0);
    expect(statsDefault.profileItems.length).toBeGreaterThan(0);
    expect(statsDefault.fittings.length).toBeGreaterThan(0);
  });
});
