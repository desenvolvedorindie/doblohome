import type { Edge, Node } from '@xyflow/react';
import {
  ElectricalEdgeData,
  ElectricalNodeData,
  ElectricalPort,
  ElectricalPortPolarity,
  POLARITY_META,
  getFuseColorSpec,
  suggestBladeFuseAmps
} from '../types/electricalPlanar';

export interface WireGaugeSpec {
  mm2: number;
  maxAmps: number;
}

/** Tabela de bitolas comerciais de cabo de cobre flexível (automotivo/solar) */
export const COPPER_WIRE_TABLE: WireGaugeSpec[] = [
  { mm2: 1.0, maxAmps: 11 },
  { mm2: 1.5, maxAmps: 15 },
  { mm2: 2.5, maxAmps: 24 },
  { mm2: 4, maxAmps: 32 },
  { mm2: 6, maxAmps: 41 },
  { mm2: 10, maxAmps: 57 },
  { mm2: 16, maxAmps: 76 },
  { mm2: 25, maxAmps: 101 },
  { mm2: 35, maxAmps: 125 },
  { mm2: 50, maxAmps: 151 },
  { mm2: 70, maxAmps: 192 },
  { mm2: 95, maxAmps: 232 }
];

export const STANDARD_PROTECTION_RATINGS = [
  5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 100, 125, 150, 200, 250, 300
];

const COPPER_RESISTIVITY = 0.0172; // Ohm * mm² / m

export function getWireMaxAmps(gaugeMm2: number): number {
  const exact = COPPER_WIRE_TABLE.find((w) => w.mm2 === gaugeMm2);
  if (exact) return exact.maxAmps;
  const closest = COPPER_WIRE_TABLE.reduce((prev, curr) =>
    Math.abs(curr.mm2 - gaugeMm2) < Math.abs(prev.mm2 - gaugeMm2) ? curr : prev
  );
  return closest.maxAmps;
}

export function suggestProtectionRating(currentAmps: number): number {
  if (currentAmps <= 0) return 5;
  const target = currentAmps * 1.25;
  for (const rating of STANDARD_PROTECTION_RATINGS) {
    if (rating >= target) return rating;
  }
  return STANDARD_PROTECTION_RATINGS[STANDARD_PROTECTION_RATINGS.length - 1];
}

export interface WireCalculationInput {
  currentAmps: number;
  voltage: number;
  lengthMeters: number;
  polarity: ElectricalPortPolarity;
  manualGaugeMm2?: number;
  isManualGauge?: boolean;
  connectedMaxAmps?: number;
  connectedFuseAmps?: number;
}

export interface WireCalculationResult {
  suggestedGaugeMm2: number;
  gaugeMm2: number;
  suggestedProtectionAmps: number;
  voltageDropVolts: number;
  voltageDropPercent: number;
  isOverloaded: boolean;
  overloadWarning?: string;
}

/**
 * Calcula a bitola ideal, queda de tensão (ida + volta) e alertas de sobrecarga.
 */
export function calculateWireSpecs(input: WireCalculationInput): WireCalculationResult {
  const amps = Math.max(0, input.currentAmps || 0);
  const voltage = Math.max(1, input.voltage || 12.8);
  const length = Math.max(0.1, input.lengthMeters || 1);

  // Sinal D+ não carrega potência relevante; sempre 1.0 mm² ou 1.5 mm²
  if (input.polarity === 'signal') {
    const gauge = input.isManualGauge && input.manualGaugeMm2 ? input.manualGaugeMm2 : 1.0;
    return {
      suggestedGaugeMm2: 1.0,
      gaugeMm2: gauge,
      suggestedProtectionAmps: 5,
      voltageDropVolts: 0,
      voltageDropPercent: 0,
      isOverloaded: false
    };
  }

  // Queda de tensão considerando circuito ida e volta (2 * L) para dimensionamento seguro
  const maxAllowedDropPct = voltage >= 100 ? 4.0 : 3.0;

  let suggestedGaugeMm2 = COPPER_WIRE_TABLE[0].mm2;
  for (const spec of COPPER_WIRE_TABLE) {
    if (amps <= 0.01) {
      suggestedGaugeMm2 = 2.5;
      break;
    }
    const dropVolts = (2 * COPPER_RESISTIVITY * length * amps) / spec.mm2;
    const dropPct = (dropVolts / voltage) * 100;
    if (spec.maxAmps >= amps && dropPct <= maxAllowedDropPct) {
      suggestedGaugeMm2 = spec.mm2;
      break;
    }
    suggestedGaugeMm2 = spec.mm2;
  }

  const gaugeMm2 =
    input.isManualGauge && input.manualGaugeMm2 && input.manualGaugeMm2 > 0
      ? input.manualGaugeMm2
      : suggestedGaugeMm2;

  const voltageDropVolts = +((2 * COPPER_RESISTIVITY * length * amps) / gaugeMm2).toFixed(2);
  const voltageDropPercent = +((voltageDropVolts / voltage) * 100).toFixed(2);
  const suggestedProtectionAmps = suggestProtectionRating(amps);

  const wireMaxAmps = getWireMaxAmps(gaugeMm2);
  const warnings: string[] = [];

  if (amps > wireMaxAmps) {
    warnings.push(`Corrente (${amps.toFixed(1)}A) excede limite do cabo ${gaugeMm2}mm² (${wireMaxAmps}A)`);
  }
  if (voltageDropPercent > 5.0 && amps > 0.5) {
    warnings.push(`Queda de tensão alta (${voltageDropPercent}% > 5%)`);
  }
  if (input.connectedFuseAmps !== undefined && amps > input.connectedFuseAmps) {
    warnings.push(`Carga (${amps.toFixed(1)}A) excede fusível de ${input.connectedFuseAmps}A`);
  }
  if (input.connectedMaxAmps !== undefined && amps > input.connectedMaxAmps) {
    warnings.push(`Corrente (${amps.toFixed(1)}A) excede capacidade da porta/disjuntor (${input.connectedMaxAmps}A)`);
  }

  return {
    suggestedGaugeMm2,
    gaugeMm2,
    suggestedProtectionAmps,
    voltageDropVolts,
    voltageDropPercent,
    isOverloaded: warnings.length > 0,
    overloadWarning: warnings.length > 0 ? warnings.join(' • ') : undefined
  };
}

function getPolarityGroup(polarity: ElectricalPortPolarity): 'pos' | 'neg' | 'ac_p' | 'ac_n' | 'ac_g' | 'sig' {
  if (polarity === 'pos') return 'pos';
  if (polarity === 'neg') return 'neg';
  if (polarity === 'ac_phase') return 'ac_p';
  if (polarity === 'ac_neutral') return 'ac_n';
  if (polarity === 'ac_ground') return 'ac_g';
  return 'sig';
}

function getNodeNominalCurrent(node: Node<ElectricalNodeData>): number {
  const d = node.data;
  if (d.isEnabled === false) return 0;
  if (d.amps > 0) return +d.amps.toFixed(1);
  if (d.watts > 0 && d.voltage > 0) return +(d.watts / d.voltage).toFixed(1);
  return 0;
}

function isPassThroughNode(node: Node<ElectricalNodeData>): boolean {
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

function isConverterNode(node: Node<ElectricalNodeData>): boolean {
  return (
    node.data.catalogId === 'inverter_2500' ||
    node.data.catalogId === 'dcdc_step_12_19'
  );
}

function getPortOnNode(
  node: Node<ElectricalNodeData> | undefined,
  handleId: string | null | undefined
): ElectricalPort | undefined {
  if (!node || !handleId) return undefined;
  return node.data.ports?.find((p) => p.id === handleId);
}

function getEdgePolarity(
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

function getEdgeVoltage(
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

/**
 * Propaga as correntes dos equipamentos e cargas através de disjuntores, barramentos e caixas de fusíveis,
 * recalculando bitolas, quedas de tensão e alertas em todas as arestas do diagrama.
 */
export function recalculateDiagramEdges(
  nodes: Node<ElectricalNodeData>[],
  edges: Edge<ElectricalEdgeData>[]
): Edge<ElectricalEdgeData>[] {
  const nodeMap = new Map<string, Node<ElectricalNodeData>>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Mapa auxiliar de distância em saltos até a bateria (para orientar fluxo em barramentos)
  const batteryIds = nodes
    .filter((n) => n.data.systemKey === 'battery')
    .map((n) => n.id);

  const distToBattery = new Map<string, number>();
  const queue: string[] = [];
  batteryIds.forEach((id) => {
    distToBattery.set(id, 0);
    queue.push(id);
  });

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const d = distToBattery.get(curr)!;
    for (const e of edges) {
      const neighbor = e.source === curr ? e.target : e.target === curr ? e.source : null;
      if (neighbor && !distToBattery.has(neighbor)) {
        distToBattery.set(neighbor, d + 1);
        queue.push(neighbor);
      }
    }
  }

  // Armazena corrente calculada por edge id
  const edgeCurrentMap = new Map<string, number>();

  // Passo 1: Inicializar arestas ligadas diretamente a fontes/cargas terminais ou manuais
  for (const edge of edges) {
    if (edge.data?.isManualAmps) {
      edgeCurrentMap.set(edge.id, edge.data.currentAmps || 0);
      continue;
    }

    const sNode = nodeMap.get(edge.source);
    const tNode = nodeMap.get(edge.target);
    const sPort = getPortOnNode(sNode, edge.sourceHandle);
    const tPort = getPortOnNode(tNode, edge.targetHandle);
    const polarity = getEdgePolarity(edge, sNode, tNode);

    if (polarity === 'signal') {
      edgeCurrentMap.set(edge.id, 0.2);
      continue;
    }

    let initialAmps = 0;

    // Caso 1: Bateria é um hub central (não impõe 200A do BMS nos ramais)
    const sIsTerminal = sNode && !isPassThroughNode(sNode) && !isConverterNode(sNode) && sNode.data.systemKey !== 'battery';
    const tIsTerminal = tNode && !isPassThroughNode(tNode) && !isConverterNode(tNode) && tNode.data.systemKey !== 'battery';

    if (sIsTerminal && sNode) {
      // Caso especial: Usina tem lado AC (220V) e lado DC (12V)
      if (sNode.data.systemKey === 'usina' && (polarity === 'ac_phase' || polarity === 'ac_neutral')) {
        const dcWatts = sNode.data.watts || (sNode.data.amps * 14.4);
        initialAmps = +(dcWatts / 220).toFixed(1);
      } else if (sNode.data.systemKey === 'mppt' && sPort?.id.startsWith('pv_')) {
        // Lado solar do MPPT espera a corrente das placas; se não houver placas, 0
        initialAmps = 0;
      } else {
        initialAmps = getNodeNominalCurrent(sNode);
      }
    }

    if (tIsTerminal && tNode) {
      let tAmps = 0;
      if (tNode.data.systemKey === 'usina' && (polarity === 'ac_phase' || polarity === 'ac_neutral')) {
        const dcWatts = tNode.data.watts || (tNode.data.amps * 14.4);
        tAmps = +(dcWatts / 220).toFixed(1);
      } else if (tNode.data.systemKey === 'mppt' && tPort?.id.startsWith('pv_')) {
        tAmps = 0;
      } else {
        tAmps = getNodeNominalCurrent(tNode);
      }
      initialAmps = Math.max(initialAmps, tAmps);
    }

    edgeCurrentMap.set(edge.id, initialAmps);
  }

  // Passo 2: Propagação iterativa através de conversores, caixas de fusíveis, disjuntores, interruptores e barramentos
  for (let pass = 0; pass < 6; pass++) {
    for (const node of nodes) {
      const connectedEdges = edges.filter((e) => e.source === node.id || e.target === node.id);
      if (connectedEdges.length === 0) continue;

      // A) Conversores (Inversor e DC-DC 12->19V): somar saída e refletir na entrada DC
      if (isConverterNode(node)) {
        const isInverter = node.data.catalogId === 'inverter_2500';
        const outputEdges = connectedEdges.filter((e) => {
          const portId = e.source === node.id ? e.sourceHandle : e.targetHandle;
          return isInverter
            ? portId === 'ac_phase'
            : portId?.startsWith('out_pos');
        });
        const inputEdges = connectedEdges.filter((e) => {
          const portId = e.source === node.id ? e.sourceHandle : e.targetHandle;
          return isInverter
            ? portId === 'dc_pos' || portId === 'dc_neg'
            : portId?.startsWith('in_');
        });

        let outWatts = 0;
        const outVoltage = isInverter ? 220 : (node.data.voltage || 19);
        outputEdges.forEach((e) => {
          outWatts += (edgeCurrentMap.get(e.id) || 0) * outVoltage;
        });

        // Se não há carga ligada na saída ainda, usa a potência/corrente nominal cadastrada no conversor
        const targetDcAmps =
          outWatts > 0
            ? +(outWatts / (12.8 * 0.9)).toFixed(1)
            : getNodeNominalCurrent(node);

        inputEdges.forEach((e) => {
          if (!e.data?.isManualAmps) {
            edgeCurrentMap.set(e.id, targetDcAmps);
          }
        });
        continue;
      }

      if (!isPassThroughNode(node)) continue;

      // B) Caixa de Fusíveis: entrada + geral = soma das saídas F1..FN; entrada - = soma das saídas -N1..NN
      if (node.data.kind === 'fuse_box') {
        const posOutEdges = connectedEdges.filter((e) => {
          const portId = e.source === node.id ? e.sourceHandle : e.targetHandle;
          return portId?.startsWith('fuse_');
        });
        const negOutEdges = connectedEdges.filter((e) => {
          const portId = e.source === node.id ? e.sourceHandle : e.targetHandle;
          return portId?.startsWith('neg_');
        });
        const inPosEdge = connectedEdges.find((e) => {
          const portId = e.source === node.id ? e.sourceHandle : e.targetHandle;
          return portId === 'in_pos';
        });
        const inNegEdge = connectedEdges.find((e) => {
          const portId = e.source === node.id ? e.sourceHandle : e.targetHandle;
          return portId === 'in_neg';
        });

        const totalPosOut = posOutEdges.reduce((s, e) => s + (edgeCurrentMap.get(e.id) || 0), 0);
        const totalNegOut = negOutEdges.reduce((s, e) => s + (edgeCurrentMap.get(e.id) || 0), 0);

        if (inPosEdge && !inPosEdge.data?.isManualAmps) {
          edgeCurrentMap.set(inPosEdge.id, +totalPosOut.toFixed(1));
        }
        if (inNegEdge && !inNegEdge.data?.isManualAmps) {
          edgeCurrentMap.set(inNegEdge.id, +(totalNegOut > 0 ? totalNegOut : totalPosOut).toFixed(1));
        }
        continue;
      }

      // C) Disjuntores, Interruptores, Shunt, Chave Comutadora (agrupado por polaridade)
      if (
        node.data.kind === 'breaker' ||
        node.data.kind === 'transfer_switch' ||
        node.data.catalogId === 'switch_12v' ||
        node.data.catalogId === 'shunt_monitor'
      ) {
        const groups = new Map<string, Edge<ElectricalEdgeData>[]>();
        connectedEdges.forEach((e) => {
          const pol = getEdgePolarity(e, nodeMap.get(e.source), nodeMap.get(e.target));
          const grp = getPolarityGroup(pol);
          if (!groups.has(grp)) groups.set(grp, []);
          groups.get(grp)!.push(e);
        });

        groups.forEach((grpEdges) => {
          if (grpEdges.length < 2) return;
          // Identifica lados in vs out pela porta
          const inEdges = grpEdges.filter((e) => {
            const p = getPortOnNode(node, e.source === node.id ? e.sourceHandle : e.targetHandle);
            return p?.direction === 'in' || p?.id.startsWith('bat_');
          });
          const outEdges = grpEdges.filter((e) => {
            const p = getPortOnNode(node, e.source === node.id ? e.sourceHandle : e.targetHandle);
            return p?.direction === 'out' || p?.id.startsWith('load_');
          });

          if (inEdges.length > 0 && outEdges.length > 0) {
            const sumIn = inEdges.reduce((s, e) => s + (edgeCurrentMap.get(e.id) || 0), 0);
            const sumOut = outEdges.reduce((s, e) => s + (edgeCurrentMap.get(e.id) || 0), 0);
            const flow = Math.max(sumIn, sumOut);
            if (flow > 0) {
              inEdges.forEach((e) => {
                if (!e.data?.isManualAmps && (edgeCurrentMap.get(e.id) || 0) < flow) {
                  edgeCurrentMap.set(e.id, +flow.toFixed(1));
                }
              });
              outEdges.forEach((e) => {
                if (!e.data?.isManualAmps && (edgeCurrentMap.get(e.id) || 0) < flow) {
                  edgeCurrentMap.set(e.id, +flow.toFixed(1));
                }
              });
            }
          } else {
            const maxVal = Math.max(...grpEdges.map((e) => edgeCurrentMap.get(e.id) || 0));
            grpEdges.forEach((e) => {
              if (!e.data?.isManualAmps && (edgeCurrentMap.get(e.id) || 0) === 0 && maxVal > 0) {
                edgeCurrentMap.set(e.id, +maxVal.toFixed(1));
              }
            });
          }
        });
        continue;
      }

      // D) Divisor MC4 Ramo Y: soma todas as entradas e coloca na saída
      if (node.data.catalogId === 'mc4_splitter') {
        const inEdges = connectedEdges.filter((e) => {
          const p = getPortOnNode(node, e.source === node.id ? e.sourceHandle : e.targetHandle);
          return p?.direction === 'in';
        });
        const outEdges = connectedEdges.filter((e) => {
          const p = getPortOnNode(node, e.source === node.id ? e.sourceHandle : e.targetHandle);
          return p?.direction === 'out';
        });
        const totalIn = inEdges.reduce((s, e) => s + (edgeCurrentMap.get(e.id) || 0), 0);
        if (totalIn > 0) {
          outEdges.forEach((e) => {
            if (!e.data?.isManualAmps) {
              edgeCurrentMap.set(e.id, +totalIn.toFixed(1));
            }
          });
        }
        continue;
      }

      // E) Barramento (+/- / AC): o cabo tronco voltado para a Bateria carrega a soma dos outros ramais
      if (node.data.kind === 'busbar') {
        const myDist = distToBattery.get(node.id) ?? 999;
        const groups = new Map<string, Edge<ElectricalEdgeData>[]>();
        connectedEdges.forEach((e) => {
          const pol = getEdgePolarity(e, nodeMap.get(e.source), nodeMap.get(e.target));
          const grp = getPolarityGroup(pol);
          if (!groups.has(grp)) groups.set(grp, []);
          groups.get(grp)!.push(e);
        });

        groups.forEach((grpEdges) => {
          if (grpEdges.length < 2) return;
          // Procura o cabo tronco mais próximo da bateria (ou marcado como entrada)
          const trunkCandidates = grpEdges.filter((e) => {
            const otherId = e.source === node.id ? e.target : e.source;
            const otherDist = distToBattery.get(otherId) ?? 999;
            return otherDist < myDist;
          });

          const trunkEdge =
            trunkCandidates[0] ||
            grpEdges.find((e) => {
              const other = nodeMap.get(e.source === node.id ? e.target : e.source);
              return other?.data.systemKey === 'battery';
            });

          if (trunkEdge && !trunkEdge.data?.isManualAmps) {
            let loadSum = 0;
            let sourceSum = 0;
            grpEdges.forEach((e) => {
              if (e.id === trunkEdge.id) return;
              const other = nodeMap.get(e.source === node.id ? e.target : e.source);
              const val = edgeCurrentMap.get(e.id) || 0;
              if (other?.data.isSource && !isConverterNode(other)) {
                sourceSum += val;
              } else {
                loadSum += val;
              }
            });
            const trunkAmps = Math.max(loadSum, sourceSum);
            if (trunkAmps > 0) {
              edgeCurrentMap.set(trunkEdge.id, +trunkAmps.toFixed(1));
            }
          }
        });
      }
    }
  }

  const resolvePortLimits = (
    node: Node<ElectricalNodeData> | undefined,
    port: ElectricalPort | undefined
  ): { fuseAmps?: number; maxAmps?: number } => {
    if (!node || !port) return {};
    if (node.data.kind === 'fuse_box' && port.id.startsWith('fuse_')) {
      if (port.isManualFuse && port.fuseAmps) {
        return { fuseAmps: port.fuseAmps, maxAmps: port.fuseAmps };
      }
      const wayAmps = edges
        .filter(
          (e) =>
            (e.source === node.id && e.sourceHandle === port.id) ||
            (e.target === node.id && e.targetHandle === port.id)
        )
        .reduce((sum, e) => sum + (edgeCurrentMap.get(e.id) ?? 0), 0);
      const autoFuse = suggestBladeFuseAmps(wayAmps);
      return { fuseAmps: autoFuse, maxAmps: autoFuse };
    }
    return { fuseAmps: port.fuseAmps, maxAmps: port.maxAmps };
  };

  // Passo 3: Monta os dados finais calculados de cada Edge
  return edges.map((edge) => {
    const sNode = nodeMap.get(edge.source);
    const tNode = nodeMap.get(edge.target);
    const sPort = getPortOnNode(sNode, edge.sourceHandle);
    const tPort = getPortOnNode(tNode, edge.targetHandle);

    const polarity = getEdgePolarity(edge, sNode, tNode);
    const color = edge.data?.color || POLARITY_META[polarity].color;
    const lengthMeters = edge.data?.lengthMeters ?? 1.5;
    const currentAmps = +(edgeCurrentMap.get(edge.id) ?? edge.data?.currentAmps ?? 0).toFixed(1);
    const voltage = getEdgeVoltage(polarity, sNode, tNode, sPort, tPort);

    const sLimits = resolvePortLimits(sNode, sPort);
    const tLimits = resolvePortLimits(tNode, tPort);
    const connectedFuseAmps = sLimits.fuseAmps ?? tLimits.fuseAmps;
    const portMax = [sLimits.maxAmps, tLimits.maxAmps].filter(
      (v): v is number => typeof v === 'number' && v > 0
    );
    const connectedMaxAmps = portMax.length > 0 ? Math.min(...portMax) : undefined;

    const calc = calculateWireSpecs({
      currentAmps,
      voltage,
      lengthMeters,
      polarity,
      manualGaugeMm2: edge.data?.gaugeMm2,
      isManualGauge: edge.data?.isManualGauge,
      connectedFuseAmps,
      connectedMaxAmps
    });

    const newData: ElectricalEdgeData = {
      ...edge.data,
      polarity,
      color,
      lengthMeters,
      currentAmps,
      voltage,
      suggestedGaugeMm2: calc.suggestedGaugeMm2,
      gaugeMm2: calc.gaugeMm2,
      isManualGauge: edge.data?.isManualGauge ?? false,
      isManualAmps: edge.data?.isManualAmps ?? false,
      suggestedProtectionAmps: calc.suggestedProtectionAmps,
      voltageDropVolts: calc.voltageDropVolts,
      voltageDropPercent: calc.voltageDropPercent,
      isOverloaded: calc.isOverloaded,
      overloadWarning: calc.overloadWarning
    };

    return {
      ...edge,
      data: newData
    };
  });
}

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
