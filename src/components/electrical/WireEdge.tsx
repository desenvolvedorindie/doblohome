import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type Edge,
  type EdgeProps
} from '@xyflow/react';
import { ElectricalEdgeData, ElectricalEdgeStyle, POLARITY_META } from '../../types/electricalPlanar';

type WireEdgeType = Edge<
  ElectricalEdgeData & { edgeStyle?: ElectricalEdgeStyle },
  'wire'
>;

function getStrokeWidthFromGauge(gaugeMm2: number): number {
  if (gaugeMm2 >= 50) return 5.5;
  if (gaugeMm2 >= 25) return 4.5;
  if (gaugeMm2 >= 10) return 3.6;
  if (gaugeMm2 >= 6) return 3.0;
  if (gaugeMm2 >= 4) return 2.6;
  return 2.2;
}

export const WireEdge: React.FC<EdgeProps<WireEdgeType>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}) => {
  const edgeStyle = data?.edgeStyle || 'smoothstep';

  const pathParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  };

  const [edgePath, labelX, labelY] =
    edgeStyle === 'straight'
      ? getStraightPath(pathParams)
      : edgeStyle === 'default'
        ? getBezierPath(pathParams)
        : getSmoothStepPath({ ...pathParams, borderRadius: 10 });

  const polarity = data?.polarity || 'pos';
  const rawColor = data?.color || POLARITY_META[polarity]?.color || '#ef4444';
  // Garante alto contraste para fios negativos (-) no fundo escuro do diagrama
  const displayStroke =
    polarity === 'neg' && (rawColor === '#1e293b' || rawColor === '#0f172a')
      ? '#94a3b8'
      : rawColor;

  const gaugeMm2 = data?.gaugeMm2 ?? 2.5;
  const currentAmps = data?.currentAmps ?? 0;
  const lengthMeters = data?.lengthMeters ?? 1.5;
  const isOverloaded = Boolean(data?.isOverloaded);

  const strokeWidth = getStrokeWidthFromGauge(gaugeMm2);

  return (
    <>
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke="#ffffff"
          strokeOpacity={0.35}
          strokeWidth={strokeWidth + 5}
          strokeLinecap="round"
        />
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isOverloaded ? '#ef4444' : displayStroke,
          strokeWidth: selected ? strokeWidth + 1.2 : strokeWidth,
          strokeDasharray: polarity === 'signal' ? '5 4' : isOverloaded ? '7 4' : undefined,
          filter: selected ? `drop-shadow(0 0 6px ${displayStroke})` : undefined
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            cursor: 'pointer'
          }}
          className="nodrag nopan"
        >
          <div
            title={
              isOverloaded
                ? data?.overloadWarning || 'Sobrecarga detectada! Clique para inspecionar.'
                : `Cabo ${POLARITY_META[polarity]?.label || polarity} • Queda: ${data?.voltageDropPercent ?? 0}% • Clique para editar`
            }
            style={{
              background: isOverloaded
                ? 'rgba(127, 29, 29, 0.96)'
                : selected
                  ? 'rgba(14, 165, 233, 0.95)'
                  : 'rgba(15, 23, 42, 0.92)',
              border: isOverloaded
                ? '1.5px solid #f87171'
                : selected
                  ? '1.5px solid #ffffff'
                  : `1px solid ${displayStroke}`,
              color: isOverloaded ? '#fecaca' : '#f8fafc',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              padding: '2px 7px',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.55)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: displayStroke,
                border: '1px solid rgba(255,255,255,0.4)'
              }}
            />
            {isOverloaded && <span>⚠️</span>}
            <span>
              {data?.customLabel
                ? data.customLabel
                : `${gaugeMm2}mm² - ${currentAmps}A - ${lengthMeters}m`}
            </span>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
