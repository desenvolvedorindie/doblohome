import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { ProjectMetadata } from '../../types/project';
import {
  FolderOpenIcon,
  XIcon,
  SearchIcon,
  CopyIcon,
  Trash2Icon,
  ClockIcon,
  PlusIcon,
} from '../layout/IdeIcons';

interface ProjectListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewModal: () => void;
}

export const ProjectListModal: React.FC<ProjectListModalProps> = ({
  isOpen,
  onClose,
  onOpenNewModal,
}) => {
  const {
    projectList,
    currentProject,
    openProject,
    deleteProject,
    duplicateProject,
  } = useProject();
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = projectList.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpen = async (id: string) => {
    await openProject(id);
    onClose();
  };

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
    <div className="modal-overlay open" onClick={onClose}>
      <div
        className="modal-window"
        style={{ maxWidth: 640, width: '92%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOpenIcon size={18} />
            <h2 className="modal-title">Meus Projetos Dobló</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Fechar">
            <XIcon size={16} />
          </button>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937', display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="welcome-search-input"
              style={{ width: '100%', paddingLeft: 30, height: 36 }}
              placeholder="Buscar projeto por nome ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <div style={{ position: 'absolute', left: 9, top: 10, color: '#64748b' }}>
              <SearchIcon size={15} />
            </div>
          </div>
          <button
            type="button"
            className="welcome-btn welcome-btn-primary"
            style={{ height: 36, padding: '0 14px', fontSize: 13 }}
            onClick={() => {
              onClose();
              onOpenNewModal();
            }}
          >
            <PlusIcon size={14} /> Novo
          </button>
        </div>

        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {filtered.length === 0 ? (
            <div className="welcome-empty-state">
              {search
                ? `Nenhum projeto encontrado para "${search}".`
                : 'Você ainda não possui projetos salvos.'}
            </div>
          ) : (
            <div className="welcome-projects-list">
              {filtered.map((proj) => {
                const isCurrent = currentProject?.id === proj.id;
                return (
                  <div
                    key={proj.id}
                    className="welcome-project-item"
                    onClick={() => handleOpen(proj.id)}
                    style={{
                      borderColor: isCurrent ? '#38bdf8' : undefined,
                      background: isCurrent ? 'rgba(56, 189, 248, 0.05)' : undefined,
                    }}
                  >
                    <div className="welcome-project-left">
                      <div className="welcome-project-icon">
                        <FolderOpenIcon size={18} />
                      </div>
                      <div className="welcome-project-details">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="welcome-project-name">{proj.name}</span>
                          {isCurrent && (
                            <span
                              className="welcome-project-badge"
                              style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                            >
                              Aberto
                            </span>
                          )}
                        </div>
                        {proj.description && (
                          <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {proj.description}
                          </div>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
