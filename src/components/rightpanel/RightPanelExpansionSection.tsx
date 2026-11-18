import React from 'react';
import { useSolar } from '../../context/SolarContext';

export const RightPanelExpansionSection: React.FC = () => {
  const {
    sceneManager,
    expansionProgress,
    setExpansion,
    retract,
    expand,
    rewind,
    toggleAutoAnim,
    isAutoAnimating,
    cargoBox,
    collisionSummary,
    checkCollisions,
    clearCollisions,
    floatingSummary,
    checkFloating,
    clearFloating,
    flashToast,
    isVehicleVisible,
    toggleVehicle,
    vehicleOpacity,
    setVehicleOpacity,
  } = useSolar();

  const expansionPct = Math.round(expansionProgress * 100);
  const isRetracted = expansionPct <= 0;
  const isFullyOpen = expansionPct >= 100;

  return (
    <>
          {/* Visualização da Lataria do Veículo */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700 }}>
                👁️ Visibilidade da Doblò:
              </span>
              <span style={{ fontSize: '9.5px', color: '#cbd5e1' }}>
                {isVehicleVisible ? (vehicleOpacity < 0.99 ? 'Translúcida (30%)' : 'Opaca (100%)') : 'Oculta'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              <button
                className={`btn-compact ${isVehicleVisible && vehicleOpacity >= 0.99 ? 'active' : ''}`}
                onClick={() => {
                  setVehicleOpacity(1.0);
                  if (!isVehicleVisible) toggleVehicle();
                }}
                style={{ fontSize: '10px', padding: '4px' }}
              >
                🚐 Opaca
              </button>
              <button
                className={`btn-compact ${isVehicleVisible && vehicleOpacity < 0.99 ? 'active' : ''}`}
                onClick={() => {
                  setVehicleOpacity(0.30);
                  if (!isVehicleVisible) toggleVehicle();
                }}
                style={{ fontSize: '10px', padding: '4px' }}
              >
                👻 Raio-X
              </button>
              <button
                className={`btn-compact ${!isVehicleVisible ? 'active' : ''}`}
                onClick={() => {
                  if (isVehicleVisible) toggleVehicle();
                }}
                style={{ fontSize: '10px', padding: '4px' }}
              >
                👁️ Ocultar
              </button>
            </div>
          </div>

          <div className="expansion-widget-divider"></div>
          <div className="expansion-widget-header">
            <span>📐 GAVETAS</span>
            <div className="expansion-status">
              {cargoBox.enabled && cargoBox.tiltAngle > 0 ? (
                <span
                  className="status-badge"
                  style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    fontSize: '9px'
                  }}
                >
                  🔒 Travado (Basculado)
                </span>
              ) : (
                <span
                  className={`status-badge ${isRetracted ? 'retracted' : isFullyOpen ? 'expanded' : 'partial'}`}
                  id="expansion-badge"
                >
                  {isRetracted ? 'Fechado' : isFullyOpen ? 'Extensão Total' : 'Parcial'}
                </span>
              )}
              <span className="extension-val" id="expansion-val">
                {expansionPct}%
              </span>
            </div>
          </div>

          <input
            type="range"
            id="expansion-slider"
            className="custom-slider"
            min="0"
            max="100"
            value={expansionPct}
            disabled={cargoBox.enabled && cargoBox.tiltAngle > 0}
            title={cargoBox.enabled && cargoBox.tiltAngle > 0 ? 'Feche o basculamento do rack para movimentar as gavetas' : ''}
            onChange={(e) => setExpansion(parseFloat(e.target.value) / 100)}
          />

          <div className="slider-actions">
            <button
              className="btn-compact"
              id="btn-retract"
              onClick={retract}
              disabled={cargoBox.enabled && cargoBox.tiltAngle > 0}
            >
              🔒 Recolher
            </button>
            <button
              className="btn-compact primary"
              id="btn-expand"
              onClick={expand}
              disabled={cargoBox.enabled && cargoBox.tiltAngle > 0}
            >
              ⚡ Expandir
            </button>
            <button
              className="btn-compact accent"
              id="btn-rewind"
              title="Rebobinar"
              onClick={rewind}
              disabled={cargoBox.enabled && cargoBox.tiltAngle > 0}
            >
              ⏪ Rebobinar
            </button>
            <button
              className={`btn-compact ${isAutoAnimating ? 'active' : ''}`}
              id="btn-auto-anim"
              onClick={toggleAutoAnim}
              disabled={cargoBox.enabled && cargoBox.tiltAngle > 0}
            >
              {isAutoAnimating ? '⏸️ Pausar' : '▶️ Loop'}
            </button>
          </div>

          <div className="expansion-widget-divider"></div>
      <div className="expansion-widget-divider"></div>
          {/* 🔬 Verificação Estrutural de Colisões */}
          <div className="expansion-widget-header" style={{ marginTop: '2px' }}>
            <span className="expansion-widget-subheader">🔬 VERIFICAÇÃO ESTRUTURAL</span>
            {collisionSummary !== null && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: collisionSummary.errorCount === 0 ? '#4ade80' : '#ef4444',
                  background: collisionSummary.errorCount === 0 ? 'rgba(74, 222, 128, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${collisionSummary.errorCount === 0 ? 'rgba(74,222,128,0.4)' : 'rgba(239,68,68,0.4)'}`,
                  borderRadius: '10px',
                  padding: '2px 7px',
                }}
              >
                {collisionSummary.errorCount === 0 ? '✅ OK' : `🔴 ${collisionSummary.errorCount} erro(s)`}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: collisionSummary && collisionSummary.errorCount > 0 ? '6px' : '0' }}>
            <button
              className="btn-compact primary"
              onClick={checkCollisions}
              style={{ flex: 1, background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#f87171' }}
            >
              🔴 Verificar Colisões
            </button>
            {collisionSummary !== null && (
              <button
                className="btn-compact"
                onClick={clearCollisions}
                title="Limpar destaques de colisão"
              >
                ✅ Limpar
              </button>
            )}
          </div>

          {collisionSummary && collisionSummary.errorCount > 0 && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '10px',
                lineHeight: '1.6',
                marginBottom: '2px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: '#fca5a5', fontWeight: 700 }}>
                  {collisionSummary.collidingBars} barras colidindo em {collisionSummary.totalBars} verificadas:
                </span>
                <button
                  className="btn-compact"
                  title="Copiar relatório de colisões"
                  style={{ fontSize: '10px', padding: '2px 7px', color: '#94a3b8' }}
                  onClick={() => {
                    const lines = [
                      `🔴 Relatório de Colisões Estruturais`,
                      `Barras verificadas: ${collisionSummary.totalBars}`,
                      `Barras colidindo: ${collisionSummary.collidingBars}`,
                      `Total de colisões: ${collisionSummary.errorCount}`,
                      ``,
                      ...collisionSummary.collisions.map((c, i) =>
                        `${i + 1}. ${c.labelA} × ${c.labelB} (eixo ${c.axisA}, vol ≈ ${(c.overlapVolumeM3 * 1e6).toFixed(2)} cm³)`
                      )
                    ].join('\n');
                    navigator.clipboard.writeText(lines).then(() => flashToast('📋 Relatório copiado!'));
                  }}
                >
                  📋 Copiar
                </button>
              </div>
              {collisionSummary.collisions.slice(0, 5).map((c, i) => (
                <div
                  key={i}
                  onMouseEnter={() => sceneManager?.hoverCollisionObjects([c.meshA, c.meshB])}
                  onMouseLeave={() => sceneManager?.hoverCollisionObjects(null)}
                  style={{ color: 'var(--text-muted)', borderBottom: i < Math.min(4, collisionSummary.collisions.length - 1) ? '1px solid rgba(255,255,255,0.05)' : 'none', padding: '3px 4px', marginBottom: '2px', borderRadius: '4px', cursor: 'pointer' }}
                  title="Passe o mouse para destacar os itens em colisão no 3D"
                >
                  <span style={{ color: '#fbbf24' }}>⚠</span>{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#fca5a5' }}>{c.labelA}</span>
                  {' × '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#fca5a5' }}>{c.labelB}</span>
                </div>
              ))}
              {collisionSummary.collisions.length > 5 && (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  ...e mais {collisionSummary.collisions.length - 5} colisão(ões)
                </div>
              )}
            </div>
          )}

          {collisionSummary && collisionSummary.errorCount === 0 && (
            <div
              style={{
                background: 'rgba(74, 222, 128, 0.07)',
                border: '1px solid rgba(74, 222, 128, 0.25)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '10px',
                color: '#86efac',
                marginBottom: '2px',
              }}
            >
              ✅ Estrutura verificada — {collisionSummary.totalBars} barras sem colisões!
            </div>
          )}

          {/* Verificação de Peças Flutuando (Sustentação na Base / Subchassi) */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', marginBottom: floatingSummary && floatingSummary.errorCount > 0 ? '6px' : '0' }}>
            <button
              className="btn-compact"
              onClick={checkFloating}
              style={{ flex: 1, background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.5)', color: '#fbbf24' }}
              title="Verifica se todos os perfis estão apoiados em uma peça abaixo (o subchassi base é o alicerce)"
            >
              🔍 Checar Peças Flutuando
            </button>
            {floatingSummary !== null && (
              <button
                className="btn-compact"
                onClick={clearFloating}
                title="Limpar destaques de peças flutuantes"
              >
                ✅ Limpar
              </button>
            )}
          </div>

          {floatingSummary && floatingSummary.errorCount > 0 && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '10px',
                lineHeight: '1.6',
                marginBottom: '2px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: '#fcd34d', fontWeight: 700 }}>
                  ⚠️ {floatingSummary.floatingBars} peça(s) flutuando (sem apoio):
                </span>
                <button
                  className="btn-compact"
                  title="Copiar relatório de peças flutuantes"
                  style={{ fontSize: '10px', padding: '2px 7px', color: '#94a3b8' }}
                  onClick={() => {
                    const lines = [
                      `⚠️ Relatório de Peças Flutuantes (Sem Sustentação Inferior)`,
                      `Total de barras: ${floatingSummary.totalBars}`,
                      `Base (subchassi): ${floatingSummary.baseBars}`,
                      `Barras verificadas: ${floatingSummary.checkedBars}`,
                      `Peças flutuando: ${floatingSummary.floatingBars}`,
                      ``,
                      ...floatingSummary.floatingList.map((f, i) =>
                        `${i + 1}. ${f.label} [Y: ${f.box.min.y.toFixed(3)} - ${f.box.max.y.toFixed(3)}]`
                      )
                    ].join('\n');
                    navigator.clipboard.writeText(lines).then(() => flashToast('📋 Relatório copiado!'));
                  }}
                >
                  📋 Copiar
                </button>
              </div>
              {floatingSummary.floatingList.slice(0, 5).map((f, i) => (
                <div
                  key={i}
                  onMouseEnter={() => sceneManager?.hoverCollisionObjects([f.mesh])}
                  onMouseLeave={() => sceneManager?.hoverCollisionObjects(null)}
                  style={{ color: 'var(--text-muted)', borderBottom: i < Math.min(4, floatingSummary.floatingList.length - 1) ? '1px solid rgba(255,255,255,0.05)' : 'none', padding: '3px 4px', marginBottom: '2px', borderRadius: '4px', cursor: 'pointer' }}
                  title="Passe o mouse para destacar a peça no 3D"
                >
                  <span style={{ color: '#f59e0b' }}>⚠</span>{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#fde68a' }}>{f.label}</span>
                  <span style={{ fontSize: '9px', color: '#94a3b8', marginLeft: '4px' }}>
                    (Y: {f.box.min.y.toFixed(2)}m)
                  </span>
                </div>
              ))}
              {floatingSummary.floatingList.length > 5 && (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  ...e mais {floatingSummary.floatingList.length - 5} peça(s) flutuando
                </div>
              )}
            </div>
          )}

          {floatingSummary && floatingSummary.errorCount === 0 && (
            <div
              style={{
                background: 'rgba(74, 222, 128, 0.07)',
                border: '1px solid rgba(74, 222, 128, 0.25)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '10px',
                color: '#86efac',
                marginBottom: '2px',
              }}
            >
              ✅ Sustentação 100% OK — todas as {floatingSummary.checkedBars} peças apoiadas no subchassi!
            </div>
          )}

      <div className="expansion-widget-divider"></div>
    </>
  );
};

