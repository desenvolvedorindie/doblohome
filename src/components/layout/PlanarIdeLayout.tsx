import React, { useState } from 'react';
import { SidebarResizer } from './SidebarResizer';
import {
  ChevronsLeftIcon,
  ChevronsRightIcon,
  SlidersIcon,
  ShoppingCartIcon,
} from './IdeIcons';

export interface PlanarIdeLayoutProps {
  leftSidebarVisible: boolean;
  rightSidebarVisible: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  leftTitle: string;
  leftActivityTitle: string;
  leftActivityIcon: React.ReactNode;
  leftContent: React.ReactNode;
  rightTab: 'inspector' | 'bom';
  onRightTabChange: (tab: 'inspector' | 'bom') => void;
  rightInspectorTitle: string;
  rightBomTitle: string;
  rightContent: React.ReactNode;
  canvasContent: React.ReactNode;
}

export const PlanarIdeLayout: React.FC<PlanarIdeLayoutProps> = ({
  leftSidebarVisible,
  rightSidebarVisible,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  leftTitle,
  leftActivityTitle,
  leftActivityIcon,
  leftContent,
  rightTab,
  onRightTabChange,
  rightInspectorTitle,
  rightBomTitle,
  rightContent,
  canvasContent,
}) => {
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(340);

  const selectRightTab = (tab: 'inspector' | 'bom') => {
    if (!rightSidebarVisible) {
      onRightTabChange(tab);
      onToggleRightSidebar();
    } else if (rightTab === tab) {
      onToggleRightSidebar();
    } else {
      onRightTabChange(tab);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        background: '#090e1a',
      }}
    >
      {/* Left Docked Sidebar */}
      <div className="ide-sidebar-shell left">
        <div className="ide-activity-bar left">
          <button
            type="button"
            onClick={onToggleLeftSidebar}
            className={`ide-activity-collapse-btn ${leftSidebarVisible ? 'open' : ''}`}
            title={leftSidebarVisible ? 'Recolher Catálogo' : 'Expandir Catálogo'}
          >
            {leftSidebarVisible ? <ChevronsLeftIcon size={14} /> : <ChevronsRightIcon size={14} />}
          </button>
          <button
            type="button"
            onClick={onToggleLeftSidebar}
            className={`ide-activity-btn left ${leftSidebarVisible ? 'active' : ''}`}
            title={leftActivityTitle}
          >
            {leftActivityIcon}
          </button>
        </div>

        {leftSidebarVisible && (
          <aside className="ide-docked-sidebar left" style={{ width: `${leftWidth}px` }}>
            <div className="ide-sidebar-header">
              <span className="ide-sidebar-title">{leftTitle}</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {leftContent}
            </div>
            <SidebarResizer
              side="left"
              width={leftWidth}
              setWidth={setLeftWidth}
              minWidth={240}
              maxWidth={520}
            />
          </aside>
        )}
      </div>

      {/* Center Canvas */}
      {canvasContent}

      {/* Right Docked Sidebar */}
      <div className="ide-sidebar-shell right">
        {rightSidebarVisible && (
          <aside className="ide-docked-sidebar right" style={{ width: `${rightWidth}px` }}>
            <SidebarResizer
              side="right"
              width={rightWidth}
              setWidth={setRightWidth}
              minWidth={260}
              maxWidth={560}
            />
            <div className="ide-sidebar-header">
              <span className="ide-sidebar-title">
                {rightTab === 'bom' ? rightBomTitle : rightInspectorTitle}
              </span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {rightContent}
            </div>
          </aside>
        )}

        <div className="ide-activity-bar right">
          <button
            type="button"
            onClick={onToggleRightSidebar}
            className={`ide-activity-collapse-btn ${rightSidebarVisible ? 'open' : ''}`}
            title={rightSidebarVisible ? 'Recolher Inspetor' : 'Expandir Inspetor'}
          >
            {rightSidebarVisible ? <ChevronsRightIcon size={14} /> : <ChevronsLeftIcon size={14} />}
          </button>
          <button
            type="button"
            onClick={() => selectRightTab('inspector')}
            className={`ide-activity-btn right ${rightSidebarVisible && rightTab === 'inspector' ? 'active' : ''}`}
            title="Inspetor de Nó / Conexão"
          >
            <SlidersIcon />
          </button>
          <button
            type="button"
            onClick={() => selectRightTab('bom')}
            className={`ide-activity-btn right ${rightSidebarVisible && rightTab === 'bom' ? 'active' : ''}`}
            title="Lista de Compras (BOM)"
          >
            <ShoppingCartIcon />
          </button>
        </div>
      </div>
    </div>
  );
};
