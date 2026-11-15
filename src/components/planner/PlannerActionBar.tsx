import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { INTERNAL_BOXES_PRESETS } from '../../data/internalBoxesPresets';

interface PlannerActionBarProps {
  onRequestClear: () => void;
  onRequestPreset: (preset: typeof INTERNAL_BOXES_PRESETS[0]) => void;
  hasUpperCabinets: boolean;
}

export const PlannerActionBar: React.FC<PlannerActionBarProps> = ({
  onRequestClear,
  onRequestPreset,
  hasUpperCabinets
}) => {
  const {
    internalGrid,
    setInternalGrid,
    internalBoxes,
    isolatedBoxId,
    setIsolatedBoxId,
    isOpenPreview,
    setIsOpenPreview,
    isCabinetsOpenPreview,
    setIsCabinetsOpenPreview,
    updateInternalBox,
    toggleCeiling3D,
    rulerState,
    toggleRuler,
  } = useSolar();

  const isolatedBox = internalBoxes.find(b => b.id === isolatedBoxId);

  return (
    <>
      {/* 1. Barra de Ações Rápidas e Presets */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '10px 12px',
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: '10px',
          border: '1px solid rgba(56, 189, 248, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
            📦 Presets de Layout:
          </span>
          {INTERNAL_BOXES_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onRequestPreset(p)}
              className="btn-compact"
              style={{
                fontSize: '10.5px',
                padding: '4px 8px',
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#e2e8f0',
                borderRadius: '6px'
              }}
              title={p.description}
            >
              {p.name.split(':')[0]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Iluminação em Perfil de LED no Rodapé do Assoalho */}
          <button
            onClick={() => {
              const currentEnabled = internalGrid.ledBaseboard?.enabled ?? true;
              setInternalGrid(prev => ({
                ...prev,
                ledBaseboard: {
                  enabled: !currentEnabled,
                  color: prev.ledBaseboard?.color || '#fef3c7',
                  brightness: prev.ledBaseboard?.brightness ?? 85
                }
              }));
            }}
            className="btn-compact"
            style={{
              fontSize: '11px',
              padding: '5px 10px',
              fontWeight: 700,
              background: (internalGrid.ledBaseboard?.enabled ?? true)
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))'
                : 'rgba(30, 41, 59, 0.6)',
              borderColor: (internalGrid.ledBaseboard?.enabled ?? true) ? '#f59e0b' : 'rgba(148, 163, 184, 0.3)',
              color: (internalGrid.ledBaseboard?.enabled ?? true) ? '#fbbf24' : '#94a3b8'
            }}
            title="Alternar fita de LED COB no rodapé do assoalho"
          >
            💡 LED Rodapé: {(internalGrid.ledBaseboard?.enabled ?? true) ? 'Ligado' : 'Desligado'}
          </button>

          <button
            onClick={() => {
              const next = !isOpenPreview;
              setIsOpenPreview(next);
              // Quando abre a prévia, se houver cama retrátil, abre 100% (abrir toda a cama com colchão casal)
              if (next) {
                internalBoxes.forEach(b => {
                  if (b.type === 'slat_bed') {
                    updateInternalBox(b.id, { slatExtensionPercent: 100 });
                  }
                });
              }
            }}
            className="btn-compact primary"
            style={{
              fontSize: '11px',
              padding: '5px 12px',
              fontWeight: 700,
              background: isOpenPreview ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #0284c7, #2563eb)'
            }}
          >
            {isOpenPreview ? '🛋️ Modo Sofá / Fechar' : '🛌 Abrir Toda a Cama (100%)'}
          </button>

          {hasUpperCabinets && (
            <button
              type="button"
              onClick={() => setIsCabinetsOpenPreview((prev) => !prev)}
              className="btn-compact"
              style={{
                fontSize: '11px',
                padding: '5px 12px',
                fontWeight: 700,
                background: isCabinetsOpenPreview
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #0284c7, #2563eb)',
                borderColor: isCabinetsOpenPreview ? '#34d399' : '#38bdf8',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Abrir ou fechar as portas dos armários aéreos no modelo 3D (sistema basculante náutico)"
            >
              <span>{isCabinetsOpenPreview ? '🔓' : '🚪'}</span>
              <span>{isCabinetsOpenPreview ? 'Aéreos: Abertos (Fechar)' : 'Abrir Armários Aéreos'}</span>
            </button>
          )}

          {internalGrid.ceiling?.enabled !== false && (
            <button
              type="button"
              onClick={toggleCeiling3D}
              className="btn-compact"
              style={{
                fontSize: '11px',
                padding: '5px 12px',
                fontWeight: 700,
                background: internalGrid.ceiling?.visibleIn3D !== false
                  ? 'rgba(15, 23, 42, 0.85)'
                  : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                borderColor: internalGrid.ceiling?.visibleIn3D !== false
                  ? 'rgba(56, 189, 248, 0.4)'
                  : '#fbbf24',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title={
                internalGrid.ceiling?.visibleIn3D !== false
                  ? 'Ocultar teto no 3D para visualizar o interior dos móveis por cima (as peças continuam no plano de corte)'
                  : 'Exibir teto no 3D'
              }
            >
              <span>{internalGrid.ceiling?.visibleIn3D !== false ? '👁️' : '🙈'}</span>
              <span>
                {internalGrid.ceiling?.visibleIn3D !== false
                  ? `Teto 3D: Visível (${internalGrid.ceiling?.type === 'slatted' ? 'Ripado' : 'Chapa'})`
                  : 'Teto 3D: Oculto'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleRuler}
            className="btn-compact"
            style={{
              fontSize: '11px',
              padding: '5px 12px',
              fontWeight: 700,
              background: rulerState.isActive
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'rgba(15, 23, 42, 0.85)',
              borderColor: rulerState.isActive ? '#fbbf24' : 'rgba(245, 158, 11, 0.45)',
              color: rulerState.isActive ? '#0f172a' : '#fbbf24',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: rulerState.isActive ? '0 0 12px rgba(245, 158, 11, 0.4)' : 'none'
            }}
            title="Ativar / desativar régua de medição 3D (Atalho: T)"
          >
            <span>📏</span>
            <span>{rulerState.isActive ? 'Régua: Ativa (T)' : 'Régua (T)'}</span>
          </button>

          <button
            onClick={onRequestClear}
            className="btn-compact"
            style={{
              fontSize: '11px',
              padding: '5px 10px',
              color: '#f87171',
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}
            title="Remover todas as caixas"
          >
            🧹 Limpar
          </button>
        </div>
      </div>

      {/* Banner de Modo de Foco Isolado */}
      {isolatedBox && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1.5px solid #38bdf8',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setIsolatedBoxId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: '1px solid #7dd3fc',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.15s ease'
              }}
              title="Voltar para visualizar e editar todos os demais baús"
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>←</span> Voltar
            </button>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#7dd3fc', fontWeight: 800, letterSpacing: '0.05em' }}>
                Modo de Visualização Isolada
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
                Visualizando apenas: <span style={{ color: '#38bdf8' }}>{isolatedBox.name}</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>
            Demais baús transparentes no 3D<br />
            <span style={{ color: '#64748b', fontSize: '10px' }}>Clique na setinha ou dê duplo clique no fundo para voltar</span>
          </div>
        </div>
      )}

    </>
  );
};
