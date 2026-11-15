import React, { useEffect, useState } from 'react';
import type { Edge, Node } from '@xyflow/react';
import {
  ElectricalEdgeData,
  ElectricalNodeData,
  ElectricalPort,
  ElectricalPortDirection,
  ElectricalPortPolarity,
  ElectricalPortSide,
  FUSE_COLOR_TABLE,
  POLARITY_META,
  buildBreakerPorts,
  buildBusbarPorts,
  buildFuseBoxPorts,
  getFuseColorSpec,
  suggestBladeFuseAmps
} from '../../types/electricalPlanar';
import {
  COPPER_WIRE_TABLE,
  STANDARD_PROTECTION_RATINGS,
  calculateElectricalBom
} from '../../utils/electricalCalculations';

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
  onSelectEdge
}) => {
  const [activeTab, setActiveTab] = useState<'inspector' | 'bom'>('inspector');
  const [newPortLabel, setNewPortLabel] = useState('');
  const [newPortPolarity, setNewPortPolarity] = useState<ElectricalPortPolarity>('pos');
  const [newPortSide, setNewPortSide] = useState<ElectricalPortSide>('right');
  const [newPortDir, setNewPortDir] = useState<ElectricalPortDirection>('bidirectional');

  const bom = calculateElectricalBom(nodes, edges);
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
    const port: ElectricalPort = {
      id: `port_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: newPortLabel.trim(),
      polarity: newPortPolarity,
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

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '2px' }}>
        {showBom ? (
          <>
            {/* Lista de Cabos */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                padding: '9px'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
                🧵 Cabos Flexíveis ({bom.totalCableMeters}m total)
              </div>
              {bom.cables.length === 0 ? (
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                  Ligue os componentes com fios no diagrama para calcular a metragem por cor e bitola.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {bom.cables.map((c) => (
                    <div
                      key={`${c.polarity}_${c.gaugeMm2}`}
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
                            background: c.polarity === 'neg' ? '#334155' : c.color,
                            border: '1px solid rgba(255,255,255,0.4)'
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#f1f5f9' }}>
                            {c.gaugeMm2} mm² · {c.polarityLabel}
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                            {c.wireCount} trecho(s)
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
                        {c.totalMeters} m
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de Fusíveis */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                padding: '9px'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', marginBottom: '6px' }}>
                🛡️ Fusíveis Lâmina ({bom.totalFuses} un)
              </div>
              {bom.fuses.length === 0 ? (
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                  Nenhuma Caixa de Fusíveis adicionada ao diagrama ainda.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {bom.fuses.map((f) => (
                    <div
                      key={f.amps}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 7px',
                        borderRadius: '6px',
                        background: 'rgba(2, 6, 23, 0.5)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        fontSize: '10.5px'
                      }}
                    >
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '2px',
                          background: f.hex
                        }}
                      />
                      <span style={{ fontWeight: 800, color: '#f8fafc' }}>{f.amps}A</span>
                      <span style={{ color: '#94a3b8' }}>({f.colorName})</span>
                      <span style={{ fontWeight: 800, color: '#fbbf24' }}>×{f.qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Equipamentos e Proteções */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                padding: '9px'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>
                📦 Componentes no Diagrama ({nodes.length})
              </div>
              {bom.equipment.length === 0 ? (
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                  Diagrama vazio.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {bom.equipment.map((eq) => (
                    <div
                      key={eq.key}
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
                        <span style={{ marginRight: '5px' }}>{eq.icon}</span>
                        <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{eq.label}</span>
                        <span style={{ color: '#94a3b8', marginLeft: '5px', fontSize: '9.5px' }}>
                          {eq.detail}
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#34d399', marginLeft: '6px' }}>
                        ×{eq.qty}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabela de Referência de Cores de Fusíveis Automotivos */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.16)',
                borderRadius: '8px',
                padding: '8px'
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#cbd5e1', marginBottom: '5px' }}>
                🎨 Referência Padrão de Fusíveis Automotivos
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {FUSE_COLOR_TABLE.map((f) => (
                  <div
                    key={f.amps}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '9.5px',
                      color: '#cbd5e1'
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        minWidth: '28px',
                        textAlign: 'center',
                        fontWeight: 800,
                        borderRadius: '3px',
                        background: f.hex,
                        color: f.textColor,
                        padding: '1px 3px'
                      }}
                    >
                      {f.amps}A
                    </span>
                    <span>{f.colorName}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : selectedEdge ? (
          /* INSPETOR DE CABO / FIO */
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
                  〰️ Propriedades do Cabo
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
                  🗑️ Excluir Fio
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
                  ⚠️ {selectedEdge.data.overloadWarning}
                </div>
              )}

              {/* Polaridade / Cor */}
              <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
                Polaridade & Cor do Fio
                <select
                  value={selectedEdge.data?.polarity || 'pos'}
                  onChange={(e) => {
                    const pol = e.target.value as ElectricalPortPolarity;
                    onUpdateEdgeData(selectedEdge.id, (prev) => ({
                      ...prev,
                      polarity: pol,
                      color: POLARITY_META[pol].color
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
                  {Object.values(POLARITY_META).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Comprimento (m) */}
              <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
                Comprimento do Cabo (metros):{' '}
                <strong style={{ color: '#f8fafc' }}>{selectedEdge.data?.lengthMeters ?? 1.5} m</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="range"
                    min="0.3"
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

              {/* Corrente (A) Automática vs Manual */}
              <div style={{ marginBottom: '8px', padding: '7px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.45)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 700 }}>Corrente no Circuito (A)</span>
                  <label style={{ fontSize: '9.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedEdge.data?.isManualAmps)}
                      onChange={(e) =>
                        onUpdateEdgeData(selectedEdge.id, (prev) => ({
                          ...prev,
                          isManualAmps: e.target.checked
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
                  disabled={!selectedEdge.data?.isManualAmps}
                  value={selectedEdge.data?.currentAmps ?? 0}
                  onChange={(e) => {
                    const amps = Math.max(0, parseFloat(e.target.value) || 0);
                    onUpdateEdgeData(selectedEdge.id, (prev) => ({
                      ...prev,
                      currentAmps: amps,
                      isManualAmps: true
                    }));
                  }}
                  style={{
                    width: '100%',
                    padding: '5px 7px',
                    borderRadius: '5px',
                    background: selectedEdge.data?.isManualAmps ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
              </div>

              {/* Bitola (mm²) Automática vs Manual */}
              <div style={{ marginBottom: '8px', padding: '7px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.45)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 700 }}>
                    Bitola do Cabo (Sugestão: {selectedEdge.data?.suggestedGaugeMm2 ?? 2.5}mm²)
                  </span>
                  <label style={{ fontSize: '9.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedEdge.data?.isManualGauge)}
                      onChange={(e) =>
                        onUpdateEdgeData(selectedEdge.id, (prev) => ({
                          ...prev,
                          isManualGauge: e.target.checked
                        }))
                      }
                    />
                    Manual
                  </label>
                </div>
                <select
                  disabled={!selectedEdge.data?.isManualGauge}
                  value={selectedEdge.data?.gaugeMm2 ?? 2.5}
                  onChange={(e) => {
                    const g = parseFloat(e.target.value) || 2.5;
                    onUpdateEdgeData(selectedEdge.id, (prev) => ({
                      ...prev,
                      gaugeMm2: g,
                      isManualGauge: true
                    }));
                  }}
                  style={{
                    width: '100%',
                    padding: '5px 7px',
                    borderRadius: '5px',
                    background: selectedEdge.data?.isManualGauge ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                >
                  {COPPER_WIRE_TABLE.map((w) => (
                    <option key={w.mm2} value={w.mm2}>
                      {w.mm2} mm² (até {w.maxAmps}A contínuo)
                    </option>
                  ))}
                </select>
              </div>

              {/* Rótulo personalizado opcional */}
              <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
                Texto personalizado no fio (opcional)
                <input
                  type="text"
                  value={selectedEdge.data?.customLabel || ''}
                  placeholder={`${selectedEdge.data?.gaugeMm2}mm² - ${selectedEdge.data?.currentAmps}A - ${selectedEdge.data?.lengthMeters}m`}
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
                  <div style={{ color: '#94a3b8' }}>Tensão Circuito</div>
                  <div style={{ fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                    {selectedEdge.data?.voltage ?? 12.8} V
                  </div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8' }}>Fusível/Disj. Sug.</div>
                  <div style={{ fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                    {selectedEdge.data?.suggestedProtectionAmps ?? 10} A
                  </div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8' }}>Queda (ida+volta)</div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: (selectedEdge.data?.voltageDropPercent ?? 0) > 3 ? '#f87171' : '#34d399'
                    }}
                  >
                    {selectedEdge.data?.voltageDropVolts ?? 0}V ({selectedEdge.data?.voltageDropPercent ?? 0}%)
                  </div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8' }}>Bitola Ideal</div>
                  <div style={{ fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {selectedEdge.data?.suggestedGaugeMm2 ?? 2.5} mm²
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : selectedNode ? (
          /* INSPETOR DE COMPONENTE (NODE) */
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
                        amps: a
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

              {/* Config específica: Caixa de Disjuntor */}
              {selectedNode.data.kind === 'breaker' && (
                <div style={{ padding: '7px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.5)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#f87171' }}>
                    🛡️ Configuração do Disjuntor
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <label style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                      Amperagem (A)
                      <select
                        value={selectedNode.data.breakerAmps || 60}
                        onChange={(e) => {
                          const amps = parseInt(e.target.value) || 60;
                          const isAc = selectedNode.data.catalogId === 'breaker_ac';
                          const poles = selectedNode.data.breakerPoles || 2;
                          onUpdateNodeData(selectedNode.id, (prev) => ({
                            ...prev,
                            breakerAmps: amps,
                            ports: buildBreakerPorts(amps, poles, isAc)
                          }));
                        }}
                        style={{
                          width: '100%',
                          marginTop: '2px',
                          padding: '4px',
                          borderRadius: '5px',
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(148, 163, 184, 0.25)',
                          color: '#fff',
                          fontSize: '11px'
                        }}
                      >
                        {STANDARD_PROTECTION_RATINGS.map((r) => (
                          <option key={r} value={r}>
                            {r}A
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                      Polos
                      <select
                        value={selectedNode.data.breakerPoles || 2}
                        onChange={(e) => {
                          const poles = (parseInt(e.target.value) === 1 ? 1 : 2) as 1 | 2;
                          const isAc = selectedNode.data.catalogId === 'breaker_ac';
                          const amps = selectedNode.data.breakerAmps || 60;
                          onUpdateNodeData(selectedNode.id, (prev) => ({
                            ...prev,
                            breakerPoles: poles,
                            ports: buildBreakerPorts(amps, poles, isAc)
                          }));
                        }}
                        style={{
                          width: '100%',
                          marginTop: '2px',
                          padding: '4px',
                          borderRadius: '5px',
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(148, 163, 184, 0.25)',
                          color: '#fff',
                          fontSize: '11px'
                        }}
                      >
                        <option value={1}>1 Polo (Unipolar)</option>
                        <option value={2}>2 Polos (Bipolar)</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {/* Config específica: Barramento */}
              {selectedNode.data.kind === 'busbar' && (
                <div style={{ padding: '7px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.5)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399' }}>
                    Terminais do Barramento
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10.5px', color: '#cbd5e1' }}>
                      Quantidade: <strong>{selectedNode.data.busbarTermCount || 8}</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className="btn-compact"
                        onClick={() => {
                          const next = Math.max(2, (selectedNode.data.busbarTermCount || 8) - 1);
                          const pol = selectedNode.data.busbarPolarity || 'pos';
                          onUpdateNodeData(selectedNode.id, (prev) => ({
                            ...prev,
                            busbarTermCount: next,
                            ports: buildBusbarPorts(pol, next)
                          }));
                        }}
                      >
                        -
                      </button>
                      <button
                        type="button"
                        className="btn-compact"
                        onClick={() => {
                          const next = Math.min(20, (selectedNode.data.busbarTermCount || 8) + 1);
                          const pol = selectedNode.data.busbarPolarity || 'pos';
                          onUpdateNodeData(selectedNode.id, (prev) => ({
                            ...prev,
                            busbarTermCount: next,
                            ports: buildBusbarPorts(pol, next)
                          }));
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Config específica: Caixa de Fusíveis */}
              {selectedNode.data.kind === 'fuse_box' && (
                <div style={{ padding: '7px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.5)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24' }}>
                      🧰 Vias de Fusível ({selectedNode.data.fuseWayCount || 12})
                    </span>
                    <select
                      value={selectedNode.data.fuseWayCount || 12}
                      onChange={(e) => {
                        const ways = parseInt(e.target.value) || 12;
                        onUpdateNodeData(selectedNode.id, (prev) => ({
                          ...prev,
                          fuseWayCount: ways,
                          ports: buildFuseBoxPorts(ways, prev.ports)
                        }));
                      }}
                      style={{
                        padding: '2px 5px',
                        borderRadius: '4px',
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        color: '#fff',
                        fontSize: '10px'
                      }}
                    >
                      {[4, 6, 8, 10, 12].map((w) => (
                        <option key={w} value={w}>
                          {w} Vias
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '185px', overflowY: 'auto' }}>
                    {selectedNode.data.ports
                      .filter((p) => p.id.startsWith('fuse_'))
                      .map((fp) => {
                        const connectedEdges = edges.filter(
                          (ed) =>
                            (ed.source === selectedNode.id && ed.sourceHandle === fp.id) ||
                            (ed.target === selectedNode.id && ed.targetHandle === fp.id)
                        );
                        const connectedAmps = connectedEdges.reduce(
                          (sum, ed) => sum + (ed.data?.currentAmps || 0),
                          0
                        );
                        const hasActiveFuse = Boolean(fp.fuseAmps && fp.fuseAmps > 0);
                        const spec = hasActiveFuse ? getFuseColorSpec(fp.fuseAmps!) : null;
                        return (
                          <div
                            key={fp.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                              fontSize: '10px'
                            }}
                          >
                            <span style={{ color: '#cbd5e1', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              Via {fp.wayIndex}{' '}
                              <span style={{ fontSize: '9px', fontWeight: 500, color: spec ? '#94a3b8' : '#64748b' }}>
                                {spec
                                  ? `${spec.amps}A (${spec.colorName})`
                                  : 'Livre'}
                              </span>
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span
                                style={{
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '2px',
                                  background: spec ? spec.hex : 'rgba(148, 163, 184, 0.2)',
                                  border: spec ? 'none' : '1px dashed rgba(148, 163, 184, 0.45)'
                                }}
                              />
                              <select
                                value={fp.isManualFuse && fp.fuseAmps ? String(fp.fuseAmps) : 'auto'}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === 'auto') {
                                    const autoAmps =
                                      connectedEdges.length > 0
                                        ? suggestBladeFuseAmps(connectedAmps)
                                        : undefined;
                                    onUpdateNodeData(selectedNode.id, (prev) => ({
                                      ...prev,
                                      ports: prev.ports.map((p) =>
                                        p.id === fp.id
                                          ? {
                                            ...p,
                                            fuseAmps: autoAmps,
                                            isManualFuse: false,
                                            maxAmps: autoAmps ?? 40,
                                            label: autoAmps ? `F${p.wayIndex} (${autoAmps}A)` : `F${p.wayIndex}`
                                          }
                                          : p
                                      )
                                    }));
                                    return;
                                  }
                                  const amps = parseInt(raw, 10) || 10;
                                  onUpdateNodeData(selectedNode.id, (prev) => ({
                                    ...prev,
                                    ports: prev.ports.map((p) =>
                                      p.id === fp.id
                                        ? {
                                          ...p,
                                          fuseAmps: amps,
                                          isManualFuse: true,
                                          maxAmps: amps,
                                          label: `F${p.wayIndex} (${amps}A)`
                                        }
                                        : p
                                    )
                                  }));
                                }}
                                style={{
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  background: 'rgba(15, 23, 42, 0.9)',
                                  border: '1px solid rgba(148, 163, 184, 0.25)',
                                  color: '#fff',
                                  fontSize: '10px'
                                }}
                              >
                                <option value="auto">
                                  ⚡ Auto ({connectedEdges.length > 0 ? `${suggestBladeFuseAmps(connectedAmps)}A` : 'Pela Carga'})
                                </option>
                                {FUSE_COLOR_TABLE.map((fc) => (
                                  <option key={fc.amps} value={String(fc.amps)}>
                                    {fc.amps}A ({fc.colorName})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Editor de Terminais / Pinos */}
              <div style={{ padding: '7px', borderRadius: '6px', background: 'rgba(2, 6, 23, 0.5)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#cbd5e1' }}>
                  🔌 Pinos / Terminais ({selectedNode.data.ports.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '120px', overflowY: 'auto' }}>
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
                          title="Remover pino"
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

                {/* Adicionar Novo Pino */}
                <form onSubmit={handleAddPort} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(148, 163, 184, 0.14)', paddingTop: '6px' }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
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
