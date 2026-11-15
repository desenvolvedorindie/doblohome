/**
 * test_cutting_plan_automated.ts
 *
 * Script automatizado de testes para o algoritmo e lógica de Plano de Corte & Otimização 2D (Estilo Corte Cloud)
 * Executável via: npx vite-node tmp/scripts/test_cutting_plan_automated.ts
 */

import {
  computePerforationHoles,
  optimizeCuttingPlan,
  recalculateSheetStats,
  checkPiecePlacement,
  CutPieceInput,
  PlacedPiece,
  SheetPlan
} from '../../src/utils/cuttingOptimizer';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const results: TestResult[] = [];

function test(suite: string, name: string, fn: () => void) {
  const start = performance.now();
  try {
    fn();
    results.push({ suite, name, passed: true, durationMs: performance.now() - start });
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    results.push({ suite, name, passed: false, durationMs: performance.now() - start, error: err.message });
    console.error(`  ✗ ${name}`);
    console.error(`    Erro: ${err.message}`);
  }
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) throw new Error(`Esperado ${expected}, mas obteve ${actual}`);
    },
    toBeGreaterThan(expected: number) {
      if (!(actual > expected)) throw new Error(`Esperado que ${actual} fosse maior que ${expected}`);
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (!(actual >= expected)) throw new Error(`Esperado que ${actual} fosse maior ou igual a ${expected}`);
    },
    toBeLessThanOrEqual(expected: number) {
      if (!(actual <= expected)) throw new Error(`Esperado que ${actual} fosse menor ou igual a ${expected}`);
    },
    toBeCloseTo(expected: number, precision: number = 0) {
      const diff = Math.abs(actual - expected);
      const tol = Math.pow(10, -precision) / 2;
      if (diff > tol) throw new Error(`Esperado ${actual} próximo de ${expected} (tol: ${tol})`);
    },
    toBeDefined() {
      if (actual === undefined || actual === null) throw new Error(`Esperado que valor estivesse definido`);
    }
  };
}

console.log('\n======================================================');
console.log('🧪 BATERIA DE TESTES AUTOMATIZADOS: PLANO DE CORTE');
console.log('======================================================\n');

// 1. FURAÇÕES CNC
console.log('📁 1. Furações CNC (computePerforationHoles)');
test('CNC', 'Gera furos válidos dentro das margens estruturais', () => {
  const holes = computePerforationHoles(1160, 380, { holeDiameterMm: 40, spacingMm: 85 });
  expect(holes.length).toBeGreaterThan(0);
  holes.forEach((h) => {
    expect(h.x).toBeGreaterThanOrEqual(25);
    expect(h.x).toBeLessThanOrEqual(1160 - 25);
    expect(h.y).toBeGreaterThanOrEqual(25);
    expect(h.y).toBeLessThanOrEqual(380 - 25);
  });
});

test('CNC', 'Respeita zonas de exclusão (apoio armário/estrutura)', () => {
  const withoutZone = computePerforationHoles(1200, 600, { holeDiameterMm: 40, spacingMm: 80 });
  const withZone = computePerforationHoles(1200, 600, {
    holeDiameterMm: 40,
    spacingMm: 80,
    exclusionZones: [{ minX: -0.15, maxX: 0.15, minZ: -0.15, maxZ: 0.15 }]
  });
  expect(withoutZone.length).toBeGreaterThan(withZone.length);
});

test('CNC', 'Limita diâmetros e espaçamentos aos padrões industriais', () => {
  const holes = computePerforationHoles(800, 400, { holeDiameterMm: 120, spacingMm: 40 });
  expect(holes.length).toBeGreaterThan(0);
  holes.forEach((h) => {
    expect(h.r).toBeLessThanOrEqual(43); // 85 / 2 arredondado
  });
});

// 2. NESTING 2D GUILLOTINE
console.log('\n📁 2. Algoritmo Otimizador 2D (optimizeCuttingPlan)');
const samplePieces: CutPieceInput[] = [
  { id: 'p1', label: 'Tampo Pia', lengthMm: 1160, widthMm: 450, thicknessMm: 15, material: 'Compensado', isPerforated: true },
  { id: 'p2', label: 'Lateral Esq', lengthMm: 1160, widthMm: 380, thicknessMm: 15, material: 'Compensado' },
  { id: 'p3', label: 'Lateral Dir', lengthMm: 1160, widthMm: 380, thicknessMm: 15, material: 'Compensado' },
  { id: 'p4', label: 'Frente', lengthMm: 500, widthMm: 380, thicknessMm: 15, material: 'Compensado' },
  { id: 'p5', label: 'Traseira', lengthMm: 500, widthMm: 380, thicknessMm: 15, material: 'Compensado' }
];

test('Nesting', 'Aloca lote sem sobreposição e respeitando serra (kerf) e refilo', () => {
  const res = optimizeCuttingPlan(samplePieces, 'Comp__15', 'Compensado Naval', 15, {
    sheetWidthMm: 2440,
    sheetHeightMm: 1220,
    kerfMm: 3,
    marginMm: 10,
    allowRotation: true
  });
  expect(res.totalPiecesCount).toBe(samplePieces.length);
  expect(res.unplacedPieces.length).toBe(0);
  expect(res.totalSheets).toBeGreaterThanOrEqual(1);

  // Validação matemática de não colisão
  const s = res.sheets[0];
  for (let i = 0; i < s.placedPieces.length; i++) {
    for (let j = i + 1; j < s.placedPieces.length; j++) {
      const a = s.placedPieces[i];
      const b = s.placedPieces[j];
      const colX = a.x < b.x + b.w && a.x + a.w > b.x;
      const colY = a.y < b.y + b.h && a.y + a.h > b.y;
      if (colX && colY) throw new Error(`Colisão detectada entre ${a.label} e ${b.label}`);
    }
  }
});

test('Nesting', 'Gera furos em peças marcadas como vazadas no resultado', () => {
  const res = optimizeCuttingPlan(samplePieces, 'Comp__15', 'Compensado Naval', 15);
  const perf = res.sheets[0].placedPieces.find((p) => p.isPerforated);
  expect(perf).toBeDefined();
  expect(perf!.holes).toBeDefined();
  expect(perf!.holes!.length).toBeGreaterThan(0);
});

test('Nesting', 'Desloca peças para nova chapa quando a primeira enche', () => {
  const bigList: CutPieceInput[] = Array.from({ length: 8 }, (_, i) => ({
    id: `b_${i}`,
    label: `Placa ${i + 1}`,
    lengthMm: 1200,
    widthMm: 550,
    thicknessMm: 15,
    material: 'Compensado'
  }));
  const res = optimizeCuttingPlan(bigList, 'Comp__15', 'Compensado', 15);
  expect(res.totalSheets).toBeGreaterThan(1);
  expect(res.totalPiecesCount).toBe(8);
});

test('Nesting', 'Identifica e isola peças que excedem dimensões da chapa', () => {
  const oversized: CutPieceInput = { id: 'huge', label: 'Gigante', lengthMm: 3000, widthMm: 1500, thicknessMm: 15, material: 'Compensado' };
  const res = optimizeCuttingPlan([oversized], 'Comp__15', 'Compensado', 15);
  expect(res.unplacedPieces.length).toBe(1);
  expect(res.totalPiecesCount).toBe(0);
});

// 3. RECÁLCULO E VALIDAÇÃO DE ARRASTO
console.log('\n📁 3. Validação de Posicionamento Manual (checkPiecePlacement)');
test('Manual', 'Detecta peças fora dos limites ou colidindo entre si', () => {
  const pA: PlacedPiece = {
    id: 'a', pieceId: 'p1', label: 'Peça A', x: 20, y: 20, w: 400, h: 300,
    originalLength: 400, originalWidth: 300, thicknessMm: 15, rotated: false, material: 'Compensado'
  };
  const pB: PlacedPiece = {
    id: 'b', pieceId: 'p2', label: 'Peça B', x: 500, y: 20, w: 400, h: 300,
    originalLength: 400, originalWidth: 300, thicknessMm: 15, rotated: false, material: 'Compensado'
  };

  const valid = checkPiecePlacement(pA, [pB], 2440, 1220, 10, 3);
  expect(valid.isValid).toBe(true);

  // Colisão forçada
  const colliding = { ...pA, x: 450 };
  const checkCol = checkPiecePlacement(colliding, [pB], 2440, 1220, 10, 3);
  expect(checkCol.isValid).toBe(false);
  expect(checkCol.isColliding).toBe(true);
});

test('Manual', 'Recalcula estatísticas e percentual de aproveitamento com exatidão', () => {
  const sheet: SheetPlan = {
    sheetIndex: 1, sheetWidthMm: 2000, sheetHeightMm: 1000, material: 'Compensado', thicknessMm: 15,
    marginMm: 10, kerfMm: 3, totalAreaM2: 2.0, usedAreaM2: 0, efficiencyPct: 0, wastePct: 100,
    placedPieces: [
      { id: '1', pieceId: '1', label: 'P1', x: 10, y: 10, w: 1000, h: 500, originalLength: 1000, originalWidth: 500, thicknessMm: 15, rotated: false, material: 'Comp' }
    ]
  };
  const updated = recalculateSheetStats(sheet);
  expect(updated.usedAreaM2).toBe(0.5);
  expect(updated.efficiencyPct).toBe(25);
  expect(updated.wastePct).toBe(75);
});

// RESULTADO FINAL
const passedCount = results.filter((r) => r.passed).length;
const totalCount = results.length;
console.log('\n======================================================');
console.log(`📊 RESULTADO FINAL: ${passedCount}/${totalCount} testes passaram com sucesso!`);
console.log('======================================================\n');

if (passedCount !== totalCount) {
  process.exit(1);
}
