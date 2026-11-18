const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/components/planner/PlannerFloorGrid.tsx');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Remove the control block from inside the element (lines ~490-765)
const targetInsideElement = `                  {/* Opções de Controle em 3 Grupos Verticais (Deslocar, Aumentar, Ajuste Fino) */}
                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        background: 'rgba(9, 13, 22, 0.92)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(56, 189, 248, 0.45)',
                        borderRadius: '5px',
                        padding: '3px 4px',
                        margin: '2px 0',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.55)'
                      }}
                    >
                      {/* Grupo 1: Deslocar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', minWidth: '44px' }}>
                          Deslocar:
                        </span>
                        <button
                          type="button"
                          disabled={!canMoveLeft}
                          onClick={() => moveBox(-1, 0)}
                          style={{
                            width: '18px',
                            height: '16px',
                            padding: 0,
                            fontSize: '9px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: canMoveLeft ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            borderRadius: '3px',
                            color: canMoveLeft ? '#ffffff' : '#64748b',
                            cursor: canMoveLeft ? 'pointer' : 'not-allowed',
                            lineHeight: 1
                          }}
                          title="Deslocar Esquerda (←)"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          disabled={!canMoveFront}
                          onClick={() => moveBox(0, -1)}
                          style={{
                            width: '18px',
                            height: '16px',
                            padding: 0,
                            fontSize: '9px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: canMoveFront ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            borderRadius: '3px',
                            color: canMoveFront ? '#ffffff' : '#64748b',
                            cursor: canMoveFront ? 'pointer' : 'not-allowed',
                            lineHeight: 1
                          }}
                          title="Deslocar Frente (↑)"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={!canMoveRear}
                          onClick={() => moveBox(0, 1)}
                          style={{
                            width: '18px',
                            height: '16px',
                            padding: 0,
                            fontSize: '9px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: canMoveRear ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            borderRadius: '3px',
                            color: canMoveRear ? '#ffffff' : '#64748b',
                            cursor: canMoveRear ? 'pointer' : 'not-allowed',
                            lineHeight: 1
                          }}
                          title="Deslocar Trás (↓)"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          disabled={!canMoveRight}
                          onClick={() => moveBox(1, 0)}
                          style={{
                            width: '18px',
                            height: '16px',
                            padding: 0,
                            fontSize: '9px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: canMoveRight ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            borderRadius: '3px',
                            color: canMoveRight ? '#ffffff' : '#64748b',
                            cursor: canMoveRight ? 'pointer' : 'not-allowed',
                            lineHeight: 1
                          }}
                          title="Deslocar Direita (→)"
                        >
                          ▶
                        </button>
                      </div>

                      {/* Grupo 2: Aumentar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', minWidth: '44px' }}>
                          Aumentar:
                        </span>
                        <button
                          type="button"
                          disabled={!canShrinkWidth}
                          onClick={() => resizeBox(-1, 0)}
                          style={{
                            padding: '0 3px',
                            height: '16px',
                            fontSize: '8.5px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: canShrinkWidth ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            borderRadius: '3px',
                            color: canShrinkWidth ? '#ffffff' : '#64748b',
                            cursor: canShrinkWidth ? 'pointer' : 'not-allowed',
                            lineHeight: 1
                          }}
                          title="Encolher Largura (-1 col)"
                        >
                          -L
                        </button>
                        <button
                          type="button"
                          disabled={!canExpandWidth}
                          onClick={() => resizeBox(1, 0)}
                          style={{
                            padding: '0 3px',
                            height: '16px',
                            fontSize: '8.5px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: canExpandWidth ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            borderRadius: '3px',
                            color: canExpandWidth ? '#ffffff' : '#64748b',
                            cursor: canExpandWidth ? 'pointer' : 'not-allowed',
                            lineHeight: 1
                          }}
                          title="Aumentar Largura (+1 col)"
                        >
                          +L
                        </button>
                        <button
                          type="button"
                          disabled={!canShrinkLength}
                          onClick={() => resizeBox(0, -1)}
                          style={{
                            padding: '0 3px',
                            height: '16px',
                            fontSize: '8.5px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: canShrinkLength ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            borderRadius: '3px',
                            color: canShrinkLength ? '#ffffff' : '#64748b',
                            cursor: canShrinkLength ? 'pointer' : 'not-allowed',
                            lineHeight: 1
                          }}
                          title="Encolher Comprimento (-1 lin)"
                        >
                          -C
                        </button>
                        <button
                          type="button"
                          disabled={!canExpandLength}
                          onClick={() => resizeBox(0, 1)}
                          style={{
                            padding: '0 3px',
                            height: '16px',
                            fontSize: '8.5px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: canExpandLength ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            borderRadius: '3px',
                            color: canExpandLength ? '#ffffff' : '#64748b',
                            cursor: canExpandLength ? 'pointer' : 'not-allowed',
                            lineHeight: 1
                          }}
                          title="Aumentar Comprimento (+1 lin)"
                        >
                          +C
                        </button>
                      </div>

                      {/* Grupo 3: Ajuste Fino */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '8px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', minWidth: '44px' }}>
                          Ajuste Fino:
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustExtraWidth(-10)}
                          style={{
                            padding: '0 4px',
                            height: '16px',
                            fontSize: '8px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(245, 158, 11, 0.2)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '3px',
                            color: '#fbbf24',
                            cursor: 'pointer',
                            lineHeight: 1
                          }}
                          title="Reduzir 10 mm na largura"
                        >
                          -10 L
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustExtraWidth(10)}
                          style={{
                            padding: '0 4px',
                            height: '16px',
                            fontSize: '8px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(245, 158, 11, 0.2)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '3px',
                            color: '#fbbf24',
                            cursor: 'pointer',
                            lineHeight: 1
                          }}
                          title="Aumentar 10 mm na largura"
                        >
                          +10 L
                        </button>
                        {(box.extraWidthMm || 0) !== 0 && (
                          <span style={{ fontSize: '8px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            {(box.extraWidthMm || 0) > 0 ? \`+\${box.extraWidthMm}\` : box.extraWidthMm}mm
                          </span>
                        )}
                      </div>
                    </div>
                  )}`;

if (!content.includes(targetInsideElement)) {
  throw new Error('Target inside element not found!');
}

content = content.replace(targetInsideElement, '');

// 2. Add the control panel below the grid
const targetFooter = `        {/* Indicador Traseira / Porta-Malas */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: 800,
            color: '#64748b',
            letterSpacing: '2px',
            padding: '4px',
            background: 'rgba(30, 41, 59, 0.4)',
            borderRadius: '6px',
            marginTop: '8px'
          }}
        >
          ▼ TRASEIRA (PORTA-MALAS & ACESSO DE CARGA) ▼
        </div>
      </div>`;

const replacementFooter = `        {/* Indicador Traseira / Porta-Malas */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: 800,
            color: '#64748b',
            letterSpacing: '2px',
            padding: '4px',
            background: 'rgba(30, 41, 59, 0.4)',
            borderRadius: '6px',
            marginTop: '8px'
          }}
        >
          ▼ TRASEIRA (PORTA-MALAS & ACESSO DE CARGA) ▼
        </div>

        {/* Painel de Controle de Posição & Deslocamento em Baixo do Grid */}
        {selectedBox ? (
          <div
            style={{
              marginTop: '10px',
              padding: '10px 14px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1.5px solid rgba(56, 189, 248, 0.45)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Linha de Título do Módulo Selecionado */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                  {selectedBox.name}
                </span>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  ({selectedBoxWMm / 10} × {selectedBoxLMm / 10} cm • {selectedBoxVolL} L)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBoxId(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '4px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px'
                }}
                title="Desmarcar módulo"
              >
                ✕ Desmarcar
              </button>
            </div>

            {/* Linha de Botões de Ação */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
              {/* Grupo 1: Deslocar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Deslocar:
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    disabled={!canMoveLeft}
                    onClick={() => moveBox(-1, 0)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '5px 9px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canMoveLeft ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: canMoveLeft ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canMoveLeft ? '#38bdf8' : '#64748b',
                      cursor: canMoveLeft ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Deslocar Esquerda (←)"
                  >
                    ◀ Esq
                  </button>
                  <button
                    type="button"
                    disabled={!canMoveFront}
                    onClick={() => moveBox(0, -1)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '5px 9px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canMoveFront ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: canMoveFront ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canMoveFront ? '#38bdf8' : '#64748b',
                      cursor: canMoveFront ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Deslocar Frente (↑)"
                  >
                    ▲ Frente
                  </button>
                  <button
                    type="button"
                    disabled={!canMoveRear}
                    onClick={() => moveBox(0, 1)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '5px 9px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canMoveRear ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: canMoveRear ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canMoveRear ? '#38bdf8' : '#64748b',
                      cursor: canMoveRear ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Deslocar Trás (↓)"
                  >
                    ▼ Trás
                  </button>
                  <button
                    type="button"
                    disabled={!canMoveRight}
                    onClick={() => moveBox(1, 0)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '5px 9px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canMoveRight ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: canMoveRight ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canMoveRight ? '#38bdf8' : '#64748b',
                      cursor: canMoveRight ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Deslocar Direita (→)"
                  >
                    ▶ Dir
                  </button>
                </div>
              </div>

              {/* Grupo 2: Aumentar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Tamanho:
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    disabled={!canShrinkWidth}
                    onClick={() => resizeBox(-1, 0)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canShrinkWidth ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: canShrinkWidth ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canShrinkWidth ? '#ffffff' : '#64748b',
                      cursor: canShrinkWidth ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Encolher Largura (-1 col)"
                  >
                    -L
                  </button>
                  <button
                    type="button"
                    disabled={!canExpandWidth}
                    onClick={() => resizeBox(1, 0)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canExpandWidth ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: canExpandWidth ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canExpandWidth ? '#ffffff' : '#64748b',
                      cursor: canExpandWidth ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Aumentar Largura (+1 col)"
                  >
                    +L
                  </button>
                  <button
                    type="button"
                    disabled={!canShrinkLength}
                    onClick={() => resizeBox(0, -1)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canShrinkLength ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: canShrinkLength ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canShrinkLength ? '#ffffff' : '#64748b',
                      cursor: canShrinkLength ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Encolher Comprimento (-1 lin)"
                  >
                    -C
                  </button>
                  <button
                    type="button"
                    disabled={!canExpandLength}
                    onClick={() => resizeBox(0, 1)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: canExpandLength ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: canExpandLength ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      color: canExpandLength ? '#ffffff' : '#64748b',
                      cursor: canExpandLength ? 'pointer' : 'not-allowed',
                      lineHeight: 1
                    }}
                    title="Aumentar Comprimento (+1 lin)"
                  >
                    +C
                  </button>
                </div>
              </div>

              {/* Grupo 3: Ajuste Fino */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                  Ajuste Fino:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => adjustExtraWidth(-10)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(245, 158, 11, 0.18)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '5px',
                      color: '#fbbf24',
                      cursor: 'pointer',
                      lineHeight: 1
                    }}
                    title="Reduzir 10 mm na largura"
                  >
                    -10mm L
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustExtraWidth(10)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(245, 158, 11, 0.18)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '5px',
                      color: '#fbbf24',
                      cursor: 'pointer',
                      lineHeight: 1
                    }}
                    title="Aumentar 10 mm na largura"
                  >
                    +10mm L
                  </button>
                  {(selectedBox.extraWidthMm || 0) !== 0 && (
                    <span style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700, marginLeft: '2px' }}>
                      {(selectedBox.extraWidthMm || 0) > 0 ? \`+\${selectedBox.extraWidthMm}\` : selectedBox.extraWidthMm}mm
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dica de Teclado */}
            <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center', marginTop: '2px' }}>
              Dica: Você também pode usar as setas ◀ ▲ ▼ ▶ do teclado para deslocar o módulo selecionado.
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', padding: '6px', fontStyle: 'italic', marginTop: '6px' }}>
            💡 Dica: Clique em qualquer módulo no grid acima para selecioná-lo e deslocá-lo pelo piso.
          </div>
        )}
      </div>`;

if (!content.includes(targetFooter)) {
  throw new Error('Target footer not found!');
}

content = content.replace(targetFooter, replacementFooter);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated PlannerFloorGrid.tsx!');
