import * as THREE from 'three';
import { InternalBoxItem, InternalGridConfig, SlatBedDirection } from '../../../types';
import { getUpperCabinetExclusionZones } from '../BoxGeometryHelpers';

export interface CushionRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface CushionMeshResult {
  mesh: THREE.Mesh;
  isCutout: boolean;
  labelSuffix: string;
  actualMinX: number;
  actualMaxX: number;
  actualMinZ: number;
  actualMaxZ: number;
}

export function collectMattressCutoutZones(params: {
  box: InternalBoxItem;
  w: number;
  l: number;
  slatT: number;
  direction: SlatBedDirection;
  parts: number;
  cellWM?: number;
  cellLM?: number;
  allBoxes?: InternalBoxItem[];
  grid?: InternalGridConfig;
}): CushionRect[] {
  const { box, w, l, direction, parts, cellWM, cellLM, allBoxes, grid } = params;
  const cutoutZones: CushionRect[] = [];

  const cols = Math.max(1, grid?.colsX ?? 3);
  const rows = Math.max(1, grid?.rowsZ ?? 4);
  const widthM = grid?.widthMm ? grid.widthMm / 1000 : (cellWM ? cellWM * cols : 1.2);
  const lengthM = grid?.lengthMm ? grid.lengthMm / 1000 : (cellLM ? cellLM * rows : 1.7);
  const effCellWM = cellWM || (widthM / cols);
  const effCellLM = cellLM || (lengthM / rows);

  const bedColStart = Math.min(cols - 1, Math.max(0, box.colStart));
  const bedColSpan = Math.min(cols - bedColStart, Math.max(1, box.colSpan));
  const bedRowStart = Math.min(rows - 1, Math.max(0, box.rowStart));
  const bedRowSpan = Math.min(rows - bedRowStart, Math.max(1, box.rowSpan));
  const bedOffX = (box.offsetXMm || 0) / 1000;
  const bedOffZ = (box.offsetZMm || 0) / 1000;

  const posX_bed = (widthM / 2) - (bedColStart + bedColSpan / 2) * effCellWM + bedOffX;
  const posZ_bed = -(bedRowStart + bedRowSpan / 2) * effCellLM + bedOffZ;

  const archW = 0.142; // largura nominal da aba de estofamento sobre a caixa de roda
  const mattressCellW =
    parts === 4
      ? widthM / 4
      : parts === 3 || parts === 5
        ? widthM / 3
        : (cellWM || w);

  // Limites locais X das abas sobre as caixas de roda (quando parts === 5)
  const rightArchMinLocalX = direction === 'left'
    ? (-w / 2 - archW)
    : (w / 2 - 3 * mattressCellW - archW);
  const rightArchMaxLocalX = direction === 'left'
    ? (-w / 2)
    : (w / 2 - 3 * mattressCellW);
  const leftArchMinLocalX = direction === 'left'
    ? (-w / 2 + 3 * mattressCellW)
    : (w / 2);
  const leftArchMaxLocalX = direction === 'left'
    ? (-w / 2 + 3 * mattressCellW + archW)
    : (w / 2 + archW);

  const bedHeightMm = box.heightMm ?? grid?.heightMm ?? 400;
  const mattressThicknessMm = box.mattressThicknessMm ?? 80;
  const mattressTopMm = bedHeightMm + mattressThicknessMm;

  // 1. Coleta todos os armários aéreos (do próprio módulo ou de vizinhos)
  const allCabinets: InternalBoxItem[] = [];
  if (box.upperCabinet) {
    allCabinets.push(box);
  }
  if (allBoxes) {
    for (const b of allBoxes) {
      if (b.upperCabinet && !allCabinets.some((c) => c.id === b.id)) {
        allCabinets.push(b);
      }
    }
  }

  for (const cabBox of allCabinets) {
    // Só recorta o colchão se a base do armário aéreo entrar fisicamente na faixa vertical do colchão
    // (se o armário ficar no topo ou acima do colchão, não há necessidade de corte)
    const cabBoxHeightMm = cabBox.heightMm ?? grid?.heightMm ?? 400;
    const bottomGapMm = Math.max(0, cabBox.upperCabinetBottomGapMm ?? 0);
    const cabinetBottomMm = cabBoxHeightMm + bottomGapMm;
    const cutsByHeight = cabinetBottomMm < mattressTopMm - 1;
    if (!cutsByHeight) {
      continue;
    }

    const isOwnBox = cabBox.id === box.id;
    const cabColStart = Math.min(cols - 1, Math.max(0, cabBox.colStart));
    const cabColSpan = Math.min(cols - cabColStart, Math.max(1, cabBox.colSpan));
    const cabRowStart = Math.min(rows - 1, Math.max(0, cabBox.rowStart));
    const cabRowSpan = Math.min(rows - cabRowStart, Math.max(1, cabBox.rowSpan));

    const cabExtraW = (cabBox.extraWidthMm || 0) / 1000;
    const cabExtraL = (cabBox.extraLengthMm || 0) / 1000;
    const cabOffX = (cabBox.offsetXMm || 0) / 1000;
    const cabOffZ = (cabBox.offsetZMm || 0) / 1000;
    const cabWM = isOwnBox ? w : Math.max(0.05, cabColSpan * effCellWM + cabExtraW);
    const cabLM = isOwnBox ? l : Math.max(0.05, cabRowSpan * effCellLM + cabExtraL);
    const posX_cab = isOwnBox ? posX_bed : (widthM / 2) - (cabColStart + cabColSpan / 2) * effCellWM + cabOffX;
    const posZ_cab = isOwnBox ? posZ_bed : -(cabRowStart + cabRowSpan / 2) * effCellLM + cabOffZ;
    const dz = isOwnBox ? 0 : posZ_cab - posZ_bed;

    const rawZones = getUpperCabinetExclusionZones(cabBox, cabWM, cabLM, { maxGapMm: 10000, marginM: 0.003 });
    for (const oz of rawZones) {
      const vehMinX = posX_cab + oz.minX;
      const vehMaxX = posX_cab + oz.maxX;
      const vehMinZ = posZ_cab + oz.minZ;
      const vehMaxZ = posZ_cab + oz.maxZ;

      let localMinX = vehMinX - posX_bed;
      let localMaxX = vehMaxX - posX_bed;
      let zMinZ = oz.minZ + dz;
      let zMaxZ = oz.maxZ + dz;

      // Determina contato físico com paredes laterais / caixas de roda do veículo:
      const isRightmostCol = cabColStart + cabColSpan >= cols;
      const isLeftmostCol = cabColStart === 0;

      const touchesRightWall =
        vehMinX <= -widthM / 2 + 0.05 ||
        localMinX <= rightArchMaxLocalX + 0.05 ||
        (isRightmostCol && (cabBox.upperCabinetAlign === 'right' || cabBox.upperCabinetSides?.includes('right')));

      const touchesLeftWall =
        vehMaxX >= widthM / 2 - 0.05 ||
        localMaxX >= leftArchMinLocalX - 0.05 ||
        (isLeftmostCol && (cabBox.upperCabinetAlign === 'left' || cabBox.upperCabinetSides?.includes('left')));

      // Se for colchão com abas sobre as caixas de roda (5 partes):
      if (parts === 5) {
        if (touchesRightWall) {
          localMinX = Math.min(localMinX, -widthM / 2 - archW - 0.02 - posX_bed, rightArchMinLocalX - 0.02);
          if (localMaxX < rightArchMaxLocalX + 0.005) {
            localMaxX = rightArchMaxLocalX + 0.005;
          }
        }
        if (touchesLeftWall) {
          localMaxX = Math.max(localMaxX, widthM / 2 + archW + 0.02 - posX_bed, leftArchMaxLocalX + 0.02);
          if (localMinX > leftArchMinLocalX - 0.005) {
            localMinX = leftArchMinLocalX - 0.005;
          }
        }
      }

      const touchesRear =
        cabBox.upperCabinetPositionMode === 'behind_box' ||
        zMinZ <= -l / 2 + 0.08 ||
        vehMinZ <= -lengthM + 0.05;

      if (touchesRear) {
        zMinZ = Math.min(zMinZ, -l / 2 - 0.02);
      }

      const touchesFront =
        zMaxZ >= l / 2 - 0.08 ||
        vehMaxZ >= -0.05;

      if (touchesFront) {
        zMaxZ = Math.max(zMaxZ, l / 2 + 0.02);
      }

      cutoutZones.push({
        minX: localMinX,
        maxX: localMaxX,
        minZ: zMinZ,
        maxZ: zMaxZ
      });
    }
  }

  // 2. Módulos vizinhos mais altos que a cama (ex: balcão de cozinha 750mm ou armário alto)
  if (allBoxes) {
    for (const otherBox of allBoxes) {
      if (otherBox.id !== box.id && otherBox.heightMm > bedHeightMm) {
        const otherColStart = Math.min(cols - 1, Math.max(0, otherBox.colStart));
        const otherColSpan = Math.min(cols - otherColStart, Math.max(1, otherBox.colSpan));
        const otherRowStart = Math.min(rows - 1, Math.max(0, otherBox.rowStart));
        const otherRowSpan = Math.min(rows - otherRowStart, Math.max(1, otherBox.rowSpan));

        const otherWM = Math.max(0.05, otherColSpan * effCellWM + (otherBox.extraWidthMm || 0) / 1000);
        const otherLM = Math.max(0.05, otherRowSpan * effCellLM + (otherBox.extraLengthMm || 0) / 1000);
        const posX_other = (widthM / 2) - (otherColStart + otherColSpan / 2) * effCellWM + (otherBox.offsetXMm || 0) / 1000;
        const posZ_other = -(otherRowStart + otherRowSpan / 2) * effCellLM + (otherBox.offsetZMm || 0) / 1000;
        const dz = posZ_other - posZ_bed;

        const vehMinX = posX_other - otherWM / 2;
        const vehMaxX = posX_other + otherWM / 2;
        const vehMinZ = posZ_other - otherLM / 2;
        const vehMaxZ = posZ_other + otherLM / 2;

        let localMinX = vehMinX - posX_bed;
        let localMaxX = vehMaxX - posX_bed;
        let zMinZ = -otherLM / 2 + dz;
        let zMaxZ = otherLM / 2 + dz;

        if (parts === 5) {
          if (vehMinX <= -widthM / 2 + 0.05 || localMinX <= rightArchMaxLocalX + 0.05) {
            localMinX = Math.min(localMinX, -widthM / 2 - archW - 0.02 - posX_bed, rightArchMinLocalX - 0.02);
            if (localMaxX < rightArchMaxLocalX + 0.005) {
              localMaxX = rightArchMaxLocalX + 0.005;
            }
          }
          if (vehMaxX >= widthM / 2 - 0.05 || localMaxX >= leftArchMinLocalX - 0.05) {
            localMaxX = Math.max(localMaxX, widthM / 2 + archW + 0.02 - posX_bed, leftArchMaxLocalX + 0.02);
            if (localMinX > leftArchMinLocalX - 0.005) {
              localMinX = leftArchMinLocalX - 0.005;
            }
          }
        }

        const touchesRear = zMinZ <= -l / 2 + 0.08 || vehMinZ <= -lengthM + 0.05;
        if (touchesRear) zMinZ = Math.min(zMinZ, -l / 2 - 0.02);
        const touchesFront = zMaxZ >= l / 2 - 0.08 || vehMaxZ >= -0.05;
        if (touchesFront) zMaxZ = Math.max(zMaxZ, l / 2 + 0.02);

        cutoutZones.push({
          minX: localMinX,
          maxX: localMaxX,
          minZ: zMinZ,
          maxZ: zMaxZ
        });
      }
    }
  }

  return cutoutZones;
}

/**
 * Calcula intervalos [minZ, maxZ] de costura livres de recortes na posição X = seamX.
 */
export function getUncutSeamIntervalsZ(
  seamX: number,
  minZ: number,
  maxZ: number,
  cutoutZones: CushionRect[]
): Array<{ minZ: number; maxZ: number }> {
  let intervals: Array<{ minZ: number; maxZ: number }> = [{ minZ, maxZ }];
  for (const z of cutoutZones) {
    if (seamX >= z.minX - 0.006 && seamX <= z.maxX + 0.006) {
      const next: Array<{ minZ: number; maxZ: number }> = [];
      for (const seg of intervals) {
        if (z.maxZ <= seg.minZ || z.minZ >= seg.maxZ) {
          next.push(seg);
        } else {
          if (z.minZ > seg.minZ + 0.015) {
            next.push({ minZ: seg.minZ, maxZ: z.minZ });
          }
          if (z.maxZ < seg.maxZ - 0.015) {
            next.push({ minZ: z.maxZ, maxZ: seg.maxZ });
          }
        }
      }
      intervals = next;
    }
  }
  return intervals.filter((s) => s.maxZ - s.minZ > 0.015);
}

function deriveCutoutSuffix(c: CushionRect, activeCuts: CushionRect[]): string {
  const first = activeCuts[0];
  const touchesMinX = activeCuts.some((k) => k.minX <= c.minX + 0.01);
  const touchesMaxX = activeCuts.some((k) => k.maxX >= c.maxX - 0.01);
  const touchesMinZ = activeCuts.some((k) => k.minZ <= c.minZ + 0.01);
  const touchesMaxZ = activeCuts.some((k) => k.maxZ >= c.maxZ - 0.01);

  if (touchesMinX && touchesMaxX) {
    if (touchesMinZ && !touchesMaxZ) return 'c/ Recuo Traseiro Aéreo';
    if (touchesMaxZ && !touchesMinZ) return 'c/ Recuo Frontal Aéreo';
    return 'c/ Recorte Central Armário Aéreo';
  }
  if (touchesMinZ && touchesMaxZ) {
    if (touchesMinX && !touchesMaxX) return 'c/ Recuo Lateral Dir. Aéreo';
    if (touchesMaxX && !touchesMinX) return 'c/ Recuo Lateral Esq. Aéreo';
    return 'c/ Recorte Longitudinal Armário Aéreo';
  }
  if (first) {
    const fMinX = first.minX <= c.minX + 0.01;
    const fMaxX = first.maxX >= c.maxX - 0.01;
    const fMinZ = first.minZ <= c.minZ + 0.01;
    const fMaxZ = first.maxZ >= c.maxZ - 0.01;
    if (fMinZ && fMinX) return 'c/ Recorte L Quina Traseira Dir. Aéreo';
    if (fMinZ && fMaxX) return 'c/ Recorte L Quina Traseira Esq. Aéreo';
    if (fMaxZ && fMinX) return 'c/ Recorte L Quina Dianteira Dir. Aéreo';
    if (fMaxZ && fMaxX) return 'c/ Recorte L Quina Dianteira Esq. Aéreo';
    if (fMinZ) return 'c/ Encaixe Notched Aéreo Traseiro';
    if (fMaxZ) return 'c/ Encaixe Notched Aéreo Dianteiro';
    if (fMinX) return 'c/ Encaixe Notched Lateral Dir. Aéreo';
    if (fMaxX) return 'c/ Encaixe Notched Lateral Esq. Aéreo';
  }
  return 'c/ Recorte de Quina Armário Aéreo';
}

export function buildCushionMesh(
  c: CushionRect,
  cutoutZones: CushionRect[],
  thickness: number,
  yPos: number,
  material: THREE.Material,
  options: { edgeSnapM?: number } = {}
): CushionMeshResult | null {
  // Se o recorte do armário ficar próximo da borda do colchão (deixando apenas uma tira fina <= 80mm),
  // estende o corte automaticamente até o final da borda para não sobrar uma "linha" inútil de espuma.
  const edgeSnapM = options.edgeSnapM ?? 0.08;
  const activeCuts: CushionRect[] = [];
  for (const zone of cutoutZones) {
    const oMinX = Math.max(c.minX, zone.minX);
    const oMaxX = Math.min(c.maxX, zone.maxX);
    const oMinZ = Math.max(c.minZ, zone.minZ);
    const oMaxZ = Math.min(c.maxZ, zone.maxZ);
    if (oMaxX > oMinX + 0.005 && oMaxZ > oMinZ + 0.005) {
      activeCuts.push({
        minX: oMinX <= c.minX + edgeSnapM ? c.minX : oMinX,
        maxX: oMaxX >= c.maxX - edgeSnapM ? c.maxX : oMaxX,
        minZ: oMinZ <= c.minZ + edgeSnapM ? c.minZ : oMinZ,
        maxZ: oMaxZ >= c.maxZ - edgeSnapM ? c.maxZ : oMaxZ
      });
    }
  }

  const w = c.maxX - c.minX;
  const l = c.maxZ - c.minZ;
  const cCenterX = (c.minX + c.maxX) / 2;
  const cCenterZ = (c.minZ + c.maxZ) / 2;

  if (activeCuts.length === 0) {
    const geo = new THREE.BoxGeometry(w, thickness, l);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(cCenterX, yPos, cCenterZ);
    return {
      mesh,
      isCutout: false,
      labelSuffix: '',
      actualMinX: c.minX,
      actualMaxX: c.maxX,
      actualMinZ: c.minZ,
      actualMaxZ: c.maxZ
    };
  }

  // Subdivisão exata do retângulo da almofada em grade 2D pelos planos dos recortes
  const uniqueSorted = (vals: number[]): number[] => {
    const sorted = [...vals].sort((a, b) => a - b);
    const out: number[] = [];
    for (const v of sorted) {
      if (out.length === 0 || v - out[out.length - 1] > 1e-4) {
        out.push(v);
      }
    }
    return out;
  };

  const xs = uniqueSorted([c.minX, c.maxX, ...activeCuts.flatMap((r) => [r.minX, r.maxX])]);
  const zs = uniqueSorted([c.minZ, c.maxZ, ...activeCuts.flatMap((r) => [r.minZ, r.maxZ])]);
  const nx = xs.length - 1;
  const nz = zs.length - 1;

  if (nx <= 0 || nz <= 0) {
    return null;
  }

  // No plano 2D do THREE.Shape, sx = x - cCenterX e sy = -(z - cCenterZ).
  // Para que sx[ix] e sy[iy] sejam ambos estritamente crescentes:
  // iy = 0 corresponde a z = zs[nz] (sy mínimo) e iy = nz corresponde a z = zs[0] (sy máximo).
  const sx = xs.map((x) => x - cCenterX);
  const sy: number[] = [];
  for (let iy = 0; iy <= nz; iy++) {
    sy.push(-(zs[nz - iy] - cCenterZ));
  }

  const filled: boolean[][] = Array.from({ length: nx }, () => Array(nz).fill(false));
  for (let ix = 0; ix < nx; ix++) {
    const cx = (xs[ix] + xs[ix + 1]) / 2;
    for (let iy = 0; iy < nz; iy++) {
      const iz = nz - 1 - iy;
      const cz = (zs[iz] + zs[iz + 1]) / 2;
      const isInsideCut = activeCuts.some(
        (cut) => cx > cut.minX && cx < cut.maxX && cz > cut.minZ && cz < cut.maxZ
      );
      filled[ix][iy] = !isInsideCut;
    }
  }

  // Filtra fragmentos desconexos minúsculos (< 25mm de largura ou comprimento)
  const visited: boolean[][] = Array.from({ length: nx }, () => Array(nz).fill(false));
  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < nz; iy++) {
      if (!filled[ix][iy] || visited[ix][iy]) continue;
      const comp: Array<[number, number]> = [];
      const queue: Array<[number, number]> = [[ix, iy]];
      visited[ix][iy] = true;
      let compMinX = Infinity;
      let compMaxX = -Infinity;
      let compMinZ = Infinity;
      let compMaxZ = -Infinity;

      while (queue.length > 0) {
        const [cxIdx, cyIdx] = queue.pop()!;
        comp.push([cxIdx, cyIdx]);
        const ciz = nz - 1 - cyIdx;
        compMinX = Math.min(compMinX, xs[cxIdx]);
        compMaxX = Math.max(compMaxX, xs[cxIdx + 1]);
        compMinZ = Math.min(compMinZ, zs[ciz]);
        compMaxZ = Math.max(compMaxZ, zs[ciz + 1]);

        const dirs: Array<[number, number]> = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ];
        for (const [dx, dy] of dirs) {
          const nxIdx = cxIdx + dx;
          const nyIdx = cyIdx + dy;
          if (nxIdx >= 0 && nxIdx < nx && nyIdx >= 0 && nyIdx < nz && filled[nxIdx][nyIdx] && !visited[nxIdx][nyIdx]) {
            visited[nxIdx][nyIdx] = true;
            queue.push([nxIdx, nyIdx]);
          }
        }
      }

      if (compMaxX - compMinX < 0.025 || compMaxZ - compMinZ < 0.025) {
        for (const [cxIdx, cyIdx] of comp) {
          filled[cxIdx][cyIdx] = false;
        }
      }
    }
  }

  let actualMinX = Infinity;
  let actualMaxX = -Infinity;
  let actualMinZ = Infinity;
  let actualMaxZ = -Infinity;
  let totalNetArea = 0;
  let hasAnyFilled = false;

  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < nz; iy++) {
      if (!filled[ix][iy]) continue;
      hasAnyFilled = true;
      const iz = nz - 1 - iy;
      actualMinX = Math.min(actualMinX, xs[ix]);
      actualMaxX = Math.max(actualMaxX, xs[ix + 1]);
      actualMinZ = Math.min(actualMinZ, zs[iz]);
      actualMaxZ = Math.max(actualMaxZ, zs[iz + 1]);
      totalNetArea += (xs[ix + 1] - xs[ix]) * (zs[iz + 1] - zs[iz]);
    }
  }

  if (!hasAnyFilled || actualMaxX - actualMinX < 0.02 || actualMaxZ - actualMinZ < 0.02) {
    return null;
  }

  const suffix = deriveCutoutSuffix(c, activeCuts);
  const bboxW = actualMaxX - actualMinX;
  const bboxL = actualMaxZ - actualMinZ;
  const bboxArea = bboxW * bboxL;

  // Se a região restante for um único retângulo simples (ex: corte reto na largura ou no comprimento):
  if (Math.abs(totalNetArea - bboxArea) < 1e-5) {
    const geo = new THREE.BoxGeometry(bboxW, thickness, bboxL);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set((actualMinX + actualMaxX) / 2, yPos, (actualMinZ + actualMaxZ) / 2);
    return {
      mesh,
      isCutout: true,
      labelSuffix: ` • ${suffix}`,
      actualMinX,
      actualMaxX,
      actualMinZ,
      actualMaxZ
    };
  }

  // Caso geral: Polígono(s) em L, C-notch, U ou múltiplos segmentos (ExtrudeGeometry)
  interface DirectedGridEdge {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    dir: number; // 0: +X, 1: +Y, 2: -X, 3: -Y
    used: boolean;
  }

  const edges: DirectedGridEdge[] = [];
  const outgoing = new Map<string, DirectedGridEdge[]>();
  const addEdge = (x1: number, y1: number, x2: number, y2: number, dir: number) => {
    const edge: DirectedGridEdge = { x1, y1, x2, y2, dir, used: false };
    edges.push(edge);
    const k = `${x1},${y1}`;
    const list = outgoing.get(k);
    if (list) list.push(edge);
    else outgoing.set(k, [edge]);
  };

  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < nz; iy++) {
      if (!filled[ix][iy]) continue;
      // Bottom (+X)
      if (iy === 0 || !filled[ix][iy - 1]) {
        addEdge(ix, iy, ix + 1, iy, 0);
      }
      // Right (+Y)
      if (ix + 1 === nx || !filled[ix + 1][iy]) {
        addEdge(ix + 1, iy, ix + 1, iy + 1, 1);
      }
      // Top (-X)
      if (iy + 1 === nz || !filled[ix][iy + 1]) {
        addEdge(ix + 1, iy + 1, ix, iy + 1, 2);
      }
      // Left (-Y)
      if (ix === 0 || !filled[ix - 1][iy]) {
        addEdge(ix, iy + 1, ix, iy, 3);
      }
    }
  }

  const shapes: THREE.Shape[] = [];
  for (const startEdge of edges) {
    if (startEdge.used) continue;
    const loop: Array<{ x: number; y: number }> = [];
    let cur: DirectedGridEdge | undefined = startEdge;

    while (cur && !cur.used) {
      cur.used = true;
      loop.push({ x: cur.x1, y: cur.y1 });
      const nextKey = `${cur.x2},${cur.y2}`;
      const candidates = (outgoing.get(nextKey) || []).filter((e) => !e.used);
      if (candidates.length === 0) break;
      if (candidates.length === 1) {
        cur = candidates[0];
      } else {
        // Prioriza curva à direita para manter componentes separados
        const prefOrder = [(cur.dir + 3) % 4, cur.dir, (cur.dir + 1) % 4, (cur.dir + 2) % 4];
        candidates.sort((a, b) => prefOrder.indexOf(a.dir) - prefOrder.indexOf(b.dir));
        cur = candidates[0];
      }
    }

    if (loop.length < 4) continue;

    // Simplifica vértices colineares intermediários
    const simplified: Array<{ x: number; y: number }> = [];
    const m = loop.length;
    for (let i = 0; i < m; i++) {
      const prev = loop[(i - 1 + m) % m];
      const curr = loop[i];
      const next = loop[(i + 1) % m];
      const dx1 = Math.sign(curr.x - prev.x);
      const dy1 = Math.sign(curr.y - prev.y);
      const dx2 = Math.sign(next.x - curr.x);
      const dy2 = Math.sign(next.y - curr.y);
      if (dx1 !== dx2 || dy1 !== dy2) {
        simplified.push(curr);
      }
    }

    if (simplified.length < 4) continue;

    const shape = new THREE.Shape();
    shape.moveTo(sx[simplified[0].x], sy[simplified[0].y]);
    for (let i = 1; i < simplified.length; i++) {
      shape.lineTo(sx[simplified[i].x], sy[simplified[i].y]);
    }
    shape.closePath();
    shapes.push(shape);
  }

  if (shapes.length === 0) {
    return null;
  }

  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: thickness,
    bevelEnabled: false
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -thickness / 2, 0);

  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(cCenterX, yPos, cCenterZ);

  return {
    mesh,
    isCutout: true,
    labelSuffix: ` • ${suffix}`,
    actualMinX,
    actualMaxX,
    actualMinZ,
    actualMaxZ
  };
}

/**
 * Constrói uma única malha contínua de almofada a partir da união de múltiplos retângulos
 * adjacentes (mesmo formando L, T ou U entre módulos diferentes), subtraindo as zonas de recorte.
 */
export function buildUnionCushionMesh(
  rects: CushionRect[],
  cutoutZones: CushionRect[],
  thickness: number,
  yPos: number,
  material: THREE.Material
): CushionMeshResult | null {
  if (!rects || rects.length === 0) return null;
  if (rects.length === 1) {
    return buildCushionMesh(rects[0], cutoutZones, thickness, yPos, material);
  }

  const bbox: CushionRect = {
    minX: Math.min(...rects.map((r) => r.minX)),
    maxX: Math.max(...rects.map((r) => r.maxX)),
    minZ: Math.min(...rects.map((r) => r.minZ)),
    maxZ: Math.max(...rects.map((r) => r.maxZ))
  };

  // Coleta grade de coordenadas dos retângulos unidos (agrupando valores a <= 4mm para selar folgas de dobradiça)
  const snapUnique = (vals: number[]): number[] => {
    const sorted = [...vals].sort((a, b) => a - b);
    const out: number[] = [];
    for (const v of sorted) {
      if (out.length === 0 || v - out[out.length - 1] > 0.004) {
        out.push(v);
      }
    }
    return out;
  };

  const xs = snapUnique(rects.flatMap((r) => [r.minX, r.maxX]));
  const zs = snapUnique(rects.flatMap((r) => [r.minZ, r.maxZ]));

  const emptyZones: CushionRect[] = [];
  const tol = 0.005;
  for (let ix = 0; ix < xs.length - 1; ix++) {
    const mx = (xs[ix] + xs[ix + 1]) / 2;
    for (let iz = 0; iz < zs.length - 1; iz++) {
      const mz = (zs[iz] + zs[iz + 1]) / 2;
      const covered = rects.some(
        (r) => mx >= r.minX - tol && mx <= r.maxX + tol && mz >= r.minZ - tol && mz <= r.maxZ + tol
      );
      if (!covered) {
        emptyZones.push({ minX: xs[ix], maxX: xs[ix + 1], minZ: zs[iz], maxZ: zs[iz + 1] });
      }
    }
  }

  // Estende recortes reais de armário que ficam a <= 80mm das bordas do colchão até o final,
  // sem afetar os emptyZones do formato em L/T
  const edgeSnapM = 0.08;
  const snappedCutouts: CushionRect[] = cutoutZones.map((zone) => {
    const oMinX = Math.max(bbox.minX, zone.minX);
    const oMaxX = Math.min(bbox.maxX, zone.maxX);
    const oMinZ = Math.max(bbox.minZ, zone.minZ);
    const oMaxZ = Math.min(bbox.maxZ, zone.maxZ);
    if (oMaxX <= oMinX + 0.005 || oMaxZ <= oMinZ + 0.005) return zone;
    return {
      minX: oMinX <= bbox.minX + edgeSnapM ? bbox.minX : zone.minX,
      maxX: oMaxX >= bbox.maxX - edgeSnapM ? bbox.maxX : zone.maxX,
      minZ: oMinZ <= bbox.minZ + edgeSnapM ? bbox.minZ : zone.minZ,
      maxZ: oMaxZ >= bbox.maxZ - edgeSnapM ? bbox.maxZ : zone.maxZ
    };
  });

  const realCutoutsHit = snappedCutouts.some(
    (z) => z.maxX > bbox.minX + 0.002 && z.minX < bbox.maxX - 0.002 && z.maxZ > bbox.minZ + 0.002 && z.minZ < bbox.maxZ - 0.002
  );

  const res = buildCushionMesh(bbox, [...emptyZones, ...snappedCutouts], thickness, yPos, material, { edgeSnapM: 0.012 });
  if (!res) return null;

  if (!realCutoutsHit) {
    return {
      ...res,
      isCutout: emptyZones.length > 0,
      labelSuffix: emptyZones.length > 0 ? ' • Formato L/União' : ''
    };
  }
  return res;
}

export interface GroupJunctionSegment3D {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
}

/**
 * Constrói o grupo 3D visual das linhas de junção/emenda (costura pontilhada + marcação lateral)
 * sobre uma almofada conectada em grupo, usando segmentos em coordenadas locais da malha.
 */
export function buildGroupJunctionLinesGroup(
  segments: GroupJunctionSegment3D[],
  thickness: number
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'MattressGroupJunctionDetails';

  const topY = thickness / 2 + 0.0018;
  const botY = -thickness / 2 - 0.0005;

  const dashMat = new THREE.LineDashedMaterial({
    color: 0x34d399,
    dashSize: 0.028,
    gapSize: 0.014,
    transparent: true,
    opacity: 0.95
  });

  const stripMat = new THREE.MeshBasicMaterial({
    color: 0x065f46,
    transparent: true,
    opacity: 0.55
  });

  segments.forEach((seg, idx) => {
    const dx = seg.x2 - seg.x1;
    const dz = seg.z2 - seg.z1;
    const len = Math.hypot(dx, dz);
    if (len < 0.015) return;

    // 1. Faixa discreta de vinco/emenda no topo da espuma
    const isAlongZ = Math.abs(dz) >= Math.abs(dx);
    const stripW = isAlongZ ? 0.004 : len;
    const stripL = isAlongZ ? len : 0.004;
    const stripGeo = new THREE.BoxGeometry(stripW, 0.0014, stripL);
    const stripMesh = new THREE.Mesh(stripGeo, stripMat);
    stripMesh.name = `MattressJunctionStrip_${idx}`;
    stripMesh.position.set((seg.x1 + seg.x2) / 2, topY - 0.0006, (seg.z1 + seg.z2) / 2);
    group.add(stripMesh);

    // 2. Linha tracejada verde-esmeralda no topo indicando a junção das partes do grupo
    const topGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(seg.x1, topY, seg.z1),
      new THREE.Vector3(seg.x2, topY, seg.z2)
    ]);
    const topLine = new THREE.Line(topGeo, dashMat);
    topLine.name = `MattressJunctionTopLine_${idx}`;
    topLine.computeLineDistances();
    group.add(topLine);

    // 3. Linhas verticais nas duas bordas laterais da emenda para visualização em perspectiva
    const side1Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(seg.x1, topY, seg.z1),
      new THREE.Vector3(seg.x1, botY, seg.z1)
    ]);
    const side1Line = new THREE.Line(side1Geo, dashMat);
    side1Line.computeLineDistances();
    group.add(side1Line);

    const side2Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(seg.x2, topY, seg.z2),
      new THREE.Vector3(seg.x2, botY, seg.z2)
    ]);
    const side2Line = new THREE.Line(side2Geo, dashMat);
    side2Line.computeLineDistances();
    group.add(side2Line);
  });

  return group;
}

/**
 * Calcula e anexa na malha 3D de uma almofada conectada os detalhes visuais das junções
 * entre todas as subpartes que compõem o grupo (respeitando recortes de armários aéreos).
 */
export function addGroupJunctionDetailsToCushion(
  res: CushionMeshResult,
  memberRects: CushionRect[],
  cutoutZones: CushionRect[],
  thickness: number
): void {
  if (!res || !memberRects || memberRects.length < 2) return;

  const tol = 0.025;
  const minSeg = 0.015;
  const rawSegments: GroupJunctionSegment3D[] = [];

  const subtractIntervals = (
    start: number,
    end: number,
    cuts: Array<[number, number]>
  ): Array<[number, number]> => {
    let intervals: Array<[number, number]> = [[start, end]];
    for (const [cMin, cMax] of cuts) {
      const next: Array<[number, number]> = [];
      for (const [a, b] of intervals) {
        if (cMax <= a || cMin >= b) {
          next.push([a, b]);
        } else {
          if (cMin > a + minSeg) next.push([a, cMin]);
          if (cMax < b - minSeg) next.push([cMax, b]);
        }
      }
      intervals = next;
    }
    return intervals.filter(([a, b]) => b - a > minSeg);
  };

  for (let i = 0; i < memberRects.length; i++) {
    const rA = memberRects[i];
    for (let j = i + 1; j < memberRects.length; j++) {
      const rB = memberRects[j];

      const touchesX = Math.abs(rA.maxX - rB.minX) <= tol || Math.abs(rB.maxX - rA.minX) <= tol;
      const ovMinZ = Math.max(rA.minZ, rB.minZ, res.actualMinZ);
      const ovMaxZ = Math.min(rA.maxZ, rB.maxZ, res.actualMaxZ);

      if (touchesX && ovMaxZ - ovMinZ > minSeg) {
        const sharedX = Math.abs(rA.maxX - rB.minX) <= tol
          ? (rA.maxX + rB.minX) / 2
          : (rB.maxX + rA.minX) / 2;
        const cutsZ: Array<[number, number]> = cutoutZones
          .filter((z) => sharedX >= z.minX - 0.006 && sharedX <= z.maxX + 0.006)
          .map((z) => [z.minZ, z.maxZ]);

        for (const [sMinZ, sMaxZ] of subtractIntervals(ovMinZ, ovMaxZ, cutsZ)) {
          rawSegments.push({
            x1: sharedX - res.mesh.position.x,
            z1: sMinZ - res.mesh.position.z,
            x2: sharedX - res.mesh.position.x,
            z2: sMaxZ - res.mesh.position.z
          });
        }
        continue;
      }

      const touchesZ = Math.abs(rA.maxZ - rB.minZ) <= tol || Math.abs(rB.maxZ - rA.minZ) <= tol;
      const ovMinX = Math.max(rA.minX, rB.minX, res.actualMinX);
      const ovMaxX = Math.min(rA.maxX, rB.maxX, res.actualMaxX);

      if (touchesZ && ovMaxX - ovMinX > minSeg) {
        const sharedZ = Math.abs(rA.maxZ - rB.minZ) <= tol
          ? (rA.maxZ + rB.minZ) / 2
          : (rB.maxZ + rA.minZ) / 2;
        const cutsX: Array<[number, number]> = cutoutZones
          .filter((z) => sharedZ >= z.minZ - 0.006 && sharedZ <= z.maxZ + 0.006)
          .map((z) => [z.minX, z.maxX]);

        for (const [sMinX, sMaxX] of subtractIntervals(ovMinX, ovMaxX, cutsX)) {
          rawSegments.push({
            x1: sMinX - res.mesh.position.x,
            z1: sharedZ - res.mesh.position.z,
            x2: sMaxX - res.mesh.position.x,
            z2: sharedZ - res.mesh.position.z
          });
        }
      }
    }
  }

  if (rawSegments.length === 0) return;

  const junctionGroup = buildGroupJunctionLinesGroup(rawSegments, thickness);
  res.mesh.add(junctionGroup);
  res.mesh.userData = {
    ...res.mesh.userData,
    groupJunctionSegments: rawSegments
  };
}
