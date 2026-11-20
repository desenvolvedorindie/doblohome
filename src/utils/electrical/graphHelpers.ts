import type { Edge, Node } from '@xyflow/react';
import {
  ElectricalConnectorType,
  ElectricalEdgeData,
  ElectricalNodeData,
  ElectricalPort,
  ElectricalPortPolarity,
  POLARITY_META
} from '../../types/electricalPlanar';

export interface ElectricalConnectionValidation {
  valid: boolean;
  reason?: string;
  resolvedPolarity?: ElectricalPortPolarity;
}

/**
 * Verifica se duas polaridades de terminais elétricos podem ser conectadas.
 * - Polaridades idênticas são sempre compatíveis (+ com +, - com -, Fase com Fase, etc.).
 * - Terminais de sinal (ex.: + Sensor V do Shunt, Sinal D+ do B2B) podem se conectar ao Positivo (+ DC).
 * - Qualquer outra combinação (ex.: + com -, DC com AC, Fase com Neutro/Terra) é proibida.
 */
export function arePolaritiesCompatible(
  sourcePolarity: ElectricalPortPolarity,
  targetPolarity: ElectricalPortPolarity
): boolean {
  if (sourcePolarity === targetPolarity) return true;
  if (
    (sourcePolarity === 'pos' && targetPolarity === 'signal') ||
    (sourcePolarity === 'signal' && targetPolarity === 'pos')
  ) {
    return true;
  }
  return false;
}

/**
 * Valida uma conexão entre dois terminais de nós no diagrama elétrico 2D.
 */
export function validateElectricalConnection(
  connection: {
    source?: string | null;
    target?: string | null;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  },
  nodes: Node<ElectricalNodeData>[]
): ElectricalConnectionValidation {
  if (!connection.source || !connection.target) {
    return { valid: false, reason: 'Conexão incompleta.' };
  }

  if (connection.source === connection.target) {
    return { valid: false, reason: 'Não é possível conectar um componente a ele mesmo.' };
  }

  const sNode = nodes.find((n) => n.id === connection.source);
  const tNode = nodes.find((n) => n.id === connection.target);
  if (!sNode || !tNode) {
    return { valid: false, reason: 'Componente não encontrado.' };
  }

  const sPort = getPortOnNode(sNode, connection.sourceHandle);
  const tPort = getPortOnNode(tNode, connection.targetHandle);
  if (!sPort || !tPort) {
    return { valid: false, reason: 'Terminal de conexão inválido.' };
  }

  if (!arePolaritiesCompatible(sPort.polarity, tPort.polarity)) {
    const sLabel = POLARITY_META[sPort.polarity]?.label || sPort.polarity;
    const tLabel = POLARITY_META[tPort.polarity]?.label || tPort.polarity;
    return {
      valid: false,
      reason: `Conexão incompatível: ${sLabel} não pode ser ligado em ${tLabel}.`
    };
  }

  const resolvedPolarity: ElectricalPortPolarity =
    sPort.polarity === 'signal' || tPort.polarity === 'signal'
      ? 'signal'
      : sPort.polarity;

  return { valid: true, resolvedPolarity };
}

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
    kind === 'transfer_switch' ||
    kind === 'connector'
  ) {
    return true;
  }
  return (
    catalogId === 'switch_12v' ||
    catalogId === 'mc4_splitter' ||
    catalogId === 'shunt_monitor'
  );
}

/**
 * Sugere o tipo de conector/terminal elétrico ideal para a ponta do cabo conectada a um nó/porta.
 */
export function suggestConnectorForPort(
  node: Node<ElectricalNodeData> | undefined,
  port: ElectricalPort | undefined
): ElectricalConnectorType {
  if (port?.connectorType) return port.connectorType;
  if (!node) return 'ferrule';

  const { kind, catalogId, connectorType, voltage } = node.data;
  if (kind === 'connector' && connectorType) return connectorType;

  if (catalogId === 'sys_solar_panels' || catalogId === 'mc4_splitter') {
    return 'mc4';
  }
  if (catalogId === 'sys_battery' || catalogId === 'shunt_monitor') {
    return port?.polarity === 'signal' ? 'ring_m5' : 'ring_m8';
  }
  if (catalogId === 'inverter_2500') {
    return port?.id.startsWith('dc_') ? 'ring_m8' : 'ferrule';
  }
  if (kind === 'busbar') {
    return voltage >= 110 ? 'ferrule' : 'ring_m6';
  }
  if (kind === 'fuse_box') {
    if (port?.id === 'in_pos' || port?.id === 'in_neg') return 'ring_m6';
    return 'spade';
  }
  if (catalogId === 'switch_12v' || catalogId === 'outlet_12v_usb') {
    return 'faston';
  }
  if (catalogId === 'sys_alternator') {
    return port?.polarity === 'signal' ? 'faston' : 'ring_m8';
  }
  if (
    kind === 'breaker' ||
    kind === 'transfer_switch' ||
    catalogId === 'sys_mppt' ||
    catalogId === 'sys_b2b' ||
    catalogId === 'sys_usina' ||
    catalogId === 'outlet_ac_ext' ||
    catalogId === 'dcdc_step_12_19'
  ) {
    return 'ferrule';
  }
  if (port?.polarity === 'signal') return 'faston';
  return 'ferrule';
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
