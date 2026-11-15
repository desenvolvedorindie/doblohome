import React from 'react';
import type { Edge, Node } from '@xyflow/react';
import {
  ElectricalEdgeData,
  ElectricalNodeData,
  FUSE_COLOR_TABLE,
  buildBreakerPorts,
  buildBusbarPorts,
  buildFuseBoxPorts,
  getFuseColorSpec,
  suggestBladeFuseAmps
} from '../../../types/electricalPlanar';
import { STANDARD_PROTECTION_RATINGS } from '../../../utils/electricalCalculations';

interface NodeProtectionConfigProps {
  selectedNode: Node<ElectricalNodeData>;
  edges: Edge<ElectricalEdgeData>[];
  onUpdateNodeData: (
    nodeId: string,
    updater: (prev: ElectricalNodeData) => ElectricalNodeData
  ) => void;
}

export const NodeProtectionConfig: React.FC<NodeProtectionConfigProps> = ({
  selectedNode,
  edges,
  onUpdateNodeData
}) => {
  return (
    <>
      {/* Config específica: Caixa de Disjuntor */}
      {selectedNode.data.kind === 'breaker' && (
        <div
          style={{
            padding: '7px',
            borderRadius: '6px',
            background: 'rgba(2, 6, 23, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 800, color: '#f87171' }}>
            🛡️ Configuração do Disjuntor
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <label style={{ fontSize: '9.5px', color: '#94a3b8' }}>
              Amperagem (A)
              <select
                value={selectedNode.data.breakerAmps || 60}
                onChange={(e) => {
                  const amps = parseInt(e.target.value) || 60;
                  const isAc = selectedNode.data.catalogId === 'breaker_ac';
                  const poles = selectedNode.data.breakerPoles || 2;
                  onUpdateNodeData(selectedNode.id, (prev) => ({
                    ...prev,
                    breakerAmps: amps,
                    ports: buildBreakerPorts(amps, poles, isAc)
                  }));
                }}
                style={{
                  width: '100%',
                  marginTop: '2px',
                  padding: '4px',
                  borderRadius: '5px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#fff',
                  fontSize: '11px'
                }}
              >
                {STANDARD_PROTECTION_RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {r}A
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: '9.5px', color: '#94a3b8' }}>
              Polos
              <select
                value={selectedNode.data.breakerPoles || 2}
                onChange={(e) => {
                  const poles = (parseInt(e.target.value) === 1 ? 1 : 2) as 1 | 2;
                  const isAc = selectedNode.data.catalogId === 'breaker_ac';
                  const amps = selectedNode.data.breakerAmps || 60;
                  onUpdateNodeData(selectedNode.id, (prev) => ({
                    ...prev,
                    breakerPoles: poles,
                    ports: buildBreakerPorts(amps, poles, isAc)
                  }));
                }}
                style={{
                  width: '100%',
                  marginTop: '2px',
                  padding: '4px',
                  borderRadius: '5px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#fff',
                  fontSize: '11px'
                }}
              >
                <option value={1}>1 Polo (Unipolar)</option>
                <option value={2}>2 Polos (Bipolar)</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Config específica: Barramento */}
      {selectedNode.data.kind === 'busbar' && (
        <div
          style={{
            padding: '7px',
            borderRadius: '6px',
            background: 'rgba(2, 6, 23, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399' }}>
            Terminais do Barramento
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10.5px', color: '#cbd5e1' }}>
              Quantidade: <strong>{selectedNode.data.busbarTermCount || 8}</strong>
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                className="btn-compact"
                onClick={() => {
                  const next = Math.max(2, (selectedNode.data.busbarTermCount || 8) - 1);
                  const pol = selectedNode.data.busbarPolarity || 'pos';
                  onUpdateNodeData(selectedNode.id, (prev) => ({
                    ...prev,
                    busbarTermCount: next,
                    ports: buildBusbarPorts(pol, next)
                  }));
                }}
              >
                -
              </button>
              <button
                type="button"
                className="btn-compact"
                onClick={() => {
                  const next = Math.min(20, (selectedNode.data.busbarTermCount || 8) + 1);
                  const pol = selectedNode.data.busbarPolarity || 'pos';
                  onUpdateNodeData(selectedNode.id, (prev) => ({
                    ...prev,
                    busbarTermCount: next,
                    ports: buildBusbarPorts(pol, next)
                  }));
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config específica: Caixa de Fusíveis */}
      {selectedNode.data.kind === 'fuse_box' && (
        <div
          style={{
            padding: '7px',
            borderRadius: '6px',
            background: 'rgba(2, 6, 23, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24' }}>
              🧰 Vias de Fusível ({selectedNode.data.fuseWayCount || 12})
            </span>
            <select
              value={selectedNode.data.fuseWayCount || 12}
              onChange={(e) => {
                const ways = parseInt(e.target.value) || 12;
                onUpdateNodeData(selectedNode.id, (prev) => ({
                  ...prev,
                  fuseWayCount: ways,
                  ports: buildFuseBoxPorts(ways, prev.ports)
                }));
              }}
              style={{
                padding: '2px 5px',
                borderRadius: '4px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#fff',
                fontSize: '10px'
              }}
            >
              {[4, 6, 8, 10, 12].map((w) => (
                <option key={w} value={w}>
                  {w} Vias
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: '185px',
              overflowY: 'auto'
            }}
          >
            {selectedNode.data.ports
              .filter((p) => p.id.startsWith('fuse_'))
              .map((fp) => {
                const connectedEdges = edges.filter(
                  (ed) =>
                    (ed.source === selectedNode.id && ed.sourceHandle === fp.id) ||
                    (ed.target === selectedNode.id && ed.targetHandle === fp.id)
                );
                const connectedAmps = connectedEdges.reduce(
                  (sum, ed) => sum + (ed.data?.currentAmps || 0),
                  0
                );
                const hasActiveFuse = Boolean(fp.fuseAmps && fp.fuseAmps > 0);
                const spec = hasActiveFuse ? getFuseColorSpec(fp.fuseAmps!) : null;
                return (
                  <div
                    key={fp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px',
                      fontSize: '10px'
                    }}
                  >
                    <span style={{ color: '#cbd5e1', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Via {fp.wayIndex}{' '}
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 500,
                          color: spec ? '#94a3b8' : '#64748b'
                        }}
                      >
                        {spec ? `${spec.amps}A (${spec.colorName})` : 'Livre'}
                      </span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '2px',
                          background: spec ? spec.hex : 'rgba(148, 163, 184, 0.2)',
                          border: spec ? 'none' : '1px dashed rgba(148, 163, 184, 0.45)'
                        }}
                      />
                      <select
                        value={fp.isManualFuse && fp.fuseAmps ? String(fp.fuseAmps) : 'auto'}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === 'auto') {
                            const autoAmps =
                              connectedEdges.length > 0
                                ? suggestBladeFuseAmps(connectedAmps)
                                : undefined;
                            onUpdateNodeData(selectedNode.id, (prev) => ({
                              ...prev,
                              ports: prev.ports.map((p) =>
                                p.id === fp.id
                                  ? {
                                      ...p,
                                      fuseAmps: autoAmps,
                                      isManualFuse: false,
                                      maxAmps: autoAmps ?? 40,
                                      label: autoAmps
                                        ? `F${p.wayIndex} (${autoAmps}A)`
                                        : `F${p.wayIndex}`
                                    }
                                  : p
                              )
                            }));
                            return;
                          }
                          const amps = parseInt(raw, 10) || 10;
                          onUpdateNodeData(selectedNode.id, (prev) => ({
                            ...prev,
                            ports: prev.ports.map((p) =>
                              p.id === fp.id
                                ? {
                                    ...p,
                                    fuseAmps: amps,
                                    isManualFuse: true,
                                    maxAmps: amps,
                                    label: `F${p.wayIndex} (${amps}A)`
                                  }
                                : p
                            )
                          }));
                        }}
                        style={{
                          padding: '2px 5px',
                          borderRadius: '4px',
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(148, 163, 184, 0.25)',
                          color: '#fff',
                          fontSize: '10px'
                        }}
                      >
                        <option value="auto">
                          ⚡ Auto ({connectedEdges.length > 0 ? `${suggestBladeFuseAmps(connectedAmps)}A` : 'Pela Carga'})
                        </option>
                        {FUSE_COLOR_TABLE.map((fc) => (
                          <option key={fc.amps} value={String(fc.amps)}>
                            {fc.amps}A ({fc.colorName})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
};
