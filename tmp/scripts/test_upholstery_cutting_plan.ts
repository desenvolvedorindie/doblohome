import * as THREE from 'three';
import { extractWoodCutGroups, extractUpholsteryStats, groupWoodCutPieces } from '../../src/utils/woodUtils';
import { optimizeCuttingPlan } from '../../src/utils/cuttingOptimizer';

console.log('--- TESTE: UPHOLSTERY CUTTING PLAN & STATS ---');

// Mock sceneManager with internalBoxesBuilder containing wood pieces and upholstery cushions
const group = new THREE.Group();

// 1. Wood piece
const woodMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.015, 0.4), new THREE.MeshBasicMaterial());
woodMesh.userData = {
  isWoodPart: true,
  partLabel: 'Tampo Compensado 15mm',
  woodMaterial: 'Compensado Naval',
  thicknessMm: 15,
  dimW: 1.2,
  dimH: 0.015,
  dimL: 0.4,
  moduleName: 'Cama Dobrável'
};
group.add(woodMesh);

// 2. Mattress cushion 1 (Regular)
const cushion1 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.58), new THREE.MeshBasicMaterial());
cushion1.userData = {
  isWoodPart: false,
  isUpholstery: true,
  partLabel: 'Almofada Cama #1 - Traseira',
  woodMaterial: 'Espuma D33 (Colchão)',
  material: 'Espuma D33 Revestida em Tecido Impermeável',
  thicknessMm: 80,
  dimW: 1.22,
  dimH: 0.08,
  dimL: 0.58,
  hasCabinetCutout: false,
  moduleName: 'Cama Dobrável',
  partType: 'upholstery'
};
group.add(cushion1);

// 3. Mattress cushion 2 (With cabinet cutout)
const cushion2 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.58), new THREE.MeshBasicMaterial());
cushion2.userData = {
  isWoodPart: false,
  isUpholstery: true,
  partLabel: 'Almofada Cama #2 - Central (Corte Especial)',
  woodMaterial: 'Espuma D33 (Colchão)',
  material: 'Espuma D33 Revestida em Tecido Impermeável',
  thicknessMm: 80,
  dimW: 1.22,
  dimH: 0.08,
  dimL: 0.58,
  hasCabinetCutout: true,
  moduleName: 'Cama Dobrável',
  partType: 'upholstery'
};
group.add(cushion2);

const mockSceneManager = {
  internalBoxesBuilder: { group }
};

// Test extraction
const woodStats = extractWoodCutGroups(mockSceneManager);
console.log(`Total pieces extracted: ${woodStats.totalPieces}`);
console.log(`Standard wood sheets (excluding foam): ${woodStats.standardSheets}`);

const upholsteryStats = extractUpholsteryStats(woodStats.cutGroups);
console.log(`Upholstery total cushions: ${upholsteryStats.totalPieces}`);
console.log(`Upholstery total area: ${upholsteryStats.totalAreaM2.toFixed(3)} m²`);
console.log(`Upholstery total volume: ${upholsteryStats.totalVolumeLiters.toFixed(1)} L`);
console.log(`Estimated foam blocks (1.9x1.4m): ${upholsteryStats.estimatedSheets1900}`);

if (upholsteryStats.totalPieces !== 2) {
  throw new Error(`Expected 2 cushions, got ${upholsteryStats.totalPieces}`);
}

const cutoutCushion = upholsteryStats.cushions.find(c => c.hasCabinetCutout);
if (!cutoutCushion) {
  throw new Error('Expected at least one cushion with hasCabinetCutout = true');
}
console.log(`Verified cushion with cutout: ${cutoutCushion.label}`);

// Test categories
const categories = groupWoodCutPieces(woodStats.cutGroups);
const foamCat = categories.find(c => c.woodMaterial.includes('Espuma'));
if (!foamCat) {
  throw new Error('Foam category not found in groupWoodCutPieces');
}
console.log(`Foam category: ${foamCat.woodMaterial} ${foamCat.thicknessMm}mm - pieces: ${foamCat.totalPieces}, sheets: ${foamCat.estimatedSheets}`);

// Test 2D Cutting Plan Optimization for Foam
const foamPieces = foamCat.pieces.map((p, idx) => ({
  id: `foam_${idx}`,
  pieceId: p.key,
  label: p.label,
  lengthMm: p.lengthMm,
  widthMm: p.widthMm,
  thicknessMm: p.thicknessMm,
  material: p.material,
  woodMaterial: p.woodMaterial,
  isUpholstery: p.isUpholstery,
  hasCabinetCutout: p.hasCabinetCutout,
  canRotate: true
}));

const plan = optimizeCuttingPlan(
  foamPieces,
  foamCat.key,
  foamCat.woodMaterial,
  foamCat.thicknessMm,
  {
    sheetWidthMm: 1900,
    sheetHeightMm: 1400,
    kerfMm: 2,
    marginMm: 10,
    allowRotation: true
  }
);

console.log(`Cutting plan generated: ${plan.sheets.length} foam block(s) needed`);
console.log(`Overall efficiency: ${plan.overallEfficiencyPct.toFixed(1)}%`);
plan.sheets.forEach((s, i) => {
  console.log(`  Block #${i + 1}: ${s.placedPieces.length} cushions placed, efficiency: ${s.efficiencyPct.toFixed(1)}%`);
  s.placedPieces.forEach(p => {
    console.log(`    - ${p.label}: pos (${p.x}, ${p.y}), dim ${p.w}x${p.h}mm, rotated: ${p.rotated}, cutout: ${p.hasCabinetCutout}`);
  });
});

if (plan.sheets.length === 0 || plan.sheets[0].placedPieces.length !== 2) {
  throw new Error(`Expected both cushions to fit on 1 foam block of 1900x1400mm, sheets: ${plan.sheets.length}`);
}

console.log('--- ALL UPHOLSTERY CUTTING PLAN TESTS PASSED SUCCESSFULLY! ---');
