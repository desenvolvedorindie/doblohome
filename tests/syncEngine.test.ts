// @vitest-environment jsdom
/**
 * Integração do motor de sincronização com a API real (docker compose up -d).
 * Se a API não estiver acessível, o teste é ignorado.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { ProjectManager } from '../src/data/projectManager';
import { dbClear, dbGet } from '../src/data/db';
import { saveBatteryPresets, saveActiveBatteryPresetId } from '../src/data/batteryPresets';
import { api, authApi, saveSession, setLastUserId } from '../src/sync/api';
import { flushPending, startSync, stopSync, syncFull, wipeLocalData } from '../src/sync/syncEngine';

const API = process.env.API_URL || 'http://localhost:8080';
const MAIL = process.env.MAIL_API || 'http://localhost:8025/api/v1';

let apiUp = false;
const email = `sync_${Date.now()}@test.local`;
const password = 'SenhaForte123';

async function verifyViaMail(): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const list = await (await fetch(`${MAIL}/messages`)).json();
    for (const m of list.messages || []) {
      if (!m.To.some((t: any) => t.Address === email)) continue;
      const full = await (await fetch(`${MAIL}/message/${m.ID}`)).json();
      const match = full.HTML.match(/[?&]verify=([A-Za-z0-9%_-]+)/);
      if (match) {
        await authApi.verifyEmail(decodeURIComponent(match[1]));
        return;
      }
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('e-mail de confirmação não chegou');
}

async function serverProjects(includeDeleted = false) {
  return (await api.get<{ projects: any[] }>(`/projects${includeDeleted ? '?includeDeleted=1' : ''}`)).projects;
}

describe('Sincronização com o backend', () => {
  beforeAll(async () => {
    try {
      apiUp = (await fetch(`${API}/health`)).ok;
    } catch {
      apiUp = false;
    }
    if (!apiUp) return;
    // fetch do front usa API_URL padrão http://localhost:8080
    await authApi.register(email, password);
    await verifyViaMail();
  }, 30_000);

  beforeEach(async () => {
    if (!apiUp) return;
    stopSync();
    await dbClear();
    localStorage.clear();
    const s = await authApi.login(email, password);
    setLastUserId(s.user.id);
    startSync();
  });

  afterAll(() => {
    stopSync();
    saveSession(null);
  });

  it('envia projeto local, restaura em cache vazio, propaga edição e exclusão', async (ctx) => {
    if (!apiUp) return ctx.skip();

    const p = await ProjectManager.createProject('Sync Doblò', 'full_camper');
    await syncFull();
    let list = await serverProjects();
    expect(list.map((x) => x.id)).toContain(p.id);
    expect(list.find((x) => x.id === p.id).version).toBe(1);

    // cache vazio (novo dispositivo) => restaura do servidor
    await wipeLocalData();
    expect(await ProjectManager.getProjectsList()).toHaveLength(0);
    const r = await syncFull();
    expect(r.changed).toBe(true);
    const restored = await ProjectManager.getProjectData(p.id);
    expect(restored).not.toBeNull();
    expect(restored!.internalBoxes.length).toBe(p.data.internalBoxes.length);

    // edição local => versão 2 no servidor
    await new Promise((r2) => setTimeout(r2, 20));
    await ProjectManager.saveProjectData(p.id, { ...restored!, internalBoxes: [] }, { name: 'Renomeado' });
    await flushPending();
    list = await serverProjects();
    const srv = list.find((x) => x.id === p.id);
    expect(srv.version).toBe(2);
    expect(srv.name).toBe('Renomeado');
    expect(srv.modulesCount).toBe(0);

    // exclusão local => tombstone e não volta no pull
    await ProjectManager.deleteProject(p.id);
    await flushPending();
    expect((await serverProjects()).map((x) => x.id)).not.toContain(p.id);
    expect((await serverProjects(true)).find((x) => x.id === p.id).deleted).toBe(true);
    await syncFull();
    expect(await ProjectManager.getProjectsList()).toHaveLength(0);
  }, 30_000);

  it('servidor mais novo vence conflito (last-write-wins)', async (ctx) => {
    if (!apiUp) return ctx.skip();
    const p = await ProjectManager.createProject('Conflito', 'full_camper');
    await syncFull();

    // outro dispositivo grava mais novo direto na API
    const future = new Date(Date.now() + 60_000).toISOString();
    await api.put(`/projects/${p.id}`, { name: 'Do outro dispositivo', clientUpdatedAt: future, data: p.data });

    // edição local mais antiga => 409 => adota o servidor
    await ProjectManager.saveProjectData(p.id, p.data, { name: 'Local antigo' });
    const r = await syncFull();
    expect(r.changed).toBe(true);
    const meta = (await ProjectManager.getProjectsList()).find((x) => x.id === p.id)!;
    expect(meta.name).toBe('Do outro dispositivo');
  }, 30_000);

  it('cadastros pertencem à conta: valem para vários projetos e voltam em cache vazio (inclui cargas)', async (ctx) => {
    if (!apiUp) return ctx.skip();
    const { dbSet } = await import('../src/data/db');
    saveBatteryPresets([{ id: 'conta-bat', name: 'Bateria da conta' }] as any);
    await dbSet('doblo_solar_loads', [{ id: 'app_x', name: 'Forno', watts: 800, hours: 1, qty: 1, enabled: true }]);
    const p1 = await ProjectManager.createProject('Projeto 1', 'full_camper');
    const p2 = await ProjectManager.createProject('Projeto 2', 'full_camper');
    await flushPending();

    // os cadastros não ficam dentro dos projetos
    const d1 = JSON.stringify(await ProjectManager.getProjectData(p1.id));
    expect(d1).not.toContain('conta-bat');
    expect(d1).not.toContain('Forno');

    // novo dispositivo: uma única busca traz projetos e os mesmos cadastros para ambos
    await wipeLocalData();
    await syncFull();
    const ids = (await ProjectManager.getProjectsList()).map((x) => x.id);
    expect(ids).toEqual(expect.arrayContaining([p1.id, p2.id]));
    expect(((await dbGet<any[]>('doblo_battery_presets')) || []).map((i) => i.id)).toEqual(['conta-bat']);
    expect(((await dbGet<any[]>('doblo_solar_loads')) || []).map((i) => i.name)).toEqual(['Forno']);
  }, 30_000);

  it('cada projeto lembra seus próprios presets ativos usando o mesmo catálogo da conta', async (ctx) => {
    if (!apiUp) return ctx.skip();
    const { SolarPersistence } = await import('../src/context/solar/SolarPersistence');
    const { loadActiveBatteryPresetId } = await import('../src/data/batteryPresets');
    const { loadActiveMpptPresetId } = await import('../src/data/mpptPresets');

    // cadastra 2 baterias e 2 MPPTs na conta
    saveBatteryPresets([
      { id: 'bat_a', name: 'Bateria A', capacityAh: 100, voltageNominal: 12.8 },
      { id: 'bat_b', name: 'Bateria B', capacityAh: 300, voltageNominal: 12.8 },
    ] as any);

    const p1 = await ProjectManager.createProject('Projeto A', 'full_camper');
    const p2 = await ProjectManager.createProject('Projeto B', 'full_camper');

    const d1 = (await ProjectManager.getProjectData(p1.id))!;
    const d2 = (await ProjectManager.getProjectData(p2.id))!;
    await ProjectManager.saveProjectData(p1.id, {
      ...d1,
      config: { ...d1.config, batteryPresetId: 'bat_a', mpptPresetId: 'mppt_1' },
    });
    await ProjectManager.saveProjectData(p2.id, {
      ...d2,
      config: { ...d2.config, batteryPresetId: 'bat_b', mpptPresetId: 'mppt_2' },
    });
    await flushPending();

    // sincroniza em cache vazio e alterna entre projetos
    await wipeLocalData();
    await syncFull();

    let activeBat = '';
    let activeMppt = '';
    const dummyHandlers: any = {
      setStackLevelsState: () => {},
      setLevel1State: () => {},
      setLevel2State: () => {},
      setStructureMaterialState: () => {},
      setSteelProfileUnitState: () => {},
      setAluminumColorState: () => {},
      setMetalonColorState: () => {},
      setMetalonWallThicknessState: () => {},
      setMetalonThickness40State: () => {},
      setMetalonThickness30State: () => {},
      setCargoBoxState: () => {},
      setWaterTankState: () => {},
      setAwningState: () => {},
      setB2BCharger: () => {},
      setActivePanelPresetIdState: () => {},
      setActiveCargoPresetIdState: () => {},
      setActiveBatteryPresetIdState: (v: string) => { activeBat = v; },
      setActiveMpptPresetIdState: (v: string) => { activeMppt = v; },
      setOffsetZState: () => {},
      setOffsetYState: () => {},
      setExpansionProgressState: () => {},
      setPanelPresetsState: () => {},
      setCargoBoxPresetsState: () => {},
      setInternalGridState: () => {},
      setInternalBoxesState: () => {},
      setPartsFilterState: () => {},
    };

    SolarPersistence.applyProjectData((await ProjectManager.getProjectData(p1.id))!, dummyHandlers);
    expect(activeBat).toBe('bat_a');
    expect(activeMppt).toBe('mppt_1');
    expect(loadActiveBatteryPresetId()).toBe('bat_a');
    expect(loadActiveMpptPresetId()).toBe('mppt_1');

    SolarPersistence.applyProjectData((await ProjectManager.getProjectData(p2.id))!, dummyHandlers);
    expect(activeBat).toBe('bat_b');
    expect(activeMppt).toBe('mppt_2');
    expect(loadActiveBatteryPresetId()).toBe('bat_b');
    expect(loadActiveMpptPresetId()).toBe('mppt_2');
  }, 30_000);

  it('sincroniza presets (lista e preset ativo) e restaura em cache vazio', async (ctx) => {
    if (!apiUp) return ctx.skip();
    const custom = [
      { id: 'kingbo', name: 'Kingbo', isDefault: true },
      { id: 'minha', name: 'Minha Bateria', extra: {} },
    ];
    saveBatteryPresets(custom as any);
    saveActiveBatteryPresetId('minha');
    await flushPending();

    const server = await api.get<any>('/presets/battery');
    expect(server.exists).toBe(true);
    expect(server.items.map((i: any) => i.id)).toEqual(['kingbo', 'minha']);
    expect(server.activeId).toBe('minha');

    await wipeLocalData();
    expect(await dbGet('doblo_battery_presets')).toBeNull();
    const r = await syncFull();
    expect(r.changed).toBe(true);
    expect(((await dbGet<any[]>('doblo_battery_presets')) || []).map((i) => i.id)).toEqual(['kingbo', 'minha']);
    expect(await dbGet('doblo_battery_preset_active')).toBe('minha');
  }, 30_000);
});
