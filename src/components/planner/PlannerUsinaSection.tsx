import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, InstalledElectronicItem, ElectronicMountFace, ElectronicGridPosition, UsinaModelRating } from '../../types';
import { saveElectronicMemory, getElectronicMemory } from '../../utils/componentPositionMemory';

interface PlannerUsinaSectionProps {
  selectedBox: InternalBoxItem;
  boxWMm: number;
  boxLMm: number;
}

const USINA_DIMENSIONS: Record<UsinaModelRating, { width: number; height: number; depth: number }> = {
  70: { width: 260, height: 85, depth: 180 },
  120: { width: 290, height: 85, depth: 180 },
  150: { width: 320, height: 85, depth: 180 },
  200: { width: 320, height: 85, depth: 180 }
};

export const PlannerUsinaSection: React.FC<PlannerUsinaSectionProps> = ({
  selectedBox,
  boxWMm,
  boxLMm
}) => {
  const {
    internalBoxes,
    setInternalBoxes,
    usinaCharger,
    setUsinaModel,
    toggleUsinaAC,
    openModal,
    flashToast
  } = useSolar();

  const currentBoxElectronics = selectedBox.electronics || [];
  const usinaInThisBox = currentBoxElectronics.find(e => e.id === 'usina');
  const isUsinaActive = !!usinaInThisBox;

  // Verifica se a Usina está instalada em outra caixa
  const otherBoxWithUsina = internalBoxes.find(
    b => b.id !== selectedBox.id && b.electronics?.some(e => e.id === 'usina')
  );

  const currentRating = usinaCharger.modelRating || 120;
  const dims = USINA_DIMENSIONS[currentRating] || USINA_DIMENSIONS[120];

  // Verificação dimensional
  const boxHMm = selectedBox.heightMm;
  const face = usinaInThisBox?.mountFace || 'bottom';
  const rotDeg = usinaInThisBox?.rotationDeg || 0;
  const isRotated90 = rotDeg === 90 || rotDeg === 270;

  // Dimensões nominais considerando a rotação na face
  const reqW = face === 'bottom'
    ? (isRotated90 ? dims.depth : dims.width)
    : (isRotated90 ? dims.height : dims.width);

  const reqH = face === 'bottom'
    ? dims.height
    : (isRotated90 ? dims.width : dims.height);

  const reqD = face === 'bottom'
    ? (isRotated90 ? dims.width : dims.depth)
    : dims.depth;

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
  const clearanceH = availableH - (face === 'bottom' ? reqD : reqH);
  const fitsW = clearanceW >= 0;
  const fitsH = clearanceH >= 0;
  const fitsAll = fitsW && fitsH;

  const handleToggleUsina = () => {
    const willEnable = !isUsinaActive;

    setInternalBoxes((boxes: InternalBoxItem[]): InternalBoxItem[] => {
      return boxes.map((b): InternalBoxItem => {
        if (b.id === selectedBox.id) {
          let nextElectronics: InstalledElectronicItem[] = [...(b.electronics || [])];
          if (willEnable) {
            if (!nextElectronics.some(e => e.id === 'usina')) {
              const mem = getElectronicMemory('usina');
              nextElectronics.push({
                id: 'usina',
                mountFace: mem?.mountFace || 'bottom',
                position: mem?.position || 'center',
                rotationDeg: mem?.rotationDeg || 0,
                customOffsetXmm: mem?.customOffsetXmm,
                customOffsetYmm: mem?.customOffsetYmm,
                customOffsetZmm: mem?.customOffsetZmm
              });
            }
          } else {
            const existing = nextElectronics.find(e => e.id === 'usina');
            if (existing) saveElectronicMemory('usina', existing);
            nextElectronics = nextElectronics.filter(e => e.id !== 'usina');
          }
          return {
            ...b,
            electronics: nextElectronics
          };
        }
        // Remove de outra caixa ao ativar nesta
        if (willEnable && b.electronics?.some(e => e.id === 'usina')) {
          const existing = b.electronics?.find(e => e.id === 'usina');
          if (existing) saveElectronicMemory('usina', existing);
          return {
            ...b,
            electronics: (b.electronics || []).filter(e => e.id !== 'usina')
          };
        }
        return b;
      });
    });

    if (willEnable) {
      flashToast(`🔌 Fonte Usina ${currentRating}A instalada em "${selectedBox.name}"!`);
    } else {
      flashToast(`🔌 Fonte Usina desinstalada de "${selectedBox.name}".`);
    }
  };

  const updateUsinaItem = (updates: Partial<InstalledElectronicItem>) => {
    saveElectronicMemory('usina', updates);
    setInternalBoxes((boxes: InternalBoxItem[]): InternalBoxItem[] => {
      return boxes.map((b): InternalBoxItem => {
        if (b.id === selectedBox.id) {
          const current: InstalledElectronicItem[] = b.electronics || [];
          const exists = current.some(e => e.id === 'usina');
          const nextElectronics: InstalledElectronicItem[] = exists
            ? current.map(e => (e.id === 'usina' ? { ...e, ...updates } : e))
            : [
                ...current,
                {
                  id: 'usina' as const,
                  mountFace: 'bottom' as const,
                  position: 'center' as const,
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
        background: isUsinaActive
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.16), rgba(185, 28, 28, 0.08))'
          : 'rgba(30, 41, 59, 0.45)',
        border: isUsinaActive
          ? '1px solid rgba(239, 68, 68, 0.55)'
          : '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '8px',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: isUsinaActive ? '10px' : '0', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: isUsinaActive ? '#f87171' : '#e2e8f0' }}>
              🔌 Fonte Carregadora AC/DC (Usina Smart Connect)
            </span>
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: 800,
                color: isUsinaActive ? '#ef4444' : '#94a3b8',
                background: isUsinaActive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(148, 163, 184, 0.15)',
                border: isUsinaActive ? '1px solid #ef4444' : 'none',
                padding: '1px 6px',
                borderRadius: '4px'
              }}
            >
              {isUsinaActive ? 'USINA NESTE MÓDULO' : 'SEM FONTE AC/DC'}
            </span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
            Instala a fonte de alta potência para rede externa / Shore Power com voltímetro digital integrado, aletas reforçadas e parafusamento no piso ou paredes do módulo.
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleUsina}
          className="btn-compact"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '5px 12px',
            background: isUsinaActive ? '#b91c1c' : 'rgba(239, 68, 68, 0.2)',
            color: isUsinaActive ? '#ffffff' : '#f87171',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {isUsinaActive ? '✓ Desinstalar Usina' : '+ Instalar Usina'}
        </button>
      </div>

      {!isUsinaActive && otherBoxWithUsina && (
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
            ℹ️ A Usina está instalada no módulo <strong>"{otherBoxWithUsina.name}"</strong>.
          </span>
          <button
            type="button"
            onClick={handleToggleUsina}
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

      {isUsinaActive && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Seletor do Modelo da Usina e Shore Power */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ fontSize: '10px', color: '#f87171', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                Modelo Usina Smart Connect:
              </label>
              <select
                value={currentRating}
                onChange={(e) => setUsinaModel(Number(e.target.value) as UsinaModelRating)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#ffffff',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                <option value={70}>Usina 70A (1008W • 260×180×85mm)</option>
                <option value={120}>Usina 120A (1728W • 290×180×85mm)</option>
                <option value={150}>Usina 150A (2160W • 320×180×85mm)</option>
                <option value={200}>Usina 200A (2880W • 320×180×85mm)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignSelf: 'flex-end' }}>
              <button
                type="button"
                onClick={toggleUsinaAC}
                className="btn-compact"
                style={{
                  padding: '5px 9px',
                  fontSize: '11px',
                  background: usinaCharger.isConnectedAC ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.2)',
                  color: usinaCharger.isConnectedAC ? '#fca5a5' : '#86efac',
                  borderColor: usinaCharger.isConnectedAC ? '#ef4444' : '#22c55e',
                  whiteSpace: 'nowrap'
                }}
                title={usinaCharger.isConnectedAC ? 'Desconectar da rede AC externa' : 'Simular tomada de camping / residência conectada'}
              >
                {usinaCharger.isConnectedAC ? '🔌 Desconectar AC' : '⚡ Conectar AC'}
              </button>

              <button
                type="button"
                onClick={() => openModal('usina')}
                className="btn-compact"
                style={{
                  padding: '5px 9px',
                  fontSize: '11px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  borderColor: '#ef4444',
                  whiteSpace: 'nowrap'
                }}
                title="Ajustar corrente, voltagem e telemetria da fonte Usina"
              >
                ⚙️ Ajustes
              </button>
            </div>
          </div>

          {/* Grid de Configurações de Montagem */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
            {/* Parede / Face de Fixação */}
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                Face de Fixação:
              </label>
              <select
                value={usinaInThisBox?.mountFace || 'bottom'}
                onChange={(e) => updateUsinaItem({ mountFace: e.target.value as ElectronicMountFace })}
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
                <option value="bottom">Fundo / Base (Piso)</option>
                <option value="left_wall">Parede Esquerda (Motorista)</option>
                <option value="right_wall">Parede Direita (Passageiro)</option>
                <option value="rear_wall">Parede Traseira (Porta-Malas)</option>
                <option value="front_wall">Parede Frontal (Bancos)</option>
              </select>
            </div>

            {/* Posição na Face */}
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                Posição na Face:
              </label>
              <select
                value={usinaInThisBox?.position || 'center'}
                onChange={(e) => updateUsinaItem({ position: e.target.value as ElectronicGridPosition })}
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
                <option value="center">Centro</option>
                <option value="top_left">Superior / Trás Esquerda</option>
                <option value="top_center">Superior / Trás Centro</option>
                <option value="top_right">Superior / Trás Direita</option>
                <option value="mid_left">Meio Esquerda</option>
                <option value="mid_right">Meio Direita</option>
                <option value="bottom_left">Inferior / Frente Esquerda</option>
                <option value="bottom_center">Inferior / Frente Centro</option>
                <option value="bottom_right">Inferior / Frente Direita</option>
              </select>
            </div>
          </div>

          {/* Orientação / Rotação e Status Shore Power */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
                Orientação / Rotação:
              </span>
              <span style={{ fontSize: '9.5px', color: usinaCharger.isConnectedAC ? '#86efac' : '#94a3b8', fontWeight: 600 }}>
                {usinaCharger.isConnectedAC
                  ? `⚡ Injetando ${usinaCharger.chargingAmps}A (${Math.round(usinaCharger.chargingAmps * usinaCharger.voltageOut)}W)`
                  : `🔌 Desconectado (${usinaCharger.modelRating}A máx)`}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {[
                { label: face === 'bottom' ? '0° (Transv./Lat.)' : '0° (Horizontal)', value: 0 },
                { label: face === 'bottom' ? '90° (Longitudinal)' : '90° (Vertical)', value: 90 },
                { label: '180° (Invertida)', value: 180 },
                { label: face === 'bottom' ? '270° (Longit. 2)' : '270° (Vertical 2)', value: 270 }
              ].map(r => {
                const isCur = rotDeg === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    className={`btn-compact ${isCur ? 'active' : ''}`}
                    onClick={() => updateUsinaItem({ rotationDeg: r.value })}
                    style={{
                      padding: '4px 2px',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      background: isCur ? 'rgba(239, 68, 68, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                      borderColor: isCur ? '#ef4444' : '#334155',
                      color: isCur ? '#fca5a5' : '#cbd5e1'
                    }}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
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
              {fitsAll ? '✅ Encaixa com folga neste local' : '⚠️ Dimensão excede o módulo neste local'}
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
