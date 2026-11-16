import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const BatteryModal: React.FC = () => {
  const { activeModal, closeModal, openModal, activeBatteryPreset, batteryPerformance } = useSolar();

  if (activeModal !== 'battery') return null;

  const bat = activeBatteryPreset;
  const totalKwh = ((bat.capacityAh * bat.voltageNominal) / 1000).toFixed(3);
  const maxInverterW = Math.round(bat.bmsAmps * bat.voltageNominal * 0.95);

  return (
    <div className="modal-overlay open" onClick={closeModal}>
      <div className="modal-window glass-panel" style={{ maxWidth: '880px', maxHeight: '88vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔋</span>
            <span>{bat.name} ({bat.voltageNominal}V · {bat.capacityAh}Ah · {totalKwh} kWh)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => openModal('battery-presets')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(34, 197, 94, 0.16)',
                border: '1px solid #22c55e',
                color: '#4ade80',
                padding: '5px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              ⚙️ Trocar / Cadastrar Baterias
            </button>
            <button className="modal-close-btn" onClick={closeModal}>
              &times;
            </button>
          </div>
        </div>
        <div className="blueprint-grid">
          <div className="blueprint-card">
            <h4>{bat.name}</h4>
            {bat.brand.toLowerCase().includes('kingbo') ? (
              <img
                src="/assets/bateria_kingbo_560ah.jpg"
                alt={bat.name}
                style={{ borderRadius: '8px', maxWidth: '100%', marginBottom: '10px' }}
              />
            ) : (
              <div
                style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: '8px',
                  padding: '24px 14px',
                  textAlign: 'center',
                  marginBottom: '10px'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔋</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#4ade80' }}>
                  {bat.brand} · {bat.model}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Química: {bat.chemistry} · {bat.capacityAh}Ah @ {bat.voltageNominal}V
                </div>
              </div>
            )}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {bat.description || 'Banco de baterias de alta densidade energética para autonomia off-grid campervan.'}
            </p>
            {bat.features && bat.features.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>Destaques:</div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {bat.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="blueprint-card">
            <h4>Especificações Técnicas e Dimensionamento</h4>
            <table className="bom-table">
              <tbody>
                <tr>
                  <td><strong>Marca / Modelo:</strong></td>
                  <td>{bat.brand} · {bat.model}</td>
                </tr>
                <tr>
                  <td><strong>Química:</strong></td>
                  <td>{bat.chemistry}</td>
                </tr>
                <tr>
                  <td><strong>Tensão Nominal:</strong></td>
                  <td>{bat.voltageNominal}V (Bulk: 14.2V - 14.4V / Flutuação: 13.6V)</td>
                </tr>
                <tr>
                  <td><strong>Capacidade Nominal:</strong></td>
                  <td>{bat.capacityAh} Ah</td>
                </tr>
                <tr>
                  <td><strong>Energia Total Armazenada:</strong></td>
                  <td><strong>{totalKwh} kWh ({Math.round(bat.capacityAh * bat.voltageNominal)} Wh)</strong></td>
                </tr>
                <tr>
                  <td><strong>Corrente Máx. BMS (Descarga):</strong></td>
                  <td>{bat.bmsAmps}A contínuo (inversor de até ~{maxInverterW}W)</td>
                </tr>
                <tr>
                  <td><strong>Dimensões (L × A × P):</strong></td>
                  <td>{bat.dimensionsMm.width} × {bat.dimensionsMm.height} × {bat.dimensionsMm.depth} mm</td>
                </tr>
                <tr>
                  <td><strong>Peso:</strong></td>
                  <td>{bat.weightKg} kg</td>
                </tr>
                <tr>
                  <td><strong>Autonomia Estimada na Doblò:</strong></td>
                  <td><strong>{batteryPerformance.daysRainAutonomy} dias de chuva contínua sem sol</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

