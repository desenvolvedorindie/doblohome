import React, { useState } from 'react';
import { useSolar } from '../context/SolarContext';
import { RightPanelHumanSection } from './rightpanel/RightPanelHumanSection';
import { RightPanelExpansionSection } from './rightpanel/RightPanelExpansionSection';
import { RightPanelAccessorySection } from './rightpanel/RightPanelAccessorySection';
import { RightPanelWeightSection } from './rightpanel/RightPanelWeightSection';
import { RightPanelEnvironmentSection } from './rightpanel/RightPanelEnvironmentSection';
import { RightPanelElectricalSection } from './rightpanel/RightPanelElectricalSection';
import { PlannerBoxPropertiesPanel } from './planner/PlannerBoxPropertiesPanel';
import { SidebarResizer } from './layout/SidebarResizer';
import {
  ChevronsLeftIcon,
  ChevronsRightIcon,
  SlidersIcon,
  Box3DIcon,
  CompassIcon,
  LuggageIcon,
  ScaleIcon,
  SunIcon,
  BatteryIcon,
  PersonStandingIcon,
} from './layout/IdeIcons';

type AssembledRightTab =
  | 'all'
  | 'human'
  | 'expansion'
  | 'accessories'
  | 'weight'
  | 'environment'
  | 'electrical';

interface RightPanelProps {
  isVisible: boolean;
  onToggleVisible: () => void;
}

const DEFAULT_WIDTHS: Record<'internal_boxes' | 'assembled' | 'bars_lineup', number> = {
  internal_boxes: 460,
  assembled: 370,
  bars_lineup: 350,
};

export const RightPanel: React.FC<RightPanelProps> = ({
  isVisible,
  onToggleVisible,
}) => {
  const { viewMode, humanFigureVisible } = useSolar();
  const [widths, setWidths] = useState(DEFAULT_WIDTHS);
  const [assembledTab, setAssembledTab] = useState<AssembledRightTab>('all');

  if (viewMode === 'electrical_planar' || viewMode === 'hydraulic_planar' || viewMode === 'weights') {
    return null;
  }

  const modeKey = viewMode as 'internal_boxes' | 'assembled' | 'bars_lineup';
  const currentWidth = widths[modeKey] ?? 370;
  const setWidth = (w: number) =>
    setWidths((prev) => ({
      ...prev,
      [modeKey]: w,
    }));

  const handleAssembledTabClick = (tab: AssembledRightTab) => {
    if (!isVisible) {
      setAssembledTab(tab);
      onToggleVisible();
    } else if (assembledTab === tab) {
      onToggleVisible();
    } else {
      setAssembledTab(tab);
    }
  };

  const renderPanelTitle = () => {
    if (viewMode === 'internal_boxes') return 'INSPETOR DE CAIXA / MÓDULO';
    if (viewMode === 'bars_lineup') return 'ENGENHARIA & PESO DO RACK';
    if (assembledTab === 'human') return 'BONECO DE REFERÊNCIA (ESCALA)';
    if (assembledTab === 'expansion') return 'EXPANSÃO & INSPEÇÃO';
    if (assembledTab === 'accessories') return 'ACESSÓRIOS & INTERNO';
    if (assembledTab === 'weight') return 'PESO & ALTURA DO RACK';
    if (assembledTab === 'environment') return 'SOL, CLIMA & CÂMERAS';
    if (assembledTab === 'electrical') return 'ENERGIA, BATERIA & MPPT';
    return 'TELEMETRIA, PESO & CLIMA';
  };

  return (
    <div className="ide-sidebar-shell right">
      {/* ── Conteúdo Docked Redimensionável ── */}
      {isVisible && (
        <aside
          className="ide-docked-sidebar right"
          style={{ width: `${currentWidth}px` }}
        >
          <SidebarResizer
            side="right"
            width={currentWidth}
            setWidth={setWidth}
            minWidth={280}
            maxWidth={720}
          />

          <div className="ide-sidebar-header">
            <span className="ide-sidebar-title">{renderPanelTitle()}</span>
          </div>

          <div
            className="ide-sidebar-content right-panel"
            id={viewMode === 'internal_boxes' ? 'right-panel-boxes' : 'right-panel'}
          >
            {viewMode === 'internal_boxes' && <PlannerBoxPropertiesPanel />}

            {viewMode === 'bars_lineup' && (
              <>
                <RightPanelHumanSection />
                <RightPanelWeightSection />
                <RightPanelEnvironmentSection />
              </>
            )}

            {viewMode === 'assembled' && (
              <>
                {/* O Boneco fica em PRIMEIRO LUGAR no topo de Todos, ou na aba dedicada */}
                {(assembledTab === 'all' || assembledTab === 'human') && (
                  <RightPanelHumanSection />
                )}
                {(assembledTab === 'all' || assembledTab === 'expansion') && (
                  <RightPanelExpansionSection />
                )}
                {(assembledTab === 'all' || assembledTab === 'accessories') && (
                  <RightPanelAccessorySection />
                )}
                {(assembledTab === 'all' || assembledTab === 'weight') && (
                  <RightPanelWeightSection />
                )}
                {(assembledTab === 'all' || assembledTab === 'environment') && (
                  <RightPanelEnvironmentSection />
                )}
                {(assembledTab === 'all' || assembledTab === 'electrical') && (
                  <RightPanelElectricalSection />
                )}
              </>
            )}
          </div>
        </aside>
      )}

      {/* ── Barra Vertical de Atividades Direita (48px) estilo FlowML ── */}
      <div className="ide-activity-bar right">
        <button
          type="button"
          onClick={onToggleVisible}
          className={`ide-activity-collapse-btn ${isVisible ? 'open' : ''}`}
          title={isVisible ? 'Recolher Painel Direito' : 'Expandir Painel Direito'}
        >
          {isVisible ? <ChevronsRightIcon size={14} /> : <ChevronsLeftIcon size={14} />}
        </button>

        {viewMode === 'internal_boxes' && (
          <button
            type="button"
            onClick={onToggleVisible}
            className={`ide-activity-btn right ${isVisible ? 'active' : ''}`}
            title="Propriedades da Caixa Selecionada"
          >
            <Box3DIcon />
          </button>
        )}

        {viewMode === 'bars_lineup' && (
          <button
            type="button"
            onClick={onToggleVisible}
            className={`ide-activity-btn right ${isVisible ? 'active' : ''}`}
            title="Peso & Ambiente"
          >
            <ScaleIcon />
          </button>
        )}

        {viewMode === 'assembled' && (
          <>
            {/* 1. TODOS OS PAINÉIS */}
            <button
              type="button"
              onClick={() => handleAssembledTabClick('all')}
              className={`ide-activity-btn right ${isVisible && assembledTab === 'all' ? 'active' : ''}`}
              title="Todos os Painéis"
            >
              <SlidersIcon />
            </button>

            {/* 2. BONECO DE REFERÊNCIA — EM PRIMEIRO LOGO DEPOIS DE TODOS */}
            <button
              type="button"
              onClick={() => handleAssembledTabClick('human')}
              className={`ide-activity-btn right ${isVisible && assembledTab === 'human' ? 'active' : ''}`}
              title="Boneco de Referência (Escala Humana)"
              style={humanFigureVisible ? { color: '#38bdf8' } : {}}
            >
              <PersonStandingIcon size={18} />
            </button>

            {/* 3. DEMAIS ABAS ESPECÍFICAS */}
            <button
              type="button"
              onClick={() => handleAssembledTabClick('expansion')}
              className={`ide-activity-btn right ${isVisible && assembledTab === 'expansion' ? 'active' : ''}`}
              title="Expansão & Verificação Estrutural"
            >
              <CompassIcon />
            </button>
            <button
              type="button"
              onClick={() => handleAssembledTabClick('accessories')}
              className={`ide-activity-btn right ${isVisible && assembledTab === 'accessories' ? 'active' : ''}`}
              title="Acessórios, Tampa do Baú & Caixas"
            >
              <LuggageIcon />
            </button>
            <button
              type="button"
              onClick={() => handleAssembledTabClick('weight')}
              className={`ide-activity-btn right ${isVisible && assembledTab === 'weight' ? 'active' : ''}`}
              title="Peso & Altura no Teto"
            >
              <ScaleIcon />
            </button>
            <button
              type="button"
              onClick={() => handleAssembledTabClick('environment')}
              className={`ide-activity-btn right ${isVisible && assembledTab === 'environment' ? 'active' : ''}`}
              title="Sol, Sombras & Presets de Câmera"
            >
              <SunIcon />
            </button>
            <button
              type="button"
              onClick={() => handleAssembledTabClick('electrical')}
              className={`ide-activity-btn right ${isVisible && assembledTab === 'electrical' ? 'active' : ''}`}
              title="Energia Solar, Bateria & Carregadores"
            >
              <BatteryIcon />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
