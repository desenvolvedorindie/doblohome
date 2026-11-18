import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem } from '../../types';
import { saveApplianceMemory, getApplianceMemory } from '../../utils/componentPositionMemory';

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
    internalBoxes,
    updateInternalBox,
    setInternalBoxes,
    setSelectedBoxId,
    portaPottiPresets,
    activePortaPottiPresetId,
    openModal
  } = useSolar();

  const isPortaPottiActive = !!selectedBox.hasPortaPotti;

  // Encontra qual módulo possui o sanitário atualmente (caso não seja este)
  const boxWithPortaPotti = internalBoxes.find(b => b.hasPortaPotti);

  const currentPresetId = selectedBox.portaPottiPresetId || boxWithPortaPotti?.portaPottiPresetId || activePortaPottiPresetId || portaPottiPresets[0]?.id;
  const selectedPreset = portaPottiPresets.find(p => p.id === currentPresetId) || portaPottiPresets[0];

  const portaPottiMem = getApplianceMemory('portaPotti');
  const rotation: 0 | 90 | 180 | 270 = (selectedBox.portaPottiRotation ?? boxWithPortaPotti?.portaPottiRotation ?? portaPottiMem?.rotation ?? 0) as 0 | 90 | 180 | 270;
  const alignX: 'center' | 'left' | 'right' = (selectedBox.portaPottiAlignX ?? boxWithPortaPotti?.portaPottiAlignX ?? portaPottiMem?.alignX ?? 'center') as 'center' | 'left' | 'right';
  const rawAlignZ = selectedBox.portaPottiAlignZ ?? boxWithPortaPotti?.portaPottiAlignZ ?? portaPottiMem?.alignZ ?? 'center';
  const alignZ: 'front' | 'center' | 'back' = rawAlignZ === 'rear' ? 'back' : (rawAlignZ as 'front' | 'center' | 'back');
  const offsetX = selectedBox.portaPottiOffsetX ?? boxWithPortaPotti?.portaPottiOffsetX ?? portaPottiMem?.offsetX ?? 0;
  const offsetZ = selectedBox.portaPottiOffsetZ ?? boxWithPortaPotti?.portaPottiOffsetZ ?? portaPottiMem?.offsetZ ?? 0;

  // Verificação dimensional considerando orientação (0°, 90°, 180°, 270°)
  const isRotated = rotation === 90 || rotation === 270;
  const boxHMm = selectedBox.heightMm;
  const rawW = selectedPreset ? selectedPreset.width : 404;
  const rawD = selectedPreset ? selectedPreset.depth : 353;
  const reqW = isRotated ? rawD : rawW;
  const reqD = isRotated ? rawW : rawD;
  const reqH = selectedPreset ? selectedPreset.height : 390;

  const clearanceW = boxWMm - reqW;
  const clearanceD = boxLMm - reqD;
  const clearanceH = boxHMm - reqH;

  const fitsW = clearanceW >= 0;
  const fitsD = clearanceD >= 0;
  const fitsH = clearanceH >= 0;
  const fitsAll = fitsW && fitsD && fitsH;

  // Função para mover o sanitário de um módulo para outro
  const handleMovePortaPottiToBox = (targetBoxId: string) => {
    saveApplianceMemory('portaPotti', {
      rotation,
      alignX,
      alignZ,
      offsetX,
      offsetZ
    });
    setInternalBoxes((prev: InternalBoxItem[]) =>
      prev.map(b => {
        if (b.id === targetBoxId) {
          return {
            ...b,
            hasPortaPotti: true,
            portaPottiPresetId: currentPresetId,
            portaPottiRotation: rotation,
            portaPottiAlignX: alignX,
            portaPottiAlignZ: alignZ,
            portaPottiOffsetX: offsetX,
            portaPottiOffsetZ: offsetZ
          };
        }
        if (b.hasPortaPotti) {
          return {
            ...b,
            hasPortaPotti: false,
            portaPottiPresetId: undefined
          };
        }
        return b;
      })
    );
    setSelectedBoxId(targetBoxId);
  };

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
              {isPortaPottiActive ? 'INSTALADO NO MÓDULO' : (boxWithPortaPotti ? `INSTALADO EM: ${boxWithPortaPotti.name.toUpperCase()}` : 'SEM SANITÁRIO')}
            </span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
            {isPortaPottiActive
              ? 'Sanitário ativo neste módulo. Configure a rotação, alinhamento e deslocamento fino no espaço interno.'
              : (boxWithPortaPotti
                  ? `O vaso sanitário está no módulo "${boxWithPortaPotti.name}". Clique no botão para movê-lo para cá.`
                  : 'Instala um modelo 3D realista do vaso sanitário químico portátil no interior deste módulo (gavetão corrediço, bandeja rasa ou baú).')}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isPortaPottiActive) {
              saveApplianceMemory('portaPotti', {
                rotation,
                alignX,
                alignZ,
                offsetX,
                offsetZ
              });
              updateInternalBox(selectedBox.id, {
                hasPortaPotti: false,
                portaPottiPresetId: undefined
              });
            } else {
              handleMovePortaPottiToBox(selectedBox.id);
            }
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
          {isPortaPottiActive ? '✓ Desinstalar' : (boxWithPortaPotti ? '⇄ Mover para cá' : '+ Instalar Porta Potti')}
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

          {/* Escolha do Módulo de Instalação (se houver mais de 1) */}
          {internalBoxes.length > 1 && (
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                📍 Módulo Onde o Sanitário Fica Instalado:
              </label>
              <select
                value={selectedBox.id}
                onChange={(e) => handleMovePortaPottiToBox(e.target.value)}
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

          {/* Posicionamento, Rotação e Deslocamento Fino */}
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
                      onClick={() => {
                        saveApplianceMemory('portaPotti', { rotation: r.value as any });
                        updateInternalBox(selectedBox.id, { portaPottiRotation: r.value as any });
                      }}
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
              {/* Alinhamento Lateral X */}
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
                        onClick={() => {
                          saveApplianceMemory('portaPotti', { alignX: a.val as any });
                          updateInternalBox(selectedBox.id, { portaPottiAlignX: a.val as any });
                        }}
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

              {/* Alinhamento Profundidade Z */}
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
                        onClick={() => {
                          saveApplianceMemory('portaPotti', { alignZ: a.val as any });
                          updateInternalBox(selectedBox.id, { portaPottiAlignZ: a.val as any });
                        }}
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
                  <strong style={{ color: '#38bdf8' }}>{offsetX > 0 ? `+${offsetX}` : offsetX} mm</strong>
                </div>
                <input
                  type="range"
                  className="custom-slider"
                  min="-150"
                  max="150"
                  step="5"
                  value={offsetX}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    saveApplianceMemory('portaPotti', { offsetX: val });
                    updateInternalBox(selectedBox.id, { portaPottiOffsetX: val });
                  }}
                  title="Ajuste fino milimétrico para esquerda/direita no módulo"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', marginBottom: '2px' }}>
                  <span>Offset Profundidade (Z):</span>
                  <strong style={{ color: '#38bdf8' }}>{offsetZ > 0 ? `+${offsetZ}` : offsetZ} mm</strong>
                </div>
                <input
                  type="range"
                  className="custom-slider"
                  min="-150"
                  max="150"
                  step="5"
                  value={offsetZ}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    saveApplianceMemory('portaPotti', { offsetZ: val });
                    updateInternalBox(selectedBox.id, { portaPottiOffsetZ: val });
                  }}
                  title="Ajuste fino milimétrico para frente/fundo no módulo"
                />
              </div>
            </div>

            {(offsetX !== 0 || offsetZ !== 0) && (
              <button
                type="button"
                className="btn-compact"
                onClick={() => {
                  saveApplianceMemory('portaPotti', { offsetX: 0, offsetZ: 0 });
                  updateInternalBox(selectedBox.id, { portaPottiOffsetX: 0, portaPottiOffsetZ: 0 });
                }}
                style={{
                  width: '100%',
                  fontSize: '9.5px',
                  padding: '3px 8px',
                  color: '#94a3b8',
                  background: 'rgba(30, 41, 59, 0.5)',
                  borderColor: 'rgba(148, 163, 184, 0.3)',
                  marginTop: '2px'
                }}
              >
                ↺ Resetar Ajuste Fino para Centro (0, 0 mm)
              </button>
            )}
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
