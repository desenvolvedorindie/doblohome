import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, InstalledElectronicItem, ElectronicMountFace, ElectronicGridPosition } from '../../types';

interface PlannerB2bSectionProps {
  selectedBox: InternalBoxItem;
  boxWMm: number;
  boxLMm: number;
}

export const PlannerB2bSection: React.FC<PlannerB2bSectionProps> = ({
  selectedBox,
  boxWMm,
  boxLMm
}) => {
  const {
    internalBoxes,
    setInternalBoxes,
    b2bPresets,
    activeB2bPresetId,
    activeB2bPreset,
    selectB2bPreset,
    openModal,
    flashToast
  } = useSolar();

  const currentBoxElectronics = selectedBox.electronics || [];
  const b2bInThisBox = currentBoxElectronics.find(e => e.id === 'b2b');
  const isB2bActive = !!b2bInThisBox;

  // Verifica se o B2B está instalado em outra caixa
  const otherBoxWithB2b = internalBoxes.find(
    b => b.id !== selectedBox.id && b.electronics?.some(e => e.id === 'b2b')
  );

  const currentPresetId = b2bInThisBox?.presetId || activeB2bPresetId || b2bPresets[0]?.id;
  const selectedPreset = b2bPresets.find(p => p.id === currentPresetId) || activeB2bPreset || b2bPresets[0];

  // Verificação dimensional
  const boxHMm = selectedBox.heightMm;
  const face = b2bInThisBox?.mountFace || 'right_wall';
  const reqW = selectedPreset?.dimensionsMm.width || 190;
  const reqH = selectedPreset?.dimensionsMm.height || 130;
  const reqD = selectedPreset?.dimensionsMm.depth || 58;

  // Dimensão da face correspondente
  let availableW = boxWMm;
  let availableH = boxHMm;
  if (face === 'left_wall' || face === 'right_wall') {
    availableW = boxLMm;
    availableH = boxHMm;
  } else if (face === 'rear_wall' || face === 'front_wall') {
    availableW = boxWMm;
    availableH = boxHMm;
  } else if (face === 'bottom') {
    availableW = boxWMm;
    availableH = boxLMm;
  }

  const clearanceW = availableW - reqW;
  const clearanceH = availableH - reqH;
  const fitsW = clearanceW >= 0;
  const fitsH = clearanceH >= 0;
  const fitsAll = fitsW && fitsH;

  const handleToggleB2b = () => {
    const willEnable = !isB2bActive;

    setInternalBoxes((boxes: InternalBoxItem[]): InternalBoxItem[] => {
      return boxes.map((b): InternalBoxItem => {
        if (b.id === selectedBox.id) {
          let nextElectronics: InstalledElectronicItem[] = [...(b.electronics || [])];
          if (willEnable) {
            if (!nextElectronics.some(e => e.id === 'b2b')) {
              nextElectronics.push({
                id: 'b2b',
                mountFace: 'right_wall',
                position: 'top_left',
                rotationDeg: 0,
                presetId: selectedPreset.id
              });
            }
          } else {
            nextElectronics = nextElectronics.filter(e => e.id !== 'b2b');
          }
          return {
            ...b,
            electronics: nextElectronics
          };
        }
        // Remove de outra caixa ao ativar nesta
        if (willEnable && b.electronics?.some(e => e.id === 'b2b')) {
          return {
            ...b,
            electronics: (b.electronics || []).filter(e => e.id !== 'b2b')
          };
        }
        return b;
      });
    });

    if (willEnable) {
      selectB2bPreset(selectedPreset.id);
      flashToast(`🔄 Carregador B2B ${selectedPreset.name} instalado em "${selectedBox.name}"!`);
    } else {
      flashToast(`🔄 Carregador B2B desinstalado de "${selectedBox.name}".`);
    }
  };

  const updateB2bItem = (updates: Partial<InstalledElectronicItem>) => {
    setInternalBoxes((boxes: InternalBoxItem[]): InternalBoxItem[] => {
      return boxes.map((b): InternalBoxItem => {
        if (b.id === selectedBox.id) {
          const current: InstalledElectronicItem[] = b.electronics || [];
          const exists = current.some(e => e.id === 'b2b');
          const nextElectronics: InstalledElectronicItem[] = exists
            ? current.map(e => (e.id === 'b2b' ? { ...e, ...updates } : e))
            : [
                ...current,
                {
                  id: 'b2b' as const,
                  mountFace: 'right_wall' as const,
                  position: 'top_left' as const,
                  rotationDeg: 0,
                  ...updates
                }
              ];
          return {
            ...b,
            electronics: nextElectronics
          };
        }
        return b;
      });
    });
  };

  return (
    <div
      style={{
        marginTop: '12px',
        padding: '12px',
        background: isB2bActive
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.08))'
          : 'rgba(30, 41, 59, 0.45)',
        border: isB2bActive
          ? '1px solid rgba(245, 158, 11, 0.55)'
          : '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '8px',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: isB2bActive ? '10px' : '0', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: isB2bActive ? '#fbbf24' : '#e2e8f0' }}>
              🔄 Carregador DC-DC (Alternador B2B)
            </span>
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: 800,
                color: isB2bActive ? '#d97706' : '#94a3b8',
                background: isB2bActive ? 'rgba(245, 158, 11, 0.25)' : 'rgba(148, 163, 184, 0.15)',
                border: isB2bActive ? '1px solid #f59e0b' : 'none',
                padding: '1px 6px',
                borderRadius: '4px'
              }}
            >
              {isB2bActive ? 'B2B NESTE MÓDULO' : 'SEM B2B'}
            </span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
            Fixa o carregador DC-DC do alternador do motor com aletas de alumínio e flanges de fixação parafusadas nas paredes ou fundo deste módulo.
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleB2b}
          className="btn-compact"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '5px 12px',
            background: isB2bActive ? '#d97706' : 'rgba(245, 158, 11, 0.2)',
            color: isB2bActive ? '#ffffff' : '#fbbf24',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {isB2bActive ? '✓ Desinstalar B2B' : '+ Instalar B2B'}
        </button>
      </div>

      {!isB2bActive && otherBoxWithB2b && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontSize: '10px', color: '#fef08a' }}>
            ℹ️ O B2B está instalado no módulo <strong>"{otherBoxWithB2b.name}"</strong>.
          </span>
          <button
            type="button"
            onClick={handleToggleB2b}
            className="btn-compact"
            style={{
              fontSize: '10px',
              padding: '3px 8px',
              background: 'rgba(234, 179, 8, 0.25)',
              color: '#facc15',
              borderColor: '#eab308'
            }}
          >
            Mover para este módulo ➔
          </button>
        </div>
      )}

      {isB2bActive && selectedPreset && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Seletor do Preset de B2B */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                Preset de DC-DC (B2B):
              </label>
              <select
                value={selectedPreset.id}
                onChange={(e) => {
                  const newId = e.target.value;
                  selectB2bPreset(newId);
                  updateB2bItem({ presetId: newId });
                }}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  color: '#ffffff',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                {b2bPresets.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} ({preset.chargingAmps}A • {preset.dimensionsMm.width}×{preset.dimensionsMm.height}×{preset.dimensionsMm.depth}mm)
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => openModal('b2b-presets')}
              className="btn-compact"
              style={{
                alignSelf: 'flex-end',
                padding: '5px 9px',
                fontSize: '11px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                borderColor: '#f59e0b',
                whiteSpace: 'nowrap'
              }}
              title="Cadastrar, editar ou importar presets de B2B"
            >
              ⚙️ Presets
            </button>
          </div>

          {/* Grid de Configurações de Montagem */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
            {/* Parede / Face de Fixação */}
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                Face de Fixação:
              </label>
              <select
                value={b2bInThisBox?.mountFace || 'right_wall'}
                onChange={(e) => updateB2bItem({ mountFace: e.target.value as ElectronicMountFace })}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#ffffff',
                  padding: '4px 6px',
                  borderRadius: '5px',
                  fontSize: '10.5px'
                }}
              >
                <option value="right_wall">Parede Direita (Passageiro)</option>
                <option value="left_wall">Parede Esquerda (Motorista)</option>
                <option value="rear_wall">Parede Traseira (Porta-Malas)</option>
                <option value="front_wall">Parede Frontal (Bancos)</option>
                <option value="bottom">Fundo / Base (Piso)</option>
              </select>
            </div>

            {/* Posição na Face */}
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                Posição na Parede:
              </label>
              <select
                value={b2bInThisBox?.position || 'top_left'}
                onChange={(e) => updateB2bItem({ position: e.target.value as ElectronicGridPosition })}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#ffffff',
                  padding: '4px 6px',
                  borderRadius: '5px',
                  fontSize: '10.5px'
                }}
              >
                <option value="top_left">Superior Esquerda</option>
                <option value="top_center">Superior Centro</option>
                <option value="top_right">Superior Direita</option>
                <option value="mid_left">Meio Esquerda</option>
                <option value="center">Centro</option>
                <option value="mid_right">Meio Direita</option>
                <option value="bottom_left">Inferior Esquerda</option>
                <option value="bottom_center">Inferior Centro</option>
                <option value="bottom_right">Inferior Direita</option>
              </select>
            </div>
          </div>

          {/* Rotação e Specs */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: '#94a3b8' }}>Orientação:</label>
              <button
                type="button"
                onClick={() => updateB2bItem({ rotationDeg: b2bInThisBox?.rotationDeg === 90 ? 0 : 90 })}
                className="btn-compact"
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  borderColor: '#f59e0b'
                }}
              >
                🔄 {b2bInThisBox?.rotationDeg === 90 ? 'Girar para Vertical (0°)' : 'Girar Horizontal (90°)'}
              </button>
            </div>

            <span style={{ fontSize: '9.5px', color: '#fbbf24', fontWeight: 600 }}>
              ⚡ {selectedPreset.chargingAmps}A ({Math.round(selectedPreset.chargingAmps * selectedPreset.voltageOut)}W) • {selectedPreset.voltageIn}V ➔ {selectedPreset.voltageOut}V
            </span>
          </div>

          {/* Diagnóstico Dimensional */}
          <div
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              background: fitsAll ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${fitsAll ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              fontSize: '10px'
            }}
          >
            <span style={{ color: fitsAll ? '#86efac' : '#fca5a5' }}>
              {fitsAll ? '✅ Encaixa com folga nesta face' : '⚠️ Dimensão excede o módulo nesta face'}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '9px' }}>
              Nec: {reqW}×{reqH}×{reqD}mm | Disp: {availableW}×{availableH}mm
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
