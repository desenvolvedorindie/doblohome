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
    // Se a base do armário aéreo descer abaixo do topo do colchão (passar da altura do colchão),
    // ou se o espaçamento inferior for menor/igual à espessura do colchão, o colchão DEVE ser recortado!
    const cabBoxHeightMm = cabBox.heightMm ?? grid?.heightMm ?? 400;
    const bottomGapMm = Math.max(0, cabBox.upperCabinetBottomGapMm ?? 0);
    const cabinetBottomMm = cabBoxHeightMm + bottomGapMm;
    const cutsByHeight = cabinetBottomMm < mattressTopMm || bottomGapMm <= mattressThicknessMm;
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
  material: THREE.Material
): CushionMeshResult | null {
  const activeCuts: CushionRect[] = [];
  for (const zone of cutoutZones) {
    const oMinX = Math.max(c.minX, zone.minX);
    const oMaxX = Math.min(c.maxX, zone.maxX);
    const oMinZ = Math.max(c.minZ, zone.minZ);
    const oMaxZ = Math.min(c.maxZ, zone.maxZ);
    if (oMaxX > oMinX + 0.005 && oMaxZ > oMinZ + 0.005) {
      activeCuts.push({
        minX: oMinX <= c.minX + 0.012 ? c.minX : oMinX,
        maxX: oMaxX >= c.maxX - 0.012 ? c.maxX : oMaxX,
        minZ: oMinZ <= c.minZ + 0.012 ? c.minZ : oMinZ,
        maxZ: oMaxZ >= c.maxZ - 0.012 ? c.maxZ : oMaxZ
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
