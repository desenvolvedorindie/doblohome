import { describe, it, expect } from 'vitest';
import { extractPvcCutStats } from '../src/utils/pvcUtils';

describe('extractPvcCutStats - PVC Pipe Cutting Plan for Water Tank', () => {
  it('calculates the 3 pipe cuts and 1D nesting for standard 2.20m structure with Ø200mm pipe', () => {
    const stats = extractPvcCutStats({
      enabled: true,
      lengthMm: 2200,
      diameterMm: 200
    });

    expect(stats.enabled).toBe(true);
    expect(stats.diameterMm).toBe(200);
    expect(stats.radiusMm).toBe(100);
    expect(stats.totalPieces).toBe(3);

    // Canos laterais e frontal
    expect(stats.cutItems.length).toBe(3);
    const lateralLeft = stats.cutItems.find((c) => c.key === 'pvc_lateral_left')!;
    const lateralRight = stats.cutItems.find((c) => c.key === 'pvc_lateral_right')!;
    const front = stats.cutItems.find((c) => c.key === 'pvc_front_transverse')!;

    expect(lateralLeft.lengthMm).toBe(1885);
    expect(lateralRight.lengthMm).toBe(1885);
    expect(front.lengthMm).toBe(850);

    // Metros lineares totais (1885 + 1885 + 850 = 4620 mm = 4.62 m)
    expect(stats.totalLinearMeters).toBe(4.62);

    // Capacidade útil montada
    expect(stats.totalCapacityL).toBeGreaterThan(120);

    // Plano de corte comercial de 6 metros
    // Como a soma é ~4.98m, deve caber em apenas 1 barra de 6m
    expect(stats.plan6m.length).toBe(1);
    expect(stats.plan6m[0].barLengthMm).toBe(6000);
    expect(stats.plan6m[0].efficiencyPct).toBeGreaterThan(75);
    expect(stats.plan6m[0].wasteMm).toBeGreaterThan(800);

    // Plano de corte comercial de 3 metros
    // Exige 2 barras de 3m
    expect(stats.plan3m.length).toBe(2);
    stats.plan3m.forEach((bar) => {
      expect(bar.barLengthMm).toBe(3000);
      expect(bar.usedMm).toBeLessThanOrEqual(3000);
    });

    // Conexões hidráulicas necessárias
    expect(stats.fittings.length).toBeGreaterThanOrEqual(6);
    expect(stats.fittings.some((f) => f.key === 'fit_elbow_90' && f.qty === 2)).toBe(true);
    expect(stats.fittings.some((f) => f.key === 'fit_cap' && f.qty === 2)).toBe(true);
    expect(stats.fittings.some((f) => f.key === 'fit_filler' && f.qty === 1)).toBe(true);
  });

  it('handles custom diameter (e.g. Ø150mm and length 1800mm)', () => {
    const stats = extractPvcCutStats({
      enabled: true,
      lengthMm: 1800,
      diameterMm: 150
    });

    expect(stats.diameterMm).toBe(150);
    expect(stats.radiusMm).toBe(75);
    expect(stats.totalPieces).toBe(3);
    expect(stats.totalLinearMeters).toBeLessThan(4.5);
    expect(stats.plan6m.length).toBe(1);
  });

  it('respects enabled flag and defaults', () => {
    const disabledStats = extractPvcCutStats({ enabled: false });
    expect(disabledStats.enabled).toBe(false);

    const defaultStats = extractPvcCutStats(undefined);
    expect(defaultStats.enabled).toBe(true);
    expect(defaultStats.diameterMm).toBe(200);
  });
});
