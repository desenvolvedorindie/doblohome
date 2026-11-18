import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSyncInfo, onSyncInfo, syncFull, SyncInfo } from '../../sync/syncEngine';

const LABEL: Record<SyncInfo['status'], string> = {
  idle: 'Sync',
  syncing: 'Sincronizando…',
  synced: 'Sincronizado',
  offline: 'Offline (pendente)',
  error: 'Erro de sync',
};

export const SyncBadge: React.FC = () => {
  const { user, logout, openAuth, phase } = useAuth();
  const [info, setInfo] = useState<SyncInfo>(getSyncInfo());

  useEffect(() => onSyncInfo(setInfo), []);

  if (!user) {
    if (phase !== 'guest') return null;
    return (
      <div className="sync-badge">
        <button
          type="button"
          className="ide-quick-pill"
          onClick={openAuth}
          title="Fazer login ou criar conta para sincronizar seus projetos e cadastros no servidor."
          style={{
            background: 'rgba(56, 189, 248, 0.12)',
            borderColor: 'rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
          }}
        >
          <span>👤</span>
          <span>Login</span>
        </button>
      </div>
    );
  }

  const manualSync = async () => {
    try {
      const { changed } = await syncFull();
      if (changed) window.location.reload(); // recarrega para refletir dados vindos do servidor
    } catch {
      /* status já exibido no badge */
    }
  };

  return (
    <div className="sync-badge">
      <button
        type="button"
        className={`ide-quick-pill sync-${info.status}`}
        onClick={manualSync}
        title={info.error || (info.lastSyncAt ? `Última sincronização: ${new Date(info.lastSyncAt).toLocaleTimeString()}` : 'Clique para sincronizar agora')}
      >
        <span className="sync-dot" />
        <span>{LABEL[info.status]}</span>
      </button>
      <button type="button" className="ide-quick-pill" onClick={logout} title={`Conta: ${user.email} — clique para sair`}>
        <span>{user.email.length > 20 ? user.email.slice(0, 18) + '…' : user.email}</span>
        <span>⎋</span>
      </button>
    </div>
  );
};
