import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { FridgePreset } from '../../types';
import { emptyFridgeForm, FridgeFormData } from './fridge-presets/fridgeFormDefaults';
import { ActiveFridgeBanner } from './fridge-presets/ActiveFridgeBanner';
import { FridgePresetCard } from './fridge-presets/FridgePresetCard';
import { FridgePresetForm } from './fridge-presets/FridgePresetForm';

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
  const [form, setForm] = useState<FridgeFormData>(emptyFridgeForm());

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

  const handleFieldChange = (field: keyof FridgeFormData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

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
            {activeFridgePreset && <ActiveFridgeBanner preset={activeFridgePreset} />}

            {/* Grid com Todos os Presets de Geladeira */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '12px' }}>
              {fridgePresets.map(p => (
                <FridgePresetCard
                  key={p.id}
                  preset={p}
                  isSelected={p.id === activeFridgePreset?.id}
                  onSelect={selectFridgePreset}
                  onEdit={startEdit}
                  onRemove={removeFridgePreset}
                />
              ))}
            </div>

            {/* Rodapé da Vista de Lista */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px',
                borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                paddingTop: '10px'
              }}
            >
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
          <FridgePresetForm
            mode={view}
            form={form}
            onChangeField={handleFieldChange}
            onCancel={() => setView('list')}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
};
