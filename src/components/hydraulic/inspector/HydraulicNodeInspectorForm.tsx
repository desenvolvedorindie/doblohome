import React, { useState } from 'react';
import type { Node } from '@xyflow/react';
import {
  FLUID_META,
  HydraulicFluidType,
  HydraulicNodeData,
  HydraulicPort,
  HydraulicPortDirection,
  HydraulicPortSide
} from '../../../types/hydraulicPlanar';

interface HydraulicNodeInspectorFormProps {
  selectedNode: Node<HydraulicNodeData>;
  onUpdateNodeData: (nodeId: string, updater: (prev: HydraulicNodeData) => HydraulicNodeData) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const HydraulicNodeInspectorForm: React.FC<HydraulicNodeInspectorFormProps> = ({
  selectedNode,
  onUpdateNodeData,
  onDeleteNode
}) => {
  const [newPortLabel, setNewPortLabel] = useState('');
  const [newPortFluid, setNewPortFluid] = useState<HydraulicFluidType>('cold');
  const [newPortSide, setNewPortSide] = useState<HydraulicPortSide>('right');
  const [newPortDir, setNewPortDir] = useState<HydraulicPortDirection>('bidirectional');

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

        {/* Editor de Conexões / Pinos */}
        <div style={{ padding: '7px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.5)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: '#cbd5e1' }}>
            🔗 Conexões / Vias ({selectedNode.data.ports.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '130px', overflowY: 'auto' }}>
            {selectedNode.data.ports.map((port) => {
              const meta = FLUID_META[port.fluidType] || FLUID_META.cold;
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
                    <span style={{ color: '#64748b', fontSize: '9px' }}>({port.side})</span>
                  </div>
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
                      fontSize: '11px'
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleAddPort} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(148, 163, 184, 0.14)', paddingTop: '6px' }}>
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
