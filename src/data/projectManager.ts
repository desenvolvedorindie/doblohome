import { dbGet, dbSet, dbDelete } from './db';
import { Project, ProjectData, ProjectMetadata } from '../types/project';
import { PROJECT_TEMPLATES, getDefaultProjectConfig } from './projectTemplates';
import { DEFAULT_INTERNAL_GRID } from './internalBoxesPresets';

export const DOBLO_PROJECTS_INDEX_KEY = 'doblo_projects_index';
export const DOBLO_PROJECT_DATA_PREFIX = 'doblo_project_data_';
export const DOBLO_ACTIVE_PROJECT_ID_KEY = 'doblo_active_project_id';
export const DOBLO_RECENT_PROJECTS_KEY = 'doblo_recent_projects';

export class ProjectManager {
  /**
   * Retorna a lista de todos os projetos cadastrados
   */
  static async getProjectsList(): Promise<ProjectMetadata[]> {
    try {
      const list = await dbGet<ProjectMetadata[]>(DOBLO_PROJECTS_INDEX_KEY);
      if (Array.isArray(list)) {
        return list;
      }
    } catch (e) {
      console.warn('[ProjectManager] Erro ao carregar índice de projetos:', e);
    }
    return [];
  }

  /**
   * Salva a lista de projetos
   */
  static async saveProjectsList(list: ProjectMetadata[]): Promise<void> {
    await dbSet(DOBLO_PROJECTS_INDEX_KEY, list);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(DOBLO_PROJECTS_INDEX_KEY, JSON.stringify(list));
      } catch {
        // Ignora cota
      }
    }
  }

  /**
   * Obtém os dados completos de um projeto pelo ID
   */
  static async getProjectData(id: string): Promise<ProjectData | null> {
    try {
      const data = await dbGet<ProjectData>(`${DOBLO_PROJECT_DATA_PREFIX}${id}`);
      if (data) return data;
    } catch (e) {
      console.warn(`[ProjectManager] Erro ao carregar dados do projeto ${id}:`, e);
    }
    return null;
  }

  /**
   * Salva os dados de um projeto e atualiza o metadata no índice
   */
  static async saveProjectData(
    id: string,
    data: ProjectData,
    metaUpdates?: Partial<ProjectMetadata>
  ): Promise<void> {
    await dbSet(`${DOBLO_PROJECT_DATA_PREFIX}${id}`, data);

    const list = await this.getProjectsList();
    const idx = list.findIndex((p) => p.id === id);

    const panelsCount =
      (data.config?.level1?.panels || 0) + (data.config?.level2?.panels || 0);
    const modulesCount = Array.isArray(data.internalBoxes) ? data.internalBoxes.length : 0;

    const now = new Date().toISOString();

    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        ...metaUpdates,
        modulesCount,
        panelsCount,
        updatedAt: now,
      };
    } else if (metaUpdates?.name) {
      list.unshift({
        id,
        name: metaUpdates.name,
        description: metaUpdates.description || '',
        createdAt: metaUpdates.createdAt || now,
        updatedAt: now,
        templateId: metaUpdates.templateId || 'custom',
        modulesCount,
        panelsCount,
      });
    }

    await this.saveProjectsList(list);
  }

  /**
   * Cria um novo projeto
   */
  static async createProject(
    name: string,
    templateId = 'full_camper',
    description?: string
  ): Promise<Project> {
    const template =
      PROJECT_TEMPLATES.find((t) => t.id === templateId) || PROJECT_TEMPLATES[0];
    const data = template.createData();

    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const metadata: ProjectMetadata = {
      id,
      name: name.trim() || 'Novo Projeto Dobló',
      description: description || template.description,
      createdAt: now,
      updatedAt: now,
      templateId,
      modulesCount: data.internalBoxes.length,
      panelsCount: (data.config.level1?.panels || 0) + (data.config.level2?.panels || 0),
    };

    const list = await this.getProjectsList();
    list.unshift(metadata);
    await this.saveProjectsList(list);
    await dbSet(`${DOBLO_PROJECT_DATA_PREFIX}${id}`, data);

    await this.addRecentProjectId(id);
    await this.setActiveProjectId(id);

    return { ...metadata, data };
  }

  /**
   * Duplica um projeto existente
   */
  static async duplicateProject(id: string): Promise<Project> {
    const list = await this.getProjectsList();
    const sourceMeta = list.find((p) => p.id === id);
    const sourceData = await this.getProjectData(id);

    if (!sourceMeta || !sourceData) {
      throw new Error('Projeto de origem não encontrado.');
    }

    const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newMetadata: ProjectMetadata = {
      ...sourceMeta,
      id: newId,
      name: `${sourceMeta.name} (Cópia)`,
      createdAt: now,
      updatedAt: now,
    };

    const clonedData = JSON.parse(JSON.stringify(sourceData));

    list.unshift(newMetadata);
    await this.saveProjectsList(list);
    await dbSet(`${DOBLO_PROJECT_DATA_PREFIX}${newId}`, clonedData);
    await this.addRecentProjectId(newId);

    return { ...newMetadata, data: clonedData };
  }

  /**
   * Exclui um projeto
   */
  static async deleteProject(id: string): Promise<void> {
    const list = await this.getProjectsList();
    const filtered = list.filter((p) => p.id !== id);
    await this.saveProjectsList(filtered);

    try {
      await dbDelete(`${DOBLO_PROJECT_DATA_PREFIX}${id}`);
    } catch {
      // Ignora erro se dbDelete não existir
    }

    await this.removeRecentProjectId(id);

    const activeId = await this.getActiveProjectId();
    if (activeId === id) {
      await this.setActiveProjectId(null);
    }
  }

  /**
   * ID do projeto atualmente ativo
   */
  static async getActiveProjectId(): Promise<string | null> {
    try {
      const activeId = await dbGet<string>(DOBLO_ACTIVE_PROJECT_ID_KEY);
      if (activeId) return activeId;
    } catch {}
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(DOBLO_ACTIVE_PROJECT_ID_KEY);
    }
    return null;
  }

  /**
   * Define o projeto ativo (ou null para fechar projeto e voltar à tela inicial)
   */
  static async setActiveProjectId(id: string | null): Promise<void> {
    if (id) {
      await dbSet(DOBLO_ACTIVE_PROJECT_ID_KEY, id);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(DOBLO_ACTIVE_PROJECT_ID_KEY, id);
      }
    } else {
      try {
        await dbDelete(DOBLO_ACTIVE_PROJECT_ID_KEY);
      } catch {}
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(DOBLO_ACTIVE_PROJECT_ID_KEY);
      }
    }
  }

  /**
   * Projetos recentes
   */
  static async getRecentProjectIds(): Promise<string[]> {
    try {
      const recents = await dbGet<string[]>(DOBLO_RECENT_PROJECTS_KEY);
      if (Array.isArray(recents)) return recents;
    } catch {}
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(DOBLO_RECENT_PROJECTS_KEY);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return [];
  }

  static async addRecentProjectId(id: string): Promise<void> {
    const recents = await this.getRecentProjectIds();
    const next = [id, ...recents.filter((r) => r !== id)].slice(0, 10);
    await dbSet(DOBLO_RECENT_PROJECTS_KEY, next);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DOBLO_RECENT_PROJECTS_KEY, JSON.stringify(next));
    }
  }

  static async removeRecentProjectId(id: string): Promise<void> {
    const recents = await this.getRecentProjectIds();
    const next = recents.filter((r) => r !== id);
    await dbSet(DOBLO_RECENT_PROJECTS_KEY, next);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DOBLO_RECENT_PROJECTS_KEY, JSON.stringify(next));
    }
  }

  static async clearRecentProjects(): Promise<void> {
    await dbSet(DOBLO_RECENT_PROJECTS_KEY, []);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(DOBLO_RECENT_PROJECTS_KEY);
    }
  }

  /**
   * Exporta um projeto para string JSON
   */
  static async exportProjectJson(id: string): Promise<string> {
    const list = await this.getProjectsList();
    const meta = list.find((p) => p.id === id);
    const data = await this.getProjectData(id);

    if (!meta || !data) {
      throw new Error('Projeto não encontrado para exportação.');
    }

    const payload: Project = { ...meta, data };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Importa um projeto a partir de JSON
   */
  static async importProjectJson(jsonStr: string): Promise<Project> {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !parsed.name || !parsed.data) {
      throw new Error('Arquivo JSON inválido. Formato de projeto não reconhecido.');
    }

    const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const metadata: ProjectMetadata = {
      id: newId,
      name: parsed.name,
      description: parsed.description || 'Projeto importado',
      createdAt: now,
      updatedAt: now,
      templateId: parsed.templateId || 'imported',
      modulesCount: Array.isArray(parsed.data?.internalBoxes)
        ? parsed.data.internalBoxes.length
        : 0,
      panelsCount:
        (parsed.data?.config?.level1?.panels || 0) +
        (parsed.data?.config?.level2?.panels || 0),
    };

    const list = await this.getProjectsList();
    list.unshift(metadata);
    await this.saveProjectsList(list);
    await dbSet(`${DOBLO_PROJECT_DATA_PREFIX}${newId}`, parsed.data);
    await this.addRecentProjectId(newId);
    await this.setActiveProjectId(newId);

    return { ...metadata, data: parsed.data };
  }

  /**
   * Migração transparente do estado legado (caso existam configurações no banco mas nenhum projeto no índice)
   */
  static async ensureInitialProjectMigration(): Promise<Project | null> {
    const list = await this.getProjectsList();
    if (list.length > 0) {
      const activeId = await this.getActiveProjectId();
      if (activeId) {
        const found = list.find((p) => p.id === activeId);
        if (found) {
          const data = await this.getProjectData(activeId);
          if (data) return { ...found, data };
        }
      }
      return null;
    }

    // Se a lista estiver vazia, verifica se há dados legados em doblo_solar_config
    try {
      const legacyConfig = await dbGet<any>('doblo_solar_config');
      const legacyBoxes = await dbGet<any[]>('doblo_internal_boxes');
      const legacyGrid = await dbGet<any>('doblo_internal_grid');
      const legacyParts = await dbGet<any>('doblo_parts_filter');

      if (legacyConfig || legacyBoxes) {
        const defaultData: ProjectData = {
          config: legacyConfig || getDefaultProjectConfig(),
          internalBoxes: Array.isArray(legacyBoxes) ? legacyBoxes : [],
          internalGrid: legacyGrid || JSON.parse(JSON.stringify(DEFAULT_INTERNAL_GRID)),
          partsFilter: (legacyParts as any) || 'all',
        };

        const id = 'proj_default_doblo';
        const now = new Date().toISOString();
        const metadata: ProjectMetadata = {
          id,
          name: 'DoblóHome Motorhome (Principal)',
          description: 'Projeto restaurado automaticamente da configuração existente',
          createdAt: now,
          updatedAt: now,
          templateId: 'full_camper',
          modulesCount: defaultData.internalBoxes.length,
          panelsCount:
            (defaultData.config.level1?.panels || 0) +
            (defaultData.config.level2?.panels || 0),
        };

        await this.saveProjectsList([metadata]);
        await dbSet(`${DOBLO_PROJECT_DATA_PREFIX}${id}`, defaultData);
        await this.addRecentProjectId(id);
        await this.setActiveProjectId(id);

        console.info('[ProjectManager] Migração inicial de projeto legado realizada com sucesso.');
        return { ...metadata, data: defaultData };
      }
    } catch (e) {
      console.warn('[ProjectManager] Erro durante verificação de migração:', e);
    }

    return null;
  }
}
