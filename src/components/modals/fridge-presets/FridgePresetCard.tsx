import React from 'react';
import { FridgePreset } from '../../../types';

interface FridgePresetCardProps {
  preset: FridgePreset;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (preset: FridgePreset) => void;
  onRemove: (id: string) => void;
}

export const FridgePresetCard: React.FC<FridgePresetCardProps> = ({
  preset: p,
  isSelected,
  onSelect,
  onEdit,
  onRemove
}) => {
  return (
    <div
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
              <span
                style={{
                  fontSize: '8.5px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontWeight: 700
                }}
              >
                Bluetooth
              </span>
            )}
            {isSelected && (
              <span
                style={{
                  fontSize: '8.5px',
                  background: '#0284c7',
                  color: '#ffffff',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  fontWeight: 800
                }}
              >
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
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginTop: '10px',
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          paddingTop: '8px'
        }}
      >
        <button
          onClick={() => onSelect(p.id)}
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
          onClick={() => onEdit(p)}
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
            onClick={() => onRemove(p.id)}
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
};
