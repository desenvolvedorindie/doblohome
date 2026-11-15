import React from 'react';
import { FridgePreset } from '../../../types';

interface ActiveFridgeBannerProps {
  preset: FridgePreset;
}

export const ActiveFridgeBanner: React.FC<ActiveFridgeBannerProps> = ({ preset }) => {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(14, 165, 233, 0.15))',
        border: '1px solid #0284c7',
        borderRadius: '10px',
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              background: '#0284c7',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '4px'
            }}
          >
            ✓ GELADEIRA ATIVA NO PROJETO
          </span>
          {preset.bluetooth && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(56, 189, 248, 0.4)'
              }}
            >
              📱 Bluetooth {preset.bluetoothApp ? `(${preset.bluetoothApp})` : ''}
            </span>
          )}
        </div>
        <h3 style={{ margin: '6px 0 3px 0', fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
          {preset.name}
        </h3>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          Marca: <strong style={{ color: '#cbd5e1' }}>{preset.brand}</strong> • Modelo:{' '}
          <strong style={{ color: '#cbd5e1' }}>{preset.model}</strong>
          {preset.partNumber ? ` • Cód: ${preset.partNumber}` : ''}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '6px 12px',
            borderRadius: '6px',
            textAlign: 'center',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}
        >
          <div style={{ fontSize: '9px', color: '#94a3b8' }}>VOLUME REAL</div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
            {preset.volumeLiters} Litros
          </div>
          {preset.canCapacity350ml && (
            <div style={{ fontSize: '8px', color: '#64748b' }}>{preset.canCapacity350ml} latas</div>
          )}
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '6px 12px',
            borderRadius: '6px',
            textAlign: 'center',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}
        >
          <div style={{ fontSize: '9px', color: '#94a3b8' }}>DIMENSÕES (L×P×A)</div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24' }}>
            {preset.width} × {preset.depth} × {preset.height} mm
          </div>
          <div style={{ fontSize: '8px', color: '#64748b' }}>
            {(preset.width / 10).toFixed(1)} × {(preset.depth / 10).toFixed(1)} ×{' '}
            {(preset.height / 10).toFixed(1)} cm
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '6px 12px',
            borderRadius: '6px',
            textAlign: 'center',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}
        >
          <div style={{ fontSize: '9px', color: '#94a3b8' }}>POTÊNCIA (12V/24V)</div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
            {preset.powerEcoWatts}W / {preset.powerMaxWatts}W
          </div>
          <div style={{ fontSize: '8px', color: '#64748b' }}>ECO • MAX</div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '6px 12px',
            borderRadius: '6px',
            textAlign: 'center',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}
        >
          <div style={{ fontSize: '9px', color: '#94a3b8' }}>PESO PRÓPRIO</div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>{preset.weightKg} kg</div>
          <div style={{ fontSize: '8px', color: '#64748b' }}>Sem embalagem</div>
        </div>
      </div>
    </div>
  );
};
