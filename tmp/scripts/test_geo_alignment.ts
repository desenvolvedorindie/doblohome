import * as THREE from 'three';
import { InternalBoxesBuilder } from '../../src/three/InternalBoxesBuilder';

function testGeometryAlignment(w: number, l: number) {
  const h = 0.015;
  const zone = {
    minX: -w / 2,
    maxX: w / 2,
    minZ: -l / 2,
    maxZ: -l / 2 + 0.25
  };
  const geo = InternalBoxesBuilder.createPerforatedGeometry(w, h, l, {
    exclusionZones: [zone]
  });

  const dims = [w, h, l].sort((a, b) => b - a);
  const itemLength = dims[0];
  const itemWidth = dims[1];
  const itemThickness = dims[2];

  // Clone geometry
  const cloneGeo = geo.clone();
  cloneGeo.computeBoundingBox();
  const bb = cloneGeo.boundingBox!;
  const spanX = bb.max.x - bb.min.x;
  const spanZ = bb.max.z - bb.min.z;

  if (Math.abs(spanX - itemLength) < 0.001 && Math.abs(spanZ - itemWidth) < 0.001 && itemWidth !== itemLength) {
    // Needs 90 deg rotation to align length along Z and width along X
    cloneGeo.rotateY(Math.PI / 2);
    cloneGeo.computeBoundingBox();
  }

  const bbFinal = cloneGeo.boundingBox!;
  const finalSpanX = bbFinal.max.x - bbFinal.min.x;
  const finalSpanY = bbFinal.max.y - bbFinal.min.y;
  const finalSpanZ = bbFinal.max.z - bbFinal.min.z;

  console.log(`Original w=${w}, l=${l} -> Item width=${itemWidth}, length=${itemLength}`);
  console.log(`Final bounds: X=${finalSpanX.toFixed(3)}, Y=${finalSpanY.toFixed(3)}, Z=${finalSpanZ.toFixed(3)}`);
  console.log(`Matches expected? X=${Math.abs(finalSpanX - itemWidth) < 0.001}, Z=${Math.abs(finalSpanZ - itemLength) < 0.001}\n`);
}

console.log('--- TEST 1: w=0.40, l=1.70 (w < l) ---');
testGeometryAlignment(0.40, 1.70);

console.log('--- TEST 2: w=1.20, l=0.40 (w > l) ---');
testGeometryAlignment(1.20, 0.40);
