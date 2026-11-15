import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { StovePreset } from '../../types';

function emptyStoveForm(): Omit<StovePreset, 'id' | 'isDefault'> {
  return {
    name: '',
    brand: 'NTK (Nautika)',
    model: '',
    burnersCount: 1,
    burnerType: 'Cerâmica Infravermelho',
    fuelType: 'Flex Fuel (Cartucho Campgás 227g / Botijão GLP)',
    gasConsumptionGh: 145,
    ignitionType: 'Piezoelétrico Automático',
    width: 350,
    depth: 330,
    height: 90,
    weightKg: 2.2,
    material: 'Aço esmaltado com pintura epóxi e base em enamel atóxico',
    hasCarryCase: true,
    dualFuelAdapter: true,
    windResistant: true,
    safetyLock: true,
    features: [
      'Sistema Flex Fuel (Cartucho Campgás + Botijão GLP)',
      'Ignição automática por sistema Piezo',
      'Trava de segurança do fluxo de gás'
    ],
    description: ''
  };
}

export const StovePresetsModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    stovePresets,
    activeStovePreset,
    selectStovePreset,
    addStovePreset,
    updateStovePreset,
    removeStovePreset,
    resetStovePresets
  } = useSolar();

  const [view, setView] = useState<'list' | 'new' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyStoveForm());
  const [featureInput, setFeatureInput] = useState('');

  if (activeModal !== 'stove-presets') return null;

  const handleClose = () => {
    setView('list');
    setEditingId(null);
    setForm(emptyStoveForm());
    closeModal();
  };

  const startNew = () => {
    setForm(emptyStoveForm());
    setEditingId(null);
    setView('new');
  };

  const startEdit = (p: StovePreset) => {
    setForm({ ...p } as any);
    setEditingId(p.id);
    setView('edit');
  };

  const handleSave = () => {
    if (!form.name || !form.width || !form.depth || !form.height) return;
    if (view === 'new') {
      addStovePreset(form);
    } else if (view === 'edit' && editingId) {
      updateStovePreset(editingId, form);
    }
    setView('list');
    setEditingId(null);
    setForm(emptyStoveForm());
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setForm(f => ({ ...f, features: [...f.features, featureInput.trim()] }));
    setFeatureInput('');
  };

  const removeFeature = (idx: number) => {
    setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
          border: '1px solid #f97316',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.16) 0%, rgba(15, 23, 42, 0.85) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🔥</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                Presets de Fogareiros Portáteis (NTK Duo Ceramik)
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Selecione, personalize ou cadastre fogareiros a gás para instalar em gavetas, bandejas ou mesas da campervan
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '22px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px'
            }}
            title="Fechar modal"
          >
            ✕
          </button>
        </div>

        {/* Corpo do Modal */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {view === 'list' && (
            <>
              {/* Barra de Ações */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Total: <strong style={{ color: '#fb923c' }}>{stovePresets.length} modelos</strong>
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>•</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Ativo: <strong style={{ color: '#fdba74' }}>{activeStovePreset.name}</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={startNew}
                    style={{
                      backgroundColor: '#ea580c',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>+</span> Novo Preset
                  </button>
                  <button
                    onClick={resetStovePresets}
                    style={{
                      backgroundColor: '#1e293b',
                      color: '#94a3b8',
                      border: '1px solid #334155',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    title="Restaurar lista original de fábrica"
                  >
                    🔄 Padrões
                  </button>
                </div>
              </div>

              {/* Lista de Presets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stovePresets.map((preset) => {
                  const isActive = preset.id === activeStovePreset.id;
                  return (
                    <div
                      key={preset.id}
                      style={{
                        backgroundColor: isActive ? 'rgba(249, 115, 22, 0.12)' : '#1e293b',
                        border: `1.5px solid ${isActive ? '#f97316' : '#334155'}`,
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '12px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                              {preset.name}
                            </h3>
                            {isActive && (
                              <span
                                style={{
                                  backgroundColor: '#ea580c',
                                  color: '#ffffff',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '12px'
                                }}
                              >
                                EM USO
                              </span>
                            )}
                            {preset.isDefault && (
                              <span
                                style={{
                                  backgroundColor: 'rgba(249, 115, 22, 0.15)',
                                  color: '#fb923c',
                                  border: '1px solid rgba(249, 115, 22, 0.35)',
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '6px'
                                }}
                              >
                                FABRICANTE
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {preset.brand} • Modelo: {preset.model}
                          </div>
                        </div>

                        {/* Ações */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {!isActive && (
                            <button
                              onClick={() => selectStovePreset(preset.id)}
                              style={{
                                backgroundColor: '#ea580c',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Selecionar
                            </button>
                          )}
                          <button
                            onClick={() => startEdit(preset)}
                            style={{
                              backgroundColor: '#334155',
                              color: '#e2e8f0',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            Editar
                          </button>
                          {!preset.isDefault && (
                            <button
                              onClick={() => removeStovePreset(preset.id)}
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Grade de Especificações */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                          gap: '8px',
                          backgroundColor: 'rgba(15, 23, 42, 0.6)',
                          padding: '10px',
                          borderRadius: '8px',
                          fontSize: '11.5px'
                        }}
                      >
                        <div>
                          <span style={{ color: '#64748b' }}>Queimador: </span>
                          <strong style={{ color: '#fb923c' }}>{preset.burnerType}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Consumo: </span>
                          <strong style={{ color: '#fbbf24' }}>{preset.gasConsumptionGh} g/h</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Dimensões: </span>
                          <strong style={{ color: '#e2e8f0' }}>{preset.width}L × {preset.depth}P × {preset.height}A mm</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Peso: </span>
                          <strong style={{ color: '#38bdf8' }}>{preset.weightKg} kg</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Combustível: </span>
                          <strong style={{ color: '#cbd5e1' }}>{preset.fuelType}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Acendimento: </span>
                          <strong style={{ color: '#4ade80' }}>{preset.ignitionType}</strong>
                        </div>
                      </div>

                      {/* Badges de Recursos */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {preset.dualFuelAdapter && (
                          <span
                            style={{
                              fontSize: '10px',
                              backgroundColor: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(56, 189, 248, 0.3)'
                            }}
                          >
                            ✓ Flex Fuel (Campgás + GLP)
                          </span>
                        )}
                        {preset.windResistant && (
                          <span
                            style={{
                              fontSize: '10px',
                              backgroundColor: 'rgba(249, 115, 22, 0.15)',
                              color: '#fb923c',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(249, 115, 22, 0.3)'
                            }}
                          >
                            ✓ Resistente ao Vento
                          </span>
                        )}
                        {preset.hasCarryCase && (
                          <span
                            style={{
                              fontSize: '10px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            ✓ Maleta de Transporte
                          </span>
                        )}
                        {preset.safetyLock && (
                          <span
                            style={{
                              fontSize: '10px',
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              color: '#fbbf24',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(245, 158, 11, 0.3)'
                            }}
                          >
                            ✓ Trava de Segurança
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                        {preset.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Formulário de Criação/Edição */}
          {(view === 'new' || view === 'edit') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#fb923c', fontWeight: 700 }}>
                  {view === 'new' ? 'Novo Preset de Fogareiro Portátil' : `Editar: ${form.name}`}
                </h3>
                <button
                  onClick={() => setView('list')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ← Voltar para a lista
                </button>
              </div>

              {/* Campos Principais */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    Nome do Preset *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Fogareiro NTK Duo Ceramik"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    Marca *
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="Ex: NTK (Nautika)"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="Ex: Duo Ceramik"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              {/* Dimensões e Especificações */}
              <div
                style={{
                  backgroundColor: '#1e293b',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '10px'
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>
                    Largura (mm) *
                  </label>
                  <input
                    type="number"
                    value={form.width}
                    onChange={(e) => setForm({ ...form, width: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>
                    Profundidade (mm) *
                  </label>
                  <input
                    type="number"
                    value={form.depth}
                    onChange={(e) => setForm({ ...form, depth: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>
                    Altura (mm) *
                  </label>
                  <input
                    type="number"
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.weightKg}
                    onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>
                    Consumo (g/h)
                  </label>
                  <input
                    type="number"
                    value={form.gasConsumptionGh}
                    onChange={(e) => setForm({ ...form, gasConsumptionGh: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>
                    Qtd. Bocas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={form.burnersCount}
                    onChange={(e) => setForm({ ...form, burnersCount: Math.max(1, Number(e.target.value)) })}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              {/* Queimador, Combustível e Ignição */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    Tipo de Queimador
                  </label>
                  <input
                    type="text"
                    value={form.burnerType}
                    onChange={(e) => setForm({ ...form, burnerType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    Combustível
                  </label>
                  <input
                    type="text"
                    value={form.fuelType}
                    onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    Acendimento
                  </label>
                  <input
                    type="text"
                    value={form.ignitionType}
                    onChange={(e) => setForm({ ...form, ignitionType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              {/* Checkboxes de Recursos */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '8px',
                  backgroundColor: '#1e293b',
                  padding: '12px',
                  borderRadius: '8px'
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.dualFuelAdapter}
                    onChange={(e) => setForm({ ...form, dualFuelAdapter: e.target.checked })}
                  />
                  Flex Fuel (Campgás + GLP)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.windResistant}
                    onChange={(e) => setForm({ ...form, windResistant: e.target.checked })}
                  />
                  Resistente ao Vento
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.hasCarryCase}
                    onChange={(e) => setForm({ ...form, hasCarryCase: e.target.checked })}
                  />
                  Acompanha Maleta Plástica
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.safetyLock}
                    onChange={(e) => setForm({ ...form, safetyLock: e.target.checked })}
                  />
                  Trava de Segurança
                </label>
              </div>

              {/* Diferenciais / Features */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  Diferenciais e Recursos
                </label>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    placeholder="Adicionar diferencial (ex: Base em enamel atóxico)"
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    style={{
                      backgroundColor: '#334155',
                      color: '#f8fafc',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    + Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {form.features.map((feat, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        color: '#cbd5e1',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {feat}
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '12px'
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  Descrição / Notas Técnicas
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Informações adicionais, aplicação ou compatibilidade..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Botões do Formulário */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  style={{
                    backgroundColor: '#334155',
                    color: '#cbd5e1',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    backgroundColor: '#ea580c',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Salvar Preset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
