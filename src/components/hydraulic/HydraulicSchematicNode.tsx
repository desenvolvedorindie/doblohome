import React from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import {
  FLUID_META,
  HydraulicNodeData,
  HydraulicPort
} from '../../types/hydraulicPlanar';

type HydraulicSchematicNodeType = Node<HydraulicNodeData, 'hydraulicSchematic'>;

const CATEGORY_THEME: Record<
  HydraulicNodeData['category'],
  { border: string; headerBg: string; accent: string; badgeBg: string }
> = {
  system_fixed: {
    border: 'rgba(56, 189, 248, 0.55)',
    headerBg: 'rgba(2, 132, 199, 0.2)',
    accent: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.16)'
  },
  water_points: {
    border: 'rgba(34, 197, 94, 0.55)',
    headerBg: 'rgba(16, 185, 129, 0.18)',
    accent: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.16)'
  },
  valves_fittings: {
    border: 'rgba(249, 115, 22, 0.55)',
    headerBg: 'rgba(234, 88, 12, 0.18)',
    accent: '#fb923c',
    badgeBg: 'rgba(249, 115, 22, 0.16)'
  },
  custom: {
    border: 'rgba(192, 132, 252, 0.55)',
    headerBg: 'rgba(168, 85, 247, 0.18)',
    accent: '#c084fc',
    badgeBg: 'rgba(192, 132, 252, 0.16)'
  }
};

function renderPortDotStyle(port: HydraulicPort): React.CSSProperties {
  const meta = FLUID_META[port.fluidType] || FLUID_META.cold;
  return {
    width: 11,
    height: 11,
    background: meta.color,
    border: `2px solid ${meta.handleBorder}`,
    borderRadius: '50%',
    boxShadow: '0 0 0 2px rgba(15, 23, 42, 0.9)'
  };
}

export const HydraulicSchematicNode: React.FC<NodeProps<HydraulicSchematicNodeType>> = ({
  data,
  selected
}) => {
  const theme = CATEGORY_THEME[data.category] || CATEGORY_THEME.custom;
  const ports = data.ports || [];

  const topPorts = ports.filter((p) => p.side === 'top');
  const bottomPorts = ports.filter((p) => p.side === 'bottom');
  const leftPorts = ports.filter((p) => p.side === 'left');
  const rightPorts = ports.filter((p) => p.side === 'right');

  const minWidth = Math.max(185, topPorts.length * 64, bottomPorts.length * 56);

  return (
    <div
      style={{
        minWidth,
        background: 'rgba(15, 23, 42, 0.95)',
        border: selected ? '2px solid #f8fafc' : `1.5px solid ${theme.border}`,
        borderRadius: '10px',
        boxShadow: selected
          ? `0 0 0 3px ${theme.badgeBg}, 0 10px 28px rgba(0,0,0,0.65)`
          : '0 8px 20px rgba(0, 0, 0, 0.5)',
        color: '#f1f5f9',
        fontFamily: 'var(--font-sans)',
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {/* Handles no TOPO */}
      {topPorts.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 10px 3px 10px',
            borderBottom: '1px dashed rgba(148, 163, 184, 0.18)',
            background: 'rgba(2, 6, 23, 0.35)',
            borderTopLeftRadius: '9px',
            borderTopRightRadius: '9px'
          }}
        >
          {topPorts.map((port) => {
            const meta = FLUID_META[port.fluidType] || FLUID_META.cold;
            return (
              <div
                key={port.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingTop: '2px'
                }}
              >
                <Handle
                  id={port.id}
                  type={port.direction === 'in' ? 'target' : 'source'}
                  position={Position.Top}
                  style={{
                    ...renderPortDotStyle(port),
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                />
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: meta.handleBorder,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {port.label}
                </span>
                {port.connectionSpec && (
                  <span
                    style={{
                      fontSize: '8px',
                      fontFamily: 'var(--font-mono)',
                      color: '#94a3b8',
                      background: 'rgba(148, 163, 184, 0.12)',
                      padding: '0 4px',
                      borderRadius: '3px',
                      marginTop: '1px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {port.connectionSpec}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cabeçalho Esquemático */}
      <div
        style={{
          background: theme.headerBg,
          padding: '7px 10px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.16)',
          borderTopLeftRadius: topPorts.length === 0 ? '9px' : 0,
          borderTopRightRadius: topPorts.length === 0 ? '9px' : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
          <span style={{ fontSize: '15px', lineHeight: 1 }}>{data.icon}</span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {data.label}
            </div>
            {data.subtitle && (
              <div
                style={{
                  fontSize: '9.5px',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {data.subtitle}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chips de Especificação Hidráulica */}
      {(data.capacityLiters > 0 || data.flowLpm > 0 || data.pressurePsi > 0 || data.defaultDiameterMm > 0) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            padding: '5px 10px',
            borderBottom:
              leftPorts.length > 0 || rightPorts.length > 0
                ? '1px solid rgba(148, 163, 184, 0.12)'
                : undefined,
            background: 'rgba(15, 23, 42, 0.6)'
          }}
        >
          {data.capacityLiters > 0 && (
            <span
              style={{
                fontSize: '9.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                color: '#38bdf8',
                background: 'rgba(14, 165, 233, 0.18)',
                padding: '1px 5px',
                borderRadius: '4px'
              }}
            >
              {data.capacityLiters} L
            </span>
          )}
          {data.flowLpm > 0 && (
            <span
              style={{
                fontSize: '9.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.16)',
                padding: '1px 5px',
                borderRadius: '4px'
              }}
            >
              {data.flowLpm} L/min
            </span>
          )}
          {data.pressurePsi > 0 && (
            <span
              style={{
                fontSize: '9.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: '#fbbf24',
                background: 'rgba(245, 158, 11, 0.16)',
                padding: '1px 5px',
                borderRadius: '4px'
              }}
            >
              {data.pressurePsi} PSI
            </span>
          )}
          {data.defaultDiameterMm > 0 && (
            <span
              style={{
                fontSize: '9.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: '#cbd5e1',
                background: 'rgba(148, 163, 184, 0.14)',
                padding: '1px 5px',
                borderRadius: '4px'
              }}
            >
              Ø{data.defaultDiameterMm}mm
            </span>
          )}
        </div>
      )}

      {/* Detalhe visual do Chiller (Trocador de Calor de Placas Brasadas) */}
      {data.kind === 'heat_exchanger' && (
        <div
          style={{
            margin: '5px 8px',
            padding: '6px 8px',
            borderRadius: '6px',
            background:
              'repeating-linear-gradient(90deg, rgba(180, 83, 9, 0.28) 0px, rgba(180, 83, 9, 0.28) 4px, rgba(148, 163, 184, 0.16) 4px, rgba(148, 163, 184, 0.16) 8px)',
            border: '1px solid rgba(217, 119, 6, 0.45)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            fontSize: '9px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#fca5a5', fontWeight: 800 }}>Canal Inox: Wort In ➔ Out</span>
            <span style={{ color: '#fdba74', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>Placas Brasadas</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#93c5fd', fontWeight: 800 }}>Canal Latão: Water In ➔ Out</span>
            <span style={{ color: '#cbd5e1', fontFamily: 'var(--font-mono)', fontSize: '8px' }}>Contra-Fluxo</span>
          </div>
        </div>
      )}

      {/* Terminais ESQUERDA e DIREITA */}
      {(leftPorts.length > 0 || rightPorts.length > 0) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '14px',
            padding: '6px 0'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
            {leftPorts.map((port) => {
              const meta = FLUID_META[port.fluidType] || FLUID_META.cold;
              return (
                <div
                  key={port.id}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    paddingLeft: '11px',
                    minHeight: '18px'
                  }}
                >
                  <Handle
                    id={port.id}
                    type={port.direction === 'out' ? 'source' : 'target'}
                    position={Position.Left}
                    style={{
                      ...renderPortDotStyle(port),
                      left: -6,
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  />
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: meta.handleBorder,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {port.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '5px',
              flex: 1
            }}
          >
            {rightPorts.map((port) => {
              const meta = FLUID_META[port.fluidType] || FLUID_META.cold;
              return (
                <div
                  key={port.id}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '5px',
                    paddingRight: '11px',
                    minHeight: '18px',
                    width: '100%'
                  }}
                >
                  {port.connectionSpec && (
                    <span
                      style={{
                        fontSize: '8.5px',
                        fontFamily: 'var(--font-mono)',
                        color: '#94a3b8',
                        background: 'rgba(148, 163, 184, 0.12)',
                        padding: '1px 4px',
                        borderRadius: '3px'
                      }}
                    >
                      {port.connectionSpec}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: meta.handleBorder,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {port.label}
                  </span>
                  <Handle
                    id={port.id}
                    type={port.direction === 'in' ? 'target' : 'source'}
                    position={Position.Right}
                    style={{
                      ...renderPortDotStyle(port),
                      right: -6,
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Handles na BASE (Bottom) */}
      {bottomPorts.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            padding: '4px 10px 6px 10px',
            borderTop: '1px dashed rgba(148, 163, 184, 0.18)',
            background: 'rgba(2, 6, 23, 0.4)',
            borderBottomLeftRadius: '9px',
            borderBottomRightRadius: '9px'
          }}
        >
          {bottomPorts.map((port) => {
            const meta = FLUID_META[port.fluidType] || FLUID_META.cold;
            return (
              <div
                key={port.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingBottom: '2px'
                }}
              >
                {port.connectionSpec && (
                  <span
                    style={{
                      fontSize: '8px',
                      fontFamily: 'var(--font-mono)',
                      color: '#94a3b8',
                      background: 'rgba(148, 163, 184, 0.12)',
                      padding: '0 4px',
                      borderRadius: '3px',
                      marginBottom: '1px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {port.connectionSpec}
                  </span>
                )}
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: meta.handleBorder,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {port.label}
                </span>
                <Handle
                  id={port.id}
                  type={port.direction === 'in' ? 'target' : 'source'}
                  position={Position.Bottom}
                  style={{
                    ...renderPortDotStyle(port),
                    bottom: -10,
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
