const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/components/planner/PlannerFloorGrid.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove minHeight: isSelected ? '130px' : 'auto',
content = content.replace(
  /zIndex: isSelected \? 25 : 1,\r?\n\s*minHeight: isSelected \? '130px' : 'auto',/,
  'zIndex: isSelected ? 15 : 1,'
);

// 2. Replace the whole bulky controls block inside the selected card with the compact HUD controls
const oldBlockRegex = /\{\/\* Todas as Opções de Controle Diretamente no Item Selecionado \*\/\}[\s\S]*?\{\/\* Rodapé Compacto \*\/\}/;

const newBlock = `{/* Opções de Controle Ultra-Compactas no Item Selecionado */}
                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        background: 'rgba(9, 13, 22, 0.90)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(56, 189, 248, 0.45)',
                        borderRadius: '5px',
                        padding: '2px 4px',
                        margin: '2px 0',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      {/* Mover: 4 mini setas */}
                      <button
                        type="button"
                        disabled={!canMoveLeft}
                        onClick={() => moveBox(-1, 0)}
                        style={{
                          width: '18px',
                          height: '18px',
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
                          cursor: canMoveLeft ? 'pointer' : 'not-allowed'
                        }}
                        title="Mover Esquerda (←)"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        disabled={!canMoveFront}
                        onClick={() => moveBox(0, -1)}
                        style={{
                          width: '18px',
                          height: '18px',
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
                          cursor: canMoveFront ? 'pointer' : 'not-allowed'
                        }}
                        title="Mover Frente (↑)"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={!canMoveRear}
                        onClick={() => moveBox(0, 1)}
                        style={{
                          width: '18px',
                          height: '18px',
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
                          cursor: canMoveRear ? 'pointer' : 'not-allowed'
                        }}
                        title="Mover Trás (↓)"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        disabled={!canMoveRight}
                        onClick={() => moveBox(1, 0)}
                        style={{
                          width: '18px',
                          height: '18px',
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
                          cursor: canMoveRight ? 'pointer' : 'not-allowed'
                        }}
                        title="Mover Direita (→)"
                      >
                        ▶
                      </button>

                      <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.2)', margin: '0 1px' }} />

                      {/* Alargar / Encolher Colunas e Linhas */}
                      <button
                        type="button"
                        disabled={!canShrinkWidth}
                        onClick={() => resizeBox(-1, 0)}
                        style={{
                          padding: '0 3px',
                          height: '18px',
                          fontSize: '9px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: canShrinkWidth ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          borderRadius: '3px',
                          color: canShrinkWidth ? '#ffffff' : '#64748b',
                          cursor: canShrinkWidth ? 'pointer' : 'not-allowed'
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
                          height: '18px',
                          fontSize: '9px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: canExpandWidth ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          borderRadius: '3px',
                          color: canExpandWidth ? '#ffffff' : '#64748b',
                          cursor: canExpandWidth ? 'pointer' : 'not-allowed'
                        }}
                        title="Alargar / Esticar Largura (+1 col)"
                      >
                        +L
                      </button>
                      <button
                        type="button"
                        disabled={!canShrinkLength}
                        onClick={() => resizeBox(0, -1)}
                        style={{
                          padding: '0 3px',
                          height: '18px',
                          fontSize: '9px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: canShrinkLength ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          borderRadius: '3px',
                          color: canShrinkLength ? '#ffffff' : '#64748b',
                          cursor: canShrinkLength ? 'pointer' : 'not-allowed'
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
                          height: '18px',
                          fontSize: '9px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: canExpandLength ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          borderRadius: '3px',
                          color: canExpandLength ? '#ffffff' : '#64748b',
                          cursor: canExpandLength ? 'pointer' : 'not-allowed'
                        }}
                        title="Esticar Comprimento (+1 lin)"
                      >
                        +C
                      </button>

                      <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.2)', margin: '0 1px' }} />

                      {/* Ajuste fino mm */}
                      <button
                        type="button"
                        onClick={() => adjustExtraWidth(-10)}
                        style={{
                          padding: '0 3px',
                          height: '18px',
                          fontSize: '8.5px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(245, 158, 11, 0.2)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          borderRadius: '3px',
                          color: '#fbbf24',
                          cursor: 'pointer'
                        }}
                        title="Reduzir 10 mm na largura"
                      >
                        -10
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustExtraWidth(10)}
                        style={{
                          padding: '0 3px',
                          height: '18px',
                          fontSize: '8.5px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(245, 158, 11, 0.2)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          borderRadius: '3px',
                          color: '#fbbf24',
                          cursor: 'pointer'
                        }}
                        title="Alargar 10 mm na largura"
                      >
                        +10
                      </button>

                      <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.2)', margin: '0 1px' }} />

                      {/* Foco 3D & Desmarcar */}
                      <button
                        type="button"
                        onClick={() => setIsolatedBoxId(isIsolated ? null : box.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          padding: 0,
                          fontSize: '9px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isIsolated ? '#0284c7' : 'rgba(56, 189, 248, 0.2)',
                          border: '1px solid #38bdf8',
                          borderRadius: '3px',
                          color: '#ffffff',
                          cursor: 'pointer'
                        }}
                        title={isIsolated ? 'Restaurar visão completa' : 'Isolar este módulo em 3D'}
                      >
                        {isIsolated ? '👁️' : '🔍'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedBoxId(null)}
                        style={{
                          width: '18px',
                          height: '18px',
                          padding: 0,
                          fontSize: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255, 255, 255, 0.12)',
                          border: 'none',
                          borderRadius: '3px',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          lineHeight: 1
                        }}
                        title="Desmarcar seleção (Esc)"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Rodapé Compacto */}`;

if (!oldBlockRegex.test(content)) {
  console.error('oldBlockRegex did not match!');
  process.exit(1);
}

content = content.replace(oldBlockRegex, newBlock);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated PlannerFloorGrid.tsx with compact in-card options!');
