import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const RightPanelAccessorySection: React.FC = () => {
  const {
    cargoBox,
    setCargoBoxEnabled,
    setCargoBoxVerticalLift,
    setCargoBoxTelescopic,
    setTiltAngle,
    setBoxLidAngle,
    tiltSolarRack,
    closeSolarRack,
    openBoxLid,
    closeBoxLid,
    retractAndTilt,
    openModal,
    expansionProgress,
    retract,
    internalBoxes,
    updateInternalBox,
    setInternalBoxes,
    fridgePresets,
    activeFridgePresetId,
    stovePresets,
    activeStovePresetId,
    setViewMode,
    setSelectedBoxId,
  } = useSolar();

  const boxWithFridge = internalBoxes.find((b) => b.hasFridge);
  const currentFridgePreset =
    fridgePresets.find((p) => p.id === (boxWithFridge?.fridgePresetId || activeFridgePresetId)) ||
    fridgePresets[0];

  const boxWithStove = internalBoxes.find((b) => b.hasStove);
  const currentStovePreset =
    stovePresets.find((p) => p.id === (boxWithStove?.stovePresetId || activeStovePresetId)) ||
    stovePresets[0];

  const expansionPct = Math.round(expansionProgress * 100);

  return (
    <>
          {/* 🧰 CONTROLE DE ACESSO AO BAÚ MOTOBUL & BASCULAMENTO SOLAR */}
          {cargoBox.enabled ? (
            <div
              className="cargo-box-panel"
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '8px',
                padding: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '9px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div className="expansion-widget-header" style={{ marginBottom: '2px' }}>
                <span style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  🧰 BAÚ MOTOBUL & BASCULAMENTO
                </span>
                <span
                  className="status-badge"
                  style={{
                    background: cargoBox.tiltAngle > 0 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(100, 116, 139, 0.25)',
                    color: cargoBox.tiltAngle > 0 ? '#fbbf24' : '#94a3b8',
                    border: cargoBox.tiltAngle > 0 ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(100, 116, 139, 0.3)',
                    fontSize: '10px'
                  }}
                >
                  {cargoBox.tiltAngle > 0 ? `Basculado ${Math.round(cargoBox.tiltAngle)}°` : 'Travado (0°)'}
                </span>
              </div>

              {/* Aviso de sobretorque: SÓ aparece se o rack estiver de fato basculado COM gavetas abertas */}
              {cargoBox.enabled && cargoBox.tiltAngle > 0 && expansionPct > 0 && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.18)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '11px',
                    color: '#fca5a5',
                    lineHeight: 1.35
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                    ⚠️ Risco de Sobretorque nos Pistões!
                  </div>
                  Rack basculado com gavetas abertas ({expansionPct}%). Recolha as gavetas para evitar torção mecânica.
                  <button
                    className="btn-compact"
                    onClick={retract}
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      background: '#ef4444',
                      borderColor: '#f87171',
                      color: '#fff',
                      fontWeight: 700,
                      padding: '6px 8px'
                    }}
                  >
                    🔒 Recolher Gavetas Agora
                  </button>
                </div>
              )}

              {/* 1. Bascular Superestrutura Solar (Pistões a Gás de 0° a 65°) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Bascular Painéis Solares:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#f59e0b', fontWeight: 800 }}>
                    {Math.round(cargoBox.tiltAngle)}° / 65°
                  </span>
                </div>
                <input
                  type="range"
                  className="custom-slider"
                  min="0"
                  max="65"
                  step="1"
                  value={cargoBox.tiltAngle}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val > 0 && expansionPct > 0) {
                      retractAndTilt();
                    } else {
                      setTiltAngle(val);
                    }
                  }}
                />
                <div className="slider-actions">
                  <button
                    className={`btn-compact ${cargoBox.tiltAngle === 0 ? 'active' : ''}`}
                    onClick={closeSolarRack}
                  >
                    🔒 Fechar Rack (0°)
                  </button>
                  <button
                    className={`btn-compact ${cargoBox.tiltAngle >= 65 ? 'active accent-amber' : ''}`}
                    onClick={tiltSolarRack}
                  >
                    {expansionPct > 0 ? '⚡ Recolher & Bascular' : '🚀 Bascular (65°)'}
                  </button>
                </div>
              </div>

              {/* 2. Abrir Tampa do Baú Motobul (0° a 38°) */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Tampa do Baú Motobul:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 800 }}>
                    {Math.round(cargoBox.lidAngle)}° / 38°
                  </span>
                </div>
                <input
                  type="range"
                  className="custom-slider"
                  min="0"
                  max="38"
                  step="1"
                  value={cargoBox.lidAngle}
                  onChange={(e) => setBoxLidAngle(parseFloat(e.target.value))}
                />
                <div className="slider-actions">
                  <button
                    className={`btn-compact ${cargoBox.lidAngle === 0 ? 'active' : ''}`}
                    onClick={closeBoxLid}
                  >
                    📦 Fechar Tampa
                  </button>
                  <button
                    className={`btn-compact ${cargoBox.lidAngle >= 35 ? 'active' : ''}`}
                    onClick={openBoxLid}
                  >
                    🔓 Abrir Tampa (38°)
                  </button>
                </div>
              </div>

              {/* 3. Abertura Vertical / Ajuste de Altura do Vão (Torres Telescópicas vs Fixas) */}
              {(() => {
                const isTelescopic = (cargoBox.isTelescopic !== false);
                const maxLiftMm = isTelescopic ? Math.max(60, Math.floor(((cargoBox.height || 330) - 100) / 10) * 10) : 0;
                const curLiftMm = isTelescopic ? Math.min(maxLiftMm, cargoBox.verticalLiftMm || 0) : 0;
                return (
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px' }}>
                    {/* Checkbox Torres Telescópicas de Elevação */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '5px 8px',
                      borderRadius: '5px',
                      marginBottom: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#f8fafc',
                        userSelect: 'none'
                      }}>
                        <input
                          type="checkbox"
                          checked={isTelescopic}
                          onChange={(e) => setCargoBoxTelescopic(e.target.checked)}
                          style={{ accentColor: '#38bdf8', width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        <span>Torres Telescópicas (Subir/Descer)</span>
                      </label>
                      <span style={{
                        fontSize: '9.5px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isTelescopic ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                        color: isTelescopic ? '#38bdf8' : '#94a3b8',
                        fontWeight: 700
                      }}>
                        {isTelescopic ? '↕ Telescópica' : '🔒 Fixa (Mín. Altura)'}
                      </span>
                    </div>

                    {isTelescopic ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>↕ Abertura Vertical (Altura Vão):</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 800 }}>
                            +{curLiftMm} / {maxLiftMm} mm
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', marginBottom: '4px' }}>
                          <span>Barra 30×30 ({cargoBox.height + 20}mm, engaste mín. 90mm)</span>
                          <span style={{ color: '#4ade80', fontWeight: 700 }}>
                            Vão: {cargoBox.height + curLiftMm + 8} mm
                          </span>
                        </div>
                        <input
                          type="range"
                          className="custom-slider"
                          min="0"
                          max={maxLiftMm}
                          step="10"
                          value={curLiftMm}
                          onChange={(e) => setCargoBoxVerticalLift(parseFloat(e.target.value))}
                        />
                        <div className="slider-actions">
                          <button
                            className={`btn-compact ${curLiftMm === 0 ? 'active' : ''}`}
                            onClick={() => setCargoBoxVerticalLift(0)}
                          >
                            ⬇ Baixar (0 mm)
                          </button>
                          <button
                            className={`btn-compact ${curLiftMm >= maxLiftMm ? 'active' : ''}`}
                            onClick={() => setCargoBoxVerticalLift(maxLiftMm)}
                          >
                            ⬆ Curso Máx. (+{maxLiftMm} mm)
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        background: 'rgba(15, 23, 42, 0.5)',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        borderLeft: '3px solid #38bdf8'
                      }}>
                        🔒 <strong>Torres Fixas Selecionadas:</strong> Perfil monobloco fixo no limite mínimo de altura (vão livre rente de 8mm sobre a tampa). Economiza peso e garante a menor altura do conjunto.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px dashed rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                padding: '8px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Baú de teto desativado</span>
              <button
                className="btn-compact primary"
                onClick={() => setCargoBoxEnabled(true)}
                style={{ fontSize: '10px', padding: '4px 8px', color: '#f59e0b', borderColor: '#f59e0b' }}
              >
                + Ativar Baú Motobul
              </button>
            </div>
          )}

          {/* ❄️ POSIÇÃO DA GELADEIRA 12V EMBARCADA */}
          <div className="expansion-widget-divider"></div>
          <div
            className="cargo-box-panel"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '8px',
              padding: '11px',
              display: 'flex',
              flexDirection: 'column',
              gap: '9px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div className="expansion-widget-header" style={{ marginBottom: '2px' }}>
              <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                ❄️ GELADEIRA 12V / 24V
              </span>
              <span
                className="status-badge"
                style={{
                  background: boxWithFridge ? 'rgba(56, 189, 248, 0.25)' : 'rgba(100, 116, 139, 0.25)',
                  color: boxWithFridge ? '#38bdf8' : '#94a3b8',
                  border: boxWithFridge ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(100, 116, 139, 0.3)',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {boxWithFridge ? `Instalada (${boxWithFridge.name})` : 'Desinstalada'}
              </span>
            </div>

            {/* Seletor de Módulo / Local de Instalação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
                Posição / Módulo da Van:
              </label>
              <select
                value={boxWithFridge ? boxWithFridge.id : '__none'}
                onChange={(e) => {
                  const targetId = e.target.value;
                  // Desativa de todos os módulos
                  internalBoxes.forEach((b) => {
                    if (b.hasFridge) {
                      updateInternalBox(b.id, { hasFridge: false, fridgePresetId: undefined });
                    }
                  });
                  // Ativa no módulo escolhido
                  if (targetId !== '__none') {
                    updateInternalBox(targetId, {
                      hasFridge: true,
                      fridgePresetId: currentFridgePreset.id,
                    });
                  }
                }}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.95)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#f8fafc',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                <option value="__none">— Sem geladeira instalada —</option>
                {internalBoxes.map((b) => (
                  <option key={b.id} value={b.id}>
                    📦 {b.name} ({b.type === 'drawer' ? 'Gavetão' : b.type === 'chest' ? 'Baú' : 'Módulo'})
                  </option>
                ))}
              </select>
            </div>

            {/* Informações da Geladeira Instalada e Atalho */}
            {boxWithFridge && (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '10px',
                  color: '#cbd5e1',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Modelo:</span>
                  <strong style={{ color: '#f8fafc' }}>{currentFridgePreset.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Consumo / Vol.:</span>
                  <strong style={{ color: '#fbbf24' }}>
                    {currentFridgePreset.powerEcoWatts}W ECO · {currentFridgePreset.volumeLiters}L
                  </strong>
                </div>
                <button
                  type="button"
                  className="btn-compact primary"
                  onClick={() => {
                    setSelectedBoxId(boxWithFridge.id);
                    setViewMode('internal_boxes');
                  }}
                  style={{
                    marginTop: '2px',
                    fontSize: '10px',
                    padding: '5px',
                    width: '100%',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  📐 Ajustar Rotação e Posição Fina (Modo 1)
                </button>
              </div>
            )}
          </div>

          {/* 🔥 POSIÇÃO DO FOGAREIRO PORTÁTIL NTK */}
          <div className="expansion-widget-divider"></div>
          <div
            className="cargo-box-panel"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(249, 115, 22, 0.35)',
              borderRadius: '8px',
              padding: '11px',
              display: 'flex',
              flexDirection: 'column',
              gap: '9px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div className="expansion-widget-header" style={{ marginBottom: '2px' }}>
              <span style={{ color: '#f97316', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                🔥 FOGAREIRO PORTÁTIL NTK
              </span>
              <span
                className="status-badge"
                style={{
                  background: boxWithStove ? 'rgba(249, 115, 22, 0.25)' : 'rgba(100, 116, 139, 0.25)',
                  color: boxWithStove ? '#fb923c' : '#94a3b8',
                  border: boxWithStove ? '1px solid rgba(249, 115, 22, 0.5)' : '1px solid rgba(100, 116, 139, 0.3)',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {boxWithStove
                  ? `Instalado (${boxWithStove.name})`
                  : 'Desinstalado'}
              </span>
            </div>

            {/* Seletor de Módulo / Local de Instalação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
                Posição / Módulo da Van:
              </label>
              <select
                value={boxWithStove ? boxWithStove.id : '__none'}
                onChange={(e) => {
                  const targetId = e.target.value;
                  setInternalBoxes((prev: any[]) =>
                    prev.map((b) => {
                      if (b.id === targetId) {
                        return {
                          ...b,
                          hasStove: true,
                          stovePresetId: currentStovePreset.id,
                          stovePlacement: b.stovePlacement || 'top',
                          stoveRotation: b.stoveRotation ?? 0,
                          stoveAlignX: b.stoveAlignX ?? 'center',
                          stoveAlignZ: b.stoveAlignZ ?? 'center',
                          stoveOffsetX: b.stoveOffsetX ?? 0,
                          stoveOffsetZ: b.stoveOffsetZ ?? 0,
                        };
                      }
                      if (b.hasStove) {
                        return { ...b, hasStove: false, stovePresetId: undefined };
                      }
                      return b;
                    })
                  );
                  if (targetId !== '__none') {
                    setSelectedBoxId(targetId);
                  }
                }}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.95)',
                  border: '1px solid rgba(249, 115, 22, 0.4)',
                  color: '#f8fafc',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                <option value="__none">— Sem fogareiro instalado —</option>
                {internalBoxes.map((b) => (
                  <option key={b.id} value={b.id}>
                    📦 {b.name} ({b.type === 'drawer' ? 'Gavetão' : b.type === 'chest' ? 'Baú' : 'Módulo'})
                  </option>
                ))}
              </select>
            </div>

            {/* Se instalado, opções completas de posicionamento e atalho para o modo 1 */}
            {boxWithStove && (() => {
              const placement = boxWithStove.stovePlacement || 'top';
              const rotation = boxWithStove.stoveRotation || 0;
              const alignX = boxWithStove.stoveAlignX || 'center';
              const alignZ = boxWithStove.stoveAlignZ || 'center';
              const offsetX = boxWithStove.stoveOffsetX || 0;
              const offsetZ = boxWithStove.stoveOffsetZ || 0;

              return (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '10px',
                    color: '#cbd5e1',
                  }}
                >
                  {/* Superfície de Instalação */}
                  <div>
                    <div style={{ color: '#94a3b8', marginBottom: '3px', fontWeight: 700 }}>
                      Superfície de Apoio:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                      {[
                        { id: 'top', label: '🍳 Bancada' },
                        { id: 'inside', label: '📥 Gaveta' },
                        { id: 'rear_shelf', label: '🪑 Mesa Tras.' }
                      ].map(s => (
                        <button
                          key={s.id}
                          type="button"
                          className={`btn-compact ${placement === s.id ? 'active' : ''}`}
                          onClick={() => updateInternalBox(boxWithStove.id, { stovePlacement: s.id as any })}
                          style={{
                            fontSize: '9.5px',
                            padding: '4px 2px',
                            borderColor: placement === s.id ? '#f97316' : undefined,
                            color: placement === s.id ? '#f97316' : undefined
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rotação / Orientação */}
                  <div>
                    <div style={{ color: '#94a3b8', marginBottom: '3px', fontWeight: 700 }}>
                      Orientação:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3px' }}>
                      {[
                        { label: '0°', val: 0 },
                        { label: '90°', val: 90 },
                        { label: '180°', val: 180 },
                        { label: '270°', val: 270 }
                      ].map(r => (
                        <button
                          key={r.val}
                          type="button"
                          className={`btn-compact ${rotation === r.val ? 'active' : ''}`}
                          onClick={() => updateInternalBox(boxWithStove.id, { stoveRotation: r.val as any })}
                          style={{
                            fontSize: '9.5px',
                            padding: '3px 2px',
                            borderColor: rotation === r.val ? '#f97316' : undefined,
                            color: rotation === r.val ? '#fb923c' : undefined
                          }}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alinhamento Rápido X e Z */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div>
                      <div style={{ color: '#94a3b8', marginBottom: '3px', fontWeight: 700 }}>
                        Alinh. Lateral:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
                        {[
                          { label: 'Esq', val: 'left' },
                          { label: 'Cen', val: 'center' },
                          { label: 'Dir', val: 'right' }
                        ].map(a => (
                          <button
                            key={a.val}
                            type="button"
                            className={`btn-compact ${alignX === a.val ? 'active' : ''}`}
                            onClick={() => updateInternalBox(boxWithStove.id, { stoveAlignX: a.val as any })}
                            style={{
                              fontSize: '9px',
                              padding: '3px 1px',
                              borderColor: alignX === a.val ? '#f97316' : undefined,
                              color: alignX === a.val ? '#fb923c' : undefined
                            }}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: '#94a3b8', marginBottom: '3px', fontWeight: 700 }}>
                        Alinh. Prof.:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
                        {[
                          { label: 'Fre', val: 'front' },
                          { label: 'Cen', val: 'center' },
                          { label: 'Fun', val: 'back' }
                        ].map(a => (
                          <button
                            key={a.val}
                            type="button"
                            className={`btn-compact ${alignZ === a.val ? 'active' : ''}`}
                            onClick={() => updateInternalBox(boxWithStove.id, { stoveAlignZ: a.val as any })}
                            style={{
                              fontSize: '9px',
                              padding: '3px 1px',
                              borderColor: alignZ === a.val ? '#f97316' : undefined,
                              color: alignZ === a.val ? '#fb923c' : undefined
                            }}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ajustes Finos (Sliders) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8' }}>
                        <span>Offset X:</span>
                        <strong style={{ color: '#fb923c' }}>{offsetX > 0 ? `+${offsetX}` : offsetX}mm</strong>
                      </div>
                      <input
                        type="range"
                        className="custom-slider"
                        min="-150"
                        max="150"
                        step="5"
                        value={offsetX}
                        onChange={(e) => updateInternalBox(boxWithStove.id, { stoveOffsetX: parseInt(e.target.value, 10) })}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8' }}>
                        <span>Offset Z:</span>
                        <strong style={{ color: '#fb923c' }}>{offsetZ > 0 ? `+${offsetZ}` : offsetZ}mm</strong>
                      </div>
                      <input
                        type="range"
                        className="custom-slider"
                        min="-150"
                        max="150"
                        step="5"
                        value={offsetZ}
                        onChange={(e) => updateInternalBox(boxWithStove.id, { stoveOffsetZ: parseInt(e.target.value, 10) })}
                      />
                    </div>
                  </div>

                  {(offsetX !== 0 || offsetZ !== 0) && (
                    <button
                      type="button"
                      className="btn-compact"
                      onClick={() => updateInternalBox(boxWithStove.id, { stoveOffsetX: 0, stoveOffsetZ: 0 })}
                      style={{
                        width: '100%',
                        fontSize: '9px',
                        padding: '2px',
                        color: '#94a3b8',
                        background: 'rgba(30, 41, 59, 0.5)'
                      }}
                    >
                      ↺ Centralizar Offsets (0, 0 mm)
                    </button>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span style={{ color: '#94a3b8' }}>Modelo:</span>
                    <strong style={{ color: '#f8fafc' }}>{currentStovePreset.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Dimensões:</span>
                    <strong style={{ color: '#fb923c' }}>
                      {currentStovePreset.width} × {currentStovePreset.depth} × {currentStovePreset.height} mm
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="btn-compact primary"
                    onClick={() => {
                      setSelectedBoxId(boxWithStove.id);
                      setViewMode('internal_boxes');
                    }}
                    style={{
                      marginTop: '2px',
                      fontSize: '10px',
                      padding: '5px',
                      width: '100%',
                      justifyContent: 'center',
                      fontWeight: 700,
                      borderColor: '#f97316',
                      color: '#f97316',
                      background: 'rgba(249, 115, 22, 0.15)'
                    }}
                  >
                    📐 Focar no Módulo (Modo 1)
                  </button>
                </div>
              );
            })()}
          </div>

      <div className="expansion-widget-divider"></div>
    </>
  );
};
