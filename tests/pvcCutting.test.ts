import { describe, it, expect } from 'vitest';
import { extractPvcCutStats } from '../src/utils/pvcUtils';

describe('extractPvcCutStats - PVC Pipe Cutting Plan for Water Tank', () => {
  it('calculates the 5 pipe cuts and 1D nesting for standard 2.20m structure with Ø200mm pipe and central Tee', () => {
    const stats = extractPvcCutStats({
      enabled: true,
      lengthMm: 2200,
      diameterMm: 200,
      connectionPosition: 'front'
    });

    expect(stats.enabled).toBe(true);
    expect(stats.diameterMm).toBe(200);
    expect(stats.radiusMm).toBe(100);
    expect(stats.connectionPosition).toBe('front');

    // 5 peças: 2 laterais + 2 transversais (divididas pelo Tê) + 1 niple vertical (Tê ao Cap)
    expect(stats.totalPieces).toBe(5);
    expect(stats.cutItems.length).toBe(5);

    const lateralLeft = stats.cutItems.find((c) => c.key === 'pvc_lateral_left')!;
    const lateralRight = stats.cutItems.find((c) => c.key === 'pvc_lateral_right')!;
    const transLeft = stats.cutItems.find((c) => c.key === 'pvc_transverse_left')!;
    const transRight = stats.cutItems.find((c) => c.key === 'pvc_transverse_right')!;
    const vertNipple = stats.cutItems.find((c) => c.key === 'pvc_vertical_nipple')!;

    expect(lateralLeft.lengthMm).toBe(1885);
    expect(lateralRight.lengthMm).toBe(1885);
    expect(transLeft.lengthMm).toBe(350);
    expect(transRight.lengthMm).toBe(350);
    expect(vertNipple.lengthMm).toBe(100);

    // Metros lineares totais (1885 + 1885 + 350 + 350 + 100 = 4570 mm = 4.57 m)
    expect(stats.totalLinearMeters).toBe(4.57);

    // Capacidade útil montada
    expect(stats.totalCapacityL).toBeGreaterThan(120);

    // Plano de corte comercial de 6 metros
    // Como a soma é ~4.57m + cortes, cabe com folga em apenas 1 barra de 6m
    expect(stats.plan6m.length).toBe(1);
    expect(stats.plan6m[0].barLengthMm).toBe(6000);
    expect(stats.plan6m[0].efficiencyPct).toBeGreaterThan(70);
    expect(stats.plan6m[0].wasteMm).toBeGreaterThan(1000);

    // Plano de corte comercial de 3 metros (exige 2 barras de 3m)
    expect(stats.plan3m.length).toBe(2);
    stats.plan3m.forEach((bar) => {
      expect(bar.barLengthMm).toBe(3000);
      expect(bar.usedMm).toBeLessThanOrEqual(3000);
    });

    // Conexões hidráulicas necessárias (Joelhos, Tê 90°, CAPs, Bocal/Tampinha, etc.)
    expect(stats.fittings.length).toBeGreaterThanOrEqual(7);
    expect(stats.fittings.some((f) => f.key === 'fit_elbow_90' && f.qty === 2)).toBe(true);
    expect(stats.fittings.some((f) => f.key === 'fit_tee_90' && f.qty === 1)).toBe(true);
    expect(stats.fittings.some((f) => f.key === 'fit_cap' && f.qty === 3)).toBe(true);
    expect(stats.fittings.some((f) => f.key === 'fit_filler' && f.qty === 1)).toBe(true);
  });

  it('allows configuring connection position to rear (traseira do rack)', () => {
    const statsRear = extractPvcCutStats({
      enabled: true,
      lengthMm: 2200,
      diameterMm: 200,
      connectionPosition: 'rear'
    });

    expect(statsRear.connectionPosition).toBe('rear');
    expect(statsRear.totalPieces).toBe(5);

    const transLeft = statsRear.cutItems.find((c) => c.key === 'pvc_transverse_left')!;
    expect(transLeft.label).toContain('Traseiro');
    expect(transLeft.notes).toContain('traseira da van');

    const capFitting = statsRear.fittings.find((f) => f.key === 'fit_cap')!;
    expect(capFitting.notes).toContain('dianteiras');
  });

  it('handles custom diameter (e.g. Ø150mm and length 1800mm)', () => {
    const stats = extractPvcCutStats({
      enabled: true,
      lengthMm: 1800,
      diameterMm: 150
    });

    expect(stats.diameterMm).toBe(150);
    expect(stats.radiusMm).toBe(75);
    expect(stats.totalPieces).toBe(5);
    expect(stats.totalLinearMeters).toBeLessThan(4.5);
    expect(stats.plan6m.length).toBe(1);
  });

  it('respects enabled flag and defaults', () => {
    const disabledStats = extractPvcCutStats({ enabled: false });
    expect(disabledStats.enabled).toBe(false);

    const defaultStats = extractPvcCutStats(undefined);
    expect(defaultStats.enabled).toBe(true);
    expect(defaultStats.diameterMm).toBe(200);
    expect(defaultStats.connectionPosition).toBe('front');
  });
});
