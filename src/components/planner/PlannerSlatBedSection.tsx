import React from 'react';
import { useSolar } from '../../context/SolarContext';
import { InternalBoxItem, SlatBedDirection, MattressFoamDensity } from '../../types';

interface PlannerSlatBedProps {
  selectedBox: InternalBoxItem;
  cols: number;
  rows: number;
}

export const PlannerSlatBedSection: React.FC<PlannerSlatBedProps> = ({ selectedBox, cols, rows }) => {
  const { updateInternalBox, internalGrid, setIsOpenPreview } = useSolar();

  if (selectedBox.type !== 'slat_bed') return null;

  const isLateral = (selectedBox.slatBedDirection || 'left') === 'left' || selectedBox.slatBedDirection === 'right';
  const baseDimMm = Math.round(isLateral
    ? selectedBox.colSpan * (internalGrid.widthMm / cols)
    : selectedBox.rowSpan * (internalGrid.lengthMm / rows));
  const extPct = Math.min(100, Math.max(40, selectedBox.slatExtensionPercent ?? 85));
  const extDimMm = Math.round(baseDimMm * (1 + extPct / 100));

  return (
    <>
      {/* Configuração Exclusiva para Cama Retrátil com Ripas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        <div>
          <label style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
            🧭 Direção de Abertura / Deslizamento das Ripas:
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

        {/* Extensão e Botão de Abrir Toda a Cama */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '6px', padding: '8px 10px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
              🛏️ Extensão do Estrado Deslizante:
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Base fixa: {baseDimMm} mm ➔ Aberta: <strong>{extDimMm} mm</strong> (+{extPct}%)
            </div>
          </div>
          <button
            onClick={() => {
              const newExt = (selectedBox.slatExtensionPercent ?? 85) >= 95 ? 40 : 100;
              updateInternalBox(selectedBox.id, { slatExtensionPercent: newExt });
              setIsOpenPreview(true);
            }}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              background: (selectedBox.slatExtensionPercent ?? 85) >= 95 ? '#38bdf8' : 'rgba(56, 189, 248, 0.25)',
              color: (selectedBox.slatExtensionPercent ?? 85) >= 95 ? '#0f172a' : '#38bdf8'
            }}
          >
            {(selectedBox.slatExtensionPercent ?? 85) >= 95 ? '✓ 100% Cama Aberta' : '⚡ Abrir Toda Cama'}
          </button>
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

            {/* Divisão de Partes do Colchão */}
            <div>
              <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                Divisão das Almofadas:
              </label>
              <select
                value={selectedBox.mattressParts ?? 2}
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
                <option value={1}>1 Parte (Colchão Inteiro)</option>
                <option value={2}>2 Partes (Bipartido)</option>
                <option value={3}>3 Partes (Tripartido)</option>
                <option value={4}>4 Partes (Quadripartido)</option>
                <option value={5}>5 Partes (Completo c/ Caixas de Roda)</option>
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
            {extDimMm} mm (+{extPct}%)
          </span>
        </div>
        <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>
          • Estrado de ripas compensadas em leque tipo pente retrátil com pés de apoio articulados ao assoalho.
        </div>
      </div>
    </>
  );
};
