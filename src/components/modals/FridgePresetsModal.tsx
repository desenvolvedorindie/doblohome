import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { FridgePreset } from '../../types';

const emptyFridgeForm = (): Omit<FridgePreset, 'id' | 'isDefault'> => ({
  name: '',
  brand: 'Resfri Ar',
  model: '',
  partNumber: '',
  asin: '',
  volumeLiters: 35,
  canCapacity350ml: 46,
  canCapacity473ml: 38,
  width: 378,
  depth: 652,
  height: 386,
  weightKg: 13.5,
  voltage: '12/24 VDC | 110/220V (Com Fonte)',
  powerEcoWatts: 48,
  powerMaxWatts: 60,
  ratedWatts: 48,
  dutyCyclePercent: 40,
  dailyHours: 9.6,
  current12V: '4,05 ± 5,0 A',
  current24V: '2,03 ± 2,5 A',
  annualKWh: 300,
  tempRange: '+10°C a -21°C',
  refrigerantGas: 'R134a | 34g',
  insulation: 'CP (Ciclopentano)',
  bluetooth: true,
  bluetoothApp: 'App Resfri Ar Experience',
  digitalController: true,
  internalLed: true,
  tempSensor: true,
  batteryProtection: 'Alta / Baixa Ajustável',
  removableDivider: true,
  drainPlug: true,
  warranty: '1 Ano',
  features: [
    'Controlador Digital integrado',
    'Bluetooth para controle via App',
    'Iluminação interna em LED',
    'Divisória interna removível e dreno'
  ],
  description: ''
});

export const FridgePresetsModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    fridgePresets,
    activeFridgePreset,
    selectFridgePreset,
    addFridgePreset,
    updateFridgePreset,
    removeFridgePreset,
    resetFridgePresets
  } = useSolar();

  const [view, setView] = useState<'list' | 'new' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyFridgeForm());
  const [featureInput, setFeatureInput] = useState('');

  if (activeModal !== 'fridge-presets') return null;

  const handleClose = () => {
    setView('list');
    setEditingId(null);
    setForm(emptyFridgeForm());
    closeModal();
  };

  const startNew = () => {
    setForm(emptyFridgeForm());
    setEditingId(null);
    setView('new');
  };

  const startEdit = (p: FridgePreset) => {
    setForm({ ...p } as any);
    setEditingId(p.id);
    setView('edit');
  };

  const handleSave = () => {
    if (!form.name || !form.width || !form.depth || !form.height) return;
    if (view === 'new') {
      addFridgePreset(form);
    } else if (view === 'edit' && editingId) {
      updateFridgePreset(editingId, form);
    }
    setView('list');
    setEditingId(null);
    setForm(emptyFridgeForm());
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setForm(prev => ({
      ...prev,
      features: [...prev.features, featureInput.trim()]
    }));
    setFeatureInput('');
  };

  const removeFeature = (index: number) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const f = (field: keyof typeof form, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="modal-overlay open" onClick={handleClose}>
      <div
        className="modal-window glass-panel"
        style={{ maxWidth: '960px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>❄️</span>
              <span>Presets & Cadastro de Geladeiras 12V / 24V</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Catálogo oficial de refrigeradores portáteis veiculares para campervans • Resfri Ar, Alpicool, Elber
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {view === 'list' && (
              <button
                onClick={startNew}
                style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  color: '#38bdf8',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>+</span>
                <span>Nova Geladeira</span>
              </button>
            )}
            <button className="modal-close-btn" onClick={handleClose}>
              &times;
            </button>
          </div>
        </div>

        {/* ─── VISTA 1: LISTA DE PRESETS ─── */}
        {view === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            {/* Banner da Geladeira Ativa */}
            {activeFridgePreset && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(14, 165, 233, 0.15))',
                  border: '1px solid #0284c7',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: '4px' }}>
                      ✓ GELADEIRA ATIVA NO PROJETO
                    </span>
                    {activeFridgePreset.bluetooth && (
                      <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                        📱 Bluetooth {activeFridgePreset.bluetoothApp ? `(${activeFridgePreset.bluetoothApp})` : ''}
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: '6px 0 3px 0', fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                    {activeFridgePreset.name}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Marca: <strong style={{ color: '#cbd5e1' }}>{activeFridgePreset.brand}</strong> • Modelo: <strong style={{ color: '#cbd5e1' }}>{activeFridgePreset.model}</strong>
                    {activeFridgePreset.partNumber ? ` • Cód: ${activeFridgePreset.partNumber}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '6px 12px', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>VOLUME REAL</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{activeFridgePreset.volumeLiters} Litros</div>
                    {activeFridgePreset.canCapacity350ml && (
                      <div style={{ fontSize: '8px', color: '#64748b' }}>{activeFridgePreset.canCapacity350ml} latas</div>
                    )}
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '6px 12px', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>DIMENSÕES (L×P×A)</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24' }}>
                      {activeFridgePreset.width} × {activeFridgePreset.depth} × {activeFridgePreset.height} mm
                    </div>
                    <div style={{ fontSize: '8px', color: '#64748b' }}>{(activeFridgePreset.width/10).toFixed(1)} × {(activeFridgePreset.depth/10).toFixed(1)} × {(activeFridgePreset.height/10).toFixed(1)} cm</div>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '6px 12px', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>POTÊNCIA (12V/24V)</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
                      {activeFridgePreset.powerEcoWatts}W / {activeFridgePreset.powerMaxWatts}W
                    </div>
                    <div style={{ fontSize: '8px', color: '#64748b' }}>ECO • MAX</div>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '6px 12px', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>PESO PRÓPRIO</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>{activeFridgePreset.weightKg} kg</div>
                    <div style={{ fontSize: '8px', color: '#64748b' }}>Sem embalagem</div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid com Todos os Presets de Geladeira */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '12px' }}>
              {fridgePresets.map(p => {
                const isSelected = p.id === activeFridgePreset?.id;
                return (
                  <div
                    key={p.id}
                    style={{
                      background: isSelected ? 'rgba(2, 132, 199, 0.14)' : 'rgba(15, 23, 42, 0.75)',
                      border: isSelected ? '1.5px solid #0284c7' : '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      {/* Top badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '9.5px', fontWeight: 800, color: isSelected ? '#38bdf8' : '#94a3b8' }}>
                          {p.brand.toUpperCase()}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {p.bluetooth && (
                            <span style={{ fontSize: '8.5px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                              Bluetooth
                            </span>
                          )}
                          {isSelected && (
                            <span style={{ fontSize: '8.5px', background: '#0284c7', color: '#ffffff', padding: '1px 6px', borderRadius: '3px', fontWeight: 800 }}>
                              ✓ Ativa
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Título & Modelo */}
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
                        {p.name}
                      </div>

                      {/* Métricas Principais */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10.5px', marginBottom: '10px' }}>
                        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '5px 8px', borderRadius: '5px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '9px' }}>Volume: </span>
                          <strong style={{ color: '#38bdf8' }}>{p.volumeLiters} Litros</strong>
                        </div>
                        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '5px 8px', borderRadius: '5px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '9px' }}>Peso: </span>
                          <strong style={{ color: '#f8fafc' }}>{p.weightKg} kg</strong>
                        </div>
                        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '5px 8px', borderRadius: '5px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '9px' }}>Dimensões: </span>
                          <strong style={{ color: '#fbbf24' }}>{p.width}×{p.depth}×{p.height}mm</strong>
                        </div>
                        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '5px 8px', borderRadius: '5px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '9px' }}>Potência: </span>
                          <strong style={{ color: '#34d399' }}>{p.powerEcoWatts}W / {p.powerMaxWatts}W</strong>
                        </div>
                      </div>

                      {/* Faixa de Temp & Alimentação */}
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
                        <div>🌡️ Temp: <strong style={{ color: '#cbd5e1' }}>{p.tempRange}</strong></div>
                        <div>⚡ Tensão: <strong style={{ color: '#cbd5e1' }}>{p.voltage}</strong></div>
                        {p.canCapacity350ml && (
                          <div>🥤 Capacidade: <strong style={{ color: '#cbd5e1' }}>{p.canCapacity350ml} latas (350ml)</strong></div>
                        )}
                      </div>

                      {/* Descrição */}
                      <p style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.4, margin: '0 0 10px 0' }}>
                        {p.description}
                      </p>
                    </div>

                    {/* Botões de Ação */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '8px' }}>
                      <button
                        onClick={() => selectFridgePreset(p.id)}
                        disabled={isSelected}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          borderRadius: '5px',
                          border: isSelected ? '1px solid #0284c7' : '1px solid rgba(56, 189, 248, 0.4)',
                          background: isSelected ? '#0284c7' : 'rgba(56, 189, 248, 0.15)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: isSelected ? 'default' : 'pointer'
                        }}
                      >
                        {isSelected ? '✓ Selecionada' : 'Selecionar'}
                      </button>

                      <button
                        onClick={() => startEdit(p)}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '5px',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          background: 'rgba(30, 41, 59, 0.6)',
                          color: '#cbd5e1',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                        title="Editar especificações"
                      >
                        ✏️
                      </button>

                      {!p.isDefault && (
                        <button
                          onClick={() => removeFridgePreset(p.id)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '5px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                          title="Excluir preset personalizado"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodapé da Vista de Lista */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid rgba(148, 163, 184, 0.2)', paddingTop: '10px' }}>
              <button
                onClick={resetFridgePresets}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#94a3b8',
                  borderRadius: '5px',
                  padding: '4px 10px',
                  fontSize: '10.5px',
                  cursor: 'pointer'
                }}
              >
                🔄 Restaurar Padrões de Fábrica
              </button>

              <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                Total de Geladeiras Cadastradas: <strong style={{ color: '#cbd5e1' }}>{fridgePresets.length} modelos</strong>
              </div>
            </div>
          </div>
        )}

        {/* ─── VISTA 2: FORMULÁRIO DE CADASTRO / EDIÇÃO ─── */}
        {(view === 'new' || view === 'edit') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
                {view === 'new' ? '✨ Cadastrar Nova Geladeira 12V' : `✏️ Editar Geladeira: ${form.name}`}
              </h3>
              <button
                onClick={() => setView('list')}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}
              >
                ← Voltar para a lista
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', marginBottom: '3px' }}>
                  Nome de Exibição *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => f('name', e.target.value)}
                  placeholder="Ex: Geladeira Portátil Resfri Ar 35L"
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #38bdf8', borderRadius: '5px', padding: '6px 8px', color: '#f8fafc', fontSize: '11px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', marginBottom: '3px' }}>
                  Marca do Fabricante
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={e => f('brand', e.target.value)}
                  placeholder="Ex: Resfri Ar, Alpicool, Elber..."
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '6px 8px', color: '#f8fafc', fontSize: '11px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', marginBottom: '3px' }}>
                  Modelo / Linha
                </label>
                <input
                  type="text"
                  value={form.model}
                  onChange={e => f('model', e.target.value)}
                  placeholder="Ex: Portátil 35L"
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '6px 8px', color: '#f8fafc', fontSize: '11px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', marginBottom: '3px' }}>
                  Código da Peça / Part Number
                </label>
                <input
                  type="text"
                  value={form.partNumber || ''}
                  onChange={e => f('partNumber', e.target.value)}
                  placeholder="Ex: 307.0035"
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '6px 8px', color: '#f8fafc', fontSize: '11px' }}
                />
              </div>
            </div>

            {/* Dimensões Físicas */}
            <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', marginBottom: '8px' }}>
                📐 Dimensões Físicas Reais (Gabinete Externo)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                    Largura L (mm) *
                  </label>
                  <input
                    type="number"
                    value={form.width}
                    onChange={e => f('width', Number(e.target.value))}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '5px 8px', color: '#f8fafc', fontSize: '11px' }}
                  />
                  <span style={{ fontSize: '9px', color: '#64748b' }}>{(form.width/10).toFixed(1)} cm</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                    Profundidade P (mm) *
                  </label>
                  <input
                    type="number"
                    value={form.depth}
                    onChange={e => f('depth', Number(e.target.value))}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '5px 8px', color: '#f8fafc', fontSize: '11px' }}
                  />
                  <span style={{ fontSize: '9px', color: '#64748b' }}>{(form.depth/10).toFixed(1)} cm</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                    Altura A (mm) *
                  </label>
                  <input
                    type="number"
                    value={form.height}
                    onChange={e => f('height', Number(e.target.value))}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '5px 8px', color: '#f8fafc', fontSize: '11px' }}
                  />
                  <span style={{ fontSize: '9px', color: '#64748b' }}>{(form.height/10).toFixed(1)} cm</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                    Volume (Litros) *
                  </label>
                  <input
                    type="number"
                    value={form.volumeLiters}
                    onChange={e => f('volumeLiters', Number(e.target.value))}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '5px 8px', color: '#f8fafc', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                    Peso Próprio (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.weightKg}
                    onChange={e => f('weightKg', Number(e.target.value))}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '5px 8px', color: '#f8fafc', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                    Latas 350ml
                  </label>
                  <input
                    type="number"
                    value={form.canCapacity350ml || 0}
                    onChange={e => f('canCapacity350ml', Number(e.target.value))}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '5px 8px', color: '#f8fafc', fontSize: '11px' }}
                  />
                </div>
              </div>
            </div>

            {/* Elétrica & Potência */}
            <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>
                ⚡ Elétrica, Potência & Compressor 12V
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                    Potência ECO (Watts)
                  </label>
                  <input
                    type="number"
                    value={form.powerEcoWatts}
                    onChange={e => f('powerEcoWatts', Number(e.target.value))}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '5px 8px', color: '#f8fafc', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                    Potência MAX (Watts)
                  </label>
                  <input
                    type="number"
                    value={form.powerMaxWatts}
                    onChange={e => f('powerMaxWatts', Number(e.target.value))}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '5px 8px', color: '#f8fafc', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                    Tensão / Alimentação
                  </label>
                  <input
                    type="text"
                    value={form.voltage}
                    onChange={e => f('voltage', e.target.value)}
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '5px 8px', color: '#f8fafc', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                    Faixa de Temperatura
                  </label>
                  <input
                    type="text"
                    value={form.tempRange}
                    onChange={e => f('tempRange', e.target.value)}
                    placeholder="+10°C a -21°C"
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '5px 8px', color: '#f8fafc', fontSize: '11px' }}
                  />
                </div>
              </div>
            </div>

            {/* Conectividade & Recursos */}
            <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginBottom: '8px' }}>
                📱 Recursos & Conectividade
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '11px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.bluetooth} onChange={e => f('bluetooth', e.target.checked)} />
                  <span>Bluetooth Integrado</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.digitalController} onChange={e => f('digitalController', e.target.checked)} />
                  <span>Controlador Digital</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.internalLed} onChange={e => f('internalLed', e.target.checked)} />
                  <span>LED Interno</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.drainPlug} onChange={e => f('drainPlug', e.target.checked)} />
                  <span>Dreno de Limpeza</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.removableDivider} onChange={e => f('removableDivider', e.target.checked)} />
                  <span>Divisória Removível</span>
                </label>
              </div>

              {form.bluetooth && (
                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                    Nome do Aplicativo Smartphone
                  </label>
                  <input
                    type="text"
                    value={form.bluetoothApp || ''}
                    onChange={e => f('bluetoothApp', e.target.value)}
                    placeholder="Ex: App Resfri Ar Experience"
                    style={{ width: '100%', maxWidth: '300px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '5px 8px', color: '#f8fafc', fontSize: '11px' }}
                  />
                </div>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', marginBottom: '3px' }}>
                Descrição Detalhada & Aplicação no Campervan
              </label>
              <textarea
                value={form.description}
                onChange={e => f('description', e.target.value)}
                rows={3}
                placeholder="Observações sobre compatibilidade com gavetões, consumo real e conexões..."
                style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '5px', padding: '6px 8px', color: '#f8fafc', fontSize: '11px' }}
              />
            </div>

            {/* Botões do Formulário */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(148, 163, 184, 0.2)', paddingTop: '10px' }}>
              <button
                type="button"
                onClick={() => setView('list')}
                style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(148, 163, 184, 0.3)', background: 'transparent', color: '#cbd5e1', fontSize: '11px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #0284c7', background: '#0284c7', color: '#ffffff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                💾 Salvar Preset de Geladeira
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
