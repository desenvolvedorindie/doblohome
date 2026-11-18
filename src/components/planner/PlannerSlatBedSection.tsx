import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, InternalBoxMaterial, SlatBedDirection, MattressFoamDensity } from '../../types';

interface PlannerSlatBedProps {
  selectedBox: InternalBoxItem;
  cols: number;
  rows: number;
}

export const PlannerSlatBedSection: React.FC<PlannerSlatBedProps> = ({ selectedBox, cols, rows }) => {
  const { updateInternalBox, internalGrid, isOpenPreview, setIsOpenPreview } = useSolar();

  const isBedActive = selectedBox.type === 'slat_bed' || Boolean(selectedBox.hasBed);

  if (!isBedActive) {
    return (
      <div style={{
        marginTop: '10px',
        padding: '10px',
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px dashed rgba(56, 189, 248, 0.35)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
            🛏️ Cama / Sofá-Cama (Componente Opcional)
          </div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
            Adicione cama retrátil com ripas ou articulada com dobradiça sobre este módulo.
          </div>
        </div>
        <button
          type="button"
          className="btn-compact"
          onClick={() => updateInternalBox(selectedBox.id, {
            hasBed: true,
            bedMode: selectedBox.bedMode || 'slat',
            slatBedDirection: selectedBox.slatBedDirection || 'left'
          })}
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            padding: '6px 10px',
            background: 'rgba(56, 189, 248, 0.2)',
            borderColor: '#38bdf8',
            color: '#38bdf8',
            whiteSpace: 'nowrap'
          }}
        >
          ➕ Instalar Cama
        </button>
      </div>
    );
  }

  const isBedCurrentlyOpen = isOpenPreview || Boolean(selectedBox.isBedOpen ?? (selectedBox.type === 'slat_bed' ? selectedBox.isOpen : false));
  const isLateral = (selectedBox.slatBedDirection || 'left') === 'left' || selectedBox.slatBedDirection === 'right';
  const baseDimMm = Math.max(50, Math.round(isLateral
    ? selectedBox.colSpan * (internalGrid.widthMm / cols) + (selectedBox.extraWidthMm || 0)
    : selectedBox.rowSpan * (internalGrid.lengthMm / rows) + (selectedBox.extraLengthMm || 0)));
  const extPct = Math.min(100, Math.max(40, selectedBox.slatExtensionPercent ?? 100));
  const extDimMm = Math.round(baseDimMm * (1 + extPct / 100));

  const isHinged = selectedBox.bedMode === 'hinged';
  const minLeafMm = Math.min(100, baseDimMm);
  const defaultLeafMm = selectedBox.hingedBedLeafSizeMm ?? Math.round(baseDimMm * (extPct / 100));
  const currentLeafMm = Math.min(baseDimMm, Math.max(minLeafMm, defaultLeafMm));
  const totalOpenDimMm = baseDimMm + currentLeafMm;

  return (
    <>
      {/* Configuração da Cama (Ripas ou Dobradiça) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', padding: '10px', background: 'rgba(15, 23, 42, 0.55)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
            🛏️ Cama / Sofá-Cama Instalada
          </span>
          <button
            type="button"
            onClick={() => {
              if (selectedBox.type === 'slat_bed') {
                updateInternalBox(selectedBox.id, { type: 'chest', hasBed: false, isBedOpen: false });
              } else {
                updateInternalBox(selectedBox.id, { hasBed: false, isBedOpen: false });
              }
            }}
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '9.5px',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171'
            }}
          >
            🗑️ Remover Cama
          </button>
        </div>

        {/* Alternância entre os 2 Modos de Cama */}
        <div>
          <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
            🛠️ Mecanismo Construtivo da Cama:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              type="button"
              onClick={() => updateInternalBox(selectedBox.id, { bedMode: 'slat' })}
              style={{
                padding: '7px 8px',
                borderRadius: '6px',
                border: !isHinged ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                background: !isHinged ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                color: !isHinged ? '#38bdf8' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🛏️ Retrátil c/ Ripas
            </button>
            <button
              type="button"
              onClick={() => updateInternalBox(selectedBox.id, { bedMode: 'hinged' })}
              style={{
                padding: '7px 8px',
                borderRadius: '6px',
                border: isHinged ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                background: isHinged ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                color: isHinged ? '#38bdf8' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🚪 Articulada c/ Dobradiça
            </button>
          </div>
        </div>

        {/* Superfície da Cama Articulada com Dobradiça */}
        {isHinged && (
          <div>
            <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
              🪵 Superfície da Cama Articulada:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => updateInternalBox(selectedBox.id, { hingedBedSurface: 'panel' })}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: (selectedBox.hingedBedSurface || 'panel') === 'panel' ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                  background: (selectedBox.hingedBedSurface || 'panel') === 'panel' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                  color: (selectedBox.hingedBedSurface || 'panel') === 'panel' ? '#38bdf8' : '#94a3b8',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🪵 Tampo Inteiriço
              </button>
              <button
                type="button"
                onClick={() => updateInternalBox(selectedBox.id, { hingedBedSurface: 'slatted' })}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: selectedBox.hingedBedSurface === 'slatted' ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                  background: selectedBox.hingedBedSurface === 'slatted' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                  color: selectedBox.hingedBedSurface === 'slatted' ? '#38bdf8' : '#94a3b8',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🛏️ Estrado c/ Ripas
              </button>
            </div>
          </div>
        )}

        <div>
          <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
            {isHinged ? '🧭 Direção de Articulação da Dobradiça:' : '🧭 Direção de Abertura / Deslizamento das Ripas:'}
          </label>
          <select
            value={selectedBox.slatBedDirection || 'left'}
            onChange={(e) => {
              const newDir = e.target.value as SlatBedDirection;
              updateInternalBox(selectedBox.id, { slatBedDirection: newDir });
              setIsOpenPreview(true);
            }}
            style={{
              width: '100%',
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(56, 189, 248, 0.6)',
              color: '#ffffff',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            <option value="left">◀ Esquerda (Abre p/ Lado do Motorista)</option>
            <option value="right">▶ Direita (Abre p/ Lado do Passageiro)</option>
            <option value="rear">▼ Traseira (Abre p/ Porta-Malas)</option>
            <option value="front">▲ Dianteira (Abre p/ Bancos da Frente)</option>
          </select>
        </div>

        {/* Extensão e Botão de Abrir / Fechar a Cama */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '6px', padding: '8px 10px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
              {isHinged ? '🚪 Tampo Articulado com Dobradiça:' : '🛏️ Estrado Retrátil em L Invertido (Pente):'}
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Base fixa: {baseDimMm} mm ➔ {isHinged ? 'Desdobrada' : 'Aberta'}: <strong>{totalOpenDimMm} mm</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextOpen = !isBedCurrentlyOpen;
              updateInternalBox(selectedBox.id, {
                ...(selectedBox.type === 'slat_bed' ? { isOpen: nextOpen } : {}),
                isBedOpen: nextOpen,
                slatExtensionPercent: 100
              });
              setIsOpenPreview(nextOpen);
            }}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              background: isBedCurrentlyOpen ? '#10b981' : 'rgba(56, 189, 248, 0.25)',
              color: isBedCurrentlyOpen ? '#0f172a' : '#38bdf8'
            }}
          >
            {isBedCurrentlyOpen
              ? (isHinged ? '🛋️ Dobrar (Modo Sofá)' : '🛋️ Fechar (Modo Sofá)')
              : (isHinged ? '⚡ Desdobrar Cama Inteira' : '⚡ Abrir Toda Cama')}
          </button>
        </div>

        {/* Slide para escolher o tamanho de extensão/folha da cama limitado ao tamanho do módulo */}
        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', padding: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
            <span style={{ fontWeight: 700, color: '#38bdf8' }}>
              {isHinged ? '📏 Tamanho da Folha Dobrável (Cama):' : '📏 Extensão da Cama Retrátil (Ripas):'}
            </span>
            <span style={{ fontWeight: 800, color: '#38bdf8' }}>
              +{currentLeafMm} mm (Total: {totalOpenDimMm} mm)
            </span>
          </div>
          <input
            type="range"
            min={minLeafMm}
            max={baseDimMm}
            step={5}
            value={currentLeafMm}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              updateInternalBox(selectedBox.id, { hingedBedLeafSizeMm: val });
            }}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#64748b', marginTop: '2px' }}>
            <span>{minLeafMm} mm (Mín.)</span>
            <span>Máx. módulo: {baseDimMm} mm (100%)</span>
          </div>
        </div>

        {/* Madeira independente: ripas (ou folha/tampo) e pés */}
        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
            🪵 Madeira da Cama
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {([
              { key: 'slatMaterial', label: isHinged ? 'Tampo / Folha:' : 'Ripas:' },
              { key: 'bedLegMaterial', label: 'Pés:' }
            ] as const).map(({ key, label }) => (
              <div key={key}>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                  {label}
                </label>
                <select
                  value={selectedBox[key] ?? ''}
                  onChange={(e) =>
                    updateInternalBox(selectedBox.id, {
                      [key]: e.target.value === '' ? undefined : (e.target.value as InternalBoxMaterial)
                    })
                  }
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    color: '#ffffff',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  <option value="">↩️ Igual ao módulo</option>
                  <option value="plywood">🪵 Compensado Naval Claro</option>
                  <option value="dark_wood">🪵 Madeira Nobre / Escura</option>
                  <option value="white_mdf">⚪ MDF Branco Acetinado</option>
                  <option value="aluminum_box">⚙️ Alumínio Estrutural</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Configurações de Estofaria e Colchão */}
        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🛏️ Configuração do Colchão & Estofaria</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {/* Escolha da Espuma */}
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                Densidade da Espuma:
              </label>
              <select
                value={selectedBox.mattressFoam || 'D33'}
                onChange={(e) => updateInternalBox(selectedBox.id, { mattressFoam: e.target.value as MattressFoamDensity })}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#ffffff',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                <option value="D33">Espuma D33 (Firmeza Padrão • Recomendada)</option>
                <option value="D28">Espuma D28 (Macia / Leve)</option>
                <option value="D45">Espuma D45 (Extra Firme / Ortopédica)</option>
                <option value="D33_SOFT">Espuma D33 + Camada Soft (Conforto Máximo)</option>
                <option value="AG80">Espuma AG80 (Alta Densidade Aglomerada)</option>
              </select>
            </div>

            {/* Ocupação / Partes do Colchão na Doblò */}
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                Ocupação do Colchão na Doblò:
              </label>
              <select
                value={selectedBox.mattressParts === 4 ? 3 : (selectedBox.mattressParts ?? 2)}
                onChange={(e) => updateInternalBox(selectedBox.id, { mattressParts: parseInt(e.target.value) as any })}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#ffffff',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                <option value={1}>1 Parte (Apenas Base Fechada)</option>
                <option value={2}>2 Partes (Base + Corredor)</option>
                <option value={3}>3 Partes de Toda a Doblò (120 cm)</option>
                <option value={5}>Ocupa Tudo + 2 Caixas de Roda (5 Partes)</option>
              </select>
            </div>
          </div>

          {/* Espessura do Colchão */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>
              <span style={{ fontWeight: 700 }}>Espessura da Espuma:</span>
              <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                {selectedBox.mattressThicknessMm ?? 80} mm
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="120"
              step="10"
              value={selectedBox.mattressThicknessMm ?? 80}
              onChange={(e) => updateInternalBox(selectedBox.id, { mattressThicknessMm: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#64748b', marginTop: '2px' }}>
              <span>50mm (Compacto)</span>
              <span>80mm (Padrão Doblò)</span>
              <span>120mm (Alto)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Controle Avançado da Cama Retrátil com Ripas */}
      <div
        style={{
          marginTop: '8px',
          padding: '10px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '6px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
            📐 Medidas da Cama Aberta:
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 800 }}>
            {totalOpenDimMm} mm (+{currentLeafMm} mm)
          </span>
        </div>
        <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>
          {isHinged
            ? '• Folha dobrável articulada com dobradiças metálicas e pés de apoio ao assoalho (aparecem ao abrir).'
            : '• Estrado de ripas compensadas em leque tipo pente retrátil com pés de apoio articulados ao assoalho.'}
        </div>
      </div>
    </>
  );
};
