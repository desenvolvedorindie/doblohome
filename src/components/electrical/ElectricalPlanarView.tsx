import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Connection,
  ConnectionMode,
  Controls,
  Edge,
  EdgeChange,
  MiniMap,
  Node,
  NodeChange,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSolar } from '../../context/SolarContext';
import { dbGet, dbSet } from '../../data/db';
import {
  ElectricalCatalogTemplate,
  ElectricalEdgeData,
  ElectricalEdgeStyle,
  ElectricalNodeData,
  INFRASTRUCTURE_CATALOG,
  POLARITY_META,
  buildBusbarPorts
} from '../../types/electricalPlanar';
import {
  buildApplianceTemplate,
  buildSystemFixedTemplates,
  templateToNodeData
} from '../../utils/electricalCatalog';
import {
  calculateElectricalBom,
  recalculateDiagramEdges,
  syncFuseBoxNodePorts
} from '../../utils/electricalCalculations';
import { SchematicNode } from './SchematicNode';
import { WireEdge } from './WireEdge';
import { ElectricalPaletteSidebar } from './ElectricalPaletteSidebar';
import { ElectricalInspectorPanel } from './ElectricalInspectorPanel';

const STORAGE_KEY_DIAGRAM = 'doblo_electrical_planar_v1';
const STORAGE_KEY_CUSTOM_TPL = 'doblo_electrical_custom_templates_v1';

interface SavedDiagramState {
  nodes: Node<ElectricalNodeData>[];
  edges: Edge<ElectricalEdgeData>[];
  edgeStyle?: ElectricalEdgeStyle;
}

const nodeTypes = {
  schematic: SchematicNode
};

const edgeTypes = {
  wire: WireEdge
};

function normalizeBusbarNode(
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

function normalizeUsinaNode(node: Node<ElectricalNodeData>): Node<ElectricalNodeData> {
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

const ElectricalPlanarWorkspace: React.FC = () => {
  const {
    energyStats,
    b2bCharger,
    usinaCharger,
    appliances,
    flashToast
  } = useSolar();

  const { screenToFlowPosition, fitView } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<Node<ElectricalNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<ElectricalEdgeData>[]>([]);
  const [edgeStyle, setEdgeStyle] = useState<ElectricalEdgeStyle>('smoothstep');
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
    dbSet(STORAGE_KEY_DIAGRAM, { nodes, edges, edgeStyle });
  }, [nodes, edges, edgeStyle, isLoaded]);

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

  const onConnect = useCallback(
    (connection: Connection) => {
      const sNode = nodes.find((n) => n.id === connection.source);
      const tNode = nodes.find((n) => n.id === connection.target);
      const sPort = sNode?.data.ports.find((p) => p.id === connection.sourceHandle);
      const tPort = tNode?.data.ports.find((p) => p.id === connection.targetHandle);

      const polarity = sPort?.polarity || tPort?.polarity || 'pos';
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
    [nodes, edgeStyle]
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

  const handleAddTemplateClick = useCallback(
    (template: ElectricalCatalogTemplate) => {
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
      const raw = e.dataTransfer.getData('application/electrical-template');
      if (!raw) return;
      try {
        const template = JSON.parse(raw) as ElectricalCatalogTemplate;
        const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        insertTemplateAt(template, pos);
      } catch (err) {
        console.warn('Erro ao soltar componente elétrico:', err);
      }
    },
    [screenToFlowPosition, insertTemplateAt]
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

  const handleEdgeStyleChange = (nextStyle: ElectricalEdgeStyle) => {
    setEdgeStyle(nextStyle);
    setEdges((prev) =>
      prev.map((e) => ({
        ...e,
        data: { ...(e.data as ElectricalEdgeData), edgeStyle: nextStyle }
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
    flashToast('🧹 Diagrama elétrico limpo');
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

  const bomSummary = useMemo(() => calculateElectricalBom(nodes, edges), [nodes, edges]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        padding: '136px 16px 16px 16px',
        background: 'radial-gradient(circle at 50% 20%, #0f172a 0%, #060a13 100%)',
        display: 'flex',
        gap: '12px',
        overflow: 'hidden'
      }}
    >
      {/* Paleta Esquerda */}
      <ElectricalPaletteSidebar
        onAddTemplate={handleAddTemplateClick}
        placedCatalogIds={placedCatalogIds}
        customTemplates={customTemplates}
        onCreateCustomTemplate={(tpl) => setCustomTemplates((prev) => [...prev, tpl])}
        onRemoveCustomTemplate={(cid) =>
          setCustomTemplates((prev) => prev.filter((t) => t.catalogId !== cid))
        }
      />

      {/* Área Central do ReactFlow */}
      <div
        ref={wrapperRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          flex: 1,
          height: '100%',
          position: 'relative',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          background: '#090e1a',
          boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.55)'
        }}
      >
        {/* Barra Superior do Canvas */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            pointerEvents: 'none'
          }}
        >
          <div
            className="glass-panel"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '11px',
              background: 'rgba(15, 23, 42, 0.88)'
            }}
          >
            <span style={{ fontWeight: 800, color: '#38bdf8' }}>⚡ Esquemático Planar</span>
            <span style={{ color: '#94a3b8' }}>
              {nodes.length} nós · {edges.length} cabos · <strong style={{ color: '#f1f5f9' }}>{bomSummary.totalCableMeters}m</strong>
            </span>
            {bomSummary.overloadedEdgesCount > 0 && (
              <span
                style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#fca5a5',
                  padding: '2px 7px',
                  borderRadius: '999px',
                  fontWeight: 800,
                  fontSize: '10px'
                }}
              >
                ⚠️ {bomSummary.overloadedEdgesCount} alerta(s)
              </span>
            )}
          </div>

          <div
            className="glass-panel"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 8px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.88)'
            }}
          >
            <button
              type="button"
              className={`btn-compact ${edgeStyle === 'smoothstep' ? 'active primary' : ''}`}
              onClick={() => handleEdgeStyleChange('smoothstep')}
              style={{ fontSize: '10px', padding: '4px 8px' }}
              title="Linhas ortogonais com cantos suaves"
            >
              ↱ Ortogonal
            </button>
            <button
              type="button"
              className={`btn-compact ${edgeStyle === 'default' ? 'active primary' : ''}`}
              onClick={() => handleEdgeStyleChange('default')}
              style={{ fontSize: '10px', padding: '4px 8px' }}
              title="Linhas curvas suaves"
            >
              〰️ Curva
            </button>
            <button
              type="button"
              className={`btn-compact ${edgeStyle === 'straight' ? 'active primary' : ''}`}
              onClick={() => handleEdgeStyleChange('straight')}
              style={{ fontSize: '10px', padding: '4px 8px' }}
              title="Linhas retas diretas"
            >
              ╲ Reta
            </button>

            <div style={{ width: '1px', height: '16px', background: 'rgba(148, 163, 184, 0.25)', margin: '0 2px' }} />

            <button
              type="button"
              className="btn-compact"
              onClick={() => fitView({ padding: 0.22, duration: 300 })}
              style={{ fontSize: '10px', padding: '4px 8px' }}
              title="Enquadrar todos os componentes na tela"
            >
              ⌖ Enquadrar
            </button>
            <button
              type="button"
              className="btn-compact"
              onClick={handleClearCanvas}
              style={{
                fontSize: '10px',
                padding: '4px 8px',
                color: confirmClear ? '#ffffff' : '#fca5a5',
                background: confirmClear ? '#dc2626' : undefined,
                borderColor: confirmClear ? '#ef4444' : 'rgba(239, 68, 68, 0.35)'
              }}
              title="Limpar todo o diagrama elétrico"
            >
              {confirmClear ? '⚠️ Confirmar Limpar?' : '🧹 Limpar'}
            </button>
          </div>
        </div>

        {/* Estado Vazio Amigável */}
        {nodes.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 15,
              pointerEvents: 'none',
              textAlign: 'center',
              maxWidth: '400px',
              padding: '20px',
              borderRadius: '14px',
              background: 'rgba(15, 23, 42, 0.72)',
              border: '1px dashed rgba(56, 189, 248, 0.35)'
            }}
          >
            <div style={{ fontSize: '30px', marginBottom: '8px' }}>⚡</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', marginBottom: '6px' }}>
              Planejamento Elétrico Planar (2D)
            </div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.55 }}>
              Arraste componentes da paleta à esquerda (Bateria, Caixa de Disjuntor, Caixa de Fusíveis, Barramentos, DC-DC, Usina e suas cargas do Consumo) e conecte os pinos para dimensionar cabos e proteções automaticamente.
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
          snapToGrid
          snapGrid={[12, 12]}
          deleteKeyCode={['Delete', 'Backspace']}
          onNodeClick={(_, node) => {
            setSelectedNodeId(node.id);
            setSelectedEdgeId(null);
          }}
          onEdgeClick={(_, edge) => {
            setSelectedEdgeId(edge.id);
            setSelectedNodeId(null);
          }}
          onPaneClick={() => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
          }}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#1e293b" />
          <Controls />
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => {
              const cat = (n.data as ElectricalNodeData)?.category;
              if (cat === 'system_fixed') return '#38bdf8';
              if (cat === 'consumption_load') return '#f59e0b';
              if (cat === 'distribution_protection') return '#10b981';
              return '#c084fc';
            }}
            style={{ background: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.3)' }}
          />
        </ReactFlow>
      </div>

      {/* Painel Inspetor & Lista de Compras */}
      <ElectricalInspectorPanel
        nodes={nodes}
        edges={edges}
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        onUpdateNodeData={handleUpdateNodeData}
        onDeleteNode={handleDeleteNode}
        onUpdateEdgeData={handleUpdateEdgeData}
        onDeleteEdge={handleDeleteEdge}
        onSelectEdge={(edgeId) => {
          setSelectedEdgeId(edgeId);
          setSelectedNodeId(null);
        }}
      />
    </div>
  );
};

export const ElectricalPlanarView: React.FC = () => {
  const { viewMode } = useSolar();
  if (viewMode !== 'electrical_planar') return null;

  return (
    <ReactFlowProvider>
      <ElectricalPlanarWorkspace />
    </ReactFlowProvider>
  );
};
