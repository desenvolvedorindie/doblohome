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
    internalBoxes,
    updateInternalBox,
    fridgePresets,
    activeFridgePresetId,
    openModal
  } = useSolar();

  const isFridgeActive = !!selectedBox.hasFridge;

  // Encontra qual módulo possui a geladeira atualmente (caso não seja este)
  const boxWithFridge = internalBoxes.find(b => b.hasFridge);

  const currentPresetId = selectedBox.fridgePresetId || boxWithFridge?.fridgePresetId || activeFridgePresetId || fridgePresets[0]?.id;
  const selectedPreset = fridgePresets.find(p => p.id === currentPresetId) || fridgePresets[0];

  const rotation = selectedBox.fridgeRotation || 0;
  const alignX = selectedBox.fridgeAlignX || 'center';
  const alignZ = selectedBox.fridgeAlignZ || 'center';
  const offsetX = selectedBox.fridgeOffsetX || 0;
  const offsetZ = selectedBox.fridgeOffsetZ || 0;

  // Verificação dimensional considerando rotação
  const isRotated = rotation === 90 || rotation === 270;
  const boxHMm = selectedBox.heightMm;
  const rawW = selectedPreset ? selectedPreset.width : 378;
  const rawD = selectedPreset ? selectedPreset.depth : 652;
  const reqW = isRotated ? rawD : rawW;
  const reqD = isRotated ? rawW : rawD;
  const reqH = selectedPreset ? selectedPreset.height : 386;

  const clearanceW = boxWMm - reqW;
  const clearanceD = boxLMm - reqD;
  const clearanceH = boxHMm - reqH;

  const fitsW = clearanceW >= 0;
  const fitsD = clearanceD >= 0;
  const fitsH = clearanceH >= 0;
  const fitsAll = fitsW && fitsD && fitsH;

  // Função para mover a geladeira de um módulo para outro
  const handleMoveFridgeToBox = (targetBoxId: string) => {
    // Remove de todas as caixas
    internalBoxes.forEach(b => {
      if (b.hasFridge && b.id !== targetBoxId) {
        updateInternalBox(b.id, {
          hasFridge: false,
          fridgePresetId: undefined
        });
      }
    });
    // Ativa na caixa alvo
    updateInternalBox(targetBoxId, {
      hasFridge: true,
      fridgePresetId: currentPresetId,
      fridgeRotation: rotation,
      fridgeAlignX: alignX,
      fridgeAlignZ: alignZ,
    });
  };

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
              {isFridgeActive ? 'INSTALADA NESTE MÓDULO' : (boxWithFridge ? `INSTALADA EM: ${boxWithFridge.name.toUpperCase()}` : 'SEM GELADEIRA')}
            </span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
            {isFridgeActive
              ? 'Geladeira ativa neste módulo. Configure a rotação, alinhamento e deslocamento fino no espaço interno.'
              : (boxWithFridge
                  ? `A geladeira está no módulo "${boxWithFridge.name}". Clique no botão para movê-la para cá.`
                  : 'Escolha e instale um modelo 3D de geladeira portátil em qualquer módulo camper.')}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isFridgeActive) {
              updateInternalBox(selectedBox.id, {
                hasFridge: false,
                fridgePresetId: undefined
              });
            } else {
              handleMoveFridgeToBox(selectedBox.id);
            }
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
          {isFridgeActive ? '✓ Desinstalar' : (boxWithFridge ? '⇄ Mover para cá' : '+ Instalar Geladeira')}
        </button>
      </div>

      {isFridgeActive && selectedPreset && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 1. SELETOR DE PRESET & GERENCIADOR */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                Modelo / Preset da Geladeira:
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
              title="Gerenciar e cadastrar modelos de geladeira"
            >
              ⚙️ Presets
            </button>
          </div>

          {/* 2. ESCOLHA DO MÓDULO DE INSTALAÇÃO */}
          {internalBoxes.length > 1 && (
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                📍 Módulo Onde a Geladeira Fica Instalada:
              </label>
              <select
                value={selectedBox.id}
                onChange={(e) => handleMoveFridgeToBox(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.95)',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                {internalBoxes.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.type === 'drawer' ? 'Gaveta' : b.type === 'chest' ? 'Baú' : 'Módulo'}) {b.id === selectedBox.id ? '★ (Atual)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. CONTROLES DE POSIÇÃO & ROTAÇÃO DA GELADEIRA */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '6px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.4px' }}>
              📐 POSIÇÃO &amp; ORIENTAÇÃO NO MÓDULO
            </div>

            {/* Rotação Horizontal */}
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Orientação / Rotação:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                {[
                  { label: '0° (Frente)', value: 0 },
                  { label: '90° (Lateral)', value: 90 },
                  { label: '180° (Invertida)', value: 180 },
                  { label: '270° (Lateral 2)', value: 270 }
                ].map(r => {
                  const isCur = rotation === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      className={`btn-compact ${isCur ? 'active' : ''}`}
                      onClick={() => updateInternalBox(selectedBox.id, { fridgeRotation: r.value as any })}
                      style={{
                        padding: '4px 2px',
                        fontSize: '9.5px',
                        fontWeight: 700,
                        background: isCur ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                        borderColor: isCur ? '#38bdf8' : '#334155',
                        color: isCur ? '#38bdf8' : '#cbd5e1'
                      }}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alinhamento X (Lateral) e Z (Profundidade) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
              {/* Alinhamento X */}
              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Alinhamento Lateral (X):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
                  {[
                    { label: 'Esq', val: 'left' },
                    { label: 'Centro', val: 'center' },
                    { label: 'Dir', val: 'right' }
                  ].map(a => {
                    const isCur = alignX === a.val;
                    return (
                      <button
                        key={a.val}
                        type="button"
                        className={`btn-compact ${isCur ? 'active' : ''}`}
                        onClick={() => updateInternalBox(selectedBox.id, { fridgeAlignX: a.val as any })}
                        style={{
                          padding: '4px 2px',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          background: isCur ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                          borderColor: isCur ? '#38bdf8' : '#334155',
                          color: isCur ? '#38bdf8' : '#cbd5e1'
                        }}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alinhamento Z */}
              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Alinhamento Profundidade (Z):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
                  {[
                    { label: 'Frente', val: 'front' },
                    { label: 'Centro', val: 'center' },
                    { label: 'Fundo', val: 'back' }
                  ].map(a => {
                    const isCur = alignZ === a.val;
                    return (
                      <button
                        key={a.val}
                        type="button"
                        className={`btn-compact ${isCur ? 'active' : ''}`}
                        onClick={() => updateInternalBox(selectedBox.id, { fridgeAlignZ: a.val as any })}
                        style={{
                          padding: '4px 2px',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          background: isCur ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                          borderColor: isCur ? '#38bdf8' : '#334155',
                          color: isCur ? '#38bdf8' : '#cbd5e1'
                        }}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ajustes Finos de Deslocamento em Milímetros (Offsets) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', marginBottom: '2px' }}>
                  <span>Offset Lateral (X):</span>
                  <strong style={{ color: '#38bdf8' }}>{offsetX} mm</strong>
                </div>
                <input
                  type="range"
                  className="custom-slider"
                  min="-120"
                  max="120"
                  step="5"
                  value={offsetX}
                  onChange={(e) => updateInternalBox(selectedBox.id, { fridgeOffsetX: parseInt(e.target.value, 10) })}
                  title="Ajuste fino milimétrico para esquerda/direita"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', marginBottom: '2px' }}>
                  <span>Offset Profundidade (Z):</span>
                  <strong style={{ color: '#38bdf8' }}>{offsetZ} mm</strong>
                </div>
                <input
                  type="range"
                  className="custom-slider"
                  min="-120"
                  max="120"
                  step="5"
                  value={offsetZ}
                  onChange={(e) => updateInternalBox(selectedBox.id, { fridgeOffsetZ: parseInt(e.target.value, 10) })}
                  title="Ajuste fino milimétrico para frente/fundo"
                />
              </div>
            </div>
          </div>

          {/* 4. VALIDAÇÃO DIMENSIONAL & FOLGAS */}
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
                Dica: tente rotacionar a geladeira para 90° se a largura for maior que o comprimento, ou aumente a altura do módulo.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
