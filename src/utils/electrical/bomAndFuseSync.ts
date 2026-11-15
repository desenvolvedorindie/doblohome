import type { Edge, Node } from '@xyflow/react';
import {
  ElectricalEdgeData,
  ElectricalNodeData,
  ElectricalPortPolarity,
  POLARITY_META,
  getFuseColorSpec,
  suggestBladeFuseAmps
} from '../../types/electricalPlanar';

/**
 * Sincroniza os fusíveis automáticos das Caixas de Fusíveis de acordo com os itens conectados em cada via.
 * Vias sem conexão ficam vazias (`fuseAmps = undefined`), exceto quando configuradas manualmente.
 */
export function syncFuseBoxNodePorts(
  nodes: Node<ElectricalNodeData>[],
  edges: Edge<ElectricalEdgeData>[]
): Node<ElectricalNodeData>[] {
  let anyNodeChanged = false;

  const nextNodes = nodes.map((node) => {
    if (node.data.kind !== 'fuse_box') return node;

    let portsChanged = false;
    const nextPorts = node.data.ports.map((port) => {
      if (!port.id.startsWith('fuse_')) return port;

      if (port.isManualFuse && port.fuseAmps && port.fuseAmps > 0) {
        const expectedLabel = `F${port.wayIndex} (${port.fuseAmps}A)`;
        if (port.label === expectedLabel && port.maxAmps === port.fuseAmps) {
          return port;
        }
        portsChanged = true;
        return {
          ...port,
          maxAmps: port.fuseAmps,
          label: expectedLabel
        };
      }

      const connected = edges.filter(
        (e) =>
          (e.source === node.id && e.sourceHandle === port.id) ||
          (e.target === node.id && e.targetHandle === port.id)
      );

      if (connected.length > 0) {
        const wayAmps = connected.reduce((sum, e) => sum + (e.data?.currentAmps || 0), 0);
        const autoFuse = suggestBladeFuseAmps(wayAmps);
        const expectedLabel = `F${port.wayIndex} (${autoFuse}A)`;
        if (
          port.fuseAmps === autoFuse &&
          port.maxAmps === autoFuse &&
          port.label === expectedLabel &&
          port.isManualFuse === false
        ) {
          return port;
        }
        portsChanged = true;
        return {
          ...port,
          fuseAmps: autoFuse,
          isManualFuse: false,
          maxAmps: autoFuse,
          label: expectedLabel
        };
      }

      const expectedEmptyLabel = `F${port.wayIndex}`;
      if (
        port.fuseAmps === undefined &&
        port.maxAmps === 40 &&
        port.label === expectedEmptyLabel &&
        port.isManualFuse === false
      ) {
        return port;
      }
      portsChanged = true;
      return {
        ...port,
        fuseAmps: undefined,
        isManualFuse: false,
        maxAmps: 40,
        label: expectedEmptyLabel
      };
    });

    if (!portsChanged) return node;
    anyNodeChanged = true;
    return {
      ...node,
      data: {
        ...node.data,
        ports: nextPorts
      }
    };
  });

  return anyNodeChanged ? nextNodes : nodes;
}

export interface CableBomItem {
  polarity: ElectricalPortPolarity;
  polarityLabel: string;
  color: string;
  gaugeMm2: number;
  totalMeters: number;
  wireCount: number;
}

export interface FuseBomItem {
  amps: number;
  colorName: string;
  hex: string;
  qty: number;
}

export interface EquipmentBomItem {
  key: string;
  label: string;
  icon: string;
  detail: string;
  qty: number;
}

export interface ElectricalBomSummary {
  cables: CableBomItem[];
  totalCableMeters: number;
  fuses: FuseBomItem[];
  totalFuses: number;
  equipment: EquipmentBomItem[];
  overloadedEdgesCount: number;
}

/**
 * Consolida a Lista de Compras Elétrica (metragem de cabos por cor/bitola, fusíveis e componentes).
 */
export function calculateElectricalBom(
  nodes: Node<ElectricalNodeData>[],
  edges: Edge<ElectricalEdgeData>[]
): ElectricalBomSummary {
  const cableMap = new Map<string, CableBomItem>();
  let totalCableMeters = 0;
  let overloadedEdgesCount = 0;

  for (const edge of edges) {
    const d = edge.data;
    if (!d) continue;
    if (d.isOverloaded) overloadedEdgesCount++;

    const length = d.lengthMeters || 1.5;
    totalCableMeters += length;
    const key = `${d.polarity}_${d.gaugeMm2}`;
    const existing = cableMap.get(key);
    if (existing) {
      existing.totalMeters = +(existing.totalMeters + length).toFixed(2);
      existing.wireCount += 1;
    } else {
      cableMap.set(key, {
        polarity: d.polarity,
        polarityLabel: POLARITY_META[d.polarity]?.label || d.polarity,
        color: d.color || POLARITY_META[d.polarity]?.color || '#94a3b8',
        gaugeMm2: d.gaugeMm2,
        totalMeters: +length.toFixed(2),
        wireCount: 1
      });
    }
  }

  // Fusíveis usados nas caixas de fusíveis
  const fuseMap = new Map<number, FuseBomItem>();
  let totalFuses = 0;

  // Equipamentos instanciados (especialmente proteção e distribuição)
  const equipMap = new Map<string, EquipmentBomItem>();

  for (const node of nodes) {
    const d = node.data;

    if (d.kind === 'fuse_box') {
      const fusePorts = d.ports.filter((p) => p.id.startsWith('fuse_'));
      for (const fp of fusePorts) {
        let amps: number | undefined;
        if (fp.isManualFuse && fp.fuseAmps && fp.fuseAmps > 0) {
          amps = fp.fuseAmps;
        } else {
          const connected = edges.filter(
            (e) =>
              (e.source === node.id && e.sourceHandle === fp.id) ||
              (e.target === node.id && e.targetHandle === fp.id)
          );
          if (connected.length > 0) {
            const wayAmps = connected.reduce((sum, e) => sum + (e.data?.currentAmps || 0), 0);
            amps = suggestBladeFuseAmps(wayAmps);
          }
        }
        if (!amps || amps <= 0) continue;
        totalFuses++;
        const existing = fuseMap.get(amps);
        if (existing) {
          existing.qty += 1;
        } else {
          const spec = getFuseColorSpec(amps);
          fuseMap.set(amps, {
            amps,
            colorName: spec.colorName,
            hex: spec.hex,
            qty: 1
          });
        }
      }
    }

    const detail =
      d.kind === 'fuse_box'
        ? `${d.fuseWayCount || 12} Vias`
        : d.kind === 'busbar'
          ? `${d.busbarTermCount || 8} Terminais`
          : d.kind === 'breaker'
            ? `${d.breakerAmps || 60}A (${d.breakerPoles || 2}P)`
            : d.watts > 0
              ? `${d.watts}W @ ${d.voltage}V`
              : `${d.voltage}V`;

    const eqKey = `${d.catalogId}_${detail}`;
    const existingEq = equipMap.get(eqKey);
    if (existingEq) {
      existingEq.qty += 1;
    } else {
      equipMap.set(eqKey, {
        key: eqKey,
        label: d.label,
        icon: d.icon,
        detail,
        qty: 1
      });
    }
  }

  return {
    cables: Array.from(cableMap.values()).sort((a, b) => b.gaugeMm2 - a.gaugeMm2),
    totalCableMeters: +totalCableMeters.toFixed(1),
    fuses: Array.from(fuseMap.values()).sort((a, b) => a.amps - b.amps),
    totalFuses,
    equipment: Array.from(equipMap.values()),
    overloadedEdgesCount
  };
}
