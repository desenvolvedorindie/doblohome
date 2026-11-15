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
  if (node.data.catalogId !== 'sys_usina' && node.data.systemKey !== 'usina') {
    return node;
  }
  const ports = node.data.ports || [];
  const needsUpdate = ports.some(
    (p) => (p.id === 'dc_pos' || p.id === 'dc_neg') && p.side !== 'right'
  );
  if (!needsUpdate) return node;
  return {
    ...node,
    data: {
      ...node.data,
      ports: ports.map((p) =>
        p.id === 'dc_pos' || p.id === 'dc_neg' ? { ...p, side: 'right' } : p
      )
    }
  };
}
