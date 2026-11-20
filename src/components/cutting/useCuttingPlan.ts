import { useState, useRef, useMemo, useEffect } from 'react';
import {
  CutPieceInput,
  PlacedPiece,
  SheetPlan,
  CuttingResult,
  optimizeCuttingPlan,
  recalculateSheetStats,
  checkPiecePlacement,
  computePerforationHoles
} from '../../utils/cuttingOptimizer';
import { SheetStandard, WoodCutGroupInput, MaterialGroup } from './types';

export function useCuttingPlan(
  woodCutGroups: WoodCutGroupInput[],
  selectedPieceKey?: string | null,
  onSelectPiece?: (pieceKey: string | null) => void,
  externalActiveGroupKey?: string,
  onExternalSelectGroupKey?: (key: string) => void
) {
  // Configurações padrão da chapa
  const [sheetStandard, setSheetStandard] = useState<SheetStandard>('plywood_2440');
  const [customSheetW, setCustomSheetW] = useState<number>(2440);
  const [customSheetH, setCustomSheetH] = useState<number>(1220);
  const [kerfMm, setKerfMm] = useState<number>(3); // 3mm serra
  const [marginMm, setMarginMm] = useState<number>(10); // 10mm refilo
  const [allowRotation, setAllowRotation] = useState<boolean>(true);

  const sheetWidthMm =
    sheetStandard === 'plywood_2440'
      ? 2440
      : sheetStandard === 'mdf_2750'
        ? 2750
        : sheetStandard === 'foam_1900'
          ? 1900
          : sheetStandard === 'foam_2000'
            ? 2000
            : customSheetW;

  const sheetHeightMm =
    sheetStandard === 'plywood_2440'
      ? 1220
      : sheetStandard === 'mdf_2750'
        ? 1830
        : sheetStandard === 'foam_1900'
          ? 1400
          : sheetStandard === 'foam_2000'
            ? 1400
            : customSheetH;

  // 1. Agrupamento de peças por [Material + Espessura]
  const materialGroups = useMemo<MaterialGroup[]>(() => {
    const map = new Map<string, MaterialGroup>();

    woodCutGroups.forEach((g) => {
      const woodMat =
        g.woodMaterial ||
        (g.material.includes('MDF')
          ? 'MDF Branco Ultra'
          : g.material.includes('Maciça')
            ? 'Madeira Nobre Maciça'
            : 'Compensado Naval');
      const thick = g.thicknessMm || 15;
      const key = `${woodMat}__${thick}`;
      const isUpholstery = Boolean(g.isUpholstery || g.woodMaterial?.includes('Espuma'));

      if (!map.has(key)) {
        map.set(key, {
          key,
          woodMaterial: woodMat,
          thicknessMm: thick,
          pieces: [],
          totalPieces: 0,
          isUpholstery
        });
      }

      const group = map.get(key)!;
      for (let i = 0; i < g.qty; i++) {
        group.pieces.push({
          id: `${g.key}_${i}`,
          pieceId: g.key,
          label: g.label,
          moduleName: g.moduleName,
          lengthMm: g.lengthMm,
          widthMm: g.widthMm,
          thicknessMm: thick,
          material: g.material,
          woodMaterial: woodMat,
          isPerforated: g.isPerforated,
          holeDiameterMm: g.holeDiameterMm,
          spacingMm: g.spacingMm,
          exclusionZones: g.exclusionZones,
          partType: g.partType,
          isUpholstery: g.isUpholstery,
          hasCabinetCutout: g.hasCabinetCutout,
          cutOutlineNorm: g.cutOutlineNorm,
          canRotate: true
        });
        group.totalPieces += 1;
      }
    });

    return Array.from(map.values());
  }, [woodCutGroups]);

  // Grupo ativo
  const [activeGroupKey, setActiveGroupKey] = useState<string>(externalActiveGroupKey || '');

  // Sincroniza com prop externa se informada
  useEffect(() => {
    if (externalActiveGroupKey && externalActiveGroupKey !== activeGroupKey) {
      if (materialGroups.some((g) => g.key === externalActiveGroupKey)) {
        setActiveGroupKey(externalActiveGroupKey);
        setActiveSheetIdx(0);
        setSelectedPlacedPieceId(null);
      }
    }
  }, [externalActiveGroupKey, materialGroups]);

  useEffect(() => {
    if (materialGroups.length > 0 && (!activeGroupKey || !materialGroups.some((g) => g.key === activeGroupKey))) {
      const defaultKey = externalActiveGroupKey && materialGroups.some((g) => g.key === externalActiveGroupKey)
        ? externalActiveGroupKey
        : materialGroups[0].key;
      setActiveGroupKey(defaultKey);
    }
  }, [materialGroups, activeGroupKey, externalActiveGroupKey]);

  const setGroupKey = (key: string) => {
    setActiveGroupKey(key);
    setActiveSheetIdx(0);
    setSelectedPlacedPieceId(null);
    if (onExternalSelectGroupKey) {
      onExternalSelectGroupKey(key);
    }
  };

  const activeGroup = useMemo(() => {
    return materialGroups.find((g) => g.key === activeGroupKey) || materialGroups[0];
  }, [materialGroups, activeGroupKey]);

  // Auto-ajusta padrão de chapa e kerf ao alternar entre madeira e espuma
  useEffect(() => {
    if (!activeGroup) return;
    const isFoam = Boolean(activeGroup.isUpholstery || activeGroup.woodMaterial?.includes('Espuma'));
    if (isFoam) {
      if (sheetStandard !== 'foam_1900' && sheetStandard !== 'foam_2000') {
        setSheetStandard('foam_1900');
        setKerfMm(2);
      }
    } else {
      if (sheetStandard === 'foam_1900' || sheetStandard === 'foam_2000') {
        setSheetStandard('plywood_2440');
        setKerfMm(3);
      }
    }
  }, [activeGroupKey, activeGroup]);

  // 2. Planos de corte otimizados
  const [cuttingPlans, setCuttingPlans] = useState<Record<string, CuttingResult>>({});
  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0);
  const [selectedPlacedPieceId, setSelectedPlacedPieceId] = useState<string | null>(null);

  // Executa o otimizador quando o grupo ou peças mudam
  useEffect(() => {
    if (!activeGroup) return;

    const optResult = optimizeCuttingPlan(
      activeGroup.pieces,
      activeGroup.key,
      activeGroup.woodMaterial,
      activeGroup.thicknessMm,
      {
        sheetWidthMm,
        sheetHeightMm,
        kerfMm,
        marginMm,
        allowRotation
      }
    );

    setCuttingPlans((prev) => ({
      ...prev,
      [activeGroup.key]: optResult
    }));
    setActiveSheetIdx(0);
    setSelectedPlacedPieceId(null);
  }, [activeGroup, sheetWidthMm, sheetHeightMm, kerfMm, marginMm, allowRotation]);

  // Quando selectedPieceKey mudar externamente, seleciona a folha e a peça correspondente
  useEffect(() => {
    if (!selectedPieceKey) return;
    for (const group of materialGroups) {
      const pieceMatch = group.pieces.find((p) => p.pieceId === selectedPieceKey);
      if (pieceMatch) {
        if (group.key !== activeGroupKey) {
          setActiveGroupKey(group.key);
          if (onExternalSelectGroupKey) onExternalSelectGroupKey(group.key);
        }
        const plan = cuttingPlans[group.key];
        if (plan) {
          for (let sIdx = 0; sIdx < plan.sheets.length; sIdx++) {
            const placed = plan.sheets[sIdx].placedPieces.find((p) => p.pieceId === selectedPieceKey);
            if (placed) {
              setActiveSheetIdx(sIdx);
              setSelectedPlacedPieceId(placed.id);
              break;
            }
          }
        }
        break;
      }
    }
  }, [selectedPieceKey, materialGroups, cuttingPlans, activeGroupKey, onExternalSelectGroupKey]);

  const currentPlan = activeGroup ? cuttingPlans[activeGroup.key] : null;
  const currentSheet =
    currentPlan && currentPlan.sheets.length > activeSheetIdx
      ? currentPlan.sheets[activeSheetIdx]
      : currentPlan?.sheets[0] || null;

  // 3. Arrastar e soltar peças no SVG
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingPieceId, setDraggingPieceId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent, piece: PlacedPiece) => {
    e.stopPropagation();
    if (!svgRef.current) return;

    setSelectedPlacedPieceId(piece.id);
    if (onSelectPiece) {
      onSelectPiece(piece.pieceId);
    }

    const svgRect = svgRef.current.getBoundingClientRect();
    const scaleX = sheetWidthMm / svgRect.width;
    const scaleY = sheetHeightMm / svgRect.height;

    const mouseSheetX = (e.clientX - svgRect.left) * scaleX;
    const mouseSheetY = (e.clientY - svgRect.top) * scaleY;

    setDraggingPieceId(piece.id);
    setDragOffset({
      x: mouseSheetX - piece.x,
      y: mouseSheetY - piece.y
    });
    setDragPos({ x: piece.x, y: piece.y });
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingPieceId || !svgRef.current || !currentSheet) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const scaleX = sheetWidthMm / svgRect.width;
    const scaleY = sheetHeightMm / svgRect.height;

    const mouseSheetX = (e.clientX - svgRect.left) * scaleX;
    const mouseSheetY = (e.clientY - svgRect.top) * scaleY;

    let targetX = Math.round(mouseSheetX - dragOffset.x);
    let targetY = Math.round(mouseSheetY - dragOffset.y);

    // Snapping para refilo
    if (Math.abs(targetX - marginMm) < 15) targetX = marginMm;
    if (Math.abs(targetY - marginMm) < 15) targetY = marginMm;

    setDragPos({ x: targetX, y: targetY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingPieceId || !currentSheet || !dragPos) {
      setDraggingPieceId(null);
      setDragPos(null);
      return;
    }

    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      // Ignora se não capturado
    }

    const updatedPieces = currentSheet.placedPieces.map((p) => {
      if (p.id === draggingPieceId) {
        return {
          ...p,
          x: Math.max(marginMm, Math.min(sheetWidthMm - p.w - marginMm, dragPos.x)),
          y: Math.max(marginMm, Math.min(sheetHeightMm - p.h - marginMm, dragPos.y))
        };
      }
      return p;
    });

    const updatedSheet = recalculateSheetStats({
      ...currentSheet,
      placedPieces: updatedPieces
    });

    if (activeGroup && currentPlan) {
      const newSheets = [...currentPlan.sheets];
      newSheets[activeSheetIdx] = updatedSheet;
      setCuttingPlans((prev) => ({
        ...prev,
        [activeGroup.key]: {
          ...currentPlan,
          sheets: newSheets
        }
      }));
    }

    setDraggingPieceId(null);
    setDragPos(null);
  };

  // 4. Girar peça selecionada 90°
  const handleRotateSelectedPiece = () => {
    if (!selectedPlacedPieceId || !currentSheet || !activeGroup || !currentPlan) return;

    const piece = currentSheet.placedPieces.find((p) => p.id === selectedPlacedPieceId);
    if (!piece) return;

    const newW = piece.h;
    const newH = piece.w;
    const newRotated = !piece.rotated;

    const newHoles = piece.isPerforated
      ? computePerforationHoles(newW, newH, {
          holeDiameterMm: piece.holeDiameterMm,
          spacingMm: piece.spacingMm,
          exclusionZones: piece.exclusionZones
        })
      : undefined;

    const updatedPiece: PlacedPiece = {
      ...piece,
      w: newW,
      h: newH,
      rotated: newRotated,
      holes: newHoles,
      x: Math.max(marginMm, Math.min(sheetWidthMm - newW - marginMm, piece.x)),
      y: Math.max(marginMm, Math.min(sheetHeightMm - newH - marginMm, piece.y))
    };

    const updatedPieces = currentSheet.placedPieces.map((p) =>
      p.id === selectedPlacedPieceId ? updatedPiece : p
    );

    const updatedSheet = recalculateSheetStats({
      ...currentSheet,
      placedPieces: updatedPieces
    });

    const newSheets = [...currentPlan.sheets];
    newSheets[activeSheetIdx] = updatedSheet;

    setCuttingPlans((prev) => ({
      ...prev,
      [activeGroup.key]: {
        ...currentPlan,
        sheets: newSheets
      }
    }));
  };

  // 5. Mover peça para outra folha
  const handleMovePieceToSheet = (targetSheetIdx: number) => {
    if (!selectedPlacedPieceId || !currentSheet || !activeGroup || !currentPlan) return;
    if (targetSheetIdx === activeSheetIdx || targetSheetIdx < 0 || targetSheetIdx >= currentPlan.sheets.length) return;

    const piece = currentSheet.placedPieces.find((p) => p.id === selectedPlacedPieceId);
    if (!piece) return;

    const srcPieces = currentSheet.placedPieces.filter((p) => p.id !== selectedPlacedPieceId);
    const updatedSrcSheet = recalculateSheetStats({
      ...currentSheet,
      placedPieces: srcPieces
    });

    const destSheet = currentPlan.sheets[targetSheetIdx];
    const placedOnDest: PlacedPiece = {
      ...piece,
      x: marginMm,
      y: marginMm
    };
    const destPieces = [...destSheet.placedPieces, placedOnDest];
    const updatedDestSheet = recalculateSheetStats({
      ...destSheet,
      placedPieces: destPieces
    });

    const newSheets = [...currentPlan.sheets];
    newSheets[activeSheetIdx] = updatedSrcSheet;
    newSheets[targetSheetIdx] = updatedDestSheet;

    setCuttingPlans((prev) => ({
      ...prev,
      [activeGroup.key]: {
        ...currentPlan,
        sheets: newSheets
      }
    }));

    setActiveSheetIdx(targetSheetIdx);
  };

  // 6. Re-otimizar
  const handleReoptimize = () => {
    if (!activeGroup) return;
    const optResult = optimizeCuttingPlan(
      activeGroup.pieces,
      activeGroup.key,
      activeGroup.woodMaterial,
      activeGroup.thicknessMm,
      {
        sheetWidthMm,
        sheetHeightMm,
        kerfMm,
        marginMm,
        allowRotation
      }
    );
    setCuttingPlans((prev) => ({
      ...prev,
      [activeGroup.key]: optResult
    }));
    setActiveSheetIdx(0);
    setSelectedPlacedPieceId(null);
  };

  // 7. Adicionar folha em branco
  const handleAddBlankSheet = () => {
    if (!activeGroup || !currentPlan) return;
    const newSheet: SheetPlan = {
      sheetIndex: currentPlan.sheets.length + 1,
      sheetWidthMm,
      sheetHeightMm,
      material: activeGroup.key,
      woodMaterial: activeGroup.woodMaterial,
      thicknessMm: activeGroup.thicknessMm,
      marginMm,
      kerfMm,
      placedPieces: [],
      usedAreaM2: 0,
      totalAreaM2: (sheetWidthMm * sheetHeightMm) / 1_000_000,
      efficiencyPct: 0,
      wastePct: 100
    };
    setCuttingPlans((prev) => ({
      ...prev,
      [activeGroup.key]: {
        ...currentPlan,
        sheets: [...currentPlan.sheets, newSheet],
        totalSheets: currentPlan.sheets.length + 1
      }
    }));
    setActiveSheetIdx(currentPlan.sheets.length);
  };

  const selectedPiece = currentSheet?.placedPieces.find((p) => p.id === selectedPlacedPieceId);

  return {
    sheetStandard,
    setSheetStandard,
    customSheetW,
    setCustomSheetW,
    customSheetH,
    setCustomSheetH,
    sheetWidthMm,
    sheetHeightMm,
    kerfMm,
    setKerfMm,
    marginMm,
    setMarginMm,
    allowRotation,
    setAllowRotation,
    materialGroups,
    activeGroupKey,
    setActiveGroupKey: setGroupKey,
    activeGroup,
    currentPlan,
    currentSheet,
    activeSheetIdx,
    setActiveSheetIdx,
    selectedPlacedPieceId,
    setSelectedPlacedPieceId,
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
  };
}
