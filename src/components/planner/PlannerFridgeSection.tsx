import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem } from '../../types';

interface PlannerFridgeSectionProps {
  selectedBox: InternalBoxItem;
  boxWMm: number;
  boxLMm: number;
}

export const PlannerFridgeSection: React.FC<PlannerFridgeSectionProps> = ({
  selectedBox,
  boxWMm,
  boxLMm
}) => {
  const {
    updateInternalBox,
    fridgePresets,
    activeFridgePresetId,
    openModal
  } = useSolar();

  const isFridgeActive = !!selectedBox.hasFridge;
  const currentPresetId = selectedBox.fridgePresetId || activeFridgePresetId || fridgePresets[0]?.id;
  const selectedPreset = fridgePresets.find(p => p.id === currentPresetId) || fridgePresets[0];

  // Verificação dimensional
  const boxHMm = selectedBox.heightMm;
  const reqW = selectedPreset ? selectedPreset.width : 378;
  const reqD = selectedPreset ? selectedPreset.depth : 652;
  const reqH = selectedPreset ? selectedPreset.height : 386;

  const clearanceW = boxWMm - reqW;
  const clearanceD = boxLMm - reqD;
  const clearanceH = boxHMm - reqH;

  const fitsW = clearanceW >= 0;
  const fitsD = clearanceD >= 0;
  const fitsH = clearanceH >= 0;
  const fitsAll = fitsW && fitsD && fitsH;

  return (
    <div
      style={{
        marginTop: '12px',
        padding: '12px',
        background: isFridgeActive
          ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.16), rgba(14, 165, 233, 0.08))'
          : 'rgba(30, 41, 59, 0.45)',
        border: isFridgeActive
          ? '1px solid rgba(6, 182, 212, 0.55)'
          : '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '8px',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: isFridgeActive ? '10px' : '0', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: isFridgeActive ? '#38bdf8' : '#e2e8f0' }}>
              ❄️ Geladeira 12V / 24V Embarcada
            </span>
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: 800,
                color: isFridgeActive ? '#0284c7' : '#94a3b8',
                background: isFridgeActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(148, 163, 184, 0.15)',
                border: isFridgeActive ? '1px solid #38bdf8' : 'none',
                padding: '1px 6px',
                borderRadius: '4px'
              }}
            >
              {isFridgeActive ? 'INSTALADA NO MÓDULO' : 'SEM GELADEIRA'}
            </span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
            Instala um modelo 3D realista da geladeira portátil no interior deste módulo (gaveta corrediça, bandeja rasa ou baú), com validação das dimensões e folgas técnicas de respiro.
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const willEnable = !isFridgeActive;
            updateInternalBox(selectedBox.id, {
              hasFridge: willEnable,
              fridgePresetId: willEnable ? currentPresetId : undefined
            });
          }}
          className="btn-compact"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '5px 12px',
            background: isFridgeActive ? '#0284c7' : 'rgba(56, 189, 248, 0.2)',
            color: isFridgeActive ? '#ffffff' : '#38bdf8',
            border: '1px solid #38bdf8',
            borderRadius: '6px'
          }}
        >
          {isFridgeActive ? '✓ Desinstalar' : '+ Instalar Geladeira'}
        </button>
      </div>

      {isFridgeActive && selectedPreset && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Seletor do Preset de Geladeira */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                Preset de Geladeira:
              </label>
              <select
                value={selectedPreset.id}
                onChange={(e) => {
                  updateInternalBox(selectedBox.id, {
                    fridgePresetId: e.target.value
                  });
                }}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  color: '#ffffff',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600
                }}
              >
                {fridgePresets.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} ({preset.volumeLiters}L · {preset.powerEcoWatts}W)
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => openModal('fridge-presets')}
              className="btn-compact"
              style={{
                alignSelf: 'flex-end',
                padding: '6px 10px',
                fontSize: '10.5px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '6px',
                whiteSpace: 'nowrap'
              }}
              title="Gerenciar e criar presets de geladeira"
            >
              ⚙️ Presets
            </button>
          </div>

          {/* Card com Detalhes da Geladeira Selecionada */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '6px',
              padding: '8px 10px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '6px',
              fontSize: '10.5px'
            }}
          >
            <div>
              <span style={{ color: '#94a3b8' }}>Volume: </span>
              <strong style={{ color: '#38bdf8' }}>{selectedPreset.volumeLiters} Litros</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Consumo: </span>
              <strong style={{ color: '#fbbf24' }}>{selectedPreset.powerEcoWatts}W (ECO) / {selectedPreset.powerMaxWatts || selectedPreset.powerEcoWatts}W</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Tensão: </span>
              <strong style={{ color: '#e2e8f0' }}>{selectedPreset.voltage}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Gás / Peso: </span>
              <strong style={{ color: '#cbd5e1' }}>{selectedPreset.refrigerantGas || 'R134a'} · {selectedPreset.weightKg} kg</strong>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: '#94a3b8' }}>Dimensões nominais: </span>
              <strong style={{ color: '#e2e8f0' }}>{selectedPreset.width} L x {selectedPreset.depth} P x {selectedPreset.height} A mm</strong>
              {selectedPreset.bluetooth && (
                <span style={{ marginLeft: '8px', color: '#6ee7b7', fontSize: '9.5px' }}>
                  📱 Bluetooth ({selectedPreset.bluetoothApp || 'App'})
                </span>
              )}
            </div>
          </div>

          {/* Validação Dimensional & Folgas */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              background: fitsAll ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${fitsAll ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.5)'}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: fitsAll ? '#34d399' : '#f87171' }}>
                {fitsAll ? '✅ Encaixe Confirmado no Módulo' : '⚠️ Alerta de Dimensões Insuficientes'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '10px', marginTop: '4px' }}>
              <div style={{ color: fitsW ? '#94a3b8' : '#f87171' }}>
                Largura: <strong>{boxWMm}mm</strong> (Nec. {reqW}mm) {clearanceW >= 0 ? `(+${clearanceW}mm)` : `(${clearanceW}mm)`}
              </div>
              <div style={{ color: fitsD ? '#94a3b8' : '#f87171' }}>
                Profundidade: <strong>{boxLMm}mm</strong> (Nec. {reqD}mm) {clearanceD >= 0 ? `(+${clearanceD}mm)` : `(${clearanceD}mm)`}
              </div>
              <div style={{ color: fitsH ? '#94a3b8' : '#f87171' }}>
                Altura: <strong>{boxHMm}mm</strong> (Nec. {reqH}mm) {clearanceH >= 0 ? `(+${clearanceH}mm)` : `(${clearanceH}mm)`}
              </div>
            </div>

            {!fitsAll && (
              <div style={{ fontSize: '9px', color: '#fca5a5', marginTop: '6px', lineHeight: 1.3 }}>
                Aumente a largura/comprimento nas divisões do grid ou a altura do módulo para que a tampa e as aletas de ventilação do compressor funcionem adequadamente.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
