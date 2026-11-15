import React from 'react';
import { StovePreset } from '../../../types';

interface StovePresetCardProps {
  preset: StovePreset;
  isActive: boolean;
  onSelect: (id: string) => void;
  onEdit: (preset: StovePreset) => void;
  onRemove: (id: string) => void;
}

export const StovePresetCard: React.FC<StovePresetCardProps> = ({
  preset,
  isActive,
  onSelect,
  onEdit,
  onRemove
}) => {
  return (
    <div
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
              onClick={() => onSelect(preset.id)}
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
            onClick={() => onEdit(preset)}
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
              onClick={() => onRemove(preset.id)}
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
};
