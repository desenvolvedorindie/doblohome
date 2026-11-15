import * as THREE from 'three';

interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Builds a THREE.BufferGeometry for a cushion with an optional cutout.
 * The cushion sits in [cMinX, cMaxX] x [cMinZ, cMaxZ] with height `thickness` in Y.
 * Cutout is [oMinX, oMaxX] x [oMinZ, oMaxZ].
 */
export function createCushionGeometryWithCutout(
  c: Rect,
  cut: Rect | null,
  thickness: number
): { geometry: THREE.BufferGeometry; isCutout: boolean; finalBounds: Rect } {
  if (!cut) {
    const w = c.maxX - c.minX;
    const l = c.maxZ - c.minZ;
    const geo = new THREE.BoxGeometry(w, thickness, l);
    return { geometry: geo, isCutout: false, finalBounds: c };
  }

  // Clamped overlap
  const oMinX = Math.max(c.minX, cut.minX);
  const oMaxX = Math.min(c.maxX, cut.maxX);
  const oMinZ = Math.max(c.minZ, cut.minZ);
  const oMaxZ = Math.min(c.maxZ, cut.maxZ);

  if (oMaxX <= oMinX + 0.002 || oMaxZ <= oMinZ + 0.002) {
    const w = c.maxX - c.minX;
    const l = c.maxZ - c.minZ;
    const geo = new THREE.BoxGeometry(w, thickness, l);
    return { geometry: geo, isCutout: false, finalBounds: c };
  }

  const touchesMinX = oMinX <= c.minX + 0.005;
  const touchesMaxX = oMaxX >= c.maxX - 0.005;
  const touchesMinZ = oMinZ <= c.minZ + 0.005;
  const touchesMaxZ = oMaxZ >= c.maxZ - 0.005;

  // Case 0: Completely covered
  if (touchesMinX && touchesMaxX && touchesMinZ && touchesMaxZ) {
    // Zero volume
    return { geometry: new THREE.BufferGeometry(), isCutout: true, finalBounds: c };
  }

  // Case 1: Full width cut -> simple shortened rectangle in Z
  if (touchesMinX && touchesMaxX) {
    let newMinZ = c.minZ;
    let newMaxZ = c.maxZ;
    if (touchesMinZ) {
      newMinZ = oMaxZ;
    } else if (touchesMaxZ) {
      newMaxZ = oMinZ;
    }
    const newL = Math.max(0.01, newMaxZ - newMinZ);
    const newW = c.maxX - c.minX;
    const geo = new THREE.BoxGeometry(newW, thickness, newL);
    // Note: box center will be at ((c.minX + c.maxX)/2, 0, (newMinZ + newMaxZ)/2)
    return {
      geometry: geo,
      isCutout: true,
      finalBounds: { minX: c.minX, maxX: c.maxX, minZ: newMinZ, maxZ: newMaxZ }
    };
  }

  // Case 2: Full length cut -> simple shortened rectangle in X
  if (touchesMinZ && touchesMaxZ) {
    let newMinX = c.minX;
    let newMaxX = c.maxX;
    if (touchesMinX) {
      newMinX = oMaxX;
    } else if (touchesMaxX) {
      newMaxX = oMinX;
    }
    const newW = Math.max(0.01, newMaxX - newMinX);
    const newL = c.maxZ - c.minZ;
    const geo = new THREE.BoxGeometry(newW, thickness, newL);
    return {
      geometry: geo,
      isCutout: true,
      finalBounds: { minX: newMinX, maxX: newMaxX, minZ: c.minZ, maxZ: c.maxZ }
    };
  }

  // Case 3: Corner cut or edge notch -> create 2D Shape on (X, -Z)
  // Let y = -z. Then in (x, y):
  // c.minZ corresponds to yMax = -c.minZ
  // c.maxZ corresponds to yMin = -c.maxZ
  // o.minZ corresponds to oyMax = -o.minZ
  // o.maxZ corresponds to oyMin = -o.maxZ
  const shape = new THREE.Shape();
  const x0 = c.minX;
  const x1 = c.maxX;
  const y0 = -c.maxZ; // front (min y in shape)
  const y1 = -c.minZ; // rear (max y in shape)

  const ox0 = oMinX;
  const ox1 = oMaxX;
  const oy0 = -oMaxZ;
  const oy1 = -oMinZ;

  // Let's trace polygon counter-clockwise in (x, y):
  // Bottom edge is y = y0 (front, z = maxZ).
  // Right edge is x = x1.
  // Top edge is y = y1 (rear, z = minZ).
  // Left edge is x = x0.

  if (touchesMinZ && touchesMinX) {
    // Rear-Right in 3D: touches x0 and y1 (top-left in shape)
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(ox1, y1);
    shape.lineTo(ox1, oy0);
    shape.lineTo(x0, oy0);
    shape.closePath();
  } else if (touchesMinZ && touchesMaxX) {
    // Rear-Left in 3D: touches x1 and y1 (top-right in shape)
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, oy0);
    shape.lineTo(ox0, oy0);
    shape.lineTo(ox0, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
  } else if (touchesMaxZ && touchesMinX) {
    // Front-Right in 3D: touches x0 and y0 (bottom-left in shape)
    shape.moveTo(x0, oy1);
    shape.lineTo(ox1, oy1);
    shape.lineTo(ox1, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
  } else if (touchesMaxZ && touchesMaxX) {
    // Front-Left in 3D: touches x1 and y0 (bottom-right in shape)
    shape.moveTo(x0, y0);
    shape.lineTo(ox0, y0);
    shape.lineTo(ox0, oy1);
    shape.lineTo(x1, oy1);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
  } else if (touchesMinZ) {
    // Rear notch (top edge in shape)
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(ox1, y1);
    shape.lineTo(ox1, oy0);
    shape.lineTo(ox0, oy0);
    shape.lineTo(ox0, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
  } else if (touchesMaxZ) {
    // Front notch (bottom edge in shape)
    shape.moveTo(x0, y0);
    shape.lineTo(ox0, y0);
    shape.lineTo(ox0, oy1);
    shape.lineTo(ox1, oy1);
    shape.lineTo(ox1, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
  } else if (touchesMinX) {
    // Right notch (left edge in shape)
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.lineTo(x0, oy1);
    shape.lineTo(ox1, oy1);
    shape.lineTo(ox1, oy0);
    shape.lineTo(x0, oy0);
    shape.closePath();
  } else if (touchesMaxX) {
    // Left notch (right edge in shape)
    shape.moveTo(x0, y0);
    shape.lineTo(x1, y0);
    shape.lineTo(x1, oy0);
    shape.lineTo(ox0, oy0);
    shape.lineTo(ox0, oy1);
    shape.lineTo(x1, oy1);
    shape.lineTo(x1, y1);
    shape.lineTo(x0, y1);
    shape.closePath();
  } else {
    // Fallback if interior: just return box
    const w = c.maxX - c.minX;
    const l = c.maxZ - c.minZ;
    return { geometry: new THREE.BoxGeometry(w, thickness, l), isCutout: false, finalBounds: c };
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false
  });
  // Extrude creates vertices in XY plane, depth along +Z.
  // We rotateX(-PI/2) so +Z becomes +Y (up), and Y becomes -Z in 3D!
  // And translate in Y so it is vertically centered [-thickness/2, +thickness/2]
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -thickness / 2, 0);

  return {
    geometry: geo,
    isCutout: true,
    finalBounds: c // The shape is drawn in world/local coordinates directly!
  };
}

// Test cases
const testBox: Rect = { minX: -0.2, maxX: 0.2, minZ: -0.85, maxZ: 0.85 };
const rearRightCut: Rect = { minX: -0.2, maxX: 0.0, minZ: -0.85, maxZ: -0.55 };

const res = createCushionGeometryWithCutout(testBox, rearRightCut, 0.08);
console.log('Tested corner cutout geometry: isCutout =', res.isCutout);
res.geometry.computeBoundingBox();
console.log('Bounding Box:', res.geometry.boundingBox);
