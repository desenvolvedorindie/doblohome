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
  BoxPanelsConfig
} from '../../types';
import { PlannerSlatBedSection } from './PlannerSlatBedSection';
import { PlannerRearTableSection } from './PlannerRearTableSection';
import { PlannerUpperCabinetSection } from './PlannerUpperCabinetSection';
import { PlannerFridgeSection } from './PlannerFridgeSection';
import { PlannerPortaPottiSection } from './PlannerPortaPottiSection';
import { PlannerStoveSection } from './PlannerStoveSection';

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

  const boxWMm = Math.round(selectedBox.colSpan * (internalGrid.widthMm / cols));
  const boxLMm = Math.round(selectedBox.rowSpan * (internalGrid.lengthMm / rows));

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
          <input
            type="range"
            min={200}
            max={700}
            step={10}
            value={selectedBox.heightMm}
            onChange={(e) => updateInternalBox(selectedBox.id, { heightMm: Number(e.target.value) })}
            style={{ width: '100%', accentColor: '#38bdf8' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginTop: '6px' }}>
            {[300, 350, 400, 450, 500].map((hVal) => (
              <button
                key={hVal}
                type="button"
                onClick={() => updateInternalBox(selectedBox.id, { heightMm: hVal })}
                className="btn-compact"
                style={{
                  fontSize: '10px',
                  padding: '4px 0',
                  textAlign: 'center',
                  background: selectedBox.heightMm === hVal ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                  borderColor: selectedBox.heightMm === hVal ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)',
                  color: selectedBox.heightMm === hVal ? '#38bdf8' : '#94a3b8'
                }}
              >
                {hVal} mm
              </button>
            ))}
          </div>
        </div>

        {/* Ajuste no Grid: Dimensões (Colunas/Linhas) e Posição */}
        <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.18)', paddingTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>📐</span>
              <span>2. Ajuste de Ocupação no Grid:</span>
            </span>
            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
              Dimensões: <strong style={{ color: '#fbbf24' }}>{boxWMm} × {boxLMm} mm</strong> ({selectedBox.colSpan} col × {selectedBox.rowSpan} lin)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {/* Largura (+/- Coluna) */}
            <button
              type="button"
              disabled={selectedBox.colSpan <= 1}
              onClick={() => updateInternalBox(selectedBox.id, { colSpan: selectedBox.colSpan - 1 })}
              className="btn-compact"
              style={{ fontSize: '10px', padding: '5px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}
              title="Diminuir largura ocupada no grid"
            >
              ◀ Encolher Larg.
            </button>
            <button
              type="button"
              disabled={selectedBox.colStart + selectedBox.colSpan >= cols}
              onClick={() => updateInternalBox(selectedBox.id, { colSpan: selectedBox.colSpan + 1 })}
              className="btn-compact"
              style={{ fontSize: '10px', padding: '5px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}
              title="Aumentar largura ocupada no grid"
            >
              Esticar Larg. ▶
            </button>

            {/* Comprimento (+/- Linha) */}
            <button
              type="button"
              disabled={selectedBox.rowSpan <= 1}
              onClick={() => updateInternalBox(selectedBox.id, { rowSpan: selectedBox.rowSpan - 1 })}
              className="btn-compact"
              style={{ fontSize: '10px', padding: '5px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}
              title="Diminuir comprimento ocupado no grid"
            >
              ▲ Encolher Comp.
            </button>
            <button
              type="button"
              disabled={selectedBox.rowStart + selectedBox.rowSpan >= rows}
              onClick={() => updateInternalBox(selectedBox.id, { rowSpan: selectedBox.rowSpan + 1 })}
              className="btn-compact"
              style={{ fontSize: '10px', padding: '5px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}
              title="Aumentar comprimento ocupado no grid"
            >
              Esticar Comp. ▼
            </button>

            {/* Mover */}
            <button
              type="button"
              disabled={selectedBox.colStart <= 0}
              onClick={() => updateInternalBox(selectedBox.id, { colStart: selectedBox.colStart - 1 })}
              className="btn-compact"
              style={{ fontSize: '10px', padding: '5px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}
              title="Mover módulo para a esquerda"
            >
              ⬅ Mover Esq.
            </button>
            <button
              type="button"
              disabled={selectedBox.colStart + selectedBox.colSpan >= cols}
              onClick={() => updateInternalBox(selectedBox.id, { colStart: selectedBox.colStart + 1 })}
              className="btn-compact"
              style={{ fontSize: '10px', padding: '5px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}
              title="Mover módulo para a direita"
            >
              Mover Dir. ➡
            </button>
            <button
              type="button"
              disabled={selectedBox.rowStart <= 0}
              onClick={() => updateInternalBox(selectedBox.id, { rowStart: selectedBox.rowStart - 1 })}
              className="btn-compact"
              style={{ fontSize: '10px', padding: '5px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}
              title="Mover módulo para frente (direção dos bancos)"
            >
              ⬆ Mover Frente
            </button>
            <button
              type="button"
              disabled={selectedBox.rowStart + selectedBox.rowSpan >= rows}
              onClick={() => updateInternalBox(selectedBox.id, { rowStart: selectedBox.rowStart + 1 })}
              className="btn-compact"
              style={{ fontSize: '10px', padding: '5px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}
              title="Mover módulo para trás (direção do porta-malas)"
            >
              Mover Trás ⬇
            </button>
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
            value={selectedBox.type}
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
            <option value="drawer">📦 Gavetão Deslizante Traseiro</option>
            <option value="slide_tray">🛝 Bandeja Corrediça Rasa (Geladeira / Fogão)</option>
            <option value="slat_bed">🛏️ Cama Retrátil com Ripas (Sofá-Cama)</option>
            <option value="open">🚪 Nicho / Compartimento Aberto</option>
          </select>
        </div>

        {/* Alternância entre Gavetão e Bandeja Corrediça */}
        {(selectedBox.type === 'drawer' || selectedBox.type === 'slide_tray') && (
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Modo do Módulo Deslizante:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                className={`btn-compact ${selectedBox.type === 'drawer' && selectedBox.drawerMode !== 'slide_tray' ? 'active' : ''}`}
                onClick={() => updateInternalBox(selectedBox.id, { type: 'drawer', drawerMode: 'drawer' })}
                style={{
                  fontSize: '11px',
                  padding: '8px 6px',
                  fontWeight: 700,
                  background: selectedBox.type === 'drawer' && selectedBox.drawerMode !== 'slide_tray'
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(37, 99, 235, 0.4))'
                    : undefined
                }}
              >
                📦 Gavetão Alto Fechado
              </button>
              <button
                type="button"
                className={`btn-compact ${selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray' ? 'active' : ''}`}
                onClick={() => updateInternalBox(selectedBox.id, { type: 'slide_tray', drawerMode: 'slide_tray' })}
                style={{
                  fontSize: '11px',
                  padding: '8px 6px',
                  fontWeight: 700,
                  background: selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray'
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.4))'
                    : undefined,
                  borderColor: selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray' ? '#f59e0b' : undefined,
                  color: selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray' ? '#fbbf24' : undefined
                }}
              >
                🛝 Bandeja Corrediça Rasa
              </button>
            </div>
            <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>
              {selectedBox.type === 'slide_tray' || selectedBox.drawerMode === 'slide_tray'
                ? '• Abas baixas de contenção (45mm) com corrediças reforçadas para geladeira 12V ou fogão.'
                : '• Gavetão fechado tradicional com laterais altas e frente total em compensado 15mm.'}
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
      <PlannerFridgeSection selectedBox={selectedBox} boxWMm={boxWMm} boxLMm={boxLMm} />
      <PlannerPortaPottiSection selectedBox={selectedBox} boxWMm={boxWMm} boxLMm={boxLMm} />
      <PlannerStoveSection selectedBox={selectedBox} boxWMm={boxWMm} boxLMm={boxLMm} />
      <PlannerBoxPanelsSection selectedBox={selectedBox} />
      <PlannerRearTableSection selectedBox={selectedBox} />
      <PlannerUpperCabinetSection selectedBox={selectedBox} />
    </div>
  );
};
