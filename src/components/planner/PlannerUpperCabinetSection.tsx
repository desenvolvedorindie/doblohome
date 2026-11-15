import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, UpperCabinetClosure, getUpperCabinetClosure } from '../../types';

interface PlannerUpperCabinetProps {
  selectedBox: InternalBoxItem;
}

export const PlannerUpperCabinetSection: React.FC<PlannerUpperCabinetProps> = ({ selectedBox }) => {
  const { updateInternalBox, isCabinetsOpenPreview, setIsCabinetsOpenPreview, internalGrid } = useSolar();
  const rows = Math.max(1, internalGrid.rowsZ);

  return (
    <>
      {/* Opção de Armário Aéreo de Quina até o Teto da Doblò */}
      <div
        style={{
          marginTop: '12px',
          padding: '12px',
          background: selectedBox.upperCabinet
            ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.16), rgba(37, 99, 235, 0.08))'
            : 'rgba(30, 41, 59, 0.45)',
          border: selectedBox.upperCabinet
            ? '1px solid rgba(56, 189, 248, 0.55)'
            : '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '8px',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: selectedBox.upperCabinet ? '10px' : '0', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: selectedBox.upperCabinet ? '#38bdf8' : '#e2e8f0' }}>
                🗄️ Armário Aéreo de Quina (Até o Teto da Doblò)
              </span>
              <span
                style={{
                  fontSize: '8.5px',
                  fontWeight: 800,
                  color: selectedBox.upperCabinet ? '#38bdf8' : '#94a3b8',
                  background: selectedBox.upperCabinet ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}
              >
                {selectedBox.upperCabinet ? '✓ ATIVO (Até o Teto 1.72m)' : 'DESATIVADO'}
              </span>
            </div>
            <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.35 }}>
              Módulo aéreo de quina sobre a caixa subindo até o limite do teto da Fiat Doblò (~840mm de altura).
              Possui profundidade configurável mais rasa para <strong>deixar a bancada frontal livre para pia/torneira</strong> (layout campervan real).
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const willEnable = !selectedBox.upperCabinet;
              updateInternalBox(selectedBox.id, {
                upperCabinet: willEnable,
                upperCabinetDepthMm: selectedBox.upperCabinetDepthMm || 250,
                upperCabinetAlign: selectedBox.upperCabinetAlign || 'rear',
                upperCabinetDoors: selectedBox.upperCabinetDoors !== undefined ? selectedBox.upperCabinetDoors : true,
                upperCabinetShelves: selectedBox.upperCabinetShelves || 1
              });
            }}
            className="btn-compact"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '6px 12px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              background: selectedBox.upperCabinet
                ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                : 'rgba(51, 65, 85, 0.8)',
              borderColor: selectedBox.upperCabinet ? '#38bdf8' : 'rgba(148, 163, 184, 0.4)',
              color: '#ffffff'
            }}
          >
            {selectedBox.upperCabinet ? '✓ Aéreo Ativo' : '+ Adicionar Armário Aéreo'}
          </button>
        </div>

        {/* Sub-painel de Configuração do Armário Aéreo */}
        {selectedBox.upperCabinet && (
          <div
            style={{
              paddingTop: '10px',
              borderTop: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {/* Profundidade do Aéreo */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                <span style={{ fontWeight: 700 }}>Profundidade do Armário Aéreo:</span>
                <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                  {selectedBox.upperCabinetDepthMm || 250} mm (Bancada livre à frente: {Math.max(0, Math.round(selectedBox.rowSpan * (internalGrid.lengthMm / rows) - (selectedBox.upperCabinetDepthMm || 250)))} mm)
                </span>
              </div>
              <input
                type="range"
                min="150"
                max={Math.max(200, Math.round(selectedBox.rowSpan * (internalGrid.lengthMm / rows) - 50))}
                step="10"
                value={selectedBox.upperCabinetDepthMm || 250}
                onChange={(e) => updateInternalBox(selectedBox.id, { upperCabinetDepthMm: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Vão Livre Inferior até a Bancada/Cama (Espaçamento) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                <span style={{ fontWeight: 700 }}>Vão Livre Inferior (Espaçamento da Base/Cama):</span>
                <span style={{ fontWeight: 800, color: (selectedBox.upperCabinetBottomGapMm ?? 0) <= 80 ? '#38bdf8' : '#10b981' }}>
                  {(selectedBox.upperCabinetBottomGapMm ?? 0) === 0
                    ? '0 mm (Encostado na Base • Recorte Ativo do Colchão)'
                    : (selectedBox.upperCabinetBottomGapMm ?? 0) <= 80
                    ? `${selectedBox.upperCabinetBottomGapMm} mm (Baixo • Recorte Ativo do Colchão)`
                    : `${selectedBox.upperCabinetBottomGapMm} mm (Suspenso Alto • Colchão Livre por Baixo)`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="350"
                step="10"
                value={selectedBox.upperCabinetBottomGapMm ?? 0}
                onChange={(e) => updateInternalBox(selectedBox.id, { upperCabinetBottomGapMm: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#64748b', marginTop: '2px' }}>
                <span>0mm (Encostado na Base)</span>
                <span>80mm (Altura Colchão D33)</span>
                <span>350mm (Suspenso)</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Alinhamento no eixo longitudinal */}
              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                  Posicionamento na Caixa:
                </label>
                <select
                  value={selectedBox.upperCabinetAlign || 'rear'}
                  onChange={(e) => updateInternalBox(selectedBox.id, { upperCabinetAlign: e.target.value as any })}
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    color: '#ffffff',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    fontSize: '11px'
                  }}
                >
                  <option value="rear">▼ Encostado no Fundo Traseiro</option>
                  <option value="front">▲ Encostado na Frente</option>
                  <option value="left">◄ Lateral Esquerda (Parede Motorista)</option>
                  <option value="right">► Lateral Direita (Parede Passageiro)</option>
                </select>
              </div>

              {/* Fechamento: Portas de Correr vs Porta Basculante vs Nicho Aberto */}
              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                  Fechamento Frontal:
                </label>
                <select
                  value={getUpperCabinetClosure(selectedBox)}
                  onChange={(e) => {
                    const val = e.target.value as UpperCabinetClosure;
                    updateInternalBox(selectedBox.id, {
                      upperCabinetClosure: val,
                      upperCabinetDoors: val !== 'open'
                    });
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    color: '#ffffff',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    fontSize: '11px'
                  }}
                >
                  <option value="sliding_doors">🪟 Portas de Correr (2 Folhas Centrais c/ Trilho)</option>
                  <option value="doors">🚪 Porta Basculante c/ Pistão (Abre p/ Cima)</option>
                  <option value="open">🕳️ Nicho Aberto c/ Friso Anti-Queda</option>
                </select>
              </div>
            </div>

            {/* Prateleiras Internas */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                Prateleiras Internas Divisórias:
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3].map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`btn-compact ${(selectedBox.upperCabinetShelves || 1) === num ? 'active' : ''}`}
                    onClick={() => updateInternalBox(selectedBox.id, { upperCabinetShelves: num })}
                    style={{ fontSize: '10px', padding: '3px 8px' }}
                  >
                    {num} {num === 1 ? 'Prateleira' : 'Prateleiras'}
                  </button>
                ))}
              </div>
            </div>

            {/* Teste de Abertura das Portas no 3D */}
            {getUpperCabinetClosure(selectedBox) !== 'open' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.4)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#e2e8f0' }}>
                    {getUpperCabinetClosure(selectedBox) === 'sliding_doors' ? 'Deslizamento das Portas de Correr no 3D:' : 'Abertura da Porta no 3D:'}
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                    {getUpperCabinetClosure(selectedBox) === 'sliding_doors'
                      ? 'Simula o deslizamento lateral da folha da porta no trilho'
                      : 'Simula o pistão basculante abrindo 75° para cima'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const isCurrentlyOpen = isCabinetsOpenPreview || Boolean(selectedBox.isOpen);
                    if (isCabinetsOpenPreview) {
                      setIsCabinetsOpenPreview(false);
                    }
                    updateInternalBox(selectedBox.id, { isOpen: !isCurrentlyOpen });
                  }}
                  className="btn-compact"
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    background: (isCabinetsOpenPreview || Boolean(selectedBox.isOpen))
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #0284c7, #2563eb)',
                    borderColor: (isCabinetsOpenPreview || Boolean(selectedBox.isOpen)) ? '#34d399' : '#38bdf8',
                    color: '#ffffff'
                  }}
                >
                  {(isCabinetsOpenPreview || Boolean(selectedBox.isOpen))
                    ? (getUpperCabinetClosure(selectedBox) === 'sliding_doors' ? '🔒 Fechar Portas de Correr' : '🔓 Fechar Porta')
                    : (getUpperCabinetClosure(selectedBox) === 'sliding_doors' ? '🪟 Deslizar Portas (Abrir)' : '🚪 Abrir Porta')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
