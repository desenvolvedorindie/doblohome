import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const MpptModal: React.FC = () => {
  const { activeModal, closeModal, openModal, activeMpptPreset } = useSolar();

  if (activeModal !== 'mppt') return null;

  const mppt = activeMpptPreset;
  const power12V = Math.round(mppt.maxAmps * 12.8);
  const power24V = Math.round(mppt.maxAmps * 25.6);

  return (
    <div className="modal-overlay open" onClick={closeModal}>
      <div
        className="modal-window glass-panel"
        style={{ maxWidth: '880px', maxHeight: '88vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span>
            <span>{mppt.name} ({mppt.maxAmps}A · Voc máx {mppt.maxPvVoltage}Vdc)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => openModal('mppt-presets')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(14, 165, 233, 0.16)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                padding: '5px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              ⚙️ Trocar / Cadastrar MPPTs
            </button>
            <button className="modal-close-btn" onClick={closeModal}>
              &times;
            </button>
          </div>
        </div>
        <div className="blueprint-grid">
          {/* Coluna esquerda: Imagem e descrição */}
          <div className="blueprint-card">
            <h4>{mppt.name} — Visão Geral</h4>
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
                {mppt.brand} · {mppt.model}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Modelo {mppt.maxAmps}A · {mppt.maxPvVoltage}Vdc FV máx
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {mppt.description || 'Controlador de carga solar com algoritmo MPPT ultra-rápido.'}
            </p>
            {mppt.features && mppt.features.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>Destaques:</div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {mppt.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Coluna direita: Especificações técnicas completas */}
          <div className="blueprint-card">
            <h4>Especificações Técnicas ({mppt.maxAmps}A)</h4>
            <table className="bom-table">
              <tbody>
                <tr>
                  <td><strong>Marca / Modelo:</strong></td>
                  <td>{mppt.brand} · {mppt.model}</td>
                </tr>
                <tr>
                  <td><strong>Corrente de carga nominal:</strong></td>
                  <td><strong>{mppt.maxAmps} A</strong></td>
                </tr>
                <tr>
                  <td><strong>Potência FV máx estimada (12V):</strong></td>
                  <td>~{power12V} W</td>
                </tr>
                <tr>
                  <td><strong>Potência FV máx estimada (24V):</strong></td>
                  <td>~{power24V} W</td>
                </tr>
                <tr>
                  <td><strong>Tensão FV entrada (Voc máx):</strong></td>
                  <td><strong>0 – {mppt.maxPvVoltage} Vdc</strong></td>
                </tr>
                <tr>
                  <td><strong>Tensão da bateria:</strong></td>
                  <td>12V / 24V (Auto)</td>
                </tr>
                <tr>
                  <td><strong>Dimensões (L × A × P):</strong></td>
                  <td>{mppt.dimensionsMm.width} × {mppt.dimensionsMm.height} × {mppt.dimensionsMm.depth} mm</td>
                </tr>
                <tr>
                  <td><strong>Peso líquido:</strong></td>
                  <td>{mppt.weightKg} kg</td>
                </tr>
                <tr>
                  <td><strong>Eficiência de rastreamento:</strong></td>
                  <td>≥ 99.5%</td>
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
                  <td><strong>Corrente máx MPPT:</strong></td>
                  <td>{mppt.maxAmps}A de injeção direta no barramento principal</td>
                </tr>
                <tr>
                  <td><strong>Limite de Tensão FV:</strong></td>
                  <td>Até {mppt.maxPvVoltage}Vdc (compatível com múltiplos painéis em série)</td>
                </tr>
                <tr>
                  <td><strong>Compatibilidade Química:</strong></td>
                  <td>LiFePO4, Chumbo-Ácido, AGM, Gel e baterias customizadas</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

