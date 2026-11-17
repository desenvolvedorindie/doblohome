import React, { useState, useMemo } from 'react';
import { AwningConfig } from '../../types/awning';
import { extractAwningHardwareStats, AwningHardwareStats } from '../../utils/awningHardwareUtils';

export interface AwningHardwareTabProps {
  awning: AwningConfig;
  flashToast?: (msg: string) => void;
  setPartsFilter?: (filter: any) => void;
  setViewMode?: (mode: any) => void;
}

export const AwningHardwareTab: React.FC<AwningHardwareTabProps> = ({
  awning,
  flashToast,
  setPartsFilter,
  setViewMode
}) => {
  const [barStandard, setBarStandard] = useState<'6m' | '3m'>('6m');

  const stats: AwningHardwareStats = useMemo(() => {
    return extractAwningHardwareStats(awning);
  }, [awning]);

  const activePlan = barStandard === '6m' ? stats.plan6m : stats.plan3m;

  const copyCuttingPlanToClipboard = () => {
    const lines = [
      `=== PLANO DE CORTE SEPARADO — FERRAGEM DO TOLDO OVERLAND (FIAT DOBLÒ) ===`,
      `Modelo: ${stats.typeLabel} | Lado: ${stats.sideLabel}`,
      `Comprimento Estojo: ${stats.lengthMm} mm | Extensão: ${stats.extensionMm} mm`,
      `Peças de Perfil: ${stats.totalProfilePieces} unidades | Metragem Linear Total: ${stats.totalLinearMeters} m`,
      `Peso Perfis: ${stats.profilesWeightKg} kg | Ferragens: ${stats.fittingsWeightKg} kg | Lona: ${stats.fabricWeightKg} kg | Peso Total: ${stats.totalAwningWeightKg} kg`,
      `Padrão de Barra Selecionado: Barras Comerciais de ${barStandard}`,
      `Total de Barras Necessárias: ${activePlan.length} barra(s) de ${barStandard}`,
      ``,
      `--- APROVEITAMENTO & MAPA DAS BARRAS COMERCIAIS (${barStandard}) ---`,
      ...activePlan.map((b) => {
        const cutsStr = b.segments
          .filter((s) => !s.isWaste)
          .map((s) => `${s.label} (${s.lengthMm}mm)`)
          .join(' + ');
        return `Barra #${b.barIndex} (${b.barLengthMm / 1000}m): [ ${cutsStr} ] | Sobra: ${b.wasteMm}mm | Aproveitamento: ${b.efficiencyPct}%`;
      }),
      ``,
      `--- LISTA DETALHADA DE CORTES DOS PERFIS DE ALUMÍNIO ---`,
      ...stats.profileItems.map(
        (p, i) =>
          `${i + 1}. ${p.label}: ${p.qty}× ${p.lengthMm} mm (Total: ${p.totalLengthM} m • ${p.spec}) - Peso: ${p.totalWeightKg} kg\n   Função: ${p.purpose}`
      ),
      ``,
      `--- LISTA SEPARADA DE FERRAGENS, MANCAIS E ACESSÓRIOS ---`,
      ...stats.fittings.map((f) => `• ${f.label}: ${f.qty} ${f.unit} (${f.spec}) [${f.material}] - ${f.notes}`)
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    flashToast?.(`✅ Plano de corte da ferragem do toldo copiado!`);
  };

  if (!awning.enabled) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div
          style={{
            padding: '28px 16px',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px dashed rgba(245, 158, 11, 0.35)',
            borderRadius: '8px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '32px' }}>⛺</span>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>
            Toldo Retrátil Desativado
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', maxWidth: '380px', lineHeight: 1.5 }}>
            O toldo retrátil está desativado no menu da Doblò (aba Acessórios). Ative-o no menu da Doblò para gerar o plano de corte dos perfis e ferragens.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* 1. Header do Plano de Corte e Ações */}
      <div
        style={{
          padding: '10px 12px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.22))',
          borderRadius: '8px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>⛺</span>
            <div>
              <strong style={{ fontSize: '12px', color: '#fbbf24' }}>
                PLANO DE CORTE DA FERRAGEM — {stats.typeLabel.toUpperCase()}
              </strong>
              <div style={{ fontSize: '10px', color: '#cbd5e1' }}>
                Configuração da Doblò • {stats.sideLabel} • Comprimento: {stats.lengthMm} mm • Extensão: {stats.extensionMm} mm
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className="btn-compact"
              onClick={copyCuttingPlanToClipboard}
              style={{ fontSize: '9.5px', padding: '3px 8px', fontWeight: 700 }}
              title="Copiar relatório e lista de corte da ferragem do toldo"
            >
              📋 Copiar Plano
            </button>
            {setViewMode && setPartsFilter && (
              <button
                className="btn-compact primary"
                onClick={() => {
                  setPartsFilter('awning');
                  setViewMode('bars_lineup');
                }}
                style={{
                  fontSize: '9.5px',
                  padding: '3px 8px',
                  fontWeight: 800,
                  background: 'rgba(245, 158, 11, 0.25)',
                  borderColor: '#f59e0b',
                  color: '#fbbf24'
                }}
                title="Ver os perfis de alumínio do toldo alinhados na bancada 3D no solo"
              >
                📏 Ver no 3D
              </button>
            )}
          </div>
        </div>

        {/* Chips de Resumo Numérico */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '6px',
            marginTop: '2px'
          }}
        >
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
            <span style={{ color: '#94a3b8' }}>Perfis Cortados:</span>{' '}
            <strong style={{ color: '#f8fafc' }}>{stats.totalProfilePieces} peças</strong>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
            <span style={{ color: '#94a3b8' }}>Metragem Linear:</span>{' '}
            <strong style={{ color: '#38bdf8' }}>{stats.totalLinearMeters} m</strong>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
            <span style={{ color: '#94a3b8' }}>Peso Perfis Alum.:</span>{' '}
            <strong style={{ color: '#fbbf24' }}>{stats.profilesWeightKg} kg</strong>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
            <span style={{ color: '#94a3b8' }}>Ferragens & Mancais:</span>{' '}
            <strong style={{ color: '#a78bfa' }}>{stats.fittingsWeightKg} kg</strong>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '5px 8px', borderRadius: '5px', fontSize: '10px' }}>
            <span style={{ color: '#94a3b8' }}>Peso Total Toldo:</span>{' '}
            <strong style={{ color: '#4ade80' }}>{stats.totalAwningWeightKg} kg</strong>
          </div>
        </div>
      </div>

      {/* 2. Seletor de Padrão de Barra & Diagrama Visual das Barras Fatiadas */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: '8px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <strong style={{ fontSize: '11.5px', color: '#f8fafc' }}>
            📐 Diagrama de Corte Linear das Barras de Alumínio:
          </strong>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className={`btn-compact ${barStandard === '6m' ? 'active' : ''}`}
              onClick={() => setBarStandard('6m')}
              style={{
                fontSize: '9.5px',
                padding: '3px 8px',
                fontWeight: 800,
                background: barStandard === '6m' ? 'rgba(245, 158, 11, 0.3)' : undefined,
                borderColor: barStandard === '6m' ? '#f59e0b' : undefined,
                color: barStandard === '6m' ? '#fbbf24' : undefined
              }}
            >
              📦 Barra 6 Metros (Padrão Indústria)
            </button>
            <button
              className={`btn-compact ${barStandard === '3m' ? 'active' : ''}`}
              onClick={() => setBarStandard('3m')}
              style={{
                fontSize: '9.5px',
                padding: '3px 8px',
                fontWeight: 800,
                background: barStandard === '3m' ? 'rgba(245, 158, 11, 0.3)' : undefined,
                borderColor: barStandard === '3m' ? '#f59e0b' : undefined,
                color: barStandard === '3m' ? '#fbbf24' : undefined
              }}
            >
              📦 Barra 3 Metros (Varejo / Fácil Transporte)
            </button>
          </div>
        </div>

        {/* Barras fatiadas no corte */}
        {activePlan.map((bar) => (
          <div
            key={bar.barIndex}
            style={{
              background: 'rgba(2, 6, 23, 0.75)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '6px',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px' }}>
              <span style={{ fontWeight: 800, color: '#fbbf24' }}>
                Barra #{bar.barIndex} ({bar.barLengthMm / 1000} m)
              </span>
              <span style={{ color: '#cbd5e1', fontSize: '10px' }}>
                Cortes: <strong>{bar.usedMm} mm</strong> • Sobra: <strong style={{ color: '#94a3b8' }}>{bar.wasteMm} mm</strong> • Aproveitamento:{' '}
                <strong style={{ color: bar.efficiencyPct >= 80 ? '#4ade80' : '#fbbf24' }}>{bar.efficiencyPct}%</strong>
              </span>
            </div>

            {/* Barra Gráfica de Cortes */}
            <div
              style={{
                height: '32px',
                width: '100%',
                background: '#0b1120',
                borderRadius: '6px',
                overflow: 'hidden',
                display: 'flex',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {bar.segments.map((seg, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    width: `${seg.pct}%`,
                    height: '100%',
                    background: seg.isWaste ? 'repeating-linear-gradient(45deg, rgba(71,85,105,0.4), rgba(71,85,105,0.4) 6px, rgba(51,65,85,0.5) 6px, rgba(51,65,85,0.5) 12px)' : seg.color,
                    borderRight: sIdx < bar.segments.length - 1 ? '1.5px solid #0f172a' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  title={`${seg.label}: ${seg.lengthMm} mm (${seg.pct}%)`}
                >
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      color: seg.isWaste ? '#94a3b8' : '#0f172a',
                      textShadow: seg.isWaste ? 'none' : '0 1px 2px rgba(255,255,255,0.4)',
                      letterSpacing: '-0.2px'
                    }}
                  >
                    {seg.lengthMm} mm
                  </span>
                </div>
              ))}
            </div>

            {/* Legenda dos cortes desta barra */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '9.5px', color: '#cbd5e1' }}>
              {bar.segments.map((seg, sIdx) => (
                <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '2px',
                      background: seg.color,
                      display: 'inline-block'
                    }}
                  />
                  <span>
                    {seg.label} (<strong>{seg.lengthMm} mm</strong>)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Tabela Detalhada de Cortes dos Perfis de Alumínio */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: '8px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '11.5px', color: '#f8fafc' }}>
            📋 Lista Executiva de Cortes dos Perfis de Alumínio:
          </strong>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            Total: {stats.profileItems.length} tipos de perfis • {stats.totalProfilePieces} cortes no total
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.25)', color: '#94a3b8' }}>
                <th style={{ padding: '6px 8px' }}>Peça / Função</th>
                <th style={{ padding: '6px 8px' }}>Perfil / Bitola</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Qtd</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Comprimento</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total (m)</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Peso Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.profileItems.map((p) => (
                <tr key={p.key} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '6px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '9px',
                          height: '9px',
                          borderRadius: '2px',
                          background: p.color,
                          display: 'inline-block',
                          flexShrink: 0
                        }}
                      />
                      <div>
                        <strong style={{ color: '#f8fafc' }}>{p.label}</strong>
                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>{p.purpose}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '6px 8px', color: '#cbd5e1' }}>{p.spec}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800, color: '#fbbf24' }}>
                    {p.qty} un
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>
                    {p.lengthMm} mm
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#cbd5e1' }}>{p.totalLengthM} m</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#4ade80' }}>{p.totalWeightKg} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Tabela de Ferragens, Mancais, Buchas e Parafusos (Separada) */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: '8px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '11.5px', color: '#a78bfa' }}>
            🔩 Ferragens, Mancais, Suportes L e Parafusos (Lista Separada):
          </strong>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            {stats.fittings.length} itens de fixação e articulação
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.25)', color: '#94a3b8' }}>
                <th style={{ padding: '6px 8px' }}>Componente</th>
                <th style={{ padding: '6px 8px' }}>Especificação Técnica</th>
                <th style={{ padding: '6px 8px' }}>Material</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Qtd</th>
                <th style={{ padding: '6px 8px' }}>Finalidade / Aplicação</th>
              </tr>
            </thead>
            <tbody>
              {stats.fittings.map((f) => (
                <tr key={f.key} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#f8fafc' }}>{f.label}</td>
                  <td style={{ padding: '6px 8px', color: '#cbd5e1' }}>{f.spec}</td>
                  <td style={{ padding: '6px 8px', color: '#38bdf8' }}>{f.material}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800, color: '#fbbf24' }}>
                    {f.qty} {f.unit}
                  </td>
                  <td style={{ padding: '6px 8px', color: '#94a3b8', fontSize: '9px' }}>{f.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
