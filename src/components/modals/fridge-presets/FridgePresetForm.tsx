import React from 'react';
import { FridgeFormData } from './fridgeFormDefaults';

interface FridgePresetFormProps {
  mode: 'new' | 'edit';
  form: FridgeFormData;
  onChangeField: (field: keyof FridgeFormData, value: any) => void;
  onCancel: () => void;
  onSave: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(15, 23, 42, 0.9)',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  borderRadius: '5px',
  padding: '5px 8px',
  color: '#f8fafc',
  fontSize: '11px'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  color: '#94a3b8',
  marginBottom: '2px'
};

const topLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10.5px',
  fontWeight: 700,
  color: '#94a3b8',
  marginBottom: '3px'
};

const sectionStyle: React.CSSProperties = {
  background: 'rgba(30, 41, 59, 0.4)',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid rgba(148, 163, 184, 0.2)'
};

export const FridgePresetForm: React.FC<FridgePresetFormProps> = ({
  mode,
  form,
  onChangeField: f,
  onCancel,
  onSave
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          paddingBottom: '8px'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
          {mode === 'new' ? '✨ Cadastrar Nova Geladeira 12V' : `✏️ Editar Geladeira: ${form.name}`}
        </h3>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          ← Voltar para a lista
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div>
          <label style={topLabelStyle}>Nome de Exibição *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => f('name', e.target.value)}
            placeholder="Ex: Geladeira Portátil Resfri Ar 35L"
            style={{ ...inputStyle, border: '1px solid #38bdf8', padding: '6px 8px' }}
          />
        </div>

        <div>
          <label style={topLabelStyle}>Marca do Fabricante</label>
          <input
            type="text"
            value={form.brand}
            onChange={e => f('brand', e.target.value)}
            placeholder="Ex: Resfri Ar, Alpicool, Elber..."
            style={{ ...inputStyle, padding: '6px 8px' }}
          />
        </div>

        <div>
          <label style={topLabelStyle}>Modelo / Linha</label>
          <input
            type="text"
            value={form.model}
            onChange={e => f('model', e.target.value)}
            placeholder="Ex: Portátil 35L"
            style={{ ...inputStyle, padding: '6px 8px' }}
          />
        </div>

        <div>
          <label style={topLabelStyle}>Código da Peça / Part Number</label>
          <input
            type="text"
            value={form.partNumber || ''}
            onChange={e => f('partNumber', e.target.value)}
            placeholder="Ex: 307.0035"
            style={{ ...inputStyle, padding: '6px 8px' }}
          />
        </div>
      </div>

      {/* Dimensões Físicas */}
      <div style={sectionStyle}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', marginBottom: '8px' }}>
          📐 Dimensões Físicas Reais (Gabinete Externo)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          <div>
            <label style={labelStyle}>Largura L (mm) *</label>
            <input
              type="number"
              value={form.width}
              onChange={e => f('width', Number(e.target.value))}
              style={inputStyle}
            />
            <span style={{ fontSize: '9px', color: '#64748b' }}>{(form.width / 10).toFixed(1)} cm</span>
          </div>

          <div>
            <label style={labelStyle}>Profundidade P (mm) *</label>
            <input
              type="number"
              value={form.depth}
              onChange={e => f('depth', Number(e.target.value))}
              style={inputStyle}
            />
            <span style={{ fontSize: '9px', color: '#64748b' }}>{(form.depth / 10).toFixed(1)} cm</span>
          </div>

          <div>
            <label style={labelStyle}>Altura A (mm) *</label>
            <input
              type="number"
              value={form.height}
              onChange={e => f('height', Number(e.target.value))}
              style={inputStyle}
            />
            <span style={{ fontSize: '9px', color: '#64748b' }}>{(form.height / 10).toFixed(1)} cm</span>
          </div>

          <div>
            <label style={labelStyle}>Volume (Litros) *</label>
            <input
              type="number"
              value={form.volumeLiters}
              onChange={e => f('volumeLiters', Number(e.target.value))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Peso Próprio (kg)</label>
            <input
              type="number"
              step="0.1"
              value={form.weightKg}
              onChange={e => f('weightKg', Number(e.target.value))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Latas 350ml</label>
            <input
              type="number"
              value={form.canCapacity350ml || 0}
              onChange={e => f('canCapacity350ml', Number(e.target.value))}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Elétrica & Potência */}
      <div style={sectionStyle}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>
          ⚡ Elétrica, Potência & Compressor 12V
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <div>
            <label style={labelStyle}>Potência ECO (Watts)</label>
            <input
              type="number"
              value={form.powerEcoWatts}
              onChange={e => f('powerEcoWatts', Number(e.target.value))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Potência MAX (Watts)</label>
            <input
              type="number"
              value={form.powerMaxWatts}
              onChange={e => f('powerMaxWatts', Number(e.target.value))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Tensão / Alimentação</label>
            <input
              type="text"
              value={form.voltage}
              onChange={e => f('voltage', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Faixa de Temperatura</label>
            <input
              type="text"
              value={form.tempRange}
              onChange={e => f('tempRange', e.target.value)}
              placeholder="+10°C a -21°C"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Conectividade & Recursos */}
      <div style={sectionStyle}>
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
            <label style={labelStyle}>Nome do Aplicativo Smartphone</label>
            <input
              type="text"
              value={form.bluetoothApp || ''}
              onChange={e => f('bluetoothApp', e.target.value)}
              placeholder="Ex: App Resfri Ar Experience"
              style={{ ...inputStyle, maxWidth: '300px' }}
            />
          </div>
        )}
      </div>

      {/* Descrição */}
      <div>
        <label style={topLabelStyle}>Descrição Detalhada & Aplicação no Campervan</label>
        <textarea
          value={form.description}
          onChange={e => f('description', e.target.value)}
          rows={3}
          placeholder="Observações sobre compatibilidade com gavetões, consumo real e conexões..."
          style={{ ...inputStyle, padding: '6px 8px' }}
        />
      </div>

      {/* Botões do Formulário */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          borderTop: '1px solid rgba(148, 163, 184, 0.2)',
          paddingTop: '10px'
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            background: 'transparent',
            color: '#cbd5e1',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          style={{
            padding: '6px 16px',
            borderRadius: '6px',
            border: '1px solid #0284c7',
            background: '#0284c7',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          💾 Salvar Preset de Geladeira
        </button>
      </div>
    </div>
  );
};
