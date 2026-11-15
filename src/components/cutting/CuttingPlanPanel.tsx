import React from 'react';
import { CuttingPlanPanelProps } from './types';
import { useCuttingPlan } from './useCuttingPlan';
import { CuttingToolbar } from './CuttingToolbar';
import { CuttingSheetNav } from './CuttingSheetNav';
import { CuttingSvgCanvas } from './CuttingSvgCanvas';
import { CuttingPieceInspector } from './CuttingPieceInspector';
import { printCuttingPlan } from '../../utils/printCuttingPlan';

export const CuttingPlanPanel: React.FC<CuttingPlanPanelProps> = ({
  woodCutGroups,
  selectedPieceKey,
  onSelectPiece,
  activeGroupKey: externalActiveGroupKey,
  onSelectGroupKey: onExternalSelectGroupKey
}) => {
  const {
    sheetStandard,
    setSheetStandard,
    customSheetW,
    customSheetH,
    sheetWidthMm,
    sheetHeightMm,
    kerfMm,
    marginMm,
    materialGroups,
    activeGroupKey,
    setActiveGroupKey,
    currentPlan,
    currentSheet,
    activeSheetIdx,
    setActiveSheetIdx,
    selectedPlacedPieceId,
    selectedPiece,
    svgRef,
    draggingPieceId,
    dragPos,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleRotateSelectedPiece,
    handleMovePieceToSheet,
    handleReoptimize,
    handleAddBlankSheet
  } = useCuttingPlan(
    woodCutGroups,
    selectedPieceKey,
    onSelectPiece,
    externalActiveGroupKey,
    onExternalSelectGroupKey
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '480px',
        background: 'rgba(11, 17, 32, 0.95)',
        borderRadius: '10px',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        padding: '12px',
        overflow: 'hidden',
        color: '#f8fafc'
      }}
    >
      <CuttingToolbar
        sheetStandard={sheetStandard}
        onSheetStandardChange={setSheetStandard}
        customSheetW={customSheetW}
        customSheetH={customSheetH}
        onReoptimize={handleReoptimize}
        onPrintPlan={currentPlan ? () => printCuttingPlan(currentPlan) : undefined}
        materialGroups={materialGroups}
        activeGroupKey={activeGroupKey}
        onSelectGroupKey={(key) => {
          setActiveGroupKey(key);
          setActiveSheetIdx(0);
        }}
      />

      {currentPlan && (
        <CuttingSheetNav
          currentPlan={currentPlan}
          currentSheet={currentSheet}
          activeSheetIdx={activeSheetIdx}
          onSelectSheetIdx={setActiveSheetIdx}
          onAddBlankSheet={handleAddBlankSheet}
        />
      )}

      <CuttingSvgCanvas
        svgRef={svgRef}
        currentSheet={currentSheet}
        sheetWidthMm={sheetWidthMm}
        sheetHeightMm={sheetHeightMm}
        marginMm={marginMm}
        kerfMm={kerfMm}
        selectedPlacedPieceId={selectedPlacedPieceId}
        selectedPieceKey={selectedPieceKey}
        draggingPieceId={draggingPieceId}
        dragPos={dragPos}
        onPointerDownPiece={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      <CuttingPieceInspector
        selectedPiece={selectedPiece}
        currentPlan={currentPlan}
        activeSheetIdx={activeSheetIdx}
        kerfMm={kerfMm}
        marginMm={marginMm}
        onRotateSelectedPiece={handleRotateSelectedPiece}
        onMovePieceToSheet={handleMovePieceToSheet}
      />
    </div>
  );
};
