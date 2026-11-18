import { ElectronicComponentId, InstalledElectronicItem } from '../types/electronics';

const STORAGE_KEY = 'doblo_component_positions_memory';

export interface AppliancePositionMemory {
  fridge?: {
    rotation?: number;
    alignX?: 'left' | 'center' | 'right';
    alignZ?: 'front' | 'center' | 'back' | 'rear';
    offsetX?: number;
    offsetZ?: number;
  };
  stove?: {
    placement?: 'top' | 'inside' | 'drawer' | 'rear_shelf';
    rotation?: number;
    alignX?: 'left' | 'center' | 'right';
    alignZ?: 'front' | 'center' | 'back' | 'rear';
    offsetX?: number;
    offsetZ?: number;
  };
  portaPotti?: {
    rotation?: number;
    alignX?: 'left' | 'center' | 'right';
    alignZ?: 'front' | 'center' | 'back' | 'rear';
    offsetX?: number;
    offsetZ?: number;
  };
}

interface ComponentMemoryStore {
  electronics: Partial<Record<ElectronicComponentId, Partial<InstalledElectronicItem>>>;
  appliances: AppliancePositionMemory;
}

// Cache em memória para acesso síncrono ultra-rápido e compatibilidade em testes
let memoryCache: ComponentMemoryStore = {
  electronics: {},
  appliances: {}
};

// Carrega inicial do localStorage
try {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      memoryCache = {
        electronics: parsed.electronics || {},
        appliances: parsed.appliances || {}
      };
    }
  }
} catch {
  // ignore
}

function persistMemory() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
    }
  } catch {
    // ignore
  }
}

/**
 * Salva a última posição, orientação e offsets configurados para um componente eletrônico
 */
export function saveElectronicMemory(
  id: ElectronicComponentId,
  item: Partial<InstalledElectronicItem>
) {
  memoryCache.electronics[id] = {
    ...memoryCache.electronics[id],
    ...item
  };
  persistMemory();
}

/**
 * Recupera a última posição conhecida de um componente eletrônico
 */
export function getElectronicMemory(
  id: ElectronicComponentId
): Partial<InstalledElectronicItem> | null {
  return memoryCache.electronics[id] || null;
}

/**
 * Salva a última posição, alinhamento, rotação e offsets de um eletrodoméstico/acessório
 */
export function saveApplianceMemory<K extends keyof AppliancePositionMemory>(
  type: K,
  config: AppliancePositionMemory[K]
) {
  memoryCache.appliances[type] = {
    ...memoryCache.appliances[type],
    ...config
  };
  persistMemory();
}

/**
 * Recupera a última posição conhecida de um eletrodoméstico/acessório
 */
export function getApplianceMemory<K extends keyof AppliancePositionMemory>(
  type: K
): AppliancePositionMemory[K] | null {
  return (memoryCache.appliances[type] as AppliancePositionMemory[K]) || null;
}

/**
 * Limpa toda a memória (útil para reset de projeto e testes)
 */
export function clearComponentMemory() {
  memoryCache = {
    electronics: {},
    appliances: {}
  };
  persistMemory();
}
