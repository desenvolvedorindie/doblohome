import * as THREE from 'three';
import fs from 'fs';
import path from 'path';

// Mock canvas 2D context for Node.js
if (typeof (global as any).document === 'undefined') {
  const dummyCtx: any = {
    fillRect: () => {},
    clearRect: () => {},
    drawImage: () => {},
    getImageData: () => ({ data: [] }),
    putImageData: () => {},
    createImageData: () => ({ data: [] }),
    setTransform: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    bezierCurveTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    measureText: () => ({ width: 10 }),
    fillText: () => {},
    strokeText: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {}
  };

  (global as any).document = {
    createElement: () => ({
      getContext: () => dummyCtx,
      width: 512,
      height: 256
    })
  };
}

import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { DEFAULT_INTERNAL_GRID, INTERNAL_BOXES_PRESETS } from '../../src/data/internalBoxesPresets';
import { extractWoodCutGroups, groupWoodCutPieces, extractUpholsteryStats, extractBarStats } from '../../src/utils/woodUtils';
import { optimizeCuttingPlan, CutPieceInput, CuttingResult, computePerforationHoles } from '../../src/utils/cuttingOptimizer';
import { extractPvcCutStats } from '../../src/utils/pvcUtils';
import { extractAwningHardwareStats } from '../../src/utils/awningHardwareUtils';
import { SolarSystem } from '../../src/three/SolarSystem';
import { calculateWeldedJoints } from '../../src/utils/weldedJointsUtils';

console.log('--- EXPORTING CUTTING PLAN DATA ---');

// 1. Usar o layout mais completo (slat_bed_camper com armário aéreo, cama com ripas e estofaria)
const preset = INTERNAL_BOXES_PRESETS[1]; // slat_bed_camper
const builder = new InternalBoxesBuilder();
builder.update(preset.grid, preset.boxes, null, false, null);

const scene = new THREE.Scene();
const solarSystem = new SolarSystem(scene);
const mockSceneManager = {
  internalBoxesBuilder: builder,
  solarSystem
};

// 2. Extração de Marcenaria e Estofaria
const woodStats = extractWoodCutGroups(mockSceneManager);
const categories = groupWoodCutPieces(woodStats.cutGroups);
const upholsteryStats = extractUpholsteryStats(woodStats.cutGroups);

// 3. Executar o otimizador 2D Guillotine para cada grupo de madeira/estofaria
const optimizedCuttingResults: CuttingResult[] = [];

for (const cat of categories) {
  const isFoam = cat.woodMaterial.includes('Espuma') || cat.pieces.some(p => p.isUpholstery);
  const sheetWidthMm = isFoam ? 1900 : cat.woodMaterial.includes('MDF') ? 2750 : 2440;
  const sheetHeightMm = isFoam ? 1400 : cat.woodMaterial.includes('MDF') ? 1830 : 1220;

  const piecesInput: CutPieceInput[] = [];
  cat.pieces.forEach(p => {
    for (let i = 0; i < p.qty; i++) {
      piecesInput.push({
        id: `${p.key}_${i}`,
        pieceId: p.key,
        label: p.label,
        moduleName: p.moduleName,
        lengthMm: p.lengthMm,
        widthMm: p.widthMm,
        thicknessMm: cat.thicknessMm,
        material: p.material,
        woodMaterial: cat.woodMaterial,
        isPerforated: p.isPerforated,
        holeDiameterMm: p.holeDiameterMm,
        spacingMm: p.spacingMm,
        exclusionZones: p.exclusionZones,
        partType: p.partType,
        isUpholstery: p.isUpholstery,
        hasCabinetCutout: p.hasCabinetCutout,
        canRotate: true
      });
    }
  });

  const res = optimizeCuttingPlan(
    piecesInput,
    cat.key,
    cat.woodMaterial,
    cat.woodMaterial,
    cat.thicknessMm,
    {
      sheetWidthMm,
      sheetHeightMm,
      kerfMm: isFoam ? 0 : 3,
      marginMm: isFoam ? 0 : 10,
      allowRotation: true
    }
  );

  optimizedCuttingResults.push(res);
}

// 4. Estrutura Metálica (Perfis T-Slot 40x40 e 30x30)
const barStats = extractBarStats(mockSceneManager);
const weldedJoints = calculateWeldedJoints(mockSceneManager);

// 5. Hidráulica PVC
const pvcStats = extractPvcCutStats({
  enabled: true,
  lengthMm: 1750,
  diameterMm: 100
});

// 6. Ferragem do Toldo Retrátil Overland (Calculada Separadamente)
const awningStats = extractAwningHardwareStats({
  enabled: true,
  type: 'batwing_270',
  side: 'passenger',
  lengthMm: 2000,
  extensionMm: 2200
});

// 7. Montar objeto consolidado para o gerador de PDF
const exportData = {
  project: {
    title: 'Plano de Corte Executivo & Desenho Técnico dos Cortes',
    vehicle: 'Fiat Doblò Campervan',
    date: new Date().toLocaleDateString('pt-BR'),
    presetName: preset.name,
    presetDescription: preset.description
  },
  wood: {
    totalPieces: woodStats.totalPieces,
    totalAreaM2: woodStats.totalAreaM2,
    standardSheets: woodStats.standardSheets,
    categories: categories.map(c => ({
      key: c.key,
      woodMaterial: c.woodMaterial,
      thicknessMm: c.thicknessMm,
      totalPieces: c.totalPieces,
      totalAreaM2: c.totalAreaM2,
      estimatedSheets: c.estimatedSheets,
      pieces: c.pieces
    })),
    cuttingPlans: optimizedCuttingResults
  },
  upholstery: {
    totalPieces: upholsteryStats.totalPieces,
    totalAreaM2: upholsteryStats.totalAreaM2,
    totalVolumeLiters: upholsteryStats.totalVolumeLiters,
    estimatedSheets1900: upholsteryStats.estimatedSheets1900,
    cushions: upholsteryStats.cushions
  },
  metal: {
    totalPieces: barStats.totalPieces,
    totalMeters: barStats.totalMeters,
    totalBars6m: barStats.totalBars6m,
    profileSummaries: barStats.profileSummaries,
    cutGroups: barStats.cutGroups,
    thicknessGroups: barStats.thicknessGroups,
    weldedJoints: {
      totalJoints: weldedJoints.totalJoints,
      miterCorners45: weldedJoints.miterCorners45,
      teeJoints: weldedJoints.teeJoints,
      mountBracketsJoints: weldedJoints.mountBracketsJoints,
      consumables: weldedJoints.consumables,
      laborCost: weldedJoints.totalWeldingLaborCost
    }
  },
  pvc: {
    enabled: pvcStats.enabled,
    diameterMm: pvcStats.diameterMm,
    totalPieces: pvcStats.totalPieces,
    totalLinearMeters: pvcStats.totalLinearMeters,
    totalCapacityL: pvcStats.totalCapacityL,
    cutItems: pvcStats.cutItems,
    fittings: pvcStats.fittings,
    plan6m: pvcStats.plan6m,
    plan3m: pvcStats.plan3m,
    recommendedBarOption: pvcStats.recommendedBarOption
  },
  awning: {
    enabled: awningStats.enabled,
    type: awningStats.type,
    typeLabel: awningStats.typeLabel,
    side: awningStats.side,
    sideLabel: awningStats.sideLabel,
    lengthMm: awningStats.lengthMm,
    extensionMm: awningStats.extensionMm,
    totalProfilePieces: awningStats.totalProfilePieces,
    totalLinearMeters: awningStats.totalLinearMeters,
    profilesWeightKg: awningStats.profilesWeightKg,
    fittingsWeightKg: awningStats.fittingsWeightKg,
    fabricWeightKg: awningStats.fabricWeightKg,
    totalAwningWeightKg: awningStats.totalAwningWeightKg,
    profileItems: awningStats.profileItems,
    fittings: awningStats.fittings,
    plan6m: awningStats.plan6m,
    plan3m: awningStats.plan3m,
    recommendedBarOption: awningStats.recommendedBarOption
  }
};

const outputPath = path.resolve('tmp/scripts/cutting_data.json');
fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');
console.log(`Saved cutting plan data to ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
