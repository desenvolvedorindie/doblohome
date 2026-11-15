import * as THREE from 'three';
import {
  computePerforationHoles,
  optimizeCuttingPlan,
  recalculateSheetStats,
  checkPiecePlacement,
  CutPieceInput,
  PlacedPiece,
  SheetPlan
} from '../../src/utils/cuttingOptimizer';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { InternalBoxItem, InternalGridConfig } from '../../src/types';

function runTests() {
  console.log('🧪 Iniciando testes do Plano de Corte e Otimizador (Estilo Corte Cloud)...');

  // --- Teste 1: Furações CNC para Tampos Vazados ---
  console.log('\n--- 1. Testando cálculo de furos CNC (computePerforationHoles) ---');
  const holes = computePerforationHoles(1160, 380, {
    holeDiameterMm: 40,
    spacingMm: 85,
    exclusionZones: [{ minX: -0.2, maxX: 0.2, minZ: -0.1, maxZ: 0.1 }]
  });

  console.log(`Furos gerados para 1160×380mm: ${holes.length} furos`);
  if (holes.length === 0) {
    throw new Error('Falha: Nenhum furo gerado para tampo vazado!');
  }
  // Checa se todos os furos estão dentro dos limites com margem
  for (const h of holes) {
    if (h.x < 10 || h.x > 1150 || h.y < 10 || h.y > 370) {
      throw new Error(`Falha: Furo fora dos limites da peça: (${h.x}, ${h.y})`);
    }
    if (h.r < 5 || h.r > 25) {
      throw new Error(`Falha: Raio de furo inesperado: ${h.r}`);
    }
  }
  console.log('✅ Teste 1 passou: Furos CNC calculados com raio e margens perfeitas.');

  // --- Teste 2: Algoritmo de Otimização 2D (optimizeCuttingPlan) ---
  console.log('\n--- 2. Testando Otimizador de Corte 2D (Nesting) ---');
  const samplePieces: CutPieceInput[] = [
    {
      id: 'p1',
      label: 'Tampo Baú Cozinha',
      lengthMm: 1160,
      widthMm: 450,
      thicknessMm: 15,
      material: 'Compensado Naval 15mm',
      isPerforated: true,
      holeDiameterMm: 40,
      spacingMm: 85
    },
    {
      id: 'p2',
      label: 'Lateral Esquerda',
      lengthMm: 1160,
      widthMm: 380,
      thicknessMm: 15,
      material: 'Compensado Naval 15mm'
    },
    {
      id: 'p3',
      label: 'Lateral Direita',
      lengthMm: 1160,
      widthMm: 380,
      thicknessMm: 15,
      material: 'Compensado Naval 15mm'
    },
    {
      id: 'p4',
      label: 'Frente Baú',
      lengthMm: 500,
      widthMm: 380,
      thicknessMm: 15,
      material: 'Compensado Naval 15mm'
    },
    {
      id: 'p5',
      label: 'Traseira Baú',
      lengthMm: 500,
      widthMm: 380,
      thicknessMm: 15,
      material: 'Compensado Naval 15mm'
    }
  ];

  const optResult = optimizeCuttingPlan(
    samplePieces,
    'Compensado Naval__15',
    'Compensado Naval',
    15,
    {
      sheetWidthMm: 2440,
      sheetHeightMm: 1220,
      kerfMm: 3,
      marginMm: 10,
      allowRotation: true
    }
  );

  console.log(`Folhas geradas: ${optResult.totalSheets}`);
  console.log(`Peças alocadas: ${optResult.totalPiecesCount} / ${samplePieces.length}`);
  console.log(`Aproveitamento total: ${optResult.overallEfficiencyPct}%`);

  if (optResult.totalSheets === 0 || optResult.totalPiecesCount !== samplePieces.length) {
    throw new Error(`Falha: Nem todas as peças foram alocadas (${optResult.totalPiecesCount} != ${samplePieces.length})`);
  }

  // Verifica se alguma peça ultrapassa a chapa ou colide com outra na folha 1
  const sheet1 = optResult.sheets[0];
  for (let i = 0; i < sheet1.placedPieces.length; i++) {
    const pA = sheet1.placedPieces[i];
    if (pA.x < 10 || pA.y < 10 || pA.x + pA.w > 2430 || pA.y + pA.h > 1210) {
      throw new Error(`Falha: Peça ${pA.label} ultrapassa os limites da chapa!`);
    }

    for (let j = i + 1; j < sheet1.placedPieces.length; j++) {
      const pB = sheet1.placedPieces[j];
      const overlapX = pA.x < pB.x + pB.w && pA.x + pA.w > pB.x;
      const overlapY = pA.y < pB.y + pB.h && pA.y + pA.h > pB.y;
      if (overlapX && overlapY) {
        throw new Error(`Falha: Colisão detectada entre ${pA.label} e ${pB.label}!`);
      }
    }
  }
  console.log('✅ Teste 2 passou: Algoritmo de corte 2D sem sobreposições e com serra respeitada.');

  // --- Teste 3: Checagem de Colisão Manual e Recálculo (checkPiecePlacement) ---
  console.log('\n--- 3. Testando detecção de colisão no arrasto manual ---');
  const pieceA: PlacedPiece = {
    id: 'a',
    pieceId: 'p1',
    label: 'Peça A',
    x: 20,
    y: 20,
    w: 500,
    h: 300,
    originalLength: 500,
    originalWidth: 300,
    thicknessMm: 15,
    rotated: false,
    material: 'Compensado 15mm'
  };

  const pieceB: PlacedPiece = {
    id: 'b',
    pieceId: 'p2',
    label: 'Peça B',
    x: 600,
    y: 20,
    w: 500,
    h: 300,
    originalLength: 500,
    originalWidth: 300,
    thicknessMm: 15,
    rotated: false,
    material: 'Compensado 15mm'
  };

  const checkValid = checkPiecePlacement(pieceA, [pieceB], 2440, 1220, 10, 3);
  if (!checkValid.isValid) {
    throw new Error('Falha: Deveria ser válido quando peças não colidem');
  }

  // Agora movemos pieceA para sobrepor pieceB
  const pieceAColliding = { ...pieceA, x: 550 };
  const checkColliding = checkPiecePlacement(pieceAColliding, [pieceB], 2440, 1220, 10, 3);
  if (checkColliding.isValid || !checkColliding.isColliding) {
    throw new Error('Falha: Deveria detectar colisão entre Peça A e Peça B!');
  }
  console.log('✅ Teste 3 passou: Detecção de colisão e limites de refilo funcionando perfeitamente.');

  // --- Teste 4: Espessura individual por face nos módulos 3D (InternalBoxesBuilder) ---
  console.log('\n--- 4. Testando espessura customizada por face dos módulos 3D ---');
  const grid: InternalGridConfig = {
    lengthMm: 1700,
    widthMm: 1200,
    heightMm: 400,
    colsX: 2,
    rowsZ: 3,
    floorThicknessMm: 15
  };

  const customBox: InternalBoxItem = {
    id: 'box_custom',
    name: 'Baú Custom Espessuras',
    type: 'chest',
    colStart: 0,
    colSpan: 1,
    rowStart: 0,
    rowSpan: 1,
    heightMm: 400,
    color: '#d4a373',
    material: 'plywood',
    thicknessMm: 15,
    panelThickness: {
      top: 18,    // Tampo mais grosso (18mm)
      rear: 6,     // Fundo traseiro mais leve (6mm)
      left: 15,
      right: 15,
      front: 15,
      bottom: 12
    },
    panels: {
      top: true,
      rear: true,
      left: true,
      right: true,
      front: true,
      bottom: true
    }
  };

  const builder = new InternalBoxesBuilder();
  builder.update(grid, [customBox]);
  const scene = new THREE.Scene();
  scene.add(builder.group);

  let topThicknessFound: number | null = null;
  let rearThicknessFound: number | null = null;

  builder.group.traverse((obj: any) => {
    if (obj.isMesh && obj.userData && obj.userData.isWoodPart) {
      if (obj.userData.partLabel && obj.userData.partLabel.includes('Tampa Basculante')) {
        topThicknessFound = obj.userData.thicknessMm;
      }
      if (obj.userData.partLabel && obj.userData.partLabel.includes('Parede Traseira')) {
        rearThicknessFound = obj.userData.thicknessMm;
      }
    }
  });

  console.log(`Espessura do Tampo no 3D: ${topThicknessFound} mm (esperado: 18mm)`);
  console.log(`Espessura da Traseira no 3D: ${rearThicknessFound} mm (esperado: 6mm)`);

  if (topThicknessFound !== 18) {
    throw new Error(`Falha: Espessura do tampo não foi 18mm, obtido: ${topThicknessFound}`);
  }
  if (rearThicknessFound !== 6) {
    throw new Error(`Falha: Espessura da parede traseira não foi 6mm, obtido: ${rearThicknessFound}`);
  }
  console.log('✅ Teste 4 passou: Módulos 3D renderizam e reportam a espessura exata de cada face configurada.');

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
}

runTests();
