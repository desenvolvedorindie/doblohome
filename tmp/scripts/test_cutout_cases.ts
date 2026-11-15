// Geometry analysis of subtracting a rectangle [oMinX, oMaxX] x [oMinZ, oMaxZ]
// from a bounding box [cMinX, cMaxX] x [cMinZ, cMaxZ]

interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function subtractOverlap(c: Rect, o: Rect): string {
  const touchesMinX = Math.abs(o.minX - c.minX) < 0.005;
  const touchesMaxX = Math.abs(o.maxX - c.maxX) < 0.005;
  const touchesMinZ = Math.abs(o.minZ - c.minZ) < 0.005;
  const touchesMaxZ = Math.abs(o.maxZ - c.maxZ) < 0.005;

  if (touchesMinX && touchesMaxX && touchesMinZ && touchesMaxZ) {
    return 'COMPLETELY_COVERED';
  }
  if (touchesMinX && touchesMaxX) {
    if (touchesMinZ) return 'REDUCED_IN_Z_FROM_REAR'; // cushion starts at o.maxZ
    if (touchesMaxZ) return 'REDUCED_IN_Z_FROM_FRONT'; // cushion ends at o.minZ
    return 'SPLIT_Z_TWO_RECTANGLES';
  }
  if (touchesMinZ && touchesMaxZ) {
    if (touchesMinX) return 'REDUCED_IN_X_FROM_LEFT';
    if (touchesMaxX) return 'REDUCED_IN_X_FROM_RIGHT';
    return 'SPLIT_X_TWO_RECTANGLES';
  }
  if (touchesMinZ) {
    if (touchesMinX) return 'CORNER_REAR_RIGHT'; // L-shape
    if (touchesMaxX) return 'CORNER_REAR_LEFT';  // L-shape
    return 'EDGE_NOTCH_REAR';                    // U-shape
  }
  if (touchesMaxZ) {
    if (touchesMinX) return 'CORNER_FRONT_RIGHT';// L-shape
    if (touchesMaxX) return 'CORNER_FRONT_LEFT'; // L-shape
    return 'EDGE_NOTCH_FRONT';                   // U-shape
  }
  if (touchesMinX) return 'EDGE_NOTCH_RIGHT';
  if (touchesMaxX) return 'EDGE_NOTCH_LEFT';
  return 'INTERIOR_HOLE';
}

console.log('Subtract overlap analysis ready.');
