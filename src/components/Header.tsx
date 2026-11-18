import React, { useState, useEffect, useRef } from 'react';
import { useSolar } from '../context/SolarContext';
import { useProject } from '../context/ProjectContext';
import { ViewMode } from '../types';
import { CreateProjectModal } from './modals/CreateProjectModal';
import { ProjectListModal } from './modals/ProjectListModal';
import { SyncBadge } from './auth/SyncBadge';
import { API_URL } from '../sync/config';
import {
  PanelLeftIcon,
  PanelRightIcon,
  Maximize2Icon,
  Minimize2Icon,
  HomeIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  FolderClosedIcon,
} from './layout/IdeIcons';

type MenuKey = 'arquivo' | 'cadastros' | 'energia' | 'visualizar' | 'ajuda' | null;

const WORKSPACE_SUBTITLES: Record<ViewMode, string> = {
  internal_boxes: 'Módulos',
  assembled: 'Doblò + Estrutura',
  bars_lineup: 'Peças & Corte',
  electrical_planar: 'Elétrica 2D',
  hydraulic_planar: 'Hidráulica 2D',
  weights: 'Pesos & Cargas',
};

export interface HeaderProps {
  leftSidebarVisible: boolean;
  rightSidebarVisible: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  leftSidebarVisible,
  rightSidebarVisible,
  onToggleLeftSidebar,
  onToggleRightSidebar,
}) => {
  const {
    viewMode,
    setViewMode,
    loadsSummary,
    openModal,
    takeScreenshot,
    b2bCharger,
    toggleB2BEngine,
  } = useSolar();

  const {
    currentProject,
    recentProjects,
    openProject,
    closeProject,
    duplicateProject,
  } = useProject();

  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);
  const menuBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentProject) {
      document.title = `DoblóHome Studio — ${currentProject.name} — ${WORKSPACE_SUBTITLES[viewMode]}`;
    } else {
      document.title = 'DoblóHome Studio — Tela Inicial';
    }
  }, [viewMode, currentProject]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', handleOutside, true);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside, true);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [openMenu]);

  // Atalhos globais
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          setIsCreateProjectOpen(true);
        } else if (e.key === 'o' || e.key === 'O') {
          e.preventDefault();
          setIsProjectListOpen(true);
        } else if (e.key === 'w' || e.key === 'W') {
          if (currentProject) {
            e.preventDefault();
            closeProject();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject, closeProject]);

  const toggleMenu = (key: MenuKey) => setOpenMenu((prev) => (prev === key ? null : key));
  const hoverMenu = (key: MenuKey) => {
    if (openMenu !== null) setOpenMenu(key);
  };
  const closeMenu = () => setOpenMenu(null);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    } else {
      document.documentElement.requestFullscreen().catch(() => { });
    }
  };

  return (
    <>
      <header ref={menuBarRef} className="ide-menubar">
        {/* ── Esquerda: Logo SVG + Menus estilo IDE ── */}
        <div className="ide-menubar-left">
          <div
            className="ide-logo-mark"
            title="DoblóHome Studio — Ir para Tela Inicial"
            onClick={() => closeProject()}
            style={{ cursor: 'pointer' }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="doblohomeLogoGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <rect x="2" y="3" width="20" height="18" rx="4" stroke="url(#doblohomeLogoGrad)" strokeWidth="2" fill="none" />
              <path d="M5 10.5h14M9 6v12M15 6v12" stroke="url(#doblohomeLogoGrad)" strokeWidth="1.6" />
            </svg>
          </div>

          {/* Menu: Arquivo */}
          <div className="ide-menu-wrapper" onMouseEnter={() => hoverMenu('arquivo')}>
            <button
              type="button"
              className={`ide-menu-trigger ${openMenu === 'arquivo' ? 'open' : ''}`}
              onClick={() => toggleMenu('arquivo')}
            >
              Arquivo
            </button>
            {openMenu === 'arquivo' && (
              <div className="ide-menu-dropdown" style={{ minWidth: 220 }}>
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    setIsCreateProjectOpen(true);
                    closeMenu();
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FolderPlusIcon size={15} />
                    <span>Novo Projeto...</span>
                  </div>
                  <span className="ide-menu-shortcut">Ctrl+N</span>
                </button>

                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    setIsProjectListOpen(true);
                    closeMenu();
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FolderOpenIcon size={15} />
                    <span>Abrir Projeto...</span>
                  </div>
                  <span className="ide-menu-shortcut">Ctrl+O</span>
                </button>

                {currentProject && (
                  <>
                    <button
                      type="button"
                      className="ide-menu-item"
                      onClick={() => {
                        duplicateProject(currentProject.id);
                        closeMenu();
                      }}
                    >
                      <span>📋 Duplicar Projeto Atual</span>
                    </button>

                    <button
                      type="button"
                      className="ide-menu-item"
                      onClick={() => {
                        closeProject();
                        closeMenu();
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FolderClosedIcon size={15} />
                        <span>Fechar Projeto</span>
                      </div>
                      <span className="ide-menu-shortcut">Ctrl+W</span>
                    </button>
                  </>
                )}

                {/* Projetos Recentes */}
                {recentProjects.length > 0 && (
                  <>
                    <div className="ide-menu-separator" />
                    <div style={{ padding: '4px 10px', fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Projetos Recentes
                    </div>
                    {recentProjects.slice(0, 5).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="ide-menu-item"
                        onClick={() => {
                          openProject(p.id);
                          closeMenu();
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </span>
                        {currentProject?.id === p.id && (
                          <span className="ide-menu-shortcut" style={{ color: '#38bdf8' }}>Ativo</span>
                        )}
                      </button>
                    ))}
                  </>
                )}

                <div className="ide-menu-separator" />
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    takeScreenshot();
                    closeMenu();
                  }}
                >
                  <span>📷 Capturar Foto 3D</span>
                  <span className="ide-menu-shortcut">PNG</span>
                </button>
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('bom');
                    closeMenu();
                  }}
                >
                  <span>📦 Lista de Materiais (BOM)</span>
                </button>
                <div className="ide-menu-separator" />
                <a
                  href={`${API_URL}/cutting/pdf`}
                  download="plano_de_corte_doblo_solar.pdf"
                  className="ide-menu-item"
                  style={{ textDecoration: 'none' }}
                  onClick={closeMenu}
                >
                  <span>📄 Baixar Plano de Corte (PDF)</span>
                  <span className="ide-menu-shortcut">13p</span>
                </a>
              </div>
            )}
          </div>

          {/* Menu: Cadastros & Presets */}
          <div className="ide-menu-wrapper" onMouseEnter={() => hoverMenu('cadastros')}>
            <button
              type="button"
              className={`ide-menu-trigger ${openMenu === 'cadastros' ? 'open' : ''}`}
              onClick={() => toggleMenu('cadastros')}
            >
              Cadastros
            </button>
            {openMenu === 'cadastros' && (
              <div className="ide-menu-dropdown">
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('panel-presets');
                    closeMenu();
                  }}
                >
                  <span>☀️ Presets Placas Solares</span>
                </button>
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('cargo-presets');
                    closeMenu();
                  }}
                >
                  <span>🧰 Presets Baú de Teto</span>
                </button>
                <div className="ide-menu-separator" />
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('fridge-presets');
                    closeMenu();
                  }}
                >
                  <span>❄️ Geladeiras 12V / 24V</span>
                </button>
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('portapotti-presets');
                    closeMenu();
                  }}
                >
                  <span>🚽 Vaso Químico (Porta Potti)</span>
                </button>
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('stove-presets');
                    closeMenu();
                  }}
                >
                  <span>🍳 Fogões & Cooktops</span>
                </button>
                <div className="ide-menu-separator" />
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('battery-presets');
                    closeMenu();
                  }}
                >
                  <span>🔋 Baterias LiFePO4</span>
                </button>
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('mppt-presets');
                    closeMenu();
                  }}
                >
                  <span>⚡ Controladores MPPT</span>
                </button>
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('b2b-presets');
                    closeMenu();
                  }}
                >
                  <span>🔄 Carregadores DC-DC B2B</span>
                </button>
              </div>
            )}
          </div>

          {/* Menu: Energia & Equipamentos */}
          <div className="ide-menu-wrapper" onMouseEnter={() => hoverMenu('energia')}>
            <button
              type="button"
              className={`ide-menu-trigger ${openMenu === 'energia' ? 'open' : ''}`}
              onClick={() => toggleMenu('energia')}
            >
              Energia
            </button>
            {openMenu === 'energia' && (
              <div className="ide-menu-dropdown">
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('loads');
                    closeMenu();
                  }}
                >
                  <span>⚡ Balanço Energético & Cargas</span>
                </button>
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('battery');
                    closeMenu();
                  }}
                >
                  <span>🔋 Bateria & Autonomia LiFePO4</span>
                </button>
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('mppt');
                    closeMenu();
                  }}
                >
                  <span>☀️ Controlador Solar MPPT</span>
                </button>
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('b2b');
                    closeMenu();
                  }}
                >
                  <span>🔄 Alternador DC-DC (B2B)</span>
                </button>
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('usina');
                    closeMenu();
                  }}
                >
                  <span>🔌 Fonte Usina (Rede Externa)</span>
                </button>
              </div>
            )}
          </div>

          {/* Menu: Visualizar */}
          <div className="ide-menu-wrapper" onMouseEnter={() => hoverMenu('visualizar')}>
            <button
              type="button"
              className={`ide-menu-trigger ${openMenu === 'visualizar' ? 'open' : ''}`}
              onClick={() => toggleMenu('visualizar')}
            >
              Visualizar
            </button>
            {openMenu === 'visualizar' && (
              <div className="ide-menu-dropdown">
                {(['internal_boxes', 'assembled', 'bars_lineup', 'electrical_planar', 'hydraulic_planar', 'weights'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className="ide-menu-item"
                    onClick={() => {
                      setViewMode(mode);
                      closeMenu();
                    }}
                  >
                    <span>{mode === viewMode ? '✓ ' : '  '}{WORKSPACE_SUBTITLES[mode]}</span>
                  </button>
                ))}
                <div className="ide-menu-separator" />
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    toggleFullscreen();
                    closeMenu();
                  }}
                >
                  <span>{isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}</span>
                  <span className="ide-menu-shortcut">F11</span>
                </button>
              </div>
            )}
          </div>

          {/* Menu: Ajuda */}
          <div className="ide-menu-wrapper" onMouseEnter={() => hoverMenu('ajuda')}>
            <button
              type="button"
              className={`ide-menu-trigger ${openMenu === 'ajuda' ? 'open' : ''}`}
              onClick={() => toggleMenu('ajuda')}
            >
              Ajuda
            </button>
            {openMenu === 'ajuda' && (
              <div className="ide-menu-dropdown">
                <button
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    openModal('about');
                    closeMenu();
                  }}
                >
                  <span>ℹ️ Sobre o DoblóHome Studio...</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Centro: Marca DoblóHome Studio + Nome do Projeto ── */}
        <div className="ide-menubar-center">
          <span
            className="ide-brand-gradient"
            style={{ cursor: 'pointer' }}
            onClick={() => openModal('about')}
            title="Sobre o DoblóHome Studio"
          >
            DoblóHome Studio
          </span>
          <span className="ide-brand-separator">—</span>
          {currentProject ? (
            <>
              <span
                className="ide-brand-subtitle"
                style={{
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  color: '#38bdf8',
                  fontWeight: 600,
                  pointerEvents: 'auto',
                }}
                onClick={() => setIsProjectListOpen(true)}
                title="Clique para alternar ou gerenciar projetos"
              >
                📁 {currentProject.name}
              </span>
              <span className="ide-brand-separator">•</span>
              <span className="ide-brand-subtitle">{WORKSPACE_SUBTITLES[viewMode]}</span>
            </>
          ) : (
            <span className="ide-brand-subtitle" style={{ color: '#94a3b8' }}>
              Tela Inicial
            </span>
          )}
          <span className="ide-brand-badge">v1.0</span>
        </div>

        {/* ── Direita: Ações Rápidas + Layout Toggles (Left/Right) + Fullscreen ── */}
        <div className="ide-menubar-right">
          {currentProject ? (
            <>
              <button
                type="button"
                className="ide-quick-pill"
                onClick={() => closeProject()}
                title="Fechar Projeto e voltar à Tela Inicial (Welcome Screen)"
                style={{ cursor: 'pointer', background: '#1e293b' }}
              >
                <HomeIcon size={13} />
                <span>Fechar Projeto</span>
              </button>

              <button
                type="button"
                className={`ide-quick-pill ${b2bCharger.isEngineRunning ? 'active-green' : ''}`}
                onClick={toggleB2BEngine}
                title={
                  b2bCharger.isEngineRunning
                    ? 'Motor da Doblò LIGADO (+30A / 390W). Clique para desligar.'
                    : 'Ligar motor da Fiat Doblò (Ativa alternador B2B 30A)'
                }
              >
                <span>{b2bCharger.isEngineRunning ? '🚗⚡' : '🚗'}</span>
                <span>{b2bCharger.isEngineRunning ? 'Motor (+30A)' : 'Ligar Carro'}</span>
              </button>

              <button
                type="button"
                className="ide-quick-pill"
                onClick={() => openModal('loads')}
                title="Editor de Consumo de Cargas & Balanço Energético"
              >
                <span>⚡</span>
                <span>{loadsSummary.totalKWh} kWh/d</span>
              </button>

              <button
                type="button"
                className="ide-quick-pill"
                onClick={() => openModal('bom')}
                title="Lista de Materiais (BOM)"
              >
                <span>📦</span>
                <span>BOM</span>
              </button>

              <button
                type="button"
                className="ide-quick-pill"
                onClick={takeScreenshot}
                title="Capturar Foto 3D em Alta Resolução"
              >
                <span>📷</span>
                <span>Foto</span>
              </button>

              {/* Grupo Toggle Painéis Esquerdo / Direito estilo MenuBar ANN */}
              <div className="ide-toggle-group">
                <button
                  type="button"
                  onClick={onToggleLeftSidebar}
                  className={`ide-toggle-icon-btn ${leftSidebarVisible ? 'active' : ''}`}
                  title="Alternar Barra Lateral Esquerda"
                >
                  <PanelLeftIcon size={14} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={onToggleRightSidebar}
                  className={`ide-toggle-icon-btn ${rightSidebarVisible ? 'active' : ''}`}
                  title="Alternar Barra Lateral Direita"
                >
                  <PanelRightIcon size={14} strokeWidth={2.2} />
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className="welcome-btn welcome-btn-primary"
                style={{ height: 24, padding: '0 10px', fontSize: 12, borderRadius: 4, minWidth: 'auto' }}
                onClick={() => setIsCreateProjectOpen(true)}
              >
                <FolderPlusIcon size={13} /> Novo Projeto
              </button>
              <button
                type="button"
                className="welcome-btn welcome-btn-secondary"
                style={{ height: 24, padding: '0 10px', fontSize: 12, borderRadius: 4, minWidth: 'auto' }}
                onClick={() => setIsProjectListOpen(true)}
              >
                <FolderOpenIcon size={13} /> Abrir...
              </button>
            </>
          )}

          <SyncBadge />

          <div className="ide-toggle-group">
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`ide-toggle-icon-btn ${isFullscreen ? 'active' : ''}`}
              title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
            >
              {isFullscreen ? (
                <Minimize2Icon size={14} strokeWidth={2.2} />
              ) : (
                <Maximize2Icon size={14} strokeWidth={2.2} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Modais Globais de Projeto */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />

      <ProjectListModal
        isOpen={isProjectListOpen}
        onClose={() => setIsProjectListOpen(false)}
        onOpenNewModal={() => setIsCreateProjectOpen(true)}
      />
    </>
  );
};
