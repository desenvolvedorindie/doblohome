import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const B2bModal: React.FC = () => {
  const { activeModal, closeModal, b2bCharger, toggleB2BEngine, setB2BEnabled } = useSolar();

  if (activeModal !== 'b2b') return null;

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
            <span>Carregador Inteligente DC-DC B2B1230 (12V 30A · Bluetooth · Alternador Doblò)</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            &times;
          </button>
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

        <div className="blueprint-grid">
          {/* Coluna esquerda: Visão Geral e Bluetooth */}
          <div className="blueprint-card">
            <h4>B2B1230 — Visão Geral do Sistema</h4>
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
                Carregador DC-DC B2B 12V 30A com Bluetooth
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Modelo B2B1230 · Entrada Alternador 12V · Saída LiFePO4 14.4V · 390W
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              O <strong>Carregador DC-DC B2B1230</strong> é o elo vital entre o alternador original da Fiat Doblò e a
              bateria de serviço <strong>Kingbo LiFePO4 de 560Ah</strong>. Ele estabiliza e eleva a tensão do alternador,
              aplicando a curva de carga inteligente de 4 estágios recomendada para química LiFePO4.
            </p>

            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                📶 Conectividade Bluetooth & App Smartphone:
              </div>
              <ul style={{ fontSize: '10.5px', color: 'var(--text-muted)', paddingLeft: '16px', lineHeight: 1.6 }}>
                <li>Visualização em tempo real da tensão do alternador da van (V)</li>
                <li>Monitoramento da tensão e corrente de carga na bateria LiFePO4 (A / W)</li>
                <li>Leitura da temperatura do dissipador interno do B2B</li>
                <li>Ajuste do tipo de bateria (LiFePO4, AGM, Gel, Chumbo)</li>
                <li>Histórico de energia recarregada durante as viagens</li>
              </ul>
            </div>
          </div>

          {/* Coluna direita: Especificações Técnicas */}
          <div className="blueprint-card">
            <h4>Especificações Técnicas (Modelo B2B1230)</h4>
            <table className="bom-table">
              <tbody>
                <tr>
                  <td><strong>Tensão de Entrada (Alternador):</strong></td>
                  <td>10,5 V – 16,0 Vdc (compatível com Doblò)</td>
                </tr>
                <tr>
                  <td><strong>Corrente Máx. de Carga:</strong></td>
                  <td><strong>30 A contínuos</strong></td>
                </tr>
                <tr>
                  <td><strong>Potência Nominal de Saída:</strong></td>
                  <td>~390 W a 432 W (@ 14.4V)</td>
                </tr>
                <tr>
                  <td><strong>Tensão de Absorção (LiFePO4):</strong></td>
                  <td>14,4 V (ajustável via Bluetooth)</td>
                </tr>
                <tr>
                  <td><strong>Tensão de Flutuação (Float):</strong></td>
                  <td>13,8 V</td>
                </tr>
                <tr>
                  <td><strong>Eficiência de Conversão:</strong></td>
                  <td>&ge; 92%</td>
                </tr>
                <tr>
                  <td><strong>Sinal de Controle D+ (Ignição):</strong></td>
                  <td>Sim (detecção automática de motor ligado)</td>
                </tr>
                <tr>
                  <td><strong>Corte por Subtensão do Veículo:</strong></td>
                  <td>Desliga se bateria de partida &lt; 12,0 V</td>
                </tr>
                <tr>
                  <td><strong>Comunicação Sem Fio:</strong></td>
                  <td>Bluetooth 5.0 LE integrado</td>
                </tr>
                <tr>
                  <td><strong>Refrigeração:</strong></td>
                  <td>Dissipador de alumínio + Aletas de resfriamento</td>
                </tr>
                <tr>
                  <td><strong>Dimensões:</strong></td>
                  <td>190 &times; 130 &times; 58 mm</td>
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

