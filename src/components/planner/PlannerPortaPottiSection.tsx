import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem } from '../../types';

interface PlannerPortaPottiSectionProps {
  selectedBox: InternalBoxItem;
  boxWMm: number;
  boxLMm: number;
}

export const PlannerPortaPottiSection: React.FC<PlannerPortaPottiSectionProps> = ({
  selectedBox,
  boxWMm,
  boxLMm
}) => {
  const {
    updateInternalBox,
    portaPottiPresets,
    activePortaPottiPresetId,
    openModal
  } = useSolar();

  const isPortaPottiActive = !!selectedBox.hasPortaPotti;
  const currentPresetId = selectedBox.portaPottiPresetId || activePortaPottiPresetId || portaPottiPresets[0]?.id;
  const selectedPreset = portaPottiPresets.find(p => p.id === currentPresetId) || portaPottiPresets[0];

  // Verificação dimensional
  const boxHMm = selectedBox.heightMm;
  const reqW = selectedPreset ? selectedPreset.width : 404;
  const reqD = selectedPreset ? selectedPreset.depth : 353;
  const reqH = selectedPreset ? selectedPreset.height : 390;

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
        background: isPortaPottiActive
          ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.16), rgba(14, 165, 233, 0.08))'
          : 'rgba(30, 41, 59, 0.45)',
        border: isPortaPottiActive
          ? '1px solid rgba(2, 132, 199, 0.55)'
          : '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '8px',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: isPortaPottiActive ? '10px' : '0', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: isPortaPottiActive ? '#38bdf8' : '#e2e8f0' }}>
              🚽 Vaso Sanitário Químico (Porta Potti)
            </span>
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: 800,
                color: isPortaPottiActive ? '#0284c7' : '#94a3b8',
                background: isPortaPottiActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(148, 163, 184, 0.15)',
                border: isPortaPottiActive ? '1px solid #38bdf8' : 'none',
                padding: '1px 6px',
                borderRadius: '4px'
              }}
            >
              {isPortaPottiActive ? 'INSTALADO NO MÓDULO' : 'SEM SANITÁRIO'}
            </span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
            Instala um modelo 3D realista do vaso sanitário químico portátil no interior deste módulo (gavetão corrediço, bandeja rasa ou baú), com validação das dimensões e folgas de abertura da tampa.
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const willEnable = !isPortaPottiActive;
            updateInternalBox(selectedBox.id, {
              hasPortaPotti: willEnable,
              portaPottiPresetId: willEnable ? currentPresetId : undefined
            });
          }}
          className="btn-compact"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '5px 12px',
            background: isPortaPottiActive ? '#0284c7' : 'rgba(56, 189, 248, 0.2)',
            color: isPortaPottiActive ? '#ffffff' : '#38bdf8',
            border: '1px solid #38bdf8',
            borderRadius: '6px'
          }}
        >
          {isPortaPottiActive ? '✓ Desinstalar' : '+ Instalar Porta Potti'}
        </button>
      </div>

      {isPortaPottiActive && selectedPreset && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Seletor do Preset de Porta Potti */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                Preset de Sanitário Químico:
              </label>
              <select
                value={selectedPreset.id}
                onChange={(e) => {
                  updateInternalBox(selectedBox.id, {
                    portaPottiPresetId: e.target.value
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
                {portaPottiPresets.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} ({preset.wasteCapacityLiters}L Dejetos · {preset.freshWaterCapacityLiters}L Água)
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => openModal('portapotti-presets')}
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
              title="Gerenciar e criar presets de Porta Potti"
            >
              ⚙️ Presets
            </button>
          </div>

          {/* Card com Detalhes do Porta Potti Selecionado */}
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
              <span style={{ color: '#94a3b8' }}>Tanque Dejetos: </span>
              <strong style={{ color: '#0284c7' }}>{selectedPreset.wasteCapacityLiters} Litros</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Água Limpa: </span>
              <strong style={{ color: '#38bdf8' }}>{selectedPreset.freshWaterCapacityLiters} Litros</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Peso Vazio/Cheio: </span>
              <strong style={{ color: '#fbbf24' }}>{selectedPreset.weightEmptyKg} kg / ~{selectedPreset.weightFullKg} kg</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Carga Máxima: </span>
              <strong style={{ color: '#4ade80' }}>Até {selectedPreset.maxLoadKg} kg</strong>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: '#94a3b8' }}>Dimensões nominais: </span>
              <strong style={{ color: '#e2e8f0' }}>{selectedPreset.width} L x {selectedPreset.depth} P x {selectedPreset.height} A mm</strong>
              {selectedPreset.hasSoftClose && (
                <span style={{ marginLeft: '8px', color: '#6ee7b7', fontSize: '9.5px' }}>
                  ✓ Soft Close (Fechamento Suave)
                </span>
              )}
              {selectedPreset.antiLeakValve && (
                <span style={{ marginLeft: '8px', color: '#38bdf8', fontSize: '9.5px' }}>
                  ✓ Vedação Dupla Antivazamento
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
                Aumente as dimensões do módulo ou gavetão para permitir o recolhimento e a abertura total da tampa do vaso sanitário químico.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
