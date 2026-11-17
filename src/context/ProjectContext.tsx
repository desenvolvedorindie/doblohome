import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ProjectMetadata, ProjectData, Project } from '../types/project';
import { ProjectManager } from '../data/projectManager';

interface ProjectContextType {
  currentProject: ProjectMetadata | null;
  projectList: ProjectMetadata[];
  recentProjects: ProjectMetadata[];
  isProjectLoading: boolean;
  createProject: (name: string, templateId?: string, description?: string) => Promise<string>;
  openProject: (id: string) => Promise<ProjectData | null>;
  closeProject: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<string>;
  exportProject: (id: string) => Promise<void>;
  importProject: (file: File) => Promise<string>;
  refreshProjects: () => Promise<ProjectMetadata[]>;
  saveCurrentProjectState: (data: ProjectData) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<ProjectMetadata | null>(null);
  const [projectList, setProjectList] = useState<ProjectMetadata[]>([]);
  const [recentProjectIds, setRecentProjectIds] = useState<string[]>([]);
  const [isProjectLoading, setIsProjectLoading] = useState<boolean>(true);

  // Recarrega lista e recentes do banco
  const refreshProjects = useCallback(async () => {
    const list = await ProjectManager.getProjectsList();
    const recents = await ProjectManager.getRecentProjectIds();
    setProjectList(list);
    setRecentProjectIds(recents);
    return list;
  }, []);

  // Inicialização: realiza migração se necessário e restaura projeto ativo se houver
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsProjectLoading(true);
      try {
        await ProjectManager.ensureInitialProjectMigration();
        const list = await refreshProjects();

        const activeId = await ProjectManager.getActiveProjectId();
        if (activeId && isMounted) {
          const activeMeta = list.find((p) => p.id === activeId);
          if (activeMeta) {
            setCurrentProject(activeMeta);
          } else {
            // Se o ID ativo não existe mais, reseta
            await ProjectManager.setActiveProjectId(null);
            setCurrentProject(null);
          }
        }
      } catch (err) {
        console.error('[ProjectContext] Erro ao inicializar projetos:', err);
      } finally {
        if (isMounted) {
          setIsProjectLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [refreshProjects]);

  // Criação de projeto
  const createProject = async (
    name: string,
    templateId = 'full_camper',
    description?: string
  ): Promise<string> => {
    setIsProjectLoading(true);
    try {
      const newProj = await ProjectManager.createProject(name, templateId, description);
      await refreshProjects();
      setCurrentProject(newProj);
      return newProj.id;
    } finally {
      setIsProjectLoading(false);
    }
  };

  // Abertura de projeto
  const openProject = async (id: string): Promise<ProjectData | null> => {
    setIsProjectLoading(true);
    try {
      const data = await ProjectManager.getProjectData(id);
      if (!data) {
        throw new Error('Não foi possível ler os dados do projeto.');
      }
      await ProjectManager.addRecentProjectId(id);
      await ProjectManager.setActiveProjectId(id);
      await refreshProjects();

      const list = await ProjectManager.getProjectsList();
      const meta = list.find((p) => p.id === id) || null;
      setCurrentProject(meta);
      return data;
    } finally {
      setIsProjectLoading(false);
    }
  };

  // Fechamento de projeto (volta à tela de Welcome)
  const closeProject = async (): Promise<void> => {
    setIsProjectLoading(true);
    try {
      await ProjectManager.setActiveProjectId(null);
      setCurrentProject(null);
      await refreshProjects();
    } finally {
      setIsProjectLoading(false);
    }
  };

  // Exclusão de projeto
  const deleteProject = async (id: string): Promise<void> => {
    await ProjectManager.deleteProject(id);
    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
    await refreshProjects();
  };

  // Duplicação de projeto
  const duplicateProject = async (id: string): Promise<string> => {
    setIsProjectLoading(true);
    try {
      const cloned = await ProjectManager.duplicateProject(id);
      await refreshProjects();
      return cloned.id;
    } finally {
      setIsProjectLoading(false);
    }
  };

  // Exportação em JSON
  const exportProject = async (id: string): Promise<void> => {
    const jsonStr = await ProjectManager.exportProjectJson(id);
    const list = await ProjectManager.getProjectsList();
    const meta = list.find((p) => p.id === id);
    const fileName = `${(meta?.name || 'projeto_doblo').replace(/[^a-zA-Z0-9_-]/g, '_')}.doblo.json`;

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Importação de arquivo JSON
  const importProject = async (file: File): Promise<string> => {
    setIsProjectLoading(true);
    try {
      const text = await file.text();
      const imported = await ProjectManager.importProjectJson(text);
      await refreshProjects();
      setCurrentProject(imported);
      return imported.id;
    } finally {
      setIsProjectLoading(false);
    }
  };

  // Salvar estado atual do projeto ativo
  const saveCurrentProjectState = async (data: ProjectData): Promise<void> => {
    if (!currentProject) return;
    await ProjectManager.saveProjectData(currentProject.id, data);
    const list = await ProjectManager.getProjectsList();
    const updatedMeta = list.find((p) => p.id === currentProject.id);
    if (updatedMeta) {
      setCurrentProject(updatedMeta);
    }
  };

  // Filtra objetos completos dos projetos recentes na ordem dos IDs recentes
  const recentProjects = recentProjectIds
    .map((id) => projectList.find((p) => p.id === id))
    .filter((p): p is ProjectMetadata => Boolean(p));

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projectList,
        recentProjects,
        isProjectLoading,
        createProject,
        openProject,
        closeProject,
        deleteProject,
        duplicateProject,
        exportProject,
        importProject,
        refreshProjects,
        saveCurrentProjectState,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return ctx;
};
