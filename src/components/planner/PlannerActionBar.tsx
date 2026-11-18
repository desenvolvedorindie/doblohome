import React, { useState, useEffect } from 'react';
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
    sceneManager,
    internalGrid,
    setInternalGrid,
    internalBoxes,
    isolatedBoxId,
    setIsolatedBoxId,
    isOpenPreview,
    setIsOpenPreview,
    isCabinetsOpenPreview,
    setIsCabinetsOpenPreview,
    toggleCabinetsOpenPreview,
    updateInternalBox,
    toggleCeiling3D,
    toggleFloor3D,
  } = useSolar();

  const [wallsGhost, setWallsGhost] = useState<boolean>(
    () => Boolean(sceneManager?.internalBoxesBuilder?.ghostWalls)
  );

  useEffect(() => {
    setWallsGhost(Boolean(sceneManager?.internalBoxesBuilder?.ghostWalls));
  }, [sceneManager]);

  useEffect(
    () => () => {
      sceneManager?.setModuleWallsGhost(false);
    },
    [sceneManager]
  );

  const toggleWallsGhost = () => {
    const next = !wallsGhost;
    setWallsGhost(next);
    sceneManager?.setModuleWallsGhost(next);
  };

  const isolatedBox = internalBoxes.find(b => b.id === isolatedBoxId);

  return (
    <>
      {/* 1. Barra de Ações Rápidas e Presets */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '12px',
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: '10px',
          border: '1px solid rgba(56, 189, 248, 0.25)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
            📦 Presets de Layout:
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            {INTERNAL_BOXES_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => onRequestPreset(p)}
                className="btn-compact"
                style={{
                  width: '100%',
                  fontSize: '11px',
                  padding: '7px 10px',
                  background: 'rgba(30, 41, 59, 0.85)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#e2e8f0',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontWeight: 600
                }}
                title={p.description}
              >
                {p.name.split(':')[0]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(56, 189, 248, 0.2)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
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
              width: '100%',
              fontSize: '11.5px',
              padding: '8px 12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
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

          {(() => {
            const slatBeds = internalBoxes.filter((b) => b.type === 'slat_bed');
            if (slatBeds.length === 0) return null;
            const isBedOpen = isOpenPreview || slatBeds.some((b) => Boolean(b.isOpen));
            return (
              <button
                type="button"
                onClick={() => {
                  const next = !isBedOpen;
                  setIsOpenPreview(next);
                  slatBeds.forEach((b) => {
                    const nextParts = next && b.mattressParts === 1 ? 2 : b.mattressParts;
                    updateInternalBox(b.id, {
                      isOpen: next,
                      slatExtensionPercent: 100,
                      ...(nextParts !== undefined ? { mattressParts: nextParts } : {})
                    });
                  });
                }}
                className="btn-compact primary"
                style={{
                  width: '100%',
                  fontSize: '11.5px',
                  padding: '8px 12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: isBedOpen
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #0284c7, #2563eb)'
                }}
                title="Estende ou recolhe exclusivamente a cama retrátil (100%)"
              >
                {isBedOpen ? '🛋️ Modo Sofá / Fechar Cama' : '🛌 Abrir Toda a Cama (100%)'}
              </button>
            );
          })()}

          {(() => {
            const tableBoxes = internalBoxes.filter((b) => b.rearFoldShelf);
            if (tableBoxes.length === 0) return null;
            const allOpen = tableBoxes.every((b) => b.isRearShelfOpen ?? isOpenPreview);
            return (
              <button
                type="button"
                onClick={() => {
                  tableBoxes.forEach((b) => updateInternalBox(b.id, { isRearShelfOpen: !allOpen }));
                }}
                className="btn-compact"
                style={{
                  width: '100%',
                  fontSize: '11.5px',
                  padding: '8px 12px',
                  fontWeight: 700,
                  background: allOpen
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #d97706, #b45309)',
                  borderColor: allOpen ? '#34d399' : '#fbbf24',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                title="Levantar ou rebater todas as mesas traseiras"
              >
                <span>🪵</span>
                <span>{allOpen ? 'Mesas: Abertas (Fechar Todas)' : 'Abrir Todas as Mesas'}</span>
              </button>
            );
          })()}

          {(() => {
            const slideBoxes = internalBoxes.filter((b) => b.type === 'drawer' || b.type === 'slide_tray');
            if (slideBoxes.length === 0) return null;
            const allOpen = slideBoxes.every((b) => Boolean(b.isOpen));
            return (
              <button
                type="button"
                onClick={() => {
                  slideBoxes.forEach((b) => updateInternalBox(b.id, { isOpen: !allOpen }));
                }}
                className="btn-compact"
                style={{
                  width: '100%',
                  fontSize: '11.5px',
                  padding: '8px 12px',
                  fontWeight: 700,
                  background: allOpen
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #0284c7, #2563eb)',
                  borderColor: allOpen ? '#34d399' : '#38bdf8',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                title="Deslizar ou fechar todas as corrediças (gavetas e bandejas)"
              >
                <span>{allOpen ? '🔓' : '🛝'}</span>
                <span>{allOpen ? 'Corrediças: Abertas (Fechar Todas)' : 'Abrir Todas as Corrediças'}</span>
              </button>
            );
          })()}

          {hasUpperCabinets && (() => {
            const areCabinetsOpen = isCabinetsOpenPreview || internalBoxes.some((b) => b.upperCabinet && b.isUpperCabinetOpen);
            return (
              <button
                type="button"
                onClick={() => toggleCabinetsOpenPreview()}
                className="btn-compact"
                style={{
                  width: '100%',
                  fontSize: '11.5px',
                  padding: '8px 12px',
                  fontWeight: 700,
                  background: areCabinetsOpen
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #0284c7, #2563eb)',
                  borderColor: areCabinetsOpen ? '#34d399' : '#38bdf8',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                title="Abrir ou fechar as portas de todos os armários aéreos no modelo 3D"
              >
                <span>{areCabinetsOpen ? '🔓' : '🚪'}</span>
                <span>{areCabinetsOpen ? 'Aéreos: Abertos (Fechar Todos)' : 'Abrir Armários Aéreos'}</span>
              </button>
            );
          })()}

          {internalGrid.ceiling?.enabled !== false && (
            <button
              type="button"
              onClick={toggleCeiling3D}
              className="btn-compact"
              style={{
                width: '100%',
                fontSize: '11.5px',
                padding: '8px 12px',
                fontWeight: 700,
                background: internalGrid.ceiling?.visibleIn3D !== false
                  ? 'rgba(15, 23, 42, 0.85)'
                  : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                borderColor: internalGrid.ceiling?.visibleIn3D !== false
                  ? 'rgba(56, 189, 248, 0.4)'
                  : '#fbbf24',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
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

          {/* Botão de Alternar / Tirar Tampo de Baixo (Assoalho Base da Van) */}
          <button
            type="button"
            onClick={toggleFloor3D}
            className="btn-compact"
            style={{
              width: '100%',
              fontSize: '11.5px',
              padding: '8px 12px',
              fontWeight: 700,
              background: internalGrid.floorVisibleIn3D !== false
                ? 'rgba(15, 23, 42, 0.85)'
                : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              borderColor: internalGrid.floorVisibleIn3D !== false
                ? 'rgba(56, 189, 248, 0.4)'
                : '#fbbf24',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            title={
              internalGrid.floorVisibleIn3D !== false
                ? 'Tirar / Ocultar o tampo de baixo (assoalho base de compensado naval) no 3D para ver por baixo ou trabalhar sem piso'
                : 'Exibir o tampo de baixo (assoalho base de compensado naval) no 3D'
            }
          >
            <span>{internalGrid.floorVisibleIn3D !== false ? '🪵' : '🙈'}</span>
            <span>
              {internalGrid.floorVisibleIn3D !== false
                ? 'Tampo de Baixo (Assoalho): Visível'
                : 'Tampo de Baixo: Oculto (Sem Assoalho)'}
            </span>
          </button>

          {/* Botão para Tirar Tampo de Baixo dos Módulos (se algum tiver fundo ativo) */}
          {internalBoxes.some((b) => b.panels?.bottom) && (
            <button
              type="button"
              onClick={() => {
                internalBoxes.forEach((b) => {
                  if (b.panels?.bottom) {
                    updateInternalBox(b.id, {
                      panels: { ...b.panels, bottom: false }
                    });
                  }
                });
              }}
              className="btn-compact"
              style={{
                width: '100%',
                fontSize: '11.5px',
                padding: '8px 12px',
                fontWeight: 700,
                background: 'rgba(239, 68, 68, 0.15)',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              title="Remove a chapa inferior/fundo de todas as caixas, deixando-as vazadas no fundo"
            >
              <span>⏹️</span>
              <span>Tirar Tampo de Baixo das Caixas</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleWallsGhost}
            disabled={!sceneManager}
            className="btn-compact"
            style={{
              width: '100%',
              fontSize: '11.5px',
              padding: '8px 12px',
              fontWeight: 700,
              background: wallsGhost
                ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)'
                : 'rgba(15, 23, 42, 0.85)',
              borderColor: wallsGhost ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            title="Deixa as paredes dos módulos translúcidas no 3D para visualizar e inspecionar apenas os componentes internos"
          >
            <span>{wallsGhost ? '👻' : '👁️'}</span>
            <span>
              {wallsGhost ? 'Paredes Translúcidas: ON (Ver Tudo)' : 'Ocultar Paredes (Ver Só Componentes)'}
            </span>
          </button>

          <button
            onClick={onRequestClear}
            className="btn-compact"
            style={{
              width: '100%',
              fontSize: '11.5px',
              padding: '8px 12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#f87171',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.08)'
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
