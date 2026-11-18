import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ApiError,
  AuthUser,
  authApi,
  getLastUserId,
  loadSession,
  onSessionChange,
  saveSession,
  setLastUserId,
} from '../sync/api';
import {
  countLocalData,
  flushPending,
  getSyncInfo,
  startSync,
  stopSync,
  syncFull,
  wipeLocalData,
} from '../sync/syncEngine';

type Phase = 'loading' | 'guest' | 'confirm-import' | 'syncing' | 'ready';

interface PendingImport {
  projects: number;
  presets: number;
}

interface AuthContextValue {
  phase: Phase;
  user: AuthUser | null;
  pendingImport: PendingImport | null;
  /** Modal de login/cadastro (modo convidado: só aparece quando o usuário quer salvar na nuvem). */
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<string>;
  resendVerification: (email: string) => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<string>;
  verifyEmail: (token: string) => Promise<string>;
  answerImport: (accept: boolean) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const RELOAD_GUARD = 'doblo_sync_reload_guard';

function reloadOnce(): boolean {
  const last = Number(sessionStorage.getItem(RELOAD_GUARD) || 0);
  if (Date.now() - last < 15_000) return false;
  sessionStorage.setItem(RELOAD_GUARD, String(Date.now()));
  window.location.reload();
  return true;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<Phase>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  // links de e-mail (?verify= / ?reset=) abrem o modal automaticamente
  const [authOpen, setAuthOpen] = useState<boolean>(() => {
    const q = new URLSearchParams(window.location.search);
    return !!(q.get('verify') || q.get('reset'));
  });
  const importResolver = useRef<((v: boolean) => void) | null>(null);

  /** Prepara o cache local para a conta e faz a primeira sincronização. */
  const enter = useCallback(async (u: AuthUser): Promise<boolean> => {
    const last = getLastUserId();
    if (last !== null && last !== u.id) {
      await wipeLocalData(); // outra conta usou este navegador
    } else if (last === null) {
      const counts = await countLocalData();
      if (counts.projects + counts.presets > 0) {
        setPendingImport(counts);
        setPhase('confirm-import');
        const ok = await new Promise<boolean>((resolve) => {
          importResolver.current = resolve;
        });
        setPendingImport(null);
        if (!ok) return false;
      }
    }
    setPhase('syncing');
    setLastUserId(u.id);
    setUser(u);
    startSync();
    try {
      const { changed } = await syncFull();
      if (changed && reloadOnce()) return true; // presets são lidos na carga da página
    } catch (e) {
      // offline/erro: segue com o cache local e tenta de novo depois
      console.warn('[Auth] Sincronização inicial falhou:', e);
    }
    setPhase('ready');
    setAuthOpen(false);
    return true;
  }, []);

  // restaura sessão ao abrir
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = loadSession();
      if (!s) {
        setPhase('guest');
        return;
      }
      let u = s.user;
      try {
        u = (await authApi.me()).user;
      } catch (e) {
        if (e instanceof ApiError && !e.isNetwork) {
          if (!cancelled) setPhase('guest');
          return;
        }
        // offline: usa usuário em cache
      }
      if (!cancelled) {
        const ok = await enter(u);
        if (!ok) {
          saveSession(null);
          setPhase('guest');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enter]);

  // sessão expirada/revogada em qualquer chamada
  useEffect(
    () =>
      onSessionChange((s) => {
        if (!s) {
          stopSync();
          setUser(null);
          setPhase('guest');
        }
      }),
    []
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const s = await authApi.login(email, password);
      const ok = await enter(s.user);
      if (!ok) {
        saveSession(null);
        stopSync();
        setUser(null);
        setPhase('guest');
        throw new ApiError(0, 'Login cancelado: seus dados locais foram mantidos neste navegador.');
      }
    },
    [enter]
  );

  const logout = useCallback(async () => {
    try {
      await flushPending();
    } catch {
      /* segue */
    }
    const st = getSyncInfo().status;
    if (st === 'offline' || st === 'error') {
      const go = window.confirm(
        'Há alterações que ainda não foram sincronizadas com o servidor. Sair agora vai descartá-las. Deseja sair mesmo assim?'
      );
      if (!go) return;
    }
    await authApi.logout();
    stopSync();
    await wipeLocalData();
    setLastUserId(null);
    window.location.reload();
  }, []);

  const value: AuthContextValue = {
    phase,
    user,
    pendingImport,
    authOpen,
    openAuth: () => setAuthOpen(true),
    closeAuth: () => setAuthOpen(false),
    login,
    register: async (e, p) => (await authApi.register(e, p)).message,
    resendVerification: async (e) => (await authApi.resendVerification(e)).message,
    forgotPassword: async (e) => (await authApi.forgotPassword(e)).message,
    resetPassword: async (t, p) => (await authApi.resetPassword(t, p)).message,
    verifyEmail: async (t) => (await authApi.verifyEmail(t)).message,
    answerImport: (accept) => importResolver.current?.(accept),
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
