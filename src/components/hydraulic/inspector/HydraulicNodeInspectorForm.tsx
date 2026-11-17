import React, { useState } from 'react';
import type { Edge, Node } from '@xyflow/react';
import {
  FLUID_META,
  HydraulicEdgeData,
  HydraulicFluidType,
  HydraulicNodeData,
  HydraulicPort,
  HydraulicPortDirection,
  HydraulicPortSide
} from '../../../types/hydraulicPlanar';
import { PIPE_DIAMETER_TABLE } from '../../../utils/hydraulicCalculations';

interface HydraulicNodeInspectorFormProps {
  selectedNode: Node<HydraulicNodeData>;
  nodes?: Node<HydraulicNodeData>[];
  edges?: Edge<HydraulicEdgeData>[];
  onUpdateNodeData: (nodeId: string, updater: (prev: HydraulicNodeData) => HydraulicNodeData) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateEdgeData?: (edgeId: string, updater: (prev: HydraulicEdgeData) => HydraulicEdgeData) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onSelectEdge?: (edgeId: string) => void;
}

export const HydraulicNodeInspectorForm: React.FC<HydraulicNodeInspectorFormProps> = ({
  selectedNode,
  nodes = [],
  edges = [],
  onUpdateNodeData,
  onDeleteNode,
  onUpdateEdgeData,
  onDeleteEdge,
  onSelectEdge
}) => {
  const [newPortLabel, setNewPortLabel] = useState('');
  const [newPortFluid, setNewPortFluid] = useState<HydraulicFluidType>('cold');
  const [newPortSide, setNewPortSide] = useState<HydraulicPortSide>('right');
  const [newPortDir, setNewPortDir] = useState<HydraulicPortDirection>('bidirectional');
  const [editingPortId, setEditingPortId] = useState<string | null>(null);

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

  const handleUpdatePort = (portId: string, patch: Partial<HydraulicPort>) => {
    onUpdateNodeData(selectedNode.id, (prev) => ({
      ...prev,
      ports: prev.ports.map((p) => (p.id === portId ? { ...p, ...patch } : p))
    }));
  };

  const handleAddPort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortLabel.trim()) return;
    const port: HydraulicPort = {
      id: `hport_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: newPortLabel.trim(),
      fluidType: newPortFluid,
      side: newPortSide,
      direction: newPortDir
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
          Subtítulo / Especificação
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
            Cap. (L)
            <input
              type="number"
              step="1"
              value={selectedNode.data.capacityLiters}
              onChange={(e) =>
                onUpdateNodeData(selectedNode.id, (prev) => ({
                  ...prev,
                  capacityLiters: Math.max(0, parseFloat(e.target.value) || 0)
                }))
              }
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
            Vazão (L/m)
            <input
              type="number"
              step="0.5"
              value={selectedNode.data.flowLpm}
              onChange={(e) =>
                onUpdateNodeData(selectedNode.id, (prev) => ({
                  ...prev,
                  flowLpm: Math.max(0, parseFloat(e.target.value) || 0)
                }))
              }
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
            Press. (PSI)
            <input
              type="number"
              step="1"
              value={selectedNode.data.pressurePsi}
              onChange={(e) =>
                onUpdateNodeData(selectedNode.id, (prev) => ({
                  ...prev,
                  pressurePsi: Math.max(0, parseFloat(e.target.value) || 0)
                }))
              }
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

        {/* Atalho para alterar cor/fluido de Conexão T, Registro, Seletora ou Joelho */}
        {selectedNode.data.category === 'valves_fittings' && (
          <div style={{ padding: '7px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.5)' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#cbd5e1', marginBottom: '5px' }}>
              🎨 Linha de Fluido das Conexões
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              {(['cold', 'hot', 'gray_drain'] as HydraulicFluidType[]).map((ft) => (
                <button
                  key={ft}
                  type="button"
                  className="btn-compact"
                  onClick={() =>
                    onUpdateNodeData(selectedNode.id, (prev) => ({
                      ...prev,
                      ports: prev.ports.map((p) =>
                        p.fluidType === 'control' ? p : { ...p, fluidType: ft }
                      )
                    }))
                  }
                  style={{
                    fontSize: '9.5px',
                    padding: '4px 2px',
                    borderColor: FLUID_META[ft].color,
                    color: FLUID_META[ft].handleBorder
                  }}
                >
                  {FLUID_META[ft].shortLabel}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Tubos / Mangueiras Conectados a este Componente ─── */}
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
              〰️ Tubos / Linhas Conectadas ({connectedEdges.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {connectedEdges.map((edge) => {
                const isSource = edge.source === selectedNode.id;
                const otherNodeId = isSource ? edge.target : edge.source;
                const otherNode = nodes.find((n) => n.id === otherNodeId);
                const myHandleId = isSource ? edge.sourceHandle : edge.targetHandle;
                const myPort = selectedNode.data.ports.find((p) => p.id === myHandleId);
                const ft = edge.data?.fluidType || myPort?.fluidType || 'cold';
                const fMeta = FLUID_META[ft] || FLUID_META.cold;

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
                            background: fMeta.color,
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
                          title={`${myPort?.label || 'Via'} ➔ ${otherNode?.data.label || otherNodeId}`}
                        >
                          {myPort?.label || 'Via'} ➔ {otherNode?.data.label || 'Componente'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                        {onSelectEdge && (
                          <button
                            type="button"
                            onClick={() => onSelectEdge(edge.id)}
                            title="Abrir inspetor completo deste tubo"
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
                            🔍 Tubo
                          </button>
                        )}
                        {onDeleteEdge && (
                          <button
                            type="button"
                            onClick={() => onDeleteEdge(edge.id)}
                            title="Desconectar / excluir este tubo"
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

                    {/* Edição rápida de Bitola, Comprimento e Fluido direto no Componente */}
                    {onUpdateEdgeData && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr 1fr', gap: '4px' }}>
                        <label style={{ fontSize: '8.5px', color: '#94a3b8' }}>
                          Bitola (mm)
                          <select
                            value={edge.data?.diameterMm ?? 12}
                            onChange={(e) => {
                              const diam = parseInt(e.target.value) || 12;
                              onUpdateEdgeData(edge.id, (prev) => ({
                                ...prev,
                                diameterMm: diam,
                                isManualDiameter: true
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
                            {PIPE_DIAMETER_TABLE.map((d) => (
                              <option key={d.mm} value={d.mm}>
                                Ø{d.mm}mm ({d.inchLabel})
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
                          Fluido
                          <select
                            value={edge.data?.fluidType || 'cold'}
                            onChange={(e) => {
                              const newFt = e.target.value as HydraulicFluidType;
                              onUpdateEdgeData(edge.id, (prev) => ({
                                ...prev,
                                fluidType: newFt,
                                color: FLUID_META[newFt].color,
                                material: FLUID_META[newFt].defaultMaterial
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
                            <option value="cold">Fria</option>
                            <option value="hot">Quente</option>
                            <option value="gray_drain">Esgoto</option>
                            <option value="vent">Respiro</option>
                            <option value="control">Sinal</option>
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

        {/* ─── Editor Completo de Conexões / Vias do Componente ─── */}
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
              🔗 Conexões / Vias ({selectedNode.data.ports.length})
            </span>
            <span style={{ fontSize: '8.5px', color: '#64748b' }}>
              Clique em ✏️ para editar via
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '210px', overflowY: 'auto' }}>
            {selectedNode.data.ports.map((port) => {
              const meta = FLUID_META[port.fluidType] || FLUID_META.cold;
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
                      title="Clique para editar nome, fluido, lado e direção desta via"
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
                      <span style={{ color: '#64748b', fontSize: '9px' }}>
                        ({port.side} · {port.direction === 'in' ? 'IN' : port.direction === 'out' ? 'OUT' : 'Bi'})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => setEditingPortId(isEditing ? null : port.id)}
                        title={isEditing ? 'Fechar edição' : 'Editar conexão/via'}
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
                        title="Remover via"
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

                  {/* Painel Expandido de Edição Inline da Via Hidráulica */}
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
                        placeholder="Nome da via"
                        style={{
                          padding: '3px 6px',
                          borderRadius: '4px',
                          background: 'rgba(2, 6, 23, 0.9)',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          color: '#fff',
                          fontSize: '10px'
                        }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                        <select
                          value={port.fluidType}
                          onChange={(e) =>
                            handleUpdatePort(port.id, { fluidType: e.target.value as HydraulicFluidType })
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
                          <option value="cold">Fria</option>
                          <option value="hot">Quente</option>
                          <option value="gray_drain">Esgoto</option>
                          <option value="vent">Respiro</option>
                          <option value="control">Sinal</option>
                        </select>
                        <select
                          value={port.side}
                          onChange={(e) =>
                            handleUpdatePort(port.id, { side: e.target.value as HydraulicPortSide })
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
                        <select
                          value={port.direction}
                          onChange={(e) =>
                            handleUpdatePort(port.id, { direction: e.target.value as HydraulicPortDirection })
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
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

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
              placeholder="Nova via (ex: Saída Ducha)"
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              <select
                value={newPortFluid}
                onChange={(e) => setNewPortFluid(e.target.value as HydraulicFluidType)}
                style={{
                  padding: '3px',
                  borderRadius: '4px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#fff',
                  fontSize: '9.5px'
                }}
              >
                <option value="cold">Fria</option>
                <option value="hot">Quente</option>
                <option value="gray_drain">Esgoto</option>
                <option value="vent">Respiro</option>
                <option value="control">Sinal</option>
              </select>
              <select
                value={newPortSide}
                onChange={(e) => setNewPortSide(e.target.value as HydraulicPortSide)}
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
              <select
                value={newPortDir}
                onChange={(e) => setNewPortDir(e.target.value as HydraulicPortDirection)}
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
            </div>
            <button
              type="submit"
              className="btn-compact primary"
              style={{ fontSize: '10px', padding: '4px', fontWeight: 700 }}
            >
              + Adicionar Conexão
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
