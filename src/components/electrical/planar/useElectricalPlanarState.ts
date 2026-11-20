import { useCallback, useEffect, useState } from 'react';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges
} from '@xyflow/react';
import { useSolar } from '../../../context/SolarContext';
import { dbGet, dbSet } from '../../../data/db';
import {
  ElectricalCatalogTemplate,
  ElectricalEdgeData,
  ElectricalEdgeStyle,
  ElectricalNodeData,
  POLARITY_META
} from '../../../types/electricalPlanar';
import {
  buildApplianceTemplate,
  buildSystemFixedTemplates,
  templateToNodeData
} from '../../../utils/electricalCatalog';
import {
  recalculateDiagramEdges,
  syncFuseBoxNodePorts,
  validateElectricalConnection
} from '../../../utils/electricalCalculations';
import {
  STORAGE_KEY_CUSTOM_TPL,
  STORAGE_KEY_DIAGRAM,
  SavedDiagramState,
  normalizeBusbarNode,
  normalizeUsinaNode
} from './planarNodeNormalizers';

export function useElectricalPlanarState() {
  const {
    energyStats,
    b2bCharger,
    usinaCharger,
    appliances,
    flashToast
  } = useSolar();

  const [nodes, setNodes] = useState<Node<ElectricalNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<ElectricalEdgeData>[]>([]);
  const [edgeStyle, setEdgeStyle] = useState<ElectricalEdgeStyle>('smoothstep');
  const [iconScale, setIconScale] = useState<number>(1);
  const [customTemplates, setCustomTemplates] = useState<ElectricalCatalogTemplate[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Carrega diagrama e modelos customizados salvos no IndexedDB
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await dbGet<SavedDiagramState>(STORAGE_KEY_DIAGRAM);
        if (mounted && saved && Array.isArray(saved.nodes) && Array.isArray(saved.edges)) {
          const style = saved.edgeStyle || 'smoothstep';
          setEdgeStyle(style);
          if (typeof saved.iconScale === 'number' && saved.iconScale >= 0.8 && saved.iconScale <= 2.5) {
            setIconScale(saved.iconScale);
          }
          const styledEdges = saved.edges.map((e) => ({
            ...e,
            type: 'wire',
            data: { ...(e.data as ElectricalEdgeData), edgeStyle: style }
          }));
          const normalizedNodes = saved.nodes.map((n) =>
            normalizeUsinaNode(normalizeBusbarNode(n, styledEdges))
          );
          const recalc = recalculateDiagramEdges(normalizedNodes, styledEdges);
          const syncedNodes = syncFuseBoxNodePorts(normalizedNodes, recalc);
          setNodes(syncedNodes);
          setEdges(recalc);
        }

        const savedCustom = await dbGet<ElectricalCatalogTemplate[]>(STORAGE_KEY_CUSTOM_TPL);
        if (mounted && Array.isArray(savedCustom)) {
          setCustomTemplates(savedCustom);
        }
      } catch (err) {
        console.warn('Erro ao carregar diagrama elétrico:', err);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Salva automaticamente no IndexedDB sempre que houver alteração
  useEffect(() => {
    if (!isLoaded) return;
    dbSet(STORAGE_KEY_DIAGRAM, { nodes, edges, edgeStyle, iconScale });
  }, [nodes, edges, edgeStyle, iconScale, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    dbSet(STORAGE_KEY_CUSTOM_TPL, customTemplates);
  }, [customTemplates, isLoaded]);

  // Calcula automaticamente os fusíveis das Caixas de Fusíveis conforme conexões e cargas no canvas
  useEffect(() => {
    if (!isLoaded) return;
    setNodes((prevNodes) => syncFuseBoxNodePorts(prevNodes, edges));
  }, [edges, isLoaded]);

  // Sincronização reativa de placas solares, B2B, Usina e cargas do Consumo nos nós já presentes no canvas
  useEffect(() => {
    if (!isLoaded) return;
    setNodes((prevNodes) => {
      if (prevNodes.length === 0) return prevNodes;
      const sysTemplates = buildSystemFixedTemplates(energyStats, b2bCharger, usinaCharger);
      const sysMap = new Map(sysTemplates.map((t) => [t.catalogId, t]));
      const appMap = new Map(appliances.map((a) => [`load_${a.id}`, a]));

      let changed = false;
      const nextNodes = prevNodes.map((node) => {
        const d = node.data;
        if (d.category === 'system_fixed' && sysMap.has(d.catalogId)) {
          const tpl = sysMap.get(d.catalogId)!;
          const normalizedNode = normalizeUsinaNode(node);
          const portsChanged = normalizedNode !== node;
          if (
            portsChanged ||
            d.label !== tpl.label ||
            d.subtitle !== tpl.subtitle ||
            d.watts !== tpl.watts ||
            d.amps !== tpl.amps ||
            d.voltage !== tpl.voltage
          ) {
            changed = true;
            return {
              ...normalizedNode,
              data: {
                ...normalizedNode.data,
                label: tpl.label,
                subtitle: tpl.subtitle,
                voltage: tpl.voltage,
                watts: tpl.watts,
                amps: tpl.amps
              }
            };
          }
        } else if (d.category === 'consumption_load' && d.catalogId.startsWith('load_')) {
          const app = appMap.get(d.catalogId);
          if (app) {
            const tpl = buildApplianceTemplate(app);
            if (
              d.label !== tpl.label ||
              d.subtitle !== tpl.subtitle ||
              d.watts !== tpl.watts ||
              d.amps !== tpl.amps ||
              d.isEnabled !== app.enabled
            ) {
              changed = true;
              return {
                ...node,
                data: {
                  ...d,
                  label: tpl.label,
                  subtitle: tpl.subtitle,
                  voltage: tpl.voltage,
                  watts: tpl.watts,
                  amps: tpl.amps,
                  isEnabled: app.enabled
                }
              };
            }
          } else if (d.isEnabled !== false) {
            changed = true;
            return {
              ...node,
              data: {
                ...d,
                isEnabled: false,
                subtitle: 'Removido da lista de Consumo'
              }
            };
          }
        }
        return node;
      });

      if (!changed) return prevNodes;
      setEdges((prevEdges) => recalculateDiagramEdges(nextNodes, prevEdges));
      return nextNodes;
    });
  }, [energyStats, b2bCharger, usinaCharger, appliances, isLoaded]);

  // Atalho Ctrl+A / Cmd+A para selecionar todos os nós e conexões do canvas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        setNodes((prev) => prev.map((n) => ({ ...n, selected: true })));
        setEdges((prev) => prev.map((ed) => ({ ...ed, selected: true })));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onNodesChange = useCallback((changes: NodeChange<Node<ElectricalNodeData>>[]) => {
    setNodes((nds) => {
      const updated = applyNodeChanges(changes, nds);
      if (changes.some((c) => c.type === 'remove')) {
        const remainingIds = new Set(updated.map((n) => n.id));
        setEdges((eds) =>
          recalculateDiagramEdges(
            updated,
            eds.filter((ed) => remainingIds.has(ed.source) && remainingIds.has(ed.target))
          )
        );
      }
      return updated;
    });
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange<Edge<ElectricalEdgeData>>[]) => {
    setEdges((eds) => {
      const updated = applyEdgeChanges(changes, eds);
      if (changes.some((c) => c.type === 'remove')) {
        return recalculateDiagramEdges(nodes, updated);
      }
      return updated;
    });
  }, [nodes]);

  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      return validateElectricalConnection(connection, nodes).valid;
    },
    [nodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const validation = validateElectricalConnection(connection, nodes);
      if (!validation.valid) {
        if (validation.reason) {
          flashToast(`⚠️ ${validation.reason}`);
        }
        return;
      }

      const polarity = validation.resolvedPolarity || 'pos';
      const newId = `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const newEdge: Edge<ElectricalEdgeData & { edgeStyle?: ElectricalEdgeStyle }> = {
        id: newId,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'wire',
        data: {
          polarity,
          color: POLARITY_META[polarity].color,
          lengthMeters: 1.5,
          currentAmps: 0,
          voltage: 12.8,
          suggestedGaugeMm2: 2.5,
          gaugeMm2: 2.5,
          suggestedProtectionAmps: 5,
          voltageDropVolts: 0,
          voltageDropPercent: 0,
          isOverloaded: false,
          edgeStyle
        }
      };

      setEdges((eds) => {
        const added = addEdge(newEdge, eds);
        return recalculateDiagramEdges(nodes, added);
      });
      setSelectedEdgeId(newId);
      setSelectedNodeId(null);
    },
    [nodes, edgeStyle, flashToast]
  );

  const insertTemplateAt = useCallback(
    (template: ElectricalCatalogTemplate, flowPos: { x: number; y: number }) => {
      const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newNode: Node<ElectricalNodeData> = {
        id,
        type: 'schematic',
        position: flowPos,
        data: templateToNodeData(template)
      };
      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(id);
      setSelectedEdgeId(null);
    },
    []
  );

  const handleUpdateNodeData = useCallback(
    (nodeId: string, updater: (prev: ElectricalNodeData) => ElectricalNodeData) => {
      setNodes((prevNodes) => {
        const nextNodes = prevNodes.map((n) =>
          n.id === nodeId ? { ...n, data: updater(n.data) } : n
        );
        setEdges((prevEdges) => recalculateDiagramEdges(nextNodes, prevEdges));
        return nextNodes;
      });
    },
    []
  );

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((prevNodes) => {
      const nextNodes = prevNodes.filter((n) => n.id !== nodeId);
      setEdges((prevEdges) =>
        recalculateDiagramEdges(
          nextNodes,
          prevEdges.filter((e) => e.source !== nodeId && e.target !== nodeId)
        )
      );
      return nextNodes;
    });
    setSelectedNodeId((curr) => (curr === nodeId ? null : curr));
  }, []);

  const handleUpdateEdgeData = useCallback(
    (edgeId: string, updater: (prev: ElectricalEdgeData) => ElectricalEdgeData) => {
      setEdges((prevEdges) => {
        const nextEdges = prevEdges.map((e) =>
          e.id === edgeId
            ? {
              ...e,
              data: {
                ...updater(e.data as ElectricalEdgeData),
                edgeStyle
              }
            }
            : e
        );
        return recalculateDiagramEdges(nodes, nextEdges);
      });
    },
    [nodes, edgeStyle]
  );

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((prevEdges) =>
        recalculateDiagramEdges(
          nodes,
          prevEdges.filter((e) => e.id !== edgeId)
        )
      );
      setSelectedEdgeId((curr) => (curr === edgeId ? null : curr));
    },
    [nodes]
  );

  const handleEdgeStyleChange = useCallback((nextStyle: ElectricalEdgeStyle) => {
    setEdgeStyle(nextStyle);
    setEdges((prev) =>
      prev.map((e) => ({
        ...e,
        data: { ...(e.data as ElectricalEdgeData), edgeStyle: nextStyle }
      }))
    );
  }, []);

  const handleClearCanvas = useCallback(() => {
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
    flashToast('🧹 Diagrama elétrico limpo');
  }, [confirmClear, flashToast]);

  return {
    nodes,
    edges,
    edgeStyle,
    iconScale,
    setIconScale,
    customTemplates,
    setCustomTemplates,
    selectedNodeId,
    setSelectedNodeId,
    selectedEdgeId,
    setSelectedEdgeId,
    confirmClear,
    onNodesChange,
    onEdgesChange,
    isValidConnection,
    onConnect,
    insertTemplateAt,
    handleUpdateNodeData,
    handleDeleteNode,
    handleUpdateEdgeData,
    handleDeleteEdge,
    handleEdgeStyleChange,
    handleClearCanvas
  };
}
