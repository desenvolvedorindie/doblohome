import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, BoxPanelsConfig } from '../../types';

interface PlannerBoxPanelsSectionProps {
  selectedBox: InternalBoxItem;
}

export const PlannerBoxPanelsSection: React.FC<PlannerBoxPanelsSectionProps> = ({ selectedBox }) => {
  const { updateInternalBox } = useSolar();

  return (
    <>
      {/* Tamponamento & Fechamento de Chapas (15mm) */}
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📐 Tamponamento das Faces (15mm)
              </span>
              <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                Ativar / Omitir Chapas
              </span>
            </div>
            <p style={{ fontSize: '9.5px', color: '#94a3b8', margin: '0 0 8px 0', lineHeight: 1.35 }}>
              Omita chapas em módulos contíguos para evitar paredes duplas (30mm) ou abrir comunicação entre caixas:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {[
                {
                  key: 'front' as keyof BoxPanelsConfig,
                  label: '⬆️ Frente (Bancos)',
                  val: selectedBox.panels?.front ?? true,
                  desc: 'Parede dianteira (+Z)'
                },
                {
                  key: 'rear' as keyof BoxPanelsConfig,
                  label: '⬇️ Fundo (Porta-malas)',
                  val: selectedBox.panels?.rear ?? (selectedBox.type !== 'drawer'),
                  desc: 'Parede traseira (-Z)'
                },
                {
                  key: 'left' as keyof BoxPanelsConfig,
                  label: '⬅️ Lateral Esquerda',
                  val: selectedBox.panels?.left ?? true,
                  desc: 'Lado motorista (+X)'
                },
                {
                  key: 'right' as keyof BoxPanelsConfig,
                  label: '➡️ Lateral Direita',
                  val: selectedBox.panels?.right ?? true,
                  desc: 'Lado passageiro (-X)'
                },
                {
                  key: 'top' as keyof BoxPanelsConfig,
                  label: selectedBox.type === 'chest' ? '🔝 Tampa Basculante' : selectedBox.type === 'slat_bed' ? '🔝 Estrado de Ripas' : '🔝 Tampo Superior',
                  val: selectedBox.panels?.top ?? (selectedBox.type !== 'open'),
                  desc: 'Fechamento superior (+Y)'
                },
                {
                  key: 'bottom' as keyof BoxPanelsConfig,
                  label: '⏹️ Fundo da Base',
                  val: selectedBox.panels?.bottom ?? false,
                  desc: 'Chapa extra no piso (-Y)'
                }
              ].map((panel) => {
                const isActive = panel.val;
                return (
                  <button
                    key={panel.key}
                    type="button"
                    onClick={() => {
                      const currentPanels: BoxPanelsConfig = {
                        front: selectedBox.panels?.front ?? true,
                        rear: selectedBox.panels?.rear ?? (selectedBox.type !== 'drawer'),
                        left: selectedBox.panels?.left ?? true,
                        right: selectedBox.panels?.right ?? true,
                        top: selectedBox.panels?.top ?? (selectedBox.type !== 'open'),
                        bottom: selectedBox.panels?.bottom ?? false,
                        ...selectedBox.panels
                      };
                      updateInternalBox(selectedBox.id, {
                        panels: {
                          ...currentPanels,
                          [panel.key]: !isActive
                        }
                      });
                    }}
                    style={{
                      background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      border: isActive ? '1px solid #10b981' : '1px dashed rgba(148, 163, 184, 0.3)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: isActive ? '#f8fafc' : '#94a3b8' }}>
                        {panel.label}
                      </span>
                      <span
                        style={{
                          fontSize: '8.5px',
                          fontWeight: 800,
                          color: isActive ? '#34d399' : '#f87171',
                          background: isActive ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                          padding: '1px 4px',
                          borderRadius: '3px'
                        }}
                      >
                        {isActive ? '✓ COM' : '✗ SEM'}
                      </span>
                    </div>
                    <span style={{ fontSize: '8px', color: '#64748b' }}>
                      {panel.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opção de Tampo / Tampa Superior Vazada (Alívio de Peso e Aeração do Colchão) */}
          {selectedBox.type !== 'slat_bed' && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: selectedBox.topPerforated
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08))'
                  : 'rgba(30, 41, 59, 0.45)',
                border: selectedBox.topPerforated
                  ? '1px solid rgba(16, 185, 129, 0.5)'
                  : '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: selectedBox.topPerforated ? '#34d399' : '#e2e8f0' }}>
                    🕳️ Tampa / Tampo Superior Vazado (Usinagem CNC)
                  </span>
                  <span
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 800,
                      color: selectedBox.topPerforated ? '#10b981' : '#94a3b8',
                      background: selectedBox.topPerforated ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {selectedBox.topPerforated ? '🍃 VAZADO ATIVO (-35% peso)' : 'SÓLIDO (Padrão)'}
                  </span>
                </div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
                  Grade de furos passantes para <strong>alívio de peso da madeira (~35% mais leve)</strong> e <strong>aeração contínua sob o colchão</strong> (evita mofo e condensação em viagens).
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateInternalBox(selectedBox.id, { topPerforated: !selectedBox.topPerforated })}
                className="btn-compact"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '6px 12px',
                  whiteSpace: 'nowrap',
                  background: selectedBox.topPerforated
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'rgba(51, 65, 85, 0.8)',
                  borderColor: selectedBox.topPerforated ? '#34d399' : 'rgba(148, 163, 184, 0.4)',
                  color: '#ffffff'
                }}
              >
                {selectedBox.topPerforated ? '✓ Vazado Ativo' : 'Tornar Vazado'}
              </button>
            </div>
          )}

      
    </>
  );
};
