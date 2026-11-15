import React, { useMemo, useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { getFoldingBracketForHeight, getUpperCabinetClosure } from '../../types';
import { CuttingPlanPanel } from '../cutting/CuttingPlanPanel';
import { extractPvcCutStats } from '../../utils/pvcUtils';
import {
  calculateWeldedJoints,
  groupProfilesByThickness,
  ProfileThicknessGroup,
  CutGroupThicknessSection
} from '../../utils/weldedJointsUtils';

interface BarCutGroup {
  key: string;
  label: string;
  profileSpec: string;
  lengthMm: number;
  lengthM: number;
  qty: number;
  totalLengthM: number;
}

interface ProfileSummary {
  profileSpec: string;
  pieces: number;
  totalMeters: number;
  bars6m: number;
  bars3m: number;
}

interface WoodCutGroup {
  key: string;
  label: string;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  lengthM: number;
  widthM: number;
  areaM2: number;
  qty: number;
  totalAreaM2: number;
  material: string;
  woodMaterial?: string;
  moduleName?: string;
  partType?: string;
  isPerforated?: boolean;
  holeDiameterMm?: number;
  spacingMm?: number;
  exclusionZones?: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }>;
  hasCabinetExclusion?: boolean;
  isRearShelf?: boolean;
}

interface WoodGroupByCategory {
  key: string;
  woodMaterial: string;
  thicknessMm: number;
  totalPieces: number;
  totalAreaM2: number;
  estimatedSheets: number;
  pieces: WoodCutGroup[];
}

export const BomModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    structureMaterial,
    steelProfileUnit,
    metalonWallThickness,
    metalonThickness40,
    metalonThickness30,
    sceneManager,
    stackLevels,
    level1,
    level2,
    cargoBox,
    activePanelPreset,
    setViewMode,
    internalBoxes,
    internalGrid,
    setPartsFilter,
    waterTank
  } = useSolar();

  const [mainViewMode, setMainViewMode] = useState<'wood_cutting' | 'metal' | 'pvc'>('wood_cutting');
  const [pvcBarStandard, setPvcBarStandard] = useState<'6m' | '3m'>('6m');
  const [selectedPieceKey, setSelectedPieceKey] = useState<string | null>(null);
  const [activeGroupKey, setActiveGroupKey] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const pvcStats = useMemo(() => {
    return extractPvcCutStats(waterTank);
  }, [waterTank]);

  // Totalizador de Ferragens e Perfis Metálicos (Alumínio T-Slot / Metalon Soldado)
  const barStats = useMemo(() => {
    const groupsMap = new Map<string, BarCutGroup>();
    const profileMap = new Map<string, ProfileSummary>();
    let totalPieces = 0;
    let totalMeters = 0;

    if (sceneManager && sceneManager.solarSystem) {
      const cargoDisabled = !sceneManager.solarSystem.cargoBoxConfig?.enabled;
      const cargoGroup = sceneManager.solarSystem.cargoBoxSystem?.group;

      sceneManager.solarSystem.group.traverse((obj: any) => {
        if (!obj.isMesh || !obj.userData || !obj.userData.isBar) return;

        if (cargoDisabled && cargoGroup) {
          let p = obj.parent;
          while (p) {
            if (p === cargoGroup) return;
            p = p.parent;
          }
        }

        const lengthM = Number(obj.userData.barLength) || 0;
        const lengthMm = Math.round(lengthM * 1000);
        const rawLabel = String(obj.userData.barLabel || 'Barra Estrutural')
          .replace(/\s*\(#\d+\)/g, '')
          .trim();
        const profileSpec = String(obj.userData.profileSpec || 'Perfil Estrutural');

        totalPieces += 1;
        totalMeters += lengthM;

        const key = `${profileSpec}__${rawLabel}__${lengthMm}`;
        const existing = groupsMap.get(key);
        if (existing) {
          existing.qty += 1;
          existing.totalLengthM += lengthM;
        } else {
          groupsMap.set(key, {
            key,
            label: rawLabel,
            profileSpec,
            lengthMm,
            lengthM,
            qty: 1,
            totalLengthM: lengthM
          });
        }

        const pSum = profileMap.get(profileSpec);
        if (pSum) {
          pSum.pieces += 1;
          pSum.totalMeters += lengthM;
        } else {
          profileMap.set(profileSpec, {
            profileSpec,
            pieces: 1,
            totalMeters: lengthM,
            bars6m: 0,
            bars3m: 0
          });
        }
      });
    }

    const cutGroups = Array.from(groupsMap.values()).sort((a, b) => {
      if (b.lengthMm !== a.lengthMm) return b.lengthMm - a.lengthMm;
      return a.label.localeCompare(b.label);
    });

    const profileSummaries = Array.from(profileMap.values())
      .map((p) => ({
        ...p,
        bars6m: Math.max(1, Math.ceil((p.totalMeters * 1.05) / 6.0)),
        bars3m: Math.max(1, Math.ceil((p.totalMeters * 1.05) / 3.0))
      }))
      .sort((a, b) => b.totalMeters - a.totalMeters);

    const totalBars6m = profileSummaries
      .filter((p) => p.profileSpec.includes('T-Slot') || p.profileSpec.includes('Metalon') || p.profileSpec.includes('Tubo'))
      .reduce((acc, p) => acc + p.bars6m, 0);

    const { thicknessGroups, cutThicknessGroups } = groupProfilesByThickness(profileSummaries, cutGroups);

    return {
      totalPieces,
      totalMeters,
      totalBars6m,
      cutGroups,
      profileSummaries,
      thicknessGroups,
      cutThicknessGroups
    };
  }, [sceneManager, activeModal, structureMaterial, steelProfileUnit, metalonWallThickness, metalonThickness40, metalonThickness30, stackLevels, level1, level2, cargoBox, activePanelPreset]);

  // Relatório de Juntas/Nós Estruturais (A métrica das "Quinas")
  const weldedJointsReport = useMemo(() => {
    return calculateWeldedJoints(sceneManager);
  }, [sceneManager, activeModal, cargoBox, stackLevels, level1, level2]);

  // Totalizador e Plano de Corte do Grupo Madeira (Marcenaria / Compensado Naval / MDF / Madeira Maciça)
  const woodStats = useMemo(() => {
    const groupsMap = new Map<string, WoodCutGroup>();
    let totalPieces = 0;
    let totalAreaM2 = 0;

    if (sceneManager && sceneManager.internalBoxesBuilder) {
      sceneManager.internalBoxesBuilder.group.traverse((obj: any) => {
        if (!obj.isMesh || !obj.userData || !obj.userData.isWoodPart) return;
        if (obj.userData.isInternalBoxHitbox) return;

        if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
        const bb = obj.geometry.boundingBox;
        const dx = Number(obj.userData.dimW) || (bb ? Math.abs(bb.max.x - bb.min.x) : 0.05);
        const dy = Number(obj.userData.dimH) || (bb ? Math.abs(bb.max.y - bb.min.y) : 0.015);
        const dz = Number(obj.userData.dimL) || (bb ? Math.abs(bb.max.z - bb.min.z) : 0.05);
        const dims = [dx, dy, dz].sort((a, b) => b - a);

        const lengthM = dims[0];
        const widthM = Math.max(0.015, dims[1]);
        const thicknessM = Math.max(0.003, dims[2]);
        const areaM2 = lengthM * widthM;

        const lengthMm = Math.round(lengthM * 1000);
        const widthMm = Math.round(widthM * 1000);
        const thicknessMm = Number(obj.userData.thicknessMm) || Math.round(thicknessM * 1000);
        const isPerforated = Boolean(obj.userData.isPerforated);
        const hasCabinetExclusion = Boolean(obj.userData.hasCabinetExclusion);
        const isRearShelf = Boolean(obj.userData.isRearShelf);

        const woodMaterial = String(
          obj.userData.woodMaterial ||
          (obj.userData.material?.includes('MDF')
            ? 'MDF Branco Ultra'
            : obj.userData.material?.includes('Maciça')
              ? 'Madeira Nobre Maciça'
              : 'Compensado Naval')
        );

        const moduleName = String(obj.userData.moduleName || '');
        const partType = String(obj.userData.partType || '');
        const holeDiameterMm = obj.userData.holeDiameterMm ? Number(obj.userData.holeDiameterMm) : 40;
        const spacingMm = obj.userData.spacingMm ? Number(obj.userData.spacingMm) : 85;
        const exclusionZones = obj.userData.exclusionZones || undefined;

        const rawLabel = String(obj.userData.partLabel || obj.userData.name || `Chapa ${woodMaterial} ${thicknessMm}mm`)
          .replace(/\s*\(#\d+\)/g, '')
          .trim();
        const material = String(obj.userData.material || `${woodMaterial} ${thicknessMm}mm Impermeabilizado`);

        totalPieces += 1;
        totalAreaM2 += areaM2;

        const key = `${woodMaterial}__${thicknessMm}__${rawLabel}__${widthMm}x${lengthMm}${isPerforated ? '__perf' : ''}${hasCabinetExclusion ? '__cabex' : ''}${isRearShelf ? '__shelf' : ''}`;
        const existing = groupsMap.get(key);
        if (existing) {
          existing.qty += 1;
          existing.totalAreaM2 += areaM2;
        } else {
          groupsMap.set(key, {
            key,
            label: rawLabel,
            lengthMm,
            widthMm,
            thicknessMm,
            lengthM,
            widthM,
            areaM2,
            qty: 1,
            totalAreaM2: areaM2,
            material,
            woodMaterial,
            moduleName,
            partType,
            isPerforated,
            holeDiameterMm,
            spacingMm,
            exclusionZones,
            hasCabinetExclusion,
            isRearShelf
          });
        }
      });
    }

    const cutGroups = Array.from(groupsMap.values()).sort((a, b) => {
      if (Math.abs(b.totalAreaM2 - a.totalAreaM2) > 0.0001) return b.totalAreaM2 - a.totalAreaM2;
      if (b.lengthMm !== a.lengthMm) return b.lengthMm - a.lengthMm;
      return a.label.localeCompare(b.label);
    });

    const standardSheets = Math.max(1, Math.ceil((totalAreaM2 * 1.10) / 2.977));

    return {
      totalPieces,
      totalAreaM2,
      standardSheets,
      cutGroups
    };
  }, [sceneManager, internalBoxes, internalGrid, activeModal]);

  // Agrupamento das peças de madeira por [Tipo de Madeira] + [Espessura] estilo Corte Cloud
  const woodGroupsByCategory = useMemo<WoodGroupByCategory[]>(() => {
    const map = new Map<string, WoodGroupByCategory>();

    woodStats.cutGroups.forEach((group) => {
      const woodMat = group.woodMaterial || 'Compensado Naval';
      const thick = group.thicknessMm || 15;
      const key = `${woodMat}__${thick}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          woodMaterial: woodMat,
          thicknessMm: thick,
          totalPieces: 0,
          totalAreaM2: 0,
          estimatedSheets: 0,
          pieces: []
        });
      }

      const cat = map.get(key)!;
      cat.pieces.push(group);
      cat.totalPieces += group.qty;
      cat.totalAreaM2 += group.totalAreaM2;
    });

    const result = Array.from(map.values());
    result.forEach((cat) => {
      const sheetArea = cat.woodMaterial.includes('MDF') ? (2.75 * 1.83) : (2.44 * 1.22);
      cat.estimatedSheets = Math.max(1, Math.ceil((cat.totalAreaM2 * 1.10) / sheetArea));
    });

    return result.sort((a, b) => {
      if (a.woodMaterial !== b.woodMaterial) return a.woodMaterial.localeCompare(b.woodMaterial);
      return b.thicknessMm - a.thicknessMm;
    });
  }, [woodStats.cutGroups]);

  if (activeModal !== 'bom') return null;

  return (
    <div className="modal-overlay open" onClick={closeModal}>
      <div
        className="modal-window glass-panel"
        style={{
          maxWidth: '96vw',
          width: '1600px',
          maxHeight: '92vh',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho da Tela de Peças & Plano de Corte */}
        <div className="modal-header" style={{ paddingBottom: '10px', borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="modal-title" style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🪵</span>
              <span>Marcenaria & Plano de Corte 2D — Estilo Corte Cloud</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#f59e0b',
                  background: 'rgba(245, 158, 11, 0.18)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '5px'
                }}
              >
                {woodStats.totalPieces} Peças de Madeira
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#34d399',
                  background: 'rgba(52, 211, 153, 0.15)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '5px'
                }}
              >
                {woodStats.totalAreaM2.toFixed(2)} m² Úteis
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '5px'
                }}
              >
                ~{woodStats.standardSheets} Chapas (2.44×1.22m)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className={`btn-compact ${mainViewMode === 'wood_cutting' ? 'active' : ''}`}
                onClick={() => setMainViewMode('wood_cutting')}
                style={{
                  padding: '5px 8px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  background: mainViewMode === 'wood_cutting' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                  borderColor: mainViewMode === 'wood_cutting' ? '#f59e0b' : 'rgba(148, 163, 184, 0.3)',
                  color: mainViewMode === 'wood_cutting' ? '#fbbf24' : '#94a3b8'
                }}
              >
                🪵 Marcenaria ({woodStats.totalPieces})
              </button>
              <button
                className={`btn-compact ${mainViewMode === 'metal' ? 'active' : ''}`}
                onClick={() => setMainViewMode('metal')}
                style={{
                  padding: '5px 8px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  background: mainViewMode === 'metal' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                  borderColor: mainViewMode === 'metal' ? '#38bdf8' : 'rgba(148, 163, 184, 0.3)',
                  color: mainViewMode === 'metal' ? '#38bdf8' : '#94a3b8'
                }}
              >
                🔩 Perfis ({barStats.totalPieces})
              </button>
              <button
                className={`btn-compact ${mainViewMode === 'pvc' ? 'active' : ''}`}
                onClick={() => setMainViewMode('pvc')}
                style={{
                  padding: '5px 8px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  background: mainViewMode === 'pvc' ? 'rgba(14, 165, 233, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                  borderColor: mainViewMode === 'pvc' ? '#0ea5e9' : 'rgba(148, 163, 184, 0.3)',
                  color: mainViewMode === 'pvc' ? '#38bdf8' : '#94a3b8'
                }}
              >
                💧 Canos PVC ({waterTank.enabled ? pvcStats.totalPieces : 0})
              </button>
            </div>
            <button
              className="btn-compact primary"
              onClick={() => {
                closeModal();
                setPartsFilter(mainViewMode === 'wood_cutting' ? 'wood' : mainViewMode === 'metal' ? 'metal' : 'pvc');
                setViewMode('bars_lineup');
              }}
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 800,
                background: 'rgba(16, 185, 129, 0.2)',
                borderColor: '#10b981',
                color: '#34d399'
              }}
            >
              📏 Ver no 3D
            </button>
            <button className="modal-close-btn" onClick={closeModal}>
              &times;
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ─── CORTE CLOUD: GRID DE PEÇAS NA ESQUERDA + PLANO DE CORTE NA DIREITA ─── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mainViewMode === 'wood_cutting' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(500px, 1fr) minmax(520px, 1.2fr)',
              gap: '14px',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              marginTop: '10px'
            }}
          >
            {/* ─── COLUNA DA ESQUERDA: GRID POR LINHA AGRUPADO POR TIPO & ESPESSURA ─── */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
                background: 'rgba(15, 23, 42, 0.65)',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                padding: '10px',
                overflow: 'hidden'
              }}
            >
              {/* Barra de Filtro / Busca */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="🔍 Filtrar por nome da peça, módulo ou dimensão..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      background: 'rgba(2, 6, 23, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '11px',
                      outline: 'none'
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      &times;
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  <strong>{woodGroupsByCategory.length}</strong> {woodGroupsByCategory.length === 1 ? 'grupo' : 'grupos'}
                </div>
              </div>

              {/* Lista com Rolagem dos Grupos de Madeira e Espessura */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  paddingRight: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {woodGroupsByCategory.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                    Nenhuma peça de marcenaria encontrada nos módulos.
                  </div>
                ) : (
                  woodGroupsByCategory.map((category) => {
                    const filteredPieces = category.pieces.filter((p) => {
                      if (!searchTerm) return true;
                      const term = searchTerm.toLowerCase();
                      return (
                        p.label.toLowerCase().includes(term) ||
                        (p.moduleName && p.moduleName.toLowerCase().includes(term)) ||
                        `${p.lengthMm}`.includes(term) ||
                        `${p.widthMm}`.includes(term)
                      );
                    });

                    if (searchTerm && filteredPieces.length === 0) return null;

                    const isCurrentActiveGroup = activeGroupKey === category.key;

                    return (
                      <div
                        key={category.key}
                        style={{
                          background: 'rgba(2, 6, 23, 0.65)',
                          borderRadius: '8px',
                          border: isCurrentActiveGroup
                            ? '1px solid #10b981'
                            : '1px solid rgba(148, 163, 184, 0.25)',
                          overflow: 'hidden',
                          transition: 'border-color 0.15s ease'
                        }}
                      >
                        {/* Cabeçalho do Grupo de Material e Espessura */}
                        <div
                          style={{
                            padding: '8px 12px',
                            background: isCurrentActiveGroup
                              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(5, 150, 105, 0.12))'
                              : 'rgba(15, 23, 42, 0.85)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '6px',
                            borderBottom: '1px solid rgba(148, 163, 184, 0.15)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px' }}>🪵</span>
                            <div>
                              <strong style={{ fontSize: '12px', color: '#f8fafc' }}>
                                {category.woodMaterial} — {category.thicknessMm} mm
                              </strong>
                              <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '6px' }}>
                                ({category.totalPieces} {category.totalPieces === 1 ? 'peça' : 'peças'} · {category.totalAreaM2.toFixed(2)} m²)
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 700,
                                color: '#fbbf24',
                                background: 'rgba(245, 158, 11, 0.15)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              ~{category.estimatedSheets} {category.estimatedSheets === 1 ? 'chapa' : 'chapas'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveGroupKey(category.key);
                                if (category.pieces.length > 0) {
                                  setSelectedPieceKey(category.pieces[0].key);
                                }
                              }}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '5px',
                                border: isCurrentActiveGroup ? '1px solid #10b981' : '1px solid rgba(148, 163, 184, 0.3)',
                                background: isCurrentActiveGroup ? '#10b981' : 'rgba(15, 23, 42, 0.7)',
                                color: isCurrentActiveGroup ? '#022c22' : '#cbd5e1',
                                fontSize: '10px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {isCurrentActiveGroup ? '✓ Folha Ativa' : '📐 Ver Plano de Corte'}
                            </button>
                          </div>
                        </div>

                        {/* Tabela do Grid de Peças deste Grupo */}
                        <div style={{ overflowX: 'auto' }}>
                          <table className="bom-table" style={{ margin: 0, width: '100%', fontSize: '11px' }}>
                            <thead>
                              <tr>
                                <th style={{ width: '32px', textAlign: 'center' }}>#</th>
                                <th>Peça / Componente</th>
                                <th>Módulo</th>
                                <th>Medidas (C × L × E)</th>
                                <th style={{ textAlign: 'center' }}>Qtd</th>
                                <th>Área</th>
                                <th>Usinagem / Furação CNC</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredPieces.map((piece, idx) => {
                                const isSelected = selectedPieceKey === piece.key;

                                return (
                                  <tr
                                    key={piece.key}
                                    onClick={() => {
                                      setSelectedPieceKey(piece.key);
                                      setActiveGroupKey(category.key);
                                    }}
                                    style={{
                                      cursor: 'pointer',
                                      background: isSelected
                                        ? 'rgba(56, 189, 248, 0.22)'
                                        : undefined,
                                      borderLeft: isSelected ? '3px solid #38bdf8' : '3px solid transparent',
                                      transition: 'background 0.12s ease'
                                    }}
                                  >
                                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                                      {idx + 1}
                                    </td>
                                    <td>
                                      <strong style={{ color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                                        {piece.label}
                                      </strong>
                                    </td>
                                    <td>
                                      {piece.moduleName ? (
                                        <span
                                          style={{
                                            fontSize: '9px',
                                            fontWeight: 700,
                                            padding: '2px 5px',
                                            borderRadius: '4px',
                                            background: 'rgba(148, 163, 184, 0.15)',
                                            color: '#cbd5e1'
                                          }}
                                        >
                                          {piece.moduleName}
                                        </span>
                                      ) : (
                                        <span style={{ color: '#64748b', fontSize: '9px' }}>—</span>
                                      )}
                                    </td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f59e0b', whiteSpace: 'nowrap' }}>
                                      {piece.lengthMm} × {piece.widthMm} × {piece.thicknessMm} mm
                                    </td>
                                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                                      {piece.qty} un
                                    </td>
                                    <td style={{ fontFamily: 'var(--font-mono)', color: '#34d399', fontSize: '10.5px' }}>
                                      {piece.totalAreaM2 >= 0.1 ? `${piece.totalAreaM2.toFixed(3)} m²` : `${Math.round(piece.totalAreaM2 * 10000)} cm²`}
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {piece.isPerforated && (
                                          <span
                                            style={{
                                              fontSize: '8.5px',
                                              fontWeight: 700,
                                              color: '#34d399',
                                              background: 'rgba(52, 211, 153, 0.15)',
                                              border: '1px solid rgba(52, 211, 153, 0.4)',
                                              padding: '1px 5px',
                                              borderRadius: '3px',
                                              whiteSpace: 'nowrap'
                                            }}
                                          >
                                            🕳️ CNC Ø{piece.holeDiameterMm || 40}mm
                                          </span>
                                        )}
                                        {piece.hasCabinetExclusion && (
                                          <span
                                            style={{
                                              fontSize: '8.5px',
                                              fontWeight: 700,
                                              color: '#38bdf8',
                                              background: 'rgba(56, 189, 248, 0.18)',
                                              border: '1px solid rgba(56, 189, 248, 0.4)',
                                              padding: '1px 5px',
                                              borderRadius: '3px',
                                              whiteSpace: 'nowrap'
                                            }}
                                          >
                                            🍃 Base Aéreo
                                          </span>
                                        )}
                                        {piece.isRearShelf && (
                                          <span
                                            style={{
                                              fontSize: '8.5px',
                                              fontWeight: 700,
                                              color: '#fbbf24',
                                              background: 'rgba(245, 158, 11, 0.18)',
                                              border: '1px solid rgba(245, 158, 11, 0.4)',
                                              padding: '1px 5px',
                                              borderRadius: '3px',
                                              whiteSpace: 'nowrap'
                                            }}
                                          >
                                            🪵 Mesa Rebatível
                                          </span>
                                        )}
                                        {!piece.isPerforated && !piece.hasCabinetExclusion && !piece.isRearShelf && (
                                          <span style={{ fontSize: '9px', color: '#64748b' }}>Corte Reto</span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ─── COLUNA DA DIREITA: PAINEL DE PLANO DE CORTE CNC 2D (ESTILO CORTE CLOUD) ─── */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
                overflow: 'hidden'
              }}
            >
              <CuttingPlanPanel
                woodCutGroups={woodStats.cutGroups}
                selectedPieceKey={selectedPieceKey}
                onSelectPiece={setSelectedPieceKey}
                activeGroupKey={activeGroupKey}
                onSelectGroupKey={setActiveGroupKey}
              />
            </div>
          </div>
        ) : mainViewMode === 'metal' ? (
          /* ═══════════════════════════════════════════════════════════════════ */
          /* ─── MODO OPCIONAL: FERRAGENS & ESTRUTURA METÁLICA (PERFIS & ACESSÓRIOS) ─── */
          /* ═══════════════════════════════════════════════════════════════════ */
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px', marginTop: '10px' }}>
            <div
              style={{
                marginBottom: '8px',
                padding: '8px 12px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(37, 99, 235, 0.12))',
                borderLeft: '4px solid #38bdf8',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.5px',
                color: '#38bdf8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>🔩 FERRAGENS & ESTRUTURA METÁLICA (PERFIS, TRILHOS & ACESSÓRIOS)</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#cbd5e1' }}>
                Material: {structureMaterial === 'aluminum' ? 'Alumínio Estrutural T-Slot' : structureMaterial === 'aluminum_tube' ? 'Alumínio Tubular (Metalon Alumínio)' : 'Aço Metalon Soldado'}
              </span>
            </div>

            {/* ─── PAINEL DE PRECIFICAÇÃO POR JUNTA / NÓ (A MÉTRICA DAS QUINAS) ─── */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>📐</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.3px' }}>
                      1. Quantitativo de Juntas/Nós (A métrica das "Quinas")
                    </h4>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                      Mapeamento estrutural de nós de solda e etapas de serralheria automotiva
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total de Nós:</span>
                  <strong style={{ fontSize: '13px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {weldedJointsReport.totalJoints} Quinas Estruturais
                  </strong>
                </div>
              </div>

              {/* Texto explicativo fiel à solicitação do usuário */}
              <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.55, color: '#cbd5e1', background: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                Esta é a abordagem mais precisa se o seu projeto tem muitos recortes e cantos. Cada <strong>"quina"</strong> (o encontro entre dois ou mais tubos) exige um ciclo completo de trabalho: <strong>corte em esquadria (45º ou boca de lobo)</strong>, <strong>esquadrejamento no esquadro magnético</strong>, <strong>ponteamento nas 4 faces</strong>, <strong>solda definitiva</strong> e, o mais demorado, o <strong>lixamento com disco flap</strong>.
              </p>

              {/* As 5 Etapas do Ciclo Completo da Quina */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '6px 8px', borderRadius: '5px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700 }}>ETAPA 1</div>
                  <div style={{ fontSize: '10.5px', color: '#f8fafc', fontWeight: 600 }}>✂️ Corte em Esquadria</div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>45° ou boca de lobo</div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '6px 8px', borderRadius: '5px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700 }}>ETAPA 2</div>
                  <div style={{ fontSize: '10.5px', color: '#f8fafc', fontWeight: 600 }}>🧲 Esquadrejamento</div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Esquadro magnético 90°</div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '6px 8px', borderRadius: '5px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700 }}>ETAPA 3</div>
                  <div style={{ fontSize: '10.5px', color: '#f8fafc', fontWeight: 600 }}>⚡ Ponteamento 4 Faces</div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Trava anti-deformação</div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '6px 8px', borderRadius: '5px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700 }}>ETAPA 4</div>
                  <div style={{ fontSize: '10.5px', color: '#f8fafc', fontWeight: 600 }}>👨‍🏭 Solda Definitiva</div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>MIG/MAG penetração total</div>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.12)', padding: '6px 8px', borderRadius: '5px', border: '1px solid rgba(56, 189, 248, 0.35)' }}>
                  <div style={{ fontSize: '9.5px', color: '#38bdf8', fontWeight: 700 }}>ETAPA 5 (DEMORADA)</div>
                  <div style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: 700 }}>🪚 Disco Flap</div>
                  <div style={{ fontSize: '9px', color: '#7dd3fc' }}>Faceamento e plano liso</div>
                </div>
              </div>

              {/* Indicadores Numéricos de Juntas & Quantitativo Total */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', paddingTop: '4px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Total de Quinas / Nós:</span>
                  <strong style={{ fontSize: '16px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {weldedJointsReport.totalJoints} quinas
                  </strong>
                  <div style={{ fontSize: '9.5px', color: '#cbd5e1', marginTop: '2px' }}>
                    {weldedJointsReport.miterCorners45} quinas 45° · {weldedJointsReport.teeJoints} em T · {weldedJointsReport.mountBracketsJoints} sapatas
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Distribuição por Estrutura:</span>
                  <div style={{ fontSize: '11px', color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>
                    Rack: <strong style={{ color: '#38bdf8' }}>{weldedJointsReport.breakdown.rackBase.total}</strong> · Bandejas: <strong style={{ color: '#38bdf8' }}>{weldedJointsReport.breakdown.solarTrays.total}</strong> · Baú: <strong style={{ color: '#38bdf8' }}>{weldedJointsReport.breakdown.cargoSubchassis.total}</strong>
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#cbd5e1', marginTop: '2px' }}>
                    {weldedJointsReport.breakdown.solarTrays.traysCount} bandejas móveis ({weldedJointsReport.breakdown.solarTrays.miter45} quinas 45° + {weldedJointsReport.breakdown.solarTrays.tee} em T)
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Consumíveis Estimados (Quantidade):</span>
                  <div style={{ fontSize: '11px', color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>
                    📦 ~{weldedJointsReport.consumables.cuttingDiscs4Half} cortes 4 ½" · ~{weldedJointsReport.consumables.flapDiscsGrinding + weldedJointsReport.consumables.flapDiscsFinishing} flaps
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#cbd5e1', marginTop: '2px' }}>
                    ⚡ ~{weldedJointsReport.consumables.migWireKg} kg arame MIG · 4 esquadros magnéticos
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela Totalizadora Agrupada por Espessura dos Tubos */}
            <div
              style={{
                marginBottom: '6px',
                padding: '7px 10px',
                background: 'rgba(56, 189, 248, 0.12)',
                borderLeft: '3px solid var(--primary)',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                color: 'var(--primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>📊 RESUMO TOTALIZADOR AGRUPADO POR ESPESSURA DOS TUBOS</span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                Separado por bitola comercial para compras e regulagem de solda
              </span>
            </div>
            <table className="bom-table" style={{ marginBottom: '16px' }}>
              <thead>
                <tr>
                  <th>Especificação do Perfil / Material</th>
                  <th>Qtd. Peças</th>
                  <th>Total Linear (mm)</th>
                  <th>Total Linear (m)</th>
                  <th>Equiv. Barras 6m</th>
                  <th>Equiv. Barras 3m</th>
                </tr>
              </thead>
              <tbody>
                {barStats.thicknessGroups.map((grp) => (
                  <React.Fragment key={grp.groupTitle}>
                    {/* Cabeçalho do Grupo de Espessura */}
                    <tr style={{ background: 'rgba(30, 41, 59, 0.95)', borderTop: '2px solid rgba(56, 189, 248, 0.4)' }}>
                      <td colSpan={6} style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                          <div>
                            <strong style={{ color: '#38bdf8', fontSize: '11.5px' }}>{grp.groupTitle}</strong>
                            <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>{grp.groupSubtitle}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '10.5px', fontFamily: 'var(--font-mono)' }}>
                            <span style={{ color: '#cbd5e1' }}><strong>{grp.totalPieces}</strong> cortes</span>
                            <span style={{ color: '#34d399' }}><strong>{grp.totalMeters.toFixed(2)}</strong> m</span>
                            <span style={{ color: '#fbbf24' }}><strong>{grp.totalBars6m}</strong> barra(s) 6m</span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Linhas de Perfis deste Grupo */}
                    {grp.profiles.map((p) => (
                      <tr key={p.profileSpec}>
                        <td style={{ paddingLeft: '18px' }}>
                          <strong style={{ color: '#f8fafc' }}>{p.profileSpec}</strong>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>{p.pieces} un</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(p.totalMeters * 1000).toLocaleString('pt-BR')} mm</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34d399' }}>{p.totalMeters.toFixed(2)} m</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
                          {p.profileSpec.includes('T-Slot') || p.profileSpec.includes('Metalon') || p.profileSpec.includes('Tubo') ? `${p.bars6m} barra(s)` : '—'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                          {p.profileSpec.includes('T-Slot') || p.profileSpec.includes('Metalon') || p.profileSpec.includes('Tubo') ? `${p.bars3m} barra(s)` : '—'}
                        </td>
                      </tr>
                    ))}

                    {/* Linha de Subtotal da Espessura */}
                    <tr style={{ background: 'rgba(15, 23, 42, 0.55)', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', fontSize: '10.5px' }}>
                      <td style={{ paddingLeft: '18px', color: '#94a3b8', fontStyle: 'italic' }}>
                        Subtotal Espessura {grp.thicknessLabel} ({grp.gaugeLabel})
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>{grp.totalPieces} un</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>{Math.round(grp.totalMeters * 1000).toLocaleString('pt-BR')} mm</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34d399' }}>{grp.totalMeters.toFixed(2)} m</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>{grp.totalBars6m} barra(s)</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{grp.totalBars3m} barra(s)</td>
                    </tr>
                  </React.Fragment>
                ))}

                {/* TOTAL GERAL */}
                <tr style={{ background: 'rgba(16, 185, 129, 0.15)', fontWeight: 800, borderTop: '2px solid #10b981' }}>
                  <td style={{ color: '#34d399' }}>TOTAL GERAL DE TODAS AS ESPESSURAS</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{barStats.totalPieces} un</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
                    {Math.round(barStats.totalMeters * 1000).toLocaleString('pt-BR')} mm
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>{barStats.totalMeters.toFixed(2)} m</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>{barStats.totalBars6m} barra(s) 6m</td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            {/* Tabela Completa de Cortes de Barras Agrupada por Espessura */}
            <div
              style={{
                marginBottom: '6px',
                padding: '7px 10px',
                background: 'rgba(56, 189, 248, 0.12)',
                borderLeft: '3px solid var(--primary)',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                color: 'var(--primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>📏 LISTA DE CORTES DE BARRAS ({barStats.totalPieces} PEÇAS AGRUPADAS POR ESPESSURA)</span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Separado por tubo e bitola</span>
            </div>
            <table className="bom-table" style={{ marginBottom: '18px' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Peça / Função na Estrutura</th>
                  <th>Perfil</th>
                  <th>Medida Unit.</th>
                  <th>Qtd</th>
                  <th>Subtotal Linear</th>
                </tr>
              </thead>
              <tbody>
                {barStats.cutThicknessGroups.map((section) => (
                  <React.Fragment key={section.groupTitle}>
                    <tr style={{ background: 'rgba(30, 41, 59, 0.90)', borderTop: '1px solid rgba(56, 189, 248, 0.3)' }}>
                      <td colSpan={6} style={{ padding: '6px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <strong style={{ color: '#38bdf8', fontSize: '11px' }}>{section.groupTitle}</strong>
                          <span style={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                            {section.totalPieces} peças · {section.totalMeters.toFixed(2)} m
                          </span>
                        </div>
                      </td>
                    </tr>

                    {section.items.map((g, idx) => (
                      <tr key={g.key}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>{idx + 1}</td>
                        <td>
                          <strong>{g.label}</strong>
                        </td>
                        <td style={{ fontSize: '11px', color: '#94a3b8' }}>{g.profileSpec}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                          {structureMaterial === 'steel' && steelProfileUnit === 'inch' ? (
                            <>
                              {(g.lengthM * 39.3701).toFixed(1)}" <span style={{ color: '#64748b', fontWeight: 400 }}>({g.lengthMm.toLocaleString('pt-BR')} mm)</span>
                            </>
                          ) : (
                            <>
                              {g.lengthMm.toLocaleString('pt-BR')} mm <span style={{ color: '#64748b', fontWeight: 400 }}>({(g.lengthM * 100).toFixed(1)} cm)</span>
                            </>
                          )}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{g.qty} un</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 700 }}>
                          {g.totalLengthM.toFixed(2)} m
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Acessórios Mecânicos e Ferragens de Montagem */}
            <div
              style={{
                marginBottom: '6px',
                padding: '7px 10px',
                background: 'rgba(14,165,233,0.12)',
                borderLeft: '3px solid var(--primary)',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                color: 'var(--primary)'
              }}
            >
              ⚙️ FERRAGENS & ACESSÓRIOS MECÂNICOS
            </div>
            <table className="bom-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Descrição / Medida</th>
                  <th>Qtd</th>
                  <th>Finalidade</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Trilho Telescópico Heavy Duty</strong></td>
                  <td>Corrediça aço zincado/inox · curso 900 mm · 80–120 kg</td>
                  <td>2–4 pares</td>
                  <td>Guias para expansão suave das gavetas</td>
                </tr>
                <tr>
                  <td><strong>Cantoneiras T-Slot / Esquadros Metalon</strong></td>
                  <td>AL fundido 2020/3030 ou cantoneira aço estampada</td>
                  <td>~24 un</td>
                  <td>Conexão de perfis estruturais em ângulo 90°</td>
                </tr>
                {internalBoxes.filter((b) => b.rearFoldShelf).map((b) => {
                  const bracketSpec = getFoldingBracketForHeight(b.heightMm, b.rearShelfBracketInches);
                  return (
                    <tr key={`shelf-bracket-${b.id}`}>
                      <td><strong>Suporte Articulado Dobrável Inox c/ Trava {bracketSpec.inches}" ({bracketSpec.lengthMm} mm) (Par 2PCS)</strong></td>
                      <td>Aço inoxidável escovado reforçado · canaletas estampadas em U · trava mecânica automática 90° c/ haste diagonal e gatilho de liberação rápida · carga até {bracketSpec.maxLoadKg} kg · compatível c/ altura de {b.heightMm} mm ({b.name})</td>
                      <td>1 par</td>
                      <td>Sustentação mecânica de alta resistência da mesa/prateleira rebatível traseira (substitui pistão a gás)</td>
                    </tr>
                  );
                })}
                {internalBoxes.some((b) => b.type === 'slide_tray' || b.drawerMode === 'slide_tray' || (b.upperCabinet && getUpperCabinetClosure(b) === 'drawer')) && (
                  <tr>
                    <td><strong>Corrediças Telescópicas Reforçadas 45kg c/ Trava (Par)</strong></td>
                    <td>Aço zincado pesado · trava de fechamento e abertura · extensão total</td>
                    <td>{internalBoxes.filter((b) => b.type === 'slide_tray' || b.drawerMode === 'slide_tray' || (b.upperCabinet && getUpperCabinetClosure(b) === 'drawer')).length} par(es)</td>
                    <td>Deslizamento e trava segura da gaveta/bandeja corrediça (inferior ou armário aéreo)</td>
                  </tr>
                )}
                {internalBoxes.some((b) => b.upperCabinet && getUpperCabinetClosure(b) !== 'open') && (
                  <tr>
                    <td><strong>Botão Trava Push-Lock Náutico Cromado</strong></td>
                    <td>Liga de zinco e ABS · trava push-button anti-abertura em curvas e frenagens</td>
                    <td>{internalBoxes.filter((b) => b.upperCabinet && getUpperCabinetClosure(b) !== 'open').length} un</td>
                    <td>Fechamento e trava de segurança marítima das portas/gavetas dos armários aéreos</td>
                  </tr>
                )}
                {(internalGrid.centralTable?.enabled || internalBoxes.some((b) => b.hasCentralTable || b.centralTable?.enabled)) && (
                  <tr>
                    <td><strong>Pedestal Tubular Central Náutico c/ Flange de Piso e Braçadeiras (Mesa Dinette)</strong></td>
                    <td>Flange circular de piso Ø160mm fixada diretamente no assoalho · coluna tubular de aço preto acetinado Ø45mm · 2 braçadeiras de fixação rápida c/ manípulo lever · flange superior náutica de encaixe</td>
                    <td>1 kit</td>
                    <td>Coluna central de apoio da mesa dinette regulável em altura (35-85cm), rotação 360°, deslocável em X/Z e 100% removível do assoalho</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════ */
          /* ─── MODO: TUBOS DE PVC DA CAIXA D'ÁGUA EM U & HIDRÁULICA ─── */
          /* ═══════════════════════════════════════════════════════════════════ */
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px', marginTop: '10px' }}>
            <div
              style={{
                marginBottom: '10px',
                padding: '10px 14px',
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(2, 132, 199, 0.24))',
                borderLeft: '4px solid #0ea5e9',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.5px' }}>
                  💧 RESERVATÓRIO DE ÁGUA EM FORMATO U • Ø{pvcStats.diameterMm} mm ({pvcStats.totalCapacityL} LITROS)
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
                  Tubulação contínua integrada internamente no quadro de ferro ao redor do baú • 2× Laterais ({pvcStats.singleLateralL}L cada) + Circuito Frontal ({pvcStats.frontCircuitL}L)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`btn-compact ${pvcBarStandard === '6m' ? 'active' : ''}`}
                  onClick={() => setPvcBarStandard('6m')}
                  style={{
                    fontSize: '10px',
                    padding: '4px 10px',
                    fontWeight: 800,
                    background: pvcBarStandard === '6m' ? 'rgba(14, 165, 233, 0.3)' : undefined,
                    borderColor: pvcBarStandard === '6m' ? '#0ea5e9' : undefined,
                    color: pvcBarStandard === '6m' ? '#38bdf8' : undefined
                  }}
                >
                  📦 Barra 6 Metros (Padrão)
                </button>
                <button
                  className={`btn-compact ${pvcBarStandard === '3m' ? 'active' : ''}`}
                  onClick={() => setPvcBarStandard('3m')}
                  style={{
                    fontSize: '10px',
                    padding: '4px 10px',
                    fontWeight: 800,
                    background: pvcBarStandard === '3m' ? 'rgba(14, 165, 233, 0.3)' : undefined,
                    borderColor: pvcBarStandard === '3m' ? '#0ea5e9' : undefined,
                    color: pvcBarStandard === '3m' ? '#38bdf8' : undefined
                  }}
                >
                  📦 Barras 3 Metros (Varejo)
                </button>
              </div>
            </div>

            {/* Diagrama Visual de Corte Linear */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <strong style={{ fontSize: '12px', color: '#f8fafc' }}>
                📐 Plano de Corte das Barras Comerciais de PVC ({pvcBarStandard === '6m' ? 'Barras de 6m' : 'Barras de 3m'}):
              </strong>

              {(pvcBarStandard === '6m' ? pvcStats.plan6m : pvcStats.plan3m).map((bar) => (
                <div
                  key={bar.barIndex}
                  style={{
                    background: 'rgba(2, 6, 23, 0.75)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                      Barra #{bar.barIndex} ({bar.barLengthMm / 1000} m)
                    </span>
                    <span style={{ color: '#cbd5e1' }}>
                      Cortes: <strong>{bar.usedMm} mm</strong> • Sobra: <strong style={{ color: '#94a3b8' }}>{bar.wasteMm} mm</strong> • Aproveitamento:{' '}
                      <strong style={{ color: bar.efficiencyPct >= 80 ? '#4ade80' : '#fbbf24' }}>{bar.efficiencyPct}%</strong>
                    </span>
                  </div>

                  <div
                    style={{
                      height: '36px',
                      width: '100%',
                      background: '#0b1120',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      display: 'flex',
                      border: '1px solid rgba(148, 163, 184, 0.3)'
                    }}
                  >
                    {bar.segments.map((seg, sIdx) => {
                      const isWaste = seg.label === 'Sobra Aproveitável';
                      return (
                        <div
                          key={sIdx}
                          style={{
                            width: `${seg.pct}%`,
                            minWidth: seg.pct < 3 ? '14px' : undefined,
                            background: isWaste
                              ? 'repeating-linear-gradient(45deg, rgba(71, 85, 105, 0.35), rgba(71, 85, 105, 0.35) 6px, rgba(51, 65, 85, 0.5) 6px, rgba(51, 65, 85, 0.5) 12px)'
                              : seg.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 4px',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            borderRight: sIdx < bar.segments.length - 1 ? '2px solid #0f172a' : undefined
                          }}
                          title={`${seg.label}: ${seg.lengthMm} mm (${seg.pct}%)`}
                        >
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              color: isWaste ? '#94a3b8' : '#ffffff',
                              textShadow: isWaste ? undefined : '0 1px 2px rgba(0,0,0,0.8)'
                            }}
                          >
                            {seg.pct >= 10 ? `${seg.label} (${seg.lengthMm}mm)` : `${seg.lengthMm}mm`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Tabela Completa de Cortes de Tubos de PVC */}
            <div
              style={{
                marginBottom: '6px',
                padding: '7px 10px',
                background: 'rgba(14, 165, 233, 0.12)',
                borderLeft: '3px solid #0ea5e9',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#38bdf8'
              }}
            >
              📏 LISTA DE CORTES DE TUBOS PVC ({pvcStats.totalPieces} PEÇAS • {pvcStats.totalLinearMeters} METROS)
            </div>
            <table className="bom-table" style={{ marginBottom: '18px' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Identificação da Tubulação</th>
                  <th>Especificação do Tubo</th>
                  <th>Medida de Corte (mm)</th>
                  <th>Qtd</th>
                  <th>Total Linear</th>
                  <th>Fixação e Montagem</th>
                </tr>
              </thead>
              <tbody>
                {pvcStats.cutItems.map((c, idx) => (
                  <tr key={c.key}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>{idx + 1}</td>
                    <td><strong style={{ color: '#f8fafc' }}>{c.label}</strong></td>
                    <td style={{ color: '#38bdf8' }}>{c.spec}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>{c.lengthMm} mm</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f59e0b' }}>{c.qty} un</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{c.totalLengthM.toFixed(2)} m</td>
                    <td style={{ color: '#94a3b8', fontSize: '10.5px' }}>{c.notes}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(14, 165, 233, 0.12)', fontWeight: 800 }}>
                  <td colSpan={4} style={{ color: '#38bdf8' }}>TOTAL GERAL TUBOS PVC</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>{pvcStats.totalPieces} un</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>{pvcStats.totalLinearMeters.toFixed(2)} m</td>
                  <td style={{ color: '#cbd5e1', fontSize: '10.5px' }}>Volume total: {pvcStats.totalCapacityL} Litros</td>
                </tr>
              </tbody>
            </table>

            {/* Tabela de Conexões e Ferragens Hidráulicas */}
            <div
              style={{
                marginBottom: '6px',
                padding: '7px 10px',
                background: 'rgba(56, 189, 248, 0.12)',
                borderLeft: '3px solid #38bdf8',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#38bdf8'
              }}
            >
              🔧 CONEXÕES & ACESSÓRIOS HIDRÁULICOS NECESSÁRIOS ({pvcStats.fittings.length} ITENS)
            </div>
            <table className="bom-table">
              <thead>
                <tr>
                  <th>Componente Hidráulico</th>
                  <th>Especificação Técnica</th>
                  <th>Qtd</th>
                  <th>Função & Aplicação no Veículo</th>
                </tr>
              </thead>
              <tbody>
                {pvcStats.fittings.map((f) => (
                  <tr key={f.key}>
                    <td><strong style={{ color: '#f8fafc' }}>{f.label}</strong></td>
                    <td style={{ color: '#38bdf8' }}>{f.spec}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#4ade80' }}>
                      {f.qty} {f.unit}
                    </td>
                    <td style={{ color: '#cbd5e1', fontSize: '10.5px' }}>{f.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
