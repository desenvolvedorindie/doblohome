import React, { useState, useMemo, useEffect } from 'react';
import { useSolar } from '../../context/SolarContext';
import { dbGet, dbSet } from '../../data/db';
import { CuttingPlanPanel } from './CuttingPlanPanel';
import { WoodPiecesTab } from './WoodPiecesTab';
import { UpholsteryPiecesTab } from './UpholsteryPiecesTab';
import { MetalBarsTab } from './MetalBarsTab';
import { PvcPipesTab } from './PvcPipesTab';
import {
  extractWoodCutGroups,
  extractBarStats,
  groupWoodCutPieces,
  extractUpholsteryStats
} from '../../utils/woodUtils';
import { calculateWeldedJoints } from '../../utils/weldedJointsUtils';
import { extractPvcCutStats } from '../../utils/pvcUtils';

export type CuttingTabId =
  | 'cutting_plan'
  | 'wood_pieces'
  | 'upholstery_pieces'
  | 'metal_bars'
  | 'pvc_pipes';

interface CuttingPlanSidePanelProps {
  docked?: boolean;
  activeTab?: CuttingTabId;
  onTabChange?: (tab: CuttingTabId) => void;
}

export const CuttingPlanSidePanel: React.FC<CuttingPlanSidePanelProps> = ({
  docked = false,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const {
    sceneManager,
    partsFilter,
    setPartsFilter,
    viewMode,
    setViewMode,
    internalBoxes,
    internalGrid,
    structureMaterial,
    steelProfileUnit,
    stackLevels,
    level1,
    level2,
    cargoBox,
    activePanelPreset,
    waterTank,
    setWaterTankEnabled,
    flashToast
  } = useSolar();

  // Abas internas do painel com persistência
  const [internalActiveTab, setActiveTabState] = useState<CuttingTabId>(() => {
    try {
      const v = localStorage.getItem('doblo_cutting_active_tab');
      if (v === 'cutting_plan' || v === 'wood_pieces' || v === 'upholstery_pieces' || v === 'metal_bars' || v === 'pvc_pipes') return v;
    } catch { }
    return 'cutting_plan';
  });

  const activeTab = controlledTab ?? internalActiveTab;

  const setActiveTab = (tab: CuttingTabId) => {
    setActiveTabState(tab);
    onTabChange?.(tab);
    dbSet('doblo_cutting_active_tab', tab);
    try { localStorage.setItem('doblo_cutting_active_tab', tab); } catch { }
  };

  const [pvcBarStandard, setPvcBarStandard] = useState<'6m' | '3m'>('6m');

  // Peça e grupo ativos para sincronização entre lista e canvas 2D
  const [selectedPieceKey, setSelectedPieceKey] = useState<string | null>(null);
  const [activeGroupKey, setActiveGroupKey] = useState<string>('');

  // Modos de visualização do painel: normal (640px), largo (920px), colapsado (botão flutuante)
  const [isWide, setIsWideState] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('doblo_cutting_is_wide');
      if (v !== null) return JSON.parse(v);
    } catch { }
    return false;
  });

  const setIsWide = (valOrFn: boolean | ((prev: boolean) => boolean)) => {
    setIsWideState((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      dbSet('doblo_cutting_is_wide', next);
      try { localStorage.setItem('doblo_cutting_is_wide', JSON.stringify(next)); } catch { }
      return next;
    });
  };

  const [isCollapsed, setIsCollapsedState] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('doblo_cutting_is_collapsed');
      if (v !== null) return JSON.parse(v);
    } catch { }
    return false;
  });

  const setIsCollapsed = (valOrFn: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsedState((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      dbSet('doblo_cutting_is_collapsed', next);
      try { localStorage.setItem('doblo_cutting_is_collapsed', JSON.stringify(next)); } catch { }
      return next;
    });
  };

  const [dockPosition, setDockPositionState] = useState<'left' | 'right'>(() => {
    try {
      const v = localStorage.getItem('doblo_cutting_dock_position');
      if (v === 'left' || v === 'right') return v;
    } catch { }
    return 'right';
  });

  const setDockPosition = (valOrFn: ('left' | 'right') | ((prev: 'left' | 'right') => 'left' | 'right')) => {
    setDockPositionState((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      dbSet('doblo_cutting_dock_position', next);
      try { localStorage.setItem('doblo_cutting_dock_position', next); } catch { }
      return next;
    });
  };

  // Carrega configurações assíncronas do IndexedDB
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const savedWide = await dbGet<boolean>('doblo_cutting_is_wide');
        if (mounted && savedWide !== undefined && savedWide !== null) setIsWideState(savedWide);

        const savedDock = await dbGet<'left' | 'right'>('doblo_cutting_dock_position');
        if (mounted && savedDock && (savedDock === 'left' || savedDock === 'right')) setDockPositionState(savedDock);

        const savedCollapsed = await dbGet<boolean>('doblo_cutting_is_collapsed');
        if (mounted && savedCollapsed !== undefined && savedCollapsed !== null) setIsCollapsedState(savedCollapsed);

        const savedTab = await dbGet<'cutting_plan' | 'wood_pieces' | 'upholstery_pieces' | 'metal_bars' | 'pvc_pipes'>('doblo_cutting_active_tab');
        if (mounted && savedTab && ['cutting_plan', 'wood_pieces', 'upholstery_pieces', 'metal_bars', 'pvc_pipes'].includes(savedTab)) {
          setActiveTabState(savedTab);
        }
      } catch { }
    })();
    return () => { mounted = false; };
  }, []);

  // Extração de estatísticas de marcenaria (Madeira/MDF/Compensado) e estofaria
  const woodStats = useMemo(() => {
    return extractWoodCutGroups(sceneManager);
  }, [sceneManager, internalBoxes, internalGrid]);

  const woodCategories = useMemo(() => {
    return groupWoodCutPieces(woodStats.cutGroups);
  }, [woodStats.cutGroups]);

  // Estatísticas e categorias filtradas exclusivamente para Marcenaria (Madeira/Compensado)
  const woodOnlyStats = useMemo(() => {
    const cutGroups = woodStats.cutGroups.filter((g) => !g.isUpholstery);
    const totalPieces = cutGroups.reduce((acc, g) => acc + g.qty, 0);
    const totalAreaM2 = cutGroups.reduce((acc, g) => acc + g.totalAreaM2, 0);
    const standardSheets = Math.max(cutGroups.length > 0 ? 1 : 0, Math.ceil((totalAreaM2 * 1.10) / 2.977));
    return { totalPieces, totalAreaM2, standardSheets, cutGroups };
  }, [woodStats]);

  const woodOnlyCategories = useMemo(() => {
    return woodCategories.filter((c) => !c.pieces.some((p) => p.isUpholstery) && !c.woodMaterial.includes('Espuma'));
  }, [woodCategories]);

  // Estatísticas e categorias filtradas para Estofaria / Espuma D33 (Colchão)
  const upholsteryStats = useMemo(() => {
    return extractUpholsteryStats(woodStats.cutGroups);
  }, [woodStats.cutGroups]);

  const upholsteryCategories = useMemo(() => {
    return woodCategories.filter((c) => c.pieces.some((p) => p.isUpholstery) || c.woodMaterial.includes('Espuma'));
  }, [woodCategories]);

  // Extração de estatísticas metalúrgicas (Perfis de Alumínio / Metalon)
  const barStats = useMemo(() => {
    return extractBarStats(sceneManager);
  }, [sceneManager, structureMaterial, steelProfileUnit, stackLevels, level1, level2, cargoBox, activePanelPreset]);

  // Relatório de Juntas e Soldagem das Quinas (Nós Estruturais)
  const weldedJointsReport = useMemo(() => {
    return calculateWeldedJoints(sceneManager);
  }, [sceneManager, structureMaterial, steelProfileUnit, stackLevels, level1, level2, cargoBox, activePanelPreset]);

  // Extração de estatísticas hidráulicas dos tubos e conexões PVC da caixa d'água em U
  const pvcStats = useMemo(() => {
    return extractPvcCutStats(waterTank);
  }, [waterTank.enabled, waterTank.lengthMm, waterTank.diameterMm, waterTank.connectionPosition]);

  const totalAllPieces = woodStats.totalPieces + barStats.totalPieces + (waterTank.enabled ? pvcStats.totalPieces : 0);

  // Efeito para ajustar o filtro no SceneManager quando o usuário alterna entre as abas do painel
  useEffect(() => {
    if (!sceneManager) return;
    if (activeTab === 'wood_pieces') {
      if (partsFilter !== 'wood') setPartsFilter('wood');
    } else if (activeTab === 'upholstery_pieces') {
      if (partsFilter !== 'upholstery') setPartsFilter('upholstery');
    } else if (activeTab === 'metal_bars') {
      if (partsFilter !== 'metal') setPartsFilter('metal');
    } else if (activeTab === 'pvc_pipes') {
      if (partsFilter !== 'pvc') setPartsFilter('pvc');
    } else if (activeTab === 'cutting_plan') {
      const isFoam = activeGroupKey.includes('Espuma') || (woodStats.cutGroups.find((g) => g.key === activeGroupKey)?.isUpholstery ?? false);
      const targetFilter = isFoam ? 'upholstery' : 'wood';
      if (partsFilter !== targetFilter) setPartsFilter(targetFilter);
    }
  }, [activeTab, activeGroupKey]);

  // Botão flutuante minimalista quando colapsado (somente modo não-docked)
  if (!docked && isCollapsed) {
    const isDockLeft = dockPosition === 'left';
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        style={{
          position: 'fixed',
          top: '72px',
          left: isDockLeft ? '16px' : undefined,
          right: !isDockLeft ? '16px' : undefined,
          zIndex: 998,
          background: 'linear-gradient(135deg, #0284c7, #0369a1)',
          color: '#ffffff',
          border: '1px solid rgba(56, 189, 248, 0.5)',
          borderRadius: '30px',
          padding: '10px 16px',
          fontSize: '12px',
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)'
        }}
        title="Expandir Painel Lateral de Corte e Otimização"
      >
        <span>📐</span>
        <span>Plano de Corte ({totalAllPieces} peças)</span>
        <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.2)', padding: '2px 6px', borderRadius: '10px' }}>
          {woodStats.standardSheets} chapas
        </span>
      </button>
    );
  }

  const isDockLeft = dockPosition === 'left';
  const panelWidth = isWide ? '920px' : '640px';

  return (
    <aside
      className="cutting-side-panel"
      style={
        docked
          ? {
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: '10px 12px',
              gap: '10px',
              background: 'transparent',
            }
          : {
              position: 'fixed',
              top: '64px',
              bottom: '16px',
              left: isDockLeft ? '16px' : undefined,
              right: !isDockLeft ? '16px' : undefined,
              width: panelWidth,
              maxWidth: 'calc(100vw - 32px)',
              zIndex: 995,
              background: 'rgba(10, 15, 26, 0.96)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '12px',
              boxShadow: isDockLeft ? '12px 0 32px rgba(0, 0, 0, 0.6)' : '-12px 0 32px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'width 0.22s ease-in-out',
              padding: '12px',
              gap: '10px',
            }
      }
    >
      {/* ─── 1. CABEÇALHO DO PAINEL LATERAL ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          paddingBottom: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>
            {activeTab === 'upholstery_pieces'
              ? '🛏️'
              : activeTab === 'wood_pieces'
                ? '🪵'
                : activeTab === 'metal_bars'
                  ? '🔩'
                  : activeTab === 'pvc_pipes'
                    ? '💧'
                    : '📐'}
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              {activeTab === 'upholstery_pieces'
                ? 'Plano de Corte & Estofaria (Espuma D33)'
                : activeTab === 'wood_pieces'
                  ? 'Lista de Peças de Madeira & Marcenaria'
                  : activeTab === 'metal_bars'
                    ? 'Lista de Corte & Perfis Estruturais (Metalon)'
                    : activeTab === 'pvc_pipes'
                      ? "Lista de Corte & Tubulação PVC (Caixa d'Água)"
                      : 'Plano de Corte & Otimização 2D'}
            </h3>
            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
              {activeTab === 'upholstery_pieces'
                ? 'Bloco de Espuma D33 • Faca de Estofador • Cama Campervan'
                : activeTab === 'wood_pieces'
                  ? 'Compensado Naval • MDF Branco Ultra • Madeira Nobre Maciça'
                  : activeTab === 'metal_bars'
                    ? 'Perfis Metálicos Tubulares • Alumínio & Aço Carbono'
                    : activeTab === 'pvc_pipes'
                      ? 'Tubos Soldáveis PVC U • Joelhos 90° • Joelhos & Tampões'
                      : 'Guillotine 2D • CorteCloud • Alumínio/Metalon • Canos PVC U'}
            </span>
          </div>
        </div>

        {/* Botões de Ação do Painel (PDF, Dock, Largura, Colapsar) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <a
            href="/plano_de_corte_doblo_solar.pdf"
            download="plano_de_corte_doblo_solar.pdf"
            className="btn-compact"
            title="Baixar Plano de Corte Completo em PDF (13 Páginas c/ Desenho dos Cortes, Espuma, Metalon e PVC)"
            style={{
              fontSize: '11px',
              padding: '4px 8px',
              textDecoration: 'none',
              background: 'rgba(245, 158, 11, 0.22)',
              border: '1px solid #f59e0b',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontWeight: 700
            }}
          >
            <span>📄 PDF</span>
          </a>

          {!docked && (
            <>
              <button
                className="btn-compact"
                onClick={() => setDockPosition((prev) => (prev === 'left' ? 'right' : 'left'))}
                style={{ fontSize: '11px', padding: '4px 8px' }}
                title={isDockLeft ? 'Mover painel para a Direita' : 'Mover painel para a Esquerda'}
              >
                {isDockLeft ? '➡️ Dock Dir.' : '⬅️ Dock Esq.'}
              </button>

              <button
                className="btn-compact"
                onClick={() => setIsWide((prev) => !prev)}
                style={{ fontSize: '11px', padding: '4px 8px' }}
                title={isWide ? 'Modo Normal (640px)' : 'Modo Expandido Panorâmico (920px)'}
              >
                {isWide ? '🗗 640px' : '🗖 920px'}
              </button>

              <button
                className="btn-compact"
                onClick={() => setIsCollapsed(true)}
                style={{ fontSize: '12px', padding: '4px 8px', color: '#f87171' }}
                title="Minimizar painel lateral"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── 2. ABAS PRINCIPAIS ─── */}
      <div style={{ display: 'flex', gap: '5px', background: 'rgba(15, 23, 42, 0.7)', padding: '4px', borderRadius: '8px', flexWrap: 'wrap' }}>
        <button
          className={`btn-compact ${activeTab === 'cutting_plan' ? 'active primary' : ''}`}
          onClick={() => setActiveTab('cutting_plan')}
          style={{ flex: '1 1 80px', fontSize: '10.5px', padding: '6px 4px', fontWeight: 700 }}
        >
          🧩 Otimizador 2D
        </button>

        <button
          className={`btn-compact ${activeTab === 'wood_pieces' ? 'active primary' : ''}`}
          onClick={() => setActiveTab('wood_pieces')}
          style={{ flex: '1 1 80px', fontSize: '10.5px', padding: '6px 4px', fontWeight: 700 }}
        >
          🪵 Madeira ({woodOnlyStats.totalPieces})
        </button>

        <button
          className={`btn-compact ${activeTab === 'upholstery_pieces' ? 'active primary' : ''}`}
          onClick={() => setActiveTab('upholstery_pieces')}
          style={{ flex: '1 1 80px', fontSize: '10.5px', padding: '6px 4px', fontWeight: 700 }}
        >
          🛏️ Colchão ({upholsteryStats.totalPieces})
        </button>

        <button
          className={`btn-compact ${activeTab === 'metal_bars' ? 'active primary' : ''}`}
          onClick={() => setActiveTab('metal_bars')}
          style={{ flex: '1 1 80px', fontSize: '10.5px', padding: '6px 4px', fontWeight: 700 }}
        >
          🔩 Metalon ({barStats.totalPieces})
        </button>

        <button
          className={`btn-compact ${activeTab === 'pvc_pipes' ? 'active primary' : ''}`}
          onClick={() => setActiveTab('pvc_pipes')}
          style={{
            flex: '1 1 80px',
            fontSize: '10.5px',
            padding: '6px 4px',
            fontWeight: 700,
            opacity: waterTank.enabled ? 1 : 0.65
          }}
          title="Lista de corte dos tubos PVC e conexões hidráulicas da caixa d'água em U"
        >
          💧 Canos PVC {waterTank.enabled ? `(${pvcStats.totalPieces})` : '(Off)'}
        </button>
      </div>

      {/* ─── 3. BARRA DE MODO 3D E BANCADA NO SOLO ─── */}
      {viewMode !== 'bars_lineup' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(30, 41, 59, 0.5)',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            border: '1px solid rgba(148, 163, 184, 0.15)'
          }}
        >
          <span style={{ color: '#cbd5e1' }}>
            🛠️ Deseja inspecionar as peças lado a lado na bancada 3D no solo?
          </span>
          <button
            className="btn-compact primary"
            onClick={() => {
              if (activeTab === 'upholstery_pieces') setPartsFilter('upholstery');
              else if (activeTab === 'wood_pieces') setPartsFilter('wood');
              else if (activeTab === 'metal_bars') setPartsFilter('metal');
              else if (activeTab === 'pvc_pipes') setPartsFilter('pvc');
              else {
                const isFoam = activeGroupKey.includes('Espuma') || (woodStats.cutGroups.find((g) => g.key === activeGroupKey)?.isUpholstery ?? false);
                setPartsFilter(isFoam ? 'upholstery' : 'wood');
              }
              setViewMode('bars_lineup');
            }}
            style={{ fontSize: '10.5px', padding: '4px 10px', fontWeight: 700 }}
          >
            📏 Ver Bancada 3D
          </button>
        </div>
      )}

      {/* ─── 4. CONTEÚDO PRINCIPAL ─── */}
      {activeTab === 'cutting_plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <CuttingPlanPanel
            woodCutGroups={woodStats.cutGroups}
            selectedPieceKey={selectedPieceKey}
            onSelectPiece={setSelectedPieceKey}
            activeGroupKey={activeGroupKey}
            onSelectGroupKey={setActiveGroupKey}
          />
        </div>
      )}

      {activeTab === 'wood_pieces' && (
        <WoodPiecesTab
          woodStats={woodOnlyStats}
          woodCategories={woodOnlyCategories}
          selectedPieceKey={selectedPieceKey}
          setSelectedPieceKey={setSelectedPieceKey}
          setActiveGroupKey={setActiveGroupKey}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'upholstery_pieces' && (
        <UpholsteryPiecesTab
          upholsteryStats={upholsteryStats}
          upholsteryCategories={upholsteryCategories}
          selectedPieceKey={selectedPieceKey}
          setSelectedPieceKey={setSelectedPieceKey}
          setActiveGroupKey={setActiveGroupKey}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'metal_bars' && (
        <MetalBarsTab
          barStats={barStats}
          weldedJointsReport={weldedJointsReport}
        />
      )}

      {activeTab === 'pvc_pipes' && (
        <PvcPipesTab
          waterTankEnabled={waterTank.enabled}
          setWaterTankEnabled={setWaterTankEnabled}
          pvcStats={pvcStats}
          pvcBarStandard={pvcBarStandard}
          setPvcBarStandard={setPvcBarStandard}
          flashToast={flashToast}
          setPartsFilter={setPartsFilter}
          setViewMode={setViewMode}
        />
      )}
    </aside>
  );
};
