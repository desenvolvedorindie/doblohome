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
import { COPPER_WIRE_TABLE } from '../../../utils/electricalCalculations';
import { NodeProtectionConfig } from './NodeProtectionConfig';

interface NodeInspectorSectionProps {
  selectedNode: Node<ElectricalNodeData>;
  nodes?: Node<ElectricalNodeData>[];
  edges: Edge<ElectricalEdgeData>[];
  onUpdateNodeData: (
    nodeId: string,
    updater: (prev: ElectricalNodeData) => ElectricalNodeData
  ) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateEdgeData?: (
    edgeId: string,
    updater: (prev: ElectricalEdgeData) => ElectricalEdgeData
  ) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onSelectEdge?: (edgeId: string) => void;
}

export const NodeInspectorSection: React.FC<NodeInspectorSectionProps> = ({
  selectedNode,
  nodes = [],
  edges,
  onUpdateNodeData,
  onDeleteNode,
  onUpdateEdgeData,
  onDeleteEdge,
  onSelectEdge
}) => {
  const [newPortLabel, setNewPortLabel] = useState('');
  const [newPortPolarity, setNewPortPolarity] = useState<ElectricalPortPolarity>('pos');
  const [newPortSide, setNewPortSide] = useState<ElectricalPortSide>('right');
  const [newPortDir, setNewPortDir] = useState<ElectricalPortDirection>('bidirectional');
  const [editingPortId, setEditingPortId] = useState<string | null>(null);

  const isBusbar = selectedNode.data.kind === 'busbar';

  const connectedEdges = edges.filter(
    (e) => e.source === selectedNode.id || e.target === selectedNode.id
  );

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

  const handleUpdatePort = (portId: string, patch: Partial<ElectricalPort>) => {
    onUpdateNodeData(selectedNode.id, (prev) => ({
      ...prev,
      ports: prev.ports.map((p) => (p.id === portId ? { ...p, ...patch } : p))
    }));
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

        {/* ─── Cabos / Conexões Ligadas a este Componente ─── */}
        {connectedEdges.length > 0 && (
          <div
            style={{
              padding: '8px',
              borderRadius: '6px',
              background: 'rgba(2, 6, 23, 0.55)',
              border: '1px solid rgba(56, 189, 248, 0.22)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8' }}>
              〰️ Cabos Conectados ({connectedEdges.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {connectedEdges.map((edge) => {
                const isSource = edge.source === selectedNode.id;
                const otherNodeId = isSource ? edge.target : edge.source;
                const otherNode = nodes.find((n) => n.id === otherNodeId);
                const myHandleId = isSource ? edge.sourceHandle : edge.targetHandle;
                const myPort = selectedNode.data.ports.find((p) => p.id === myHandleId);
                const pol = edge.data?.polarity || myPort?.polarity || 'pos';
                const polMeta = POLARITY_META[pol] || POLARITY_META.pos;

                return (
                  <div
                    key={edge.id}
                    style={{
                      padding: '6px 7px',
                      borderRadius: '5px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: `1px solid ${edge.data?.isOverloaded ? 'rgba(239, 68, 68, 0.6)' : 'rgba(148, 163, 184, 0.2)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: polMeta.color,
                            flexShrink: 0
                          }}
                        />
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#f8fafc',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={`${myPort?.label || 'Pino'} ➔ ${otherNode?.data.label || otherNodeId}`}
                        >
                          {myPort?.label || 'Pino'} ➔ {otherNode?.data.label || 'Componente'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                        {onSelectEdge && (
                          <button
                            type="button"
                            onClick={() => onSelectEdge(edge.id)}
                            title="Abrir inspetor completo deste cabo"
                            style={{
                              background: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              color: '#38bdf8',
                              borderRadius: '4px',
                              padding: '1px 5px',
                              fontSize: '9px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            🔍 Fio
                          </button>
                        )}
                        {onDeleteEdge && (
                          <button
                            type="button"
                            onClick={() => onDeleteEdge(edge.id)}
                            title="Desconectar / excluir este cabo"
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#f87171',
                              borderRadius: '4px',
                              padding: '1px 5px',
                              fontSize: '9px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Edição rápida de Bitola, Comprimento e Polaridade direto no Componente */}
                    {onUpdateEdgeData && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr 1fr', gap: '4px' }}>
                        <label style={{ fontSize: '8.5px', color: '#94a3b8' }}>
                          Bitola (mm²)
                          <select
                            value={edge.data?.gaugeMm2 ?? 2.5}
                            onChange={(e) => {
                              const g = parseFloat(e.target.value) || 2.5;
                              onUpdateEdgeData(edge.id, (prev) => ({
                                ...prev,
                                gaugeMm2: g,
                                isManualGauge: true
                              }));
                            }}
                            style={{
                              width: '100%',
                              marginTop: '1px',
                              padding: '2px 3px',
                              borderRadius: '4px',
                              background: 'rgba(2, 6, 23, 0.9)',
                              border: '1px solid rgba(148, 163, 184, 0.25)',
                              color: '#38bdf8',
                              fontSize: '9.5px',
                              fontWeight: 700
                            }}
                          >
                            {COPPER_WIRE_TABLE.map((w) => (
                              <option key={w.mm2} value={w.mm2}>
                                {w.mm2} mm²
                              </option>
                            ))}
                          </select>
                        </label>

                        <label style={{ fontSize: '8.5px', color: '#94a3b8' }}>
                          Comp. (m)
                          <input
                            type="number"
                            min="0.1"
                            max="50"
                            step="0.1"
                            value={edge.data?.lengthMeters ?? 1.5}
                            onChange={(e) => {
                              const len = Math.max(0.1, parseFloat(e.target.value) || 0.5);
                              onUpdateEdgeData(edge.id, (prev) => ({
                                ...prev,
                                lengthMeters: len
                              }));
                            }}
                            style={{
                              width: '100%',
                              marginTop: '1px',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              background: 'rgba(2, 6, 23, 0.9)',
                              border: '1px solid rgba(148, 163, 184, 0.25)',
                              color: '#fff',
                              fontSize: '9.5px'
                            }}
                          />
                        </label>

                        <label style={{ fontSize: '8.5px', color: '#94a3b8' }}>
                          Linha
                          <select
                            value={edge.data?.polarity || 'pos'}
                            onChange={(e) => {
                              const newPol = e.target.value as ElectricalPortPolarity;
                              onUpdateEdgeData(edge.id, (prev) => ({
                                ...prev,
                                polarity: newPol,
                                color: POLARITY_META[newPol].color
                              }));
                            }}
                            style={{
                              width: '100%',
                              marginTop: '1px',
                              padding: '2px 3px',
                              borderRadius: '4px',
                              background: 'rgba(2, 6, 23, 0.9)',
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
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Editor Completo de Terminais / Pinos do Componente ─── */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#cbd5e1' }}>
              🔌 Pinos / Terminais ({selectedNode.data.ports.length})
            </span>
            <span style={{ fontSize: '8.5px', color: '#64748b' }}>
              Clique em ✏️ para editar pino
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: '210px',
              overflowY: 'auto'
            }}
          >
            {selectedNode.data.ports.map((port) => {
              const meta = POLARITY_META[port.polarity] || POLARITY_META.pos;
              const isEditing = editingPortId === port.id;
              return (
                <div
                  key={port.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '10px',
                    padding: '4px 6px',
                    borderRadius: '5px',
                    background: isEditing ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.7)',
                    border: isEditing ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', flex: 1 }}
                      onClick={() => setEditingPortId(isEditing ? null : port.id)}
                      title="Clique para editar nome, polaridade, lado e direção desta conexão"
                    >
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: meta.color,
                          border: `1px solid ${meta.handleBorder}`,
                          flexShrink: 0
                        }}
                      />
                      <span style={{ color: '#e2e8f0', fontWeight: isEditing ? 700 : 500 }}>{port.label}</span>
                      {!isBusbar && (
                        <span style={{ color: '#64748b', fontSize: '9px' }}>
                          ({port.side} · {port.direction === 'in' ? 'IN' : port.direction === 'out' ? 'OUT' : 'Bi'})
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => setEditingPortId(isEditing ? null : port.id)}
                        title={isEditing ? 'Fechar edição' : 'Editar pino/conexão'}
                        style={{
                          background: isEditing ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                          border: 'none',
                          borderRadius: '3px',
                          color: isEditing ? '#38bdf8' : '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '10px',
                          padding: '1px 3px',
                          lineHeight: 1
                        }}
                      >
                        ✏️
                      </button>
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

                  {/* Painel Expandido de Edição Inline do Pino */}
                  {isEditing && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        paddingTop: '4px',
                        borderTop: '1px solid rgba(148, 163, 184, 0.15)'
                      }}
                    >
                      <input
                        type="text"
                        value={port.label}
                        onChange={(e) => handleUpdatePort(port.id, { label: e.target.value })}
                        placeholder="Nome do terminal"
                        style={{
                          padding: '3px 6px',
                          borderRadius: '4px',
                          background: 'rgba(2, 6, 23, 0.9)',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          color: '#fff',
                          fontSize: '10px'
                        }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: isBusbar ? '1fr' : '1fr 1fr 1fr', gap: '4px' }}>
                        <select
                          value={port.polarity}
                          onChange={(e) =>
                            handleUpdatePort(port.id, { polarity: e.target.value as ElectricalPortPolarity })
                          }
                          style={{
                            padding: '3px',
                            borderRadius: '4px',
                            background: 'rgba(2, 6, 23, 0.9)',
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
                            value={port.side}
                            onChange={(e) =>
                              handleUpdatePort(port.id, { side: e.target.value as ElectricalPortSide })
                            }
                            style={{
                              padding: '3px',
                              borderRadius: '4px',
                              background: 'rgba(2, 6, 23, 0.9)',
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
                            value={port.direction}
                            onChange={(e) =>
                              handleUpdatePort(port.id, { direction: e.target.value as ElectricalPortDirection })
                            }
                            style={{
                              padding: '3px',
                              borderRadius: '4px',
                              background: 'rgba(2, 6, 23, 0.9)',
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
                    </div>
                  )}
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
