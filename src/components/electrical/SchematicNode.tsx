import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import {
  ElectricalNodeData,
  ElectricalPort,
  POLARITY_META,
  getFuseColorSpec
} from '../../types/electricalPlanar';

type SchematicNodeType = Node<ElectricalNodeData, 'schematic'>;

const CATEGORY_THEME: Record<
  ElectricalNodeData['category'],
  { border: string; headerBg: string; accent: string; badgeBg: string }
> = {
  system_fixed: {
    border: 'rgba(56, 189, 248, 0.55)',
    headerBg: 'rgba(14, 165, 233, 0.18)',
    accent: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.16)'
  },
  consumption_load: {
    border: 'rgba(245, 158, 11, 0.55)',
    headerBg: 'rgba(245, 158, 11, 0.18)',
    accent: '#fbbf24',
    badgeBg: 'rgba(245, 158, 11, 0.16)'
  },
  distribution_protection: {
    border: 'rgba(16, 185, 129, 0.55)',
    headerBg: 'rgba(16, 185, 129, 0.16)',
    accent: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.16)'
  },
  custom: {
    border: 'rgba(192, 132, 252, 0.55)',
    headerBg: 'rgba(168, 85, 247, 0.18)',
    accent: '#c084fc',
    badgeBg: 'rgba(192, 132, 252, 0.16)'
  }
};

function renderPortDotStyle(port: ElectricalPort): React.CSSProperties {
  const meta = POLARITY_META[port.polarity] || POLARITY_META.pos;
  return {
    width: 11,
    height: 11,
    background: meta.color,
    border: `2px solid ${meta.handleBorder}`,
    borderRadius: '50%',
    boxShadow: '0 0 0 2px rgba(15, 23, 42, 0.9)'
  };
}

export const SchematicNode: React.FC<NodeProps<SchematicNodeType>> = ({
  data,
  selected
}) => {
  const theme = CATEGORY_THEME[data.category] || CATEGORY_THEME.custom;
  const ports = data.ports || [];

  const isBusbar = data.kind === 'busbar';
  const topPorts = ports.filter((p) => p.side === 'top');
  const bottomPorts = ports.filter((p) => p.side === 'bottom');
  const leftPorts = isBusbar
    ? ports.filter((p) => p.side === 'left' || p.side === 'right')
    : ports.filter((p) => p.side === 'left');
  const rightPorts = isBusbar ? [] : ports.filter((p) => p.side === 'right');

  const computedAmps =
    data.amps > 0
      ? data.amps
      : data.watts > 0 && data.voltage > 0
        ? +(data.watts / data.voltage).toFixed(1)
        : 0;

  const isDisabled = data.isEnabled === false;
  const minWidth =
    data.kind === 'fuse_box'
      ? 260
      : data.kind === 'busbar'
        ? 220
        : Math.max(185, topPorts.length * 64, bottomPorts.length * 42);

  return (
    <div
      style={{
        minWidth,
        background: 'rgba(15, 23, 42, 0.95)',
        border: selected ? `2px solid #f8fafc` : `1.5px solid ${theme.border}`,
        borderRadius: '10px',
        boxShadow: selected
          ? `0 0 0 3px ${theme.badgeBg}, 0 10px 28px rgba(0,0,0,0.65)`
          : '0 8px 20px rgba(0, 0, 0, 0.5)',
        color: '#f1f5f9',
        fontFamily: 'var(--font-sans)',
        opacity: isDisabled ? 0.55 : 1,
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
            const meta = POLARITY_META[port.polarity];
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
                    color: port.polarity === 'neg' ? '#cbd5e1' : meta.handleBorder,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {port.label}
                </span>
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
        {data.kind === 'breaker' && data.breakerAmps && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              background: 'rgba(239, 68, 68, 0.22)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#fca5a5',
              padding: '2px 6px',
              borderRadius: '5px',
              whiteSpace: 'nowrap'
            }}
          >
            {data.breakerAmps}A · {data.breakerPoles || 2}P
          </span>
        )}
      </div>

      {/* Chips de Especificação Elétrica */}
      {(data.voltage > 0 || data.watts > 0 || computedAmps > 0) && (
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
          {data.voltage > 0 && (
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
              {data.voltage}V
            </span>
          )}
          {data.watts > 0 && (
            <span
              style={{
                fontSize: '9.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: '#fbbf24',
                background: 'rgba(245, 158, 11, 0.15)',
                padding: '1px 5px',
                borderRadius: '4px'
              }}
            >
              {data.watts}W
            </span>
          )}
          {computedAmps > 0 && (
            <span
              style={{
                fontSize: '9.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: theme.accent,
                background: theme.badgeBg,
                padding: '1px 5px',
                borderRadius: '4px'
              }}
            >
              {computedAmps}A
            </span>
          )}
          {isDisabled && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: '#f87171',
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '1px 5px',
                borderRadius: '4px'
              }}
            >
              Desativado no Consumo
            </span>
          )}
        </div>
      )}

      {/* Barra Esquemática Visual para Barramento */}
      {data.kind === 'busbar' && (
        <div style={{ padding: '5px 10px 0 10px' }}>
          <div
            style={{
              height: '6px',
              borderRadius: '3px',
              background:
                data.busbarPolarity === 'pos'
                  ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                  : data.busbarPolarity === 'neg'
                    ? 'linear-gradient(90deg, #334155, #64748b)'
                    : 'linear-gradient(90deg, #f97316, #3b82f6, #22c55e)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          />
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
          {/* Coluna Esquerda */}
          {leftPorts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
              {leftPorts.map((port) => {
                const meta = POLARITY_META[port.polarity];
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
                        color: port.polarity === 'neg' ? '#cbd5e1' : meta.handleBorder,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {port.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Coluna Direita */}
          {rightPorts.length > 0 && (
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
                const meta = POLARITY_META[port.polarity];
                const fuseSpec = port.fuseAmps ? getFuseColorSpec(port.fuseAmps) : null;
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
                    {fuseSpec ? (
                      <span
                        title={`Fusível ${fuseSpec.amps}A (${fuseSpec.colorName})${port.isManualFuse ? ' · Manual' : ' · Auto'}`}
                        style={{
                          fontSize: '8.5px',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          background: fuseSpec.hex,
                          color: fuseSpec.textColor,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          border: '1px solid rgba(255,255,255,0.25)',
                          lineHeight: 1.2
                        }}
                      >
                        {fuseSpec.amps}A
                      </span>
                    ) : port.id.startsWith('fuse_') ? (
                      <span
                        title="Via livre — conecte um item para calcular o fusível"
                        style={{
                          fontSize: '8.5px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(148, 163, 184, 0.12)',
                          color: '#64748b',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          border: '1px dashed rgba(148, 163, 184, 0.3)',
                          lineHeight: 1.2
                        }}
                      >
                        --
                      </span>
                    ) : null}
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: port.polarity === 'neg' ? '#cbd5e1' : meta.handleBorder,
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
          )}
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
            const meta = POLARITY_META[port.polarity];
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
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: port.polarity === 'neg' ? '#cbd5e1' : meta.handleBorder,
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
