import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectManager } from '../src/data/projectManager';
import { dbSet, dbClear } from '../src/data/db';

describe('ProjectManager (Sistema Multi-Projetos estilo ANN)', () => {
  beforeEach(async () => {
    if (typeof dbClear === 'function') {
      await dbClear();
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('deve criar um novo projeto e registrar no índice e nos recentes', async () => {
    const proj = await ProjectManager.createProject(
      'Doblò Expedição Patagônia',
      'full_camper',
      'Projeto para viagem de longo curso'
    );

    expect(proj).toBeDefined();
    expect(proj.id).toMatch(/^proj_/);
    expect(proj.name).toBe('Doblò Expedição Patagônia');
    expect(proj.data).toBeDefined();
    expect(proj.data.config.stackLevels).toBe(2);

    const list = await ProjectManager.getProjectsList();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(proj.id);
    expect(list[0].name).toBe('Doblò Expedição Patagônia');

    const activeId = await ProjectManager.getActiveProjectId();
    expect(activeId).toBe(proj.id);

    const recents = await ProjectManager.getRecentProjectIds();
    expect(recents).toContain(proj.id);
  });

  it('deve duplicar um projeto existente mantendo a integridade dos dados', async () => {
    const original = await ProjectManager.createProject('Projeto Base', 'roof_overland');
    const copy = await ProjectManager.duplicateProject(original.id);

    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('Projeto Base (Cópia)');

    const list = await ProjectManager.getProjectsList();
    expect(list.length).toBe(2);

    const copyData = await ProjectManager.getProjectData(copy.id);
    expect(copyData).toBeDefined();
    expect(copyData?.config.stackLevels).toBe(original.data.config.stackLevels);
  });

  it('deve atualizar dados do projeto e metadados no índice', async () => {
    const proj = await ProjectManager.createProject('Projeto Teste', 'blank');
    const updatedData = { ...proj.data };
    updatedData.internalBoxes = [
      {
        id: 'box_custom_1',
        name: 'Armário Custom',
        type: 'chest' as const,
        colStart: 0,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 1,
        heightMm: 400,
        color: '#ff0000',
        material: 'plywood' as const,
      },
    ];

    await ProjectManager.saveProjectData(proj.id, updatedData, {
      name: 'Projeto Teste Renomeado',
    });

    const list = await ProjectManager.getProjectsList();
    const updatedMeta = list.find((p) => p.id === proj.id);
    expect(updatedMeta?.name).toBe('Projeto Teste Renomeado');
    expect(updatedMeta?.modulesCount).toBe(1);

    const loadedData = await ProjectManager.getProjectData(proj.id);
    expect(loadedData?.internalBoxes.length).toBe(1);
  });

  it('deve excluir um projeto e remover do índice e dos recentes', async () => {
    const proj1 = await ProjectManager.createProject('Projeto 1', 'blank');
    const proj2 = await ProjectManager.createProject('Projeto 2', 'blank');

    let list = await ProjectManager.getProjectsList();
    expect(list.length).toBe(2);

    await ProjectManager.deleteProject(proj1.id);

    list = await ProjectManager.getProjectsList();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(proj2.id);

    const recents = await ProjectManager.getRecentProjectIds();
    expect(recents).not.toContain(proj1.id);
  });

  it('deve exportar e importar projeto em formato JSON perfeitamente', async () => {
    const proj = await ProjectManager.createProject('Projeto Exportável', 'full_camper');
    const jsonStr = await ProjectManager.exportProjectJson(proj.id);

    expect(jsonStr).toContain('Projeto Exportável');

    const imported = await ProjectManager.importProjectJson(jsonStr);
    expect(imported).toBeDefined();
    expect(imported.name).toBe('Projeto Exportável');
    expect(imported.id).not.toBe(proj.id);

    const list = await ProjectManager.getProjectsList();
    expect(list.some((p) => p.id === imported.id)).toBe(true);
  });

  it('deve migrar transparentemente dados legados na primeira inicialização', async () => {
    // Simula dados legados
    await dbSet('doblo_solar_config', {
      stackLevels: 2,
      level1: { panels: 2, direction: 'longitudinal', orientation: 'longitudinal' },
      level2: { panels: 2, direction: 'fixed', orientation: 'longitudinal' },
    });
    await dbSet('doblo_internal_boxes', [
      {
        id: 'box_legacy_1',
        name: 'Módulo Legado',
        type: 'chest',
        colStart: 0,
        colSpan: 1,
        rowStart: 0,
        rowSpan: 1,
        heightMm: 400,
        color: '#2563eb',
        material: 'plywood',
      },
    ]);

    const migrated = await ProjectManager.ensureInitialProjectMigration();
    expect(migrated).not.toBeNull();
    expect(migrated?.name).toContain('DoblóHome');
    expect(migrated?.modulesCount).toBe(1);

    const list = await ProjectManager.getProjectsList();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(migrated?.id);
  });
});
