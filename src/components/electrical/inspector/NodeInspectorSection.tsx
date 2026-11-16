import React, { useState } from 'react';
import type { Edge, Node } from '@xyflow/react';
import {
  ElectricalEdgeData,
  ElectricalNodeData,
  ElectricalPort,
  ElectricalPortDirection,
  ElectricalPortPolarity,
  ElectricalPortSide,
  POLARITY_META
} from '../../../types/electricalPlanar';
import { NodeProtectionConfig } from './NodeProtectionConfig';

interface NodeInspectorSectionProps {
  selectedNode: Node<ElectricalNodeData>;
  edges: Edge<ElectricalEdgeData>[];
  onUpdateNodeData: (
    nodeId: string,
    updater: (prev: ElectricalNodeData) => ElectricalNodeData
  ) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const NodeInspectorSection: React.FC<NodeInspectorSectionProps> = ({
  selectedNode,
  edges,
  onUpdateNodeData,
  onDeleteNode
}) => {
  const [newPortLabel, setNewPortLabel] = useState('');
  const [newPortPolarity, setNewPortPolarity] = useState<ElectricalPortPolarity>('pos');
  const [newPortSide, setNewPortSide] = useState<ElectricalPortSide>('right');
  const [newPortDir, setNewPortDir] = useState<ElectricalPortDirection>('bidirectional');

  const isBusbar = selectedNode.data.kind === 'busbar';

  const handleMovePort = (portId: string, dir: -1 | 1) => {
    onUpdateNodeData(selectedNode.id, (prev) => {
      const idx = prev.ports.findIndex((p) => p.id === portId);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.ports.length) return prev;
      const next = [...prev.ports];
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...prev, ports: next };
    });
  };

  const handleAddPort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortLabel.trim()) return;
    const port: ElectricalPort = {
      id: `port_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: newPortLabel.trim(),
      polarity: newPortPolarity,
      side: isBusbar ? 'left' : newPortSide,
      direction: isBusbar ? 'bidirectional' : newPortDir
    };
    onUpdateNodeData(selectedNode.id, (prev) => ({
      ...prev,
      ports: [...prev.ports, port]
    }));
    setNewPortLabel('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '8px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
            {selectedNode.data.icon} Editar Componente
          </span>
          <button
            type="button"
            onClick={() => onDeleteNode(selectedNode.id)}
            style={{
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              color: '#fca5a5',
              borderRadius: '5px',
              padding: '3px 7px',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🗑️ Excluir
          </button>
        </div>

        <label style={{ fontSize: '10px', color: '#94a3b8' }}>
          Nome
          <input
            type="text"
            value={selectedNode.data.label}
            onChange={(e) =>
              onUpdateNodeData(selectedNode.id, (prev) => ({
                ...prev,
                label: e.target.value
              }))
            }
            style={{
              width: '100%',
              marginTop: '2px',
              padding: '5px 7px',
              borderRadius: '5px',
              background: 'rgba(2, 6, 23, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#fff',
              fontSize: '11px'
            }}
          />
        </label>

        <label style={{ fontSize: '10px', color: '#94a3b8' }}>
          Subtítulo / Observação
          <input
            type="text"
            value={selectedNode.data.subtitle || ''}
            onChange={(e) =>
              onUpdateNodeData(selectedNode.id, (prev) => ({
                ...prev,
                subtitle: e.target.value
              }))
            }
            style={{
              width: '100%',
              marginTop: '2px',
              padding: '5px 7px',
              borderRadius: '5px',
              background: 'rgba(2, 6, 23, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#fff',
              fontSize: '11px'
            }}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
          <label style={{ fontSize: '9.5px', color: '#94a3b8' }}>
            Tensão (V)
            <input
              type="number"
              step="0.1"
              value={selectedNode.data.voltage}
              onChange={(e) => {
                const v = Math.max(1, parseFloat(e.target.value) || 12.8);
                onUpdateNodeData(selectedNode.id, (prev) => ({
                  ...prev,
                  voltage: v,
                  amps: prev.watts > 0 ? +(prev.watts / v).toFixed(1) : prev.amps
                }));
              }}
              style={{
                width: '100%',
                marginTop: '2px',
                padding: '4px 5px',
                borderRadius: '5px',
                background: 'rgba(2, 6, 23, 0.85)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#fff',
                fontSize: '11px'
              }}
            />
          </label>
          <label style={{ fontSize: '9.5px', color: '#94a3b8' }}>
            Potência (W)
            <input
              type="number"
              step="1"
              value={selectedNode.data.watts}
              onChange={(e) => {
                const w = Math.max(0, parseFloat(e.target.value) || 0);
                onUpdateNodeData(selectedNode.id, (prev) => ({
                  ...prev,
                  watts: w,
                  amps: prev.voltage > 0 ? +(w / prev.voltage).toFixed(1) : prev.amps
                }));
              }}
              style={{
                width: '100%',
                marginTop: '2px',
                padding: '4px 5px',
                borderRadius: '5px',
                background: 'rgba(2, 6, 23, 0.85)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#fff',
                fontSize: '11px'
              }}
            />
          </label>
          <label style={{ fontSize: '9.5px', color: '#94a3b8' }}>
            Corr. (A)
            <input
              type="number"
              step="0.1"
              value={selectedNode.data.amps}
              onChange={(e) => {
                const a = Math.max(0, parseFloat(e.target.value) || 0);
                onUpdateNodeData(selectedNode.id, (prev) => ({
                  ...prev,
                  amps: a,
                  watts: prev.voltage > 0 ? +(a * prev.voltage).toFixed(1) : prev.watts
                }));
              }}
              style={{
                width: '100%',
                marginTop: '2px',
                padding: '4px 5px',
                borderRadius: '5px',
                background: 'rgba(2, 6, 23, 0.85)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#fff',
                fontSize: '11px'
              }}
            />
          </label>
        </div>

        <NodeProtectionConfig
          selectedNode={selectedNode}
          edges={edges}
          onUpdateNodeData={onUpdateNodeData}
        />

        {/* Editor de Terminais / Pinos */}
        <div
          style={{
            padding: '7px',
            borderRadius: '6px',
            background: 'rgba(2, 6, 23, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 800, color: '#cbd5e1' }}>
            🔌 Pinos / Terminais ({selectedNode.data.ports.length})
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              maxHeight: '120px',
              overflowY: 'auto'
            }}
          >
            {selectedNode.data.ports.map((port) => {
              const meta = POLARITY_META[port.polarity];
              return (
                <div
                  key={port.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    background: 'rgba(15, 23, 42, 0.7)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: meta.color,
                        border: `1px solid ${meta.handleBorder}`
                      }}
                    />
                    <span style={{ color: '#e2e8f0' }}>{port.label}</span>
                    {!isBusbar && (
                      <span style={{ color: '#64748b', fontSize: '9px' }}>({port.side})</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <button
                      type="button"
                      onClick={() => handleMovePort(port.id, -1)}
                      title="Mover para cima"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '10px',
                        padding: '0 2px',
                        lineHeight: 1
                      }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMovePort(port.id, 1)}
                      title="Mover para baixo"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '10px',
                        padding: '0 2px',
                        lineHeight: 1
                      }}
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNodeData(selectedNode.id, (prev) => ({
                          ...prev,
                          ports: prev.ports.filter((p) => p.id !== port.id)
                        }))
                      }
                      title="Remover pino"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        cursor: 'pointer',
                        fontSize: '11px',
                        padding: '0 2px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Adicionar Novo Pino */}
          <form
            onSubmit={handleAddPort}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              borderTop: '1px solid rgba(148, 163, 184, 0.14)',
              paddingTop: '6px'
            }}
          >
            <input
              type="text"
              placeholder="Novo pino (ex: + 12V Aux)"
              value={newPortLabel}
              onChange={(e) => setNewPortLabel(e.target.value)}
              style={{
                padding: '4px 6px',
                borderRadius: '4px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#fff',
                fontSize: '10px'
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: isBusbar ? '1fr' : '1fr 1fr 1fr', gap: '4px' }}>
              <select
                value={newPortPolarity}
                onChange={(e) => setNewPortPolarity(e.target.value as ElectricalPortPolarity)}
                style={{
                  padding: '3px',
                  borderRadius: '4px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#fff',
                  fontSize: '9.5px'
                }}
              >
                <option value="pos">+ Pos</option>
                <option value="neg">- Neg</option>
                <option value="ac_phase">Fase AC</option>
                <option value="ac_neutral">Neutro AC</option>
                <option value="ac_ground">Terra PE</option>
                <option value="signal">Sinal D+</option>
              </select>
              {!isBusbar && (
              <select
                value={newPortSide}
                onChange={(e) => setNewPortSide(e.target.value as ElectricalPortSide)}
                style={{
                  padding: '3px',
                  borderRadius: '4px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#fff',
                  fontSize: '9.5px'
                }}
              >
                <option value="left">Esq</option>
                <option value="right">Dir</option>
                <option value="top">Topo</option>
                <option value="bottom">Base</option>
              </select>
              )}
              {!isBusbar && (
              <select
                value={newPortDir}
                onChange={(e) => setNewPortDir(e.target.value as ElectricalPortDirection)}
                style={{
                  padding: '3px',
                  borderRadius: '4px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#fff',
                  fontSize: '9.5px'
                }}
              >
                <option value="bidirectional">Bi</option>
                <option value="in">IN</option>
                <option value="out">OUT</option>
              </select>
              )}
            </div>
            <button
              type="submit"
              className="btn-compact primary"
              style={{ fontSize: '10px', padding: '4px', fontWeight: 700 }}
            >
              + Adicionar Pino
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
