import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';

export const LoadsModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    openModal,
    activeFridgePreset,
    appliances,
    loadsSummary,
    batteryPerformance,
    addAppliance,
    updateAppliance,
    removeAppliance,
    moveAppliance,
    reorderAppliances,
    resetAppliances
  } = useSolar();

  const [name, setName] = useState('');
  const [watts, setWatts] = useState('');
  const [hours, setHours] = useState('');
  const [qty, setQty] = useState('1');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  if (activeModal !== 'loads') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !watts || !hours) return;
    addAppliance(name.trim(), parseFloat(watts), parseFloat(hours), parseInt(qty) || 1);
    setName('');
    setWatts('');
    setHours('');
    setQty('1');
  };

  const applyPreset = (pName: string, pWatts: number, pHours: number, pQty: number = 1) => {
    addAppliance(pName, pWatts, pHours, pQty);
  };

  return (
    <div className="modal-overlay open" onClick={closeModal}>
      <div
        className="modal-window glass-panel"
        style={{ maxWidth: '960px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="modal-title">🔌 Calculadora & Editor de Consumo de Cargas (Motorhome Doblò)</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Insira o consumo (Watts), horas por dia e quantidade de cada equipamento · Bateria Kingbo LiFePO4 560Ah (7.168 Wh)
            </div>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            &times;
          </button>
        </div>

        {/* Resumo do Balanço Energético Diário em 4 Cartões */}
        <div className="loads-kpi-grid">
          <div className="loads-kpi-card">
            <div className="kpi-label">☀️ GERAÇÃO SOLAR ATUAL</div>
            <div className="kpi-value text-cyan" id="loads-kpi-solar">
              {batteryPerformance.dailyWhGenerated} Wh/dia
            </div>
            <div className="kpi-sub" id="loads-kpi-solar-sub">
              {batteryPerformance.dailyAhInjected} Ah/dia @ 12.8V
            </div>
          </div>
          <div className="loads-kpi-card">
            <div className="kpi-label">⚡ CONSUMO TOTAL DIÁRIO</div>
            <div className="kpi-value text-orange" id="loads-kpi-consumed">
              {loadsSummary.totalWh} Wh/dia
            </div>
            <div className="kpi-sub" id="loads-kpi-consumed-sub">
              {loadsSummary.totalAh} Ah/dia @ 12.8V
            </div>
          </div>
          <div className="loads-kpi-card">
            <div className="kpi-label">⚖️ BALANÇO ENERGÉTICO</div>
            <div
              className="kpi-value"
              id="loads-kpi-balance"
              style={{ color: batteryPerformance.isAutonomous ? '#10b981' : '#f59e0b' }}
            >
              {batteryPerformance.surplusWh >= 0 ? `+${batteryPerformance.surplusWh}` : batteryPerformance.surplusWh} Wh/dia
            </div>
            <div className="kpi-sub" id="loads-kpi-balance-sub">
              {batteryPerformance.isAutonomous ? '✅ 100% Autossustentável' : '⚠️ Déficit (Depende da Bateria)'}
            </div>
          </div>
          <div className="loads-kpi-card">
            <div className="kpi-label">🔋 AUTONOMIA NA CHUVA (SEM SOL)</div>
            <div className="kpi-value text-green" id="loads-kpi-autonomy">
              {batteryPerformance.daysRainAutonomy} dias
            </div>
            <div className="kpi-sub">Kingbo 560Ah (80% DoD = 5.734 Wh)</div>
          </div>
        </div>

        {/* Formulário de Inserção de Novo Equipamento */}
        <div className="loads-form-box">
          <div className="loads-form-title">➕ Adicionar Novo Equipamento / Carga Elétrica</div>
          <form onSubmit={handleSubmit} className="loads-form-grid">
            <div className="loads-form-group flex-2">
              <label htmlFor="input-load-name">Nome do Equipamento:</label>
              <input
                type="text"
                id="input-load-name"
                placeholder="Ex: Geladeira 12V, Starlink, TV..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="loads-form-group">
              <label htmlFor="input-load-watts">Consumo (Watts):</label>
              <input
                type="number"
                id="input-load-watts"
                min="0.1"
                max="5000"
                step="0.5"
                placeholder="Ex: 45"
                value={watts}
                onChange={(e) => setWatts(e.target.value)}
                required
              />
            </div>
            <div className="loads-form-group">
              <label htmlFor="input-load-hours">Horas / Dia (h):</label>
              <input
                type="number"
                id="input-load-hours"
                min="0.05"
                max="24"
                step="0.1"
                placeholder="Ex: 8.0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
              />
            </div>
            <div className="loads-form-group" style={{ maxWidth: '90px' }}>
              <label htmlFor="input-load-qty">Qtd (un):</label>
              <input
                type="number"
                id="input-load-qty"
                min="1"
                max="99"
                step="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
            </div>
            <div className="loads-form-group" style={{ alignSelf: 'flex-end' }}>
              <button type="submit" className="btn-add-load" id="btn-add-load">
                ➕ Inserir Item
              </button>
            </div>
          </form>

          {/* Presets Rápidos com 1 clique */}
          <div className="loads-presets-bar">
            <span className="presets-label">⚡ Presets rápidos:</span>
            <button
              type="button"
              className="preset-chip"
              style={{ background: 'rgba(2, 132, 199, 0.22)', borderColor: '#0284c7', color: '#38bdf8', fontWeight: 700 }}
              onClick={() => applyPreset(
                `${activeFridgePreset?.name || 'Geladeira Resfri Ar 35L'} (12V Compressor)`,
                activeFridgePreset?.ratedWatts || activeFridgePreset?.powerEcoWatts || 48,
                activeFridgePreset?.dailyHours || 9.6,
                1
              )}
              title="Adicionar carga da geladeira ativa configurada nos presets"
            >
              + ❄️ {activeFridgePreset?.model || 'Resfri Ar 35L'} ({activeFridgePreset?.powerEcoWatts || 48}W · {activeFridgePreset?.dailyHours || 9.6}h)
            </button>
            <button
              type="button"
              className="preset-chip"
              style={{ background: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.35)', color: '#7dd3fc' }}
              onClick={() => openModal('fridge-presets')}
              title="Ver catálogo de presets de geladeiras"
            >
              ⚙️ Geladeiras...
            </button>
            <button
              type="button"
              className="preset-chip"
              onClick={() => applyPreset('Starlink Mini', 25, 6, 1)}
            >
              + Starlink (25W · 6h)
            </button>
            <button
              type="button"
              className="preset-chip"
              onClick={() => applyPreset('Notebook 65W', 60, 5, 1)}
            >
              + Notebook (60W · 5h)
            </button>
            <button
              type="button"
              className="preset-chip"
              onClick={() => applyPreset('Climatizador 12V', 22, 8, 1)}
            >
              + Climatizador (22W · 8h)
            </button>
            <button
              type="button"
              className="preset-chip"
              onClick={() => applyPreset('TV LED 24 pol', 30, 3, 1)}
            >
              + TV 12V (30W · 3h)
            </button>
            <button
              type="button"
              className="preset-chip"
              onClick={() => applyPreset('Cafeteira (Inversor)', 600, 0.25, 1)}
            >
              + Cafeteira (600W · 15min)
            </button>
          </div>
        </div>

        {/* Tabela do Editor de Cargas */}
        <div className="loads-table-container">
          <table className="loads-table" id="loads-table">
            <thead>
              <tr>
                <th style={{ width: '58px', textAlign: 'center' }}>Ordem</th>
                <th style={{ width: '44px', textAlign: 'center' }}>Ativo</th>
                <th style={{ textAlign: 'left' }}>Nome do Equipamento</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Potência (W)</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Horas/dia (h)</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Qtd</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Consumo Diário</th>
                <th style={{ width: '50px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {appliances.map((app, index) => (
                <tr
                  key={app.id}
                  draggable
                  onDragStart={() => setDraggedIdx(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIdx(index);
                  }}
                  onDragLeave={() => {
                    if (dragOverIdx === index) setDragOverIdx(null);
                  }}
                  onDrop={() => {
                    if (draggedIdx !== null && draggedIdx !== index) {
                      reorderAppliances(draggedIdx, index);
                    }
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  onDragEnd={() => {
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  style={{
                    opacity: app.enabled ? 1 : 0.45,
                    background: dragOverIdx === index ? 'rgba(56, 189, 248, 0.14)' : undefined,
                    borderTop: dragOverIdx === index ? '2px solid #38bdf8' : undefined,
                    cursor: 'grab'
                  }}
                >
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <span
                        title="Arraste para reordenar"
                        style={{ color: '#64748b', cursor: 'grab', marginRight: '3px', fontSize: '12px' }}
                      >
                        ⠿
                      </span>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveAppliance(app.id, 'up')}
                        title="Mover para cima"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: index === 0 ? '#475569' : '#cbd5e1',
                          borderRadius: '4px',
                          padding: '1px 5px',
                          fontSize: '10px',
                          cursor: index === 0 ? 'default' : 'pointer'
                        }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={index === appliances.length - 1}
                        onClick={() => moveAppliance(app.id, 'down')}
                        title="Mover para baixo"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: index === appliances.length - 1 ? '#475569' : '#cbd5e1',
                          borderRadius: '4px',
                          padding: '1px 5px',
                          fontSize: '10px',
                          cursor: index === appliances.length - 1 ? 'default' : 'pointer'
                        }}
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={app.enabled}
                      onChange={(e) => updateAppliance(app.id, { enabled: e.target.checked })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={app.name}
                      onChange={(e) => updateAppliance(app.id, { name: e.target.value })}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        width: '100%',
                        fontWeight: 500
                      }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      value={app.watts}
                      onChange={(e) => updateAppliance(app.id, { watts: parseFloat(e.target.value) || 0 })}
                      style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'inherit',
                        width: '80px',
                        textAlign: 'center',
                        borderRadius: '4px',
                        padding: '2px 4px'
                      }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      value={app.hours}
                      step="0.5"
                      onChange={(e) => updateAppliance(app.id, { hours: parseFloat(e.target.value) || 0 })}
                      style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'inherit',
                        width: '70px',
                        textAlign: 'center',
                        borderRadius: '4px',
                        padding: '2px 4px'
                      }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      value={app.qty}
                      min="1"
                      onChange={(e) => updateAppliance(app.id, { qty: parseInt(e.target.value) || 1 })}
                      style={{
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'inherit',
                        width: '50px',
                        textAlign: 'center',
                        borderRadius: '4px',
                        padding: '2px 4px'
                      }}
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {app.whPerDay || Math.round(app.watts * app.hours * app.qty)} Wh/dia
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => removeAppliance(app.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '15px'
                      }}
                      title="Excluir equipamento"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="loads-total-row">
                <td colSpan={6} style={{ textAlign: 'right', fontWeight: 700, color: '#f1f5f9' }}>
                  TOTAL GERAL ATIVO:
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px'
                  }}
                  id="loads-table-total-val"
                >
                  {loadsSummary.totalWh} Wh/dia
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Rodapé de Ações do Modal */}
        <div
          className="modal-footer-actions"
          style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="icon-btn"
              onClick={resetAppliances}
              title="Restaura a lista recomendada de fábrica"
            >
              🔄 Restaurar Padrões de Fábrica
            </button>
          </div>
          <button type="button" className="icon-btn accent" onClick={closeModal}>
            ✅ Concluir e Atualizar Balanço
          </button>
        </div>
      </div>
    </div>
  );
};

