import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow
} from '@xyflow/react';
import { useSolar } from '../../../context/SolarContext';
import {
  FLUID_META,
  HydraulicCatalogTemplate,
  HydraulicEdgeData,
  HydraulicEdgeStyle,
  HydraulicNodeData
} from '../../../types/hydraulicPlanar';
import { hydraulicTemplateToNodeData } from '../../../utils/hydraulicCatalog';
import {
  calculateHydraulicBom,
  recalculateHydraulicEdges
} from '../../../utils/hydraulicCalculations';
import { useHydraulicPlanarPersistence } from './useHydraulicPlanarPersistence';

export function useHydraulicPlanarState() {
  const { flashToast } = useSolar();
  const { screenToFlowPosition, fitView } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [rightTab, setRightTab] = useState<'inspector' | 'bom'>('inspector');

  const [nodes, setNodes] = useState<Node<HydraulicNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<HydraulicEdgeData>[]>([]);
  const [edgeStyle, setEdgeStyle] = useState<HydraulicEdgeStyle>('smoothstep');
  const [customTemplates, setCustomTemplates] = useState<HydraulicCatalogTemplate[]>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useHydraulicPlanarPersistence({
    nodes,
    setNodes,
    edges,
    setEdges,
    edgeStyle,
    setEdgeStyle,
    customTemplates,
    setCustomTemplates
  });

  const onNodesChange = useCallback((changes: NodeChange<Node<HydraulicNodeData>>[]) => {
    setNodes((nds) => {
      const updated = applyNodeChanges(changes, nds);
      if (changes.some((c) => c.type === 'remove')) {
        const remainingIds = new Set(updated.map((n) => n.id));
        setEdges((eds) =>
          recalculateHydraulicEdges(
            updated,
            eds.filter((ed) => remainingIds.has(ed.source) && remainingIds.has(ed.target))
          )
        );
      }
      return updated;
    });
  }, []);

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge<HydraulicEdgeData>>[]) => {
      setEdges((eds) => {
        const updated = applyEdgeChanges(changes, eds);
        if (changes.some((c) => c.type === 'remove')) {
          return recalculateHydraulicEdges(nodes, updated);
        }
        return updated;
      });
    },
    [nodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const sNode = nodes.find((n) => n.id === connection.source);
      const tNode = nodes.find((n) => n.id === connection.target);
      const sPort = sNode?.data.ports.find((p) => p.id === connection.sourceHandle);
      const tPort = tNode?.data.ports.find((p) => p.id === connection.targetHandle);

      const fluidType = sPort?.fluidType || tPort?.fluidType || 'cold';
      const meta = FLUID_META[fluidType] || FLUID_META.cold;
      const newId = `hedge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const newEdge: Edge<HydraulicEdgeData & { edgeStyle?: HydraulicEdgeStyle }> = {
        id: newId,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'hydraulicPipe',
        data: {
          fluidType,
          color: meta.color,
          material: meta.defaultMaterial,
          lengthMeters: 1.5,
          flowLpm: 0,
          pressurePsi: fluidType === 'gray_drain' || fluidType === 'vent' ? 0 : 35,
          suggestedDiameterMm: meta.defaultDiameterMm,
          diameterMm: meta.defaultDiameterMm,
          velocityMs: 0,
          headLossPsi: 0,
          isOverloaded: false,
          edgeStyle
        }
      };

      setEdges((eds) => {
        const added = addEdge(newEdge, eds);
        return recalculateHydraulicEdges(nodes, added);
      });
      setSelectedEdgeId(newId);
      setSelectedNodeId(null);
    },
    [nodes, edgeStyle]
  );

  const insertTemplateAt = useCallback(
    (template: HydraulicCatalogTemplate, flowPos: { x: number; y: number }) => {
      const id = `hnode_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newNode: Node<HydraulicNodeData> = {
        id,
        type: 'hydraulicSchematic',
        position: flowPos,
        data: hydraulicTemplateToNodeData(template)
      };
      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(id);
      setSelectedEdgeId(null);
    },
    []
  );

  const handleAddTemplateClick = useCallback(
    (template: HydraulicCatalogTemplate) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      const offset = (nodes.length % 6) * 28;
      const center = rect
        ? screenToFlowPosition({
            x: rect.left + rect.width / 2 - 90 + offset,
            y: rect.top + rect.height / 2 - 50 + offset
          })
        : { x: 180 + offset, y: 120 + offset };

      insertTemplateAt(template, center);
    },
    [nodes.length, screenToFlowPosition, insertTemplateAt]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/hydraulic-template');
      if (!raw) return;
      try {
        const template = JSON.parse(raw) as HydraulicCatalogTemplate;
        const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        insertTemplateAt(template, pos);
      } catch (err) {
        console.warn('Erro ao soltar componente hidráulico:', err);
      }
    },
    [screenToFlowPosition, insertTemplateAt]
  );

  const handleUpdateNodeData = useCallback(
    (nodeId: string, updater: (prev: HydraulicNodeData) => HydraulicNodeData) => {
      setNodes((prevNodes) => {
        const nextNodes = prevNodes.map((n) =>
          n.id === nodeId ? { ...n, data: updater(n.data) } : n
        );
        setEdges((prevEdges) => recalculateHydraulicEdges(nextNodes, prevEdges));
        return nextNodes;
      });
    },
    []
  );

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((prevNodes) => {
      const nextNodes = prevNodes.filter((n) => n.id !== nodeId);
      setEdges((prevEdges) =>
        recalculateHydraulicEdges(
          nextNodes,
          prevEdges.filter((e) => e.source !== nodeId && e.target !== nodeId)
        )
      );
      return nextNodes;
    });
    setSelectedNodeId((curr) => (curr === nodeId ? null : curr));
  }, []);

  const handleUpdateEdgeData = useCallback(
    (edgeId: string, updater: (prev: HydraulicEdgeData) => HydraulicEdgeData) => {
      setEdges((prevEdges) => {
        const nextEdges = prevEdges.map((e) =>
          e.id === edgeId
            ? {
                ...e,
                data: {
                  ...updater(e.data as HydraulicEdgeData),
                  edgeStyle
                }
              }
            : e
        );
        return recalculateHydraulicEdges(nodes, nextEdges);
      });
    },
    [nodes, edgeStyle]
  );

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((prevEdges) =>
        recalculateHydraulicEdges(
          nodes,
          prevEdges.filter((e) => e.id !== edgeId)
        )
      );
      setSelectedEdgeId((curr) => (curr === edgeId ? null : curr));
    },
    [nodes]
  );

  const handleEdgeStyleChange = (nextStyle: HydraulicEdgeStyle) => {
    setEdgeStyle(nextStyle);
    setEdges((prev) =>
      prev.map((e) => ({
        ...e,
        data: { ...(e.data as HydraulicEdgeData), edgeStyle: nextStyle }
      }))
    );
  };

  const handleClearCanvas = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setConfirmClear(false);
    flashToast('🧹 Diagrama hidráulico limpo');
  };

  const placedCatalogIds = useMemo(
    () => new Set(nodes.map((n) => n.data.catalogId)),
    [nodes]
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) || null,
    [edges, selectedEdgeId]
  );

  const bomSummary = useMemo(() => calculateHydraulicBom(nodes, edges), [nodes, edges]);

  return {
    wrapperRef,
    fitView,
    rightTab,
    setRightTab,
    nodes,
    edges,
    edgeStyle,
    customTemplates,
    setCustomTemplates,
    setSelectedNodeId,
    setSelectedEdgeId,
    confirmClear,
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleAddTemplateClick,
    handleDragOver,
    handleDrop,
    handleUpdateNodeData,
    handleDeleteNode,
    handleUpdateEdgeData,
    handleDeleteEdge,
    handleEdgeStyleChange,
    handleClearCanvas,
    placedCatalogIds,
    selectedNode,
    selectedEdge,
    bomSummary
  };
}
