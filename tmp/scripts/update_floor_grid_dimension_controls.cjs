const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/components/planner/PlannerFloorGrid.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Ensure setInternalBoxes is destructured from useSolar()
if (!content.includes('setInternalBoxes,')) {
  content = content.replace(
    'internalBoxes,\n    selectedBoxId,',
    'internalBoxes,\n    setInternalBoxes,\n    selectedBoxId,'
  );
}

// 2. Add isDimensionControlsOpen state and dimension handler
const stateInsertionPoint = '  const totalFloorVolumeL = Math.round(';
const helperCode = `  const [isDimensionControlsOpen, setIsDimensionControlsOpen] = React.useState<boolean>(true);

  const isDefaultDoblo = internalGrid.widthMm === 1200 && internalGrid.lengthMm === 1700 && internalGrid.heightMm === 400;

  const handleUpdateGridDimensions = (
    newWidthMm: number,
    newLengthMm: number,
    newHeightMm?: number
  ) => {
    const prevHeight = internalGrid.heightMm;
    const sanitizedW = Math.max(500, Math.min(3000, Math.round(newWidthMm) || 1200));
    const sanitizedL = Math.max(500, Math.min(4000, Math.round(newLengthMm) || 1700));
    const sanitizedH = newHeightMm !== undefined
      ? Math.max(100, Math.min(1500, Math.round(newHeightMm) || 400))
      : prevHeight;

    setInternalGrid((prev) => ({
      ...prev,
      widthMm: sanitizedW,
      lengthMm: sanitizedL,
      heightMm: sanitizedH,
      ceiling: prev.ceiling
        ? {
            ...prev.ceiling,
            widthMm: sanitizedW,
            lengthMm: sanitizedL
          }
        : undefined
    }));

    // Se a altura base for alterada, recalcula caixas que estavam usando a altura base padrão
    if (sanitizedH !== prevHeight) {
      setInternalBoxes((prevBoxes) =>
        prevBoxes.map((b) => {
          if (!b.heightMm || b.heightMm === prevHeight) {
            return { ...b, heightMm: sanitizedH };
          }
          return b;
        })
      );
    }
  };

  const cellWidthMm = Math.round(internalGrid.widthMm / cols);
  const cellLengthMm = Math.round(internalGrid.lengthMm / rows);

`;

if (!content.includes('handleUpdateGridDimensions')) {
  content = content.replace(stateInsertionPoint, helperCode + stateInsertionPoint);
}

// 3. Replace the static banner with interactive adjustable banner
const bannerStart = '{/* Tamanho Total do Espaço da Doblò Acima do Grid */}';
const bannerEnd = '{/* Indicador Frente / Bancos */}';

const bannerStartIndex = content.indexOf(bannerStart);
const bannerEndIndex = content.indexOf(bannerEnd);

if (bannerStartIndex !== -1 && bannerEndIndex !== -1) {
  const newBanner = `{/* Banner de Informações Globais & Ajuste de Dimensões do Espaço da Doblò */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))',
            border: isDefaultDoblo ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(245, 158, 11, 0.5)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '12px',
            boxShadow: '0 3px 12px rgba(0, 0, 0, 0.35)'
          }}
        >
          {/* Linha 1: Título, Status e Botões de Controle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              paddingBottom: isDimensionControlsOpen ? '10px' : '0',
              borderBottom: isDimensionControlsOpen ? '1px solid rgba(148, 163, 184, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '18px' }}>🚐</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px' }}>
                    ESPAÇO TOTAL DA VAN:
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {internalGrid.widthMm} × {internalGrid.lengthMm} mm
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                    ({(internalGrid.widthMm / 1000).toFixed(2)} × {(internalGrid.lengthMm / 1000).toFixed(2)} m)
                  </span>
                  {isDefaultDoblo ? (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: '#34d399',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                      title="Dimensões padrão de fábrica da Fiat Doblò (1200 mm largura entre caixas de roda × 1700 mm de comprimento útil)"
                    >
                      ✓ Padrão Doblò (1200 × 1700)
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: '#fbbf24',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                      title="Dimensões personalizadas"
                    >
                      ⚡ Personalizado
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                  Área útil: <strong style={{ color: '#f1f5f9' }}>{totalAreaM2} m²</strong> • Altura base: <strong style={{ color: '#f1f5f9' }}>{internalGrid.heightMm} mm ({internalGrid.heightMm / 10} cm)</strong> • Volume: <strong style={{ color: '#f1f5f9' }}>{totalFloorVolumeL} L</strong> • Célula: <strong style={{ color: '#cbd5e1' }}>{cellWidthMm} × {cellLengthMm} mm</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: occupationPct > 90 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                  color: occupationPct > 90 ? '#fca5a5' : '#38bdf8',
                  border: occupationPct > 90 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                {occupationPct}% Ocupado ({occupiedVolumeL} L)
              </span>

              {!isDefaultDoblo && (
                <button
                  type="button"
                  onClick={() => handleUpdateGridDimensions(1200, 1700, 400)}
                  style={{
                    padding: '3px 9px',
                    fontSize: '10px',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Restaurar dimensões padrão da Doblò: 1200 × 1700 mm e altura 400 mm"
                >
                  ↺ Restaurar Padrão Doblò (1200 × 1700)
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDimensionControlsOpen(prev => !prev)}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: isDimensionControlsOpen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: isDimensionControlsOpen ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: isDimensionControlsOpen ? '#38bdf8' : '#94a3b8',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
                title={isDimensionControlsOpen ? 'Recolher ajuste de medidas' : 'Expandir ajuste de medidas'}
              >
                {isDimensionControlsOpen ? '▲ Fechar Ajustes' : '✏️ Ajustar Medidas'}
              </button>
            </div>
          </div>

          {/* Linha 2: Controles Interativos de Ajuste de Largura, Comprimento e Altura */}
          {isDimensionControlsOpen && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '10px'
                }}
              >
                {/* 1. Ajuste de Largura Total (X) */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.25)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8' }}>
                      ↔ Largura Total (X):
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {(internalGrid.widthMm / 10).toFixed(0)} cm
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleUpdateGridDimensions(internalGrid.widthMm - 50, internalGrid.lengthMm, internalGrid.heightMm)}
                      style={{
                        padding: '4px 6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Diminuir 50 mm na largura"
                    >
                      -50
                    </button>
                    <input
                      type="number"
                      step={10}
                      min={600}
                      max={2600}
                      value={internalGrid.widthMm}
                      onChange={(e) => handleUpdateGridDimensions(Number(e.target.value), internalGrid.lengthMm, internalGrid.heightMm)}
                      style={{
                        flex: 1,
                        background: '#090d16',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        fontWeight: 800,
                        fontSize: '12px',
                        textAlign: 'center',
                        borderRadius: '4px',
                        padding: '4px 2px',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>mm</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateGridDimensions(internalGrid.widthMm + 50, internalGrid.lengthMm, internalGrid.heightMm)}
                      style={{
                        padding: '4px 6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Aumentar 50 mm na largura"
                    >
                      +50
                    </button>
                  </div>
                  {/* Atalhos Rápidos de Largura */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
                    {[1100, 1200, 1300, 1400].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleUpdateGridDimensions(w, internalGrid.lengthMm, internalGrid.heightMm)}
                        style={{
                          flex: 1,
                          padding: '2px 0',
                          fontSize: '9px',
                          fontWeight: internalGrid.widthMm === w ? 800 : 600,
                          background: internalGrid.widthMm === w ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                          border: internalGrid.widthMm === w ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: internalGrid.widthMm === w ? '#38bdf8' : '#94a3b8',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        {w}{w === 1200 ? ' (Doblò)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Ajuste de Comprimento / Altura do Grid (Z) */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.25)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8' }}>
                      ↕ Comprimento / Altura Útil (Z):
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {(internalGrid.lengthMm / 10).toFixed(0)} cm
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleUpdateGridDimensions(internalGrid.widthMm, internalGrid.lengthMm - 50, internalGrid.heightMm)}
                      style={{
                        padding: '4px 6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Diminuir 50 mm no comprimento"
                    >
                      -50
                    </button>
                    <input
                      type="number"
                      step={10}
                      min={800}
                      max={3500}
                      value={internalGrid.lengthMm}
                      onChange={(e) => handleUpdateGridDimensions(internalGrid.widthMm, Number(e.target.value), internalGrid.heightMm)}
                      style={{
                        flex: 1,
                        background: '#090d16',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        fontWeight: 800,
                        fontSize: '12px',
                        textAlign: 'center',
                        borderRadius: '4px',
                        padding: '4px 2px',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>mm</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateGridDimensions(internalGrid.widthMm, internalGrid.lengthMm + 50, internalGrid.heightMm)}
                      style={{
                        padding: '4px 6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Aumentar 50 mm no comprimento"
                    >
                      +50
                    </button>
                  </div>
                  {/* Atalhos Rápidos de Comprimento */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
                    {[1500, 1700, 1850, 2000].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => handleUpdateGridDimensions(internalGrid.widthMm, l, internalGrid.heightMm)}
                        style={{
                          flex: 1,
                          padding: '2px 0',
                          fontSize: '9px',
                          fontWeight: internalGrid.lengthMm === l ? 800 : 600,
                          background: internalGrid.lengthMm === l ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                          border: internalGrid.lengthMm === l ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: internalGrid.lengthMm === l ? '#38bdf8' : '#94a3b8',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        {l}{l === 1700 ? ' (Doblò)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Ajuste de Altura Base (Y) */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.25)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8' }}>
                      ⬆ Altura Base Módulos (Y):
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {(internalGrid.heightMm / 10).toFixed(0)} cm
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleUpdateGridDimensions(internalGrid.widthMm, internalGrid.lengthMm, internalGrid.heightMm - 10)}
                      style={{
                        padding: '4px 6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Diminuir 10 mm na altura base"
                    >
                      -10
                    </button>
                    <input
                      type="number"
                      step={10}
                      min={150}
                      max={1200}
                      value={internalGrid.heightMm}
                      onChange={(e) => handleUpdateGridDimensions(internalGrid.widthMm, internalGrid.lengthMm, Number(e.target.value))}
                      style={{
                        flex: 1,
                        background: '#090d16',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        fontWeight: 800,
                        fontSize: '12px',
                        textAlign: 'center',
                        borderRadius: '4px',
                        padding: '4px 2px',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>mm</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateGridDimensions(internalGrid.widthMm, internalGrid.lengthMm, internalGrid.heightMm + 10)}
                      style={{
                        padding: '4px 6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Aumentar 10 mm na altura base"
                    >
                      +10
                    </button>
                  </div>
                  {/* Atalhos Rápidos de Altura */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
                    {[350, 400, 450, 500].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleUpdateGridDimensions(internalGrid.widthMm, internalGrid.lengthMm, h)}
                        style={{
                          flex: 1,
                          padding: '2px 0',
                          fontSize: '9px',
                          fontWeight: internalGrid.heightMm === h ? 800 : 600,
                          background: internalGrid.heightMm === h ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                          border: internalGrid.heightMm === h ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: internalGrid.heightMm === h ? '#38bdf8' : '#94a3b8',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        {h}{h === 400 ? ' (Padrão)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nota de Recálculo Automático */}
              <div
                style={{
                  fontSize: '9.5px',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '4px',
                  paddingTop: '4px'
                }}
              >
                <span>
                  💡 <strong>Recálculo automático:</strong> Todas as caixas, camas de ripas, colchões, teto 3D, plano de corte de marcenaria e lista de materiais se adaptam imediatamente.
                </span>
                <span style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  Piso: {internalGrid.widthMm} × {internalGrid.lengthMm} mm • {cols}×{rows} = {cols * rows} células de {cellWidthMm}×{cellLengthMm} mm
                </span>
              </div>
            </div>
          )}
        </div>

        `;

  content = content.slice(0, bannerStartIndex) + newBanner + content.slice(bannerEndIndex);
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated PlannerFloorGrid.tsx with interactive dimension controls!');
