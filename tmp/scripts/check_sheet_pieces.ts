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
const stats = extractWoodCutGroups({ internalBoxesBuilder: { group: container } });
const categories = groupWoodCutPieces(stats.cutGroups);
const plyCat = categories.find(c => c.key === 'Compensado Naval__15')!;

const piecesInput = [];
plyCat.pieces.forEach(p => {
  for (let i = 0; i < p.qty; i++) {
    piecesInput.push({
      id: `${p.key}_${i}`,
      pieceId: p.key,
      label: p.label,
      lengthMm: p.lengthMm,
      widthMm: p.widthMm,
      thicknessMm: p.thicknessMm,
      canRotate: true
    });
  }
});

const res = optimizeCuttingPlan(piecesInput, plyCat.key, 'Compensado Naval', 15);
console.log('Unplaced count:', res.unplacedPieces.length);
res.sheets.forEach((s, idx) => {
  console.log(`Sheet #${idx + 1}:`);
  s.placedPieces.forEach(p => console.log(`  - ${p.label} (${p.w}x${p.h}mm)`));
});
