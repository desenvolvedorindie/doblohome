import { InternalBoxItem, InternalGridConfig, SlatBedDirection, getMattressFoamName } from '../types';

export interface MattressPartition {
  /** Índices originais (0..totalParts-1) ordenados que compõem esta peça */
  indices: number[];
  /** Verdadeiro se esta peça é resultado da conexão de 2 ou mais subpartes */
  isMerged: boolean;
  /** Índice do grupo em mattressMergedGroups (ou null se subparte individual) */
  groupIndex: number | null;
}

/**
 * Sanitiza e normaliza os grupos conectados de subpartes do colchão.
 * Garante índices válidos (0..totalParts-1), contíguos, sem sobreposição e com >= 2 subpartes.
 */
export function normalizeMergedGroups(totalParts: number, groups?: number[][]): number[][] {
  if (!Array.isArray(groups) || groups.length === 0 || totalParts < 2) {
    return [];
  }

  const cleaned: number[][] = [];
  const used = new Set<number>();

  // Ordena grupos pelo menor índice para determinismo
  const sortedRaw = groups
    .map((g) =>
      Array.from(new Set((Array.isArray(g) ? g : []).filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < totalParts)))
        .sort((a, b) => a - b)
    )
    .filter((g) => g.length >= 2)
    .sort((a, b) => a[0] - b[0]);

  for (const g of sortedRaw) {
    // Verifica se é contíguo
    const isContiguous = g[g.length - 1] - g[0] + 1 === g.length;
    if (!isContiguous) continue;
    // Ignora se algum índice já pertence a outro grupo
    if (g.some((idx) => used.has(idx))) continue;
    g.forEach((idx) => used.add(idx));
    cleaned.push(g);
  }

  return cleaned;
}

/**
 * Transforma o total de subpartes (0..totalParts-1) e os grupos conectados
 * na lista ordenada de peças finais (partições) do colchão.
 */
export function buildMattressPartitions(totalParts: number, mergedGroups?: number[][]): MattressPartition[] {
  const safeTotal = Math.max(1, totalParts);
  const normalized = normalizeMergedGroups(safeTotal, mergedGroups);

  const indexToGroup = new Map<number, number>();
  normalized.forEach((grp, gIdx) => {
    grp.forEach((idx) => indexToGroup.set(idx, gIdx));
  });

  const partitions: MattressPartition[] = [];
  let i = 0;
  while (i < safeTotal) {
    const gIdx = indexToGroup.get(i);
    if (gIdx !== undefined) {
      const grp = normalized[gIdx];
      partitions.push({
        indices: [...grp],
        isMerged: true,
        groupIndex: gIdx
      });
      i = grp[grp.length - 1] + 1;
    } else {
      partitions.push({
        indices: [i],
        isMerged: false,
        groupIndex: null
      });
      i += 1;
    }
  }

  return partitions;
}

/**
 * Expande uma lista de índices selecionados para incluir integralmente quaisquer grupos
 * já existentes que contenham algum dos índices selecionados.
 */
function expandSelectionWithExistingGroups(
  normalizedGroups: number[][],
  selectedIndices: number[]
): number[] {
  const set = new Set<number>(selectedIndices);
  for (const grp of normalizedGroups) {
    if (grp.some((idx) => set.has(idx))) {
      grp.forEach((idx) => set.add(idx));
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

/**
 * Verifica se um conjunto de índices selecionados pode ser conectado em uma única peça contígua.
 */
export function canConnectSubparts(
  totalParts: number,
  currentGroups: number[][] | undefined,
  selectedIndices: number[]
): { valid: boolean; reason?: string; unionIndices: number[] } {
  const validSel = Array.from(
    new Set(selectedIndices.filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < totalParts))
  ).sort((a, b) => a - b);

  if (validSel.length < 2) {
    return { valid: false, reason: 'Selecione pelo menos 2 subpartes para conectar.', unionIndices: validSel };
  }

  const normalized = normalizeMergedGroups(totalParts, currentGroups);
  const unionIndices = expandSelectionWithExistingGroups(normalized, validSel);

  // Verifica se já formam exatamente um único grupo existente
  const alreadySingleGroup = normalized.some(
    (g) => g.length === unionIndices.length && g.every((v, i) => v === unionIndices[i])
  );
  if (alreadySingleGroup) {
    return { valid: false, reason: 'Estas subpartes já estão conectadas no mesmo grupo.', unionIndices };
  }

  const isContiguous = unionIndices[unionIndices.length - 1] - unionIndices[0] + 1 === unionIndices.length;
  if (!isContiguous) {
    return {
      valid: false,
      reason: 'Selecione subpartes vizinhas (contíguas) para formar uma peça inteira.',
      unionIndices
    };
  }

  return { valid: true, unionIndices };
}

/**
 * Conecta as subpartes selecionadas em uma única peça inteira (grupo).
 * Retorna o novo array normalizado de grupos, ou null se a seleção não for contígua/válida.
 */
export function connectMattressSubparts(
  totalParts: number,
  currentGroups: number[][] | undefined,
  selectedIndices: number[]
): number[][] | null {
  const check = canConnectSubparts(totalParts, currentGroups, selectedIndices);
  if (!check.valid) return null;

  const normalized = normalizeMergedGroups(totalParts, currentGroups);
  const unionSet = new Set(check.unionIndices);

  // Remove grupos absorvidos pela nova união e adiciona o grupo resultante
  const remaining = normalized.filter((g) => !g.some((idx) => unionSet.has(idx)));
  remaining.push(check.unionIndices);

  return normalizeMergedGroups(totalParts, remaining);
}

/**
 * Desconecta qualquer grupo que contenha algum dos índices informados,
 * devolvendo suas subpartes ao estado individual.
 */
export function disconnectMattressGroup(
  totalParts: number,
  currentGroups: number[][] | undefined,
  targetIndices: number[]
): number[][] {
  const normalized = normalizeMergedGroups(totalParts, currentGroups);
  const targetSet = new Set(targetIndices);
  const remaining = normalized.filter((g) => !g.some((idx) => targetSet.has(idx)));
  return normalizeMergedGroups(totalParts, remaining);
}

/**
 * Nome curto de cada subparte individual para exibição na planta 2D e etiquetas.
 */
export function getSubpartShortLabel(totalParts: number, index: number, direction: SlatBedDirection): string {
  if (totalParts === 5 && (direction === 'left' || direction === 'right')) {
    if (index === 0) return 'Aba Roda Base';
    if (index === 4) return 'Aba Roda Oposta';
    return `Central ${index}`;
  }
  return `Parte ${index + 1}`;
}

/**
 * Rótulo completo da peça final (individual ou conectada) para o 3D, Plano de Corte e BOM.
 */
export function getPartitionLabel(
  partition: MattressPartition,
  totalParts: number,
  direction: SlatBedDirection,
  partsName: string
): string {
  const isLateral = direction === 'left' || direction === 'right';

  if (!partition.isMerged) {
    const idx = partition.indices[0];
    if (totalParts === 5 && isLateral) {
      if (idx === 0) return 'Almofada Aba Caixa de Roda Base';
      if (idx === 4) return 'Almofada Aba Caixa de Roda Oposta';
      return `Almofada Central ${idx}/3`;
    }
    if (!isLateral) {
      return `Almofada Longitudinal ${idx + 1}/${totalParts} (${partsName})`;
    }
    return `Almofada ${idx + 1}/${totalParts} (${partsName})`;
  }

  if (partition.indices.length === totalParts) {
    return `Colchão Inteiro Conectado (${totalParts}/${totalParts} Partes)`;
  }

  if (totalParts === 5 && isLateral) {
    const names = partition.indices.map((i) => getSubpartShortLabel(totalParts, i, direction));
    return `Almofada Conectada (${names.join(' + ')})`;
  }

  const nums = partition.indices.map((i) => i + 1).join('+');
  return `Almofada Conectada (Partes ${nums} de ${totalParts})`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA GLOBAL ALL-TO-ALL (CONEXÃO ENTRE SUBPARTES ADJACENTES DE QUALQUER MÓDULO)
// ─────────────────────────────────────────────────────────────────────────────

export interface GlobalMattressSubpart {
  /** ID único global: `${boxId}::${subpartIndex}` */
  id: string;
  boxId: string;
  boxName: string;
  subpartIndex: number;
  totalPartsInBox: number;
  shortLabel: string;
  /** Coordenadas reais no veículo em metros (eixo X: +esq/-dir, eixo Z: +frente/-trás) */
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** Altura Y do topo da base/ripas (onde o colchão apoia) em metros */
  topOfSlatsY: number;
  thicknessM: number;
  foamName: string;
  direction: SlatBedDirection;
  isBedOpen: boolean;
}

export interface GlobalMattressPartition {
  ids: string[];
  subparts: GlobalMattressSubpart[];
  isMerged: boolean;
  groupIndex: number | null;
}

export function makeGlobalSubpartId(boxId: string, subpartIndex: number): string {
  return `${boxId}::${subpartIndex}`;
}

/**
 * Calcula TODAS as subpartes de colchão de TODOS os módulos de cama do veículo
 * em coordenadas reais do veículo (metros), na posição aberta (estendida).
 */
export function computeAllVehicleMattressSubparts(
  grid: InternalGridConfig,
  boxes: InternalBoxItem[],
  floorY: number = 0
): GlobalMattressSubpart[] {
  const cols = Math.max(1, grid.colsX || 3);
  const rows = Math.max(1, grid.rowsZ || 4);
  const widthM = (grid.widthMm || 1200) / 1000;
  const lengthM = (grid.lengthMm || 1700) / 1000;
  const cellWM = widthM / cols;
  const cellLM = lengthM / rows;

  const result: GlobalMattressSubpart[] = [];

  for (const box of boxes) {
    if (box.type !== 'slat_bed' && !box.hasBed) continue;

    const colStart = Math.min(cols - 1, Math.max(0, box.colStart));
    const colSpan = Math.min(cols - colStart, Math.max(1, box.colSpan));
    const rowStart = Math.min(rows - 1, Math.max(0, box.rowStart));
    const rowSpan = Math.min(rows - rowStart, Math.max(1, box.rowSpan));

    const extraWM = (box.extraWidthMm || 0) / 1000;
    const extraLM = (box.extraLengthMm || 0) / 1000;
    const offsetXM = (box.offsetXMm || 0) / 1000;
    const offsetZM = (box.offsetZMm || 0) / 1000;

    const w = Math.max(0.05, colSpan * cellWM + extraWM);
    const l = Math.max(0.05, rowSpan * cellLM + extraLM);
    const h = Math.max(0.05, (box.heightMm ?? grid.heightMm ?? 400) / 1000);

    const posX = widthM / 2 - (colStart + colSpan / 2) * cellWM + offsetXM;
    const posZ = -(rowStart + rowSpan / 2) * cellLM + offsetZM;
    const posY = floorY + h / 2;
    const topOfSlatsY = posY + h / 2;

    const parts = box.mattressParts ?? 2;
    const direction: SlatBedDirection = box.slatBedDirection || 'left';
    const isLateral = direction === 'left' || direction === 'right';
    const thicknessM = (box.mattressThicknessMm ?? 80) / 1000;
    const foamName = getMattressFoamName(box.mattressFoam);
    const isBedOpen = Boolean(box.isBedOpen ?? (box.type === 'slat_bed' ? box.isOpen : false));

    const pushLocalRect = (subIdx: number, localMinX: number, localMaxX: number, localMinZ: number, localMaxZ: number) => {
      result.push({
        id: makeGlobalSubpartId(box.id, subIdx),
        boxId: box.id,
        boxName: box.name || 'Cama',
        subpartIndex: subIdx,
        totalPartsInBox: parts,
        shortLabel: parts === 1 ? (box.name || 'Colchão 1p') : getSubpartShortLabel(parts, subIdx, direction),
        minX: posX + localMinX,
        maxX: posX + localMaxX,
        minZ: posZ + localMinZ,
        maxZ: posZ + localMaxZ,
        topOfSlatsY,
        thicknessM,
        foamName,
        direction,
        isBedOpen
      });
    };

    if (isLateral) {
      const cellW =
        parts === 4
          ? widthM / 4
          : parts === 3 || parts === 5
            ? widthM / 3
            : cellWM || w;

      if (parts === 5) {
        const archW = 0.142;
        const baseArchX = direction === 'left' ? (-w / 2 - archW / 2) : (w / 2 + archW / 2);
        const farArchX = direction === 'left' ? (-w / 2 + 3 * cellW + archW / 2) : (w / 2 - 3 * cellW - archW / 2);

        pushLocalRect(0, baseArchX - archW / 2, baseArchX + archW / 2, -l / 2, l / 2);
        for (let i = 0; i < 3; i++) {
          const cx = direction === 'left' ? (-w / 2 + (i + 0.5) * cellW) : (w / 2 - (i + 0.5) * cellW);
          pushLocalRect(i + 1, cx - cellW / 2, cx + cellW / 2, -l / 2, l / 2);
        }
        pushLocalRect(4, farArchX - archW / 2, farArchX + archW / 2, -l / 2, l / 2);
      } else if (parts === 2 && box.bedMode === 'hinged') {
        const leafW = Math.min(w, Math.max(Math.min(0.10, w), box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : w));
        const hingeGap = 0.003;
        if (direction === 'left') {
          pushLocalRect(0, -w / 2, w / 2, -l / 2, l / 2);
          pushLocalRect(1, w / 2, w / 2 + hingeGap + leafW, -l / 2, l / 2);
        } else {
          pushLocalRect(0, -w / 2, w / 2, -l / 2, l / 2);
          pushLocalRect(1, -w / 2 - hingeGap - leafW, -w / 2, -l / 2, l / 2);
        }
      } else {
        for (let i = 0; i < parts; i++) {
          const cx = direction === 'left' ? (-w / 2 + (i + 0.5) * cellW) : (w / 2 - (i + 0.5) * cellW);
          pushLocalRect(i, cx - cellW / 2, cx + cellW / 2, -l / 2, l / 2);
        }
      }
    } else {
      const cellL =
        parts === 4
          ? lengthM / 4
          : parts === 3
            ? lengthM / 3
            : cellLM || l;

      if (parts === 2 && box.bedMode === 'hinged') {
        const leafL = Math.min(l, Math.max(Math.min(0.10, l), box.hingedBedLeafSizeMm !== undefined ? box.hingedBedLeafSizeMm / 1000 : l));
        const hingeGap = 0.003;
        if (direction === 'front') {
          pushLocalRect(0, -w / 2, w / 2, -l / 2, l / 2);
          pushLocalRect(1, -w / 2, w / 2, l / 2, l / 2 + hingeGap + leafL);
        } else {
          pushLocalRect(0, -w / 2, w / 2, -l / 2, l / 2);
          pushLocalRect(1, -w / 2, w / 2, -l / 2 - hingeGap - leafL, -l / 2);
        }
      } else {
        for (let i = 0; i < parts; i++) {
          const cz = direction === 'front' ? (-l / 2 + (i + 0.5) * cellL) : (l / 2 - (i + 0.5) * cellL);
          pushLocalRect(i, -w / 2, w / 2, cz - cellL / 2, cz + cellL / 2);
        }
      }
    }
  }

  return result;
}

/**
 * Verifica se duas subpartes ficam fisicamente encostadas lado a lado na estrutura dos módulos
 * (compartilhando uma borda em X com sobreposição em Z, ou compartilhando uma borda em Z com sobreposição em X).
 */
export function areSubpartsAdjacent(
  a: Pick<GlobalMattressSubpart, 'minX' | 'maxX' | 'minZ' | 'maxZ'>,
  b: Pick<GlobalMattressSubpart, 'minX' | 'maxX' | 'minZ' | 'maxZ'>,
  tolM: number = 0.025
): boolean {
  const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const overlapZ = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
  const minSharedEdge = 0.015; // mínimo 15mm de borda encostada

  const touchesX = Math.abs(a.maxX - b.minX) <= tolM || Math.abs(b.maxX - a.minX) <= tolM;
  if (touchesX && overlapZ > minSharedEdge) return true;

  const touchesZ = Math.abs(a.maxZ - b.minZ) <= tolM || Math.abs(b.maxZ - a.minZ) <= tolM;
  if (touchesZ && overlapX > minSharedEdge) return true;

  return false;
}

/**
 * Verifica via BFS se um conjunto de subpartes forma um único componente conexo
 * onde todas ficam encostadas lado a lado na estrutura.
 */
export function isSubpartSetConnected(subparts: GlobalMattressSubpart[], tolM: number = 0.025): boolean {
  if (subparts.length <= 1) return subparts.length === 1;
  const visited = new Set<number>([0]);
  const queue: number[] = [0];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (let i = 0; i < subparts.length; i++) {
      if (visited.has(i)) continue;
      if (areSubpartsAdjacent(subparts[cur], subparts[i], tolM)) {
        visited.add(i);
        queue.push(i);
      }
    }
  }
  return visited.size === subparts.length;
}

/**
 * Coleta os grupos globais efetivos combinando `grid.mattressMergedGroups` e eventuais
 * grupos legados por módulo (`box.mattressMergedGroups`).
 */
export function collectEffectiveGlobalGroups(
  subparts: GlobalMattressSubpart[],
  gridGroups?: string[][],
  boxes?: InternalBoxItem[]
): string[][] {
  const byId = new Map(subparts.map((s) => [s.id, s]));
  const rawGroups: string[][] = [];

  if (Array.isArray(gridGroups)) {
    gridGroups.forEach((g) => {
      if (Array.isArray(g)) rawGroups.push(g);
    });
  }

  // Retrocompatibilidade com box.mattressMergedGroups (caso ainda exista em projetos salvos)
  if (Array.isArray(boxes)) {
    for (const b of boxes) {
      if (Array.isArray(b.mattressMergedGroups) && b.mattressMergedGroups.length > 0) {
        for (const numGrp of b.mattressMergedGroups) {
          if (Array.isArray(numGrp) && numGrp.length >= 2) {
            rawGroups.push(numGrp.map((idx) => makeGlobalSubpartId(b.id, idx)));
          }
        }
      }
    }
  }

  const used = new Set<string>();
  const cleaned: string[][] = [];

  for (const raw of rawGroups) {
    const uniqueValid = Array.from(new Set(raw.filter((id) => byId.has(id) && !used.has(id)))).sort();
    if (uniqueValid.length < 2) continue;
    const grpSubparts = uniqueValid.map((id) => byId.get(id)!);
    if (!isSubpartSetConnected(grpSubparts)) continue;
    uniqueValid.forEach((id) => used.add(id));
    cleaned.push(uniqueValid);
  }

  return cleaned;
}

/**
 * Verifica se um conjunto de IDs globais selecionados pode ser conectado em uma única peça inteira.
 */
export function canConnectGlobalSubparts(
  subparts: GlobalMattressSubpart[],
  currentGroups: string[][] | undefined,
  selectedIds: string[]
): { valid: boolean; reason?: string; unionIds: string[] } {
  const byId = new Map(subparts.map((s) => [s.id, s]));
  const validSel = Array.from(new Set(selectedIds.filter((id) => byId.has(id)))).sort();

  if (validSel.length < 2) {
    return { valid: false, reason: 'Selecione pelo menos 2 partes encostadas para conectar.', unionIds: validSel };
  }

  const normalized = collectEffectiveGlobalGroups(subparts, currentGroups);
  const unionSet = new Set<string>(validSel);
  for (const grp of normalized) {
    if (grp.some((id) => unionSet.has(id))) {
      grp.forEach((id) => unionSet.add(id));
    }
  }
  const unionIds = Array.from(unionSet).sort();

  const alreadySingleGroup = normalized.some(
    (g) => g.length === unionIds.length && g.every((v, i) => v === unionIds[i])
  );
  if (alreadySingleGroup) {
    return { valid: false, reason: 'Estas partes já estão conectadas no mesmo grupo.', unionIds };
  }

  const unionSubparts = unionIds.map((id) => byId.get(id)!);
  if (!isSubpartSetConnected(unionSubparts)) {
    return {
      valid: false,
      reason: 'Só é possível conectar partes que ficam encostadas lado a lado na estrutura dos módulos.',
      unionIds
    };
  }

  return { valid: true, unionIds };
}

/**
 * Conecta as subpartes selecionadas (de um mesmo módulo ou entre módulos vizinhos) em uma única peça.
 */
export function connectGlobalMattressSubparts(
  subparts: GlobalMattressSubpart[],
  currentGroups: string[][] | undefined,
  selectedIds: string[]
): string[][] | null {
  const check = canConnectGlobalSubparts(subparts, currentGroups, selectedIds);
  if (!check.valid) return null;

  const normalized = collectEffectiveGlobalGroups(subparts, currentGroups);
  const unionSet = new Set(check.unionIds);
  const remaining = normalized.filter((g) => !g.some((id) => unionSet.has(id)));
  remaining.push(check.unionIds);

  return collectEffectiveGlobalGroups(subparts, remaining);
}

/**
 * Desconecta qualquer grupo global que contenha algum dos IDs informados.
 */
export function disconnectGlobalMattressGroup(
  subparts: GlobalMattressSubpart[],
  currentGroups: string[][] | undefined,
  targetIds: string[]
): string[][] {
  const normalized = collectEffectiveGlobalGroups(subparts, currentGroups);
  const targetSet = new Set(targetIds);
  const remaining = normalized.filter((g) => !g.some((id) => targetSet.has(id)));
  return collectEffectiveGlobalGroups(subparts, remaining);
}

/**
 * Monta as partições finais globais (peças individuais + grupos conectados) de todo o veículo.
 */
export function buildGlobalMattressPartitions(
  subparts: GlobalMattressSubpart[],
  mergedGroups?: string[][]
): GlobalMattressPartition[] {
  const normalized = collectEffectiveGlobalGroups(subparts, mergedGroups);
  const idToGroup = new Map<string, number>();
  normalized.forEach((grp, gIdx) => {
    grp.forEach((id) => idToGroup.set(id, gIdx));
  });

  const emittedGroups = new Set<number>();
  const byId = new Map(subparts.map((s) => [s.id, s]));
  const partitions: GlobalMattressPartition[] = [];

  for (const sp of subparts) {
    const gIdx = idToGroup.get(sp.id);
    if (gIdx !== undefined) {
      if (emittedGroups.has(gIdx)) continue;
      emittedGroups.add(gIdx);
      const grpIds = normalized[gIdx];
      partitions.push({
        ids: grpIds,
        subparts: grpIds.map((id) => byId.get(id)!).filter(Boolean),
        isMerged: true,
        groupIndex: gIdx
      });
    } else {
      partitions.push({
        ids: [sp.id],
        subparts: [sp],
        isMerged: false,
        groupIndex: null
      });
    }
  }

  return partitions;
}

export interface Rect2D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Calcula o(s) polígono(s) exatos do contorno externo da união de retângulos 2D adjacentes
 * (preservando formatos em L, T, U ou degraus sem fechar como um retângulo envolvente).
 */
export function computeRectUnionPolygons(rects: Rect2D[], snapTol: number = 5): Point2D[][] {
  if (!rects || rects.length === 0) return [];

  const snapUnique = (vals: number[]): number[] => {
    const sorted = [...vals].sort((a, b) => a - b);
    const out: number[] = [];
    for (const v of sorted) {
      if (out.length === 0 || v - out[out.length - 1] > snapTol) {
        out.push(v);
      }
    }
    return out;
  };

  const xs = snapUnique(rects.flatMap((r) => [r.minX, r.maxX]));
  const ys = snapUnique(rects.flatMap((r) => [r.minY, r.maxY]));
  const nx = xs.length - 1;
  const ny = ys.length - 1;
  if (nx <= 0 || ny <= 0) return [];

  const filled: boolean[][] = Array.from({ length: nx }, () => Array(ny).fill(false));
  for (let ix = 0; ix < nx; ix++) {
    const mx = (xs[ix] + xs[ix + 1]) / 2;
    for (let iy = 0; iy < ny; iy++) {
      const my = (ys[iy] + ys[iy + 1]) / 2;
      filled[ix][iy] = rects.some(
        (r) => mx >= r.minX - snapTol && mx <= r.maxX + snapTol && my >= r.minY - snapTol && my <= r.maxY + snapTol
      );
    }
  }

  interface DirEdge {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    dir: number; // 0: +X, 1: +Y, 2: -X, 3: -Y
    used: boolean;
  }

  const edges: DirEdge[] = [];
  const outgoing = new Map<string, DirEdge[]>();
  const addEdge = (x1: number, y1: number, x2: number, y2: number, dir: number) => {
    const edge: DirEdge = { x1, y1, x2, y2, dir, used: false };
    edges.push(edge);
    const k = `${x1},${y1}`;
    const list = outgoing.get(k);
    if (list) list.push(edge);
    else outgoing.set(k, [edge]);
  };

  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      if (!filled[ix][iy]) continue;
      if (iy === 0 || !filled[ix][iy - 1]) addEdge(ix, iy, ix + 1, iy, 0);
      if (ix + 1 === nx || !filled[ix + 1][iy]) addEdge(ix + 1, iy, ix + 1, iy + 1, 1);
      if (iy + 1 === ny || !filled[ix][iy + 1]) addEdge(ix + 1, iy + 1, ix, iy + 1, 2);
      if (ix === 0 || !filled[ix - 1][iy]) addEdge(ix, iy + 1, ix, iy, 3);
    }
  }

  const polygons: Point2D[][] = [];
  for (const start of edges) {
    if (start.used) continue;
    const loop: Array<{ x: number; y: number }> = [];
    let cur: DirEdge | undefined = start;
    while (cur && !cur.used) {
      cur.used = true;
      loop.push({ x: cur.x1, y: cur.y1 });
      const candidates = (outgoing.get(`${cur.x2},${cur.y2}`) || []).filter((e) => !e.used);
      if (candidates.length === 0) break;
      if (candidates.length === 1) {
        cur = candidates[0];
      } else {
        const pref = [(cur.dir + 3) % 4, cur.dir, (cur.dir + 1) % 4, (cur.dir + 2) % 4];
        candidates.sort((a, b) => pref.indexOf(a.dir) - pref.indexOf(b.dir));
        cur = candidates[0];
      }
    }

    if (loop.length < 4) continue;

    // Remove vértices colineares intermediários
    const simplified: Point2D[] = [];
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
        simplified.push({ x: xs[curr.x], y: ys[curr.y] });
      }
    }

    if (simplified.length >= 4) {
      polygons.push(simplified);
    }
  }

  return polygons;
}


