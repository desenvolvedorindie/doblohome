const THREE = require('three');

function drawRoundedRectPath(path, x, y, w, h, r) {
  const x0 = x, x1 = x + w;
  const y0 = y, y1 = y + h;
  if (r <= 0.0002) {
    path.moveTo(x0, y0);
    path.lineTo(x1, y0);
    path.lineTo(x1, y1);
    path.lineTo(x0, y1);
    path.closePath();
    return;
  }
  path.moveTo(x0 + r, y0);
  path.lineTo(x1 - r, y0);
  path.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  path.lineTo(x1, y1 - r);
  path.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  path.lineTo(x0 + r, y1);
  path.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  path.lineTo(x0, y0 + r);
  path.absarc(x0 + r, y0 + r, r, Math.PI, 1.5 * Math.PI, false);
  path.closePath();
}

function buildTubeShape(width, height, thickness, radius = 0.002) {
  const maxT = Math.min(width, height) / 2 - 0.0003;
  const t = Math.max(0.0005, Math.min(thickness, maxT));
  const maxR = Math.min(0.003, t * 1.5, (width - 2 * t) / 2, (height - 2 * t) / 2);
  const r = Math.max(0, Math.min(radius, maxR));

  const shape = new THREE.Shape();
  drawRoundedRectPath(shape, -width / 2, -height / 2, width, height, r);

  const hole = new THREE.Path();
  const inW = width - 2 * t;
  const inH = height - 2 * t;
  const inR = Math.max(0, r - t);
  drawRoundedRectPath(hole, -inW / 2, -inH / 2, inW, inH, inR);
  shape.holes.push(hole);

  return shape;
}

const s = buildTubeShape(0.04, 0.04, 0.002, 0.0025);
const geo = new THREE.ExtrudeGeometry(s, { steps: 1, depth: 2.2, bevelEnabled: false, curveSegments: 3 });
geo.center();
geo.computeVertexNormals();
geo.computeBoundingBox();

console.log('Bounding box:', geo.boundingBox);
console.log('Normal ok:', !isNaN(geo.attributes.normal.getX(0)));
console.log('Vertex count:', geo.attributes.position.count);
