import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { PlannerBoxInspector } from './PlannerBoxInspector';

export const PlannerBoxPropertiesPanel: React.FC = () => {
  const {
    internalGrid,
    internalBoxes,
    selectedBoxId,
    setSelectedBoxId,
  } = useSolar();

  const cols = Math.max(1, internalGrid.colsX);
  const rows = Math.max(1, internalGrid.rowsZ);

  const selectedBox = internalBoxes.find((b) => b.id === selectedBoxId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Cabeçalho do Painel Direito */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🛠️</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.5px' }}>
              PROPRIEDADES DA CAIXA
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
              {selectedBox ? selectedBox.name : 'Configuração do Módulo Selecionado'}
            </div>
          </div>
        </div>

        {selectedBox && (
          <button
            type="button"
            onClick={() => setSelectedBoxId(null)}
            className="btn-compact"
            style={{ fontSize: '11px', padding: '4px 10px', color: '#94a3b8' }}
            title="Desmarcar seleção"
          >
            ✕ Desmarcar
          </button>
        )}
      </div>

      {/* Conteúdo: Inspetor da Caixa Selecionada ou Estado Inicial */}
      {selectedBox ? (
        <PlannerBoxInspector cols={cols} rows={rows} />
      ) : (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            borderRadius: '12px',
            border: '1px dashed rgba(56, 189, 248, 0.3)',
            padding: '24px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '36px' }}>📦</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
              Nenhuma Caixa Selecionada
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.45, maxWidth: '320px' }}>
              Clique em uma caixa na <strong>planta do grid</strong> (painel esquerdo) ou diretamente sobre o móvel no <strong>modelo 3D</strong> para editar suas propriedades.
            </div>
          </div>

          {internalBoxes.length > 0 ? (
            <div style={{ width: '100%', marginTop: '8px', textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: '#38bdf8',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  letterSpacing: '0.5px'
                }}
              >
                Caixas Cadastradas ({internalBoxes.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {internalBoxes.map((b) => {
                  const boxWMm = Math.max(50, Math.round(b.colSpan * (internalGrid.widthMm / cols) + (b.extraWidthMm || 0)));
                  const boxLMm = Math.max(50, Math.round(b.rowSpan * (internalGrid.lengthMm / rows) + (b.extraLengthMm || 0)));
                  const typeLabel =
                    b.type === 'chest' ? 'Baú c/ Tampa' :
                    b.type === 'drawer' ? (b.drawerMode === 'slide_tray' ? 'Bandeja Corrediça' : 'Gavetão') :
                    b.type === 'slide_tray' ? 'Bandeja Corrediça' :
                    b.type === 'slat_bed' ? 'Cama c/ Ripas' : 'Nicho Aberto';
                  const icon =
                    b.type === 'chest' ? '🧰' :
                    b.type === 'drawer' ? (b.drawerMode === 'slide_tray' ? '🛝' : '📦') :
                    b.type === 'slide_tray' ? '🛝' :
                    b.type === 'slat_bed' ? '🛏️' : '🚪';
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBoxId(b.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        background: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: '#f8fafc',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#38bdf8';
                        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{icon}</span>
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: 700 }}>{b.name}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {typeLabel}
                            {b.upperCabinet ? ' • Aéreo' : ''}
                            {b.rearFoldShelf ? ' • Traseira' : ''}
                            {b.hasStove ? ' • 🔥 Fogareiro' : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '10.5px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {boxWMm}×{boxLMm}×{b.heightMm} mm
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '10.5px', color: '#64748b', fontStyle: 'italic', marginTop: '6px' }}>
              💡 Dica: Arraste o cursor sobre o grid à esquerda para criar seu primeiro módulo, ou carregue um Preset de Layout.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
