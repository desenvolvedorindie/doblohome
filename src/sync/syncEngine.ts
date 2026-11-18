import { dbDelete, dbGet, dbGetAllKeys, dbSet, setDbChangeListener } from '../data/db';
import {
  DOBLO_ACTIVE_PROJECT_ID_KEY,
  DOBLO_PROJECT_DATA_PREFIX,
  DOBLO_PROJECTS_INDEX_KEY,
  DOBLO_RECENT_PROJECTS_KEY,
  ProjectManager,
} from '../data/projectManager';
import type { ProjectData, ProjectMetadata } from '../types/project';
import { api, ApiError } from './api';

/**
 * Sincronização offline-first:
 *  - IndexedDB/localStorage continuam sendo o cache local (a UI não muda);
 *  - mudanças são detectadas pelo gancho de dbSet/dbDelete e enviadas ao backend;
 *  - o servidor é a fonte da verdade: conflito => last-write-wins por updatedAt (409 => adota servidor);
 *  - sem rede, a diferença local x "estado sincronizado" permanece e é reenviada ao reconectar.
 */

const STATE_KEY = 'doblo_sync_state';

export interface PresetTypeDef {
  type: string;
  listKey: string;
  activeKey: string;
}

export const PRESET_TYPES: PresetTypeDef[] = [
  { type: 'battery', listKey: 'doblo_battery_presets', activeKey: 'doblo_battery_preset_active' },
  { type: 'b2b', listKey: 'doblo_b2b_presets', activeKey: 'doblo_b2b_preset_active' },
  { type: 'cargo-box', listKey: 'doblo_cargo_box_presets', activeKey: 'doblo_active_cargo_preset_id' },
  { type: 'fridge', listKey: 'doblo_fridge_presets', activeKey: 'doblo_active_fridge_preset_id' },
  { type: 'mppt', listKey: 'doblo_mppt_presets', activeKey: 'doblo_mppt_preset_active' },
  { type: 'porta-potti', listKey: 'doblo_portapotti_presets', activeKey: 'doblo_active_portapotti_preset_id' },
  { type: 'solar-panel', listKey: 'doblo_solar_panel_presets', activeKey: 'doblo_solar_active_preset_id' },
  { type: 'stove', listKey: 'doblo_stove_presets', activeKey: 'doblo_active_stove_preset_id' },
  // cadastro de cargas/consumo (equipamentos); não tem "ativo"
  { type: 'loads', listKey: 'doblo_solar_loads', activeKey: 'doblo_solar_loads_active' },
];

interface SyncState {
  projects: Record<string, string>; // id -> assinatura sincronizada
  presets: Record<string, string>; // tipo -> assinatura sincronizada
  presetMod: Record<string, string>; // tipo -> ISO da última edição local
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
export interface SyncInfo {
  status: SyncStatus;
  lastSyncAt: string | null;
  error: string | null;
}

// ---------- utilidades ----------
function canonical(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null';
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  const o = v as Record<string, unknown>;
  return (
    '{' +
    Object.keys(o)
      .sort()
      .filter((k) => o[k] !== undefined)
      .map((k) => JSON.stringify(k) + ':' + canonical(o[k]))
      .join(',') +
    '}'
  );
}

function hash(s: string): string {
  let h1 = 5381,
    h2 = 52711;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = (h1 * 33) ^ c;
    h2 = (h2 * 33) ^ c;
  }
  return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36) + s.length.toString(36);
}

const projectSig = (p: ProjectMetadata) => `${p.updatedAt}|${p.name}|${p.description ?? ''}`;

function loadState(): SyncState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { projects: s.projects || {}, presets: s.presets || {}, presetMod: s.presetMod || {} };
    }
  } catch {
    /* ignore */
  }
  return { projects: {}, presets: {}, presetMod: {} };
}
function saveState(s: SyncState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

// ---------- estado do engine ----------
let enabled = false;
let suppress = 0;
let running = false;
let rerun = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let info: SyncInfo = { status: 'idle', lastSyncAt: null, error: null };
const listeners = new Set<(i: SyncInfo) => void>();

export function getSyncInfo(): SyncInfo {
  return info;
}
export function onSyncInfo(fn: (i: SyncInfo) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function setInfo(p: Partial<SyncInfo>): void {
  info = { ...info, ...p };
  listeners.forEach((fn) => fn(info));
}

async function quietly<T>(fn: () => Promise<T>): Promise<T> {
  suppress++;
  try {
    return await fn();
  } finally {
    suppress--;
  }
}

// ---------- presets ----------
async function readPreset(def: PresetTypeDef): Promise<{ items: any[]; activeId: string | null; sig: string } | null> {
  const items = await dbGet<any[]>(def.listKey);
  if (!Array.isArray(items) || items.length === 0) return null;
  const active = await dbGet<string>(def.activeKey);
  const activeId = typeof active === 'string' && active ? active : null;
  return { items, activeId, sig: hash(canonical([items, activeId])) };
}

async function applyServerPreset(def: PresetTypeDef, s: { items: any[]; activeId: string | null }, state: SyncState) {
  await quietly(async () => {
    await dbSet(def.listKey, s.items);
    if (s.activeId) await dbSet(def.activeKey, s.activeId);
  });
  state.presets[def.type] = hash(canonical([s.items, s.activeId ?? null]));
}

// ---------- projetos ----------
function metaFromServer(sp: any): ProjectMetadata {
  return {
    id: sp.id,
    name: sp.name,
    description: sp.description || '',
    createdAt: sp.createdAt,
    updatedAt: sp.updatedAt,
    templateId: sp.templateId || 'custom',
    modulesCount: sp.modulesCount || 0,
    panelsCount: sp.panelsCount || 0,
    tags: sp.tags || [],
  };
}

async function applyServerProject(sp: any, state: SyncState): Promise<void> {
  const meta = metaFromServer(sp);
  await quietly(async () => {
    const list = await ProjectManager.getProjectsList();
    const idx = list.findIndex((p) => p.id === meta.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...meta };
    else list.unshift(meta);
    await dbSet(`${DOBLO_PROJECT_DATA_PREFIX}${meta.id}`, sp.data as ProjectData);
    await dbSet(DOBLO_PROJECTS_INDEX_KEY, list);
    try {
      localStorage.setItem(DOBLO_PROJECTS_INDEX_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  });
  state.projects[meta.id] = projectSig(meta);
}

// ---------- push ----------
async function pushAll(state: SyncState): Promise<{ applied: boolean }> {
  let applied = false;

  // projetos
  const list = await ProjectManager.getProjectsList();
  const localIds = new Set(list.map((p) => p.id));
  for (const p of list) {
    const sig = projectSig(p);
    if (state.projects[p.id] === sig) continue;
    const data = await ProjectManager.getProjectData(p.id);
    if (!data) continue;
    try {
      await api.put(`/projects/${encodeURIComponent(p.id)}`, {
        name: p.name,
        description: p.description || '',
        templateId: p.templateId,
        tags: p.tags || [],
        createdAt: p.createdAt,
        clientUpdatedAt: p.updatedAt,
        data,
      });
      state.projects[p.id] = sig;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.data?.project) {
        await applyServerProject(e.data.project, state);
        applied = true;
      } else if (e instanceof ApiError && e.status === 422) {
        console.warn(`[Sync] Projeto ${p.id} rejeitado pelo servidor: ${e.message}`);
        state.projects[p.id] = sig; // evita laço; será reenviado na próxima edição
      } else {
        saveState(state);
        throw e;
      }
    }
  }
  for (const id of Object.keys(state.projects)) {
    if (localIds.has(id)) continue;
    try {
      await api.del(`/projects/${encodeURIComponent(id)}?clientUpdatedAt=${encodeURIComponent(new Date().toISOString())}`);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) {
        saveState(state);
        throw e;
      }
    }
    delete state.projects[id];
  }

  // presets
  for (const def of PRESET_TYPES) {
    const cur = await readPreset(def);
    if (!cur || state.presets[def.type] === cur.sig) continue;
    try {
      await api.put(`/presets/${def.type}`, {
        items: cur.items,
        activeId: cur.activeId,
        clientUpdatedAt: state.presetMod[def.type] || new Date().toISOString(),
      });
      state.presets[def.type] = cur.sig;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && Array.isArray(e.data?.items)) {
        await applyServerPreset(def, e.data, state);
        applied = true;
      } else if (e instanceof ApiError && e.status === 422) {
        console.warn(`[Sync] Presets ${def.type} rejeitados: ${e.message}`);
        state.presets[def.type] = cur.sig;
      } else {
        saveState(state);
        throw e;
      }
    }
  }
  saveState(state);
  return { applied };
}

// ---------- pull ----------
async function pullAll(state: SyncState): Promise<{ changed: boolean }> {
  let changed = false;

  // presets
  const all = await api.get<{ presets: Record<string, any> }>('/presets');
  for (const def of PRESET_TYPES) {
    const s = all.presets?.[def.type];
    if (!s || !s.exists || !Array.isArray(s.items)) continue;
    const serverSig = hash(canonical([s.items, s.activeId ?? null]));
    const local = await readPreset(def);
    if (local && local.sig === serverSig) {
      state.presets[def.type] = serverSig;
      continue;
    }
    const localDirty = !!local && state.presets[def.type] !== local.sig;
    const localMod = state.presetMod[def.type];
    const serverNewer = !!localMod && Date.parse(s.updatedAt) > Date.parse(localMod);
    if (!local || !localDirty || serverNewer) {
      await applyServerPreset(def, s, state);
      changed = true;
    }
  }

  // projetos
  const res = await api.get<{ projects: any[] }>('/projects?includeDeleted=1');
  const local = await ProjectManager.getProjectsList();
  for (const sp of res.projects) {
    const lp = local.find((p) => p.id === sp.id);
    if (sp.deleted) {
      if (lp && state.projects[sp.id]) {
        await quietly(() => ProjectManager.deleteProject(sp.id));
        delete state.projects[sp.id];
        changed = true;
      }
      continue;
    }
    const localDirty = !!lp && state.projects[sp.id] !== projectSig(lp);
    // Com edição local pendente, o push resolve (409 => servidor vence se for mais novo).
    if (lp && localDirty) continue;
    const serverNewer = !lp || Date.parse(sp.updatedAt) > Date.parse(lp.updatedAt);
    if (serverNewer) {
      const full = await api.get<{ project: any }>(`/projects/${encodeURIComponent(sp.id)}`);
      await applyServerProject(full.project, state);
      changed = true;
    } else if (lp) {
      state.projects[sp.id] = projectSig(lp);
    }
  }
  saveState(state);
  return { changed };
}

// ---------- API pública ----------
async function runSync(mode: 'push' | 'full'): Promise<{ changed: boolean }> {
  if (!enabled) return { changed: false };
  if (running) {
    rerun = true;
    return { changed: false };
  }
  running = true;
  setInfo({ status: 'syncing', error: null });
  let changed = false;
  try {
    const state = loadState();
    if (mode === 'full') changed = (await pullAll(state)).changed;
    const r = await pushAll(state);
    changed = changed || r.applied;
    setInfo({ status: 'synced', lastSyncAt: new Date().toISOString(), error: null });
  } catch (e) {
    if (e instanceof ApiError && e.isNetwork) setInfo({ status: 'offline', error: null });
    else setInfo({ status: 'error', error: e instanceof Error ? e.message : String(e) });
    if (mode === 'full') throw e;
  } finally {
    running = false;
    if (rerun) {
      rerun = false;
      schedulePush(300);
    }
  }
  return { changed };
}

function schedulePush(delay = 1500): void {
  if (!enabled) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void runSync('push');
  }, delay);
}

function onDbChange(key: string): void {
  if (!enabled || suppress > 0) return;
  const preset = PRESET_TYPES.find((d) => d.listKey === key || d.activeKey === key);
  if (preset) {
    const st = loadState();
    st.presetMod[preset.type] = new Date().toISOString();
    saveState(st);
    schedulePush();
  } else if (key === DOBLO_PROJECTS_INDEX_KEY || key.startsWith(DOBLO_PROJECT_DATA_PREFIX)) {
    schedulePush();
  }
}

const onOnline = () => void runSync('push');
const onVisible = () => {
  if (document.visibilityState === 'visible') void runSync('push');
};

export function startSync(): void {
  if (enabled) return;
  enabled = true;
  setDbChangeListener(onDbChange);
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  intervalId = setInterval(() => void runSync('push'), 30_000);
}

export function stopSync(): void {
  enabled = false;
  setDbChangeListener(null);
  window.removeEventListener('online', onOnline);
  document.removeEventListener('visibilitychange', onVisible);
  if (timer) clearTimeout(timer);
  if (intervalId) clearInterval(intervalId);
  timer = null;
  intervalId = null;
  setInfo({ status: 'idle', error: null });
}

/** Puxa o servidor e envia pendências. `changed` = o cache local foi alterado por dados do servidor. */
export function syncFull(): Promise<{ changed: boolean }> {
  return runSync('full');
}

/** Envia pendências agora (usado antes do logout). */
export async function flushPending(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  await runSync('push');
}

// ---------- dados locais ----------
export async function countLocalData(): Promise<{ projects: number; presets: number }> {
  const projects = (await ProjectManager.getProjectsList()).length;
  let presets = 0;
  for (const def of PRESET_TYPES) if (await readPreset(def)) presets++;
  return { projects, presets };
}

/** Apaga tudo que é sincronizado do cache local (troca de conta / logout). */
export async function wipeLocalData(): Promise<void> {
  await quietly(async () => {
    const keys = await dbGetAllKeys();
    const targets = new Set<string>([
      DOBLO_PROJECTS_INDEX_KEY,
      DOBLO_ACTIVE_PROJECT_ID_KEY,
      DOBLO_RECENT_PROJECTS_KEY,
      'doblo_solar_config',
      'doblo_internal_boxes',
      'doblo_internal_grid',
      'doblo_parts_filter',
    ]);
    PRESET_TYPES.forEach((d) => {
      targets.add(d.listKey);
      targets.add(d.activeKey);
    });
    keys.filter((k) => k.startsWith(DOBLO_PROJECT_DATA_PREFIX)).forEach((k) => targets.add(k));
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(DOBLO_PROJECT_DATA_PREFIX)) targets.add(k);
    }
    for (const k of targets) await dbDelete(k);
  });
  try {
    localStorage.removeItem(STATE_KEY);
  } catch {
    /* ignore */
  }
}
