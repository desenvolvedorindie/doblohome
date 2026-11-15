import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { RulerAxisLock, RulerSnapType } from '../../types';

const SNAP_BADGE: Record<RulerSnapType, { icon: string; color: string; bg: string }> = {
  vertex: { icon: '🟢', color: '#4ade80', bg: 'rgba(34, 197, 94, 0.18)' },
  midpoint: { icon: '🔵', color: '#22d3ee', bg: 'rgba(6, 182, 212, 0.18)' },
  face_center: { icon: '🟣', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.18)' },
  edge: { icon: '🔴', color: '#f87171', bg: 'rgba(239, 68, 68, 0.18)' },
  face: { icon: '🔷', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.18)' }
};

const AXIS_BUTTONS: Array<{ axis: RulerAxisLock; label: string; activeColor: string; activeBg: string }> = [
  { axis: null, label: '🌐 Livre', activeColor: '#facc15', activeBg: 'rgba(250, 204, 21, 0.22)' },
  { axis: 'x', label: '🔴 Eixo X (←/→)', activeColor: '#f87171', activeBg: 'rgba(239, 68, 68, 0.24)' },
  { axis: 'y', label: '🔵 Eixo Y (↑)', activeColor: '#60a5fa', activeBg: 'rgba(59, 130, 246, 0.24)' },
  { axis: 'z', label: '🟢 Eixo Z (↓)', activeColor: '#4ade80', activeBg: 'rgba(34, 197, 94, 0.24)' }
];

export const InternalRulerHUD: React.FC = () => {
  const {
    viewMode,
    rulerState,
    toggleRuler,
    setRulerAxisLock,
    clearRulerMeasurements,
    removeRulerMeasurement
  } = useSolar();

  if (viewMode !== 'internal_boxes') return null;

  const {
    isActive,
    lockedAxis,
    inferredAxis,
    hasStartPoint,
    currentSnap,
    previewDistanceMm,
    previewDeltaXMm,
    previewDeltaYMm,
    previewDeltaZMm,
    measurements
  } = rulerState;

  const snapBadge = currentSnap ? SNAP_BADGE[currentSnap.snapType] : null;
  const activeAxisDisplay = lockedAxis ?? inferredAxis;
  const axisAccent =
    activeAxisDisplay === 'x'
      ? '#f87171'
      : activeAxisDisplay === 'y'
        ? '#60a5fa'
        : activeAxisDisplay === 'z'
          ? '#4ade80'
          : '#facc15';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 45,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        maxWidth: 'calc(100% - 32px)',
        pointerEvents: 'auto'
      }}
    >
      {/* Lista compacta de medidas fixadas no 3D */}
      {measurements.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.90)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '10px',
            padding: '6px 10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            maxWidth: '720px'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginRight: '2px' }}>
            📐 Cotas ({measurements.length}):
          </span>

          {measurements.map((m, idx) => {
            const mColor =
              m.axis === 'x'
                ? '#f87171'
                : m.axis === 'y'
                  ? '#60a5fa'
                  : m.axis === 'z'
                    ? '#4ade80'
                    : '#facc15';
            return (
              <div
                key={m.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(30, 41, 59, 0.92)',
                  border: `1px solid ${mColor}80`,
                  borderRadius: '6px',
                  padding: '3px 7px',
                  fontSize: '11px',
                  color: '#f8fafc'
                }}
                title={`${m.startLabel} → ${m.endLabel} | ΔX ${m.deltaXMm}mm · ΔY ${m.deltaYMm}mm · ΔZ ${m.deltaZMm}mm`}
              >
                <span style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700 }}>#{idx + 1}</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 800, color: mColor }}>
                  {m.distanceMm} mm
                </span>
                <span style={{ color: '#cbd5e1', fontSize: '10px' }}>
                  ({(m.distanceMm / 10).toFixed(1).replace('.', ',')} cm)
                </span>
                {m.axis && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      color: mColor,
                      background: `${mColor}20`,
                      padding: '1px 4px',
                      borderRadius: '3px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {m.axis}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeRulerMeasurement(m.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '13px',
                    lineHeight: 1,
                    padding: '0 2px',
                    fontWeight: 800
                  }}
                  title="Excluir esta medida"
                >
                  ×
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={clearRulerMeasurements}
            style={{
              background: 'rgba(239, 68, 68, 0.16)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              color: '#fca5a5',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Remover todas as cotas da régua"
          >
            🗑️ Limpar Medidas
          </button>
        </div>
      )}

      {/* Barra principal da Régua + VCB em tempo real */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          background: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: isActive
            ? '1.5px solid rgba(245, 158, 11, 0.85)'
            : '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '12px',
          padding: '8px 12px',
          boxShadow: isActive
            ? '0 10px 30px rgba(0, 0, 0, 0.65), 0 0 18px rgba(245, 158, 11, 0.28)'
            : '0 8px 24px rgba(0, 0, 0, 0.55)'
        }}
      >
        <button
          type="button"
          onClick={toggleRuler}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            border: isActive ? '1.5px solid #fbbf24' : '1px solid rgba(245, 158, 11, 0.5)',
            background: isActive
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              : 'rgba(30, 41, 59, 0.9)',
            color: isActive ? '#0f172a' : '#fbbf24',
            fontWeight: 800,
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: isActive ? '0 0 12px rgba(245, 158, 11, 0.45)' : 'none',
            transition: 'all 0.15s ease'
          }}
          title="Ativar / desativar régua de medição 3D (Atalho: T)"
        >
          <span>📏</span>
          <span>Régua (T)</span>
        </button>

        {isActive && (
          <>
            {/* Botões de trava de eixo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              {AXIS_BUTTONS.map((btn) => {
                const isBtnActive = lockedAxis === btn.axis;
                return (
                  <button
                    key={String(btn.axis)}
                    type="button"
                    onClick={() => setRulerAxisLock(isBtnActive && btn.axis !== null ? null : btn.axis)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: isBtnActive ? btn.activeBg : 'rgba(30, 41, 59, 0.7)',
                      border: isBtnActive ? `1px solid ${btn.activeColor}` : '1px solid rgba(148, 163, 184, 0.25)',
                      color: isBtnActive ? btn.activeColor : '#cbd5e1',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>

            {/* VCB - Value Control Box (Leitura em Tempo Real) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(2, 6, 23, 0.72)',
                border: `1px solid ${axisAccent}55`,
                borderRadius: '8px',
                padding: '5px 10px'
              }}
            >
              {hasStartPoint && previewDistanceMm !== null ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '15px',
                        fontWeight: 900,
                        color: axisAccent
                      }}
                    >
                      {previewDistanceMm} mm
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>
                      ({(previewDistanceMm / 10).toFixed(1).replace('.', ',')} cm)
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '10px',
                      color: '#94a3b8'
                    }}
                  >
                    <span style={{ color: '#f87171' }}>ΔX:{previewDeltaXMm ?? 0}</span>
                    <span style={{ color: '#60a5fa' }}>ΔY:{previewDeltaYMm ?? 0}</span>
                    <span style={{ color: '#4ade80' }}>ΔZ:{previewDeltaZMm ?? 0}</span>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0' }}>
                  {hasStartPoint
                    ? 'Mova o cursor até o 2º ponto • Shift/Setas trava eixo • ESC cancela'
                    : 'Clique no 1º ponto para iniciar'}
                </span>
              )}

              {currentSnap && snapBadge && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: snapBadge.bg,
                    border: `1px solid ${snapBadge.color}66`,
                    borderRadius: '6px',
                    padding: '2px 7px',
                    fontSize: '10px'
                  }}
                >
                  <span>{snapBadge.icon}</span>
                  <span style={{ fontWeight: 800, color: snapBadge.color }}>{currentSnap.snapLabel}</span>
                  <span style={{ color: '#cbd5e1', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    • {currentSnap.partName}
                  </span>
                </div>
              )}
            </div>

            {hasStartPoint && (
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                Clique no 2º ponto para fixar • Shift/Setas trava eixo • ESC cancela
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
