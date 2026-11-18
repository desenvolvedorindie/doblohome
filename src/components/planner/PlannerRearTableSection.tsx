import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, getFoldingBracketForHeight, FOLDING_BRACKET_SPECS } from '../../types';

interface PlannerRearTableProps {
  selectedBox: InternalBoxItem;
  boxWMm?: number;
}

export const PlannerRearTableSection: React.FC<PlannerRearTableProps> = ({ selectedBox, boxWMm: propBoxWMm }) => {
  const { internalGrid, updateInternalBox, isOpenPreview } = useSolar();

  const boxHeight = selectedBox.heightMm || 380;
  const cols = Math.max(1, internalGrid?.colsX || 3);
  const baseBoxWMm = Math.round(selectedBox.colSpan * ((internalGrid?.widthMm || 1200) / cols));
  const boxWidth = propBoxWMm ?? Math.max(50, baseBoxWMm + (selectedBox.extraWidthMm || 0));

  // Descontos necessários da altura:
  // - 22 mm de recuo superior padrão do eixo pivô da mão francesa
  // - 18 mm de folga inferior em relação ao piso do veículo para pega dos dedos e não raspar no chão
  const BASE_TOP_MARGIN_MM = 22;
  const BOTTOM_CLEARANCE_MM = 18;

  // Deslocamento máximo para baixo que ainda deixa pelo menos 80mm de tampo:
  const maxOffsetDownMm = Math.max(0, boxHeight - BASE_TOP_MARGIN_MM - BOTTOM_CLEARANCE_MM - 80);
  const currentOffsetMm = Math.max(-10, Math.min(maxOffsetDownMm, selectedBox.rearShelfOffsetYMm || 0));
  const pivotFromTopMm = BASE_TOP_MARGIN_MM + currentOffsetMm;

  // Regra de ouro da prateleira rebatível:
  // O tampo (profundidade ao abrir / comprimento ao fechar) fica estritamente limitado
  // da diferença desse deslocamento para o final do móvel:
  const maxAllowedDepthMm = Math.max(80, boxHeight - pivotFromTopMm - BOTTOM_CLEARANCE_MM);
  const currentDepthMm = selectedBox.rearShelfDepthMm !== undefined
    ? Math.min(selectedBox.rearShelfDepthMm, maxAllowedDepthMm)
    : maxAllowedDepthMm;

  const mountHeightFromFloorMm = Math.max(50, Math.round(boxHeight - pivotFromTopMm));

  // Extensão transversal ao longo do móvel (máx: largura do baú - 20mm de margens)
  const maxAllowedWidthMm = Math.max(150, boxWidth - 20);
  const currentWidthMm = selectedBox.rearShelfWidthMm !== undefined
    ? Math.min(selectedBox.rearShelfWidthMm, maxAllowedWidthMm)
    : Math.max(150, boxWidth - 30);

  const bracketSpec = getFoldingBracketForHeight(boxHeight, selectedBox.rearShelfBracketInches, currentDepthMm);

  const handleOffsetChange = (newVal: number) => {
    const clampedOffset = Math.max(-10, Math.min(maxOffsetDownMm, Math.round(newVal) || 0));
    const newPivotFromTop = BASE_TOP_MARGIN_MM + clampedOffset;
    const newMaxDepth = Math.max(80, boxHeight - newPivotFromTop - BOTTOM_CLEARANCE_MM);
    const updates: Partial<InternalBoxItem> = {
      rearShelfOffsetYMm: clampedOffset
    };
    if (selectedBox.rearShelfDepthMm !== undefined && selectedBox.rearShelfDepthMm > newMaxDepth) {
      updates.rearShelfDepthMm = newMaxDepth;
    }
    updateInternalBox(selectedBox.id, updates);
  };

  const handleDepthChange = (newVal: number) => {
    const clamped = Math.max(80, Math.min(newVal, maxAllowedDepthMm));
    updateInternalBox(selectedBox.id, { rearShelfDepthMm: clamped });
  };

  const handleWidthChange = (newVal: number) => {
    const clamped = Math.max(150, Math.min(newVal, maxAllowedWidthMm));
    updateInternalBox(selectedBox.id, { rearShelfWidthMm: clamped });
  };

  return (
    <>
      {/* Opção de Decoração em Madeira na Face Traseira / Mesa Rebatível que abre para cima */}
      <div
        style={{
          marginTop: '12px',
          padding: '12px',
          background: selectedBox.rearFoldShelf
            ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.16), rgba(180, 83, 9, 0.08))'
            : 'rgba(30, 41, 59, 0.45)',
          border: selectedBox.rearFoldShelf
            ? '1px solid rgba(245, 158, 11, 0.55)'
            : '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '8px',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: selectedBox.rearFoldShelf ? '10px' : '0', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: selectedBox.rearFoldShelf ? '#fbbf24' : '#e2e8f0' }}>
                🪵 Decoração Traseira: Prateleira Rebatível (Abre p/ Cima)
              </span>
              <span
                style={{
                  fontSize: '8.5px',
                  fontWeight: 800,
                  color: selectedBox.rearFoldShelf ? '#f59e0b' : '#94a3b8',
                  background: selectedBox.rearFoldShelf ? 'rgba(245, 158, 11, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}
              >
                {selectedBox.rearFoldShelf ? '✨ ATIVA (Bancada Traseira)' : 'INATIVA'}
              </span>
            </div>
            <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
              Painel decorativo em madeira maciça na face voltada para o porta-malas. Quando fechada, embeleza o acabamento traseiro; puxada pela cava inferior, <strong>abre 90° para cima</strong> transformando-se em uma <strong>prateleira / mesa externa de apoio</strong> sustentada por braços de inox.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const willEnable = !selectedBox.rearFoldShelf;
              updateInternalBox(selectedBox.id, {
                rearFoldShelf: willEnable,
                isRearShelfOpen: willEnable ? true : undefined,
                rearShelfDepthMm: willEnable ? (selectedBox.rearShelfDepthMm ?? maxAllowedDepthMm) : selectedBox.rearShelfDepthMm
              });
            }}
            className="btn-compact"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '6px 12px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              background: selectedBox.rearFoldShelf
                ? 'linear-gradient(135deg, #d97706, #b45309)'
                : 'rgba(51, 65, 85, 0.8)',
              borderColor: selectedBox.rearFoldShelf ? '#fbbf24' : 'rgba(148, 163, 184, 0.4)',
              color: '#ffffff'
            }}
          >
            {selectedBox.rearFoldShelf ? '✓ Mesa Ativa' : 'Adicionar Mesa Traseira'}
          </button>
        </div>

        {/* Sub-painel de Configuração da Mesa Traseira */}
        {selectedBox.rearFoldShelf && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(245, 158, 11, 0.25)'
            }}
          >
            {/* Bloco 0: Posição Vertical de Fixação no Móvel (Subir / Descer a Prateleira) */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.45)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>↕️</span>
                  <span>Posição Vertical de Fixação (Subir / Descer):</span>
                </label>
                <span style={{ fontSize: '10px', color: '#fef08a', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {currentOffsetMm === 0 ? 'Topo Padrão (0 mm)' : currentOffsetMm > 0 ? `Descer ${currentOffsetMm} mm` : `Subir ${Math.abs(currentOffsetMm)} mm`}
                  <span style={{ color: '#94a3b8', fontSize: '9.5px', marginLeft: '6px' }}>
                    ({mountHeightFromFloorMm} mm do piso)
                  </span>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleOffsetChange(currentOffsetMm - 10)}
                  disabled={currentOffsetMm <= -10}
                  className="btn-compact"
                  title="Subir prateleira 10 mm"
                  style={{ padding: '3px 8px', fontSize: '10px', fontWeight: 700 }}
                >
                  ▲ Subir
                </button>
                <input
                  type="range"
                  min={-10}
                  max={maxOffsetDownMm}
                  step={5}
                  value={currentOffsetMm}
                  onChange={(e) => handleOffsetChange(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#f59e0b' }}
                />
                <button
                  type="button"
                  onClick={() => handleOffsetChange(currentOffsetMm + 10)}
                  disabled={currentOffsetMm >= maxOffsetDownMm}
                  className="btn-compact"
                  title="Descer prateleira 10 mm"
                  style={{ padding: '3px 8px', fontSize: '10px', fontWeight: 700 }}
                >
                  ▼ Descer
                </button>
                <input
                  type="number"
                  min={-10}
                  max={maxOffsetDownMm}
                  step={5}
                  value={currentOffsetMm}
                  onChange={(e) => handleOffsetChange(Number(e.target.value))}
                  style={{
                    width: '56px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    color: '#ffffff',
                    padding: '3px 4px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textAlign: 'center',
                    fontFamily: 'monospace'
                  }}
                />
                <span style={{ fontSize: '10px', color: '#cbd5e1' }}>mm</span>
              </div>

              {/* Botões de atalho rápido de posicionamento vertical */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                {[0, Math.round(maxOffsetDownMm * 0.33), Math.round(maxOffsetDownMm * 0.66), maxOffsetDownMm].map((offVal, idx) => {
                  const labels = ['Topo (0 mm)', '1/3 Baixo', '2/3 Baixo', 'Máx Baixo'];
                  const isActive = currentOffsetMm === offVal;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleOffsetChange(offVal)}
                      className="btn-compact"
                      style={{
                        fontSize: '9px',
                        padding: '3px 2px',
                        fontWeight: isActive ? 800 : 600,
                        background: isActive ? 'rgba(245, 158, 11, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                        borderColor: isActive ? '#f59e0b' : 'rgba(148, 163, 184, 0.25)',
                        color: isActive ? '#fef08a' : '#94a3b8'
                      }}
                    >
                      {labels[idx]}
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: '9px', color: '#94a3b8', lineHeight: 1.3 }}>
                💡 Conforme a prateleira desce, o tampo fica limitado pela distância restante até o final do móvel (máx: <strong>{maxAllowedDepthMm} mm</strong>) para não colidir com o piso ao recolher.
              </div>
            </div>

            {/* Bloco 1: Dimensões da Prateleira (Largura ao abrir limitada pela altura) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px',
                background: 'rgba(15, 23, 42, 0.4)',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}
            >
              {/* Largura da Prateleira (ao abrir) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '10.5px', color: '#fbbf24', fontWeight: 700 }}>
                    📏 Largura ao Abrir (Profundidade):
                  </label>
                  <span style={{ fontSize: '9px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                    Máx: {maxAllowedDepthMm} mm
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min={100}
                    max={maxAllowedDepthMm}
                    step={5}
                    value={currentDepthMm}
                    onChange={(e) => handleDepthChange(Number(e.target.value))}
                    style={{
                      flex: 1,
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(245, 158, 11, 0.5)',
                      color: '#ffffff',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'monospace'
                    }}
                  />
                  <span style={{ fontSize: '10px', color: '#cbd5e1' }}>mm</span>
                  <button
                    type="button"
                    onClick={() => handleDepthChange(maxAllowedDepthMm)}
                    title={`Ajustar para o máximo permitido pela altura (${maxAllowedDepthMm} mm)`}
                    className="btn-compact"
                    style={{
                      fontSize: '9.5px',
                      padding: '3px 6px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      borderColor: 'rgba(245, 158, 11, 0.5)',
                      color: '#fef08a',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ⚡ Máx
                  </button>
                </div>
                <input
                  type="range"
                  min={100}
                  max={maxAllowedDepthMm}
                  step={5}
                  value={currentDepthMm}
                  onChange={(e) => handleDepthChange(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '6px', accentColor: '#f59e0b' }}
                />
                <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.25 }}>
                  Limitada pela distância da fixação até o final do móvel: máx <strong>{maxAllowedDepthMm} mm</strong> (para não encostar no piso ao recolher).
                </div>
              </div>

              {/* Extensão Transversal no Móvel */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '10.5px', color: '#fbbf24', fontWeight: 700 }}>
                    📐 Extensão Transversal (Comprimento):
                  </label>
                  <span style={{ fontSize: '9px', color: '#cbd5e1', background: 'rgba(148, 163, 184, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                    Máx: {maxAllowedWidthMm} mm
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min={150}
                    max={maxAllowedWidthMm}
                    step={5}
                    value={currentWidthMm}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    style={{
                      flex: 1,
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(245, 158, 11, 0.5)',
                      color: '#ffffff',
                      padding: '4px 8px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'monospace'
                    }}
                  />
                  <span style={{ fontSize: '10px', color: '#cbd5e1' }}>mm</span>
                  <button
                    type="button"
                    onClick={() => handleWidthChange(maxAllowedWidthMm)}
                    title={`Ajustar para a extensão máxima da largura do móvel (${maxAllowedWidthMm} mm)`}
                    className="btn-compact"
                    style={{
                      fontSize: '9.5px',
                      padding: '3px 6px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      borderColor: 'rgba(245, 158, 11, 0.5)',
                      color: '#fef08a',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ⚡ Máx
                  </button>
                </div>
                <input
                  type="range"
                  min={150}
                  max={maxAllowedWidthMm}
                  step={5}
                  value={currentWidthMm}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '6px', accentColor: '#f59e0b' }}
                />
                <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.25 }}>
                  Comprimento da bancada no móvel (largura do módulo: {boxWidth} mm).
                </div>
              </div>
            </div>

            {/* Bloco 2: Acabamento, Mão Francesa & Simulação de Abertura */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px',
                alignItems: 'flex-end'
              }}
            >
              {/* Acabamento da Madeira */}
              <div>
                <label style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Acabamento da Madeira:
                </label>
                <select
                  value={selectedBox.rearShelfFinish || 'pine_block'}
                  onChange={(e) => updateInternalBox(selectedBox.id, { rearShelfFinish: e.target.value as any })}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    color: '#ffffff',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    fontSize: '11px'
                  }}
                >
                  <option value="pine_block">🪵 Pinus Finger-Joint (Bloco Natural)</option>
                  <option value="teak">🪵 Teca Naval Dourada (Impermeabilizada)</option>
                  <option value="dark_wood">🪵 Imbuia / Nogueira Escura Nobre</option>
                  <option value="plywood">🪵 Compensado Naval Selado (18mm)</option>
                </select>
              </div>

              {/* Mão Francesa Comercial */}
              <div>
                <label style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Mão Francesa Comercial:
                </label>
                <select
                  value={selectedBox.rearShelfBracketInches || ''}
                  onChange={(e) => updateInternalBox(selectedBox.id, {
                    rearShelfBracketInches: e.target.value ? Number(e.target.value) : undefined
                  })}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    color: '#ffffff',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    fontSize: '11px'
                  }}
                >
                  <option value="">Automático: {bracketSpec.label} (até {bracketSpec.maxLoadKg} kg)</option>
                  {FOLDING_BRACKET_SPECS.map((s) => (
                    <option key={s.inches} value={s.inches}>
                      {s.label} • Carga: {s.maxLoadKg} kg {s.lengthMm > currentDepthMm ? '⚠️ (maior que prateleira)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Simulação 3D */}
              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Simulação 3D da Articulação:
                </label>
                <button
                  type="button"
                  onClick={() => updateInternalBox(selectedBox.id, {
                    isRearShelfOpen: selectedBox.isRearShelfOpen !== undefined ? !selectedBox.isRearShelfOpen : false
                  })}
                  className="btn-compact"
                  style={{
                    width: '100%',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '5px 10px',
                    background: (selectedBox.isRearShelfOpen ?? isOpenPreview)
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #0284c7, #2563eb)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff'
                  }}
                >
                  {(selectedBox.isRearShelfOpen ?? isOpenPreview)
                    ? '🔒 Rebater / Fechar Mesa Traseira'
                    : '🔓 Levantar Mesa p/ Cima (90°)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
