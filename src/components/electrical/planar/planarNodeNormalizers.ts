import type { Edge, Node } from '@xyflow/react';
import {
  ElectricalEdgeData,
  ElectricalEdgeStyle,
  ElectricalNodeData,
  INFRASTRUCTURE_CATALOG,
  buildBusbarPorts
} from '../../../types/electricalPlanar';

export const STORAGE_KEY_DIAGRAM = 'doblo_electrical_planar_v1';
export const STORAGE_KEY_CUSTOM_TPL = 'doblo_electrical_custom_templates_v1';

export interface SavedDiagramState {
  nodes: Node<ElectricalNodeData>[];
  edges: Edge<ElectricalEdgeData>[];
  edgeStyle?: ElectricalEdgeStyle;
  iconScale?: number;
}

export function normalizeBusbarNode(
  node: Node<ElectricalNodeData>,
  edges: Edge<ElectricalEdgeData>[]
): Node<ElectricalNodeData> {
  if (node.data.kind !== 'busbar') return node;

  const existingPorts = node.data.ports || [];
  const hasLegacyInOut = existingPorts.some(
    (p) => p.id.startsWith('in_') || p.id.startsWith('out_')
  );
  const hasConnections = edges.some((e) => e.source === node.id || e.target === node.id);

  if (hasLegacyInOut && !hasConnections) {
    const catalogTpl = INFRASTRUCTURE_CATALOG.find(
      (t) => t.catalogId === node.data.catalogId
    );
    const nextPorts = catalogTpl
      ? catalogTpl.ports.map((p) => ({ ...p }))
      : buildBusbarPorts(
          node.data.busbarPolarity || 'pos',
          node.data.busbarTermCount || existingPorts.length || 8
        );
    return {
      ...node,
      data: {
        ...node.data,
        busbarTermCount: catalogTpl?.busbarTermCount ?? node.data.busbarTermCount,
        ports: nextPorts
      }
    };
  }

  return {
    ...node,
    data: {
      ...node.data,
      ports: existingPorts.map((p) => ({
        ...p,
        label: hasLegacyInOut ? p.label.replace(/\s+(IN|OUT)$/i, '') : p.label,
        side: 'left',
        direction: 'bidirectional'
      }))
    }
  };
}

export function normalizeUsinaNode(
  node: Node<ElectricalNodeData>
): Node<ElectricalNodeData> {
  if (node.data.catalogId === 'outlet_ac_ext') {
    if (node.data.label === 'Tomada Externa / Interna AC') {
      return {
        ...node,
        data: {
          ...node.data,
          label: 'Tomada Externa'
        }
      };
    }
    return node;
  }

  if (node.data.catalogId !== 'sys_usina' && node.data.systemKey !== 'usina') {
    return node;
  }
  let ports = node.data.ports || [];
  let changed = false;

  // Garante que o pino de Terra AC existe na entrada (lado top)
  if (!ports.some((p) => p.id === 'ac_ground')) {
    ports = [
      ...ports,
      { id: 'ac_ground', label: 'Terra (PE)', polarity: 'ac_ground', side: 'top', direction: 'in', maxAmps: 20 }
    ];
    changed = true;
  }

  // Garante que saídas DC estejam no lado direito
  if (ports.some((p) => (p.id === 'dc_pos' || p.id === 'dc_neg') && p.side !== 'right')) {
    ports = ports.map((p) =>
      p.id === 'dc_pos' || p.id === 'dc_neg' ? { ...p, side: 'right' } : p
    );
    changed = true;
  }

  if (!changed) return node;

  return {
    ...node,
    data: {
      ...node.data,
      ports
    }
  };
}
