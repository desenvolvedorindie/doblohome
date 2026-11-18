import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem } from '../../types';
import { saveApplianceMemory, getApplianceMemory } from '../../utils/componentPositionMemory';

interface PlannerStoveSectionProps {
  selectedBox: InternalBoxItem;
  boxWMm: number;
  boxLMm: number;
}

export const PlannerStoveSection: React.FC<PlannerStoveSectionProps> = ({
  selectedBox,
  boxWMm,
  boxLMm
}) => {
  const {
    internalBoxes,
    updateInternalBox,
    setInternalBoxes,
    setSelectedBoxId,
    stovePresets,
    activeStovePresetId,
    openModal
  } = useSolar();

  const isStoveActive = !!selectedBox.hasStove;

  // Encontra qual módulo possui o fogareiro atualmente (caso não seja este)
  const boxWithStove = internalBoxes.find(b => b.hasStove);

  const currentPresetId = selectedBox.stovePresetId || boxWithStove?.stovePresetId || activeStovePresetId || stovePresets[0]?.id;
  const selectedPreset = stovePresets.find(p => p.id === currentPresetId) || stovePresets[0];

  const stoveMem = getApplianceMemory('stove');
  const rawPlacement = selectedBox.stovePlacement ?? boxWithStove?.stovePlacement ?? stoveMem?.placement ?? 'top';
  const placement: 'inside' | 'top' | 'rear_shelf' = rawPlacement === 'drawer' ? 'inside' : rawPlacement;
  const rotation: 0 | 90 | 180 | 270 = (selectedBox.stoveRotation ?? boxWithStove?.stoveRotation ?? stoveMem?.rotation ?? 0) as 0 | 90 | 180 | 270;
  const alignX: 'center' | 'left' | 'right' = (selectedBox.stoveAlignX ?? boxWithStove?.stoveAlignX ?? stoveMem?.alignX ?? 'center') as 'center' | 'left' | 'right';
  const rawAlignZ = selectedBox.stoveAlignZ ?? boxWithStove?.stoveAlignZ ?? stoveMem?.alignZ ?? 'center';
  const alignZ: 'center' | 'front' | 'back' = rawAlignZ === 'rear' ? 'back' : (rawAlignZ as 'center' | 'front' | 'back');
  const offsetX = selectedBox.stoveOffsetX ?? boxWithStove?.stoveOffsetX ?? stoveMem?.offsetX ?? 0;
  const offsetZ = selectedBox.stoveOffsetZ ?? boxWithStove?.stoveOffsetZ ?? stoveMem?.offsetZ ?? 0;

  // Verificação dimensional considerando orientação (0°, 90°, 180°, 270°) e local de instalação
  const isRotated = rotation === 90 || rotation === 270;
  const boxHMm = selectedBox.heightMm;
  const rawW = selectedPreset ? selectedPreset.width : 350;
  const rawD = selectedPreset ? selectedPreset.depth : 330;
  const rawH = selectedPreset ? selectedPreset.height : 90;

  const reqW = isRotated ? rawD : rawW;
  const reqD = isRotated ? rawW : rawD;
  const reqH = rawH;

  const availW = placement === 'rear_shelf' ? Math.max(150, boxWMm - 30) : boxWMm;
  const availD = placement === 'rear_shelf' ? Math.max(150, Math.min(boxHMm - 40, 380)) : boxLMm;

  const clearanceW = availW - reqW;
  const clearanceD = availD - reqD;
  const clearanceH = boxHMm - reqH;

  const fitsW = clearanceW >= 0;
  const fitsD = clearanceD >= 0;
  const fitsH = placement === 'inside' ? clearanceH >= 0 : true;
  const fitsAll = fitsW && fitsD && fitsH;

  // Função para mover o fogareiro de um módulo para outro
  const handleMoveStoveToBox = (targetBoxId: string) => {
    saveApplianceMemory('stove', {
      placement,
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
            hasStove: true,
            stovePresetId: currentPresetId,
            stovePlacement: placement,
            stoveRotation: rotation,
            stoveAlignX: alignX,
            stoveAlignZ: alignZ,
            stoveOffsetX: offsetX,
            stoveOffsetZ: offsetZ
          };
        }
        if (b.hasStove) {
          return {
            ...b,
            hasStove: false,
            stovePresetId: undefined
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
        background: isStoveActive
          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.16), rgba(245, 158, 11, 0.08))'
          : 'rgba(30, 41, 59, 0.45)',
        border: isStoveActive
          ? '1px solid rgba(249, 115, 22, 0.55)'
          : '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '8px',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: isStoveActive ? '10px' : '0', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: isStoveActive ? '#fb923c' : '#e2e8f0' }}>
              🔥 Fogareiro Portátil (NTK Duo Ceramik)
            </span>
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: 800,
                color: isStoveActive ? '#fb923c' : '#94a3b8',
                background: isStoveActive ? 'rgba(249, 115, 22, 0.22)' : 'rgba(148, 163, 184, 0.15)',
                border: isStoveActive ? '1px solid #f97316' : 'none',
                padding: '1px 6px',
                borderRadius: '4px'
              }}
            >
              {isStoveActive ? 'INSTALADO NESTE MÓDULO' : (boxWithStove ? `INSTALADO EM: ${boxWithStove.name.toUpperCase()}` : 'SEM FOGAREIRO')}
            </span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
            {isStoveActive
              ? `Fogareiro ativo neste módulo (${placement === 'top' ? 'Sobre a Bancada' : placement === 'rear_shelf' ? 'Mesa Traseira' : 'Interior'}). Ajuste posição, rotação e alinhamento.`
              : (boxWithStove
                ? `O fogareiro está no módulo "${boxWithStove.name}". Clique no botão para movê-lo para cá.`
                : 'Instale o fogareiro portátil sobre a bancada/tampo, no interior ou sobre a mesa rebatível traseira.')}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isStoveActive) {
              saveApplianceMemory('stove', {
                placement,
                rotation,
                alignX,
                alignZ,
                offsetX,
                offsetZ
              });
              updateInternalBox(selectedBox.id, {
                hasStove: false,
                stovePresetId: undefined
              });
            } else {
              handleMoveStoveToBox(selectedBox.id);
            }
          }}
          className="btn-compact"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '5px 12px',
            background: isStoveActive ? '#ea580c' : 'rgba(249, 115, 22, 0.2)',
            color: isStoveActive ? '#ffffff' : '#fb923c',
            border: '1px solid #f97316',
            borderRadius: '6px'
          }}
        >
          {isStoveActive ? '✓ Desinstalar' : (boxWithStove ? '⇄ Mover para cá' : '+ Instalar Fogareiro')}
        </button>
      </div>

      {isStoveActive && selectedPreset && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(249, 115, 22, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 1. SELETOR DE PRESET & GERENCIADOR */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#fb923c', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                Preset de Fogareiro Portátil:
              </label>
              <select
                value={selectedPreset.id}
                onChange={(e) => {
                  updateInternalBox(selectedBox.id, {
                    stovePresetId: e.target.value
                  });
                }}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(249, 115, 22, 0.5)',
                  color: '#ffffff',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600
                }}
              >
                {stovePresets.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} ({preset.width}×{preset.depth}×{preset.height}mm · {preset.gasConsumptionGh}g/h)
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => openModal('stove-presets')}
              className="btn-compact"
              style={{
                alignSelf: 'flex-end',
                padding: '6px 10px',
                fontSize: '10.5px',
                background: 'rgba(249, 115, 22, 0.15)',
                color: '#fb923c',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                borderRadius: '6px',
                whiteSpace: 'nowrap'
              }}
              title="Gerenciar e criar presets de fogareiro"
            >
              ⚙️ Presets
            </button>
          </div>

          {/* 2. ESCOLHA DO MÓDULO / LOCAL DE INSTALAÇÃO */}
          <div style={{ display: 'grid', gridTemplateColumns: internalBoxes.length > 1 ? '1fr 1fr' : '1fr', gap: '8px' }}>
            {internalBoxes.length > 1 && (
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(249, 115, 22, 0.25)' }}>
                <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  📍 Módulo da Van:
                </label>
                <select
                  value={selectedBox.id}
                  onChange={(e) => handleMoveStoveToBox(e.target.value)}
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

            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(249, 115, 22, 0.25)' }}>
              <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                🪵 Superfície de Instalação:
              </label>
              <select
                value={placement}
                onChange={(e) => {
                  const newPlacement = e.target.value as 'inside' | 'top' | 'rear_shelf';
                  saveApplianceMemory('stove', { placement: newPlacement });
                  updateInternalBox(selectedBox.id, {
                    stovePlacement: newPlacement
                  });
                }}
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
                <option value="top">🪵 Sobre o Tampo / Bancada</option>
                <option value="inside">📦 Interior / Gaveta / Bandeja</option>
                <option value="rear_shelf">📐 Sobre a Mesa Traseira Rebatível</option>
              </select>
            </div>
          </div>

          {/* 3. POSIÇÃO, ALINHAMENTO E ROTAÇÃO NO TAMPO / BANCADA */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '6px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fb923c', letterSpacing: '0.4px' }}>
              📐 POSICIONAMENTO DO FOGÃO NA BANCADA
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
                        saveApplianceMemory('stove', { rotation: r.value as any });
                        updateInternalBox(selectedBox.id, { stoveRotation: r.value as any });
                      }}
                      style={{
                        padding: '4px 2px',
                        fontSize: '9.5px',
                        fontWeight: 700,
                        background: isCur ? 'rgba(249, 115, 22, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                        borderColor: isCur ? '#f97316' : '#334155',
                        color: isCur ? '#fdba74' : '#cbd5e1'
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
                        saveApplianceMemory('stove', { alignX: a.val as any });
                        updateInternalBox(selectedBox.id, { stoveAlignX: a.val as any });
                      }}
                        style={{
                          padding: '4px 2px',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          background: isCur ? 'rgba(249, 115, 22, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                          borderColor: isCur ? '#f97316' : '#334155',
                          color: isCur ? '#fdba74' : '#cbd5e1'
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
                          saveApplianceMemory('stove', { alignZ: a.val as any });
                          updateInternalBox(selectedBox.id, { stoveAlignZ: a.val as any });
                        }}
                        style={{
                          padding: '4px 2px',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          background: isCur ? 'rgba(249, 115, 22, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                          borderColor: isCur ? '#f97316' : '#334155',
                          color: isCur ? '#fdba74' : '#cbd5e1'
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
                  <strong style={{ color: '#fb923c' }}>{offsetX > 0 ? `+${offsetX}` : offsetX} mm</strong>
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
                    saveApplianceMemory('stove', { offsetX: val });
                    updateInternalBox(selectedBox.id, { stoveOffsetX: val });
                  }}
                  title="Ajuste fino milimétrico para esquerda/direita na bancada"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', marginBottom: '2px' }}>
                  <span>Offset Profundidade (Z):</span>
                  <strong style={{ color: '#fb923c' }}>{offsetZ > 0 ? `+${offsetZ}` : offsetZ} mm</strong>
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
                    saveApplianceMemory('stove', { offsetZ: val });
                    updateInternalBox(selectedBox.id, { stoveOffsetZ: val });
                  }}
                  title="Ajuste fino milimétrico para frente/fundo na bancada"
                />
              </div>
            </div>

            {(offsetX !== 0 || offsetZ !== 0) && (
              <button
                type="button"
                className="btn-compact"
                onClick={() => {
                  saveApplianceMemory('stove', { offsetX: 0, offsetZ: 0 });
                  updateInternalBox(selectedBox.id, { stoveOffsetX: 0, stoveOffsetZ: 0 });
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

          {placement === 'rear_shelf' && !selectedBox.rearFoldShelf && (
            <div
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.14)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap'
              }}
            >
              <span style={{ fontSize: '9.5px', color: '#fcd34d', flex: 1 }}>
                💡 A Prateleira Rebatível Traseira ainda não está ativa neste módulo. Enquanto fechada/inativa, o fogareiro fica guardado no interior.
              </span>
              <button
                type="button"
                onClick={() => updateInternalBox(selectedBox.id, { rearFoldShelf: true, isRearShelfOpen: true })}
                className="btn-compact"
                style={{
                  fontSize: '10px',
                  padding: '4px 8px',
                  background: 'rgba(245, 158, 11, 0.25)',
                  borderColor: '#f59e0b',
                  color: '#fde68a',
                  fontWeight: 700
                }}
              >
                + Ativar Mesa Traseira
              </button>
            </div>
          )}

          {/* Card com Detalhes do Fogareiro Selecionado */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              borderRadius: '6px',
              padding: '8px 10px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '6px',
              fontSize: '10.5px'
            }}
          >
            <div>
              <span style={{ color: '#94a3b8' }}>Queimador: </span>
              <strong style={{ color: '#fb923c' }}>{selectedPreset.burnerType}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Consumo Gás: </span>
              <strong style={{ color: '#fbbf24' }}>{selectedPreset.gasConsumptionGh} g/h</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Combustível: </span>
              <strong style={{ color: '#e2e8f0' }}>{selectedPreset.fuelType}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Ignição / Peso: </span>
              <strong style={{ color: '#cbd5e1' }}>Piezo · {selectedPreset.weightKg} kg</strong>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span>
                <span style={{ color: '#94a3b8' }}>Dimensões nominais: </span>
                <strong style={{ color: '#e2e8f0' }}>{selectedPreset.width} L × {selectedPreset.depth} P × {selectedPreset.height} A mm</strong>
              </span>
              {selectedPreset.hasCarryCase && (
                <span style={{ color: '#6ee7b7', fontSize: '9.5px' }}>✓ Maleta Inclusa</span>
              )}
              {selectedPreset.windResistant && (
                <span style={{ color: '#fdba74', fontSize: '9.5px' }}>✓ Resistente ao Vento</span>
              )}
              {selectedPreset.dualFuelAdapter && (
                <span style={{ color: '#38bdf8', fontSize: '9.5px' }}>✓ Adaptador GLP (Flex Fuel)</span>
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
                {fitsAll ? '✅ Encaixe Confirmado na Bancada / Módulo' : '⚠️ Alerta de Dimensões Insuficientes'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '10px', marginTop: '4px' }}>
              <div style={{ color: fitsW ? '#94a3b8' : '#f87171' }}>
                Largura: <strong>{availW}mm</strong> (Nec. {reqW}mm) {clearanceW >= 0 ? `(+${clearanceW}mm)` : `(${clearanceW}mm)`}
              </div>
              <div style={{ color: fitsD ? '#94a3b8' : '#f87171' }}>
                Profundidade: <strong>{availD}mm</strong> (Nec. {reqD}mm) {clearanceD >= 0 ? `(+${clearanceD}mm)` : `(${clearanceD}mm)`}
              </div>
              <div style={{ color: fitsH ? '#94a3b8' : '#f87171' }}>
                {placement === 'inside'
                  ? <>Altura: <strong>{boxHMm}mm</strong> (Nec. {reqH}mm) {clearanceH >= 0 ? `(+${clearanceH}mm)` : `(${clearanceH}mm)`}</>
                  : <>Altura: <strong>Livre</strong> (Fog. {reqH}mm)</>}
              </div>
            </div>

            {!fitsAll && (
              <div style={{ fontSize: '9px', color: '#fca5a5', marginTop: '6px', lineHeight: 1.3 }}>
                Aumente as dimensões do módulo no grid ou tente girar o fogareiro em 90° para acomodar com segurança e ventilação.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
