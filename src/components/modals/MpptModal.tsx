import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const MpptModal: React.FC = () => {
  const { activeModal, closeModal } = useSolar();

  if (activeModal !== 'mppt') return null;

  return (
    <div className="modal-overlay open" onClick={closeModal}>
      <div
        className="modal-window glass-panel"
        style={{ maxWidth: '860px', maxHeight: '88vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            ⚡ Controlador MPPT Kingbo 60A (230Vdc FV · RS485 + WiFi · 12V–96V)
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            &times;
          </button>
        </div>
        <div className="blueprint-grid">
          {/* Coluna esquerda: Imagem e descrição */}
          <div className="blueprint-card">
            <h4>Kingbo MPPT 60A — Visão Geral</h4>
            <div
              style={{
                background: 'rgba(14,165,233,0.08)',
                border: '1px solid rgba(14,165,233,0.25)',
                borderRadius: '8px',
                padding: '14px',
                textAlign: 'center',
                marginBottom: '10px'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚡</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                Kingbo MPPT Solar Charge Controller
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Modelo 60A · 230Vdc FV máx · 96V bateria
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Controlador de carga fotovoltaica de alta eficiência com algoritmo MPPT de rastreamento automático.
              Suporte a baterias de chumbo-ácido, gel, ferro-lítio (LiFePO4) e lítio ternário.
              Display LCD touch com exibição em português/inglês. Comunicação RS485 (8 pinos) e WiFi para
              monitoramento remoto em tempo real via smartphone.
            </p>
          </div>

          {/* Coluna direita: Especificações técnicas completas */}
          <div className="blueprint-card">
            <h4>Especificações Técnicas (Modelo 60A)</h4>
            <table className="bom-table">
              <tbody>
                <tr>
                  <td><strong>Corrente de carga nominal:</strong></td>
                  <td>60 A</td>
                </tr>
                <tr>
                  <td><strong>Potência FV máx (12V):</strong></td>
                  <td>720 W</td>
                </tr>
                <tr>
                  <td><strong>Potência FV máx (24V):</strong></td>
                  <td>1.400 W</td>
                </tr>
                <tr>
                  <td><strong>Tensão FV entrada (Voc máx):</strong></td>
                  <td>0 – 230 Vdc</td>
                </tr>
                <tr>
                  <td><strong>Tensão da bateria:</strong></td>
                  <td>12V / 24V / 36V / 48V / 72V / 84V / 96V (auto)</td>
                </tr>
                <tr>
                  <td><strong>Modo de carregamento:</strong></td>
                  <td>MPPT rastreamento + rápido + balanceado + flutuante</td>
                </tr>
                <tr>
                  <td><strong>Tipos de bateria:</strong></td>
                  <td>Chumbo-ácido · Gel · LiFePO4 · Lítio ternário · Usuário</td>
                </tr>
                <tr>
                  <td><strong>Compatibilidade LiFePO4:</strong></td>
                  <td>✅ Identificação automática (ideal para Kingbo 560Ah)</td>
                </tr>
                <tr>
                  <td><strong>Saída DC (carga direta):</strong></td>
                  <td>60 A contínuo</td>
                </tr>
                <tr>
                  <td><strong>Comunicação:</strong></td>
                  <td>RS485 (8 pinos) + WiFi monitor</td>
                </tr>
                <tr>
                  <td><strong>Eficiência geral:</strong></td>
                  <td><strong>96,5% – 99%</strong></td>
                </tr>
                <tr>
                  <td><strong>Consumo estático:</strong></td>
                  <td>2 W</td>
                </tr>
                <tr>
                  <td><strong>Temperatura de operação:</strong></td>
                  <td>−10°C a +45°C (proteção térmica a 85°C)</td>
                </tr>
                <tr>
                  <td><strong>Proteção mecânica:</strong></td>
                  <td>IP21</td>
                </tr>
                <tr>
                  <td><strong>Dimensões (60A):</strong></td>
                  <td>202 × 215 × 100 mm</td>
                </tr>
                <tr>
                  <td><strong>Peso líquido:</strong></td>
                  <td>1,95 kg</td>
                </tr>
                <tr>
                  <td><strong>Altitude máxima:</strong></td>
                  <td>0 – 3.000 m</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Segunda linha: Funções de proteção + Dimensionamento do sistema */}
        <div className="blueprint-grid" style={{ marginTop: '12px' }}>
          <div className="blueprint-card">
            <h4>🛡️ Funções de Proteção</h4>
            <ul style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: '16px' }}>
              <li>Curto-circuito do conjunto fotovoltaico</li>
              <li>Sobretensão de entrada FV</li>
              <li>Conexão reversa de sobrecorrente</li>
              <li>Sobrecarga da bateria</li>
              <li>Proteção de conexão reversa da bateria</li>
              <li>Proteção sob tensão (descarga profunda)</li>
              <li>Proteção térmica (desliga a 85°C, retoma a 80°C)</li>
            </ul>
          </div>
          <div className="blueprint-card">
            <h4>🔗 Integração com o Sistema Doblò</h4>
            <table className="bom-table">
              <tbody>
                <tr>
                  <td><strong>Painéis conectados:</strong></td>
                  <td>Até 8× 100W flexível (2× em série = 36,4V · 44,56V Voc)</td>
                </tr>
                <tr>
                  <td><strong>Configuração recomendada:</strong></td>
                  <td>2S×4P → Vmp ≈ 36,4V · Isc ≈ 23,2A → <strong>843W</strong></td>
                </tr>
                <tr>
                  <td><strong>Corrente MPPT no sistema:</strong></td>
                  <td>≈ 60A @ 12V (saturação plena a 8 painéis)</td>
                </tr>
                <tr>
                  <td><strong>Comunicação RS485:</strong></td>
                  <td>Conexão direta ao JK-BMS da bateria Kingbo 560Ah</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

