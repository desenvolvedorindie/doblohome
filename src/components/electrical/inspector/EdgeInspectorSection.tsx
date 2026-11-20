import React from 'react';
import type { Edge, Node } from '@xyflow/react';
import {
  CONNECTOR_META,
  ElectricalConnectorType,
  ElectricalEdgeData,
  ElectricalNodeData,
  ElectricalPortPolarity,
  POLARITY_META
} from '../../../types/electricalPlanar';
import {
  COPPER_WIRE_TABLE,
  getPortOnNode,
  suggestConnectorForPort
} from '../../../utils/electricalCalculations';
import { ConnectorIllustration } from '../schematic/ConnectorIllustration';

interface EdgeInspectorSectionProps {
  selectedEdge: Edge<ElectricalEdgeData>;
  nodes?: Node<ElectricalNodeData>[];
  onUpdateEdgeData: (
    edgeId: string,
    updater: (prev: ElectricalEdgeData) => ElectricalEdgeData
  ) => void;
  onDeleteEdge: (edgeId: string) => void;
}

export const EdgeInspectorSection: React.FC<EdgeInspectorSectionProps> = ({
  selectedEdge,
  nodes = [],
  onUpdateEdgeData,
  onDeleteEdge
}) => {
  const sNode = nodes.find((n) => n.id === selectedEdge.source);
  const tNode = nodes.find((n) => n.id === selectedEdge.target);
  const sPort = getPortOnNode(sNode, selectedEdge.sourceHandle);
  const tPort = getPortOnNode(tNode, selectedEdge.targetHandle);
  const autoSourceConn = suggestConnectorForPort(sNode, sPort);
  const autoTargetConn = suggestConnectorForPort(tNode, tPort);
  const sourceConnValue = selectedEdge.data?.isManualSourceConnector
    ? selectedEdge.data.sourceConnector || autoSourceConn
    : 'auto';
  const targetConnValue = selectedEdge.data?.isManualTargetConnector
    ? selectedEdge.data.targetConnector || autoTargetConn
    : 'auto';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '8px',
          padding: '10px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}
        >
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
        <div
          style={{
            marginBottom: '8px',
            padding: '7px',
            borderRadius: '6px',
            background: 'rgba(2, 6, 23, 0.45)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}
          >
            <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 700 }}>
              Corrente no Circuito (A)
            </span>
            <label
              style={{
                fontSize: '9.5px',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
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
              background: selectedEdge.data?.isManualAmps
                ? 'rgba(15, 23, 42, 0.9)'
                : 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#fff',
              fontSize: '11px'
            }}
          />
        </div>

        {/* Bitola (mm²) Automática vs Manual */}
        <div
          style={{
            marginBottom: '8px',
            padding: '7px',
            borderRadius: '6px',
            background: 'rgba(2, 6, 23, 0.45)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}
          >
            <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 700 }}>
              Bitola do Cabo (Sugestão: {selectedEdge.data?.suggestedGaugeMm2 ?? 2.5}mm²)
            </span>
            <label
              style={{
                fontSize: '9.5px',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
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
              background: selectedEdge.data?.isManualGauge
                ? 'rgba(15, 23, 42, 0.9)'
                : 'rgba(15, 23, 42, 0.4)',
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

        {/* Conectores nas Pontas do Cabo */}
        <div
          style={{
            marginBottom: '8px',
            padding: '7px',
            borderRadius: '6px',
            background: 'rgba(2, 6, 23, 0.45)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700 }}>
            🔌 Conectores nas Pontas
          </div>

          <label style={{ display: 'block', fontSize: '9.5px', color: '#94a3b8' }}>
            Origem:{' '}
            <strong style={{ color: '#e2e8f0' }}>
              {sNode?.data.label || 'Origem'}
              {sPort ? ` · ${sPort.label}` : ''}
            </strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '4px' }}>
              <ConnectorIllustration
                type={selectedEdge.data?.sourceConnector || autoSourceConn}
                size={34}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <select
                  value={sourceConnValue}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === 'auto') {
                      onUpdateEdgeData(selectedEdge.id, (prev) => ({
                        ...prev,
                        sourceConnector: autoSourceConn,
                        isManualSourceConnector: false
                      }));
                    } else {
                      onUpdateEdgeData(selectedEdge.id, (prev) => ({
                        ...prev,
                        sourceConnector: raw as ElectricalConnectorType,
                        isManualSourceConnector: true
                      }));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '5px 7px',
                    borderRadius: '5px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#fff',
                    fontSize: '10.5px'
                  }}
                >
                  <option value="auto">
                    ⚡ Auto ({CONNECTOR_META[autoSourceConn]?.label || autoSourceConn})
                  </option>
                  {Object.values(CONNECTOR_META).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '2px' }}>
                  {CONNECTOR_META[selectedEdge.data?.sourceConnector || autoSourceConn]?.description}
                </div>
              </div>
            </div>
          </label>

          <label style={{ display: 'block', fontSize: '9.5px', color: '#94a3b8' }}>
            Destino:{' '}
            <strong style={{ color: '#e2e8f0' }}>
              {tNode?.data.label || 'Destino'}
              {tPort ? ` · ${tPort.label}` : ''}
            </strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '4px' }}>
              <ConnectorIllustration
                type={selectedEdge.data?.targetConnector || autoTargetConn}
                size={34}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <select
                  value={targetConnValue}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === 'auto') {
                      onUpdateEdgeData(selectedEdge.id, (prev) => ({
                        ...prev,
                        targetConnector: autoTargetConn,
                        isManualTargetConnector: false
                      }));
                    } else {
                      onUpdateEdgeData(selectedEdge.id, (prev) => ({
                        ...prev,
                        targetConnector: raw as ElectricalConnectorType,
                        isManualTargetConnector: true
                      }));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '5px 7px',
                    borderRadius: '5px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#fff',
                    fontSize: '10.5px'
                  }}
                >
                  <option value="auto">
                    ⚡ Auto ({CONNECTOR_META[autoTargetConn]?.label || autoTargetConn})
                  </option>
                  {Object.values(CONNECTOR_META).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '2px' }}>
                  {CONNECTOR_META[selectedEdge.data?.targetConnector || autoTargetConn]?.description}
                </div>
              </div>
            </div>
          </label>
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
  );
};
