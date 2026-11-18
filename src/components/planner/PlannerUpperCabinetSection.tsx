import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, UpperCabinetClosure, BoxJointStyle, BackPanelCoverMode, getUpperCabinetClosure, getUpperCabinetShelfDoorDiscountMm } from '../../types';

interface PlannerUpperCabinetProps {
  selectedBox: InternalBoxItem;
}

export const PlannerUpperCabinetSection: React.FC<PlannerUpperCabinetProps> = ({ selectedBox }) => {
  const { updateInternalBox, isCabinetsOpenPreview, setIsCabinetsOpenPreview, toggleCabinetsOpenPreview, internalBoxes, internalGrid } = useSolar();
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
                upperCabinetClosure: selectedBox.upperCabinetClosure || 'sliding_doors',
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
                  {selectedBox.upperCabinetDepthMm || 250} mm (Bancada livre à frente: {Math.max(0, Math.round(selectedBox.rowSpan * (internalGrid.lengthMm / rows) + (selectedBox.extraLengthMm || 0) - (selectedBox.upperCabinetDepthMm || 250)))} mm)
                </span>
              </div>
              <input
                type="range"
                min="150"
                max={Math.max(200, Math.round(selectedBox.rowSpan * (internalGrid.lengthMm / rows) + (selectedBox.extraLengthMm || 0) - 50))}
                step="10"
                value={selectedBox.upperCabinetDepthMm || 250}
                onChange={(e) => updateInternalBox(selectedBox.id, { upperCabinetDepthMm: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Vão Livre Inferior até a Bancada/Cama (Espaçamento) */}
            {(() => {
              const bedBox = internalBoxes.find((b) => b.type === 'slat_bed' || b.hasBed) || selectedBox;
              const mattressThickMm = bedBox.mattressThicknessMm ?? 80;
              const mattressTopMm = (bedBox.heightMm ?? internalGrid.heightMm ?? 400) + mattressThickMm;
              const gapMm = selectedBox.upperCabinetBottomGapMm ?? 0;
              const cabBottomMm = (selectedBox.heightMm ?? internalGrid.heightMm ?? 400) + gapMm;
              const cutsMattress = cabBottomMm < mattressTopMm || gapMm <= mattressThickMm;
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 700 }}>Vão Livre Inferior (Espaçamento da Base/Cama):</span>
                    <span style={{ fontWeight: 800, color: cutsMattress ? '#38bdf8' : '#10b981' }}>
                      {gapMm === 0
                        ? '0 mm (Encostado na Base • Recorte Ativo do Colchão)'
                        : cutsMattress
                          ? `${gapMm} mm (Passa da Altura do Colchão • Recorte Ativo)`
                          : `${gapMm} mm (Suspenso Alto • Colchão Livre por Baixo)`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="350"
                    step="10"
                    value={gapMm}
                    onChange={(e) => updateInternalBox(selectedBox.id, { upperCabinetBottomGapMm: parseInt(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#64748b', marginTop: '2px' }}>
                    <span>0mm (Encostado na Base)</span>
                    <span>{mattressThickMm}mm (Altura Colchão)</span>
                    <span>350mm (Suspenso)</span>
                  </div>
                </div>
              );
            })()}

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

            {/* Fechamento Inferior: 5 Faces (com base) vs 4 Faces (sem base) */}
            <div
              style={{
                padding: '8px 10px',
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '7px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b' }}>
                  🗃️ Fundo Inferior do Armário:
                </span>
                <span style={{ fontSize: '8.5px', color: '#94a3b8' }}>
                  {selectedBox.upperCabinetHasBasePanel === undefined ? 'Automático' : selectedBox.upperCabinetHasBasePanel ? '5 Faces (Com Base)' : '4 Faces (Sem Base)'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                {[
                  { label: '🤖 Auto', desc: 'Decide por contexto', val: undefined as boolean | undefined },
                  { label: '5️⃣ 5 Faces', desc: 'Com base inferior', val: true as boolean | undefined },
                  { label: '4️⃣ 4 Faces', desc: 'Sem base (encosta na caixa)', val: false as boolean | undefined }
                ].map((opt) => {
                  const isActive = selectedBox.upperCabinetHasBasePanel === opt.val;
                  return (
                    <button
                      key={String(opt.val)}
                      type="button"
                      onClick={() => updateInternalBox(selectedBox.id, { upperCabinetHasBasePanel: opt.val })}
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.2))'
                          : 'rgba(30, 41, 59, 0.6)',
                        border: isActive ? '1px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.25)',
                        borderRadius: '5px',
                        padding: '5px 4px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '10px', fontWeight: 700, color: isActive ? '#fbbf24' : '#94a3b8' }}>
                        {opt.label}
                      </span>
                      <span style={{ fontSize: '7.5px', color: isActive ? '#f59e0b' : '#64748b', textAlign: 'center', lineHeight: 1.2 }}>
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '8.5px', color: '#64748b', lineHeight: 1.3 }}>
                💡 <strong>5 Faces</strong>: tampo + 2 laterais + fundo traseiro + base inferior (armário suspenso independente). <strong>4 Faces</strong>: sem base, armário apoia-se sobre o tampo da caixa abaixo.
              </div>
            </div>

            {/* Fechamento do Tampo Traseiro & Encaixe de Marcenaria (Laterais vs Tampo/Base vs Fundo Maior) */}
            <div
              style={{
                padding: '8px 10px',
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '7px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* 1. Encaixe entre Cima/Baixo e Laterais */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8' }}>
                    🪚 Encaixe das Chapas (Cima/Baixo vs Laterais):
                  </span>
                  <span style={{ fontSize: '8.5px', color: '#94a3b8' }}>
                    {(selectedBox.upperCabinetJointStyle || 'sides_outside') === 'top_bottom_cap'
                      ? 'Cima/Baixo Maiores'
                      : 'Laterais Maiores'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                  {[
                    {
                      val: 'sides_outside' as BoxJointStyle,
                      label: '📐 Laterais Maiores',
                      desc: 'Laterais inteiras por fora; tampo e base no meio'
                    },
                    {
                      val: 'top_bottom_cap' as BoxJointStyle,
                      label: '⬆️⬇️ Cima e Baixo Maiores',
                      desc: 'Tampo e base cobrem as laterais por cima/baixo'
                    }
                  ].map((opt) => {
                    const currentJoint = selectedBox.upperCabinetJointStyle || 'sides_outside';
                    const isActive = currentJoint === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => updateInternalBox(selectedBox.id, { upperCabinetJointStyle: opt.val })}
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

              {/* 2. Fechamento do Tampo Traseiro (Fundo Interno vs Fundo Maior Cobrindo Tudo) */}
              <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981' }}>
                    🧱 Fechamento do Tampo Traseiro (Fundo):
                  </span>
                  <span style={{ fontSize: '8.5px', color: '#94a3b8' }}>
                    {(selectedBox.upperCabinetBackCoverMode || 'inset') === 'overlay_all'
                      ? 'Fundo Maior (Cobre Tudo)'
                      : '4 Partes em Volta do Fundo'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                  {[
                    {
                      val: 'inset' as BackPanelCoverMode,
                      label: '🔲 4 Partes em Volta do Tampo',
                      desc: 'Fundo menor embutido dentro das 4 bordas'
                    },
                    {
                      val: 'overlay_all' as BackPanelCoverMode,
                      label: '⬛ Tampo Traseiro Maior (Cobre Tudo)',
                      desc: 'Fundo inteiro fechando as 5 partes por trás'
                    }
                  ].map((opt) => {
                    const currentBack = selectedBox.upperCabinetBackCoverMode || 'inset';
                    const isActive = currentBack === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => updateInternalBox(selectedBox.id, { upperCabinetBackCoverMode: opt.val })}
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
                <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '4px', lineHeight: 1.3 }}>
                  💡 Atualiza automaticamente as medidas no <strong>Plano de Corte</strong>: quando o fundo é maior (cobre tudo), o tampo, a base e as laterais descontam a espessura do fundo.
                </div>
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

            {/* Desconto das Portas nas Prateleiras */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Desconto / Recuo p/ Portas:
                </span>
                <span style={{ fontSize: '9px', color: '#38bdf8', marginLeft: '6px' }}>
                  {selectedBox.upperCabinetShelfDoorDiscountMm !== undefined
                    ? `${selectedBox.upperCabinetShelfDoorDiscountMm} mm (manual)`
                    : `${getUpperCabinetShelfDoorDiscountMm(selectedBox)} mm (automático)`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[
                  { label: 'Auto', val: undefined },
                  { label: '20mm', val: 20 },
                  { label: '25mm', val: 25 },
                  { label: '30mm', val: 30 }
                ].map(opt => {
                  const isActive = opt.val === undefined
                    ? selectedBox.upperCabinetShelfDoorDiscountMm === undefined
                    : selectedBox.upperCabinetShelfDoorDiscountMm === opt.val;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      className={`btn-compact ${isActive ? 'active' : ''}`}
                      onClick={() => updateInternalBox(selectedBox.id, { upperCabinetShelfDoorDiscountMm: opt.val })}
                      style={{ fontSize: '9px', padding: '2px 6px' }}
                      title={opt.val === undefined ? 'Recuo automático padrão de marcenaria conforme o tipo de porta' : `Recuo fixo de ${opt.val}mm`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
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
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const isCurrentlyOpen = isCabinetsOpenPreview || Boolean(selectedBox.isUpperCabinetOpen);
                      updateInternalBox(selectedBox.id, { isUpperCabinetOpen: !isCurrentlyOpen });
                    }}
                    className="btn-compact"
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      background: (isCabinetsOpenPreview || Boolean(selectedBox.isUpperCabinetOpen))
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #0284c7, #2563eb)',
                      borderColor: (isCabinetsOpenPreview || Boolean(selectedBox.isUpperCabinetOpen)) ? '#34d399' : '#38bdf8',
                      color: '#ffffff'
                    }}
                    title="Alternar abertura das portas deste armário aéreo"
                  >
                    {(isCabinetsOpenPreview || Boolean(selectedBox.isUpperCabinetOpen))
                      ? (getUpperCabinetClosure(selectedBox) === 'sliding_doors' ? '🔒 Fechar Portas de Correr' : '🔓 Fechar Porta')
                      : (getUpperCabinetClosure(selectedBox) === 'sliding_doors' ? '🪟 Deslizar Portas (Abrir)' : '🚪 Abrir Porta')}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCabinetsOpenPreview()}
                    className="btn-compact"
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '4px 8px',
                      background: 'rgba(30, 41, 59, 0.85)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8'
                    }}
                    title="Abrir ou fechar as portas de todos os armários aéreos do veículo simultaneamente"
                  >
                    {(isCabinetsOpenPreview || internalBoxes.some((b) => b.upperCabinet && b.isUpperCabinetOpen))
                      ? '🔒 Fechar Todos'
                      : '🚪 Abrir Todos'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
