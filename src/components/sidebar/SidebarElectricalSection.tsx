import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const SidebarElectricalSection: React.FC = () => {
  const {
    b2bCharger,
    setB2BEngineHours,
    usinaCharger,
    toggleUsinaAC,
    setUsinaModel,
    openModal,
  } = useSolar();

  return (
    <>
      <div className="panel-section">
        <div className="section-label">
          <span>🔋 ALTERNADOR DOBLÒ & CARREGADOR B2B1230</span>
        </div>

        <div
          style={{
            background: b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.12)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.35)' : 'rgba(56, 189, 248, 0.2)'}`,
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '11px', color: b2bCharger.isEngineRunning ? '#4ade80' : '#38bdf8' }}>
              B2B1230 (12V 30A · 390W)
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: b2bCharger.isEngineRunning ? '#4ade80' : '#94a3b8',
                background: b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                padding: '2px 6px',
                borderRadius: '8px'
              }}
            >
              {b2bCharger.isEngineRunning ? 'RODANDO (+30A)' : 'DESLIGADO'}
            </span>
          </div>

          <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.45 }}>
            Recarrega a bateria de serviço Kingbo 560Ah através do alternador do motor da van com curva de carga de 4 estágios.
          </p>

          {/* Configuração de tempo de rodagem diária */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(56, 189, 248, 0.18)',
              borderRadius: '6px',
              padding: '6px 8px',
              marginBottom: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>⏱️ Rodagem diária:</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: b2bCharger.engineHoursPerDay > 0 ? '#4ade80' : '#94a3b8' }}>
                {b2bCharger.engineHoursPerDay.toFixed(1)} h/dia
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="8"
              step="0.25"
              value={b2bCharger.engineHoursPerDay}
              onChange={(e) => setB2BEngineHours(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', height: '4px', cursor: 'pointer', margin: '2px 0 6px 0' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)' }}>
              <span>
                {b2bCharger.engineHoursPerDay > 0
                  ? `+${Math.round(b2bCharger.engineHoursPerDay * 30)} Ah/dia injetados`
                  : '0 Ah (sem rodar)'}
              </span>
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                {b2bCharger.engineHoursPerDay > 0
                  ? `+${Math.round(b2bCharger.engineHoursPerDay * 390)} Wh/dia`
                  : '0 Wh'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
              Controle de ignição no topo ⬆️
            </span>
            <button
              className="btn-compact primary"
              onClick={() => openModal('b2b')}
              style={{ fontSize: '10px', padding: '4px 10px' }}
            >
              📱 App / Specs B2B
            </button>
          </div>
        </div>
      </div>

      {/* 10. Fonte & Carregador Usina Smart Connect (Rede AC / Camping) */}
      <div className="panel-section">
        <div className="section-label">
          <span>🔌 FONTE & CARREGADOR USINA SMART CONNECT</span>
        </div>

        <div
          style={{
            background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.12)' : 'rgba(15, 23, 42, 0.5)',
            border: `1px solid ${usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.2)'}`,
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '11px', color: usinaCharger.isConnectedAC ? '#f87171' : '#fca5a5' }}>
              Usina {usinaCharger.modelRating}A ({Math.round(usinaCharger.chargingAmps * usinaCharger.voltageOut)}W)
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: usinaCharger.isConnectedAC ? '#f87171' : '#94a3b8',
                background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                padding: '2px 6px',
                borderRadius: '8px'
              }}
            >
              {usinaCharger.isConnectedAC ? `SHORE POWER (+${usinaCharger.chargingAmps}A)` : 'OFF-GRID'}
            </span>
          </div>

          <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.45 }}>
            Recarga pesada Bivolt 110V/220V em tomadas de camping, garagem ou gerador externo para a bateria 560Ah.
          </p>

          {/* Seleção do Modelo Usina: 70A, 120A, 150A, 200A */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Modelo Usina Smart Connect:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {([70, 120, 150, 200] as const).map((rating) => (
                <button
                  key={rating}
                  className={`btn-compact ${usinaCharger.modelRating === rating ? 'active accent-red' : ''}`}
                  onClick={() => setUsinaModel(rating)}
                  style={{
                    fontSize: '9.5px',
                    padding: '4px 0',
                    textAlign: 'center'
                  }}
                  title={`Modelo Usina ${rating}A 12V Bivolt (${Math.round(rating * 14.4)}W)`}
                >
                  {rating}A
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn-compact ${usinaCharger.isConnectedAC ? 'active' : ''}`}
              onClick={toggleUsinaAC}
              style={{
                flex: 1,
                fontSize: '10px',
                background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)',
                borderColor: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)',
                color: usinaCharger.isConnectedAC ? '#fca5a5' : '#86efac'
              }}
            >
              {usinaCharger.isConnectedAC ? '🔌 Desconectar' : '⚡ Conectar Tomada'}
            </button>
            <button
              className="btn-compact primary"
              onClick={() => openModal('usina')}
              style={{ fontSize: '10px', padding: '4px 8px' }}
            >
              📊 Specs / Ajuste
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
