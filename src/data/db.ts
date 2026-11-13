/**
 * Banco de Dados do Navegador via IndexedDB
 * Substitui o LocalStorage por armazenamento assíncrono, estruturado e de alta capacidade.
 * Realiza migração transparente de dados legados do LocalStorage.
 */

const DB_NAME = 'DobloSolarExpanderDB';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
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
 * Obtém um item do IndexedDB com fallback e migração do LocalStorage se existir
 */
export async function dbGet<T>(key: string, defaultValue?: T): Promise<T | null> {
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
      const legacyRaw = localStorage.getItem(key);
      if (legacyRaw !== null) {
        try {
          const parsed = JSON.parse(legacyRaw) as T;
          // Salva no IndexedDB e limpa o localStorage
          await dbSet(key, parsed);
          localStorage.removeItem(key);
          return parsed;
        } catch {
          // Se for string pura
          await dbSet(key, legacyRaw as unknown as T);
          localStorage.removeItem(key);
          return legacyRaw as unknown as T;
        }
      }
    }

    return defaultValue !== undefined ? defaultValue : null;
  } catch (err) {
    console.warn(`[dbGet] Erro ao recuperar chave "${key}":`, err);
    return defaultValue !== undefined ? defaultValue : null;
  }
}

/**
 * Salva um item no IndexedDB
 */
export async function dbSet<T>(key: string, value: T): Promise<void> {
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
 * Remove um item do IndexedDB
 */
export async function dbDelete(key: string): Promise<void> {
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

