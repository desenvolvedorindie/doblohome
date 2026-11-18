import { API_URL } from './config';

const AUTH_KEY = 'doblo_auth_session';
const LAST_USER_KEY = 'doblo_sync_last_user';

export interface AuthUser {
  id: number;
  email: string;
  emailVerified: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUser;
}

export class ApiError extends Error {
  status: number;
  errors: Record<string, string>;
  data: any;
  constructor(status: number, message: string, errors: Record<string, string> = {}, data: any = null) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.data = data;
  }
  get isNetwork(): boolean {
    return this.status === 0;
  }
}

// ---- sessão (localStorage; fora do conjunto sincronizado) ----
export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: AuthSession | null): void {
  try {
    if (s) localStorage.setItem(AUTH_KEY, JSON.stringify(s));
    else localStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
  sessionListeners.forEach((fn) => fn(s));
}

const sessionListeners = new Set<(s: AuthSession | null) => void>();
export function onSessionChange(fn: (s: AuthSession | null) => void): () => void {
  sessionListeners.add(fn);
  return () => sessionListeners.delete(fn);
}

export function getLastUserId(): number | null {
  const v = localStorage.getItem(LAST_USER_KEY);
  return v ? Number(v) : null;
}
export function setLastUserId(id: number | null): void {
  if (id === null) localStorage.removeItem(LAST_USER_KEY);
  else localStorage.setItem(LAST_USER_KEY, String(id));
}

// ---- HTTP ----
async function rawFetch(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor.');
  }
}

async function parse(res: Response): Promise<any> {
  if (res.status === 204) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function toError(res: Response, data: any): ApiError {
  const errors = data && data.errors && typeof data.errors === 'object' ? data.errors : {};
  return new ApiError(res.status, data?.error || data?.message || `Erro ${res.status}`, errors, data);
}

let refreshing: Promise<AuthSession | null> | null = null;

async function refreshSession(): Promise<AuthSession | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const cur = loadSession();
    if (!cur) return null;
    try {
      const res = await rawFetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: cur.refreshToken }),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 400) saveSession(null);
        return null;
      }
      const s = (await parse(res)) as AuthSession;
      saveSession(s);
      return s;
    } catch {
      return null; // offline: mantém sessão atual
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function apiRequest<T = any>(
  method: string,
  path: string,
  body?: unknown,
  opts: { auth?: boolean } = {}
): Promise<T> {
  const auth = opts.auth !== false;
  const doFetch = async (token?: string) => {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return rawFetch(path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  };

  let session = auth ? loadSession() : null;
  if (auth && !session) throw new ApiError(401, 'Não autenticado.');

  // renova antecipadamente se estiver para expirar
  if (session && Date.parse(session.expiresAt) - Date.now() < 30_000) {
    session = (await refreshSession()) ?? session;
  }

  let res = await doFetch(session?.accessToken);
  if (res.status === 401 && auth) {
    const renewed = await refreshSession();
    if (renewed) res = await doFetch(renewed.accessToken);
  }
  const data = await parse(res);
  if (!res.ok) throw toError(res, data);
  return data as T;
}

export const api = {
  get: <T = any>(p: string) => apiRequest<T>('GET', p),
  put: <T = any>(p: string, b: unknown) => apiRequest<T>('PUT', p, b),
  post: <T = any>(p: string, b: unknown) => apiRequest<T>('POST', p, b),
  del: <T = any>(p: string) => apiRequest<T>('DELETE', p),
};

// ---- endpoints de autenticação ----
export const authApi = {
  register: (email: string, password: string) =>
    apiRequest<{ message: string }>('POST', '/auth/register', { email, password }, { auth: false }),
  verifyEmail: (token: string) =>
    apiRequest<{ message: string }>('POST', '/auth/verify-email', { token }, { auth: false }),
  resendVerification: (email: string) =>
    apiRequest<{ message: string }>('POST', '/auth/resend-verification', { email }, { auth: false }),
  login: async (email: string, password: string) => {
    const s = await apiRequest<AuthSession>('POST', '/auth/login', { email, password }, { auth: false });
    saveSession(s);
    return s;
  },
  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>('POST', '/auth/forgot-password', { email }, { auth: false }),
  resetPassword: (token: string, password: string) =>
    apiRequest<{ message: string }>('POST', '/auth/reset-password', { token, password }, { auth: false }),
  me: () => apiRequest<{ user: AuthUser }>('GET', '/auth/me'),
  logout: async () => {
    try {
      await apiRequest('POST', '/auth/logout', {});
    } catch {
      /* encerra localmente mesmo offline */
    }
    saveSession(null);
  },
};
