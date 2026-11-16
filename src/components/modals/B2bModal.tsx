import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const B2bModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    openModal,
    b2bCharger,
    toggleB2BEngine,
    setB2BEnabled,
    setB2BEngineHours,
    batteryPerformance,
    activeB2bPreset
  } = useSolar();

  if (activeModal !== 'b2b') return null;

  const b2b = activeB2bPreset;
  const watts = Math.round(b2b.chargingAmps * b2b.voltageOut);

  return (
    <div className="modal-overlay open" onClick={closeModal}>
      <div
        className="modal-window glass-panel"
        style={{ maxWidth: '880px', maxHeight: '88vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔋</span>
            <span>Carregador Inteligente DC-DC {b2b.name} ({b2b.chargingAmps}A · Alternador Doblò)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => openModal('b2b-presets')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(56, 189, 248, 0.16)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                padding: '5px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              ⚙️ Trocar / Cadastrar B2B
            </button>
            <button className="modal-close-btn" onClick={closeModal}>
              &times;
            </button>
          </div>
        </div>

        {/* Status rápido interativo */}
        <div
          style={{
            background: b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.12)' : 'rgba(15, 23, 42, 0.6)',
            border: `1px solid ${b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.35)' : 'rgba(56, 189, 248, 0.25)'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>{b2bCharger.isEngineRunning ? '🚗⚡' : '🅿️'}</span>
              <span style={{ fontWeight: 700, color: b2bCharger.isEngineRunning ? '#4ade80' : '#94a3b8' }}>
                Status do Motor / Alternador da Doblò:{' '}
                {b2bCharger.isEngineRunning ? 'EM FUNCIONAMENTO (RODANDO)' : 'MOTOR DESLIGADO (ESTACIONADO)'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
              {b2bCharger.isEngineRunning
                ? 'Alternador gerando energia → B2B1230 injetando +30A (+390W) contínuos na bateria Kingbo LiFePO4!'
                : 'Pino D+ em repouso. A bateria de partida da van fica 100% protegida contra descarga.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn-compact ${b2bCharger.isEngineRunning ? 'active' : ''}`}
              onClick={toggleB2BEngine}
              style={{
                background: b2bCharger.isEngineRunning ? 'rgba(34, 197, 94, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                borderColor: b2bCharger.isEngineRunning ? '#22c55e' : '#38bdf8',
                color: b2bCharger.isEngineRunning ? '#4ade80' : '#38bdf8',
                fontWeight: 700
              }}
            >
              {b2bCharger.isEngineRunning ? '⏹️ Desligar Motor (Simulação)' : '▶️ Ligar Motor da Van (+30A)'}
            </button>
          </div>
        </div>

        {/* ⏱️ Painel de Configuração de Tempo de Motor Ligado / Rodagem Diária */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.35) 0%, rgba(15, 23, 42, 0.75) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>⏱️</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', color: '#38bdf8', fontWeight: 700 }}>
                  Tempo de Motor Ligado / Rodagem Diária da Doblò
                </h4>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Quantas horas por dia o carro roda para considerar a recarga DC-DC B2B1230 no balanço de energia
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  color: b2bCharger.engineHoursPerDay > 0 ? '#4ade80' : '#94a3b8',
                  background: 'rgba(15, 23, 42, 0.85)',
                  padding: '5px 14px',
                  borderRadius: '6px',
                  border: `1px solid ${b2bCharger.engineHoursPerDay > 0 ? 'rgba(74, 222, 128, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`
                }}
              >
                {b2bCharger.engineHoursPerDay.toFixed(1)} h/dia
                <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>
                  ({Math.round(b2bCharger.engineHoursPerDay * 60)} min)
                </span>
              </span>
            </div>
          </div>

          {/* Slider de Tempo Diário */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>0h (Van Parada / Apenas Solar)</span>
              <span>1h (Urbano)</span>
              <span>2h (Média Viagem)</span>
              <span>4h (Estrada)</span>
              <span>8h (Expedição)</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="0.25"
              value={b2bCharger.engineHoursPerDay}
              onChange={(e) => setB2BEngineHours(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer', height: '6px' }}
            />
          </div>

          {/* Botões Pré-definidos (Presets Rápidos) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {[
              { label: '🅿️ 0h (Estacionado)', val: 0 },
              { label: '30 min (0.5h)', val: 0.5 },
              { label: '1 hora', val: 1.0 },
              { label: '1.5 hora', val: 1.5 },
              { label: '2 horas', val: 2.0 },
              { label: '3 horas', val: 3.0 },
              { label: '4 horas', val: 4.0 },
              { label: '6 horas', val: 6.0 }
            ].map(preset => (
              <button
                key={preset.val}
                className={`btn-compact ${Math.abs(b2bCharger.engineHoursPerDay - preset.val) < 0.05 ? 'active' : ''}`}
                onClick={() => setB2BEngineHours(preset.val)}
                style={{
                  fontSize: '11px',
                  padding: '3px 9px',
                  background: Math.abs(b2bCharger.engineHoursPerDay - preset.val) < 0.05 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(15, 23, 42, 0.5)',
                  borderColor: Math.abs(b2bCharger.engineHoursPerDay - preset.val) < 0.05 ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                  color: Math.abs(b2bCharger.engineHoursPerDay - preset.val) < 0.05 ? '#38bdf8' : 'var(--text-muted)'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Resumo Dinâmico do Impacto do B2B na Bateria Kingbo 560Ah */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amperes B2B Injetados</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#4ade80', marginTop: '2px' }}>
                +{Math.round(b2bCharger.engineHoursPerDay * b2bCharger.chargingAmps)} Ah/dia
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>@ 30A contínuos do alternador</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Energia B2B Gerada</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24', marginTop: '2px' }}>
                +{Math.round(b2bCharger.engineHoursPerDay * b2bCharger.watts)} Wh/dia
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {((b2bCharger.engineHoursPerDay * b2bCharger.watts) / 1000).toFixed(2)} kWh adicionados
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cobre do Consumo Diário</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                {Math.round(((b2bCharger.engineHoursPerDay * b2bCharger.watts) / (batteryPerformance.dailyConsumptionWh || 1)) * 100)}%
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                do gasto de {batteryPerformance.dailyConsumptionWh} Wh/dia
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Autonomia em Chuva / Sem Sol</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#c084fc', marginTop: '2px' }}>
                {batteryPerformance.daysRainAutonomyWithEngine && batteryPerformance.daysRainAutonomyWithEngine >= 999
                  ? 'Infinita ♾️'
                  : `${batteryPerformance.daysRainAutonomyWithEngine ?? batteryPerformance.daysRainAutonomy} dias`}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {b2bCharger.engineHoursPerDay > 0
                  ? `rodando ${b2bCharger.engineHoursPerDay}h/dia (${batteryPerformance.daysRainAutonomy}d parado)`
                  : 'sem rodar (apenas bateria)'}
              </div>
            </div>
          </div>
        </div>

        <div className="blueprint-grid">
          {/* Coluna esquerda: Visão Geral e Bluetooth */}
          <div className="blueprint-card">
            <h4>{b2b.name} — Visão Geral</h4>
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '8px',
                padding: '14px',
                textAlign: 'center',
                marginBottom: '10px'
              }}
            >
              <div style={{ fontSize: '42px', marginBottom: '6px' }}>📱⚡</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>
                {b2b.brand} · {b2b.model}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Modelo {b2b.chargingAmps}A · Entrada {b2b.voltageIn}V · Saída {b2b.voltageOut}V · ~{watts}W
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              {b2b.description || 'Carregador inteligente DC-DC que recupera a bateria da campervan através do alternador.'}
            </p>

            {b2b.features && b2b.features.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  Destaques do Equipamento:
                </div>
                <ul style={{ fontSize: '10.5px', color: 'var(--text-muted)', paddingLeft: '16px', lineHeight: 1.6 }}>
                  {b2b.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Coluna direita: Especificações Técnicas */}
          <div className="blueprint-card">
            <h4>Especificações Técnicas ({b2b.chargingAmps}A)</h4>
            <table className="bom-table">
              <tbody>
                <tr>
                  <td><strong>Marca / Modelo:</strong></td>
                  <td>{b2b.brand} · {b2b.model}</td>
                </tr>
                <tr>
                  <td><strong>Tensão de Entrada (Alternador):</strong></td>
                  <td>{b2b.voltageIn} Vdc nominal (compatível com Doblò)</td>
                </tr>
                <tr>
                  <td><strong>Corrente Máx. de Carga:</strong></td>
                  <td><strong>{b2b.chargingAmps} A contínuos</strong></td>
                </tr>
                <tr>
                  <td><strong>Potência Nominal de Saída:</strong></td>
                  <td>~{watts} W (@ {b2b.voltageOut}V)</td>
                </tr>
                <tr>
                  <td><strong>Tensão de Carga (Saída):</strong></td>
                  <td>{b2b.voltageOut} V</td>
                </tr>
                <tr>
                  <td><strong>Dimensões:</strong></td>
                  <td>{b2b.dimensionsMm.width} &times; {b2b.dimensionsMm.height} &times; {b2b.dimensionsMm.depth} mm</td>
                </tr>
                <tr>
                  <td><strong>Peso:</strong></td>
                  <td>{b2b.weightKg} kg</td>
                </tr>
                <tr>
                  <td><strong>Sinal de Controle D+ (Ignição):</strong></td>
                  <td>Sim (detecção automática de motor ligado)</td>
                </tr>
                <tr>
                  <td><strong>Eficiência de Conversão:</strong></td>
                  <td>&ge; 92%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Seção inferior: Diagrama Elétrico e Conexões */}
        <div className="blueprint-card" style={{ marginTop: '14px' }}>
          <h4>Esquema de Instalação na Fiat Doblò</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '8px' }}>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '10px'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#f59e0b', marginBottom: '4px' }}>
                🔌 Circuito de Entrada (Alternador &rarr; B2B):
              </div>
              <ul style={{ fontSize: '10.5px', color: 'var(--text-muted)', paddingLeft: '14px', lineHeight: 1.5 }}>
                <li>Cabo positivo 16 mm² saindo da bateria de partida / alternador da Doblò</li>
                <li>Fusível de proteção de <strong>50 A</strong> instalado a 20 cm da bateria do carro</li>
                <li>Cabo negativo aterrado no chassi da Doblò (ponto de massa original)</li>
                <li>Fio de sinal fino conectado à linha D+ do alternador ou fusível pós-chave</li>
              </ul>
            </div>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '10px'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#10b981', marginBottom: '4px' }}>
                🔋 Circuito de Saída (B2B &rarr; Bateria Kingbo 560Ah):
              </div>
              <ul style={{ fontSize: '10.5px', color: 'var(--text-muted)', paddingLeft: '14px', lineHeight: 1.5 }}>
                <li>Cabo positivo 16 mm² saindo do borne OUT (+) para a barra positiva</li>
                <li>Fusível de proteção de <strong>40 A ou 50 A</strong> junto à bateria de serviço</li>
                <li>Cabo negativo direto para o Shunt / Borne Negativo da bateria LiFePO4</li>
                <li>Operação combinada: Solar MPPT 60A + Alternador B2B 30A carregam juntos!</li>
              </ul>
            </div>
          </div>

          <div
            style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#86efac'
            }}
          >
            💡 <strong>Vantagem Estratégica no Motorhome:</strong> Enquanto dirige em dias nublados ou sob chuva, 3 horas
            de viagem injetam <strong>90 Ah (1.152 Wh)</strong> diretamente na bateria Kingbo LiFePO4, garantindo
            autonomia energética total mesmo sem nenhuma radiação solar!
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn-compact primary" onClick={closeModal}>
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};

