import React from 'react';
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSolar } from '../../context/SolarContext';
import { HydraulicNodeData } from '../../types/hydraulicPlanar';
import { HydraulicSchematicNode } from './HydraulicSchematicNode';
import { HydraulicPipeEdge } from './HydraulicPipeEdge';
import { HydraulicPaletteSidebar } from './HydraulicPaletteSidebar';
import { HydraulicInspectorPanel } from './HydraulicInspectorPanel';
import { PlanarIdeLayout } from '../layout/PlanarIdeLayout';
import { PlanarSidebarControlProps } from '../electrical/ElectricalPlanarView';
import { DropletIcon } from '../layout/IdeIcons';
import { useHydraulicPlanarState } from './planar/useHydraulicPlanarState';
import {
  HydraulicCanvasToolbar,
  HydraulicEmptyCanvasOverlay
} from './planar/HydraulicCanvasToolbar';

const nodeTypes = {
  hydraulicSchematic: HydraulicSchematicNode
};

const edgeTypes = {
  hydraulicPipe: HydraulicPipeEdge
};

const HydraulicPlanarWorkspace: React.FC<PlanarSidebarControlProps> = ({
  leftSidebarVisible,
  rightSidebarVisible,
  onToggleLeftSidebar,
  onToggleRightSidebar,
}) => {
  const {
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
  } = useHydraulicPlanarState();

  return (
    <PlanarIdeLayout
      leftSidebarVisible={leftSidebarVisible}
      rightSidebarVisible={rightSidebarVisible}
      onToggleLeftSidebar={onToggleLeftSidebar}
      onToggleRightSidebar={onToggleRightSidebar}
      leftTitle="CATÁLOGO HIDRÁULICO 2D"
      leftActivityTitle="Catálogo de Componentes Hidráulicos"
      leftActivityIcon={<DropletIcon />}
      leftContent={
        <HydraulicPaletteSidebar
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
      rightInspectorTitle="INSPETOR HIDRÁULICO 2D"
      rightBomTitle="LISTA DE COMPRAS & TUBOS"
      rightContent={
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
            background: '#090e1a',
          }}
        >
          <HydraulicCanvasToolbar
            nodeCount={nodes.length}
            edgeCount={edges.length}
            bomSummary={bomSummary}
            edgeStyle={edgeStyle}
            confirmClear={confirmClear}
            onEdgeStyleChange={handleEdgeStyleChange}
            onFitView={() => fitView({ padding: 0.22, duration: 300 })}
            onClearCanvas={handleClearCanvas}
          />

          {nodes.length === 0 && <HydraulicEmptyCanvasOverlay />}

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
      }
    />
  );
};

export const HydraulicPlanarView: React.FC<PlanarSidebarControlProps> = (props) => {
  const { viewMode } = useSolar();
  if (viewMode !== 'hydraulic_planar') return null;

  return (
    <ReactFlowProvider>
      <HydraulicPlanarWorkspace {...props} />
    </ReactFlowProvider>
  );
};
