import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const SidebarAwningSection: React.FC = () => {
  const {
    awning,
    setAwning,
    toggleAwningOpen,
  } = useSolar();

  return (
    <>
      {/* 10. Toldo Retrátil Overland (Traseiro ou Asa de Morcego 270°) */}
      <div className="panel-section">
        <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⛺ TOLDO RETRÁTIL OVERLAND</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: awning.enabled ? '#38bdf8' : 'var(--text-muted)'
            }}
          >
            {awning.enabled ? (awning.type === 'batwing_270' ? 'Asa 270°' : 'Traseiro') : 'Desativado'}
          </span>
        </div>

        {/* Toggle Ativar / Desativar Toldo */}
        <label
          className="checkbox-custom"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '7px 9px',
            borderRadius: '6px',
            background: awning.enabled ? 'rgba(14, 165, 233, 0.14)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${awning.enabled ? 'rgba(56, 189, 248, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
            marginBottom: awning.enabled ? '10px' : '0',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            type="checkbox"
            checked={awning.enabled}
            onChange={(e) => setAwning({ enabled: e.target.checked })}
            style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--primary)' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: awning.enabled ? '#f8fafc' : '#94a3b8' }}>
              ⛺ Ativar Toldo Retrátil no Rack
            </span>
            <small style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Case em alumínio fixado na longarina com lona impermeável ripstop
            </small>
          </div>
        </label>

        {awning.enabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '4px' }}>
            {/* Seletor de Modelo */}
            <div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>
                Modelo do Toldo Overland:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                <button
                  type="button"
                  className={`btn-compact ${awning.type === 'rear' ? 'active' : ''}`}
                  onClick={() => setAwning({ type: 'rear' })}
                  style={{
                    fontSize: '11px',
                    padding: '7px 4px',
                    fontWeight: 700
                  }}
                >
                  🚗 Traseiro Reto
                </button>
                <button
                  type="button"
                  className={`btn-compact ${awning.type === 'batwing_270' ? 'active accent-amber' : ''}`}
                  onClick={() => setAwning({ type: 'batwing_270' })}
                  style={{
                    fontSize: '11px',
                    padding: '7px 4px',
                    fontWeight: 700
                  }}
                >
                  🦇 Asa Morcego 270°
                </button>
              </div>
            </div>

            {/* Lado de Fixação se for Asa de Morcego */}
            {awning.type === 'batwing_270' && (
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '6px', padding: '6px 8px', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                  <span>Montagem do Estojo no Rack:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                    {awning.side === 'passenger' ? 'Passageiro (Direita)' : 'Motorista (Esquerda)'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                  <button
                    type="button"
                    className={`btn-compact ${awning.side === 'passenger' ? 'active' : ''}`}
                    onClick={() => setAwning({ side: 'passenger' })}
                    style={{ fontSize: '10px', padding: '5px 4px' }}
                  >
                    Direita (Passageiro)
                  </button>
                  <button
                    type="button"
                    className={`btn-compact ${awning.side === 'driver' ? 'active' : ''}`}
                    onClick={() => setAwning({ side: 'driver' })}
                    style={{ fontSize: '10px', padding: '5px 4px' }}
                  >
                    Esquerda (Motorista)
                  </button>
                </div>
              </div>
            )}

            {/* Botão de Ação: Abrir / Recolher */}
            <button
              type="button"
              className={`btn-compact primary ${awning.isOpen ? 'active' : ''}`}
              onClick={toggleAwningOpen}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontWeight: 800,
                fontSize: '11.5px',
                background: awning.isOpen
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.4))'
                  : 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(37, 99, 235, 0.3))',
                borderColor: awning.isOpen ? '#10b981' : '#38bdf8',
                color: awning.isOpen ? '#34d399' : '#38bdf8',
                boxShadow: awning.isOpen ? '0 0 10px rgba(16, 185, 129, 0.3)' : undefined
              }}
            >
              {awning.isOpen ? '⛺ Recolher Toldo no Estojo' : '⛺ Desdobrar Lona (Abrir Toldo)'}
            </button>

            {/* Cor da Lona Ripstop */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px', fontSize: '10px', color: '#94a3b8' }}>
              <span>🎨 Cor da Lona Impermeável:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { label: 'Safari', color: '#c2b280' },
                  { label: 'Grafite', color: '#374151' },
                  { label: 'Oliva', color: '#4b5320' },
                  { label: 'Preto', color: '#18181b' }
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setAwning({ fabricColor: c.color })}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: c.color,
                      border: awning.fabricColor === c.color ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.3)',
                      boxShadow: awning.fabricColor === c.color ? '0 0 6px rgba(56, 189, 248, 0.7)' : undefined,
                      cursor: 'pointer'
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Card com Especificações do Toldo */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '10px',
                color: '#cbd5e1',
                lineHeight: 1.45
              }}
            >
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '2px' }}>
                {awning.type === 'batwing_270' ? '🦇 Asa de Morcego 270° Overland' : '🚗 Toldo Reto Traseiro'}
              </div>
              <div>
                {awning.type === 'batwing_270'
                  ? 'Cobertura total de 270° contornando lateral e traseira da Doblò (~10 m² de sombra).'
                  : 'Projeção reta traseira de 2,00m cobrindo a tampa aberta do porta-malas (~2,8 m² de sombra).'}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
