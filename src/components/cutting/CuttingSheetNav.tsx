import React from 'react';
import { CuttingResult, SheetPlan } from '../../utils/cuttingOptimizer';

interface CuttingSheetNavProps {
  currentPlan: CuttingResult;
  currentSheet: SheetPlan | null;
  activeSheetIdx: number;
  onSelectSheetIdx: (idx: number) => void;
  onAddBlankSheet: () => void;
}

export const CuttingSheetNav: React.FC<CuttingSheetNavProps> = ({
  currentPlan,
  currentSheet,
  activeSheetIdx,
  onSelectSheetIdx,
  onAddBlankSheet
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginBottom: '8px',
        padding: '6px 8px',
        background: 'rgba(15, 23, 42, 0.75)',
        borderRadius: '6px',
        border: '1px solid rgba(56, 189, 248, 0.25)'
      }}
    >
      {/* Botões de Seleção de Folha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
          Folhas:
        </span>
        {currentPlan.sheets.map((s, idx) => {
          const isCurrent = idx === activeSheetIdx;
          return (
            <button
              key={s.sheetIndex}
              onClick={() => onSelectSheetIdx(idx)}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: isCurrent ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)',
                background: isCurrent ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                color: isCurrent ? '#ffffff' : '#94a3b8',
                fontSize: '10px',
                fontWeight: isCurrent ? 800 : 600,
                cursor: 'pointer'
              }}
            >
              Folha {s.sheetIndex} ({s.efficiencyPct}%)
            </button>
          );
        })}

        <button
          onClick={onAddBlankSheet}
          title="Adicionar folha em branco para distribuição manual"
          style={{
            padding: '3px 6px',
            borderRadius: '4px',
            border: '1px dashed rgba(148, 163, 184, 0.4)',
            background: 'transparent',
            color: '#94a3b8',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          + Folha
        </button>
      </div>

      {/* Estatísticas de Aproveitamento da Folha */}
      {currentSheet && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10.5px' }}>
          <div>
            <span style={{ color: '#94a3b8' }}>Aproveitamento: </span>
            <strong
              style={{
                color:
                  currentSheet.efficiencyPct >= 80
                    ? '#34d399'
                    : currentSheet.efficiencyPct >= 60
                      ? '#fbbf24'
                      : '#f87171',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {currentSheet.efficiencyPct}%
            </strong>
            <span style={{ color: '#64748b', fontSize: '9px', marginLeft: '4px' }}>
              (Sobra: {currentSheet.wastePct}%)
            </span>
          </div>

          <div>
            <span style={{ color: '#94a3b8' }}>Peças: </span>
            <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {currentSheet.placedPieces.length} un
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};
