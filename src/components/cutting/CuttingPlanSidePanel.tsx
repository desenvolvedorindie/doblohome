import React, { useState, useMemo, useEffect } from 'react';
import { useSolar } from '../../context/SolarContext';
import { dbGet, dbSet } from '../../data/db';
import { CuttingPlanPanel } from './CuttingPlanPanel';
import {
  extractWoodCutGroups,
  extractBarStats,
  groupWoodCutPieces,
  WoodCutGroup,
  BarCutGroup,
  ProfileSummary
} from '../../utils/woodUtils';
import { calculateWeldedJoints } from '../../utils/weldedJointsUtils';
import {
  extractPvcCutStats,
  PvcCuttingPlanResult,
  PvcBarPlan
} from '../../utils/pvcUtils';

export const CuttingPlanSidePanel: React.FC = () => {
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
  const [activeTab, setActiveTabState] = useState<'cutting_plan' | 'wood_pieces' | 'metal_bars' | 'pvc_pipes'>(() => {
    try {
      const v = localStorage.getItem('doblo_cutting_active_tab');
      if (v === 'cutting_plan' || v === 'wood_pieces' || v === 'metal_bars' || v === 'pvc_pipes') return v;
    } catch {}
    return 'cutting_plan';
  });

  const setActiveTab = (tab: 'cutting_plan' | 'wood_pieces' | 'metal_bars' | 'pvc_pipes') => {
    setActiveTabState(tab);
    dbSet('doblo_cutting_active_tab', tab);
    try { localStorage.setItem('doblo_cutting_active_tab', tab); } catch {}
  };

  const [pvcBarStandard, setPvcBarStandard] = useState<'6m' | '3m'>('6m');

  // Peça e grupo ativos para sincronização entre lista e canvas 2D
  const [selectedPieceKey, setSelectedPieceKey] = useState<string | null>(null);
  const [activeGroupKey, setActiveGroupKey] = useState<string>('');

  // Modos de visualização do painel com persistência: normal (640px), largo (920px), colapsado (botão flutuante)
  const [isWide, setIsWideState] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('doblo_cutting_is_wide');
      if (v !== null) return JSON.parse(v);
    } catch {}
    return false;
  });

  const setIsWide = (valOrFn: boolean | ((prev: boolean) => boolean)) => {
    setIsWideState((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      dbSet('doblo_cutting_is_wide', next);
      try { localStorage.setItem('doblo_cutting_is_wide', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const [isCollapsed, setIsCollapsedState] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('doblo_cutting_is_collapsed');
      if (v !== null) return JSON.parse(v);
    } catch {}
    return false;
  });

  const setIsCollapsed = (valOrFn: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsedState((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      dbSet('doblo_cutting_is_collapsed', next);
      try { localStorage.setItem('doblo_cutting_is_collapsed', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const [dockPosition, setDockPositionState] = useState<'left' | 'right'>(() => {
    try {
      const v = localStorage.getItem('doblo_cutting_dock_position');
      if (v === 'left' || v === 'right') return v;
    } catch {}
    return 'left';
  });

  const setDockPosition = (valOrFn: ('left' | 'right') | ((prev: 'left' | 'right') => 'left' | 'right')) => {
    setDockPositionState((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      dbSet('doblo_cutting_dock_position', next);
      try { localStorage.setItem('doblo_cutting_dock_position', next); } catch {}
      return next;
    });
  };

  // Restaura configurações persistidas do IndexedDB na montagem
  useEffect(() => {
    (async () => {
      try {
        const savedWide = await dbGet<boolean>('doblo_cutting_is_wide');
        if (savedWide !== null && savedWide !== undefined) setIsWideState(savedWide);

        const savedDock = await dbGet<'left' | 'right'>('doblo_cutting_dock_position');
        if (savedDock === 'left' || savedDock === 'right') setDockPositionState(savedDock);

        const savedCollapsed = await dbGet<boolean>('doblo_cutting_is_collapsed');
        if (savedCollapsed !== null && savedCollapsed !== undefined) setIsCollapsedState(savedCollapsed);

        const savedTab = await dbGet<'cutting_plan' | 'wood_pieces' | 'metal_bars' | 'pvc_pipes'>('doblo_cutting_active_tab');
        if (savedTab) setActiveTabState(savedTab);
      } catch (err) {
        console.warn('Erro ao restaurar configurações do painel de cortes:', err);
      }
    })();
  }, []);

  // Extração de estatísticas e cortes de madeira (compensado naval, MDF, etc.)
  const woodStats = useMemo(() => {
    return extractWoodCutGroups(sceneManager);
  }, [sceneManager, internalBoxes, internalGrid]);

  const woodCategories = useMemo(() => {
    return groupWoodCutPieces(woodStats.cutGroups);
  }, [woodStats]);

  // Extração de barras metálicas estruturais (perfis T-Slot / Metalon)
  const barStats = useMemo(() => {
    return extractBarStats(sceneManager);
  }, [sceneManager, structureMaterial, steelProfileUnit, stackLevels, level1, level2, cargoBox, activePanelPreset]);

  // Relatório de juntas soldadas e métrica das quinas
  const weldedJointsReport = useMemo(() => {
    return calculateWeldedJoints(sceneManager);
  }, [sceneManager, barStats]);

  // Extração das peças e plano de corte dos tubos de PVC (Caixa d'Água em U)
  const pvcStats = useMemo(() => {
    return extractPvcCutStats(waterTank);
  }, [waterTank]);

  const totalAllPieces = woodStats.totalPieces + barStats.totalPieces + (waterTank.enabled ? pvcStats.totalPieces : 0);

  // Sincroniza a aba de conteúdo quando o filtro de bancada 3D for alterado
  React.useEffect(() => {
    if (partsFilter === 'metal') {
      setActiveTab('metal_bars');
    } else if (partsFilter === 'pvc') {
      setActiveTab('pvc_pipes');
    } else if (partsFilter === 'wood') {
      if (activeTab !== 'wood_pieces' && activeTab !== 'cutting_plan') {
        setActiveTab('cutting_plan');
      }
    }
  }, [partsFilter]);

  // Se o painel estiver colapsado, mostra apenas botão flutuante discreto
  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="glass-panel"
        style={{
          position: 'fixed',
          top: '84px',
          [dockPosition]: '20px',
          zIndex: 35,
          padding: '10px 18px',
          borderRadius: '999px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(245, 158, 11, 0.6)',
          color: '#fbbf24',
          fontWeight: 800,
          fontSize: '12px',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease'
        }}
        title="Abrir Painel de Plano de Corte 2D"
      >
        <span style={{ fontSize: '15px' }}>📐</span>
        <span>Abrir Plano de Corte</span>
        <span
          style={{
            fontSize: '10px',
            background: 'rgba(245, 158, 11, 0.2)',
            padding: '2px 6px',
            borderRadius: '10px',
            border: '1px solid rgba(245, 158, 11, 0.4)'
          }}
        >
          {totalAllPieces} peças
        </span>
      </button>
    );
  }

  const panelWidth = isWide ? '920px' : '640px';

  return (
    <aside
      className="glass-panel"
      style={{
        position: 'fixed',
        top: '78px',
        [dockPosition]: '18px',
        bottom: '18px',
        width: panelWidth,
        maxWidth: 'calc(100vw - 36px)',
        zIndex: 32,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '14px',
        borderRadius: '12px',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        background: 'rgba(11, 17, 32, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 24px rgba(245, 158, 11, 0.15)',
        transition: 'width 0.25s ease'
      }}
    >
      {/* ─── 1. CABEÇALHO DO PAINEL ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '10px',
          borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '22px' }}>📐</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.5px' }}>
              3. PEÇAS & PLANO DE CORTE
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
              Nesting CNC Estilo Corte Cloud • {woodStats.totalPieces} Peças • ~{woodStats.standardSheets} Chapas
            </div>
          </div>
        </div>

        {/* Controles de Janela / Alternância */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {/* Botão de alternar largura (640px / 920px) */}
          <button
            className="btn-compact"
            onClick={() => setIsWide(!isWide)}
            title={isWide ? 'Visualização normal (640px)' : 'Visualização expandida ampla (920px)'}
            style={{ fontSize: '10px', padding: '4px 8px', fontWeight: 700 }}
          >
            {isWide ? '↔️ 640px' : '↔️ 920px'}
          </button>

          {/* Botão de alternar lado de ancoragem (Esquerda / Direita) */}
          <button
            className="btn-compact"
            onClick={() => setDockPosition(dockPosition === 'left' ? 'right' : 'left')}
            title={dockPosition === 'left' ? 'Mover painel para a Direita' : 'Mover painel para a Esquerda'}
            style={{ fontSize: '10px', padding: '4px 8px', fontWeight: 700 }}
          >
            {dockPosition === 'left' ? '◨ Direita' : '◧ Esquerda'}
          </button>

          {/* Botão Minimizar */}
          <button
            className="btn-compact"
            onClick={() => setIsCollapsed(true)}
            title="Minimizar painel para botão flutuante"
            style={{ fontSize: '10px', padding: '4px 8px', fontWeight: 800 }}
          >
            _
          </button>
        </div>
      </div>

      {/* ─── 2. FILTRO DA BANCADA 3D NO SOLO ─── */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          padding: '8px 10px',
          borderRadius: '8px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8' }}>
            BANCADA 3D NO SOLO:
          </span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            {sceneManager?.barsLineupGroup?.userData?.totalBars ?? totalAllPieces} peças organizadas
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
          <button
            className={`btn-compact ${partsFilter === 'all' ? 'active' : ''}`}
            onClick={() => setPartsFilter('all')}
            style={{
              fontSize: '9.5px',
              padding: '5px 3px',
              fontWeight: 800,
              background: partsFilter === 'all' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.35))' : undefined,
              borderColor: partsFilter === 'all' ? '#10b981' : undefined
            }}
          >
            📦 Todas ({totalAllPieces})
          </button>
          <button
            className={`btn-compact ${partsFilter === 'wood' ? 'active' : ''}`}
            onClick={() => {
              setPartsFilter('wood');
              if (activeTab !== 'wood_pieces' && activeTab !== 'cutting_plan') {
                setActiveTab('cutting_plan');
              }
            }}
            style={{
              fontSize: '9.5px',
              padding: '5px 3px',
              fontWeight: 800,
              background: partsFilter === 'wood' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))' : undefined,
              borderColor: partsFilter === 'wood' ? '#f59e0b' : undefined,
              color: partsFilter === 'wood' ? '#f59e0b' : undefined
            }}
          >
            🪵 Madeira ({woodStats.totalPieces})
          </button>
          <button
            className={`btn-compact ${partsFilter === 'metal' ? 'active' : ''}`}
            onClick={() => {
              setPartsFilter('metal');
              setActiveTab('metal_bars');
            }}
            style={{
              fontSize: '9.5px',
              padding: '5px 3px',
              fontWeight: 800,
              background: partsFilter === 'metal' ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(37, 99, 235, 0.35))' : undefined,
              borderColor: partsFilter === 'metal' ? '#38bdf8' : undefined,
              color: partsFilter === 'metal' ? '#38bdf8' : undefined
            }}
          >
            🔩 Ferragens ({barStats.totalPieces})
          </button>
          <button
            className={`btn-compact ${partsFilter === 'pvc' ? 'active' : ''}`}
            onClick={() => {
              setPartsFilter('pvc');
              setActiveTab('pvc_pipes');
            }}
            style={{
              fontSize: '9.5px',
              padding: '5px 3px',
              fontWeight: 800,
              background: partsFilter === 'pvc' ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.25), rgba(2, 132, 199, 0.35))' : undefined,
              borderColor: partsFilter === 'pvc' ? '#0ea5e9' : undefined,
              color: partsFilter === 'pvc' ? '#38bdf8' : undefined
            }}
          >
            💧 Canos PVC ({waterTank.enabled ? pvcStats.totalPieces : 0})
          </button>
        </div>
      </div>

      {/* ─── 3. SELETOR DE ABAS DO PAINEL ─── */}
      {/* O menu de 4 abas só é exibido quando 'Todas' estiver selecionado no filtro da bancada 3D */}
      {partsFilter === 'all' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr 0.9fr 1.1fr', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('cutting_plan')}
            style={{
              padding: '7px 4px',
              fontSize: '10px',
              fontWeight: 800,
              borderRadius: '6px',
              border: activeTab === 'cutting_plan' ? '1px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.2)',
              background: activeTab === 'cutting_plan' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))' : 'rgba(15, 23, 42, 0.6)',
              color: activeTab === 'cutting_plan' ? '#fbbf24' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ⚡ Plano 2D
          </button>
          <button
            onClick={() => setActiveTab('wood_pieces')}
            style={{
              padding: '7px 4px',
              fontSize: '10px',
              fontWeight: 800,
              borderRadius: '6px',
              border: activeTab === 'wood_pieces' ? '1px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.2)',
              background: activeTab === 'wood_pieces' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))' : 'rgba(15, 23, 42, 0.6)',
              color: activeTab === 'wood_pieces' ? '#fbbf24' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🪵 Chapas ({woodStats.totalPieces})
          </button>
          <button
            onClick={() => setActiveTab('metal_bars')}
            style={{
              padding: '7px 4px',
              fontSize: '10px',
              fontWeight: 800,
              borderRadius: '6px',
              border: activeTab === 'metal_bars' ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)',
              background: activeTab === 'metal_bars' ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(37, 99, 235, 0.35))' : 'rgba(15, 23, 42, 0.6)',
              color: activeTab === 'metal_bars' ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🔩 Perfis ({barStats.totalPieces})
          </button>
          <button
            onClick={() => setActiveTab('pvc_pipes')}
            style={{
              padding: '7px 4px',
              fontSize: '10px',
              fontWeight: 800,
              borderRadius: '6px',
              border: activeTab === 'pvc_pipes' ? '1px solid #0ea5e9' : '1px solid rgba(148, 163, 184, 0.2)',
              background: activeTab === 'pvc_pipes' ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.25), rgba(2, 132, 199, 0.35))' : 'rgba(15, 23, 42, 0.6)',
              color: activeTab === 'pvc_pipes' ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            💧 Canos PVC ({waterTank.enabled ? pvcStats.totalPieces : 0})
          </button>
        </div>
      )}

      {/* Se o filtro for 'wood' (Madeira), exibe o alternador específico entre Plano 2D Nesting e Lista de Chapas */}
      {partsFilter === 'wood' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('cutting_plan')}
            style={{
              padding: '6px 8px',
              fontSize: '10.5px',
              fontWeight: 800,
              borderRadius: '6px',
              border: activeTab === 'cutting_plan' ? '1px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.2)',
              background: activeTab === 'cutting_plan' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))' : 'rgba(15, 23, 42, 0.6)',
              color: activeTab === 'cutting_plan' ? '#fbbf24' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ⚡ Plano 2D Nesting CNC
          </button>
          <button
            onClick={() => setActiveTab('wood_pieces')}
            style={{
              padding: '6px 8px',
              fontSize: '10.5px',
              fontWeight: 800,
              borderRadius: '6px',
              border: activeTab === 'wood_pieces' ? '1px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.2)',
              background: activeTab === 'wood_pieces' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))' : 'rgba(15, 23, 42, 0.6)',
              color: activeTab === 'wood_pieces' ? '#fbbf24' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🪵 Lista de Chapas ({woodStats.totalPieces})
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div
            style={{
              padding: '8px 10px',
              background: 'rgba(245, 158, 11, 0.12)',
              borderRadius: '6px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '11px',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>🪵 Total: {woodStats.totalPieces} peças de marcenaria ({woodStats.totalAreaM2.toFixed(2)} m²)</span>
            <span style={{ fontSize: '10px', color: '#cbd5e1' }}>~{woodStats.standardSheets} chapas padrão 2.44×1.22m</span>
          </div>

          {woodCategories.map((cat) => (
            <div
              key={cat.key}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div>
                  <strong style={{ fontSize: '12px', color: '#38bdf8' }}>
                    {cat.woodMaterial} {cat.thicknessMm}mm
                  </strong>
                  <span style={{ fontSize: '10.5px', color: '#94a3b8', marginLeft: '6px' }}>
                    ({cat.totalPieces} {cat.totalPieces === 1 ? 'peça' : 'peças'} • {cat.totalAreaM2.toFixed(2)} m²)
                  </span>
                </div>
                <button
                  className="btn-compact primary"
                  onClick={() => {
                    setActiveGroupKey(cat.key);
                    setActiveTab('cutting_plan');
                  }}
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                >
                  📐 Ver no Plano de Corte
                </button>
              </div>

              {/* Tabela de Peças */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '4px 6px' }}>Peça</th>
                      <th style={{ padding: '4px 6px' }}>Medidas (mm)</th>
                      <th style={{ padding: '4px 6px' }}>Qtd</th>
                      <th style={{ padding: '4px 6px' }}>Módulo</th>
                      <th style={{ padding: '4px 6px', textAlign: 'center' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.pieces.map((p) => {
                      const isSelected = selectedPieceKey === p.key;
                      return (
                        <tr
                          key={p.key}
                          style={{
                            borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
                            background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '4px 6px', fontWeight: 600, color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                            {p.label}
                            {p.isPerforated && (
                              <span style={{ fontSize: '9px', color: '#34d399', marginLeft: '4px' }}>
                                🕳️ Furos CNC
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '4px 6px', fontFamily: 'var(--font-mono)' }}>
                            {p.lengthMm} × {p.widthMm} × {p.thicknessMm}
                          </td>
                          <td style={{ padding: '4px 6px', fontWeight: 700, color: '#f59e0b' }}>
                            {p.qty}
                          </td>
                          <td style={{ padding: '4px 6px', color: '#cbd5e1' }}>
                            {p.moduleName || '-'}
                          </td>
                          <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                            <button
                              className="btn-compact"
                              onClick={() => {
                                setSelectedPieceKey(p.key);
                                setActiveGroupKey(cat.key);
                                setActiveTab('cutting_plan');
                              }}
                              style={{ fontSize: '9.5px', padding: '2px 6px' }}
                              title="Destacar no plano de corte 2D"
                            >
                              🔍 Ver
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'metal_bars' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div
            style={{
              padding: '8px 10px',
              background: 'rgba(56, 189, 248, 0.12)',
              borderRadius: '6px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontSize: '11px',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>🔩 Total: {barStats.totalPieces} peças metálicas ({barStats.totalMeters.toFixed(1)} m lineares)</span>
            <span style={{ fontSize: '10px', color: '#cbd5e1' }}>~{barStats.totalBars6m} barras de 6 metros (+5% refilo)</span>
          </div>

          {/* Card da Métrica das Quinas (Precificação por Junta/Nó) */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '15px' }}>📐</span>
                <strong style={{ fontSize: '11px', color: '#38bdf8' }}>
                  Métrica das "Quinas" (Juntas e Nós Estruturais)
                </strong>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {weldedJointsReport.totalJoints} Quinas Totais
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '10px', color: '#cbd5e1', lineHeight: 1.45, background: 'rgba(15, 23, 42, 0.5)', padding: '6px 8px', borderRadius: '5px', borderLeft: '2px solid #38bdf8' }}>
              Cada "quina" (encontro de tubos) exige ciclo completo: <strong>corte em esquadria (45º/boca de lobo)</strong>, <strong>esquadro magnético</strong>, <strong>ponteamento 4 faces</strong>, <strong>solda definitiva</strong> e <strong>lixamento com disco flap</strong>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '4px' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '4px 6px', borderRadius: '4px', fontSize: '9.5px' }}>
                <span style={{ color: '#94a3b8' }}>Quinas 45°:</span> <strong style={{ color: '#38bdf8' }}>{weldedJointsReport.miterCorners45}</strong>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '4px 6px', borderRadius: '4px', fontSize: '9.5px' }}>
                <span style={{ color: '#94a3b8' }}>Juntas em T:</span> <strong style={{ color: '#38bdf8' }}>{weldedJointsReport.teeJoints}</strong>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '4px 6px', borderRadius: '4px', fontSize: '9.5px' }}>
                <span style={{ color: '#94a3b8' }}>Sapatas/Torres:</span> <strong style={{ color: '#38bdf8' }}>{weldedJointsReport.mountBracketsJoints}</strong>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '4px 6px', borderRadius: '4px', fontSize: '9.5px' }}>
                <span style={{ color: '#94a3b8' }}>Consumíveis:</span> <strong style={{ color: '#f59e0b' }}>~{weldedJointsReport.consumables.cuttingDiscs4Half} cortes / ~{weldedJointsReport.consumables.flapDiscsGrinding + weldedJointsReport.consumables.flapDiscsFinishing} flaps</strong>
              </div>
            </div>
          </div>

          {/* Resumo por Tipo de Perfil Agrupado por Espessura */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '11.5px', color: '#f8fafc' }}>Resumo de Barras Comerciais de 6m (por Espessura):</strong>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Total: {barStats.totalBars6m} barras de 6m</span>
            </div>

            {barStats.thicknessGroups.map((grp) => (
              <div
                key={grp.groupTitle}
                style={{
                  background: 'rgba(30, 41, 59, 0.45)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <strong style={{ fontSize: '10.5px', color: '#38bdf8' }}>{grp.groupTitle}</strong>
                  <span style={{ fontSize: '10px', color: '#4ade80', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    Subtotal: {grp.totalBars6m} barra{grp.totalBars6m > 1 ? 's' : ''} 6m ({grp.totalMeters.toFixed(1)} m)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '6px' }}>
                  {grp.profiles.map((prof, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '5px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.15)'
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#f8fafc' }}>{prof.profileSpec}</div>
                      <div style={{ fontSize: '9.5px', color: '#cbd5e1' }}>
                        {prof.pieces} cortes • {prof.totalMeters.toFixed(2)} m
                      </div>
                      <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#4ade80', marginTop: '2px' }}>
                        📦 {prof.bars6m} barra{prof.bars6m > 1 ? 's' : ''} de 6m
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tabela de Cortes de Perfis Agrupada por Espessura */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '8px',
              padding: '10px'
            }}
          >
            <strong style={{ fontSize: '11.5px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Lista de Cortes Estruturais por Espessura ({barStats.totalPieces} peças):
            </strong>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                <thead>
                  <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '4px 6px' }}>Descrição</th>
                    <th style={{ padding: '4px 6px' }}>Perfil</th>
                    <th style={{ padding: '4px 6px' }}>Comprimento</th>
                    <th style={{ padding: '4px 6px' }}>Qtd</th>
                    <th style={{ padding: '4px 6px' }}>Metros</th>
                  </tr>
                </thead>
                <tbody>
                  {barStats.cutThicknessGroups.map((section) => (
                    <React.Fragment key={section.groupTitle}>
                      <tr style={{ background: 'rgba(30, 41, 59, 0.90)', borderTop: '1px solid rgba(56, 189, 248, 0.3)' }}>
                        <td colSpan={5} style={{ padding: '4px 6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong style={{ color: '#38bdf8', fontSize: '10px' }}>{section.groupTitle}</strong>
                            <span style={{ fontSize: '9.5px', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                              {section.totalPieces} peças · {section.totalMeters.toFixed(2)} m
                            </span>
                          </div>
                        </td>
                      </tr>
                      {section.items.map((b) => (
                        <tr key={b.key} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                          <td style={{ padding: '4px 6px', fontWeight: 600, color: '#f8fafc' }}>{b.label}</td>
                          <td style={{ padding: '4px 6px', color: '#38bdf8' }}>{b.profileSpec}</td>
                          <td style={{ padding: '4px 6px', fontFamily: 'var(--font-mono)' }}>{b.lengthMm} mm</td>
                          <td style={{ padding: '4px 6px', fontWeight: 700, color: '#f59e0b' }}>{b.qty}</td>
                          <td style={{ padding: '4px 6px', fontFamily: 'var(--font-mono)' }}>{b.totalLengthM.toFixed(2)} m</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pvc_pipes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {!waterTank.enabled ? (
            <div
              style={{
                padding: '16px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '8px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '28px' }}>💧</span>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
                Reservatório de Água Potável em U Desativado
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '420px', lineHeight: 1.5 }}>
                O sistema de caixa d'água contínua em formato U instalada internamente no quadro de ferro ao redor do baú de teto está desativado no configurador.
              </div>
              <button
                className="btn-compact primary"
                onClick={() => setWaterTankEnabled(true)}
                style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
              >
                💧 Ativar Reservatório de Água (Ø{pvcStats.diameterMm}mm • {pvcStats.totalCapacityL}L)
              </button>
            </div>
          ) : (
            <>
              {/* Resumo Geral de Capacidade & Metragem */}
              <div
                style={{
                  padding: '10px 12px',
                  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.16), rgba(2, 132, 199, 0.24))',
                  borderRadius: '8px',
                  border: '1px solid rgba(14, 165, 233, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>💧</span>
                    <div>
                      <strong style={{ fontSize: '12px', color: '#38bdf8' }}>
                        CAIXA D'ÁGUA EM U • Ø{pvcStats.diameterMm} mm ({pvcStats.totalCapacityL} Litros)
                      </strong>
                      <div style={{ fontSize: '10px', color: '#cbd5e1' }}>
                        2× Laterais ({pvcStats.singleLateralL}L cada) + 1× Circuito Frontal ({pvcStats.frontCircuitL}L) • 100% Embutido no Ferro
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn-compact"
                      onClick={() => {
                        const activePlan = pvcBarStandard === '6m' ? pvcStats.plan6m : pvcStats.plan3m;
                        const lines = [
                          `=== PLANO DE CORTE - TUBOS PVC CAIXA D'ÁGUA EM U (DOBLÒ) ===`,
                          `Reservatório Contínuo ao Redor do Baú: Ø${pvcStats.diameterMm} mm | Capacidade: ${pvcStats.totalCapacityL} Litros`,
                          `Extensão Linear Total: ${pvcStats.totalLinearMeters} m | Padrão Selecionado: Barras de ${pvcBarStandard}`,
                          `Total de Barras Necessárias: ${activePlan.length} barra(s) de ${pvcBarStandard}`,
                          ``,
                          `--- APROVEITAMENTO DAS BARRAS COMERCIAIS (${pvcBarStandard}) ---`,
                          ...activePlan.map((b) => {
                            const cutsStr = b.segments
                              .filter((s) => s.label !== 'Sobra Aproveitável')
                              .map((s) => `${s.label} (${s.lengthMm}mm)`)
                              .join(' + ');
                            return `Barra #${b.barIndex} (${b.barLengthMm / 1000}m): [ ${cutsStr} ] | Sobra: ${b.wasteMm}mm (${b.efficiencyPct}% aproveitamento)`;
                          }),
                          ``,
                          `--- LISTA DE CORTES DE TUBOS PVC ---`,
                          ...pvcStats.cutItems.map((c, i) => `${i + 1}. ${c.label}: ${c.lengthMm} mm (Qtd: ${c.qty} un • ${c.spec}) - ${c.notes}`),
                          ``,
                          `--- CONEXÕES E ACESSÓRIOS HIDRÁULICOS ---`,
                          ...pvcStats.fittings.map((f) => `• ${f.label}: ${f.qty} ${f.unit} (${f.spec}) - ${f.notes}`)
                        ];
                        navigator.clipboard.writeText(lines.join('\n'));
                        flashToast?.(`✅ Plano de corte dos canos de PVC copiado!`);
                      }}
                      style={{ fontSize: '9.5px', padding: '3px 8px', fontWeight: 700 }}
                      title="Copiar relatório e lista de corte dos canos de PVC"
                    >
                      📋 Copiar Plano
                    </button>
                    <button
                      className="btn-compact primary"
                      onClick={() => {
                        setPartsFilter('pvc');
                        setViewMode('bars_lineup');
                      }}
                      style={{ fontSize: '9.5px', padding: '3px 8px', fontWeight: 800 }}
                      title="Ver os tubos de PVC alinhados na bancada 3D no solo"
                    >
                      📏 Ver no 3D
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '6px',
                    marginTop: '4px'
                  }}
                >
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
                    <span style={{ color: '#94a3b8' }}>Total Cortes Reta:</span>{' '}
                    <strong style={{ color: '#f8fafc' }}>{pvcStats.totalPieces} peças ({pvcStats.totalLinearMeters} m)</strong>
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
                    <span style={{ color: '#94a3b8' }}>Barras Comerciais:</span>{' '}
                    <strong style={{ color: '#4ade80' }}>
                      {pvcBarStandard === '6m' ? `${pvcStats.plan6m.length} barra de 6m` : `${pvcStats.plan3m.length} barras de 3m`}
                    </strong>
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
                    <span style={{ color: '#94a3b8' }}>Diâmetro / Raio:</span>{' '}
                    <strong style={{ color: '#38bdf8' }}>Ø{pvcStats.diameterMm} mm (R={pvcStats.radiusMm} mm)</strong>
                  </div>
                </div>
              </div>

              {/* Seletor de Padrão de Barra: 6m vs 3m */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <strong style={{ fontSize: '11.5px', color: '#f8fafc' }}>
                    📐 Diagrama de Aproveitamento das Barras de PVC:
                  </strong>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className={`btn-compact ${pvcBarStandard === '6m' ? 'active' : ''}`}
                      onClick={() => setPvcBarStandard('6m')}
                      style={{
                        fontSize: '9.5px',
                        padding: '3px 8px',
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
                        fontSize: '9.5px',
                        padding: '3px 8px',
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

                {/* Renderização Visual de cada Barra de Corte Linear */}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px' }}>
                      <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                        Barra #{bar.barIndex} ({bar.barLengthMm / 1000} m)
                      </span>
                      <span style={{ color: '#cbd5e1', fontSize: '10px' }}>
                        Cortes: <strong>{bar.usedMm} mm</strong> • Sobra: <strong style={{ color: '#94a3b8' }}>{bar.wasteMm} mm</strong> • Aproveitamento:{' '}
                        <strong style={{ color: bar.efficiencyPct >= 80 ? '#4ade80' : '#fbbf24' }}>{bar.efficiencyPct}%</strong>
                      </span>
                    </div>

                    {/* Faixa visual do tubo segmentado proporcional ao comprimento */}
                    <div
                      style={{
                        height: '34px',
                        width: '100%',
                        background: '#0b1120',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        display: 'flex',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        position: 'relative'
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
                              borderRight: sIdx < bar.segments.length - 1 ? '2px solid #0f172a' : undefined,
                              boxShadow: isWaste ? undefined : 'inset 0 1px 0 rgba(255,255,255,0.2)'
                            }}
                            title={`${seg.label}: ${seg.lengthMm} mm (${seg.pct}%)`}
                          >
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 800,
                                color: isWaste ? '#94a3b8' : '#ffffff',
                                textShadow: isWaste ? undefined : '0 1px 2px rgba(0,0,0,0.8)'
                              }}
                            >
                              {seg.pct >= 12 ? `${seg.label} (${seg.lengthMm}mm)` : seg.pct >= 6 ? `${seg.lengthMm}mm` : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabela Detalhada de Cortes dos Tubos de PVC */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  borderRadius: '8px',
                  padding: '10px'
                }}
              >
                <strong style={{ fontSize: '11.5px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  📏 Lista de Cortes dos Tubos de PVC ({pvcStats.totalPieces} peças):
                </strong>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', textAlign: 'left' }}>
                        <th style={{ padding: '4px 6px' }}>#</th>
                        <th style={{ padding: '4px 6px' }}>Identificação</th>
                        <th style={{ padding: '4px 6px' }}>Diâmetro</th>
                        <th style={{ padding: '4px 6px' }}>Comprimento</th>
                        <th style={{ padding: '4px 6px' }}>Qtd</th>
                        <th style={{ padding: '4px 6px' }}>Metros</th>
                        <th style={{ padding: '4px 6px' }}>Instalação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pvcStats.cutItems.map((c, idx) => (
                        <tr key={c.key} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                          <td style={{ padding: '4px 6px', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '4px 6px', fontWeight: 600, color: '#f8fafc' }}>{c.label}</td>
                          <td style={{ padding: '4px 6px', color: '#38bdf8' }}>Ø{c.diameterMm} mm</td>
                          <td style={{ padding: '4px 6px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                            {c.lengthMm} mm
                          </td>
                          <td style={{ padding: '4px 6px', fontWeight: 700, color: '#f59e0b' }}>{c.qty}</td>
                          <td style={{ padding: '4px 6px', fontFamily: 'var(--font-mono)' }}>{c.totalLengthM.toFixed(2)} m</td>
                          <td style={{ padding: '4px 6px', color: '#94a3b8', fontSize: '10px' }}>{c.notes}</td>
                        </tr>
                      ))}
                      <tr style={{ background: 'rgba(14, 165, 233, 0.12)', fontWeight: 800 }}>
                        <td colSpan={4} style={{ padding: '6px', color: '#38bdf8' }}>
                          TOTAL TUBULAÇÃO PVC RETILÍNEA
                        </td>
                        <td style={{ padding: '6px', color: '#f59e0b' }}>{pvcStats.totalPieces} un</td>
                        <td style={{ padding: '6px', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                          {pvcStats.totalLinearMeters.toFixed(2)} m
                        </td>
                        <td style={{ padding: '6px', color: '#cbd5e1', fontSize: '10px' }}>
                          Capacidade útil: {pvcStats.totalCapacityL} L
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Conexões e Acessórios Hidráulicos para Montagem */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  borderRadius: '8px',
                  padding: '10px'
                }}
              >
                <strong style={{ fontSize: '11.5px', color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
                  🔧 Conexões & Acessórios Hidráulicos Necessários ({pvcStats.fittings.length} itens):
                </strong>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#94a3b8', textAlign: 'left' }}>
                        <th style={{ padding: '4px 6px' }}>Conexão / Acessório</th>
                        <th style={{ padding: '4px 6px' }}>Especificação</th>
                        <th style={{ padding: '4px 6px' }}>Qtd</th>
                        <th style={{ padding: '4px 6px' }}>Função & Aplicação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pvcStats.fittings.map((f) => (
                        <tr key={f.key} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                          <td style={{ padding: '4px 6px', fontWeight: 600, color: '#f8fafc' }}>{f.label}</td>
                          <td style={{ padding: '4px 6px', color: '#38bdf8' }}>{f.spec}</td>
                          <td style={{ padding: '4px 6px', fontWeight: 700, color: '#4ade80' }}>
                            {f.qty} {f.unit}
                          </td>
                          <td style={{ padding: '4px 6px', color: '#94a3b8', fontSize: '10px' }}>{f.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
};
