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
  FLUID_META,
  HydraulicCatalogTemplate,
  HydraulicEdgeData,
  HydraulicEdgeStyle,
  HydraulicNodeData
} from '../../types/hydraulicPlanar';
import {
  buildHydraulicSystemTemplates,
  hydraulicTemplateToNodeData
} from '../../utils/hydraulicCatalog';
import {
  calculateHydraulicBom,
  recalculateHydraulicEdges
} from '../../utils/hydraulicCalculations';
import { HydraulicSchematicNode } from './HydraulicSchematicNode';
import { HydraulicPipeEdge } from './HydraulicPipeEdge';
import { HydraulicPaletteSidebar } from './HydraulicPaletteSidebar';
import { HydraulicInspectorPanel } from './HydraulicInspectorPanel';

const STORAGE_KEY_HYDRAULIC_DIAGRAM = 'doblo_hydraulic_planar_v1';
const STORAGE_KEY_HYDRAULIC_CUSTOM = 'doblo_hydraulic_custom_templates_v1';

interface SavedHydraulicDiagramState {
  nodes: Node<HydraulicNodeData>[];
  edges: Edge<HydraulicEdgeData>[];
  edgeStyle?: HydraulicEdgeStyle;
}

const nodeTypes = {
  hydraulicSchematic: HydraulicSchematicNode
};

const edgeTypes = {
  hydraulicPipe: HydraulicPipeEdge
};

const HydraulicPlanarWorkspace: React.FC = () => {
  const {
    waterTank,
    appliances,
    activePortaPottiPreset,
    flashToast
  } = useSolar();

  const { screenToFlowPosition, fitView } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<Node<HydraulicNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<HydraulicEdgeData>[]>([]);
  const [edgeStyle, setEdgeStyle] = useState<HydraulicEdgeStyle>('smoothstep');
  const [customTemplates, setCustomTemplates] = useState<HydraulicCatalogTemplate[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Carrega diagrama hidráulico salvo no IndexedDB
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await dbGet<SavedHydraulicDiagramState>(STORAGE_KEY_HYDRAULIC_DIAGRAM);
        if (mounted && saved && Array.isArray(saved.nodes) && Array.isArray(saved.edges)) {
          const style = saved.edgeStyle || 'smoothstep';
          setEdgeStyle(style);
          const styledEdges = saved.edges.map((e) => ({
            ...e,
            type: 'hydraulicPipe',
            data: { ...(e.data as HydraulicEdgeData), edgeStyle: style }
          }));
          const recalc = recalculateHydraulicEdges(saved.nodes, styledEdges);
          setNodes(saved.nodes);
          setEdges(recalc);
        }

        const savedCustom = await dbGet<HydraulicCatalogTemplate[]>(STORAGE_KEY_HYDRAULIC_CUSTOM);
        if (mounted && Array.isArray(savedCustom)) {
          setCustomTemplates(savedCustom);
        }
      } catch (err) {
        console.warn('Erro ao carregar diagrama hidráulico:', err);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Salva automaticamente no IndexedDB
  useEffect(() => {
    if (!isLoaded) return;
    dbSet(STORAGE_KEY_HYDRAULIC_DIAGRAM, { nodes, edges, edgeStyle });
  }, [nodes, edges, edgeStyle, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    dbSet(STORAGE_KEY_HYDRAULIC_CUSTOM, customTemplates);
  }, [customTemplates, isLoaded]);

  // Sincronização reativa com Caixa d'Água em U, Bomba e Porta Potti do sistema
  useEffect(() => {
    if (!isLoaded) return;
    setNodes((prevNodes) => {
      if (prevNodes.length === 0) return prevNodes;
      const sysTemplates = buildHydraulicSystemTemplates(
        waterTank,
        appliances,
        activePortaPottiPreset
      );
      const sysMap = new Map(sysTemplates.map((t) => [t.catalogId, t]));

      let changed = false;
      const nextNodes = prevNodes.map((node) => {
        const d = node.data;
        if (d.category === 'system_fixed' && sysMap.has(d.catalogId)) {
          const tpl = sysMap.get(d.catalogId)!;
          if (
            d.label !== tpl.label ||
            d.subtitle !== tpl.subtitle ||
            d.capacityLiters !== tpl.capacityLiters
          ) {
            changed = true;
            return {
              ...node,
              data: {
                ...d,
                label: tpl.label,
                subtitle: tpl.subtitle,
                capacityLiters: tpl.capacityLiters
              }
            };
          }
        }
        return node;
      });

      if (!changed) return prevNodes;
      setEdges((prevEdges) => recalculateHydraulicEdges(nextNodes, prevEdges));
      return nextNodes;
    });
  }, [waterTank, appliances, activePortaPottiPreset, isLoaded]);

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
      <HydraulicPaletteSidebar
        onAddTemplate={handleAddTemplateClick}
        placedCatalogIds={placedCatalogIds}
        customTemplates={customTemplates}
        onCreateCustomTemplate={(tpl) => setCustomTemplates((prev) => [...prev, tpl])}
        onRemoveCustomTemplate={(cid) =>
          setCustomTemplates((prev) => prev.filter((t) => t.catalogId !== cid))
        }
      />

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
            <span style={{ fontWeight: 800, color: '#38bdf8' }}>💧 Esquemático Hidráulico</span>
            <span style={{ color: '#94a3b8' }}>
              {nodes.length} nós · {edges.length} linhas · <strong style={{ color: '#f1f5f9' }}>{bomSummary.totalPipeMeters}m</strong>
            </span>
            {bomSummary.overloadedPipesCount > 0 && (
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
                ⚠️ {bomSummary.overloadedPipesCount} alerta(s)
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
              title="Limpar todo o diagrama hidráulico"
            >
              {confirmClear ? '⚠️ Confirmar Limpar?' : '🧹 Limpar'}
            </button>
          </div>
        </div>

        {/* Estado Vazio */}
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
              maxWidth: '420px',
              padding: '20px',
              borderRadius: '14px',
              background: 'rgba(15, 23, 42, 0.72)',
              border: '1px dashed rgba(56, 189, 248, 0.35)'
            }}
          >
            <div style={{ fontSize: '30px', marginBottom: '8px' }}>💧</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', marginBottom: '6px' }}>
              Planejamento Hidráulico Planar (2D)
            </div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.55 }}>
              Arraste os reservatórios, bomba Seaflo, conexões T, válvulas de retenção, misturadora, trocador de calor, pia e ducha para montar o circuito de água fria, água quente e água cinza.
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
              const cat = (n.data as HydraulicNodeData)?.category;
              if (cat === 'system_fixed') return '#38bdf8';
              if (cat === 'water_points') return '#34d399';
              if (cat === 'valves_fittings') return '#fb923c';
              return '#c084fc';
            }}
            style={{ background: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.3)' }}
          />
        </ReactFlow>
      </div>

      <HydraulicInspectorPanel
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

export const HydraulicPlanarView: React.FC = () => {
  const { viewMode } = useSolar();
  if (viewMode !== 'hydraulic_planar') return null;

  return (
    <ReactFlowProvider>
      <HydraulicPlanarWorkspace />
    </ReactFlowProvider>
  );
};
