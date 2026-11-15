import React, { useState } from 'react';
import { useSolar } from '../context/SolarContext';
import { InternalBoxesPlanner, InternalBoxesLeftTab } from './InternalBoxesPlanner';
import { CuttingPlanSidePanel, CuttingTabId } from './cutting/CuttingPlanSidePanel';
import { SidebarSolarSection } from './sidebar/SidebarSolarSection';
import { SidebarStructureSection } from './sidebar/SidebarStructureSection';
import { SidebarPositionSection } from './sidebar/SidebarPositionSection';
import { SidebarCargoBoxSection } from './sidebar/SidebarCargoBoxSection';
import { SidebarWaterTankSection } from './sidebar/SidebarWaterTankSection';
import { SidebarAwningSection } from './sidebar/SidebarAwningSection';
import { SidebarElectricalSection } from './sidebar/SidebarElectricalSection';
import { SidebarResizer } from './layout/SidebarResizer';
import {
  ChevronsLeftIcon,
  ChevronsRightIcon,
  SlidersIcon,
  GridBoxesIcon,
  CeilingLightIcon,
  SunIcon,
  StructureFrameIcon,
  LuggageIcon,
  ZapIcon,
  ScissorsIcon,
  LayersIcon,
  BedIcon,
  DropletIcon,
} from './layout/IdeIcons';
import { ViewMode } from '../types';

type AssembledLeftTab = 'all' | 'solar' | 'structure' | 'accessories' | 'electrical';

interface SidebarProps {
  isVisible: boolean;
  onToggleVisible: () => void;
}

const DEFAULT_WIDTHS: Record<'internal_boxes' | 'assembled' | 'bars_lineup', number> = {
  internal_boxes: 460,
  assembled: 370,
  bars_lineup: 680,
};

export const Sidebar: React.FC<SidebarProps> = ({ isVisible, onToggleVisible }) => {
  const { viewMode, setViewMode } = useSolar();

  const [widths, setWidths] = useState(DEFAULT_WIDTHS);
  const [boxesTab, setBoxesTab] = useState<InternalBoxesLeftTab>('all');
  const [assembledTab, setAssembledTab] = useState<AssembledLeftTab>('all');
  const [cuttingTab, setCuttingTab] = useState<CuttingTabId>('cutting_plan');

  if (viewMode === 'electrical_planar' || viewMode === 'hydraulic_planar') {
    return null;
  }

  const modeKey = viewMode as 'internal_boxes' | 'assembled' | 'bars_lineup';
  const currentWidth = widths[modeKey] ?? 370;
  const setWidth = (w: number) =>
    setWidths((prev) => ({
      ...prev,
      [modeKey]: w,
    }));

  function handleTabClick<T>(
    tab: T,
    currentTab: T,
    setter: (value: T) => void
  ) {
    if (!isVisible) {
      setter(tab);
      onToggleVisible();
    } else if (currentTab === tab) {
      onToggleVisible();
    } else {
      setter(tab);
    }
  };

  const renderPanelHeaderTitle = (mode: ViewMode) => {
    if (mode === 'internal_boxes') {
      if (boxesTab === 'grid') return 'PLANTA & GRID CAMPER';
      if (boxesTab === 'ceiling') return 'TETO, FORRO & ILUMINAÇÃO';
      return 'CAIXAS INTERNAS & GRID CAMPER';
    }
    if (mode === 'bars_lineup') {
      return 'PEÇAS & OTIMIZADOR DE CORTE';
    }
    if (assembledTab === 'solar') return 'PAINÉIS SOLARES & ARRANJO';
    if (assembledTab === 'structure') return 'ESTRUTURA METÁLICA & POSIÇÃO';
    if (assembledTab === 'accessories') return 'BAÚ, ÁGUA & TOLDO OVERLAND';
    if (assembledTab === 'electrical') return 'FONTES & SISTEMA ELÉTRICO';
    return 'CONTROLES DA DOBLÒ & RACK';
  };

  return (
    <div className="ide-sidebar-shell left">
      {/* ── Barra Vertical de Atividades (48px) estilo FlowML ── */}
      <div className="ide-activity-bar left">
        <button
          type="button"
          onClick={onToggleVisible}
          className={`ide-activity-collapse-btn ${isVisible ? 'open' : ''}`}
          title={isVisible ? 'Recolher Painel Esquerdo' : 'Expandir Painel Esquerdo'}
        >
          {isVisible ? <ChevronsLeftIcon size={14} /> : <ChevronsRightIcon size={14} />}
        </button>

        {viewMode === 'internal_boxes' && (
          <>
            <button
              type="button"
              onClick={() => handleTabClick('all', boxesTab, setBoxesTab)}
              className={`ide-activity-btn left ${isVisible && boxesTab === 'all' ? 'active' : ''}`}
              title="Todas as Propriedades (Grid, Presets & Teto)"
            >
              <SlidersIcon />
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('grid', boxesTab, setBoxesTab)}
              className={`ide-activity-btn left ${isVisible && boxesTab === 'grid' ? 'active' : ''}`}
              title="Planta 2D do Assoalho & Configuração do Grid"
            >
              <GridBoxesIcon />
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('ceiling', boxesTab, setBoxesTab)}
              className={`ide-activity-btn left ${isVisible && boxesTab === 'ceiling' ? 'active' : ''}`}
              title="Teto, Forro & Iluminação LED"
            >
              <CeilingLightIcon />
            </button>
          </>
        )}

        {viewMode === 'assembled' && (
          <>
            <button
              type="button"
              onClick={() => handleTabClick('all', assembledTab, setAssembledTab)}
              className={`ide-activity-btn left ${isVisible && assembledTab === 'all' ? 'active' : ''}`}
              title="Todos os Módulos"
            >
              <SlidersIcon />
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('solar', assembledTab, setAssembledTab)}
              className={`ide-activity-btn left ${isVisible && assembledTab === 'solar' ? 'active' : ''}`}
              title="Painel Solar & Modos"
            >
              <SunIcon />
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('structure', assembledTab, setAssembledTab)}
              className={`ide-activity-btn left ${isVisible && assembledTab === 'structure' ? 'active' : ''}`}
              title="Estrutura, Material & Posição"
            >
              <StructureFrameIcon />
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('accessories', assembledTab, setAssembledTab)}
              className={`ide-activity-btn left ${isVisible && assembledTab === 'accessories' ? 'active' : ''}`}
              title="Baú de Teto, Caixa d'Água & Toldo"
            >
              <LuggageIcon />
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('electrical', assembledTab, setAssembledTab)}
              className={`ide-activity-btn left ${isVisible && assembledTab === 'electrical' ? 'active' : ''}`}
              title="Sistemas Elétricos 12V / Fontes"
            >
              <ZapIcon />
            </button>
          </>
        )}

        {viewMode === 'bars_lineup' && (
          <>
            <button
              type="button"
              onClick={() => handleTabClick('cutting_plan', cuttingTab, setCuttingTab)}
              className={`ide-activity-btn left ${isVisible && cuttingTab === 'cutting_plan' ? 'active' : ''}`}
              title="Otimizador de Plano de Corte 2D"
            >
              <ScissorsIcon />
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('wood_pieces', cuttingTab, setCuttingTab)}
              className={`ide-activity-btn left ${isVisible && cuttingTab === 'wood_pieces' ? 'active' : ''}`}
              title="Peças de Madeira & Marcenaria"
            >
              <LayersIcon />
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('upholstery_pieces', cuttingTab, setCuttingTab)}
              className={`ide-activity-btn left ${isVisible && cuttingTab === 'upholstery_pieces' ? 'active' : ''}`}
              title="Estofaria & Espuma D33"
            >
              <BedIcon />
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('metal_bars', cuttingTab, setCuttingTab)}
              className={`ide-activity-btn left ${isVisible && cuttingTab === 'metal_bars' ? 'active' : ''}`}
              title="Perfis Metálicos (Alumínio / Metalon)"
            >
              <StructureFrameIcon />
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('pvc_pipes', cuttingTab, setCuttingTab)}
              className={`ide-activity-btn left ${isVisible && cuttingTab === 'pvc_pipes' ? 'active' : ''}`}
              title="Tubulação PVC (Caixa d'Água)"
            >
              <DropletIcon />
            </button>
          </>
        )}
      </div>

      {/* ── Conteúdo Docked Redimensionável ── */}
      {isVisible && (
        <aside
          className="ide-docked-sidebar left"
          style={{ width: `${currentWidth}px` }}
        >
          <div className="ide-sidebar-header">
            <span className="ide-sidebar-title">{renderPanelHeaderTitle(viewMode)}</span>
            {viewMode === 'internal_boxes' && (
              <button
                type="button"
                onClick={() => setViewMode('assembled')}
                className="btn-compact primary"
                style={{ fontSize: '10px', padding: '3px 8px', fontWeight: 700 }}
                title="Ir para Doblò Externa + Sistema Solar"
              >
                Doblò Externa ➔
              </button>
            )}
          </div>

          {viewMode === 'bars_lineup' ? (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <CuttingPlanSidePanel
                docked
                activeTab={cuttingTab}
                onTabChange={setCuttingTab}
              />
            </div>
          ) : (
            <div className="ide-sidebar-content sidebar-panel">
              {viewMode === 'internal_boxes' && (
                <InternalBoxesPlanner activeTab={boxesTab} />
              )}

              {viewMode === 'assembled' && (
                <>
                  {(assembledTab === 'all' || assembledTab === 'solar') && <SidebarSolarSection />}
                  {(assembledTab === 'all' || assembledTab === 'structure') && (
                    <>
                      <SidebarStructureSection />
                      <SidebarPositionSection />
                    </>
                  )}
                  {(assembledTab === 'all' || assembledTab === 'accessories') && (
                    <>
                      <SidebarCargoBoxSection />
                      <SidebarWaterTankSection />
                      <SidebarAwningSection />
                    </>
                  )}
                  {(assembledTab === 'all' || assembledTab === 'electrical') && (
                    <SidebarElectricalSection />
                  )}
                </>
              )}
            </div>
          )}

          <SidebarResizer
            side="left"
            width={currentWidth}
            setWidth={setWidth}
            minWidth={280}
            maxWidth={920}
          />
        </aside>
      )}
    </div>
  );
};
