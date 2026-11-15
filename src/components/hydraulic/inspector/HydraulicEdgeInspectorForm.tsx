import React from 'react';
import type { Edge } from '@xyflow/react';
import {
  FLUID_META,
  HydraulicEdgeData,
  HydraulicFluidType,
  HydraulicPipeMaterial,
  PIPE_MATERIAL_META
} from '../../../types/hydraulicPlanar';
import {
  PIPE_DIAMETER_TABLE,
  formatDiameterLabel
} from '../../../utils/hydraulicCalculations';

interface HydraulicEdgeInspectorFormProps {
  selectedEdge: Edge<HydraulicEdgeData>;
  onUpdateEdgeData: (edgeId: string, updater: (prev: HydraulicEdgeData) => HydraulicEdgeData) => void;
  onDeleteEdge: (edgeId: string) => void;
}

export const HydraulicEdgeInspectorForm: React.FC<HydraulicEdgeInspectorFormProps> = ({
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
  );
};
