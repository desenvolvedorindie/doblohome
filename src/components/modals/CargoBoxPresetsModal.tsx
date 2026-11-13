import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { CargoBoxPreset } from '../../types';

const emptyCargoForm = (): Omit<CargoBoxPreset, 'id' | 'isDefault'> => ({
  name: '',
  brand: 'Motobul',
  model: '',
  volumeLiters: 500,
  length: 1600,
  width: 1000,
  height: 330,
  weightKg: 18.0,
  maxLoadKg: 50,
  material: 'ABS Automotivo de Alto Impacto UV',
  color: 'Cinza Ardósia / Grafite',
  hingeSide: 'driver',
  features: [],
  description: ''
});

export const CargoBoxPresetsModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    cargoBoxPresets,
    activeCargoBoxPreset,
    selectCargoBoxPreset,
    addCargoBoxPreset,
    updateCargoBoxPreset,
    removeCargoBoxPreset
  } = useSolar();

  const [view, setView] = useState<'list' | 'new' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCargoForm());

  if (activeModal !== 'cargo-presets') return null;

  const handleClose = () => {
    setView('list');
    setEditingId(null);
    setForm(emptyCargoForm());
    closeModal();
  };

  const startNew = () => {
    setForm(emptyCargoForm());
    setEditingId(null);
    setView('new');
  };

  const startEdit = (p: CargoBoxPreset) => {
    setForm({ ...p } as any);
    setEditingId(p.id);
    setView('edit');
  };

  const handleSave = () => {
    if (!form.name || !form.length || !form.width || !form.height) return;
    if (view === 'new') {
      addCargoBoxPreset(form);
    } else if (view === 'edit' && editingId) {
      updateCargoBoxPreset(editingId, form);
    }
    setView('list');
    setEditingId(null);
    setForm(emptyCargoForm());
  };

  const f = (field: keyof typeof form, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="modal-overlay open" onClick={handleClose}>
      <div
        className="modal-window glass-panel"
        style={{ maxWidth: '860px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            🧰 Presets & Cadastro de Baús de Teto (Bagageiros)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {view === 'list' && (
              <button
                onClick={startNew}
                style={{
                  background: 'rgba(245, 158, 11, 0.18)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  color: '#fbbf24',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                + Cadastrar Novo Baú
              </button>
            )}
            {view !== 'list' && (
              <button
                onClick={() => { setView('list'); setForm(emptyCargoForm()); }}
                style={{
                  background: 'rgba(100, 116, 139, 0.15)',
                  border: '1px solid rgba(100, 116, 139, 0.4)',
                  color: '#94a3b8',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ← Voltar
              </button>
            )}
            <button className="modal-close-btn" onClick={handleClose}>&times;</button>
          </div>
        </div>

        {/* LISTAGEM DE PRESETS */}
        {view === 'list' && (
          <div style={{ padding: '0 4px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
              Selecione um modelo de baú de teto para atualizar automaticamente as medidas 3D do subchassi, torres de basculamento e amortecedores a gás, ou cadastre um baú personalizado.
            </p>
            <div style={{ display: 'grid', gap: '10px' }}>
              {cargoBoxPresets.map(p => {
                const isActive = p.id === activeCargoBoxPreset.id;
                const color = '#f59e0b';
                return (
                  <div
                    key={p.id}
                    onClick={() => selectCargoBoxPreset(p.id)}
                    style={{
                      background: isActive ? 'rgba(245, 158, 11, 0.10)' : 'rgba(15,23,42,0.5)',
                      border: `1px solid ${isActive ? color : 'rgba(100,116,139,0.25)'}`,
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 0 12px rgba(245, 158, 11, 0.25)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          {isActive && (
                            <span style={{
                              background: color,
                              color: '#000',
                              borderRadius: '4px',
                              padding: '1px 7px',
                              fontSize: '9.5px',
                              fontWeight: 800,
                              letterSpacing: '0.05em'
                            }}>✓ ATIVO</span>
                          )}
                          {p.isDefault && (
                            <span style={{
                              background: 'rgba(100,116,139,0.2)',
                              color: '#94a3b8',
                              borderRadius: '4px',
                              padding: '1px 7px',
                              fontSize: '9.5px',
                              fontWeight: 700
                            }}>PADRÃO</span>
                          )}
                          <span style={{ fontWeight: 800, fontSize: '13px', color: '#f8fafc' }}>
                            {p.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>
                            📦 {p.volumeLiters} Litros
                          </span>
                          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                            📐 {p.length} × {p.width} × {p.height} mm
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>⚖️ Peso: {p.weightKg} kg</span>
                          <span style={{ fontSize: '11px', color: '#10b981' }}>Carga útil: {p.maxLoadKg} kg</span>
                          {p.brand && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Marca: {p.brand}</span>}
                        </div>
                        {p.description && (
                          <p style={{ fontSize: '10.5px', color: '#64748b', lineHeight: 1.4, margin: 0 }}>
                            {p.description}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginTop: '2px' }}>
                        <button
                          onClick={e => { e.stopPropagation(); startEdit(p); }}
                          style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', color: '#3b82f6', borderRadius: '5px', padding: '4px 9px', fontSize: '11px', cursor: 'pointer' }}
                          title="Editar baú"
                        >✏️</button>
                        {!p.isDefault && (
                          <button
                            onClick={e => { e.stopPropagation(); removeCargoBoxPreset(p.id); }}
                            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', borderRadius: '5px', padding: '4px 9px', fontSize: '11px', cursor: 'pointer' }}
                            title="Remover baú"
                          >🗑️</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FORMULÁRIO: NOVO / EDITAR */}
        {(view === 'new' || view === 'edit') && (
          <div style={{ padding: '0 4px' }}>
            <h4 style={{ color: '#fbbf24', marginBottom: '14px', fontSize: '13px' }}>
              {view === 'new' ? '+ Cadastrar Novo Modelo de Baú de Teto' : '✏️ Editar Preset de Baú'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Nome do Baú *</label>
                <input
                  value={form.name}
                  onChange={e => f('name', e.target.value)}
                  placeholder="Ex: Baú de Teto Motobul Off Road 520L"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Marca</label>
                <input value={form.brand ?? ''} onChange={e => f('brand', e.target.value)} placeholder="Ex: Motobul, Thule, Jetbag" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Modelo / Linha</label>
                <input value={form.model ?? ''} onChange={e => f('model', e.target.value)} placeholder="Ex: Off Road 500L" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Comprimento (mm) * (1000 a 2100)</label>
                <input
                  type="number"
                  min={1000}
                  max={2100}
                  step={10}
                  value={form.length}
                  onChange={e => f('length', Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Largura (mm) * (700 a 1300)</label>
                <input
                  type="number"
                  min={700}
                  max={1300}
                  step={10}
                  value={form.width}
                  onChange={e => f('width', Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Altura (mm) * (200 a 500)</label>
                <input
                  type="number"
                  min={200}
                  max={500}
                  step={10}
                  value={form.height}
                  onChange={e => f('height', Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Capacidade / Volume (Litros) *</label>
                <input
                  type="number"
                  value={form.volumeLiters}
                  onChange={e => f('volumeLiters', Number(e.target.value))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Peso do Baú Vazio (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.weightKg}
                  onChange={e => f('weightKg', Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Carga Útil Máxima (kg)</label>
                <input
                  type="number"
                  value={form.maxLoadKg}
                  onChange={e => f('maxLoadKg', Number(e.target.value))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Material do Casco</label>
                <input value={form.material} onChange={e => f('material', e.target.value)} placeholder="Ex: ABS Automotivo UV" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Lado Padrão da Dobradiça</label>
                <select
                  value={form.hingeSide ?? 'driver'}
                  onChange={e => f('hingeSide', e.target.value as 'driver' | 'passenger')}
                  style={inputStyle}
                >
                  <option value="driver">Motorista (Abre para a Calçada)</option>
                  <option value="passenger">Passageiro (Abre para a Rua)</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Descrição / Observações (opcional)</label>
                <textarea
                  value={form.description ?? ''}
                  onChange={e => f('description', e.target.value)}
                  placeholder="Detalhes de fixação, formato aerodinâmico, bagagens compatíveis..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setView('list'); setForm(emptyCargoForm()); }} style={btnSecondary}>Cancelar</button>
              <button
                onClick={handleSave}
                disabled={!form.name || !form.length || !form.width || !form.height}
                style={{ ...btnPrimary, opacity: (!form.name || !form.length || !form.width || !form.height) ? 0.5 : 1 }}
              >
                {view === 'new' ? '+ Salvar Novo Baú' : '✔ Salvar Alterações'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  color: '#94a3b8',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '4px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(15,23,42,0.6)',
  border: '1px solid rgba(100,116,139,0.3)',
  borderRadius: '6px',
  padding: '7px 10px',
  color: '#f8fafc',
  fontSize: '12px',
  outline: 'none'
};

const btnPrimary: React.CSSProperties = {
  background: 'rgba(245,158,11,0.18)',
  border: '1px solid rgba(245,158,11,0.5)',
  color: '#fbbf24',
  borderRadius: '6px',
  padding: '7px 16px',
  fontSize: '12px',
  cursor: 'pointer',
  fontWeight: 700
};

const btnSecondary: React.CSSProperties = {
  background: 'rgba(100,116,139,0.12)',
  border: '1px solid rgba(100,116,139,0.3)',
  color: '#94a3b8',
  borderRadius: '6px',
  padding: '7px 16px',
  fontSize: '12px',
  cursor: 'pointer'
};

