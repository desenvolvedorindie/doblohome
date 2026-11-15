import React, { useState, useEffect, useRef } from 'react';
import { useSolar } from '../context/SolarContext';
import { ViewMode } from '../types';
import {
  PanelLeftIcon,
  PanelRightIcon,
  Maximize2Icon,
  Minimize2Icon,
} from './layout/IdeIcons';

type MenuKey = 'arquivo' | 'cadastros' | 'energia' | 'visualizar' | null;

const WORKSPACE_SUBTITLES: Record<ViewMode, string> = {
  internal_boxes: 'Caixas Internas',
  assembled: 'Doblò + Estrutura',
  bars_lineup: 'Peças & Corte',
  electrical_planar: 'Elétrica 2D',
  hydraulic_planar: 'Hidráulica 2D',
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

  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  const menuBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `DoblòHome — ${WORKSPACE_SUBTITLES[viewMode]}`;
  }, [viewMode]);

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

  const toggleMenu = (key: MenuKey) => setOpenMenu((prev) => (prev === key ? null : key));
  const hoverMenu = (key: MenuKey) => {
    if (openMenu !== null) setOpenMenu(key);
  };
  const closeMenu = () => setOpenMenu(null);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <header ref={menuBarRef} className="ide-menubar">
      {/* ── Esquerda: Logo SVG + Menus estilo IDE ── */}
      <div className="ide-menubar-left">
        <div className="ide-logo-mark" title="DoblòHome Studio">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="doblohomeLogoGrad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#FFA800" />
              </linearGradient>
            </defs>
            <rect x="2" y="6" width="20" height="12" rx="3" stroke="url(#doblohomeLogoGrad)" strokeWidth="2.2" />
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
            <div className="ide-menu-dropdown">
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
                href="/plano_de_corte_doblo_solar.pdf"
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
                <span>🔥 Fogareiro Portátil</span>
              </button>
            </div>
          )}
        </div>

        {/* Menu: Energia & Sistemas */}
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
                <span>🔌 Consumo de Cargas</span>
                <span className="ide-menu-shortcut">{loadsSummary.totalKWh} kWh/d</span>
              </button>
              <button
                type="button"
                className="ide-menu-item"
                onClick={() => {
                  openModal('battery');
                  closeMenu();
                }}
              >
                <span>🔋 Bateria LiFePO4 560Ah</span>
              </button>
              <button
                type="button"
                className="ide-menu-item"
                onClick={() => {
                  openModal('mppt');
                  closeMenu();
                }}
              >
                <span>⚡ Controlador MPPT 60A</span>
              </button>
              <div className="ide-menu-separator" />
              <button
                type="button"
                className="ide-menu-item"
                onClick={() => {
                  openModal('b2b');
                  closeMenu();
                }}
              >
                <span>🚗 Carregador B2B (DC-DC)</span>
              </button>
              <button
                type="button"
                className="ide-menu-item"
                onClick={() => {
                  openModal('usina');
                  closeMenu();
                }}
              >
                <span>🔌 Fonte Usina AC/DC</span>
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
              <button
                type="button"
                className="ide-menu-item"
                onClick={() => {
                  onToggleLeftSidebar();
                  closeMenu();
                }}
              >
                <span>{leftSidebarVisible ? '✓' : '\u00A0\u00A0'} Barra Lateral Esquerda</span>
              </button>
              <button
                type="button"
                className="ide-menu-item"
                onClick={() => {
                  onToggleRightSidebar();
                  closeMenu();
                }}
              >
                <span>{rightSidebarVisible ? '✓' : '\u00A0\u00A0'} Barra Lateral Direita</span>
              </button>
              <div className="ide-menu-separator" />
              {(Object.keys(WORKSPACE_SUBTITLES) as ViewMode[]).map((mode, idx) => (
                <button
                  key={mode}
                  type="button"
                  className="ide-menu-item"
                  onClick={() => {
                    setViewMode(mode);
                    closeMenu();
                  }}
                >
                  <span>
                    {viewMode === mode ? '●' : '\u00A0\u00A0'} {idx + 1}. {WORKSPACE_SUBTITLES[mode]}
                  </span>
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
      </div>

      {/* ── Centro: Marca DoblòHome com Gradiente FlowML + Badge ── */}
      <div className="ide-menubar-center">
        <span className="ide-brand-gradient">DoblòHome</span>
        <span className="ide-brand-separator">—</span>
        <span className="ide-brand-subtitle">{WORKSPACE_SUBTITLES[viewMode]}</span>
        <span className="ide-brand-badge">v2.0</span>
      </div>

      {/* ── Direita: Ações Rápidas + Layout Toggles (Left/Right) + Fullscreen ── */}
      <div className="ide-menubar-right">
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

        {/* Tela Cheia */}
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
  );
};
