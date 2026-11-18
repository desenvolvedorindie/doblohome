const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/components/planner/PlannerFloorGrid.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetRegex = /\{\/\* Opções de Controle Ultra-Compactas no Item Selecionado \*\/\}[\s\S]*?\{\/\* Rodapé Compacto \*\/\}/;

const replacement = `{/* Opções de Controle em 3 Grupos Verticais (Deslocar, Aumentar, Ajuste Fino) */}
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
                  )}

                  {/* Rodapé Compacto */}`;

if (!targetRegex.test(content)) {
  console.error('Target regex not matched in PlannerFloorGrid.tsx');
  process.exit(1);
}

content = content.replace(targetRegex, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully organized grid item options into 3 groups!');
