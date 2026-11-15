import React from 'react';
import type { Edge } from '@xyflow/react';
import {
  ElectricalEdgeData,
  ElectricalPortPolarity,
  POLARITY_META
} from '../../../types/electricalPlanar';
import { COPPER_WIRE_TABLE } from '../../../utils/electricalCalculations';

interface EdgeInspectorSectionProps {
  selectedEdge: Edge<ElectricalEdgeData>;
  onUpdateEdgeData: (
    edgeId: string,
    updater: (prev: ElectricalEdgeData) => ElectricalEdgeData
  ) => void;
  onDeleteEdge: (edgeId: string) => void;
}

export const EdgeInspectorSection: React.FC<EdgeInspectorSectionProps> = ({
  selectedEdge,
  onUpdateEdgeData,
  onDeleteEdge
}) => {
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
