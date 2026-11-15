import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';

const w = 0.40;
const l = 1.70;
const h = 0.015;

function testHoleRadius(diamMm: number, spacingMm: number) {
  const hw = w / 2;
  const hl = l / 2;

  const diameterMm = Math.max(15, Math.min(85, diamMm ?? 40));
  const customHoleRadius = (diameterMm / 1000) / 2;

  const spacing = Math.max(diameterMm + 12, Math.min(180, spacingMm ?? 85));
  const targetSpacing = spacing / 1000;

  const margin = Math.min(0.05, Math.min(w, l) * 0.12);
  const usableW = Math.max(0.02, w - 2 * margin);
  const usableL = Math.max(0.02, l - 2 * margin);

  const cols = Math.max(1, Math.round(usableW / targetSpacing));
  const rows = Math.max(1, Math.round(usableL / targetSpacing));
  const stepX = usableW / cols;
  const stepZ = usableL / rows;

  const maxSafeRadius = Math.max(0.008, Math.min(stepX, stepZ) * 0.44);
  const holeRadius = Math.min(customHoleRadius, maxSafeRadius);

  console.log(`Diam input: ${diamMm}mm, Spacing: ${spacingMm}mm -> cols: ${cols}, rows: ${rows}, stepX: ${(stepX*1000).toFixed(1)}mm, stepZ: ${(stepZ*1000).toFixed(1)}mm, maxSafeRadius: ${(maxSafeRadius*1000).toFixed(1)}mm, FINAL radius: ${(holeRadius*1000).toFixed(1)}mm (Final diam: ${(holeRadius*2000).toFixed(1)}mm)`);
}

testHoleRadius(25, 85);
testHoleRadius(40, 85);
testHoleRadius(55, 85);
testHoleRadius(70, 85);
testHoleRadius(80, 85);
