import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const BatteryModal: React.FC = () => {
  const { activeModal, closeModal } = useSolar();

  if (activeModal !== 'battery') return null;

  return (
    <div className="modal-overlay open" onClick={closeModal}>
      <div className="modal-window glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            🔋 Bateria Kingbo Power LiFePO4 MB12560 (12.8V 560Ah / 7.168 kWh)
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            &times;
          </button>
        </div>
        <div className="blueprint-grid">
          <div className="blueprint-card">
            <h4>Sua Bateria Kingbo Power Technology (12.8V 560Ah)</h4>
            <img
              src="/assets/bateria_kingbo_560ah.jpg"
              alt="Bateria Kingbo Power LiFePO4 560Ah"
              style={{ borderRadius: '8px', maxWidth: '100%', marginBottom: '10px' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Equipada com células prismáticas LiFePO4 Grau A, JK Smart BMS com display touch de 4.3" colorido e
              comunicação Bluetooth para celular.
            </p>
          </div>
          <div className="blueprint-card">
            <h4>Especificações Técnicas e Dimensionamento</h4>
            <table className="bom-table">
              <tbody>
                <tr>
                  <td><strong>Modelo:</strong></td>
                  <td>KINGBO MB12560</td>
                </tr>
                <tr>
                  <td><strong>Tensão Nominal:</strong></td>
                  <td>12.8V (Bulk: 14.2V - 14.4V / Flutuação: 13.6V)</td>
                </tr>
                <tr>
                  <td><strong>Capacidade Nominal:</strong></td>
                  <td>560 Ah</td>
                </tr>
                <tr>
                  <td><strong>Energia Total Armazenada:</strong></td>
                  <td><strong>7.168 kWh (7.168 Wh)</strong></td>
                </tr>
                <tr>
                  <td><strong>Corrente Máx. de Descarga:</strong></td>
                  <td>200A contínuo (inversor de até 2500W!)</td>
                </tr>
                <tr>
                  <td><strong>Ciclos de Vida Útil:</strong></td>
                  <td>≥ 9.000 Ciclos (&gt;20 anos de uso diário)</td>
                </tr>
                <tr>
                  <td><strong>Controlador MPPT Indicado:</strong></td>
                  <td><strong>Kingbo MPPT 60A</strong> · 230Vdc entrada FV · RS485+WiFi · 12–96V bat · η≥96.5%</td>
                </tr>
                <tr>
                  <td><strong>Autonomia Campervan na Doblò:</strong></td>
                  <td><strong>5.9 dias de chuva contínua sem sol!</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

