import React, { useState } from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, BoxPanelsConfig, BoxPanelThicknessConfig, BoxJointStyle, BackPanelCoverMode } from '../../types';

interface PlannerBoxPanelsSectionProps {
  selectedBox: InternalBoxItem;
}

export const PlannerBoxPanelsSection: React.FC<PlannerBoxPanelsSectionProps> = ({ selectedBox }) => {
  const { updateInternalBox } = useSolar();
  const [showPerFaceThickness, setShowPerFaceThickness] = useState<boolean>(() => {
    const pt = selectedBox.panelThickness;
    if (!pt) return false;
    return Boolean(pt.rear || pt.front || pt.left || pt.right || pt.bottom || pt.cabinet || pt.slat || pt.shelf);
  });

  const baseThicknessMm = selectedBox.thicknessMm || 15;
  const pt = selectedBox.panelThickness || {};
  const hasCustomPartThickness = Object.values(pt).some((v) => v !== undefined);

  const setPartThickness = (key: keyof BoxPanelThicknessConfig, val: number | undefined) => {
    const next: BoxPanelThicknessConfig = { ...(selectedBox.panelThickness || {}) };
    if (val === undefined) {
      delete next[key];
    } else {
      next[key] = val;
    }
    updateInternalBox(selectedBox.id, { panelThickness: next });
  };

  return (
    <>
      {/* Espessura das Chapas, Porta e Bandeja Corrediça */}
      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🪵 Espessura de Cada Parte do Módulo
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '9.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              Padrão: {baseThicknessMm} mm
            </span>
            {hasCustomPartThickness && (
              <button
                type="button"
                className="btn-compact"
                onClick={() => updateInternalBox(selectedBox.id, { panelThickness: {} })}
                style={{ fontSize: '9px', padding: '2px 6px', color: '#f87171', borderColor: 'rgba(239,68,68,0.35)' }}
                title="Voltar todas as partes para a espessura padrão do corpo"
              >
                ↺ Igualar Tudo ({baseThicknessMm}mm)
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            padding: '10px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {/* 1. Espessura Geral (Padrão do Corpo do Módulo) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#e2e8f0' }}>
                📦 Espessura Base (Padrão do Módulo):
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {baseThicknessMm} mm
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
              {[6, 9, 12, 15, 18, 20].map((mmVal) => {
                const isAct = baseThicknessMm === mmVal;
                return (
                  <button
                    key={mmVal}
                    type="button"
                    className={`btn-compact ${isAct ? 'active' : ''}`}
                    onClick={() => updateInternalBox(selectedBox.id, { thicknessMm: mmVal })}
                    style={{ fontSize: '10px', padding: '4px 2px', fontWeight: 700 }}
                  >
                    {mmVal}mm
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Espessura do Fundo Traseiro (ex: 6mm compensado fino p/ fechar fundo) */}
          <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa' }}>
                ⬇️ Fundo Traseiro (Parede Porta-Malas):
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
                {pt.rear ?? baseThicknessMm} mm {pt.rear === undefined ? '(padrão)' : ''}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {[4, 6, 9, 12, 15, 18, 20].map((mmVal) => {
                const currentRearMm = pt.rear ?? baseThicknessMm;
                const isAct = currentRearMm === mmVal;
                return (
                  <button
                    key={mmVal}
                    type="button"
                    className={`btn-compact ${isAct ? 'active' : ''}`}
                    onClick={() => setPartThickness('rear', mmVal)}
                    style={{
                      fontSize: '10px',
                      padding: '4px 2px',
                      fontWeight: 700,
                      borderColor: isAct ? '#8b5cf6' : undefined,
                      color: isAct ? '#c4b5fd' : undefined
                    }}
                    title={`Definir espessura do fundo traseiro em ${mmVal} mm`}
                  >
                    {mmVal}mm
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Espessura do Fundo Inferior (Base / Piso do Módulo) */}
          <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8' }}>
                ⏹️ Fundo da Base (Piso Inferior):
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {pt.bottom ?? baseThicknessMm} mm {pt.bottom === undefined ? '(padrão)' : ''}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {[4, 6, 9, 12, 15, 18, 20].map((mmVal) => {
                const currentBottomMm = pt.bottom ?? baseThicknessMm;
                const isAct = currentBottomMm === mmVal;
                return (
                  <button
                    key={mmVal}
                    type="button"
                    className={`btn-compact ${isAct ? 'active' : ''}`}
                    onClick={() => setPartThickness('bottom', mmVal)}
                    style={{ fontSize: '10px', padding: '4px 2px', fontWeight: 700 }}
                    title={`Definir espessura da base inferior em ${mmVal} mm`}
                  >
                    {mmVal}mm
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Espessura do Tampo Superior / Tampa Basculante */}
          <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#cbd5e1' }}>
                🔝 Tampo / Tampa Superior:
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {pt.top ?? baseThicknessMm} mm {pt.top === undefined ? '(padrão)' : ''}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
              {[6, 9, 12, 15, 18, 25].map((mmVal) => {
                const currentTopMm = pt.top ?? baseThicknessMm;
                const isAct = currentTopMm === mmVal;
                return (
                  <button
                    key={mmVal}
                    type="button"
                    className={`btn-compact ${isAct ? 'active' : ''}`}
                    onClick={() => setPartThickness('top', mmVal)}
                    style={{ fontSize: '10px', padding: '4px 2px', fontWeight: 700 }}
                  >
                    {mmVal}mm
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Espessura da Porta (Armário Aéreo, Porta Basculante ou Frente de Gaveta) */}
          <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24' }}>
                🚪 Porta / Frente Externa:
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                {pt.door ?? (selectedBox.upperCabinet && (selectedBox.upperCabinetClosure ?? 'sliding_doors') === 'sliding_doors' ? 6 : baseThicknessMm)} mm
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {[4, 6, 9, 12, 15, 18, 20].map((mmVal) => {
                const currentDoorMm =
                  pt.door ??
                  (selectedBox.upperCabinet && (selectedBox.upperCabinetClosure ?? 'sliding_doors') === 'sliding_doors'
                    ? 6
                    : baseThicknessMm);
                const isAct = currentDoorMm === mmVal;
                return (
                  <button
                    key={mmVal}
                    type="button"
                    className={`btn-compact ${isAct ? 'active' : ''}`}
                    onClick={() => setPartThickness('door', mmVal)}
                    style={{
                      fontSize: '10px',
                      padding: '4px 2px',
                      fontWeight: 700,
                      borderColor: isAct ? '#f59e0b' : undefined,
                      color: isAct ? '#fbbf24' : undefined
                    }}
                    title={`Definir espessura da porta/frente em ${mmVal} mm`}
                  >
                    {mmVal}mm
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Espessura da Bandeja Corrediça / Gaveta Interna */}
          <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#34d399' }}>
                🛝 Bandeja Corrediça / Gaveta Interna:
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                {pt.tray ?? baseThicknessMm} mm {pt.tray === undefined ? '(padrão)' : ''}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
              {[6, 9, 12, 15, 18, 20].map((mmVal) => {
                const currentTrayMm = pt.tray ?? baseThicknessMm;
                const isAct = currentTrayMm === mmVal;
                return (
                  <button
                    key={mmVal}
                    type="button"
                    className={`btn-compact ${isAct ? 'active' : ''}`}
                    onClick={() => setPartThickness('tray', mmVal)}
                    style={{
                      fontSize: '10px',
                      padding: '4px 2px',
                      fontWeight: 700,
                      borderColor: isAct ? '#10b981' : undefined,
                      color: isAct ? '#34d399' : undefined
                    }}
                    title={`Definir espessura da bandeja corrediça/gaveta em ${mmVal} mm`}
                  >
                    {mmVal}mm
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botão para expandir Laterais, Frente, Armário Aéreo, Ripas e Mesa */}
          <button
            type="button"
            className="btn-compact"
            onClick={() => setShowPerFaceThickness(!showPerFaceThickness)}
            style={{
              marginTop: '2px',
              fontSize: '10px',
              padding: '5px 8px',
              background: showPerFaceThickness ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.5)',
              border: '1px dashed rgba(56, 189, 248, 0.4)',
              borderRadius: '6px',
              color: '#cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 700
            }}
          >
            <span>⚙️ Customizar Frente, Laterais, Aéreo, Ripas e Mesa Individualmente</span>
            <span>{showPerFaceThickness ? '▲ Recolher' : '▼ Expandir'}</span>
          </button>

          {showPerFaceThickness && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '7px',
                padding: '8px',
                background: 'rgba(2, 6, 23, 0.55)',
                borderRadius: '6px',
                borderLeft: '2px solid #38bdf8'
              }}
            >
              {(
                [
                  {
                    key: 'front' as keyof BoxPanelThicknessConfig,
                    label: '⬆️ Parede Frontal (Bancos)',
                    options: [4, 6, 9, 12, 15, 18, 20],
                    fallback: baseThicknessMm
                  },
                  {
                    key: 'left' as keyof BoxPanelThicknessConfig,
                    label: '⬅️ Lateral Esquerda (Motorista)',
                    options: [6, 9, 12, 15, 18, 20, 25],
                    fallback: baseThicknessMm
                  },
                  {
                    key: 'right' as keyof BoxPanelThicknessConfig,
                    label: '➡️ Lateral Direita (Passageiro)',
                    options: [6, 9, 12, 15, 18, 20, 25],
                    fallback: baseThicknessMm
                  },
                  {
                    key: 'cabinet' as keyof BoxPanelThicknessConfig,
                    label: '🗄️ Corpo do Armário Aéreo',
                    options: [6, 9, 12, 15, 18, 20],
                    fallback: baseThicknessMm
                  },
                  {
                    key: 'slat' as keyof BoxPanelThicknessConfig,
                    label: '🛏️ Ripas da Cama Retrátil',
                    options: [9, 12, 15, 18, 20, 25],
                    fallback: baseThicknessMm
                  },
                  {
                    key: 'shelf' as keyof BoxPanelThicknessConfig,
                    label: '🪵 Mesa / Prateleira Traseira',
                    options: [12, 15, 18, 20, 25],
                    fallback: 18
                  }
                ]
              ).map((part) => {
                const currentVal = pt[part.key] ?? part.fallback;
                const isCustom = pt[part.key] !== undefined;
                return (
                  <div key={part.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{ fontSize: '9.5px', fontWeight: 700, color: isCustom ? '#38bdf8' : '#cbd5e1' }}>
                        {part.label}:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '9.5px', fontWeight: 800, color: isCustom ? '#38bdf8' : '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                          {currentVal} mm {!isCustom ? '(auto)' : ''}
                        </span>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => setPartThickness(part.key, undefined)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              fontSize: '9px',
                              padding: '0 2px'
                            }}
                            title="Restaurar padrão"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${part.options.length}, 1fr)`, gap: '3px' }}>
                      {part.options.map((mmVal) => {
                        const isAct = currentVal === mmVal;
                        return (
                          <button
                            key={mmVal}
                            type="button"
                            className={`btn-compact ${isAct ? 'active' : ''}`}
                            onClick={() => setPartThickness(part.key, mmVal)}
                            style={{ fontSize: '9.5px', padding: '3px 2px', fontWeight: 700 }}
                          >
                            {mmVal}mm
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
              label: selectedBox.type === 'chest' ? '🔝 Tampa Basculante' : selectedBox.type === 'vertical_lift' ? '🔝 Tampo Elevatório' : selectedBox.type === 'slat_bed' ? '🔝 Estrado de Ripas' : '🔝 Tampo Superior',
              val: selectedBox.panels?.top ?? (selectedBox.type !== 'open'),
              desc: 'Fechamento superior (+Y)'
            },
            {
              key: 'bottom' as keyof BoxPanelsConfig,
              label: '⏹️ Tampo de Baixo (Fundo)',
              val: selectedBox.panels?.bottom ?? false,
              desc: 'Chapa de fundo do módulo (-Y)'
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

        {/* Modo de Encaixe & Fechamento do Tampo Traseiro do Módulo */}
        <div
          style={{
            marginTop: '10px',
            padding: '9px 10px',
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '7px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {/* 1. Fechamento do Tampo de Fundo (4 partes em volta vs Tampo fechando as 5 partes) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981' }}>
                🧱 Fechamento do Tampo Traseiro (Fundo):
              </span>
              <span style={{ fontSize: '8.5px', color: '#94a3b8' }}>
                {(selectedBox.boxBackCoverMode || 'inset') === 'overlay_all'
                  ? 'Tampo Fecha as 5 Partes (Maior)'
                  : '4 Partes em Volta do Tampo'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
              {[
                {
                  val: 'inset' as BackPanelCoverMode,
                  label: '🔲 4 Partes em Volta do Tampo',
                  desc: 'Fundo embutido dentro das laterais/base'
                },
                {
                  val: 'overlay_all' as BackPanelCoverMode,
                  label: '⬛ Tampo Traseiro Maior (Cobre Tudo)',
                  desc: 'Fundo inteiro fechando as 5 partes por trás'
                }
              ].map((opt) => {
                const currentBack = selectedBox.boxBackCoverMode || 'inset';
                const isActive = currentBack === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => updateInternalBox(selectedBox.id, { boxBackCoverMode: opt.val })}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.2))'
                        : 'rgba(30, 41, 59, 0.6)',
                      border: isActive ? '1px solid #10b981' : '1px solid rgba(148, 163, 184, 0.25)',
                      borderRadius: '5px',
                      padding: '5px 6px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: isActive ? '#34d399' : '#cbd5e1' }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: '7.5px', color: isActive ? '#6ee7b7' : '#64748b', textAlign: 'center', lineHeight: 1.2 }}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Encaixe entre Cima/Baixo e Laterais */}
          <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8' }}>
                🪚 Encaixe Cima/Baixo vs Laterais:
              </span>
              <span style={{ fontSize: '8.5px', color: '#94a3b8' }}>
                {(selectedBox.boxJointStyle || 'top_bottom_cap') === 'sides_outside'
                  ? 'Laterais Maiores (Por Fora)'
                  : 'Cima/Baixo Maiores'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
              {[
                {
                  val: 'top_bottom_cap' as BoxJointStyle,
                  label: '⬆️⬇️ Cima e Baixo Maiores',
                  desc: 'Tampo e base cobrem as laterais'
                },
                {
                  val: 'sides_outside' as BoxJointStyle,
                  label: '📐 Laterais Maiores',
                  desc: 'Laterais inteiras por fora; base no meio'
                }
              ].map((opt) => {
                const currentJoint = selectedBox.boxJointStyle || 'top_bottom_cap';
                const isActive = currentJoint === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => updateInternalBox(selectedBox.id, { boxJointStyle: opt.val })}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(37, 99, 235, 0.2))'
                        : 'rgba(30, 41, 59, 0.6)',
                      border: isActive ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                      borderRadius: '5px',
                      padding: '5px 6px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '9.5px', fontWeight: 700, color: isActive ? '#38bdf8' : '#cbd5e1' }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: '7.5px', color: isActive ? '#7dd3fc' : '#64748b', textAlign: 'center', lineHeight: 1.2 }}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
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
