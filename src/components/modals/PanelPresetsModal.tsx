import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { SolarPanelPreset } from '../../types';

const emptyForm = (): Omit<SolarPanelPreset, 'id' | 'isDefault'> => ({
  name: '',
  brand: '',
  model: '',
  powerWatts: 100,
  vmp: 18.0,
  imp: 5.56,
  voc: 22.0,
  isc: 6.0,
  efficiencyPercent: 22.3,
  cellType: 'Silício Monocristalino',
  material: 'ETFE',
  width: 0.590,
  length: 0.875,
  thickness: 0.003,
  weightKg: 1.8,
  connector: 'MC4',
  features: [],
  description: ''
});

export const PanelPresetsModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    panelPresets,
    activePanelPreset,
    selectPanelPreset,
    addPanelPreset,
    updatePanelPreset,
    removePanelPreset
  } = useSolar();

  const [view, setView] = useState<'list' | 'new' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  if (activeModal !== 'panel-presets') return null;

  const handleClose = () => {
    setView('list');
    setEditingId(null);
    setForm(emptyForm());
    closeModal();
  };

  const startNew = () => {
    setForm(emptyForm());
    setEditingId(null);
    setView('new');
  };

  const startEdit = (p: SolarPanelPreset) => {
    setForm({ ...p } as any);
    setEditingId(p.id);
    setView('edit');
  };

  const handleSave = () => {
    if (!form.name || !form.powerWatts) return;
    if (view === 'new') {
      addPanelPreset(form);
    } else if (view === 'edit' && editingId) {
      updatePanelPreset(editingId, form);
    }
    setView('list');
    setEditingId(null);
    setForm(emptyForm());
  };

  const f = (field: keyof typeof form, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const accentColors: Record<number, string> = {
    100: '#10b981',
    200: '#3b82f6',
  };
  const accent = (w: number) => accentColors[w] ?? '#f59e0b';

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
            ☀️ Presets de Placa Solar Flexível
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {view === 'list' && (
              <button
                onClick={startNew}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  color: '#10b981',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                + Novo Preset
              </button>
            )}
            {view !== 'list' && (
              <button
                onClick={() => { setView('list'); setForm(emptyForm()); }}
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
              Selecione uma placa para usar no sistema ou cadastre novos modelos.
              As placas padrão (Inohouse 100W e Flexível 200W) não podem ser removidas.
            </p>
            <div style={{ display: 'grid', gap: '10px' }}>
              {panelPresets.map(p => {
                const isActive = p.id === activePanelPreset.id;
                const color = accent(p.powerWatts);
                return (
                  <div
                    key={p.id}
                    onClick={() => selectPanelPreset(p.id)}
                    style={{
                      background: isActive ? `rgba(${hexToRgb(color)}, 0.10)` : 'rgba(15,23,42,0.5)',
                      border: `1px solid ${isActive ? color : 'rgba(100,116,139,0.25)'}`,
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? `0 0 12px ${color}30` : 'none'
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
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', color: color, fontWeight: 700 }}>{p.powerWatts}W</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {Math.round(p.width * 1000)} × {Math.round(p.length * 1000)} mm
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{p.weightKg} kg</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Voc {p.voc}V</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Vmp {p.vmp}V</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Imp {p.imp}A</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{p.efficiencyPercent}%</span>
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
                        >✏️</button>
                        {!p.isDefault && (
                          <button
                            onClick={e => { e.stopPropagation(); removePanelPreset(p.id); }}
                            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', borderRadius: '5px', padding: '4px 9px', fontSize: '11px', cursor: 'pointer' }}
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
            <h4 style={{ color: '#10b981', marginBottom: '14px', fontSize: '13px' }}>
              {view === 'new' ? '+ Cadastrar Nova Placa' : '✏️ Editar Preset'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

              {/* Nome */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Nome do Modelo *</label>
                <input
                  value={form.name}
                  onChange={e => f('name', e.target.value)}
                  placeholder="Ex: Placa Solar Flexível 150W Slim"
                  style={inputStyle}
                />
              </div>

              {/* Marca / Modelo */}
              <div>
                <label style={labelStyle}>Marca</label>
                <input value={form.brand ?? ''} onChange={e => f('brand', e.target.value)} placeholder="Ex: Inohouse" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Modelo (SKU)</label>
                <input value={form.model ?? ''} onChange={e => f('model', e.target.value)} placeholder="Ex: JTN-150W" style={inputStyle} />
              </div>

              {/* Dimensões físicas */}
              <div>
                <label style={labelStyle}>Largura (mm) *</label>
                <input type="number" value={Math.round(form.width * 1000)} onChange={e => f('width', Number(e.target.value) / 1000)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Comprimento (mm) *</label>
                <input type="number" value={Math.round(form.length * 1000)} onChange={e => f('length', Number(e.target.value) / 1000)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Espessura (mm)</label>
                <input type="number" step="0.5" value={Math.round(form.thickness * 1000)} onChange={e => f('thickness', Number(e.target.value) / 1000)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Peso (kg) *</label>
                <input type="number" step="0.1" value={form.weightKg} onChange={e => f('weightKg', Number(e.target.value))} style={inputStyle} />
              </div>

              {/* Dados elétricos */}
              <div>
                <label style={labelStyle}>Potência Nominal (W) *</label>
                <input type="number" value={form.powerWatts} onChange={e => f('powerWatts', Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Eficiência (%)</label>
                <input type="number" step="0.1" value={form.efficiencyPercent} onChange={e => f('efficiencyPercent', Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Voc — Tensão de Circuito Aberto (V)</label>
                <input type="number" step="0.01" value={form.voc} onChange={e => f('voc', Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Vmp — Tensão na Pot. Máxima (V)</label>
                <input type="number" step="0.01" value={form.vmp} onChange={e => f('vmp', Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Isc — Corrente de Curto-Circuito (A)</label>
                <input type="number" step="0.01" value={form.isc} onChange={e => f('isc', Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Imp — Corrente na Pot. Máxima (A)</label>
                <input type="number" step="0.01" value={form.imp} onChange={e => f('imp', Number(e.target.value))} style={inputStyle} />
              </div>

              {/* Tipo de célula / material */}
              <div>
                <label style={labelStyle}>Tipo de Célula</label>
                <input value={form.cellType} onChange={e => f('cellType', e.target.value)} placeholder="Ex: Silício Monocristalino" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Material / Encapsulante</label>
                <input value={form.material} onChange={e => f('material', e.target.value)} placeholder="Ex: ETFE, TPT, Polímero" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Número de Células</label>
                <input type="number" value={form.cellCount ?? ''} onChange={e => f('cellCount', e.target.value ? Number(e.target.value) : undefined)} placeholder="Ex: 32 ou 60" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Conector</label>
                <input value={form.connector ?? ''} onChange={e => f('connector', e.target.value)} placeholder="Ex: MC4, Anderson" style={inputStyle} />
              </div>

              {/* Descrição */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Descrição (opcional)</label>
                <textarea
                  value={form.description ?? ''}
                  onChange={e => f('description', e.target.value)}
                  placeholder="Descrição e aplicações recomendadas da placa..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setView('list'); setForm(emptyForm()); }} style={btnSecondary}>Cancelar</button>
              <button
                onClick={handleSave}
                disabled={!form.name || !form.powerWatts}
                style={{ ...btnPrimary, opacity: (!form.name || !form.powerWatts) ? 0.5 : 1 }}
              >
                {view === 'new' ? '+ Cadastrar Preset' : '✔ Salvar Alterações'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '100,116,139';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  color: '#64748b',
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
  background: 'rgba(16,185,129,0.15)',
  border: '1px solid rgba(16,185,129,0.5)',
  color: '#10b981',
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

