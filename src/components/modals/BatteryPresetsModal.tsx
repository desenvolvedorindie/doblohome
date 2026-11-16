import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { BatteryPreset } from '../../types';

interface BatteryFormData {
  name: string;
  brand: string;
  model: string;
  chemistry: string;
  voltageNominal: number;
  capacityAh: number;
  bmsAmps: number;
  dimensionsMm: { width: number; height: number; depth: number };
  weightKg: number;
  features: string[];
  description: string;
}

const emptyBatteryForm = (): BatteryFormData => ({
  name: '',
  brand: '',
  model: '',
  chemistry: 'LiFePO4',
  voltageNominal: 12.8,
  capacityAh: 100,
  bmsAmps: 100,
  dimensionsMm: { width: 0, height: 0, depth: 0 },
  weightKg: 0,
  features: [],
  description: ''
});

export const BatteryPresetsModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    batteryPresets,
    activeBatteryPreset,
    selectBatteryPreset,
    addBatteryPreset,
    updateBatteryPreset,
    removeBatteryPreset,
    resetBatteryPresets
  } = useSolar();

  const [view, setView] = useState<'list' | 'new' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BatteryFormData>(emptyBatteryForm());
  const [featureInput, setFeatureInput] = useState('');

  if (activeModal !== 'battery-presets') return null;

  const handleClose = () => {
    setView('list');
    setEditingId(null);
    setForm(emptyBatteryForm());
    closeModal();
  };

  const startNew = () => {
    setForm(emptyBatteryForm());
    setEditingId(null);
    setView('new');
  };

  const startEdit = (p: BatteryPreset) => {
    setForm({ ...p, features: p.features ?? [], description: p.description ?? '' } as BatteryFormData);
    setEditingId(p.id);
    setView('edit');
  };

  const handleSave = () => {
    if (!form.name || !form.brand || !form.model) return;
    if (view === 'new') {
      addBatteryPreset(form);
    } else if (view === 'edit' && editingId) {
      updateBatteryPreset(editingId, form);
    }
    setView('list');
    setEditingId(null);
    setForm(emptyBatteryForm());
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setForm(f => ({ ...f, features: [...f.features, featureInput.trim()] }));
    setFeatureInput('');
  };

  const removeFeature = (idx: number) => {
    setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
  };

  const inp = (label: string, value: any, onChange: (v: any) => void, type = 'text', options?: string[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{label}</label>
      {options ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', padding: '7px 10px', fontSize: '12px' }}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          style={{ background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', padding: '7px 10px', fontSize: '12px' }}
        />
      )}
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #22c55e',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.14) 0%, rgba(15,23,42,0.85) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🔋</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                Presets de Bateria LiFePO4 / AGM / GEL
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Selecione, personalize ou cadastre baterias para o sistema solar da campervan
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '4px' }}
            title="Fechar modal"
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {view === 'list' && (
            <>
              {/* Action bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Total: <strong style={{ color: '#4ade80' }}>{batteryPresets.length} modelos</strong>
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>•</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Ativo: <strong style={{ color: '#86efac' }}>{activeBatteryPreset?.name}</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={startNew}
                    style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>+</span> Nova Bateria
                  </button>
                  <button
                    onClick={resetBatteryPresets}
                    style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                    title="Restaurar lista original de fábrica"
                  >
                    🔄 Padrões
                  </button>
                </div>
              </div>

              {/* Preset Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {batteryPresets.map(p => {
                  const isActive = p.id === activeBatteryPreset?.id;
                  const whTotal = Math.round(p.capacityAh * p.voltageNominal);
                  return (
                    <div
                      key={p.id}
                      style={{
                        background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(15,23,42,0.6)',
                        border: `1px solid ${isActive ? '#22c55e' : '#1e293b'}`,
                        borderRadius: '10px',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '14px' }}>{p.name}</span>
                          {isActive && (
                            <span style={{ background: '#16a34a', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px' }}>
                              ✓ Ativo
                            </span>
                          )}
                          {p.isDefault && (
                            <span style={{ background: '#1e3a5f', color: '#7dd3fc', fontSize: '10px', padding: '2px 7px', borderRadius: '20px' }}>
                              Padrão
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {p.brand} · {p.model} · {p.chemistry}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span>⚡ {p.voltageNominal}V · {p.capacityAh}Ah · {whTotal > 999 ? (whTotal / 1000).toFixed(2) + ' kWh' : whTotal + ' Wh'}</span>
                          <span>🔌 BMS {p.bmsAmps}A</span>
                          <span>📐 {p.dimensionsMm.width}×{p.dimensionsMm.height}×{p.dimensionsMm.depth} mm</span>
                          <span>⚖️ {p.weightKg} kg</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          onClick={() => selectBatteryPreset(p.id)}
                          style={{
                            background: isActive ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.12)',
                            color: '#4ade80',
                            border: '1px solid #22c55e',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: isActive ? 700 : 400
                          }}
                        >
                          {isActive ? '✓ Usando' : 'Usar'}
                        </button>
                        {!p.isDefault && (
                          <>
                            <button
                              onClick={() => startEdit(p)}
                              style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid #0ea5e9', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => removeBatteryPreset(p.id)}
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid #ef4444', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Form */}
          {(view === 'new' || view === 'edit') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, color: '#4ade80', fontSize: '15px' }}>
                {view === 'new' ? '+ Cadastrar Nova Bateria' : '✏️ Editar Bateria'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {inp('Nome do Preset', form.name, v => setForm(f => ({ ...f, name: v })))}
                {inp('Marca', form.brand, v => setForm(f => ({ ...f, brand: v })))}
                {inp('Modelo', form.model, v => setForm(f => ({ ...f, model: v })))}
                {inp('Química', form.chemistry, v => setForm(f => ({ ...f, chemistry: v })), 'text', ['LiFePO4', 'AGM', 'GEL', 'Li-Ion'])}
                {inp('Tensão Nominal (V)', form.voltageNominal, v => setForm(f => ({ ...f, voltageNominal: v })), 'number')}
                {inp('Capacidade (Ah)', form.capacityAh, v => setForm(f => ({ ...f, capacityAh: v })), 'number')}
                {inp('Corrente BMS (A)', form.bmsAmps, v => setForm(f => ({ ...f, bmsAmps: v })), 'number')}
                {inp('Largura mm', form.dimensionsMm.width, v => setForm(f => ({ ...f, dimensionsMm: { ...f.dimensionsMm, width: v } })), 'number')}
                {inp('Altura mm', form.dimensionsMm.height, v => setForm(f => ({ ...f, dimensionsMm: { ...f.dimensionsMm, height: v } })), 'number')}
                {inp('Profundidade mm', form.dimensionsMm.depth, v => setForm(f => ({ ...f, dimensionsMm: { ...f.dimensionsMm, depth: v } })), 'number')}
                {inp('Peso (kg)', form.weightKg, v => setForm(f => ({ ...f, weightKg: v })), 'number')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Descrição</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  style={{ background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Features / Características</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    value={featureInput}
                    onChange={e => setFeatureInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addFeature()}
                    placeholder="Adicionar característica..."
                    style={{ flex: 1, background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '6px', padding: '7px 10px', fontSize: '12px' }}
                  />
                  <button onClick={addFeature} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>+</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  {form.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e293b', borderRadius: '5px', padding: '4px 8px', fontSize: '11px', color: '#cbd5e1' }}>
                      <span>• {f}</span>
                      <button onClick={() => removeFeature(i)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setView('list')}
                  style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {view === 'new' ? 'Cadastrar' : 'Salvar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
