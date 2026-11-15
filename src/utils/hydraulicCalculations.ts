import type { Edge, Node } from '@xyflow/react';
import {
  FLUID_META,
  HydraulicEdgeData,
  HydraulicFluidType,
  HydraulicNodeData,
  HydraulicPipeMaterial,
  HydraulicPort,
  PIPE_MATERIAL_META
} from '../types/hydraulicPlanar';

export interface PipeDiameterSpec {
  mm: number;
  innerMm: number;
  inchLabel: string;
  maxLpmSafe: number;
}

export const PIPE_DIAMETER_TABLE: PipeDiameterSpec[] = [
  { mm: 8, innerMm: 5.5, inchLabel: '5/16"', maxLpmSafe: 3.5 },
  { mm: 10, innerMm: 7.0, inchLabel: '3/8"', maxLpmSafe: 6.0 },
  { mm: 12, innerMm: 9.5, inchLabel: '1/2"', maxLpmSafe: 12.0 },
  { mm: 16, innerMm: 13.0, inchLabel: '5/8"', maxLpmSafe: 22.0 },
  { mm: 20, innerMm: 16.0, inchLabel: '3/4"', maxLpmSafe: 32.0 },
  { mm: 25, innerMm: 21.0, inchLabel: '1"', maxLpmSafe: 52.0 },
  { mm: 32, innerMm: 28.0, inchLabel: '1 1/4"', maxLpmSafe: 85.0 },
  { mm: 40, innerMm: 35.0, inchLabel: '1 1/2"', maxLpmSafe: 130.0 },
  { mm: 50, innerMm: 44.0, inchLabel: '2"', maxLpmSafe: 200.0 }
];

export function getDiameterSpec(diameterMm: number): PipeDiameterSpec {
  const exact = PIPE_DIAMETER_TABLE.find((d) => d.mm === diameterMm);
  if (exact) return exact;
  return PIPE_DIAMETER_TABLE.reduce((prev, curr) =>
    Math.abs(curr.mm - diameterMm) < Math.abs(prev.mm - diameterMm) ? curr : prev
  );
}

export function formatDiameterLabel(diameterMm: number): string {
  const spec = getDiameterSpec(diameterMm);
  return `${spec.mm}mm (${spec.inchLabel})`;
}

export interface PipeCalculationInput {
  flowLpm: number;
  pressurePsi: number;
  lengthMeters: number;
  fluidType: HydraulicFluidType;
  manualDiameterMm?: number;
  isManualDiameter?: boolean;
}

export interface PipeCalculationResult {
  suggestedDiameterMm: number;
  diameterMm: number;
  velocityMs: number;
  headLossPsi: number;
  isOverloaded: boolean;
  warning?: string;
}

/**
 * Calcula o diâmetro sugerido, velocidade do fluido (m/s), perda de carga estimada (PSI)
 * e alertas de restrição hidráulica.
 */
export function calculatePipeSpecs(input: PipeCalculationInput): PipeCalculationResult {
  const flowLpm = Math.max(0, input.flowLpm || 0);
  const lengthMeters = Math.max(0.1, input.lengthMeters || 1);

  if (input.fluidType === 'control') {
    const diameterMm = input.isManualDiameter && input.manualDiameterMm ? input.manualDiameterMm : 8;
    return {
      suggestedDiameterMm: 8,
      diameterMm,
      velocityMs: 0,
      headLossPsi: 0,
      isOverloaded: false
    };
  }

  let suggestedDiameterMm = 12;
  if (input.fluidType === 'gray_drain') {
    suggestedDiameterMm = flowLpm > 35 ? 32 : 25;
  } else if (input.fluidType === 'vent') {
    suggestedDiameterMm = 10;
  } else {
    // Água Fria / Quente: mantém velocidade ideal <= 2.3 m/s (padrão mínimo 12mm para linhas principais)
    for (const spec of PIPE_DIAMETER_TABLE) {
      if (spec.mm < 10) continue;
      if (flowLpm <= 0.1) {
        suggestedDiameterMm = 12;
        break;
      }
      const areaM2 = Math.PI * Math.pow(spec.innerMm / 2000, 2);
      const qM3s = flowLpm / 60000;
      const v = qM3s / areaM2;
      if (v <= 2.3 && spec.maxLpmSafe >= flowLpm) {
        suggestedDiameterMm = spec.mm;
        break;
      }
      suggestedDiameterMm = spec.mm;
    }
  }

  const diameterMm =
    input.isManualDiameter && input.manualDiameterMm && input.manualDiameterMm > 0
      ? input.manualDiameterMm
      : suggestedDiameterMm;

  const spec = getDiameterSpec(diameterMm);
  const innerDiameterM = spec.innerMm / 1000;
  const areaM2 = Math.PI * Math.pow(innerDiameterM / 2, 2);
  const qM3s = flowLpm / 60000;
  const velocityMs = flowLpm > 0 ? +(qM3s / areaM2).toFixed(2) : 0;

  // Estimativa simplificada de perda de carga Darcy-Weisbach para tubulação lisa (f ~ 0.025)
  const rho = 1000;
  const f = 0.025;
  const headLossPa =
    flowLpm > 0 ? f * (lengthMeters / innerDiameterM) * ((rho * velocityMs * velocityMs) / 2) : 0;
  const headLossPsi = +(headLossPa * 0.000145038).toFixed(2);

  const warnings: string[] = [];
  if (input.fluidType !== 'gray_drain' && velocityMs > 2.5) {
    warnings.push(`Velocidade alta (${velocityMs} m/s > 2.5 m/s) no tubo de ${spec.mm}mm`);
  }
  if (flowLpm > spec.maxLpmSafe) {
    warnings.push(`Vazão (${flowLpm} L/min) excede faixa ideal de ${spec.mm}mm (${spec.maxLpmSafe} L/min)`);
  }
  if (input.fluidType === 'gray_drain' && diameterMm < 20 && flowLpm > 2) {
    warnings.push(`Dreno de água cinza recomendado com Ø25mm (1") ou maior`);
  }

  return {
    suggestedDiameterMm,
    diameterMm,
    velocityMs,
    headLossPsi,
    isOverloaded: warnings.length > 0,
    warning: warnings.length > 0 ? warnings.join(' • ') : undefined
  };
}

function getPortOnNode(
  node: Node<HydraulicNodeData> | undefined,
  handleId: string | null | undefined
): HydraulicPort | undefined {
  if (!node || !handleId) return undefined;
  return node.data.ports?.find((p) => p.id === handleId);
}

function isPassThroughHydraulicNode(node: Node<HydraulicNodeData>): boolean {
  const { kind, catalogId } = node.data;
  if (
    kind === 'tee_fitting' ||
    kind === 'selector_valve' ||
    kind === 'mixing_valve' ||
    kind === 'heat_exchanger'
  ) {
    return true;
  }
  return (
    catalogId === 'vf_elbow_90' ||
    catalogId === 'vf_ball_valve' ||
    catalogId === 'vf_check_valve' ||
    catalogId === 'vf_pressure_relief' ||
    catalogId === 'vf_water_filter' ||
    catalogId === 'vf_accumulator'
  );
}

function getEdgeFluidType(
  edge: Edge<HydraulicEdgeData>,
  sNode?: Node<HydraulicNodeData>,
  tNode?: Node<HydraulicNodeData>
): HydraulicFluidType {
  if (edge.data?.fluidType) return edge.data.fluidType;
  const sPort = getPortOnNode(sNode, edge.sourceHandle);
  if (sPort) return sPort.fluidType;
  const tPort = getPortOnNode(tNode, edge.targetHandle);
  if (tPort) return tPort.fluidType;
  return 'cold';
}

/**
 * Propaga vazão (L/min) e pressão (PSI) pelos ramais hidráulicos (conexões T, válvulas e trocador de calor).
 */
export function recalculateHydraulicEdges(
  nodes: Node<HydraulicNodeData>[],
  edges: Edge<HydraulicEdgeData>[]
): Edge<HydraulicEdgeData>[] {
  const nodeMap = new Map<string, Node<HydraulicNodeData>>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const edgeFlowMap = new Map<string, number>();
  const edgePressureMap = new Map<string, number>();

  // Passo 1: Inicializar vazões e pressões dos terminais (torneiras, duchas, cubas, bombas, entradas)
  for (const edge of edges) {
    const sNode = nodeMap.get(edge.source);
    const tNode = nodeMap.get(edge.target);
    const fluidType = getEdgeFluidType(edge, sNode, tNode);

    if (fluidType === 'control') {
      edgeFlowMap.set(edge.id, 0);
      edgePressureMap.set(edge.id, 0);
      continue;
    }

    if (edge.data?.isManualFlow) {
      edgeFlowMap.set(edge.id, edge.data.flowLpm || 0);
    } else {
      let initialFlow = 0;
      const sIsTerminal =
        sNode &&
        !isPassThroughHydraulicNode(sNode) &&
        sNode.data.kind !== 'tank';
      const tIsTerminal =
        tNode &&
        !isPassThroughHydraulicNode(tNode) &&
        tNode.data.kind !== 'tank';

      if (fluidType === 'vent') {
        initialFlow = 2.0;
      } else {
        if (sIsTerminal && sNode && sNode.data.isEnabled !== false) {
          initialFlow = Math.max(initialFlow, sNode.data.flowLpm || 0);
        }
        if (tIsTerminal && tNode && tNode.data.isEnabled !== false) {
          initialFlow = Math.max(initialFlow, tNode.data.flowLpm || 0);
        }
      }
      edgeFlowMap.set(edge.id, +initialFlow.toFixed(1));
    }

    const basePressure =
      fluidType === 'gray_drain' || fluidType === 'vent'
        ? 0
        : Math.max(sNode?.data.pressurePsi || 0, tNode?.data.pressurePsi || 0) || 35;
    edgePressureMap.set(edge.id, basePressure);
  }

  // Passo 2: Propagação através de conexões T, válvulas, filtros, trocador de calor
  for (let pass = 0; pass < 6; pass++) {
    for (const node of nodes) {
      if (!isPassThroughHydraulicNode(node)) continue;
      const connected = edges.filter((e) => e.source === node.id || e.target === node.id);
      if (connected.length < 2) continue;

      // Para Chiller / Trocador de Calor, separa canal água (water_in/out, cw_in/hw_out) vs circuito aquec. (wort_in/out, prim_in/prim_out)
      if (node.data.kind === 'heat_exchanger') {
        const potable = connected.filter((e) => {
          const pId = e.source === node.id ? e.sourceHandle : e.targetHandle;
          return pId === 'water_in' || pId === 'water_out' || pId === 'cw_in' || pId === 'hw_out';
        });
        const primary = connected.filter((e) => {
          const pId = e.source === node.id ? e.sourceHandle : e.targetHandle;
          return pId === 'wort_in' || pId === 'wort_out' || pId === 'prim_in' || pId === 'prim_out';
        });
        [potable, primary].forEach((grp) => {
          if (grp.length < 2) return;
          const maxFlow = Math.max(...grp.map((e) => edgeFlowMap.get(e.id) || 0));
          grp.forEach((e) => {
            if (!e.data?.isManualFlow && (edgeFlowMap.get(e.id) || 0) === 0 && maxFlow > 0) {
              edgeFlowMap.set(e.id, +maxFlow.toFixed(1));
            }
          });
        });
        continue;
      }

      // Para Misturadora Termostática: soma/propaga vazão da saída Mista para entradas Fria e Quente
      if (node.data.kind === 'mixing_valve') {
        const outEdge = connected.find((e) => {
          const pId = e.source === node.id ? e.sourceHandle : e.targetHandle;
          return pId === 'out_mix';
        });
        const inEdges = connected.filter((e) => e.id !== outEdge?.id);
        if (outEdge) {
          const outFlow = edgeFlowMap.get(outEdge.id) || 0;
          const inMax = Math.max(0, ...inEdges.map((e) => edgeFlowMap.get(e.id) || 0));
          if (!outEdge.data?.isManualFlow && outFlow === 0 && inMax > 0) {
            edgeFlowMap.set(outEdge.id, +inMax.toFixed(1));
          }
          if (outFlow > 0) {
            inEdges.forEach((ie) => {
              if (!ie.data?.isManualFlow && (edgeFlowMap.get(ie.id) || 0) === 0) {
                edgeFlowMap.set(ie.id, +(outFlow * 0.5).toFixed(1));
              }
            });
          }
        }
        continue;
      }

      // Pass-through 2 vias (registros, retenção, joelho, filtro, acumulador, alívio)
      if (connected.length === 2) {
        const [e1, e2] = connected;
        const f1 = edgeFlowMap.get(e1.id) || 0;
        const f2 = edgeFlowMap.get(e2.id) || 0;
        const flow = Math.max(f1, f2);
        if (flow > 0) {
          if (!e1.data?.isManualFlow && f1 === 0) edgeFlowMap.set(e1.id, +flow.toFixed(1));
          if (!e2.data?.isManualFlow && f2 === 0) edgeFlowMap.set(e2.id, +flow.toFixed(1));
        }
        const p = Math.max(edgePressureMap.get(e1.id) || 0, edgePressureMap.get(e2.id) || 0);
        edgePressureMap.set(e1.id, p);
        edgePressureMap.set(e2.id, p);
        continue;
      }

      // Conexão T / Divisor Y / Seletora 3 vias: propaga fluxo conhecido para ramos sem vazão definida
      const maxFlow = Math.max(...connected.map((e) => edgeFlowMap.get(e.id) || 0));
      const maxPress = Math.max(...connected.map((e) => edgePressureMap.get(e.id) || 0));
      connected.forEach((e) => {
        if (!e.data?.isManualFlow && (edgeFlowMap.get(e.id) || 0) === 0 && maxFlow > 0) {
          edgeFlowMap.set(e.id, +maxFlow.toFixed(1));
        }
        if ((edgePressureMap.get(e.id) || 0) === 0 && maxPress > 0) {
          edgePressureMap.set(e.id, maxPress);
        }
      });
    }
  }

  return edges.map((edge) => {
    const sNode = nodeMap.get(edge.source);
    const tNode = nodeMap.get(edge.target);
    const fluidType = getEdgeFluidType(edge, sNode, tNode);
    const meta = FLUID_META[fluidType];
    const color = edge.data?.color || meta.color;
    const material = edge.data?.material || meta.defaultMaterial;
    const lengthMeters = edge.data?.lengthMeters ?? 1.5;
    const flowLpm = +(edgeFlowMap.get(edge.id) ?? edge.data?.flowLpm ?? 0).toFixed(1);
    const pressurePsi = Math.round(edgePressureMap.get(edge.id) ?? edge.data?.pressurePsi ?? 35);

    const calc = calculatePipeSpecs({
      flowLpm,
      pressurePsi,
      lengthMeters,
      fluidType,
      manualDiameterMm: edge.data?.diameterMm,
      isManualDiameter: edge.data?.isManualDiameter
    });

    const newData: HydraulicEdgeData = {
      ...edge.data,
      fluidType,
      color,
      material,
      lengthMeters,
      flowLpm,
      pressurePsi,
      suggestedDiameterMm: calc.suggestedDiameterMm,
      diameterMm: calc.diameterMm,
      isManualDiameter: edge.data?.isManualDiameter ?? false,
      isManualFlow: edge.data?.isManualFlow ?? false,
      velocityMs: calc.velocityMs,
      headLossPsi: calc.headLossPsi,
      isOverloaded: calc.isOverloaded,
      warning: calc.warning
    };

    return {
      ...edge,
      data: newData
    };
  });
}

export interface PipeBomItem {
  fluidType: HydraulicFluidType;
  fluidLabel: string;
  color: string;
  material: HydraulicPipeMaterial;
  materialLabel: string;
  diameterMm: number;
  diameterLabel: string;
  totalMeters: number;
  segmentCount: number;
}

export interface HydraulicComponentBomItem {
  key: string;
  label: string;
  icon: string;
  detail: string;
  qty: number;
}

export interface HydraulicBomSummary {
  pipes: PipeBomItem[];
  totalPipeMeters: number;
  estimatedPushConnectors: number;
  components: HydraulicComponentBomItem[];
  overloadedPipesCount: number;
}

/**
 * Consolida a Lista de Compras Hidráulica (metragem de mangueiras/tubos por cor, material e bitola,
 * engates rápidos estimados e quantitativo de conexões T, válvulas e pontos).
 */
export function calculateHydraulicBom(
  nodes: Node<HydraulicNodeData>[],
  edges: Edge<HydraulicEdgeData>[]
): HydraulicBomSummary {
  const pipeMap = new Map<string, PipeBomItem>();
  let totalPipeMeters = 0;
  let physicalSegments = 0;
  let overloadedPipesCount = 0;

  for (const edge of edges) {
    const d = edge.data;
    if (!d) continue;
    if (d.isOverloaded) overloadedPipesCount++;
    if (d.fluidType === 'control') continue;

    physicalSegments++;
    const length = d.lengthMeters || 1.5;
    totalPipeMeters += length;
    const key = `${d.fluidType}_${d.material}_${d.diameterMm}`;
    const existing = pipeMap.get(key);
    if (existing) {
      existing.totalMeters = +(existing.totalMeters + length).toFixed(2);
      existing.segmentCount += 1;
    } else {
      pipeMap.set(key, {
        fluidType: d.fluidType,
        fluidLabel: FLUID_META[d.fluidType]?.label || d.fluidType,
        color: d.color || FLUID_META[d.fluidType]?.color || '#2563eb',
        material: d.material,
        materialLabel: PIPE_MATERIAL_META[d.material]?.shortLabel || d.material,
        diameterMm: d.diameterMm,
        diameterLabel: formatDiameterLabel(d.diameterMm),
        totalMeters: +length.toFixed(2),
        segmentCount: 1
      });
    }
  }

  const compMap = new Map<string, HydraulicComponentBomItem>();
  for (const node of nodes) {
    const d = node.data;
    const detail =
      d.capacityLiters > 0
        ? `${d.capacityLiters} L`
        : d.flowLpm > 0
          ? `${d.flowLpm} L/min · Ø${d.defaultDiameterMm}mm`
          : `Ø${d.defaultDiameterMm}mm`;
    const key = `${d.catalogId}_${detail}`;
    const existing = compMap.get(key);
    if (existing) {
      existing.qty += 1;
    } else {
      compMap.set(key, {
        key,
        label: d.label,
        icon: d.icon,
        detail,
        qty: 1
      });
    }
  }

  return {
    pipes: Array.from(pipeMap.values()).sort((a, b) => b.diameterMm - a.diameterMm),
    totalPipeMeters: +totalPipeMeters.toFixed(1),
    estimatedPushConnectors: physicalSegments * 2,
    components: Array.from(compMap.values()),
    overloadedPipesCount
  };
}
