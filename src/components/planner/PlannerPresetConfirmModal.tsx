import React from 'react';

interface PlannerPresetConfirmModalProps {
  confirmDialog: {
    isOpen: boolean;
    type: 'clear' | 'preset';
    title: string;
    message: string;
    targetPresetId?: string;
    presetName?: string;
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PlannerPresetConfirmModal: React.FC<PlannerPresetConfirmModalProps> = ({
  confirmDialog,
  onConfirm,
  onCancel
}) => {
  if (!confirmDialog?.isOpen) return null;

  return (
    <>
      {/* Modal de Confirmação para Limpar e Aplicar Presets */}
      {confirmDialog && confirmDialog.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 15, 29, 0.78)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={onCancel}
        >
          <div
            style={{
              background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
              border: confirmDialog.type === 'clear' ? '1.5px solid #ef4444' : '1.5px solid #38bdf8',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: confirmDialog.type === 'clear'
                ? '0 20px 40px -10px rgba(239, 68, 68, 0.45)'
                : '0 20px 40px -10px rgba(56, 189, 248, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'fadeIn 0.15s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Alerta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: confirmDialog.type === 'clear' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  border: confirmDialog.type === 'clear' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                {confirmDialog.type === 'clear' ? '🧹' : '📦'}
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 800,
                    color: confirmDialog.type === 'clear' ? '#f87171' : '#38bdf8'
                  }}
                >
                  {confirmDialog.title}
                </h3>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {confirmDialog.type === 'clear' ? 'Atenção: Ação irreversível' : 'Substituição de Layout'}
                </span>
              </div>
            </div>

            {/* Mensagem Explicativa */}
            <p
              style={{
                margin: 0,
                fontSize: '12.5px',
                color: '#cbd5e1',
                lineHeight: 1.6,
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '12px 14px',
                borderRadius: '8px',
                borderLeft: confirmDialog.type === 'clear' ? '3px solid #ef4444' : '3px solid #38bdf8'
              }}
            >
              {confirmDialog.message}
            </p>

            {/* Botões Cancelar e Confirmar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                style={{
                  padding: '8px 20px',
                  fontSize: '12px',
                  fontWeight: 800,
                  borderRadius: '8px',
                  background: confirmDialog.type === 'clear'
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #0284c7, #2563eb)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: confirmDialog.type === 'clear'
                    ? '0 4px 12px rgba(239, 68, 68, 0.4)'
                    : '0 4px 12px rgba(2, 132, 199, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                {confirmDialog.type === 'clear' ? 'Sim, Limpar Grid' : 'Confirmar e Aplicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
