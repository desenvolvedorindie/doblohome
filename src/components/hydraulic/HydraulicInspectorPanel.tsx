import React, { useEffect, useState } from 'react';
import type { Edge, Node } from '@xyflow/react';
import {
  HydraulicEdgeData,
  HydraulicNodeData
} from '../../types/hydraulicPlanar';
import { calculateHydraulicBom } from '../../utils/hydraulicCalculations';
import { HydraulicBomSection } from './inspector/HydraulicBomSection';
import { HydraulicEdgeInspectorForm } from './inspector/HydraulicEdgeInspectorForm';
import { HydraulicNodeInspectorForm } from './inspector/HydraulicNodeInspectorForm';

export interface HydraulicInspectorPanelProps {
  nodes: Node<HydraulicNodeData>[];
  edges: Edge<HydraulicEdgeData>[];
  selectedNode: Node<HydraulicNodeData> | null;
  selectedEdge: Edge<HydraulicEdgeData> | null;
  onUpdateNodeData: (nodeId: string, updater: (prev: HydraulicNodeData) => HydraulicNodeData) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateEdgeData: (edgeId: string, updater: (prev: HydraulicEdgeData) => HydraulicEdgeData) => void;
  onDeleteEdge: (edgeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  activeTab?: 'inspector' | 'bom';
  onTabChange?: (tab: 'inspector' | 'bom') => void;
}

export const HydraulicInspectorPanel: React.FC<HydraulicInspectorPanelProps> = ({
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  onUpdateNodeData,
  onDeleteNode,
  onUpdateEdgeData,
  onDeleteEdge,
  onSelectEdge,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'inspector' | 'bom'>('inspector');
  const activeTab = controlledTab ?? internalActiveTab;
  const setActiveTab = (tab: 'inspector' | 'bom') => {
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };

  const bom = calculateHydraulicBom(nodes, edges);
  const overloadedEdges = edges.filter((e) => e.data?.isOverloaded);

  useEffect(() => {
    if (selectedNode?.id || selectedEdge?.id) {
      setActiveTab('inspector');
    }
  }, [selectedNode?.id, selectedEdge?.id]);

  const showBom = activeTab === 'bom';

  return (
    <aside
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '10px 12px',
        gap: '10px',
        background: 'transparent',
      }}
    >
      {/* Abas Inspetor / Lista de Compras */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '5px',
          background: 'rgba(15, 23, 42, 0.85)',
          padding: '4px',
          borderRadius: '8px'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('inspector')}
          className={`btn-compact ${!showBom ? 'active primary' : ''}`}
          style={{ fontSize: '11px', padding: '6px 4px', fontWeight: 700 }}
        >
          🎛️ Inspetor
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bom')}
          className={`btn-compact ${showBom ? 'active primary' : ''}`}
          style={{ fontSize: '11px', padding: '6px 4px', fontWeight: 700 }}
        >
          🛒 Compra ({bom.totalPipeMeters}m)
        </button>
      </div>

      {/* Alertas de restrição hidráulica */}
      {overloadedEdges.length > 0 && (
        <div
          style={{
            padding: '7px 9px',
            borderRadius: '7px',
            background: 'rgba(239, 68, 68, 0.16)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#fecaca',
            fontSize: '10.5px'
          }}
        >
          <div style={{ fontWeight: 800, color: '#f87171', marginBottom: '3px' }}>
            ⚠️ {overloadedEdges.length} trecho(s) com restrição de diâmetro
          </div>
          {overloadedEdges.slice(0, 3).map((oe) => (
            <button
              key={oe.id}
              type="button"
              onClick={() => {
                setActiveTab('inspector');
                onSelectEdge(oe.id);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fecaca',
                borderRadius: '4px',
                padding: '3px 6px',
                marginTop: '3px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Ø{oe.data?.diameterMm}mm · {oe.data?.flowLpm} L/min — {oe.data?.warning}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '2px' }}>
        {showBom ? (
          <HydraulicBomSection bom={bom} nodeCount={nodes.length} />
        ) : selectedEdge ? (
          <HydraulicEdgeInspectorForm
            selectedEdge={selectedEdge}
            onUpdateEdgeData={onUpdateEdgeData}
            onDeleteEdge={onDeleteEdge}
          />
        ) : selectedNode ? (
          <HydraulicNodeInspectorForm
            selectedNode={selectedNode}
            nodes={nodes}
            edges={edges}
            onUpdateNodeData={onUpdateNodeData}
            onDeleteNode={onDeleteNode}
            onUpdateEdgeData={onUpdateEdgeData}
            onDeleteEdge={onDeleteEdge}
            onSelectEdge={onSelectEdge}
          />
        ) : (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px dashed rgba(148, 163, 184, 0.25)',
              borderRadius: '8px',
              padding: '14px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '11px',
              lineHeight: 1.5
            }}
          >
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>💧</div>
            Clique em qualquer <strong>componente</strong> ou <strong>tubo/mangueira</strong> no diagrama para ajustar comprimento (m), bitola (mm/pol), fluido (fria/quente/esgoto) ou conexões.
          </div>
        )}
      </div>
    </aside>
  );
};
