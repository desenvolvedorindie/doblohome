import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, InstalledElectronicItem, ElectronicMountFace, ElectronicGridPosition } from '../../types';
import { saveElectronicMemory, getElectronicMemory } from '../../utils/componentPositionMemory';

interface PlannerBatterySectionProps {
  selectedBox: InternalBoxItem;
  boxWMm: number;
  boxLMm: number;
}

export const PlannerBatterySection: React.FC<PlannerBatterySectionProps> = ({
  selectedBox,
  boxWMm,
  boxLMm
}) => {
  const {
    internalBoxes,
    setInternalBoxes,
    updateInternalBox,
    batteryPresets,
    activeBatteryPresetId,
    activeBatteryPreset,
    selectBatteryPreset,
    openModal,
    flashToast
  } = useSolar();

  // Encontra se a bateria está instalada nesta caixa ou em outra
  const currentBoxElectronics = selectedBox.electronics || [];
  const batteryInThisBox = currentBoxElectronics.find(e => e.id === 'battery') || (selectedBox.hasBattery ? {
    id: 'battery' as const,
    mountFace: 'bottom' as const,
    position: 'rear_center' as const,
    rotationDeg: 0
  } : undefined);

  const isBatteryActive = !!batteryInThisBox || !!selectedBox.hasBattery;

  // Verifica se a bateria está instalada em alguma outra caixa
  const otherBoxWithBattery = internalBoxes.find(
    b => b.id !== selectedBox.id && (b.hasBattery || b.electronics?.some(e => e.id === 'battery'))
  );

  // Preset selecionado
  const currentPresetId = selectedBox.batteryPresetId || batteryInThisBox?.presetId || activeBatteryPresetId || batteryPresets[0]?.id;
  const selectedPreset = batteryPresets.find(p => p.id === currentPresetId) || activeBatteryPreset || batteryPresets[0];

  // Verificação dimensional
  const boxHMm = selectedBox.heightMm;
  const isRotated = (batteryInThisBox?.rotationDeg || 0) === 90;
  const reqW = isRotated ? (selectedPreset?.dimensionsMm.depth || 520) : (selectedPreset?.dimensionsMm.width || 270);
  const reqD = isRotated ? (selectedPreset?.dimensionsMm.width || 270) : (selectedPreset?.dimensionsMm.depth || 520);
  const reqH = selectedPreset?.dimensionsMm.height || 240;

  const clearanceW = boxWMm - reqW;
  const clearanceD = boxLMm - reqD;
  const clearanceH = boxHMm - reqH;

  const fitsW = clearanceW >= 0;
  const fitsD = clearanceD >= 0;
  const fitsH = clearanceH >= 0;
  const fitsAll = fitsW && fitsD && fitsH;

  // Outros equipamentos na mesma caixa
  const hasMppt = currentBoxElectronics.some(e => e.id === 'mppt');
  const hasB2b = currentBoxElectronics.some(e => e.id === 'b2b');
  const hasUsina = currentBoxElectronics.some(e => e.id === 'usina');

  const handleToggleBattery = () => {
    const willEnable = !isBatteryActive;

    setInternalBoxes((boxes: InternalBoxItem[]): InternalBoxItem[] => {
      return boxes.map((b): InternalBoxItem => {
        if (b.id === selectedBox.id) {
          let nextElectronics: InstalledElectronicItem[] = [...(b.electronics || [])];
          if (willEnable) {
            if (!nextElectronics.some(e => e.id === 'battery')) {
              const mem = getElectronicMemory('battery');
              nextElectronics.push({
                id: 'battery',
                mountFace: mem?.mountFace || 'bottom',
                position: mem?.position || 'rear_center',
                rotationDeg: mem?.rotationDeg || 0,
                customOffsetXmm: mem?.customOffsetXmm,
                customOffsetYmm: mem?.customOffsetYmm,
                customOffsetZmm: mem?.customOffsetZmm,
                presetId: mem?.presetId || selectedPreset.id
              });
            }
          } else {
            const existingBat = nextElectronics.find(e => e.id === 'battery');
            if (existingBat) saveElectronicMemory('battery', existingBat);
            nextElectronics = nextElectronics.filter(e => e.id !== 'battery');
          }
          return {
            ...b,
            hasBattery: willEnable,
            batteryPresetId: willEnable ? selectedPreset.id : undefined,
            electronics: nextElectronics
          };
        }
        // Se estiver ativando na caixa atual, remove de qualquer outra caixa para evitar duplicidade
        if (willEnable && (b.hasBattery || b.electronics?.some(e => e.id === 'battery'))) {
          const existingBat = b.electronics?.find(e => e.id === 'battery');
          if (existingBat) saveElectronicMemory('battery', existingBat);
          return {
            ...b,
            hasBattery: false,
            batteryPresetId: undefined,
            electronics: (b.electronics || []).filter(e => e.id !== 'battery')
          };
        }
        return b;
      });
    });

    if (willEnable) {
      selectBatteryPreset(selectedPreset.id);
      flashToast(`🔋 Bateria ${selectedPreset.name} instalada em "${selectedBox.name}"!`);
    } else {
      flashToast(`🔋 Bateria desinstalada de "${selectedBox.name}".`);
    }
  };

  const handleMoveBatteryHere = () => {
    handleToggleBattery();
  };

  const updateBatteryItem = (updates: Partial<InstalledElectronicItem>) => {
    saveElectronicMemory('battery', updates);
    setInternalBoxes((boxes: InternalBoxItem[]): InternalBoxItem[] => {
      return boxes.map((b): InternalBoxItem => {
        if (b.id === selectedBox.id) {
          const current: InstalledElectronicItem[] = b.electronics || [];
          const exists = current.some(e => e.id === 'battery');
          const nextElectronics: InstalledElectronicItem[] = exists
            ? current.map(e => (e.id === 'battery' ? { ...e, ...updates } : e))
            : [
              ...current,
              {
                id: 'battery' as const,
                mountFace: 'bottom' as const,
                position: 'rear_center' as const,
                rotationDeg: 0,
                ...updates
              }
            ];
          return {
            ...b,
            hasBattery: true,
            electronics: nextElectronics
          };
        }
        return b;
      });
    });
  };

  const toggleAuxElectronic = (id: 'mppt' | 'b2b' | 'usina', defaultFace: ElectronicMountFace, defaultPos: ElectronicGridPosition) => {
    setInternalBoxes((boxes: InternalBoxItem[]): InternalBoxItem[] => {
      return boxes.map((b): InternalBoxItem => {
        if (b.id === selectedBox.id) {
          const current: InstalledElectronicItem[] = b.electronics || [];
          const exists = current.some(e => e.id === id);
          let nextElectronics: InstalledElectronicItem[];
          if (exists) {
            const existing = current.find(e => e.id === id);
            if (existing) saveElectronicMemory(id, existing);
            nextElectronics = current.filter(e => e.id !== id);
          } else {
            const mem = getElectronicMemory(id);
            nextElectronics = [
              ...current,
              {
                id,
                mountFace: mem?.mountFace || defaultFace,
                position: mem?.position || defaultPos,
                rotationDeg: mem?.rotationDeg || 0,
                customOffsetXmm: mem?.customOffsetXmm,
                customOffsetYmm: mem?.customOffsetYmm,
                customOffsetZmm: mem?.customOffsetZmm
              }
            ];
          }
          return {
            ...b,
            electronics: nextElectronics
          };
        }
        // Se ativou nesta caixa, remove de outras
        if (currentBoxElectronics.every(e => e.id !== id) && b.electronics?.some(e => e.id === id)) {
          const existing = b.electronics?.find(e => e.id === id);
          if (existing) saveElectronicMemory(id, existing);
          return {
            ...b,
            electronics: (b.electronics || []).filter(e => e.id !== id)
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
        background: isBatteryActive
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.16), rgba(16, 185, 129, 0.08))'
          : 'rgba(30, 41, 59, 0.45)',
        border: isBatteryActive
          ? '1px solid rgba(34, 197, 94, 0.55)'
          : '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '8px',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: isBatteryActive ? '10px' : '0', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: isBatteryActive ? '#4ade80' : '#e2e8f0' }}>
              🔋 Bateria & Sistema Elétrico Embarcado
            </span>
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: 800,
                color: isBatteryActive ? '#15803d' : '#94a3b8',
                background: isBatteryActive ? 'rgba(34, 197, 94, 0.25)' : 'rgba(148, 163, 184, 0.15)',
                border: isBatteryActive ? '1px solid #22c55e' : 'none',
                padding: '1px 6px',
                borderRadius: '4px'
              }}
            >
              {isBatteryActive ? 'BATERIA NESTE MÓDULO' : 'SEM BATERIA'}
            </span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
            Instala o banco de baterias LiFePO4 na base deste módulo com fixação estrutural e verificação dimensional milimétrica.
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleBattery}
          className="btn-compact"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '5px 12px',
            background: isBatteryActive ? '#15803d' : 'rgba(34, 197, 94, 0.2)',
            color: isBatteryActive ? '#ffffff' : '#4ade80',
            border: '1px solid #22c55e',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {isBatteryActive ? '✓ Desinstalar Bateria' : '+ Instalar Bateria'}
        </button>
      </div>

      {/* Aviso se a bateria estiver em outro módulo */}
      {!isBatteryActive && otherBoxWithBattery && (
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
            ℹ️ A bateria está atualmente instalada no módulo <strong>"{otherBoxWithBattery.name}"</strong>.
          </span>
          <button
            type="button"
            onClick={handleMoveBatteryHere}
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

      {isBatteryActive && selectedPreset && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(34, 197, 94, 0.25)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Seletor do Preset de Bateria */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#4ade80', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                Preset de Bateria:
              </label>
              <select
                value={selectedPreset.id}
                onChange={(e) => {
                  const newId = e.target.value;
                  selectBatteryPreset(newId);
                  updateInternalBox(selectedBox.id, {
                    batteryPresetId: newId
                  });
                  updateBatteryItem({ presetId: newId });
                }}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(34, 197, 94, 0.5)',
                  color: '#ffffff',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600
                }}
              >
                {batteryPresets.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} ({preset.capacityAh}Ah · {preset.voltageNominal}V · {preset.bmsAmps}A BMS)
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => openModal('battery-presets')}
              className="btn-compact"
              style={{
                alignSelf: 'flex-end',
                padding: '6px 10px',
                fontSize: '10.5px',
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '6px',
                whiteSpace: 'nowrap'
              }}
              title="Gerenciar e cadastrar novos presets de bateria"
            >
              ⚙️ Presets
            </button>
          </div>

          {/* Posicionamento e Rotação */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                Posicionamento no Piso:
              </label>
              <select
                value={batteryInThisBox?.position || 'rear_center'}
                onChange={(e) => updateBatteryItem({ position: e.target.value as ElectronicGridPosition })}
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
                <option value="rear_center">Fundo / Centro (Recomendado)</option>
                <option value="center">Centro do Módulo</option>
                <option value="front_center">Frente do Módulo</option>
                <option value="bottom_left">Canto Esquerdo</option>
                <option value="bottom_right">Canto Direito</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                Orientação / Rotação:
              </label>
              <select
                value={batteryInThisBox?.rotationDeg || 0}
                onChange={(e) => updateBatteryItem({ rotationDeg: Number(e.target.value) })}
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
                <option value={0}>0° (Longitudinal: L {selectedPreset.dimensionsMm.width} × P {selectedPreset.dimensionsMm.depth}mm)</option>
                <option value={90}>90° (Transversal / Latitudinal: L {selectedPreset.dimensionsMm.depth} × P {selectedPreset.dimensionsMm.width}mm)</option>
                <option value={180}>180° (Longitudinal Invertida)</option>
                <option value={270}>270° (Transversal / Latitudinal Invertida)</option>
              </select>
            </div>
          </div>

          {/* Card com Detalhes da Bateria Selecionada */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: '6px',
              padding: '8px 10px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '6px',
              fontSize: '10.5px'
            }}
          >
            <div>
              <span style={{ color: '#94a3b8' }}>Capacidade: </span>
              <strong style={{ color: '#4ade80' }}>{selectedPreset.capacityAh} Ah ({Math.round(selectedPreset.capacityAh * selectedPreset.voltageNominal)} Wh)</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Tensão: </span>
              <strong style={{ color: '#fbbf24' }}>{selectedPreset.voltageNominal}V ({selectedPreset.chemistry})</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>BMS Descarga: </span>
              <strong style={{ color: '#e2e8f0' }}>{selectedPreset.bmsAmps}A</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Peso: </span>
              <strong style={{ color: '#cbd5e1' }}>{selectedPreset.weightKg} kg</strong>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: '#94a3b8' }}>Dimensões nominais: </span>
              <strong style={{ color: '#e2e8f0' }}>
                {selectedPreset.dimensionsMm.width} L x {selectedPreset.dimensionsMm.depth} P x {selectedPreset.dimensionsMm.height} A mm
              </strong>
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
                {fitsAll ? '✅ Bateria Cabe Perfeitamente no Módulo' : '⚠️ Alerta de Dimensões Insuficientes'}
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
                Aumente as dimensões do módulo ou rotacione a bateria para 90° para que ela se acomode com segurança sobre o piso.
              </div>
            )}
          </div>

          {/* Seção adicional para instalar outros componentes elétricos no mesmo baú técnico */}
          <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(148, 163, 184, 0.15)' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
              ⚡ Outros Componentes no mesmo Módulo Técnico:
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => toggleAuxElectronic('mppt', 'left_wall', 'top_left')}
                className="btn-compact"
                style={{
                  fontSize: '10px',
                  padding: '4px 8px',
                  background: hasMppt ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                  borderColor: hasMppt ? '#38bdf8' : 'rgba(148, 163, 184, 0.3)',
                  color: hasMppt ? '#38bdf8' : '#94a3b8'
                }}
              >
                {hasMppt ? '✓ MPPT Instalado' : '+ MPPT 60A'}
              </button>
              <button
                type="button"
                onClick={() => toggleAuxElectronic('b2b', 'left_wall', 'top_right')}
                className="btn-compact"
                style={{
                  fontSize: '10px',
                  padding: '4px 8px',
                  background: hasB2b ? 'rgba(234, 179, 8, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                  borderColor: hasB2b ? '#eab308' : 'rgba(148, 163, 184, 0.3)',
                  color: hasB2b ? '#facc15' : '#94a3b8'
                }}
              >
                {hasB2b ? '✓ B2B Instalado' : '+ B2B 30A'}
              </button>
              <button
                type="button"
                onClick={() => toggleAuxElectronic('usina', 'front_wall', 'top_center')}
                className="btn-compact"
                style={{
                  fontSize: '10px',
                  padding: '4px 8px',
                  background: hasUsina ? 'rgba(168, 85, 247, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                  borderColor: hasUsina ? '#a855f7' : 'rgba(148, 163, 184, 0.3)',
                  color: hasUsina ? '#c084fc' : '#94a3b8'
                }}
              >
                {hasUsina ? '✓ Usina Instalada' : '+ Usina 120A'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
