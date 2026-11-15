import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { PortaPottiPreset } from '../../types';
import { emptyPortaPottiForm, PortaPottiFormData } from './porta-potti-presets/portaPottiFormDefaults';
import { PortaPottiPresetCard } from './porta-potti-presets/PortaPottiPresetCard';
import { PortaPottiPresetForm } from './porta-potti-presets/PortaPottiPresetForm';

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
  const [form, setForm] = useState<PortaPottiFormData>(emptyPortaPottiForm());

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
                {portaPottiPresets.map((preset) => (
                  <PortaPottiPresetCard
                    key={preset.id}
                    preset={preset}
                    isActive={preset.id === activePortaPottiPreset.id}
                    onSelect={selectPortaPottiPreset}
                    onEdit={startEdit}
                    onRemove={removePortaPottiPreset}
                  />
                ))}
              </div>
            </>
          )}

          {/* Formulário de Criação/Edição */}
          {(view === 'new' || view === 'edit') && (
            <PortaPottiPresetForm
              mode={view}
              form={form}
              setForm={setForm}
              onCancel={() => setView('list')}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </div>
  );
};
