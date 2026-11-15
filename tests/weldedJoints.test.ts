import { describe, it, expect } from 'vitest';
import {
  calculateWeldedJoints,
  parseProfileThickness,
  groupProfilesByThickness
} from '../src/utils/weldedJointsUtils';
import { extractBarStats, ProfileSummary, BarCutGroup } from '../src/utils/woodUtils';

describe('Precificação por Junta/Nó (A métrica das "Quinas") & Agrupamento por Espessura', () => {
  it('1. Deve calcular quinas, juntas em T e nós de fixação com estimativa completa de custos e consumíveis', () => {
    const report = calculateWeldedJoints(null, 35.0);

    expect(report.totalJoints).toBeGreaterThan(0);
    expect(report.miterCorners45).toBeGreaterThanOrEqual(4); // Pelo menos 4 quinas 45° do quadro base
    expect(report.teeJoints).toBeGreaterThanOrEqual(4); // Travessas intermediárias
    expect(report.mountBracketsJoints).toBeGreaterThanOrEqual(4); // 4 sapatas de apoio

    expect(report.unitPricePerJoint).toBe(35.0);
    expect(report.totalWeldingLaborCost).toBe(report.totalJoints * 35.0);

    // Deve conter as 5 etapas obrigatórias do ciclo da quina
    expect(report.stepsDescription.step1).toContain('esquadria');
    expect(report.stepsDescription.step2).toContain('magnético');
    expect(report.stepsDescription.step3).toContain('Ponteamento');
    expect(report.stepsDescription.step4).toContain('Solda definitiva');
    expect(report.stepsDescription.step5).toContain('disco flap');

    // Consumíveis estimados
    expect(report.consumables.cuttingDiscs4Half).toBeGreaterThanOrEqual(1);
    expect(report.consumables.flapDiscsGrinding).toBeGreaterThanOrEqual(1);
    expect(report.consumables.flapDiscsFinishing).toBeGreaterThanOrEqual(1);
    expect(report.consumables.migWireKg).toBeGreaterThan(0);
    expect(report.consumables.magneticSquaresRecommended).toBe(4);
  });

  it('2. Deve permitir precificação customizada por quina/nó', () => {
    const reportCustom = calculateWeldedJoints(null, 45.0);
    expect(reportCustom.unitPricePerJoint).toBe(45.0);
    expect(reportCustom.totalWeldingLaborCost).toBe(reportCustom.totalJoints * 45.0);
  });

  it('3. parseProfileThickness deve identificar tubos 40x40, 30x30 e acessórios com bitolas corretas', () => {
    const p40 = parseProfileThickness('Metalon 40×40 × 2.0mm', 'Longarina Lateral do Rack Base');
    expect(p40.thicknessMm).toBe(2.0);
    expect(p40.gaugeLabel).toContain('#14');
    expect(p40.sectionCategory).toBe('40x40');
    expect(p40.groupTitle).toContain('40×40');

    const p30 = parseProfileThickness('Metalon 30×30 × 1.5mm', 'Longarina da Bandeja');
    expect(p30.thicknessMm).toBe(1.5);
    expect(p30.gaugeLabel).toContain('#16');
    expect(p30.sectionCategory).toBe('30x30');
    expect(p30.groupTitle).toContain('30×30');

    const pAcc = parseProfileThickness('Sapata de Ancoragem 50x60x80mm', 'Sapata do Rack Base (#1)');
    expect(pAcc.thicknessMm).toBe(0);
    expect(pAcc.sectionCategory).toBe('accessories');
    expect(pAcc.groupTitle).toContain('FERRAGENS');
  });

  it('4. groupProfilesByThickness deve agrupar resumos e cortes por espessura com subtotais corretos', () => {
    const mockProfiles: ProfileSummary[] = [
      {
        profileSpec: 'Metalon 40×40 × 2.0mm',
        pieces: 6,
        totalMeters: 10.4,
        bars6m: 2,
        bars3m: 4
      },
      {
        profileSpec: 'Metalon 30×30 × 1.5mm',
        pieces: 12,
        totalMeters: 14.8,
        bars6m: 3,
        bars3m: 5
      },
      {
        profileSpec: 'Sapata de Ancoragem 50x60x80mm',
        pieces: 4,
        totalMeters: 0.32,
        bars6m: 1,
        bars3m: 1
      }
    ];

    const mockCuts: BarCutGroup[] = [
      {
        key: 'long_40',
        label: 'Longarina Lateral do Rack Base',
        profileSpec: 'Metalon 40×40 × 2.0mm',
        lengthMm: 2200,
        lengthM: 2.2,
        qty: 2,
        totalLengthM: 4.4
      },
      {
        key: 'tray_30',
        label: 'Longarina da Bandeja Solar',
        profileSpec: 'Metalon 30×30 × 1.5mm',
        lengthMm: 1100,
        lengthM: 1.1,
        qty: 4,
        totalLengthM: 4.4
      }
    ];

    const { thicknessGroups, cutThicknessGroups } = groupProfilesByThickness(mockProfiles, mockCuts);

    expect(thicknessGroups.length).toBe(3);
    // 40x40 (2.0mm) deve vir em primeiro lugar
    expect(thicknessGroups[0].sectionCategory).toBe('40x40');
    expect(thicknessGroups[0].thicknessMm).toBe(2.0);
    expect(thicknessGroups[0].totalPieces).toBe(6);
    expect(thicknessGroups[0].totalBars6m).toBe(2);

    // 30x30 (1.5mm) em segundo
    expect(thicknessGroups[1].sectionCategory).toBe('30x30');
    expect(thicknessGroups[1].thicknessMm).toBe(1.5);
    expect(thicknessGroups[1].totalPieces).toBe(12);

    // Cortes agrupados
    expect(cutThicknessGroups.length).toBe(2);
    expect(cutThicknessGroups[0].sectionCategory).toBe('40x40');
    expect(cutThicknessGroups[0].items[0].label).toContain('Longarina');
    expect(cutThicknessGroups[1].sectionCategory).toBe('30x30');
  });

  it('5. extractBarStats deve retornar thicknessGroups e cutThicknessGroups', () => {
    const stats = extractBarStats(null);
    expect(stats).toHaveProperty('thicknessGroups');
    expect(stats).toHaveProperty('cutThicknessGroups');
    expect(Array.isArray(stats.thicknessGroups)).toBe(true);
    expect(Array.isArray(stats.cutThicknessGroups)).toBe(true);
  });
});
