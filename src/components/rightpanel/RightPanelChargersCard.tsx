import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const RightPanelChargersCard: React.FC = () => {
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
      {/* 🚗⚡ Carregador Inteligente DC-DC B2B1230 (12V 30A · Alternador Doblò) */}
            <div
              className="mppt-meter-box"
              style={{
                background: b2bCharger.isEngineRunning ? 'rgba(30, 58, 138, 0.22)' : 'rgba(15, 23, 42, 0.45)',
                borderColor: b2bCharger.isEngineRunning ? 'rgba(56, 189, 248, 0.45)' : 'rgba(56, 189, 248, 0.2)'
              }}
            >
              <div className="mppt-meter-header">
                <div className="mppt-meter-title">
                  <span className="mppt-icon">🔋</span>
                  <span>Carregador DC-DC B2B1230 (30A)</span>
                </div>
                <div
                  className="mppt-meter-badge"
                  style={{
                    background: b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.25)' : 'rgba(100, 116, 139, 0.25)',
                    color: b2bCharger.isEngineRunning ? '#4ade80' : '#94a3b8',
                    borderColor: b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.4)' : 'rgba(100, 116, 139, 0.3)'
                  }}
                >
                  {b2bCharger.isEngineRunning ? '🚗 ALTERNADOR ATIVO (30A)' : '🅿️ MOTOR DESLIGADO'}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: '6px 0',
                  padding: '6px 8px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700 }}>📶 Bluetooth 5.0:</span>
                  <span style={{ fontSize: '10px', color: '#4ade80' }}>Conectado</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: b2bCharger.isEngineRunning ? '#4ade80' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{b2bCharger.isEngineRunning ? '🚗⚡' : '🅿️'}</span>
                  <span>{b2bCharger.isEngineRunning ? 'Alternador Ativo' : 'Motor Desligado'}</span>
                </span>
              </div>

              {/* Configuração rápida de tempo de motor ligado / rodagem */}
              <div
                style={{
                  margin: '6px 0',
                  padding: '6px 8px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '6px',
                  border: '1px solid rgba(56, 189, 248, 0.18)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⏱️</span> Rodagem com motor:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <button
                      type="button"
                      className="btn-compact"
                      onClick={() => setB2BEngineHours(Math.max(0, b2bCharger.engineHoursPerDay - 0.5))}
                      title="Diminuir 30 min"
                      style={{ padding: '0 6px', fontSize: '11px', height: '18px', minWidth: '18px', lineHeight: '16px' }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: b2bCharger.engineHoursPerDay > 0 ? '#4ade80' : '#94a3b8',
                        minWidth: '40px',
                        textAlign: 'center'
                      }}
                    >
                      {b2bCharger.engineHoursPerDay.toFixed(1)}h/d
                    </span>
                    <button
                      type="button"
                      className="btn-compact"
                      onClick={() => setB2BEngineHours(Math.min(12, b2bCharger.engineHoursPerDay + 0.5))}
                      title="Aumentar 30 min"
                      style={{ padding: '0 6px', fontSize: '11px', height: '18px', minWidth: '18px', lineHeight: '16px' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {b2bCharger.engineHoursPerDay > 0
                      ? `+${Math.round(b2bCharger.engineHoursPerDay * 30)} Ah/dia injetados`
                      : '0 Ah (modo estacionado)'}
                  </span>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                    {b2bCharger.engineHoursPerDay > 0
                      ? `+${Math.round(b2bCharger.engineHoursPerDay * 390)} Wh/dia`
                      : '0 Wh/dia'}
                  </span>
                </div>
              </div>

              <div className="mppt-detail-chips">
                <div className="mppt-detail-chip">
                  <span className="lbl">Entrada Alternador:</span>
                  <span className="val" style={{ color: b2bCharger.isEngineRunning ? '#38bdf8' : '#94a3b8' }}>
                    {b2bCharger.isEngineRunning ? '14.1 V' : '12.4 V'}
                  </span>
                </div>
                <div className="mppt-detail-chip">
                  <span className="lbl">Corrente Injetada:</span>
                  <span className="val" style={{ color: b2bCharger.isEngineRunning ? '#4ade80' : '#94a3b8' }}>
                    {b2bCharger.isEngineRunning ? '+30.0 A' : '0.0 A'}
                  </span>
                </div>
                <div className="mppt-detail-chip">
                  <span className="lbl">Potência Extra:</span>
                  <span className="val" style={{ color: b2bCharger.isEngineRunning ? '#fbbf24' : '#94a3b8' }}>
                    {b2bCharger.isEngineRunning ? '+390 W' : '0 W'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  className="btn-link-action"
                  onClick={() => openModal('b2b')}
                  style={{ fontSize: '10px', color: '#38bdf8' }}
                >
                  ℹ️ Esquema e Especificações do B2B1230 &rarr;
                </button>
              </div>
            </div>

            {/* 🔌⚡ Fonte e Carregador Usina Smart Connect (70A/120A/150A/200A · Bivolt) */}
            <div
              className="mppt-meter-box"
              style={{
                background: usinaCharger.isConnectedAC ? 'rgba(153, 27, 27, 0.22)' : 'rgba(15, 23, 42, 0.45)',
                borderColor: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.2)'
              }}
            >
              <div className="mppt-meter-header">
                <div className="mppt-meter-title">
                  <span className="mppt-icon">🔌</span>
                  <span>Fonte Usina Smart Connect ({usinaCharger.modelRating}A)</span>
                </div>
                <div
                  className="mppt-meter-badge"
                  style={{
                    background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.25)' : 'rgba(100, 116, 139, 0.25)',
                    color: usinaCharger.isConnectedAC ? '#f87171' : '#94a3b8',
                    borderColor: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.4)' : 'rgba(100, 116, 139, 0.3)'
                  }}
                >
                  {usinaCharger.isConnectedAC ? `⚡ SHORE POWER (+${usinaCharger.chargingAmps}A)` : '⛺ MODO OFF-GRID'}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: '6px 0',
                  padding: '6px 8px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 700 }}>Bivolt Automático:</span>
                  <span style={{ fontSize: '10px', color: '#4ade80' }}>100V~250V AC</span>
                </div>
                <button
                  className="btn-compact primary"
                  onClick={toggleUsinaAC}
                  style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)',
                    borderColor: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)',
                    color: usinaCharger.isConnectedAC ? '#fca5a5' : '#86efac'
                  }}
                >
                  {usinaCharger.isConnectedAC ? '🔌 Desconectar' : '⚡ Ligar Tomada'}
                </button>
              </div>

              <div className="mppt-detail-chips">
                <div className="mppt-detail-chip">
                  <span className="lbl">Tensão LiFePO4:</span>
                  <span className="val" style={{ color: usinaCharger.isConnectedAC ? '#38bdf8' : '#94a3b8' }}>
                    {usinaCharger.isConnectedAC ? `${usinaCharger.voltageOut.toFixed(1)} V` : '0.0 V'}
                  </span>
                </div>
                <div className="mppt-detail-chip">
                  <span className="lbl">Corrente Injetada:</span>
                  <span className="val" style={{ color: usinaCharger.isConnectedAC ? '#f87171' : '#94a3b8' }}>
                    {usinaCharger.isConnectedAC ? `+${usinaCharger.chargingAmps}.0 A` : '0.0 A'}
                  </span>
                </div>
                <div className="mppt-detail-chip">
                  <span className="lbl">Potência Extra:</span>
                  <span className="val" style={{ color: usinaCharger.isConnectedAC ? '#fbbf24' : '#94a3b8' }}>
                    {usinaCharger.isConnectedAC ? `+${Math.round(usinaCharger.chargingAmps * usinaCharger.voltageOut)} W` : '0 W'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  className="btn-link-action"
                  onClick={() => openModal('usina')}
                  style={{ fontSize: '10px', color: '#f87171' }}
                >
                  ℹ️ Painel Smart Connect (70A/120A/150A/200A) &rarr;
                </button>
              </div>
            </div>

            
    </>
  );
};
