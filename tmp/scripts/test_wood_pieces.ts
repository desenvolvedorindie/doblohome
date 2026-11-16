import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';
import { extractWoodCutGroups } from '../../src/utils/woodUtils';
import { DEFAULT_INTERNAL_GRID } from '../../src/data/internalBoxesPresets';

const builder = new InternalBoxesBuilder();
const grid = { ...DEFAULT_INTERNAL_GRID, colsX: 3, rowsZ: 4, widthMm: 1200, lengthMm: 1700, heightMm: 400 };

const boxBed = {
  id: 'box_slat_bed_main',
  name: 'Sofá-Cama Ripas',
  type: 'slat_bed' as const,
  colStart: 2,
  colSpan: 1,
  rowStart: 0,
  rowSpan: 4,
  heightMm: 400,
  color: '#d97706',
  material: 'plywood' as const,
  slatBedDirection: 'left' as const,
  slatExtensionPercent: 100,
  mattressParts: 5 as const,
  upperCabinet: true,
  upperCabinetAlign: 'front' as const,
  upperCabinetDepthMm: 250,
  upperCabinetBottomGapMm: 0,
  mattressFoam: 'D45' as const,
  mattressThicknessMm: 100,
};

builder.update(grid, [boxBed], null, { openBed: true });

const woodStats = extractWoodCutGroups({ internalBoxesBuilder: builder });

console.log('--- UPHOLSTERY PIECES ---');
woodStats.cutGroups.filter(g => g.isUpholstery).forEach(g => {
  console.log(`${g.label} | mat: ${g.woodMaterial} | spec: ${g.lengthMm}x${g.widthMm}x${g.thicknessMm}mm | cutout: ${g.hasCabinetCutout}`);
});
