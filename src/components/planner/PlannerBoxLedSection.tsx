import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, BoxLedEdge } from '../../types';

interface PlannerBoxLedSectionProps {
  selectedBox: InternalBoxItem;
}

const EDGE_OPTIONS: Array<{ key: BoxLedEdge; label: string }> = [
  { key: 'rear', label: '▼ Traseira' },
  { key: 'front', label: '▲ Frente' },
  { key: 'left', label: '◀ Esquerda' },
  { key: 'right', label: '▶ Direita' }
];

const COLOR_PRESETS: Array<{ value: string; label: string }> = [
  { value: '#fef3c7', label: '💡 3000K Quente' },
  { value: '#ffffff', label: '☀️ 4000K Neutro' },
  { value: '#38bdf8', label: '🌊 Azul Camper' },
  { value: '#f59e0b', label: '🔥 Âmbar' }
];

export const PlannerBoxLedSection: React.FC<PlannerBoxLedSectionProps> = ({ selectedBox }) => {
  const { updateInternalBox } = useSolar();

  const isLedEnabled = Boolean(selectedBox.hasLedCorner || selectedBox.ledCorner?.enabled);
  const currentEdges: BoxLedEdge[] =
    selectedBox.ledCorner?.edges && selectedBox.ledCorner.edges.length > 0
      ? selectedBox.ledCorner.edges
      : ['rear'];
  const currentColor = selectedBox.ledCorner?.color || '#fef3c7';
  const currentBrightness = selectedBox.ledCorner?.brightness ?? 85;

  const toggleLed = () => {
    const next = !isLedEnabled;
    updateInternalBox(selectedBox.id, {
      hasLedCorner: next,
      ledCorner: {
        enabled: next,
        color: currentColor,
        brightness: currentBrightness,
        edges: currentEdges
      }
    });
  };

  const toggleEdge = (edge: BoxLedEdge) => {
    const exists = currentEdges.includes(edge);
    const nextEdges = exists
      ? currentEdges.filter((e) => e !== edge)
      : [...currentEdges, edge];

    if (nextEdges.length === 0) {
      // Se desmarcar todas as quinas, desativa o perfil LED automaticamente
      updateInternalBox(selectedBox.id, {
        hasLedCorner: false,
        ledCorner: {
          enabled: false,
          color: currentColor,
          brightness: currentBrightness,
          edges: []
        }
      });
      return;
    }

    updateInternalBox(selectedBox.id, {
      hasLedCorner: true,
      ledCorner: {
        enabled: true,
        color: currentColor,
        brightness: currentBrightness,
        edges: nextEdges
      }
    });
  };

  return (
    <div
      style={{
        marginTop: '10px',
        padding: '10px',
        background: isLedEnabled ? 'rgba(245, 158, 11, 0.08)' : 'rgba(15, 23, 42, 0.5)',
        border: isLedEnabled
          ? '1px solid rgba(245, 158, 11, 0.4)'
          : '1px dashed rgba(148, 163, 184, 0.3)',
        borderRadius: '8px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: isLedEnabled ? '#fbbf24' : '#94a3b8' }}>
            💡 Perfil de LED Inferior (Quina do Módulo)
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
            {isLedEnabled
              ? `Ativo nas quinas: ${currentEdges.map((e) => EDGE_OPTIONS.find((o) => o.key === e)?.label.replace(/^[^\s]+\s/, '') || e).join(', ')}`
              : 'Desabilitado neste módulo.'}
          </div>
        </div>
        <button
          type="button"
          className="btn-compact"
          onClick={toggleLed}
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            padding: '5px 10px',
            background: isLedEnabled ? 'rgba(239, 68, 68, 0.16)' : 'rgba(245, 158, 11, 0.2)',
            borderColor: isLedEnabled ? 'rgba(239, 68, 68, 0.5)' : '#f59e0b',
            color: isLedEnabled ? '#f87171' : '#fbbf24',
            whiteSpace: 'nowrap'
          }}
        >
          {isLedEnabled ? '🚫 Desabilitar LED' : '➕ Habilitar LED'}
        </button>
      </div>

      {isLedEnabled && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Quinas */}
          <div>
            <label style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Quinas Inferiores com Perfil LED:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {EDGE_OPTIONS.map((opt) => {
                const active = currentEdges.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => toggleEdge(opt.key)}
                    style={{
                      padding: '4px 6px',
                      borderRadius: '5px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: active ? '1.5px solid #fbbf24' : '1px solid rgba(148, 163, 184, 0.25)',
                      background: active ? 'rgba(245, 158, 11, 0.22)' : 'rgba(30, 41, 59, 0.65)',
                      color: active ? '#fbbf24' : '#94a3b8'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cor & Brilho */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                Temperatura / Cor:
              </label>
              <select
                value={currentColor}
                onChange={(e) =>
                  updateInternalBox(selectedBox.id, {
                    hasLedCorner: true,
                    ledCorner: {
                      enabled: true,
                      color: e.target.value,
                      brightness: currentBrightness,
                      edges: currentEdges
                    }
                  })
                }
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '5px',
                  fontSize: '10.5px',
                  fontWeight: 600
                }}
              >
                {COLOR_PRESETS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', marginBottom: '2px' }}>
                <span>Brilho:</span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>{currentBrightness}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={currentBrightness}
                onChange={(e) =>
                  updateInternalBox(selectedBox.id, {
                    hasLedCorner: true,
                    ledCorner: {
                      enabled: true,
                      color: currentColor,
                      brightness: parseInt(e.target.value),
                      edges: currentEdges
                    }
                  })
                }
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
