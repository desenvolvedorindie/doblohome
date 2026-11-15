import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { PortaPottiPreset } from '../../types';

function emptyPortaPottiForm(): Omit<PortaPottiPreset, 'id' | 'isDefault'> {
  return {
    name: '',
    brand: '',
    model: '',
    wasteCapacityLiters: 20,
    freshWaterCapacityLiters: 13,
    width: 404,
    depth: 353,
    height: 390,
    weightEmptyKg: 6.7,
    weightFullKg: 26.7,
    maxLoadKg: 200,
    material: 'Plástico ABS de alta resistência',
    hasSoftClose: true,
    flushType: 'Bomba de pistão manual (jato duplo 360°)',
    antiLeakValve: true,
    rotatingSpout: true,
    airReliefValve: true,
    levelIndicator: true,
    features: [
      'Tanque de resíduos/dejetos com capacidade de 20 Litros',
      'Tampa com fechamento suave Soft Close',
      'Válvula hermética dupla antivazamento e antiodor',
      'Bico de despejo rotativo com botão de respiro'
    ],
    description: ''
  };
}

export const PortaPottiPresetsModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    portaPottiPresets,
    activePortaPottiPreset,
    selectPortaPottiPreset,
    addPortaPottiPreset,
    updatePortaPottiPreset,
    removePortaPottiPreset,
    resetPortaPottiPresets
  } = useSolar();

  const [view, setView] = useState<'list' | 'new' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPortaPottiForm());
  const [featureInput, setFeatureInput] = useState('');

  if (activeModal !== 'portapotti-presets') return null;

  const handleClose = () => {
    setView('list');
    setEditingId(null);
    setForm(emptyPortaPottiForm());
    closeModal();
  };

  const startNew = () => {
    setForm(emptyPortaPottiForm());
    setEditingId(null);
    setView('new');
  };

  const startEdit = (p: PortaPottiPreset) => {
    setForm({ ...p } as any);
    setEditingId(p.id);
    setView('edit');
  };

  const handleSave = () => {
    if (!form.name || !form.width || !form.depth || !form.height) return;
    if (view === 'new') {
      addPortaPottiPreset(form);
    } else if (view === 'edit' && editingId) {
      updatePortaPottiPreset(editingId, form);
    }
    setView('list');
    setEditingId(null);
    setForm(emptyPortaPottiForm());
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
          border: '1px solid #0284c7',
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
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🚽</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                Presets de Sanitário Químico Portátil (Porta Potti)
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Selecione, personalize ou cadastre vasos sanitários químicos para verificar encaixe físico e peso na campervan
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
                    Total: <strong style={{ color: '#0284c7' }}>{portaPottiPresets.length} modelos</strong>
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>•</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Ativo: <strong style={{ color: '#38bdf8' }}>{activePortaPottiPreset.name}</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={startNew}
                    style={{
                      backgroundColor: '#0284c7',
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
                    onClick={resetPortaPottiPresets}
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

              {/* Grid de Presets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {portaPottiPresets.map((preset) => {
                  const isActive = preset.id === activePortaPottiPreset.id;
                  return (
                    <div
                      key={preset.id}
                      style={{
                        backgroundColor: isActive ? 'rgba(2, 132, 199, 0.12)' : '#1e293b',
                        border: `1.5px solid ${isActive ? '#0284c7' : '#334155'}`,
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                              {preset.name}
                            </h3>
                            {isActive && (
                              <span
                                style={{
                                  backgroundColor: '#0284c7',
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
                                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                  color: '#38bdf8',
                                  border: '1px solid rgba(56, 189, 248, 0.3)',
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
                              onClick={() => selectPortaPottiPreset(preset.id)}
                              style={{
                                backgroundColor: '#0284c7',
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
                              onClick={() => removePortaPottiPreset(preset.id)}
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
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                          gap: '8px',
                          backgroundColor: 'rgba(15, 23, 42, 0.6)',
                          padding: '10px',
                          borderRadius: '8px',
                          fontSize: '11.5px'
                        }}
                      >
                        <div>
                          <span style={{ color: '#64748b' }}>Dejetos: </span>
                          <strong style={{ color: '#0284c7' }}>{preset.wasteCapacityLiters}L</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Água Limpa: </span>
                          <strong style={{ color: '#38bdf8' }}>{preset.freshWaterCapacityLiters}L</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Dimensões: </span>
                          <strong style={{ color: '#e2e8f0' }}>{preset.width}L x {preset.depth}P x {preset.height}A mm</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Peso Vazio/Cheio: </span>
                          <strong style={{ color: '#fbbf24' }}>{preset.weightEmptyKg} kg / ~{preset.weightFullKg} kg</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Descarga: </span>
                          <strong style={{ color: '#cbd5e1' }}>{preset.flushType}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Suporta: </span>
                          <strong style={{ color: '#4ade80' }}>Até {preset.maxLoadKg} kg</strong>
                        </div>
                      </div>

                      {/* Badges de Recursos */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {preset.hasSoftClose && (
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
                            ✓ Soft Close (Fechamento Suave)
                          </span>
                        )}
                        {preset.antiLeakValve && (
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
                            ✓ Válvula Hermética Antivazamento
                          </span>
                        )}
                        {preset.rotatingSpout && (
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
                            ✓ Bico Rotativo Anti-respingos
                          </span>
                        )}
                        {preset.levelIndicator && (
                          <span
                            style={{
                              fontSize: '10px',
                              backgroundColor: 'rgba(99, 102, 241, 0.15)',
                              color: '#a5b4fc',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(99, 102, 241, 0.3)'
                            }}
                          >
                            ✓ Indicador de Nível
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
                <h3 style={{ margin: 0, fontSize: '15px', color: '#0284c7', fontWeight: 700 }}>
                  {view === 'new' ? 'Novo Preset de Sanitário Químico' : `Editar: ${form.name}`}
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
                    placeholder="Ex: Vaso Sanitário Seaflo 20L"
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
                    placeholder="Ex: Seaflo"
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
                    placeholder="Ex: SFPT-20-02"
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

              {/* Dimensões e Volumes */}
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
                    Tanque Dejetos (L)
                  </label>
                  <input
                    type="number"
                    value={form.wasteCapacityLiters}
                    onChange={(e) => setForm({ ...form, wasteCapacityLiters: Number(e.target.value) })}
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
                    Água Limpa (L)
                  </label>
                  <input
                    type="number"
                    value={form.freshWaterCapacityLiters}
                    onChange={(e) => setForm({ ...form, freshWaterCapacityLiters: Number(e.target.value) })}
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
                    Peso Vazio (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.weightEmptyKg}
                    onChange={(e) => setForm({ ...form, weightEmptyKg: Number(e.target.value) })}
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
                    checked={form.hasSoftClose}
                    onChange={(e) => setForm({ ...form, hasSoftClose: e.target.checked })}
                  />
                  Soft Close (Fechamento Suave)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.antiLeakValve}
                    onChange={(e) => setForm({ ...form, antiLeakValve: e.target.checked })}
                  />
                  Válvula Hermética Antivazamento
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.rotatingSpout}
                    onChange={(e) => setForm({ ...form, rotatingSpout: e.target.checked })}
                  />
                  Bico de Despejo Rotativo
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.levelIndicator}
                    onChange={(e) => setForm({ ...form, levelIndicator: e.target.checked })}
                  />
                  Indicador Visual de Nível
                </label>
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
                    backgroundColor: '#0284c7',
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
