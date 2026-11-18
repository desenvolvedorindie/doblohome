import React, { useEffect, useRef, useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import type { ModuleCollisionSummary } from '../../three/boxes/ModuleCollisionChecker';

/**
 * Checagem de colisão dos componentes instalados dentro dos módulos:
 *  - componente fora da área útil (colidindo com o próprio móvel)
 *  - componente colidindo com outro componente do mesmo módulo
 */
export const PlannerModuleCollisionSection: React.FC = () => {
  const { sceneManager, internalBoxes, internalGrid, setSelectedBoxId, flashToast } = useSolar() as any;
  const [summary, setSummary] = useState<ModuleCollisionSummary | null>(null);
  const hasChecked = useRef(false);

  const runCheck = (silent = false) => {
    if (!sceneManager) return;
    const result = sceneManager.checkModuleCollisions(internalBoxes);
    hasChecked.current = true;
    setSummary(result);
    if (silent) return;
    if (result.componentsChecked === 0) {
      flashToast?.('ℹ️ Nenhum componente instalado nos módulos para verificar.');
    } else if (result.issues.length === 0) {
      flashToast?.(`✅ Sem colisões em ${result.componentsChecked} componente(s) instalado(s)!`);
    } else {
      flashToast?.(`🔴 ${result.issues.length} colisão(ões) em ${result.affectedBoxIds.length} módulo(s)!`);
    }
  };

  const clear = () => {
    sceneManager?.clearModuleCollisions();
    hasChecked.current = false;
    setSummary(null);
  };

  // Reavalia automaticamente quando o layout muda (após a cena ser reconstruída)
  useEffect(() => {
    if (!hasChecked.current) return;
    const id = window.setTimeout(() => runCheck(true), 250);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalBoxes, internalGrid]);

  useEffect(
    () => () => {
      sceneManager?.hoverCollisionObjects(null);
      sceneManager?.clearModuleCollisions();
    },
    [sceneManager]
  );

  const ok = summary && summary.issues.length === 0;
  const bad = summary && summary.issues.length > 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        background: 'rgba(15, 23, 42, 0.75)',
        borderRadius: '10px',
        border: `1px solid ${bad ? 'rgba(239,68,68,0.45)' : 'rgba(56, 189, 248, 0.25)'}`
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
          🛡️ Colisão dos Componentes
        </span>
        {summary && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '10px',
              color: ok ? '#4ade80' : '#ef4444',
              background: ok ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.15)'
            }}
          >
            {ok ? '✅ OK' : `🔴 ${summary.issues.length} erro(s)`}
          </span>
        )}
      </div>

      <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
        Detecta componentes instalados (bateria, MPPT, B2B, usina, geladeira, porta potti, fogareiro) fora da área
        útil do módulo ou colidindo entre si.
      </span>

      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          className="btn-compact"
          onClick={() => runCheck()}
          disabled={!sceneManager}
          style={{ flex: 1, fontSize: '11px', padding: '7px 10px', fontWeight: 700 }}
        >
          🔍 Verificar colisões
        </button>
        {summary && (
          <button className="btn-compact" onClick={clear} style={{ fontSize: '11px', padding: '7px 10px' }}>
            Limpar
          </button>
        )}
      </div>

      {summary && summary.componentsChecked === 0 && (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Nenhum componente instalado nos módulos.
        </span>
      )}

      {ok && summary.componentsChecked > 0 && (
        <span style={{ fontSize: '11px', color: '#4ade80' }}>
          ✅ {summary.componentsChecked} componente(s) em {summary.modulesWithComponents} módulo(s) sem colisões.
        </span>
      )}

      {bad && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '220px', overflowY: 'auto' }}>
          {summary.issues.map((issue, i) => (
            <div
              key={i}
              onClick={() => setSelectedBoxId?.(issue.boxId)}
              onMouseEnter={() => {
                const targets = [issue.objectA, issue.objectB, issue.boxRoot].filter(Boolean);
                sceneManager?.hoverCollisionObjects(targets);
              }}
              onMouseLeave={() => sceneManager?.hoverCollisionObjects(null)}
              style={{
                fontSize: '11px',
                color: '#fca5a5',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '6px',
                padding: '5px 8px',
                cursor: setSelectedBoxId ? 'pointer' : 'default',
                transition: 'all 0.15s ease'
              }}
              title="Passe o mouse para destacar no 3D ou clique para selecionar o módulo"
            >
              <strong style={{ color: '#f87171' }}>{issue.boxName}</strong>
              <br />
              {issue.kind === 'outside' ? '⛔ ' : '💥 '}
              {issue.detail}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

