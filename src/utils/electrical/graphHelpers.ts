import type { Edge, Node } from '@xyflow/react';
import {
  ElectricalEdgeData,
  ElectricalNodeData,
  ElectricalPort,
  ElectricalPortPolarity
} from '../../types/electricalPlanar';

export function getPolarityGroup(
  polarity: ElectricalPortPolarity
): 'pos' | 'neg' | 'ac_p' | 'ac_n' | 'ac_g' | 'sig' {
  if (polarity === 'pos') return 'pos';
  if (polarity === 'neg') return 'neg';
  if (polarity === 'ac_phase') return 'ac_p';
  if (polarity === 'ac_neutral') return 'ac_n';
  if (polarity === 'ac_ground') return 'ac_g';
  return 'sig';
}

export function getNodeNominalCurrent(node: Node<ElectricalNodeData>): number {
  const d = node.data;
  if (d.isEnabled === false) return 0;
  if (d.amps > 0) return +d.amps.toFixed(1);
  if (d.watts > 0 && d.voltage > 0) return +(d.watts / d.voltage).toFixed(1);
  return 0;
}

export function isPassThroughNode(node: Node<ElectricalNodeData>): boolean {
  const { kind, catalogId } = node.data;
  if (
    kind === 'busbar' ||
    kind === 'fuse_box' ||
    kind === 'breaker' ||
    kind === 'transfer_switch'
  ) {
    return true;
  }
  return (
    catalogId === 'switch_12v' ||
    catalogId === 'mc4_splitter' ||
    catalogId === 'shunt_monitor'
  );
}

export function isConverterNode(node: Node<ElectricalNodeData>): boolean {
  return (
    node.data.catalogId === 'inverter_2500' ||
    node.data.catalogId === 'dcdc_step_12_19'
  );
}

export function getPortOnNode(
  node: Node<ElectricalNodeData> | undefined,
  handleId: string | null | undefined
): ElectricalPort | undefined {
  if (!node || !handleId) return undefined;
  return node.data.ports?.find((p) => p.id === handleId);
}

export function getEdgePolarity(
  edge: Edge<ElectricalEdgeData>,
  sourceNode?: Node<ElectricalNodeData>,
  targetNode?: Node<ElectricalNodeData>
): ElectricalPortPolarity {
  if (edge.data?.polarity) return edge.data.polarity;
  const sPort = getPortOnNode(sourceNode, edge.sourceHandle);
  if (sPort) return sPort.polarity;
  const tPort = getPortOnNode(targetNode, edge.targetHandle);
  if (tPort) return tPort.polarity;
  return 'pos';
}

export function getEdgeVoltage(
  polarity: ElectricalPortPolarity,
  sourceNode?: Node<ElectricalNodeData>,
  targetNode?: Node<ElectricalNodeData>,
  sourcePort?: ElectricalPort,
  targetPort?: ElectricalPort
): number {
  if (polarity === 'ac_phase' || polarity === 'ac_neutral' || polarity === 'ac_ground') {
    return 220;
  }
  if (sourceNode?.data.systemKey === 'solar_panels' || targetNode?.data.systemKey === 'solar_panels') {
    return Math.max(sourceNode?.data.voltage || 12.8, targetNode?.data.voltage || 12.8);
  }
  if (
    sourceNode?.data.catalogId === 'dcdc_step_12_19' &&
    sourcePort?.id.startsWith('out_')
  ) {
    return sourceNode.data.voltage || 19;
  }
  if (
    targetNode?.data.catalogId === 'dcdc_step_12_19' &&
    targetPort?.id.startsWith('out_')
  ) {
    return targetNode.data.voltage || 19;
  }
  if (
    sourceNode?.data.catalogId === 'dcdc_step_12_19' &&
    sourcePort?.id.startsWith('in_')
  ) {
    return 12.8;
  }
  if (
    targetNode?.data.catalogId === 'dcdc_step_12_19' &&
    targetPort?.id.startsWith('in_')
  ) {
    return 12.8;
  }
  if (sourceNode?.data.catalogId === 'inverter_2500' && sourcePort?.id.startsWith('dc_')) {
    return 12.8;
  }
  if (targetNode?.data.catalogId === 'inverter_2500' && targetPort?.id.startsWith('dc_')) {
    return 12.8;
  }
  if (sourceNode?.data.voltage && sourceNode.data.voltage !== 12.8 && !isPassThroughNode(sourceNode)) {
    return sourceNode.data.voltage;
  }
  if (targetNode?.data.voltage && targetNode.data.voltage !== 12.8 && !isPassThroughNode(targetNode)) {
    return targetNode.data.voltage;
  }
  return sourceNode?.data.voltage || targetNode?.data.voltage || 12.8;
}
