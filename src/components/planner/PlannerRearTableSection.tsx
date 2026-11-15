import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, InternalBoxMaterial } from '../../types';

interface PlannerRearTableProps {
  selectedBox: InternalBoxItem;
}

export const PlannerRearTableSection: React.FC<PlannerRearTableProps> = ({ selectedBox }) => {
  const { updateInternalBox, isOpenPreview } = useSolar();

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
                    isRearShelfOpen: willEnable ? true : undefined
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
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(245, 158, 11, 0.25)',
                  alignItems: 'flex-end'
                }}
              >
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
                    <option value="pine_block">🪵 Pinus Finger-Joint (Bloco Natural como na foto)</option>
                    <option value="teak">🪵 Teca Naval Dourada (Impermeabilizada)</option>
                    <option value="dark_wood">🪵 Imbuia / Nogueira Escura Nobre</option>
                    <option value="plywood">🪵 Compensado Naval Selado (18mm)</option>
                  </select>
                </div>

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
            )}
          </div>

    </>
  );
};
