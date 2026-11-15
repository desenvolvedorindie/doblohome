import React from 'react';
import { PlacedPiece, CuttingResult } from '../../utils/cuttingOptimizer';

interface CuttingPieceInspectorProps {
  selectedPiece?: PlacedPiece;
  currentPlan: CuttingResult | null;
  activeSheetIdx: number;
  kerfMm: number;
  marginMm: number;
  onRotateSelectedPiece: () => void;
  onMovePieceToSheet: (targetSheetIdx: number) => void;
}

export const CuttingPieceInspector: React.FC<CuttingPieceInspectorProps> = ({
  selectedPiece,
  currentPlan,
  activeSheetIdx,
  kerfMm,
  marginMm,
  onRotateSelectedPiece,
  onMovePieceToSheet
}) => {
  return (
    <div
      style={{
        marginTop: '8px',
        padding: '8px 10px',
        background: 'rgba(15, 23, 42, 0.85)',
        borderRadius: '6px',
        border: '1px solid rgba(148, 163, 184, 0.25)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}
    >
      {selectedPiece ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Selecionada: </span>
            <strong style={{ fontSize: '11px', color: '#38bdf8' }}>{selectedPiece.label}</strong>
            <span
              style={{
                fontSize: '10px',
                color: '#cbd5e1',
                marginLeft: '6px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {selectedPiece.w} × {selectedPiece.h} × {selectedPiece.thicknessMm} mm
            </span>
            {selectedPiece.isPerforated && (
              <span
                style={{
                  fontSize: '9px',
                  color: '#34d399',
                  background: 'rgba(52, 211, 153, 0.15)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  marginLeft: '6px'
                }}
              >
                🕳️ Tampo Vazado CNC
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={onRotateSelectedPiece}
              className="btn-compact"
              title="Girar peça 90°"
              style={{
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 800,
                background: 'rgba(56, 189, 248, 0.2)',
                borderColor: '#38bdf8',
                color: '#38bdf8'
              }}
            >
              ↻ Girar 90°
            </button>

            {currentPlan && currentPlan.sheets.length > 1 && (
              <select
                value={activeSheetIdx}
                onChange={(e) => onMovePieceToSheet(Number(e.target.value))}
                style={{
                  padding: '3px 6px',
                  fontSize: '10px',
                  borderRadius: '4px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: '#f8fafc',
                  border: '1px solid rgba(148, 163, 184, 0.3)'
                }}
              >
                {currentPlan.sheets.map((_, idx) => (
                  <option key={idx} value={idx}>
                    Mover p/ Folha {idx + 1}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
          💡 <em>Clique em uma peça na chapa para girar 90°, arrastar para reposicionar ou mover entre folhas.</em>
        </div>
      )}

      <div style={{ fontSize: '9.5px', color: '#64748b' }}>
        Serra (Kerf): {kerfMm}mm · Refilo: {marginMm}mm
      </div>
    </div>
  );
};
