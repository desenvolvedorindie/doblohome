import React from 'react';
import { type NodeProps, type Node } from '@xyflow/react';
import { ElectricalNodeData } from '../../types/electricalPlanar';
import {
  CATEGORY_THEME,
  getSchematicComputedAmps,
  getSchematicNodeMinWidth
} from './schematic/schematicTheme';
import {
  SchematicBottomPorts,
  SchematicSidePorts,
  SchematicTopPorts
} from './schematic/SchematicPorts';

type SchematicNodeType = Node<ElectricalNodeData, 'schematic'>;

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

  const computedAmps = getSchematicComputedAmps(data);
  const isDisabled = data.isEnabled === false;
  const minWidth = getSchematicNodeMinWidth(data, topPorts.length, bottomPorts.length);

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
      <SchematicTopPorts ports={topPorts} />

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
      <SchematicSidePorts leftPorts={leftPorts} rightPorts={rightPorts} />

      {/* Handles na BASE (Bottom) */}
      <SchematicBottomPorts ports={bottomPorts} />
    </div>
  );
};
