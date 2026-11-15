import * as THREE from 'three';
import {
  RulerAxisLock,
  RulerMeasurement,
  RulerSnapInfo,
  RulerSnapType
} from '../../../types';

export const SNAP_COLORS: Record<RulerSnapType, number> = {
  vertex: 0x22c55e,
  midpoint: 0x06b6d4,
  face_center: 0xa855f7,
  edge: 0xef4444,
  face: 0x3b82f6
};

export const SNAP_HEX: Record<RulerSnapType, string> = {
  vertex: '#22c55e',
  midpoint: '#06b6d4',
  face_center: '#a855f7',
  edge: '#ef4444',
  face: '#3b82f6'
};

export const AXIS_COLORS = {
  x: 0xef4444,
  y: 0x3b82f6,
  z: 0x22c55e,
  free: 0xfacc15
};

export const AXIS_HEX = {
  x: '#ef4444',
  y: '#3b82f6',
  z: '#22c55e',
  free: '#facc15'
};

export function disposeRulerGroup(g: THREE.Group) {
  while (g.children.length > 0) {
    const child = g.children[0];
    g.remove(child);
    child.traverse((node: any) => {
      if (node.geometry) node.geometry.dispose();
      if (node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((m: any) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
  }
}

export function createRulerTextSprite(
  title: string,
  subtitle: string,
  bgColor: string,
  borderColor: string,
  scaleW: number,
  scaleH: number
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = subtitle ? 128 : 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Sprite();

  const w = canvas.width;
  const h = canvas.height;
  const r = 18;
  const pad = 8;

  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(pad + r, pad);
  ctx.lineTo(w - pad - r, pad);
  ctx.quadraticCurveTo(w - pad, pad, w - pad, pad + r);
  ctx.lineTo(w - pad, h - pad - r);
  ctx.quadraticCurveTo(w - pad, h - pad, w - pad - r, h - pad);
  ctx.lineTo(pad + r, h - pad);
  ctx.quadraticCurveTo(pad, h - pad, pad, h - pad - r);
  ctx.lineTo(pad, pad + r);
  ctx.quadraticCurveTo(pad, pad, pad + r, pad);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = subtitle
    ? 'bold 36px "JetBrains Mono", monospace, sans-serif'
    : 'bold 34px "JetBrains Mono", monospace, sans-serif';
  ctx.fillText(title, w / 2, subtitle ? 44 : h / 2);

  if (subtitle) {
    ctx.font = '600 22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = borderColor;
    ctx.fillText(subtitle, w / 2, 92);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    opacity: 0.96
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scaleW, scaleH, 1);
  return sprite;
}

export function addDimensionLineWithTicks(
  targetGroup: THREE.Group,
  ptA: THREE.Vector3,
  ptB: THREE.Vector3,
  colorNum: number,
  renderOrder: number
) {
  const lineMat = new THREE.LineBasicMaterial({
    color: colorNum,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    opacity: 0.98
  });

  const lineGeo = new THREE.BufferGeometry().setFromPoints([ptA, ptB]);
  const mainLine = new THREE.Line(lineGeo, lineMat);
  mainLine.renderOrder = renderOrder;
  mainLine.userData.isRulerHelper = true;
  targetGroup.add(mainLine);

  const dir = ptB.clone().sub(ptA);
  if (dir.lengthSq() > 1e-8) {
    dir.normalize();
    const upRef = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const tickDir = new THREE.Vector3().crossVectors(dir, upRef).normalize().multiplyScalar(0.018);

    const tickGeoA = new THREE.BufferGeometry().setFromPoints([
      ptA.clone().sub(tickDir),
      ptA.clone().add(tickDir)
    ]);
    const tickA = new THREE.Line(tickGeoA, lineMat.clone());
    tickA.renderOrder = renderOrder;
    tickA.userData.isRulerHelper = true;
    targetGroup.add(tickA);

    const tickGeoB = new THREE.BufferGeometry().setFromPoints([
      ptB.clone().sub(tickDir),
      ptB.clone().add(tickDir)
    ]);
    const tickB = new THREE.Line(tickGeoB, lineMat.clone());
    tickB.renderOrder = renderOrder;
    tickB.userData.isRulerHelper = true;
    targetGroup.add(tickB);
  }
}

export function addDashedSegment(
  targetGroup: THREE.Group,
  ptA: THREE.Vector3,
  ptB: THREE.Vector3,
  colorNum: number,
  renderOrder: number
) {
  if (ptA.distanceToSquared(ptB) < 1e-6) return;
  const geo = new THREE.BufferGeometry().setFromPoints([ptA, ptB]);
  const mat = new THREE.LineDashedMaterial({
    color: colorNum,
    dashSize: 0.014,
    gapSize: 0.01,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    opacity: 0.65
  });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  line.renderOrder = renderOrder;
  line.userData.isRulerHelper = true;
  targetGroup.add(line);
}

export function renderRulerSnapMarker(
  snapMarkerGroup: THREE.Group,
  snap: RulerSnapInfo,
  camera?: THREE.Camera | null
) {
  disposeRulerGroup(snapMarkerGroup);

  const pt = new THREE.Vector3(snap.point.x, snap.point.y, snap.point.z);
  const colorNum = SNAP_COLORS[snap.snapType];
  const colorHex = SNAP_HEX[snap.snapType];

  const dotGeo = new THREE.SphereGeometry(0.0085, 14, 14);
  const dotMat = new THREE.MeshBasicMaterial({
    color: colorNum,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    opacity: 0.96
  });
  const dotMesh = new THREE.Mesh(dotGeo, dotMat);
  dotMesh.position.copy(pt);
  dotMesh.renderOrder = 995;
  dotMesh.userData.isRulerHelper = true;
  snapMarkerGroup.add(dotMesh);

  const ringGeo = new THREE.RingGeometry(0.011, 0.0155, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    opacity: 0.85
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.copy(pt);
  if (camera) {
    ringMesh.quaternion.copy(camera.quaternion);
  }
  ringMesh.renderOrder = 995;
  ringMesh.userData.isRulerHelper = true;
  snapMarkerGroup.add(ringMesh);

  const badge = createRulerTextSprite(snap.snapLabel, '', 'rgba(15, 23, 42, 0.92)', colorHex, 0.18, 0.044);
  badge.position.copy(pt).add(new THREE.Vector3(0, 0.036, 0));
  badge.renderOrder = 998;
  badge.userData.isRulerHelper = true;
  snapMarkerGroup.add(badge);
}

export function renderRulerPreview(params: {
  previewGroup: THREE.Group;
  startVec: THREE.Vector3;
  endPt: THREE.Vector3;
  rawVec: THREE.Vector3;
  inferredAxis: RulerAxisLock;
  previewDeltaXMm: number | null;
  previewDeltaYMm: number | null;
  previewDeltaZMm: number | null;
}) {
  const {
    previewGroup,
    startVec,
    endPt,
    rawVec,
    inferredAxis,
    previewDeltaXMm,
    previewDeltaYMm,
    previewDeltaZMm
  } = params;

  disposeRulerGroup(previewGroup);

  const axisKey = inferredAxis || 'free';
  const lineColor = AXIS_COLORS[axisKey];
  const hexColor = AXIS_HEX[axisKey];

  // Ponto inicial marcado com esfera fixa
  const startDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.0075, 12, 12),
    new THREE.MeshBasicMaterial({
      color: lineColor,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.95
    })
  );
  startDot.position.copy(startVec);
  startDot.renderOrder = 992;
  startDot.userData.isRulerHelper = true;
  previewGroup.add(startDot);

  const distM = endPt.distanceTo(startVec);
  if (distM > 0.0005) {
    addDimensionLineWithTicks(previewGroup, startVec, endPt, lineColor, 990);
  }

  // Linha guia tracejada perpendicular quando o ponto final foi projetado em um eixo
  if (rawVec.distanceTo(endPt) > 0.002) {
    const guideGeo = new THREE.BufferGeometry().setFromPoints([rawVec, endPt]);
    const guideMat = new THREE.LineDashedMaterial({
      color: 0x94a3b8,
      dashSize: 0.015,
      gapSize: 0.01,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.8
    });
    const guideLine = new THREE.Line(guideGeo, guideMat);
    guideLine.computeLineDistances();
    guideLine.renderOrder = 988;
    guideLine.userData.isRulerHelper = true;
    previewGroup.add(guideLine);
  }

  // Projeções ortogonais ΔX / ΔY / ΔZ quando a medição é diagonal
  const absX = Math.abs(endPt.x - startVec.x);
  const absY = Math.abs(endPt.y - startVec.y);
  const absZ = Math.abs(endPt.z - startVec.z);
  const activeComponents = [absX > 0.003, absY > 0.003, absZ > 0.003].filter(Boolean).length;

  if (activeComponents > 1) {
    const cornerX = new THREE.Vector3(endPt.x, startVec.y, startVec.z);
    const cornerXZ = new THREE.Vector3(endPt.x, startVec.y, endPt.z);
    addDashedSegment(previewGroup, startVec, cornerX, AXIS_COLORS.x, 987);
    addDashedSegment(previewGroup, cornerX, cornerXZ, AXIS_COLORS.z, 987);
    addDashedSegment(previewGroup, cornerXZ, endPt, AXIS_COLORS.y, 987);
  }

  const distMm = Math.round(distM * 1000);
  if (distMm >= 1) {
    const axisTag =
      inferredAxis === 'x'
        ? 'Eixo X (Larg.)'
        : inferredAxis === 'y'
          ? 'Eixo Y (Alt.)'
          : inferredAxis === 'z'
            ? 'Eixo Z (Comp.)'
            : `ΔX ${previewDeltaXMm} · ΔY ${previewDeltaYMm} · ΔZ ${previewDeltaZMm}`;

    const sprite = createRulerTextSprite(
      `${distMm} mm (${(distMm / 10).toFixed(1)} cm)`,
      axisTag,
      'rgba(15, 23, 42, 0.94)',
      hexColor,
      0.29,
      0.072
    );
    sprite.position.copy(startVec).add(endPt).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.045, 0));
    sprite.renderOrder = 999;
    sprite.userData.isRulerHelper = true;
    previewGroup.add(sprite);
  }
}

export function rebuildRulerSavedMeasurements(
  savedGroup: THREE.Group,
  measurements: RulerMeasurement[]
) {
  disposeRulerGroup(savedGroup);

  for (const m of measurements) {
    const startVec = new THREE.Vector3(m.start.x, m.start.y, m.start.z);
    const endVec = new THREE.Vector3(m.end.x, m.end.y, m.end.z);
    const axisKey = m.axis || 'free';
    const lineColor = AXIS_COLORS[axisKey];
    const hexColor = AXIS_HEX[axisKey];

    addDimensionLineWithTicks(savedGroup, startVec, endVec, lineColor, 985);

    const dotMat = new THREE.MeshBasicMaterial({
      color: lineColor,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.95
    });

    const sphereA = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 10), dotMat);
    sphereA.position.copy(startVec);
    sphereA.renderOrder = 986;
    sphereA.userData.isRulerHelper = true;
    savedGroup.add(sphereA);

    const sphereB = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 10), dotMat.clone());
    sphereB.position.copy(endVec);
    sphereB.renderOrder = 986;
    sphereB.userData.isRulerHelper = true;
    savedGroup.add(sphereB);

    const subtext = m.axis
      ? `Eixo ${m.axis.toUpperCase()} • ${m.startLabel} → ${m.endLabel}`
      : `ΔX ${m.deltaXMm} · ΔY ${m.deltaYMm} · ΔZ ${m.deltaZMm} mm`;

    const sprite = createRulerTextSprite(
      `${m.distanceMm} mm (${(m.distanceMm / 10).toFixed(1)} cm)`,
      subtext,
      'rgba(15, 23, 42, 0.92)',
      hexColor,
      0.28,
      0.068
    );
    sprite.position.copy(startVec).add(endVec).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.04, 0));
    sprite.renderOrder = 997;
    sprite.userData.isRulerHelper = true;
    savedGroup.add(sprite);
  }
}
