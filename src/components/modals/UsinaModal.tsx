import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { UsinaModelRating } from '../../types';

interface UsinaModelSpec {
  rating: UsinaModelRating;
  label: string;
  watts: number;
  amps127V: number;
  amps220V: number;
  cableGauge: string;
  chargeTime560Ah: string;
  weight: string;
  dimensions: string;
  recommended?: boolean;
}

const USINA_SPECS: Record<UsinaModelRating, UsinaModelSpec> = {
  70: {
    rating: 70,
    label: 'Usina 70A Smart Connect',
    watts: 1008,
    amps127V: 11,
    amps220V: 6.5,
    cableGauge: '16 mm²',
    chargeTime560Ah: '~8,0 horas',
    weight: '2,10 kg',
    dimensions: '260 × 180 × 85 mm'
  },
  120: {
    rating: 120,
    label: 'Usina 120A Smart Connect',
    watts: 1728,
    amps127V: 18,
    amps220V: 10.5,
    cableGauge: '25 mm²',
    chargeTime560Ah: '~4,7 horas',
    weight: '2,55 kg',
    dimensions: '290 × 180 × 85 mm'
  },
  150: {
    rating: 150,
    label: 'Usina 150A Smart Connect',
    watts: 2160,
    amps127V: 22,
    amps220V: 13,
    cableGauge: '35 mm²',
    chargeTime560Ah: '~3,7 horas',
    weight: '2,95 kg',
    dimensions: '320 × 180 × 88 mm',
    recommended: true
  },
  200: {
    rating: 200,
    label: 'Usina 200A Smart Connect',
    watts: 2880,
    amps127V: 30,
    amps220V: 17.5,
    cableGauge: '50 mm²',
    chargeTime560Ah: '~2,8 horas',
    weight: '3,40 kg',
    dimensions: '360 × 180 × 88 mm'
  }
};

export const UsinaModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    usinaCharger,
    toggleUsinaAC,
    setUsinaAmps,
    setUsinaVoltage,
    setUsinaModel
  } = useSolar();

  if (activeModal !== 'usina') return null;

  const currentSpec = USINA_SPECS[usinaCharger.modelRating] || USINA_SPECS[150];

  return (
    <div className="modal-overlay open" onClick={closeModal}>
      <div
        className="modal-window glass-panel"
        style={{ maxWidth: '920px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔌</span>
            <span>Fonte e Carregador Automotivo Smart Connect Usina 70A / 120A / 150A / 200A 12V Bivolt</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            &times;
          </button>
        </div>

        {/* Seletor Rápido de Modelo da Linha Usina Smart Connect */}
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '12px', color: '#f87171' }}>
              SELECIONE O MODELO DA FONTE USINA:
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Linha Smart Connect · Microcontrolada · Bivolt Automático (100V~250V)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {([70, 120, 150, 200] as const).map((rating) => {
              const spec = USINA_SPECS[rating];
              const isSelected = usinaCharger.modelRating === rating;
              return (
                <button
                  key={rating}
                  onClick={() => setUsinaModel(rating)}
                  style={{
                    background: isSelected ? 'rgba(239, 68, 68, 0.3)' : 'rgba(15, 23, 42, 0.6)',
                    border: `1.5px solid ${isSelected ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '6px',
                    padding: '8px 6px',
                    color: isSelected ? '#fff' : '#cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <strong style={{ fontSize: '14px', color: isSelected ? '#fca5a5' : '#fff' }}>
                      {rating}A
                    </strong>
                    {spec.recommended && (
                      <span
                        style={{
                          fontSize: '8px',
                          background: '#ef4444',
                          color: '#fff',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}
                      >
                        IDEAL
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 600 }}>
                    {spec.watts}W
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                    Carga {spec.chargeTime560Ah}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status rápido interativo de conexão AC (Shore Power) */}
        <div
          style={{
            background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.14)' : 'rgba(15, 23, 42, 0.6)',
            border: `1px solid ${usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.45)' : 'rgba(255, 255, 255, 0.1)'}`,
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
              <span style={{ fontSize: '18px' }}>{usinaCharger.isConnectedAC ? '⚡🔌' : '⛺'}</span>
              <span style={{ fontWeight: 700, color: usinaCharger.isConnectedAC ? '#f87171' : '#94a3b8' }}>
                Entrada Shore Power / Tomada Camping:{' '}
                {usinaCharger.isConnectedAC
                  ? `REDE ELÉTRICA CONECTADA (USINA ${usinaCharger.modelRating}A EM CARGA)`
                  : 'MODO OFF-GRID (TOMADA EXTERNA DESCONECTADA)'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
              {usinaCharger.isConnectedAC
                ? `Injetando ${usinaCharger.chargingAmps}A contínuos (${Math.round(usinaCharger.chargingAmps * usinaCharger.voltageOut)}W) na bateria Kingbo LiFePO4 560Ah!`
                : 'O sistema opera com o alternador da van (B2B 30A) e os painéis solares retráteis do teto.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn-compact ${usinaCharger.isConnectedAC ? 'active' : ''}`}
              onClick={toggleUsinaAC}
              style={{
                background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.25)',
                borderColor: usinaCharger.isConnectedAC ? '#ef4444' : '#22c55e',
                color: usinaCharger.isConnectedAC ? '#fca5a5' : '#86efac',
                fontWeight: 700,
                padding: '6px 14px'
              }}
            >
              {usinaCharger.isConnectedAC ? '🔌 Desconectar Tomada' : '⚡ Conectar Tomada (Shore Power)'}
            </button>
          </div>
        </div>

        {/* Ajuste de Amperagem e Voltagem da Usina */}
        {usinaCharger.isConnectedAC && (
          <div
            style={{
              background: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Corrente Ajustada de Saída (Amperímetro):</span>
                <strong style={{ color: '#ef4444' }}>{usinaCharger.chargingAmps} A</strong>
              </div>
              <input
                type="range"
                className="custom-slider"
                min="20"
                max={usinaCharger.modelRating}
                step="5"
                value={usinaCharger.chargingAmps}
                onChange={(e) => setUsinaAmps(parseFloat(e.target.value))}
              />
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>20A (Carga suave)</span>
                <span>{Math.round(usinaCharger.modelRating / 2)}A</span>
                <span>{usinaCharger.modelRating}A (Potência Total)</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ajuste Fino Smart Connect de Tensão:</span>
                <strong style={{ color: '#38bdf8' }}>{usinaCharger.voltageOut.toFixed(1)} V</strong>
              </div>
              <input
                type="range"
                className="custom-slider"
                min="12.5"
                max="14.4"
                step="0.1"
                value={usinaCharger.voltageOut}
                onChange={(e) => setUsinaVoltage(parseFloat(e.target.value))}
              />
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>12.5V (Flutuação)</span>
                <span>13.8V (Uso contínuo)</span>
                <span>14.4V (Absorção LiFePO4)</span>
              </div>
            </div>
          </div>
        )}

        <div className="blueprint-grid">
          {/* Coluna esquerda: Visão Geral */}
          <div className="blueprint-card">
            <h4>{currentSpec.label} — Visão Geral</h4>
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '14px',
                textAlign: 'center',
                marginBottom: '10px'
              }}
            >
              <div style={{ fontSize: '42px', marginBottom: '6px' }}>🔴⚡</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f87171' }}>
                Fonte Automotiva Usina Spark {currentSpec.rating}A Smart Connect
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {currentSpec.rating}A Reais Contínuos · {currentSpec.watts}W · Entrada 100V–250V Bivolt Automático
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              A linha <strong>Usina Smart Connect</strong> é o padrão automotivo de alta potência no Brasil. No motorhome Doblò,
              ela serve como <em>Shore Power Charger</em>: basta conectar um cabo externo padrão industrial na van e na tomada do
              camping/garagem para recarregar o banco LiFePO4 Kingbo 560Ah em <strong>{currentSpec.chargeTime560Ah}</strong>!
            </p>

            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
                ⭐ Recursos Tecnológicos da Linha Smart Connect:
              </div>
              <ul style={{ fontSize: '10.5px', color: 'var(--text-muted)', paddingLeft: '16px', lineHeight: 1.6 }}>
                <li><strong>Microcontrolador Integrado:</strong> Gerencia a rampa de absorção e estabiliza a flutuação precisa.</li>
                <li><strong>Display Digital Duplo LED:</strong> Exibe voltímetro (V) e amperímetro (A) em tempo real simultaneamente.</li>
                <li><strong>Smart Cooler:</strong> Ventilação com controle PWM dinâmico que acelera apenas sob alta demanda térmica.</li>
                <li><strong>Bivolt Automático Real:</strong> Aceita 100V a 250Vac automaticamente sem risco de queima por chave manual.</li>
                <li><strong>Alimentação Paralela de Cargas:</strong> Toca geladeira, climatizador, iluminação e inversor direto da tomada sem descarregar a bateria.</li>
              </ul>
            </div>
          </div>

          {/* Coluna direita: Tabela Comparativa de Todos os Modelos */}
          <div className="blueprint-card">
            <h4>Comparativo da Família Usina Smart Connect (12V Bivolt)</h4>
            <table className="bom-table" style={{ fontSize: '10px' }}>
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Potência</th>
                  <th>Consumo 127/220V</th>
                  <th>Bitola Cabo</th>
                  <th>Carga 560Ah</th>
                </tr>
              </thead>
              <tbody>
                {([70, 120, 150, 200] as const).map((r) => {
                  const item = USINA_SPECS[r];
                  const isCurrent = usinaCharger.modelRating === r;
                  return (
                    <tr
                      key={r}
                      style={{
                        background: isCurrent ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                        fontWeight: isCurrent ? 700 : 400
                      }}
                    >
                      <td style={{ color: isCurrent ? '#f87171' : '#fff' }}>
                        {item.rating}A {item.recommended ? '⭐' : ''}
                      </td>
                      <td>{item.watts} W</td>
                      <td>{item.amps127V}A / {item.amps220V}A</td>
                      <td>{item.cableGauge}</td>
                      <td><strong>{item.chargeTime560Ah}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                💡 Por que a Usina 150A é a mais equilibrada para este projeto?
              </div>
              <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                A bateria Kingbo de 560Ah possui taxa de recarga segura recomendada entre 0,2C e 0,3C (112A a 168A).
                A <strong>Usina 150A</strong> entrega taxa de ~0,27C (ideal para preservar ciclos de vida do LFP),
                garante recarga completa em apenas 3,7 horas e seu consumo em 220V (13A) é compatível com qualquer
                disjuntor comum de camping (16A a 20A) sem desarmar a rede externa.
              </p>
            </div>
          </div>
        </div>

        {/* Quadro comparativo de recarga das 3 fontes de energia */}
        <div className="blueprint-card" style={{ marginTop: '14px' }}>
          <h4>Matriz Energética da Doblò Motorhome: 3 Fontes de Recarga</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '8px' }}>
            <div
              style={{
                background: 'rgba(14, 165, 233, 0.08)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                borderRadius: '6px',
                padding: '10px'
              }}
            >
              <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '11px', marginBottom: '3px' }}>
                ☀️ 1. Solar MPPT Kingbo 60A
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>Até 60A / 720W</div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                Energia 100% autônoma e limpa. Mantém geladeira e iluminação sem custo durante expedições off-grid.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '6px',
                padding: '10px'
              }}
            >
              <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '11px', marginBottom: '3px' }}>
                🚗 2. Alternador B2B1230
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>30A / 390W</div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                Recarrega enquanto você viaja na estrada, independente de chuva, noite ou neblina.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '6px',
                padding: '10px'
              }}
            >
              <div style={{ color: '#f87171', fontWeight: 700, fontSize: '11px', marginBottom: '3px' }}>
                🔌 3. Usina {usinaCharger.modelRating}A Smart Connect
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>
                {usinaCharger.chargingAmps}A / {Math.round(usinaCharger.chargingAmps * usinaCharger.voltageOut)}W
              </div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                Carga rápida em tomada de camping/garagem. Enche o banco completo em {currentSpec.chargeTime560Ah}!
              </p>
            </div>
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
