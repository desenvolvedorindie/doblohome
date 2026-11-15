import React, { useEffect, useState } from 'react';
import type { Edge, Node } from '@xyflow/react';
import {
  ElectricalEdgeData,
  ElectricalNodeData
} from '../../types/electricalPlanar';
import { calculateElectricalBom } from '../../utils/electricalCalculations';
import { ElectricalBomTab } from './inspector/ElectricalBomTab';
import { EdgeInspectorSection } from './inspector/EdgeInspectorSection';
import { NodeInspectorSection } from './inspector/NodeInspectorSection';

interface ElectricalInspectorPanelProps {
  nodes: Node<ElectricalNodeData>[];
  edges: Edge<ElectricalEdgeData>[];
  selectedNode: Node<ElectricalNodeData> | null;
  selectedEdge: Edge<ElectricalEdgeData> | null;
  onUpdateNodeData: (nodeId: string, updater: (prev: ElectricalNodeData) => ElectricalNodeData) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateEdgeData: (edgeId: string, updater: (prev: ElectricalEdgeData) => ElectricalEdgeData) => void;
  onDeleteEdge: (edgeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  activeTab?: 'inspector' | 'bom';
  onTabChange?: (tab: 'inspector' | 'bom') => void;
}

export const ElectricalInspectorPanel: React.FC<ElectricalInspectorPanelProps> = ({
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
  onTabChange
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'inspector' | 'bom'>('inspector');
  const activeTab = controlledTab ?? internalActiveTab;
  const setActiveTab = (tab: 'inspector' | 'bom') => {
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };

  const bom = calculateElectricalBom(nodes, edges);
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
        background: 'transparent'
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
          🛒 Compra ({bom.totalCableMeters}m)
        </button>
      </div>

      {/* Alertas globais de sobrecarga */}
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
            ⚠️ {overloadedEdges.length} cabo(s) com alerta de sobrecarga
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
              {oe.data?.gaugeMm2}mm² · {oe.data?.currentAmps}A — {oe.data?.overloadWarning}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          paddingRight: '2px'
        }}
      >
        {showBom ? (
          <ElectricalBomTab bom={bom} nodesCount={nodes.length} />
        ) : selectedEdge ? (
          <EdgeInspectorSection
            selectedEdge={selectedEdge}
            onUpdateEdgeData={onUpdateEdgeData}
            onDeleteEdge={onDeleteEdge}
          />
        ) : selectedNode ? (
          <NodeInspectorSection
            selectedNode={selectedNode}
            edges={edges}
            onUpdateNodeData={onUpdateNodeData}
            onDeleteNode={onDeleteNode}
          />
        ) : (
          /* Estado vazio no Inspetor */
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
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>🖱️</div>
            Clique em qualquer <strong>componente</strong> ou <strong>fio</strong> no diagrama para configurar bitolas, comprimentos (m), fusíveis (5A–40A) ou terminais.
            <div style={{ marginTop: '10px', fontSize: '10px', color: '#64748b' }}>
              Dica: arraste de um pino colorido até outro pino para desenhar um cabo automático.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
