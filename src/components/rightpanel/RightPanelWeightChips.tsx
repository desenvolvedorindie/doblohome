import React from 'react';
import { useSolar } from '../../context/SolarContext';

interface RightPanelWeightChipsProps {
  rackWeightStats: any;
  openModal: (modal: any) => void;
  showWeightDetails: boolean;
  setShowWeightDetails: (show: boolean | ((prev: boolean) => boolean)) => void;
  rackHeightStats: any;
}

export const RightPanelWeightChips: React.FC<RightPanelWeightChipsProps> = ({
  rackWeightStats,
  openModal,
  showWeightDetails,
  setShowWeightDetails,
  rackHeightStats,
}) => {
  const { waterTank, awning, cargoBox, stackLevels } = useSolar();

  return (
    <>
      {/* Grid de Chips com a Composição Detalhada */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '5px',
          marginTop: '1px'
        }}
      >
        {/* 1. Ferro / Metalon ou Alumínio */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '6px',
            padding: '5px 7px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px'
          }}
        >
          <span style={{ fontSize: '9px', color: '#94a3b8' }}>
            {rackWeightStats.isSteel ? `🔩 Metalon Aço (${rackWeightStats.t40.toFixed(1)}mm) + Trilhos:` : rackWeightStats.isAluTube ? `🔲 Metalon Alumínio (${rackWeightStats.t40.toFixed(1)}mm) + Trilhos:` : '🔩 Alumínio T-Slot + Trilhos:'}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
            {rackWeightStats.structureWeight} kg
          </span>
        </div>

        {/* 2. Placas Solares */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '6px',
            padding: '5px 7px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px'
          }}
        >
          <span style={{ fontSize: '9px', color: '#94a3b8' }}>
            ☀️ {rackWeightStats.panelCount}× Painéis Flexíveis:
          </span>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
            {rackWeightStats.panelsWeight} kg
          </span>
        </div>

        {/* 3. Sistema de Água */}
        <div
          style={{
            background: waterTank.enabled ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${waterTank.enabled ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)'}`,
            borderRadius: '6px',
            padding: '5px 7px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px'
          }}
        >
          <span style={{ fontSize: '9px', color: waterTank.enabled ? '#7dd3fc' : '#64748b' }}>
            💧 Água ({waterTank.enabled ? (rackWeightStats.waterWeight > 0 ? `Cheio ${rackWeightStats.waterLiters}L` : 'Vazio 0L') : 'Sem caixa'}):
          </span>
          <span style={{ fontSize: '11px', fontWeight: 800, color: waterTank.enabled ? '#38bdf8' : '#64748b', fontFamily: 'var(--font-mono)' }}>
            {rackWeightStats.waterSystemWeight} kg
          </span>
        </div>

        {/* 4. Baú de Teto Motobul */}
        <div
          style={{
            background: cargoBox.enabled ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${cargoBox.enabled ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.05)'}`,
            borderRadius: '6px',
            padding: '5px 7px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px'
          }}
        >
          <span style={{ fontSize: '9px', color: cargoBox.enabled ? '#fcd34d' : '#64748b' }}>
            🧰 Baú de Teto Motobul:
          </span>
          <span style={{ fontSize: '11px', fontWeight: 800, color: cargoBox.enabled ? '#fbbf24' : '#64748b', fontFamily: 'var(--font-mono)' }}>
            {rackWeightStats.cargoBoxWeight} kg
          </span>
        </div>

        {/* 5. Toldo Overland */}
        <div
          style={{
            background: awning.enabled ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${awning.enabled ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.05)'}`,
            borderRadius: '6px',
            padding: '5px 7px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px'
          }}
        >
          <span style={{ fontSize: '9px', color: awning.enabled ? '#86efac' : '#64748b' }}>
            ⛺ Toldo ({awning.enabled ? (awning.type === 'batwing_270' ? 'Asa 270°' : 'Traseiro') : 'Sem toldo'}):
          </span>
          <span style={{ fontSize: '11px', fontWeight: 800, color: awning.enabled ? '#4ade80' : '#64748b', fontFamily: 'var(--font-mono)' }}>
            {rackWeightStats.awningWeight} kg
          </span>
        </div>

        {/* 6. Ferragens & Pistões a Gás */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '6px',
            padding: '5px 7px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px'
          }}
        >
          <span style={{ fontSize: '9px', color: '#94a3b8' }}>
            🔩 Pistões & Parafusos Inox:
          </span>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
            {rackWeightStats.hardwareWeight} kg
          </span>
        </div>
      </div>

      {/* Acordeão / Botão de Detalhes Técnicos */}
      <div style={{ marginTop: '8px' }}>
        <button
          onClick={() => setShowWeightDetails(prev => !prev)}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            padding: '5px 8px',
            color: '#94a3b8',
            fontSize: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease'
          }}
        >
          <span>📋 Detalhamento Técnico & Gabarito CONTRAN</span>
          <span style={{ fontSize: '9px' }}>{showWeightDetails ? '▲ Ocultar' : '▼ Expandir'}</span>
        </button>

        {showWeightDetails && (
          <div
            style={{
              marginTop: '6px',
              padding: '8px 10px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              fontSize: '10px',
              color: '#cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              lineHeight: 1.45
            }}
          >
            <div>
              <strong style={{ color: '#f8fafc' }}>⚖️ Resumo Estrutural:</strong> Peso seco sem água:{' '}
              <strong style={{ color: '#38bdf8' }}>{rackWeightStats.totalDry} kg</strong> • Comprimento: 2200 mm • Largura: 1400 mm • Altura do rack:{' '}
              <strong style={{ color: '#f59e0b' }}>{rackHeightStats.totalRackHeightCm} cm</strong>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px' }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '2px' }}>
                📏 Composição da Altura Total ({rackHeightStats.totalRackHeightCm} cm):
              </div>
              <ul style={{ margin: '0 0 0 16px', padding: 0, fontSize: '9.5px', color: '#94a3b8' }}>
                <li>Subchassi base / travessas: {rackHeightStats.baseProfileMm} mm (4.0 cm)</li>
                {cargoBox.enabled && (
                  <li>
                    Baú Motobul: {rackHeightStats.cargoBoxH_Mm} mm ({((rackHeightStats.cargoBoxH_Mm)/10).toFixed(1)} cm) + folga {rackHeightStats.clearanceHingesMm} mm
                    {rackHeightStats.verticalLiftMm > 0 ? ` + elevação telescópica ${rackHeightStats.verticalLiftMm} mm` : ''}
                  </li>
                )}
                <li>Superestrutura de gavetas móveis: {rackHeightStats.solarTraysH_Mm} mm ({(rackHeightStats.solarTraysH_Mm / 10).toFixed(1)} cm)</li>
                <li>Espessura placas solares: {rackHeightStats.panelThicknessMm} mm</li>
              </ul>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px' }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '2px' }}>
                📜 Legislação CONTRAN (Resolução 955/2022, Art. 5º):
              </div>
              <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                {rackHeightStats.isAboveLimit ? (
                  <span style={{ color: '#f87171' }}>
                    ⚠️ ATENÇÃO: Altura excede o limite legal em +{rackHeightStats.diffCm} cm (+{rackHeightStats.pctAbove}%). Em caso de fiscalização rodoviária (PRF), o limite de 50 cm para bagageiros/cargas no teto é verificado.
                  </span>
                ) : (
                  <span style={{ color: '#4ade80' }}>
                    ✅ 100% REGULAR: O conjunto está dentro do teto de 50 cm ({rackHeightStats.pctOfLimit}% utilizado). Aprovado para tráfego em rodovias federais.
                  </span>
                )}
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '3px' }}>
                🚗 Gabarito total (veículo + teto): <strong>{rackHeightStats.totalVehicleHeightM} m</strong> (Doblò ~1.84 m + {rackHeightStats.totalRackHeightM} m).
              </div>
            </div>

            {waterTank.enabled && (
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px', fontSize: '9.5px', color: '#94a3b8' }}>
                💧 <strong>Dica de Peso Dinâmico:</strong> Viaje com a caixa d'água vazia ({rackWeightStats.totalDry} kg) e abasteça os +{rackWeightStats.waterLiters}L (+{rackWeightStats.waterLiters} kg) no destino ou camping para economizar combustível e manter o centro de gravidade baixo.
              </div>
            )}

            {rackWeightStats.isSteel && (
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px', fontSize: '9.5px', color: '#94a3b8' }}>
                💡 Mudando a estrutura para <strong>Metalon Alumínio</strong> você economiza ~{(rackWeightStats.baseWeight + rackWeightStats.traysWeight - (8.5 + stackLevels * 1.2)).toFixed(1)} kg no teto!
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
