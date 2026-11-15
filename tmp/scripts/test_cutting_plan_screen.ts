import { describe, it, expect } from 'vitest';
import React from 'react';
import { extractWoodCutGroups, extractBarStats } from '../../src/utils/woodUtils';

describe('Verificação da Tela 3. Peças & Painel de Plano de Corte', () => {
  it('1. Deve extrair corretamente grupos de corte de madeira mesmo sem sceneManager ativo', () => {
    const stats = extractWoodCutGroups(null);
    expect(stats.totalPieces).toBe(0);
    expect(stats.totalAreaM2).toBe(0);
    expect(stats.cutGroups).toEqual([]);
    expect(stats.standardSheets).toBe(1);
  });

  it('2. Deve extrair corretamente barras metálicas mesmo sem sceneManager ativo', () => {
    const barStats = extractBarStats(null);
    expect(barStats.totalPieces).toBe(0);
    expect(barStats.totalMeters).toBe(0);
    expect(barStats.totalBars6m).toBe(0);
    expect(barStats.cutGroups).toEqual([]);
    expect(barStats.profileSummaries).toEqual([]);
  });
});
