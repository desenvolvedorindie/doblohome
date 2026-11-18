import * as THREE from 'three';
import { SlatBedBuilder } from '../../src/three/boxes/SlatBedBuilder';
import { extractWoodCutGroups } from '../../src/utils/woodUtils';
import { InternalBoxItem } from '../../src/types';

const w = 0.40;
const l = 1.70;
const h = 0.40;
const mat = new THREE.MeshStandardMaterial({ color: 0xd97706 });

const slatBox: InternalBoxItem = {
  id: 'box_slat_1',
  name: 'Sofá-Cama Ripas',
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

const hingedBoxPanel: InternalBoxItem = {
  id: 'box_hinged_panel',
  name: 'Sofá-Cama Dobradiça (Tampo)',
  type: 'slat_bed',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  bedMode: 'hinged',
  hingedBedSurface: 'panel',
  isOpen: false,
  slatBedDirection: 'left'
};

const hingedBoxSlatted: InternalBoxItem = {
  id: 'box_hinged_slatted',
  name: 'Sofá-Cama Dobradiça (Ripas)',
  type: 'slat_bed',
  colStart: 0,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  bedMode: 'hinged',
  hingedBedSurface: 'slatted',
  isOpen: false,
  slatBedDirection: 'left'
};

const builder = new SlatBedBuilder();

function testScene(box: InternalBoxItem, isOpen: boolean, title: string) {
  const container = new THREE.Group();
  builder.buildSlatBedModule(container, w, l, h, mat, box, false, isOpen);
  const mockSceneManager = {
    internalBoxesBuilder: {
      group: container
    }
  };
  const stats = extractWoodCutGroups(mockSceneManager);
  console.log(`\n=== ${title} (Total pieces: ${stats.totalPieces}) ===`);
  stats.cutGroups.forEach(g => {
    console.log(`- [${g.woodMaterial} ${g.thicknessMm}mm] (${g.lengthMm}x${g.widthMm}mm) Qty: ${g.qty} | Label: "${g.label}" | partType: "${g.partType}"`);
  });
}

testScene(slatBox, false, '1. SLAT BED RETRÁTIL (FECHADA)');
testScene(hingedBoxPanel, false, '2. CAMA DOBRADIÇA TAMPO INTEIRIÇO (FECHADA)');
testScene(hingedBoxPanel, true, '3. CAMA DOBRADIÇA TAMPO INTEIRIÇO (ABERTA)');
testScene(hingedBoxSlatted, false, '4. CAMA DOBRADIÇA ESTRADO RIPADO (FECHADA)');
testScene(hingedBoxSlatted, true, '5. CAMA DOBRADIÇA ESTRADO RIPADO (ABERTA)');
