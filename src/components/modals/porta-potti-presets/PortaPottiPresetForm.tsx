import React from 'react';
import { PortaPottiFormData } from './portaPottiFormDefaults';

interface PortaPottiPresetFormProps {
  mode: 'new' | 'edit';
  form: PortaPottiFormData;
  setForm: React.Dispatch<React.SetStateAction<PortaPottiFormData>>;
  onCancel: () => void;
  onSave: () => void;
}

const textInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '6px',
  color: '#f8fafc',
  fontSize: '12px'
};

const numInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '4px',
  color: '#f8fafc',
  fontSize: '12px'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: '#94a3b8',
  marginBottom: '4px'
};

const smallLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10.5px',
  color: '#94a3b8',
  marginBottom: '3px'
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '12px',
  color: '#e2e8f0',
  cursor: 'pointer'
};

export const PortaPottiPresetForm: React.FC<PortaPottiPresetFormProps> = ({
  mode,
  form,
  setForm,
  onCancel,
  onSave
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: '#0284c7', fontWeight: 700 }}>
          {mode === 'new' ? 'Novo Preset de Sanitário Químico' : `Editar: ${form.name}`}
        </h3>
        <button
          onClick={onCancel}
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
          <label style={labelStyle}>Nome do Preset *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Vaso Sanitário Seaflo 20L"
            style={textInputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Marca *</label>
          <input
            type="text"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            placeholder="Ex: Seaflo"
            style={textInputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Modelo</label>
          <input
            type="text"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="Ex: SFPT-20-02"
            style={textInputStyle}
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
          <label style={smallLabelStyle}>Largura (mm) *</label>
          <input
            type="number"
            value={form.width}
            onChange={(e) => setForm({ ...form, width: Number(e.target.value) })}
            style={numInputStyle}
          />
        </div>
        <div>
          <label style={smallLabelStyle}>Profundidade (mm) *</label>
          <input
            type="number"
            value={form.depth}
            onChange={(e) => setForm({ ...form, depth: Number(e.target.value) })}
            style={numInputStyle}
          />
        </div>
        <div>
          <label style={smallLabelStyle}>Altura (mm) *</label>
          <input
            type="number"
            value={form.height}
            onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
            style={numInputStyle}
          />
        </div>
        <div>
          <label style={smallLabelStyle}>Tanque Dejetos (L)</label>
          <input
            type="number"
            value={form.wasteCapacityLiters}
            onChange={(e) => setForm({ ...form, wasteCapacityLiters: Number(e.target.value) })}
            style={numInputStyle}
          />
        </div>
        <div>
          <label style={smallLabelStyle}>Água Limpa (L)</label>
          <input
            type="number"
            value={form.freshWaterCapacityLiters}
            onChange={(e) => setForm({ ...form, freshWaterCapacityLiters: Number(e.target.value) })}
            style={numInputStyle}
          />
        </div>
        <div>
          <label style={smallLabelStyle}>Peso Vazio (kg)</label>
          <input
            type="number"
            step="0.1"
            value={form.weightEmptyKg}
            onChange={(e) => setForm({ ...form, weightEmptyKg: Number(e.target.value) })}
            style={numInputStyle}
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
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={form.hasSoftClose}
            onChange={(e) => setForm({ ...form, hasSoftClose: e.target.checked })}
          />
          Soft Close (Fechamento Suave)
        </label>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={form.antiLeakValve}
            onChange={(e) => setForm({ ...form, antiLeakValve: e.target.checked })}
          />
          Válvula Hermética Antivazamento
        </label>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={form.rotatingSpout}
            onChange={(e) => setForm({ ...form, rotatingSpout: e.target.checked })}
          />
          Bico de Despejo Rotativo
        </label>
        <label style={checkboxLabelStyle}>
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
        <label style={labelStyle}>Descrição / Notas Técnicas</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          placeholder="Informações adicionais, aplicação ou compatibilidade..."
          style={{ ...textInputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Botões do Formulário */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
        <button
          type="button"
          onClick={onCancel}
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
          onClick={onSave}
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
  );
};
