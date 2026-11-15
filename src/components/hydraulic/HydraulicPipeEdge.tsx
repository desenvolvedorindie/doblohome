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
import {
  FLUID_META,
  HydraulicEdgeData,
  HydraulicEdgeStyle
} from '../../types/hydraulicPlanar';
import { formatDiameterLabel } from '../../utils/hydraulicCalculations';

type HydraulicPipeEdgeType = Edge<
  HydraulicEdgeData & { edgeStyle?: HydraulicEdgeStyle },
  'hydraulicPipe'
>;

function getStrokeWidthFromDiameter(diameterMm: number, isControl: boolean): number {
  if (isControl) return 2.0;
  if (diameterMm >= 32) return 5.5;
  if (diameterMm >= 25) return 4.6;
  if (diameterMm >= 16) return 3.6;
  if (diameterMm >= 12) return 3.0;
  return 2.4;
}

export const HydraulicPipeEdge: React.FC<EdgeProps<HydraulicPipeEdgeType>> = ({
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

  const fluidType = data?.fluidType || 'cold';
  const meta = FLUID_META[fluidType] || FLUID_META.cold;
  const strokeColor = data?.color || meta.color;
  const diameterMm = data?.diameterMm ?? meta.defaultDiameterMm;
  const flowLpm = data?.flowLpm ?? 0;
  const lengthMeters = data?.lengthMeters ?? 1.5;
  const isOverloaded = Boolean(data?.isOverloaded);
  const isControl = fluidType === 'control';
  const isDashed = fluidType === 'control' || fluidType === 'vent';

  const strokeWidth = getStrokeWidthFromDiameter(diameterMm, isControl);
  const diameterShort = formatDiameterLabel(diameterMm).split(' ')[0]; // ex: 12mm

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
          stroke: isOverloaded ? '#ef4444' : strokeColor,
          strokeWidth: selected ? strokeWidth + 1.2 : strokeWidth,
          strokeDasharray: isDashed ? '5 4' : isOverloaded ? '7 4' : undefined,
          filter: selected ? `drop-shadow(0 0 6px ${strokeColor})` : undefined
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
                ? data?.warning || 'Restrição hidráulica detectada! Clique para inspecionar.'
                : `${meta.label} • Vel: ${data?.velocityMs ?? 0} m/s • Clique para editar`
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
                  : `1px solid ${strokeColor}`,
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
                background: strokeColor,
                border: '1px solid rgba(255,255,255,0.4)'
              }}
            />
            {isOverloaded && <span>⚠️</span>}
            <span>
              {data?.customLabel
                ? data.customLabel
                : isControl
                  ? 'Acionamento / Vínculo'
                  : flowLpm > 0
                    ? `${diameterShort} - ${flowLpm} L/m - ${lengthMeters}m`
                    : `${diameterShort} - ${lengthMeters}m`}
            </span>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
