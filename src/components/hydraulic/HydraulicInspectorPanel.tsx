import React, { useEffect, useState } from 'react';
import type { Edge, Node } from '@xyflow/react';
import {
  FLUID_META,
  HydraulicEdgeData,
  HydraulicFluidType,
  HydraulicNodeData,
  HydraulicPipeMaterial,
  HydraulicPort,
  HydraulicPortDirection,
  HydraulicPortSide,
  PIPE_MATERIAL_META
} from '../../types/hydraulicPlanar';
import {
  PIPE_DIAMETER_TABLE,
  calculateHydraulicBom,
  formatDiameterLabel
} from '../../utils/hydraulicCalculations';

interface HydraulicInspectorPanelProps {
  nodes: Node<HydraulicNodeData>[];
  edges: Edge<HydraulicEdgeData>[];
  selectedNode: Node<HydraulicNodeData> | null;
  selectedEdge: Edge<HydraulicEdgeData> | null;
  onUpdateNodeData: (nodeId: string, updater: (prev: HydraulicNodeData) => HydraulicNodeData) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateEdgeData: (edgeId: string, updater: (prev: HydraulicEdgeData) => HydraulicEdgeData) => void;
  onDeleteEdge: (edgeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
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
  onSelectEdge
}) => {
  const [activeTab, setActiveTab] = useState<'inspector' | 'bom'>('inspector');
  const [newPortLabel, setNewPortLabel] = useState('');
  const [newPortFluid, setNewPortFluid] = useState<HydraulicFluidType>('cold');
  const [newPortSide, setNewPortSide] = useState<HydraulicPortSide>('right');
  const [newPortDir, setNewPortDir] = useState<HydraulicPortDirection>('bidirectional');

  const bom = calculateHydraulicBom(nodes, edges);
  const overloadedEdges = edges.filter((e) => e.data?.isOverloaded);

  useEffect(() => {
    if (selectedNode?.id || selectedEdge?.id) {
      setActiveTab('inspector');
    }
  }, [selectedNode?.id, selectedEdge?.id]);

  const showBom = activeTab === 'bom';

  const handleAddPort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode || !newPortLabel.trim()) return;
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
    <aside
      className="glass-panel"
      style={{
        width: '320px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '12px',
        gap: '10px',
        background: 'rgba(10, 15, 26, 0.92)',
        border: '1px solid rgba(56, 189, 248, 0.3)'
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
          <>
            {/* Lista de Mangueiras / Tubos */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                padding: '9px'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
                〰️ Mangueiras & Tubos ({bom.totalPipeMeters}m total)
              </div>
              {bom.pipes.length === 0 ? (
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                  Conecte os componentes no diagrama para calcular a metragem por linha, material e bitola.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {bom.pipes.map((p) => (
                    <div
                      key={`${p.fluidType}_${p.material}_${p.diameterMm}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 7px',
                        borderRadius: '6px',
                        background: 'rgba(2, 6, 23, 0.45)',
                        border: '1px solid rgba(148, 163, 184, 0.14)',
                        fontSize: '11px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: p.color,
                            border: '1px solid rgba(255,255,255,0.4)'
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#f1f5f9' }}>
                            {p.diameterLabel} · {p.fluidLabel}
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                            {p.materialLabel} · {p.segmentCount} trecho(s)
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          color: '#38bdf8'
                        }}
                      >
                        {p.totalMeters} m
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {bom.estimatedPushConnectors > 0 && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '5px 7px',
                    borderRadius: '6px',
                    background: 'rgba(14, 165, 233, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontSize: '10px',
                    color: '#bae6fd',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>🔗 Engates Rápidos / Abraçadeiras est.:</span>
                  <strong>{bom.estimatedPushConnectors} un</strong>
                </div>
              )}
            </div>

            {/* Válvulas, Conexões e Tanques */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                padding: '9px'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>
                📦 Conexões, Válvulas & Tanques ({nodes.length})
              </div>
              {bom.components.length === 0 ? (
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                  Diagrama vazio.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {bom.components.map((comp) => (
                    <div
                      key={comp.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 7px',
                        borderRadius: '6px',
                        background: 'rgba(2, 6, 23, 0.45)',
                        fontSize: '10.5px'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <span style={{ marginRight: '5px' }}>{comp.icon}</span>
                        <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{comp.label}</span>
                        <span style={{ color: '#94a3b8', marginLeft: '5px', fontSize: '9.5px' }}>
                          {comp.detail}
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#34d399', marginLeft: '6px' }}>
                        ×{comp.qty}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : selectedEdge ? (
          /* INSPETOR DE TUBULAÇÃO / MANGUEIRA */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '8px',
                padding: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
                  〰️ Propriedades do Tubo
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteEdge(selectedEdge.id)}
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
                  🗑️ Excluir Linha
                </button>
              </div>

              {selectedEdge.data?.isOverloaded && (
                <div
                  style={{
                    marginBottom: '8px',
                    padding: '7px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.6)',
                    color: '#fecaca',
                    fontSize: '10.5px',
                    fontWeight: 700
                  }}
                >
                  ⚠️ {selectedEdge.data.warning}
                </div>
              )}

              {/* Tipo de Fluido / Cor */}
              <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
                Linha / Fluido & Cor
                <select
                  value={selectedEdge.data?.fluidType || 'cold'}
                  onChange={(e) => {
                    const ft = e.target.value as HydraulicFluidType;
                    onUpdateEdgeData(selectedEdge.id, (prev) => ({
                      ...prev,
                      fluidType: ft,
                      color: FLUID_META[ft].color,
                      material: FLUID_META[ft].defaultMaterial
                    }));
                  }}
                  style={{
                    width: '100%',
                    marginTop: '3px',
                    padding: '6px',
                    borderRadius: '6px',
                    background: 'rgba(2, 6, 23, 0.85)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#f8fafc',
                    fontSize: '11px'
                  }}
                >
                  {Object.values(FLUID_META).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Material da Mangueira/Tubo */}
              <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
                Material da Tubulação
                <select
                  value={selectedEdge.data?.material || 'pu_pushfit'}
                  onChange={(e) => {
                    const mat = e.target.value as HydraulicPipeMaterial;
                    onUpdateEdgeData(selectedEdge.id, (prev) => ({
                      ...prev,
                      material: mat
                    }));
                  }}
                  style={{
                    width: '100%',
                    marginTop: '3px',
                    padding: '6px',
                    borderRadius: '6px',
                    background: 'rgba(2, 6, 23, 0.85)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#f8fafc',
                    fontSize: '11px'
                  }}
                >
                  {Object.values(PIPE_MATERIAL_META).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Comprimento (m) */}
              <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
                Comprimento (metros):{' '}
                <strong style={{ color: '#f8fafc' }}>{selectedEdge.data?.lengthMeters ?? 1.5} m</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="range"
                    min="0.2"
                    max="15"
                    step="0.1"
                    value={selectedEdge.data?.lengthMeters ?? 1.5}
                    onChange={(e) => {
                      const len = parseFloat(e.target.value) || 0.5;
                      onUpdateEdgeData(selectedEdge.id, (prev) => ({
                        ...prev,
                        lengthMeters: len
                      }));
                    }}
                    style={{ flex: 1, accentColor: '#38bdf8' }}
                  />
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={selectedEdge.data?.lengthMeters ?? 1.5}
                    onChange={(e) => {
                      const len = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                      onUpdateEdgeData(selectedEdge.id, (prev) => ({
                        ...prev,
                        lengthMeters: len
                      }));
                    }}
                    style={{
                      width: '62px',
                      padding: '4px 6px',
                      borderRadius: '5px',
                      background: 'rgba(2, 6, 23, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      color: '#fff',
                      fontSize: '11px',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </label>

              {/* Vazão Automática vs Manual */}
              <div style={{ marginBottom: '8px', padding: '7px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.45)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 700 }}>Vazão Estimada (L/min)</span>
                  <label style={{ fontSize: '9.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedEdge.data?.isManualFlow)}
                      onChange={(e) =>
                        onUpdateEdgeData(selectedEdge.id, (prev) => ({
                          ...prev,
                          isManualFlow: e.target.checked
                        }))
                      }
                    />
                    Manual
                  </label>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  disabled={!selectedEdge.data?.isManualFlow}
                  value={selectedEdge.data?.flowLpm ?? 0}
                  onChange={(e) => {
                    const flow = Math.max(0, parseFloat(e.target.value) || 0);
                    onUpdateEdgeData(selectedEdge.id, (prev) => ({
                      ...prev,
                      flowLpm: flow,
                      isManualFlow: true
                    }));
                  }}
                  style={{
                    width: '100%',
                    padding: '5px 7px',
                    borderRadius: '5px',
                    background: selectedEdge.data?.isManualFlow ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
              </div>

              {/* Diâmetro Automático vs Manual */}
              <div style={{ marginBottom: '8px', padding: '7px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.45)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 700 }}>
                    Bitola (Sugestão: {formatDiameterLabel(selectedEdge.data?.suggestedDiameterMm ?? 12)})
                  </span>
                  <label style={{ fontSize: '9.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedEdge.data?.isManualDiameter)}
                      onChange={(e) =>
                        onUpdateEdgeData(selectedEdge.id, (prev) => ({
                          ...prev,
                          isManualDiameter: e.target.checked
                        }))
                      }
                    />
                    Manual
                  </label>
                </div>
                <select
                  disabled={!selectedEdge.data?.isManualDiameter}
                  value={selectedEdge.data?.diameterMm ?? 12}
                  onChange={(e) => {
                    const diam = parseInt(e.target.value) || 12;
                    onUpdateEdgeData(selectedEdge.id, (prev) => ({
                      ...prev,
                      diameterMm: diam,
                      isManualDiameter: true
                    }));
                  }}
                  style={{
                    width: '100%',
                    padding: '5px 7px',
                    borderRadius: '5px',
                    background: selectedEdge.data?.isManualDiameter ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                >
                  {PIPE_DIAMETER_TABLE.map((d) => (
                    <option key={d.mm} value={d.mm}>
                      {d.mm}mm ({d.inchLabel}) — até {d.maxLpmSafe} L/min
                    </option>
                  ))}
                </select>
              </div>

              {/* Texto personalizado */}
              <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
                Rótulo personalizado (opcional)
                <input
                  type="text"
                  value={selectedEdge.data?.customLabel || ''}
                  placeholder="Ex: Ladrão, Sucção Bomba..."
                  onChange={(e) =>
                    onUpdateEdgeData(selectedEdge.id, (prev) => ({
                      ...prev,
                      customLabel: e.target.value
                    }))
                  }
                  style={{
                    width: '100%',
                    marginTop: '3px',
                    padding: '5px 7px',
                    borderRadius: '5px',
                    background: 'rgba(2, 6, 23, 0.85)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
              </label>

              {/* Métricas Técnicas */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  fontSize: '10px',
                  background: 'rgba(2, 6, 23, 0.55)',
                  padding: '8px',
                  borderRadius: '6px'
                }}
              >
                <div>
                  <div style={{ color: '#94a3b8' }}>Velocidade Fluido</div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: (selectedEdge.data?.velocityMs ?? 0) > 2.5 ? '#f87171' : '#34d399'
                    }}
                  >
                    {selectedEdge.data?.velocityMs ?? 0} m/s
                  </div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8' }}>Perda de Carga</div>
                  <div style={{ fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                    {selectedEdge.data?.headLossPsi ?? 0} PSI
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : selectedNode ? (
          /* INSPETOR DE COMPONENTE */
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
