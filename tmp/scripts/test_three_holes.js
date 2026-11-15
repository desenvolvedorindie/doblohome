import * as THREE from 'three';

function testPerforated(w, h, l, holeDiameterMm, spacingMm, exclusionZones = []) {
  try {
    const hw = w / 2;
    const hl = l / 2;

    const shape = new THREE.Shape();
    shape.moveTo(-hw, -hl);
    shape.lineTo(hw, -hl);
    shape.lineTo(hw, hl);
    shape.lineTo(-hw, hl);
    shape.closePath();

    const diameterMm = Math.max(15, Math.min(85, holeDiameterMm ?? 40));
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

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = -hw + margin + (c + 0.5) * stepX;
        const cz = -hl + margin + (r + 0.5) * stepZ;

        const isExcluded = exclusionZones.some(zone =>
          (cx + holeRadius >= zone.minX) &&
          (cx - holeRadius <= zone.maxX) &&
          (cz + holeRadius >= zone.minZ) &&
          (cz - holeRadius <= zone.maxZ)
        );

        if (isExcluded) continue;

        const holePath = new THREE.Path();
        holePath.absarc(cx, cz, holeRadius, 0, Math.PI * 2, true);
        shape.holes.push(holePath);
      }
    }

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: h,
      bevelEnabled: false,
      curveSegments: 16
    });

    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -h / 2, 0);

    const edgeGeo = new THREE.EdgesGeometry(geo, 25);

    console.log(`Success for diam=${holeDiameterMm}, spacing=${spacingMm}: holes=${shape.holes.length}, verts=${geo.attributes.position.count}`);
    return true;
  } catch (err) {
    console.error(`ERROR for diam=${holeDiameterMm}, spacing=${spacingMm}:`, err);
    return false;
  }
}

console.log("Testing various diameters:");
for (let d = 15; d <= 80; d += 5) {
  testPerforated(0.40, 0.015, 0.85, d, 85);
}
