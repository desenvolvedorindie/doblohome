import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem } from '../../types';

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
    updateInternalBox,
    stovePresets,
    activeStovePresetId,
    openModal
  } = useSolar();

  const isStoveActive = !!selectedBox.hasStove;
  const currentPresetId = selectedBox.stovePresetId || activeStovePresetId || stovePresets[0]?.id;
  const selectedPreset = stovePresets.find(p => p.id === currentPresetId) || stovePresets[0];

  const placement = selectedBox.stovePlacement || 'inside';
  const rotation = selectedBox.stoveRotation || 0;

  // Verificação dimensional considerando orientação (0° ou 90°) e local de instalação
  const boxHMm = selectedBox.heightMm;
  const rawW = selectedPreset ? selectedPreset.width : 350;
  const rawD = selectedPreset ? selectedPreset.depth : 330;
  const rawH = selectedPreset ? selectedPreset.height : 90;

  const reqW = rotation === 90 ? rawD : rawW;
  const reqD = rotation === 90 ? rawW : rawD;
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
              {isStoveActive ? 'INSTALADO NO MÓDULO' : 'SEM FOGAREIRO'}
            </span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
            Instala um modelo 3D detalhado do fogareiro portátil no interior do módulo (gaveta, bandeja corrediça ou baú), sobre o tampo superior ou sobre a prateleira traseira rebatível.
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const willEnable = !isStoveActive;
            updateInternalBox(selectedBox.id, {
              hasStove: willEnable,
              stovePresetId: willEnable ? currentPresetId : undefined,
              stovePlacement: willEnable ? (selectedBox.stovePlacement || 'inside') : undefined,
              stoveRotation: willEnable ? (selectedBox.stoveRotation ?? 0) : undefined
            });
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
          {isStoveActive ? '✓ Desinstalar' : '+ Instalar Fogareiro'}
        </button>
      </div>

      {isStoveActive && selectedPreset && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(249, 115, 22, 0.25)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Seletor do Preset de Fogareiro */}
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

          {/* Local de Instalação e Orientação (0° / 90°) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '10px', color: '#fb923c', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                Local de Instalação:
              </label>
              <select
                value={placement}
                onChange={(e) => {
                  updateInternalBox(selectedBox.id, {
                    stovePlacement: e.target.value as 'inside' | 'top' | 'rear_shelf'
                  });
                }}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(249, 115, 22, 0.4)',
                  color: '#ffffff',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                <option value="inside">📦 Interior / Gaveta / Bandeja</option>
                <option value="top">🪵 Sobre o Tampo / Bancada</option>
                <option value="rear_shelf">📐 Sobre a Mesa Traseira Rebatível</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: '#fb923c', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                Orientação no Módulo:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => updateInternalBox(selectedBox.id, { stoveRotation: 0 })}
                  className="btn-compact"
                  style={{
                    fontSize: '10.5px',
                    padding: '5px 6px',
                    fontWeight: 700,
                    background: rotation === 0 ? 'rgba(249, 115, 22, 0.3)' : 'rgba(15, 23, 42, 0.8)',
                    borderColor: rotation === 0 ? '#f97316' : 'rgba(148, 163, 184, 0.3)',
                    color: rotation === 0 ? '#fdba74' : '#94a3b8'
                  }}
                >
                  0° ({rawW}×{rawD})
                </button>
                <button
                  type="button"
                  onClick={() => updateInternalBox(selectedBox.id, { stoveRotation: 90 })}
                  className="btn-compact"
                  style={{
                    fontSize: '10.5px',
                    padding: '5px 6px',
                    fontWeight: 700,
                    background: rotation === 90 ? 'rgba(249, 115, 22, 0.3)' : 'rgba(15, 23, 42, 0.8)',
                    borderColor: rotation === 90 ? '#f97316' : 'rgba(148, 163, 184, 0.3)',
                    color: rotation === 90 ? '#fdba74' : '#94a3b8'
                  }}
                >
                  90° ({rawD}×{rawW})
                </button>
              </div>
            </div>
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
                {fitsAll ? '✅ Encaixe Confirmado no Módulo' : '⚠️ Alerta de Dimensões Insuficientes'}
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
