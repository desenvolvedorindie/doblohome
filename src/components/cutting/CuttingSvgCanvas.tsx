import React from 'react';
import { PlacedPiece, SheetPlan, checkPiecePlacement } from '../../utils/cuttingOptimizer';

interface CuttingSvgCanvasProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  currentSheet: SheetPlan | null;
  sheetWidthMm: number;
  sheetHeightMm: number;
  marginMm: number;
  kerfMm: number;
  selectedPlacedPieceId: string | null;
  selectedPieceKey?: string | null;
  draggingPieceId: string | null;
  dragPos: { x: number; y: number } | null;
  onPointerDownPiece: (e: React.PointerEvent, piece: PlacedPiece) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

export const CuttingSvgCanvas: React.FC<CuttingSvgCanvasProps> = ({
  svgRef,
  currentSheet,
  sheetWidthMm,
  sheetHeightMm,
  marginMm,
  kerfMm,
  selectedPlacedPieceId,
  selectedPieceKey,
  draggingPieceId,
  dragPos,
  onPointerDownPiece,
  onPointerMove,
  onPointerUp
}) => {
  const isSheetFoam = Boolean(
    currentSheet?.material?.includes('Espuma') ||
    currentSheet?.woodMaterial?.includes('Espuma') ||
    currentSheet?.placedPieces.some((p) => p.isUpholstery)
  );

  return (
    <div
      style={{
        flex: 1,
        minHeight: '260px',
        background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 100%)',
        borderRadius: '8px',
        border: '1px solid rgba(148, 163, 184, 0.25)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        userSelect: 'none'
      }}
    >
      {currentSheet ? (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${sheetWidthMm} ${sheetHeightMm}`}
          style={{
            width: '100%',
            height: '100%',
            maxHeight: '460px',
            borderRadius: '4px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            background: isSheetFoam ? '#081426' : '#090d16',
            border: isSheetFoam ? '2px solid #0284c7' : '2px solid #b45309'
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* Definições de Gradientes e Padrões */}
          <defs>
            <pattern id="woodGrainPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#1e293b" />
              <path
                d="M 0 10 L 40 10 M 0 20 L 40 20 M 0 30 L 40 30"
                stroke="rgba(245, 158, 11, 0.05)"
                strokeWidth="1"
              />
            </pattern>
            <pattern id="exclusionHatch" width="8" height="8" patternUnits="userSpaceOnUse">
              <path
                d="M 0 8 L 8 0 M -2 2 L 2 -2 M 6 10 L 10 6"
                stroke="rgba(239, 68, 68, 0.5)"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>

          {/* Fundo da Folha de Madeira */}
          <rect
            x="0"
            y="0"
            width={sheetWidthMm}
            height={sheetHeightMm}
            fill="url(#woodGrainPattern)"
          />

          {/* Linha Tracejada de Refilo (Margem de Segurança da Serra) */}
          <rect
            x={marginMm}
            y={marginMm}
            width={sheetWidthMm - 2 * marginMm}
            height={sheetHeightMm - 2 * marginMm}
            fill="none"
            stroke="rgba(245, 158, 11, 0.35)"
            strokeWidth="2"
            strokeDasharray="6,4"
          />

          {/* Peças Posicionadas */}
          {currentSheet.placedPieces.map((piece) => {
            const isSelected = piece.id === selectedPlacedPieceId || piece.pieceId === selectedPieceKey;
            const isDragging = piece.id === draggingPieceId;

            const px = isDragging && dragPos ? dragPos.x : piece.x;
            const py = isDragging && dragPos ? dragPos.y : piece.y;

            const collisionCheck =
              isDragging && dragPos
                ? checkPiecePlacement(
                    { ...piece, x: px, y: py },
                    currentSheet.placedPieces,
                    sheetWidthMm,
                    sheetHeightMm,
                    marginMm,
                    kerfMm
                  )
                : { isValid: true };

            const hasHoles = piece.holes && piece.holes.length > 0;

            const isFoamPiece = Boolean(piece.isUpholstery || piece.woodMaterial?.includes('Espuma'));

            return (
              <g
                key={piece.id}
                transform={`translate(${px}, ${py})`}
                onPointerDown={(e) => onPointerDownPiece(e, piece)}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                {/* Retângulo Principal da Peça */}
                <rect
                  x="0"
                  y="0"
                  width={piece.w}
                  height={piece.h}
                  rx="3"
                  ry="3"
                  fill={
                    !collisionCheck.isValid
                      ? 'rgba(239, 68, 68, 0.45)'
                      : isSelected
                        ? 'rgba(56, 189, 248, 0.38)'
                        : isFoamPiece
                          ? piece.hasCabinetCutout
                            ? 'rgba(245, 158, 11, 0.28)'
                            : 'rgba(30, 58, 138, 0.45)'
                          : piece.isPerforated
                            ? 'rgba(52, 211, 153, 0.22)'
                            : 'rgba(51, 65, 85, 0.85)'
                  }
                  stroke={
                    !collisionCheck.isValid
                      ? '#ef4444'
                      : isSelected
                        ? '#38bdf8'
                        : isFoamPiece
                          ? piece.hasCabinetCutout
                            ? '#f59e0b'
                            : '#60a5fa'
                          : piece.isPerforated
                            ? '#34d399'
                            : 'rgba(245, 158, 11, 0.65)'
                  }
                  strokeWidth={isSelected || !collisionCheck.isValid ? 3 : 1.5}
                />

                {/* Furações Passantes CNC do Tampo */}
                {hasHoles &&
                  piece.holes!.map((hole, hIdx) => (
                    <circle
                      key={hIdx}
                      cx={hole.x}
                      cy={hole.y}
                      r={hole.r}
                      fill="#090d16"
                      stroke={isSelected ? '#38bdf8' : '#34d399'}
                      strokeWidth="1.2"
                      strokeDasharray="3,2"
                      opacity={0.85}
                    />
                  ))}

                {/* Zonas de Exclusão CNC (Apoio Maciço do Armário Aéreo) */}
                {piece.exclusionZones && piece.exclusionZones.length > 0 && (
                  <rect
                    x={piece.w * 0.15}
                    y={piece.h * 0.7}
                    width={piece.w * 0.7}
                    height={piece.h * 0.25}
                    fill="url(#exclusionHatch)"
                    stroke="#f87171"
                    strokeWidth="1"
                    opacity={0.65}
                  />
                )}

                {/* Texto da Peça: Nome e Medidas em mm */}
                {piece.w > 70 && piece.h > 40 && (
                  <text
                    x={piece.w / 2}
                    y={piece.h / 2 - (piece.h > 65 ? 8 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? '#ffffff' : '#f1f5f9'}
                    fontSize={Math.min(18, Math.max(10, piece.w / 14))}
                    fontWeight="800"
                    fontFamily="sans-serif"
                    pointerEvents="none"
                  >
                    {piece.label.length > 22 ? piece.label.substring(0, 20) + '...' : piece.label}
                  </text>
                )}

                {piece.w > 70 && piece.h > 65 && (
                  <text
                    x={piece.w / 2}
                    y={piece.h / 2 + 12}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#38bdf8"
                    fontSize={Math.min(15, Math.max(9, piece.w / 16))}
                    fontWeight="700"
                    fontFamily="monospace"
                    pointerEvents="none"
                  >
                    {piece.w} × {piece.h} mm {piece.rotated ? '↻' : ''}
                  </text>
                )}

                {/* Indicador de Furação CNC */}
                {piece.isPerforated && piece.w > 90 && piece.h > 90 && (
                  <text
                    x={piece.w / 2}
                    y={piece.h / 2 + 28}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#34d399"
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="sans-serif"
                    pointerEvents="none"
                  >
                    🕳️ Vazado CNC ({piece.holes?.length || 0} furos)
                  </text>
                )}

                {/* Indicador de Recorte Especial de Armário Aéreo */}
                {piece.hasCabinetCutout && piece.w > 90 && piece.h > 90 && (
                  <text
                    x={piece.w / 2}
                    y={piece.h / 2 + 28}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fbbf24"
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="sans-serif"
                    pointerEvents="none"
                  >
                    ✂️ Recorte p/ Armário Aéreo
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      ) : (
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>Nenhuma peça para este material</div>
      )}
    </div>
  );
};
