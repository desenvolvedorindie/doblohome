import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSolar } from '../../context/SolarContext';
import { ElectricalCatalogTemplate } from '../../types/electricalPlanar';
import { calculateElectricalBom } from '../../utils/electricalCalculations';
import { SchematicNode } from './SchematicNode';
import { WireEdge } from './WireEdge';
import { ElectricalPaletteSidebar } from './ElectricalPaletteSidebar';
import { ElectricalInspectorPanel } from './ElectricalInspectorPanel';
import { PlanarIdeLayout } from '../layout/PlanarIdeLayout';
import { ZapIcon } from '../layout/IdeIcons';
import {
  PlanarCanvasToolbar,
  PlanarEmptyStateOverlay,
  getPlanarMiniMapNodeColor
} from './planar/PlanarCanvasToolbar';
import { useElectricalPlanarState } from './planar/useElectricalPlanarState';
import { ElectricalIconScaleProvider } from './planar/ElectricalIconScaleContext';

const nodeTypes = {
  schematic: SchematicNode
};

const edgeTypes = {
  wire: WireEdge
};

export interface PlanarSidebarControlProps {
  leftSidebarVisible: boolean;
  rightSidebarVisible: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
}

const ElectricalPlanarWorkspace: React.FC<PlanarSidebarControlProps> = ({
  leftSidebarVisible,
  rightSidebarVisible,
  onToggleLeftSidebar,
  onToggleRightSidebar
}) => {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rightTab, setRightTab] = useState<'inspector' | 'bom'>('inspector');

  const {
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
  } = useElectricalPlanarState();

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
    <ElectricalIconScaleProvider scale={iconScale}>
      <PlanarIdeLayout
      leftSidebarVisible={leftSidebarVisible}
      rightSidebarVisible={rightSidebarVisible}
      onToggleLeftSidebar={onToggleLeftSidebar}
      onToggleRightSidebar={onToggleRightSidebar}
      leftTitle="CATÁLOGO ELÉTRICO 2D"
      leftActivityTitle="Catálogo de Componentes Elétricos"
      leftActivityIcon={<ZapIcon />}
      leftContent={
        <ElectricalPaletteSidebar
          onAddTemplate={handleAddTemplateClick}
          placedCatalogIds={placedCatalogIds}
          customTemplates={customTemplates}
          onCreateCustomTemplate={(tpl) => setCustomTemplates((prev) => [...prev, tpl])}
          onRemoveCustomTemplate={(cid) =>
            setCustomTemplates((prev) => prev.filter((t) => t.catalogId !== cid))
          }
        />
      }
      rightTab={rightTab}
      onRightTabChange={setRightTab}
      rightInspectorTitle="INSPETOR ELÉTRICO 2D"
      rightBomTitle="LISTA DE COMPRAS & CABOS"
      rightContent={
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
            setRightTab('inspector');
          }}
          activeTab={rightTab}
          onTabChange={setRightTab}
        />
      }
      canvasContent={
        <div
          ref={wrapperRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            flex: 1,
            height: '100%',
            minWidth: 0,
            minHeight: 0,
            position: 'relative',
            overflow: 'hidden',
            background: '#090e1a'
          }}
        >
          <PlanarCanvasToolbar
            nodesCount={nodes.length}
            edgesCount={edges.length}
            bomSummary={bomSummary}
            edgeStyle={edgeStyle}
            iconScale={iconScale}
            confirmClear={confirmClear}
            onEdgeStyleChange={handleEdgeStyleChange}
            onIconScaleChange={setIconScale}
            onFitView={() => fitView({ padding: 0.22, duration: 300 })}
            onClearCanvas={handleClearCanvas}
          />

          {nodes.length === 0 && <PlanarEmptyStateOverlay />}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            isValidConnection={isValidConnection}
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
              nodeColor={getPlanarMiniMapNodeColor}
              style={{ background: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.3)' }}
            />
          </ReactFlow>
        </div>
      }
    />
    </ElectricalIconScaleProvider>
  );
};

export const ElectricalPlanarView: React.FC<PlanarSidebarControlProps> = (props) => {
  const { viewMode } = useSolar();
  if (viewMode !== 'electrical_planar') return null;

  return (
    <ReactFlowProvider>
      <ElectricalPlanarWorkspace {...props} />
    </ReactFlowProvider>
  );
};
