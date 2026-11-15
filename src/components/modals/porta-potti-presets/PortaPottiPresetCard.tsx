import React from 'react';
import { PortaPottiPreset } from '../../../types';

interface PortaPottiPresetCardProps {
  preset: PortaPottiPreset;
  isActive: boolean;
  onSelect: (id: string) => void;
  onEdit: (preset: PortaPottiPreset) => void;
  onRemove: (id: string) => void;
}

export const PortaPottiPresetCard: React.FC<PortaPottiPresetCardProps> = ({
  preset,
  isActive,
  onSelect,
  onEdit,
  onRemove
}) => {
  return (
    <div
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
              onClick={() => onSelect(preset.id)}
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
};
