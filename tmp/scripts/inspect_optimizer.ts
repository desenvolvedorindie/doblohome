import * as THREE from 'three';
import { SlatBedBuilder } from '../../src/three/boxes/SlatBedBuilder';
import { extractWoodCutGroups, groupWoodCutPieces } from '../../src/utils/woodUtils';
import { optimizeCuttingPlan } from '../../src/utils/cuttingOptimizer';
import { InternalBoxItem } from '../../src/types';

const w = 0.40;
const l = 1.70;
const h = 0.40;
const mat = new THREE.MeshStandardMaterial({ color: 0xd97706 });

const slatBox: InternalBoxItem = {
  id: 'box_slat_1',
  name: 'Baú Cama de Ripas',
  type: 'slat_bed',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  bedMode: 'slat',
  isOpen: false,
  slatBedDirection: 'left'
};

const builder = new SlatBedBuilder();
const container = new THREE.Group();
builder.buildSlatBedModule(container, w, l, h, mat, slatBox, false, false);
const mockSceneManager = {
  internalBoxesBuilder: {
    group: container
  }
};
const woodStats = extractWoodCutGroups(mockSceneManager);
const categories = groupWoodCutPieces(woodStats.cutGroups);

const plyCat = categories.find(c => c.key === 'Compensado Naval__15');
if (plyCat) {
  const piecesToCut = [];
  plyCat.pieces.forEach(g => {
    for (let i = 0; i < g.qty; i++) {
      piecesToCut.push({
        id: `${g.key}_${i}`,
        pieceId: g.key,
        label: g.label,
        lengthMm: g.lengthMm,
        widthMm: g.widthMm,
        thicknessMm: g.thicknessMm,
        material: g.material,
        woodMaterial: g.woodMaterial,
        canRotate: true
      });
    }
  });
  console.log(`\nPieces to cut: ${piecesToCut.length}`);
  const optResult = optimizeCuttingPlan(piecesToCut, 'Compensado Naval__15', 'Compensado Naval', 15);
  console.log(`Total placed: ${optResult.totalPiecesPlaced} / ${piecesToCut.length}`);
  console.log(`Unplaced pieces: ${optResult.unplacedPieces.length}`);
  console.log(`Sheets required: ${optResult.sheets.length}`);
  optResult.sheets.forEach((s, idx) => {
    console.log(`Sheet #${idx + 1}: ${s.placedPieces.length} pieces placed`);
  });
}
