import React, { useEffect, useState } from 'react';
import { ApiError } from '../../sync/api';
import { useAuth } from '../../context/AuthContext';

type Mode = 'login' | 'register' | 'forgot' | 'reset' | 'verify';

function readUrlAction(): { mode: Mode; token: string } | null {
  const q = new URLSearchParams(window.location.search);
  if (q.get('verify')) return { mode: 'verify', token: q.get('verify')! };
  if (q.get('reset')) return { mode: 'reset', token: q.get('reset')! };
  return null;
}

function clearUrlAction(): void {
  window.history.replaceState({}, '', window.location.pathname);
}

export const AuthScreen: React.FC = () => {
  const auth = useAuth();
  const initial = readUrlAction();
  const [mode, setMode] = useState<Mode>(initial?.mode ?? 'login');
  const [token] = useState(initial?.token ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);

  const go = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
    setUnverified(false);
  };

  // confirmação de e-mail automática ao abrir o link
  useEffect(() => {
    if (initial?.mode !== 'verify') return;
    setBusy(true);
    auth
      .verifyEmail(initial.token)
      .then((m) => {
        setInfo(m);
        setMode('login');
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Falha ao confirmar e-mail.');
        setMode('login');
      })
      .finally(() => {
        setBusy(false);
        clearUrlAction();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } catch (e) {
      if (e instanceof ApiError) {
        const fieldMsg = e.errors?.email || e.errors?.password;
        setError(typeof fieldMsg === 'string' ? fieldMsg : e.message);
        if (e.status === 403 && (e.errors as any)?.code === 'email_not_verified') setUnverified(true);
      } else {
        setError(e instanceof Error ? e.message : 'Erro inesperado.');
      }
    } finally {
      setBusy(false);
    }
  };

  const passwordsOk = password === confirm;

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (mode === 'login') return run(() => auth.login(email, password));
    if (mode === 'register') {
      if (!passwordsOk) return setError('As senhas não conferem.');
      return run(async () => {
        setInfo(await auth.register(email, password));
        setPassword('');
        setConfirm('');
      });
    }
    if (mode === 'forgot') return run(async () => setInfo(await auth.forgotPassword(email)));
    if (mode === 'reset') {
      if (!passwordsOk) return setError('As senhas não conferem.');
      return run(async () => {
        const m = await auth.resetPassword(token, password);
        clearUrlAction();
        setPassword('');
        setConfirm('');
        setMode('login');
        setInfo(m);
      });
    }
  };

  if (auth.phase === 'loading' || auth.phase === 'syncing') {
    return (
      <div className="auth-shell auth-overlay">
        <div className="auth-card">
          <h1 className="auth-title">DobloHome Studio</h1>
          <p className="auth-muted">
            {auth.phase === 'syncing' ? 'Sincronizando seus projetos…' : 'Carregando…'}
          </p>
        </div>
      </div>
    );
  }

  if (auth.phase === 'confirm-import' && auth.pendingImport) {
    const { projects, presets } = auth.pendingImport;
    return (
      <div className="auth-shell auth-overlay">
        <div className="auth-card">
          <h1 className="auth-title">Dados locais encontrados</h1>
          <p className="auth-muted">
            Este navegador tem {projects} projeto(s) e {presets} conjunto(s) de presets salvos localmente. Deseja enviá-los
            para a sua conta?
          </p>
          <button className="auth-btn" onClick={() => auth.answerImport(true)}>
            Enviar para minha conta
          </button>
          <button className="auth-link" onClick={() => auth.answerImport(false)}>
            Cancelar (continuar sem conta, dados só neste navegador)
          </button>
        </div>
      </div>
    );
  }

  const title: Record<Mode, string> = {
    login: 'Entrar',
    register: 'Criar conta',
    forgot: 'Recuperar senha',
    reset: 'Nova senha',
    verify: 'Confirmando e-mail…',
  };

  return (
    <div className="auth-shell auth-overlay">
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1 className="auth-title">DobloHome Studio</h1>
        <h2 className="auth-sub">{title[mode]}</h2>
        <p className="auth-muted">Você pode usar tudo sem conta. Crie uma conta para salvar seus projetos no servidor e acessá-los de qualquer lugar.</p>

        {error && <div className="auth-msg auth-error" role="alert">{error}</div>}
        {info && <div className="auth-msg auth-info" role="status">{info}</div>}

        {mode !== 'reset' && mode !== 'verify' && (
          <label className="auth-field">
            E-mail
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
        )}
        {(mode === 'login' || mode === 'register' || mode === 'reset') && (
          <label className="auth-field">
            {mode === 'login' ? 'Senha' : 'Nova senha (mín. 8 caracteres)'}
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        )}
        {(mode === 'register' || mode === 'reset') && (
          <label className="auth-field">
            Confirmar senha
            <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </label>
        )}

        {mode !== 'verify' && (
          <button className="auth-btn" type="submit" disabled={busy}>
            {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Cadastrar' : mode === 'forgot' ? 'Enviar link' : 'Salvar senha'}
          </button>
        )}

        {unverified && (
          <button
            type="button"
            className="auth-link"
            onClick={() => run(async () => setInfo(await auth.resendVerification(email)))}
          >
            Reenviar e-mail de confirmação
          </button>
        )}

        <div className="auth-links">
          {mode === 'login' && (
            <>
              <button type="button" className="auth-link" onClick={() => go('register')}>Criar conta</button>
              <button type="button" className="auth-link" onClick={() => go('forgot')}>Esqueci a senha</button>
            </>
          )}
          {mode !== 'login' && mode !== 'verify' && (
            <button type="button" className="auth-link" onClick={() => { clearUrlAction(); go('login'); }}>
              Voltar ao login
            </button>
          )}
        </div>
        <button type="button" className="auth-link" onClick={() => { clearUrlAction(); auth.closeAuth(); }}>
          Continuar sem conta
        </button>
      </form>
    </div>
  );
};

/**
 * Modo convidado: o app funciona 100% local sem conta. O login/cadastro só aparece
 * quando o usuário pede (salvar na nuvem), ou durante a sincronização/importação.
 */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  if (auth.phase === 'loading') return <AuthScreen />;
  const overlay =
    auth.phase === 'syncing' ||
    auth.phase === 'confirm-import' ||
    (auth.authOpen && auth.phase === 'guest');
  return (
    <>
      {children}
      {overlay && <AuthScreen />}
    </>
  );
};