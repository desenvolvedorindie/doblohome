import { PlannerBoxPanelsSection } from './PlannerBoxPanelsSection';
import React from 'react';
import { useSolar } from '../../context/SolarContext';
import {
  InternalBoxItem,
  InternalBoxMaterial,
  InternalBoxType,
  ChestHingeDirection,
  BoxSlideDirection,
  getAvailableSlideDirections,
  BoxPanelsConfig,
  calculateMaxVerticalLift
} from '../../types';
import { PlannerSlatBedSection } from './PlannerSlatBedSection';
import { PlannerRearTableSection } from './PlannerRearTableSection';
import { PlannerUpperCabinetSection } from './PlannerUpperCabinetSection';
import { PlannerFridgeSection } from './PlannerFridgeSection';
import { PlannerPortaPottiSection } from './PlannerPortaPottiSection';
import { PlannerStoveSection } from './PlannerStoveSection';
import { PlannerBatterySection } from './PlannerBatterySection';
import { PlannerMpptSection } from './PlannerMpptSection';
import { PlannerB2bSection } from './PlannerB2bSection';
import { PlannerUsinaSection } from './PlannerUsinaSection';
import { PlannerBoxLedSection } from './PlannerBoxLedSection';

interface PlannerBoxInspectorProps {
  cols?: number;
  rows?: number;
}

export const PlannerBoxInspector: React.FC<PlannerBoxInspectorProps> = ({ cols: propCols, rows: propRows }) => {
  const {
    internalGrid,
    internalBoxes,
    selectedBoxId,
    setSelectedBoxId,
    isolatedBoxId,
    setIsolatedBoxId,
    isOpenPreview,
    setIsOpenPreview,
    updateInternalBox,
    removeInternalBox,
  } = useSolar();

  const cols = propCols ?? Math.max(1, internalGrid.colsX);
  const rows = propRows ?? Math.max(1, internalGrid.rowsZ);

  const selectedBox = internalBoxes.find((b) => b.id === selectedBoxId);
  if (!selectedBox) return null;

  const baseBoxWMm = Math.round(selectedBox.colSpan * (internalGrid.widthMm / cols));
  const baseBoxLMm = Math.round(selectedBox.rowSpan * (internalGrid.lengthMm / rows));
  const extraWMm = selectedBox.extraWidthMm || 0;
  const extraLMm = selectedBox.extraLengthMm || 0;
  const offsetXMm = selectedBox.offsetXMm || 0;
  const offsetZMm = selectedBox.offsetZMm || 0;
  const boxWMm = Math.max(50, baseBoxWMm + extraWMm);
  const boxLMm = Math.max(50, baseBoxLMm + extraLMm);

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '12px',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        padding: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedBox.name}
          </div>
          {isolatedBoxId === selectedBox.id && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                background: 'rgba(2, 132, 199, 0.4)',
                border: '1px solid #38bdf8',
                color: '#7dd3fc',
                padding: '2px 8px',
                borderRadius: '12px',
                whiteSpace: 'nowrap'
              }}
            >
              🎯 MODO FOCO ATIVO
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setIsolatedBoxId(isolatedBoxId === selectedBox.id ? null : selectedBox.id)}
            className="btn-compact"
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '4px 8px',
              background: isolatedBoxId === selectedBox.id ? '#0284c7' : 'rgba(56, 189, 248, 0.15)',
              color: isolatedBoxId === selectedBox.id ? '#ffffff' : '#38bdf8',
              border: '1px solid #38bdf8',
              whiteSpace: 'nowrap'
            }}
            title={isolatedBoxId === selectedBox.id ? 'Voltar para exibir todos os demais baús' : 'Isolar este baú no 3D e tornar os outros transparentes'}
          >
            {isolatedBoxId === selectedBox.id ? '← Voltar' : '🎯 Isolar 3D'}
          </button>
          <button
            onClick={() => removeInternalBox(selectedBox.id)}
            className="btn-compact"
            style={{
              fontSize: '10.5px',
              padding: '4px 8px',
              color: '#f87171',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              whiteSpace: 'nowrap'
            }}
            title="Excluir este módulo"
          >
            🗑️ Excluir
          </button>
          <button
            type="button"
            onClick={() => setSelectedBoxId(null)}
            className="btn-compact"
            style={{
              fontSize: '10.5px',
              padding: '4px 8px',
              color: '#94a3b8',
              borderColor: 'rgba(148, 163, 184, 0.3)',
              whiteSpace: 'nowrap'
            }}
            title="Desmarcar seleção"
          >
            ✕ Desmarcar
          </button>
        </div>
      </div>

      {/* ─── 1. PRIMEIRAS OPÇÕES: ALTURA & AJUSTE NO GRID ─── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {/* Altura da Caixa */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>📏</span>
              <span>1. Altura do Módulo:</span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
              {selectedBox.heightMm} mm <span style={{ color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>({(selectedBox.heightMm / 10).toFixed(0)} cm)</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min={200}
              max={700}
              step={1}
              value={selectedBox.heightMm}
              onChange={(e) => {
                const newH = Number(e.target.value);
                const maxAllowedLift = calculateMaxVerticalLift(newH);
                updateInternalBox(selectedBox.id, {
                  heightMm: newH,
                  ...(selectedBox.liftHeightMm && selectedBox.liftHeightMm > maxAllowedLift ? { liftHeightMm: maxAllowedLift } : {})
                });
              }}
              style={{ flex: 1, accentColor: '#38bdf8' }}
            />
            <input
              type="number"
              min={100}
              max={1200}
              step={1}
              value={selectedBox.heightMm}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!isNaN(v) && v >= 50) {
                  const maxAllowedLift = calculateMaxVerticalLift(v);
                  updateInternalBox(selectedBox.id, {
                    heightMm: v,
                    ...(selectedBox.liftHeightMm && selectedBox.liftHeightMm > maxAllowedLift ? { liftHeightMm: maxAllowedLift } : {})
                  });
                }
              }}
              style={{
                width: '56px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '4px',
                padding: '2px 4px',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                textAlign: 'center'
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginTop: '6px' }}>
            {[300, 350, 400, 450, 500].map((hVal) => {
              const maxAllowedLift = calculateMaxVerticalLift(hVal);
              return (
                <button
                  key={hVal}
                  type="button"
                  onClick={() =>
                    updateInternalBox(selectedBox.id, {
                      heightMm: hVal,
                      ...(selectedBox.liftHeightMm && selectedBox.liftHeightMm > maxAllowedLift ? { liftHeightMm: maxAllowedLift } : {})
                    })
                  }
                  className="btn-compact"
                  style={{
                    fontSize: '10px',
                    padding: '4px 2px',
                    fontWeight: selectedBox.heightMm === hVal ? 800 : 600,
                    background: selectedBox.heightMm === hVal ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                    borderColor: selectedBox.heightMm === hVal ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)',
                    color: selectedBox.heightMm === hVal ? '#38bdf8' : '#94a3b8'
                  }}
                >
                  {hVal}
                </button>
              );
            })}
          </div>
        </div>

        {/* Acréscimo / Ajuste Fino de Dimensões e Deslocamento além das Colunas Iguais do Grid */}
        <div
          style={{
            borderTop: '1px solid rgba(148, 163, 184, 0.18)',
            paddingTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>➕</span>
              <span>2. Acréscimo Fino & Deslocamento (Fora da Divisão Igual):</span>
            </span>
            {(extraWMm !== 0 || extraLMm !== 0 || offsetXMm !== 0 || offsetZMm !== 0) && (
              <button
                type="button"
                className="btn-compact"
                onClick={() =>
                  updateInternalBox(selectedBox.id, {
                    extraWidthMm: 0,
                    extraLengthMm: 0,
                    offsetXMm: 0,
                    offsetZMm: 0
                  })
                }
                style={{ fontSize: '9.5px', padding: '2px 7px', color: '#94a3b8' }}
                title="Zerar acréscimos e deslocamentos deste módulo"
              >
                ↺ Zerar Ajustes
              </button>
            )}
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
            Como o grid divide em colunas iguais ({baseBoxWMm} × {baseBoxLMm} mm), use os controles abaixo para dar <strong>acréscimo ou redução em milímetros</strong> na largura/comprimento ou deslocar o módulo:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {/* Acréscimo de Largura (X) */}
            <div style={{ background: 'rgba(15, 23, 42, 0.55)', padding: '7px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 700 }}>↔ Acréscimo Largura:</span>
                <strong style={{ color: extraWMm !== 0 ? '#fbbf24' : '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  {extraWMm >= 0 ? `+${extraWMm}` : extraWMm} mm ({boxWMm} mm)
                </strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="range"
                  min={-250}
                  max={400}
                  step={1}
                  value={extraWMm}
                  onChange={(e) => updateInternalBox(selectedBox.id, { extraWidthMm: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: '#f59e0b' }}
                />
                <input
                  type="number"
                  min={-400}
                  max={600}
                  step={1}
                  value={extraWMm}
                  onChange={(e) => updateInternalBox(selectedBox.id, { extraWidthMm: Number(e.target.value) || 0 })}
                  style={{
                    width: '52px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '4px',
                    padding: '2px 4px',
                    color: '#fff',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>

            {/* Acréscimo de Comprimento (Z) */}
            <div style={{ background: 'rgba(15, 23, 42, 0.55)', padding: '7px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 700 }}>↕ Acréscimo Compr.:</span>
                <strong style={{ color: extraLMm !== 0 ? '#fbbf24' : '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  {extraLMm >= 0 ? `+${extraLMm}` : extraLMm} mm ({boxLMm} mm)
                </strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="range"
                  min={-250}
                  max={400}
                  step={1}
                  value={extraLMm}
                  onChange={(e) => updateInternalBox(selectedBox.id, { extraLengthMm: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: '#f59e0b' }}
                />
                <input
                  type="number"
                  min={-400}
                  max={600}
                  step={1}
                  value={extraLMm}
                  onChange={(e) => updateInternalBox(selectedBox.id, { extraLengthMm: Number(e.target.value) || 0 })}
                  style={{
                    width: '52px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '4px',
                    padding: '2px 4px',
                    color: '#fff',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>

            {/* Deslocamento Lateral (Offset X) */}
            <div style={{ background: 'rgba(15, 23, 42, 0.55)', padding: '7px 8px', borderRadius: '6px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 700 }}>⇄ Deslocar Esq/Dir (X):</span>
                <strong style={{ color: offsetXMm !== 0 ? '#38bdf8' : '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  {offsetXMm >= 0 ? `+${offsetXMm}` : offsetXMm} mm
                </strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="range"
                  min={-250}
                  max={250}
                  step={1}
                  value={offsetXMm}
                  onChange={(e) => updateInternalBox(selectedBox.id, { offsetXMm: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: '#38bdf8' }}
                />
                <input
                  type="number"
                  min={-400}
                  max={400}
                  step={1}
                  value={offsetXMm}
                  onChange={(e) => updateInternalBox(selectedBox.id, { offsetXMm: Number(e.target.value) || 0 })}
                  style={{
                    width: '52px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '4px',
                    padding: '2px 4px',
                    color: '#fff',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>

            {/* Deslocamento Longitudinal (Offset Z) */}
            <div style={{ background: 'rgba(15, 23, 42, 0.55)', padding: '7px 8px', borderRadius: '6px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 700 }}>⇅ Deslocar Frente/Trás (Z):</span>
                <strong style={{ color: offsetZMm !== 0 ? '#38bdf8' : '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  {offsetZMm >= 0 ? `+${offsetZMm}` : offsetZMm} mm
                </strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="range"
                  min={-250}
                  max={250}
                  step={1}
                  value={offsetZMm}
                  onChange={(e) => updateInternalBox(selectedBox.id, { offsetZMm: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: '#38bdf8' }}
                />
                <input
                  type="number"
                  min={-400}
                  max={400}
                  step={1}
                  value={offsetZMm}
                  onChange={(e) => updateInternalBox(selectedBox.id, { offsetZMm: Number(e.target.value) || 0 })}
                  style={{
                    width: '52px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '4px',
                    padding: '2px 4px',
                    color: '#fff',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {/* Nome */}
        <div>
          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
            Nome do Módulo:
          </label>
          <input
            type="text"
            value={selectedBox.name}
            onChange={(e) => updateInternalBox(selectedBox.id, { name: e.target.value })}
            style={{
              width: '100%',
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              color: '#ffffff',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          />
        </div>

        {/* Tipo de Abertura */}
        <div>
          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
            Tipo de Abertura / Mecanismo:
          </label>
          <select
            value={selectedBox.type === 'drawer' && selectedBox.drawerMode === 'slide_tray' ? 'slide_tray' : selectedBox.type}
            onChange={(e) => {
              const newType = e.target.value as InternalBoxType;
              updateInternalBox(selectedBox.id, {
                type: newType,
                drawerMode: newType === 'slide_tray' ? 'slide_tray' : newType === 'drawer' ? 'drawer' : undefined
              });
            }}
            style={{
              width: '100%',
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              color: '#ffffff',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          >
            <option value="chest">🧰 Baú com Tampa Basculante Superior</option>
            <option value="vertical_lift">🏗️ Extensível para Cima (Módulo Elevatório)</option>
            <option value="drawer">📦 Gavetão Deslizante Traseiro</option>
            <option value="slide_tray">🛝 Bandeja Corrediça Rasa (Geladeira / Fogão)</option>
            <option value="slat_bed">🛏️ Cama (Sofá-Cama)</option>
            <option value="open">🚪 Nicho / Compartimento Aberto</option>
          </select>
        </div>

        {/* Configuração do Módulo Elevatório Vertical (Extensível para Cima c/ Barras de Ferro) */}
        {selectedBox.type === 'vertical_lift' && (
          <div
            style={{
              gridColumn: '1 / -1',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.75), rgba(30, 41, 59, 0.6))',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {/* Cabeçalho com botão de elevação */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>🏗️</span>
                <span>Mecanismo Elevatório c/ Barras de Ferro:</span>
              </span>
              <button
                type="button"
                className="btn-compact"
                onClick={() => updateInternalBox(selectedBox.id, { isOpen: !selectedBox.isOpen })}
                style={{
                  fontSize: '10.5px',
                  padding: '4px 10px',
                  fontWeight: 800,
                  background: selectedBox.isOpen
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  borderColor: selectedBox.isOpen ? '#34d399' : '#38bdf8',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Elevar ou recolher o tampo no modelo 3D"
              >
                <span>{selectedBox.isOpen ? '⬇️' : '⬆️'}</span>
                <span>{selectedBox.isOpen ? 'Elevado (Baixar)' : 'Elevar Módulo (+Y)'}</span>
              </button>
            </div>

            {/* Ajuste de Altura de Elevação (+Y em mm) - Limitado estritamente à regra do cilindro do pistão e altura do móvel */}
            {(() => {
              const maxLiftMm = calculateMaxVerticalLift(selectedBox.heightMm);
              const currentLiftMm = Math.min(maxLiftMm, selectedBox.liftHeightMm ?? Math.min(250, maxLiftMm));
              const presetHeights = Array.from(
                new Set([
                  Math.round(maxLiftMm * 0.25),
                  Math.round(maxLiftMm * 0.5),
                  Math.round(maxLiftMm * 0.75),
                  maxLiftMm
                ])
              ).filter((v) => v >= 30).sort((a, b) => a - b);

              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
                      📏 Curso de Elevação (+Y) (Máx: {maxLiftMm} mm):
                    </span>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      +{currentLiftMm} mm
                      <span style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 600, marginLeft: '4px' }}>
                        (Total: {selectedBox.heightMm + (selectedBox.isOpen ? currentLiftMm : 0)} mm)
                      </span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="range"
                      min={30}
                      max={maxLiftMm}
                      step={5}
                      value={currentLiftMm}
                      onChange={(e) => updateInternalBox(selectedBox.id, { liftHeightMm: Math.min(maxLiftMm, Number(e.target.value)) })}
                      style={{ flex: 1, accentColor: '#38bdf8' }}
                    />
                    <input
                      type="number"
                      min={30}
                      max={maxLiftMm}
                      step={5}
                      value={currentLiftMm}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!isNaN(v) && v >= 30) updateInternalBox(selectedBox.id, { liftHeightMm: Math.min(maxLiftMm, v) });
                      }}
                      style={{
                        width: '58px',
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        borderRadius: '4px',
                        padding: '2px 4px',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        textAlign: 'center'
                      }}
                    />
                  </div>

                  {/* Botões rápidos de altura parametrizados pela capacidade física do pistão */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${presetHeights.length}, 1fr)`, gap: '4px', marginTop: '6px' }}>
                    {presetHeights.map((hVal) => {
                      const isMax = hVal === maxLiftMm;
                      const label = isMax ? `Máx (${hVal})` : `+${hVal}mm`;
                      return (
                        <button
                          key={hVal}
                          type="button"
                          onClick={() => updateInternalBox(selectedBox.id, { liftHeightMm: hVal })}
                          className="btn-compact"
                          style={{
                            fontSize: '9px',
                            padding: '3px 0',
                            textAlign: 'center',
                            background: currentLiftMm === hVal ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                            borderColor: currentLiftMm === hVal ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)',
                            color: currentLiftMm === hVal ? '#38bdf8' : '#94a3b8'
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
                    💡 Pela regra técnica do pistão (DIN 71805), o curso de elevação é limitado a {maxLiftMm}mm para que a haste nunca ultrapasse o curso alojado dentro do cilindro.
                  </div>
                </div>
              );
            })()}

            {/* Tipo de Mecanismo de Barras de Ferro */}
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                🔩 Estrutura das Barras de Ferro Internas:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { id: 'pantograph', label: 'Tesoura X', desc: 'Braços Pantográficos em X', icon: '✂️' },
                  { id: 'telescopic', label: 'Telescópico', desc: '4 Colunas Guia de Canto', icon: '🏛️' }
                ].map((mech) => {
                  const currentMech = selectedBox.liftMechanism === 'telescopic' ? 'telescopic' : 'pantograph';
                  const isCurrent = currentMech === mech.id;
                  return (
                    <button
                      key={mech.id}
                      type="button"
                      className={`btn-compact ${isCurrent ? 'active' : ''}`}
                      onClick={() => updateInternalBox(selectedBox.id, { liftMechanism: mech.id as any })}
                      style={{
                        padding: '7px 6px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      <span>{mech.icon} {mech.label}</span>
                      <span style={{ fontSize: '9px', opacity: 0.8, fontWeight: 500 }}>{mech.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dica explicativa */}
            <div style={{ fontSize: '9px', color: '#64748b', lineHeight: 1.3 }}>
              💡 Barras de ferro de precisão instaladas no interior da caixa sustentam o tampo móvel elevado para servir de bancada alta de cozinha, mesa de trabalho ou refeição.
            </div>
          </div>
        )}

        {/* Configuração de Prateleiras do Nicho com Beradinha */}
        {selectedBox.type === 'open' && (
          <div style={{ gridColumn: '1 / -1', background: 'rgba(15, 23, 42, 0.4)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#38bdf8' }}>
                📚 Prateleiras do Nicho c/ Beradinha:
              </span>
              <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                {selectedBox.openShelves || 0} {(selectedBox.openShelves || 0) === 1 ? 'Prateleira' : 'Prateleiras'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {[0, 1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`btn-compact ${(selectedBox.openShelves || 0) === num ? 'active' : ''}`}
                  onClick={() => updateInternalBox(selectedBox.id, { openShelves: num })}
                  style={{
                    fontSize: '11px',
                    padding: '6px 4px',
                    fontWeight: 700
                  }}
                >
                  {num === 0 ? 'Vão Livre' : `${num} ${num === 1 ? 'Prat.' : 'Prats.'}`}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
              💡 Toda prateleira do nicho inclui automaticamente uma beradinha anti-queda (25mm) para impedir a queda de objetos durante as viagens.
            </div>
          </div>
        )}

        {/* Descrição informativa do módulo deslizante (Gavetão vs Bandeja) */}
        {(selectedBox.type === 'drawer' || selectedBox.type === 'slide_tray') && (
          <div style={{ gridColumn: '1 / -1', fontSize: '10px', color: '#94a3b8', marginTop: '-4px', background: 'rgba(15, 23, 42, 0.4)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
            {selectedBox.type === 'slide_tray'
              ? '🛝 Bandeja rasa com abas baixas de contenção (45mm) e corrediças telescópicas para geladeira 12V ou fogão.'
              : '📦 Gavetão fechado tradicional com laterais altas e frente total em compensado naval 15mm.'}
          </div>
        )}

        {/* Alternância entre Cama com Ripas e Cama com Dobradiça */}
        {selectedBox.type === 'slat_bed' && (
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Modo Construtivo da Cama:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                className={`btn-compact ${(selectedBox.bedMode || 'slat') === 'slat' ? 'active' : ''}`}
                onClick={() => updateInternalBox(selectedBox.id, { bedMode: 'slat' })}
                style={{
                  fontSize: '11px',
                  padding: '8px 6px',
                  fontWeight: 700,
                  background: (selectedBox.bedMode || 'slat') === 'slat'
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(37, 99, 235, 0.4))'
                    : undefined
                }}
              >
                🛏️ Retrátil c/ Ripas
              </button>
              <button
                type="button"
                className={`btn-compact ${selectedBox.bedMode === 'hinged' ? 'active' : ''}`}
                onClick={() => updateInternalBox(selectedBox.id, { bedMode: 'hinged' })}
                style={{
                  fontSize: '11px',
                  padding: '8px 6px',
                  fontWeight: 700,
                  background: selectedBox.bedMode === 'hinged'
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(37, 99, 235, 0.4))'
                    : undefined
                }}
              >
                🚪 Articulada c/ Dobradiça
              </button>
            </div>
            <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>
              {selectedBox.bedMode === 'hinged'
                ? '• Folha dobrável em compensado com dobradiças contínuas que rebate 180° e pés articulados de apoio.'
                : '• Estrado de ripamento retrátil intercalado em formato de pente com quadro móvel em L invertido.'}
            </div>
          </div>
        )}

        {/* Direção da Corrediça (Abertura para Direções Vazias) */}
        {(selectedBox.type === 'drawer' || selectedBox.type === 'slide_tray') && (() => {
          const slideDirs = getAvailableSlideDirections(selectedBox, internalBoxes);
          const currentDir = selectedBox.slideDirection || (slideDirs.find(d => d.isAvailable)?.direction || 'rear');
          return (
            <div style={{ gridColumn: '1 / -1', background: 'rgba(15, 23, 42, 0.45)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: 700, margin: 0 }}>
                  🛝 Direção de Abertura da Corrediça:
                </label>
                <button
                  type="button"
                  className="btn-compact"
                  onClick={() => updateInternalBox(selectedBox.id, { isOpen: !selectedBox.isOpen })}
                  style={{
                    fontSize: '10.5px',
                    padding: '4px 10px',
                    fontWeight: 700,
                    background: selectedBox.isOpen
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    borderColor: selectedBox.isOpen ? '#34d399' : '#38bdf8',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Testar deslizamento da corrediça no modelo 3D (leva a geladeira/fogareiro junto)"
                >
                  <span>{selectedBox.isOpen ? '🔓' : '🛝'}</span>
                  <span>{selectedBox.isOpen ? 'Deslizada (Fechar)' : 'Deslizar Corrediça'}</span>
                </button>
              </div>

              <select
                value={currentDir}
                onChange={(e) => {
                  const newDir = e.target.value as BoxSlideDirection;
                  updateInternalBox(selectedBox.id, { slideDirection: newDir });
                }}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  color: '#ffffff',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                {slideDirs.map((d) => (
                  <option
                    key={d.direction}
                    value={d.direction}
                    disabled={!d.isAvailable}
                    style={{ color: d.isAvailable ? '#ffffff' : '#94a3b8' }}
                  >
                    {d.icon} {d.label} {d.isAvailable ? '• [LIVRE]' : `• [BLOQUEADA por ${d.blockedBy}]`}
                  </option>
                ))}
              </select>

              <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '5px' }}>
                💡 Apenas direções desobstruídas (vazias) podem ser selecionadas. A geladeira ou fogão acompanha a corrediça na abertura.
              </div>
            </div>
          );
        })()}

        {/* Direção da Dobradiça (Exclusivo para Baú) */}
        {selectedBox.type === 'chest' && (
          <div>
            <label style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Direção de Abertura do Baú:
            </label>
            <select
              value={selectedBox.chestHingeDirection || 'front'}
              onChange={(e) => {
                const newDir = e.target.value as ChestHingeDirection;
                updateInternalBox(selectedBox.id, { chestHingeDirection: newDir });
                setIsOpenPreview(true);
              }}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                color: '#ffffff',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <option value="front">▲ Frente (Dobradiça na Frente / Bancos)</option>
              <option value="rear">▼ Trás (Dobradiça no Porta-Malas)</option>
              <option value="left">◀ Esquerda (Dobradiça Lado Motorista)</option>
              <option value="right">▶ Direita (Dobradiça Lado Passageiro)</option>
            </select>
          </div>
        )}

        {/* Material / Acabamento */}
        <div>
          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
            Material / Textura 3D:
          </label>
          <select
            value={selectedBox.material}
            onChange={(e) => updateInternalBox(selectedBox.id, { material: e.target.value as InternalBoxMaterial })}
            style={{
              width: '100%',
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              color: '#ffffff',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          >
            <option value="plywood">🪵 Compensado Naval Claro (Padrão Camper)</option>
            <option value="dark_wood">🪵 Madeira Nobre / Escura</option>
            <option value="white_mdf">⚪ MDF Branco Acetinado</option>
            <option value="aluminum_box">⚙️ Gabinete Alumínio Estrutural</option>
          </select>
        </div>
      </div>

      <PlannerSlatBedSection selectedBox={selectedBox} cols={cols} rows={rows} />
      <PlannerBatterySection selectedBox={selectedBox} boxWMm={boxWMm} boxLMm={boxLMm} />
      <PlannerMpptSection selectedBox={selectedBox} boxWMm={boxWMm} boxLMm={boxLMm} />
      <PlannerB2bSection selectedBox={selectedBox} boxWMm={boxWMm} boxLMm={boxLMm} />
      <PlannerUsinaSection selectedBox={selectedBox} boxWMm={boxWMm} boxLMm={boxLMm} />
      <PlannerFridgeSection selectedBox={selectedBox} boxWMm={boxWMm} boxLMm={boxLMm} />
      <PlannerPortaPottiSection selectedBox={selectedBox} boxWMm={boxWMm} boxLMm={boxLMm} />
      <PlannerStoveSection selectedBox={selectedBox} boxWMm={boxWMm} boxLMm={boxLMm} />
      <PlannerBoxPanelsSection selectedBox={selectedBox} />
      <PlannerBoxLedSection selectedBox={selectedBox} />
      <PlannerRearTableSection selectedBox={selectedBox} boxWMm={boxWMm} />
      <PlannerUpperCabinetSection selectedBox={selectedBox} />
    </div>
  );
};
