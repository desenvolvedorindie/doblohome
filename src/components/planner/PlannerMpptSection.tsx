import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, InstalledElectronicItem, ElectronicMountFace, ElectronicGridPosition } from '../../types';

interface PlannerMpptSectionProps {
  selectedBox: InternalBoxItem;
  boxWMm: number;
  boxLMm: number;
}

export const PlannerMpptSection: React.FC<PlannerMpptSectionProps> = ({
  selectedBox,
  boxWMm,
  boxLMm
}) => {
  const {
    internalBoxes,
    setInternalBoxes,
    mpptPresets,
    activeMpptPresetId,
    activeMpptPreset,
    selectMpptPreset,
    openModal,
    flashToast
  } = useSolar();

  const currentBoxElectronics = selectedBox.electronics || [];
  const mpptInThisBox = currentBoxElectronics.find(e => e.id === 'mppt');
  const isMpptActive = !!mpptInThisBox;

  // Verifica se o MPPT está instalado em outra caixa
  const otherBoxWithMppt = internalBoxes.find(
    b => b.id !== selectedBox.id && b.electronics?.some(e => e.id === 'mppt')
  );

  const currentPresetId = mpptInThisBox?.presetId || activeMpptPresetId || mpptPresets[0]?.id;
  const selectedPreset = mpptPresets.find(p => p.id === currentPresetId) || activeMpptPreset || mpptPresets[0];

  // Verificação dimensional
  const boxHMm = selectedBox.heightMm;
  const face = mpptInThisBox?.mountFace || 'left_wall';
  const reqW = selectedPreset?.dimensionsMm.width || 202;
  const reqH = selectedPreset?.dimensionsMm.height || 215;
  const reqD = selectedPreset?.dimensionsMm.depth || 100;

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

  const handleToggleMppt = () => {
    const willEnable = !isMpptActive;

    setInternalBoxes((boxes: InternalBoxItem[]): InternalBoxItem[] => {
      return boxes.map((b): InternalBoxItem => {
        if (b.id === selectedBox.id) {
          let nextElectronics: InstalledElectronicItem[] = [...(b.electronics || [])];
          if (willEnable) {
            if (!nextElectronics.some(e => e.id === 'mppt')) {
              nextElectronics.push({
                id: 'mppt',
                mountFace: 'left_wall',
                position: 'top_left',
                rotationDeg: 0,
                presetId: selectedPreset.id
              });
            }
          } else {
            nextElectronics = nextElectronics.filter(e => e.id !== 'mppt');
          }
          return {
            ...b,
            electronics: nextElectronics
          };
        }
        // Remove de outra caixa ao ativar nesta
        if (willEnable && b.electronics?.some(e => e.id === 'mppt')) {
          return {
            ...b,
            electronics: (b.electronics || []).filter(e => e.id !== 'mppt')
          };
        }
        return b;
      });
    });

    if (willEnable) {
      selectMpptPreset(selectedPreset.id);
      flashToast(`⚡ MPPT ${selectedPreset.name} instalado em "${selectedBox.name}"!`);
    } else {
      flashToast(`⚡ MPPT desinstalado de "${selectedBox.name}".`);
    }
  };

  const updateMpptItem = (updates: Partial<InstalledElectronicItem>) => {
    setInternalBoxes((boxes: InternalBoxItem[]): InternalBoxItem[] => {
      return boxes.map((b): InternalBoxItem => {
        if (b.id === selectedBox.id) {
          const current: InstalledElectronicItem[] = b.electronics || [];
          const exists = current.some(e => e.id === 'mppt');
          const nextElectronics: InstalledElectronicItem[] = exists
            ? current.map(e => (e.id === 'mppt' ? { ...e, ...updates } : e))
            : [
                ...current,
                {
                  id: 'mppt' as const,
                  mountFace: 'left_wall' as const,
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
        background: isMpptActive
          ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.16), rgba(2, 132, 199, 0.08))'
          : 'rgba(30, 41, 59, 0.45)',
        border: isMpptActive
          ? '1px solid rgba(14, 165, 233, 0.55)'
          : '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '8px',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: isMpptActive ? '10px' : '0', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: isMpptActive ? '#38bdf8' : '#e2e8f0' }}>
              ⚡ Controlador de Carga Solar MPPT
            </span>
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: 800,
                color: isMpptActive ? '#0284c7' : '#94a3b8',
                background: isMpptActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(148, 163, 184, 0.15)',
                border: isMpptActive ? '1px solid #38bdf8' : 'none',
                padding: '1px 6px',
                borderRadius: '4px'
              }}
            >
              {isMpptActive ? 'MPPT NESTE MÓDULO' : 'SEM MPPT'}
            </span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
            Fixa o controlador MPPT com aletas aletadas e parafusos de inox nas paredes internas ou no fundo deste módulo.
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleMppt}
          className="btn-compact"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '5px 12px',
            background: isMpptActive ? '#0284c7' : 'rgba(56, 189, 248, 0.2)',
            color: isMpptActive ? '#ffffff' : '#38bdf8',
            border: '1px solid #38bdf8',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {isMpptActive ? '✓ Desinstalar MPPT' : '+ Instalar MPPT'}
        </button>
      </div>

      {!isMpptActive && otherBoxWithMppt && (
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
            ℹ️ O MPPT está instalado no módulo <strong>"{otherBoxWithMppt.name}"</strong>.
          </span>
          <button
            type="button"
            onClick={handleToggleMppt}
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

      {isMpptActive && selectedPreset && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Seletor do Preset de MPPT */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                Preset de MPPT:
              </label>
              <select
                value={selectedPreset.id}
                onChange={(e) => {
                  const newId = e.target.value;
                  selectMpptPreset(newId);
                  updateMpptItem({ presetId: newId });
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
                {mpptPresets.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} ({preset.maxAmps}A · Voc máx {preset.maxPvVoltage}V)
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => openModal('mppt-presets')}
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
              title="Gerenciar e cadastrar novos presets de MPPT"
            >
              ⚙️ Presets
            </button>
          </div>

          {/* Face de Fixação e Posição */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                Face de Fixação / Parafusamento:
              </label>
              <select
                value={mpptInThisBox?.mountFace || 'left_wall'}
                onChange={(e) => updateMpptItem({ mountFace: e.target.value as ElectronicMountFace })}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#ffffff',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              >
                <option value="left_wall">Parede Lateral Esquerda</option>
                <option value="right_wall">Parede Lateral Direita</option>
                <option value="rear_wall">Parede Traseira (Fundo)</option>
                <option value="front_wall">Parede Dianteira</option>
                <option value="bottom">Piso / Base do Módulo</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                Posicionamento na Face:
              </label>
              <select
                value={mpptInThisBox?.position || 'top_left'}
                onChange={(e) => updateMpptItem({ position: e.target.value as ElectronicGridPosition })}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#ffffff',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              >
                <option value="top_left">Superior Esquerdo</option>
                <option value="top_center">Superior Centro</option>
                <option value="top_right">Superior Direito</option>
                <option value="mid_left">Meio Esquerdo</option>
                <option value="mid_center">Meio Centro</option>
                <option value="mid_right">Meio Direito</option>
                <option value="bottom_left">Inferior Esquerdo</option>
                <option value="bottom_center">Inferior Centro</option>
                <option value="bottom_right">Inferior Direito</option>
              </select>
            </div>
          </div>

          {/* Detalhes do MPPT */}
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
              <span style={{ color: '#94a3b8' }}>Corrente Nominal: </span>
              <strong style={{ color: '#38bdf8' }}>{selectedPreset.maxAmps} A</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Tensão FV máx: </span>
              <strong style={{ color: '#fbbf24' }}>{selectedPreset.maxPvVoltage} Vdc</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Potência (12V): </span>
              <strong style={{ color: '#4ade80' }}>~{Math.round(selectedPreset.maxAmps * 12.8)} W</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Peso: </span>
              <strong style={{ color: '#cbd5e1' }}>{selectedPreset.weightKg} kg</strong>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: '#94a3b8' }}>Dimensões nominais: </span>
              <strong style={{ color: '#e2e8f0' }}>
                {selectedPreset.dimensionsMm.width} L x {selectedPreset.dimensionsMm.height} A x {selectedPreset.dimensionsMm.depth} P mm
              </strong>
            </div>
          </div>

          {/* Validação de medidas */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              background: fitsAll ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${fitsAll ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.5)'}`
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, color: fitsAll ? '#34d399' : '#f87171' }}>
              {fitsAll ? '✅ MPPT Cabe Perfeitamente na Face Selecionada' : '⚠️ Alerta: Espaço Insuficiente na Face Selecionada'}
            </span>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
              Largura disponível: <strong>{availableW}mm</strong> (Nec. {reqW}mm) · Altura disponível: <strong>{availableH}mm</strong> (Nec. {reqH}mm)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
