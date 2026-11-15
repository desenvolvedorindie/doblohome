import type { Edge, Node } from '@xyflow/react';
import {
  ElectricalEdgeData,
  ElectricalNodeData,
  ElectricalPort,
  POLARITY_META,
  suggestBladeFuseAmps
} from '../../types/electricalPlanar';
import { calculateWireSpecs } from './wireSizing';
import {
  getEdgePolarity,
  getEdgeVoltage,
  getNodeNominalCurrent,
  getPolarityGroup,
  getPortOnNode,
  isConverterNode,
  isPassThroughNode
} from './graphHelpers';

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
