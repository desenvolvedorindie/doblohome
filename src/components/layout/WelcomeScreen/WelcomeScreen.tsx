import React, { useState } from 'react';
import { useProject } from '../../../context/ProjectContext';
import { CreateProjectModal } from '../../modals/CreateProjectModal';
import { ProjectListModal } from '../../modals/ProjectListModal';
import {
  FolderOpenIcon,
  FolderPlusIcon,
  SearchIcon,
  ClockIcon,
  CopyIcon,
  Trash2Icon,
  XIcon,
} from '../IdeIcons';

export const WelcomeScreen: React.FC = () => {
  const {
    projectList,
    recentProjects,
    openProject,
    deleteProject,
    duplicateProject,
    isProjectLoading,
  } = useProject();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const displayProjects = (recentProjects.length > 0 ? recentProjects : projectList).filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-screen-inner">
        {/* Ícone Hero */}
        <div className="welcome-logo-badge">
          <FolderOpenIcon size={38} strokeWidth={1.8} />
        </div>

        {/* Título e Subtítulo */}
        <div>
          <h1 className="welcome-title">
            Bem-vindo ao <span className="welcome-brand">DoblóHome Studio</span>
          </h1>
          <p className="welcome-subtitle">
            Crie ou abra um projeto para modelagem 3D do motorhome, balanceamento elétrico,
            módulos internos e geração automática de plano de corte.
          </p>
        </div>

        {/* Ações Primárias */}
        <div className="welcome-actions-group">
          <div className="welcome-primary-actions">
            <button
              type="button"
              className="welcome-btn welcome-btn-primary"
              onClick={() => setIsCreateOpen(true)}
              disabled={isProjectLoading}
            >
              <FolderPlusIcon size={18} /> Novo Projeto
            </button>

            <button
              type="button"
              className="welcome-btn welcome-btn-secondary"
              onClick={() => setIsListOpen(true)}
              disabled={isProjectLoading}
            >
              <FolderOpenIcon size={18} /> Abrir Projeto...
            </button>
          </div>
        </div>

        {/* Seção de Projetos Recentes */}
        <div className="welcome-recents-section">
          <div className="welcome-recents-header">
            <h2 className="welcome-recents-title">Projetos Recentes</h2>
            {projectList.length > 3 && (
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="welcome-search-input"
                  style={{ paddingLeft: 26 }}
                  placeholder="Filtrar recentes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div style={{ position: 'absolute', left: 7, top: 5, color: '#64748b' }}>
                  <SearchIcon size={13} />
                </div>
              </div>
            )}
          </div>

          {displayProjects.length === 0 ? (
            <div className="welcome-empty-state">
              {search
                ? `Nenhum projeto encontrado com "${search}".`
                : 'Nenhum projeto recente. Clique em "Novo Projeto" acima para começar!'}
            </div>
          ) : (
            <div className="welcome-projects-list">
              {displayProjects.slice(0, 6).map((proj) => (
                <div
                  key={proj.id}
                  className="welcome-project-item"
                  onClick={() => openProject(proj.id)}
                  title="Clique para abrir este projeto"
                >
                  <div className="welcome-project-left">
                    <div className="welcome-project-icon">
                      <FolderOpenIcon size={18} />
                    </div>
                    <div className="welcome-project-details">
                      <span className="welcome-project-name">{proj.name}</span>
                      {proj.description && (
                        <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {proj.description}
                        </span>
                      )}
                      <div className="welcome-project-meta">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <ClockIcon size={12} /> {formatDate(proj.updatedAt)}
                        </span>
                        <span>•</span>
                        <span>{proj.modulesCount} módulos</span>
                        <span>•</span>
                        <span>{proj.panelsCount} placas</span>
                      </div>
                    </div>
                  </div>

                  <div className="welcome-project-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="welcome-action-icon-btn"
                      title="Duplicar projeto"
                      onClick={() => duplicateProject(proj.id)}
                    >
                      <CopyIcon size={14} />
                    </button>

                    {confirmDeleteId === proj.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          type="button"
                          className="welcome-action-icon-btn danger"
                          style={{ width: 'auto', padding: '0 6px', fontSize: 11 }}
                          title="Confirmar exclusão"
                          onClick={async () => {
                            await deleteProject(proj.id);
                            setConfirmDeleteId(null);
                          }}
                        >
                          Excluir?
                        </button>
                        <button
                          type="button"
                          className="welcome-action-icon-btn"
                          title="Cancelar"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          <XIcon size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="welcome-action-icon-btn danger"
                        title="Excluir projeto"
                        onClick={() => setConfirmDeleteId(proj.id)}
                      >
                        <Trash2Icon size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {projectList.length > 6 && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                type="button"
                className="welcome-btn welcome-btn-ghost"
                onClick={() => setIsListOpen(true)}
              >
                Ver todos os {projectList.length} projetos...
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <ProjectListModal
        isOpen={isListOpen}
        onClose={() => setIsListOpen(false)}
        onOpenNewModal={() => setIsCreateOpen(true)}
      />
    </div>
  );
};
