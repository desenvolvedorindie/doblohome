import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { PROJECT_TEMPLATES } from '../../data/projectTemplates';
import { PlusIcon, XIcon, CheckIcon } from '../layout/IdeIcons';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (projectId: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const { createProject, isProjectLoading } = useProject();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('full_camper');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError('Por favor, informe um nome para o projeto.');
      return;
    }
    setError(null);
    try {
      const newId = await createProject(projectName.trim(), selectedTemplate, description.trim());
      setProjectName('');
      setDescription('');
      onClose();
      if (onProjectCreated) {
        onProjectCreated(newId);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar projeto');
    }
  };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div
        className="modal-window"
        style={{ maxWidth: 520, width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlusIcon size={18} />
            <h2 className="modal-title">Novo Projeto Dobló</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Fechar">
            <XIcon size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="project-modal-body">
          {error && (
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                borderRadius: 6,
                fontSize: 12.5,
              }}
            >
              {error}
            </div>
          )}

          <div className="project-form-group">
            <label className="project-form-label">Nome do Projeto *</label>
            <input
              type="text"
              className="project-form-input"
              placeholder="Ex: Doblò Adventure 2026, Expedição Sul..."
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
              maxLength={60}
            />
          </div>

          <div className="project-form-group">
            <label className="project-form-label">Descrição (opcional)</label>
            <input
              type="text"
              className="project-form-input"
              placeholder="Ex: Layout para viagem de 2 pessoas com placas retráteis"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="project-form-group">
            <label className="project-form-label">Modelo Inicial (Template)</label>
            <div className="project-templates-grid">
              {PROJECT_TEMPLATES.map((tmpl) => {
                const isActive = selectedTemplate === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    className={`project-template-card ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                  >
                    <div className="project-template-header">
                      <span className="project-template-name">{tmpl.name}</span>
                      <span className="project-template-badge">{tmpl.badge}</span>
                    </div>
                    <p className="project-template-desc">{tmpl.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="project-modal-footer">
            <button
              type="button"
              className="welcome-btn welcome-btn-ghost"
              onClick={onClose}
              disabled={isProjectLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="welcome-btn welcome-btn-primary"
              disabled={isProjectLoading || !projectName.trim()}
              style={{ minWidth: 150 }}
            >
              {isProjectLoading ? 'Criando...' : 'Criar e Abrir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
