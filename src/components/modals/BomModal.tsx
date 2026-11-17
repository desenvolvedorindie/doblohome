import React, { useMemo, useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { extractPvcCutStats } from '../../utils/pvcUtils';
import { calculateWeldedJoints } from '../../utils/weldedJointsUtils';
import {
  extractWoodCutGroups,
  extractBarStats,
  groupWoodCutPieces
} from '../../utils/woodUtils';
import { BomWoodTab } from './bom/BomWoodTab';
import { BomMetalTab } from './bom/BomMetalTab';
import { BomPvcTab } from './bom/BomPvcTab';
import { BomAwningTab } from './bom/BomAwningTab';
import { extractAwningHardwareStats } from '../../utils/awningHardwareUtils';

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
    waterTank,
    awning
  } = useSolar();

  const [mainViewMode, setMainViewMode] = useState<'wood_cutting' | 'upholstery' | 'metal' | 'pvc' | 'awning'>('wood_cutting');
  const [pvcBarStandard, setPvcBarStandard] = useState<'6m' | '3m'>('6m');
  const [selectedPieceKey, setSelectedPieceKey] = useState<string | null>(null);
  const [activeGroupKey, setActiveGroupKey] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const pvcStats = useMemo(() => {
    return extractPvcCutStats(waterTank);
  }, [waterTank]);

  const awningStats = useMemo(() => {
    return extractAwningHardwareStats(awning);
  }, [awning]);

  // Totalizador de Ferragens e Perfis Metálicos (Alumínio T-Slot / Metalon Soldado)
  const barStats = useMemo(() => {
    return extractBarStats(sceneManager);
  }, [
    sceneManager,
    activeModal,
    structureMaterial,
    steelProfileUnit,
    metalonWallThickness,
    metalonThickness40,
    metalonThickness30,
    stackLevels,
    level1,
    level2,
    cargoBox,
    activePanelPreset
  ]);

  // Relatório de Juntas/Nós Estruturais (A métrica das "Quinas")
  const weldedJointsReport = useMemo(() => {
    return calculateWeldedJoints(sceneManager);
  }, [sceneManager, activeModal, cargoBox, stackLevels, level1, level2]);

  // Totalizador e Plano de Corte do Grupo Madeira e Espuma
  const woodStats = useMemo(() => {
    return extractWoodCutGroups(sceneManager);
  }, [sceneManager, internalBoxes, internalGrid, activeModal]);

  // Agrupamento das peças de madeira por [Tipo de Madeira] + [Espessura] estilo Corte Cloud
  const woodGroupsByCategory = useMemo(() => {
    return groupWoodCutPieces(woodStats.cutGroups);
  }, [woodStats.cutGroups]);

  // Estatísticas filtradas para Marcenaria (Compensado / MDF)
  const woodOnlyStats = useMemo(() => {
    const cutGroups = woodStats.cutGroups.filter((g) => !g.isUpholstery);
    const totalPieces = cutGroups.reduce((acc, g) => acc + g.qty, 0);
    const totalAreaM2 = cutGroups.reduce((acc, g) => acc + g.totalAreaM2, 0);
    const standardSheets = Math.max(cutGroups.length > 0 ? 1 : 0, Math.ceil((totalAreaM2 * 1.10) / 2.977));
    return { totalPieces, totalAreaM2, standardSheets, cutGroups };
  }, [woodStats]);

  const woodOnlyCategories = useMemo(() => {
    return woodGroupsByCategory.filter((c) => !c.pieces.some((p) => p.isUpholstery) && !c.woodMaterial.includes('Espuma'));
  }, [woodGroupsByCategory]);

  // Estatísticas filtradas para Estofaria / Espuma D33 (Colchão)
  const upholsteryStats = useMemo(() => {
    const cutGroups = woodStats.cutGroups.filter((g) => g.isUpholstery);
    const totalPieces = cutGroups.reduce((acc, g) => acc + g.qty, 0);
    const totalAreaM2 = cutGroups.reduce((acc, g) => acc + g.totalAreaM2, 0);
    const standardSheets = Math.max(cutGroups.length > 0 ? 1 : 0, Math.ceil((totalAreaM2 * 1.15) / 2.66));
    return { totalPieces, totalAreaM2, standardSheets, cutGroups };
  }, [woodStats]);

  const upholsteryCategories = useMemo(() => {
    return woodGroupsByCategory.filter((c) => c.pieces.some((p) => p.isUpholstery) || c.woodMaterial.includes('Espuma'));
  }, [woodGroupsByCategory]);

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
        {/* Header do Modal com Seletor de Categorias e Ações */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📋</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.3px' }}>
                Lista de Materiais (BOM) & Plano de Corte Completo
              </h3>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Quantitativo detalhado para marcenaria, serralheria automotiva e hidráulica
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
                🪵 Marcenaria ({woodOnlyStats.totalPieces})
              </button>
              <button
                className={`btn-compact ${mainViewMode === 'upholstery' ? 'active' : ''}`}
                onClick={() => setMainViewMode('upholstery')}
                style={{
                  padding: '5px 8px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  background: mainViewMode === 'upholstery' ? 'rgba(2, 132, 199, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                  borderColor: mainViewMode === 'upholstery' ? '#38bdf8' : 'rgba(148, 163, 184, 0.3)',
                  color: mainViewMode === 'upholstery' ? '#38bdf8' : '#94a3b8'
                }}
              >
                🛏️ Colchão ({upholsteryStats.totalPieces})
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
                🔩 Rack ({barStats.totalPieces})
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
              <button
                className={`btn-compact ${mainViewMode === 'awning' ? 'active' : ''}`}
                onClick={() => setMainViewMode('awning')}
                style={{
                  padding: '5px 8px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  background: mainViewMode === 'awning' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                  borderColor: mainViewMode === 'awning' ? '#f59e0b' : 'rgba(148, 163, 184, 0.3)',
                  color: mainViewMode === 'awning' ? '#fbbf24' : '#94a3b8'
                }}
              >
                ⛺ Toldo ({awning.enabled ? awningStats.totalProfilePieces : 0})
              </button>
            </div>
            <button
              className="btn-compact primary"
              onClick={() => {
                closeModal();
                setPartsFilter(
                  mainViewMode === 'upholstery'
                    ? 'upholstery'
                    : mainViewMode === 'wood_cutting'
                      ? 'wood'
                      : mainViewMode === 'metal'
                        ? 'metal'
                        : mainViewMode === 'pvc'
                          ? 'pvc'
                          : mainViewMode === 'awning'
                            ? 'awning'
                            : 'all'
                );
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

        {/* Conteúdo da Aba Selecionada */}
        {mainViewMode === 'wood_cutting' ? (
          <BomWoodTab
            woodStats={woodOnlyStats}
            woodGroupsByCategory={woodOnlyCategories}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeGroupKey={activeGroupKey}
            setActiveGroupKey={setActiveGroupKey}
            selectedPieceKey={selectedPieceKey}
            setSelectedPieceKey={setSelectedPieceKey}
          />
        ) : mainViewMode === 'upholstery' ? (
          <BomWoodTab
            woodStats={upholsteryStats}
            woodGroupsByCategory={upholsteryCategories}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeGroupKey={activeGroupKey}
            setActiveGroupKey={setActiveGroupKey}
            selectedPieceKey={selectedPieceKey}
            setSelectedPieceKey={setSelectedPieceKey}
          />
        ) : mainViewMode === 'metal' ? (
          <BomMetalTab
            structureMaterial={structureMaterial}
            steelProfileUnit={steelProfileUnit}
            weldedJointsReport={weldedJointsReport}
            barStats={barStats}
            internalBoxes={internalBoxes}
            internalGrid={internalGrid}
          />
        ) : mainViewMode === 'pvc' ? (
          <BomPvcTab
            pvcStats={pvcStats}
            pvcBarStandard={pvcBarStandard}
            setPvcBarStandard={setPvcBarStandard}
          />
        ) : (
          <BomAwningTab
            awningStats={awningStats}
            awning={awning}
          />
        )}
      </div>
    </div>
  );
};
