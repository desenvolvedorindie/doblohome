import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  ElectricalPort,
  POLARITY_META,
  getFuseColorSpec
} from '../../../types/electricalPlanar';
import { renderPortDotStyle } from './schematicTheme';

export const SchematicTopPorts: React.FC<{ ports: ElectricalPort[] }> = ({ ports }) => {
  if (ports.length === 0) return null;

  return (
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
      {ports.map((port) => {
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
  );
};

export const SchematicSidePorts: React.FC<{
  leftPorts: ElectricalPort[];
  rightPorts: ElectricalPort[];
}> = ({ leftPorts, rightPorts }) => {
  if (leftPorts.length === 0 && rightPorts.length === 0) return null;

  return (
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
  );
};

/**
 * Terminais do barramento: pontos centralizados horizontalmente no nó
 * (o barramento liga entrada e saída, então todos os pinos ficam no centro).
 */
export const SchematicBusbarPorts: React.FC<{ ports: ElectricalPort[] }> = ({ ports }) => {
  if (ports.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px 10px' }}>
      {ports.map((port) => {
        const meta = POLARITY_META[port.polarity];
        return (
          <div
            key={port.id}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px'
            }}
          >
            {/* Contêiner do pino central do barramento com handles duplos perfeitamente alinhados */}
            <div
              style={{
                position: 'relative',
                width: '11px',
                height: '11px',
                flexShrink: 0
              }}
            >
              {/* Handle de ENTRADA (Target: recebe fios de fontes/bateria/usina/etc.) */}
              <Handle
                id={port.id}
                type="target"
                position={Position.Left}
                style={{
                  ...renderPortDotStyle(port),
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transform: 'none',
                  cursor: 'crosshair',
                  margin: 0,
                  zIndex: 2
                }}
                title={`${port.label} (Entrada / Target)`}
              />

              {/* Handle de SAÍDA (Source: envia fios para cargas/inversor/caixa de fusíveis/etc.) */}
              <Handle
                id={port.id}
                type="source"
                position={Position.Right}
                style={{
                  ...renderPortDotStyle(port),
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transform: 'none',
                  cursor: 'crosshair',
                  margin: 0,
                  zIndex: 3
                }}
                title={`${port.label} (Saída / Source)`}
              />
            </div>

            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 600,
                color: port.polarity === 'neg' ? '#cbd5e1' : meta.handleBorder,
                whiteSpace: 'nowrap',
                userSelect: 'none',
                lineHeight: 1.1
              }}
            >
              {port.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const SchematicBottomPorts: React.FC<{ ports: ElectricalPort[] }> = ({ ports }) => {
  if (ports.length === 0) return null;

  return (
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
      {ports.map((port) => {
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
  );
};
