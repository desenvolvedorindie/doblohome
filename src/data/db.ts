/**
 * Banco de Dados do Navegador via IndexedDB
 * Substitui integralmente o LocalStorage por armazenamento assíncrono, estruturado e de alta capacidade.
 * Realiza migração transparente e automática de todos os dados existentes no LocalStorage.
 */

const DB_NAME = 'DobloSolarExpanderDB';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

let dbPromise: Promise<IDBDatabase> | null = null;
const memoryFallbackStore = new Map<string, any>();

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB não suportado neste ambiente'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('Falha ao abrir IndexedDB:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Migra TODOS os dados existentes no localStorage para o Banco de Dados do navegador (IndexedDB)
 * e remove as entradas do localStorage para garantir armazenamento 100% no banco de dados.
 */
export async function migrateAllLocalStorageToIndexedDB(): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage || window.localStorage.length === 0) {
    return;
  }

  try {
    const totalItems = window.localStorage.length;
    const keysToMigrate: string[] = [];
    for (let i = 0; i < totalItems; i++) {
      const key = window.localStorage.key(i);
      if (key) keysToMigrate.push(key);
    }

    for (const key of keysToMigrate) {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw);
          await dbSet(key, parsed);
        } catch {
          await dbSet(key, raw);
        }
        window.localStorage.removeItem(key);
      }
    }

    if (keysToMigrate.length > 0) {
      console.info(`[IndexedDB] Migração concluída: ${keysToMigrate.length} item(ns) migrado(s) do LocalStorage para o Banco de Dados.`);
    }
  } catch (err) {
    console.warn('[IndexedDB] Erro durante migração automática do LocalStorage:', err);
  }
}

// Dispara a migração automática ao carregar o módulo no navegador
if (typeof window !== 'undefined') {
  migrateAllLocalStorageToIndexedDB();
}

/**
 * Obtém um item do IndexedDB com fallback e migração transparente do LocalStorage se existir
 */
export async function dbGet<T>(key: string, defaultValue?: T): Promise<T | null> {
  if (!isIndexedDBAvailable()) {
    if (memoryFallbackStore.has(key)) {
      return memoryFallbackStore.get(key) as T;
    }
    return defaultValue !== undefined ? defaultValue : null;
  }

  try {
    const db = await getDB();
    const result = await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });

    if (result !== undefined) {
      return result;
    }

    // Migração de legado do LocalStorage se houver
    if (typeof window !== 'undefined' && window.localStorage) {
      const legacyRaw = window.localStorage.getItem(key);
      if (legacyRaw !== null) {
        try {
          const parsed = JSON.parse(legacyRaw) as T;
          await dbSet(key, parsed);
          window.localStorage.removeItem(key);
          return parsed;
        } catch {
          await dbSet(key, legacyRaw as unknown as T);
          window.localStorage.removeItem(key);
          return legacyRaw as unknown as T;
        }
      }
    }

    return defaultValue !== undefined ? defaultValue : null;
  } catch (err) {
    console.warn(`[dbGet] Erro ao recuperar chave "${key}":`, err);
    if (memoryFallbackStore.has(key)) {
      return memoryFallbackStore.get(key) as T;
    }
    return defaultValue !== undefined ? defaultValue : null;
  }
}

/**
 * Salva um item no IndexedDB e limpa duplicatas do LocalStorage
 */
export async function dbSet<T>(key: string, value: T): Promise<void> {
  memoryFallbackStore.set(key, value);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignora erro de acesso ao localStorage
    }
  }

  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`[dbSet] Erro ao salvar chave "${key}":`, err);
  }
}

/**
 * Remove um item do IndexedDB e do LocalStorage
 */
export async function dbDelete(key: string): Promise<void> {
  memoryFallbackStore.delete(key);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignora erro
    }
  }

  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`[dbDelete] Erro ao deletar chave "${key}":`, err);
  }
}

/**
 * Retorna todas as chaves gravadas no banco de dados
 */
export async function dbGetAllKeys(): Promise<string[]> {
  if (!isIndexedDBAvailable()) {
    return Array.from(memoryFallbackStore.keys());
  }

  try {
    const db = await getDB();
    return await new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();

      req.onsuccess = () => resolve((req.result as string[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[dbGetAllKeys] Erro ao listar chaves do IndexedDB:', err);
    return Array.from(memoryFallbackStore.keys());
  }
}

/**
 * Limpa todos os dados do banco de dados
 */
export async function dbClear(): Promise<void> {
  memoryFallbackStore.clear();

  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[dbClear] Erro ao limpar IndexedDB:', err);
  }
}


