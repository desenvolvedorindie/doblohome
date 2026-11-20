import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import {
  areSubpartsAdjacent,
  buildGlobalMattressPartitions,
  canConnectGlobalSubparts,
  collectEffectiveGlobalGroups,
  computeAllVehicleMattressSubparts,
  computeRectUnionPolygons,
  connectGlobalMattressSubparts,
  disconnectGlobalMattressGroup
} from '../../utils/mattressGrouping';

export const MattressTopDownConnector: React.FC = () => {
  const { internalBoxes, internalGrid, setInternalGrid, setInternalBoxes } = useSolar();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allSubparts = computeAllVehicleMattressSubparts(internalGrid, internalBoxes, 0);
  if (allSubparts.length < 2) return null;

  const cols = Math.max(1, internalGrid.colsX || 3);
  const rows = Math.max(1, internalGrid.rowsZ || 4);
  const widthMm = internalGrid.widthMm || 1200;
  const lengthMm = internalGrid.lengthMm || 1700;
  const cellWMm = widthMm / cols;
  const cellLMm = lengthMm / rows;

  const effectiveGroups = collectEffectiveGlobalGroups(
    allSubparts,
    internalGrid.mattressMergedGroups,
    internalBoxes
  );
  const partitions = buildGlobalMattressPartitions(allSubparts, effectiveGroups);

  // Filtra apenas IDs válidos na seleção atual
  const validIdSet = new Set(allSubparts.map((s) => s.id));
  const cleanSelected = selectedIds.filter((id) => validIdSet.has(id));
  const selectedSet = new Set(cleanSelected);

  const connectCheck = canConnectGlobalSubparts(allSubparts, effectiveGroups, cleanSelected);
  const hasSelectedMergedGroup = effectiveGroups.some((g) => g.some((id) => selectedSet.has(id)));
  const anyBedClosed = allSubparts.some((s) => !s.isBedOpen);

  // Bounding box global em mm (inclui toda a planta da Doblò + abas de caixa de roda)
  const floorMinX = -widthMm / 2;
  const floorMaxX = widthMm / 2;
  const floorMinZ = -lengthMm;
  const floorMaxZ = 0;

  const allMinX = Math.min(floorMinX, ...allSubparts.map((s) => s.minX * 1000));
  const allMaxX = Math.max(floorMaxX, ...allSubparts.map((s) => s.maxX * 1000));
  const allMinZ = Math.min(floorMinZ, ...allSubparts.map((s) => s.minZ * 1000));
  const allMaxZ = Math.max(floorMaxZ, ...allSubparts.map((s) => s.maxZ * 1000));

  const spanX = Math.max(200, allMaxX - allMinX);
  const spanZ = Math.max(200, allMaxZ - allMinZ);

  // Vista de cima da Doblò: +X (Motorista) à esquerda, -X (Passageiro) à direita; +Z (Frente) em cima, -Z (Trás) embaixo
  const padX = 120;
  const padY = 105;
  const vbW = spanX + padX * 2;
  const vbH = spanZ + padY * 2;
  const toSvgX = (xMm: number) => padX + (allMaxX - xMm);
  const toSvgY = (zMm: number) => padY + (allMaxZ - zMm);

  const togglePartitionSelection = (ids: string[]) => {
    setSelectedIds((prev) => {
      const cur = new Set(prev.filter((id) => validIdSet.has(id)));
      const allAlready = ids.every((id) => cur.has(id));
      if (allAlready) {
        ids.forEach((id) => cur.delete(id));
      } else {
        ids.forEach((id) => cur.add(id));
      }
      return Array.from(cur).sort();
    });
  };

  const persistGlobalGroups = (nextGroups: string[][], openBedIds?: Set<string>) => {
    setInternalGrid((prev) => ({
      ...prev,
      mattressMergedGroups: nextGroups.length > 0 ? nextGroups : undefined
    }));
    // Limpa grupos legados por módulo (fonte única de verdade em internalGrid.mattressMergedGroups)
    // e abre automaticamente as camas envolvidas na conexão para mostrar a união no 3D
    setInternalBoxes((prev) =>
      prev.map((b) => {
        const shouldOpen = openBedIds?.has(b.id);
        const hasLegacy = b.mattressMergedGroups !== undefined;
        if (!shouldOpen && !hasLegacy) return b;
        return {
          ...b,
          ...(hasLegacy ? { mattressMergedGroups: undefined } : {}),
          ...(shouldOpen
            ? {
                isBedOpen: true,
                ...(b.type === 'slat_bed' ? { isOpen: true } : {}),
                slatExtensionPercent: 100
              }
            : {})
        };
      })
    );
  };

  const handleConnect = () => {
    const nextGroups = connectGlobalMattressSubparts(allSubparts, effectiveGroups, cleanSelected);
    if (!nextGroups) return;
    const involvedBoxIds = new Set(
      connectCheck.unionIds.map((id) => id.slice(0, id.lastIndexOf('::')))
    );
    persistGlobalGroups(nextGroups, involvedBoxIds);
    setSelectedIds([]);
  };

  const handleDisconnectSelected = () => {
    const nextGroups = disconnectGlobalMattressGroup(allSubparts, effectiveGroups, cleanSelected);
    persistGlobalGroups(nextGroups);
    setSelectedIds([]);
  };

  const handleResetAll = () => {
    persistGlobalGroups([]);
    setSelectedIds([]);
  };

  const handleOpenAllBeds = () => {
    const allBedIds = new Set(allSubparts.map((s) => s.boxId));
    setInternalBoxes((prev) =>
      prev.map((b) => {
        if (allBedIds.has(b.id)) {
          return {
            ...b,
            isBedOpen: true,
            ...(b.type === 'slat_bed' ? { isOpen: true } : {}),
            slatExtensionPercent: 100
          };
        }
        // Regra: ao abrir a cama, recolhe elevatórios
        if (b.type === 'vertical_lift' && b.isOpen) {
          return { ...b, isOpen: false };
        }
        return b;
      })
    );
  };

  // Módulos sem cama (apenas contorno sutil de referência espacial na planta baixa)
  const nonBedBoxes = internalBoxes.filter((b) => b.type !== 'slat_bed' && !b.hasBed);

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '8px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div>
          <strong style={{ fontSize: '11.5px', color: '#38bdf8' }}>
            🗺️ Vista Superior Unificada dos Colchões — Conectar / Desconectar
          </strong>
          <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
            Conecte quaisquer partes encostadas lado a lado (mesmo entre módulos diferentes) para formar uma peça inteira.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '9.5px',
              fontWeight: 800,
              color: effectiveGroups.length > 0 ? '#34d399' : '#94a3b8',
              background: effectiveGroups.length > 0 ? 'rgba(16, 185, 129, 0.16)' : 'rgba(148, 163, 184, 0.12)',
              border: effectiveGroups.length > 0 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(148, 163, 184, 0.25)',
              padding: '2px 7px',
              borderRadius: '4px'
            }}
          >
            {partitions.length} {partitions.length === 1 ? 'peça final' : 'peças finais'} (de {allSubparts.length} subpartes)
          </span>
          {anyBedClosed && (
            <button
              type="button"
              className="btn-compact"
              onClick={handleOpenAllBeds}
              style={{
                fontSize: '9.5px',
                padding: '2px 7px',
                background: 'rgba(2, 132, 199, 0.25)',
                borderColor: '#38bdf8',
                color: '#38bdf8',
                fontWeight: 700
              }}
              title="Abre as camas no 3D para visualizar os colchões conectados estendidos"
            >
              🛌 Abrir Camas no 3D
            </button>
          )}
        </div>
      </div>

      {/* Planta Baixa SVG Unificada (Vista de Cima da Doblò) */}
      <div
        style={{
          background: 'rgba(2, 6, 23, 0.72)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '6px',
          padding: '6px',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          style={{ width: '100%', maxHeight: '270px', height: 'auto', userSelect: 'none' }}
        >
          {/* Contorno do Assoalho da Doblò */}
          <rect
            x={toSvgX(floorMaxX)}
            y={toSvgY(floorMaxZ)}
            width={widthMm}
            height={lengthMm}
            rx={16}
            fill="rgba(30, 41, 59, 0.28)"
            stroke="rgba(148, 163, 184, 0.28)"
            strokeWidth={4}
            strokeDasharray="18 12"
          />

          {/* Rótulos de orientação do veículo */}
          <text x={vbW / 2} y={44} textAnchor="middle" fill="#94a3b8" fontSize={40} fontWeight={700}>
            ▲ FRENTE (CABINE) — Planta {widthMm} × {lengthMm} mm
          </text>
          <text x={vbW / 2} y={vbH - 24} textAnchor="middle" fill="#64748b" fontSize={36} fontWeight={700}>
            ▼ TRASEIRA (PORTA-MALAS)
          </text>
          <text
            x={30}
            y={vbH / 2}
            textAnchor="middle"
            fill="#64748b"
            fontSize={34}
            fontWeight={700}
            transform={`rotate(-90 30 ${vbH / 2})`}
          >
            ◀ MOTORISTA
          </text>
          <text
            x={vbW - 30}
            y={vbH / 2}
            textAnchor="middle"
            fill="#64748b"
            fontSize={34}
            fontWeight={700}
            transform={`rotate(90 ${vbW - 30} ${vbH / 2})`}
          >
            PASSAGEIRO ▶
          </text>

          {/* Referência visual sutil dos módulos sem cama */}
          {nonBedBoxes.map((nb) => {
            const cStart = Math.min(cols - 1, Math.max(0, nb.colStart));
            const cSpan = Math.min(cols - cStart, Math.max(1, nb.colSpan));
            const rStart = Math.min(rows - 1, Math.max(0, nb.rowStart));
            const rSpan = Math.min(rows - rStart, Math.max(1, nb.rowSpan));
            const bw = Math.max(50, cSpan * cellWMm + (nb.extraWidthMm || 0));
            const bl = Math.max(50, rSpan * cellLMm + (nb.extraLengthMm || 0));
            const cx = widthMm / 2 - (cStart + cSpan / 2) * cellWMm + (nb.offsetXMm || 0);
            const cz = -(rStart + rSpan / 2) * cellLMm + (nb.offsetZMm || 0);
            const x1 = toSvgX(cx + bw / 2);
            const y1 = toSvgY(cz + bl / 2);
            return (
              <g key={`ref-${nb.id}`} pointerEvents="none">
                <rect
                  x={x1 + 3}
                  y={y1 + 3}
                  width={Math.max(4, bw - 6)}
                  height={Math.max(4, bl - 6)}
                  rx={8}
                  fill="rgba(71, 85, 105, 0.16)"
                  stroke="rgba(100, 116, 139, 0.35)"
                  strokeWidth={3}
                />
                <text
                  x={x1 + bw / 2}
                  y={y1 + bl / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(148, 163, 184, 0.45)"
                  fontSize={28}
                  fontWeight={600}
                >
                  {nb.name.slice(0, 14)}
                </text>
              </g>
            );
          })}

          {/* Renderização de TODAS as Partições de Colchão (Individuais ou Grupos Conectados) */}
          {partitions.map((part, pIdx) => {
            const pMinX = Math.min(...part.subparts.map((s) => s.minX * 1000));
            const pMaxX = Math.max(...part.subparts.map((s) => s.maxX * 1000));
            const pMinZ = Math.min(...part.subparts.map((s) => s.minZ * 1000));
            const pMaxZ = Math.max(...part.subparts.map((s) => s.maxZ * 1000));

            const isPartSelected = part.ids.every((id) => selectedSet.has(id));
            const isMerged = part.isMerged;

            const fillColor = isPartSelected
              ? 'rgba(251, 191, 36, 0.32)'
              : isMerged
                ? 'rgba(16, 185, 129, 0.28)'
                : 'rgba(56, 189, 248, 0.15)';
            const strokeColor = isPartSelected
              ? '#fbbf24'
              : isMerged
                ? '#10b981'
                : '#38bdf8';

            const bx1 = toSvgX(pMaxX);
            const bx2 = toSvgX(pMinX);
            const by1 = toSvgY(pMaxZ);
            const by2 = toSvgY(pMinZ);
            const bw = Math.max(10, bx2 - bx1);
            const bh = Math.max(10, by2 - by1);

            // Calcula o polígono exato da união (preserva formato L, T, U sem fechar como retângulo envolvente)
            const svgSubRects = part.subparts.map((sp) => ({
              minX: toSvgX(sp.maxX * 1000),
              maxX: toSvgX(sp.minX * 1000),
              minY: toSvgY(sp.maxZ * 1000),
              maxY: toSvgY(sp.minZ * 1000)
            }));
            const unionPolygons = isMerged ? computeRectUnionPolygons(svgSubRects, 8) : [];

            // Posiciona o texto no centro ponderado por área das subpartes reais (nunca sobre canto vazio)
            const largestSp = part.subparts.reduce((best, cur) => {
              const areaBest = (best.maxX - best.minX) * (best.maxZ - best.minZ);
              const areaCur = (cur.maxX - cur.minX) * (cur.maxZ - cur.minZ);
              return areaCur > areaBest ? cur : best;
            }, part.subparts[0]);
            const labelRect = isMerged
              ? {
                  x1: toSvgX(largestSp.maxX * 1000),
                  x2: toSvgX(largestSp.minX * 1000),
                  y1: toSvgY(largestSp.maxZ * 1000),
                  y2: toSvgY(largestSp.minZ * 1000)
                }
              : { x1: bx1, x2: bx2, y1: by1, y2: by2 };

            // Se todas as subpartes cobrem 100% do retângulo envolvente, centraliza no retângulo inteiro
            const sumAreas = part.subparts.reduce((acc, sp) => acc + (sp.maxX - sp.minX) * (sp.maxZ - sp.minZ), 0);
            const bboxArea = ((pMaxX - pMinX) / 1000) * ((pMaxZ - pMinZ) / 1000);
            const isFullRect = Math.abs(sumAreas - bboxArea) < 0.01;
            const cx = isFullRect ? (bx1 + bw / 2) : ((labelRect.x1 + labelRect.x2) / 2);
            const cy = isFullRect ? (by1 + bh / 2) : ((labelRect.y1 + labelRect.y2) / 2);
            const labelW = isFullRect ? bw : (labelRect.x2 - labelRect.x1);
            const labelH = isFullRect ? bh : (labelRect.y2 - labelRect.y1);
            const isNarrow = labelW < 230 && labelH > labelW * 1.4;

            const totalWMm = Math.round(pMaxX - pMinX);
            const totalLMm = Math.round(pMaxZ - pMinZ);
            const distinctBoxes = new Set(part.subparts.map((s) => s.boxId)).size;

            const titleText = isMerged
              ? (part.ids.length === allSubparts.length
                  ? '🔗 INTEIRO'
                  : distinctBoxes > 1
                    ? `🔗 UNIÃO (${part.ids.length}p)`
                    : `🔗 GRUPO (${part.ids.length}p)`)
              : part.subparts[0].shortLabel;

            return (
              <g
                key={`gpart-${pIdx}-${part.ids.join('_')}`}
                onClick={() => togglePartitionSelection(part.ids)}
                style={{ cursor: 'pointer' }}
              >
                {isMerged && unionPolygons.length > 0 ? (
                  <>
                    {/* Polígono exato da união (preenchimento + contorno real no formato L/T/U/retângulo) */}
                    {unionPolygons.map((poly, polyIdx) => (
                      <polygon
                        key={`poly-${polyIdx}`}
                        points={poly.map((pt) => `${pt.x},${pt.y}`).join(' ')}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isPartSelected ? 11 : 8}
                        strokeLinejoin="round"
                      />
                    ))}
                  </>
                ) : (
                  /* Subparte individual */
                  part.subparts.map((sp) => {
                    const sx1 = toSvgX(sp.maxX * 1000);
                    const sx2 = toSvgX(sp.minX * 1000);
                    const sy1 = toSvgY(sp.maxZ * 1000);
                    const sy2 = toSvgY(sp.minZ * 1000);
                    return (
                      <rect
                        key={sp.id}
                        x={sx1 + 4}
                        y={sy1 + 4}
                        width={Math.max(4, sx2 - sx1 - 8)}
                        height={Math.max(4, sy2 - sy1 - 8)}
                        rx={12}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isPartSelected ? 9 : 5}
                        strokeDasharray={isPartSelected ? undefined : '16 10'}
                      />
                    );
                  })
                )}

                {/* Destaque visual de bordas conectadas entre subpartes adjacentes do grupo */}
                {isMerged && part.subparts.map((spA, iA) =>
                  part.subparts.slice(iA + 1).map((spB) => {
                    if (!areSubpartsAdjacent(spA, spB)) return null;
                    const touchX = Math.abs(spA.maxX - spB.minX) <= 0.025 || Math.abs(spB.maxX - spA.minX) <= 0.025;
                    if (touchX) {
                      const sharedX = Math.abs(spA.maxX - spB.minX) <= 0.025 ? spA.maxX : spA.minX;
                      const ovMinZ = Math.max(spA.minZ, spB.minZ) * 1000;
                      const ovMaxZ = Math.min(spA.maxZ, spB.maxZ) * 1000;
                      const sx = toSvgX(sharedX * 1000);
                      return (
                        <line
                          key={`link-${spA.id}-${spB.id}`}
                          x1={sx}
                          y1={toSvgY(ovMaxZ) + 18}
                          x2={sx}
                          y2={toSvgY(ovMinZ) - 18}
                          stroke="rgba(52, 211, 153, 0.55)"
                          strokeWidth={4}
                          strokeDasharray="10 10"
                        />
                      );
                    }
                    const sharedZ = Math.abs(spA.maxZ - spB.minZ) <= 0.025 ? spA.maxZ : spA.minZ;
                    const ovMinX = Math.max(spA.minX, spB.minX) * 1000;
                    const ovMaxX = Math.min(spA.maxX, spB.maxX) * 1000;
                    const sy = toSvgY(sharedZ * 1000);
                    return (
                      <line
                        key={`link-${spA.id}-${spB.id}`}
                        x1={toSvgX(ovMaxX) + 18}
                        y1={sy}
                        x2={toSvgX(ovMinX) - 18}
                        y2={sy}
                        stroke="rgba(52, 211, 153, 0.55)"
                        strokeWidth={4}
                        strokeDasharray="10 10"
                      />
                    );
                  })
                )}

                {/* Texto central da peça */}
                <text
                  x={cx}
                  y={cy - (isNarrow ? 24 : 18)}
                  textAnchor="middle"
                  fill={isPartSelected ? '#fde68a' : isMerged ? '#6ee7b7' : '#e2e8f0'}
                  fontSize={isNarrow ? 34 : 42}
                  fontWeight={800}
                  transform={isNarrow ? `rotate(-90 ${cx} ${cy})` : undefined}
                >
                  {isPartSelected ? `✓ ${titleText}` : titleText}
                </text>
                <text
                  x={cx}
                  y={cy + (isNarrow ? 24 : 34)}
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize={isNarrow ? 30 : 36}
                  fontWeight={600}
                  fontFamily="monospace"
                  transform={isNarrow ? `rotate(-90 ${cx} ${cy})` : undefined}
                >
                  {totalWMm}×{totalLMm}mm
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Barra de Ações Conectar / Desconectar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={!connectCheck.valid}
            onClick={handleConnect}
            className="btn-compact"
            style={{
              fontSize: '10.5px',
              padding: '5px 10px',
              fontWeight: 800,
              background: connectCheck.valid
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'rgba(30, 41, 59, 0.5)',
              borderColor: connectCheck.valid ? '#34d399' : 'rgba(148, 163, 184, 0.25)',
              color: connectCheck.valid ? '#ffffff' : '#64748b',
              cursor: connectCheck.valid ? 'pointer' : 'not-allowed'
            }}
            title={connectCheck.valid ? 'Unir as partes adjacentes selecionadas em uma única peça de espuma' : connectCheck.reason}
          >
            🔗 Conectar Partes {connectCheck.valid ? `(${connectCheck.unionIds.length})` : ''}
          </button>

          <button
            type="button"
            disabled={!hasSelectedMergedGroup}
            onClick={handleDisconnectSelected}
            className="btn-compact"
            style={{
              fontSize: '10.5px',
              padding: '5px 10px',
              fontWeight: 800,
              background: hasSelectedMergedGroup
                ? 'linear-gradient(135deg, #d97706, #b45309)'
                : 'rgba(30, 41, 59, 0.5)',
              borderColor: hasSelectedMergedGroup ? '#fbbf24' : 'rgba(148, 163, 184, 0.25)',
              color: hasSelectedMergedGroup ? '#ffffff' : '#64748b',
              cursor: hasSelectedMergedGroup ? 'pointer' : 'not-allowed'
            }}
            title="Desfazer o grupo selecionado de volta às subpartes individuais"
          >
            ✂️ Desconectar Grupo
          </button>

          {effectiveGroups.length > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="btn-compact"
              style={{
                fontSize: '10px',
                padding: '5px 8px',
                fontWeight: 700,
                background: 'rgba(239, 68, 68, 0.14)',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#f87171'
              }}
              title="Desconectar todos os grupos e restaurar todas as subpartes originais"
            >
              ↺ Desconectar Tudo
            </button>
          )}

          {cleanSelected.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="btn-compact"
              style={{
                fontSize: '10px',
                padding: '4px 8px',
                color: '#94a3b8'
              }}
            >
              Limpar ({cleanSelected.length})
            </button>
          )}
        </div>

        {cleanSelected.length >= 2 && !connectCheck.valid && !hasSelectedMergedGroup && (
          <span style={{ fontSize: '9.5px', color: '#fbbf24', fontWeight: 600 }}>
            ⚠️ {connectCheck.reason}
          </span>
        )}
      </div>
    </div>
  );
};
