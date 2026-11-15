import React from 'react';
import { StoveFormData } from './stoveFormDefaults';

interface StovePresetFormProps {
  mode: 'new' | 'edit';
  form: StoveFormData;
  setForm: React.Dispatch<React.SetStateAction<StoveFormData>>;
  featureInput: string;
  setFeatureInput: React.Dispatch<React.SetStateAction<string>>;
  onAddFeature: () => void;
  onRemoveFeature: (idx: number) => void;
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

export const StovePresetForm: React.FC<StovePresetFormProps> = ({
  mode,
  form,
  setForm,
  featureInput,
  setFeatureInput,
  onAddFeature,
  onRemoveFeature,
  onCancel,
  onSave
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: '#fb923c', fontWeight: 700 }}>
          {mode === 'new' ? 'Novo Preset de Fogareiro Portátil' : `Editar: ${form.name}`}
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
            placeholder="Ex: Fogareiro NTK Duo Ceramik"
            style={textInputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Marca *</label>
          <input
            type="text"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            placeholder="Ex: NTK (Nautika)"
            style={textInputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Modelo</label>
          <input
            type="text"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="Ex: Duo Ceramik"
            style={textInputStyle}
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
          <label style={smallLabelStyle}>Peso (kg)</label>
          <input
            type="number"
            step="0.1"
            value={form.weightKg}
            onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
            style={numInputStyle}
          />
        </div>
        <div>
          <label style={smallLabelStyle}>Consumo (g/h)</label>
          <input
            type="number"
            value={form.gasConsumptionGh}
            onChange={(e) => setForm({ ...form, gasConsumptionGh: Number(e.target.value) })}
            style={numInputStyle}
          />
        </div>
        <div>
          <label style={smallLabelStyle}>Qtd. Bocas</label>
          <input
            type="number"
            min={1}
            max={4}
            value={form.burnersCount}
            onChange={(e) => setForm({ ...form, burnersCount: Math.max(1, Number(e.target.value)) })}
            style={numInputStyle}
          />
        </div>
      </div>

      {/* Queimador, Combustível e Ignição */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Tipo de Queimador</label>
          <input
            type="text"
            value={form.burnerType}
            onChange={(e) => setForm({ ...form, burnerType: e.target.value })}
            style={textInputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Combustível</label>
          <input
            type="text"
            value={form.fuelType}
            onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
            style={textInputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Acendimento</label>
          <input
            type="text"
            value={form.ignitionType}
            onChange={(e) => setForm({ ...form, ignitionType: e.target.value })}
            style={textInputStyle}
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
            checked={form.dualFuelAdapter}
            onChange={(e) => setForm({ ...form, dualFuelAdapter: e.target.checked })}
          />
          Flex Fuel (Campgás + GLP)
        </label>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={form.windResistant}
            onChange={(e) => setForm({ ...form, windResistant: e.target.checked })}
          />
          Resistente ao Vento
        </label>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={form.hasCarryCase}
            onChange={(e) => setForm({ ...form, hasCarryCase: e.target.checked })}
          />
          Acompanha Maleta Plástica
        </label>
        <label style={checkboxLabelStyle}>
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
        <label style={labelStyle}>Diferenciais e Recursos</label>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <input
            type="text"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddFeature())}
            placeholder="Adicionar diferencial (ex: Base em enamel atóxico)"
            style={{ ...textInputStyle, flex: 1, padding: '6px 10px' }}
          />
          <button
            type="button"
            onClick={onAddFeature}
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
                onClick={() => onRemoveFeature(idx)}
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
  );
};
